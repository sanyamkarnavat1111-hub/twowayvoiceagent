import React from "react";
import { Mic, Database, Search, MessageSquare, Settings2, Sparkles, Terminal, Globe } from "lucide-react";
import { BotSettings, BotState } from "../types.js";

interface VoiceBotHeaderProps {
  activeTab: "voice" | "transcript" | "kb" | "vector-search" | "python-backend";
  setActiveTab: (tab: "voice" | "transcript" | "kb" | "vector-search" | "python-backend") => void;
  botState: BotState;
  settings: BotSettings;
  onOpenSettings: () => void;
  totalDocs: number;
}

export const VoiceBotHeader: React.FC<VoiceBotHeaderProps> = ({
  activeTab,
  setActiveTab,
  botState,
  settings,
  onOpenSettings,
  totalDocs,
}) => {
  const getStatusBadge = () => {
    switch (botState) {
      case "listening":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Listening to Voice...
          </span>
        );
      case "transcribing":
      case "retrieving":
      case "thinking":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-indigo-500/10 text-indigo-600 border border-indigo-500/20 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
            {botState === "retrieving" ? "Vector Cosine Search..." : "Multilingual Reasoning..."}
          </span>
        );
      case "speaking":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-violet-500/10 text-violet-600 border border-violet-500/20">
            <span className="w-2 h-2 rounded-full bg-violet-500 animate-ping"></span>
            Speaking Voice ({settings.voiceName})
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Multilingual VoiceBot Ready
          </span>
        );
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 lg:px-8 py-3.5 shadow-xs">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand & Status */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-cyan-500 flex items-center justify-center shadow-md text-white">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-900 tracking-tight">VoiceBot Agentic RAG</h1>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                  <Globe className="w-3 h-3 text-amber-600" /> Multilingual Voice
                </span>
              </div>
              <p className="text-xs text-slate-500">FastAPI Architecture & Multilingual Knowledge Base RAG</p>
            </div>
          </div>
          <div className="md:hidden">{getStatusBadge()}</div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center p-1 bg-slate-100/90 rounded-xl border border-slate-200 w-full md:w-auto overflow-x-auto">
          <button
            id="tab-voice-mode"
            onClick={() => setActiveTab("voice")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === "voice"
                ? "bg-white text-indigo-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            Live Voice
          </button>
          <button
            id="tab-transcript"
            onClick={() => setActiveTab("transcript")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === "transcript"
                ? "bg-white text-indigo-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Transcript & Trace
          </button>
          <button
            id="tab-knowledge-base"
            onClick={() => setActiveTab("kb")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === "kb"
                ? "bg-white text-indigo-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            Knowledge Base ({totalDocs})
          </button>
          <button
            id="tab-vector-explorer"
            onClick={() => setActiveTab("vector-search")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === "vector-search"
                ? "bg-white text-indigo-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            Vector Search
          </button>
          <button
            id="tab-python-backend"
            onClick={() => setActiveTab("python-backend")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === "python-backend"
                ? "bg-white text-amber-700 shadow-xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-amber-600" />
            Python Backend Code
          </button>
        </div>

        {/* Right Status & Controls */}
        <div className="hidden md:flex items-center gap-3">
          {getStatusBadge()}
          <button
            id="btn-open-settings"
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-xs transition-colors"
            title="Voice & Language Settings"
          >
            <Settings2 className="w-3.5 h-3.5 text-slate-500" />
            <span>Config</span>
          </button>
        </div>
      </div>
    </header>
  );
};
