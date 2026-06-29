# M14 Lab: Build It with AI — A Freshness-Aware Cache

## Objective
With Claude, build a cache that tracks each fact's shelf life, detects staleness three ways, and refreshes *lazily and selectively* — then prove it rescues a credit decision from a 14-month-old verdict by refreshing only the stale lien status, not the whole profile.

## Prerequisites
- Completed the M14 Understand It lab (you have your shelf-life table)
- Claude API access (optional — refresh can be stubbed), Python 3.10+

## The Build (40 min)

### Step 1: Build the freshness-aware cache with Claude (15 min)

Claude prompt to use:
```
"Write freshness.py for a context cache with per-type decay. Include:
- DECAY: dict mapping fact types to a timedelta TTL (None = never expires).
  Use legal_name=None, address=180d, lien_status=30d, balance=7d, processing=30s.
- @dataclass Fact(type, value, ts: datetime, invalidated=False) with:
    is_stale(now): True if invalidated (event-based) OR (TTL is not None and
                   now-ts > TTL) (time-based).
    freshness_weight(now): confidence in [0,1] that decays linearly with age/TTL
                   (1.0 if TTL is None).
- get_or_refresh(fact, now, fetch): if fact.is_stale(now), return a NEW Fact with
  fetch() value and ts=now (lazy refresh); else return fact unchanged.
- A FactStore class holding many facts keyed by (entity_id, type) with
  refresh_for_decision(now, needed_types, fetchers): refresh ONLY the needed types
  that are stale, leaving everything else untouched; return a cost report listing
  which facts were refreshed vs. served-from-cache.
Return only the code."
```

Save as `freshness.py`.

### Step 2: Stage the 14-month-old profile (8 min)

Create `profile.py`:
```python
from datetime import datetime, timedelta
from freshness import Fact, FactStore

NOW = datetime(2026, 6, 28)
old = NOW - timedelta(days=14*30)   # ~14 months ago

store = FactStore()
store.put("ACME", Fact("legal_name", "ACME LOGISTICS & DISTRIBUTION, L.L.C.", old))
store.put("ACME", Fact("address",    "1450 NW 107th Ave, Miami, FL", old))
store.put("ACME", Fact("lien_status","0 active liens", old))      # STALE (30d TTL)
store.put("ACME", Fact("risk_verdict","LOW", old))                # derived, STALE

# Fetchers simulate re-querying the source of truth (only called if stale).
FETCHERS = {
    "lien_status": lambda: "1 active lien filed 2024-09 (MERIDIAN)",
    "risk_verdict": lambda: "HIGH",
    "legal_name":  lambda: (_ for _ in ()).throw(AssertionError("should NOT refresh honey!")),
}
```

### Step 3: Decision with targeted refresh (12 min)

Create `decide.py`:
```python
from datetime import datetime
from profile import store, FETCHERS, NOW

# The credit decision needs lien_status + risk_verdict (NOT legal_name/address).
needed = ["lien_status", "risk_verdict"]
report = store.refresh_for_decision(NOW, "ACME", needed, FETCHERS)

print("REFRESH REPORT:")
for line in report: print("  ", line)
print("\nlien_status now:", store.get("ACME","lien_status").value)
print("risk_verdict now:", store.get("ACME","risk_verdict").value)
```

Run it: `python decide.py`

**Expected behavior:**
- `lien_status` and `risk_verdict` were **stale → refreshed** (now show the 2024 lien / HIGH).
- `legal_name` and `address` were **not needed and not refreshed** — the `legal_name` fetcher (which throws) is never called, proving honey wasn't touched.
- The decision now scores **HIGH** off fresh data instead of approving credit on the stale LOW.

**Expected report:**
```
REFRESH REPORT:
   lien_status: STALE (14mo > 30d) -> refreshed
   risk_verdict: STALE -> refreshed
lien_status now: 1 active lien filed 2024-09 (MERIDIAN)
risk_verdict now: HIGH
```

### Step 4: Cost comparison vs. the extremes (5 min)

Tabulate three strategies on this decision:

| Strategy | Stale facts used? | Refresh calls | Outcome |
|----------|-------------------|---------------|---------|
| Never refresh | yes (LOW) | 0 | **wrong** (approves risky debtor) |
| Refresh everything | no | 4 (incl. legal_name, address) | correct but **wasteful** |
| Targeted (this lab) | no | 2 (only stale + needed) | **correct AND cheap** |

## Deliverable
A `m14-lab/` folder containing:
- `freshness.py` — `Fact`/`FactStore` with TTLs, time/event/confidence staleness, lazy `get_or_refresh`, and `refresh_for_decision`
- `profile.py`, `decide.py` — the 14-month-old profile and the targeted-refresh decision
- A 3-row strategy comparison showing targeted refresh is the only correct-and-cheap option

You now treat stored context as perishable — refreshing exactly what a decision needs, exactly when it's stale.

## Stretch Goals
- Wire event-based invalidation: when a new filing arrives (M11), mark the matching `lien_status` fact `invalidated=True` so it refreshes even before its TTL.
- Use `freshness_weight()` to *down-weight* (not just expire) aging facts in a borderline decision.
- Connect to M13: when a persistent fact expires, demote it to a "needs re-verification" state instead of deleting it outright.

## Connection to Next Module
You've managed memory across turns (M12), in layers (M13), and across time (M14). The last piece of Track 4 is the *user*: M15 (User Modeling as Context) is about building a model of the person you're serving — personalization that helps — without overfitting to noise or letting a stale/over-specific profile hurt more than it helps.
