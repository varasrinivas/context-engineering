# M31 Plan — Capstone: Production Context Pipeline for UCC Lien Risk Analysis

## Module Identity
- **ID:** M31
- **Track:** 8 (Production & Evaluation)
- **Title:** Capstone — Production Context Pipeline for UCC Lien Risk Analysis
- **Subtitle:** Assembling all eight tracks into one end-to-end, governed, observable, versioned pipeline
- **Icon:** 🏛️
- **Color:** #2c3e50 (charcoal)

## Everyday Analogy
**Building the Entire Restaurant**

Every module so far taught one station: M00–M03 stocked the pantry (foundations), M04–M07 wrote the recipes (system context), M08–M11 sourced fresh ingredients to order (dynamic assembly), M12–M15 ran the walk-in and the regulars' preferences (memory), M16–M19 plated and prepped efficiently (positioning & optimization), M20–M23 passed the health inspection (guardrails & safety), M24–M27 coordinated the line and the expediter (agent patterns), and M28–M30 kept the books and the quality control (production & evaluation). The capstone is opening the whole restaurant: every station has to work *together*, every night, for real customers, on a budget, under inspection. You don't get graded on the pantry alone — you get graded on the meal that reaches the table.

Mapping:
- Each station you learned → each track's discipline
- Opening night with real customers → the production UCC pipeline serving real risk decisions
- Every station working together → the tracks composing into one coherent pipeline
- On a budget, under inspection → cost (M03) and compliance (M22) constraints
- The meal that reaches the table → the end-to-end risk decision and its audit trail
- The whole restaurant, not one dish → the system, not any single technique

## Key Topics (6 — capstone synthesis)
1. **The end-to-end pipeline** — Walk a single UCC risk request through every track: assemble the context (system + retrieval + tools + memory + user), position and compress it, govern input and output, run it in an agent loop with human escalation when needed, and observe/evaluate/version the whole thing. One request, all eight tracks.
2. **The lifecycle as the spine** — M02's loop — ASSEMBLE → POSITION → GOVERN → OBSERVE → ITERATE — is the organizing structure. Each track maps to a stage; the capstone is that loop running in production over the UCC domain. *(This is the unifying frame.)*
3. **Integration is where systems fail** — The hardest failures aren't in any single technique; they're at the seams: great retrieval ruined by bad positioning, a cached prefix broken by a versioning change, a guardrail that doesn't log to the audit trail, an agent loop that leaks PII into a multi-agent summary. The capstone discipline is making the tracks compose without contradiction. *(UCC domain example lives here.)*
4. **Tradeoffs at the system level** — No track is free, and they trade against each other: compression saves tokens but risks fidelity (M18 vs. M22 audit), more retrieval helps recall but hurts positioning (M09 vs. M16), caching saves cost but constrains personalization (M19 vs. M15). A production pipeline is a negotiated set of these tradeoffs, measured (M29) and tuned.
5. **Benchmarks and the definition of done** — A production context pipeline is judged on measurable targets: accuracy on the eval set (M29), cost per request (M03), p95 latency, cache-hit rate (M19), guardrail/leak test pass rate (M20/M23), and audit completeness (M22) — not on whether any one technique is "good." Done means the *system* hits its benchmarks.
6. **What context engineering is, completed** — Returning to M00: context engineering is the discipline of designing, assembling, positioning, optimizing, and governing everything that enters and exits the context window — and the capstone is proof that it's an engineering discipline with a lifecycle, measurements, and a production bar, not a collection of prompt tricks.

UCC domain example appears in: Topic 3 — a production incident at the seams: the team shipped a retrieval improvement (M09, +recall) and a prompt-caching rollout (M19) the same week; the larger retrieval set broke the cached prefix (cache-hit → 4%, cost up) AND pushed the disqualifying filing into the lost-in-the-middle zone (M16, accuracy down). Observability (M28) localized it, the eval gate (M30) would have blocked the combined change, and the fix was a system-level tradeoff (rerank to fewer chunks — M09 — to restore both positioning and the cache). No single technique was wrong; the integration was.

## Sections Outline

### Section 1: content — "One Request, All Eight Tracks"
- Trace a single UCC risk request end to end, naming the track at each step: assemble (T1-T3), position/compress (T5), govern in/out (T6), agent loop + escalation (T7), observe/evaluate/version (T8), with memory (T4) threading through.
- The point: a production answer is the product of the *whole* pipeline, not any one technique.
- The lifecycle (M02) is the spine: assemble → position → govern → observe → iterate.

