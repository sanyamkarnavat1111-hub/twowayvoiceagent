export interface DocChunk {
  id: string;
  docId: string;
  docTitle: string;
  category: string;
  content: string;
  chunkIndex: number;
  tokenCount: number;
  embedding?: number[];
}

export interface CompanyDocument {
  id: string;
  title: string;
  category: string;
  description: string;
  content: string;
  createdAt: string;
  chunksCount: number;
  tags: string[];
}

export interface RetrievedChunkMatch {
  chunk: DocChunk;
  similarity: number;
  relevanceScore: number;
}

export interface AgenticTraceStep {
  id: string;
  title: string;
  status: 'pending' | 'running' | 'completed' | 'skipped';
  timestamp: number;
  durationMs?: number;
  details: string;
  data?: any;
}

export interface AgenticTrace {
  query: string;
  steps: AgenticTraceStep[];
  retrievedCount: number;
  topScore: number;
  totalDurationMs: number;
  modelUsed: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  audioUrl?: string;
  audioBase64?: string;
  retrievedChunks?: RetrievedChunkMatch[];
  agentTrace?: AgenticTrace;
  isVoiceInput?: boolean;
}

export type VoiceName = 'Kore' | 'Puck' | 'Fenrir' | 'Zephyr' | 'Charon';

export interface BotSettings {
  voiceName: VoiceName;
  model: 'gemini-3.7-flash' | 'gemini-3.5-flash' | 'gemini-3.1-flash-lite' | 'gemini-3.1-pro-preview';
  topK: number;
  similarityThreshold: number;
  handsFreeMode: boolean;
  autoSpeak: boolean;
  systemInstruction: string;
  chunkSize: number;
  chunkOverlap: number;
}

export type BotState = 'idle' | 'listening' | 'transcribing' | 'retrieving' | 'thinking' | 'speaking';
