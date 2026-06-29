# M13 Plan — Multi-Layer Memory Architecture: Ephemeral, Session, Persistent, Shared

## Module Identity
- **ID:** M13
- **Track:** 4 (Memory & Conversation Context)
- **Title:** Multi-Layer Memory Architecture — Ephemeral, Session, Persistent, Shared
- **Subtitle:** Designing memory in tiers — each with its own scope, lifetime, and update strategy
- **Icon:** 🗄️
- **Color:** #7a4a8c (amethyst)

## Everyday Analogy
**The Hotel Concierge's Tiers of Memory**

A great concierge remembers things at different depths. Right now, mid-conversation, they hold your immediate request in their head — "table for two, 8pm" — and forget it the moment it's handled (ephemeral). For the length of your stay, they remember you're in room 412 and prefer extra towels (session). Across all your visits over the years, the hotel's guest profile remembers you always ask for a high floor and a late checkout (persistent). And the whole concierge desk shares a logbook so the night shift knows what the day shift promised you (shared). One person, four tiers of memory — each with a different lifetime and a different scope, and the skill is knowing which tier a fact belongs in.

Mapping:
- Holding "8pm, table for two" in the moment → ephemeral memory (this request only)
- Remembering room 412 for your stay → session memory (this conversation)
- The multi-year guest profile → persistent memory (across sessions, one user)
- The shared desk logbook → shared memory (across agents/staff)
- Knowing which depth a fact belongs in → the core memory-architecture decision
- Night shift honoring a day-shift promise → shared memory enabling continuity

