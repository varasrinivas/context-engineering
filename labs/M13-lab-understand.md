# M13 Lab: Understand It — Sort Facts into Layers

## Objective
Take a mixed bag of facts from a real UCC analyst session and file each into the correct memory layer (ephemeral / session / persistent / shared) by reasoning about its lifetime and scope — then identify which mis-filings would cause leakage or loss.

## Prerequisites
- Completed M13 module content
- A text editor; no API calls required (analysis only)

## Setup (2 min)

Here are 12 facts that surfaced during a UCC analyst's workday:

```
1.  Currently parsing page 3 of filing 2024-FL-0012345.
2.  Page 3 had an OCR glitch; re-OCR succeeded on retry.
3.  This analyst is Dana, a senior compliance reviewer.
4.  Dana always wants outputs as concise JSON, no prose.
5.  In this session, Dana has flagged 0012345 and 0019988 as HIGH risk.
6.  The canonical risk verdict for debtor ACME LOGISTICS LLC is HIGH (set by the risk agent).
7.  Intermediate sum while computing lien count: 2 + 1 = 3.
8.  Dana is reviewing Florida filings today.
9.  Debtor ACME LOGISTICS LLC's registered address (a stable public-record fact).
10. The report-generation agent needs ACME's verdict to write the summary.
11. Dana prefers risk thresholds explained when a score is borderline (learned over months).
12. The current filing's temp download path on disk.
```

## Exercise (25 min)

### Step 1: Classify each fact

| # | Fact (short) | Layer | Lifetime | Scope |
|---|--------------|-------|----------|-------|
| 1 | parsing page 3 | **ephemeral** | this step | this request |
| 2 | OCR glitch on this PDF | **ephemeral** | this step | this request |
| 3 | Dana = senior reviewer | **persistent** | cross-session | this user |
| 4 | concise-JSON preference | **persistent** | cross-session | this user |
| 5 | flagged 0012345, 0019988 | **session** | this conversation | this convo |
| 6 | canonical ACME verdict = HIGH | **shared** | cross-agent | many agents |
| 7 | intermediate sum 2+1=3 | **ephemeral** | this step | this request |
| 8 | reviewing FL filings today | **session** | this conversation | this convo |
| 9 | ACME registered address | **persistent/shared** (stable public fact) | long-lived | entity-scoped |
| 10 | report agent needs verdict | **shared** | cross-agent | many agents |
| 11 | wants borderline thresholds explained | **persistent** | cross-session | this user |
| 12 | temp download path | **ephemeral** | this step | this request |

### Step 2: Flag the dangerous mis-filings

Pick the two facts most dangerous to mis-file:
- **Fact 2 (OCR glitch) → persistent** would be *leakage*: a one-off transient detail polluting Dana's permanent profile forever, and diluting it for every future session.
- **Fact 4 (concise-JSON preference) → session only** would be *loss*: a durable, valuable preference dying when the conversation ends, so Dana has to re-state it next time.

### Step 3: Spot the scope trap

Fact 6 (ACME's canonical verdict) is **shared** — but only with *permissioned* agents. Note: if "shared" had no scope control, ACME's verdict could surface in a *different debtor's* analysis. Lifetime isn't the only axis; scope matters too.

## Reflection Questions
1. Facts 3 and 5 both happened in this session — why does 3 belong in persistent while 5 belongs in session?
2. Fact 9 (a stable public-record address) is genuinely ambiguous between persistent and shared. What additional question decides it?
3. Map facts 1, 5, 4, and 6 to the concierge's four depths of memory.

## Key Insight
Filing a fact in the wrong memory layer causes one of two failures — leakage (transient noise made permanent) or loss (durable truth discarded with the session) — so every fact needs an explicit lifetime-and-scope decision before it's stored.
