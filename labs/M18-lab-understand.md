# M18 Lab: Understand It — Measure Ratio vs. Fidelity

## Objective
Compress the same debtor history three ways — prune-only, extractive, abstractive — and measure each technique's token-reduction ratio *and* its fidelity (did the exact active-lien identifiers survive?), seeing the core tradeoff with your own eyes.

## Prerequisites
- Completed M18 module content
- Claude API access (for the abstractive step + token counts), Python 3.10+ with `anthropic`

## Setup (4 min)

Create `history.py`:
```python
import random
random.seed(11)

def mk(i):
    active = i in (2, 11, 27)   # only 3 active liens — the load-bearing facts
    return {
      "filing_id": f"2024-FL-{12000+i:07d}",
      "secured_party": random.choice(["FIRST CAPITAL","MERIDIAN BANK","APEX LEASING"]),
      "filed": f"20{random.randint(19,24)}-0{random.randint(1,9)}-15",
      "status": "active" if active else "terminated",
      "collateral": "all equipment, inventory, and accounts " * 3,
    }

HISTORY = [mk(i) for i in range(30)]
ACTIVE_IDS = [f["filing_id"] for f in HISTORY if f["status"]=="active"]
print("Active lien IDs that MUST survive:", ACTIVE_IDS)
```

## Exercise (25 min)

### Step 1: Implement the three compressors

Create `compressors.py`:
```python
import anthropic, json
client = anthropic.Anthropic()

def prune_only(history):
    return json.dumps([f for f in history if f["status"]=="active"])

def extractive(history):
    active = [f for f in history if f["status"]=="active"]
    return "\n".join(f"{f['filing_id']} | {f['secured_party']} | {f['filed']}" for f in active)

def abstractive(history):
    payload = json.dumps(history)
    resp = client.messages.create(model="claude-sonnet-4-6", max_tokens=200,
        messages=[{"role":"user","content":
            "Summarize this debtor's filing history in under 80 words, "
            f"noting active liens:\n{payload}"}])
    return resp.content[0].text.strip()
```

### Step 2: Measure ratio and fidelity

Create `measure.py`:
```python
import anthropic, json
from history import HISTORY, ACTIVE_IDS
from compressors import prune_only, extractive, abstractive
client = anthropic.Anthropic()

def toks(s): return client.messages.count_tokens(model="claude-sonnet-4-6",
    messages=[{"role":"user","content":s}]).input_tokens

full = json.dumps(HISTORY); base = toks(full)
print(f"{'technique':<12}{'tokens':>8}{'ratio':>8}{'IDs kept':>10}")
for name, fn in [("prune", prune_only), ("extract", extractive), ("abstract", abstractive)]:
    out = fn(HISTORY); t = toks(out)
    kept = sum(i in out for i in ACTIVE_IDS)
    print(f"{name:<12}{t:>8}{base/t:>7.1f}x{kept:>8}/{len(ACTIVE_IDS)}")
```

Run it: `python measure.py`

**Expected (illustrative):**
```
technique     tokens   ratio   IDs kept
prune           520    2.3x       3/3
extract          90   13.2x       3/3
abstract         70   17.0x       2/3   <-- lost or rewrote an ID!
```

### Step 3: Inspect the abstraction's failure

Print the abstractive output and find what it did to the identifiers — a rewritten digit, two liens merged, or an ID dropped entirely. This is the fidelity cost of the highest compression ratio.

### Step 4: Tabulate the tradeoff

| Technique | Ratio | Fidelity (IDs kept) | Verdict |
|-----------|-------|---------------------|---------|
| prune | low | perfect | safe, but limited |
| extract | high | perfect | faithful, bounded |
| abstract | highest | **imperfect** | powerful, lossy |

## Reflection Questions
1. Extraction beat abstraction on *both* fidelity and (often) was close on ratio here. So why does abstraction still earn a place in a real pipeline?
2. The abstractive step lost an ID. In a credit-risk decision, what is the concrete consequence of that single corrupted identifier?
3. Map the three techniques to the carry-on analogy — which is "pick the outfits," which is "the versatile jacket," which is "skip the winter coat"?

## Key Insight
Higher compression ratios come at the cost of fidelity — abstraction shrinks the most but is the only one that corrupts exact identifiers — so the technique must be chosen per content type, never one-size-fits-all.
