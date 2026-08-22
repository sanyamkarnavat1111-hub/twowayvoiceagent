import React from "react";
import { X, Volume2, Sparkles, Sliders, Shield, Play } from "lucide-react";
import { BotSettings, VoiceName } from "../types.js";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: BotSettings;
  onSaveSettings: (settings: BotSettings) => void;
  onTestVoice: (voiceName: VoiceName) => void;
}

const AVAILABLE_VOICES: { name: VoiceName; gender: string; description: string }[] = [
  { name: "Kore", gender: "Female", description: "Clear, warm, natural pacing" },
  { name: "Puck", gender: "Male", description: "Energetic, engaging, friendly" },
  { name: "Fenrir", gender: "Male", description: "Deep, authoritative, executive tone" },
  { name: "Zephyr", gender: "Female", description: "Calm, supportive, melodic" },
  { name: "Charon", gender: "Male", description: "Precise, confident, informative" },
];

const AVAILABLE_MODELS = [
  { id: "gemini-3.7-flash", name: "Gemini 3.7 Flash (Default)", desc: "High reasoning, ultra-fast latency" },
  { id: "gemini-3.5-flash", name: "Gemini 3.5 Flash", desc: "General tasks, balanced speed" },
  { id: "gemini-3.1-flash-lite", name: "Gemini 3.1 Flash Lite", desc: "Lowest latency for voice turnarounds" },
  { id: "gemini-3.1-pro-preview", name: "Gemini 3.1 Pro Preview", desc: "Complex multi-policy reasoning" },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onTestVoice,
}) => {
  if (!isOpen) return null;

  const [localSettings, setLocalSettings] = React.useState<BotSettings>(settings);

  const handleSave = () => {
    onSaveSettings(localSettings);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">VoiceBot & RAG Configuration</h3>
              <p className="text-xs text-slate-500">Tune TTS voice models, vector similarity, and LLM reasoning</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-5">
          {/* TTS Voice Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Gemini TTS Voice (gemini-3.1-flash-tts-preview)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {AVAILABLE_VOICES.map((v) => (
                <div
                  key={v.name}
                  onClick={() => setLocalSettings({ ...localSettings, voiceName: v.name })}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                    localSettings.voiceName === v.name
                      ? "bg-indigo-50 border-indigo-300 ring-1 ring-indigo-200"
                      : "bg-white border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-900">{v.name}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                        {v.gender}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">{v.description}</p>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onTestVoice(v.name);
                    }}
                    className="p-1.5 text-indigo-600 hover:bg-indigo-100 rounded-lg"
                    title={`Test voice ${v.name}`}
                  >
                    <Play className="w-3.5 h-3.5 fill-indigo-600" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Model Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Gemini Intelligence Model
            </label>
            <select
              value={localSettings.model}
              onChange={(e) => setLocalSettings({ ...localSettings, model: e.target.value as any })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white font-medium"
            >
              {AVAILABLE_MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} — {m.desc}
                </option>
              ))}
            </select>
          </div>

          {/* Vector Retrieval Top-K and Similarity Threshold */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div>
              <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                <span>Top-K Chunks: {localSettings.topK}</span>
              </div>
              <input
                type="range"
                min="1"
                max="6"
                step="1"
                value={localSettings.topK}
                onChange={(e) => setLocalSettings({ ...localSettings, topK: Number(e.target.value) })}
                className="w-full accent-indigo-600"
              />
              <span className="text-[10px] text-slate-400">Number of documentation chunks to feed into prompt</span>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                <span>Min Similarity: {localSettings.similarityThreshold}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.7"
                step="0.05"
                value={localSettings.similarityThreshold}
                onChange={(e) =>
                  setLocalSettings({ ...localSettings, similarityThreshold: Number(e.target.value) })
                }
                className="w-full accent-indigo-600"
              />
              <span className="text-[10px] text-slate-400">Cosine threshold to filter irrelevant chunks</span>
            </div>
          </div>

          {/* Toggles */}
          <div className="flex flex-col gap-2.5">
            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 cursor-pointer">
              <span className="text-xs font-semibold text-slate-800">Auto-Synthesize Voice (Gemini TTS)</span>
              <input
                type="checkbox"
                checked={localSettings.autoSpeak}
                onChange={(e) => setLocalSettings({ ...localSettings, autoSpeak: e.target.checked })}
                className="w-4 h-4 accent-indigo-600 rounded"
              />
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-5 mt-5 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};
