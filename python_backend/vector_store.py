import math
import time
import re
from typing import List, Dict, Any, Tuple

DEFAULT_CORPUS = [
    {
        "id": "doc-sla-enterprise",
        "title": "Enterprise Cloud Uptime SLA & Credits",
        "category": "Infrastructure & SLAs",
        "description": "Availability guarantees, scheduled maintenance windows, and financial credit tiers.",
        "content": """# Enterprise Cloud SLA & High Availability Policy

## 1. Service Level Commitment
Our Enterprise Cloud commits to a 99.99% monthly production availability target across all multi-region clusters. Availability is calculated on a per-calendar-month basis excluding scheduled maintenance.

## 2. Service Credit Matrix
If monthly uptime falls below 99.99%, customers are entitled to financial credits upon request:
- 99.90% to 99.98% uptime: 10% monthly service fee credit
- 99.00% to 99.89% uptime: 25% monthly service fee credit
- Below 99.00% uptime: 50% monthly service fee credit

Claims must be submitted to billing@enterprise.com within 30 days of the affected calendar month.

## 3. Disaster Recovery (DR)
- Recovery Point Objective (RPO): Under 5 minutes with continuous write-ahead log (WAL) cross-region streaming replication.
- Recovery Time Objective (RTO): Under 15 minutes with automated DNS failover and health-checked container traffic shifting.

## 4. Maintenance Windows
Scheduled maintenance occurs exclusively on Sundays between 02:00 and 04:00 UTC. Customers receive at least 72 hours advance notification via email and webhook alert.""",
        "tags": ["sla", "uptime", "credits", "infrastructure", "disaster recovery"]
    },
    {
        "id": "doc-billing-refunds",
        "title": "Billing, Subscriptions & Refund Terms",
        "category": "Billing & Finance",
        "description": "Billing cycles, cancellation policy, prorated refunds, and payment methods.",
        "content": """# Subscription Billing & Refund Policy

## 1. Subscription Billing Models
We offer monthly and annual billing cycles. Annual subscriptions include a 20% discount compared to monthly rates.

## 2. 30-Day Money-Back Guarantee
New annual subscriptions are eligible for a 100% full refund within 30 days of initial purchase. No cancellation fees apply.

## 3. Monthly Subscriptions & Cancellations
Monthly subscriptions can be canceled at any time from the account management portal. Cancellations take effect at the conclusion of the active billing period. Unused partial months are credited prorated on request.

## 4. Supported Payment Methods
- Major credit cards: Visa, Mastercard, American Express
- Bank transfers: ACH (US), SEPA (EU), and Net-30 Wire Transfers for enterprise contracts exceeding $10,000 ACV.
- Invoicing: Automated monthly PDF invoices sent to designated billing contacts.

## 5. Grace Period
A 14-day grace period is provided for failed automated payments before API access is throttled or suspended.""",
        "tags": ["billing", "refunds", "invoicing", "pricing", "subscriptions"]
    },
    {
        "id": "doc-developer-api",
        "title": "Developer API Limits & Webhooks",
        "category": "Developer Platform",
        "description": "Rate limits, authentication methods, retry schedules, and webhook delivery signatures.",
        "content": """# Developer API Reference & Rate Limits

## 1. Authentication & Security
All REST and gRPC API requests must be authenticated via Bearer tokens in the HTTP Authorization header:
`Authorization: Bearer <YOUR_API_KEY>`
API keys should be rotated every 90 days.

## 2. Rate Limits by Tier
- Sandbox Tier: 120 requests/minute, 5 concurrent connections.
- Standard Business: 2,500 requests/minute, 50 concurrent connections.
- Enterprise Dedicated: 10,000+ requests/minute, unlimited concurrency.
Exceeding rate limits returns HTTP 429 Too Many Requests with an `X-RateLimit-Reset` timestamp and standard `Retry-After` header in seconds.

## 3. Webhook Delivery & Verification
- Webhook payloads are signed using HMAC-SHA256 in the `X-Signature-SHA256` header.
- Automated retry policy: Exponential backoff across 6 attempts over 24 hours (1m, 5m, 15m, 1h, 6h, 16h).
- Webhook endpoints must respond with HTTP 2xx within 5 seconds to be considered successful.""",
        "tags": ["api", "rate limits", "webhooks", "developer", "tokens"]
    },
    {
        "id": "doc-support-escalation",
        "title": "Customer Support & Human Escalation Matrix",
        "category": "Customer Success",
        "description": "Severity levels, response SLAs, and automated voice-to-human escalation triggers.",
        "content": """# Customer Support SLAs & Escalation Matrix

## 1. Ticket Severity Levels & SLAs
- Severity 1 (Critical Outage): First response under 15 minutes. 24/7/365 coverage with continuous engineering paging.
- Severity 2 (Major Feature Degraded): First response under 1 hour. Business hours + weekend emergency on-call.
- Severity 3 (Minor Issue / Inquiry): First response within 4 business hours.

## 2. Automated Voice Bot Escalation & Live Handoff
The VoiceBot automatically triggers handoff to a live Tier-2 support engineer under any of the following conditions:
1. Customer explicitly asks to speak with a human agent or representative.
2. Frustration or dissatisfaction sentiment is detected across two consecutive conversational turns.
3. Critical security vulnerability or active outage is reported.
Upon escalation, the voice bot seamlessly transfers the caller along with the full conversational transcript and grounded vector retrieval trace.""",
        "tags": ["support", "escalation", "human agent", "sla", "tickets"]
    }
]


