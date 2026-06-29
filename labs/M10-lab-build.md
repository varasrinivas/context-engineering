# M10 Lab: Build It with AI — A Tool-Result Shaper

## Objective
With Claude, build a `shape_history()` function that turns a verbose debtor-history tool result into compact, signal-preserving context — then prove the risk model makes the same (or better) decision at a fraction of the tokens, and that failures are shaped cleanly too.

## Prerequisites
- Completed the M10 Understand It lab (you have `raw_history.py` and your bloat measurement)
- Claude API access, Python 3.10+ with `anthropic`

## The Build (40 min)

### Step 1: Define the shape contract (5 min)

Write down the exact output structure the shaper must always produce — a predictable contract downstream code can rely on:
```python
# shape contract:
# {
#   "summary": str,                 # one-line rollup, always present
#   "filings": [ {filing_id, type, status, secured_party, filed} ],  # <= top N
#   "truncated": str | None,        # "+K older active" or None
#   "error": str | None             # structured error, None on success
# }
```

### Step 2: Build the shaper with Claude (14 min)

Claude prompt to use:
```
"Write shape_history(raw, keep_status=('active',), top=5) in Python. Input is a
verbose tool result: {'status','total','results':[ {filing_id,type,status,
secured_party,filed, ...many unused fields} ]}. It must return EXACTLY this shape:
{summary:str, filings:list, truncated:str|None, error:str|None}.

Behavior:
- Project each kept filing to ONLY: filing_id, type, status, secured_party, filed.
- Filter to filings whose status is in keep_status; sort by 'filed' descending.
- Keep top N; if more remain, set truncated='+K older active'.
- summary = '<A> active liens, <T> terminated, oldest <YYYY>' computed over ALL rows.
- EMPTY case (no results): summary='no prior filings found', filings=[], error=None.
- ERROR case (raw['status'] != 'ok'): filings=[], error='tool error: <status>',
  summary='history unavailable'. Never raise; always return the contract.
Return only the code."
```

Save as `shaper.py`.

### Step 3: Prove the decision is preserved (12 min)

Create `decision_test.py` — run the risk model on RAW vs. SHAPED and compare:
```python
import anthropic, json
from raw_history import RAW
from shaper import shape_history

client = anthropic.Anthropic()
RULES = ("You are a UCC risk analyst. Given debtor history, return JSON "
         '{"risk":"LOW|MEDIUM|HIGH","active_liens":int}. '
         "More active liens from distinct secured parties = higher risk.")

def decide(history_obj, label):
    payload = json.dumps(history_obj)
    toks = client.messages.count_tokens(model="claude-sonnet-4-6",
        messages=[{"role":"user","content":payload}]).input_tokens
    resp = client.messages.create(model="claude-sonnet-4-6", max_tokens=120,
        system=RULES, messages=[{"role":"user","content":payload}])
    print(f"\n=== {label} ({toks} tokens) ===\n{resp.content[0].text.strip()}")

decide(RAW, "RAW dump")
decide(shape_history(RAW), "SHAPED")
```

Run it. **Expected:** identical risk/active-lien decision, but SHAPED uses a small fraction of the tokens. Record the ratio (ties back to your M10 Understand measurement and M03 economics).

### Step 4: Shape the failures (9 min)

Confirm the two failure modes are clean, not crashes:
```python
from shaper import shape_history
print(shape_history({"status":"ok","total":0,"results":[]}))      # empty
print(shape_history({"status":"rate_limited","results":[]}))      # error
```
**Expected:**
```
{'summary': 'no prior filings found', 'filings': [], 'truncated': None, 'error': None}
{'summary': 'history unavailable', 'filings': [], 'truncated': None, 'error': 'tool error: rate_limited'}
```
Then feed the error result to the risk model and confirm it responds sensibly ("history unavailable — insufficient data") instead of hallucinating from a stack trace.

## Deliverable
A `m10-lab/` folder containing:
- `shaper.py` — `shape_history()` implementing the shape contract (project/filter/summarize/truncate + empty/error handling)
- `decision_test.py` — RAW vs. SHAPED showing identical decisions at a fraction of the tokens
- A short note recording: the token reduction ratio and confirmation that empty/error cases produce clean structured context

You now own the layer between the tool and the window — and you can prove shaping preserves the signal while reclaiming the budget.

## Stretch Goals
- Add a `fields_for(task)` map so the shaper projects different fields for different tasks (risk vs. collateral analysis) — shaping logic that adapts to the consumer.
- Make `summary` itself an LLM-generated one-liner for very large histories, and compare cost vs. the deterministic rollup (M18 preview: extractive vs. abstractive).
- Wire the shaper output into your M03 budget allocator as the `tool` layer, capped — so even shaped results respect the budget.

## Connection to Next Module
You can now shape a *single* dynamic source well — retrieval (M08-M09) and tools (M10). But real systems assemble *several* sources at once, and they sometimes disagree. M11 (Multi-Source Context Fusion) is about combining retrieved documents, tool results, and memory into one coherent context — deduping, resolving conflicts, and ordering by priority and freshness.
