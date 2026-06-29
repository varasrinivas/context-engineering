# M03 Lab: Understand It — Plot Your Own Quality × Quantity Curve

## Objective
Run one fixed UCC risk-scoring task while varying how much prior-filing context you include, measure accuracy and tokens at each setting, and locate the *knee* of your own quality × quantity curve — the point where extra tokens stop earning their place.

## Prerequisites
- Completed M03 module content
- The `ucc-sandbox/` directory (you'll reuse `data/filings.json` and the token counter from M01)
- Claude API access, Python 3.10+ with `anthropic`

## Setup (5 min)

1. Create the lab folder:
   ```bash
   cd ucc-sandbox && mkdir -p m03-lab && cd m03-lab
   ```
2. Make a small answer key — a fixed task with a known-correct answer so you can score accuracy. Create `key.json`:
   ```json
   {
     "target_filing": "2024-FL-0012345",
     "question": "Is this debtor at elevated lien risk? Answer EXACTLY 'HIGH', 'MEDIUM', or 'LOW'.",
     "correct_answer": "HIGH",
     "rationale": "3 active liens from different secured parties in 18 months = HIGH"
   }
   ```
3. Ensure `data/filings.json` has ~20+ filings for the target debtor (mostly noise, a few signal). If not, generate them with Claude (see M00 lab Step 1 pattern).

## Exercise (25 min)

### Step 1: Sweep the context size

Create `curve.py`:
```python
import anthropic, json
from pathlib import Path

client = anthropic.Anthropic()
key = json.loads(Path("key.json").read_text())
filings = json.loads(Path("../data/filings.json").read_text())

# The 3 most relevant (signal) filings should be first in this list;
# everything after index 3 is lower-relevance noise.
def context_for(n):
    chosen = filings[:n]
    return "\n".join(json.dumps(f) for f in chosen)

SETTINGS = [0, 1, 3, 8, 20, len(filings)]
print(f"{'filings':>8}{'tokens':>9}{'answer':>9}{'correct':>9}")
for n in SETTINGS:
    ctx = context_for(n)
    msg = f"Prior filings:\n{ctx}\n\n{key['question']}"
    tokens = client.messages.count_tokens(
        model="claude-sonnet-4-6",
        messages=[{"role": "user", "content": msg}],
    ).input_tokens
    resp = client.messages.create(
        model="claude-sonnet-4-6", max_tokens=10,
        messages=[{"role": "user", "content": msg}],
    )
    ans = resp.content[0].text.strip().upper()[:6]
    ok = "yes" if key["correct_answer"] in ans else "NO"
    print(f"{n:>8}{tokens:>9}{ans:>9}{ok:>9}")
```

Run it: `python curve.py`

**What to observe:** Accuracy should climb from 0 → 1 → 3 filings, then hold, then *degrade* as the 3 signal filings get buried among 20+ noise filings — all while tokens (and cost) keep rising.

**Expected output (illustrative):**
```
 filings   tokens   answer  correct
       0       95   MEDIUM       NO
       1      210   MEDIUM       NO
       3      540   HIGH        yes
       8     1980   HIGH        yes
      20     5100   MEDIUM       NO
      24     6300   LOW          NO
```

### Step 2: Locate the knee

From your table, mark:
- The **knee**: the smallest context that reaches peak accuracy (likely 3 filings).
- The **negative-return zone**: where accuracy drops while tokens keep climbing (likely ≥20).

### Step 3: Compute value-per-token

For two settings (the knee vs. the "thorough" max), compute a crude `accuracy_per_1k_tokens`. The knee should win decisively.

## Reflection Questions
1. Between the 3-filing and 24-filing settings, you paid ~12× the tokens. What did you get for it — and what does that say about "be thorough by adding more"?
2. Where exactly is the knee for *your* data, and how would you know it shifted if the debtor's filing pattern changed?
3. How does this map to the carry-on analogy — which filings were the "winter coat you didn't need"?

## Key Insight
Quality rises, plateaus, then falls as context grows — so the economic target is the knee of the curve (the fewest tokens that reach peak quality), never the most tokens the window can hold.
