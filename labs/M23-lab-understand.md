# M23 Lab: Understand It — Find the Cross-Tenant Leak

## Objective
Run a multi-tenant UCC retrieval setup with a shared, unfiltered index, watch one tenant's query return another tenant's private filings, and trace which shared components carry the leak.

## Prerequisites
- Completed M23 module content
- Python 3.10+ (no API calls required)

## Setup (3 min)

Create `multitenant.py` — a leaky shared setup serving two competing lenders:
```python
# Shared retrieval index with NO tenant filter. Each doc has a tenant_id field
# that the buggy retriever ignores.
INDEX = [
  {"tenant_id":"lenderA", "text":"ACME LLC — HIGH risk, 3 active FL liens (PRIVATE)"},
  {"tenant_id":"lenderA", "text":"BLUEMARK CORP — MEDIUM risk, FL (PRIVATE)"},
  {"tenant_id":"lenderB", "text":"REDLINE LLC — HIGH risk, 2 active FL liens"},
]

# Shared memory keyed by USER only (not tenant) — another leak source.
MEMORY = { "analyst_dana": {"last_high_risk":"ACME LLC"} }   # belongs to lenderA

def buggy_retrieve(query, k=5):
    # BUG: no tenant_id filter — returns ANY tenant's matching docs.
    return [d for d in INDEX if query.lower() in d["text"].lower()][:k]
```

## Exercise (25 min)

### Step 1: Watch the leak

Create `leak.py`:
```python
from multitenant import buggy_retrieve, MEMORY

# Lender B (a competitor of A) runs a broad query.
results = buggy_retrieve("high risk FL")
print("Lender B's query returned:")
for r in results:
    flag = "  <-- LEAK (belongs to " + r["tenant_id"] + ")" if r["tenant_id"]!="lenderB" else ""
    print(f"  [{r['tenant_id']}] {r['text']}{flag}")
```

Run it: `python leak.py`

**Expected:** lender B's results include `ACME LLC ... (PRIVATE)` and `BLUEMARK CORP ... (PRIVATE)` — **both belong to lender A**. A competitor just saw A's private portfolio.

### Step 2: Map every leak path

| Component | Tenant-scoped? | Leaks? | Fix |
|-----------|----------------|--------|-----|
| retrieval index | no (filter ignored) | **yes** | mandatory `tenant_id` filter on every `retrieve` |
| memory (keyed by user only) | no | **yes** — `analyst_dana` works for lenderA; if shared, B sees A's `last_high_risk` | key memory by `(tenant_id, user, key)` |
| prompt cache (M19) | depends | **yes if** prefix/key is shared across tenants | include `tenant_id` in the cache key |
| audit log (M22) | should be | leaks if it mixes tenants in one queryable stream | scope log reads by tenant |

### Step 3: Identify the worst path and the fail-open trap

- The **unfiltered index** is the immediate breach — a single broad query exfiltrates a competitor's data.
- Note the *fail-open* danger: `buggy_retrieve` has no `tenant_id` parameter at all, so there's no way to even pass scope — and if you added an *optional* one, a caller that forgot it would silently get everything. The fix must make tenant_id **mandatory and fail-closed**.

## Reflection Questions
1. The index rows each carry a `tenant_id` — the data to enforce isolation was right there. Why didn't having the field prevent the leak?
2. A teammate suggests fixing this by adding "only return the current tenant's documents" to the system prompt. Why is that not a fix? (What's already happened by the time the model sees the data?)
3. Map the index leak and the memory leak to the apartment analogy — which is "the shared drain backed up," and which is "the neighbor's mail in your box"?

## Key Insight
Tagging data with a tenant_id does nothing unless every read *enforces* it — the leak comes from un-scoped operations, not missing labels — so isolation must be mandatory and fail-closed at every boundary, and the model is never the place to enforce it.
