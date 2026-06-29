# M07 Plan — Few-Shot Context Design: Selection, Ordering, Diminishing Returns

## Module Identity
- **ID:** M07
- **Track:** 2 (System Context Design)
- **Title:** Few-Shot Context Design — Selection, Ordering, Diminishing Returns
- **Subtitle:** Teaching by example — choosing which demonstrations to include, in what order, and knowing when to stop
- **Icon:** 🗂️
- **Color:** #8b5e3c (leather)

## Everyday Analogy
**Training a New Sorter at the Mail Room**

You train a new mail sorter not by writing a rulebook but by showing them a few already-sorted examples: "this goes to Legal, this to Accounts, this oddly-addressed one goes to Returns." A handful of well-chosen examples — especially the tricky edge cases — teaches the pattern faster than any rule. But there's a limit: show them three good examples and they get it; show them three hundred and you've wasted the morning, and if your examples all happen to be Legal mail, they'll start dumping everything into Legal. The skill is picking the *few most representative and diverse* examples, putting the clearest ones where they'll stick, and stopping once the pattern lands.

Mapping:
- Showing sorted examples instead of a rulebook → few-shot / in-context learning
- A few well-chosen examples teach fast → the power of representative examples
- Tricky edge-case examples teach most → diversity and hard-case selection
- 300 examples wasting the morning → diminishing returns + token cost
- All-Legal examples causing Legal-dumping → example bias skewing the output distribution
- Where you place the clearest example → ordering / recency effects

