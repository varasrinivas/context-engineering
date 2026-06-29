# M21 Lab: Understand It — Measure Malformed-Output Rate

## Objective
Run the same UCC risk task three ways — prompt-only, prompt + canonical example, and schema-enforced — and measure how the malformed-output rate falls as enforcement strengthens (and why even the strongest still needs validation).

## Prerequisites
- Completed M21 module content
- Claude API access, Python 3.10+ with `anthropic`

## Setup (4 min)

Create `cases.py` — varied filings, including a few that tempt the model into prose:
```python
FILINGS = [
  "DEBTOR: ACME LOGISTICS LLC. 3 active liens.",
  "DEBTOR: REDLINE FREIGHT. 0 liens, terminated 2023.",
  "DEBTOR: SUMMIT HOLDINGS. ambiguous — possibly related party, 2 liens. Explain your reasoning.",
  "DEBTOR: [REDACTED]. lien status unclear.",
  "DEBTOR: PACIFIC GROUP. 1 lien. Note: borderline case, justify the score.",
]
TARGET_KEYS = {"risk", "verified_lien_count", "flags"}
```

## Exercise (25 min)

### Step 1: Three strategies

Create `strategies.py`:
```python
import anthropic, json
client = anthropic.Anthropic()

SCHEMA = {"type":"object","properties":{
    "risk":{"type":"string","enum":["LOW","MEDIUM","HIGH"]},
    "verified_lien_count":{"type":"integer"},
    "flags":{"type":"array","items":{"type":"string"}}},
    "required":["risk","verified_lien_count","flags"],"additionalProperties":False}

def prompt_only(f):
    return client.messages.create(model="claude-sonnet-4-6", max_tokens=200,
        messages=[{"role":"user","content":
            f"Score lien risk. Return JSON with risk, verified_lien_count, flags.\n{f}"}]).content[0].text

def with_example(f):
    return client.messages.create(model="claude-sonnet-4-6", max_tokens=200,
        messages=[{"role":"user","content":
            'Return ONLY JSON like {"risk":"HIGH","verified_lien_count":3,"flags":[]}.\n'
            f"Score lien risk for:\n{f}"}]).content[0].text

def enforced(f):
    return client.messages.create(model="claude-sonnet-4-6", max_tokens=200,
        output_config={"format":{"type":"json_schema","schema":SCHEMA}},
        messages=[{"role":"user","content":f"Score lien risk for:\n{f}"}]).content[0].text
```

### Step 2: Measure the malformed rate

Create `measure.py`:
```python
import json
from cases import FILINGS, TARGET_KEYS
from strategies import prompt_only, with_example, enforced

def is_malformed(text):
    try:
        obj = json.loads(text.strip())
    except Exception:
        return True   # not even JSON (prose preamble, code fence, etc.)
    return set(obj.keys()) != TARGET_KEYS   # extra/missing keys

REPEATS = 6  # repeat to surface the rare failures
for name, fn in [("prompt_only", prompt_only), ("with_example", with_example), ("enforced", enforced)]:
    bad = sum(is_malformed(fn(f)) for f in FILINGS for _ in range(REPEATS))
    total = len(FILINGS) * REPEATS
    print(f"{name:<14} malformed: {bad}/{total}  ({bad/total:.0%})")
```

Run it: `python measure.py`

**Expected pattern:**
```
prompt_only    malformed: 5/30   (17%)   <- prose preambles, extra keys on the "explain" cases
with_example   malformed: 2/30   (7%)    <- better, the example anchors the shape
enforced       malformed: 0/30   (0%)    <- schema constrains the shape at generation
```

### Step 3: Read the curve

- The malformed rate drops sharply as enforcement strengthens: ask → example → schema.
- The filings that say "explain your reasoning" / "justify the score" are the ones that break prompt-only — the model obliges with prose, breaking the contract.
- Note: even `enforced` at 0% here is *probabilistic* across enough volume — which is exactly why the Build lab adds a validation-retry safety net on top.

## Reflection Questions
1. Why do the "explain your reasoning" filings specifically break the prompt-only strategy? What does that say about mixing instruction and data in the input?
2. Enforced enforcement hit 0% in this small run. Why is "0% in 30 calls" not the same as "guaranteed," and what must you still add for production?
3. Map the three strategies to the casting analogy — which is "ask the metal nicely to hold its shape," and which is "pour it into a mold"?

## Key Insight
Output reliability is a spectrum you buy with enforcement strength — prompt-only leaves a daily failure rate at scale, while schema enforcement constrains the shape at generation — but because generation is still probabilistic, even strong enforcement needs validation as a safety net.
