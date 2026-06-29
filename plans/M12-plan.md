# M12 Plan — Conversation History Management: Windows, Summarization, Compression

## Module Identity
- **ID:** M12
- **Track:** 4 (Memory & Conversation Context)
- **Title:** Conversation History Management — Windows, Summarization, Compression
- **Subtitle:** Keeping a growing conversation inside a fixed window without losing the thread
- **Icon:** 🧠
- **Color:** #7a4a8c (amethyst)

## Everyday Analogy
**Browser Tabs, History, and Clearing the Cache**

A long conversation is like a browser that's been open for hours. Every turn opens another tab. Keep all of them and the machine grinds to a halt (you blow the window); close them blindly and you lose the page you needed (you drop the key fact from turn 3). A good browsing session manages this deliberately: keep the few tabs you're actively using open (the recent turns), bookmark the important pages so you can summon them later (summarize older turns into durable notes), and clear the rest of the cache so the machine stays fast (drop the chit-chat). Conversation history management is exactly that discipline: decide what stays open, what gets bookmarked as a summary, and what gets cleared.

Mapping:
- Open tabs → turns currently in the window
- Machine grinding to a halt → blowing the fixed token budget
- The page you needed, now closed → a critical fact lost to naive truncation
- Bookmarking important pages → summarizing older turns into durable notes
- Clearing the cache → dropping low-value turns
- Keeping active tabs open → the sliding window of recent turns

