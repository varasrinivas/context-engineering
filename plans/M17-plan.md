# M17 Plan — Context Ordering Strategies: What Goes Where and Why

## Module Identity
- **ID:** M17
- **Track:** 5 (Context Positioning & Optimization)
- **Title:** Context Ordering Strategies — What Goes Where and Why
- **Subtitle:** Sequencing the whole window deliberately — standard orderings, when to break them, and narrative structure
- **Icon:** 🔢
- **Color:** #b8860b (amber)

## Everyday Analogy
**The Lawyer Presenting a Case to a Jury**

A trial lawyer never dumps every document on the jury in the order they happened to arrive. They sequence deliberately: open with the framing ("this case is about a broken promise"), lay out the evidence in a logical build, address the opposing argument before the other side can, and close with the single point they want the jury holding in mind as they deliberate. Same facts, different order, completely different verdict. Ordering context is courtroom craft: the model is your jury, and the sequence you present — not just the contents — shapes the conclusion it reaches.

Mapping:
- Opening framing statement → instructions/system context first (set the frame)
- Evidence in a logical build → ordering data so each piece supports the next
- Addressing the counter-argument → placing caveats/conflicts where they land best
- The closing the jury holds onto → the final position (recency) gets the key ask
- Not presenting in arrival order → rejecting naive concatenation order
- Same facts, different verdict → same context, different output by sequence

