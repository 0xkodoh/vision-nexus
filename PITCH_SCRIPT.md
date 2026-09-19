# VISION-OPS: 2-Minute Pitch Script
*For the OpenCV AI Competition 2026 Demo Video*

---

### [0:00 - 0:30] The Hook & The Problem
**[Visual Cue: Fast-paced B-roll of a manufacturing conveyor belt, or the presenter looking directly at the camera.]**

**Speaker:** 
"Every minute, a modern assembly line produces thousands of components. But if a single microscopic scratch or solder void slips through, it can cost a company millions in recalls. 
The industry standard is to send these video feeds to the cloud for heavy AI processing—but that introduces lag, bandwidth costs, and security risks. 
For the OpenCV AI Competition, we asked: What if we brought the power of the cloud *directly* to the edge? 
Meet **VISION-OPS**."

---

### [0:30 - 1:00] The OpenCV 5 Edge Solution 
**[Visual Cue: Screen recording of the Next.js Dashboard. Click through the 'Sample Generator' to show defects being caught instantly with red bounding boxes.]**

**Speaker:** 
"VISION-OPS is a low-latency, edge-to-cloud defect detection pipeline.
Instead of relying on slow, generic LLM APIs, we built a mathematically rigorous pipeline using **native OpenCV 5**. 
By utilizing optimized Canny edge detection, Sobel gradients, and structural template matching, our FastAPI engine processes 480p video feeds at over **111 frames per second**—with a latency of just 8.9 milliseconds per frame. 
It catches scratches, cracks, and structural deformations instantly."

---

### [1:00 - 1:30] The AWS Cloud Integration
**[Visual Cue: Zoom in on the "AWS Sync Status" UI component and the "Event Timeline" showing defects successfully syncing.]**

**Speaker:** 
"But a smart factory needs a brain. 
Our OpenCV nodes run on simulated **AWS IoT Greengrass**. When a critical defect is identified, it isn't just flagged on this Next.js dashboard. 
The OpenCV engine instantly packages the telemetry and uses Boto3 to push the annotated frame to an **Amazon S3** bucket. This immediately triggers an **AWS Lambda** webhook, allowing factory managers to receive instant SNS alerts on their phones before the defective part even reaches the end of the belt."

---

### [1:30 - 2:00] The Impact & Closing
**[Visual Cue: Wide shot showing the whole 'Tactical Cockpit' dashboard, running smoothly. Fade to the team/project logo.]**

**Speaker:** 
"By combining the raw, low-level performance of OpenCV 5 with the massive scale and reliability of Amazon Web Services, we haven’t just built a hackathon project—we’ve built a deployable, enterprise-grade Automated Optical Inspection system. 
Fast, secure, and incredibly precise.
Thank you to OpenCV and AWS for hosting the 2026 competition!"
