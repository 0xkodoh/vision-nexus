"""AWS IoT Greengrass v2 Core & AWS Lambda Event-Driven Webhook Simulator.

Simulates:
1. Edge Greengrass v2 component lifecycle, local edge buffer, and MQTT telemetry dispatch.
2. S3 ObjectCreated event triggers that execute a simulated AWS Lambda defect handler.
3. Downstream alerting dispatch (SNS / webhook notifications with defect telemetry and S3 URLs).
"""
import time
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from pydantic import BaseModel


class LambdaAlertRecord(BaseModel):
    execution_id: str
    function_name: str
    event_type: str
    timestamp: str
    severity: str  # "CRITICAL", "WARNING", "INFO"
    defect_count: int
    defect_types: List[str]
    s3_bucket: str
    s3_key: str
    s3_url: str
    sns_alert_dispatched: bool
    sns_topic_arn: str
    notification_summary: str
    latency_ms: float
    edge_device_id: str


class GreengrassCoreSimulator:
    """Simulates an AWS IoT Greengrass v2 Core Edge Runtime."""

    def __init__(
        self,
        thing_name: str = "Industrial-Edge-OpenCV-Inspection-Unit-01",
        component_name: str = "com.opencv.defect.detector",
        component_version: str = "1.0.0",
        region: str = "us-east-1",
        sns_topic_arn: str = "arn:aws:sns:us-east-1:123456789012:industrial-defect-alerts"
    ):
        self.thing_name = thing_name
        self.component_name = component_name
        self.component_version = component_version
        self.region = region
        self.sns_topic_arn = sns_topic_arn
        
        self.deployment_id = f"dep-{uuid.uuid4().hex[:8]}"
        self.start_time = time.time()
        self.processed_frames_count = 0
        self.defects_flagged_count = 0
        self.edge_buffer: List[Dict[str, Any]] = []
        self.lambda_executions: List[LambdaAlertRecord] = []
        self.max_history = 50

    def get_core_status(self) -> Dict[str, Any]:
        """Returns the current simulated Greengrass Core edge status."""
        uptime_seconds = round(time.time() - self.start_time, 1)
        return {
            "status": "HEALTHY",
            "greengrass_version": "2.12.0",
            "thing_name": self.thing_name,
            "component_name": self.component_name,
            "component_version": self.component_version,
            "deployment_id": self.deployment_id,
            "aws_region": self.region,
            "uptime_seconds": uptime_seconds,
            "metrics": {
                "total_frames_evaluated": self.processed_frames_count,
                "defects_flagged": self.defects_flagged_count,
                "edge_buffer_size": len(self.edge_buffer),
                "lambda_alerts_triggered": len(self.lambda_executions)
            },
            "mqtt_topics": {
                "telemetry": f"factory/line1/{self.thing_name}/telemetry",
                "defects": f"factory/line1/{self.thing_name}/defects",
                "alerts": f"factory/line1/{self.thing_name}/alerts"
            }
        }

    def record_frame_evaluation(self, has_defect: bool, defect_data: Optional[Dict[str, Any]] = None):
        """Records edge evaluation telemetry into the Greengrass buffer."""
        self.processed_frames_count += 1
        if has_defect:
            self.defects_flagged_count += 1
            if defect_data:
                self.edge_buffer.append({
                    "timestamp": time.time(),
                    "data": defect_data
                })
                if len(self.edge_buffer) > self.max_history:
                    self.edge_buffer.pop(0)

    def trigger_s3_lambda_webhook(
        self,
        s3_bucket: str,
        s3_key: str,
        s3_url: str,
        defect_count: int,
        defect_details: List[Dict[str, Any]],
        cv_latency_ms: float
    ) -> LambdaAlertRecord:
        """Simulates an AWS S3 Event Notification triggering an AWS Lambda Alerting Function.
        
        Evaluates defect severity, generates simulated SNS payload, and logs the execution.
        """
        execution_start = time.perf_counter()
        execution_id = f"lam-{uuid.uuid4().hex[:12]}"
        now_iso = datetime.now(timezone.utc).isoformat()

        # Extract defect types
        defect_types = list({d.get("type", "unknown") for d in defect_details}) if defect_details else ["unspecified_anomaly"]

        # Determine Severity Level
        if defect_count >= 2 or any("crack" in t or "structural" in t for t in defect_types):
            severity = "CRITICAL"
        elif defect_count == 1:
            severity = "WARNING"
        else:
            severity = "INFO"

        summary = (
            f"[{severity} ALERT] OpenCV Edge Inspector '{self.thing_name}' detected {defect_count} defect(s) "
            f"({', '.join(defect_types)}). Frame uploaded to S3: s3://{s3_bucket}/{s3_key}"
        )

        lambda_latency_ms = round((time.perf_counter() - execution_start) * 1000.0 + 4.5, 2)  # realistic overhead

        record = LambdaAlertRecord(
            execution_id=execution_id,
            function_name="ProcessDefectAlertLambda",
            event_type="aws:s3:ObjectCreated:Put",
            timestamp=now_iso,
            severity=severity,
            defect_count=defect_count,
            defect_types=defect_types,
            s3_bucket=s3_bucket,
            s3_key=s3_key,
            s3_url=s3_url,
            sns_alert_dispatched=True,
            sns_topic_arn=self.sns_topic_arn,
            notification_summary=summary,
            latency_ms=lambda_latency_ms,
            edge_device_id=self.thing_name
        )

        self.lambda_executions.insert(0, record)
        if len(self.lambda_executions) > self.max_history:
            self.lambda_executions.pop()

        return record

    def get_alert_history(self, limit: int = 20) -> List[Dict[str, Any]]:
        """Returns the most recent Lambda alert executions."""
        return [r.model_dump() for r in self.lambda_executions[:limit]]
