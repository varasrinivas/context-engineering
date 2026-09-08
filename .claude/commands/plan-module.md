---
description: Create a detailed plan for a course module
argument-hint: "MXX (e.g., M01, M14, M31)"
---

Create a detailed module plan for: $ARGUMENTS

Follow these steps:

1. Read `CLAUDE.md` for project standards, design system, and content rules
2. Read `docs/curriculum-map.md` to find the module's track, title, topics, analogy, and cross-links
3. If this is NOT M00, read `plans/M00-plan.md` as a reference for plan structure and depth
4. If there's a previous module in the same track, read its plan for continuity

Create the plan at `plans/$ARGUMENTS-plan.md` with these sections:

## Module Identity
- ID, Track, Title, Subtitle, Icon, Color (from TRACK_META)

## Everyday Analogy
- The analogy title and full text (3-4 sentences, from a familiar domain)
- How the analogy maps to each key concept

## Dev Lens (`devLens`)
- Title: a short claim in coding-agent terms
- Body: 2-4 sentences naming (a) the concrete coding-agent mechanism this module's idea takes
  (`CLAUDE.md`, `/compact`, plan mode, subagents, tool results, permission prompts), and (b) the
  failure that mechanism produces. Do not restate the takeaway.
- Lead with Claude Code; name the Cursor/Copilot equivalent in a clause only where one exists
- **Routes nowhere** — no `[Agent MXX]` / `[SDLC Track X]` tags, no links out
- If the fit is genuinely weak, say so in a clause rather than manufacturing a parallel
- Authored in `docs/devlens.json`; see `docs/ai-assisted-dev-path.md` for the reading order

## Key Topics (4-6)
- Each topic with a 2-sentence expansion
- Which topic gets the UCC domain example

## Sections Outline
- Section-by-section plan with type (content/analogy/code/quiz/antipattern)
- For code sections: specify language, what the code demonstrates, UCC domain tie-in
- For quiz sections: draft the question, 4 options, correct answer, explanation
- For antipattern sections: list 2-3 anti-patterns with consequences

## SVG Diagram Plan
- What the diagram shows (conceptual sketch in ASCII)
- Key visual elements, labels, colors
- How it reinforces the analogy

## Cross-Links
- Which Agent/SDLC modules to reference and why

## Lab Briefs
- Understand It: what the learner observes/analyzes, expected output
- Build It with AI: what the learner constructs, key steps, expected deliverable

## Context Engineering Takeaway
- The one-sentence summary

## Anti-Patterns
- 2-3 things that go wrong when you skip or misapply this module's concepts

## Continuity Notes
- What prior modules this builds on
- What future modules will reference this
