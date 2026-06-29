# M02 Plan — From Prompt Engineering to Context Engineering: The Paradigm Shift

## Module Identity
- **ID:** M02
- **Track:** 1 (Foundations)
- **Title:** From Prompt Engineering to Context Engineering — The Paradigm Shift
- **Subtitle:** Why the discipline moved from crafting one perfect instruction to designing the entire information environment
- **Icon:** 🔭
- **Color:** #4a6741 (forest)

## Everyday Analogy
**The Sticky Note vs. the Briefing Packet**

Prompt engineering is handing a new contractor a single sticky note: "Extract the debtor name." If they're sharp, they'll usually get it right — until the filing is weird, or they need history they don't have, or you ask ten of them and get ten different formats. Context engineering is handing them a briefing packet instead: who they are and the rules they follow (system), the documents they need (retrieval), the lookups they can run (tools), what was already decided in this matter (conversation), and who they're reporting to (user). The sticky note optimizes one sentence; the briefing packet designs the whole job — and that's the shift this course is about.

Mapping:
- The sticky note → a single prompt string
- "If they're sharp, they'll usually get it right" → prompts work for simple, one-shot tasks
- The filing being weird / needing history → where prompt-only breaks: edge cases, grounding, state
- The briefing packet's tabbed sections → the five layers of context (system, retrieval, tool, conversation, user)
- Standardizing the packet so ten contractors produce identical work → why CE scales where prompting doesn't

## Key Topics (5)
1. **What prompt engineering actually optimized** — Prompt engineering treats the instruction as the lever: better wording, clearer steps, a few examples inline. It's real and useful, but it only ever touched one layer of the context window — the words you typed.
2. **Why prompt-only approaches break at scale** — A clever prompt has no memory, no grounding in your data, no tools, and no governance. The same prompt that nails a clean filing hallucinates on a messy one, drifts across a conversation, and produces ten different output shapes across ten calls. *(UCC domain example lives here.)*
3. **The five layers, revisited as design surfaces** — M00 named the five layers (system, retrieval, tool, conversation, user); here each becomes a thing you deliberately *design*, not just a place text happens to land. Prompt engineering is now simply "layer 1 done well."
4. **The context engineering lifecycle** — CE is a loop, not a string: ASSEMBLE the right context → POSITION it in the window → GOVERN what enters and exits → OBSERVE token cost and quality → ITERATE. Every track in this course maps to a stage of this loop.
5. **When a prompt is still enough** — The shift is not "always build the briefing packet." For a one-shot, low-stakes, self-contained task, a good prompt is the right tool; over-engineering context is its own anti-pattern. CE is knowing *which* problems need the packet.

UCC domain example appears in: Topic 2 — the same one-line extraction prompt that works on a clean UCC-1 fails on a UCC-3 amendment with a redacted debtor, and returns inconsistent JSON shapes across a batch — motivating the move to a designed pipeline.

## Sections Outline

### Section 1: content — "The Lever Moved"
- Prompt engineering = optimizing the instruction string; a genuine skill, but it operates on one layer.
- Context engineering = optimizing the entire information environment the instruction runs inside.
- Reframe: the famous prompt-engineering tricks (role-playing, step-by-step, few-shot) are all still here — they're just *layer 1* of a five-layer system now.
- Why the field renamed itself: as apps moved from demos to production, the instruction stopped being the bottleneck; the surrounding context did.

