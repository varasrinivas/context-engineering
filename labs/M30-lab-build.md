# M30 Lab: Build It with AI — A Versioned Prompt Registry with a Regression Gate

## Objective
With Claude, build a context version registry that treats prompts as code: register versions with changelogs, gate every candidate against the eval set (blocking regressions), stamp the active version into logs, and roll back in one call.

## Prerequisites
- Completed the M30 Understand It lab (you have `history.py`, `find_drift.py`)
- The M29 eval harness (`ab_eval.py`) — the gate reuses it
- Python 3.10+

## The Build (40 min)

### Step 1: Build the registry with Claude (14 min)

Claude prompt to use:
```
"Write registry.py — a context version registry treating prompts as code:
- register(version, prompt, changelog, accuracy=None): store a record
  {version, prompt, changelog, accuracy, ts, active:False} in an ordered list;
  return it. (accuracy may be filled by the gate.)
- active_version() -> the currently active record (the last one marked active),
  or None.
- set_active(version): mark that version active, all others inactive.
- rollback(version): set_active(version) and return a short report of what changed.
- stamp() -> the active version id, for embedding in observability logs (M28).
Return only the code."
```

Save as `registry.py`.

### Step 2: Build the regression gate with Claude (12 min)

Claude prompt to use:
```
"Write gate.py with gate(candidate_prompt, eval_set, baseline_accuracy, *,
min_delta=-0.005) -> dict. It must:
- run the candidate prompt over the eval set to get candidate_accuracy
  (reuse run_strategy from ab_eval.py; for the lab, the 'strategy' can be a stub that
  maps a prompt to an accuracy so it's deterministic),
- compute delta = candidate_accuracy - baseline_accuracy,
- BLOCK (passed=False) if delta < min_delta (a regression beyond tolerance),
  else PASS (passed=True),
- return {candidate_accuracy, baseline_accuracy, delta, passed,
  verdict: 'BLOCKED' or 'PASSED'}.
Return only the code."
```

Save as `gate.py`.

### Step 3: Run the release pipeline (10 min)

Create `release.py`:
```python
from registry import register, set_active, active_version, rollback, stamp
from gate import gate

EVAL = [...]  # your labeled eval set (or a stub the gate's stub strategy understands)

# Baseline v30 (known-good, 94.0%)
register("v30", "PROMPT v30 ...rules + redacted-example + amendment-example...", "baseline", 0.940)
set_active("v30")
print("active:", stamp())

# Candidate v31 — removes an edge-case example (the regressing change from Understand lab)
g = gate("PROMPT v31 ...edge example REMOVED...", EVAL, baseline_accuracy=0.940)
print("v31 gate:", g)
if g["passed"]:
    register("v31", "...", "removed edge example", g["candidate_accuracy"]); set_active("v31")
else:
    print("v31 BLOCKED — not registered as active")
assert not g["passed"], "the regressing v31 should be blocked"

# Candidate v31b — a genuine improvement (better examples, 95.5%)
g2 = gate("PROMPT v31b ...better diverse examples...", EVAL, baseline_accuracy=0.940)
print("v31b gate:", g2)
if g2["passed"]:
    register("v31b", "...", "improved few-shot diversity", g2["candidate_accuracy"]); set_active("v31b")
print("active now:", stamp())
```

Run it. **Expected:**
- `v31` gate → `BLOCKED` (accuracy regressed below tolerance); it never becomes active. The assertion passes.
- `v31b` gate → `PASSED`; it registers and becomes the active version.
- `stamp()` now returns `v31b` — the id you'd write into every observability log (M28).

### Step 4: Roll back (4 min)

```python
from registry import rollback, stamp
print(rollback("v30"))     # one-call rollback to the known-good baseline
print("active after rollback:", stamp())   # -> v30
```
Confirm `rollback("v30")` restores the known-good version in a single call — the property the 14-untracked-edits team didn't have.

## Deliverable
A `m30-lab/` folder containing:
- `registry.py` — versioned prompt registry (register / active / set_active / rollback / stamp)
- `gate.py` — an eval-set regression gate that blocks a regressing candidate
- `release.py` — a pipeline blocking the bad v31, admitting the good v31b, stamping the version, and rolling back
- A short note: context is now managed as code — every change gated, attributable, and reversible

You've built the missing half of production context engineering: a release pipeline where a regression is blocked before it ships and any version is one command from rollback.

## Stretch Goals
- Extend the gate to also check cost and a safety metric (malformed-rate from M21), blocking on any regression — not just accuracy.
- Add a canary mode: register a version as "canary" serving X% of traffic, and only promote to active if its online metrics (M28) hold.
- Bind cache invalidation (M19): on `set_active`, emit a "cache flush" event since the prompt prefix changed — tying versioning to the cache it affects.

## Connection to Next Module
You now have the full production toolkit: observe (M28), evaluate (M29), and version/gate (M30). M31 — the **Capstone** — assembles everything from all 8 tracks into one end-to-end production UCC lien-risk pipeline: assembled, positioned, governed, agent-driven, observed, evaluated, and versioned. It's the whole restaurant.