## Key Topics (5)
1. **Why memory needs layers** — A single "memory" blob fails: some facts matter only for this step, some for this conversation, some forever, some across agents. Conflating them causes leakage (a one-off detail polluting the permanent profile) and loss (a durable fact dropped with the session). Layers separate concerns by lifetime and scope.
2. **The four layers** — Ephemeral (this request/step; scratchpad, discarded after), Session (this conversation; the M12 summary + pins live here), Persistent (across sessions for one user; profile, preferences, history), Shared (across agents/users with permission; a common knowledge or coordination store). Each has a distinct scope and lifetime.
3. **Update strategies per layer** — How a fact enters and changes differs by layer: ephemeral is write-and-discard; session is append-and-compress (M12); persistent needs deliberate write policies (what's worth remembering forever?) and update/merge logic; shared needs concurrency and permission control. *(UCC domain example lives here.)*
4. **Promotion and demotion between layers** — Facts move: an ephemeral observation worth keeping is *promoted* to session; a session conclusion worth remembering is *promoted* to persistent; stale persistent facts are *demoted* or expired. Designing these transitions is the heart of memory architecture.
5. **Coherence, scope discipline, and retrieval** — Layers must stay coherent (the persistent profile shouldn't contradict the session) and scoped (don't leak one user's persistent memory into another's — ties to M23). At assembly time, you *retrieve from* the right layers and fuse them (M11) into the window.

UCC domain example appears in: Topic 3 — analyzing a debtor across the layers: ephemeral = "currently parsing filing 0012345"; session = "this analyst is reviewing FL filings, has flagged 3 so far"; persistent = "analyst prefers concise JSON, is a senior compliance reviewer"; shared = "the canonical risk verdict for debtor ACME, written by the risk-scoring agent, read by the report-generation agent." Putting a one-off parse detail into the persistent profile (wrong layer) would pollute it forever.

## Sections Outline

### Section 1: content — "One Memory Doesn't Fit All"
- The failure of a single undifferentiated memory store: facts have different natural lifetimes and scopes.
- Two symmetric failures: leakage (a transient detail written to permanent memory pollutes it) and loss (a durable fact stored only in the session dies with it).
- Thesis: memory is an architecture of layers, separated by lifetime (how long) and scope (who/what can see it).

### Section 2: content — "The Four Layers and Their Update Strategies"
- Define the four: Ephemeral (this step), Session (this conversation — M12 lives here), Persistent (across sessions, per user), Shared (across agents/users with permission).
- Each layer's update strategy: ephemeral write-and-discard; session append-and-compress; persistent deliberate-write + merge + expiry; shared concurrency + permissioned.
- UCC mapping of a single debtor analysis across all four layers; the "wrong layer" mistake (a parse detail in the permanent profile).

### Section 3: code — "A Layered Memory Store"
- Language: Python
- Demonstrates: a `Memory` with four namespaces (ephemeral, session, persistent, shared), per-layer write policies, and `promote()` to move a fact up a tier; an `assemble(query)` that pulls the relevant facts from each layer for the window.
- UCC tie-in: ephemeral parse note discarded; a session flag promoted to persistent only when it's a durable preference; the shared risk verdict written once, read by another agent.
- Shows scope discipline: persistent writes are deliberate, not automatic.

### Section 4: quiz — "Which Layer?"
- Question: "Your UCC assistant notices, while parsing one filing, that this particular PDF had an OCR glitch on page 3. It also learns that the analyst using it always wants outputs in concise JSON. Where should each fact go?"
- Options:
  - A. Both into persistent memory — more memory is always better
  - B. The OCR glitch is ephemeral (relevant only to parsing this one filing, then discarded); the analyst's concise-JSON preference is persistent (a durable, cross-session user trait)
  - C. Both into session memory — they happened in this session
  - D. Both into shared memory so all agents can see them
  - correct: B (index 1)
- Explanation: The two facts have different natural lifetimes and scopes. The OCR glitch matters only while parsing this one filing — it's ephemeral and should be discarded after, never written to a durable store (writing it to persistent would pollute the profile with transient noise). The analyst's concise-JSON preference is a stable, cross-session trait about the user — it belongs in persistent memory. Putting everything in one layer (A/C/D) causes either leakage (transient noise made permanent) or loss (durable traits dying with the session).

### Section 5: antipattern — "Memory Without Architecture"
- Anti-pattern 1: The single-blob memory — one undifferentiated store, so transient noise leaks into permanence and durable facts die with the session.
- Anti-pattern 2: Promoting indiscriminately — writing every session observation to persistent memory, bloating the profile with noise that dilutes the signal at assembly time (and raises cost forever).
- Anti-pattern 3: Scope leaks — shared/persistent memory without scope discipline, so one user's facts surface in another's context (a privacy and correctness failure; M23).

## SVG Diagram Plan
**"The Four Memory Layers" — concentric/stacked tiers by lifetime, with promotion arrows**

```
   lifetime →  this step      this convo      across sessions    across agents
   ┌──────────┐ ┌──────────┐  ┌──────────────┐  ┌──────────────┐
   │ EPHEMERAL│→│ SESSION  │→ │  PERSISTENT  │  │   SHARED     │
   │ scratch  │ │ summary+ │  │  user profile│  │ cross-agent  │
   │ discard  │ │  pins    │  │  preferences │  │ verdict log  │
   └──────────┘ └──────────┘  └──────────────┘  └──────────────┘
        promote ▲──────────────▲ (only durable facts move up)
   scope:  step      one convo    one user        many agents
```

- Four tiered boxes left→right by increasing lifetime: EPHEMERAL, SESSION, PERSISTENT, SHARED, each labeled with its content and scope.
- Curved "promote" arrows from ephemeral→session→persistent (with a note "only durable facts move up") and a small "expire/demote" arrow back down from persistent.
- A "scope" axis under the boxes (step → convo → user → many agents) and a "lifetime" axis above (this step → forever).
- The SHARED box slightly set apart with a permission/lock hint (cross-agent, permissioned).
- Colors: amethyst #7a4a8c primary, deepening tint by lifetime (ephemeral pale → persistent rich); amber #b8860b on the promote arrows (the key design decision); a small lock on SHARED; warm paper background; Fraunces title, JetBrains Mono labels.
- Reinforces the concierge analogy: four depths of memory, each with its own lifetime/scope.

## Cross-Links
- **Agent M11** (type: agent, label "Agent M11 — Agent Memory"): CLAUDE.md table maps M13↔Agent M11 (CE = state management, Agent = decomposition/memory implementation). Reference in the layers section: the agent course implements these layers in an agent's memory subsystem.

## Lab Briefs

### Understand It: Sort Facts into Layers
- Give the learner a mixed bag of ~12 facts from a UCC session (parse glitches, the filing being viewed, a risk verdict, the analyst's preferences, a cross-agent canonical decision, a transient calculation).
- They classify each into ephemeral/session/persistent/shared, justify by lifetime and scope, and flag which facts would cause leakage or loss if mis-filed.
- Expected output: a 12-row classification table + a short note on the two facts most dangerous to mis-file and why.
- Duration: ~25 minutes.

### Build It with AI: A Layered Memory Store with Promotion
- With Claude, build a `Memory` with four namespaces, per-layer write policies, a `promote(fact, to_layer)` with a durability gate, and an `assemble(query)` that fuses the relevant facts from each layer into a context block.
- Steps: implement the four stores → write policies (ephemeral discard-on-flush, persistent deliberate-write) → promotion with a durability check → assemble with scope filtering → demonstrate a transient fact correctly NOT reaching persistent, and a durable preference correctly promoted and surviving a session flush.
- Expected deliverable: a layered memory module + a demo showing correct promotion/demotion and scope-isolation (one analyst's persistent prefs not leaking into another's assembly).
- Duration: ~40 minutes.

## Context Engineering Takeaway
Memory is an architecture of layers — ephemeral, session, persistent, shared — each with its own lifetime, scope, and update policy, so the core discipline is filing every fact at the right depth and promoting only the durable ones, preventing both leakage of transient noise and loss of lasting truth.

## Anti-Patterns
1. The single-blob memory — one undifferentiated store, so transient noise leaks into permanence and durable facts die with the session.
2. Promoting indiscriminately — writing every observation to persistent memory, bloating the profile with noise that dilutes and costs forever.
3. Scope leaks — shared/persistent memory without scope discipline, surfacing one user's facts in another's context.

## Continuity Notes
- **Builds on:** M12 (the running summary and pins are exactly the session layer; this module generalizes to four layers), M11 (assembling from multiple layers is a fusion problem), M03 (persistent bloat costs forever — promote sparingly). Adds structure to the temporal dimension opened in M12.
- **Referenced by:** M14 (decay/refresh — persistent facts go stale and must expire/demote), M15 (user modeling lives in the persistent layer), M23 (multi-tenant isolation — scope discipline for shared/persistent memory), Track 7 / M26 (multi-agent context sharing uses the shared layer). Agent M11 implements agent memory.
