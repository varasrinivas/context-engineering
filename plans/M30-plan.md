# M30 Plan — Context Versioning: Managing Context Drift Across Releases

## Module Identity
- **ID:** M30
- **Track:** 8 (Production & Evaluation)
- **Title:** Context Versioning — Managing Context Drift Across Releases
- **Subtitle:** Treating prompts and context strategies as versioned code — drift, regression detection, and safe migration
- **Icon:** 🔖
- **Color:** #2c3e50 (charcoal)

## Everyday Analogy
**Software Release Discipline — for Prompts**

Nobody edits production source code live in the browser, saves, and hopes. Code goes through version control (every change tracked, attributable, revertible), a changelog (what changed and why), a test suite that gates the release (regressions block the merge), and a tagged version you can roll back to. Now look at how most teams treat their system prompts: edited ad hoc in a config, no history, no tests, no rollback — the exact chaos software engineering spent decades eliminating. Context versioning brings that hard-won release discipline to prompts and context strategies: they are code, and they deserve version control, a changelog, regression gates, and the ability to roll back.

Mapping:
- Source code under version control → prompts and context strategies under version control
- The changelog (what changed, why) → a record of every context change and its rationale
- The test suite gating the merge → the eval set (M29) run as a regression gate on every change
- A tagged release you can roll back to → a versioned, pinned context strategy you can revert
- Editing prod live and hoping → editing the system prompt ad hoc with no history or tests
- A silent regression slipping into prod → context drift degrading quality unnoticed across releases

## Key Topics (5)
1. **Context as code** — A system prompt, a retrieval config, an ordering rule, a compression policy — these are *code*: they change behavior, they have bugs, they regress. Treating them as untracked configuration is the root cause of context chaos. The discipline: version them, attribute changes, and gate them like any other code.
2. **Context drift — the silent degradation** — Over many small, unmeasured changes, a context strategy degrades: a prompt edit here, a k bump there, an example added, a guardrail tweaked. No single change looked bad, but the cumulative drift erodes quality, raises cost, or weakens safety. Drift is the slow leak that observability (M28) detects and versioning prevents. *(UCC domain example lives here.)*
3. **Regression detection as a release gate** — Every context change runs against the eval set (M29) before it ships: if accuracy drops, cost spikes, malformed-rate rises, or a safety check regresses, the change is blocked. The eval set becomes a CI gate — the test suite for context. This is what stops drift from reaching production.
4. **Migration strategies** — Changing a context strategy in production needs care: pin versions per request, roll out gradually (canary / traffic split — M29 online), keep the old version available for rollback, and migrate state (memory M13, cached prefixes M19) that's tied to the old prompt. A breaking prompt change is a migration, not an edit.
5. **Changelogs, attribution, and reproducibility** — Every context version carries: what changed, why, who, the eval results at the time, and the version id stamped into observability logs (M28). This makes a regression *attributable* ("the drop started at prompt v37") and the system *reproducible* (you can recreate exactly what produced a past output — also a compliance/audit need, M22).

UCC domain example appears in: Topic 2 — over a quarter, the UCC risk prompt got 14 untracked edits. Accuracy slid from 94% to 88% and nobody knew why. With context versioning: each edit is a version with eval results; the regression gate would have *blocked* the v31 edit that dropped accuracy 3% (someone removed an edge-case example, M07); the observability logs (M28) stamp the prompt version so the drift is traceable to specific releases; and rolling back to v30 is one command.

## Sections Outline

### Section 1: content — "Your Prompt Is Code — Treat It That Way"
- A system prompt / retrieval config / ordering rule changes behavior, has bugs, and regresses — it's code, not configuration.
- The chaos of untracked context: edited ad hoc, no history, no tests, no rollback — the exact problems version control solved for software.
- Thesis: bring release discipline (version control, changelog, regression gates, rollback) to context.

### Section 2: content — "Context Drift and the Regression Gate"
- Context drift: many small unmeasured changes accumulate into silent degradation (quality, cost, safety). No single change looked bad; the cumulative effect is the leak.
- Regression detection as a release gate: every change runs against the eval set (M29); a drop in accuracy/cost/safety blocks the merge. The eval set is the CI test suite for context.
- UCC tie-in: the 14 untracked edits sliding accuracy 94%→88%, and the gate that would have blocked the bad v31.

### Section 3: content — "Migration, Changelogs, and Reproducibility"
- Migration: pin versions per request, roll out gradually (canary/traffic split), keep old versions for rollback, migrate dependent state (memory M13, cached prefixes M19). A breaking prompt change is a migration.
- Changelogs + attribution: each version records what/why/who + eval results; the version id is stamped into observability (M28). Regressions become attributable ("started at v37") and outputs reproducible (compliance/audit, M22). <span>[SDLC CI/CD]</span>.

### Section 4: quiz — "Why Did Accuracy Slide All Quarter?"
- Question: "Your UCC risk prompt has had ~14 ad hoc edits this quarter, with no history or tests. Accuracy slid 94%→88% and nobody can say which change caused it or how to undo it. What's the systemic fix?"
- Options:
  - A. Rewrite the prompt from scratch and hope it's better
  - B. Treat context as code: put prompts/strategies under version control with changelogs, run the eval set (M29) as a regression GATE on every change so a quality/cost/safety drop blocks the merge, stamp the version into observability logs (M28) so regressions are attributable, and keep versions rollback-able
  - C. Freeze the prompt and never change it again
  - D. Add more examples to the prompt to push accuracy back up
  - correct: B (index 1)
