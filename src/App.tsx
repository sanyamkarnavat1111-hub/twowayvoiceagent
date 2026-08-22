/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { VoiceBotHeader } from "./components/VoiceBotHeader.js";
import { LiveVoiceStage } from "./components/LiveVoiceStage.js";
import { TranscriptView } from "./components/TranscriptView.js";
import { KnowledgeBaseManager } from "./components/KnowledgeBaseManager.js";
import { VectorSearchWorkbench } from "./components/VectorSearchWorkbench.js";
import { SettingsModal } from "./components/SettingsModal.js";
import { BotSettings, BotState, ChatMessage, CompanyDocument, VoiceName } from "./types.js";
import { VoiceSpeechEngine } from "./utils/audioUtils.js";
import { vectorStoreInstance } from "./utils/vectorStore.js";
import { executeAgenticRAG } from "./utils/ragEngine.js";

const DEFAULT_SETTINGS: BotSettings = {
  voiceName: "Kore",
  model: "gemini-3.7-flash",
  topK: 3,
  similarityThreshold: 0.25,
  handsFreeMode: false,
  autoSpeak: true,
  systemInstruction: "",
  chunkSize: 450,
  chunkOverlap: 60,
};

export default function App() {
  const [activeTab, setActiveTab] = useState<"voice" | "transcript" | "kb" | "vector-search">("voice");
  const [botState, setBotState] = useState<BotState>("idle");
  const [settings, setSettings] = useState<BotSettings>(DEFAULT_SETTINGS);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [documents, setDocuments] = useState<CompanyDocument[]>([]);
  const [totalChunks, setTotalChunks] = useState(0);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);

  const speechEngineRef = useRef<VoiceSpeechEngine>(new VoiceSpeechEngine());

  // Refresh knowledge base state from vector store
  const refreshDocuments = () => {
    setIsLoadingDocs(true);
    try {
      const docs = vectorStoreInstance.getDocuments();
      const chunksCount = vectorStoreInstance.getTotalChunksCount();
      setDocuments([...docs]);
      setTotalChunks(chunksCount);
    } catch (err) {
      console.error("Failed to load documents from vector store:", err);
    } finally {
      setIsLoadingDocs(false);
    }
  };

  useEffect(() => {
    refreshDocuments();
  }, []);

  // Handle customer query (voice or text)
  const handleSendMessage = async (text: string, isVoice: boolean = false) => {
    if (!text.trim()) return;

    // 1. Add User Message
    const userMessage: ChatMessage = {
      id: `msg-user-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: Date.now(),
      isVoiceInput: isVoice,
    };

    setMessages((prev) => [...prev, userMessage]);
    setBotState("retrieving");

    try {
      // 2. Execute Client-Side Agentic RAG Pipeline
      const historyPayload = messages.slice(-8).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      // Simulate step transition for visual feedback
      setBotState("thinking");

      const ragResult = await executeAgenticRAG(text, historyPayload, settings);

      // 3. Create Assistant Message
      const botMessage: ChatMessage = {
        id: `msg-bot-${Date.now()}`,
        role: "assistant",
        content: ragResult.answer,
        timestamp: Date.now(),
        retrievedChunks: ragResult.retrievedChunks,
        agentTrace: ragResult.agentTrace,
      };

      setMessages((prev) => [...prev, botMessage]);

      // 4. Play Voice Output (if autoSpeak is on)
      if (settings.autoSpeak) {
        setBotState("speaking");
        speechEngineRef.current.speak(
          ragResult.answer,
          settings.voiceName,
          () => setBotState("speaking"),
          () => setBotState("idle")
        );
      } else {
        setBotState("idle");
      }
    } catch (err: any) {
      console.error("Error executing RAG voice chat:", err);
      const errorMessage: ChatMessage = {
        id: `msg-err-${Date.now()}`,
        role: "assistant",
        content: `I encountered an issue querying the company documentation: ${err.message}. Please verify the query and try again.`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      setBotState("idle");
    }
  };

  // Add Document to Client Vector DB
  const handleAddDocument = async (docData: {
    title: string;
    category: string;
    description: string;
    content: string;
    tags: string[];
  }) => {
    vectorStoreInstance.addDocument(docData);
    refreshDocuments();
  };

  // Delete Document from Client Vector DB
  const handleDeleteDocument = async (id: string) => {
    vectorStoreInstance.deleteDocument(id);
    refreshDocuments();
  };

  // Reset Knowledge Base to Defaults
  const handleResetKB = async () => {
    vectorStoreInstance.resetToDefaults();
    refreshDocuments();
  };

  // Test Voice Persona
  const handleTestVoice = (voiceName: VoiceName) => {
    speechEngineRef.current.speak(
      `Hello! This is voice persona ${voiceName}. I am configured to answer your company documentation questions.`,
      voiceName
    );
  };

  const lastBotMessage = [...messages].reverse().find((m) => m.role === "assistant");

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased selection:bg-indigo-500 selection:text-white">
      {/* App Header */}
      <VoiceBotHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        botState={botState}
        settings={settings}
        onOpenSettings={() => setIsSettingsOpen(true)}
        totalDocs={documents.length}
      />

      {/* Main Interactive Stage */}
      <main className="flex-1 px-4 lg:px-8 py-6 max-w-7xl w-full mx-auto">
        {activeTab === "voice" && (
          <LiveVoiceStage
            botState={botState}
            setBotState={setBotState}
            settings={settings}
            messages={messages}
            onSendMessage={handleSendMessage}
            lastBotMessage={lastBotMessage}
            speechEngine={speechEngineRef.current}
          />
        )}

        {activeTab === "transcript" && (
          <TranscriptView
            messages={messages}
            speechEngine={speechEngineRef.current}
            settings={settings}
          />
        )}

        {activeTab === "kb" && (
          <KnowledgeBaseManager
            documents={documents}
            totalChunks={totalChunks}
            onAddDocument={handleAddDocument}
            onDeleteDocument={handleDeleteDocument}
            onResetKB={handleResetKB}
            isLoading={isLoadingDocs}
          />
        )}

        {activeTab === "vector-search" && <VectorSearchWorkbench />}
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={(newSettings) => setSettings(newSettings)}
        onTestVoice={handleTestVoice}
      />
    </div>
  );
}
