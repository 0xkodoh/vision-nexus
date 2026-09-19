# Architecture & Project Decisions

This document records the major decisions made during the project to ensure alignment across all AI agents and engineers.

## 1. Project Domain & Scope
* **Decision:** Low-Latency Industrial Defect Detection.
* **Reasoning:** Offers a highly polished, defensible prototype that perfectly hits the OpenCV 5 and AWS constraints without the bug-risks of distributed image stitching.

## 2. Frontend Architecture & Hosting
* **Decision:** Next.js (App Router) + Tailwind CSS, hosted on **Vercel**.
* **Reasoning:** Next.js provides the fastest route to a production-ready dashboard. Vercel is chosen for hosting because of its seamless integration with GitHub for front-end deployment. 
* **Design Theme:** "Tactical Industrial Cockpit" (dark mode, cyan/emerald/crimson accents).

## 3. Backend Architecture & Hosting
* **Decision:** Python 3.11 + FastAPI + Native OpenCV 5, hosted on **AWS (App Runner or EC2)**.
* **Reasoning:** We must use OpenCV 5 natively (no LLM vision shortcuts). Python provides the best bindings. FastAPI is extremely fast. We chose AWS for hosting to strictly satisfy the hackathon's cloud constraints.

## 4. Database Strategy
* **Decision:** Amazon S3 (for image storage) and AWS IoT Greengrass / Lambda simulation. (Skipping Supabase/PostgreSQL).
* **Reasoning:** We want to keep the architecture purely within the AWS ecosystem to strengthen the hackathon submission narrative.

## 5. Demo Video Guidelines
* **Decision:** 2-minute pitch focusing on Edge-to-Cloud latency.
* **Guidelines:** The video must explicitly show the Next.js dashboard, simulate a defect being caught, and demonstrate the AWS S3 upload and Lambda alert in real-time. (Refer to `PITCH_SCRIPT.md` for exact cues).
