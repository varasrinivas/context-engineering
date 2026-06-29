# M28 Lab: Understand It — Diagnose a Regression from Logs

## Objective
Given context logs spanning a "good" week and a "bad" week, aggregate them to find what regressed — purely from the data — and write the root-cause diagnosis without re-running a single call.

## Prerequisites
- Completed M28 module content
- Python 3.10+ (no API calls — analysis of provided logs)

## Setup (3 min)

Create `logs.py` — per-call context observability records across two weeks:
```python
# Each record: per-layer token counts, cache-hit (bool), and whether the answer was correct.
def week(label, ret_tokens, cache_hit_rate, correct_rate, n=100):
    import random; random.seed(hash(label) % 99)
    return [{
        "week": label,
        "tokens": {"system": 1200, "retrieval": ret_tokens, "tool": 500,
                   "conversation": 300, "user": 120},
        "cache_hit": random.random() < cache_hit_rate,
        "correct": random.random() < correct_rate,
    } for _ in range(n)]

GOOD = week("good", ret_tokens=2500, cache_hit_rate=0.92, correct_rate=0.94)
BAD  = week("bad",  ret_tokens=6000, cache_hit_rate=0.05, correct_rate=0.83)
LOGS = GOOD + BAD
```

## Exercise (25 min)

### Step 1: Aggregate per-layer tokens by week

Create `diagnose.py`:
```python
from logs import LOGS
from statistics import mean

def by_week(key_fn):
    out = {}
    for w in ("good", "bad"):
        rows = [r for r in LOGS if r["week"] == w]
        out[w] = key_fn(rows)
    return out

# Per-layer mean tokens
layers = ["system","retrieval","tool","conversation","user"]
print("PER-LAYER MEAN TOKENS")
for L in layers:
    vals = by_week(lambda rows: mean(r["tokens"][L] for r in rows))
    delta = vals["bad"] - vals["good"]
    flag = "  <-- REGRESSED" if abs(delta) > 500 else ""
    print(f"  {L:<13} good={vals['good']:>6.0f}  bad={vals['bad']:>6.0f}  Δ={delta:+.0f}{flag}")

print("\nCACHE-HIT RATE:", by_week(lambda rows: round(mean(r["cache_hit"] for r in rows),2)))
print("CORRECT RATE:  ", by_week(lambda rows: round(mean(r["correct"] for r in rows),2)))
```

Run it: `python diagnose.py`

**Expected:**
```
PER-LAYER MEAN TOKENS
  system        good=  1200  bad=  1200  Δ=+0
  retrieval     good=  2500  bad=  6000  Δ=+3500  <-- REGRESSED
  tool          good=   500  bad=   500  Δ=+0
  ...
CACHE-HIT RATE: {'good': 0.92, 'bad': 0.05}
CORRECT RATE:   {'good': 0.94, 'bad': 0.83}
```

### Step 2: Connect the dots

The logs alone tell the whole story:
- The **retrieval layer** more than doubled (2500 → 6000 tokens). Only retrieval changed.
- The **cache-hit rate collapsed** (92% → 5%) — consistent with a larger, per-call-varying retrieval set breaking the cached prefix (M19).
- **Accuracy dropped** (94% → 83%) — consistent with a critical chunk pushed into the lost-in-the-middle zone by the bigger context (M16).

### Step 3: Write the root-cause diagnosis

One sentence, from the data: *"A retrieval top-k increase doubled the retrieval layer (2.5k→6k tokens), which (a) buried the disqualifying filing in the lost-in-the-middle zone — dropping accuracy 94%→83% — and (b) broke the cached prefix — dropping cache-hit 92%→5% and raising cost."* No model change, no re-runs needed.

## Reflection Questions
1. You diagnosed both the accuracy drop *and* the cost rise from the same single change. How did logging the *per-layer* breakdown (not just total tokens) make that possible?
2. If you'd logged only the final answers (not the context shape), which of the three signals — retrieval size, cache-hit, accuracy — could you still have computed, and which would be invisible?
3. Map this to the black-box analogy — which "instrument reading" was the smoking gun?

## Key Insight
A per-layer, per-call context log lets you diagnose a production regression by *querying*, not guessing — the retrieval-layer token spike, the cache-hit collapse, and the accuracy drop all fall out of the same data, pointing at one root cause with no re-runs.
