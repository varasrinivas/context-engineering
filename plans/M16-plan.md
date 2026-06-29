# M16 Plan — Positional Effects: Primacy, Recency, and Lost-in-the-Middle

## Module Identity
- **ID:** M16
- **Track:** 5 (Context Positioning & Optimization)
- **Title:** Positional Effects — Primacy, Recency, and Lost-in-the-Middle
- **Subtitle:** Where a fact sits in the window changes whether the model uses it — the research, and what to do about it
- **Icon:** 📐
- **Color:** #b8860b (amber)

## Everyday Analogy
**Reading a Long Newspaper Article**

Think about how you actually read a long article. You read the headline and opening paragraphs carefully — that's where you decide what it's about (primacy). You remember the closing line, the kicker (recency). But the dense middle columns? You skim. If the single most important fact is buried in paragraph 14 of 30, you'll probably miss it — not because you can't read, but because of *where* it sits. Editors know this: they put the lede up top and the punch line at the end, and they never bury the one thing readers must not miss in the middle. Positioning context for an LLM is the same craft — the model reads its window like you read that article.

Mapping:
- Carefully-read opening paragraphs → primacy (start of the window gets strong attention)
- The memorable closing line → recency (end of the window gets strong attention)
- Skimmed middle columns → lost-in-the-middle (degraded attention mid-window)
- Burying the key fact in paragraph 14 → placing critical context in the dead zone
- The editor's lede-and-kicker craft → deliberate positional design
- Same reader, different recall by position → same model, position-dependent performance

## Key Topics (5)
1. **Primacy and recency are real and measurable** — Models attend more strongly to the beginning and end of the context window. This is not folklore; it's a reproducible effect (the "lost-in-the-middle" research). The same fact yields different accuracy depending only on where it's placed.
2. **The lost-in-the-middle curve** — Retrieval/recall accuracy plotted against the position of the relevant fact is U-shaped: high at the start, dipping in the middle, recovering at the end. The longer the context, the deeper and wider the middle trough. *(UCC domain example lives here.)*
3. **Why it happens (intuition)** — Attention and positional encoding don't distribute capacity uniformly; long sequences spread attention thin and the middle competes hardest. You don't need the math (M01) to use the consequence: middle = least reliable real estate.
4. **Positional strategies** — The practical moves: put the most critical instruction/fact at the start (primacy) or end (recency), keep the dead middle for low-stakes bulk, and shorten the context so there's less middle to get lost in. Position is a lever you control at assembly time.
5. **Measuring it for your own stack** — The effect's size depends on the model, context length, and task. Don't assume — run a positional probe ("needle in a haystack") on your own pipeline to find where your model's middle trough is and how long a context you can trust.

UCC domain example appears in: Topic 2 — a risk call with 40 retrieved filing chunks where the one disqualifying lien is placed at position 20 of 40 (dead center); the model misses it and scores LOW, but the same lien at position 1 or 40 is caught and scores HIGH — a positional probe over the UCC corpus drawing the U-curve.

## Sections Outline

### Section 1: content — "Position Is Performance"
- State the effect plainly: models attend most to the start (primacy) and end (recency) of the window, least to the middle.
- This is measurable and reproducible (lost-in-the-middle research), not a quirk. The same content, same model, different position → different accuracy.
- Reframe everything assembled so far (Tracks 2-4): once you've chosen *what* goes in the window, *where* it goes is a second, independent decision that can make or break it.

### Section 2: content — "The Lost-in-the-Middle Curve"
- The U-shaped curve: accuracy vs. position-of-the-relevant-fact — high at edges, trough in the middle.
- Context length amplifies it: the longer the window, the deeper/wider the middle trough (ties back to M03 — long context isn't just costly, it's positionally unreliable).
- UCC tie-in: the disqualifying lien at position 20/40 missed; at 1 or 40 caught. The model's competence didn't change; the position did.

### Section 3: code — "A Needle-in-a-Haystack Positional Probe"
- Language: Python
- Demonstrates: a probe that inserts a known "needle" fact (a specific lien) at varying positions in a long haystack of filler filings, asks the model to retrieve/use it, and records accuracy by position — producing the data for the U-curve.
- UCC tie-in: the needle is a disqualifying lien; the haystack is routine filings; output is an accuracy-by-position table you can plot.
- Emphasize: this is how you measure the effect for YOUR model/length, not assume it.

### Section 4: quiz — "Where Did the Lien Go?"
- Question: "Your UCC risk pipeline stuffs 40 retrieved filing chunks into one call. For a specific debtor it scores LOW, missing a disqualifying lien you've confirmed is in chunk 20 of 40. Moving that same chunk to position 1 or 40 makes the model catch it and score HIGH. What's happening and what's the fix?"
- Options:
  - A. The model can't process 40 chunks; upgrade to a larger model
  - B. Lost-in-the-middle: the disqualifying chunk sits in the low-attention middle of a long context; fix by positioning critical chunks at the start/end and/or shortening the context (fewer, reranked chunks)
  - C. The chunk was never actually retrieved; it's a retrieval bug
  - D. Risk scoring is non-deterministic; just retry until it catches it
  - correct: B (index 1)
