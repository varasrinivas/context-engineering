# M25 Plan — Planning Context: Task Decomposition State Management

## Module Identity
- **ID:** M25
- **Track:** 7 (Agent Context Patterns)
- **Title:** Planning Context — Task Decomposition State Management
- **Subtitle:** Representing a decomposed task in context — flat, DAG, hierarchical — and mutating the plan as reality diverges
- **Icon:** 🗺️
- **Color:** #1a5276 (steel)

## Everyday Analogy
**The Project Manager's Gantt Chart**

A project manager doesn't keep the whole project in their head. They keep a Gantt chart: tasks broken into sub-tasks, dependencies drawn as arrows (you can't pour the foundation before the permit), a status on each bar (done / in-progress / blocked), and a critical path. When reality diverges — a supplier is late, a task reveals two new ones — they don't tear up the chart; they *update* it: re-sequence, add the discovered tasks, mark the blocker. The chart is the shared, living state of the plan. An agent's planning context is its Gantt chart: the decomposed task, the dependencies, the status of each step, and the discipline to mutate it when the work reveals something the original plan didn't know.

Mapping:
- The Gantt chart itself → the agent's plan held in context (planning state)
- Tasks broken into sub-tasks → task decomposition
- Dependency arrows (permit before foundation) → ordering/dependencies in the plan (a DAG)
- Status on each bar → per-step progress tracking (done/in-progress/blocked)
- A task revealing two new ones → plan mutation / dynamic re-planning
- The critical path → which sub-tasks gate the rest

## Key Topics (5)
1. **Planning context is part of the agent's state** — From M24, the agent carries a scratchpad; the *plan* is the most important thing on it. Planning context is the explicit representation of how a goal was decomposed into steps, what's done, and what's next — assembled into the window so the agent reasons against its own plan, not from scratch each iteration.
2. **State representations: flat, DAG, hierarchical** — Plans have structure. A **flat** to-do list is simplest (sequential steps). A **DAG** captures dependencies and parallelism (step C needs A and B; A and B can run together). A **hierarchical** plan nests sub-plans under steps (a step expands into its own mini-plan). The right representation matches the task's structure. *(UCC domain example lives here.)*
3. **Progress tracking and the status of each step** — The plan isn't static text; each step carries a status (pending / in-progress / done / blocked / failed) and its result. Keeping accurate, compact status in context is how the agent knows what to do next and avoids re-doing or skipping steps (ties to M24's "done" set).
4. **Plan mutation: re-planning when reality diverges** — The first plan is a hypothesis. Tool results reveal blockers, dead ends, and newly-discovered sub-tasks. A good agent *mutates* its plan — re-sequence, insert discovered steps, mark a branch failed — rather than rigidly executing a stale plan or abandoning planning entirely. Designing how the plan updates is core.
5. **Keeping the plan compact and legible** — The plan competes for window space with everything else (M24 context pressure). Represent it compactly (status symbols, IDs, not prose), pin it (M24), and summarize completed branches — so the full plan stays legible without dominating the window or sinking into the lost-in-the-middle zone (M16).

UCC domain example appears in: Topic 2 — an agent tasked with "produce a full risk report for debtor ACME." A flat list under-serves it; the real structure is a DAG: (1) resolve entity + aliases → (2a) pull liens per state, (2b) pull related parties [both depend on 1, run in parallel] → (3) fuse + score [depends on 2a, 2b] → (4) format report [depends on 3]. When step 2b reveals a hidden related entity, the plan *mutates* — a new "pull liens for the related entity" sub-task is inserted with its dependency, and step 3 waits for it.

## Sections Outline

### Section 1: content — "The Plan Is the Center of the Agent's State"
- Recap M24: the agent carries a scratchpad; the plan is its most important element.
- Planning context = the explicit decomposition (steps, dependencies, status, next) assembled into the window so the agent reasons against its plan.
- Without an explicit plan in context, the agent improvises each step and loses coherence over a long task.

### Section 2: content — "Representations and Plan Mutation"
- Three representations: flat list (sequential), DAG (dependencies + parallelism), hierarchical (nested sub-plans). Match the representation to the task structure.
- UCC tie-in: the risk-report task as a DAG, not a flat list, because of dependencies and parallelism.
- Plan mutation: the first plan is a hypothesis; tool results reveal blockers and new sub-tasks. The agent re-sequences, inserts discovered steps, marks failures — rather than rigidly executing or abandoning the plan. The discovered-related-entity example.

### Section 3: code — "A Mutable Plan as Agent State"
- Language: Python
- Demonstrates: a `Plan` with steps that have id, deps, status, and result; methods to find the next runnable step (deps satisfied), mark a step done/blocked, and `insert` a discovered sub-task with a dependency (mutation). A compact `render()` shows the plan as status symbols for the window.
- UCC tie-in: the risk-report DAG; marking 2a/2b done, inserting the discovered related-entity step, and step 3 unblocking only when its deps complete.
- Emphasize: the plan is structured, mutable state, rendered compactly.

### Section 4: quiz — "Flat List or DAG?"
- Question: "Your agent must produce a UCC risk report: resolve the entity, then (in parallel) pull liens per state and pull related parties, then fuse and score, then format. Midway, the related-parties step discovers a hidden affiliated entity whose liens also matter. You represented the plan as a flat sequential to-do list. What's the core problem?"
- Options:
  - A. Nothing — a flat list is always fine; just add the new task to the end
  - B. A flat list can't express the dependencies and parallelism (fuse must wait for BOTH lien and related-party steps) or cleanly absorb the discovered sub-task with its dependency — a DAG representation lets the agent run independent steps in parallel, insert the new entity's lien step with the right dependency, and unblock scoring only when all inputs are ready
  - C. The agent should refuse to continue when the plan changes
  - D. Switch to a bigger model so it can hold the plan in its head without a structure
  - correct: B (index 1)
