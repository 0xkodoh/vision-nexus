# OpenCV AI Competition 2026: Master Blueprint

## Overarching Goal
Build a highly defensible Computer Vision application to win the OpenCV AI Competition 2026.

## Core Constraints (CRITICAL)
1. **OpenCV 5**: Must leverage OpenCV 5 functionality natively. The project must demonstrate actual, low-level computer vision engineering and processing. We cannot simply pass images to a multimodal LLM API.
2. **Amazon Web Services (AWS)**: The solution must leverage AWS infrastructure for compute, deployment, or processing (e.g., S3, EC2, Lambda, SageMaker).

## Chosen Technical Stack
- **Domain**: Low-Latency Industrial Defect Detection
- **Computer Vision**: OpenCV 5 (Python/C++) for contour detection, edge detection (Canny/Sobel), template matching, and DNN object verification.
- **Backend Framework**: FastAPI (serving the OpenCV engine)
- **Cloud Infrastructure (AWS)**: AWS IoT Greengrass (edge simulation), Amazon S3 (image storage), AWS Lambda (alerting), and boto3 integration.
- **Frontend**: Next.js + Tailwind CSS (Analytics and Camera Stream Dashboard)
