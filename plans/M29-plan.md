# M29 Plan — Context A/B Testing: Evaluating Context Strategies

## Module Identity
- **ID:** M29
- **Track:** 8 (Production & Evaluation)
- **Title:** Context A/B Testing — Evaluating Context Strategies
- **Subtitle:** Deciding which context strategy actually wins — eval sets, A/B testing, and statistical rigor
- **Icon:** 🧪
- **Color:** #2c3e50 (charcoal)

## Everyday Analogy
**The Clinical Drug Trial**

You don't approve a drug because one patient felt better. You run a trial: a control group and a treatment group, a pre-registered outcome (does it lower blood pressure?), enough patients that the result isn't luck, and a statistical test to rule out chance. A single anecdote — "my cousin took it and recovered" — proves nothing; the trial is what separates a real effect from coincidence and the placebo of wishful thinking. Evaluating a context strategy is the same discipline: you don't ship a new prompt because it looked better on one filing. You build an eval set, run the old strategy (control) and the new one (treatment), measure a defined outcome, and use a statistical test to decide whether the difference is real.

Mapping:
- Control vs. treatment group → strategy A (current) vs. strategy B (proposed)
- A pre-registered outcome (blood pressure) → a defined eval metric (accuracy, cost, latency)
- Enough patients to rule out luck → a large enough eval set for a reliable signal
- The statistical test ruling out chance → a significance test on the A vs. B difference
- "My cousin recovered" → "it looked better on one example" (the anecdote trap)
- The placebo effect → confirmation bias when you eyeball a change you wanted to work

## Key Topics (5)
1. **Why eyeballing fails — the anecdote trap** — Context changes are routinely shipped because they "looked better" on one or two examples. But LLM outputs vary, examples aren't representative, and you see what you hoped to see. A single example proves nothing; you need a representative eval set and a measured comparison.
2. **Building an eval set** — A good eval set is the foundation: representative inputs (the real distribution, including edge cases — M07), each paired with a graded outcome (a known-correct label, a rubric, or an LLM-as-judge score). The eval set is reusable infrastructure; every future change is measured against it. *(UCC domain example lives here.)*
3. **A/B testing context strategies** — Run strategy A (control) and strategy B (treatment) over the *same* eval set, holding everything else constant, and compare the outcome metric. This is how you test any context decision — a new prompt (M04), a different retrieval k (M09), a new ordering (M17), a compression scheme (M18) — empirically rather than by intuition.
4. **Statistical rigor — is the difference real?** — A higher average on B isn't enough; the difference could be noise. Use enough examples, account for output variance (run multiple samples), and apply a significance test before declaring a winner. Beware multiple-comparisons (testing many variants until one looks good) and overfitting to the eval set.
5. **Offline eval vs. online experiment** — Offline evaluation (against a fixed eval set) is fast, cheap, and safe for iterating. Online experiments (a real traffic split) catch what offline misses — real user behavior, distribution shift — but are slower and riskier. Use offline to narrow candidates, online to confirm. Tie to observability (M28) for measuring online outcomes.

UCC domain example appears in: Topic 3 — testing whether reranking (M09) actually improves the risk pipeline. Build a 200-filing eval set with known risk labels (incl. tricky borderline and disqualifying-lien cases). Run A = hybrid retrieval only vs. B = hybrid + rerank over the *same* set, measure accuracy, and apply a significance test. B looks +4% on the first 10 examples, but across all 200 it's +1.2% with a p-value that doesn't clear the bar — so you don't ship the added rerank cost on a difference that's within noise.

## Sections Outline

### Section 1: content — "The Anecdote Trap"
- The common failure: shipping a context change because it looked better on one example. LLM variance + non-representative examples + confirmation bias = false confidence.
- A single example proves nothing. You need a representative eval set and a measured comparison.
- Thesis: evaluating context strategies is an empirical discipline, like a clinical trial — not a vibe check.

### Section 2: content — "Eval Sets and A/B Testing"
- Building an eval set: representative inputs (incl. edge cases, M07) + a graded outcome per input (label / rubric / LLM-judge). Reusable infrastructure — every change measured against it.
- A/B testing: run A (control) and B (treatment) over the same eval set, everything else held constant, compare the metric. Works for any context decision (prompt, retrieval k, ordering, compression).
- UCC tie-in: the eval set with known risk labels used to test rerank-vs-no-rerank.

### Section 3: content — "Rigor, and Offline vs. Online"
- Statistical rigor: a higher average isn't enough — account for variance (multiple samples), use enough examples, apply a significance test, and beware multiple comparisons / overfitting the eval set.
- Offline (fixed eval set: fast, safe, for iterating) vs. online (real traffic split: catches distribution shift and real behavior, slower/riskier). Offline narrows, online confirms; measure online outcomes via observability (M28).
- The rerank example: +4% on 10, +1.2% (not significant) on 200 — don't ship the cost.

### Section 4: quiz — "Ship the Rerank?"
- Question: "You're deciding whether to add a reranker (extra cost/latency) to your UCC pipeline. On the first 8 filings you tried, the reranked version 'clearly looks better.' What should you do before shipping it?"
- Options:
  - A. Ship it — 8 clear wins is strong evidence
  - B. Run a proper A/B evaluation: a representative eval set with known labels, the same set through both strategies, the accuracy difference measured with a significance test — because 8 hand-picked examples can't distinguish a real gain from noise, and the rerank adds real cost that a marginal/insignificant gain wouldn't justify
  - C. Never use rerankers; they're not worth the cost
  - D. Ask the model which version is better and trust its judgment
  - correct: B (index 1)
