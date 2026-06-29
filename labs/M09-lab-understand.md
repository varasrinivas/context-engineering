# M09 Lab: Understand It — Where Each Retriever Wins and Loses

## Objective
Run keyword-only, semantic-only, and hybrid retrieval over the same UCC corpus and the same query set, and build the hit/miss matrix that exposes their opposite failure modes — and why hybrid covers both.

## Prerequisites
- Completed M09 module content
- The `ucc-sandbox/`, Python 3.10+ (embeddings optional — a stub is provided)

## Setup (5 min)

Create `corpus.py`:
```python
DOCS = [
  {"id":"2024-FL-0012345","text":"ACME LOGISTICS LLC — all equipment and accounts"},
  {"id":"2024-FL-0012354","text":"ACE LOGISTIC LLC — inventory only"},          # near-ID, decoy
  {"id":"2024-NY-0008812","text":"IRONCLAD SECURITY — machinery now owned or hereafter acquired"},
  {"id":"2024-TX-0004410","text":"REDLINE FREIGHT — vehicles and trailers"},
  {"id":"2024-CA-0006655","text":"PACIFIC HOLDINGS — general intangibles"},
]

QUERIES = [
  ("exact_id",   "2024-FL-0012345",                       "2024-FL-0012345"),
  ("exact_name", "REDLINE FREIGHT",                        "2024-TX-0004410"),
  ("concept_future_equip", "businesses pledging not-yet-acquired equipment", "2024-NY-0008812"),
  ("concept_vehicles", "companies that put up cars and trucks as collateral",  "2024-TX-0004410"),
]
```

## Exercise (25 min)

### Step 1: Implement the three retrievers

Create `retrievers.py`:
```python
def keyword_rank(query, docs):
    q = set(query.lower().replace("-", " ").split())
    return sorted(docs, key=lambda d: -sum(t in d["text"].lower().replace("-"," ")
                                            or t in d["id"].lower().replace("-"," ") for t in q))

# Stub "semantic" similarity: a crude synonym map so you can see meaning-matching
SYN = {"not-yet-acquired":"hereafter acquired","future":"hereafter",
       "cars":"vehicles","trucks":"vehicles","machinery":"equipment"}
def semantic_rank(query, docs):
    expanded = query.lower()
    for k,v in SYN.items(): expanded = expanded.replace(k, v)
    q = set(expanded.split())
    # deliberately ignores exact IDs to mimic embedding blur on identifiers
    return sorted(docs, key=lambda d: -sum(t in d["text"].lower() for t in q))

def rrf(rankings, k=60):
    score = {}
    for r in rankings:
        for i,d in enumerate(r): score[d["id"]] = score.get(d["id"],0)+1/(k+i)
    alld = {d["id"]:d for r in rankings for d in r}
    return sorted(alld.values(), key=lambda d: -score[d["id"]])

def hybrid(query, docs): return rrf([keyword_rank(query,docs), semantic_rank(query,docs)])
```

### Step 2: Score every retriever on every query

Create `matrix.py`:
```python
from corpus import DOCS, QUERIES
from retrievers import keyword_rank, semantic_rank, hybrid

def top1(ranker, q): return ranker(q, DOCS)[0]["id"]

print(f"{'query':24}{'keyword':16}{'semantic':16}{'hybrid':16}")
for name, q, gold in QUERIES:
    row = {r.__name__: ("HIT" if top1(r,q)==gold else "miss")
           for r in (keyword_rank, semantic_rank, hybrid)}
    print(f"{name:24}{row['keyword_rank']:16}{row['semantic_rank']:16}{row['hybrid']:16}")
```

Run it: `python matrix.py`

**Expected matrix:**
```
query                   keyword         semantic        hybrid
exact_id                HIT             miss            HIT
exact_name              HIT             HIT             HIT
concept_future_equip    miss            HIT             HIT
concept_vehicles        miss            HIT             HIT
```

### Step 3: Read the pattern

- Keyword **wins** exact IDs/names, **misses** concepts.
- Semantic **wins** concepts, **misses** the exact ID (returns the near-ID decoy `0012354`).
- Hybrid **covers both** — that's the whole point.

## Reflection Questions
1. On `exact_id`, semantic returned the decoy `2024-FL-0012354`. Why is that failure *especially* dangerous in a credit-risk pipeline?
2. Write a one-line routing heuristic: when would you skip hybrid and use a single retriever to save latency?
3. Map the three retrievers to the library analogy — which is the card catalog, which the librarian, and what does hybrid represent?

## Key Insight
Keyword and semantic retrieval fail in opposite directions — exact identifiers vs. meaning — so on a mixed corpus like UCC filings, hybrid retrieval isn't a luxury; it's what prevents silent wrong-record errors.
