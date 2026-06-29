# M14 Plan — Context Decay and Refresh: When Context Goes Stale

## Module Identity
- **ID:** M14
- **Track:** 4 (Memory & Conversation Context)
- **Title:** Context Decay and Refresh — When Context Goes Stale
- **Subtitle:** Treating stored context as perishable — detecting staleness and deciding when to expire, demote, or refresh
- **Icon:** ⏳
- **Color:** #7a4a8c (amethyst)

## Everyday Analogy
**Milk vs. Honey in the Fridge**

Open any fridge and you're managing decay. Milk has a hard expiry — use it past the date and someone gets sick, so you check it and toss it. Honey effectively never expires — it's fine for years, and checking it daily would be a waste of effort. Most items live between these poles: leftovers are good for a few days, eggs for weeks. Good fridge management isn't "throw everything out nightly" or "never check anything" — it's knowing each item's shelf life and checking accordingly. Stored context is the same: a debtor's current lien status is milk (expires fast, dangerous when stale), a debtor's legal name is honey (rarely changes), and the discipline is matching your refresh effort to each fact's shelf life.

Mapping:
- Milk with a hard expiry → fast-decaying facts (current risk status, balances, "active" flags)
- Honey that lasts years → slow/never-decaying facts (legal entity name, incorporation date)
- Leftovers, eggs (in between) → medium-lived facts (address, contact, recent reviews)
- Getting sick from spoiled milk → acting on a stale fact (a real harm)
- Wasting effort checking honey daily → over-refreshing stable facts (needless cost/latency)
- Knowing each item's shelf life → assigning a TTL / freshness policy per fact type