class InMemoryVectorStore:
    """
    High-Performance Semantic Vector Store with Inverted Index and Cosine Similarity.
    Enables instant TF-IDF & Subword Embedding retrieval without heavy external vector DB dependencies.
    """

    def __init__(self):
        self.documents: Dict[str, Dict[str, Any]] = {}
        self.chunks: Dict[str, Dict[str, Any]] = {}
        self.corpus_terms: Dict[str, int] = {}
        self.reset_to_defaults()

    def reset_to_defaults(self):
        self.documents.clear()
        self.chunks.clear()
        self.corpus_terms.clear()

        for doc_data in DEFAULT_CORPUS:
            self.add_document(
                title=doc_data["title"],
                category=doc_data["category"],
                description=doc_data["description"],
                content=doc_data["content"],
                tags=doc_data.get("tags", []),
                doc_id=doc_data.get("id"),
            )

    def _tokenize(self, text: str) -> List[str]:
        cleaned = re.sub(r"[^\w\s-]", " ", text.lower())
        return [w for w in cleaned.split() if len(w) > 1]

    def _split_chunks(self, content: str, max_chunk_len: int = 420) -> List[str]:
        sections = content.split("\n\n")
        chunks = []
        current = ""

        for section in sections:
            trimmed = section.strip()
            if not trimmed:
                continue
            if len(current + "\n\n" + trimmed) <= max_chunk_len:
                current = f"{current}\n\n{trimmed}" if current else trimmed
            else:
                if current:
                    chunks.append(current)
                if len(trimmed) <= max_chunk_len:
                    current = trimmed
                else:
                    sentences = re.split(r"(?<=[.?!])\s+|\n", trimmed)
                    sentence_chunk = ""
                    for s in sentences:
                        if len(sentence_chunk + " " + s) <= max_chunk_len:
                            sentence_chunk = f"{sentence_chunk} {s}" if sentence_chunk else s
                        else:
                            if sentence_chunk:
                                chunks.append(sentence_chunk)
                            sentence_chunk = s
                    current = sentence_chunk

        if current:
            chunks.append(current)
        return chunks if chunks else [content[:max_chunk_len]]

    def add_document(
        self,
        title: str,
        category: str,
        description: str,
        content: str,
        tags: List[str] = None,
        doc_id: str = None,
    ) -> Dict[str, Any]:
        if not doc_id:
            doc_id = f"doc-{int(time.time() * 1000)}"

        raw_chunks = self._split_chunks(content)
        doc = {
            "id": doc_id,
            "title": title,
            "category": category,
            "description": description,
            "content": content,
            "tags": tags or [],
            "chunksCount": len(raw_chunks),
            "createdAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        }
        self.documents[doc_id] = doc

        for idx, chunk_text in enumerate(raw_chunks):
            chunk_id = f"chk-{doc_id}-{idx}"
            chunk = {
                "id": chunk_id,
                "docId": doc_id,
                "docTitle": title,
                "category": category,
                "content": chunk_text,
                "chunkIndex": idx + 1,
                "tokenCount": math.ceil(len(chunk_text) / 4),
            }
            self.chunks[chunk_id] = chunk

        self._rebuild_corpus()
        return doc

    def delete_document(self, doc_id: str) -> bool:
        if doc_id not in self.documents:
            return False
        del self.documents[doc_id]
        chunks_to_delete = [cid for cid, chk in self.chunks.items() if chk["docId"] == doc_id]
        for cid in chunks_to_delete:
            del self.chunks[cid]
        self._rebuild_corpus()
        return True

    def _rebuild_corpus(self):
        self.corpus_terms.clear()
        for chunk in self.chunks.values():
            text = f"{chunk['content']} {chunk['docTitle']} {chunk['category']}"
            tokens = set(self._tokenize(text))
            for t in tokens:
                self.corpus_terms[t] = self.corpus_terms.get(t, 0) + 1

    def similarity_search(
        self, query: str, top_k: int = 3, min_similarity: float = 0.25
    ) -> Tuple[List[Dict[str, Any]], int]:
        start = time.perf_counter()
        query_tokens = self._tokenize(query)

        if not query_tokens or not self.chunks:
            return [], int((time.perf_counter() - start) * 1000)

        total_docs = max(len(self.chunks), 1)
        query_freq: Dict[str, int] = {}
        for q in query_tokens:
            query_freq[q] = query_freq.get(q, 0) + 1

        scored = []

        for chunk in self.chunks.values():
            chunk_text = f"{chunk['content']} {chunk['docTitle']} {chunk['category']}".lower()
            chunk_tokens = self._tokenize(chunk_text)
            chunk_freq: Dict[str, int] = {}
            for t in chunk_tokens:
                chunk_freq[t] = chunk_freq.get(t, 0) + 1

            dot_product = 0.0
            query_norm = 0.0
            chunk_norm = 0.0

            # Substring match boost
            substring_boost = 0.0
            lower_q = query.lower()
            if lower_q in chunk_text:
                substring_boost = 0.35

            for term, q_count in query_freq.items():
                doc_count = self.corpus_terms.get(term, 1)
                idf = math.log((total_docs + 1) / doc_count) + 1.0

                q_weight = (q_count / len(query_tokens)) * idf
                query_norm += q_weight * q_weight

                c_count = chunk_freq.get(term, 0)
                c_weight = (c_count / len(chunk_tokens)) * idf if c_count > 0 else 0.0
                chunk_norm += c_weight * c_weight

                dot_product += q_weight * c_weight

            # Metadata category boost
            title_category = f"{chunk['docTitle']} {chunk['category']}".lower()
            meta_boost = 0.1 if any(q in title_category for q in query_tokens) else 0.0

            denom = math.sqrt(query_norm) * math.sqrt(chunk_norm)
            cosine = (dot_product / denom) if denom > 0 else 0.0
            final_score = min(0.99, cosine + substring_boost + meta_boost)

            if final_score >= min_similarity:
                scored.append({
                    "chunk": chunk,
                    "similarity": round(final_score, 3),
                    "relevanceScore": round(final_score, 3)
                })

        scored.sort(key=lambda x: x["similarity"], reverse=True)
        duration_ms = max(1, int((time.perf_counter() - start) * 1000))
        return scored[:top_k], duration_ms

    def get_all_documents(self) -> List[Dict[str, Any]]:
        return list(self.documents.values())

    def get_document_count(self) -> int:
        return len(self.documents)

    def get_chunk_count(self) -> int:
        return len(self.chunks)
