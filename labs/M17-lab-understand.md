# M17 Lab: Understand It — Reorder and Re-measure

## Objective
Take a fixed set of UCC filings and a cross-entity question, assemble it three different ways, and prove that ordering alone — same contents — changes whether the model finds the related-party signal.

## Prerequisites
- Completed M17 module content
- Claude API access, Python 3.10+ with `anthropic`

## Setup (4 min)

Create `filings.py`:
```python
# 9 filings across 3 debtors. Cross-entity signal: three share '1450 NW 107 AVE'.
FILINGS = [
  {"debtor":"ACME LOGISTICS",  "addr":"1450 NW 107 AVE", "id":"FL-0012345"},
  {"debtor":"ACME LOGISTICS",  "addr":"1450 NW 107 AVE", "id":"FL-0012346"},
  {"debtor":"ACME LOGISTICS",  "addr":"200 PALM CT",     "id":"FL-0012347"},
  {"debtor":"SUMMIT HOLDINGS", "addr":"55 BAY RD",       "id":"FL-0019001"},
  {"debtor":"SUMMIT HOLDINGS", "addr":"1450 NW 107 AVE", "id":"FL-0019002"},  # shared!
  {"debtor":"SUMMIT HOLDINGS", "addr":"55 BAY RD",       "id":"FL-0019003"},
  {"debtor":"REDLINE FREIGHT", "addr":"900 PORT BLVD",   "id":"FL-0022100"},
  {"debtor":"REDLINE FREIGHT", "addr":"1450 NW 107 AVE", "id":"FL-0022101"},  # shared!
  {"debtor":"REDLINE FREIGHT", "addr":"900 PORT BLVD",   "id":"FL-0022102"},
]
QUESTION = ("Are any of these debtors likely related parties? If so, which, and "
            "what's the evidence? Be specific.")
```

## Exercise (25 min)

### Step 1: Three orderings, same contents

Create `reorder.py`:
```python
import anthropic
from filings import FILINGS, QUESTION
client = anthropic.Anthropic()

def fmt(rows): return "\n".join(f"[{r['debtor']}] {r['id']} @ {r['addr']}" for r in rows)

orderings = {
  "arrival":     FILINGS,                                            # as-is
  "group":       sorted(FILINGS, key=lambda r: r["debtor"]),         # by debtor
  "interleave":  sorted(FILINGS, key=lambda r: r["addr"]),           # by address
}

for name, rows in orderings.items():
    ctx = fmt(rows)
    resp = client.messages.create(model="claude-sonnet-4-6", max_tokens=200,
        messages=[{"role":"user","content": f"{ctx}\n\n{QUESTION}"}])
    print(f"\n========== {name.upper()} ==========\n{resp.content[0].text.strip()}")
```

Run it: `python reorder.py`

**What to observe:** the **interleave** ordering (sorted by address) places the three `1450 NW 107 AVE` filings adjacent, making the shared-address relationship jump out — the model should name ACME, SUMMIT, and REDLINE as related. **Group** and **arrival** scatter those three filings, and the model is more likely to miss or under-state the link.

### Step 2: Tabulate

| Ordering | Found the related-party link? | Named all 3 debtors? | Why |
|----------|-------------------------------|----------------------|-----|
| arrival | | | signal scattered |
| group (by debtor) | | | signal scattered across blocks |
| interleave (by address) | | | shared-address filings adjacent |

### Step 3: Prove it's the order, not the model

Run each ordering 3×. The interleave version should consistently surface the relationship; the others should be inconsistent or miss it. Same 9 filings every time — only the sequence changed.

## Reflection Questions
1. Group-by-debtor is the "tidiest" structure. Why does the tidiest structure *lose* here?
2. If the question had been "summarize ACME's filing history" (per-entity), which ordering would win, and why does the best order flip with the question?
3. Map the three orderings to the lawyer analogy — which one is "presenting the evidence in the order that proves your case"?

## Key Insight
Order is a free, independent lever: the same filings sequenced to place a cross-entity signal adjacent can reveal a relationship that the tidiest grouping hides — so the right ordering is the one that matches the question's structure.
