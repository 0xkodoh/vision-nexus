"""AWS Cloud Service Integration Helpers for Defect Telemetry & Artifact Storage."""
import os
import io
import json
import boto3
from botocore.exceptions import ClientError, NoCredentialsError
from typing import Optional, Dict, Any, Union, List
import numpy as np
import cv2

from src.cloud.greengrass_simulator import GreengrassCoreSimulator, LambdaAlertRecord

class AWSManager:
    def __init__(
        self, 
        region_name: Optional[str] = None,
        bucket_name: Optional[str] = None
    ):
        """Initializes the AWS cloud manager using environment variables or explicit parameters."""
        self.region_name = region_name or os.getenv("AWS_REGION", "us-east-1")
        self.bucket_name = bucket_name or os.getenv("AWS_S3_BUCKET_NAME", "opencv-ai-competition-defects")
        self._s3_client = None
        self.greengrass = GreengrassCoreSimulator(region=self.region_name)

    @property
    def s3(self):
        """Lazy-loaded Boto3 S3 client using standard credentials resolution."""
        if self._s3_client is None:
            self._s3_client = boto3.client(
                "s3", 
                region_name=self.region_name,
                aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID") or None,
                aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY") or None,
                aws_session_token=os.getenv("AWS_SESSION_TOKEN") or None
            )
        return self._s3_client

    def upload_defective_frame(
        self,
        frame: np.ndarray,
        object_key: str,
        metadata: Optional[Dict[str, Any]] = None,
        defect_details: Optional[List[Dict[str, Any]]] = None,
        bucket: Optional[str] = None
    ) -> Dict[str, Any]:
        """Encodes and uploads an annotated/raw OpenCV frame directly to S3 with defect metadata,
        and triggers downstream simulated AWS Lambda / SNS alert webhooks.

        Args:
            frame: np.ndarray BGR image matrix
            object_key: S3 key/path (e.g., 'defects/2026-08-31/defect_123.jpg')
            metadata: Optional dictionary of defect coordinates, counts, and pipeline metrics.
            defect_details: List of detected defect dictionaries
            bucket: Target bucket name (falls back to self.bucket_name)

        Returns:
            dict containing success flag, s3_url, and details or error message, plus lambda_alert.
        """
        target_bucket = bucket or self.bucket_name

        # 1. Record frame evaluation in Greengrass Edge Core buffer
        defect_count = int(metadata.get("defect_count", 1)) if metadata else 1
        cv_latency_ms = float(metadata.get("latency_ms", 0.0)) if metadata else 0.0
        self.greengrass.record_frame_evaluation(has_defect=True, defect_data=metadata)

        # 2. Encode OpenCV BGR numpy frame to JPEG buffer in-memory
        success, encoded_img = cv2.imencode(".jpg", frame, [int(cv2.IMWRITE_JPEG_QUALITY), 92])
        if not success:
            return {"success": False, "error": "Failed to encode frame with cv2.imencode"}

        image_bytes = io.BytesIO(encoded_img.tobytes())

        # Clean metadata dictionary to ensure valid S3 header values (strings only)
        s3_metadata = {}
        if metadata:
            for k, v in metadata.items():
                if isinstance(v, (dict, list)):
                    s3_metadata[k] = json.dumps(v)
                else:
                    s3_metadata[k] = str(v)

        s3_url = f"https://{target_bucket}.s3.{self.region_name}.amazonaws.com/{object_key}"
        upload_success = True
        upload_error = None

        try:
            self.s3.upload_fileobj(
                Fileobj=image_bytes,
                Bucket=target_bucket,
                Key=object_key,
                ExtraArgs={
                    "ContentType": "image/jpeg",
                    "Metadata": s3_metadata
                }
            )
        except (ClientError, NoCredentialsError) as e:
            upload_success = False
            upload_error = str(e)

        # 3. Simulate S3 Event Notification -> AWS Lambda Trigger -> SNS / Webhook alerting
        lambda_record = self.greengrass.trigger_s3_lambda_webhook(
            s3_bucket=target_bucket,
            s3_key=object_key,
            s3_url=s3_url,
            defect_count=defect_count,
            defect_details=defect_details or [],
            cv_latency_ms=cv_latency_ms
        )

        return {
            "success": upload_success,
            "error": upload_error,
            "bucket": target_bucket,
            "key": object_key,
            "s3_url": s3_url,
            "lambda_alert": lambda_record.model_dump()
        }

    def upload_artifact(self, file_path: str, bucket: Optional[str] = None, object_name: Optional[str] = None) -> bool:
        """Upload a local file path to AWS S3."""
        target_bucket = bucket or self.bucket_name
        target_key = object_name or os.path.basename(file_path)
        try:
            self.s3.upload_file(file_path, target_bucket, target_key)
            return True
        except (ClientError, NoCredentialsError) as e:
            print(f"S3 Upload Error: {e}")
            return False

    def download_artifact(self, object_name: str, target_path: str, bucket: Optional[str] = None) -> bool:
        """Download an input asset from AWS S3."""
        target_bucket = bucket or self.bucket_name
        try:
            self.s3.download_file(target_bucket, object_name, target_path)
            return True
        except (ClientError, NoCredentialsError) as e:
            print(f"S3 Download Error: {e}")
            return False
