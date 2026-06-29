# M09 Lab: Build It with AI — A Hybrid Retriever with Reranking

## Objective
With Claude, build a hybrid retriever (keyword + semantic fused by reciprocal rank fusion) over UCC filings, then add a rerank pass that reorders the fused candidates — and prove the rerank rescues a relevant chunk that first-stage retrieval left buried.

## Prerequisites
- Completed the M09 Understand It lab (you have `corpus.py`, `retrievers.py`)
- Claude API access, Python 3.10+ with `anthropic`

## The Build (40 min)

### Step 1: Assemble the hybrid retriever (8 min)

Reuse `retrievers.py` from the Understand lab (`keyword_rank`, `semantic_rank`, `rrf`, `hybrid`). Confirm `hybrid(query, DOCS)` returns a fused ranking for both an exact-ID and a conceptual query.

### Step 2: Add an LLM-scored reranker with Claude (14 min)

A true cross-encoder needs a model; here you'll approximate one with an LLM relevance score — the same *idea* (judge each candidate jointly with the query).

Claude prompt to use:
```
"Write rerank.py with rerank(query, candidates, k=3) for a UCC retriever. For each
candidate dict (keys: id, text), ask Claude (model claude-sonnet-4-6) to rate how
well the text answers the query on a 0-10 integer scale, with a strict instruction
to return ONLY the number. Collect scores, sort candidates descending by score,
and return the top-k. Batch efficiently if possible. Read ANTHROPIC_API_KEY from
the environment. Return only the code."
```

Save as `rerank.py`.

### Step 3: Stage a buried gold chunk and rescue it (12 min)

Create `rescue.py` — deliberately make first-stage retrieval bury the right answer among high-similarity decoys:
```python
from corpus import DOCS
from retrievers import hybrid
from rerank import rerank

# A conceptual query whose gold answer uses different words than the query.
QUERY = "which debtor pledged equipment it does not yet own?"
GOLD  = "2024-NY-0008812"   # 'machinery now owned or hereafter acquired'

# Add near-miss decoys that score high on first-stage overlap but are wrong.
DECOYS = [
  {"id":"D1","text":"debtor owns equipment outright, no future interest"},
  {"id":"D2","text":"equipment lease, not a pledge, fully owned"},
  {"id":"D3","text":"pledged equipment currently owned and operated"},
]
candidates = hybrid(QUERY, DOCS + DECOYS)

first_stage_rank = [c["id"] for c in candidates].index(GOLD) + 1
print(f"GOLD first-stage rank: {first_stage_rank}")   # likely buried (e.g. 5-8)

reranked = rerank(QUERY, candidates, k=3)
reranked_rank = ([c["id"] for c in reranked] + ["-"]).index(GOLD) + 1 if GOLD in [c["id"] for c in reranked] else None
print("RERANKED top-3:", [c["id"] for c in reranked])
print(f"GOLD reranked rank: {reranked_rank}")
```

Run it: `python rescue.py`

**Expected behavior:**
- First-stage (hybrid) buries GOLD around rank 5–8 because the decoys share the word "equipment/pledged."
- After rerank, GOLD rises to rank 1 — the cross-encoder/LLM understands "does not yet own" ≈ "hereafter acquired," which the decoys explicitly contradict.

### Step 4: Measure the lift and the cost (6 min)

Tabulate over 4–5 conceptual queries:

| Query | GOLD first-stage rank | GOLD reranked rank | rerank API calls |
|-------|----------------------|--------------------|------------------|
| ... | 7 | 1 | N candidates |

Note the tradeoff (M03): rerank adds latency/cost proportional to N candidates, but you only rerank a small top-N — the cheap-win sweet spot.

## Deliverable
A `m09-lab/` folder containing:
- `retrievers.py` — keyword + semantic + RRF hybrid (from Understand lab)
- `rerank.py` — an LLM/cross-encoder-style relevance reranker
- `rescue.py` — a demonstration that reranking moves a buried gold chunk to rank 1
- A short lift table showing first-stage vs. reranked rank across several queries

You now have the full RETRIEVE → RANK pipeline from M08, properly built: hybrid candidates plus a referee that fixes the order before context enters the window.

## Stretch Goals
- Cap rerank to the top-20 first-stage candidates and show quality holds while cost drops (recall-vs-rerank budget tuning).
- Add a confidence gate: if the top reranked score is below a threshold, return "insufficient evidence" instead of a weak answer (a preview of M11/guardrails).
- Feed the reranked top-k into your M08 formatter so the final window context is both well-ranked AND well-formatted.

## Connection to Next Module
You've mastered retrieving and ranking *documents*. But not all dynamic context comes from a document store — much of it comes from **tools** (APIs, databases, calculators). M10 (Tool Results as Context) tackles the other major dynamic source: how to shape what a tool returns so its output is usable context instead of a raw, bloated dump.
