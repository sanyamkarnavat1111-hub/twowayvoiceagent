import React, { useState } from "react";
import { Search, Sparkles, Database, Layers, ArrowRight, CheckCircle2, Clock, Zap } from "lucide-react";
import { RetrievedChunkMatch } from "../types.js";
import { vectorStoreInstance } from "../utils/vectorStore.js";

export const VectorSearchWorkbench: React.FC = () => {
  const [query, setQuery] = useState("What happens if monthly uptime falls below 99.9%?");
  const [topK, setTopK] = useState(4);
  const [minSimilarity, setMinSimilarity] = useState(0.2);
  const [matches, setMatches] = useState<RetrievedChunkMatch[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchDuration, setSearchDuration] = useState<number | null>(null);

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      const result = vectorStoreInstance.searchSimilarChunks(
        query.trim(),
        topK,
        minSimilarity
      );
      setMatches(result.matches);
      setSearchDuration(result.durationMs);
    } catch (err) {
      console.error("Vector search failed:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const SAMPLE_TEST_QUERIES = [
    "What is the RTO and RPO for disaster recovery?",
    "Can enterprise customers pay via Net-30 invoice wire transfers?",
    "What HTTP status is returned when rate limits are exceeded?",
    "When will the voice bot transfer me to a human tier-2 engineer?",
  ];

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6">
      {/* Search Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-lg font-bold text-slate-900">Vector Search & Cosine Distance Tester</h2>
          <span className="px-2 py-0.5 text-xs font-semibold rounded bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
            <Zap className="w-3 h-3 text-emerald-600" /> Client Vector Engine
          </span>
        </div>
        <p className="text-xs text-slate-500 mb-5">
          Test semantic vector similarity calculations, chunk ranking, and retrieval threshold tuning in real time directly in TypeScript.
        </p>

        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter query to compute cosine similarity against vector database..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button
              type="submit"
              disabled={isSearching || !query.trim()}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white font-semibold text-sm rounded-xl transition-colors shadow-xs"
            >
              {isSearching ? "Computing..." : "Run Vector Search"}
            </button>
          </div>

          {/* Hyperparameter Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>Top-K Chunks to Retrieve: {topK}</span>
              </div>
              <input
                type="range"
                min="1"
                max="8"
                step="1"
                value={topK}
                onChange={(e) => setTopK(Number(e.target.value))}
                className="w-full accent-indigo-600"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>Minimum Similarity Cutoff: {minSimilarity}</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.8"
                step="0.05"
                value={minSimilarity}
                onChange={(e) => setMinSimilarity(Number(e.target.value))}
                className="w-full accent-indigo-600"
              />
            </div>
          </div>

          {/* Sample Prompts */}
          <div className="flex flex-wrap items-center gap-1.5 pt-2">
            <span className="text-[11px] font-semibold text-slate-400">Sample queries:</span>
            {SAMPLE_TEST_QUERIES.map((q, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setQuery(q);
                  const res = vectorStoreInstance.searchSimilarChunks(q, topK, minSimilarity);
                  setMatches(res.matches);
                  setSearchDuration(res.durationMs);
                }}
                className="px-2.5 py-1 text-xs rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </form>
      </div>

      {/* Results Section */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Retrieved Matches ({matches.length})
          </h3>
          {searchDuration !== null && (
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Search Duration: {searchDuration}ms
            </span>
          )}
        </div>

        {matches.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
            No matching chunks found with the current similarity cutoff. Try lowering the threshold or entering a new query.
          </div>
        ) : (
          <div className="space-y-3">
            {matches.map((m, idx) => (
              <div
                key={idx}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col gap-2 hover:border-indigo-200 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    <span className="text-sm font-bold text-slate-900">{m.chunk.docTitle}</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      {m.chunk.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-xs font-bold rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Cosine: {m.similarity} ({Math.round(m.similarity * 100)}%)
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs font-mono text-slate-800 whitespace-pre-wrap leading-relaxed">
                  {m.chunk.content}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span>Chunk Index: #{m.chunk.chunkIndex}</span>
                  <span>Estimated Tokens: ~{m.chunk.tokenCount}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
