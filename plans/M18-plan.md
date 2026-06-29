# M18 Plan — Context Compression: Summarization, Distillation, Pruning

## Module Identity
- **ID:** M18
- **Track:** 5 (Context Positioning & Optimization)
- **Title:** Context Compression — Summarization, Distillation, Pruning
- **Subtitle:** Making context smaller while keeping the signal — extractive, abstractive, and structural techniques and their tradeoffs
- **Icon:** 🗜️
- **Color:** #b8860b (amber)

## Everyday Analogy
**Three Ways to Fit a Carry-On**

You can't bring the whole closet, so you compress — and there are three distinct moves. You **pick the essential outfits** and leave the rest, taking only the actual garments you'll wear (extractive: keep the exact best pieces, drop the rest). You **pack versatile items** — one jacket that works for five outfits instead of five jackets (abstractive: replace many things with a smaller thing that covers the same ground). And you **skip the winter coat entirely** because you're going somewhere warm — it's irrelevant to this trip (pruning: drop what this context doesn't need at all). Good packing uses all three, and the skill is knowing which move applies to which item — and not compressing away the one thing you'll actually need.

Mapping:
- Picking the exact outfits you'll wear → extractive compression (select verbatim spans)
- One versatile jacket for five outfits → abstractive compression (summarize/rewrite smaller)
- Skipping the irrelevant winter coat → pruning (drop irrelevant context entirely)
- Over-packing a tiny bag → no compression, overflow
- Forgetting the one thing you needed → lossy compression that drops the load-bearing fact
- Using all three moves → a real compression pipeline

## Key Topics (5)
1. **Why compress — and what compression buys** — Compression is how you stay at the knee of M03's curve and shrink M16's middle trough: fewer tokens means lower cost, faster latency, and shallower lost-in-the-middle. It's the active response to a fixed window — not a nice-to-have but the lever that makes large source material usable.
2. **Extractive compression** — Keep the most relevant spans verbatim, drop the rest (top-sentence selection, relevant-field projection, span extraction). Lossless for what it keeps, so it preserves exact wording and provenance — but it can only ever shorten by deletion, not rephrasing. *(UCC domain example lives here.)*
3. **Abstractive compression** — Generate a shorter restatement (an LLM summary/distillation) that conveys the same meaning in fewer tokens. Far higher compression ratios than extraction, but lossy and risky: it can drop or distort facts, lose exact identifiers, and introduce summary hallucinations. Use where gist beats verbatim.
4. **Pruning (structural)** — Drop whole units that are irrelevant to this query (irrelevant chunks, unused fields, stale turns, dedup — M10/M11/M12 reappear). The cheapest, safest compression because it removes only what isn't needed, with no rephrasing risk.
5. **Compression ratio vs. fidelity — the core tradeoff** — Every technique trades size against faithfulness. Pruning is safe but limited; extraction is faithful but bounded; abstraction is powerful but lossy. The discipline: prune first, extract what must stay verbatim (IDs, decisions), abstract only the tolerant remainder, and verify the load-bearing facts survived.

UCC domain example appears in: Topic 2 — compressing a debtor's 30-filing history for a risk call: pruning drops terminated and irrelevant filings; extraction keeps the exact lien IDs, secured-party names, and dates verbatim (you must not paraphrase an identifier); abstraction summarizes the routine narrative ("12 routine equipment filings, 2019-2023, all terminated") — combining all three to fit the budget without losing a single active-lien identifier.

## Sections Outline

### Section 1: content — "Compression Is the Response to a Fixed Window"
- Reframe: the window is fixed (M01), context wants to grow (Tracks 3-4), so compression is the active lever that reconciles them.
- What it buys, concretely: cost (M03 knee), latency, and a shallower lost-in-the-middle trough (M16) — three wins from one move.
- Preview the three families: pruning (drop), extraction (keep verbatim), abstraction (rewrite smaller).

### Section 2: content — "Three Techniques and Their Tradeoffs"
- Pruning: drop whole irrelevant units (chunks, fields, stale turns, duplicates). Cheapest, safest, but limited ceiling — you can only drop what's truly unneeded.
- Extractive: select the best spans verbatim. Faithful, preserves exact wording/provenance (critical for identifiers), but bounded — deletion only.
- Abstractive: LLM restatement. High ratios, but lossy — can drop facts, mangle identifiers, hallucinate. The UCC rule: never abstract an exact identifier; never abstract a load-bearing decision.

### Section 3: code — "A Three-Stage Compression Pipeline"
- Language: Python
- Demonstrates: `compress(history, query)` that (1) prunes terminated/irrelevant filings, (2) extracts exact active-lien identifiers verbatim into a kept set, and (3) abstracts the remaining routine narrative into a one-line summary — printing the token reduction and asserting the active-lien IDs survived.
- UCC tie-in: 30-filing history → a compact block with verbatim active-lien IDs + an abstractive rollup of the routine remainder; a fidelity check confirms no identifier was paraphrased away.
- Order matters: prune → extract → abstract (safest-first).

### Section 4: quiz — "What Not to Abstract"
- Question: "You're compressing a debtor's 30-filing history to fit the budget. An LLM-summarization step shrinks it 10x but, in testing, occasionally rewrites a filing ID '2024-FL-0012345' as '2024-FL-0012354' and merges two distinct liens into one. What's the right fix?"
- Options:
  - A. Accept it — a 10x reduction is worth occasional small errors
  - B. Don't abstract load-bearing identifiers: prune irrelevant filings, keep exact lien IDs/parties/dates via EXTRACTIVE (verbatim) compression, and use abstraction only for the routine narrative — then verify identifiers survived
  - C. Use a bigger model for summarization so it stops making mistakes
  - D. Stop compressing entirely and just send all 30 filings
  - correct: B (index 1)
- Explanation: Abstractive compression is lossy by nature — it rewrites, and rewriting an identifier or merging two liens corrupts the exact facts a risk decision depends on. The fix isn't to abandon compression (D, which overflows/dilutes) or trust a bigger model to be perfectly faithful (C, still lossy). It's to apply the right technique per content type: prune the irrelevant, EXTRACT identifiers/decisions verbatim (never rephrased), and reserve abstraction for the tolerant routine narrative — then verify the load-bearing facts survived. Match technique to fidelity requirement.

### Section 5: antipattern — "Compressing Away the Signal"
- Anti-pattern 1: Abstracting identifiers — summarizing exact IDs, amounts, names, or decisions that must be preserved verbatim, corrupting the facts a decision depends on.
- Anti-pattern 2: One-technique-for-everything — abstracting all content (lossy where it shouldn't be) or only pruning (leaving it too big), instead of matching technique to content.
- Anti-pattern 3: No fidelity check — compressing without verifying the load-bearing facts survived, so silent information loss reaches the decision.

## SVG Diagram Plan
**"Three Compression Moves" — a fidelity-vs-ratio map plus the prune→extract→abstract pipeline**

```
   fidelity
     ^  ● PRUNE (drop irrelevant)      safe, limited
     |   ● EXTRACT (verbatim spans)    faithful, bounded
     |        ● ABSTRACT (rewrite)     powerful, lossy
     +---------------------------------------> compression ratio

   PIPELINE:  [30 filings] ─prune─▶ [drop terminated] ─extract─▶
              [keep exact lien IDs] ─abstract─▶ ["12 routine, all term."]
              ▼  verify: active-lien IDs survived ✓
```

- Top: a scatter/map with fidelity (y) vs. compression ratio (x), three labeled points: PRUNE (high fidelity, low ratio), EXTRACT (high fidelity, medium ratio), ABSTRACT (lower fidelity, high ratio) — showing the tradeoff frontier.
- Bottom: a left-to-right pipeline: "30 filings" → PRUNE (drop terminated) → EXTRACT (keep exact lien IDs verbatim, shown as a pinned chip) → ABSTRACT (routine remainder → one line) → a small "verify ✓ identifiers survived" gate.
- The extracted ID chip highlighted (must-stay-verbatim); a red "✗ never abstract IDs" warning near the abstract step.
- Colors: amber #b8860b primary; green-ish for high-fidelity prune/extract; signal-red #c0392b on "never abstract IDs" and the fidelity warning; deep-water accent on the verify gate; warm paper background; Fraunces title, JetBrains Mono labels.
- Reinforces the carry-on analogy: pick outfits (extract), versatile jacket (abstract), skip the coat (prune).

## Cross-Links
- None tagged in the curriculum map for M18. `crosslinks: []`. (In prose, lean on M03 (knee), M16 (shrinking the trough), M10/M11/M12 (pruning = shaping/dedup/history compression), and forward to M19 (caching the compressed-but-stable parts) — but no formal Agent/SDLC tags.)

## Lab Briefs

### Understand It: Measure Ratio vs. Fidelity
- Give the learner a 30-filing debtor history and three compressors (prune-only, extractive, abstractive); they compress with each, measure the token-reduction ratio, and check fidelity (did exact active-lien IDs survive? were any liens merged/lost?).
- Expected output: a 3-row table (technique → ratio → fidelity: IDs preserved? facts lost?) showing abstraction wins ratio but loses fidelity, pruning is safe but limited, extraction is faithful but bounded.
- Duration: ~25 minutes.

### Build It with AI: A Tiered Compression Pipeline
- With Claude, build `compress(history, query, budget)` that prunes irrelevant/terminated filings, extracts exact identifiers (IDs, parties, dates, decisions) verbatim, abstracts only the routine remainder, stops at a token budget, and runs a fidelity assertion that every active-lien ID survived.
- Steps: prune → extract verbatim → abstract remainder → enforce budget → fidelity check (assert identifiers intact) → run a risk decision on compressed vs. full history and confirm the same verdict at a fraction of the tokens.
- Expected deliverable: a tiered compressor + a demo hitting the budget while preserving every active-lien identifier, with a fidelity check that fails loudly if an identifier is corrupted.
- Duration: ~40 minutes.

## Context Engineering Takeaway
Compression is how a fixed window holds large source material: prune what's irrelevant, extract what must stay verbatim, abstract only the tolerant remainder, and always verify the load-bearing facts survived — because the goal is fewer tokens with the signal intact, never a smaller context that lost the one identifier the decision needed.

## Anti-Patterns
1. Abstracting identifiers — summarizing exact IDs, amounts, names, or decisions that must be preserved verbatim, corrupting the facts a decision depends on.
2. One-technique-for-everything — abstracting all content or only pruning, instead of matching the technique to each content type's fidelity requirement.
3. No fidelity check — compressing without verifying the load-bearing facts survived, letting silent information loss reach the decision.

## Continuity Notes
- **Builds on:** M03 (compression keeps you at the knee), M16 (shorter context = shallower trough), M10 (tool-result shaping is pruning + extraction), M11 (dedup is pruning), M12 (history summarization is abstractive compression). The optimization half of Track 5.
- **Referenced by:** M19 (cache the stable compressed prefix), M24 (agent context compaction is compression in the loop), M31 (the capstone compresses multi-source context to fit). With M16-M17 (positioning/ordering) and M18 (compression), Track 5 completes the shaping of the final window; M19 then optimizes its cost.
