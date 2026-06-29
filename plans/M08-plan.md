# M08 Plan — Retrieval-Augmented Context: RAG as Context Engineering

## Module Identity
- **ID:** M08
- **Track:** 3 (Dynamic Context Assembly)
- **Title:** Retrieval-Augmented Context — RAG as Context Engineering
- **Subtitle:** Reframing RAG from a search problem into a context assembly problem — retrieve, rank, format, place
- **Icon:** 🔧
- **Color:** #2e6b8a (deep water)

## Everyday Analogy
**The Research Assistant Preparing a Lawyer's Brief**

A trial lawyer doesn't read the entire law library before a hearing. A research assistant pulls the few relevant cases, highlights the passages that matter, summarizes them onto a single clean page, and lays them in front of the lawyer in the order they'll be argued. The value isn't just *finding* the cases — a search engine can do that. The value is selecting the right few, trimming them to what matters, formatting them so they're instantly usable, and ordering them for the argument. RAG is that research assistant: retrieval is only the first step; the brief is what wins.

Mapping:
- The law library → the full knowledge base / document store
- Pulling the few relevant cases → retrieval (search)
- Highlighting the passages that matter → chunking + ranking
- Summarizing onto one clean page → formatting / compression for the window
- Laying them in argument order → positioning in the context window
- A great find buried in a messy stack → good retrieval ruined by bad formatting/placement

