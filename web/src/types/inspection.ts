export interface DefectDetail {
  id: number;
  type: "scratch_or_crack" | "pinhole_or_void" | "structural_deformation" | string;
  bbox: [number, number, number, number]; // [x, y, w, h]
  area: number;
  aspect_ratio: number;
}

export interface S3UploadResult {
  success: boolean;
  bucket?: string;
  key?: string;
  s3_url?: string;
  error?: string;
}

export interface ProcessFrameResponse {
  has_defect: boolean;
  defect_count: number;
  defects: DefectDetail[];
  latency_ms: number;
  frame_dimensions: {
    width: number;
    height: number;
  };
  timestamp: number;
  annotated_image_base64: string;
  s3_upload?: S3UploadResult | null;
}

export interface EngineHealth {
  status: "healthy" | "unreachable" | "connecting";
  opencv_version: string;
  aws_region: string;
  s3_bucket: string;
}

export interface InspectionLogItem {
  id: string;
  frameNumber: number;
  timestamp: string;
  hasDefect: boolean;
  defectTypes: string[];
  latencyMs: number;
  s3Uploaded: boolean;
  s3Key?: string;
}

export interface ProductionYieldMetrics {
  totalProcessed: number;
  totalPassed: number;
  totalDefects: number;
  yieldRate: number;
  defectTypeCounts: {
    scratch_or_crack: number;
    pinhole_or_void: number;
    structural_deformation: number;
  };
  avgLatencyMs: number;
  minLatencyMs: number;
  maxLatencyMs: number;
}

export interface ResolutionBenchmark {
  resolution: string;
  dimensions: {
    width: number;
    height: number;
  };
  iterations: number;
  mean_latency_ms: number;
  median_latency_ms: number;
  min_latency_ms: number;
  max_latency_ms: number;
  p95_latency_ms: number;
  p99_latency_ms: number;
  fps: number;
  throughput_mb_s: number;
  opencv_version: string;
}

export interface BenchmarkSuiteResponse {
  timestamp: number;
  opencv_version: string;
  benchmark_iterations: number;
  results: Record<string, ResolutionBenchmark>;
}

export interface GreengrassStatus {
  status: string;
  greengrass_version: string;
  thing_name: string;
  component_name: string;
  component_version: string;
  deployment_id: string;
  aws_region: string;
  uptime_seconds: number;
  metrics: {
    total_frames_evaluated: number;
    defects_flagged: number;
    edge_buffer_size: number;
    lambda_alerts_triggered: number;
  };
  mqtt_topics: {
    telemetry: string;
    defects: string;
    alerts: string;
  };
}

export interface LambdaAlertRecord {
  execution_id: string;
  function_name: string;
  event_type: string;
  timestamp: string;
  severity: "CRITICAL" | "WARNING" | "INFO" | string;
  defect_count: number;
  defect_types: string[];
  s3_bucket: string;
  s3_key: string;
  s3_url: string;
  sns_alert_dispatched: boolean;
  sns_topic_arn: string;
  notification_summary: string;
  latency_ms: number;
  edge_device_id: string;
}

export interface AlertHistoryResponse {
  count: number;
  alerts: LambdaAlertRecord[];
}
