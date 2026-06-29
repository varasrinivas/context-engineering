# M22 Plan — Compliance Context: Audit Trails, PII Handling, Regulatory Requirements

## Module Identity
- **ID:** M22
- **Track:** 6 (Guardrails & Safety Context)
- **Title:** Compliance Context — Audit Trails, PII Handling, Regulatory Requirements
- **Subtitle:** Making the context window lawful — what's logged, what's masked, what's allowed where
- **Icon:** 📋
- **Color:** #c0392b (signal red)

## Everyday Analogy
**Hospital Patient Records Discipline**

A hospital handles the most sensitive data there is, and it survives audits because of disciplined rules, not good intentions. Every access to a chart is logged — who looked, when, why. Sensitive details are shown on a need-to-know basis; the billing clerk sees the codes, not the psychiatric notes. Records can't leave the country they're regulated in. And when a patient asks "who has seen my file and can you delete it?", the hospital can answer precisely. Compliance context is that same discipline applied to the LLM context window: log every access, mask what doesn't need to be in the clear, keep data where the law requires, and be able to prove all of it.

Mapping:
- Every chart access logged (who/when/why) → audit trail of what entered and left the context window
- Billing clerk sees codes, not psych notes → least-privilege / PII masking by need-to-know
- Records can't leave the regulated country → data residency
- "Who saw my file, and delete it" → the right to access/erasure (provenance + retention)
- Surviving the audit by discipline, not intentions → compliance is enforced design, not a promise

## Key Topics (5)
1. **Compliance is context engineering with legal force** — Every regulation (GDPR, HIPAA, SOC2, CCPA) imposes rules on what data may enter a system, how it's handled, who may see it, where it lives, and what must be provable. For an LLM, the context window is where all of that data flows — so compliance is a context-engineering discipline with legal consequences for getting it wrong.
2. **PII handling: masking, tokenization, minimization** — Personally identifiable information often shouldn't enter the window in the clear. Techniques: minimize (don't include what the task doesn't need — M03), mask/redact (replace SSN/EIN with a placeholder), tokenize (swap PII for a reversible token resolved outside the model). The model reasons over masked data; the clear values never touch the prompt or the logs. *(UCC domain example lives here.)*
3. **Audit trails: what entered and left the window** — Regulators ask "what did the system do, with what data, when, and on whose behalf?" An LLM audit trail logs the assembled context (or a hash/summary of it), the output, the user/tenant, timestamps, and any guardrail flags (M20/M21) — tamper-evident and queryable. You can't prove compliance you didn't log.
4. **Data residency and retention** — Where context is processed and stored is regulated (EU data must often stay in the EU). And how long you keep prompts, outputs, and logs has both legal minimums (audit) and maximums (right-to-erasure). Caching (M19) and memory (M13) intersect here — a cached prompt or a persistent profile is retained data.
5. **Provenance, consent, and the right to be forgotten** — Compliance needs to trace a fact back to its source (M11 provenance) and to honor consent and erasure: if a user withdraws consent or requests deletion, you must be able to find and remove their data from prompts, memory, caches, and logs. Designing for this from the start is far cheaper than retrofitting it.

UCC domain example appears in: Topic 2 — a UCC filing contains a debtor's EIN/SSN and a guarantor's personal address. The risk task needs the lien facts, not the raw SSN. Mask the SSN to a token before it enters the window, log the access (which analyst, which debtor, when) to the audit trail, keep the data in-region, and ensure the output (and the cache) never contain the SSN in the clear — so a regulator audit and a deletion request can both be satisfied.

## Sections Outline

### Section 1: content — "The Context Window Is a Regulated Data Flow"
- Reframe: every byte in the window may be regulated data. GDPR/HIPAA/SOC2/CCPA impose rules on what enters, who sees it, where it lives, and what's provable.
- The stakes: a context-engineering mistake here isn't a bug, it's a breach — fines, liability, lost trust.
- Thesis: compliance is enforced design over the context window, not a policy document you hope people follow.

