# M10 Plan — Tool Results as Context: Shaping What Tools Return

## Module Identity
- **ID:** M10
- **Track:** 3 (Dynamic Context Assembly)
- **Title:** Tool Results as Context — Shaping What Tools Return
- **Subtitle:** Treating a tool's output as context you design, not raw data you dump — shape it before it enters the window
- **Icon:** 🔧
- **Color:** #2e6b8a (deep water)

## Everyday Analogy
**The Team Status Update: Three-Page Email vs. Two Bullets**

You ask a teammate "are we on track for Friday?" One replies with a three-page email: every meeting note, every Slack thread, the full git log, raw ticket dumps. Another replies: "Yes — two blockers cleared, one risk: the vendor API is flaky, mitigation in progress." Both technically answered. But the first buries the signal you needed under everything they happened to have; the second *shaped* the raw material into the answer. A tool result is the same: a database query or API can return everything it knows, but it's your job to shape that into the few fields the model actually needs to reason with.

Mapping:
- The question "on track for Friday?" → the reason you called the tool
- Three-page email with raw dumps → unshaped tool output (full API JSON, every row)
- Two-bullet answer → shaped tool result (relevant fields, summarized)
- Burying the signal → tool-result bloat diluting the window (M03)
- The teammate deciding what to include → the output-shaping layer you design
- "Both technically answered" → raw vs. usable is the whole difference

## Key Topics (5)
1. **Tool results are context, not just data** — A tool's return value enters the same context window as everything else and competes for the same budget and attention. It must be designed like any other layer — not piped in raw because "that's what the API returned."
2. **Tool-result bloat** — APIs and databases return everything: nested metadata, pagination cruft, every column, every row. Dumped verbatim, this is often the single largest, lowest-value consumer of the window — the fastest way into M03's worst quadrant.
3. **Output-shaping strategies** — The toolbox: project to relevant fields, filter to relevant rows, summarize/aggregate, truncate with a count, and re-format into a compact, labeled structure. Shaping happens between the tool and the window — a layer you own. *(UCC domain example lives here.)*
4. **Preserving signal while cutting volume** — Shaping must be lossy *carefully*: keep what the model needs to reason and cite (IDs, key values, provenance), drop what it doesn't (formatting metadata, redundant fields). The risk is over-trimming away the fact the task depended on.
5. **Errors, empties, and shape contracts** — Tool results include failure modes: errors, empty results, partial data, rate-limit messages. These need shaping too — a clear "no results found" or a structured error beats dumping a stack trace or, worse, silently passing nothing. Give tool outputs a predictable shape contract.

UCC domain example appears in: Topic 3 — a `get_debtor_history` tool that returns the full 40-field JSON for each of a debtor's 30 prior filings (thousands of tokens) vs. a shaped result: a compact table of `filing_id | type | status | secured_party | date` for only the active/relevant filings, plus a one-line summary ("3 active liens, 2 terminated, oldest 2019") — same signal, a fraction of the tokens.

## Sections Outline

### Section 1: content — "A Tool Result Is a Context Layer"
- Reframe: the value a tool returns lands in the window and competes for budget and attention exactly like retrieval or examples.
- The default mistake: piping the raw API/DB response straight in because "that's the data." The tool's natural output format was designed for machines/storage, not for an LLM's context.
- Thesis: between the tool and the window sits a shaping layer you own — use it.

### Section 2: content — "Bloat and the Shaping Toolbox"
- Tool-result bloat: nested metadata, every column, every row, pagination wrappers — often the largest, lowest-value chunk of the window.
- The shaping toolbox: project (relevant fields), filter (relevant rows), summarize/aggregate, truncate-with-count, reformat to compact labeled structure.
- UCC tie-in: the 30-filing, 40-field history dump vs. a shaped 5-column table of active filings + a one-line rollup. Same decision the model needs to make, a fraction of the tokens — directly applying M03 economics to tool output.

### Section 3: code — "Shaping a Tool Result"
- Language: Python
- Demonstrates: a `get_debtor_history` raw result (verbose nested JSON) and a `shape_history()` that projects key fields, filters to active/relevant filings, sorts by recency, truncates with a "+N older" count, and prepends a one-line summary — printing the token delta.
- UCC tie-in: shaped output the risk model can actually use, with provenance (filing IDs) preserved for citation, at a fraction of the tokens.
- Show an error/empty case shaped into a clean structured message, not a dumped exception.

### Section 4: quiz — "The Tool Dump"
- Question: "Your UCC risk agent calls get_debtor_history, which returns full 40-field JSON for all 30 of a debtor's prior filings — about 9,000 tokens. The agent's risk decisions only ever use filing type, status, secured party, and date. Accuracy is mediocre and costs are high. What's the best fix?"
- Options:
  - A. Increase the model's context window so the 9,000 tokens fit comfortably
  - B. Shape the tool result before it enters the window — project to the 4 used fields, filter to active/relevant filings, and add a one-line summary — cutting tokens dramatically while preserving the signal the model uses
  - C. Stop calling the tool; debtor history isn't useful for risk
  - D. Ask the model to ignore the fields it doesn't need
  - correct: B (index 1)
