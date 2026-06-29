# M28 Lab: Build It with AI — A Context Observability Logger + Dashboard

## Objective
With Claude, build the instrumentation that makes a UCC pipeline's context windows visible — a per-call observability logger, a per-layer token + cache-hit dashboard, and threshold alerts — then inject a regression and watch the system catch it.

## Prerequisites
- Completed the M28 Understand It lab (you have `logs.py`, `diagnose.py`)
- Python 3.10+ (Claude API optional — the instrumentation is local)

## The Build (40 min)

### Step 1: Build the observability logger with Claude (14 min)

Claude prompt to use:
```
"Write observe.py for context observability of a UCC pipeline:
- record(*, layers: dict[str,int], output: str, cost: float, latency_ms: int,
  cache_hit: bool, guardrail_flags: list, tenant: str, request_id: str,
  context_text: str) -> dict. It must build a PII-SAFE log entry:
    * store a sha256 HASH of context_text (never the raw text — M22),
    * store the per-layer token dict, total tokens, output length, cost, latency,
      cache_hit, guardrail_flags, tenant, request_id, and a UTC timestamp.
  Append it to a module-level LOG list and return it.
- malformed(output: str) -> bool: True if output isn't valid JSON (for a malformed-rate metric).
No raw context or PII in the log. Read nothing from the network. Return only the code."
```

Save as `observe.py`.

### Step 2: Build the dashboard + alerts with Claude (12 min)

Claude prompt to use:
```
"Extend observe.py:
- dashboard(window=200) -> dict aggregating the last `window` LOG entries:
  mean tokens PER LAYER, overall cache_hit_rate, mean cost, p95 latency,
  and malformed_rate.
- alerts(thresholds) -> list[str]: compare the recent dashboard to `thresholds`
  and emit a warning string for each breached metric, e.g.
  'retrieval tokens 6000 > 4000', 'cache_hit_rate 0.05 < 0.5',
  'malformed_rate 0.04 > 0.01'. Return the list (empty if all healthy).
Return the updated code."
```

### Step 3: Instrument a UCC call and emit a dashboard (8 min)

Create `run_observe.py`:
```python
import json, random
from observe import record, dashboard, alerts, malformed

def simulate_call(top_k):
    # retrieval tokens scale with top_k (the lever we'll regress)
    ret = 500 * top_k
    cache_hit = random.random() < (0.92 if top_k <= 5 else 0.05)  # big varying set breaks cache
    output = '{"risk":"HIGH","verified_lien_count":3,"flags":[]}'
    record(layers={"system":1200,"retrieval":ret,"tool":500,"conversation":300,"user":120},
           output=output, cost=ret*1e-6, latency_ms=random.randint(400,900),
           cache_hit=cache_hit, guardrail_flags=[], tenant="lenderA",
           request_id=f"req-{random.randint(1000,9999)}", context_text="...assembled...")

# Healthy week: top_k = 5
for _ in range(100): simulate_call(top_k=5)
print("HEALTHY dashboard:", json.dumps(dashboard(), indent=2))
print("HEALTHY alerts:", alerts({"retrieval":4000, "cache_hit_rate":0.5, "malformed_rate":0.01}))
```

Run it. **Expected:** the dashboard shows retrieval ≈ 2500 tokens and cache-hit ≈ 0.92; `alerts(...)` returns `[]` (all healthy).

### Step 4: Inject the regression and catch it (6 min)

Append to `run_observe.py`:
```python
# Someone bumps top_k 5 -> 12 (the M28 Understand-lab regression)
for _ in range(100): simulate_call(top_k=12)
print("\nREGRESSED dashboard:", json.dumps(dashboard(), indent=2))
fired = alerts({"retrieval":4000, "cache_hit_rate":0.5, "malformed_rate":0.01})
print("REGRESSED alerts:", fired)
assert any("retrieval" in a for a in fired), "retrieval spike not alerted!"
assert any("cache_hit" in a for a in fired), "cache-hit drop not alerted!"
```

Run it. **Expected:**
- The dashboard now shows retrieval ≈ 6000 tokens and cache-hit ≈ 0.05.
- `alerts(...)` fires: `['retrieval tokens 6000 > 4000', 'cache_hit_rate 0.05 < 0.5']`.
- The assertions pass — the observability system caught the regression the moment it happened, before any user reported it.

## Deliverable
A `m28-lab/` folder containing:
- `observe.py` — PII-safe per-call logger, per-layer dashboard, threshold alerts, malformed check
- `run_observe.py` — a healthy baseline and an injected top-k regression caught by the dashboard + alerts
- A short note: the context window is now visible; the regression is caught by metrics, not by users, and the log holds no raw context/PII

You've built the black box — every call recorded, the per-layer budget visible, and the alarms that page you before the invoice does.

## Stretch Goals
- Add a `replay(request_id)` that, given a logged entry, shows the per-layer shape so you can debug *that* call (note: you stored a hash, not the text — discuss the privacy/debuggability tradeoff and when to store a redacted context).
- Add a cost dashboard (M03): project monthly spend from mean cost × call volume, and alert on month-over-month drift.
- Tag each log with the prompt/version id (a hook into M30 versioning) so you can attribute a regression to a specific release.

## Connection to Next Module
Observability lets you *measure* a context strategy. M29 (Context A/B Testing) lets you *compare* them rigorously: running two context strategies against an eval set and using statistical tests to decide which actually wins — instead of shipping a change because it looked better on one example.
