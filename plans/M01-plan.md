# M01 Plan — Anatomy of a Context Window: Tokens, Positions, Attention

## Module Identity
- **ID:** M01
- **Track:** 1 (Foundations)
- **Title:** Anatomy of a Context Window — Tokens, Positions, Attention
- **Subtitle:** What the context window actually is at the mechanical level, and why that shapes every design decision
- **Icon:** 🔬
- **Color:** #4a6741 (forest)

## Everyday Analogy
**The Meeting Room Whiteboard**

Picture a fixed-size whiteboard in a meeting room. Everything the team needs to reason about — the agenda, prior decisions, the diagram someone drew, the question on the table — has to fit on that one board. You can't add a second board mid-meeting; when it's full, something gets erased to make room. People naturally pay most attention to what's written at the top (where the meeting started) and what was just written at the bottom (the current topic), while notes crammed in the dense middle get skimmed or missed.

Mapping:
- The whiteboard's fixed dimensions → the context window's fixed token limit
- Each marker stroke / word written → a token (the unit the board is measured in, not characters or "words" as humans count them)
- Where on the board something is written → positional encoding (the model knows order, not just content)
- What the team focuses on → attention (every item is weighed against every other item)
- Top-of-board and bottom-of-board getting the most eyes → primacy and recency bias; the crowded middle → lost-in-the-middle
- Erasing to make room → truncation / eviction when the window overflows

## Key Topics (5)
1. **Tokens, not words** — LLMs don't see characters or words; they see tokens produced by a subword tokenizer (BPE, SentencePiece). A token is roughly ¾ of an English word on average, but rare strings, code, JSON punctuation, and non-English text fragment into many more tokens than you'd guess. *(UCC domain example lives here — tokenizing a real filing.)*
2. **The context window is a hard ceiling** — The window is a fixed maximum number of tokens (input + output) the model can attend to in a single forward pass. It is not memory, not a database, and not negotiable at runtime — when you exceed it, content must be dropped or compressed before the call.
3. **Positional encoding — order is information** — Transformers process all tokens in parallel and have no inherent sense of sequence, so position is injected explicitly (learned, sinusoidal, or rotary/RoPE). This is why *where* you place a fact in the window measurably changes whether the model uses it.
4. **Attention — every token weighs every other token** — Self-attention lets each token compute a relevance score against all others, which is how the model decides what matters. Attention compute scales with the square of sequence length, which is the real reason long contexts are expensive and slow — not just the token price.
5. **Window size ≠ usable window** — A 200K-token advertised window does not mean 200K tokens of reliable recall. Effective use degrades well before the limit due to lost-in-the-middle and attention dilution, so the advertised size is a ceiling, not a working budget.

UCC domain example appears in: Topic 1 (tokenizing a real UCC-1 filing — showing that an entity name like "ACME LOGISTICS & DISTRIBUTION, L.L.C." costs far more tokens than its word count suggests, and that a 4-page filing is ~3,000 tokens, not "4 pages").

## Sections Outline

### Section 1: content — "The Token Is the Atom"
- LLMs operate on tokens, not characters or words. Subword tokenization (BPE/SentencePiece) splits text into frequent fragments.
- Rules of thumb: ~4 chars/token, ~¾ word/token for English prose — but punctuation-heavy, numeric, code, and non-English text tokenizes far worse.
- UCC example: a debtor name in ALL CAPS with punctuation ("ACME LOGISTICS & DISTRIBUTION, L.L.C.") shatters into many tokens; filing IDs like "2024-FL-0012345" become digit-by-digit fragments. Counting tokens ≠ counting words.
- Why it matters: every budgeting, cost, and truncation decision downstream is measured in tokens, so you must learn to estimate in tokens, not pages.

### Section 2: content — "Position, Attention, and the Shape of the Window"
- Transformers see all tokens at once; positional encoding (learned / sinusoidal / rotary RoPE) is what tells the model the order.
- Self-attention: each token scores its relevance to every other token — O(n²) cost in sequence length. This is the mechanical root of "long context is expensive."
- Consequence: position carries meaning. The same sentence at the top, middle, or bottom of a 100K-token window gets attended to differently. Foreshadows M16 (positional effects).
- The advertised window (e.g., 200K) is a ceiling, not a guarantee of recall; usable budget is smaller.

### Section 3: code — "Tokenizing a UCC Filing"
- Language: Python
- Demonstrates: counting tokens (not words/chars) for a real-looking UCC-1 filing snippet, showing the word-count vs token-count gap, and estimating a full filing's token footprint.
- Uses Anthropic's token counting approach (client.messages.count_tokens) plus a simple character heuristic for intuition. Model: claude-sonnet-4-6.
- UCC tie-in: prints "words: N, tokens: M" for the debtor block and the full filing, demonstrating that you can't fit "just a few filings" into a window without measuring.

### Section 4: quiz — "Effective vs Advertised Window"
- Question: "A model advertises a 200,000-token context window. Your UCC analysis pipeline stuffs 180,000 tokens of filings into a single call, placing the most critical filing in the exact middle. Recall of that filing is poor. What's the most likely explanation?"
- Options:
  - A. The model's window is actually smaller than advertised and the call was silently truncated
  - B. Lost-in-the-middle — attention degrades for content buried in the center of a long window, so advertised size ≠ usable recall
  - C. The filing was tokenized incorrectly and became unreadable
  - D. The model ran out of output tokens before it could answer
