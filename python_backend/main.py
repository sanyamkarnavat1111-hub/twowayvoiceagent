import os
import uvicorn
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

from config import settings
from rag_pipeline import RAGAgentPipeline
from vector_store import InMemoryVectorStore
from speech_service import SpeechService

app = FastAPI(
    title="VoiceBot Agentic RAG API (FastAPI + LangChain)",
    description="Enterprise Two-Way Conversational VoiceBot with Dynamic Vector Search, Multilingual STT & TTS",
    version="2.0.0",
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize vector database and RAG pipeline
vector_store = InMemoryVectorStore()
rag_pipeline = RAGAgentPipeline(vector_store=vector_store)
speech_service = SpeechService()


class DocumentCreateRequest(BaseModel):
    title: str
    category: str
    description: str
    content: str
    tags: List[str] = []


class ChatMessagePayload(BaseModel):
    role: str
    content: str


class RAGChatRequest(BaseModel):
    message: str
    history: List[ChatMessagePayload] = []
    top_k: int = 3
    similarity_threshold: float = 0.25
    model: str = "gemini-2.5-flash"
    voice_name: str = "Kore"
    language: str = "auto"  # "auto", "es", "fr", "de", "hi", "ja", "zh", "en", etc.
    generate_voice: bool = True


class TTSRequest(BaseModel):
    text: str
    voice_name: str = "Kore"
    language: str = "en"


@app.get("/api/health")
async def health_check():
    """Health check endpoint confirming FastAPI backend operational status."""
    return {
        "status": "healthy",
        "service": "VoiceBot Agentic RAG (FastAPI)",
        "indexed_documents": vector_store.get_document_count(),
        "total_chunks": vector_store.get_chunk_count(),
        "gemini_api_configured": bool(settings.GEMINI_API_KEY),
    }


@app.post("/api/rag/chat")
async def rag_chat(request: RAGChatRequest):
    """
    Main Agentic Multilingual RAG Endpoint:
    1. Query Intent & Language Detection
    2. Vector Cosine Similarity Search on Company Knowledge Base
    3. LangChain/LangGraph Grounding Prompt Assembly
    4. Gemini LLM Generation in the user's spoken language
    5. Multilingual TTS Speech Synthesis
    """
    try:
        result = await rag_pipeline.process_multilingual_query(
            message=request.message,
            history=[msg.dict() for msg in request.history],
            top_k=request.top_k,
            similarity_threshold=request.similarity_threshold,
            model=request.model,
            voice_name=request.voice_name,
            target_language=request.language,
            generate_voice=request.generate_voice,
        )
        return {"success": True, **result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"RAG processing failed: {str(e)}")


@app.post("/api/stt")
async def speech_to_text(
    file: UploadFile = File(...),
    language: str = Form("auto")
):
    """
    Multilingual Speech-to-Text Transcription via Whisper / Gemini Multimodal.
    Supports audio in Spanish, French, German, Hindi, Japanese, Chinese, English, etc.
    """
    try:
        audio_bytes = await file.read()
        transcript, detected_lang = await speech_service.transcribe_audio(
            audio_bytes=audio_bytes,
            mime_type=file.content_type or "audio/webm",
            language=language
        )
        return {
            "success": True,
            "transcript": transcript,
            "detected_language": detected_lang
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"STT transcription failed: {str(e)}")


@app.post("/api/tts")
async def text_to_speech(request: TTSRequest):
    """
    Multilingual Text-to-Speech synthesis with Gemini TTS / Google WaveNet.
    """
    try:
        audio_base64, mime_type = await speech_service.synthesize_speech(
            text=request.text,
            voice_name=request.voice_name,
            language=request.language
        )
        return {
            "success": True,
            "audioBase64": audio_base64,
            "mimeType": mime_type
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"TTS synthesis failed: {str(e)}")


@app.get("/api/kb/documents")
async def list_documents():
    """Retrieve all indexed documentation and chunk metrics."""
    return {
        "success": True,
        "documents": vector_store.get_all_documents(),
        "totalChunks": vector_store.get_chunk_count(),
    }


@app.post("/api/kb/documents")
async def add_document(doc: DocumentCreateRequest):
    """Index new company documentation into vector store."""
    new_doc = vector_store.add_document(
        title=doc.title,
        category=doc.category,
        description=doc.description,
        content=doc.content,
        tags=doc.tags,
    )
    return {"success": True, "document": new_doc}


@app.delete("/api/kb/documents/{doc_id}")
async def delete_document(doc_id: str):
    """Delete document and all corresponding vector embeddings."""
    deleted = vector_store.delete_document(doc_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Document not found")
    return {"success": True}


@app.post("/api/kb/reset")
async def reset_kb():
    """Reset Knowledge Base to default enterprise SLA, Billing, API & Support docs."""
    vector_store.reset_to_defaults()
    return {"success": True, "message": "Knowledge base reset to defaults."}


@app.post("/api/kb/search")
async def search_kb(
    query: str,
    top_k: int = 4,
    min_similarity: float = 0.25
):
    """Direct vector similarity search endpoint for testing and RAG benchmarking."""
    matches, duration_ms = vector_store.similarity_search(
        query=query,
        top_k=top_k,
        min_similarity=min_similarity
    )
    return {
        "success": True,
        "matches": matches,
        "durationMs": duration_ms
    }


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