## Key Topics (5)
1. **RAG reframed: a context assembly problem** — RAG is usually taught as "search + generate." Context engineering reframes it: retrieval produces *candidate context*, but assembly — ranking, chunking, formatting, placing — determines whether the model can actually use it. The generation quality is capped by the assembly, not the search recall.
2. **The retrieval → ranking → formatting → placement pipeline** — Four distinct stages, each a failure point: retrieve (get candidates), rank (order by relevance), format (shape for the window), place (position for attention). A win at one stage can be erased by a loss at another.
3. **Chunking as a context decision** — How you split documents determines what can be retrieved and how coherent it is in-context. Too small = fragments lose meaning; too large = dilution and wasted budget. Chunk boundaries are a context-engineering choice, not a preprocessing afterthought. *(UCC domain example lives here.)*
4. **Formatting retrieved content for use** — Raw retrieved text (dumped JSON, unlabeled snippets, no provenance) is hard for the model to use even when relevant. Good formatting adds structure, source tags, and trims to the relevant span — turning candidates into usable evidence.
5. **When RAG hurts** — Retrieval is not free or always-good: irrelevant-but-high-similarity chunks add noise, over-retrieval dilutes (M03's curve), and stale or conflicting documents mislead. Knowing when *not* to retrieve, or to retrieve less, is part of the discipline.

UCC domain example appears in: Topic 3 — chunking UCC filings for retrieval: a filing split mid-collateral-clause produces a fragment that retrieves on a keyword but is meaningless out of context, vs. chunking by logical section (debtor block, secured party, collateral, status) so each retrieved chunk is self-contained and provenance-tagged with its filing ID.

## Sections Outline

### Section 1: content — "RAG Is Assembly, Not Just Search"
- The common framing (embed → search → stuff results → generate) and why it underperforms.
- Reframe: retrieval yields *candidate context*; the model's answer quality is gated by how that candidate context is ranked, trimmed, formatted, and placed — the assembly.
- Thesis: most "RAG is broken" complaints are assembly failures, not retrieval-recall failures.

### Section 2: content — "The Four-Stage Pipeline"
- Retrieve → Rank → Format → Place. Define each and its distinct failure mode.
- Retrieve: missed or noisy candidates. Rank: relevant chunk buried below noise. Format: relevant chunk unusable (no structure/provenance). Place: relevant chunk dropped into the lost-in-the-middle zone (M01/M16).
- Key point: these compose. 95% recall × bad ranking × raw formatting × bad placement = a model that can't answer despite the answer being "in context."

### Section 3: code — "Chunking and Formatting a UCC Filing"
- Language: Python
- Demonstrates: (a) a naive fixed-size chunk that splits a collateral clause mid-sentence, vs. (b) a section-aware chunker that yields self-contained, provenance-tagged chunks; then a formatter that wraps each retrieved chunk with its source filing ID and section label before placement.
- UCC tie-in: retrieving "equipment" collateral across filings — section-aware chunks return usable evidence; naive chunks return meaningless fragments.
- Shows the formatting step turning a raw chunk into labeled evidence the model can cite.

### Section 4: quiz — "Why Can't It Answer?"
- Question: "Your UCC RAG system retrieves the correct filing chunk for 'which debtors pledged equipment as collateral' — you've verified the right chunk is in the context window every time. Yet the model's answers are vague and often omit debtors that are present in the retrieved chunks. Retrieval recall is 96%. What's the most likely problem?"
- Options:
  - A. Retrieval recall is too low; you need a better embedding model
  - B. The assembly downstream of retrieval is failing — likely poor formatting (raw, unlabeled chunks) and/or bad placement (relevant chunks buried in the middle), so the model can't use context it technically has
  - C. The model is incapable of this task
  - D. You should retrieve more chunks to be safe
- Correct: B (index 1)
- Explanation: 96% recall means retrieval is doing its job — the right chunk is in the window. The failure is in assembly: unlabeled, raw-dumped chunks are hard to parse and attribute, and chunks placed in the lost-in-the-middle zone get under-attended. RAG quality is capped by ranking, formatting, and placement, not just recall. Retrieving *more* (option D) would worsen dilution; a better embedder (A) addresses a problem you don't have.

### Section 5: antipattern — "Great Retrieval, Useless Brief"
- Anti-pattern 1: Treating RAG as search-only — optimizing embedding recall while dumping raw, unformatted, unranked chunks into the prompt.
- Anti-pattern 2: Chunking as an afterthought — fixed-size splits that fragment logical units, retrieving meaningless pieces that score on keywords but can't be used.
- Anti-pattern 3: Over-retrieval "to be safe" — stuffing top-50 chunks into the window, diluting the few relevant ones and paying for tokens that lower accuracy (M03's worst quadrant).

## SVG Diagram Plan
**"The RAG Assembly Pipeline" — four stages with a worked-example trace and failure annotations**

```
  KNOWLEDGE BASE
   (many filings)
        │
   ┌────▼─────┐   ┌──────────┐   ┌───────────┐   ┌──────────┐
   │ RETRIEVE │ → │   RANK   │ → │  FORMAT   │ → │  PLACE   │ → [context window]
   │ candidates│   │ by relev.│   │ +provenance│   │ primacy/ │
   └──────────┘   └──────────┘   └───────────┘   │ recency  │
   miss/noise     buried chunk    raw=unusable    └──────────┘
                                                   middle=lost
   "95% recall × bad rank × raw format × bad place = can't answer"
```

- A left "knowledge base" stack feeding a horizontal 4-box pipeline: RETRIEVE → RANK → FORMAT → PLACE → context window.
- Under each box, its failure mode in small red text (miss/noise, buried, raw=unusable, lost-in-middle).
- A bottom equation banner: "high recall × any broken stage = unusable context."
- Use deep-water #2e6b8a for the pipeline boxes; signal-red #c0392b for the failure annotations; amber accent on PLACE to tie to M01/M16 positioning; warm paper background; Fraunces title, JetBrains Mono labels.
- Reinforces the lawyer's-brief analogy: finding cases is one box; the brief is all four.

## Cross-Links
- **Agent M09** (type: agent, label "Agent M09 — Retrieval Tools"): CLAUDE.md table maps M08↔Agent M09-M10. CE covers context quality of retrieval; Agent covers the retrieval pipeline/tooling. Reference in the pipeline section.
- **Agent M10** (type: agent, label "Agent M10 — RAG Pipelines"): same mapping; reference for end-to-end RAG implementation in the agent course.

## Lab Briefs

### Understand It: Trace a RAG Failure to Its Stage
- Give the learner a small UCC RAG setup where retrieval recall is high but answers are poor; have them instrument each stage (log retrieved chunks, their rank, their formatting, their position) and localize the failure.
- They confirm the right chunk is retrieved, then identify whether ranking, formatting, or placement is the culprit.
- Expected output: a per-stage trace table for 3 queries showing the right chunk present but mis-ranked/mis-formatted/mis-placed, and a one-line diagnosis per query.
- Duration: ~25 minutes.

### Build It with AI: A Section-Aware Chunker + Formatter
- With Claude, build a UCC chunker that splits filings by logical section (debtor, secured party, collateral, status) into self-contained, provenance-tagged chunks, plus a formatter that wraps each retrieved chunk with its source ID and section label before placement.
- Steps: implement section-aware chunking → tag provenance → format retrieved chunks as labeled evidence → compare answer quality vs. naive fixed-size chunks on the same queries.
- Expected deliverable: chunker + formatter and a before/after showing the section-aware + formatted pipeline answering correctly where the naive pipeline failed, on identical retrieval.
- Duration: ~40 minutes.

## Context Engineering Takeaway
RAG is a context assembly problem, not a search problem: retrieval only produces candidate context, and answer quality is capped by how you chunk, rank, format, and place it — so a great retriever with a bad brief still loses.

## Anti-Patterns
1. Treating RAG as search-only — tuning recall while dumping raw, unranked, unformatted chunks into the window.
2. Chunking as an afterthought — fixed-size splits that fragment logical units into pieces that retrieve but can't be used.
3. Over-retrieval "to be safe" — stuffing dozens of chunks in, diluting the few relevant ones into the worst quadrant of M03's curve.

## Continuity Notes
- **Builds on:** Track 1 (M01 positions/lost-in-the-middle explains the PLACE stage; M03 economics explains why over-retrieval hurts) and Track 2 (M07's example-selection instincts generalize to chunk selection; M04 formatting/delimiters apply to retrieved evidence). Opens Track 3 by reframing the most common dynamic-context pattern.
- **Referenced by:** M09 (retrieval strategies — the RETRIEVE/RANK stages in depth: semantic, keyword, hybrid, reranking), M10 (tool results as another dynamic source to shape), M11 (fusing multiple retrieved sources), M16/M17 (the PLACE stage / ordering), M18 (formatting/compression of retrieved content). Agent M09-M10 implement the pipeline.
