# M28 Plan — Context Observability: Logging, Debugging, Token Analysis

## Module Identity
- **ID:** M28
- **Track:** 8 (Production & Evaluation)
- **Title:** Context Observability — Logging, Debugging, Token Analysis
- **Subtitle:** Seeing what's actually in your context windows in production — so you can measure and improve it
- **Icon:** 🚀
- **Color:** #2c3e50 (charcoal)

## Everyday Analogy
**The Airplane Black Box**

When a flight goes wrong, investigators don't guess — they pull the black box. It recorded everything: every instrument reading, every control input, every system state, timestamped. Because the data was captured continuously, they can reconstruct exactly what happened and why. A plane with no black box leaves you debugging a crash from eyewitness hearsay. Context observability is the black box for your LLM system: it records what actually went into each context window, what came out, the token breakdown, and the guardrail flags — so when an answer is wrong or a bill spikes, you can replay the exact context instead of guessing.

Mapping:
- The black box recording every reading → logging the assembled context, output, and usage per call
- Reconstructing the flight from the data → replaying the exact context that produced a bad answer
- Instrument readings (altitude, fuel) → token-per-layer breakdown, cost, latency, cache-hit rate
- Debugging a crash with no recorder → debugging a wrong answer with no context logs (guesswork)
- Timestamps on everything → correlating a quality/cost regression to when it started
- The cockpit voice recorder → the guardrail flags and decisions captured alongside (M20-M22)

## Key Topics (5)
1. **You can't improve what you can't see** — Most LLM systems are black boxes by accident: a wrong answer comes back and nobody knows what context produced it. Observability makes the context window visible — what was assembled, what came out, and the metrics — turning "the model is wrong" into "the retrieval put the wrong chunk in position 20."
2. **What to log** — The observability payload per call: the assembled context (or a hash/structured summary of it — respecting M22 PII rules), the output, token usage per layer, cost, latency, model/version, cache-hit, guardrail flags (M20/M21), tenant (M23), and the user/request id. Log the *shape* of the context, not just the final answer. *(UCC domain example lives here.)*
3. **Token analysis and the context budget dashboard** — The core production metric: where do your tokens go? A per-layer token breakdown (system/retrieval/tool/conversation/user — M00) across calls reveals bloat, regressions, and the cache-hit rate (M19). This is M03's budget made observable and continuous.
4. **Context debugging — replaying the window** — When an answer is wrong, the debugging move is to reconstruct and inspect the exact context that produced it: was the right chunk retrieved (M08)? where was it positioned (M16)? did a guardrail fire (M20)? was the cache stale (M19)? Observability lets you answer these instead of re-running blind.
5. **Alerts and triggers** — Observability isn't just forensic; it's preventive. Alert on the signals that predict trouble: token usage climbing (cost regression), cache-hit rate dropping (a silent invalidator, M19), malformed-output rate rising (M21), guardrail flags spiking (an attack, M20), latency creeping. The metrics you log become the alarms that page you.

UCC domain example appears in: Topic 2 — a risk pipeline where accuracy quietly dropped last week. With observability, you query the logs: the per-layer token breakdown shows the retrieval layer doubled in size (someone bumped top-k from 5 to 12), pushing the critical filing into the lost-in-the-middle zone (M16) and the cache-hit rate to near-zero (the larger, varying retrieval set broke the cached prefix, M19). Without the logs, you'd be guessing.

## Sections Outline

### Section 1: content — "The Accidental Black Box"
- Most LLM systems are unobservable by default: an answer comes back, and the context that produced it is gone.
- The cost: you can't debug a wrong answer, can't explain a cost spike, can't prove what happened (M22). "The model is wrong" is not actionable; "chunk 20 was buried" is.
- Thesis: observability makes the context window visible, which is the precondition for every other production discipline (testing, versioning, capstone).

