# M27 Plan — Human-in-the-Loop Context: Approval Flows, Escalation, Handoffs

## Module Identity
- **ID:** M27
- **Track:** 7 (Agent Context Patterns)
- **Title:** Human-in-the-Loop Context — Approval Flows, Escalation, Handoffs
- **Subtitle:** Handing a person exactly the right scoped context to decide quickly and correctly
- **Icon:** 🧑‍⚖️
- **Color:** #1a5276 (steel)

## Everyday Analogy
**The Junior Analyst Flagging a Suspicious Transaction**

A good junior analyst doesn't dump a 200-page transaction log on the senior partner's desk and say "is this fraud?" Nor do they silently approve a transaction they're unsure about. They escalate well: a one-page brief — "Flagging txn #4471: $2M wire to a new offshore account, debtor has 3 recent liens, here's why it looks off, here are the two records I'm relying on. Recommend HOLD; need your approval." The senior partner can decide in two minutes because the junior handed them exactly the right context: the decision, the why, the evidence, and the options. Human-in-the-loop context is that briefing discipline — an agent escalating to a person must package the decision context so the human can act fast and correctly, not drown.

Mapping:
- The junior analyst → the agent that hit a decision it shouldn't make alone
- The senior partner → the human reviewer/approver
- Dumping the 200-page log → handing the human the agent's full raw context (drowning them)
- Silently approving → the agent acting unilaterally on a high-stakes/uncertain decision
- The one-page brief → the scoped escalation context (decision + why + evidence + options)
- Deciding in two minutes → the human acting fast because the context was shaped for them

## Key Topics (5)
1. **When to involve a human — the escalation trigger** — Not every step needs a human, and not every step can be left to the agent. Triggers: high stakes (irreversible/expensive actions), low confidence, policy boundaries (M05 — actions requiring authority the agent lacks), and ambiguity. Designing *when* to escalate is as important as how.
2. **Escalation context: a decision brief, not a data dump** — When an agent escalates, it must hand the human a scoped brief: the decision to make, the recommendation + confidence, the *why*, the few pieces of evidence (with provenance, M11), and the options. This is M10/M18 shaping aimed at a human reader, who has even less patience than a model for irrelevant context. *(UCC domain example lives here.)*
3. **Approval flows and decision injection** — The human's decision must flow *back into* the agent's context as authoritative input (a developer/operator-tier instruction, M05). Approve / reject / modify, with the decision and any human rationale injected into the loop so the agent proceeds correctly. The approval is a context event, logged for audit (M22).
4. **Context handoff — agent to human and back** — A handoff transfers enough state for the human to take over (or spot-check) and for the agent to resume after: the goal, the plan/progress (M24/M25), what's been done, and the specific open question. Bidirectional: the human's added context (a correction, extra knowledge) re-enters the agent's state.
5. **Summarizing a long run for a human reviewer** — Often the human reviews *after* a long agent run, not mid-step. Summarizing the run — what the agent did, key decisions, evidence, and anything uncertain — into a reviewable brief is its own context-shaping task: hierarchical summarization (M12/M18) aimed at human audit and accountability.

UCC domain example appears in: Topic 2 — an agent scoring a borderline debtor reaches low confidence (conflicting signals: 2 active liens but a pending termination, and a possible related-party match). Instead of guessing or dumping its whole investigation, it escalates a brief to the analyst: "Borderline: ACME — recommend MEDIUM (confidence 0.55). Why: 2 active liens but one termination pending (filing 0019), and a possible related entity (shared address, filing 0022). Evidence: [2 filing IDs]. Options: confirm MEDIUM / override to HIGH / request more data." The analyst decides in seconds; the decision is injected back and logged.

## Sections Outline

### Section 1: content — "Knowing When to Ask, and How to Ask Well"
- Two failure modes bracket the goal: the agent that never asks (acts unilaterally on high-stakes/uncertain decisions) and the agent that asks badly (dumps its full context on the human).
- Escalation triggers: high stakes, low confidence, policy/authority boundaries (M05), ambiguity. Design when to escalate.
- Thesis: human-in-the-loop is a context-shaping problem — package the decision for a busy human.

### Section 2: content — "The Escalation Brief and the Approval Loop"
- The escalation context: decision + recommendation + confidence + why + scoped evidence (with provenance) + options. Shaped (M10/M18) for a human reader who wants the one-pager, not the log.
- Approval flow: the human's decision (approve/reject/modify + rationale) is injected back into the agent's context as authoritative (M05 tier) and logged (M22). The agent resumes correctly.
- UCC tie-in: the borderline-debtor escalation brief and the decision injected back.

