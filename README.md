# VISION-OPS: Low-Latency Industrial AOI Pipeline
OpenCV AI Competition 2026 Submission

## Inspiration
High-speed assembly lines need inspection systems that make decisions in milliseconds. Streaming raw 1080p or 4K video feeds to the cloud for inference introduces significant latency, consumes massive bandwidth, and fails when connectivity drops. We built an automated optical inspection (AOI) pipeline that runs directly on edge hardware using classical computer vision, reserving cloud infrastructure strictly for telemetry, archival storage, and alert routing.

## What it does
VISION-OPS is an automated optical inspection system designed for manufacturing lines.
- **Edge Vision Pipeline**: Ingests video frames from a camera or test feed, compares incoming parts against a calibrated golden template, and flags defects including scratches, surface cracks, pinhole voids, and dimensional misalignments.
- **Real-Time Performance**: Runs at 111.7 FPS (8.95 ms mean latency) at 480p and 39.8 FPS (25.14 ms) at 720p using native OpenCV operations on standard CPU hardware.
- **Cloud Telemetry and Alerting**: Encodes flagged defect frames in memory, attaches defect bounding box metadata, pushes them to Amazon S3 via Boto3, and triggers simulated AWS Lambda and SNS alerts.
- **Operator Dashboard**: A Next.js web application that displays the live inspection stream, annotated bounding boxes, defect breakdown, latency distribution, and AWS sync status.

## How we built it
The project uses a decoupled two-service architecture:

1. **Inspection Engine (`/engine`)**:
   - Built with Python 3.11 and FastAPI.
   - Core CV logic uses native OpenCV 5 operations: Gaussian filtering for noise suppression, Sobel gradient and Canny edge detection, absolute difference against golden reference baselines, morphological opening/closing, and contour analysis (`findContours`, `boundingRect`) to classify defect morphology and bounding coordinates.
   - Cloud integration uses `boto3` to push JPEG buffers directly to Amazon S3 without intermediate disk writes, coupled with an edge simulation layer for AWS IoT Greengrass and Lambda event payloads.

2. **Operator Interface (`/web`)**:
   - Built with Next.js 15 (App Router), TypeScript, and Tailwind CSS.
   - Provides live frame rendering with toggleable views (annotated overlay, raw sensor input, and side-by-side comparison).
   - Includes a built-in synthetic specimen generator for repeatable testing across PCB traces, solder joints, and pharma packaging.
   - Real-time telemetry monitoring displaying rolling latency, defect counts by category, and S3 upload history.

3. **Orchestration**:
   - Multi-stage Dockerfiles for both services and a unified `docker-compose.yml` for local deployment.

## Benchmark Results
We profiled the OpenCV pipeline across standard industrial resolutions on a single CPU core:

| Resolution | Dimensions | Mean Latency | p95 Latency | Throughput | Pixel Rate |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **480p** | 640 × 480 | 8.95 ms | 10.26 ms | 111.7 FPS | 98.13 MB/s |
| **720p** | 1280 × 720 | 25.14 ms | 27.78 ms | 39.8 FPS | 104.89 MB/s |
| **1080p** | 1920 × 1080 | 48.74 ms | 55.81 ms | 20.5 FPS | 121.68 MB/s |

## Challenges we ran into
- **I/O Bottlenecks**: Writing frames to disk before S3 upload or frontend streaming killed throughput, dropping frame rates below 20 FPS. Moving to in-memory byte buffers (`cv2.imencode`) and direct base64 encoding cut end-to-end latency by roughly 85%.
- **Noise vs. Defect Thresholding**: Small lighting variations between consecutive frames created false positives in baseline subtraction. Combining structural difference checks with morphological opening and area thresholding eliminated transient pixel noise while keeping true defect contours.

## Accomplishments that we're proud of
- Sub-10 ms mean processing times on 480p frames without requiring GPU acceleration.
- Functional end-to-end integration: edge processing, telemetry generation, AWS event simulation, and live operator feedback.
- Clean separation of concerns with a verified Docker Compose setup and comprehensive test coverage (7/7 passing unit/integration tests).

## What's next for VISION-OPS
- Integrating OpenCV 5's DNN execution engine with lightweight quantized models (MobileNet/YOLO-nano) for secondary classification on detected defect crops.
- Hardware testing on physical edge targets (Raspberry Pi 5 and NVIDIA Jetson Orin Nano).
- Native MQTT publisher implementation for real AWS IoT Greengrass deployments on factory floor hardware.
