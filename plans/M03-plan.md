# M03 Plan — Context Economics: Token Budgets, Costs, and Tradeoffs

## Module Identity
- **ID:** M03
- **Track:** 1 (Foundations)
- **Title:** Context Economics — Token Budgets, Costs, and Tradeoffs
- **Subtitle:** Treating the context window as a budget you allocate, where every token spent must earn its place
- **Icon:** 💰
- **Color:** #4a6741 (forest)

## Everyday Analogy
**Packing a Carry-On with a Weight Limit**

A context window is a carry-on bag with a strict weight limit. You can't bring everything, so every item competes for grams: the heavy winter coat (a giant tool dump) might not be worth the weight if you can pack a light layer instead (a summary). Some travelers pay to check a second bag (a bigger model with a bigger window) — but that costs money on every single trip, and an overweight bag is slow at every checkpoint. The skill isn't owning the biggest suitcase; it's deciding what earns its place in the one you have, on the trip you're actually taking.

Mapping:
- Bag weight limit → token budget (input + output)
- Each item's weight → each layer's token cost
- "Does this earn its grams?" → marginal value per token
- The winter coat you didn't need → context that adds cost and dilution but no accuracy
- Paying to check a bigger bag every trip → a larger model/window billed on every call
- Overweight bag slow at every checkpoint → latency and O(n²) attention cost of long contexts

## Key Topics (5)
1. **The cost model: what you actually pay for** — LLM billing is per-token, split into input and output, and (with caching) cached vs. uncached input at different rates. Cost is not "per request" — it's per token per call, so a fat system prompt is a tax you pay on every single invocation.
2. **The quality × quantity curve** — More context helps... up to a point, then plateaus, then *hurts* (dilution, lost-in-the-middle from M01). Value per token is not constant; it has diminishing and then negative returns. The goal is the knee of the curve, not the maximum.
3. **Budget allocation across the five layers** — A fixed token budget is divided among system, retrieval, tool, conversation, and user context. Allocation is a design decision: which layer gets the grams? *(UCC domain example lives here.)*
4. **The three costs of a token** — Every token carries three costs, not one: money (per-token price), latency (more tokens = slower, super-linearly), and attention dilution (every extra token competes with the signal). A token can be cheap in dollars but expensive in dilution.
5. **Tradeoff levers** — The practical moves: compress vs. include verbatim, retrieve-on-demand vs. preload, cache the static vs. resend it, smaller-model-more-context vs. bigger-model-less. Each is an economic decision, previewed here and built out in later tracks.

UCC domain example appears in: Topic 3 — allocating a fixed budget (e.g., a working budget inside a 200K window) across a UCC risk-analysis call: how many tokens for extraction rules vs. the filing text vs. debtor history vs. the analyst session — and what to cut first when the batch grows.

## Sections Outline

### Section 1: content — "Tokens Are the Currency"
- Reframe M01's tokens as *money*: per-token pricing, input vs. output, the role of cached input.
- The key mental shift: cost is per-token-per-call. A 2,000-token system prompt isn't a one-time cost; it's billed on every request, forever.
- Quick worked figure (illustrative, not a price quote): a verbose vs. lean system prompt across 1M calls/month — the lean one saves real money purely by trimming tokens that added nothing.
- Output tokens often cost more than input — so shaping *what the model returns* (Track 6) is an economic lever too.

### Section 2: content — "The Quality × Quantity Curve"
- The central graph of the module: accuracy/usefulness on the y-axis, context tokens on the x-axis. Rises, plateaus, then declines (dilution + lost-in-the-middle).
- The goal is the *knee*, not the peak token count. "Maximum context" is almost never "maximum quality."
- UCC tie-in: adding the 3 most relevant prior filings helps risk assessment; adding all 47 prior filings buries the signal and *lowers* accuracy while raising cost — the worst quadrant (more money, less quality).

### Section 3: code — "A Token Budget Allocator"
- Language: Python
- Demonstrates: a `Budget` that allocates a fixed token ceiling across the five layers with caps, then trims the lowest-priority layer first when a UCC call exceeds budget. Prints allocation and the cut decisions.
- UCC tie-in: budget a risk-analysis call — system (rules), retrieval (filing), tool (debtor history), conversation (session), user (analyst profile) — and watch it evict the oldest history first when the filing is large.
- Reuses the token-counting idea from M01's lab, now turned into allocation.

### Section 4: quiz — "The Worst Quadrant"
- Question: "Your UCC risk model currently sends the 3 most relevant prior filings (≈900 tokens) and scores 91% accuracy. To 'be thorough,' a teammate changes it to send all 47 prior filings (≈14,000 tokens). Accuracy drops to 84% and the bill rises 15×. In context-economics terms, what happened?"
- Options:
  - A. The model needs an even larger context window to handle 47 filings
  - B. You moved past the knee of the quality×quantity curve into the negative-return zone — paying far more tokens for worse accuracy due to dilution and lost-in-the-middle
  - C. 47 filings is fine; the accuracy drop must be a tokenizer bug
  - D. Prior filings should never be included in risk analysis
