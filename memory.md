# The Running Ledger

This file contains a chronological log of decisions made, dependencies installed, and current state.

## Log

- **2026-08-24**: Initialized agentic memory structure. Created `project.md`, `agent.md`, `memory.md`, and `handover.md`. Awaiting project scope decision.
- **2026-08-24**: Updated `agent.md` global rules: ALL future prompts for other agents must be generated inside copyable code blocks.
- **2026-08-24**: Environment assessed: Node.js (v24.13.0), npm (11.6.2), Docker (v29.6.2), Python (3.11.9, 3.13.7, 3.14 via `py` launcher). AWS CLI not installed directly on PATH (will use `boto3` and AWS SDKs directly or containerized).
- **2026-08-24**: Initialized project architecture scaffolding: `/engine` (FastAPI + native OpenCV + Boto3 + Dockerfile) and `/web` (Next.js App Router + TypeScript + Tailwind CSS + AWS SDK + Dockerfile) along with root `docker-compose.yml`.
- **2026-08-31**: Locked in project scope: Option 1 (Low-Latency Industrial Defect Detection). Easiest learning curve with a highly polished and defensible presentation.
- **2026-08-31**: Implemented native OpenCV 5 Defect Detection Pipeline in `engine/src/pipelines/base_pipeline.py` (Gaussian blur, Canny edge detection, Sobel gradient magnitude, template difference subtraction, morphological filtering, contour discovery, aspect ratio classification, and bounding box rendering).
- **2026-08-31**: Implemented S3 direct frame buffer upload with defect telemetry in `engine/src/cloud/aws_manager.py`.
- **2026-08-31**: Updated `engine/src/main.py` with `/process-frame` and `/set-reference` endpoints, returning annotated base64 images and syncing flagged frames directly to S3.
- **2026-08-31**: Established `web/style-guide.md` defining "Tactical Industrial Cockpit" design system with dark substrate, signal status channels, reticle ticks, and precision monospace typography.
- **2026-08-31**: Built native OpenCV 5 Throughput & Latency Benchmarking Suite in `engine/src/benchmark.py`. Measured empirical performance across resolutions: 480p (8.95ms mean latency / 111.7 FPS), 720p (25.14ms mean latency / 39.8 FPS), 1080p (48.74ms mean latency / 20.5 FPS).
- **2026-08-31**: Implemented AWS IoT Greengrass v2 Core edge device simulation and automated S3 ObjectCreated event-driven AWS Lambda / SNS alert webhooks in `engine/src/cloud/greengrass_simulator.py` and `engine/src/cloud/aws_manager.py`.
- **2026-08-31**: Added `/benchmark`, `/greengrass/status`, and `/alerts/history` endpoints to `engine/src/main.py`.
- **2026-08-31**: Integrated live Greengrass Edge HUD, real-time Lambda alert banner, and interactive Resolution Benchmark controls into Next.js dashboard (`web/src/components/AwsSyncStatus.tsx`, `web/src/components/TelemetrySidebar.tsx`, `web/src/lib/api.ts`).
- **2026-08-31**: Added and passed comprehensive unit/integration test suite (`engine/tests/test_engine.py`) with 7/7 tests passing. Validated Docker Compose orchestration (`docker compose config`).

