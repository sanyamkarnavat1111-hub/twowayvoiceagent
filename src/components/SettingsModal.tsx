import React, { useState } from "react";
import { X, Volume2, Sparkles, Sliders, Globe, Shield, RefreshCw } from "lucide-react";
import { BotSettings, LanguageCode, VoiceName } from "../types.js";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: BotSettings;
  onSaveSettings: (settings: BotSettings) => void;
  onTestVoice: (voiceName: VoiceName, lang: LanguageCode) => void;
}

const VOICE_OPTIONS: { name: VoiceName; label: string; desc: string }[] = [
  { name: "Kore", label: "Kore (Natural Female)", desc: "Calm, clear, and professional tone." },
  { name: "Puck", label: "Puck (Energetic Male)", desc: "Friendly, upbeat, and quick pace." },
  { name: "Fenrir", label: "Fenrir (Deep Authority)", desc: "Deep, authoritative voice for technical data." },
  { name: "Zephyr", label: "Zephyr (Soft Warm)", desc: "Gentle and patient support specialist." },
  { name: "Charon", label: "Charon (Balanced Neutral)", desc: "Neutral, crisp cadence." },
];

const LANGUAGE_OPTIONS: { code: LanguageCode; label: string; flag: string }[] = [
  { code: "auto", label: "Auto-Detect Language (Spoken/Input)", flag: "🌐" },
  { code: "en", label: "English (US / UK)", flag: "🇺🇸" },
  { code: "es", label: "Español (Spanish)", flag: "🇪🇸" },
  { code: "hi", label: "हिन्दी (Hindi)", flag: "🇮🇳" },
  { code: "fr", label: "Français (French)", flag: "🇫🇷" },
  { code: "de", label: "Deutsch (German)", flag: "🇩🇪" },
  { code: "ja", label: "日本語 (Japanese)", flag: "🇯🇵" },
  { code: "zh", label: "中文 (Chinese)", flag: "🇨🇳" },
  { code: "pt", label: "Português (Portuguese)", flag: "🇧🇷" },
  { code: "it", label: "Italiano (Italian)", flag: "🇮🇹" },
  { code: "ar", label: "العربية (Arabic)", flag: "🇸🇦" },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onTestVoice,
}) => {
  const [localSettings, setLocalSettings] = useState<BotSettings>({ ...settings });

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveSettings(localSettings);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">VoiceBot & Multilingual Configuration</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Settings Body */}
        <div className="p-6 space-y-6">
          {/* Multilingual Voice Language */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-indigo-600" /> Spoken Input & Output Language
            </label>
            <select
              value={localSettings.language}
              onChange={(e) =>
                setLocalSettings({
                  ...localSettings,
                  language: e.target.value as LanguageCode,
                })
              }
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {LANGUAGE_OPTIONS.map((opt) => (
                <option key={opt.code} value={opt.code}>
                  {opt.flag} {opt.label}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-500 mt-1">
              In "Auto-Detect", the VoiceBot dynamically detects whether you speak in English, Spanish, Hindi, French, German, or Japanese, and speaks back in the matching tongue.
            </p>
          </div>

          {/* Voice Persona Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-indigo-600" /> Voice Synthesis Persona
            </label>
            <div className="space-y-2">
              {VOICE_OPTIONS.map((voice) => (
                <div
                  key={voice.name}
                  onClick={() => setLocalSettings({ ...localSettings, voiceName: voice.name })}
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    localSettings.voiceName === voice.name
                      ? "bg-indigo-50/70 border-indigo-500 shadow-xs"
                      : "bg-slate-50 hover:bg-slate-100 border-slate-200"
                  }`}
                >
                  <div>
                    <div className="text-sm font-bold text-slate-900">{voice.label}</div>
                    <div className="text-xs text-slate-500">{voice.desc}</div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onTestVoice(voice.name, localSettings.language);
                    }}
                    className="px-3 py-1 text-xs font-semibold text-indigo-700 bg-white border border-indigo-200 hover:bg-indigo-50 rounded-lg transition-colors shadow-xs"
                  >
                    Test Audio
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Auto Speak Audio Toggle */}
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <div className="text-sm font-semibold text-slate-800">Auto-Play Spoken Voice</div>
              <div className="text-xs text-slate-500">Automatically synthesize and speak answers immediately upon generation</div>
            </div>
            <input
              type="checkbox"
              checked={localSettings.autoSpeak}
              onChange={(e) => setLocalSettings({ ...localSettings, autoSpeak: e.target.checked })}
              className="w-5 h-5 accent-indigo-600 cursor-pointer"
            />
          </div>

          {/* Vector Retrieval Hyperparameters */}
          <div className="space-y-4 pt-2 border-t border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Vector Retrieval Hyperparameters
            </h3>

            {/* Top-K Chunks */}
            <div>
              <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                <span>Top-K Context Chunks:</span>
                <span className="font-bold text-indigo-600">{localSettings.topK}</span>
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
            </div>

            {/* Cosine Similarity Threshold */}
            <div>
              <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                <span>Minimum Cosine Threshold:</span>
                <span className="font-bold text-indigo-600">{localSettings.similarityThreshold}</span>
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
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2 sticky bottom-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};