### Section 2: content — "Integration: Where the Seams Fail"
- The hardest failures are at the seams between tracks, not within them.
- Catalogue the classic seam failures: retrieval × positioning (M09×M16), caching × versioning (M19×M30), guardrails × audit (M20×M22), agent loops × isolation (M24×M23), compression × compliance (M18×M22).
- UCC tie-in: the same-week retrieval + caching rollout that broke each other (the incident).
- The discipline: make the tracks compose without contradiction; integration is the real skill.

### Section 3: content — "Tradeoffs, Benchmarks, and Done"
- System-level tradeoffs: compression vs. fidelity, recall vs. positioning, caching vs. personalization, safety vs. latency. A production pipeline is a negotiated, measured set of these.
- Benchmarks define done: eval accuracy (M29), cost/request (M03), p95 latency, cache-hit (M19), guardrail/leak pass rate (M20/M23), audit completeness (M22). The system hits its targets, or it isn't done.
- Return to M00: context engineering, completed — an engineering discipline with a lifecycle and a production bar. <span>[Agent Capstones]</span> apply the same domain to the agent course.

### Section 4: code — "The Production Pipeline, Assembled"
- Language: Python
- Demonstrates: a `score_filing(request)` that composes the tracks in order — assemble (system M04 + retrieve/rerank M08/M09 + tool-shape M10 + fuse M11 + memory M13/M15), position+compress (M16/M17/M18), govern input (M20) → call (cached M19, schema-enforced output M21) → govern output + compliance (M21/M22), inside an agent loop (M24) with escalation (M27), and an `observe()` wrapper (M28) stamping the prompt version (M30). A compact, commented skeleton — pseudocode-level, every track labeled.
- UCC tie-in: the whole UCC risk decision in one annotated function, each line tagged with its module.
- This is the synthesis artifact: the course's techniques as one pipeline.

### Section 5: quiz — "Where Did the System Break?"
- Question: "Your team ships two improvements the same week: a better retriever that pulls more chunks (M09) and a prompt-caching rollout (M19). Accuracy drops, cost rises, and cache-hit falls to near zero. Each change tested fine in isolation. What does the capstone perspective say?"
- Options:
  - A. One of the two changes must be buggy; revert both and rewrite from scratch
  - B. This is a seam failure, not a single-technique bug: the larger retrieval set broke the cached prefix (cache-hit down, cost up) and pushed the key chunk into the lost-in-the-middle zone (accuracy down). Use observability (M28) to localize, the eval gate (M30) to block such combined regressions, and resolve it as a system-level tradeoff — e.g. rerank to fewer chunks (M09) to restore both positioning and the cache
  - C. Caching and retrieval are incompatible; pick one
  - D. Accuracy and cost always trade off; accept the loss
  - correct: B (index 1)
- Explanation: Each change was fine alone, but together they collided at the seams — exactly the integration failure the capstone is about. More retrieved chunks (a) enlarged and varied the prompt prefix, breaking the prompt cache (M19) and raising cost, and (b) lengthened the context, pushing the disqualifying filing into the lost-in-the-middle zone (M16) and dropping accuracy. The capstone response is systemic: observability (M28) to localize the cause to the seam, a regression gate on the eval set (M30) that would have blocked the combined change, and a system-level fix — reranking to fewer, better chunks (M09) restores positioning AND a stable cacheable prefix. Reverting and rewriting (A) discards two good ideas; the techniques aren't incompatible (C); and this isn't an inevitable tradeoff (D) — it's a fixable integration error.

### Section 6: antipattern — "Mistaking the Parts for the System"
- Anti-pattern 1: Optimizing one technique in isolation — perfecting retrieval recall while ignoring positioning, caching, and cost, so the system regresses even as the component improves.
- Anti-pattern 2: No system-level measurement — tuning components by feel with no end-to-end benchmarks (accuracy/cost/latency/safety/audit), so 'better' components yield a worse pipeline.
- Anti-pattern 3: Shipping without the production disciplines — a clever pipeline with no observability, no eval gate, and no versioning, so it works in the demo and silently drifts, breaks, or leaks in production.

## SVG Diagram Plan
**"The Whole Pipeline" — all 8 tracks composed into one end-to-end UCC request flow, on the lifecycle spine**

```
   REQUEST ─▶ ASSEMBLE ─────────▶ POSITION/COMPRESS ─▶ GOVERN-IN ─▶ CALL ─▶ GOVERN-OUT ─▶ DECISION
              T1-T3                T5                  T6           (T6)     T6/compliance
              sys·retrieve·rerank  order·compress      injection    cache    schema·PII
              ·tool·fuse·memory(T4) ·position           defense      M19      audit M22
              └──────────── inside an AGENT LOOP (T7) with human escalation ───────────┘
                                  │
              OBSERVE · EVALUATE · VERSION (T8)  ◀── measures & gates the whole thing
   ─────────────────────────────────────────────────────────────────────────────
   lifecycle spine: ASSEMBLE → POSITION → GOVERN → OBSERVE → ITERATE   (M02)
   benchmarks: accuracy · cost · p95 latency · cache-hit · leak-pass · audit-complete
```

