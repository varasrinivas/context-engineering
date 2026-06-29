# M24 Plan — Agent Loop Context: What Persists Across Iterations

## Module Identity
- **ID:** M24
- **Track:** 7 (Agent Context Patterns)
- **Title:** Agent Loop Context — What Persists Across Iterations
- **Subtitle:** Designing what the agent carries from one step to the next — scratchpad, context pressure, and checkpointing
- **Icon:** 🤖
- **Color:** #1a5276 (steel)

## Everyday Analogy
**The Detective's Case Board Across Days**

A detective doesn't re-read every file from scratch each morning. They keep a case board: photos, a timeline, strings connecting suspects, a list of leads to chase, and notes on what's already been ruled out. Each day they add what they learned and prune what turned out to be a dead end — but the board is finite, so they can't pin everything; they keep the load-bearing facts and summarize the rest into the timeline. An agent loop is the same: each iteration the agent acts, observes a result, and updates its "board" (the context it carries forward) — and because the board (the window) is finite, the central skill is deciding what persists, what gets summarized, and what gets dropped between steps.

Mapping:
- The case board carried day to day → the agent's persistent loop context (scratchpad/state)
- Adding what you learned each day → appending tool results and observations each iteration
- Pruning dead-end leads → dropping/compacting low-value context between steps
- The board is finite, can't pin everything → the fixed window under accumulating loop pressure
- Notes on what's already ruled out → the agent remembering what it already tried (avoiding loops)
- The timeline summarizing old details → hierarchical summarization of earlier iterations (M12)

## Key Topics (5)
1. **The agent loop and its context lifecycle** — An agent runs a loop: observe → think → act (call a tool) → observe the result → repeat. Unlike a single call, context *accumulates* every iteration. The defining question of agent context engineering is: what does the agent carry from step N to step N+1, and what does it leave behind?
2. **The scratchpad pattern** — Agents need a working memory across steps: the goal, the plan, what's been tried, intermediate results, and the next action. This "scratchpad" (or agent state) is assembled into the window each iteration — it's the case board. Designing it well is what keeps an agent coherent over many steps.
3. **Context pressure: the window fills up** — Every tool result, every reasoning step adds tokens. Over a long loop the window fills, costs climb (M03), and the lost-in-the-middle trough deepens (M16). Context pressure is the agent-specific failure mode: the agent runs out of room and starts forgetting its own goal or earlier findings. *(UCC domain example lives here.)*
4. **Compaction in the loop** — The response to context pressure: compress the loop context as it grows. Summarize completed sub-steps, drop raw tool outputs once their conclusion is recorded (M10 shaping + M18 compression, applied per-iteration), and pin the goal and key decisions so they survive. This is M12's history management, generalized to an agent's working state.
5. **Checkpointing and durability** — Long agent runs need to survive interruption: a checkpoint saves the agent's state (goal, plan, progress, key results) so the loop can resume without redoing work. Checkpoints also enable rollback, audit (M22), and human handoff (M27). The loop context must be serializable, not just in-memory.

UCC domain example appears in: Topic 3 — an agent investigating a debtor's full lien exposure across 5 states. Each state is a tool call returning a verbose filing list; after 5 iterations the raw results have filled the window, and the agent — its original goal now in the lost-in-the-middle zone — starts re-querying a state it already covered. The fix: compact each state's result to a one-line summary once recorded, pin the goal and the running total, and checkpoint so a timeout doesn't lose the four states already done.

## Sections Outline

### Section 1: content — "The Loop Changes Everything About Context"
- A single call assembles context once; an agent loop re-assembles it every iteration, and context *accumulates*.
- The central question: what persists from step N to N+1? Everything you learned in Tracks 1–6 now has to survive a loop.
- Frame the loop: observe → think → act → observe → repeat, with a growing carried context (the case board).

### Section 2: content — "The Scratchpad and Context Pressure"
- The scratchpad/agent-state: goal, plan, what's been tried, intermediate results, next action — assembled into the window each step.
- Context pressure: tokens accumulate, window fills, cost climbs (M03), middle deepens (M16). The agent forgets its own goal or re-does work — the defining agent failure mode.
- UCC tie-in: the 5-state lien investigation where raw results bury the goal and the agent re-queries a covered state.

### Section 3: code — "An Agent Loop with Compaction and Checkpointing"
- Language: Python
- Demonstrates: an agent loop holding a `state` (goal pinned, running summary, completed steps, raw last-result), where after each tool call the raw result is compacted to a one-line finding and appended to a durable list, the goal stays pinned, and a `checkpoint(state)` serializes progress. Shows the window staying bounded across iterations.
- UCC tie-in: each state's lien query compacted to "FL: 3 active liens (total now 7)"; goal pinned; checkpoint after each state so a crash resumes.
- Emphasize bounded context across a long loop.

### Section 4: quiz — "Why Did the Agent Re-Query Florida?"
- Question: "Your UCC investigation agent loops over 5 states, each a verbose tool call. By iteration 5 it re-queries Florida — which it already covered in iteration 1 — and its lien total is wrong. The window is near full of raw filing dumps. What's the fix?"
- Options:
  - A. Increase max iterations so it has more attempts to get it right
  - B. Manage the loop context: compact each tool result to a one-line finding once recorded, pin the goal and the running total so they survive context pressure, and drop the raw dumps — so the agent's own state (states covered, total) stays visible instead of buried
  - C. Switch to a model with a bigger context window
  - D. Tell the agent in the prompt to 'remember what you already did'
  - correct: B (index 1)
