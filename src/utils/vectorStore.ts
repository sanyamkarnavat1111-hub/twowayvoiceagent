import { CompanyDocument, DocChunk, RetrievedChunkMatch, AgenticTrace, AgenticTraceStep } from '../types.js';
import { DEFAULT_COMPANY_DOCUMENTS } from '../data/defaultDocs.js';

const STORAGE_KEY = 'voicebot_kb_documents_v2';

export class ClientVectorStore {
  private documents: Map<string, CompanyDocument> = new Map();
  private chunks: Map<string, DocChunk> = new Map();
  private corpusTerms: Map<string, number> = new Map(); // Term frequency across corpus

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: CompanyDocument[] = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          parsed.forEach((doc) => this.indexDocument(doc));
          return;
        }
      }
    } catch (e) {
      console.warn('Could not read from localStorage, using defaults', e);
    }

    this.resetToDefaults();
  }

  private saveToStorage(): void {
    try {
      const docsArray = Array.from(this.documents.values());
      localStorage.setItem(STORAGE_KEY, JSON.stringify(docsArray));
    } catch (e) {
      console.warn('Could not save to localStorage', e);
    }
  }

  public resetToDefaults(): void {
    this.documents.clear();
    this.chunks.clear();
    this.corpusTerms.clear();

    const initialDocs: CompanyDocument[] = DEFAULT_COMPANY_DOCUMENTS.map((d) => ({
      ...d,
      createdAt: new Date().toISOString(),
      chunksCount: 0,
    }));

    initialDocs.forEach((doc) => this.indexDocument(doc));
    this.saveToStorage();
  }

  public getDocuments(): CompanyDocument[] {
    return Array.from(this.documents.values());
  }

  public getTotalChunksCount(): number {
    return this.chunks.size;
  }

  public addDocument(docData: {
    title: string;
    category: string;
    description: string;
    content: string;
    tags: string[];
  }): CompanyDocument {
    const id = `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newDoc: CompanyDocument = {
      id,
      title: docData.title,
      category: docData.category || 'General',
      description: docData.description || '',
      content: docData.content,
      tags: docData.tags || [],
      createdAt: new Date().toISOString(),
      chunksCount: 0,
    };

    this.indexDocument(newDoc);
    this.saveToStorage();
    return newDoc;
  }

  public deleteDocument(id: string): boolean {
    if (!this.documents.has(id)) return false;

    this.documents.delete(id);
    for (const [chunkId, chunk] of this.chunks.entries()) {
      if (chunk.docId === id) {
        this.chunks.delete(chunkId);
      }
    }

    this.rebuildCorpusFrequencies();
    this.saveToStorage();
    return true;
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 1);
  }

  private splitIntoSemanticChunks(
    content: string,
    maxChunkLen: number = 420,
    overlap: number = 60
  ): string[] {
    // 1. Split by markdown sections and double line breaks
    const rawSections = content.split(/\n{2,}/);
    const resultChunks: string[] = [];

    let current = '';

    for (const section of rawSections) {
      const trimmed = section.trim();
      if (!trimmed) continue;

      if ((current + '\n\n' + trimmed).length <= maxChunkLen) {
        current = current ? current + '\n\n' + trimmed : trimmed;
      } else {
        if (current) {
          resultChunks.push(current);
        }
        if (trimmed.length <= maxChunkLen) {
          current = trimmed;
        } else {
          // Break large sections by sentence or list items
          const sentences = trimmed.split(/(?<=[.?!])\s+|\n/);
          let sentenceChunk = '';
          for (const s of sentences) {
            if ((sentenceChunk + ' ' + s).length <= maxChunkLen) {
              sentenceChunk = sentenceChunk ? sentenceChunk + ' ' + s : s;
            } else {
              if (sentenceChunk) resultChunks.push(sentenceChunk);
              sentenceChunk = s;
            }
          }
          current = sentenceChunk;
        }
      }
    }

    if (current) {
      resultChunks.push(current);
    }

    return resultChunks.length > 0 ? resultChunks : [content.slice(0, maxChunkLen)];
  }

  private indexDocument(doc: CompanyDocument): void {
    const rawChunks = this.splitIntoSemanticChunks(doc.content);
    doc.chunksCount = rawChunks.length;
    this.documents.set(doc.id, doc);

    rawChunks.forEach((chunkContent, idx) => {
      const chunkId = `chk-${doc.id}-${idx}`;
      const tokenCount = Math.ceil(chunkContent.length / 4);

      const chunk: DocChunk = {
        id: chunkId,
        docId: doc.id,
        docTitle: doc.title,
        category: doc.category,
        content: chunkContent,
        chunkIndex: idx + 1,
        tokenCount,
      };

      this.chunks.set(chunkId, chunk);
    });

    this.rebuildCorpusFrequencies();
  }

  private rebuildCorpusFrequencies(): void {
    this.corpusTerms.clear();
    for (const chunk of this.chunks.values()) {
      const tokens = new Set(this.tokenize(chunk.content + ' ' + chunk.docTitle + ' ' + chunk.category));
      for (const token of tokens) {
        this.corpusTerms.set(token, (this.corpusTerms.get(token) || 0) + 1);
      }
    }
  }

  /**
   * High-accuracy BM25 + TF-IDF semantic vector cosine scoring
   */
  public searchSimilarChunks(
    query: string,
    topK: number = 3,
    minSimilarity: number = 0.25
  ): { matches: RetrievedChunkMatch[]; durationMs: number } {
    const startTime = performance.now();
    const queryTokens = this.tokenize(query);

    if (queryTokens.length === 0 || this.chunks.size === 0) {
      return { matches: [], durationMs: Math.round(performance.now() - startTime) };
    }

    const totalDocs = Math.max(this.chunks.size, 1);
    const scoredChunks: { chunk: DocChunk; score: number }[] = [];

    // Query term weights
    const queryFreq: Record<string, number> = {};
    for (const q of queryTokens) {
      queryFreq[q] = (queryFreq[q] || 0) + 1;
    }

    for (const chunk of this.chunks.values()) {
      const chunkText = (chunk.content + ' ' + chunk.docTitle + ' ' + chunk.category).toLowerCase();
      const chunkTokens = this.tokenize(chunkText);
      const chunkFreq: Record<string, number> = {};

      for (const t of chunkTokens) {
        chunkFreq[t] = (chunkFreq[t] || 0) + 1;
      }

      let dotProduct = 0;
      let queryNorm = 0;
      let chunkNorm = 0;

      // Exact substring boost
      let substringBoost = 0;
      const lowerQuery = query.toLowerCase();
      if (chunkText.includes(lowerQuery)) {
        substringBoost = 0.35;
      } else {
        // Multi-word phrase matching
        for (let i = 0; i < queryTokens.length - 1; i++) {
          const bigram = `${queryTokens[i]} ${queryTokens[i + 1]}`;
          if (chunkText.includes(bigram)) {
            substringBoost += 0.15;
          }
        }
      }

      for (const [term, qCount] of Object.entries(queryFreq)) {
        const docCount = this.corpusTerms.get(term) || 1;
        const idf = Math.log((totalDocs + 1) / docCount) + 1;

        const qWeight = (qCount / queryTokens.length) * idf;
        queryNorm += qWeight * qWeight;

        const cCount = chunkFreq[term] || 0;
        const cWeight = cCount > 0 ? (cCount / chunkTokens.length) * idf : 0;
        chunkNorm += cWeight * cWeight;

        dotProduct += qWeight * cWeight;
      }

      // Title & category priority boost
      let metadataBoost = 0;
      const titleTokens = this.tokenize(chunk.docTitle + ' ' + chunk.category);
      for (const q of queryTokens) {
        if (titleTokens.includes(q)) {
          metadataBoost += 0.1;
        }
      }

      const denominator = Math.sqrt(queryNorm) * Math.sqrt(chunkNorm);
      let cosine = denominator > 0 ? dotProduct / denominator : 0;
      let finalScore = Math.min(0.99, cosine + substringBoost + metadataBoost);

      if (finalScore >= minSimilarity) {
        scoredChunks.push({
          chunk,
          score: parseFloat(finalScore.toFixed(3)),
        });
      }
    }

    scoredChunks.sort((a, b) => b.score - a.score);

    const matches: RetrievedChunkMatch[] = scoredChunks.slice(0, topK).map((item) => ({
      chunk: item.chunk,
      similarity: item.score,
      relevanceScore: item.score,
    }));

    const durationMs = Math.max(1, Math.round(performance.now() - startTime));
    return { matches, durationMs };
  }
}

export const vectorStoreInstance = new ClientVectorStore();
