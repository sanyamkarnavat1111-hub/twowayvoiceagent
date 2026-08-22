import React, { useState } from "react";
import { Play, Volume2, Sparkles, Database, Clock, ChevronDown, ChevronUp, Bot, User, CheckCircle2, Mic, Globe } from "lucide-react";
import { ChatMessage, RetrievedChunkMatch, BotSettings } from "../types.js";
import { VoiceSpeechEngine } from "../utils/audioUtils.js";

interface TranscriptViewProps {
  messages: ChatMessage[];
  speechEngine: VoiceSpeechEngine;
  settings: BotSettings;
  onSelectDocChunk?: (chunk: RetrievedChunkMatch) => void;
}

export const TranscriptView: React.FC<TranscriptViewProps> = ({
  messages,
  speechEngine,
  settings,
  onSelectDocChunk,
}) => {
  const [expandedTraceId, setExpandedTraceId] = useState<string | null>(null);
  const [activePlayingId, setActivePlayingId] = useState<string | null>(null);

  const handlePlayAudio = (message: ChatMessage) => {
    if (activePlayingId === message.id) {
      speechEngine.stop();
      setActivePlayingId(null);
      return;
    }

    setActivePlayingId(message.id);
    speechEngine.speak(
      message.content,
      settings.voiceName,
      message.detectedLanguage || "en",
      () => setActivePlayingId(message.id),
      () => setActivePlayingId(null)
    );
  };

  const toggleTrace = (id: string) => {
    setExpandedTraceId(expandedTraceId === id ? null : id);
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Conversation Transcripts & Multilingual Traces</h2>
          <p className="text-xs text-slate-500">
            Complete log of multilingual voice queries, language detection, vector retrieval, and spoken voice answers.
          </p>
        </div>
        <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
          {messages.length} Messages
        </span>
      </div>

      {messages.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
            <Mic className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-800">No conversation history yet</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Switch to the Live Voice tab or ask a question to begin querying the vector database with voice.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`rounded-2xl p-5 border transition-all ${
                msg.role === "user"
                  ? "bg-slate-50 border-slate-200/80 ml-6 md:ml-16"
                  : "bg-white border-slate-200/90 shadow-xs mr-6 md:mr-16"
              }`}
            >
              {/* Message Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                      msg.role === "user"
                        ? "bg-slate-200 text-slate-800"
                        : "bg-indigo-600 text-white"
                    }`}
                  >
                    {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  <span className="text-xs font-bold text-slate-800">
                    {msg.role === "user" ? "Customer" : "VoiceBot Agent"}
                  </span>
                  {msg.isVoiceInput && (
                    <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <Mic className="w-2.5 h-2.5" /> Spoken Audio
                    </span>
                  )}
                  {msg.languageName && (
                    <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                      <Globe className="w-2.5 h-2.5" /> {msg.languageName}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                  </span>

                  {msg.role === "assistant" && (
                    <button
                      onClick={() => handlePlayAudio(msg)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                        activePlayingId === msg.id
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                      }`}
                    >
                      {activePlayingId === msg.id ? (
                        <>
                          <Volume2 className="w-3 h-3 animate-pulse" /> Stop Voice
                        </>
                      ) : (
                        <>
                          <Play className="w-3 h-3 fill-indigo-700" /> Play Spoken Voice
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Message Content */}
              <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap pl-9">
                {msg.content}
              </p>

              {/* Agentic Trace & Grounding Summary (for assistant messages) */}
              {msg.agentTrace && (
                <div className="mt-4 pt-3 border-t border-slate-100 pl-9">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        Latency: {msg.agentTrace.totalDurationMs}ms
                      </span>
                      <span className="flex items-center gap-1">
                        <Database className="w-3.5 h-3.5 text-indigo-500" />
                        Retrieved Chunks: {msg.agentTrace.retrievedCount}
                      </span>
                    </div>

                    <button
                      onClick={() => toggleTrace(msg.id)}
                      className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                    >
                      <span>{expandedTraceId === msg.id ? "Hide Agentic Trace" : "View Agentic Trace"}</span>
                      {expandedTraceId === msg.id ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  {/* Expanded Step-by-Step Agentic Trace */}
                  {expandedTraceId === msg.id && (
                    <div className="mt-3 p-3.5 bg-slate-900 text-slate-100 rounded-xl text-xs space-y-3">
                      <div className="font-semibold text-indigo-300 pb-1 border-b border-slate-800 flex justify-between">
                        <span>Agent Execution Pipeline</span>
                        <span className="text-[10px] text-slate-400">Model: {msg.agentTrace.modelUsed}</span>
                      </div>

                      <div className="space-y-2">
                        {msg.agentTrace.steps.map((step, idx) => (
                          <div key={idx} className="flex items-start gap-2.5">
                            <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                              {idx + 1}
                            </span>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-slate-200">{step.title}</span>
                                {step.durationMs !== undefined && (
                                  <span className="text-[10px] text-slate-400">{step.durationMs}ms</span>
                                )}
                              </div>
                              <p className="text-slate-400 text-[11px] mt-0.5">{step.details}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Source Chunks Snippets */}
                      {msg.retrievedChunks && msg.retrievedChunks.length > 0 && (
                        <div className="pt-2 border-t border-slate-800">
                          <span className="text-[11px] font-semibold text-cyan-300">Grounded Chunks:</span>
                          <div className="mt-1.5 space-y-1.5">
                            {msg.retrievedChunks.map((c, i) => (
                              <div
                                key={i}
                                className="p-2 rounded bg-slate-800/80 border border-slate-700 text-[11px] flex justify-between items-center"
                              >
                                <span className="text-slate-300 truncate mr-2">
                                  {c.chunk.docTitle} (#{c.chunk.chunkIndex})
                                </span>
                                <span className="text-emerald-400 font-mono text-[10px] shrink-0">
                                  sim: {c.similarity}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
