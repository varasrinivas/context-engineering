# M23 Lab: Build It with AI — Tenant-Scoped Assembly + a Leakage Test

## Objective
With Claude, build a context layer where retrieval, memory, and cache are all tenant-scoped and fail-closed — then write a canary-based leakage test that proves tenant A's data never reaches tenant B, and demonstrate that the same test *fails* against an un-scoped version (so you know the test has teeth).

## Prerequisites
- Completed the M23 Understand It lab (you have `multitenant.py`, `leak.py`)
- Python 3.10+ (Claude API optional — isolation logic is local)

## The Build (40 min)

### Step 1: Build the tenant-scoped context layer with Claude (14 min)

Claude prompt to use:
```
"Write tenant_ctx.py with a TenantContext class for a multi-tenant UCC pipeline.
Every context operation MUST take a tenant_id and FAIL CLOSED (raise PermissionError)
if it's falsy. Implement:
- __init__(index, memory, cache) where index is a list of {tenant_id, text} dicts.
- retrieve(query, tenant_id, k=5): return only docs whose tenant_id matches AND that
  match the query. Never return another tenant's docs.
- memory_read(key, tenant_id) / memory_write(key, value, tenant_id): namespace memory
  by (tenant_id, key).
- cache_key(prefix, tenant_id): return f'{tenant_id}:{prefix}' so caches never collide
  across tenants.
- A private _require(tenant_id) that raises PermissionError('no tenant_id -> no data')
  when tenant_id is falsy; call it at the top of every method.
Return only the code."
```

Save as `tenant_ctx.py`.

### Step 2: Write the canary leakage test with Claude (12 min)

Claude prompt to use:
```
"Write leak_test.py that proves tenant isolation using a CANARY:
1. Seed an index where tenant 'lenderA' has a unique canary doc
   {'tenant_id':'lenderA','text':'CANARY-7QX private ACME filing'} plus normal docs,
   and tenant 'lenderB' has its own docs.
2. Build a TenantContext over it.
3. assert that for EVERY plausible lenderB query (e.g. 'private','ACME','CANARY','filing',
   'high risk'), retrieve(query, 'lenderB') NEVER returns any doc containing 'CANARY-7QX'.
4. assert that lenderA CAN retrieve its own canary (same-tenant reads still work).
5. assert that retrieve(query, '') raises PermissionError (fail-closed).
Print 'ISOLATION OK' if all assertions pass.
Also include a function run_against(retriever) so the same test can target a different
(un-scoped) retriever to show the test FAILING. Return only the code."
```

Save as `leak_test.py`.

### Step 3: Prove isolation holds (8 min)

Run it: `python leak_test.py`

**Expected:**
```
lenderB queries for 'private'/'ACME'/'CANARY'/... -> 0 canary hits
lenderA retrieves its own CANARY-7QX -> OK
retrieve(q, '') -> PermissionError (fail closed)
ISOLATION OK
```

### Step 4: Prove the test has teeth (6 min)

Point the same leakage test at the *buggy* un-scoped retriever from the Understand lab:
```python
from multitenant import buggy_retrieve
from leak_test import run_against

# buggy_retrieve ignores tenant_id -> the canary WILL leak to lenderB
try:
    run_against(lambda q, tenant_id, k=5: buggy_retrieve(q, k))   # adapter dropping tenant_id
    print("UNEXPECTED: leak test passed against the buggy retriever?!")
except AssertionError as e:
    print("EXPECTED FAILURE (test caught the leak):", e)
```

**Expected:** the leakage test **fails** against the buggy retriever — `CANARY-7QX` shows up in lenderB's results, the assertion fires. A test that only ever passes proves nothing; this one demonstrably catches a real leak.

## Deliverable
A `m23-lab/` folder containing:
- `tenant_ctx.py` — `TenantContext` with mandatory, fail-closed tenant scoping on retrieval, memory, and cache keys
- `leak_test.py` — a canary-based leakage test asserting A's data never reaches B, same-tenant reads work, and missing tenant_id fails closed
- A demo showing the test PASS against the scoped layer and FAIL against the un-scoped buggy retriever

You can now prove — not assume — that one tenant's context never reaches another's window.

## Stretch Goals
- Extend the canary test to memory and cache: seed a canary in A's memory/cache and assert it's unreachable from B's namespace/key.
- Add a CI hook: run `leak_test.py` on every change so a regression that drops a tenant filter fails the build.
- Combine with M22: confirm the audit log is also tenant-scoped, so one tenant can't read another's access history.

## Connection to Next Module
Track 6 is complete — input guardrails (M20), output shaping (M21), compliance (M22), and isolation (M23) now govern the context window end to end. Track 7 (Agent Context Patterns) shifts to autonomous agents: M24 (Agent Loop Context) is about what persists across an agent's iterations — the scratchpad, the growing context pressure, and checkpointing — where everything you've learned about assembling, positioning, and governing context now has to survive a loop.
