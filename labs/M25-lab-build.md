# M25 Lab: Build It with AI — A Mutable DAG Plan with Progress Tracking

## Objective
With Claude, build a `Plan` (a DAG of steps with dependencies and status), run the UCC risk-report plan, surface parallel-eligible steps, insert a discovered sub-task mid-run, and confirm scoring fires only when *all* its inputs — including the discovered one — are done.

## Prerequisites
- Completed the M25 Understand It lab (you have the DAG sketch)
- Python 3.10+ (Claude API optional — the plan engine is local)

## The Build (40 min)

### Step 1: Build the Plan DAG with Claude (15 min)

Claude prompt to use:
```
"Write plan.py with a Plan class modeling a task as a DAG:
- Step dataclass: id, deps (set of step ids), status ('pending'|'running'|'done'|
  'blocked'|'failed'), result.
- Plan(goal); add(id, deps=()).
- next_runnable() -> list of steps that are 'pending' AND whose deps are all 'done'
  (this surfaces parallel-eligible steps together).
- mark(id, status, result=None).
- insert(id, deps, blocks): MUTATION — add a new step with deps, AND add this new id
  to the deps of the 'blocks' step (so the downstream step now waits for it).
- is_complete() -> True when every step is 'done'.
- render() -> a compact one-line-per-step string with a status symbol and deps, suitable
  for putting in an agent's context window.
Return only the code."
```

Save as `plan.py`.

### Step 2: Build and run the risk-report DAG (12 min)

Create `run_plan.py`:
```python
from plan import Plan

p = Plan("full risk report for ACME")
p.add("1_resolve")
p.add("2a_liens",   ["1_resolve"])
p.add("2b_related", ["1_resolve"])
p.add("3_score",    ["2a_liens", "2b_related"])
p.add("4_format",   ["3_score"])

def step():
    runnable = p.next_runnable()
    print("runnable now:", [s.id for s in runnable])
    return runnable

# Iteration 1: only resolve is runnable
step(); p.mark("1_resolve", "done")
# Iteration 2: 2a AND 2b are runnable in PARALLEL
step()
p.mark("2a_liens", "done", result={"FL":3,"TX":2})
# 2b discovers a hidden affiliated entity BEFORE finishing -> MUTATION
p.insert("2c_related_liens", deps=["2b_related"], blocks="3_score")
p.mark("2b_related", "done", result=["ACME HOLDINGS (hidden)"])
print("after discovery:\n", p.render())
# 3_score must NOT be runnable yet — 2c is still pending
assert "3_score" not in [s.id for s in p.next_runnable()], "scoring fired too early!"
# Finish 2c, THEN scoring unblocks
step(); p.mark("2c_related_liens", "done", result={"ACME HOLDINGS":1})
step(); p.mark("3_score", "done", result="HIGH")
step(); p.mark("4_format", "done")
print("\ncomplete:", p.is_complete())
```

Run it: `python run_plan.py`

**Expected behavior:**
- After resolve, `next_runnable` returns **both** `2a` and `2b` (parallelism surfaced).
- After the `insert`, `render()` shows `2c` added and `3_score` now depending on `{2a, 2b, 2c}`.
- The assertion holds: `3_score` is **not** runnable until `2c` is done — the discovered sub-task correctly gates scoring.
- `complete: True` at the end.

### Step 3: Render the compact plan for the window (8 min)

Confirm `render()` produces something small enough to pin in an agent's context each iteration (M24):
```python
print(p.render())
# GOAL: full risk report for ACME
#   ✓ 1_resolve  deps=-
#   ✓ 2a_liens  deps=['1_resolve']
#   ✓ 2b_related  deps=['1_resolve']
#   ✓ 2c_related_liens  deps=['2b_related']
#   ✓ 3_score  deps=['2a_liens','2b_related','2c_related_liens']
#   ✓ 4_format  deps=['3_score']
```
This is the planning context the agent carries — compact, legible, and structurally accurate.

### Step 4: Prove the mutation is load-bearing (5 min)

Re-run but *skip* the `insert` (simulating an agent that ignored the discovery). Confirm `3_score` becomes runnable after only 2a+2b — i.e., it scores **without** the hidden entity's liens, producing a wrong risk. This shows the mutation isn't cosmetic: it's what makes the score correct.

## Deliverable
A `m25-lab/` folder containing:
- `plan.py` — a mutable DAG `Plan` (deps, status, `next_runnable`, `mark`, `insert`, `render`)
- `run_plan.py` — the risk-report DAG run showing parallelism, a mid-run insertion, and correct gating
- A short note: scoring waits for all inputs incl. the discovered entity; skipping the mutation produces a wrong score (so the mutation is load-bearing)

You can now represent an agent's plan as structured, mutable state that expresses dependencies, surfaces parallel work, and adapts when the task reveals more than the original decomposition knew.

## Stretch Goals
- Add `critical_path()` that returns the longest dependency chain — the steps that gate total completion time.
- Add a `blocked` reason and an escalation hook: if a step is `blocked` for a human decision, surface it (a preview of M27).
- Pin `render()` into your M24 agent loop's `window()` so the plan and the carried findings travel together, compactly.

## Connection to Next Module
You've managed *one* agent's plan and state. M26 (Multi-Agent Context Sharing) scales to *many* agents: when a coordinator delegates DAG sub-tasks to separate agents, how do they share context — hub-and-spoke, blackboard, or message passing — without the shared context exploding or one agent's state contaminating another's?
