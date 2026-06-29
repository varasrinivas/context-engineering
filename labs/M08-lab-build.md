# M08 Lab: Build It with AI — A Section-Aware Chunker + Formatter

## Objective
With Claude, build a UCC chunker that splits filings by logical section into self-contained, provenance-tagged chunks, plus a formatter that turns retrieved chunks into labeled evidence — then prove this assembly answers correctly where naive fixed-size chunking fails, on *identical* retrieval.

## Prerequisites
- Completed the M08 Understand It lab
- The `ucc-sandbox/` (reuse `data/filings.json`), Claude API access, Python 3.10+ with `anthropic`

## The Build (40 min)

### Step 1: Build both chunkers with Claude (12 min)

Claude prompt to use:
```
"Write chunkers.py with two functions for UCC filings (each filing is a dict with
keys: filing_id, type, debtor, secured_party, collateral, status):

1. naive_chunks(filing, size=120): json.dumps the filing, then slice into fixed
   size-character chunks. Return a list of {'text': ...} (no provenance).

2. section_chunks(filing): emit ONE chunk per logical section (debtor,
   secured_party, collateral, status). Each chunk is a dict:
   {'filing_id': ..., 'section': <name>, 'text': <that field>}.

Also write format_evidence(chunk) that returns a labeled string:
'[source: <filing_id> | section: <section>]\\n<text>'. For naive chunks (no
provenance), it should return the raw text with a '[source: unknown]' tag so the
contrast is visible. Return only the code."
```

Save as `chunkers.py`.

### Step 2: Wire a tiny retriever over each chunk set (10 min)

Create `assemble.py`:
```python
import anthropic, json
from pathlib import Path
from chunkers import naive_chunks, section_chunks, format_evidence

client = anthropic.Anthropic()
filings = json.loads(Path("../data/filings.json").read_text())

def build_index(chunker):
    idx = []
    for f in filings:
        idx.extend(chunker(f))
    return idx

def retrieve(index, query, k=5):
    # keyword overlap stands in for an embedder so BOTH paths get equal recall
    q = set(query.lower().split())
    scored = sorted(index, key=lambda c: -len(q & set(json.dumps(c).lower().split())))
    return scored[:k]

def answer(index, query, label):
    chunks = retrieve(index, query)
    evidence = "\n\n".join(format_evidence(c) for c in chunks)
    resp = client.messages.create(model="claude-sonnet-4-6", max_tokens=250,
        messages=[{"role":"user","content":
            f"Evidence:\n{evidence}\n\nQ: {query}\n"
            "Answer using ONLY the evidence. Cite the source filing_id for each debtor."}])
    print(f"\n=== {label} ===\n{resp.content[0].text.strip()}")

QUERY = "which debtors pledged equipment as collateral? cite sources"
answer(build_index(naive_chunks),   QUERY, "NAIVE fixed-size chunks")
answer(build_index(section_chunks), QUERY, "SECTION-AWARE + formatted")
```

Run it: `python assemble.py`

**Expected behavior:**
- **NAIVE**: cannot cite sources (chunks are unattributable fragments), may miss debtors split across chunk boundaries, vague answer.
- **SECTION-AWARE**: returns the correct debtors WITH `filing_id` citations, because each chunk is self-contained and provenance-tagged.

### Step 3: Verify citability and completeness (10 min)

Score both outputs on:
1. **Correctness** — did it find all equipment-collateral debtors?
2. **Citability** — did every debtor come with a `filing_id`? (Only possible with provenance tags.)
3. **Token cost** — count tokens of each evidence block; section-aware is usually *leaner* too, because it trims to relevant sections.

### Step 4: Add a relevance trim (8 min)

Ask Claude to extend `section_chunks` retrieval to keep only the `collateral` and `debtor` sections for collateral queries (drop `status`/`secured_party` noise):
```
"Add a section filter so that for a collateral query, retrieve() returns only
chunks whose section is in {'collateral','debtor'}. Show the token savings."
```
Confirm the answer stays correct while the evidence block shrinks — assembly quality *and* economics improving together.

## Deliverable
A `m08-lab/` folder containing:
- `chunkers.py` — naive vs. section-aware chunkers + `format_evidence`
- `assemble.py` — identical retrieval over both chunk sets, with a citing prompt
- A short result note: section-aware+formatted answered correctly *with citations* where naive failed, at equal or lower token cost

You've now built the FORMAT and (implicitly) RANK/PLACE stages that turn raw retrieval into a usable brief.

## Stretch Goals
- Add a `rank()` step that puts the single most relevant chunk LAST (recency) and measure the lift.
- Introduce one stale/conflicting filing and observe how provenance tags let the model (and you) spot the conflict — a preview of M11 fusion.
- Plug the section chunker into your M03 budget allocator so the retrieval layer respects its token cap.

## Connection to Next Module
You assembled retrieved context well — but you used a crude keyword retriever. M09 (Context Retrieval Strategies) opens up the RETRIEVE and RANK stages properly: semantic vs. keyword vs. hybrid search, and cross-encoder reranking — choosing the right retrieval method for the query so the candidates you assemble are the right ones to begin with.