## Key Topics (5)
1. **Context is perishable** — Every stored fact has a temporal validity. Memory architectures (M13) make facts persist, but persistence without expiry is a liability: a stored conclusion can quietly become false. Treating context as timeless is the bug.
2. **Decay rates differ by fact type** — Facts have wildly different shelf lives: a legal entity name (years), an address (months), a lien status (days to weeks), a "currently processing" flag (seconds). One global TTL is wrong for all of them; decay policy is per-fact-type.
3. **Staleness detection** — How you know a fact has expired: time-based (TTL / age), event-based (an invalidating update arrived — M11 fusion of a fresh source), and confidence-based (the fact's reliability decays with age). Detection is the trigger for refresh. *(UCC domain example lives here.)*
4. **Refresh strategies and their cost** — Options when a fact goes stale: expire (delete), demote (lower trust/move down a tier — M13), refresh eagerly (re-fetch now), or refresh lazily (re-fetch on next use). Each trades freshness against cost and latency (M03) — refreshing everything constantly is as wrong as never refreshing.
5. **The cost of freshness vs. the cost of staleness** — The core tradeoff: stale facts cause wrong decisions (the cost of being wrong), refreshing causes API/latency/token costs (the cost of being current). Set per-fact policy where the expected harm of staleness exceeds the cost of a refresh — high for risk status, low for a legal name.

UCC domain example appears in: Topic 3 — a cached debtor profile says "risk=LOW, 0 active liens" written 14 months ago. Time-based staleness (14 months > the 30-day TTL for lien status) flags it; an event-based signal (M11: a fresh `get_debtor_history` shows a 2024 lien) confirms it; acting on the stale LOW verdict would approve credit for a now-risky debtor — the milk that makes you sick.

## Sections Outline

### Section 1: content — "Persistence Without Expiry Is a Liability"
- M13 let facts persist; this module adds the missing dimension: temporal validity.
- A stored conclusion is a snapshot of a moment that may no longer be true. Treating it as timeless is how systems confidently act on outdated facts.
- Reframe: every stored fact is perishable; the question is its shelf life and your refresh policy.

### Section 2: content — "Decay Rates and Staleness Detection"
- Decay rates vary enormously by fact type (name = years, address = months, lien status = days, processing flag = seconds). A single global TTL is wrong; policy is per-fact-type.
- Three detection methods: time-based (age > TTL), event-based (an invalidating update arrives — ties to M11 fusion), confidence-based (reliability decays with age, weighting the fact lower over time).
- UCC tie-in: the 14-month-old "risk=LOW" cache flagged by TTL and confirmed by a fresh lien event.

### Section 3: code — "TTL and Staleness Policy"
- Language: Python
- Demonstrates: a `Fact` with a value, a timestamp, and a per-type TTL; an `is_stale(now)` (time-based), an `invalidate(event)` (event-based), and a `freshness_weight(now)` (confidence decay); plus a `refresh(fetch)` that re-fetches lazily. A small `DECAY` table maps fact types to TTLs.
- UCC tie-in: lien_status TTL=30d, address TTL=180d, legal_name TTL=∞; the stale lien_status triggers a lazy refresh while the legal_name is left untouched.
- Shows matching refresh effort to shelf life.

### Section 4: quiz — "The 14-Month-Old Verdict"
- Question: "Your UCC system caches a debtor's risk profile: 'risk=LOW, 0 active liens,' written 14 months ago. A new credit request comes in. Your lien-status facts have a 30-day shelf life. What should the system do?"
- Options:
  - A. Use the cached LOW verdict — it's the system's stored conclusion and avoids an API call
  - B. Treat the lien-status fact as stale (14 months >> 30-day TTL), refresh it before deciding, and only then score — because acting on a stale 'LOW' could approve credit for a now-risky debtor
  - C. Delete the entire debtor profile and start over from scratch
  - D. Refresh every cached fact about the debtor, including the legal name and incorporation date
  - correct: B (index 1)
- Explanation: Lien status is 'milk' — it decays fast and is dangerous when stale. Fourteen months is far past its 30-day shelf life, so the cached 'LOW' is untrustworthy and must be refreshed before a credit decision; acting on it risks approving a now-risky debtor. But refresh should be targeted: deleting the whole profile (C) throws away still-valid 'honey' facts, and refreshing everything (D) — including the legal name, which rarely changes — wastes cost and latency. Match refresh effort to each fact's shelf life.

### Section 5: antipattern — "Timeless Context"
- Anti-pattern 1: No expiry — caching facts forever with no TTL, so the system confidently acts on conclusions that silently went false (the stale-LOW-verdict harm).
- Anti-pattern 2: One global TTL — applying the same expiry to everything, so either fast-decaying facts go stale (TTL too long) or stable facts are needlessly re-fetched (TTL too short).
- Anti-pattern 3: Refresh-everything-always — re-fetching all context on every request to "be safe," paying constant API/latency/token costs (M03) to refresh honey that never spoiled.

## SVG Diagram Plan
**"Shelf Life of Context" — a fridge of facts sorted by decay rate, with TTL gauges and a refresh trigger**

```
   FAST DECAY (milk)            MEDIUM (eggs)         SLOW / NEVER (honey)
   ┌──────────────┐            ┌──────────────┐       ┌──────────────┐
   │ lien status  │            │ address      │       │ legal name   │
   │ TTL: 30d     │            │ TTL: 180d    │       │ TTL: ∞       │
   │ ███░░ stale! │            │ ██████░ ok   │       │ ████████ ok  │
   └──────┬───────┘            └──────────────┘       └──────────────┘
          ▼ refresh (lazy/eager)          (leave it)        (leave it)
   cost of staleness  >  cost of refresh  →  refresh
   cost of staleness  <  cost of refresh  →  keep
```

- Three "shelf" columns by decay rate: FAST (milk — lien status), MEDIUM (eggs — address), SLOW/NEVER (honey — legal name), each a card with a TTL value and a depleting "freshness gauge" bar.
- The FAST card shows its gauge nearly empty + a red "stale!" + a refresh arrow; the others show full gauges + "leave it."
- A decision rule banner: "refresh when cost of staleness > cost of refresh."
- Colors: amethyst #7a4a8c primary; signal-red #c0392b on the stale milk card + "stale!"; green-ish/full gauges on honey; amber accent on the refresh decision rule; warm paper background; Fraunces title, JetBrains Mono labels.
- Reinforces the fridge analogy directly: items sorted by shelf life, refresh effort matched to decay rate.

## Cross-Links
- None tagged in the curriculum map for M14. `crosslinks: []`. (In prose, lean on M13 (the persistent layer that needs expiry), M11 (event-based staleness = a fresh fused source), and M03 (the freshness-vs-cost tradeoff) — but no formal Agent/SDLC tags.)

## Lab Briefs

### Understand It: Assign Shelf Lives
- Give the learner a set of ~10 stored UCC facts (legal name, address, lien status, current balance, last-review date, incorporation date, a 'processing' flag, contact email, etc.).
- They assign each a decay rate / TTL and a detection method (time/event/confidence), and identify which stale facts would cause the worst harm if acted upon.
- Expected output: a table (fact → TTL → detection method → harm-if-stale) and a ranked list of the 3 most dangerous-when-stale facts.
- Duration: ~25 minutes.

### Build It with AI: A Freshness-Aware Cache
- With Claude, build a `Fact`/cache with per-type TTLs, time-based `is_stale()`, event-based `invalidate()`, a confidence `freshness_weight()`, and a lazy `get_or_refresh(fetch)` that re-fetches only stale facts.
- Steps: define the DECAY table → implement staleness detection → lazy refresh on access → run a credit decision against a 14-month-old profile and confirm the system refreshes lien status (only) before deciding, leaving the legal name untouched, and compare cost vs. refresh-everything.
- Expected deliverable: a freshness-aware cache + a demo showing a targeted refresh fixing a would-be-wrong decision, with a cost comparison against the refresh-all and never-refresh extremes.
- Duration: ~40 minutes.

## Context Engineering Takeaway
Stored context is perishable: every fact has a shelf life, so the discipline is assigning a per-fact decay policy, detecting staleness by time, event, or confidence, and refreshing only when the expected harm of acting on a stale fact exceeds the cost of refreshing it.

## Anti-Patterns
1. No expiry — caching facts forever with no TTL, so the system confidently acts on conclusions that silently went false.
2. One global TTL — the same expiry for everything, so fast-decaying facts go stale or stable facts are needlessly re-fetched.
3. Refresh-everything-always — re-fetching all context on every request, paying constant cost to refresh honey that never spoiled.

## Continuity Notes
- **Builds on:** M13 (the persistent/shared layers are exactly what needs expiry and demotion), M11 (event-based staleness is a fresh fused source overriding a cached belief — the same conflict resolution), M03 (freshness-vs-cost is a budget tradeoff). Adds the time axis to memory.
- **Referenced by:** M15 (user models drift and must be refreshed — user-modeling decay), M19 (caching — cache invalidation is staleness detection applied to the prompt cache), M28-M30 (observability/versioning — detecting context drift in production). Completes the temporal-management arc of Track 4; M15 then turns to the user dimension.