### Section 3: content — "Handoff and Summarizing the Run"
- Context handoff: transfer enough state (goal, plan/progress M24/M25, what's done, the open question) for the human to act and the agent to resume. Bidirectional — the human's added context re-enters the loop.
- Summarizing a long run for review: hierarchical summarization (M12/M18) of what the agent did, key decisions, evidence, and uncertainties — a reviewable brief for human audit and accountability (M22). <span>[Agent M15]</span> covers the approval mechanics.

### Section 4: quiz — "How Should the Agent Escalate?"
- Question: "Your UCC agent hits a borderline debtor — conflicting signals, confidence 0.55 — and needs an analyst's call. It could (a) guess and proceed, (b) send the analyst its entire 12-step investigation log, or (c) send a one-page brief. What makes a good escalation, and why?"
- Options:
  - A. (a) — the agent should be autonomous and just decide; escalation slows things down
  - B. (c) a scoped decision brief: the decision, the recommendation + confidence, the why, a few pieces of evidence with provenance, and the options — so the human can decide fast and correctly, with the decision injected back into the agent's context and logged
  - C. (b) — send the full log so the human has complete information and nothing is hidden
  - D. Escalate every single step to the human to be safe
  - correct: B (index 1)
- Explanation: Good escalation is a briefing, not a data dump or a guess. Guessing on a high-uncertainty, consequential decision (a) is the unilateral-action failure; sending the full 12-step log (b) drowns the human in irrelevant context and slows the decision — the human has even less patience than a model for noise. The right move is a scoped brief — decision, recommendation + confidence, why, scoped evidence with provenance (M11), and options — shaped for a busy human (M10/M18), with the human's decision injected back as authoritative context (M05) and logged for audit (M22). Escalating everything (D) defeats the point of an agent.

### Section 5: antipattern — "Bad Handoffs"
- Anti-pattern 1: The silent unilateral agent — acting on high-stakes or low-confidence decisions without escalating, so a person finds out only after the harm.
- Anti-pattern 2: The data-dump escalation — handing the human the agent's full raw context/log, so the human can't find the decision and either rubber-stamps or stalls.
- Anti-pattern 3: One-way handoff — escalating but not injecting the human's decision/rationale back into the agent's context (or not logging it), so the agent ignores the answer or there's no audit trail.

## SVG Diagram Plan
**"The Escalation Brief and the Approval Loop" — agent → scoped brief → human → decision injected back**

```
   AGENT (low confidence at a high-stakes step)
        │  full investigation context (12 steps, raw)
        ▼  ── SHAPE for a human ──
   ┌──────────────── ESCALATION BRIEF ────────────────┐
   │ DECISION: risk for ACME?                          │
   │ RECOMMEND: MEDIUM (confidence 0.55)               │
   │ WHY: 2 liens but 1 termination pending; poss. rel.│
   │ EVIDENCE: [filing 0019] [filing 0022]  (provenance)│
   │ OPTIONS: confirm MEDIUM · override HIGH · get more │
   └──────────────────────┬───────────────────────────┘
                          ▼
                    👤 HUMAN decides (seconds)
                          │ approve / modify + rationale
                          ▼
   DECISION INJECTED back into agent context (authoritative, logged)
        │
        ▼  agent resumes correctly
   "brief the decision, inject the answer, log it"
```

- Top: AGENT with its full raw context, an arrow "SHAPE for a human" into a prominent ESCALATION BRIEF box listing Decision / Recommend+confidence / Why / Evidence(provenance) / Options.
- The brief flows to a HUMAN icon ("decides in seconds"), whose decision (approve/modify + rationale) is "injected back" into the agent's context (an authoritative tier, logged).
- The agent then "resumes correctly."
- A caption: "brief the decision, inject the answer, log it."
- Colors: steel #1a5276 primary for the agent/loop; amber #b8860b accent on the ESCALATION BRIEF (the shaped artifact) and the injected decision; a human icon; warm paper background; Fraunces title, JetBrains Mono labels.
- Reinforces the junior-analyst-brief analogy directly.

## Cross-Links
- **Agent M15** (type: agent, label "Agent M15 — Approval Flows"): CLAUDE.md table maps M27↔Agent M15 (CE = escalation context; Agent = approval flows). This module shapes the escalation context; the Agent course covers the approval mechanics. Reference in the approval-loop section.

## Lab Briefs

### Understand It: Critique Three Escalations
- Give the learner three versions of an agent escalating the same borderline UCC decision: (a) a silent auto-decision, (b) a full 12-step log dump, (c) a scoped one-page brief; they evaluate each on human decision speed, correctness risk, and accountability.
- They identify what the good brief includes (decision, recommendation+confidence, why, scoped evidence with provenance, options) and what the bad ones lack or bury.
- Expected output: a 3-row critique table + the minimal set of fields a good escalation brief must contain.
- Duration: ~25 minutes.

### Build It with AI: An Escalation + Approval Loop
- With Claude, build an agent step that, on an escalation trigger (low confidence or a policy boundary), assembles a scoped `escalation_brief(state)` (decision, recommendation+confidence, why, top-2 evidence with provenance, options) from the agent's full context, presents it for a human decision, then injects the decision back into the agent state as authoritative and logs it (M22).
- Steps: define the trigger → shape the brief from full context (drop the raw log) → simulate a human approve/modify+rationale → inject the decision back into agent state → log the approval → confirm the agent resumes with the human's call and that a non-triggering step proceeds autonomously.
- Expected deliverable: an escalation/approval loop + a demo showing a compact brief (not the full log), the human decision injected back authoritatively, an audit log entry, and autonomous handling of non-escalated steps.
- Duration: ~40 minutes.

## Context Engineering Takeaway
Human-in-the-loop is a context-shaping discipline: detect when a decision needs a person, hand them a scoped brief — decision, recommendation, confidence, why, evidence with provenance, and options — not the agent's raw log, then inject their decision back into the agent's context as authoritative and log it, so the human decides fast and correctly and the agent resumes on their call.

## Anti-Patterns
1. The silent unilateral agent — acting on high-stakes or low-confidence decisions without escalating, so a person finds out only after the harm.
2. The data-dump escalation — handing the human the agent's full raw context, so they can't find the decision and either rubber-stamp or stall.
3. One-way handoff — escalating but not injecting the human's decision back into the agent's context or not logging it, so the answer is ignored or unauditable.

## Continuity Notes
- **Builds on:** M10/M18 (shaping the brief), M11 (evidence provenance), M05 (the human decision is an authoritative tier injected into context), M24/M25 (handoff transfers the agent's state/plan), M12/M18 (summarizing a long run), M22 (logging the approval). The human dimension of agent context.
- **Referenced by:** M31 (the capstone includes human review of agent decisions). Agent M15 covers the approval flow this module's context shaping serves. Closes Track 7 — agent patterns; Track 8 turns to production, evaluation, and the capstone.
