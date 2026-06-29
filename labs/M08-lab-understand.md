# M08 Lab: Understand It — Trace a RAG Failure to Its Stage

## Objective
Take a UCC RAG setup where retrieval recall is high but answers are poor, instrument all four assembly stages, and prove the failure is downstream of retrieval — localizing it to ranking, formatting, or placement.

## Prerequisites
- Completed M08 module content
- The `ucc-sandbox/`, Claude API access, Python 3.10+ with `anthropic`

## Setup (5 min)

Create `mini_rag.py` — a deliberately flawed RAG over a few filings:
```python
import anthropic, json
client = anthropic.Anthropic()

# 8 filings; only #2 and #6 pledge EQUIPMENT collateral (the signal).
DOCS = [
  {"id":"F1","debtor":"BLUE RIDGE FARMS INC","collateral":"crops and livestock"},
  {"id":"F2","debtor":"ACME LOGISTICS LLC","collateral":"all equipment and accounts"},
  {"id":"F3","debtor":"SUMMIT STEEL CO","collateral":"raw inventory"},
  {"id":"F4","debtor":"HARBOR POINT MARINA","collateral":"vessels and docks"},
  {"id":"F5","debtor":"CEDAR VALLEY DAIRY","collateral":"milk receivables"},
  {"id":"F6","debtor":"IRONCLAD SECURITY INC","collateral":"equipment and vehicles"},
  {"id":"F7","debtor":"MERIDIAN TRANSPORT","collateral":"accounts receivable"},
  {"id":"F8","debtor":"PACIFIC HOLDINGS","collateral":"general intangibles"},
]

def retrieve(query, k=4):
    # Crude keyword scorer stands in for an embedder (recall is high here).
    scored = sorted(DOCS, key=lambda d: -sum(w in d["collateral"] for w in query.split()))
    return scored[:k]

def assemble_BAD(chunks):
    # raw dump, no labels, signal buried in the MIDDLE of the block
    return "\n".join(json.dumps(c) for c in chunks)

QUERY = "which debtors pledged equipment as collateral"
chunks = retrieve(QUERY)
ctx = assemble_BAD(chunks)
resp = client.messages.create(model="claude-sonnet-4-6", max_tokens=200,
    messages=[{"role":"user","content":f"{ctx}\n\nQ: {QUERY}\nList debtor names only."}])
print("RETRIEVED:", [c["id"] for c in chunks])
print("ANSWER:", resp.content[0].text.strip())
```

## Exercise (25 min)

### Step 1: Confirm retrieval is NOT the problem

Run `mini_rag.py`. Check the `RETRIEVED:` line — F2 and F6 (the equipment filings) should be present. **Retrieval recall is fine.** Yet the answer may miss one of them or stay vague.

### Step 2: Instrument each stage

Add logging that captures, per query, the four-stage trace:

| Stage | What to log | Question to ask |
|-------|-------------|-----------------|
| RETRIEVE | which IDs came back | Is the right chunk present? (yes) |
| RANK | their order | Is the signal chunk near the top or buried? |
| FORMAT | the exact string sent | Is it labeled/attributable, or a raw blob? |
| PLACE | index of signal chunk in the block | Is it in the middle (lost zone)? |

Run three queries (equipment, accounts, vessels) and fill the trace for each.

### Step 3: Localize and fix one stage at a time

Toggle one improvement at a time and re-test:
- **FORMAT fix:** replace `assemble_BAD` with labeled evidence (`[source: F2 | collateral] ...`).
- **PLACE fix:** move the highest-ranked chunk to the *end* of the block (recency).

Record which single fix recovers the correct answer. (Usually formatting + placement together; sometimes one suffices.)

**Expected finding:** with identical retrieval, labeling the chunks and/or moving the signal out of the middle flips vague/incomplete answers into correct, complete ones.

## Reflection Questions
1. Recall was ~100% in this toy setup, yet the baseline failed. Which of the four stages was actually broken, and how did your trace prove it?
2. If you had only looked at retrieval metrics (recall@k), what wrong conclusion would you have drawn?
3. Map each stage to the lawyer's-brief analogy — which assistant task did the baseline skip?

## Key Insight
High retrieval recall guarantees the answer is *in the window*, not that the model can *use* it — RAG failures must be traced through ranking, formatting, and placement, because that's where usable context is won or lost.