- Correct: B (index 1)
- Explanation: This is the worst quadrant — more cost AND less quality. Past the knee of the curve, extra tokens dilute attention and bury the signal (M01's lost-in-the-middle), so accuracy falls while the bill climbs. The fix isn't a bigger window; it's spending the budget on the *few highest-value* tokens (the 3 relevant filings), not the most tokens.

### Section 5: antipattern — "Spending Like the Budget Is Infinite"
- Anti-pattern 1: Pricing in "requests" instead of "tokens per call" — discovering at the invoice that a bloated, resent-every-time system prompt was the real cost driver.
- Anti-pattern 2: Optimizing only dollars and ignoring the other two costs — shaving pennies while latency and dilution quietly degrade UX and accuracy.
- Anti-pattern 3: "Bigger window will fix it" — buying a larger-context model to avoid the discipline of allocation, then paying more per call to dilute attention even further.

## SVG Diagram Plan
**"The Quality × Quantity Curve" — a labeled curve with three zones and the knee marked**

```
 quality
   ^           ___________
   |         /             \____  (declines: dilution)
   |       /  ● KNEE             \___
   |     /    (best value)
   |   /
   | /  (rising: each token earns)
   +------------------------------------> context tokens
     [under-context] [sweet spot] [over-context / worst quadrant]
        too little      the knee     more $$, less quality
```

- A smooth curve rising, plateauing at a marked "● KNEE / best value per token" point, then declining.
- Three shaded x-axis zones: UNDER-CONTEXT (left, pale), SWEET SPOT (center, forest tint), OVER-CONTEXT (right, signal-red tint — labeled "more $$, less quality").
- A small inset legend: "every token = 3 costs: 💲 money · ⏱ latency · 🌫 dilution".
- Dashed vertical line from the knee down to the x-axis.
- Colors: forest #4a6741 for the curve and sweet spot; signal red #c0392b tint for the over-context zone; amber #b8860b accent for the KNEE marker; warm paper background; Fraunces title, JetBrains Mono labels.
- Reinforces the suitcase analogy: the knee is "the bag packed exactly right"; the decline is "overweight — slow and costly for less."

## Cross-Links
- None tagged in the curriculum map for M03. `crosslinks: []`. (In prose, the module forward-references M18 compression and M19 caching as the tools that move you toward the knee, and M16 lost-in-the-middle as the cause of the decline — but no formal Agent/SDLC tags.)

## Lab Briefs

### Understand It: Plot Your Own Quality×Quantity Curve
- Using the sandbox, run a fixed UCC risk/extraction task while varying the number of prior filings included: 0, 1, 3, 8, 20, all.
- For each setting, record input tokens and a simple correctness score against a known answer key.
- Plot (or tabulate) accuracy vs. tokens and visually locate the knee.
- Expected output: a 6-row table (filings included, tokens, accuracy) with the knee identified and a sentence on where the negative-return zone begins.
- Duration: ~25 minutes.

### Build It with AI: A Budget-Aware Context Assembler
- With Claude, extend the M01 token estimator into a `Budget` allocator: a fixed ceiling, per-layer caps, and a priority order that trims the lowest-value layer first when a call exceeds budget.
- Steps: define the ceiling and caps → count each layer → if over budget, evict by priority (oldest conversation/history first, then trim retrieval to top-k) → emit the assembled context plus an allocation report.
- Expected deliverable: an allocator that, given a UCC call that overflows, returns a within-budget context and a printed report of what it kept, trimmed, and why — landing the call at the knee, not the ceiling.
- Duration: ~40 minutes.

## Context Engineering Takeaway
The context window is a budget, not a bucket: every token costs money, latency, and attention, so the discipline is spending your fixed token allowance on the few highest-value tokens that land you at the knee of the quality curve — never on the most tokens you can fit.

## Anti-Patterns
1. Thinking in "cost per request" instead of "cost per token per call" — missing that a bloated, resent-every-time system prompt is the real budget drain.
2. Optimizing dollars alone while ignoring latency and dilution — a token can be cheap in cents and ruinous in attention.
3. Reaching for a bigger-context model instead of allocating — paying more per call to push even further past the knee into the worst quadrant.

## Continuity Notes
- **Builds on:** M01 (tokens as the unit; O(n²) attention and lost-in-the-middle are the mechanical causes of the curve's decline) and M02 (this module is the "Observe" stage of the lifecycle — cost and quality measurement — made rigorous).
- **Referenced by:** Closes Track 1. The budgeting math underlies every later track: M07 (few-shot diminishing returns is this curve for examples), M12 (history management = spending the conversation budget), M18 (compression = buying quality back per token), M19 (caching = lowering the per-call price of the static layer). M03's `Budget` allocator is the seed for Track 3's dynamic assembly.