- Explanation: The 94%→88% slide is context drift — the cumulative effect of many small, untracked, untested changes. A from-scratch rewrite (A) discards working behavior and has no guard against the same drift recurring; freezing (C) blocks all improvement; blindly adding examples (D) is another untested change that could drift further. The systemic fix is release discipline: version prompts/strategies with changelogs, gate every change on the eval set so a regression is blocked before it ships, stamp the version into observability so a future slide is attributable to a specific release, and keep the ability to roll back. That converts ad hoc editing into a managed, reproducible, reversible process.

### Section 5: antipattern — "Editing Production Live"
- Anti-pattern 1: Untracked prompt edits — changing the system prompt in a config with no version, changelog, or rollback, so drift accumulates invisibly and is un-attributable.
- Anti-pattern 2: No regression gate — shipping context changes without running the eval set, so a quality/cost/safety regression reaches production undetected.
- Anti-pattern 3: Breaking changes without migration — swapping the prompt while old cached prefixes (M19) and memory tied to it (M13) persist, or with no rollback path, causing inconsistency and no way back.

## SVG Diagram Plan
**"Context Release Pipeline" — a prompt change passing through version control, the eval gate, and rollout (or blocked)**

```
   PROMPT CHANGE (v30 → v31)
        │  changelog: who · what · why
        ▼
   ┌──────── EVAL GATE (the eval set, M29) ────────┐
   │  accuracy 94% → 91% (−3%)   ✕ REGRESSION       │
   └───────────────┬───────────────────────────────┘
          blocked ◄┘                  passed ─▶ tag v31 · roll out (canary)
                                                  └ version stamped in logs (M28)
   on drift: "the slide started at v37" — attributable & rollback-able
   "your prompt is code — version it, gate it, roll it back"
```

- A "prompt change v30→v31" with a changelog feeding an EVAL GATE box (runs the M29 eval set).
- Two outcomes: a regression (accuracy −3%, red ✕ → BLOCKED) and a pass (green → tag version, canary rollout, version stamped into observability logs).
- A drift annotation: "the slide started at v37 — attributable & rollback-able."
- A caption: "your prompt is code — version it, gate it, roll it back."
- Colors: charcoal #2c3e50 primary for the pipeline; signal-red #c0392b on the blocked regression; green-ish on the passed/rollout path; amber accent on the version-stamp/changelog; warm paper background; Fraunces title, JetBrains Mono labels.
- Reinforces the software-release-discipline analogy: VCS → CI gate → tagged release/rollback.

## Cross-Links
- **SDLC CI/CD** (type: sdlc, label "SDLC CI/CD"): CLAUDE.md curriculum map maps M30 cross-link "SDLC CI/CD." Context versioning plugs into the AI-SDLC CI/CD pipeline — prompts in version control, eval gates in CI, tagged releases, rollback. Reference in the regression-gate section.

## Lab Briefs

### Understand It: Reconstruct the Drift
- Give the learner a version history of a UCC prompt (v25–v40) with the eval-set accuracy recorded at each version; they find which version introduced the regression and what the changelog says changed there.
- They identify the bad version, the cumulative drift, and which versions to roll back to.
- Expected output: a version→accuracy table with the regressing version flagged, the changelog entry that caused it, and the rollback target — showing how versioning makes drift attributable.
- Duration: ~25 minutes.

### Build It with AI: A Versioned Prompt Registry with a Regression Gate
- With Claude, build a context version registry: `register(version, prompt, changelog)` storing prompts with metadata; a `gate(candidate, eval_set, baseline)` that runs the eval set (reuse M29) and BLOCKS the candidate if accuracy/cost/safety regresses vs. the baseline; a `rollback(version)`; and version stamping that returns the active version id for observability logs.
- Steps: register a baseline → submit a regressing candidate and confirm the gate blocks it → submit an improving candidate and confirm it passes and becomes active → stamp the active version into a log entry → demonstrate a one-call rollback.
- Expected deliverable: a versioned registry + regression gate that blocks a bad change and admits a good one, with version-stamped logs and a working rollback — context managed as code.
- Duration: ~40 minutes.

## Context Engineering Takeaway
Prompts and context strategies are code, so manage them with release discipline: version every change with a changelog, gate it against the eval set so a regression is blocked before it ships, stamp the version into your observability so drift is attributable to a specific release, and keep every version rollback-able — because silent context drift is what erodes a working system one untracked edit at a time.

## Anti-Patterns
1. Untracked prompt edits — changing the system prompt with no version, changelog, or rollback, so drift accumulates invisibly and is un-attributable.
2. No regression gate — shipping context changes without running the eval set, so a quality/cost/safety regression reaches production undetected.
3. Breaking changes without migration — swapping the prompt while old cached prefixes and memory tied to it persist, or with no rollback path.

## Continuity Notes
- **Builds on:** M29 (the eval set becomes the regression gate), M28 (the version id is stamped into observability so drift is attributable), M19 (cached prefixes are version-bound — a prompt change invalidates the cache), M13 (memory tied to a prompt version), M22 (reproducibility for audit). The change-management discipline of production.
- **Referenced by:** M31 (the capstone is a versioned, gated, observable pipeline). With M28 (observe), M29 (evaluate), and M30 (version/gate), Track 8's production discipline is complete and M31 assembles it all. SDLC CI/CD formalizes the release pipeline.
