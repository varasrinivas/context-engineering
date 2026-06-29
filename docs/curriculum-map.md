# Context Engineering: Mastering the LLM Context Window
## Curriculum Map — 32 Modules, 8 Tracks

**Domain Anchor:** UCC Public Records / Lien Risk Pipeline
**Published at:** ai.varasrinivas.com
**Architecture:** Single-file HTML player, MODS array, renderVisual() switch

---

## Track 1 — Foundations (T1, color: #4a6741 forest)
The "what" and "why" of context engineering. Reframes everything learners thought about prompting.

| Module | Title | Key Topics | Analogy | Cross-links |
|--------|-------|------------|---------|-------------|
| M00 | Course Orientation & The Context Engineering Manifesto | What is CE, context window as workspace, course structure, UCC sandbox setup | Chef's mise en place | — |
| M01 | Anatomy of a Context Window — Tokens, Positions, Attention | Tokenization (BPE, SentencePiece), positional encoding, attention, window sizes | Meeting room whiteboard | — |
| M02 | From Prompt Engineering to Context Engineering — The Paradigm Shift | Five layers of context, why prompts fail at scale, CE lifecycle | Single email vs briefing packet | Agent M03 |
| M03 | Context Economics — Token Budgets, Costs, and Tradeoffs | Cost models, quality×quantity curve, budget allocation, dilution | Packing a suitcase (weight limit) | — |

## Track 2 — System Context Design (T2, color: #8b5e3c leather)
The static scaffolding — system prompts, instruction hierarchies, persona, and few-shot examples.

| Module | Title | Key Topics | Analogy | Cross-links |
|--------|-------|------------|---------|-------------|
| M04 | System Prompt Architecture — Layers, Sections, and Priority | Anatomy of production system prompts, section ordering, delimiters | Employee handbook for new hire | Agent M03, M08 |
| M05 | Instruction Hierarchy — System vs User Authority | Trust levels, override attacks, defense-in-depth | Bank vault access levels | Agent M16 |
| M06 | Persona & Behavioral Framing | Why persona affects quality, expert framing, behavioral anchoring | Calling plumber vs architect | — |
| M07 | Few-Shot Context Design — Selection, Ordering, Diminishing Returns | In-context learning, example diversity, ordering effects, when to stop | Sorting mail by example | Agent M04 |

## Track 3 — Dynamic Context Assembly (T3, color: #2e6b8a deep water)
Runtime context — retrieval, tool results, multi-source fusion.

| Module | Title | Key Topics | Analogy | Cross-links |
|--------|-------|------------|---------|-------------|
| M08 | Retrieval-Augmented Context — RAG as Context Engineering | RAG reframed, retrieval→ranking→formatting pipeline, when RAG hurts | Research assistant preparing lawyer's brief | Agent M09-M10 |
| M09 | Context Retrieval Strategies — Semantic, Keyword, Hybrid, Reranking | Embedding search, BM25, hybrid, cross-encoder reranking | Library: librarian vs card catalog vs senior librarian | Agent M09 |
| M10 | Tool Results as Context — Shaping What Tools Return | Output shaping, tool result bloat, summarization strategies | Team status updates: 3-page email vs 2 bullets | Agent M05-M06 |
| M11 | Multi-Source Context Fusion | Context assembly graph, conflict resolution, dedup, priority/freshness | News article with 4 conflicting sources | — |

## Track 4 — Memory & Conversation Context (T4, color: #7a4a8c amethyst)
Temporal dimension — history management, memory layers, decay, user modeling.

| Module | Title | Key Topics | Analogy | Cross-links |
|--------|-------|------------|---------|-------------|
| M12 | Conversation History Management — Windows, Summarization, Compression | Sliding window, hierarchical summarization, token-aware history | Browser tabs + history + cache clearing | Agent M08 |
| M13 | Multi-Layer Memory Architecture — Ephemeral, Session, Persistent, Shared | 4 memory layers, implementation patterns, update strategies, coherence | Hotel concierge memory tiers | Agent M11 |
| M14 | Context Decay and Refresh — When Context Goes Stale | Temporal validity, staleness detection, refresh strategies, cost of freshness | Milk (expires fast) vs honey (lasts forever) in fridge | — |
| M15 | User Modeling as Context — Personalization Without Overfitting | User context, progressive profiling, privacy spectrum, anti-patterns | Good barista who remembers your order | — |

