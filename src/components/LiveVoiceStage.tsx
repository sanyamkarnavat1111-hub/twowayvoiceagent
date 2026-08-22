import React, { useState, useEffect, useRef } from "react";
import { Mic, Volume2, Sparkles, Database, ArrowRight, Play, Square, RefreshCw, Zap, Radio, CheckCircle2, ShieldCheck } from "lucide-react";
import { BotSettings, BotState, ChatMessage, RetrievedChunkMatch } from "../types.js";
import { BrowserSpeechRecognizer, MicAudioVisualizer, VoiceSpeechEngine } from "../utils/audioUtils.js";

interface LiveVoiceStageProps {
  botState: BotState;
  setBotState: (state: BotState) => void;
  settings: BotSettings;
  messages: ChatMessage[];
  onSendMessage: (text: string, isVoice?: boolean) => Promise<void>;
  lastBotMessage?: ChatMessage;
  speechEngine: VoiceSpeechEngine;
}

const SAMPLE_VOICE_QUERIES = [
  "What is our enterprise cloud uptime SLA and credit policy?",
  "What is our refund policy for annual vs monthly subscriptions?",
  "What are our developer API rate limits and webhook retry schedules?",
  "When does the voice bot trigger live human engineer hand-off?",
];

export const LiveVoiceStage: React.FC<LiveVoiceStageProps> = ({
  botState,
  setBotState,
  settings,
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
    recognizerRef.current = new BrowserSpeechRecognizer();
    visualizerRef.current = new MicAudioVisualizer();

    return () => {
      visualizerRef.current?.stop();
      recognizerRef.current?.stopListening();
    };
  }, []);

  const handleStartListening = async () => {
    try {
      if (speechEngine.isSpeaking()) {
        speechEngine.stop();
      }

      setBotState("listening");
      setIsRecording(true);
      setLiveTranscript("");

      // Start audio waveform visualizer
      visualizerRef.current?.start((vol) => {
        setMicVolume(Math.min(1, vol * 3));
      });

      // Start browser speech recognition
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
          // If stopped without final event but we have transcript
          if (isRecording) {
            setIsRecording(false);
            visualizerRef.current?.stop();
          }
        }
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
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center">
          {/* Status Subtitle */}
          <div className="flex items-center gap-2 mb-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-indigo-200">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              TypeScript Client Vector RAG • Zero-Exhaustion Safe • Voice: {settings.voiceName}
            </span>
          </div>

          {/* Animated Central Voice Orb */}
          <div className="relative flex items-center justify-center my-4">
            {/* Outer pulsating rings */}
            <div
              className={`absolute w-56 h-56 rounded-full transition-all duration-300 pointer-events-none ${
                botState === "listening"
                  ? "bg-emerald-500/20 animate-ping scale-110"
                  : botState === "speaking"
                  ? "bg-violet-500/20 animate-pulse scale-105"
                  : botState === "retrieving" || botState === "thinking"
                  ? "bg-cyan-500/20 animate-pulse"
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
                  ? "bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 ring-4 ring-cyan-400/50"
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
                  <Database className="w-9 h-9 text-cyan-200 mb-1 animate-spin" />
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
          <div className="mt-4 max-w-md">
            <h2 className="text-xl font-bold text-slate-100">
              {botState === "listening"
                ? liveTranscript
                  ? `"${liveTranscript}"`
                  : "Listening... Speak your question now"
                : botState === "transcribing"
                ? "Processing speech..."
                : botState === "retrieving"
                ? "Searching vector database for matching documentation..."
                : botState === "thinking"
                ? "Formulating voice response..."
                : botState === "speaking"
                ? "Answering with voice output..."
                : "Ask any company documentation question"}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Ask about SLAs (99.99%), disaster recovery RPO/RTO, refund policies, API rate limits, or support escalation protocols.
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

          {/* Quick Query Starter Pills */}
          <div className="w-full mt-6 pt-6 border-t border-white/10">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 text-left">
              Try asking about our documentation:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
              {SAMPLE_VOICE_QUERIES.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => onSendMessage(q, false)}
                  disabled={botState !== "idle"}
                  className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-200 hover:text-white flex items-center justify-between group transition-all text-left"
                >
                  <span className="truncate pr-2">{q}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-indigo-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Latest Conversational Turn Card with Grounding & Audio Replay */}
      {lastBotMessage && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                AI
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Latest VoiceBot Response</h3>
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
              Replay Voice
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
          placeholder="Or type a question to query company documentation..."
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
