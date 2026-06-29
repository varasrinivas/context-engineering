# M06 Plan — Persona & Behavioral Framing

## Module Identity
- **ID:** M06
- **Track:** 2 (System Context Design)
- **Title:** Persona & Behavioral Framing
- **Subtitle:** How the role and behavioral frame you assign shapes the quality, depth, and tone of output — even when the rules are identical
- **Icon:** 🎭
- **Color:** #8b5e3c (leather)

## Everyday Analogy
**Calling a Plumber vs. Calling an Architect**

Describe the exact same situation — "there's water where it shouldn't be" — to a plumber and to an architect, and you get two genuinely different responses. The plumber localizes the leak and stops it today; the architect asks about load-bearing walls, drainage design, and whether the whole layout invites the problem. Neither is smarter; the *frame* you invoked pulled different expertise, depth, and vocabulary to the front. A persona in a system prompt does the same thing: "You are a UCC compliance auditor" and "You are a junior data-entry clerk" will read the identical filing and surface completely different things — not because you changed the rules, but because you changed who's reading.

Mapping:
- Same situation, different professional → same task, different persona
- Plumber's fast local fix → a frame that prioritizes speed/extraction
- Architect's systemic questions → a frame that prioritizes risk, edge cases, structure
- Choosing who to call → choosing the persona deliberately, to match the job
- Calling the wrong trade → persona mismatch (an "auditor" frame for a task that needed a fast clerk, or vice versa)

## Key Topics (5)
1. **Why persona measurably changes output** — A role primes the model toward a region of its training distribution: the vocabulary, depth, caution level, and reasoning style associated with that expertise. It's not roleplay flavor; it shifts what the model attends to and surfaces. (Distinguish from M05: persona shapes *behavior/quality*, not *authority*.)
2. **Expert framing and its limits** — "You are an expert X" tends to raise rigor and domain vocabulary, but it is not magic: it can't supply knowledge the model lacks, and over-claiming ("world's leading forensic accountant") yields diminishing returns and sometimes overconfident confabulation. *(UCC domain example lives here.)*
3. **Behavioral anchoring** — Beyond the noun ("auditor"), the behavioral frame sets defaults: how cautious, how verbose, how much to hedge, when to flag vs. decide. These traits can be specified explicitly ("flag anomalies rather than resolving them") and are often more impactful than the title.
4. **Persona-to-task fit** — The right persona is the one whose default behaviors match the task's needs. A high-caution auditor frame is right for compliance review and wrong for high-throughput extraction (where it over-flags and slows down). Fit is a design decision, not a vanity label.
5. **Consistency and persona drift** — Over a long interaction, the assigned persona can erode (the model slips toward a generic assistant voice). Reinforcing the frame, and keeping it coherent with the rules and output contract, maintains consistent behavior. (Sets up Track 4 memory/drift.)

UCC domain example appears in: Topic 2 — the same UCC filing read under three personas (a "senior compliance auditor," a "fast data-entry clerk," and a "credit risk analyst") producing three different but valid outputs: the auditor flags a possible truncation and a related-party concern, the clerk returns clean fields fast, the risk analyst foregrounds the lien stack — illustrating fit, not a single "best."

## Sections Outline

### Section 1: content — "Persona Is a Lever, Not Decoration"
- A role primes the model toward the slice of its distribution associated with that expertise: vocabulary, depth, caution, reasoning style.
- Crucial distinction from M05: persona affects *how well and in what style* the model performs (behavior/quality); the instruction hierarchy affects *whose instructions win* (authority). Don't conflate them.
- Quick demonstration framing: identical rules + identical filing + different persona = measurably different output. The lever is real and free.

### Section 2: content — "Expert Framing and Its Ceiling"
- "You are an expert UCC analyst" generally lifts rigor and domain language — useful and cheap.
- The ceiling: framing can't add knowledge the model doesn't have; and over-claiming ("the world's foremost…") tends to plateau and can induce overconfident fabrication — a real risk in a credit-risk domain.
- UCC tie-in: the same filing under "senior compliance auditor" vs. "fast data-entry clerk" vs. "credit risk analyst" → three valid, differently-shaped outputs. Right answer depends on the job, not on a single best persona.

### Section 3: content — "Behavioral Anchoring Beats the Title"
- The noun ("auditor") is only half the frame; the behavioral defaults are the other half and often matter more: caution level, verbosity, hedging, flag-vs-decide posture.
- Specify behaviors explicitly: "flag anomalies rather than resolving them," "prefer null over a guess," "report uncertainty as a confidence field."
- This is how you get persona benefits without persona theater — anchoring concrete behaviors, not just a costume.

### Section 4: quiz — "Pick the Persona"
- Question: "You're building a high-throughput UCC pipeline that extracts debtor fields from 50,000 clean filings a day; downstream systems need fast, consistent JSON. A colleague sets the persona to 'You are a meticulous senior compliance auditor who scrutinizes every detail for risk.' Throughput drops and outputs balloon with caveats. What's the real problem?"
- Options:
  - A. The persona isn't expert enough — upgrade it to 'world-leading forensic auditor'
  - B. Persona-to-task mismatch — a high-caution auditor frame over-flags and over-explains for a task that needs fast, consistent extraction; a lean 'data-extraction specialist' frame fits better
  - C. Personas never affect throughput; the slowdown must be a network issue
  - D. Remove the persona entirely — personas always reduce quality
