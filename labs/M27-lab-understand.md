# M27 Lab: Understand It — Critique Three Escalations

## Objective
Evaluate three ways an agent escalates the *same* borderline UCC decision and derive the minimal set of fields a good escalation brief must contain.

## Prerequisites
- Completed M27 module content
- A text editor; no API calls required (critique exercise)

## Setup (3 min)

The situation: an agent scoring debtor **ACME** hits conflicting signals — 2 active liens, but filing 0019 shows a pending termination, and filing 0022 suggests a related entity (shared address). Confidence: **0.55**. It must get the analyst's call. Three escalations:

**(a) Silent auto-decision**
> *(no escalation — the agent just returns `risk = MEDIUM` and moves on)*

**(b) Full-log dump**
> "Here is my complete investigation: [step 1: resolved entity ACME... step 2: queried FL, returned 8 filings: filing 2024-FL-00001 routine UCC-1 secured party... (continues for 12 steps and ~3,000 tokens of raw filing detail)]. What's the risk?"

**(c) Scoped brief**
> "DECISION: risk for ACME? RECOMMEND: MEDIUM (confidence 0.55). WHY: 2 active liens, but filing 0019 shows a pending termination, and filing 0022 suggests a related entity (shared address). EVIDENCE: [filing 0019] [filing 0022]. OPTIONS: confirm MEDIUM / override HIGH / request more data."

## Exercise (25 min)

### Step 1: Critique each on three axes

| Escalation | Human decision speed | Correctness risk | Accountability (auditable?) |
|------------|---------------------|------------------|------------------------------|
| (a) silent | n/a (no human) | **high** — a consequential, low-confidence call made unilaterally | poor — no human record |
| (b) full dump | **slow** — human hunts for the decision in 3,000 tokens | medium — info is there but buried; risk of rubber-stamp | weak — hard to see what was decided and why |
| (c) scoped brief | **fast** — decision, why, evidence, options up front | low — human sees exactly what's at stake | strong — decision + rationale logged |

### Step 2: Extract the required fields

From why (c) works, list the minimal fields a good escalation brief must contain:
1. **Decision** — the specific question the human must answer.
2. **Recommendation + confidence** — the agent's call and how sure it is.
3. **Why** — the conflicting signals / reasoning, briefly.
4. **Evidence (with provenance)** — the few records the recommendation rests on (filing IDs), not the whole log.
5. **Options** — the concrete choices (confirm / override / get more).

### Step 3: Identify what (a) and (b) each fail

- **(a)** fails the *trigger*: a 0.55-confidence, consequential decision should never be unilateral. It's not a bad brief — it's a missing one.
- **(b)** fails the *shaping*: all the information is present, but it's a data dump, so the human can't decide fast and is likely to rubber-stamp (a false sense of review) or stall.

### Step 4: The return path

Both (a) and (b) also tend to forget the *loop closes*. For (c), specify what must happen after the human decides:
- The human's choice + any rationale is **injected back** into the agent's context as authoritative (M05), and
- the decision is **logged** (M22) — who decided, what, when, on what evidence.

## Reflection Questions
1. (b) hides nothing — it sends *complete* information. Why is "complete" worse than "scoped" for a human decision?
2. The agent in (a) was probably right more often than not at 0.55. Why is "usually right" not good enough to skip escalation here?
3. Map all three to the junior-analyst analogy — which is "approved it myself," which is "here's the 200-page log," and which is the one-page brief?

## Key Insight
A good escalation is defined by what it *omits* as much as what it includes: the human needs the decision, the why, the few load-bearing pieces of evidence, and the options — not the agent's full reasoning trace — and the loop only works if their decision flows back into the agent's context and the log.