### Section 2: content — "PII Handling and the Audit Trail"
- PII handling spectrum: minimize (M03 — don't include what isn't needed), mask/redact (placeholder), tokenize (reversible token resolved outside the model). The model reasons over masked data; clear values never hit the prompt, output, or logs.
- Audit trails: log the assembled context (or a hash), output, user/tenant, timestamp, guardrail flags (M20/M21) — tamper-evident and queryable. "You can't prove compliance you didn't log."
- UCC tie-in: mask the debtor's SSN to a token, log the access, keep the clear SSN out of the prompt and the cache.

### Section 3: content — "Residency, Retention, and the Right to Be Forgotten"
- Data residency: where context is processed/stored is regulated; route EU data to EU processing.
- Retention: legal minimums (keep audit logs) vs. maximums (delete on request). Caching (M19) and memory (M13) are retained data subject to these rules.
- Provenance + erasure: trace a fact to its source (M11), and be able to find and remove a user's data from prompts, memory, caches, and logs on a deletion request. Design for it up front. <span>[SDLC Compliance]</span>.

### Section 4: quiz — "The SSN in the Prompt"
- Question: "Your UCC risk pipeline sends the full filing — including the debtor's raw SSN — into the context window, and you log the full prompt for debugging. The risk task only needs the lien facts. A compliance review flags this. What's the core fix?"
- Options:
  - A. Encrypt the logs at rest and call it done
  - B. Apply data minimization and PII masking: strip/tokenize the SSN before it enters the window (the task doesn't need it), and ensure neither the prompt, the output, the cache, nor the audit log stores the SSN in the clear — while still logging the access (who/when/which debtor) for the audit trail
  - C. Stop logging anything, to avoid storing PII
  - D. Keep sending the SSN but add a note in the system prompt asking the model not to repeat it
  - correct: B (index 1)
- Explanation: The root problem is that clear-text PII the task doesn't need is flowing into the window AND into your logs. The fix is data minimization plus masking/tokenization: the SSN never enters the prompt in the clear (the model reasons over a token or it's simply removed), so it can't appear in the output, the cache, or the prompt logs. You still log the access metadata (analyst, debtor id, timestamp, guardrail flags) for the audit trail — logging isn't the enemy, logging *clear PII* is. Encrypting logs (A) still stores the SSN and doesn't address the prompt/cache; deleting all logs (C) destroys the audit trail you need; and asking the model nicely (D) leaves the SSN in the prompt, output, and logs regardless.

### Section 5: antipattern — "Compliance as an Afterthought"
- Anti-pattern 1: Clear-text PII in prompts and logs — sending and storing sensitive data the task didn't need, creating breach exposure and failing minimization.
- Anti-pattern 2: No audit trail (or an untrustworthy one) — unable to answer "what did the system do with whose data, when," so you can't prove compliance even if you were compliant.
- Anti-pattern 3: Retrofitting erasure — building memory, caching, and logging with no way to find and delete a user's data, so a single deletion request becomes an engineering crisis.

## SVG Diagram Plan
**"The Compliant Context Pipeline" — PII masked on the way in, access logged, residency enforced, erasable**

```
   RAW FILING (SSN, EIN, address)
        │  ┌─ MINIMIZE: drop fields the task doesn't need
   ┌────▼──┴──────────────┐
   │  PII MASK / TOKENIZE  │  SSN 123-45-6789 -> [SSN:tok_9f3]
   └────┬─────────────────┘  (clear value resolved OUTSIDE the model)
        ▼
   ┌──────────────────────┐
   │  CONTEXT WINDOW       │  reasons over MASKED data only
   └────┬─────────────────┘
        ▼  ┌─ AUDIT LOG: who · when · which debtor · flags (no clear PII)
   OUTPUT  ┤  ┌─ RESIDENCY: processed/stored in-region
           └──┤  ┌─ RETENTION + ERASURE: find & delete on request
              └──┘
   "log the access, not the secret — provable, in-region, erasable"
```