## Track 5 — Context Positioning & Optimization (T5, color: #b8860b amber)
Where context goes matters as much as what it says.

| Module | Title | Key Topics | Analogy | Cross-links |
|--------|-------|------------|---------|-------------|
| M16 | Positional Effects — Primacy, Recency, and Lost-in-the-Middle | Primacy/recency bias, lost-in-the-middle research, positional strategies | Reading a long newspaper article | Agent M08 |
| M17 | Context Ordering Strategies — What Goes Where and Why | Standard ordering, when to break it, interleaving vs grouping, narrative approach | Lawyer presenting a case to jury | — |
| M18 | Context Compression — Summarization, Distillation, Pruning | Extractive, abstractive, semantic pruning, compression ratio vs quality | Packing for carry-on: pick outfits vs buy versatile vs skip winter coat | — |
| M19 | Caching and Prefilling — Prompt Caching, Prefill Strategies, Cost Optimization | Anthropic prompt caching, cacheable design, prefill, combined savings | Restaurant prep kitchen: base sauces cached, plating varies | SDLC Cost |

## Track 6 — Guardrails & Safety Context (T6, color: #c0392b signal red)
Security engineering for context — injection defense, compliance, multi-tenant isolation.

| Module | Title | Key Topics | Analogy | Cross-links |
|--------|-------|------------|---------|-------------|
| M20 | Input Guardrails — Injection Detection, Boundary Enforcement | Injection taxonomy, defense-in-depth, boundary markers, canary tokens | Airport security layers | Agent M16 |
| M21 | Output Shaping Context — Format Control, Constraint Specification | JSON mode, constraint spec, validation-retry loops, output section design | Metal casting mold | Agent M04 |
| M22 | Compliance Context — Audit Trails, PII Handling, Regulatory Requirements | GDPR/HIPAA/SOC2 for context, PII masking, audit logging, data residency | Hospital patient records discipline | SDLC Compliance |
| M23 | Multi-Tenant Context Isolation | Contamination risk, isolation strategies, leakage testing, shared vs isolated | Apartment plumbing isolation | — |

## Track 7 — Agent Context Patterns (T7, color: #1a5276 steel)
Context engineering for autonomous agents.

| Module | Title | Key Topics | Analogy | Cross-links |
|--------|-------|------------|---------|-------------|
| M24 | Agent Loop Context — What Persists Across Iterations | Agent context lifecycle, scratchpad patterns, context pressure, checkpointing | Detective's case board across days | Agent M12 |
| M25 | Planning Context — Task Decomposition State Management | Planning context, state representations (flat/DAG/hierarchical), plan mutation | Project manager's Gantt chart | Agent M13 |
| M26 | Multi-Agent Context Sharing — Hub-Spoke, Blackboard, Message Passing | Isolation vs sharing, 3 sharing patterns, context size explosion | CEO/Slack channel/direct email | Agent M14 |
| M27 | Human-in-the-Loop Context — Approval Flows, Escalation, Handoffs | Decision injection, escalation context, context handoff, summarizing for humans | Junior analyst flagging suspicious transaction | Agent M15 |

## Track 8 — Production & Evaluation (T8, color: #2c3e50 charcoal)
Shipping context engineering to production.

| Module | Title | Key Topics | Analogy | Cross-links |
|--------|-------|------------|---------|-------------|
| M28 | Context Observability — Logging, Debugging, Token Analysis | What to log, context debugging, token dashboards, alert triggers | Airplane black box | SDLC Observability |
| M29 | Context A/B Testing — Evaluating Context Strategies | Eval frameworks, A/B testing, offline evaluation, statistical rigor | Clinical drug trials | — |
| M30 | Context Versioning — Managing Context Drift Across Releases | Context as code, migration strategies, regression detection, changelogs | Software release discipline for prompts | SDLC CI/CD |
| M31 | Capstone — Production Context Pipeline for UCC Lien Risk Analysis | End-to-end pipeline, multi-source fusion, full lifecycle, benchmarks | Build the entire restaurant | Agent Capstones |
