# M24 Lab: Build It with AI — A Compacting, Checkpointing Agent Loop

## Objective
With Claude, build an agent loop with managed state — pinned goal, per-iteration compaction, dropped raw output, pinned running totals, and checkpoint/resume — then prove the window stays bounded, the total is correct with no re-queries, and a crash resumes from a checkpoint without redoing work.

## Prerequisites
- Completed the M24 Understand It lab (you have `investigation.py`, `naive_loop.py`)
- Claude API access (optional — the state logic is local), Python 3.10+

## The Build (40 min)

### Step 1: Build the managed AgentState with Claude (15 min)

Claude prompt to use:
```
"Write agent_state.py with an AgentState class for a UCC investigation agent loop:
- __init__(goal): store a PINNED goal; init findings=[], total=0, done=set().
- shape(raw): given a verbose tool result dict {state, active_liens, raw_text},
  return a one-line finding 'STATE: N active liens'.
- record(raw): if raw['state'] already in done, return without double counting
  (no re-query). Else append shape(raw) to findings, add active_liens to total,
  add state to done. DROP raw['raw_text'] — never store it.
- window(): return the per-iteration context string containing ONLY: the pinned goal,
  the sorted done set, the one-line findings, and the running total. Never the raw dumps.
- checkpoint() -> a JSON string of the full state (goal, findings, total, done as list).
- classmethod resume(json_str) -> a restored AgentState.
Return only the code."
```

Save as `agent_state.py`.

### Step 2: Run the managed loop (10 min)

Create `managed_loop.py`:
```python
from investigation import tool_lookup
from agent_state import AgentState

RAW = {  # verbose results keyed by state (active counts as in the Understand lab)
  "FL": {"state":"FL","active_liens":3,"raw_text":"...8 verbose filings..."},
  "TX": {"state":"TX","active_liens":2,"raw_text":"...8 verbose filings..."},
  "NY": {"state":"NY","active_liens":2,"raw_text":"...8 verbose filings..."},
  "GA": {"state":"GA","active_liens":0,"raw_text":"...8 verbose filings..."},
  "CA": {"state":"CA","active_liens":1,"raw_text":"...8 verbose filings..."},
}
PLAN = ["FL","TX","NY","GA","FL","CA"]   # FL repeated on purpose

st = AgentState("Total active liens for ACME across FL,TX,NY,GA,CA")
for state in PLAN:
    st.record(RAW[state])
    print(f"after {state}: window={len(st.window())} chars, total={st.total}, done={sorted(st.done)}")

print("\nFINAL window:\n", st.window())
print("FINAL total:", st.total, "(expected 8)")
```

Run it. **Expected:**
- The window size stays roughly **flat** across iterations (one short finding added per new state, raw dumps dropped).
- The repeated **FL** is a no-op — `done` already contains it, so the total isn't double-counted.
- `FINAL total: 8` (3+2+2+0+1) — correct, no re-query inflation.

### Step 3: Checkpoint and resume (10 min)

Create `resume_demo.py`:
```python
from investigation import tool_lookup
from agent_state import AgentState

RAW = {...}  # same as managed_loop.py

st = AgentState("Total active liens for ACME across FL,TX,NY,GA,CA")
# Cover the first 3 states, then "crash" — but we checkpointed after each.
saved = None
for state in ["FL","TX","NY"]:
    st.record(RAW[state]); saved = st.checkpoint()
print("checkpoint after NY:", saved)

# --- process dies here ---

# Resume from the checkpoint and finish the remaining states.
st2 = AgentState.resume(saved)
print("resumed with done =", sorted(st2.done), "total =", st2.total)
for state in ["GA","CA"]:
    st2.record(RAW[state])
print("FINAL after resume:", st2.total, "done =", sorted(st2.done))
```

Run it. **Expected:**
- `resumed with done = ['FL','NY','TX'] total = 7` — the three completed states survived the crash.
- The resumed loop covers only GA and CA — it does **not** re-query FL/TX/NY. Final total `8`.

### Step 4: Compare the two loops (5 min)

| | Naive append-only (Understand) | Managed (this lab) |
|---|--------------------------------|--------------------|
| Window growth | grows every iteration | ~flat |
| Repeated FL | re-counted, total wrong | no-op, total correct |
| Goal legibility | buried by iter 5 | pinned, always visible |
| Crash | restart from zero | resume from checkpoint |

## Deliverable
A `m24-lab/` folder containing:
- `agent_state.py` — pinned goal, per-iteration compaction, dropped raw output, pinned totals, checkpoint/resume
- `managed_loop.py` — bounded window + correct total with no re-queries
- `resume_demo.py` — a crash-and-resume that skips completed states
- A short comparison note: managed loop stays bounded and correct where the naive loop drifts and re-spends

You've made the agent's carried context a designed, durable artifact — the case board that survives the whole investigation.

## Stretch Goals
- Add an LLM summarizer for `shape()` so a giant raw result is abstractively compacted (M18) — and assert the active-lien count survives the compression (fidelity check).
- Add a token budget to `window()` (M03): if findings ever exceed it, summarize the oldest findings into a rollup line.
- Add an audit trail (M22): log each `record`/`checkpoint` with a timestamp so the investigation is reconstructable.

## Connection to Next Module
You managed the agent's *working* state. M25 (Planning Context) zooms into one part of that state — the plan itself: how an agent represents a decomposed task (flat list, DAG, hierarchy), tracks progress through it, and mutates the plan when reality diverges from the original decomposition.
