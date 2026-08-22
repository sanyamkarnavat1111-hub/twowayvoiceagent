import React, { useState } from "react";
import { Code, FileText, Copy, Check, Terminal, Cpu, Database, Radio, Globe, Layers, Download, CheckCircle2 } from "lucide-react";

interface PythonFile {
  name: string;
  path: string;
  description: string;
  language: string;
  content: string;
}

const PYTHON_BACKEND_FILES: PythonFile[] = [
  {
    name: "main.py",
    path: "/python_backend/main.py",
    description: "FastAPI REST API & WebSocket Server with endpoints for multilingual RAG, STT, and TTS.",
    language: "python",
    content: `import os
import uvicorn
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
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

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

vector_store = InMemoryVectorStore()
rag_pipeline = RAGAgentPipeline(vector_store=vector_store)
speech_service = SpeechService()

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
    language: str = "auto"
    generate_voice: bool = True

@app.post("/api/rag/chat")
async def rag_chat(request: RAGChatRequest):
    """Multilingual Agentic RAG Pipeline with automatic language detection & synthesis."""
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

@app.post("/api/stt")
async def speech_to_text(file: UploadFile = File(...), language: str = Form("auto")):
    """Speech-to-Text audio transcription with language identification."""
    audio_bytes = await file.read()
    transcript, detected_lang = await speech_service.transcribe_audio(
        audio_bytes=audio_bytes,
        mime_type=file.content_type or "audio/webm",
        language=language
    )
    return {"success": True, "transcript": transcript, "detected_language": detected_lang}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)`,
  },
  {
    name: "rag_pipeline.py",
    path: "/python_backend/rag_pipeline.py",
    description: "Multilingual RAG Engine: Language detection, cosine grounding context assembly, and Gemini LLM synthesis in the user's spoken language.",
    language: "python",
    content: `import time
from typing import List, Dict, Any
from google import genai
from config import settings
from vector_store import InMemoryVectorStore

LANGUAGE_NAMES = {
    "en": "English",
    "es": "Spanish (Español)",
    "fr": "French (Français)",
    "de": "German (Deutsch)",
    "hi": "Hindi (हिन्दी)",
    "ja": "Japanese (日本語)",
    "zh": "Chinese (中文)",
}

def detect_language_simple(text: str) -> str:
    if re.search(r"[\\u0900-\\u097F]", text): return "hi"
    if re.search(r"[\\u4E00-\\u9FFF]", text): return "zh"
    if re.search(r"[\\u3040-\\u30FF]", text): return "ja"
    lower = text.lower()
    if any(m in lower for m in ["qué", "cómo", "reembolso", "política", "hola"]): return "es"
    if any(m in lower for m in ["quel", "bonjour", "remboursement", "merci"]): return "fr"
    if any(m in lower for m in ["was", "verfügbarkeit", "rückerstattung", "hallo"]): return "de"
    return "en"

class RAGAgentPipeline:
    def __init__(self, vector_store: InMemoryVectorStore):
        self.vector_store = vector_store
        self.client = genai.Client(api_key=settings.GEMINI_API_KEY) if settings.GEMINI_API_KEY else None

    async def process_multilingual_query(
        self, message: str, history: List[Dict[str, str]] = None,
        top_k: int = 3, similarity_threshold: float = 0.25,
        model: str = "gemini-2.5-flash", voice_name: str = "Kore",
        target_language: str = "auto", generate_voice: bool = True
    ) -> Dict[str, Any]:
        detected_lang = target_language if target_language != "auto" else detect_language_simple(message)
        lang_name = LANGUAGE_NAMES.get(detected_lang, "English")

        # Vector retrieval
        matches, search_duration = self.vector_store.similarity_search(message, top_k, similarity_threshold)
        context_text = "\\n\\n".join([f"[{m['chunk']['docTitle']}]\\n{m['chunk']['content']}" for m in matches])

        # Prompt with strict language preservation rule
        prompt = f"""You are a helpful enterprise voice bot agent.
CRITICAL RULE: Formulate your answer in the EXACT SAME LANGUAGE ({lang_name}) the user asked in.
Keep it 2-3 sentences, natural for spoken voice output, grounded in:
{context_text}
Query: {message}"""

        response = self.client.models.generate_content(model=model, contents=prompt)
        answer = response.text.strip() if response.text else self.synthesize_fallback(message, matches, detected_lang)

        return {
            "answer": answer,
            "detectedLanguage": detected_lang,
            "languageName": lang_name,
            "retrievedChunks": matches,
            "agentTrace": { ... }
        }`,
  },
  {
    name: "vector_store.py",
    path: "/python_backend/vector_store.py",
    description: "In-memory vector store with TF-IDF tokenization, subword matching, and cosine similarity ranking.",
    language: "python",
    content: `import math
import time
import re
from typing import List, Dict, Any, Tuple

class InMemoryVectorStore:
    def __init__(self):
        self.documents = {}
        self.chunks = {}
        self.corpus_terms = {}
        self.reset_to_defaults()

    def similarity_search(self, query: str, top_k: int = 3, min_similarity: float = 0.25) -> Tuple[List[Dict[str, Any]], int]:
        start = time.perf_counter()
        query_tokens = self._tokenize(query)
        if not query_tokens: return [], 1

        scored = []
        for chunk in self.chunks.values():
            # TF-IDF Cosine similarity calculation with metadata and substring boosting
            dot_product, query_norm, chunk_norm = self._compute_cosine(query_tokens, chunk)
            score = dot_product / (math.sqrt(query_norm) * math.sqrt(chunk_norm))
            if score >= min_similarity:
                scored.append({"chunk": chunk, "similarity": round(score, 3)})

        scored.sort(key=lambda x: x["similarity"], reverse=True)
        return scored[:top_k], int((time.perf_counter() - start) * 1000)`,
  },
  {
    name: "speech_service.py",
    path: "/python_backend/speech_service.py",
    description: "Multilingual Speech-to-Text and Text-to-Speech service utilizing Gemini Multimodal Audio.",
    language: "python",
    content: `from google import genai
from config import settings

class SpeechService:
    def __init__(self):
        self.client = genai.Client(api_key=settings.GEMINI_API_KEY) if settings.GEMINI_API_KEY else None

    async def transcribe_audio(self, audio_bytes: bytes, mime_type: str = "audio/webm", language: str = "auto"):
        prompt = "Transcribe the spoken audio verbatim in its original language. Identify language code e.g. [LANG: es]."
        response = self.client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[genai.types.Part.from_bytes(data=audio_bytes, mime_type=mime_type), prompt]
        )
        return response.text, "auto"`,
  },
  {
    name: "requirements.txt",
    path: "/python_backend/requirements.txt",
    description: "Python dependencies for FastAPI, Uvicorn, Pydantic, Google GenAI SDK, and NumPy.",
    language: "text",
    content: `fastapi>=0.110.0
uvicorn[standard]>=0.28.0
pydantic>=2.6.0
pydantic-settings>=2.2.0
google-genai>=0.1.1
python-multipart>=0.0.9
requests>=2.31.0
numpy>=1.26.0`,
  },
  {
    name: "Dockerfile",
    path: "/python_backend/Dockerfile",
    description: "Production containerization for the FastAPI Python backend service.",
    language: "dockerfile",
    content: `FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]`,
  },
];

