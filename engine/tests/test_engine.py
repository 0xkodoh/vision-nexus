import os
import sys
import pytest
import numpy as np
import cv2
from fastapi.testclient import TestClient

# Ensure engine directory is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.pipelines.base_pipeline import DefectDetectionPipeline
from src.cloud.aws_manager import AWSManager
from src.cloud.greengrass_simulator import GreengrassCoreSimulator
from src.benchmark import PipelineBenchmarkRunner, generate_benchmark_frame
from src.main import app

def test_pipeline_pass_on_clean_image():
    pipeline = DefectDetectionPipeline()
    # Create clean synthetic image
    clean_frame = np.full((300, 300, 3), 200, dtype=np.uint8)
    pipeline.set_reference_image(clean_frame)
    
    annotated, metrics = pipeline.process_frame(clean_frame)
    assert not metrics["has_defect"]
    assert metrics["defect_count"] == 0
    assert "latency_ms" in metrics

def test_pipeline_detects_scratch_and_crack():
    pipeline = DefectDetectionPipeline()
    clean_frame = np.full((300, 300, 3), 200, dtype=np.uint8)
    pipeline.set_reference_image(clean_frame)
    
    # Create frame with artificial scratch/crack (black line defect)
    defective_frame = clean_frame.copy()
    cv2.line(defective_frame, (50, 50), (150, 60), (0, 0, 0), thickness=4)
    
    annotated, metrics = pipeline.process_frame(defective_frame)
    assert metrics["has_defect"]
    assert metrics["defect_count"] >= 1
    assert len(metrics["defects"]) >= 1
    assert len(metrics["defects"][0]["bbox"]) == 4

def test_aws_manager_init_and_key_handling():
    manager = AWSManager(region_name="us-west-2", bucket_name="test-defect-bucket")
    assert manager.region_name == "us-west-2"
    assert manager.bucket_name == "test-defect-bucket"
    assert manager.greengrass is not None

def test_greengrass_core_simulator():
    simulator = GreengrassCoreSimulator(
        thing_name="Test-Edge-Unit-01",
        region="us-west-2"
    )
    status = simulator.get_core_status()
    assert status["status"] == "HEALTHY"
    assert status["thing_name"] == "Test-Edge-Unit-01"
    assert "mqtt_topics" in status
    assert "telemetry" in status["mqtt_topics"]

    # Record frame evaluations
    simulator.record_frame_evaluation(has_defect=False)
    simulator.record_frame_evaluation(has_defect=True, defect_data={"count": 1})
    assert simulator.processed_frames_count == 2
    assert simulator.defects_flagged_count == 1
    assert len(simulator.edge_buffer) == 1

def test_lambda_webhook_alert_trigger():
    simulator = GreengrassCoreSimulator(
        thing_name="Test-Edge-Unit-01",
        region="us-east-1"
    )
    alert = simulator.trigger_s3_lambda_webhook(
        s3_bucket="test-bucket",
        s3_key="defects/test_defect.jpg",
        s3_url="https://test-bucket.s3.us-east-1.amazonaws.com/defects/test_defect.jpg",
        defect_count=2,
        defect_details=[
            {"type": "scratch_or_crack", "area": 350.0},
            {"type": "pinhole_or_void", "area": 40.0}
        ],
        cv_latency_ms=6.8
    )

    assert alert.execution_id.startswith("lam-")
    assert alert.severity == "CRITICAL"
    assert alert.defect_count == 2
    assert "scratch_or_crack" in alert.defect_types
    assert alert.sns_alert_dispatched is True
    assert "test-bucket" in alert.notification_summary
    assert len(simulator.lambda_executions) == 1

def test_benchmark_runner_resolutions():
    runner = PipelineBenchmarkRunner(warmup_iterations=2)
    # Benchmark 480p
    res_480p = runner.run_resolution_benchmark("480p", 640, 480, iterations=5, test_defective=True)
    assert res_480p["resolution"] == "480p"
    assert res_480p["fps"] > 0
    assert res_480p["mean_latency_ms"] > 0
    assert res_480p["throughput_mb_s"] > 0
    assert "p95_latency_ms" in res_480p

    # Benchmark full suite
    suite = runner.run_full_suite(iterations=3)
    assert "480p" in suite["results"]
    assert "720p" in suite["results"]
    assert "1080p" in suite["results"]

def test_fastapi_endpoints():
    client = TestClient(app)
    
    # 1. Health endpoint
    health_resp = client.get("/health")
    assert health_resp.status_code == 200
    assert health_resp.json()["status"] == "healthy"

    # 2. Greengrass status endpoint
    gg_resp = client.get("/greengrass/status")
    assert gg_resp.status_code == 200
    assert gg_resp.json()["status"] == "HEALTHY"

    # 3. Benchmark endpoint
    bench_resp = client.post("/benchmark", json={"iterations": 2, "resolution": "480p"})
    assert bench_resp.status_code == 200
    bench_data = bench_resp.json()
    assert "results" in bench_data
    assert "480p" in bench_data["results"]

    # 4. Alerts history endpoint
    alerts_resp = client.get("/alerts/history")
    assert alerts_resp.status_code == 200
    assert "alerts" in alerts_resp.json()

    # 5. Process frame endpoint
    ref, test_frame = generate_benchmark_frame(320, 240, with_defect=True)
    _, encoded = cv2.imencode(".jpg", test_frame)
    files = {"file": ("test.jpg", encoded.tobytes(), "image/jpeg")}
    data = {"sync_to_s3": "true"}
    proc_resp = client.post("/process-frame", files=files, data=data)
    assert proc_resp.status_code == 200
    proc_data = proc_resp.json()
    assert proc_data["has_defect"] is True
    assert proc_data["defect_count"] >= 1
    assert "annotated_image_base64" in proc_data
    assert proc_data["s3_upload"] is not None
    assert "lambda_alert" in proc_data["s3_upload"]