- Correct: B (index 1)
- Explanation: The window is a hard ceiling, not a promise of uniform recall. Attention dilutes across long sequences and positional effects bury middle content — so 180K tokens "fit" but the critical filing isn't reliably attended to. The fix is positioning and compression (M16, M18), not a bigger window.

### Section 5: antipattern — "Mistaking the Map for the Territory"
- Anti-pattern 1: Estimating context size in "pages" or "words" instead of tokens → blowing the window or the budget because punctuation/IDs/code tokenize far heavier than expected.
- Anti-pattern 2: Treating the advertised window as usable working memory → dumping everything in and assuming uniform recall, then being surprised by lost-in-the-middle.
- Anti-pattern 3: Ignoring the O(n²) cost of attention → long contexts that are technically valid but slow and expensive, when compression or retrieval would have been cheaper and more accurate.

## SVG Diagram Plan
**"Anatomy of a Context Window" — a single horizontal window bar segmented into tokens, with an attention-curve overlay**

```
       ATTENTION / RECALL (overlay curve: high-low-high)
        ▁▂▄▆█        ▃▂▁▁▁▂▃        █▆▄▂▁
   ┌───────────────────────────────────────────────┐
   │ tok tok tok │  tok tok tok tok  │ tok tok tok  │
   └───────────────────────────────────────────────┘
     PRIMACY          THE MIDDLE          RECENCY
   (top of board)  (crowded, skimmed)  (just written)
   │←──────────── FIXED TOKEN CEILING (e.g. 200K) ──→│
        ↑ one token ≈ ¾ word
```

- A long rounded rectangle = the window, subdivided by thin vertical lines into "token" cells (use small monospace `tok` glyphs in a few representative cells, not all).
- An overlay polyline forming a U-shaped curve (high at left, dipping in the middle, rising at right) labeled "effective attention / recall."
- Three zone labels beneath: PRIMACY (left, forest tint), THE MIDDLE (center, muted/grey — visibly de-emphasized), RECENCY (right, forest tint).
- A dimension line under the whole bar labeled "FIXED TOKEN CEILING — e.g. 200,000 tokens."
- A small callout "1 token ≈ ¾ word ≈ 4 chars" near one highlighted token cell.
- Colors: forest #4a6741 for the bar stroke and active zones; muted grey (#6b6560 / low opacity) for the de-emphasized middle; warm paper #f6f3ec background; JetBrains Mono for token/label text, Fraunces for the title.
- Reinforces the whiteboard analogy: a fixed board, content measured in marker-strokes (tokens), eyes drawn to top and bottom.

## Cross-Links
- None tagged for M01 in the curriculum map. (Positional effects get their own deep dive in M16; this module only plants the seed.) `crosslinks: []`
- Internally foreshadows M03 (economics — the O(n²) cost and token budgeting) and M16 (lost-in-the-middle) in prose, but no formal Agent/SDLC cross-link tags.

## Lab Briefs

### Understand It: Watch Text Become Tokens
- Take 3 text samples: a paragraph of plain English, a UCC filing snippet (caps, punctuation, IDs), and a JSON object.
- Tokenize each (Anthropic token counting or a public BPE visualizer) and record word count vs token count vs char count for each.
- Compute the tokens-per-word ratio for each sample and explain why the filing and JSON ratios are worse than plain prose.
- Expected output: a 3-row table (sample, words, tokens, tokens/word) plus a one-paragraph explanation of which content types are "token-expensive" and why.
- Duration: ~20 minutes.

### Build It with AI: A Token Budget Estimator for the UCC Pipeline
- With Claude, build a small Python function `estimate_filing_tokens(filing_text)` that returns token count and flags when a batch of filings would exceed a target window budget.
- Steps: count tokens for one filing, multiply across a batch, compare to a configurable ceiling (e.g., 50K working budget inside a 200K window), and print which filings would have to be dropped or compressed.
- Have Claude help reason about *where* to place the most important filing given primacy/recency (a forward reference to M16).
- Expected deliverable: a working estimator that, given a folder of mock filings, prints total tokens, fit/no-fit against the budget, and a recommended ordering.
- Duration: ~35 minutes.

## Context Engineering Takeaway
The context window is a fixed-size whiteboard measured in tokens, where position and attention — not just content — determine what the model actually uses, so every design choice starts with counting tokens and respecting the shape of the window.

## Anti-Patterns
1. Measuring context in pages or words instead of tokens — leading to surprise truncation and runaway cost when punctuation, IDs, and code tokenize far heavier than expected.
2. Treating the advertised window size as reliable working memory — dumping everything in and assuming uniform recall, only to lose critical facts buried in the middle.
3. Ignoring that attention cost grows with the square of sequence length — building long-context calls that are valid but needlessly slow and expensive when retrieval or compression would serve better.

## Continuity Notes
- **Builds on:** M00's five-layer model — M01 zooms into the *physical substrate* all five layers share (the token-counted window). Where M00 answered "what is context engineering," M01 answers "what is a context window, mechanically."
- **Referenced by:** M03 (economics builds directly on tokens + O(n²) attention cost), M12 (history management = managing the fixed ceiling over time), M16 (positional effects / lost-in-the-middle gets its full treatment), M18 (compression as the response to the hard ceiling). Nearly every later module assumes the learner can think in tokens after M01.
