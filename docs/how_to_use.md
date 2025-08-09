## How to Use the Cool English Speaking Practice System

This guide shows how to run the app locally and the step-by-step flow to use the two training modes: Question Answering and Image Description.

### Prerequisites
- Node.js 18+ and pnpm
- Modern browser with microphone permission
- Azure resources: Speech Service and Azure OpenAI

### Environment setup
Create a `.env` file at the project root with the following variables:

```dotenv:.env
AZURE_SPEECH_KEY=your_speech_key
AZURE_SPEECH_REGION=your_region

AZURE_OPENAI_ENDPOINT=your_openai_endpoint
AZURE_OPENAI_API_KEY=your_api_key
AZURE_OPENAI_API_VERSION=2024-02-15-preview
DEPLOYMENT=your_azure_openai_deployment_name
```

### Install and run
```bash
pnpm install
pnpm dev
```
Open the app at `http://localhost:5173` and allow microphone access when prompted.

### Usage flow (Mermaid)
```mermaid
graph TD
    A[Start: Launch app] --> B[Landing page]
    B --> C{Choose mode}
    C --> D[Question Answering]
    C --> E[Image Description]

    %% Question Answering path
    D --> D1[Pick difficulty]
    D1 --> D2[System reads question (TTS)]
    D2 --> D3[Allow microphone, start recording]
    D3 --> D4[Live speech recognition + pronunciation scoring]
    D4 --> D5[Content grading via Azure OpenAI]
    D5 --> D6[Show scores and feedback]
    D6 --> F{Continue?}

    %% Image Description path
    E --> E1[Pick difficulty]
    E1 --> E2[See image and prompt]
    E2 --> E3[Describe aloud (record)]
    E3 --> E4[Pronunciation scoring]
    E4 --> E5[Content grading]
    E5 --> D6

    F -->|Yes| B
    F -->|No| G[End]
```

### Step-by-step: Question Answering
1. From the landing page, select Question Answering.
2. Pick a difficulty: beginner / intermediate / high-intermediate / advanced.
3. The system plays the question via Text-to-Speech (TTS).
4. Click record and speak your answer; keep the environment quiet and speak clearly.
5. The app computes pronunciation scores in real time and then requests content grading from Azure OpenAI.
6. Review feedback, detailed breakdown, and overall score; retry or go to the next question.

### Step-by-step: Image Description
1. From the landing page, select Image Description.
2. Pick a difficulty. The app chooses an image prompt appropriate to the level.
3. Observe the image and prompt; click record to describe the scene.
4. Receive pronunciation scoring and content grading.
5. Review feedback and continue practicing with non-repeating images.

### Key API endpoints (internal)
- `POST /api/speech/credentials` — obtain Azure Speech auth token for the browser.
- `POST /api/grader/score-answer` — content grading for an answer.
- `POST /api/grader/overall-feedback` — generate overall feedback summary.

### Troubleshooting
- Microphone not working: check browser site permissions and system privacy settings.
- Low recognition accuracy: reduce background noise and speak closer to the mic.
- Slow grading: verify network stability and Azure service status; confirm `.env` values.
- 401/403 errors: ensure Azure keys, region, and endpoint are correct and not expired.

### Notes
- Pronunciation scoring uses Azure Speech SDK with pronunciation assessment.
- Content grading uses Azure OpenAI; responses are validated server-side.