- Explanation: The tool is returning data designed for storage, not for the model's context. Ninety percent of those tokens are fields the decision never uses — pure bloat that costs money and dilutes attention (M03). The fix is the shaping layer you own: project to the 4 fields the model actually uses, filter to relevant filings, and summarize. A bigger window (A) just pays to dump more noise; dropping the tool (C) loses real signal; telling the model to 'ignore' fields (D) still pays for the tokens and the dilution.

### Section 5: antipattern — "Piping the Firehose"
- Anti-pattern 1: Raw passthrough — sending the tool's native JSON/response straight into the window because "that's what it returned," letting storage-shaped data eat the budget.
- Anti-pattern 2: Over-shaping — trimming so aggressively you drop the field the task needed (e.g., removing `status`, so the model can't tell active liens from terminated ones); lossy shaping without knowing what the model uses.
- Anti-pattern 3: Unshaped failures — dumping raw stack traces, rate-limit blobs, or silent empties instead of a clean structured error/"no results," confusing the model about what happened.

## SVG Diagram Plan
**"Raw Tool Dump vs. Shaped Result" — side-by-side, same query, with a shaping layer between tool and window**

```
            ┌──────────────┐
   TOOL ───▶│ raw response │   30 filings × 40 fields ≈ 9,000 tokens
            │ {nested...}  │   (storage-shaped, bloat)
            └──────┬───────┘
                   ▼
            ╔══════════════╗   ← SHAPING LAYER (you own this)
            ║ project·filter║     keep: id,type,status,party,date
            ║ summarize·trim║     drop: 36 unused fields, terminated
            ╚══════┬═══════╝
                   ▼
            ┌──────────────┐
            │ shaped result│   5-col table + "3 active, 2 term." ≈ 600 tokens
            └──────────────┘   same signal, 15× fewer tokens → window
```

- Top: a TOOL node emitting a "raw response" card (tall, dense, greyed, tagged "9,000 tokens / storage-shaped / bloat").
- Middle: a prominent SHAPING LAYER band (deep-water, double-bordered) listing the operations: project · filter · summarize · truncate, with "keep / drop" notes.
- Bottom: a compact "shaped result" card (small, clean, tagged "~600 tokens / same signal") flowing into "→ window."
- A big contrast label between them: "15× fewer tokens, same decision."
- Colors: deep-water #2e6b8a for the shaping layer and shaped card; muted grey for the bloated raw card; amber accent on the token-savings figure; warm paper background; Fraunces title, JetBrains Mono labels.
- Reinforces the three-page-email-vs-two-bullets analogy directly.

## Cross-Links
- **Agent M05** (type: agent, label "Agent M05 — Tool Definitions"): CLAUDE.md table maps M10↔Agent M05-M06. CE shapes what tools return (context quality); Agent defines/calls the tools. Reference in the shaping-layer section.
- **Agent M06** (type: agent, label "Agent M06 — Tool Use Loop"): same mapping; reference for how shaped results feed the agent's tool-use loop.

## Lab Briefs

### Understand It: Measure the Bloat
- Give the learner a realistic verbose tool result (a debtor-history JSON with many filings and many fields) and the list of fields the downstream risk task actually uses.
- They measure the token cost of the raw result, identify which fields/rows are signal vs. bloat, and compute the achievable reduction.
- Expected output: a breakdown (total tokens, tokens in used fields, % bloat) and a target shaped structure with a projected token count.
- Duration: ~25 minutes.

### Build It with AI: A Tool-Result Shaper
- With Claude, build `shape_history(raw)` that projects to used fields, filters to active/relevant filings, sorts by recency, truncates with a "+N older" count, prepends a one-line summary, and handles error/empty cases with a structured message.
- Steps: define the shape contract (the exact output structure) → implement project/filter/summarize → handle empty + error → run the shaped result through the risk model and confirm equal-or-better decisions at a fraction of the tokens.
- Expected deliverable: a shaper + a before/after showing the risk decision unchanged (or improved) with a large token reduction, plus a clean shaped error/empty case.
- Duration: ~40 minutes.

## Context Engineering Takeaway
A tool result is context you design, not data you dump: shape it between the tool and the window — projecting, filtering, and summarizing to the few fields the model actually reasons with — because storage-shaped output is the fastest way to bloat the budget and bury the signal.

## Anti-Patterns
1. Raw passthrough — piping the tool's native response straight into the window because "that's what it returned."
2. Over-shaping — trimming away the field the task depended on (dropping `status`, so active vs. terminated liens are indistinguishable).
3. Unshaped failures — dumping stack traces, rate-limit blobs, or silent empties instead of a clean structured error or "no results found."

## Continuity Notes
- **Builds on:** M08 (formatting retrieved content generalizes to formatting tool output; both are dynamic context you shape) and M03 (tool bloat is a textbook worst-quadrant cost; shaping moves you toward the knee). Tool results are M02's "Layer 3" made concrete.
- **Referenced by:** M11 (tool results are one of the multiple sources being fused — they arrive pre-shaped), M18 (summarization/compression techniques deepen the shaping toolbox), Track 7 / M24 (agent loops generate many tool results that pressure the window — shaping is what keeps the loop affordable). Agent M05-M06 define and call the tools whose output you shape.