## Key Topics (5)
1. **The growing-history problem** — Conversation context accumulates every turn, but the window is fixed (M01). Left unmanaged, history eventually overflows — and even before it overflows, it bloats cost (M03) and dilutes attention. History is a budget you must actively manage, not a log you append to forever.
2. **The sliding window** — The simplest strategy: keep the last N turns, drop the oldest. Cheap and preserves recency, but it's amnesiac — a fact stated in turn 2 is gone by turn 20, even if it's still essential (the user's name, the filing under discussion).
3. **Summarization and hierarchical compression** — Instead of dropping old turns, compress them: replace a block of older turns with a concise summary, and summarize summaries as the conversation grows (hierarchical). This trades fidelity for durability — the gist survives even when the verbatim turns don't. *(UCC domain example lives here.)*
4. **What to keep verbatim vs. compress vs. drop** — Not all turns are equal. Pinned facts (decisions, IDs, user constraints) should persist verbatim or as structured state; reasoning chatter can be summarized; pure pleasantries can be dropped. Token-aware management decides per-turn, not uniformly.
5. **Token-aware, not turn-aware** — Budgeting by *turn count* is naive because turns vary wildly in size (one user message vs. a giant tool result). Manage by tokens: track the running token cost of history and compress when approaching the allotted history budget.

UCC domain example appears in: Topic 3 — a long analyst session reviewing 30 filings: naive sliding-window forgets that the analyst already decided filing 2024-FL-0012345 is HIGH risk (stated 25 turns ago), causing the model to re-litigate it; hierarchical summarization preserves "decisions so far: 0012345=HIGH, 0019988=duplicate" as a durable summary while dropping the verbose back-and-forth.

## Sections Outline

### Section 1: content — "History Is a Budget, Not a Log"
- Every turn appends to context; the window is fixed → unmanaged history overflows, and well before that it bloats cost and dilutes attention.
- Reframe: conversation history is a layer you actively manage within a token budget, not an ever-growing transcript.
- Preview the three levers: keep (window), compress (summarize), drop (evict) — applied token-aware.

### Section 2: content — "Sliding Windows and Their Amnesia"
- The sliding window: keep last N turns, drop the oldest. Simple, preserves recency, bounded cost.
- The failure: catastrophic forgetting of early-but-essential facts (the user's name, the filing ID, a constraint set in turn 2). Recency is necessary but not sufficient.
- Why "just increase N" doesn't solve it — that's back to overflow and dilution (M01/M03).

### Section 3: code — "Hierarchical History Compression"
- Language: Python
- Demonstrates: a `History` manager that keeps the last K turns verbatim, summarizes older turns into a running summary (and re-summarizes when the summary itself grows), and pins durable facts (decisions/IDs) so they survive compression. Token-aware: compresses when history exceeds a budget.
- UCC tie-in: the analyst session where decisions ("0012345=HIGH") are pinned and survive while verbose reasoning is compressed; shows the model still "remembers" the decision 25 turns later at a fraction of the tokens.

### Section 4: quiz — "Why Did It Re-Ask?"
- Question: "In a long UCC analyst session, your assistant uses a sliding window of the last 10 turns. At turn 30, it asks the analyst to re-confirm the debtor name they provided at turn 2 and re-evaluates a filing they already marked HIGH risk at turn 5. What's the best fix?"
- Options:
  - A. Increase the sliding window to the last 30 turns so nothing is dropped
  - B. Add summarization/pinning: compress older turns into a durable summary and pin key facts (debtor name, risk decisions) so they survive even when verbatim turns are dropped
  - C. Tell the analyst to repeat important facts every few turns
  - D. Restart the conversation periodically to keep it short
  - correct: B (index 1)
- Explanation: A sliding window forgets early-but-essential facts by design — turn 2 is long gone by turn 30. Just enlarging the window (A) re-introduces overflow and dilution and only delays the problem. The fix is to compress older turns into a durable summary and pin the load-bearing facts (debtor name, risk decisions) as structured state, so they persist regardless of how many turns pass. Pushing the work onto the user (C) or restarting (D) are workarounds that abandon the context, not manage it.

### Section 5: antipattern — "Mismanaging the Transcript"
- Anti-pattern 1: Append-forever — never compressing, until the conversation overflows the window or the bill (M03) and quality collapses mid-session.
- Anti-pattern 2: Naive sliding-window with no pinning — bounded cost but catastrophic forgetting of early essential facts (re-asking the user's name).
- Anti-pattern 3: Turn-count budgeting — managing by number of turns instead of tokens, so one giant tool-result turn silently blows the budget while ten tiny turns fit fine.

## SVG Diagram Plan
**"Managing a Growing Conversation" — a timeline of turns split into compressed/pinned/verbatim zones under a fixed budget bar**

```
   FIXED HISTORY BUDGET  ├────────────────────────────────┤
   turns:  1 2 3 ... ......................... 28 29 30
          └─ summarize ─┘ └─ pinned facts ─┘ └─ verbatim ─┘
           "decisions:        debtor=ACME       last K turns
            0012345=HIGH"      0012345=HIGH      kept in full
           (older turns →      (survive          (recency)
            one summary)        compression)
```

- A horizontal timeline of turns (1 → 30) under a "FIXED HISTORY BUDGET" bracket.
- Three zones: OLDER TURNS (left) collapsing into a small "summary" box; PINNED FACTS (a small persistent box that survives, highlighted); RECENT TURNS (right) kept verbatim.
- Arrows showing old turns being compressed into the summary box (many → one) and pinned facts being lifted out before compression.
- A small "dropped: pleasantries" note for evicted low-value turns.
- Colors: amethyst #7a4a8c primary for zones; amber #b8860b accent on the PINNED box (it's the high-value survivor); muted grey for dropped turns; warm paper background; Fraunces title, JetBrains Mono labels.
- Reinforces the browser analogy: active tabs (verbatim), bookmarks (summary), pinned essentials, cleared cache (dropped).

## Cross-Links
- **Agent M08** (type: agent, label "Agent M08 — Context Compaction"): CLAUDE.md table maps M12↔Agent M08 (direct overlap + compression theory). CE covers the history-management strategy; Agent applies compaction in the agent loop. Reference in the compression section.

## Lab Briefs

### Understand It: Watch the Window Forget
- Give the learner a scripted 30-turn UCC analyst session (with a key fact at turn 2 and a decision at turn 5) and a sliding-window manager.
- Run a query at turn 30 that depends on the turn-2 fact; observe the model fail; then track at which window size the fact survives and the token cost of that size.
- Expected output: a table (window size N → fact retained? → tokens) showing the cost/forgetting tradeoff, and a one-line diagnosis of why bigger-N is not the answer.
- Duration: ~25 minutes.

### Build It with AI: A Token-Aware History Manager
- With Claude, build a `History` manager that keeps the last K turns verbatim, summarizes older turns into a running summary, pins durable facts (decisions/IDs) as structured state, and triggers compression by token budget (not turn count).
- Steps: implement keep/compress/pin → token-aware trigger → run the 30-turn session → confirm the turn-2 fact and turn-5 decision survive to turn 30 at a fraction of the naive token cost.
- Expected deliverable: a history manager + a before/after showing naive sliding-window forgetting the fact while the managed history retains it, with the token comparison.
- Duration: ~40 minutes.

## Context Engineering Takeaway
Conversation history is a fixed budget you actively manage, not a transcript you append to: keep recent turns verbatim, compress older turns into durable summaries, pin the load-bearing facts as structured state, and budget by tokens — so a long conversation keeps the thread without losing it to overflow or amnesia.

## Anti-Patterns
1. Append-forever — never compressing until the conversation overflows the window or the bill and quality collapses.
2. Naive sliding-window without pinning — bounded cost but catastrophic forgetting of early essential facts.
3. Turn-count budgeting — managing by number of turns rather than tokens, so one giant turn blows the budget unnoticed.

## Continuity Notes
- **Builds on:** M01 (the fixed window history must fit in), M03 (history is a budget; compression buys quality per token), M10 (summarizing/shaping generalizes to summarizing turns), M11 (pinned decisions are fused state). Opens Track 4 by adding the temporal dimension to context.
- **Referenced by:** M13 (multi-layer memory — the summary/pinned state becomes the session/persistent layers), M14 (those summaries can go stale — decay), M18 (compression techniques deepen the summarization here), Track 7 / M24 (agent loops apply this as context compaction). Agent M08 implements compaction in the loop.
