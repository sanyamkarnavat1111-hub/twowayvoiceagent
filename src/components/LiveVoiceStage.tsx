import React, { useState, useEffect, useRef } from "react";
import { Mic, Volume2, Sparkles, Database, ArrowRight, Play, Square, Globe, ShieldCheck } from "lucide-react";
import { BotSettings, BotState, ChatMessage, LanguageCode, RetrievedChunkMatch } from "../types.js";
import { BrowserSpeechRecognizer, MicAudioVisualizer, VoiceSpeechEngine } from "../utils/audioUtils.js";

interface LiveVoiceStageProps {
  botState: BotState;
  setBotState: (state: BotState) => void;
  settings: BotSettings;
  setSettings: React.Dispatch<React.SetStateAction<BotSettings>>;
  messages: ChatMessage[];
  onSendMessage: (text: string, isVoice?: boolean) => Promise<void>;
  lastBotMessage?: ChatMessage;
  speechEngine: VoiceSpeechEngine;
}

const SAMPLE_MULTILINGUAL_QUERIES = [
  {
    lang: "en",
    flag: "🇺🇸",
    label: "English",
    query: "What is our enterprise cloud uptime SLA and credit policy?",
  },
  {
    lang: "es",
    flag: "🇪🇸",
    label: "Español",
    query: "¿Cuál es la política de reembolso para suscripciones anuales y mensuales?",
  },
  {
    lang: "hi",
    flag: "🇮🇳",
    label: "हिन्दी",
    query: "क्लाउड अपटाइम एसएलए और 99.99% से कम होने पर क्रेडिट पॉलिसी क्या है?",
  },
  {
    lang: "fr",
    flag: "🇫🇷",
    label: "Français",
    query: "Quelles sont les limites de débit d'API et la politique de webhook ?",
  },
  {
    lang: "de",
    flag: "🇩🇪",
    label: "Deutsch",
    query: "Wann leitet der VoiceBot das Gespräch an einen menschlichen Support-Mitarbeiter weiter?",
  },
  {
    lang: "ja",
    flag: "🇯🇵",
    label: "日本語",
    query: "エンタープライズクラウドの稼働率SLAと返金ポリシーを教えてください。",
  },
];

const LANGUAGE_OPTIONS: { code: LanguageCode; label: string; flag: string }[] = [
  { code: "auto", label: "Auto-Detect Language", flag: "🌐" },
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "es", label: "Español (Spanish)", flag: "🇪🇸" },
  { code: "hi", label: "हिन्दी (Hindi)", flag: "🇮🇳" },
  { code: "fr", label: "Français (French)", flag: "🇫🇷" },
  { code: "de", label: "Deutsch (German)", flag: "🇩🇪" },
  { code: "ja", label: "日本語 (Japanese)", flag: "🇯🇵" },
  { code: "zh", label: "中文 (Chinese)", flag: "🇨🇳" },
  { code: "pt", label: "Português", flag: "🇧🇷" },
  { code: "it", label: "Italiano", flag: "🇮🇹" },
  { code: "ar", label: "العربية", flag: "🇸🇦" },
];

