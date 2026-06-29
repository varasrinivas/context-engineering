# M04 Plan — System Prompt Architecture: Layers, Sections, and Priority

## Module Identity
- **ID:** M04
- **Track:** 2 (System Context Design)
- **Title:** System Prompt Architecture — Layers, Sections, and Priority
- **Subtitle:** Designing the static scaffolding — how to structure a production system prompt so the model reliably finds and follows it
- **Icon:** 📜
- **Color:** #8b5e3c (leather)

## Everyday Analogy
**The Employee Handbook for a New Hire**

A system prompt is the employee handbook you hand a new hire on day one. A bad handbook is a wall of text with the dress code, the fire-evacuation plan, and the refund policy all jumbled together — so when a customer is shouting, the employee can't find the one rule that matters. A good handbook has a clear structure: identity and mission up front, the non-negotiable rules in their own bold section, step-by-step procedures, then reference material at the back. The new hire isn't smarter; they just find the right rule at the right moment because the document was *architected*, not dumped.

Mapping:
- The handbook → the system prompt (static, read on every "shift"/call)
- Jumbled wall of text → an unstructured prompt where rules get lost
- Bold "non-negotiable" section → high-priority instructions placed and delimited for salience
- Identity/mission up front, reference at back → section ordering (primacy for role, recency for the task)
- Same employee, better performance → same model, better reliability from architecture alone

