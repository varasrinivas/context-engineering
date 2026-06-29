# M10 Lab: Understand It — Measure the Bloat

## Objective
Take a realistic verbose tool result, measure exactly how many of its tokens are *signal* (fields the task uses) vs. *bloat* (everything else), and specify the shaped structure that preserves the signal.

## Prerequisites
- Completed M10 module content
- The `ucc-sandbox/`, Claude API access (for token counting), Python 3.10+ with `anthropic`

## Setup (5 min)

Create `raw_history.py` — a verbose `get_debtor_history` result:
```python
import random
random.seed(7)

def make_filing(i):
    return {
      "filing_id": f"2024-FL-{10000+i:07d}",
      "type": random.choice(["UCC-1","UCC-3"]),
      "status": random.choice(["active","active","terminated"]),
      "secured_party": random.choice(["FIRST CAPITAL","MERIDIAN BANK","APEX LEASING"]),
      "filed": f"20{random.randint(19,24)}-0{random.randint(1,9)}-1{i%9}",
      # --- bloat the task never uses ---
      "collateral_blob": "ALL EQUIPMENT, INVENTORY, AND ACCOUNTS " * 8,
      "clerk_id": f"CLK-{random.randint(1000,9999)}",
      "page_image_url": f"https://sos.example/img/{i}.tiff",
      "raw_ocr_text": "lorem ipsum dolor sit amet " * 20,
      "checksum": "a1b2c3d4"*4, "ingest_ts": "2024-06-01T12:00:00Z",
      "source_system": "SOS-BULK-FEED-v3", "retry_count": 0,
    }

RAW = {"status":"ok","page":1,"per_page":100,"total":30,
       "results":[make_filing(i) for i in range(30)]}

USED_FIELDS = ("filing_id","type","status","secured_party","filed")
```

## Exercise (25 min)

### Step 1: Measure total token cost

Create `measure.py`:
```python
import anthropic, json
from raw_history import RAW, USED_FIELDS

client = anthropic.Anthropic()
def toks(obj):
    return client.messages.count_tokens(model="claude-sonnet-4-6",
        messages=[{"role":"user","content":json.dumps(obj)}]).input_tokens

total = toks(RAW)
# Project to ONLY the used fields to measure the signal
signal = {"results":[{k:r[k] for k in USED_FIELDS} for r in RAW["results"]]}
signal_toks = toks(signal)

print(f"RAW total:        {total:>6} tokens")
print(f"Signal (5 fields):{signal_toks:>6} tokens")
print(f"Bloat:            {total-signal_toks:>6} tokens  ({(total-signal_toks)/total:.0%})")
```

Run it. **Expected:** signal is a small fraction; bloat is ~85–92% of the payload.

### Step 2: Decompose where the bloat lives

Estimate tokens per bloat field (collateral_blob, raw_ocr_text, page_image_url, checksum…). Which single field dominates? (Usually `raw_ocr_text` / `collateral_blob`.)

| Field | Used by risk task? | Approx tokens (×30 rows) |
|-------|--------------------|--------------------------|
| filing_id, type, status, secured_party, filed | ✅ | (signal) |
| collateral_blob | ❌ | |
| raw_ocr_text | ❌ | |
| page_image_url, checksum, ingest_ts, ... | ❌ | |

### Step 3: Specify the target shape

Write the shaped structure you'll build in the Build lab, and estimate its token count:
```
{ "summary": "N active liens, M terminated, oldest YYYY",
  "filings": [ {filing_id, type, status, secured_party, filed} × top 5 ],
  "truncated": "+K older active" }
```
Estimate tokens and compute the reduction ratio vs. RAW.

## Reflection Questions
1. The `raw_ocr_text` field is *real data* about the filing — why is including it still "bloat" for the risk-scoring task specifically?
2. If a different task (e.g., collateral analysis) called the same tool, would the signal/bloat split change? What does that say about where shaping logic belongs?
3. Map to the analogy — which fields are the "full git log and every Slack thread" in the three-page email?

## Key Insight
"Bloat" is defined by the task, not the tool: most of a storage-shaped tool result is data the current decision never uses, so measuring signal-vs-bloat per task is the first step to reclaiming the window.