- Explanation: The agent re-queried Florida because the record of having covered it — and the running total — got buried under raw filing dumps in the lost-in-the-middle zone (M16) as context pressure built. The fix is loop context management: shape each tool result down to its conclusion (M10), compact completed steps (M18/M12), drop the raw output once the finding is recorded, and pin the goal and running state so they stay salient. A bigger window (C) or more iterations (A) just delays the same pressure; a prompt instruction (D) can't help when the relevant facts are no longer legible in the window.

### Section 5: antipattern — "Letting the Loop Run Away"
- Anti-pattern 1: Append-only loop context — every raw tool result kept forever, so the window fills, cost explodes, and the goal sinks into the middle (the agent forgets why it started).
- Anti-pattern 2: No pinned state — the goal, plan, and progress left to drift in the accumulating history, so the agent loses track of what it's done and re-does work.
- Anti-pattern 3: No checkpointing — long runs held only in memory, so a timeout or crash loses all progress and the agent starts over (and re-spends).

## SVG Diagram Plan
**"The Agent Loop and Its Carried Context" — the loop cycle with a bounded scratchpad held across iterations**

```
        ┌──────── AGENT LOOP ────────┐
   observe → think → act (tool) → result
        ▲                           │
        └─────────── compact ───────┘
                     │
   CARRIED CONTEXT (bounded scratchpad):
   ┌───────────────────────────────────┐
   │ 📌 GOAL: total lien exposure (pinned)│
   │ ✓ FL: 3 liens   ✓ TX: 2   ✓ NY: 2   │ ← compacted findings
   │ running total: 7                     │ ← pinned state
   │ next: GA   |   [checkpoint saved]    │
   └───────────────────────────────────┘
   raw tool dump → shaped to one line → dropped
   "what persists from step N to N+1 is the design"
```

- A loop cycle at top (observe → think → act → result → compact → back to observe).
- Below it, the "carried context" box: a pinned GOAL (amber pin), a list of compacted per-state findings with checks, a pinned running total, the next action, and a "checkpoint saved" tag.
- A side note: "raw tool dump → shaped to one line → dropped" showing the per-iteration compaction.
- A caption: "what persists from step N to N+1 is the design."
- Colors: steel #1a5276 primary for the loop and carried-context box; amber #b8860b for the pinned goal/state (the survivors); muted grey for the dropped raw dump; warm paper background; Fraunces title, JetBrains Mono labels.
- Reinforces the detective case-board analogy: a finite board updated and pruned each day.

## Cross-Links
- **Agent M12** (type: agent, label "Agent M12 — The Agent Loop"): CLAUDE.md table maps M24↔Agent M12 (CE = what persists; Agent = the loop itself). This module is the context-side view of the loop the Agent course implements. Reference in the loop-lifecycle section.

## Lab Briefs

### Understand It: Watch Context Pressure Build
- Give the learner a simple append-only agent loop over a multi-step UCC investigation; they log the window token count per iteration and watch it grow, then observe the agent re-doing a step or losing the goal once the window is full.
- They identify the iteration where the goal entered the lost-in-the-middle zone and the step that got re-done.
- Expected output: a per-iteration table (step, tokens, goal-still-legible?, error?) showing pressure building to failure, and the iteration where it broke.
- Duration: ~25 minutes.

### Build It with AI: A Compacting, Checkpointing Agent Loop
- With Claude, build an agent loop with a managed `state`: goal pinned, each tool result shaped to a one-line finding and appended to a durable list, raw output dropped, running totals pinned, and a `checkpoint`/`resume` pair that serializes and restores progress.
- Steps: pin the goal → per-iteration compaction (shape + drop raw) → pin running state → checkpoint each step → run the 5-state investigation and confirm bounded window + correct total → kill and resume from a checkpoint without redoing covered states.
- Expected deliverable: a managed agent loop + a demo showing bounded context across iterations, the correct lien total (no re-queries), and a resume-from-checkpoint that skips completed work.
- Duration: ~40 minutes.

## Context Engineering Takeaway
An agent loop re-assembles its context every iteration, so the discipline is designing what persists: pin the goal and running state, compact each tool result to its conclusion and drop the raw output, and checkpoint progress — so the window stays bounded, the agent never loses track of why it started, and a crash resumes instead of restarting.

## Anti-Patterns
1. Append-only loop context — keeping every raw tool result, so the window fills, cost explodes, and the goal sinks into the lost-in-the-middle zone.
2. No pinned state — the goal, plan, and progress left to drift in the accumulating history, so the agent re-does work it already completed.
3. No checkpointing — long runs held only in memory, so a timeout or crash loses all progress and forces a restart.

## Continuity Notes
- **Builds on:** M12 (history management — now applied to an agent's working state), M10 (tool-result shaping per iteration), M18 (compaction), M16 (the goal hits lost-in-the-middle under pressure), M03 (loop cost), M13 (the scratchpad is the ephemeral/session memory layer). Opens Track 7 — agents — by making the loop's context the design object.
- **Referenced by:** M25 (planning context — the plan is part of the carried state), M26 (multi-agent — each agent has its own loop context to share or isolate), M27 (checkpoints enable human handoff), M22 (checkpoints/audit). Agent M12 implements the loop this module governs.
