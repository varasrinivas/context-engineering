# M00 Plan — Course Orientation & The Context Engineering Manifesto

## Module Identity
- **ID:** M00
- **Track:** 1 (Foundations)
- **Title:** Course Orientation & The Context Engineering Manifesto
- **Subtitle:** What context engineering is, why it matters, and how this course works
- **Icon:** 🎯
- **Color:** #4a6741 (forest)

## Everyday Analogy
**The Chef's Mise en Place**

Think of the context window as a chef's mise en place — every ingredient measured, prepped, and laid out on the counter before cooking starts. Prompt engineering only worried about the recipe card. Context engineering designs the entire counter.

Mapping:
- Counter surface area → token budget (finite)
- Ingredient selection → what context to include
- Ingredient positioning (arm's reach vs pantry) → positional effects (primacy/recency)
- Deliberate exclusion → knowing when NOT to add context (dilution)
- Prep quality → context formatting and structuring

## Key Topics (4)
1. **What is context engineering** — The discipline of designing the entire information environment of an LLM interaction, not just the prompt. Distinct from prompt engineering in scope: CE covers system prompts, retrieval, tools, history, user models, caching, guardrails, and economics.
2. **The context window as shared workspace** — The window is where human intent meets model capability. Every token competes for attention. Understanding this as a shared workspace (not a text box) changes how you design interactions.
3. **Course structure** — 8 tracks, 32 modules, dual-path labs. How the tracks build on each other. The UCC domain as the running example. Cross-links to the Agent and AI-SDLC courses.
4. **UCC Lien domain sandbox** — Setting up the development environment: Claude API access, mock SOS filings, sample debtor data, basic retrieval function. This sandbox is used throughout all 32 modules.

UCC domain example appears in: Topic 1 (contrasting naive prompt vs context-engineered approach).

## Sections Outline

### Section 1: content — "What Is Context Engineering?"
- Define CE as a discipline
- Contrast with prompt engineering (prompt = one instruction; CE = entire information environment)
- UCC example: naive "extract debtor name" vs context-engineered version with system prompt + examples + tool results + schema

### Section 2: content — "The Five Layers of Context"
- Layer 1: System (static, cacheable)
- Layer 2: Retrieval (dynamic, per-query)
- Layer 3: Tool (dynamic, per-action)
- Layer 4: Conversation (temporal, per-session)
- Layer 5: User (persistent, per-user)
- Quick mapping to UCC pipeline: system=extraction rules, retrieval=filing text, tool=debtor history lookup, conversation=analyst session, user=analyst expertise level

### Section 3: code — "A Minimal Context-Engineered API Call"
- Language: Python
- Shows a Claude API call with all 5 layers visible
- UCC domain: extracting debtor from a Florida filing with enrichment from prior filing history
- Demonstrates: system prompt structure, retrieval injection, tool result inclusion, conversation history forwarding

### Section 4: quiz — "Context Dilution"
- Question: Developer adds 50 examples, accuracy drops. Why?
- Tests WHY (dilution principle), not WHAT (definition recall)
- Correct: B — Context dilution
- Explanation: Past a threshold, more context degrades quality due to attention dilution and lost-in-the-middle effects

### Section 5: antipattern — "What Goes Wrong When You Skip Context Engineering"
- Anti-pattern 1: Great RAG retrieval but terrible formatting → model can't use the documents
- Anti-pattern 2: $4K/month API bills because no caching, compression, or budgeting
- Anti-pattern 3: Chatbot hallucinates after turn 5 because no history management

## SVG Diagram Plan
**"The Five Layers of Context" — stacked horizontal bars**

```
┌─────────────────────────────────────────────────┐
│ LAYER 1  System Context — Instructions, persona │  STATIC
├─────────────────────────────────────────────────┤
│ LAYER 2  Retrieval Context — RAG, documents     │  DYNAMIC
├─────────────────────────────────────────────────┤
│ LAYER 3  Tool Context — API results, queries    │  DYNAMIC
├─────────────────────────────────────────────────┤
│ LAYER 4  Conversation Context — History, turns  │  TEMPORAL
├─────────────────────────────────────────────────┤
│ LAYER 5  User Context — Prefs, expertise, role  │  PERSISTENT
└─────────────────────────────────────────────────┘
│                                                  │
└── CONTEXT WINDOW (vertical label) ───────────────┘
```

- Each layer uses its track color as a tint
- Right-side labels: STATIC, DYNAMIC, TEMPORAL, PERSISTENT
- Left vertical dashed line labeled "CONTEXT WINDOW"
- Background: warm paper (#f6f3ec)
- Labels: JetBrains Mono for layer numbers, Inter for descriptions

## Cross-Links
None for M00 (orientation module). Future modules will reference back to M00's five-layer model.

## Lab Briefs

### Understand It: Inspect Raw Context Windows
- Inspect 3 real Claude API calls (simple, RAG, agent)
- For each: count tokens per layer, calculate % allocation
- Map every token to one of the 5 layers
- Expected output: a table showing token budget allocation across layers
- Duration: ~25 minutes

### Build It with AI: Set Up the UCC Sandbox
- Create the UCC Lien domain sandbox:
  - 10 mock SOS filings (UCC-1, UCC-3 mix)
  - Sample debtor/secured party data
  - A basic Python retrieval function
- Make first context-engineered API call using all 5 layers
- Verify: model correctly extracts debtor from a tricky filing
- Duration: ~35 minutes

## Context Engineering Takeaway
Context engineering is the discipline of designing the entire information environment of an LLM interaction — not just the prompt, but every token that enters the context window and every constraint on what comes out.

## Anti-Patterns
1. Treating the context window as "just a text box" instead of a designed artifact
2. Ignoring token economics until the API bill arrives
3. Assuming more context always means better answers (dilution is real)

## Continuity Notes
- **Builds on:** Nothing — this is M00
- **Referenced by:** Every subsequent module references the five-layer model from M00. M02 expands the paradigm shift concept. M03 deep-dives into the economics introduced here.