## Key Topics (5)
1. **In-context learning: examples as runtime teaching** — Few-shot examples let the model infer a task pattern from demonstrations rather than description alone, without any training. They're especially powerful for output *shape* and for edge cases that are hard to specify in prose.
2. **Selection: representativeness and diversity** — The best example set covers the real input distribution, including the hard/edge cases, without redundancy. Three diverse examples usually beat ten near-duplicates; the goal is coverage per token, not count.
3. **Example bias and distribution skew** — If your examples over-represent one class or format, the model's outputs skew toward it (all-Legal → Legal-dumping). Balanced, label-representative examples prevent the few-shot set from silently biasing results. *(UCC domain example lives here.)*
4. **Ordering and recency** — Order matters (M01 again): the last example before the query carries recency weight, and a clean, canonical example placed last anchors the output format. Pathological orderings (e.g., all of one label grouped) can bias predictions.
5. **Diminishing returns — knowing when to stop** — Accuracy rises with the first few examples, then plateaus, then the tokens just cost money and dilute (M03's curve, applied to examples). Past the knee, prefer better examples or retrieval-selected examples over simply more.

UCC domain example appears in: Topic 3 — a debtor-name extraction few-shot set that accidentally contains only clean UCC-1 examples, so the model learns to expect a clean name and fabricates one on a redacted/amendment filing; fixing it means adding edge-case examples (redacted → null, amendment → look-to-original, truncated → flag) so the demonstrations cover the real distribution.

## Sections Outline

### Section 1: content — "Examples Teach What Prose Can't"
- In-context learning: the model infers the task from demonstrations; no fine-tuning, just context.
- Where few-shot shines: locking output *shape*, and conveying edge-case handling that's awkward to describe in rules.
- Relationship to the rest of the system prompt: examples reinforce the persona (M06) and demonstrate the output contract (M04) by showing, not telling.

### Section 2: content — "Selection and Bias: Which Examples"
- Selection criteria: representativeness (cover the real input distribution), diversity (include edge cases, avoid near-duplicates), and balance (don't over-represent one label/format).
- The failure of skewed sets: all-clean examples → model expects clean → fabricates on messy inputs. Few-shot examples are a *distribution* you're teaching.
- UCC tie-in: the clean-only extraction set that breaks on redacted/amendment filings, and the diverse set (clean, redacted→null, amendment→original, truncated→flag) that fixes it.

### Section 3: code — "A Diverse Few-Shot Block for UCC Extraction"
- Language: text/markdown (a few-shot prompt block)
- Demonstrates: a 4-example few-shot set for debtor extraction that deliberately spans the distribution — clean name, redacted→null, amendment→look-to-original, 80+char→flag truncated — each as an input→output pair, with the cleanest canonical example placed last (recency anchor for format).
- UCC tie-in: shows the input/output pairing and the deliberate edge-case coverage; annotate why each example earns its place.

### Section 4: quiz — "Why Does It Fabricate?"
- Question: "Your UCC extractor uses a 6-example few-shot block, all of them clean UCC-1 filings with obvious debtor names. In production it works great on clean filings but confidently fabricates a name whenever it hits a redacted or amended filing. What's the most likely cause and fix?"
- Options:
  - A. Six examples is too few — add 50 more clean examples to improve accuracy
  - B. The example set is biased toward clean inputs, so the model learned to always expect a clear name; fix it by adding diverse edge-case examples (redacted→null, amendment→original) so the demonstrations cover the real distribution
  - C. Few-shot examples don't affect extraction; the problem is the model
  - D. Move all six examples to the very top of the prompt
- Correct: B (index 1)
- Explanation: Few-shot examples teach a distribution. An all-clean set teaches 'there is always a clear debtor name,' so the model fabricates one when there isn't. More clean examples make this worse (and cost more tokens). The fix is selection/diversity: include edge cases that demonstrate the correct behavior on messy inputs (return null, look to the original), so the demonstrated distribution matches reality.

### Section 5: antipattern — "Bad Lessons from Bad Examples"
- Anti-pattern 1: Skewed example sets — all examples of one class/format, silently biasing outputs (the clean-only set that fabricates on edge cases).
- Anti-pattern 2: More-is-better — stuffing dozens of redundant examples past the knee, paying tokens and dilution for plateaued accuracy.
- Anti-pattern 3: Ignoring order — burying the canonical format example in the middle, or grouping all of one label together, letting position/recency bias the output.

## SVG Diagram Plan
**"Few-Shot Diminishing Returns" — an accuracy-vs-examples curve with a knee, plus a 'diversity beats count' callout**

```
 accuracy
   ^        ____________________ (plateau: more = wasted tokens)
   |      /● knee (~3-5 diverse examples)
   |    /
   |  /  (steep early gains)
   +-------------------------------> # examples
        diverse 3  >  redundant 10
   ┌───────────────────────────────────┐
   │ clean | redacted→null | amend→orig │  ← coverage of the distribution
   └───────────────────────────────────┘
```

- Top: an accuracy-vs-number-of-examples curve rising steeply, marked knee at ~3–5, then flat plateau labeled "more examples = wasted tokens (M03)."
- A callout comparing "3 diverse" vs "10 redundant" with the diverse set winning (an arrow or ">" between them).
- Bottom strip: a small row of 4 example chips spanning the distribution (clean / redacted→null / amendment→original / truncated→flag) labeled "coverage, not count."
- One chip highlighted as "placed last = recency anchor for format."
- Colors: leather #8b5e3c for curve and chips; amber #b8860b for the knee marker (consistent with M03); a faded zone for the plateau; warm paper background; Fraunces title, JetBrains Mono labels.
- Reinforces the mail-sorter analogy (few diverse examples teach the pattern; hundreds waste the morning) and explicitly ties to M03's curve.

## Cross-Links
- **Agent M04** (type: agent, label "Agent M04 — Tool & Schema Examples"): CLAUDE.md table maps M07↔Agent M04 — CE covers example selection; Agent applies it to tool schemas. Reference in the selection section: the same selection/diversity principles govern few-shot examples for tool-call schemas.

## Lab Briefs

### Understand It: Watch Example Bias Happen
- Build two few-shot extraction blocks: (A) 6 clean-only examples, (B) 4 diverse examples covering edge cases. Run both against a test set that includes redacted, amended, and truncated filings.
- Record where (A) fabricates/mis-handles and (B) succeeds; note token counts for each block.
- Expected output: a comparison table (test case → A output, B output, correct?) showing the clean-only set's bias and the diverse set's robustness, plus the token cost of each block.
- Duration: ~25 minutes.

### Build It with AI: A Few-Shot Selector with a Stop Rule
- With Claude, build an example bank (tagged by case type) and a `select_examples(bank, k, query)` that picks a diverse, distribution-covering subset of size k, places the cleanest canonical example last, and refuses to exceed a token budget / a k beyond the measured knee.
- Steps: tag the bank → implement diversity-aware selection (cover distinct case types before adding duplicates) → enforce a stop rule at the knee → demonstrate that k=4 diverse beats k=10 redundant on accuracy-per-token.
- Expected deliverable: a selector that returns a balanced, ordered few-shot block under budget, plus a short result showing diverse-small outperforming redundant-large.
- Duration: ~40 minutes.

## Context Engineering Takeaway
Few-shot examples teach a distribution, so the craft is selecting the fewest diverse, representative demonstrations that cover the real input space — including the edge cases — ordering the canonical one last, and stopping at the knee where more examples only cost tokens.

## Anti-Patterns
1. Skewed example sets — all of one class or format, silently biasing the model's output distribution (clean-only → fabrication on edge cases).
2. More-is-better — dozens of redundant examples past the knee, paying tokens and dilution for plateaued accuracy.
3. Ignoring order — burying the canonical format example in the middle or grouping one label together, letting position bias the result.

## Continuity Notes
- **Builds on:** M04 (examples are the demonstrations section of the architected prompt), M06 (examples reinforce the persona's behavior), M03 (diminishing-returns curve, now applied to examples), M01 (ordering/recency). Completes Track 2's static scaffolding: structure (M04) + authority (M05) + behavior (M06) + examples (M07).
- **Referenced by:** M08–M09 (retrieval can *select* few-shot examples dynamically — retrieval-augmented few-shot), M16/M17 (ordering effects revisited), Agent M04 (tool-schema examples). Bridges to Track 3: once you can select examples, you can select *any* dynamic context by relevance.
