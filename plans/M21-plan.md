# M21 Plan — Output Shaping Context: Format Control, Constraint Specification

## Module Identity
- **ID:** M21
- **Track:** 6 (Guardrails & Safety Context)
- **Title:** Output Shaping Context — Format Control, Constraint Specification
- **Subtitle:** Designing what comes out of the window — contracts, schema enforcement, and validation-retry loops
- **Icon:** 🧊
- **Color:** #c0392b (signal red)

## Everyday Analogy
**The Metal Casting Mold**

Molten metal will take literally any shape — that's its power and its problem. If you just pour it on the floor, you get a useless puddle. To get a usable part, you pour it into a **mold**: the shape is decided in advance, the mold constrains the metal as it sets, and you inspect the cast part afterward and re-pour the rejects. A model's output is molten metal: enormously capable, but shapeless until you constrain it. Output shaping is the mold — you specify the exact shape (a schema), you constrain generation toward it (structured outputs / format control), and you validate the result and retry the ones that didn't set right.

Mapping:
- Molten metal taking any shape → the model's free-form, capable-but-unstructured output
- Pouring on the floor → no output contract; a useless free-text puddle
- The mold's pre-decided shape → the output schema / contract you specify up front
- The mold constraining the metal as it sets → structured outputs / format control during generation
- Inspecting the cast and re-pouring rejects → validation and the retry loop
- A consistent part every pour → reliable, parseable output across thousands of calls