- Explanation: The task has real structure — parallelism (liens and related parties are independent) and dependencies (scoring needs both; a discovered entity's liens become a new input to scoring). A flat list erases that structure, so the agent can't tell what's runnable in parallel, can't express that fuse-and-score must wait for both branches, and has nowhere coherent to attach the discovered sub-task and its dependency. A DAG representation captures dependencies and parallelism and absorbs plan mutations cleanly. Appending to a flat list (A) loses the dependency that scoring must wait for the new entity; refusing (C) abandons the task; a bigger model (D) doesn't supply the missing structure — the plan needs to be represented, not memorized.

### Section 5: antipattern — "Plans That Don't Survive Contact"
- Anti-pattern 1: No explicit plan in context — the agent improvises each step with no decomposition, losing coherence and re-deriving the approach every iteration.
- Anti-pattern 2: A rigid, immutable plan — executing the original decomposition even when tool results reveal blockers or new sub-tasks, so the agent does the wrong (planned) thing instead of adapting.
- Anti-pattern 3: Wrong representation — a flat list for a task with real dependencies/parallelism, so the agent serializes work that could run together and can't express which steps gate which.

## SVG Diagram Plan
**"The Plan as a Mutable DAG" — a UCC risk-report DAG with statuses and a mutation inserted**

```
   GOAL: full risk report for ACME

   [1] resolve entity ✓
        ├──────────────┬───────────────┐
        ▼              ▼                ▼
   [2a] liens/state ✓  [2b] related parties ✓ ──(discovers hidden entity)──┐
        │              │                                                    │
        │              │                          [2c] liens for related ⏳ (INSERTED)
        └──────┬───────┴────────────────────────────────┘
               ▼
          [3] fuse + score ⏳ (waits for 2a, 2b, 2c)
               ▼
          [4] format report ◻ pending
   legend: ✓ done · ⏳ in-progress/blocked · ◻ pending
   "the plan is a hypothesis — mutate it when reality diverges"
```

- A DAG of nodes: [1] resolve → fan-out to [2a] liens-per-state and [2b] related-parties (parallel) → converge on [3] fuse+score → [4] format. Each node shows a status symbol.
- A mutation highlight: [2b] discovers a hidden entity, so a new node [2c] "liens for related entity" is *inserted* (amber, dashed "INSERTED") with a dependency into [3], which now waits for 2a+2b+2c.
- A legend for the status symbols.
- A caption: "the plan is a hypothesis — mutate it when reality diverges."
- Colors: steel #1a5276 primary for the DAG nodes/edges; green-ish for done (✓); amber #b8860b for the inserted node and in-progress; muted for pending; warm paper background; Fraunces title, JetBrains Mono labels.
- Reinforces the Gantt-chart analogy: tasks, dependencies, statuses, and a living update.

## Cross-Links
- **Agent M13** (type: agent, label "Agent M13 — Task Decomposition"): CLAUDE.md table maps M25↔Agent M13 (CE = state management; Agent = decomposition). This module governs how the decomposition is represented in context; the Agent course covers how the agent decomposes. Reference in the representations section.

## Lab Briefs

### Understand It: Model the Same Task Three Ways
- Give the learner the UCC risk-report task and have them represent its plan as (A) a flat list, (B) a DAG, (C) a hierarchical plan; then introduce a discovered sub-task and a parallelism opportunity.
- They identify which representation expresses the dependencies, which enables parallelism, and which cleanly absorbs the mutation.
- Expected output: the three representations side by side, annotated with where each fails or succeeds on dependencies, parallelism, and the inserted task.
- Duration: ~25 minutes.

### Build It with AI: A Mutable DAG Plan with Progress Tracking
- With Claude, build a `Plan` (DAG): steps with id/deps/status/result, `next_runnable()` (deps satisfied + pending), `mark(id, status, result)`, `insert(step, after_deps)` for discovered sub-tasks, and a compact `render()` for the window.
- Steps: build the risk-report DAG → run it, marking steps done and unblocking dependents → at step 2b, insert the discovered related-entity step with a dependency into scoring → confirm scoring waits for all three inputs → render the compact plan that would go in the window each iteration.
- Expected deliverable: a mutable DAG plan + a run showing correct dependency ordering, parallel-eligible steps surfaced together, the mutation inserted cleanly, and scoring firing only when all inputs (including the discovered one) are done.
- Duration: ~40 minutes.

## Context Engineering Takeaway
The plan is the center of an agent's carried state, so represent it explicitly and structurally — a DAG when the task has dependencies and parallelism — track each step's status compactly, and mutate the plan when tool results reveal blockers or new sub-tasks, because a rigid or shapeless plan is exactly what makes a long agent task go wrong.

## Anti-Patterns
1. No explicit plan in context — improvising each step with no decomposition, losing coherence and re-deriving the approach every iteration.
2. A rigid, immutable plan — executing the original decomposition even when tool results reveal blockers or new sub-tasks.
3. Wrong representation — a flat list for a task with real dependencies/parallelism, so work that could run together is serialized and gating relationships can't be expressed.

## Continuity Notes
- **Builds on:** M24 (the plan is the central element of the carried agent state; pinning + compaction apply to it), M11 (fuse step depends on multiple sources), M16/M03 (keep the plan compact and out of the trough), M02 (decomposition is part of the Assemble stage). The planning-state view of the agent loop.
- **Referenced by:** M26 (multi-agent — a coordinator's plan delegates sub-tasks to other agents), M27 (a blocked/uncertain plan step escalates to a human), M31 (the capstone executes a multi-step plan). Agent M13 covers the decomposition this module represents in context.