- A horizontal request flow: REQUEST → ASSEMBLE (T1-T3) → POSITION/COMPRESS (T5) → GOVERN-IN (T6) → CALL (cached M19, schema M21) → GOVERN-OUT + compliance (T6/M22) → DECISION, with MEMORY (T4) labeled threading through assemble.
- A bracket under the middle stages: "inside an AGENT LOOP (T7) with human escalation."
- A bottom band: "OBSERVE · EVALUATE · VERSION (T8)" with an arrow up "measures & gates the whole thing."
- The lifecycle spine (M02) labeled across the bottom: ASSEMBLE → POSITION → GOVERN → OBSERVE → ITERATE.
- A benchmarks strip listing the production targets.
- Each stage tinted with its track's color (forest/leather/water/amethyst/amber/red/steel/charcoal) — a visual recap of all 8 tracks in one diagram.
- Colors: use all eight track colors per stage; charcoal #2c3e50 frame; warm paper background; Fraunces title, JetBrains Mono labels.
- Reinforces the restaurant analogy: every station in one service, judged on the meal.

## Cross-Links
- **Agent Capstones** (type: agent, label "Agent Capstones — UCC Domain"): CLAUDE.md table maps M31↔Agent Capstones (both use the UCC domain). The context-engineering capstone and the agent-course capstones share the domain; this is the context-quality view, the Agent course the pipeline-build view. Reference in the synthesis section.

## Lab Briefs

### Understand It: Audit a Whole Pipeline
- Give the learner a description of a "finished" UCC pipeline and a checklist derived from all 8 tracks; they audit it track by track, finding the gaps (e.g. no data boundary M20, unscoped retrieval M23, no eval gate M30, no per-layer observability M28, raw PII in logs M22).
- They produce a track-by-track readiness scorecard and the top 3 production-blocking gaps.
- Expected output: an 8-track audit checklist filled in for the pipeline, the gaps flagged, and the 3 highest-priority fixes ranked by risk.
- Duration: ~30 minutes.

### Build It with AI: Assemble the End-to-End Pipeline
- With Claude, assemble a working (skeleton-level) `UCCRiskPipeline.score(request)` that composes the artifacts built across the course: the M04 system prompt, M08/M09 retrieval+rerank, M10 tool shaping, M11 fusion, M13/M15 memory, M16/M18 positioning+compression, M19 caching, M20 input guardrails, M21 schema-enforced output, M22 PII/audit, M24 agent loop, M27 escalation, M28 observability, M30 version stamp — then run it on a batch and report the system benchmarks (accuracy, cost, cache-hit, leak-test pass, audit completeness).
- Steps: wire the tracks in lifecycle order → run the eval set (M29) → report the benchmark scorecard → deliberately break one seam (e.g., disable the rerank so positioning regresses) and watch the scorecard catch it.
- Expected deliverable: an end-to-end pipeline that produces governed, observable, benchmarked UCC risk decisions, plus a scorecard run showing the system meeting (and, when a seam is broken, failing) its production targets — the course, assembled.
- Duration: ~60 minutes.

## Context Engineering Takeaway
A production context pipeline is the whole restaurant, not any one dish: the eight tracks must compose without contradiction along the assemble-position-govern-observe-iterate lifecycle, the hardest failures live at the seams between them, and the system is judged on end-to-end benchmarks — accuracy, cost, latency, safety, and auditability — proving that context engineering is a measurable engineering discipline, not a bag of prompt tricks.

## Anti-Patterns
1. Optimizing one technique in isolation — perfecting a component while the system regresses, because the seams and tradeoffs were ignored.
2. No system-level measurement — tuning by feel with no end-to-end benchmarks, so 'better' parts make a worse pipeline.
3. Shipping without the production disciplines — no observability, eval gate, or versioning, so the pipeline works in the demo and drifts, breaks, or leaks in production.

## Continuity Notes
- **Builds on:** EVERY prior module. M00 (the definition this proves out), M02 (the lifecycle spine), and one technique from each track composed into the pipeline. Explicitly references T1-T8.
- **Referenced by:** Nothing — this is the terminal module. It closes the course by demonstrating context engineering as a complete, production-grade discipline over the UCC domain, and hands off to the Agent course capstones (same domain, pipeline-build view) and the AI-SDLC series (process integration).
