import { 
  EngineHealth, 
  ProcessFrameResponse, 
  BenchmarkSuiteResponse, 
  GreengrassStatus, 
  AlertHistoryResponse 
} from "@/types/inspection";

export const DEFAULT_API_BASE = process.env.NEXT_PUBLIC_ENGINE_URL || "http://localhost:8000";

/**
 * Checks connectivity and retrieves health/version telemetry from FastAPI engine.
 */
export async function fetchEngineHealth(apiBase: string = DEFAULT_API_BASE): Promise<EngineHealth> {
  const normalizedBase = apiBase.replace(/\/+$/, "");
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);

  try {
    const res = await fetch(`${normalizedBase}/health`, {
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Engine returned HTTP ${res.status}`);
    }

    const data = await res.json();
    return {
      status: "healthy",
      opencv_version: data.opencv_version || "5.0.0-dev",
      aws_region: data.aws_region || "us-east-1",
      s3_bucket: data.s3_bucket || "opencv-ai-competition-defects",
    };
  } catch (err: any) {
    clearTimeout(timeoutId);
    return {
      status: "unreachable",
      opencv_version: "Disconnected",
      aws_region: "Unknown",
      s3_bucket: "Offline",
    };
  }
}

/**
 * Uploads an inspection image frame (Blob or File) to the FastAPI `/process-frame` endpoint.
 */
export async function sendFrameForInspection(
  fileOrBlob: Blob | File,
  syncToS3: boolean = true,
  apiBase: string = DEFAULT_API_BASE
): Promise<ProcessFrameResponse> {
  const normalizedBase = apiBase.replace(/\/+$/, "");
  const formData = new FormData();
  
  // Ensure the file has a filename
  const file = fileOrBlob instanceof File 
    ? fileOrBlob 
    : new File([fileOrBlob], `frame_${Date.now()}.jpg`, { type: "image/jpeg" });
  
  formData.append("file", file);
  formData.append("sync_to_s3", String(syncToS3));

  const res = await fetch(`${normalizedBase}/process-frame`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "Unknown error");
    throw new Error(`Pipeline processing failed (${res.status}): ${errorText}`);
  }

  const data: ProcessFrameResponse = await res.json();
  return data;
}

/**
 * Uploads a golden standard reference image to the FastAPI `/set-reference` endpoint.
 */
export async function setGoldenReferenceStandard(
  fileOrBlob: Blob | File,
  apiBase: string = DEFAULT_API_BASE
): Promise<{ status: string; message: string; dimensions?: { width: number; height: number } }> {
  const normalizedBase = apiBase.replace(/\/+$/, "");
  const formData = new FormData();

  const file = fileOrBlob instanceof File 
    ? fileOrBlob 
    : new File([fileOrBlob], `reference_${Date.now()}.jpg`, { type: "image/jpeg" });

  formData.append("file", file);

  const res = await fetch(`${normalizedBase}/set-reference`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "Unknown error");
    throw new Error(`Failed to set golden reference (${res.status}): ${errorText}`);
  }

  return await res.json();
}

/**
 * Executes the OpenCV 5 native performance benchmark suite across 480p, 720p, 1080p.
 */
export async function runOpenCvBenchmark(
  resolution?: string,
  iterations: number = 40,
  apiBase: string = DEFAULT_API_BASE
): Promise<BenchmarkSuiteResponse> {
  const normalizedBase = apiBase.replace(/\/+$/, "");
  const res = await fetch(`${normalizedBase}/benchmark`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      resolution: resolution || null,
      iterations: iterations,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "Unknown error");
    throw new Error(`Benchmark run failed (${res.status}): ${errorText}`);
  }

  return await res.json();
}

/**
 * Retrieves AWS IoT Greengrass Edge Core status and edge buffer metrics.
 */
export async function fetchGreengrassStatus(apiBase: string = DEFAULT_API_BASE): Promise<GreengrassStatus> {
  const normalizedBase = apiBase.replace(/\/+$/, "");
  const res = await fetch(`${normalizedBase}/greengrass/status`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Greengrass status query failed: ${res.status}`);
  }
  return await res.json();
}

/**
 * Retrieves history of simulated AWS Lambda / SNS alert records.
 */
export async function fetchAlertHistory(limit: number = 20, apiBase: string = DEFAULT_API_BASE): Promise<AlertHistoryResponse> {
  const normalizedBase = apiBase.replace(/\/+$/, "");
  const res = await fetch(`${normalizedBase}/alerts/history?limit=${limit}`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Alert history query failed: ${res.status}`);
  }
  return await res.json();
}
