# The AI-Assisted Development path

## Who this is for

You write software with an AI — a coding agent in your terminal or your editor — rather than building
an AI system as the product. You are here for context engineering because the agent keeps losing the
thread, re-reading files you already showed it, ignoring a convention you are certain you documented,
or running up a bill you cannot account for.

Every one of those is a context engineering failure, and every one of them is covered in this course.

## What to know before you start

**The course is anchored in a UCC lien-risk pipeline** — US Secretary of State filings, debtor
extraction, risk grading. That is the worked domain for every example, and it is not going to change
into a codebase for your benefit.

That is less of an obstacle than it looks. The mechanics of a context window do not care what is in it:
the same primacy curve that buries a rule in the middle of a system prompt buries a rule in the middle
of your `CLAUDE.md`, and the same summarization that drops a load-bearing decision from a filing review
drops it from your coding session. **Every module carries a Dev Lens** — the box marked *In your IDE*,
just under the analogy — that names the coding-agent form of the module's idea before you meet the
filing examples.

Read the Dev Lens first. Then read the module, and the filings will read as what they are: a worked
example of a mechanism you are going to meet in your own repo.

## The path

Nineteen of the thirty-two modules, in an order built for this audience rather than for track
progression. **Start with M00** regardless — it establishes the five layers everything else refers back
to — then work the phases.

### Phase 1 · Reframe — why prompting harder stopped working

| | Module | What you get |
|---|---|---|
| 1 | **M02** From Prompt to Context Engineering | The diagnosis. Your agent's failures are usually not in the sentence you typed, and this module explains which layer they are actually in. |
| 2 | **M01** Anatomy of a Context Window | What the window mechanically is: tokens, positions, attention, and why the advertised size is a ceiling rather than a budget. |
| 3 | **M03** Context Economics | The three costs — money, latency, attention dilution — and why they arrive together. This is the module that explains the bill. |

### Phase 2 · Your instruction files

| | Module | What you get |
|---|---|---|
| 4 | **M04** System Prompt Architecture | **The most valuable module in the course for you.** It is a specification for `CLAUDE.md`: section ordering, priority, delimiters, output contracts, and what separates a designed instruction file from a 200-line blob. |
| 5 | **M05** Instruction Hierarchy | Who outranks whom once the agent has read a file. The trust tiers that stop a code comment from functioning as an instruction. |
| 6 | **M07** Few-Shot Context Design | How many examples to point the agent at, chosen how — and the point past which more examples make the output worse. |

### Phase 3 · What the agent reads

| | Module | What you get |
|---|---|---|
| 7 | **M10** Tool Results as Context | Highest leverage in the phase. The 4,000-line test log and the 900-line file read are the two biggest wastes in a typical session, and this is the module that fixes them. |
| 8 | **M09** Context Retrieval Strategies | How the agent finds anything. Read this one against the grain — its semantic-first conclusion inverts for source code, and the Dev Lens says why. |
| 9 | **M11** Multi-Source Context Fusion | What happens when the file, the test, the comment, and the README disagree — and which one the agent ends up believing. |

### Phase 4 · The long session

| | Module | What you get |
|---|---|---|
| 10 | **M12** Conversation History Management | Compaction, named and explained — including exactly which kind of fact it drops. |
| 11 | **M18** Context Compression | Why the compaction summary keeps the file list and loses the constraint, and what you can do about it before it happens. |
| 12 | **M13** Multi-Layer Memory Architecture | The four tiers you already have, and the two failures — a one-off written into permanent instructions, a convention that dies with the session. |
| 13 | **M19** Caching and Prefilling | Why your stable preamble sometimes costs full price, and the six-token edits that silently invalidate it. |

### Phase 5 · The loop and the review

| | Module | What you get |
|---|---|---|
| 14 | **M24** Agent Loop Context | Your coding agent's loop, described almost exactly — including why it was doing fine ten steps ago and is confidently off-task now. |
| 15 | **M25** Planning Context | Plan mode as a design pattern: decomposition made visible and correctable before execution. |
| 16 | **M16** Positional Effects | The rule at line 140 of your instruction file that the model reliably misses. Read after Phase 2, when you have an instruction file worth positioning. |
| 17 | **M20** Input Guardrails | Injection as you will actually meet it — a dependency README, an issue body, a comment in vendored code. |
| 18 | **M27** Human-in-the-Loop Context | Why a 900-line diff is an unreviewable brief, and what a scoped one looks like. |
| 19 | **M30** Context Versioning | Your instruction file changes behavior in every session, regresses, and has no tests. This module is already written in the language of release discipline. |

## The other thirteen

Not skippable — the pipeline-builder's half of the course, worth reading once the translation has
landed. In course order:

| Module | Why it is worth your time |
|---|---|
| **M06** Persona & Behavioral Framing | Short. Explains what a framing line in an instruction file does and, more usefully, what it cannot do. |
| **M08** RAG as Context Engineering | The retrieve → rank → format → place pipeline your agent runs over your repo. Chunking is the step that differs most for code. |
| **M14** Context Decay and Refresh | Staleness as a first-class problem. The direct application is an instruction file that drifted from the code it describes. |
| **M15** User Modeling as Context | The weakest fit of the thirty-two. Read it for the signal-versus-noise rule about what earns a permanent line. |
| **M17** Context Ordering Strategies | Sequencing the whole window. The practical payoff is knowing that a question asked before a long paste is a different question from the same words asked after it. |
| **M21** Output Shaping Context | Output contracts and validation-retry loops — the same discipline that makes an edit apply cleanly the first time. |
| **M22** Compliance Context | Built for regulated data. Two parts transfer hard: what the agent is allowed to read, and the fact that everything it read left your machine. |
| **M23** Multi-Tenant Context Isolation | Mostly a SaaS concern. The transferable half is scope — an agent reaching across repository or package boundaries. |
| **M26** Multi-Agent Context Sharing | Subagents: what isolation buys you, and what the isolated agent will invent because it did not know what you decided earlier. |
| **M28** Context Observability | The habit of asking what was actually in the window when the agent decided, rather than why it thought that. |
| **M29** Context A/B Testing | The antidote to n=1 convictions about phrasings and models. |
| **M31** Capstone | The whole discipline assembled end to end. The integration lesson — that the seams between tracks are where systems fail — is the part that transfers. |
| **M00** Course Orientation | Listed here for completeness only; read it first, as above. |

## About the labs

The 64 labs stay in the UCC domain and assume you are building a pipeline. They are genuine practice —
the reasoning is the transferable part, and the "Understand It" half of each pair is mostly observation
and analysis that carries over directly. See `SETUP.md` for which labs need an API key.

There is no separate lab track for AI-assisted development. The honest substitute is to do each
module's exercise against your own repository and your own instruction file: audit your `CLAUDE.md`
against M04's section architecture, measure your own positional trough with M16's probe, and shape one
noisy tool result with M10's toolbox.
