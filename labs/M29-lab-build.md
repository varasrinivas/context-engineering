# M29 Lab: Build It with AI — An A/B Evaluation Harness

## Objective
With Claude, build a reusable A/B evaluation harness for context strategies — a labeled eval set, a strategy runner that captures output variance, and a significance-gated `compare()` — then use it to (correctly) reject a marginal change and accept a clearly-better one.

## Prerequisites
- Completed the M29 Understand It lab (you have `evalset.py`, `compare.py`)
- Python 3.10+ (Claude API optional — you can run with stubbed strategy scorers)

## The Build (40 min)

### Step 1: Build the eval set + strategy runner with Claude (14 min)

Claude prompt to use:
```
"Write ab_eval.py for evaluating UCC context strategies:
- An eval set is a list of {filing, gold_risk} dicts. Provide make_eval_set(n) that
  generates representative items including edge cases (redacted, borderline, a
  disqualifying-lien case) with their gold labels.
- run_strategy(strategy_fn, eval_set, samples=3) -> per-item accuracy: for each item,
  call strategy_fn(filing) `samples` times (to capture output VARIANCE), score each
  against gold_risk, and return the mean per item. strategy_fn returns a risk string.
- Return run_strategy's overall list of per-item accuracies (0..1).
No network required if strategy_fn is a stub; if it uses Claude, read ANTHROPIC_API_KEY
from the env. Return only the code."
```

Save as `ab_eval.py`.

### Step 2: Build the significance-gated compare with Claude (12 min)

Claude prompt to use:
```
"Extend ab_eval.py with compare(scores_a, scores_b, alpha=0.05) -> dict that:
- computes mean accuracy for A and B and the delta,
- runs a paired significance test on the per-item scores (a bootstrap over item-level
  differences is fine: resample the per-item diffs many times, compute the fraction of
  resamples where the mean diff <= 0 as a one-sided p-value),
- returns {acc_a, acc_b, delta, p_value, significant: p_value < alpha,
  verdict: 'SHIP' if significant and delta>0 else 'NO-SHIP'}.
Return the updated code."
```

### Step 3: Reject a marginal change (8 min)

Create `marginal.py` — two strategies that differ by ~1% (within noise):
```python
import random
from ab_eval import make_eval_set, run_strategy, compare

random.seed(7)
ev = make_eval_set(200)

def strat_A(filing): return "HIGH" if random.random() < 0.910 else "LOW"   # ~91%
def strat_B(filing): return "HIGH" if random.random() < 0.922 else "LOW"   # ~92.2%

a = run_strategy(strat_A, ev); b = run_strategy(strat_B, ev)
result = compare(a, b)
print("MARGINAL:", result)
assert result["verdict"] == "NO-SHIP", "should not ship a non-significant +1.2%"
```
Run it. **Expected:** `delta ≈ +0.012`, `significant: False`, `verdict: NO-SHIP`. The harness correctly refuses to ship a within-noise change.

### Step 4: Accept a clear winner (6 min)

Create `clear.py` — a strategy that's genuinely much better:
```python
import random
from ab_eval import make_eval_set, run_strategy, compare

random.seed(7)
ev = make_eval_set(200)
def strat_A(filing): return "HIGH" if random.random() < 0.80 else "LOW"   # 80%
def strat_B(filing): return "HIGH" if random.random() < 0.92 else "LOW"   # 92%

result = compare(run_strategy(strat_A, ev), run_strategy(strat_B, ev))
print("CLEAR:", result)
assert result["verdict"] == "SHIP", "should ship a significant +12%"
```
Run it. **Expected:** `delta ≈ +0.12`, `significant: True`, `verdict: SHIP`. A real, significant gain clears the bar.

## Deliverable
A `m29-lab/` folder containing:
- `ab_eval.py` — labeled eval set, variance-capturing strategy runner, significance-gated `compare()`
- `marginal.py` — a +1.2% change correctly NOT shipped (not significant)
- `clear.py` — a +12% change correctly shipped (significant)
- A short note: ship/no-ship is decided by the eval set + significance test, not by eyeballing

You now have reusable evaluation infrastructure: every future context change — a new prompt, a different k, an ordering, a compression scheme — gets measured against the same yardstick before it ships.

## Stretch Goals
- Add a cost dimension: have `compare()` also weigh the strategy's token cost (M03), so a tiny significant accuracy gain that doubles cost gets a "SHIP-IF-WORTH-IT" verdict.
- Guard against p-hacking: add a Bonferroni correction when comparing K variants at once, and show how the bar rises with K.
- Wire real strategies: make `strat_A`/`strat_B` actual context-assembly variants (e.g., rerank on/off from M09) calling Claude, and run the harness end-to-end.

## Connection to Next Module
You can now decide whether a change is a real improvement. M30 (Context Versioning) manages those changes over *time*: treating prompts and context strategies as versioned code, detecting regressions against the eval set on every release, and migrating safely — so the gains you proved here don't silently erode across releases.
