# M30 Lab: Understand It — Reconstruct the Drift

## Objective
Given a versioned history of a UCC prompt with eval-set accuracy at each version, pinpoint the release that caused a regression, distinguish it from ordinary drift, and name the rollback target — showing how versioning turns a mystery into an attributable fact.

## Prerequisites
- Completed M30 module content
- Python 3.10+ (no API calls — analysis of a provided version history)

## Setup (3 min)

Create `history.py` — the quarter's prompt versions, each with its eval-set accuracy and a changelog note:
```python
VERSIONS = [
  ("v25", 0.941, "baseline: rules + 6 diverse few-shot examples"),
  ("v26", 0.940, "reworded a rule for clarity"),
  ("v27", 0.942, "added a borderline example"),
  ("v28", 0.939, "tightened output contract"),
  ("v29", 0.941, "minor typo fix"),
  ("v30", 0.940, "added EIN-format note"),
  ("v31", 0.910, "removed the 'redacted -> null' edge-case example (looked redundant)"),  # !!
  ("v32", 0.909, "reworded persona"),
  ("v33", 0.908, "added a tool-result note"),
  ("v34", 0.905, "bumped retrieval k 5 -> 8"),       # slow drift
  ("v35", 0.903, "added two more examples"),
  ("v36", 0.901, "reordered sections"),
  ("v37", 0.882, "removed the 'amendment -> see original' edge case"),  # !! second cliff
  ("v38", 0.881, "minor wording"),
  ("v39", 0.880, "added caveat"),
  ("v40", 0.880, "current"),
]
```

## Exercise (25 min)

### Step 1: Find the cliffs

Create `find_drift.py`:
```python
from history import VERSIONS

print(f"{'ver':<5}{'acc':>8}{'Δ':>8}  changelog")
prev = None
for ver, acc, note in VERSIONS:
    d = "" if prev is None else f"{acc-prev:+.3f}"
    flag = "  <-- REGRESSION" if prev is not None and acc-prev <= -0.015 else ""
    print(f"{ver:<5}{acc:>8.3f}{d:>8}  {note}{flag}")
    prev = acc
```

Run it: `python find_drift.py`

**Expected:** two cliffs stand out —
- **v31** (−0.030): "removed the 'redacted → null' edge-case example" — a single bad change (an M07 edge case deleted).
- **v37** (−0.019): "removed the 'amendment → see original' edge case" — a second edge-case deletion.

Plus a *slow drift* between them (v32–v36 each lose a few tenths of a percent — the cumulative leak).

### Step 2: Separate the cliffs from the drift

| Kind | Where | Cause | Loss |
|------|-------|-------|------|
| Regression cliff | v31 | deleted "redacted→null" example | −3.0% |
| Slow drift | v32–v36 | accumulated small untested edits | ~−0.9% total |
| Regression cliff | v37 | deleted "amendment→original" example | −1.9% |

Total 94.1% → 88.0% = the slide nobody could explain — now fully attributed.

### Step 3: Name the rollback target and the gate that would've caught it

- **Rollback:** to **v30** (last known-good at 94.0%) to immediately recover, then cherry-pick the *good* changes forward.
- **The gate that would've blocked v31:** an eval-set regression gate (M29) would have seen 94.0% → 91.0% (−3%) on the v31 candidate and **blocked the merge** — the bad change never ships, the slide never starts.

## Reflection Questions
1. Both cliffs were caused by *removing edge-case examples* that "looked redundant." Tie this to M07 — why does deleting a diverse example quietly hurt accuracy?
2. The slow drift (v32–v36) had no single bad change. Why is that kind of drift harder to catch than the cliffs, and what catches it (M28 vs. M29)?
3. Map this history to software release discipline — what would `git bisect` + a CI test suite have done here?

## Key Insight
Versioning with per-release eval results turns "accuracy slid all quarter and nobody knows why" into "v31 and v37 each deleted an edge case; roll back to v30" — drift becomes attributable to specific releases, and a regression gate would have blocked the bad ones before they ever shipped.
