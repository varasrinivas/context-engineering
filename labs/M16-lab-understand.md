# M16 Lab: Understand It — Draw Your Model's U-Curve

## Objective
Run a needle-in-a-haystack positional probe on a real model: insert a known fact at every decile of a long context, record whether the model finds it, and plot the lost-in-the-middle U-curve for your own stack.

## Prerequisites
- Completed M16 module content
- Claude API access, Python 3.10+ with `anthropic`

## Setup (4 min)

Create `probe.py`:
```python
import anthropic
client = anthropic.Anthropic()

NEEDLE = ("DISQUALIFYING FACT: debtor BLUE RIDGE FARMS INC has an undischarged "
          "federal tax lien filed 2024-03 (IRS, $1.2M).")

# A long haystack of routine, similar-looking filler.
FILLER = [f"Filing 2024-FL-{20000+i:05d}: debtor ROUTINE CO {i}, 1 active lien, "
          f"secured party COMMUNITY BANK, status active, risk MEDIUM."
          for i in range(60)]

QUESTION = ("Does debtor BLUE RIDGE FARMS INC have any disqualifying lien "
            "(e.g., a federal tax lien)? Answer yes/no and name it.")
```

## Exercise (25 min)

### Step 1: Sweep the needle across positions

Add to `probe.py`:
```python
def found_at(decile):
    pos = int(len(FILLER) * decile / 100)
    docs = FILLER[:pos] + [NEEDLE] + FILLER[pos:]
    ctx = "\n".join(docs)
    resp = client.messages.create(model="claude-sonnet-4-6", max_tokens=80,
        messages=[{"role":"user","content": f"{ctx}\n\n{QUESTION}"}])
    text = resp.content[0].text.lower()
    return "tax lien" in text or "disqualif" in text

print(f"{'position %':>10}{'result':>10}")
for d in (0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100):
    # run each a few times to smooth noise
    hits = sum(found_at(d) for _ in range(3))
    print(f"{d:>9}%{hits}/3")
```

Run it: `python probe.py`

**What to observe:** hits should be high near 0% and 100%, dipping somewhere in the middle (often 40–70%). Your exact trough location and depth depend on the model and the haystack length.

### Step 2: Tabulate and plot the U-curve

| Needle position | Found (of 3) |
|-----------------|--------------|
| 0% | |
| 10% | |
| ... | |
| 50% | (likely the trough) |
| ... | |
| 100% | |

Sketch the curve (even ASCII). Mark the trough.

### Step 3: Amplify with length

Re-run with `FILLER` truncated to 15 entries, then expanded to 100. **Expected:** the 15-entry haystack has a shallow/absent trough; the 100-entry haystack has a deep, wide one. Length amplifies the effect — record the difference.

### Step 4: State your trust threshold

From your curves, answer: *"For a single critical fact, the longest context I'd trust this model with is ___ entries, because beyond that the middle trough drops below ___% recall."*

## Reflection Questions
1. Your model is fully capable of finding the needle (it does at the edges). So what, precisely, failed in the middle — and why isn't "use a smarter model" the fix?
2. Why does increasing the haystack length make a *fixed* needle harder to find? Connect this to M03's "long context isn't free."
3. Map your U-curve to the newspaper analogy — which positions are the lede, the kicker, and the skimmed middle columns?

## Key Insight
The lost-in-the-middle effect is measurable on your own stack, and it worsens with length — so "how long a context can I trust for a critical fact?" is an empirical question you must probe, not assume.
