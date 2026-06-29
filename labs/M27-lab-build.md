# M27 Lab: Build It with AI — An Escalation + Approval Loop

## Objective
With Claude, build an agent step that escalates *only when triggered*, hands the human a scoped brief (not the full log), injects the human's decision back into the agent state as authoritative, and logs it — while non-triggering steps proceed autonomously.

## Prerequisites
- Completed the M27 Understand It lab (you have the required brief fields)
- The M24 agent state and M22 audit concepts
- Python 3.10+ (Claude API optional — the loop logic is local)

## The Build (40 min)

### Step 1: Build the escalation logic with Claude (15 min)

Claude prompt to use:
```
"Write escalation.py for a UCC risk agent. Implement:
- needs_escalation(decision): return True if confidence < 0.7 OR the action is in a
  policy set requiring human authority (e.g. action in {'mark_exempt','waive_lien'}).
- escalation_brief(state): from the agent's FULL context (which includes a long
  investigation_log), assemble a SCOPED dict with exactly these keys:
  {decision, recommendation, confidence, why, evidence (a list of <=2 records with a
  source id each), options}. It must NOT include the raw investigation_log.
- apply_decision(state, human_decision): inject the human's choice back into the agent
  state as an authoritative field state['resolved'] = {by:'human', ...human_decision},
  overriding the agent's recommendation, and return the updated state.
- audit(log, brief, human_decision): append a record (timestamp, decision, evidence
  source ids, human choice + rationale) with NO raw log — to the audit list.
Return only the code."
```

Save as `escalation.py`.

### Step 2: Run a triggering decision (12 min)

Create `run_escalation.py`:
```python
from escalation import needs_escalation, escalation_brief, apply_decision, audit

# Agent state after a long investigation — note the big raw log.
state = {
  "goal": "score lien risk for ACME",
  "investigation_log": ["...step %d: verbose 250-token detail..." % i for i in range(12)],
  "decision": {"recommendation": "MEDIUM", "confidence": 0.55,
               "action": "score",
               "why": "2 active liens but filing 0019 termination pending; "
                      "filing 0022 suggests a related entity",
               "evidence": [{"id":"filing-0019","note":"termination pending"},
                            {"id":"filing-0022","note":"shared address"}],
               "options": ["confirm MEDIUM","override HIGH","request more data"]},
}
audit_log = []

if needs_escalation(state["decision"]):
    brief = escalation_brief(state)
    # The brief must be SMALL — the raw log is excluded.
    import json
    assert "investigation_log" not in json.dumps(brief), "brief leaked the raw log!"
    print("ESCALATION BRIEF:", json.dumps(brief, indent=2))
    print("brief size (chars):", len(json.dumps(brief)),
          "vs full state:", len(json.dumps(state)))

    # Simulate the human deciding in seconds.
    human = {"choice": "override HIGH", "rationale": "related entity adds exposure"}
    state = apply_decision(state, human)
    audit(audit_log, brief, human)

print("\nresolved:", state.get("resolved"))
print("audit entries:", audit_log)
```

Run it: `python run_escalation.py`

**Expected behavior:**
- The brief prints with only the scoped fields; the assertion passes (no raw log in the brief), and the brief is far smaller than the full state.
- After `apply_decision`, `state['resolved']` shows the human's `override HIGH` overriding the agent's MEDIUM — the decision flowed back authoritatively.
- The audit log has one entry with the decision, evidence source ids, and the human's rationale — no raw log.

### Step 3: Confirm autonomous handling of non-triggers (8 min)

Create `no_escalation.py`:
```python
from escalation import needs_escalation

clear = {"recommendation": "HIGH", "confidence": 0.95, "action": "score",
         "why": "5 verified active liens", "evidence": [], "options": []}
assert not needs_escalation(clear), "should NOT escalate a confident, in-policy decision"
print("confident in-policy decision -> agent proceeds autonomously (no human needed)")
```
Run it. **Expected:** a high-confidence, in-policy decision does *not* escalate — the agent proceeds on its own. (Escalating everything would defeat the agent.)

### Step 4: Prove the three properties (5 min)

State the three checks that define a good human-in-the-loop step, and confirm each from your run:
1. **Triggered, not always** — only low-confidence/policy decisions escalate.
2. **Scoped, not dumped** — the brief excludes the raw log and is dramatically smaller than full state.
3. **Looped back + logged** — the human's decision overrides the agent's and is recorded in the audit trail.

## Deliverable
A `m27-lab/` folder containing:
- `escalation.py` — `needs_escalation`, `escalation_brief` (scoped, no raw log), `apply_decision` (authoritative injection), `audit`
- `run_escalation.py` — a triggering decision producing a compact brief, a human override injected back, and an audit entry
- `no_escalation.py` — a confident in-policy decision handled autonomously
- A short note confirming: triggered-not-always, scoped-not-dumped, looped-back-and-logged

You can now hand a human exactly the context they need to decide — and close the loop so their decision governs the agent.

## Stretch Goals
- Add an LLM step (Claude) that *generates* the brief's `why` as a one-sentence summary from the raw investigation_log (M18 abstractive), with a check that it stays under N words.
- Add a "summarize the run" function that produces a post-hoc reviewer brief of an entire completed agent run (M12/M18) for after-the-fact audit.
- Wire the audit log to be tamper-evident (hash-chain, from M22) so the approval trail can't be quietly altered.

## Connection to Next Module
Track 7 is complete — agent loop context (M24), planning (M25), multi-agent sharing (M26), and human-in-the-loop (M27). Track 8 (Production & Evaluation) ships it: M28 (Context Observability) is about seeing what's actually in your context windows in production — logging, debugging, and token analysis — so you can measure and improve everything you've built across all 8 tracks.