- A left-to-right pipeline: RAW FILING → MINIMIZE → PII MASK/TOKENIZE → CONTEXT WINDOW (reasons over masked data) → OUTPUT, with side-rails for AUDIT LOG, RESIDENCY, and RETENTION/ERASURE.
- The mask step shows `SSN 123-45-6789 → [SSN:tok_9f3]` with a note "clear value resolved OUTSIDE the model."
- The audit-log rail explicitly notes "who/when/which debtor/flags — NO clear PII."
- A residency lock icon and a retention/erasure "find & delete" note.
- Caption: "log the access, not the secret — provable, in-region, erasable."
- Colors: signal-red #c0392b primary for the compliance controls; amber accent on the tokenization step; a small lock for residency; warm paper background; Fraunces title, JetBrains Mono labels.
- Reinforces the hospital-records analogy: masked details, logged access, controlled residency, erasable on request.

## Cross-Links
- **SDLC Compliance** (type: sdlc, label "SDLC Compliance"): CLAUDE.md curriculum map maps M22 cross-link "SDLC Compliance." The context-side PII/audit/residency controls feed the AI-SDLC compliance process (DPIAs, data-handling policy, audit readiness). Reference in the residency/erasure section.

## Lab Briefs

### Understand It: Find the PII Leak Paths
- Give the learner a UCC risk pipeline that sends a raw filing (with SSN/EIN) into the window and logs the full prompt; they trace every place the clear SSN ends up: the prompt, the output, the cache (M19), the audit log, the memory store (M13).
- They classify each as a leak path and propose the minimal control (minimize, mask, tokenize, log-metadata-only).
- Expected output: a table (location → does clear PII land here? → control to apply) and the single highest-risk leak path, plus what a deletion request would require touching.
- Duration: ~25 minutes.

### Build It with AI: A PII-Masking + Audit Layer
- With Claude, build a compliance layer: `redact(filing)` that minimizes fields and tokenizes PII (SSN/EIN) to placeholders resolved by an out-of-model vault, an `audit(event)` that logs access metadata (user, debtor id, timestamp, guardrail flags) with NO clear PII, and an `erase(subject_id)` that removes a subject's data from the store/cache/logs.
- Steps: minimize → tokenize PII → assemble context over masked data → assert no clear PII in prompt/output/log → audit the access → demonstrate an erasure request removing all traces.
- Expected deliverable: a redact/audit/erase layer + a demo proving the SSN never appears in the prompt, output, cache, or audit log, the access is logged, and an erasure request cleanly removes a subject's data.
- Duration: ~40 minutes.

## Context Engineering Takeaway
Compliance is enforced design over the context window: minimize and mask PII so clear sensitive data never enters the prompt, output, cache, or logs; log the access (not the secret) into a tamper-evident audit trail; keep data in-region; and build for erasure from the start — because you can only prove the compliance you engineered.

## Anti-Patterns
1. Clear-text PII in prompts and logs — sending and storing sensitive data the task didn't need, creating breach exposure and failing data minimization.
2. No trustworthy audit trail — unable to answer "what did the system do with whose data, when," so compliance can't be proven.
3. Retrofitting erasure — memory, caching, and logging built with no way to find and delete a user's data, turning a deletion request into a crisis.

## Continuity Notes
- **Builds on:** M03 (minimization = the cheapest PII control), M11 (provenance — trace a fact to its source), M13 (memory is retained data), M19 (the cache is retained data), M20-M21 (guardrail flags are audit events). The legal-force layer over the Govern stage.
- **Referenced by:** M23 (multi-tenant isolation is a compliance control — one tenant's PII must not reach another), M28 (audit logging is an observability concern), M30 (versioning the data-handling policy), M31 (the capstone must be audit-ready). With M20 (input), M21 (output), and M22 (compliance), Track 6's governance story is nearly complete; M23 adds tenant isolation.