- Correct: B (index 1)
- Explanation: The persona is doing exactly what it should — a meticulous auditor frame raises caution, scrutiny, and caveats. That's perfect for compliance review and wrong for high-throughput extraction, where it over-flags and inflates output. The fix isn't a more impressive title (over-claiming plateaus) or removing personas (they're a real lever); it's *fit* — choose the persona whose default behaviors match the task: a lean extraction specialist that returns clean JSON and flags only hard-stops.

### Section 5: antipattern — "Costumes Without Fit"
- Anti-pattern 1: Persona theater — piling on grandiose titles ("world's foremost…") expecting linear gains, getting plateau and overconfident confabulation instead.
- Anti-pattern 2: Persona-task mismatch — a high-caution frame on a throughput task (over-flagging) or a fast-clerk frame on a compliance task (missed risks); the title fought the job.
- Anti-pattern 3: Title without behavior — naming a role but never specifying its behavioral defaults, so "auditor" and "clerk" behave almost identically because nothing anchored the difference.

## SVG Diagram Plan
**"One Filing, Three Readers" — a central document fanning out to three persona lenses with distinct outputs**

```
                 ┌─────────────────────────┐
                 │  UCC FILING 2024-FL-...  │
                 └────────────┬────────────┘
            ┌─────────────────┼─────────────────┐
            ▼                 ▼                 ▼
   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
   │ 🔍 AUDITOR    │  │ ⚡ CLERK      │  │ 📊 RISK ANALYST│
   │ flags trunc., │  │ clean JSON,  │  │ foregrounds   │
   │ related party │  │ fast, no     │  │ the lien stack│
   │ caution=high  │  │ caveats      │  │ risk=HIGH     │
   └──────────────┘  └──────────────┘  └──────────────┘
       same rules · same filing · different frame
```

- A single document card at top (the UCC filing), three arrows fanning to three "lens" cards: AUDITOR (🔍), CLERK (⚡), RISK ANALYST (📊).
- Each lens card lists its distinct output emphasis and a behavioral tag (caution=high / speed=high / risk-focus), all in leather tones with slight tint differences.
- A baseline caption: "same rules · same filing · different frame → different (valid) output."
- A small ceiling note off to the side: "expert framing lifts rigor — but over-claiming plateaus."
- Colors: leather #8b5e3c primary; subtle tint variation per lens; warm paper background; Fraunces title, JetBrains Mono labels.
- Reinforces plumber-vs-architect: same situation, different professional, different (appropriate) response.

## Cross-Links
- None tagged in the curriculum map for M06. `crosslinks: []`. (In prose, forward-reference M05 for the persona-vs-authority distinction and Track 4 for persona drift over long sessions, but no formal Agent/SDLC tags.)

## Lab Briefs

### Understand It: Same Filing, Three Personas
- Run one fixed UCC filing through the model under three personas (compliance auditor, data-entry clerk, credit risk analyst) with identical rules and output request.
- Record how the outputs differ: what each surfaces, flags, omits; verbosity; caution; vocabulary.
- Expected output: a 3-column comparison (persona → emphasis, flags raised, length, fit-for-what-task) plus a one-line statement of which persona fits which downstream job.
- Duration: ~25 minutes.

### Build It with AI: A Persona-Fit Selector
- With Claude, build a small `choose_persona(task_profile)` helper that, given a task's needs (throughput vs. scrutiny, tolerance for false flags, output verbosity), returns the best-fit persona block with explicit behavioral anchors — and justifies the choice.
- Steps: define 3 persona blocks with behavioral anchors → define 3 task profiles → map profiles to personas → run the chosen persona on a sample filing → confirm behavior matches the task need (and show a mismatch case failing).
- Expected deliverable: a persona library (3 anchored blocks), a selector that picks by fit, and a demonstration that the fitted persona outperforms a mismatched one on the same task.
- Duration: ~35 minutes.

## Context Engineering Takeaway
Persona is a free, measurable lever that shapes the depth, caution, and vocabulary of output — so choose the role whose default behaviors fit the task, anchor those behaviors explicitly, and remember the title without the behavior is just a costume.

## Anti-Patterns
1. Persona theater — grandiose titles expecting linear gains, getting plateau and overconfident confabulation.
2. Persona-task mismatch — a high-caution frame on a throughput task or a fast-clerk frame on a compliance task; the role fought the job.
3. Title without behavior — naming a role but never specifying its behavioral defaults, so different personas behave identically.

## Continuity Notes
- **Builds on:** M04 (persona/role is the identity section of the architected system prompt) and M05 (sharpens the distinction: persona = behavior/quality, hierarchy = authority). Uses M03's framing implicitly — a verbose persona costs tokens, so fit has an economic dimension.
- **Referenced by:** M07 (examples reinforce a persona's behavior), Track 4 / M13–M15 (persona drift and user modeling over long sessions), M15 (user context as a personalization layer distinct from the system persona). Closes the "static scaffolding" trio (M04 structure, M05 authority, M06 behavior); M07 then adds examples.