- Explanation: The chunk IS in the window (moving it fixes the result), so it's not a retrieval bug (C) or a model-capacity issue (A) — it's positional. A long 40-chunk context has a deep middle trough where attention is weakest, and the disqualifying lien landed there. The fix is positional: place critical content at the start (primacy) or end (recency), and shorten the context (rerank to fewer chunks per M09) so there's less middle to get lost in. Retrying (D) gambles instead of fixing the cause.

### Section 5: antipattern — "Burying the Lede"
- Anti-pattern 1: Critical-fact-in-the-middle — placing the single most important instruction or fact in the dead zone, then being surprised it's ignored.
- Anti-pattern 2: Assuming uniform recall — treating a 100K-token window as if every position is read equally, so retrieval/assembly ignores position entirely.
- Anti-pattern 3: Length without positioning — pushing context longer (more chunks "to be safe") which deepens the middle trough, making the very thing you added harder to find.

## SVG Diagram Plan
**"The Lost-in-the-Middle Curve" — accuracy-vs-position U-curve with the UCC needle annotated**

```
 recall
   ^  ●high                                    high●
   |    \                                       /
   |     \              ● the lien              /
   |      \____________ (pos 20/40) __________/
   |                  ●lowest (missed)
   +------------------------------------------------> position in window
     START (primacy)        MIDDLE (lost)         END (recency)
   ┌──────────────────────────────────────────────────┐
   │ ✓ place critical context at edges                 │
   │ ✓ shorten context → shallower middle              │
   └──────────────────────────────────────────────────┘
```

- A U-shaped curve: recall (y) vs. position-in-window (x), high at both ends, deep trough in the middle.
- A "needle" marker (the disqualifying lien) sitting at the bottom of the trough (position 20/40), labeled "missed here," with ghosted markers at the edges labeled "caught here."
- Two overlaid curves: a shallower U for "short context" and a deeper/wider U for "long context," showing length amplifies the trough.
- Zone labels under the x-axis: START (primacy), MIDDLE (lost), END (recency).
- A fix banner: "place critical context at the edges · shorten the context."
- Colors: amber #b8860b for the curve and primary; signal-red #c0392b on the trough/missed needle; deep-water #2e6b8a for the shorter-context comparison curve; warm paper background; Fraunces title, JetBrains Mono labels.
- Reinforces the newspaper analogy: lede and kicker strong, middle columns skimmed.

## Cross-Links
- **Agent M08** (type: agent, label "Agent M08 — Context Positioning"): CLAUDE.md table maps M16↔Agent M08 (CE = research, Agent = positioning rules). Reference in the strategies section: the agent course turns these findings into concrete positioning rules for prompts.

## Lab Briefs

### Understand It: Draw Your Model's U-Curve
- Give the learner a positional-probe harness: a known needle fact and a long haystack; they insert the needle at deciles (0%, 10%, ... 100%) and record retrieval accuracy at each position.
- They plot/tabulate the U-curve and locate their model's middle trough and the context length at which it appears.
- Expected output: an accuracy-by-position table + the identified trough region and a one-line statement of the longest context they'd trust for a critical fact.
- Duration: ~25 minutes.

### Build It with AI: A Position-Aware Assembler
- With Claude, build an assembler that, given ranked context items (e.g., reranked UCC chunks from M09), places the highest-priority items at the START and END of the window and low-priority bulk in the middle — and caps total length to keep the middle shallow.
- Steps: take ranked items → assign the top-k to edge positions (primacy/recency), bulk to the middle → enforce a max-context cap → A/B the position-aware assembly vs. naive append on a needle task → confirm the critical chunk is caught.
- Expected deliverable: a position-aware assembler + a before/after showing naive-order missing the disqualifying lien and edge-placement catching it, at equal or shorter context length.
- Duration: ~40 minutes.

## Context Engineering Takeaway
Where context sits is as decisive as what it contains: models read the start and end of the window far better than the middle, so place the most critical context at the edges, keep the dead middle for low-stakes bulk, and shorten the context to shrink the trough — and measure the effect on your own stack rather than assuming it.

## Anti-Patterns
1. Critical-fact-in-the-middle — placing the most important instruction or fact in the low-attention dead zone, then being surprised it's ignored.
2. Assuming uniform recall — treating every window position as read equally, so assembly ignores position entirely.
3. Length without positioning — adding more context "to be safe," deepening the middle trough and burying the very fact you added.

## Continuity Notes
- **Builds on:** M01 (introduced positions/attention and lost-in-the-middle — this is the full treatment), M03 (long context is positionally unreliable, not just costly), M08-M09 (the PLACE stage and reranking-to-fewer-chunks), M04 (ordering inside the system prompt). Opens Track 5: from what context to where context.
- **Referenced by:** M17 (ordering strategies — the deliberate sequencing that exploits these effects), M18 (compression shortens context to shrink the trough), M19 (caching interacts with stable prefixes/positions), M11 (placing the fused result). Agent M08 turns this into positioning rules.
