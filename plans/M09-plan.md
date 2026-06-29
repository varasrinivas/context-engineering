# M09 Plan — Context Retrieval Strategies: Semantic, Keyword, Hybrid, Reranking

## Module Identity
- **ID:** M09
- **Track:** 3 (Dynamic Context Assembly)
- **Title:** Context Retrieval Strategies — Semantic, Keyword, Hybrid, Reranking
- **Subtitle:** Choosing how to find candidate context — meaning-based, exact-match, both, and a second-pass referee
- **Icon:** 🔍
- **Color:** #2e6b8a (deep water)

## Everyday Analogy
**Three Ways to Find a Book in the Library**

You want a book. The new **card catalog** finds exact title matches — perfect if you know the precise words ("UCC-1 financing statement"), useless if you only know the gist. The **knowledgeable librarian** understands what you *mean* — ask for "that law about lenders claiming equipment" and she walks you to the right shelf even though you used none of the right words. Best of all, after either of them hands you a stack, the **senior librarian** flips through and reorders them so the single most useful book is on top. Keyword search is the card catalog (exact words), semantic search is the librarian (meaning), hybrid uses both, and reranking is the senior librarian's final pass.

Mapping:
- Card catalog, exact title match → keyword/lexical search (BM25)
- Librarian who gets your meaning → semantic/embedding search
- Knowing precise words vs. only the gist → when keyword wins vs. when semantic wins
- Using catalog + librarian together → hybrid retrieval
- Senior librarian reordering the stack → cross-encoder reranking (second pass)
- The most useful book on top → the relevant chunk ranked first, not buried

## Key Topics (5)
1. **Semantic (embedding) search** — Encodes query and documents into vectors; retrieves by meaning/similarity, so paraphrases and synonyms match. Strong on "gist" queries; weak on exact identifiers, rare tokens, and precise codes it may blur together.
2. **Keyword (lexical) search** — Classic term matching (e.g., BM25): exact tokens, great for IDs, codes, names, and rare strings. Strong where precision matters; blind to synonyms and paraphrase. *(UCC domain example lives here.)*
3. **Hybrid retrieval** — Run both and fuse the results (e.g., reciprocal rank fusion), getting semantic recall plus lexical precision. The default for heterogeneous corpora that contain both prose and exact identifiers — like UCC filings.
4. **Reranking (cross-encoders)** — A second pass: take the top-N candidates from cheap first-stage retrieval and score each *jointly with the query* using a more expensive cross-encoder, then keep the top-k. Dramatically improves the ranking that lands in the window — the highest-leverage cheap win in most RAG systems.
5. **Choosing and tuning per query** — No single method is best; the right choice depends on the query and corpus. Exact-ID lookups lean keyword; conceptual questions lean semantic; mixed workloads use hybrid + rerank. First-stage recall vs. rerank precision is a budget/latency tradeoff (ties to M03).

UCC domain example appears in: Topic 2 — searching for a specific filing ID "2024-FL-0012345" or an exact debtor name: semantic search may return *similar* filings (wrong one), while keyword search nails the exact identifier; conversely "businesses that pledged future equipment" needs semantic. The corpus demands hybrid.

## Sections Outline

### Section 1: content — "Two Ways to Match: Meaning vs. Tokens"
- Semantic search: embeddings, vector similarity, matches meaning/paraphrase. Good for conceptual queries; weak on exact identifiers (it can blur "2024-FL-0012345" with "2024-FL-0012354").
- Keyword search: lexical/BM25, exact term overlap. Good for IDs, names, codes, rare tokens; blind to synonyms.
- The core insight: these fail in *opposite* directions, which is exactly why combining them works.

### Section 2: content — "Hybrid and the Reranking Referee"
- Hybrid: run semantic + keyword, fuse rankings (reciprocal rank fusion or weighted) → recall of meaning plus precision of exact match.
- Reranking: first-stage retrieval is cheap and recall-oriented (get a generous top-N); a cross-encoder then scores each candidate jointly with the query and reorders, so the best few rise to the top-k that actually enter the window.
- Why rerank is high-leverage: it directly fixes the RANK stage from M08 — the relevant chunk stops being buried. Cheap relative to its accuracy lift.

### Section 3: code — "Hybrid Retrieval over UCC Filings"
- Language: Python
- Demonstrates: a tiny hybrid retriever — a keyword scorer (term overlap / BM25-ish) and a semantic scorer (stub/cosine over embeddings), fused by reciprocal rank fusion — run on two queries: an exact filing-ID lookup (keyword wins) and a conceptual "future equipment" query (semantic wins). Then a rerank stub reorders the fused top-N.
- UCC tie-in: shows keyword nailing the ID query and semantic nailing the concept query, with hybrid handling both; rerank puts the single best chunk first.
- Keep embeddings abstract (a `embed()`/`similar()` stub) so it's conceptual, not vendor-specific.

### Section 4: quiz — "Which Retriever for Which Query?"
- Question: "Your UCC assistant must handle two query types: (1) 'pull filing 2024-FL-0012345' and (2) 'which debtors pledged not-yet-acquired equipment?'. With pure semantic (embedding) search, type (1) sometimes returns a similar-but-wrong filing ID, while type (2) works well. What's the best fix?"
- Options:
  - A. Switch everything to keyword search — it's more precise
  - B. Use hybrid retrieval (keyword + semantic) so exact identifiers are matched lexically while conceptual queries match by meaning; optionally rerank the fused results
  - C. Embed the filing IDs with a bigger model so semantic search stops confusing them
  - D. Tell users to only ask conceptual questions
  - correct: B (index 1)