### Section 2: content — "What to Log and the Token Dashboard"
- The per-call observability payload: assembled context (hashed/structured per M22 PII rules), output, per-layer token usage, cost, latency, model/version, cache-hit, guardrail flags, tenant, request id.
- Token analysis: the per-layer breakdown (M00's five layers) across calls is the core dashboard — where tokens go, bloat, regressions, cache-hit rate (M19, M03 made observable).
- UCC tie-in: the per-layer token breakdown that reveals the retrieval-layer bloat regression.

### Section 3: content — "Debugging by Replay, and Alerting"
- Context debugging: reconstruct the exact window for a bad answer and inspect it — right chunk retrieved (M08)? positioned well (M16)? guardrail fired (M20)? cache stale (M19)? Answer with data, not re-runs.
- Alerting: the logged metrics become alarms — token climb (cost), cache-hit drop (invalidator M19), malformed-output rise (M21), guardrail-flag spike (attack M20), latency creep. Observability is preventive, not just forensic. <span>[SDLC Observability]</span>.
- The UCC accuracy-drop investigation resolved by querying the logs.

### Section 4: quiz — "Why Did Accuracy Drop Last Week?"
- Question: "Your UCC risk pipeline's accuracy quietly dropped last week and costs rose. You have no context logs. A teammate says 'the model must have changed — let's just try a bigger model.' What's the right move?"
- Options:
  - A. Agree — swap to a bigger model and see if accuracy recovers
  - B. Add context observability first: log the per-call assembled context shape, per-layer token breakdown, cache-hit rate, and guardrail flags, then query the logs to find what changed — e.g. a retrieval-layer token spike burying the key chunk (M16) and collapsing the cache-hit rate (M19) — and fix the actual cause
  - C. Roll back every change from last week blindly
  - D. Tell users accuracy varies and move on
  - correct: B (index 1)
- Explanation: Without observability you're guessing, and 'try a bigger model' (A) is a guess that often masks the real cause and raises cost further. The right move is to make the context window visible: log the assembled-context shape, the per-layer token breakdown, cache-hit rate, and guardrail flags, then *query* to find the regression — here, a retrieval top-k bump doubled the retrieval layer, pushed the disqualifying filing into the lost-in-the-middle zone (M16) and broke the cached prefix (M19), explaining both the accuracy drop and the cost rise. Blind rollback (C) is slow and may revert good changes; ignoring it (D) abandons the system. You can only fix what you can see.

### Section 5: antipattern — "Flying Blind"
- Anti-pattern 1: No context logging — only the final answer is stored, so a wrong answer or cost spike is undebuggable; you guess and swap models.
- Anti-pattern 2: Logging answers but not context shape — you can see *what* the model said but not *what it saw*, so you can't tell a retrieval bug from a positioning bug from a cache miss.
- Anti-pattern 3: No alerts on context metrics — token, cache-hit, malformed-rate, and guardrail signals are logged but never watched, so regressions are discovered by users (or the invoice) instead of by the system.

## SVG Diagram Plan
**"The Context Black Box" — every call records context shape + metrics, queryable for debug and alerts**

```
   EACH CALL ──▶ ┌──────── CONTEXT BLACK BOX (logged) ────────┐
                 │ context shape (hashed, PII-safe)            │
                 │ per-layer tokens: sys 1.2k · ret 6k(!) · ...│ ◄ regression
                 │ cost · latency · cache-hit 4%(!) · model    │
                 │ guardrail flags · tenant · request_id       │
                 └───────────────┬─────────────────────────────┘
                       ┌─────────┴──────────┐
                       ▼                    ▼
                  DEBUG (replay)        ALERTS (predict)
                  "chunk 20 buried"     "cache-hit dropped → invalidator"
   "log the shape of the context, not just the answer"
```

- A "each call" arrow feeding a "CONTEXT BLACK BOX" record listing the logged fields, with two values flagged red (ret 6k, cache-hit 4%) as a visible regression.
- Two branches out: DEBUG (replay → "chunk 20 buried") and ALERTS (predict → "cache-hit dropped → invalidator").
- A caption: "log the shape of the context, not just the answer."
- Colors: charcoal #2c3e50 primary for the black box; signal-red #c0392b on the flagged regression values; amber accent on the ALERTS branch; warm paper background; Fraunces title, JetBrains Mono labels.
- Reinforces the black-box analogy: continuous recording enabling reconstruction.

## Cross-Links
- **SDLC Observability** (type: sdlc, label "SDLC Observability"): CLAUDE.md curriculum map maps M28 cross-link "SDLC Observability." Context observability feeds the AI-SDLC observability/monitoring practice (dashboards, SLOs, incident response). Reference in the alerting section.

## Lab Briefs

### Understand It: Diagnose a Regression from Logs
- Give the learner a set of context logs (per-call: per-layer tokens, cache-hit, output-correct flag) spanning a "good" week and a "bad" week; they query/aggregate to find what changed.
- They identify the regressing layer (retrieval token spike), the downstream effects (positioning + cache), and the root cause — purely from the logs.
- Expected output: an aggregation showing the per-layer token shift week-over-week, the cache-hit collapse, and a one-line root-cause diagnosis.
- Duration: ~25 minutes.

### Build It with AI: A Context Observability Logger + Dashboard
- With Claude, build an `observe(call)` decorator/wrapper that logs the per-call observability payload (PII-safe context hash, per-layer token breakdown, cost, latency, cache-hit, guardrail flags, tenant, request id), a `dashboard()` that aggregates per-layer token usage and cache-hit rate over time, and `alerts()` that fires on token climb / cache-hit drop / malformed-rate rise.
- Steps: wrap a UCC call to emit the payload → aggregate a per-layer token + cache-hit dashboard → add threshold alerts → simulate a top-k bump and confirm the dashboard shows the retrieval spike and the alert fires.
- Expected deliverable: an observability logger + dashboard + alerts, and a demo where injecting a regression is caught by the dashboard and the alert — making the invisible context window visible.
- Duration: ~40 minutes.

## Context Engineering Takeaway
You can only improve a context window you can see, so log the shape of every context — per-layer token breakdown, cache-hit, cost, latency, guardrail flags, and a PII-safe context hash — make it queryable for replay-debugging and alertable for regressions, because "the model is wrong" is not actionable but "the retrieval layer doubled and buried chunk 20" is.

## Anti-Patterns
1. No context logging — only the final answer is stored, so a wrong answer or cost spike is undebuggable.
2. Logging answers but not context shape — you can see what the model said but not what it saw, so you can't localize the cause.
3. No alerts on context metrics — token, cache-hit, malformed-rate, and guardrail signals logged but never watched, so regressions are found by users or the invoice.

## Continuity Notes
- **Builds on:** M00 (the five layers are the dashboard's axes), M03 (token budget made observable), M19 (cache-hit rate metric), M16 (positioning regressions show in logs), M20-M22 (guardrail flags and audit logging are observability payloads), M23 (tenant in the log). Opens Track 8 — production — by making everything measurable.
- **Referenced by:** M29 (you can't A/B test without observability to measure outcomes), M30 (versioning detects drift via observability), M31 (the capstone is instrumented). SDLC Observability formalizes the production monitoring practice.
