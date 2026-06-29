# M31 Capstone Lab: Build It with AI — Assemble the End-to-End Pipeline

## Objective
With Claude, assemble the artifacts you built across the entire course into one working `UCCRiskPipeline.score(request)`, run it against an eval set, report the system-level benchmark scorecard — then break one seam and watch the scorecard catch the regression. This is the course, assembled.

## Prerequisites
- Completed the entire course (M00–M30) — you'll reuse modules' lab artifacts
- The `ucc-sandbox/` and the labs from M04, M08–M11, M13/M15, M16/M18, M19, M20–M22, M24, M27, M28–M30
- Claude API access, Python 3.10+ with `anthropic`

## The Build (60 min)

### Step 1: Inventory your artifacts (8 min)

You're not writing from scratch — you're *composing*. Map each pipeline stage to the lab artifact that implements it:

| Stage | From module | Artifact |
|-------|-------------|----------|
| architected system prompt | M04 | `architected_prompt.txt` |
| hybrid retrieve + rerank | M08/M09 | `retrievers.py`, `rerank.py` |
| shape tool result | M10 | `shaper.py` |
| fuse sources | M11 | `fusion.py` |
| memory + user model | M13/M15 | `memory.py`, `user_model.py` |
| position + compress | M16/M18 | `assemble.py` (position_aware), `compress.py` |
| cached prefix | M19 | `prompt_builder.py` |
| input guardrails | M20 | `guard.py` |
| schema-enforced output | M21 | `score.py` (validate_and_retry) |
| PII redact + audit | M22 | `compliance.py` |
| agent loop | M24 | `agent_state.py` |
| escalation | M27 | `escalation.py` |
| observability | M28 | `observe.py` |
| eval + gate + version | M29/M30 | `ab_eval.py`, `gate.py`, `registry.py` |

(If you skipped some labs, stub those stages — the point is the composition and the seams.)

### Step 2: Compose the pipeline with Claude (20 min)

Claude prompt to use:
```
"Write pipeline.py with a UCCRiskPipeline class that composes a UCC risk decision in
lifecycle order (assemble -> position -> govern -> call -> govern-out), wrapped in
observability and an agent loop. Implement score(request) to:
1. ASSEMBLE: build the architected system prompt; hybrid-retrieve + rerank filings to
   top-5; shape the debtor-history tool result; fuse the sources; load the analyst's
   memory/profile.
2. POSITION + COMPRESS: compress fused facts to a token budget (fidelity-checked so
   active-lien IDs survive); position the highest-priority facts at the edges.
3. GOVERN-IN: run input guardrails (injection defense + canary); redact PII to tokens.
4. CALL: use a cached stable system prefix; enforce the risk output schema with a
   validate-and-retry loop and a safe default.
5. GOVERN-OUT: validate; write an audit record (access metadata, no clear PII) stamped
   with the prompt version.
Wrap score() in an observability logger (per-layer tokens, cost, cache-hit, version) and
an agent loop that escalates to a (stubbed) human when confidence < 0.7.
Import/stub the per-stage artifacts. Read ANTHROPIC_API_KEY from the env.
Return only the code, heavily commented with the module each stage came from."
```

Save as `pipeline.py`.

### Step 3: Run it and report the scorecard (16 min)

Create `scorecard.py`:
```python
from pipeline import UCCRiskPipeline
from ab_eval import make_eval_set   # M29

EVAL = make_eval_set(100)           # labeled, incl. edge/borderline/disqualifying-lien cases
pipe = UCCRiskPipeline()

correct = cost = cache_hits = leak_fails = audit_complete = 0
for item in EVAL:
    out, telemetry = pipe.score_observed(item["request"])
    correct        += (out["risk"] == item["gold_risk"])
    cost           += telemetry["cost"]
    cache_hits     += telemetry["cache_hit"]
    leak_fails     += telemetry["pii_in_output"]      # must be 0
    audit_complete += telemetry["audit_written"]

n = len(EVAL)
print("=== SYSTEM BENCHMARK SCORECARD ===")
print(f"accuracy:         {correct/n:.1%}        (eval set, M29)")
print(f"cost / request:   ${cost/n:.5f}          (M03)")
print(f"cache-hit rate:   {cache_hits/n:.0%}      (M19)")
print(f"PII leak tests:   {n-leak_fails}/{n} pass (M22)")
print(f"audit complete:   {audit_complete}/{n}    (M22)")
```

Run it. **Expected:** a scorecard where accuracy is high, cost is bounded, cache-hit is high (stable prefix), PII-leak tests are 100% pass, and audit is complete for every request. The system meets its targets — *that's* "done," not any single technique.

### Step 4: Break a seam and catch it (16 min)

Now demonstrate the capstone's core lesson — seam failures and the disciplines that catch them.

```python
# Disable reranking: now top-20 raw chunks flow in (the M09 x M16 x M19 seam from the module).
pipe_broken = UCCRiskPipeline(rerank=False, top_k=20)

# Re-run the scorecard with the eval GATE (M30) comparing against the good baseline.
from gate import gate
baseline_acc = 0.92
broken_acc, broken_cache, broken_cost = run_scorecard(pipe_broken, EVAL)   # your helper
g = gate("pipeline-no-rerank", EVAL, baseline_accuracy=baseline_acc)
print(f"\nBROKEN: accuracy {broken_acc:.1%}, cache-hit {broken_cache:.0%}, cost up")
print("eval gate verdict:", g["verdict"])
assert g["verdict"] == "BLOCKED", "the seam regression should be blocked by the gate"
```

**Expected:** disabling rerank pulls 20 unranked chunks → the disqualifying filing lands mid-context (accuracy drops, M16), and the larger/varying prefix collapses cache-hit and raises cost (M19). Observability (M28) shows the retrieval-layer spike; the eval gate (M30) **BLOCKS** the change. The system's production disciplines caught an integration failure that each component, alone, would have passed — exactly the M31 quiz scenario, reproduced.

## Deliverable
A `m31-capstone/` folder containing:
- `pipeline.py` — `UCCRiskPipeline.score()` composing all eight tracks in lifecycle order, observed, looped, and version-stamped
- `scorecard.py` — the system benchmark scorecard (accuracy / cost / cache-hit / PII-leak / audit)
- A broken-seam run where observability surfaces the regression and the eval gate blocks it
- A short write-up: the pipeline meets its production benchmarks; a single disabled seam (rerank) regresses the *system* across accuracy, cost, and cache — caught by T8 disciplines, not by any component test

**You have built a production context engineering pipeline** — assembled, positioned, governed, agent-driven, observed, evaluated, and versioned — over the UCC lien-risk domain. That is the whole course, in one system.

## Stretch Goals
- Add the human-in-the-loop path end to end: route the borderline eval cases through `escalation_brief` (M27) and confirm they're escalated, not guessed.
- Add multi-tenant isolation (M23) to the pipeline and run a cross-tenant leakage test as part of the scorecard.
- Wire the whole thing to the version registry (M30): bump the prompt version, run the gate, and only promote if the scorecard holds — a real release.

## Connection to the Rest of the Curriculum
This capstone is the context-quality view of a UCC pipeline. The **[Agent Capstones]** build the same domain from the agent-construction side (the tool-use loop, orchestration), and the **AI-SDLC Series** wraps both in enterprise process (DPIAs, CI/CD, observability SLOs). Context Engineering is the foundational pillar — what you assemble, position, optimize, and govern in the window — and you've now carried it from "what is a token" (M01) to a governed production system. That's the discipline, completed.
