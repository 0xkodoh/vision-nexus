# Global System Instructions

**ATTENTION ALL AI AGENTS:** You are collaborating on the OpenCV AI Competition 2026 project. You must strictly adhere to the following rules:

1. **READ BEFORE CODING**: Always read `memory.md` before making any code changes or architectural decisions to understand the current context and history.
2. **OPENCV 5 NATIVE**: We are building a robust computer vision pipeline. You MUST ensure OpenCV 5 is used for core vision tasks instead of generic AI vision APIs (like GPT-4 Vision).
3. **AWS INTEGRATION**: The project relies on AWS. Ensure proper usage of AWS SDKs (boto3) and securely handle AWS credentials. DO NOT hardcode credentials.
4. **UPDATE CONTEXT**: When you finish a session, update `memory.md` with your actions and `handover.md` with the next steps and blockers.
5. **COPYABLE PROMPTS**: Whenever generating a prompt for another agent, ALWAYS output the prompt inside a Markdown code block (fenced with ```text or similar) so the user has a quick "copy" button in the UI.
