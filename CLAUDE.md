# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This repository contains two implementations of an English speaking practice application with AI-powered assessment:

1. **Original SvelteKit Version** (root directory) - TypeScript/Node.js web application
2. **Python Version** (`pysrc/` directory) - FastAPI backend with Streamlit frontend

Both versions provide two main test modes:
1. **Question-answering** - Practice answering English questions
2. **Image description** - Practice describing images in English

The application uses Azure Speech Services for pronunciation assessment and OpenAI for content evaluation.

## Development Commands

### SvelteKit Version (Root Directory)

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking
npm run check

# Watch mode type checking
npm run check:watch

# Format code
npm run format

# Lint code
npm run lint
```

### Python Version (pysrc/ Directory)

```bash
# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys

# Run API server
python run_api.py
# Or in development mode:
# uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Run Streamlit frontend (in another terminal)
python run_frontend.py
# Or directly:
# streamlit run frontend/streamlit_app.py

# Code formatting
black .

# Type checking
mypy .

# Run tests
pytest
```

## Architecture

### SvelteKit Version (Root Directory)

**Frontend Structure:**
- **SvelteKit** application using TypeScript
- **Tailwind CSS** with **Flowbite** components for UI
- **Vite** as build tool
- **pnpm** as package manager

**Key Components (`src/lib/components/`):**
- `SpeakingPractice.svelte` - Main recording interface with visual feedback
- `Recorder.svelte` - Audio recording functionality
- `AssessmentResult.svelte` - Display assessment results
- `PronunciationBreakdown.svelte` - Detailed pronunciation analysis
- `ScoreSummary.svelte` - Overall score display
- `OverallFeedback.svelte` - AI-generated feedback

**Core Services:**
- `src/lib/grader.ts` - Client-side API wrapper for content assessment
- `src/lib/azure/` - Azure Speech Services integration
- `src/lib/server/` - Server-side utilities and API handlers

**API Routes (`src/routes/api/`):**
- `/api/grader/score-answer` - Content assessment endpoint
- `/api/grader/overall-feedback` - Generate comprehensive feedback
- `/api/speech/credentials` - Azure Speech Service credentials

### Python Version (pysrc/ Directory)

**Backend Structure:**
- **FastAPI** REST API with automatic OpenAPI documentation
- **Pydantic** models for data validation
- **uvicorn** ASGI server for production
- **python-dotenv** for environment configuration

**Frontend Structure:**
- **Streamlit** web application for user interface
- Session-based state management
- Real-time API communication with backend

**Key Modules:**
- `app/main.py` - FastAPI application entry point
- `app/api/routes.py` - API endpoint definitions
- `app/services/azure_speech.py` - Azure Speech Services integration
- `app/services/openai_grader.py` - OpenAI content grading
- `app/models/types.py` - Pydantic data models
- `frontend/streamlit_app.py` - Streamlit web interface

**API Endpoints:**
- `GET /api/health` - Health check
- `POST /api/grader/score-answer` - Score student answer
- `POST /api/grader/overall-feedback` - Generate overall feedback
- `GET /api/speech/credentials` - Get Azure Speech credentials
- `POST /api/speech/assess-pronunciation` - Assess pronunciation

### Assessment System
The app uses a dual assessment approach:
1. **Speech Assessment** (Azure) - Accuracy, fluency, prosody (0-100 scale)
2. **Content Assessment** (OpenAI) - Vocabulary, grammar, relevance (0-100 scale)
3. **Overall Score** - Combined score (0-100 scale)

### Data Models

**SvelteKit Version (`src/lib/types.ts`):**
- `AssessmentResult` - Complete assessment structure
- `SpeechAssessment` - Azure pronunciation metrics
- `ContentAssessment` - LLM content evaluation
- `Message` - Chat message structure with audio/results

**Python Version (`pysrc/app/models/types.py`):**
- `AssessmentResult` - Complete assessment structure (Pydantic model)
- `SpeechAssessment` - Azure pronunciation metrics
- `ContentAssessment` - LLM content evaluation
- `Question` / `ImageQuestion` - Question models with validation
- `GraderRequest` / `GraderResponse` - API request/response models
- `OverallFeedbackRequest` / `OverallFeedbackResponse` - Feedback models

## Configuration

### Environment Variables

**SvelteKit Version:**
- Azure Speech Service credentials configured in server routes
- OpenAI API configuration in `src/lib/server/azure/openai.ts`

**Python Version:**
- Set up `.env` file with required keys:
  - `AZURE_SPEECH_KEY` - Azure Speech Services API key
  - `AZURE_SPEECH_REGION` - Azure region (e.g., "eastus")
  - `OPENAI_API_KEY` - OpenAI API key
  - `DEBUG` - Enable debug mode (true/false)
  - `LOG_LEVEL` - Logging level (DEBUG, INFO, WARNING, ERROR)

### Debugging

**SvelteKit Version:**
The project uses the `debug` package for logging:
- Enable in browser: `localStorage.debug = 'app:*'`
- Enable in Node.js: `DEBUG=app:* npm run dev`
- Available namespaces: `app:openai`, `app:grader`, `app:image-description`
- See `DEBUG.md` for complete debugging guide

**Python Version:**
Uses Python's built-in `logging` module:
- Configure log level via `LOG_LEVEL` environment variable
- Logs are output to console with structured formatting
- Service-specific loggers for Azure Speech and OpenAI integrations

## Package Management

**SvelteKit Version:**
- Uses **pnpm** with lockfile
- Key dependencies: SvelteKit, Azure Speech SDK, OpenAI, Tailwind CSS, Flowbite
- Build dependencies include ESLint, Prettier, TypeScript

**Python Version:**
- Uses **pip** with `requirements.txt`
- Key dependencies: FastAPI, Streamlit, Azure Speech SDK, OpenAI, Pydantic
- Development dependencies: pytest, black, mypy

## Testing & Quality

**SvelteKit Version:**
- ESLint configuration in `eslint.config.js`
- Prettier formatting with Tailwind CSS plugin
- TypeScript strict mode enabled
- No test framework currently configured

**Python Version:**
- Code formatting with **black**
- Type checking with **mypy**
- Testing framework: **pytest** (test files in `tests/` directory)
- Pydantic models provide runtime type validation