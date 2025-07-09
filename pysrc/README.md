# English Speaking Practice - Python Version

AI-powered English speaking practice application with pronunciation and content assessment using Azure Speech Services and OpenAI.

## Features

- **Question Answering Practice**: Practice answering various English questions
- **Image Description Practice**: Practice describing images in English
- **Real-time Assessment**: 
  - Pronunciation assessment using Azure Speech Services
  - Content quality evaluation using OpenAI
- **Detailed Feedback**: Get personalized feedback to improve your English
- **Practice History**: Track your progress over time

## Architecture

- **Backend**: FastAPI with REST API endpoints
- **Frontend**: Streamlit web application
- **Services**: 
  - Azure Speech Services for pronunciation assessment
  - OpenAI for content grading and feedback
- **Database**: Session-based storage (can be extended to use databases)

## Setup

1. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Configure environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

3. **Required API Keys**:
   - Azure Speech Services key and region
   - OpenAI API key

## Running the Application

### Option 1: Run both backend and frontend separately

1. **Start the API server**:
   ```bash
   python run_api.py
   ```
   The API will be available at `http://localhost:8000`

2. **Start the frontend** (in another terminal):
   ```bash
   python run_frontend.py
   ```
   The web app will be available at `http://localhost:8501`

### Option 2: Development mode

1. **Start API in development mode**:
   ```bash
   cd pysrc
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

2. **Start Streamlit app**:
   ```bash
   cd pysrc/frontend
   streamlit run streamlit_app.py
   ```

## API Endpoints

- `GET /api/health` - Health check
- `POST /api/grader/score-answer` - Score student answer
- `POST /api/grader/overall-feedback` - Generate overall feedback
- `GET /api/speech/credentials` - Get Azure Speech credentials
- `POST /api/speech/assess-pronunciation` - Assess pronunciation

## Project Structure

```
pysrc/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI application
│   ├── api/
│   │   ├── __init__.py
│   │   └── routes.py           # API routes
│   ├── models/
│   │   ├── __init__.py
│   │   └── types.py            # Pydantic models
│   ├── services/
│   │   ├── __init__.py
│   │   ├── azure_speech.py     # Azure Speech Services
│   │   └── openai_grader.py    # OpenAI grading service
│   └── utils/
│       ├── __init__.py
│       └── config.py           # Configuration management
├── frontend/
│   └── streamlit_app.py        # Streamlit frontend
├── tests/                      # Test files
├── requirements.txt            # Python dependencies
├── pyproject.toml             # Project configuration
├── .env.example               # Environment variables template
├── run_api.py                 # API server runner
├── run_frontend.py            # Frontend runner
└── README.md                  # This file
```

## Development

1. **Install development dependencies**:
   ```bash
   pip install -e ".[dev]"
   ```

2. **Code formatting**:
   ```bash
   black .
   ```

3. **Type checking**:
   ```bash
   mypy .
   ```

4. **Run tests**:
   ```bash
   pytest
   ```

## Configuration

Environment variables can be set in `.env` file:

- `AZURE_SPEECH_KEY`: Azure Speech Services API key
- `AZURE_SPEECH_REGION`: Azure region (e.g., "eastus")
- `OPENAI_API_KEY`: OpenAI API key
- `DEBUG`: Enable debug mode (true/false)
- `LOG_LEVEL`: Logging level (DEBUG, INFO, WARNING, ERROR)

## Deployment

For production deployment:

1. Set up environment variables
2. Use a production WSGI server like Gunicorn for the API
3. Deploy Streamlit app using Streamlit Cloud or similar
4. Consider using Docker for containerization

## License

MIT License