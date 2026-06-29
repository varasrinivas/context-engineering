# M31 Capstone Lab: Understand It — Audit a Whole Pipeline

## Objective
Audit a "finished" UCC risk pipeline against all eight tracks at once, find the production-blocking gaps at the seams, and produce a readiness scorecard — the skill of judging a *system*, not a technique.

## Prerequisites
- Completed the entire course (M00–M30)
- A text editor; no API calls required (system audit)

## Setup (3 min)

A teammate says their UCC risk pipeline is "done." Here's how it actually works:

```
1. System prompt: a 2,000-token wall of rules + examples, edited directly in a config
   file whenever someone has an idea. No version history.
2. Retrieval: semantic search, top-20 chunks, no reranking, dumped into the prompt in
   retrieval order.
3. The full filing text — including the debtor's SSN — is pasted into the user message.
4. The model is asked in the prompt to "return JSON with the risk." Output parsed directly.
5. One shared retrieval index serves all customer tenants.
6. Logs store the full prompt and the full response for debugging.
7. No eval set. Changes ship when they "look good" on whatever filing was being tested.
8. It's a single call — no agent loop, no human escalation, no observability dashboard.
```

## Exercise (30 min)

### Step 1: Audit track by track

| Track | Discipline | Present? | Gap / risk |
|-------|-----------|----------|-----------|
| T1 Foundations | thinks in tokens/budget | partial | 2k system prompt resent every call, no budget awareness (M03) |
| T2 System Context | architected, delimited prompt | **no** | wall-of-text, no data boundary, edited ad hoc (M04) |
| T3 Dynamic Assembly | retrieve→rank→format→place | **no** | top-20 no rerank, arrival-order dump (M08/M09/M16) |
| T4 Memory | layered, scoped | n/a | single call, no memory |
| T5 Positioning/Opt | position, compress, cache | **no** | 20 chunks bury the signal; no cache; no compression (M16/M18/M19) |
| T6 Guardrails | input/output/compliance/isolation | **NO** | no injection defense (M20), output unvalidated (M21), **raw SSN in prompt+logs (M22)**, **shared index across tenants (M23)** |
| T7 Agent Patterns | loop, plan, multi-agent, HITL | n/a | single call (acceptable here, but no escalation for borderline) |
| T8 Production | observe, evaluate, version | **NO** | no observability (M28), no eval set (M29), no versioning/rollback (M30) |

### Step 2: Rank the production-blocking gaps by risk

Pick the top 3 that would block a real launch:
1. **Raw SSN in the prompt and logs (T6/M22)** — a compliance breach and legal liability. Highest severity.
2. **Shared retrieval index across tenants (T6/M23)** — one customer's filings can surface in a competitor's results. Confidentiality breach.
3. **No eval set + no versioning (T8/M29-M30)** — no way to know if a change helps or harms, no rollback; guarantees silent drift (and you can't even measure the other fixes).

(Runners-up: no output validation (M21) → daily parser crashes; top-20 unranked retrieval (M09/M16) → buried disqualifying liens.)

### Step 3: Note the seam failures specifically

Beyond individual gaps, name two *seam* problems:
- The 2k system prompt *could* be cached (M19), but since it's edited ad hoc with no versioning (M30), the cache would constantly invalidate — a T5×T8 seam.
- Logging the full prompt (debugging) directly conflicts with PII handling (M22) — a T8×T6 seam where two reasonable-sounding choices collide.

## Reflection Questions
1. Every individual technique in this pipeline is *recognizable* — semantic search, a system prompt, JSON output, logging. So why is the pipeline nonetheless not production-ready?
2. Which single gap, if left unfixed, is most likely to end the company (vs. just degrade quality)? Why does severity, not frequency, drive the ranking?
3. Map the audit to the restaurant analogy — which gaps are "the food is bland" and which are "the kitchen fails the health inspection"?

## Key Insight
Judging a context system means auditing across all eight tracks and especially the seams between them — a pipeline built from individually-familiar techniques can still be unshippable because of a missing data boundary, an unscoped index, or an absent eval gate, and the capstone skill is seeing the whole system, ranked by risk.
