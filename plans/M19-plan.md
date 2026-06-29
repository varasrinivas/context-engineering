# M19 Plan — Caching and Prefilling: Prompt Caching, Prefill Strategies, Cost Optimization

## Module Identity
- **ID:** M19
- **Track:** 5 (Context Positioning & Optimization)
- **Title:** Caching and Prefilling — Prompt Caching, Prefill Strategies, Cost Optimization
- **Subtitle:** Not paying full price to re-process the stable parts of your context on every call
- **Icon:** ⚡
- **Color:** #b8860b (amber)

## Everyday Analogy
**The Restaurant Prep Kitchen**

A good restaurant doesn't make every sauce from scratch when you order. Before service, the prep kitchen makes the base stocks, the mother sauces, the mise en place — the parts that are identical for every plate that night. When your order comes in, the line cook reuses those prepped bases and only does the per-order work: searing your steak, plating, the final garnish. The kitchen would collapse if it re-chopped every onion per ticket. Prompt caching is the prep kitchen: the stable parts of your context (system prompt, rules, examples) are prepped once and reused cheaply across thousands of calls, while only the per-request part (this filing, this question) is cooked fresh.

Mapping:
- Base stocks and mother sauces made before service → the static context layer (system prompt, rules, examples) cached once
- Reusing the prepped base for every plate → cache reads at a fraction of the price
- Searing the steak per order → the per-request variable content (the filing) processed fresh
- Re-chopping every onion per ticket → re-processing the full prompt on every call (M03's hidden tax)
- The prep going stale by end of night → cache TTL expiry
- Changing the recipe mid-service ruins the prepped base → a silent invalidator changing the cached prefix

## Key Topics (5)
1. **Why caching exists: the static layer is a per-call tax** — M04's system prompt is identical on every call, yet M03 showed you pay for it every single time. Prompt caching lets the model reuse already-processed stable tokens at roughly a tenth of the price, turning the largest repeated cost into a near-free one.
2. **How prompt caching works: prefix match** — Caching is a *prefix* match. The model caches the exact processed tokens up to a `cache_control` breakpoint; any byte change anywhere in that prefix invalidates everything after it. Render order is fixed (tools → system → messages), so stable content must come first and volatile content last. *(UCC domain example lives here.)*
3. **Designing for cacheability — and the silent invalidators** — A cacheable prompt has a frozen prefix: no timestamps, no UUIDs, no unsorted JSON, no per-user IDs, no varying tool set in the cached region. These "silent invalidators" don't error — they just quietly drop your cache hit rate to zero. You verify with the cache-read token count, not by hoping.
4. **TTL and the economics of caching** — Cache reads cost ~0.1× the base input price; cache *writes* cost more (~1.25× for the 5-minute TTL, ~2× for the 1-hour TTL). So caching pays off only with reuse — roughly two-plus calls on the same prefix within the TTL. The break-even, the TTL choice, and pre-warming are economic decisions (ties to M03).
5. **Prefilling and output shaping** — "Prefilling" the start of the model's response is a classic way to lock output format — but on current Claude models the assistant-turn prefill returns a 400, and the modern replacement is **structured outputs** (`output_config.format`) or a system-prompt output contract (M04/M21). Caching the stable prefix and constraining the output are the two halves of cost-and-shape control on the call.

UCC domain example appears in: Topic 2 — the UCC extraction system prompt (rules + few-shot examples from M04/M07) is byte-identical across 50,000 filings/day. Put a `cache_control` breakpoint at the end of that stable system block, leave the per-filing text in the user message *after* the breakpoint; the first call writes the cache, every subsequent call reads it at ~10% the input price while only the filing is processed fresh.

## Sections Outline

### Section 1: content — "The Static Layer Is a Tax You Pay Every Call"
- Recap M03: cost is per-token-per-call; M04: the system prompt (rules + examples) is the largest stable block and it's resent every time.
- Prompt caching breaks that: the model processes the stable prefix once, stores the result, and reuses it on later calls at a fraction of the price.
- Thesis: caching turns your biggest repeated cost into a near-free one — but only if the prefix is genuinely stable.

### Section 2: content — "Prefix Match: How Caching Actually Works"
- The one invariant: caching is a prefix match. The cache key is the exact bytes up to a `cache_control` breakpoint; one byte change at position N invalidates everything from N onward.
- Render order is fixed: tools → system → messages. So put stable content first (frozen system prompt, deterministic tool list), volatile content last (this filing, this question).
- UCC tie-in: breakpoint at the end of the system block; the filing text lives in the user message after it. First call = cache write; subsequent calls = cache read. Verify with the cache-read token count.

### Section 3: code — "Caching a UCC System Prompt"
- Language: Python
- Demonstrates: a Claude API call placing `cache_control: {"type": "ephemeral"}` on the last (stable) system block, with the per-filing text in the user message (uncached); then printing `usage.cache_creation_input_tokens` vs `usage.cache_read_input_tokens` across two calls to show the write-then-read pattern.
- UCC tie-in: the extraction rules + examples cached; the filing processed fresh; the second call reads the cache.
- Note the silent-invalidator warning inline (no `datetime.now()` in the system prompt).

### Section 4: quiz — "Why Is cache_read Always Zero?"
- Question: "You added cache_control to your UCC system prompt, but across thousands of identical-rules calls, usage.cache_read_input_tokens is always 0 — you're paying full price every time. The only thing that varies between calls is a line you put at the top of the system prompt: 'Current date: {today}'. What's happening?"
- Options:
  - A. Caching is broken; file a bug with the provider
  - B. A silent invalidator: the changing date at the TOP of the prefix changes the cached bytes every call, so the prefix never matches — move per-call values (date, IDs) out of the cached prefix and into the message after the breakpoint
  - C. The system prompt is too short to cache
  - D. You need to call the cache 'refresh' endpoint manually
  - correct: B (index 1)
- Explanation: Caching is a prefix match, and the cached prefix must be byte-identical across calls. A `Current date: {today}` line at the top changes the very first tokens of the prefix every call, so nothing downstream ever matches — cache_read stays 0 and you pay full price. The fix is to freeze the prefix: move volatile values (the date, request IDs, per-user data) out of the cached region and into the message content after the cache_control breakpoint. Caching isn't broken (A); short prompts silently don't cache but that's a different symptom (C); and there is no manual refresh endpoint (D).

### Section 5: antipattern — "Cache Misses You Never Notice"
- Anti-pattern 1: Silent invalidators in the prefix — a timestamp, UUID, per-user ID, or unsorted JSON in the cached region, so the hit rate is zero and nobody notices because nothing errors.
- Anti-pattern 2: Caching without reuse — adding cache_control to a prompt that's only ever called once per prefix, paying the write premium for a read that never comes.
- Anti-pattern 3: Volatile-first ordering — putting the per-request content before the stable content, so there's no shared prefix to cache at all (and confusing this with a prefill, which current models reject with a 400 anyway).

## SVG Diagram Plan
**"The Prep Kitchen: Cached Prefix vs. Fresh Suffix" — a prompt split at the cache breakpoint, with the write-once / read-many economics**

```
   RENDER ORDER:  tools → system → messages
   ┌──────────────────────────────┊─────────────────┐
   │  STABLE PREFIX (prepped once) ┊ FRESH SUFFIX    │
   │  rules + few-shot examples    ┊ this filing,    │
   │  [cache_control breakpoint] ──┘ this question   │
   └──────────────────────────────┴─────────────────┘
        ▲ cache WRITE (1.25×) once    ▲ full price every call
        └ cache READ (0.1×) every call after

   freeze the prefix → no dates, UUIDs, unsorted JSON, varying tools
```

- A horizontal prompt bar split by a dashed "cache breakpoint" line into a left STABLE PREFIX (rules + examples, tinted amber, labeled "prepped once") and a right FRESH SUFFIX (the filing/question, tinted neutral, "cooked per order").
- Below the prefix: "cache WRITE 1.25× (first call) → cache READ 0.1× (every call after)"; below the suffix: "full input price every call."
- A render-order label across the top: "tools → system → messages (stable first, volatile last)."
- A red caution strip: "freeze the prefix — a date / UUID / unsorted JSON here = cache hit rate 0."
- A small TTL note: "prefix expires after the TTL (5 min default · 1 hr option) — re-warm or it goes cold."
- Colors: amber #b8860b for the cached prefix and savings; neutral grey for the fresh suffix; signal-red #c0392b for the invalidator caution; deep-water accent on the verify/read note; warm paper background; Fraunces title, JetBrains Mono labels.
- Reinforces the prep-kitchen analogy: base sauces prepped once (cached), per-order work fresh.

## Cross-Links
- **SDLC Cost** (type: sdlc, label "SDLC Cost"): CLAUDE.md curriculum map lists M19 cross-link "SDLC Cost." Caching is the highest-leverage production cost lever; reference how the AI-SDLC cost track treats caching as a budgeting and FinOps concern. Place in the economics section.

## Lab Briefs

### Understand It: Watch a Cache Hit (and a Miss)
- The learner makes two identical-prefix UCC calls with `cache_control` on the system block and records `cache_creation_input_tokens` (call 1) and `cache_read_input_tokens` (call 2), confirming the write-then-read pattern and the price difference.
- Then they introduce a silent invalidator (a `Current date:` line at the top of the system prompt) and watch cache_read drop to 0 across calls.
- Expected output: a short table (call, cache_creation, cache_read, input) for the working case and the broken case, plus a one-line diagnosis of the invalidator.
- Duration: ~25 minutes.

### Build It with AI: A Cacheable Prompt Builder
- With Claude, build a `build_prompt(filing)` that assembles a deliberately cacheable request: a frozen, deterministic system prefix (rules + sorted examples, no timestamps/UUIDs) with a `cache_control` breakpoint, and the per-filing content placed strictly after it; plus a cacheability linter that scans the prefix for silent invalidators (date/uuid/unsorted-json/per-user-id) and flags them.
- Steps: assemble frozen prefix → place breakpoint → put filing after it → run a batch and confirm cache_read dominates after the first call → run the linter and have it catch a deliberately planted invalidator.
- Expected deliverable: a prompt builder + a linter, and a before/after showing cache hit rate going from 0% (invalidator present) to high (invalidator removed), with the per-call cost difference.
- Duration: ~40 minutes.

## Context Engineering Takeaway
Prompt caching turns the static layer from a tax you pay on every call into a near-free reused asset — but only if you freeze the prefix (stable content first, volatile content last, no silent invalidators), choose a TTL that matches your reuse, and verify hits with the cache-read token count rather than assuming.

## Anti-Patterns
1. Silent invalidators in the cached prefix — a timestamp, UUID, per-user ID, or unsorted JSON that changes the bytes every call, dropping the hit rate to zero with no error.
2. Caching without reuse — paying the cache-write premium on a prefix that's only ever called once before the TTL expires.
3. Volatile-first ordering — putting per-request content before the stable content so there is no shared prefix to cache (and conflating this with prefill, which current Claude models reject with a 400).

## Continuity Notes
- **Builds on:** M03 (cost-per-token-per-call — caching attacks the largest repeated cost), M04 (the stable system prompt is the prime cache candidate), M18 (cache the *compressed* stable prefix — compression and caching compound), M14 (cache invalidation is staleness detection applied to the prompt cache). Closes Track 5 by optimizing the final window's cost over time.
- **Referenced by:** M21 (output shaping / structured outputs — the modern replacement for prefill), M22 (cost/compliance — caching interacts with what may be cached), M28-M30 (observability/versioning — monitoring cache hit rate, and a prompt version change is a deliberate cache invalidation), M31 (the capstone caches its stable pipeline prefix). With M16-M18, M19 completes Track 5: position, order, compress, and cache the window.
