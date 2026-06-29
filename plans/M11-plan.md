# M11 Plan — Multi-Source Context Fusion

## Module Identity
- **ID:** M11
- **Track:** 3 (Dynamic Context Assembly)
- **Title:** Multi-Source Context Fusion
- **Subtitle:** Combining retrieval, tools, and memory into one coherent context — deduping, resolving conflicts, ordering by priority and freshness
- **Icon:** 🔀
- **Color:** #2e6b8a (deep water)

## Everyday Analogy
**The Reporter Writing One Story from Four Sources**

A reporter covering a story interviews four sources: a press release, a witness, a public record, and an anonymous tip. They don't staple the four accounts together and call it an article. They reconcile them: where three agree, state it as fact; where the public record contradicts the press release, trust the record and note the discrepancy; drop the duplicated quote that two sources gave; and attribute each claim so the reader knows where it came from. Context fusion is the same editorial job: multiple sources flow into one window, and your job is to dedupe, resolve conflicts by trust and freshness, and present a single coherent, attributed account — not a pile of raw clippings.

Mapping:
- Four interview sources → retrieval, tools, memory, user input (multiple context sources)
- Stapling accounts together → naive concatenation of all sources
- Reconciling where they agree/disagree → conflict resolution
- Trusting the public record over the press release → source trust/priority ranking
- Dropping the duplicated quote → deduplication
- Attributing each claim → provenance tagging in the fused context
- The freshest account winning on a changed fact → freshness/recency weighting

## Key Topics (5)
1. **The context assembly graph** — Real requests pull from several sources at once: retrieved documents, tool/API results, memory, the user's message. Fusion is the step that turns these parallel inputs into one ordered, coherent context — a graph of sources converging on the window.
2. **Deduplication** — Different sources often carry the same fact (a filing returned by both retrieval and a tool). Duplicates waste budget and can falsely amplify a claim ("three sources say…" when it's one fact echoed thrice). Dedupe by content, keeping the best-attributed copy.
3. **Conflict resolution** — Sources disagree (memory says debtor is LOW risk; a fresh tool result shows a new lien). Resolution rules combine trust tier (M05) and freshness: a verified, recent record beats a stale cached belief. Surfacing the conflict beats silently picking one. *(UCC domain example lives here.)*
4. **Priority and freshness ordering** — After dedupe and conflict resolution, order the fused context by a blend of trust, relevance, and recency — and place it using positional effects (M01/M16). Fresh, high-trust, high-relevance content earns the privileged positions.
5. **Provenance and coherence** — Every fused claim should carry its source so the model (and an auditor) can trace it. Coherence means the window reads as one account, not stitched fragments — consistent format, resolved contradictions, no orphaned duplicates.

UCC domain example appears in: Topic 3 — fusing three sources for a risk call: (a) cached memory says "debtor LOW risk, last reviewed 2023," (b) a fresh `get_debtor_history` tool result shows a new 2024 lien, (c) a retrieved filing confirms the lien. Fusion must let the fresh, corroborated tool/retrieval evidence override the stale memory, flag the change, and attribute each claim — rather than averaging them or trusting whichever came last.

## Sections Outline

### Section 1: content — "Many Streams, One Window"
- Real requests assemble from parallel sources: retrieval, tools, memory, user input — the context assembly graph.
- Naive approach: concatenate everything in arrival order. Failure modes follow: duplicates, contradictions, no provenance, bad ordering.
- Fusion is the editorial step that produces one coherent, ordered, attributed context from many streams.

### Section 2: content — "Dedupe, then Resolve Conflicts"
- Dedup: the same fact arrives via multiple sources; keep one well-attributed copy. Danger of false amplification (one fact echoed looks like consensus).
- Conflict resolution: combine M05's trust tiers with freshness. A verified, recent record outranks a stale cached belief; a high-trust source outranks an untrusted one even if newer (an injected "fresh" claim doesn't win).
- Surface, don't suppress: when sources genuinely conflict on a material fact, flag it with both values and their provenance rather than silently choosing.

### Section 3: code — "Fusing Three UCC Sources"
- Language: Python
- Demonstrates: a `fuse(sources)` that takes memory, tool, and retrieval items (each tagged with source, trust, timestamp, content), dedupes by normalized content, resolves conflicts by (trust, freshness), orders by a priority score, and emits attributed, coherent context — flagging the stale-memory-vs-fresh-lien conflict.
- UCC tie-in: the cached "LOW risk (2023)" vs. fresh "+1 lien (2024)" conflict resolved in favor of the corroborated fresh evidence, with a flag and provenance.
- Show the fused output as labeled, ordered evidence ready for the window.

### Section 4: quiz — "Stale Belief vs. Fresh Record"
- Question: "Assembling context for a UCC risk call, you have three sources: (a) cached memory: 'debtor LOW risk, reviewed 2023-04'; (b) a fresh get_debtor_history tool result: 'new lien filed 2024-09'; (c) a retrieved filing corroborating the 2024 lien. Naive concatenation lists all three. What should fusion do?"
- Options:
  - A. Trust the cached memory — it's the system's own prior conclusion and most concise
  - B. Resolve the conflict by trust and freshness: the corroborated 2024 tool+retrieval evidence overrides the stale 2023 memory; flag the change and attribute each claim
  - C. Average the three into a MEDIUM risk score
  - D. Keep whichever source appears last in the assembled window
  - correct: B (index 1)