- Explanation: The two query types fail in opposite directions for a single method. Exact identifiers ('2024-FL-0012345') are precisely what lexical/keyword search excels at and what embeddings blur; conceptual queries ('not-yet-acquired equipment') are where semantic shines and keyword is blind. Hybrid retrieval covers both, and a rerank pass sharpens the final order. Forcing one method (A/C) or restricting users (D) just trades one failure for another.

### Section 5: antipattern — "One Retriever to Rule Them All"
- Anti-pattern 1: Semantic-only on a corpus full of exact identifiers — embedding similarity confuses near-identical IDs/codes/names, silently returning the wrong record.
- Anti-pattern 2: Skipping reranking — accepting first-stage order, leaving the relevant chunk buried below high-similarity noise (the M08 RANK failure).
- Anti-pattern 3: Over-retrieving to compensate for bad ranking — pulling top-50 instead of fixing rank, dumping noise into the window (M03 dilution) instead of adding a cheap rerank.

## SVG Diagram Plan
**"Two Retrievers + a Referee" — parallel keyword/semantic paths fusing into hybrid, then a rerank pass**

```
   QUERY
   ┌──┴───────────────┐
   ▼                  ▼
 ┌──────────┐    ┌──────────┐
 │ KEYWORD  │    │ SEMANTIC │
 │ exact    │    │ meaning  │
 │ IDs/names│    │ paraphr. │
 └────┬─────┘    └────┬─────┘
      └──── FUSE ──────┘  (hybrid: recall + precision)
              ▼
        ┌───────────┐
        │  RERANK   │  cross-encoder referee → best on top
        └─────┬─────┘
              ▼
         top-k → window
```

- A query node splitting into two parallel retriever boxes: KEYWORD (exact: IDs/names) and SEMANTIC (meaning: paraphrase), each with a one-line strength.
- The two paths converging at a FUSE node ("hybrid: recall + precision"), then flowing down into a RERANK box ("cross-encoder referee — best on top"), then "top-k → window."
- Small annotations: under KEYWORD "blind to synonyms"; under SEMANTIC "blurs exact IDs"; the rerank box highlighted (amber) as "highest-leverage cheap win."
- Colors: deep-water #2e6b8a for the retriever/fuse boxes; amber #b8860b accent on RERANK (consistency with the "knee/leverage" motif); warm paper background; Fraunces title, JetBrains Mono labels.
- Reinforces the library analogy: card catalog + librarian + senior-librarian final pass.

## Cross-Links
- **Agent M09** (type: agent, label "Agent M09 — Retrieval Tools"): CLAUDE.md table maps M09↔Agent M09. CE covers retrieval strategy choice; Agent applies it to retrieval tool implementation. Reference in the hybrid/rerank section.

## Lab Briefs

### Understand It: Where Each Retriever Wins and Loses
- Give the learner a small UCC corpus and a query set split into exact-identifier queries and conceptual queries; run keyword-only, semantic-only, and hybrid; record hit/miss per query.
- They observe the opposite failure modes (semantic misses exact IDs, keyword misses concepts) and that hybrid covers both.
- Expected output: a matrix (query × retriever → hit/miss) making the complementary strengths obvious, plus a one-line rule for routing a query to a method.
- Duration: ~25 minutes.

### Build It with AI: A Hybrid Retriever with Reranking
- With Claude, build a hybrid retriever (keyword scorer + semantic scorer fused by reciprocal rank fusion) over UCC filings, then add a rerank pass (a cross-encoder stub or an LLM-scored relevance pass) that reorders the fused top-N.
- Steps: implement both scorers → fuse with RRF → measure ranking quality (is the gold chunk in top-k?) → add rerank → measure the lift → show rerank rescuing a buried gold chunk.
- Expected deliverable: a hybrid+rerank retriever and a before/after showing the gold chunk moving from buried (rank 7) to top (rank 1) after reranking, on the same candidates.
- Duration: ~40 minutes.

## Context Engineering Takeaway
No single retriever is best: keyword nails exact identifiers, semantic captures meaning, hybrid covers both, and a cheap rerank pass lifts the truly relevant chunk to the top — so match the retrieval strategy to the query and let a referee fix the order before context enters the window.

## Anti-Patterns
1. Semantic-only on identifier-heavy corpora — embeddings blur near-identical IDs/codes/names and return the wrong record.
2. Skipping reranking — accepting first-stage order and leaving the relevant chunk buried below high-similarity noise.
3. Over-retrieving to mask bad ranking — pulling top-50 instead of adding a cheap rerank, dumping noise into the window.

## Continuity Notes
- **Builds on:** M08 (this module deepens its RETRIEVE and RANK stages; rerank directly fixes M08's "buried chunk" failure) and M07 (selection-by-relevance instincts, now mechanized). Uses M03 economics for the recall-vs-rerank latency/cost tradeoff and M01 for why ranking-into-position matters.
- **Referenced by:** M10 (tool results as another retrieval-like source), M11 (fusing multiple retrieved sources — RRF reappears), M16/M17 (placing the reranked top-k by position), M18 (compressing retrieved chunks). Agent M09 implements the retrieval tooling.