## Key Topics (5)
1. **The standard ordering (and why it's the default)** — A reliable default sequence: system/instructions first, then stable reference, then retrieved/dynamic context, then the conversation/recent turns, with the actual task/question last. It puts the frame at primacy and the ask at recency (M16), with bulk in the tolerant middle.
2. **When to break the standard order** — The default isn't sacred. Reasons to deviate: a single critical fact that must not be missed (pull it to an edge), a task where the question must frame the reading of the data (question-first), or output-format anchoring (put the canonical example last). Know the rule, then know when to break it.
3. **Interleaving vs. grouping** — Should related items be grouped (all of a debtor's filings together) or interleaved (by relevance/recency across debtors)? Grouping aids coherence and reduces dedup confusion; interleaving by relevance exploits positioning. The choice depends on whether the task reasons within-source or across-source. *(UCC domain example lives here.)*
3b. (merged into above)
4. **Narrative ordering** — Sometimes the best order is a story, not a ranking: present context so it builds an argument the model can follow (background → evidence → tension/conflict → the question). Narrative coherence can beat pure relevance-ranking for reasoning tasks, because each piece primes the next.
5. **Ordering as an independent, testable lever** — Order is a design choice you can A/B test like any other, holding contents constant. The same retrieved set, reordered, measurably changes accuracy — so ordering deserves its own evaluation, not a default you never revisit.

UCC domain example appears in: Topic 3 — assembling context for a related-party risk analysis across 3 debtors with 12 filings. Grouping by debtor (all of ACME's filings, then HOLDINGS', then LOGISTICS') helps the model reason about each entity but obscures the cross-entity shared-address signal; interleaving by the shared-address relationship surfaces the related-party pattern. The right order depends on whether the question is per-entity or cross-entity.

## Sections Outline

### Section 1: content — "The Standard Order and Its Logic"
- Present the reliable default: system/instructions → stable reference → dynamic/retrieved context → recent conversation → the task/question (last).
- Tie to M16: frame at primacy, ask at recency, bulk in the middle. The default is "good positioning by construction."
- This is a starting point, not a law — the rest of the module is about when and how to deviate with intent.

### Section 2: content — "Breaking the Order: Interleaving, Grouping, Narrative"
- When to deviate: a must-not-miss fact (pull to an edge, M16); question-first when the question should frame how the data is read; canonical example last for format anchoring (M07).
- Interleaving vs. grouping: group for within-source coherence and dedup clarity; interleave by relevance/relationship for cross-source patterns. UCC related-party example (group-by-debtor hides the shared-address signal; interleave-by-relationship surfaces it).
- Narrative ordering: sequence context as background → evidence → conflict → question so each piece primes the next — often beats raw relevance order for reasoning tasks.

### Section 3: code — "Two Orderings of the Same Filings"
- Language: Python
- Demonstrates: the same set of 12 filings across 3 related debtors assembled two ways — `group_by_debtor()` vs. `interleave_by_relationship()` (clustering on shared address) — for a related-party risk question.
- UCC tie-in: prints both assembled contexts; the interleaved one places the shared-address filings adjacent so the related-party pattern is visible, while grouping scatters them across three blocks.
- Keep it as assembly/ordering logic (no model call needed to show the structural difference); note which order fits the cross-entity question.

### Section 4: quiz — "Group or Interleave?"
- Question: "You're assembling context to answer 'are these 3 debtors actually related parties hiding behind separate entities?' You have 12 filings across the 3 debtors, and the key signal is that several share a registered address. Should you group filings by debtor or interleave them?"
- Options:
  - A. Group by debtor — it's the cleanest, most organized structure
  - B. Interleave by the shared-address relationship so the related-party signal sits adjacent and visible, because the question is cross-entity; grouping by debtor scatters the very signal the task depends on
  - C. Order doesn't matter as long as all 12 filings are present
  - D. Put all 12 in random order to avoid bias
  - correct: B (index 1)
- Explanation: The question is cross-entity (a relationship that spans the three debtors), and the signal — a shared address — only becomes obvious when those filings are adjacent. Grouping by debtor (A) is tidy but scatters the shared-address filings across three separate blocks, hiding the pattern. Order is not irrelevant (C) — the same 12 filings reordered measurably change whether the model spots the relationship — and randomization (D) just forfeits the lever. Match the ordering to the question's structure: cross-entity questions want relationship-interleaving; per-entity questions want grouping.

### Section 5: antipattern — "Order by Accident"
- Anti-pattern 1: Arrival-order assembly — sequencing context by whatever order it was retrieved/returned, ignoring positioning and the task's structure entirely.
- Anti-pattern 2: Grouping when the question is cross-cutting — tidy per-source blocks that scatter a cross-source signal the task depends on (or vice versa).
- Anti-pattern 3: Never testing order — treating the default sequence as fixed and never A/B-ing alternatives, leaving an easy, free accuracy lever untouched.

## SVG Diagram Plan
**"Same Facts, Different Order" — the standard stack plus a group-vs-interleave comparison**

```
   STANDARD ORDER (default)           GROUP vs INTERLEAVE (cross-entity Q)
   ┌───────────────────────┐          group by debtor      interleave by relation
   │ system / instructions │ primacy  [ACME ACME ACME]      [ACME·addr] [HOLD·addr]
   │ stable reference      │          [HOLD HOLD HOLD]      [LOGI·addr]  ← adjacent!
   │ dynamic / retrieved   │ middle   [LOGI LOGI LOGI]      [ACME] [HOLD] [LOGI]
   │ recent conversation   │          signal SCATTERED      signal VISIBLE
   │ the task / question   │ recency
   └───────────────────────┘
        frame first, ask last        match order to the question's shape
```

- Left: the standard-order stack (5 labeled bands) with "primacy" at top and "recency" at bottom marked, "frame first, ask last."
- Right: two mini-layouts side by side — "group by debtor" (three solid colored blocks, the shared-address filings scattered/marked) vs. "interleave by relationship" (the shared-address filings pulled adjacent and highlighted) — with captions "signal scattered" vs. "signal visible."
- A connecting caption: "match the order to the question's shape."
- Colors: amber #b8860b primary; a highlight color (deep-water #2e6b8a) for the shared-address signal filings; signal-red on "scattered"; green-ish on "visible"; warm paper background; Fraunces title, JetBrains Mono labels.
- Reinforces the lawyer analogy: deliberate sequencing, not arrival order.

## Cross-Links
- None tagged in the curriculum map for M17. `crosslinks: []`. (In prose, lean on M16 (positions), M07 (canonical example last), M11 (fusion order), and forward to evaluation in Track 8 — but no formal Agent/SDLC tags.)

## Lab Briefs

### Understand It: Reorder and Re-measure
- Give the learner a fixed set of retrieved UCC filings and a cross-entity question; they assemble it three ways (arrival order, group-by-debtor, interleave-by-relationship) and run each.
- They record which orderings surface the related-party signal and which bury it — holding contents constant.
- Expected output: a 3-row table (ordering → did the model find the relationship? → why) demonstrating that order alone changes the answer.
- Duration: ~25 minutes.

### Build It with AI: An Order Strategy Selector
- With Claude, build assemblers for the standard order, group-by-key, and interleave-by-relationship, plus a `choose_order(question_type)` that selects the strategy from the question's shape (per-entity vs. cross-entity vs. format-sensitive).
- Steps: implement the three orderings → a selector keyed on question type → run a per-entity question and a cross-entity question, each with the selected vs. a mismatched order → confirm the selected order wins.
- Expected deliverable: the three assemblers + selector, and a demonstration that the fitted ordering beats a mismatched one on each question type (cross-entity → interleave, per-entity → group).
- Duration: ~40 minutes.

## Context Engineering Takeaway
Ordering is an independent, testable lever: sequence the window deliberately — frame first, ask last, bulk in the middle — and match the structure to the task, grouping for within-source coherence but interleaving by relationship when the signal is cross-source, because the same contents in a different order reach a different conclusion.

## Anti-Patterns
1. Arrival-order assembly — sequencing by whatever order context was retrieved, ignoring positioning and the task's structure.
2. Grouping a cross-cutting question (or interleaving a per-entity one) — an order that scatters the very signal the task depends on.
3. Never testing order — treating the default sequence as fixed and leaving a free accuracy lever untouched.

## Continuity Notes
- **Builds on:** M16 (positional effects — ordering is how you exploit them across the whole window), M11 (fusion produces items that must then be ordered), M07 (canonical-example-last is an ordering rule), M04 (section ordering within the system prompt). The second half of Track 5's positioning story.
- **Referenced by:** M18 (compression changes what's available to order), M29 (A/B testing — ordering is a prime thing to test), M31 (the capstone pipeline orders a fused, multi-source context). Sets up that ordering and compression together determine the final shape of the window.