- Explanation: Fusion isn't concatenation. Two fresh, mutually-corroborating, high-trust sources (a tool result and a retrieved filing) reporting a 2024 lien should override a stale 2023 cached belief — and the change should be flagged with provenance, not buried. Averaging (C) invents a number no source supports; trusting memory (A) ignores newer verified evidence; last-wins (D) makes authority a function of position, the exact error M05 warned against.

### Section 5: antipattern — "Stapling the Clippings"
- Anti-pattern 1: Naive concatenation — dumping all sources in arrival order, producing duplicates, contradictions, and no provenance.
- Anti-pattern 2: False amplification via duplicates — the same fact from three sources read as strong consensus, skewing the model's confidence.
- Anti-pattern 3: Silent conflict resolution — picking one value when sources materially disagree without flagging it, hiding a discrepancy a human needed to see (especially dangerous in risk/compliance).

## SVG Diagram Plan
**"The Fusion Pipeline" — three source streams converging through dedupe → resolve → order → window**

```
  MEMORY ───┐   "LOW risk (2023)"   [stale]
  TOOL ─────┤   "+1 lien (2024)"    [fresh, trust=high]
  RETRIEVAL ┘   "lien confirmed"     [fresh, trust=high]
       │
   ┌───▼────┐   ┌──────────┐   ┌──────────┐
   │ DEDUPE │ → │ RESOLVE  │ → │  ORDER   │ → [coherent, attributed window]
   │ by     │   │ trust ×  │   │ priority │
   │ content│   │ freshness│   │ + place  │
   └────────┘   └──────────┘   └──────────┘
                 conflict → FLAG, don't hide
```

- Three labeled source streams (MEMORY, TOOL, RETRIEVAL) each with a sample claim and a freshness/trust tag, converging into a horizontal pipeline: DEDUPE → RESOLVE → ORDER → window.
- The RESOLVE box annotated "trust × freshness" with a callout "conflict → FLAG, don't hide."
- MEMORY's stream shown faded/struck (stale, overridden); TOOL + RETRIEVAL streams bold (fresh, corroborating).
- Output labeled "one coherent, attributed account" (echoing the reporter analogy).
- Colors: deep-water #2e6b8a for the pipeline; muted/struck grey for the overridden stale source; signal-red #c0392b for the conflict-FLAG callout; amber accent on ORDER (positioning tie to M01/M16); warm paper background; Fraunces title, JetBrains Mono labels.
- Reinforces the reporter analogy: four sources → one attributed story.

## Cross-Links
- None tagged in the curriculum map for M11. `crosslinks: []`. (In prose, lean on M05 trust tiers, M09 RRF for combining rankings, M10 shaping of tool inputs, and M14 freshness/decay as a forward reference — but no formal Agent/SDLC tags.)

## Lab Briefs

### Understand It: Spot the Fusion Failures
- Give the learner a naively concatenated context for a UCC risk call containing duplicates, a stale-vs-fresh conflict, and missing provenance.
- They identify each defect: which facts are duplicated (false amplification), where sources conflict and which should win (trust × freshness), and what lacks attribution.
- Expected output: an annotated context marking duplicates, the conflict + correct resolution with justification, and the provenance gaps — plus the risk score a correct fusion would yield vs. the naive one.
- Duration: ~25 minutes.

### Build It with AI: A Context Fusion Engine
- With Claude, build `fuse(sources)` that dedupes by normalized content, resolves conflicts by (trust tier, freshness), orders by a priority score, attaches provenance, and flags material conflicts — emitting one coherent context block.
- Steps: define a tagged source item schema (source, trust, timestamp, content) → dedupe → resolve (trust × freshness, flag genuine conflicts) → order + format with provenance → run a risk decision on fused vs. naive context and compare.
- Expected deliverable: a fusion engine + a before/after showing the naive concatenation producing a wrong/over-amplified risk score and the fused context producing the correct, flagged, attributed result.
- Duration: ~40 minutes.

## Context Engineering Takeaway
Fusing multiple context sources is editorial work, not concatenation: dedupe to avoid false amplification, resolve conflicts by trust and freshness while flagging genuine disagreements, and emit one coherent, attributed account so the model reasons over a story, not a pile of clippings.

## Anti-Patterns
1. Naive concatenation — all sources in arrival order, yielding duplicates, contradictions, and no provenance.
2. False amplification via duplicates — one fact echoed by several sources read as strong consensus.
3. Silent conflict resolution — quietly picking one value when sources materially disagree, hiding a discrepancy a human (or auditor) needed to see.

## Continuity Notes
- **Builds on:** M08 (retrieval), M09 (RRF for combining rankings reappears in fusion; reranking-style scoring), M10 (tool results — a fused source), M05 (trust tiers drive conflict resolution), M01/M16 (placing the fused result by position), M03 (dedupe reclaims budget). Fusion is where Track 3's individual sources come together.
- **Referenced by:** Track 4 / M14 (context decay & freshness — the freshness signal fusion relies on), M13 (multi-layer memory is one fused source), M22 (provenance/attribution for compliance audit trails), Track 7 / M26 (multi-agent context sharing fuses outputs from several agents). Closes Track 3 — the dynamic-assembly track — and hands off to Track 4's temporal/memory dimension.