## Key Topics (5)
1. **Anatomy of a production system prompt** — A real system prompt has recognizable parts: role/identity, objective, rules & constraints, tools/capabilities, output contract, and examples. Naming the parts turns "write a good prompt" into "assemble known sections."
2. **Section ordering and priority** — Order is meaning (recall M01's positional effects): identity and the most critical constraints ride primacy at the top; the immediate task rides recency near the bottom; bulky reference sits in the middle where dilution hurts least.
3. **Delimiters and structure** — Markers (XML-style tags, markdown headers, capitalized labels) give the model unambiguous boundaries between sections and between *instructions* and *data*, which both improves adherence and is the first line of injection defense (forward ref to M20). *(UCC domain example lives here.)*
4. **The static/cacheable contract** — The system prompt is the static layer: identical across calls, which makes it the prime candidate for prompt caching (forward ref to M19). Architecting it as a stable block separates "never changes" from "changes per call" — an economic and design boundary.
5. **Instruction specificity and conflict** — Vague rules under-constrain; contradictory rules force the model to guess. A well-architected prompt states rules once, specifically, without internal conflict, and resolves precedence explicitly (sets up M05's instruction hierarchy).

UCC domain example appears in: Topic 3 — a UCC extraction system prompt shown as an unstructured blob vs. a delimited, sectioned architecture (`<role>`, `<rules>`, `<output_contract>`, `<filing>` data boundary), demonstrating how delimiters separate the extraction rules from the untrusted filing text.

## Sections Outline

### Section 1: content — "The Anatomy of a System Prompt"
- Name the standard sections of a production system prompt: identity/role, objective, rules & constraints, capabilities/tools, output contract, examples.
- Reframe "prompt writing" as "section assembly" — you're not finding magic words, you're filling known slots.
- UCC framing: map each section to the debtor-extraction task (role = UCC analyst, rules = preserve capitalization/flag truncation, output contract = JSON schema).

### Section 2: content — "Order Is Meaning"
- Apply M01's positional effects to prompt design: top = primacy, bottom = recency, middle = dilution risk.
- Practical ordering: identity + hardest constraints at the top; the live task/data near the bottom; long reference material in the middle.
- Why "put the most important rule last" and "put it first" are both partly right — primacy and recency both privileged; the middle is the danger zone.

### Section 3: code — "From Blob to Architecture"
- Language: text/markdown (show two system prompts side by side as a string)
- Demonstrates: the SAME UCC extraction instructions as (a) an unstructured paragraph blob and (b) a delimited, sectioned architecture using XML-style tags and a clear data boundary for the untrusted filing.
- UCC tie-in: the `<filing>...</filing>` delimiter visibly separating trusted rules from untrusted document text — adherence + injection-defense in one move.
- Note: keep it as a prompt-design example (pseudoprompt), not an API call.

### Section 4: quiz — "Where Does the Rule Go?"
- Question: "You're architecting a UCC extraction system prompt. One rule is absolutely critical: 'NEVER fabricate a debtor name; if it's not clearly in the filing, return null.' You also have 600 tokens of edge-case reference notes. Where should each go for best adherence?"
- Options:
  - A. Critical rule in the middle, reference notes at the very top (most space)
  - B. Critical rule at the top in its own delimited section; reference notes in the middle
  - C. Both at the very bottom so they're freshest
  - D. Position doesn't matter inside a system prompt — only wording does
- Correct: B (index 1)
- Explanation: Positional effects don't switch off inside the system prompt. The critical, non-negotiable rule belongs at the top (primacy) in its own delimited section so it's salient and unambiguous; bulky reference notes belong in the middle, the lowest-stakes zone, where dilution does the least damage. Wording matters, but so does where the rule sits — architecture and phrasing work together.

### Section 5: antipattern — "Handbooks Nobody Can Use"
- Anti-pattern 1: The wall-of-text prompt — every rule, example, and edge case in one undelimited paragraph, so the model can't tell a hard constraint from a footnote.
- Anti-pattern 2: No data boundary — pasting the untrusted filing text directly adjacent to instructions with no delimiter, so the model (and an attacker) can't tell rules from content.
- Anti-pattern 3: Contradiction by accretion — rules bolted on over months that now conflict ("always return JSON" + a later "explain your reasoning in prose"), forcing the model to guess which wins.

## SVG Diagram Plan
**"The Architected System Prompt" — a vertical document with labeled, color-zoned sections and a priority gradient**

```
  ┌───────────────────────────────┐  ▲ PRIMACY (high salience)
  │ <role> UCC Filing Analyst     │  │
  ├───────────────────────────────┤
  │ <rules> NEVER fabricate ...   │  │  ← critical, delimited
  ├───────────────────────────────┤
  │ <reference> edge cases ...    │  ▒ MIDDLE (dilution zone)
  │   (bulky, low-stakes)         │  ▒
  ├───────────────────────────────┤
  │ <output_contract> JSON {...}  │  │
  ├───────────────────────────────┤
  │ <filing> ...untrusted text... │  ▼ RECENCY (the live task)
  └───────────────────────────────┘
        ↑ delimiters = boundaries
```

- A tall document rectangle divided into 5 labeled, tag-named bands: `<role>`, `<rules>`, `<reference>`, `<output_contract>`, `<filing>`.
- A vertical priority gradient on the right: bright leather at top (PRIMACY) and bottom (RECENCY), faded/grey in the middle (DILUTION ZONE) — mirroring M01's attention curve but rotated.
- The `<filing>` band visually distinct (dashed border / different tint) labeled "untrusted data boundary."
- Small callout: "delimiters = unambiguous boundaries (adherence + injection defense)."
- Colors: leather #8b5e3c primary for borders/labels; muted grey for the middle dilution zone; the `<filing>` band in a cautionary tint (toward signal red) to flag untrusted data; warm paper background; Fraunces title, JetBrains Mono tag labels.
- Reinforces the handbook analogy (structured sections) and ties back to M01 (positional salience).

## Cross-Links
- **Agent M03** (type: agent, label "Agent M03 — Prompt Construction"): CLAUDE.md table — CE goes deeper on layering; Agent applies to prompts. Reference when naming the standard sections.
- **Agent M08** (type: agent, label "Agent M08 — System Design"): CLAUDE.md table maps M04↔Agent M03,M08. Reference for how the architected system prompt feeds agent system design.

## Lab Briefs

### Understand It: Dissect a Production System Prompt
- Provide a realistic ~40-line UCC extraction system prompt (deliberately mixing role, rules, reference, output contract, and an inlined filing with no delimiter).
- The learner labels each line with its section type and flags structural problems: missing delimiters, a critical rule buried in the middle, an instruction/data boundary violation, any internal contradiction.
- Expected output: the prompt annotated by section + a short list of 3–4 architectural defects with the fix for each.
- Duration: ~25 minutes.

### Build It with AI: Refactor a Blob into an Architecture
- With Claude, take the blob prompt from the Understand lab and re-architect it: named delimited sections, critical rule promoted to a top `<rules>` block, reference moved to the middle, the filing wrapped in an explicit `<filing>` data boundary, output contract stated once.
- Steps: identify sections → reorder by priority → add delimiters → isolate the untrusted filing → verify the same extraction task now adheres better (run it on the messy UCC-3 case from M02).
- Expected deliverable: before/after system prompts plus a 4-row table mapping each fix to the principle it applies (anatomy, ordering, delimiters, data boundary).
- Duration: ~35 minutes.

## Context Engineering Takeaway
A system prompt is architecture, not prose: name its sections, order them by positional priority, delimit instructions from untrusted data, and keep it stable and conflict-free — so the same model finds and follows the right rule at the right moment.

## Anti-Patterns
1. The wall-of-text prompt — every rule, example, and edge case in one undelimited paragraph, so a hard constraint is indistinguishable from a footnote.
2. No instruction/data boundary — untrusted content (a filing) sits flush against the rules with no delimiter, hurting adherence and opening the door to injection (M20).
3. Contradiction by accretion — rules added over time that now conflict, forcing the model to guess precedence instead of being told it (M05).

## Continuity Notes
- **Builds on:** Track 1 — M01 (positional effects now applied inside the prompt), M02 (the system layer is the first design surface of the lifecycle's Assemble stage), M03 (the system prompt is the static layer your budget protected and will cache).
- **Referenced by:** M05 (instruction hierarchy — resolving the precedence this module flags), M07 (where the examples section goes), M19 (caching the static system block), M20 (the data-boundary delimiter as injection defense). Opens Track 2; M05–M07 each deepen one section of the architecture introduced here.