### Section 2: content — "Where Prompt-Only Breaks"
- Four failure modes of prompt-only systems at scale: no grounding (hallucination on real data), no memory (drift across turns), no tools (can't look anything up), no governance (inconsistent, unsafe, unbounded output).
- UCC example: one extraction prompt across a batch — clean UCC-1 ✓, messy UCC-3 amendment ✗ (invents a debtor), and three different JSON shapes across three runs. The prompt didn't get worse; the *context* was never designed.
- The lesson: you can't prompt your way out of a missing layer.

### Section 3: content — "The Context Engineering Lifecycle"
- Introduce the loop: Assemble → Position → Govern → Observe → Iterate.
- Map each stage to the course tracks: Assemble = Tracks 2–3 (system + dynamic), Position = Track 5, Govern = Track 6, Observe/Iterate = Track 8, with Memory (Track 4) and Agents (Track 7) threading through.
- Emphasize it's a *loop*: you observe token cost and quality in production and feed it back into assembly. This is what makes CE engineering, not authoring.

### Section 4: quiz — "Prompt or Packet?"
- Question: "Your team ships a feature that answers one-off questions like 'What is a UCC-1?' from a help button. It works great with a simple prompt. A PM insists you re-architect it with retrieval, memory, and tool layers 'to be safe.' What's the most defensible response?"
- Options:
  - A. Agree — more context layers always improve reliability
  - B. Refuse all changes — prompt engineering is obsolete and shouldn't be used
  - C. Push back — this is a one-shot, low-stakes, self-contained task where a good prompt is the right tool; adding layers adds cost and dilution for no reliability gain
  - D. Add only a memory layer, since memory is always worth it
- Correct: C (index 2)
- Explanation: Context engineering includes the judgment of *when not to* add context. The lifecycle exists to serve reliability and cost goals — a self-contained one-shot task doesn't benefit from retrieval/memory/tools and would only pay dilution and token costs. Knowing which problems need the briefing packet is the skill; reflexively maximizing layers is the over-engineering anti-pattern.

### Section 5: antipattern — "Symptoms of a Stuck Paradigm"
- Anti-pattern 1: "Prompt whack-a-mole" — endlessly tweaking one mega-prompt to patch failures that are actually missing layers (the messy filing needs *retrieval of the original*, not better adjectives).
- Anti-pattern 2: Treating context engineering as "just a longer prompt" — pasting everything into one string with no structure, positioning, or governance, and calling it CE.
- Anti-pattern 3: Over-correcting into "layer maximalism" — bolting retrieval, memory, and tools onto a task that never needed them, paying cost and dilution for zero reliability gain.

## SVG Diagram Plan
**"The Lever Moved" — two side-by-side panels: a sticky note vs. a tabbed briefing packet, over a lifecycle loop**

```
   PROMPT ENGINEERING            CONTEXT ENGINEERING
   ┌──────────────┐             ┌──────────────────────┐
   │  ▒ sticky ▒  │             │ [System ][Retrieval ]│
   │  "Extract    │     →       │ [Tool   ][Conv      ]│
   │   debtor"    │             │ [User                ]│
   └──────────────┘             └──────────────────────┘
     one layer                    five design surfaces

        ASSEMBLE → POSITION → GOVERN → OBSERVE ──┐
            └───────────── ITERATE ◄─────────────┘
```

- Left panel: a small single "sticky note" card (forest tint, one line of text) labeled "one layer / one string."
- Right panel: a larger card split into 5 labeled tabs/cells (System, Retrieval, Tool, Conversation, User), each tinted with the matching layer color used in M00's diagram (forest/water/leather/amethyst/amber) for visual continuity.
- A bold arrow "→" between them labeled "THE SHIFT."
- Beneath both: a horizontal lifecycle loop — ASSEMBLE → POSITION → GOVERN → OBSERVE → (curved return arrow) ITERATE — in JetBrains Mono caps, forest accents.
- Colors: forest #4a6741 primary; reuse layer colors #2e6b8a, #8b5e3c, #7a4a8c, #b8860b for the five tabs; warm paper #f6f3ec background; Fraunces title, JetBrains Mono labels.
- Reinforces the analogy directly (sticky note vs. briefing packet) and visually ties back to M00's five layers.

## Cross-Links
- **Agent M03** (type: agent, label "Agent M03"): Per CLAUDE.md cross-link table — "CE expands frame; Agent applies to prompts." This module establishes the wider context frame; the Agent course's M03 applies the same thinking specifically to prompt construction. Reference it in the lifecycle section.

## Lab Briefs

### Understand It: Diagnose the Failure Layer
- Give the learner one fixed extraction prompt and a set of 5 UCC filings from the sandbox (clean UCC-1, messy UCC-3 amendment, a redacted debtor, a non-English party name, a 90-char truncated name).
- Run the same prompt against all five; record which fail and *why*.
- For each failure, classify the missing layer: is this a grounding problem (retrieval), a state problem (conversation), a lookup problem (tool), or a governance problem (output shape)?
- Expected output: a 5-row table (filing, pass/fail, failure mode, missing layer) — proving the prompt isn't the problem, the absent layers are.
- Duration: ~25 minutes.

### Build It with AI: Refactor a Prompt into a Lifecycle
- With Claude, take the single prompt from the Understand lab and refactor the worst-failing case into a minimal context-engineered call that adds exactly the one missing layer it needed (e.g., retrieve the original filing for the amendment).
- Steps: identify the missing layer → assemble it → re-run → confirm the previously failing case now passes → note the token cost added.
- Explicitly do NOT add layers the task doesn't need (practice the "when a prompt is enough" judgment).
- Expected deliverable: a before/after script showing one targeted layer added, the failure fixed, and the token delta — plus a one-line justification for each layer included and each deliberately excluded.
- Duration: ~35 minutes.

## Context Engineering Takeaway
Context engineering is the discipline that moved the lever from the instruction to the whole information environment — designing five layers through an assemble-position-govern-observe-iterate loop — while keeping the judgment to use a plain prompt when a plain prompt is all the task needs.

## Anti-Patterns
1. Prompt whack-a-mole — endlessly rewording one mega-prompt to patch failures that are really missing layers (grounding, state, tools, governance).
2. "Context engineering = a longer prompt" — dumping everything into one unstructured string with no positioning or governance and believing that's the discipline.
3. Layer maximalism — reflexively adding retrieval, memory, and tools to tasks that never needed them, paying token cost and context dilution for no reliability gain.

## Continuity Notes
- **Builds on:** M00 (named the five layers and defined CE) and M01 (the mechanical window — tokens, positions, attention). M02 turns those into a *paradigm and a lifecycle*: M00 said what CE is, M01 said what a window is, M02 says why the field shifted and how the work is structured.
- **Referenced by:** M03 (economics — the "Observe" stage's cost half) closes Track 1. Every later track is explicitly framed as a stage of M02's lifecycle: Tracks 2–3 = Assemble, Track 5 = Position, Track 6 = Govern, Track 8 = Observe/Iterate. The "when a prompt is enough" judgment recurs in M07 (few-shot diminishing returns) and M18 (compression).
