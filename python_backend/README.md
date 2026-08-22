# Enterprise VoiceBot Agentic RAG (FastAPI + LangChain + Gemini)

## Architecture Overview
This Python backend implements a high-throughput, agentic Two-Way VoiceBot with Multilingual RAG:
- **FastAPI Core (`main.py`)**: Asynchronous REST endpoints for voice streaming, vector search, document indexing, and agent traces.
- **Multilingual RAG Pipeline (`rag_pipeline.py`)**: Automatic language detection (Spanish, Hindi, French, German, Japanese, Chinese, etc.), knowledge base cosine similarity retrieval, and dynamic multilingual answer formulation.
- **In-Memory Vector Database (`vector_store.py`)**: Subword TF-IDF and cosine similarity index with semantic document chunking.
- **Speech Service (`speech_service.py`)**: Multilingual Speech-to-Text and Text-to-Speech orchestration.

## Quick Start

### 1. Install Dependencies
```bash
cd python_backend
pip install -r requirements.txt
```

### 2. Configure Environment
Set your Gemini API key in `.env` or as an environment variable:
```bash
export GEMINI_API_KEY="your-gemini-api-key"
```

### 3. Run FastAPI Server
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
Interactive API docs will be live at `http://localhost:8000/docs`.