## Key Topics (5)
1. **Output is context too — the other half of the window** — Every track so far shaped what goes *in*. The output is the other governed boundary: what comes out must be parseable, safe, and consistent for the next system to consume. Output shaping is context engineering applied to the exit, not just the entrance.
2. **The output contract** — Specify the exact shape up front: a JSON schema, required fields, types, enums, and what to do on uncertainty (null, a flag). A contract turns "hope it's parseable" into "guaranteed shape or a caught failure." (Connects to M04's output-contract section.)
3. **Format control: from prompting to enforcement** — A spectrum: ask nicely in the prompt (weak), give a canonical example (M07, better), use structured-output/JSON-schema enforcement (strong — the model is constrained to valid output), use a tool/function schema with strict validation. Stronger enforcement = fewer parse failures. *(UCC domain example lives here.)* Note: structured outputs are the modern replacement for assistant prefill (M19/M20).
4. **Constraint specification beyond shape** — Constraints aren't only structural. Value constraints (risk must be one of LOW/MEDIUM/HIGH), length caps, "cite a source for every claim," "never emit PII in the clear" (sets up M22). The output contract encodes business and safety rules, not just JSON keys.
5. **The validation-retry loop** — Even with enforcement, validate the output against the contract; on failure, retry with the error fed back ("your output failed validation because X; fix it"). A bounded retry loop with a final safe fallback turns occasional malformed output into a caught, handled event rather than a downstream crash.

UCC domain example appears in: Topic 3 — a risk-scoring call whose output must be strictly `{"risk": "LOW|MEDIUM|HIGH", "verified_lien_count": int, "flags": []}`. Prompt-only asking yields occasional prose or extra keys that crash the downstream parser; a JSON-schema-enforced output guarantees the shape; a validation-retry loop catches the rare violation and re-asks, with a safe default if retries exhaust.

## Sections Outline

### Section 1: content — "The Output Is the Other Governed Boundary"
- Reframe: the context window has two boundaries — input (Tracks 1–5, M20) and output. Both must be engineered.
- Why output matters: downstream systems consume it. Free-form output is a puddle; a contract is a part. Unparseable output is a production incident, not a cosmetic issue.
- Thesis: shaping the output is the same discipline as shaping the input, applied to the exit.

### Section 2: content — "Contracts and the Enforcement Spectrum"
- The output contract: exact schema, types, enums, null/flag behavior on uncertainty.
- The enforcement spectrum from weak to strong: ask in prompt → canonical example (M07) → JSON-schema/structured-output enforcement → strict tool schema. Stronger = fewer failures.
- UCC tie-in: the strict risk-output schema; structured outputs as the modern, reliable replacement for the deprecated prefill (callback to M19/M20).

### Section 3: code — "An Enforced Output Contract with a Retry Loop"
- Language: Python
- Demonstrates: a UCC risk call using a JSON output schema (or a strict tool schema) to constrain the shape, then a `validate_and_retry()` that checks the result against the contract (valid risk enum, int lien count, list flags) and, on failure, re-asks with the validation error, capping retries and returning a safe default.
- UCC tie-in: guaranteed-shape risk output; the rare violation caught and retried; a safe fallback so downstream never receives garbage.
- Uses Anthropic structured outputs / a strict tool schema conceptually; model claude-sonnet-4-6.

### Section 4: quiz — "Why Does the Parser Crash Once a Day?"
- Question: "Your UCC pipeline asks the model in the prompt to 'return JSON with risk, lien_count, and flags.' It works ~99.9% of the time, but a few times a day the downstream parser crashes on output that included a prose preamble or an extra key. What's the most robust fix?"
- Options:
  - A. Add 'IMPORTANT: ONLY return JSON, no other text!!!' in capitals to the prompt
  - B. Enforce the output with a JSON schema / structured outputs so the shape is constrained at generation, AND wrap the call in a validation-retry loop with a safe fallback — so a malformed result is caught and corrected, never passed downstream
  - C. Wrap the parser in a try/except and ignore failures
  - D. Switch to a bigger model and hope it's more consistent
  - correct: B (index 1)
- Explanation: Prompt-only formatting (A) reduces but never eliminates malformed output — at scale, 'rare' is daily. The robust fix has two parts: constrain the shape at generation with schema/structured-output enforcement so most outputs are valid by construction, and validate every result against the contract with a bounded retry (feed the error back) plus a safe fallback, so the occasional violation is caught and handled rather than crashing the parser. Swallowing errors (C) hides data loss; a bigger model (D) is still probabilistic and doesn't guarantee shape.

### Section 5: antipattern — "Hope-Based Output Handling"
- Anti-pattern 1: Prompt-only formatting — relying on 'please return JSON' with no schema enforcement and no validation, so malformed output reaches production at scale.
- Anti-pattern 2: No validation or retry — trusting the output is well-formed and parsing it directly, so the first violation crashes the downstream system.
- Anti-pattern 3: Silent failure handling — try/except that swallows malformed output, turning a visible parse error into invisible data loss (a debtor silently dropped from a risk report).

## SVG Diagram Plan
**"The Output Mold" — molten output poured through a schema mold, validated, with rejects re-poured**

```
   MODEL OUTPUT (molten — any shape)
        │
   ┌────▼────────────────┐
   │  THE MOLD (schema)   │  risk: LOW|MED|HIGH · lien_count: int · flags: []
   │  structured outputs  │  shape constrained at generation
   └────┬────────────────┘
        ▼
   ┌─────────────┐   valid ──────────────▶ ✓ to downstream
   │  VALIDATE   │
   └────┬────────┘   invalid ──(retry w/ error)──┐
        └─ retries exhausted ─▶ safe default      │
                ▲───────────────────────────────────┘
```

- Top: a "molten output" blob (free-form) pouring down into a "MOLD (schema)" box showing the exact contract fields.
- Below the mold: a VALIDATE diamond/box with two exits — `valid → ✓ to downstream` (green) and `invalid → retry with the error` (a loop arrow back into the call), and a final `retries exhausted → safe default` exit.
- The contract fields (risk enum, int, list) labeled in the mold.
- A caption: "constrain the shape, validate the cast, re-pour the rejects."
- Colors: signal-red #c0392b primary for the mold/validation; green-ish for the valid exit ✓; amber accent on the retry loop (the re-pour); warm paper background; Fraunces title, JetBrains Mono labels.
- Reinforces the casting-mold analogy directly.

## Cross-Links
- **Agent M04** (type: agent, label "Agent M04 — Tool Schemas"): CLAUDE.md table maps M21↔Agent M04 (output section design / schemas). The output contract here is the same schema discipline the Agent course applies to tool definitions. Reference in the enforcement-spectrum section.

## Lab Briefs

### Understand It: Measure Malformed-Output Rate
- Give the learner three output strategies for the same UCC risk task — (A) prompt-only 'return JSON', (B) prompt + canonical example, (C) schema-enforced structured output — and run each many times against varied filings.
- They measure the malformed-output rate (unparseable / wrong shape / extra keys) for each strategy.
- Expected output: a 3-row table (strategy → malformed rate) showing the rate dropping sharply as enforcement strengthens, and a note on why even the best strategy still needs validation.
- Duration: ~25 minutes.

### Build It with AI: A Schema-Enforced Output with a Retry Loop
- With Claude, build a UCC risk call that enforces a strict output schema (structured outputs or a strict tool schema), then a `validate_and_retry(call, schema, max_retries=2)` that validates the result, re-asks on failure with the error fed back, and returns a safe default when retries exhaust.
- Steps: define the contract (risk enum, int count, list flags, value rules) → enforce at generation → validate → retry-with-error → safe fallback → run a batch including a deliberately hard case and confirm zero malformed outputs reach 'downstream.'
- Expected deliverable: a schema-enforced, validated, retrying output pipeline + a result showing 100% of returned objects conform to the contract (or a logged safe-default), with the retry loop catching the rare violation.
- Duration: ~40 minutes.

## Context Engineering Takeaway
The output is the window's other governed boundary, so shape it like a casting mold: specify the exact contract, constrain the shape at generation with structured-output enforcement, and validate every result with a bounded retry and a safe fallback — so downstream systems receive a reliable part, never a shapeless puddle.

## Anti-Patterns
1. Prompt-only formatting — relying on 'please return JSON' with no schema enforcement and no validation, so malformed output reaches production at scale.
2. No validation or retry — parsing the output directly on trust, so the first contract violation crashes the downstream system.
3. Silent failure handling — try/except that swallows malformed output, turning a visible parse error into invisible data loss.

## Continuity Notes
- **Builds on:** M04 (the output-contract section of the system prompt), M07 (canonical example for format), M19 (structured outputs as the prefill replacement), M20 (output validation is the last guardrail layer), M02 (Govern stage). The output half of the Govern story.
- **Referenced by:** M22 (output constraints include 'never emit PII in the clear' — compliance), M28 (logging malformed-output rate as an observability metric), M29 (A/B testing output strategies), M31 (the capstone's output contract). With M20 (input) and M21 (output), Track 6's two boundaries are governed; M22–M23 add compliance and isolation.