- Explanation: Eight examples — especially ones you looked at because they 'looked better' — can't separate a real improvement from output variance and selection bias (the anecdote trap). The disciplined move is an A/B evaluation: a representative eval set with graded outcomes, both strategies run over the same set, and the difference tested for significance. The rerank also has a real cost/latency price (M09/M03), so a gain that's marginal or within noise doesn't justify shipping it. Blanket rejecting rerankers (C) is the opposite anecdote error; asking the model to grade itself (D) inherits the same bias you're trying to remove.

### Section 5: antipattern — "Evaluation Theater"
- Anti-pattern 1: Anecdotal shipping — deciding from a handful of cherry-picked examples, mistaking variance and confirmation bias for a real effect.
- Anti-pattern 2: No held-out eval set — tuning on the same examples you measure on, so you overfit and the 'improvement' doesn't generalize.
- Anti-pattern 3: P-hacking / no significance — running many variants until one looks good and shipping it without a significance test or correction, so you ship noise.

## SVG Diagram Plan
**"A/B Testing a Context Strategy" — same eval set through two strategies, measured difference + significance gate**

```
            ┌──────── EVAL SET (200 filings, known labels) ────────┐
            │  representative · incl. edge & borderline cases       │
            └───────────────┬───────────────┬──────────────────────┘
                            ▼               ▼
                   STRATEGY A          STRATEGY B
                   (hybrid only)       (hybrid + rerank)
                   accuracy 91.0%      accuracy 92.2%
                            └──────┬────────┘
                                   ▼
                   Δ = +1.2%   significance test → p = 0.18
                   ┌──────────────────────────────────────┐
                   │  not significant → DON'T ship the cost │
                   └──────────────────────────────────────┘
   "one example is an anecdote; the eval set + a test is evidence"
```

- Top: an EVAL SET box (representative, labeled, edge cases) feeding two strategy columns A and B run over the *same* set.
- Each strategy shows its measured accuracy; they converge to a Δ and a significance-test gate (p-value) with a verdict ("not significant → don't ship").
- A caption: "one example is an anecdote; the eval set + a test is evidence."
- Colors: charcoal #2c3e50 primary for the eval set and strategies; amber #b8860b on the Δ/significance gate (the decision); a green/red hint on the verdict; warm paper background; Fraunces title, JetBrains Mono labels.
- Reinforces the clinical-trial analogy: control vs. treatment, outcome, significance.

## Cross-Links
- None tagged in the curriculum map for M29. `crosslinks: []`. (In prose, lean on M28 (measuring outcomes), M09/M17/M18 (the strategies being tested), M07 (edge cases in the eval set), M03 (the cost side of the tradeoff) — but no formal Agent/SDLC tags.)

## Lab Briefs

### Understand It: Anecdote vs. Eval Set
- Give the learner two context strategies (A, B) and outputs on a tiny cherry-picked set (where B "wins") plus a larger representative eval set with labels; they compute the metric on both and compare.
- They see B winning on the cherry-picked set but the gain shrinking (and possibly vanishing into noise) on the full eval set, and reason about why.
- Expected output: the metric on the small vs. full set for A and B, the shrinking delta, and a one-line statement of the anecdote trap.
- Duration: ~25 minutes.

### Build It with AI: An A/B Evaluation Harness
- With Claude, build an eval harness: a labeled UCC eval set, a `run_strategy(strategy, eval_set)` that scores accuracy (with multiple samples per item to capture variance), and a `compare(A, B)` that reports the accuracy delta and a significance test (e.g. a bootstrap or a simple two-proportion test) with a ship/no-ship verdict.
- Steps: build the labeled eval set (incl. edge cases) → run A and B over the same set → compute accuracy + variance → significance test → verdict → demonstrate a marginal B that does NOT clear significance (no-ship) and a clearly-better B that does (ship).
- Expected deliverable: an A/B eval harness + two runs (one significant, one not), with a ship/no-ship verdict driven by the test rather than by eyeballing.
- Duration: ~40 minutes.

## Context Engineering Takeaway
Don't ship a context strategy because it looked better on an example — evaluate it like a clinical trial: build a representative labeled eval set, run the old and new strategies over the same set, measure a defined outcome, and apply a significance test, because only a measured, significant difference distinguishes a real improvement from variance and wishful thinking.

## Anti-Patterns
1. Anecdotal shipping — deciding from a handful of cherry-picked examples, mistaking variance and confirmation bias for a real effect.
2. No held-out eval set — tuning on the same examples you measure on, so the 'improvement' overfits and doesn't generalize.
3. P-hacking / no significance — running many variants until one looks good and shipping without a significance test, so you ship noise.

## Continuity Notes
- **Builds on:** M28 (observability provides the outcome measurements), M07 (eval-set edge cases), M09/M17/M18 (the strategies under test), M03 (the cost half of the ship decision). The evaluation discipline of production.
- **Referenced by:** M30 (regression detection compares each release against the eval set), M31 (the capstone is evaluated, not asserted). Closes the measure-then-decide loop opened by M28; M30 adds change management over time.
