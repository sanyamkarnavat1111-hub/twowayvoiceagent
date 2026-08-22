import React, { useState } from "react";
import { Database, Plus, Trash2, RotateCcw, FileText, Layers, Tag, ExternalLink, Check, AlertCircle } from "lucide-react";
import { CompanyDocument } from "../types.js";

interface KnowledgeBaseManagerProps {
  documents: CompanyDocument[];
  totalChunks: number;
  onAddDocument: (doc: { title: string; category: string; description: string; content: string; tags: string[] }) => Promise<void>;
  onDeleteDocument: (id: string) => Promise<void>;
  onResetKB: () => Promise<void>;
  isLoading: boolean;
}

export const KnowledgeBaseManager: React.FC<KnowledgeBaseManagerProps> = ({
  documents,
  totalChunks,
  onAddDocument,
  onDeleteDocument,
  onResetKB,
  isLoading,
}) => {
  const [selectedDoc, setSelectedDoc] = useState<CompanyDocument | null>(documents[0] || null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Form states
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("Enterprise Policies");
  const [newDescription, setNewDescription] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newTags, setNewTags] = useState("Documentation, Policy");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    setIsSubmitting(true);
    try {
      const tagsArray = newTags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      await onAddDocument({
        title: newTitle.trim(),
        category: newCategory.trim(),
        description: newDescription.trim(),
        content: newContent.trim(),
        tags: tagsArray,
      });

      setNewTitle("");
      setNewDescription("");
      setNewContent("");
      setIsAddModalOpen(false);
    } catch (err) {
      console.error("Failed to add document:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = async () => {
    if (confirm("Reset Knowledge Base to default enterprise documents (SLA, Billing, APIs, Support)?")) {
      setIsResetting(true);
      await onResetKB();
      setIsResetting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6">
      {/* Header Stats & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">Company Documentation Vector Store</h2>
            <span className="px-2 py-0.5 text-xs font-semibold rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
              Active Vector DB
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Dynamic knowledge base queried via vector cosine similarity during customer voice conversations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-4 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Documents</span>
              <span className="font-bold text-slate-900">{documents.length}</span>
            </div>
            <div className="w-px h-6 bg-slate-200" />
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Vector Chunks</span>
              <span className="font-bold text-indigo-600">{totalChunks}</span>
            </div>
          </div>

          <button
            onClick={handleReset}
            disabled={isResetting}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-xs transition-colors"
            title="Reset Knowledge Base"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? "animate-spin" : ""}`} />
            <span>Reset Defaults</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Document</span>
          </button>
        </div>
      </div>

      {/* Main Two-Column Document Explorer */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left Column: Document List */}
        <div className="md:col-span-5 flex flex-col gap-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
            Indexed Documents ({documents.length})
          </h3>
          <div className="space-y-2.5">
            {documents.map((doc) => (
              <div
                key={doc.id}
                onClick={() => setSelectedDoc(doc)}
                className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                  selectedDoc?.id === doc.id
                    ? "bg-indigo-50/70 border-indigo-300 ring-1 ring-indigo-200 shadow-xs"
                    : "bg-white border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/50"
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-slate-100 text-slate-700">
                    {doc.category}
                  </span>
                  <span className="text-[11px] font-semibold text-indigo-600 flex items-center gap-1">
                    <Layers className="w-3 h-3" /> {doc.chunksCount} chunks
                  </span>
                </div>

                <h4 className="text-sm font-bold text-slate-900 leading-snug mb-1">{doc.title}</h4>
                <p className="text-xs text-slate-500 line-clamp-2">{doc.description || doc.content}</p>

                {doc.tags && doc.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2.5">
                    {doc.tags.map((tag, i) => (
                      <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Document Details & Markdown Preview */}
        <div className="md:col-span-7 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col gap-4">
          {selectedDoc ? (
            <>
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div>
                  <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
                    {selectedDoc.category}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 mt-0.5">{selectedDoc.title}</h3>
                  <p className="text-xs text-slate-500 mt-1">{selectedDoc.description}</p>
                </div>

                {documents.length > 1 && (
                  <button
                    onClick={() => onDeleteDocument(selectedDoc.id)}
                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Delete document and vector chunks"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Document Content (Markdown)
                </h4>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs font-mono text-slate-800 whitespace-pre-wrap max-h-96 overflow-y-auto leading-relaxed">
                  {selectedDoc.content}
                </div>
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-slate-400 text-sm">Select a document to inspect</div>
          )}
        </div>
      </div>

      {/* Add Document Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Add Company Documentation</h3>
            <p className="text-xs text-slate-500 mb-4">
              The content will be split into semantic chunks and indexed into the vector store.
            </p>

            <form onSubmit={handleCreateDoc} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Document Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. SOC2 Compliance & Data Privacy Guidelines"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Category</label>
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="e.g. Compliance"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tags (Comma separated)</label>
                  <input
                    type="text"
                    value={newTags}
                    onChange={(e) => setNewTags(e.target.value)}
                    placeholder="Security, SOC2, Privacy"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Short Description</label>
                <input
                  type="text"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Brief overview of the document..."
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Full Document Content (Markdown Supported)
                </label>
                <textarea
                  required
                  rows={8}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="# Enter markdown headings, bullet points, policies, numerical guarantees..."
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !newTitle.trim() || !newContent.trim()}
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 rounded-lg"
                >
                  {isSubmitting ? "Chunking & Embedding..." : "Index Document into Vector DB"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
