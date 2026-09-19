"""FastAPI service entrypoint for the OpenCV Defect Detection Pipeline & AWS Cloud."""
import os
import uuid
import base64
from datetime import datetime
from typing import Optional, Dict, Any, List

import cv2
import numpy as np
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from src.pipelines.base_pipeline import DefectDetectionPipeline
from src.cloud.aws_manager import AWSManager
from src.benchmark import PipelineBenchmarkRunner

app = FastAPI(
    title="OpenCV AI Competition - Industrial Defect Detection Engine",
    description="High-performance native OpenCV 5 computer vision pipeline with real-time AWS cloud synchronization.",
    version="1.0.0"
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize CV Pipeline, AWS Manager, and Benchmark instances
pipeline = DefectDetectionPipeline()
aws_manager = AWSManager()
benchmark_runner = PipelineBenchmarkRunner(warmup_iterations=5)

class HealthResponse(BaseModel):
    status: str
    opencv_version: str
    aws_region: str
    s3_bucket: str

class DefectDetail(BaseModel):
    id: int
    type: str
    bbox: List[int]
    area: float
    aspect_ratio: float

class ProcessFrameResponse(BaseModel):
    has_defect: bool
    defect_count: int
    defects: List[DefectDetail]
    latency_ms: float
    frame_dimensions: Dict[str, int]
    timestamp: float
    annotated_image_base64: str
    s3_upload: Optional[Dict[str, Any]] = None

class BenchmarkRequest(BaseModel):
    iterations: int = 40
    resolution: Optional[str] = None  # None for full suite, or "480p", "720p", "1080p"

@app.get("/health", response_model=HealthResponse)
def health_check():
    """Health check validating OpenCV runtime and AWS environment configuration."""
    return HealthResponse(
        status="healthy",
        opencv_version=cv2.__version__,
        aws_region=aws_manager.region_name,
        s3_bucket=aws_manager.bucket_name
    )

@app.get("/greengrass/status")
def greengrass_status():
    """Returns simulated AWS IoT Greengrass v2 Core edge device telemetry."""
    return aws_manager.greengrass.get_core_status()

@app.get("/alerts/history")
def alert_history(limit: int = 20):
    """Returns recent AWS Lambda / SNS alert records triggered by S3 defect uploads."""
    return {
        "count": len(aws_manager.greengrass.lambda_executions),
        "alerts": aws_manager.greengrass.get_alert_history(limit=limit)
    }

@app.get("/benchmark")
@app.post("/benchmark")
def run_benchmark(request: Optional[BenchmarkRequest] = None):
    """Benchmarks OpenCV 5 pipeline throughput (FPS) and latency across 480p, 720p, 1080p."""
    req = request or BenchmarkRequest()
    if req.resolution and req.resolution in PipelineBenchmarkRunner.STANDARD_RESOLUTIONS:
        w, h = PipelineBenchmarkRunner.STANDARD_RESOLUTIONS[req.resolution]
        res = benchmark_runner.run_resolution_benchmark(
            resolution_name=req.resolution,
            width=w,
            height=h,
            iterations=req.iterations,
            test_defective=True
        )
        return {
            "timestamp": datetime.utcnow().timestamp(),
            "opencv_version": cv2.__version__,
            "benchmark_iterations": req.iterations,
            "results": {req.resolution: res}
        }
    else:
        return benchmark_runner.run_full_suite(iterations=req.iterations)

@app.post("/set-reference")
async def set_reference_image(file: UploadFile = File(...)):
    """Uploads and establishes a 'golden standard' reference image for template matching/subtraction."""
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    if img is None:
        raise HTTPException(status_code=400, detail="Invalid image file supplied.")
    
    pipeline.set_reference_image(img)
    return {
        "status": "success",
        "message": "Golden standard reference image set successfully.",
        "dimensions": {"width": img.shape[1], "height": img.shape[0]}
    }

@app.post("/process-frame", response_model=ProcessFrameResponse)
async def process_frame(
    file: UploadFile = File(...),
    sync_to_s3: bool = Form(True)
):
    """Processes an industrial inspection frame using native OpenCV 5.
    
    If defects are detected and sync_to_s3 is true, automatically uploads the flagged frame
    and metadata to Amazon S3, triggering downstream simulated AWS Lambda / SNS alert webhooks.
    """
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if frame is None:
        raise HTTPException(status_code=400, detail="Failed to decode image frame.")

    # 1. Execute OpenCV computer vision pipeline
    annotated_frame, metrics = pipeline.process_frame(frame)

    # 2. Base64 encode annotated frame for immediate frontend display
    _, buffer = cv2.imencode(".jpg", annotated_frame)
    base64_image = base64.b64encode(buffer).decode("utf-8")

    # 3. AWS S3 Upload & Lambda Webhook Trigger if defect flagged
    s3_result = None
    if metrics["has_defect"] and sync_to_s3:
        timestamp_str = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        object_key = f"defects/{datetime.utcnow().strftime('%Y-%m-%d')}/defect_{timestamp_str}_{uuid.uuid4().hex[:6]}.jpg"
        
        s3_result = aws_manager.upload_defective_frame(
            frame=annotated_frame,
            object_key=object_key,
            metadata={
                "defect_count": metrics["defect_count"],
                "latency_ms": metrics["latency_ms"],
                "opencv_version": cv2.__version__
            },
            defect_details=metrics["defects"]
        )
    else:
        # Record passing inspection in Greengrass edge metrics
        aws_manager.greengrass.record_frame_evaluation(has_defect=False)

    return ProcessFrameResponse(
        has_defect=metrics["has_defect"],
        defect_count=metrics["defect_count"],
        defects=metrics["defects"],
        latency_ms=metrics["latency_ms"],
        frame_dimensions=metrics["frame_dimensions"],
        timestamp=metrics["timestamp"],
        annotated_image_base64=f"data:image/jpeg;base64,{base64_image}",
        s3_upload=s3_result
    )