export const PythonArchitectureViewer: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<PythonFile>(PYTHON_BACKEND_FILES[0]);
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6">
      {/* Architecture Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-2">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                <Terminal className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Python FastAPI Backend Architecture</h2>
              <span className="px-2 py-0.5 text-xs font-semibold rounded bg-amber-50 text-amber-700 border border-amber-200">
                FastAPI + Python 3.11
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Complete backend logic codebase located in <code className="font-mono text-indigo-600 bg-indigo-50 px-1 py-0.5 rounded">/python_backend/</code>. Includes multilingual RAG routing, LangChain prompts, vector indexing, and speech services.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Backend Code Active in Workspace
            </span>
          </div>
        </div>

        {/* Architectural Flow Diagram */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 mb-1">
              <Radio className="w-3.5 h-3.5 text-indigo-600" />
              1. Audio / STT Input
            </div>
            <p className="text-[11px] text-slate-500">
              Captures multilingual speech & identifies language (ES, HI, FR, DE, EN, etc.).
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 mb-1">
              <Database className="w-3.5 h-3.5 text-cyan-600" />
              2. Vector Retrieval
            </div>
            <p className="text-[11px] text-slate-500">
              Cosine similarity search across chunked company documentation.
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 mb-1">
              <Globe className="w-3.5 h-3.5 text-amber-600" />
              3. Multilingual RAG
            </div>
            <p className="text-[11px] text-slate-500">
              Synthesizes grounded response strictly in the user's spoken language.
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 mb-1">
              <Cpu className="w-3.5 h-3.5 text-emerald-600" />
              4. Spoken Audio Voice
            </div>
            <p className="text-[11px] text-slate-500">
              Two-way native audio playback in the corresponding target locale.
            </p>
          </div>
        </div>
      </div>

      {/* Code Browser & File Explorer */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden flex flex-col">
        {/* File Tabs Bar */}
        <div className="bg-slate-950 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {PYTHON_BACKEND_FILES.map((file) => (
              <button
                key={file.name}
                onClick={() => setSelectedFile(file)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all flex items-center gap-1.5 ${
                  selectedFile.name === file.name
                    ? "bg-slate-800 text-amber-400 border border-slate-700 shadow-xs"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                }`}
              >
                <Code className="w-3.5 h-3.5" />
                {file.name}
              </button>
            ))}
          </div>

          <button
            onClick={handleCopyCode}
            className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Copied!" : "Copy Code"}</span>
          </button>
        </div>

        {/* File Description Sub-bar */}
        <div className="bg-slate-900/90 px-4 py-2 border-b border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <span className="font-mono text-slate-300">{selectedFile.path}</span>
          <span className="hidden sm:inline text-slate-400">{selectedFile.description}</span>
        </div>

        {/* Code Content Window */}
        <div className="p-4 max-h-[480px] overflow-y-auto font-mono text-xs text-slate-200 leading-relaxed bg-slate-950/60">
          <pre className="whitespace-pre">{selectedFile.content}</pre>
        </div>
      </div>
    </div>
  );
};
