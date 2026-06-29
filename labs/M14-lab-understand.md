# M14 Lab: Understand It — Assign Shelf Lives

## Objective
Take a set of stored UCC facts, assign each a decay rate/TTL and a staleness-detection method, and rank which facts would cause the worst harm if the system acted on them while stale.

## Prerequisites
- Completed M14 module content
- A text editor; no API calls required (analysis only)

## Setup (2 min)

Ten facts currently cached about debtor ACME LOGISTICS LLC:

```
1.  legal_name = "ACME LOGISTICS & DISTRIBUTION, L.L.C."
2.  registered_address = "1450 NW 107th Ave, Miami, FL"
3.  lien_status = "0 active liens"
4.  current_outstanding_balance = "$0"
5.  last_review_date = "2025-04-01"
6.  incorporation_date = "2011-06-14"
7.  processing_flag = "currently being parsed by worker-7"
8.  primary_contact_email = "ap@acme-logistics.example"
9.  risk_verdict = "LOW"
10. secured_parties = ["FIRST CAPITAL"]
```

## Exercise (25 min)

### Step 1: Assign decay rate, TTL, and detection method

| # | Fact | Decay rate | Suggested TTL | Detection method |
|---|------|-----------|---------------|------------------|
| 1 | legal_name | honey | ∞ | (rarely; event only) |
| 2 | registered_address | medium | ~180d | time |
| 3 | lien_status | milk | ~30d | time + **event** (new filing) |
| 4 | outstanding_balance | milk | ~1–7d | time + event |
| 5 | last_review_date | n/a (it's a timestamp) | — | — |
| 6 | incorporation_date | honey | ∞ | never |
| 7 | processing_flag | ultra-fast | ~30s | time |
| 8 | contact_email | slow-medium | ~365d | event |
| 9 | risk_verdict | milk (derived from 3,4,10) | ~30d | **event** (recompute when inputs change) |
| 10 | secured_parties | milk | ~30d | time + event |

### Step 2: Rank the 3 most dangerous-when-stale

Argue for the top 3. Expected:
1. **risk_verdict (9)** — a stale LOW directly drives a credit-approval decision; acting on it can approve a now-risky debtor.
2. **lien_status (3)** — feeds the verdict; stale "0 liens" hides real exposure.
3. **outstanding_balance (4)** — fast-moving financial fact; stale value misstates exposure.

Note the pattern: the most dangerous-when-stale facts are the **fast-decaying ones that feed decisions** — not the slow ones, and not the fast ones nobody acts on.

### Step 3: Spot the derived-fact trap

Fact 9 (risk_verdict) is *derived* from facts 3, 4, and 10. What's its correct TTL relative to its inputs? (It can be no fresher than its stalest input — a derived fact inherits the shortest shelf life of what it depends on. This is event-based invalidation: when an input changes, the derived verdict is stale even if its own timestamp is recent.)

## Reflection Questions
1. Why is `incorporation_date` safe to cache forever while `lien_status` is dangerous after a month — even though both are "facts about the debtor"?
2. Fact 9 is derived. Why can't you give it an independent TTL, and what must trigger its refresh?
3. Map facts 3, 2, and 6 to the milk/eggs/honey shelves.

## Key Insight
The danger of a stale fact is the product of how fast it decays AND whether a decision depends on it — so refresh policy should target fast-decaying, decision-feeding facts, and a derived fact is only as fresh as its stalest input.