export const LiveVoiceStage: React.FC<LiveVoiceStageProps> = ({
  botState,
  setBotState,
  settings,
  setSettings,
  messages,
  onSendMessage,
  lastBotMessage,
  speechEngine,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [micVolume, setMicVolume] = useState(0);
  const [textInput, setTextInput] = useState("");
  const [liveTranscript, setLiveTranscript] = useState("");
  const [selectedChunk, setSelectedChunk] = useState<RetrievedChunkMatch | null>(null);

  const recognizerRef = useRef<BrowserSpeechRecognizer | null>(null);
  const visualizerRef = useRef<MicAudioVisualizer | null>(null);

  useEffect(() => {
    recognizerRef.current = new BrowserSpeechRecognizer(settings.language);
    visualizerRef.current = new MicAudioVisualizer();

    return () => {
      visualizerRef.current?.stop();
      recognizerRef.current?.stopListening();
    };
  }, []);

  useEffect(() => {
    recognizerRef.current?.setLanguage(settings.language);
  }, [settings.language]);

  const handleStartListening = async () => {
    try {
      if (speechEngine.isSpeaking()) {
        speechEngine.stop();
      }

      setBotState("listening");
      setIsRecording(true);
      setLiveTranscript("");

      // Start waveform audio visualizer
      visualizerRef.current?.start((vol) => {
        setMicVolume(Math.min(1, vol * 3));
      });

      // Start browser multilingual speech recognition
      recognizerRef.current?.startListening(
        (transcript, isFinal) => {
          setLiveTranscript(transcript);
          if (isFinal && transcript.trim()) {
            handleFinalSpokenText(transcript.trim());
          }
        },
        (err) => {
          console.warn("Speech recognition notice:", err);
          setIsRecording(false);
          visualizerRef.current?.stop();
          setBotState("idle");
        },
        () => {
          if (isRecording) {
            setIsRecording(false);
            visualizerRef.current?.stop();
          }
        },
        settings.language
      );
    } catch (err: any) {
      console.error("Mic access or speech recognition error:", err);
      setBotState("idle");
      setIsRecording(false);
    }
  };

  const handleStopListening = () => {
    if (!isRecording) return;
    setIsRecording(false);
    visualizerRef.current?.stop();
    recognizerRef.current?.stopListening();

    if (liveTranscript.trim()) {
      handleFinalSpokenText(liveTranscript.trim());
    } else {
      setBotState("idle");
    }
  };

  const handleFinalSpokenText = async (text: string) => {
    setIsRecording(false);
    visualizerRef.current?.stop();
    recognizerRef.current?.stopListening();
    setLiveTranscript("");
    await onSendMessage(text, true);
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim() || botState !== "idle") return;
    const query = textInput.trim();
    setTextInput("");
    onSendMessage(query, false);
  };

  const handleReplayVoice = (message: ChatMessage) => {
    setBotState("speaking");
    speechEngine.speak(
      message.content,
      settings.voiceName,
      message.detectedLanguage || "en",
      () => setBotState("speaking"),
      () => setBotState("idle")
    );
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">
      {/* Dynamic Voice Sphere & Interaction Hub */}
      <div className="bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 md:p-10 text-white shadow-xl relative overflow-hidden border border-indigo-900/40">
        {/* Ambient Glows */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center">
          {/* Status & Language Select Subtitle */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-indigo-200">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Multilingual Voice RAG • Persona: {settings.voiceName}
            </span>

            {/* Language Quick Dropdown */}
            <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/15 text-xs">
              <Globe className="w-3.5 h-3.5 text-amber-400" />
              <select
                id="voice-language-selector"
                value={settings.language}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    language: e.target.value as LanguageCode,
                  }))
                }
                className="bg-transparent text-white text-xs font-medium focus:outline-none cursor-pointer"
              >
                {LANGUAGE_OPTIONS.map((opt) => (
                  <option key={opt.code} value={opt.code} className="bg-slate-900 text-white">
                    {opt.flag} {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Animated Central Voice Orb */}
          <div className="relative flex items-center justify-center my-4">
            <div
              className={`absolute w-56 h-56 rounded-full transition-all duration-300 pointer-events-none ${
                botState === "listening"
                  ? "bg-emerald-500/20 animate-ping scale-110"
                  : botState === "speaking"
                  ? "bg-violet-500/20 animate-pulse scale-105"
                  : botState === "retrieving" || botState === "thinking"
                  ? "bg-amber-500/20 animate-pulse"
                  : "bg-indigo-500/10"
              }`}
              style={{
                transform: isRecording ? `scale(${1 + micVolume * 0.4})` : undefined,
              }}
            />
            <div
              className={`absolute w-44 h-44 rounded-full transition-all duration-200 ${
                botState === "listening"
                  ? "bg-emerald-500/30 blur-md"
                  : botState === "speaking"
                  ? "bg-violet-500/30 blur-md"
                  : "bg-indigo-500/20 blur-sm"
              }`}
            />

            {/* Main Interactive Mic Orb Button */}
            <button
              id="voice-mic-orb-button"
              onClick={isRecording ? handleStopListening : handleStartListening}
              disabled={botState !== "idle" && botState !== "listening"}
              className={`relative z-20 w-32 h-32 rounded-full flex flex-col items-center justify-center transition-all transform shadow-2xl cursor-pointer ${
                isRecording
                  ? "bg-gradient-to-tr from-rose-500 via-rose-600 to-amber-500 hover:scale-105 ring-4 ring-rose-400/50"
                  : botState === "speaking"
                  ? "bg-gradient-to-tr from-violet-600 via-indigo-600 to-purple-500 ring-4 ring-violet-400/50 animate-pulse"
                  : botState === "retrieving" || botState === "thinking"
                  ? "bg-gradient-to-tr from-amber-500 via-orange-500 to-indigo-600 ring-4 ring-amber-400/50"
                  : "bg-gradient-to-tr from-indigo-600 via-violet-600 to-cyan-500 hover:scale-105 ring-4 ring-indigo-400/30"
              }`}
            >
              {isRecording ? (
                <>
                  <Square className="w-9 h-9 text-white mb-1" />
                  <span className="text-[11px] font-bold tracking-wider uppercase">Tap to Finish</span>
                </>
              ) : botState === "speaking" ? (
                <>
                  <Volume2 className="w-10 h-10 text-white mb-1 animate-bounce" />
                  <span className="text-[10px] font-bold tracking-wider uppercase">Speaking</span>
                </>
              ) : botState === "retrieving" ? (
                <>
                  <Database className="w-9 h-9 text-amber-200 mb-1 animate-spin" />
                  <span className="text-[10px] font-bold tracking-wider uppercase">Vector RAG</span>
                </>
              ) : botState === "thinking" ? (
                <>
                  <Sparkles className="w-9 h-9 text-white mb-1 animate-spin" />
                  <span className="text-[10px] font-bold tracking-wider uppercase">Reasoning</span>
                </>
              ) : (
                <>
                  <Mic className="w-10 h-10 text-white mb-1" />
                  <span className="text-[11px] font-bold tracking-wider uppercase">Tap to Speak</span>
                </>
              )}
            </button>
          </div>

          {/* Voice Prompt & Instructions */}
          <div className="mt-4 max-w-lg">
            <h2 className="text-xl font-bold text-slate-100">
              {botState === "listening"
                ? liveTranscript
                  ? `"${liveTranscript}"`
                  : "Listening... Speak in any language (English, Spanish, Hindi, French, etc.)"
                : botState === "transcribing"
                ? "Processing speech..."
                : botState === "retrieving"
                ? "Searching vector database for matching documentation..."
                : botState === "thinking"
                ? "Formulating grounded response in your language..."
                : botState === "speaking"
                ? "Speaking answer in your language..."
                : "Ask any question in your preferred language"}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Speak in English, Spanish (Español), Hindi (हिन्दी), French (Français), German (Deutsch), or Japanese. The VoiceBot will formulate and speak the answer in the exact same language.
            </p>
          </div>

          {/* Live Waveform Indicator when recording */}
          {isRecording && (
            <div className="flex items-center gap-1 mt-4 h-6">
              {[...Array(14)].map((_, i) => (
                <div
                  key={i}
                  className="w-1.5 bg-emerald-400 rounded-full transition-all duration-75"
                  style={{
                    height: `${Math.max(4, Math.random() * 24 * (micVolume + 0.3))}px`,
                  }}
                />
              ))}
            </div>
          )}

          {/* Multilingual Starter Prompts */}
          <div className="w-full mt-6 pt-6 border-t border-white/10">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 text-left flex items-center justify-between">
              <span>Try asking in multiple languages:</span>
              <span className="text-[11px] text-amber-300 font-normal">Answers are spoken in the matching language</span>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-left">
              {SAMPLE_MULTILINGUAL_QUERIES.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => onSendMessage(item.query, false)}
                  disabled={botState !== "idle"}
                  className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-200 hover:text-white flex flex-col justify-between group transition-all text-left"
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="font-semibold text-amber-300 text-[10px]">
                      {item.flag} {item.label}
                    </span>
                    <ArrowRight className="w-3 h-3 text-indigo-400 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <span className="truncate w-full text-slate-300 text-[11px]">{item.query}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Latest Conversational Turn Card with Grounding & Audio Replay */}
      {lastBotMessage && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                AI
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-slate-900">VoiceBot Answer</h3>
                  {lastBotMessage.languageName && (
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                      <Globe className="w-2.5 h-2.5" /> {lastBotMessage.languageName}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500">
                  Synthesized with Persona: {settings.voiceName}
                </p>
              </div>
            </div>

            <button
              onClick={() => handleReplayVoice(lastBotMessage)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
            >
              <Play className="w-3.5 h-3.5 fill-indigo-700" />
              Replay Spoken Audio
            </button>
          </div>

          <p className="text-slate-800 text-sm leading-relaxed whitespace-pre-line">
            {lastBotMessage.content}
          </p>

          {/* Retrieved Grounding Vector Chunks */}
          {lastBotMessage.retrievedChunks && lastBotMessage.retrievedChunks.length > 0 && (
            <div className="mt-2 pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-indigo-600" />
                  Grounded from {lastBotMessage.retrievedChunks.length} Knowledge Base Chunks
                </span>
                <span className="text-[11px] text-slate-500">
                  Top Cosine Similarity: {(lastBotMessage.retrievedChunks[0].similarity * 100).toFixed(1)}%
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {lastBotMessage.retrievedChunks.map((match, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedChunk(match)}
                    className="p-2.5 rounded-xl bg-slate-50 hover:bg-indigo-50/50 border border-slate-200/80 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-indigo-900 truncate">
                        {match.chunk.docTitle}
                      </span>
                      <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-indigo-100 text-indigo-800">
                        {Math.round(match.similarity * 100)}% match
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2">{match.chunk.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Manual Text Input Fallback Bar */}
      <form onSubmit={handleTextSubmit} className="flex items-center gap-2">
        <input
          type="text"
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          placeholder="Type question in English, Spanish (Español), Hindi (हिन्दी), French, German..."
          disabled={botState !== "idle"}
          className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs"
        />
        <button
          type="submit"
          disabled={!textInput.trim() || botState !== "idle"}
          className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-medium text-sm rounded-xl transition-colors shadow-xs"
        >
          Ask Bot
        </button>
      </form>

      {/* Chunk Detail Popover Modal */}
      {selectedChunk && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                  {selectedChunk.chunk.category}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">{selectedChunk.chunk.docTitle}</h3>
              </div>
              <span className="px-2 py-1 text-xs font-bold rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                {(selectedChunk.similarity * 100).toFixed(1)}% Similarity
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 max-h-64 overflow-y-auto text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
              {selectedChunk.chunk.content}
            </div>

            <div className="mt-4 flex justify-between items-center text-xs text-slate-500">
              <span>Chunk ID: {selectedChunk.chunk.id}</span>
              <button
                onClick={() => setSelectedChunk(null)}
                className="px-4 py-1.5 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
