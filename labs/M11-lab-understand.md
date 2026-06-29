# M11 Lab: Understand It — Spot the Fusion Failures

## Objective
Take a naively concatenated multi-source context for a UCC risk call and find every fusion defect — duplicates causing false amplification, a stale-vs-fresh conflict, and missing provenance — then show how a correct fusion changes the risk decision.

## Prerequisites
- Completed M11 module content
- A text editor; no API calls required (analysis only)

## Setup (3 min)

Here is the context a naive system assembled by concatenating all sources in arrival order:

```
[1] Cached profile: ACME LOGISTICS LLC assessed LOW risk (last review 2023-04).
[2] Filing 2024-FL-0012345: debtor ACME LOGISTICS LLC, lien held by FIRST CAPITAL.
[3] get_debtor_history: ACME LOGISTICS LLC has a new lien filed 2024-09 (MERIDIAN BANK).
[4] Filing 2024-FL-0019988: confirms 2024-09 lien against ACME LOGISTICS LLC (MERIDIAN BANK).
[5] Cached note: ACME LOGISTICS LLC — LOW risk, stable, no recent activity (2023).
[6] Filing 2024-FL-0012345: lien held by FIRST CAPITAL (ACME LOGISTICS LLC).
```

## Exercise (25 min)

### Step 1: Mark the duplicates (false amplification)

Which lines carry the *same* fact?
- **[2] and [6]** are the same FIRST CAPITAL lien (duplicate → keep one).
- **[3] and [4]** report the same 2024-09 MERIDIAN lien from two *different* sources — this is **corroboration, not duplication** (keep both, they're independent confirmation). Note the distinction: dedupe identical facts, but two independent sources confirming one event is genuine signal.
- **[1] and [5]** are the same stale LOW-risk belief (duplicate → keep one).

Why does leaving [1] and [5] both in matter? The model sees "LOW risk" stated twice and weights it as if two sources agreed.

### Step 2: Find and resolve the conflict

| Claim | Source | Trust | Date | |
|-------|--------|-------|------|--|
| risk = LOW | cached memory | low | 2023-04 | stale |
| new 2024 lien (→ higher risk) | tool + 2 filings | high | 2024-09 | fresh, corroborated |

**Resolution:** fresh + high-trust + corroborated 2024 evidence overrides the stale 2023 LOW belief. Flag the change: *"risk re-evaluated: 2024-09 lien (MERIDIAN) supersedes 2023 LOW assessment."*

### Step 3: Find the provenance gaps

Which claims would be unattributable if you stripped the labels? Note that a correct fusion keeps `[source | date | trust]` on every line so the risk decision (and a later auditor) can trace it.

### Step 4: Compare the outcomes

| | Naive concatenation | Correct fusion |
|---|--------------------|----------------|
| Duplicates | LOW risk amplified ×2 | deduped to 1, overridden |
| Conflict | unresolved / last-wins | fresh evidence wins, flagged |
| Likely risk score | **LOW** (anchored by amplified stale belief) | **HIGH** (2024 lien, corroborated) |

The naive context likely yields the *wrong* score — a real harm in credit risk.

## Reflection Questions
1. Why is "[3] and [4] confirming the same lien" treated differently from "[2] and [6] being the same lien"? What's the line between corroboration and duplication?
2. The stale LOW belief appeared twice. How did that duplication actively push the risk score the wrong way?
3. Map the six lines to the reporter analogy — which is the press release, which the public record, and which got dropped on the editing floor?

## Key Insight
Concatenation isn't fusion: duplicates falsely amplify, stale beliefs survive next to fresh evidence, and unattributed claims can't be audited — so the same facts, fused correctly, can flip a risk decision from wrong to right.
