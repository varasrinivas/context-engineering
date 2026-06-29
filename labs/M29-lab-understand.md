# M29 Lab: Understand It — Anecdote vs. Eval Set

## Objective
Watch a context strategy that "wins" on a cherry-picked handful of examples shrink — possibly into noise — when measured on a representative labeled eval set, and name exactly why the small-set result fooled you.

## Prerequisites
- Completed M29 module content
- Python 3.10+ (no API calls — uses provided graded outputs)

## Setup (3 min)

Create `evalset.py` — strategy A and B scored on a tiny cherry-picked set and a full eval set. (Scores are pre-graded against known labels: 1 = correct.)
```python
# CHERRY-PICKED: 8 filings hand-selected because B looked good on them.
CHERRY_A = [1,0,1,0,1,0,1,0]   # A: 4/8 = 50%
CHERRY_B = [1,1,1,1,1,1,1,0]   # B: 7/8 = 88%   (+38%! looks amazing)

# FULL EVAL SET: 200 representative filings (incl. edge/borderline), pre-graded.
import random; random.seed(1)
FULL_A = [1 if random.random() < 0.910 else 0 for _ in range(200)]   # A ~ 91.0%
FULL_B = [1 if random.random() < 0.922 else 0 for _ in range(200)]   # B ~ 92.2%
```

## Exercise (25 min)

### Step 1: Measure both sets

Create `compare.py`:
```python
from evalset import CHERRY_A, CHERRY_B, FULL_A, FULL_B
from statistics import mean

def acc(x): return mean(x)

print("CHERRY-PICKED (n=8):")
print(f"  A={acc(CHERRY_A):.0%}  B={acc(CHERRY_B):.0%}  Δ={acc(CHERRY_B)-acc(CHERRY_A):+.0%}")

print("FULL EVAL SET (n=200):")
print(f"  A={acc(FULL_A):.1%}  B={acc(FULL_B):.1%}  Δ={acc(FULL_B)-acc(FULL_A):+.1%}")
```

Run it: `python compare.py`

**Expected:**
```
CHERRY-PICKED (n=8):   A=50%  B=88%  Δ=+38%
FULL EVAL SET (n=200): A=91.0%  B=92.2%  Δ=+1.2%
```

The +38% "win" collapses to +1.2% on the representative set.

### Step 2: Is +1.2% even real?

A quick two-proportion sanity check (is the full-set delta distinguishable from noise?):
```python
import math
from evalset import FULL_A, FULL_B
from statistics import mean
nA=nB=200; pA=mean(FULL_A); pB=mean(FULL_B)
p=(pA*nA+pB*nB)/(nA+nB)
se=math.sqrt(p*(1-p)*(1/nA+1/nB))
z=(pB-pA)/se
print(f"z = {z:.2f}  (|z|>1.96 ~ p<0.05)")   # likely |z| < 1.96 -> NOT significant
```
**Expected:** `|z|` is well under 1.96 — the +1.2% is **not** statistically significant at n=200. The honest verdict is "no measured improvement," not "+1.2% better."

### Step 3: Name the three traps

From this run, identify each:
- **Selection bias** — the 8 filings were *chosen because* B looked good on them.
- **Small sample** — 8 examples can't estimate a ~1% effect; the noise dwarfs the signal.
- **Confirmation bias** — the +38% felt like proof because you wanted B to win.

## Reflection Questions
1. The cherry-picked set wasn't *fabricated* — those 8 results were real. So why is reporting "+38%" from them dishonest rather than just optimistic?
2. At n=200 the delta is +1.2% and not significant. What would you need to change to detect a *true* 1.2% effect if one existed — and is detecting it even worth it given the rerank's cost (M03/M09)?
3. Map the cherry-picked set and the eval set to the clinical-trial analogy — which is "my cousin recovered," and which is the trial?

## Key Insight
A strategy can look dramatically better on a hand-picked handful and be statistically indistinguishable on a representative set — so the eval set plus a significance test, not the anecdote, is what tells you whether an improvement is real.
