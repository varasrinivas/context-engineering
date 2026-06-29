# M23 Plan — Multi-Tenant Context Isolation

## Module Identity
- **ID:** M23
- **Track:** 6 (Guardrails & Safety Context)
- **Title:** Multi-Tenant Context Isolation
- **Subtitle:** Keeping one customer's context out of another's window — contamination risks, isolation strategies, and leakage testing
- **Icon:** 🚪
- **Color:** #c0392b (signal red)

## Everyday Analogy
**Apartment Building Plumbing**

A good apartment building gives every unit its own plumbing. Your water and your neighbor's never mix — separate supply lines, separate drains, a backflow preventer so a clog in 4B can't push sewage into 4A. The building shares the *infrastructure* (one main, one pump) but the *contents* of each unit's pipes stay strictly separate. If they didn't, one tenant's waste would surface in another's sink — a disaster you'd never accept. Multi-tenant context isolation is the same: many customers share one LLM system (the infrastructure), but each tenant's context — their documents, their memory, their cached data — must never flow into another tenant's window. The shared pump is fine; the cross-contamination is not.

Mapping:
- Shared main, pump, building → shared LLM system, model, infrastructure
- Each unit's separate water/drain → each tenant's isolated context, memory, cache
- A clog in 4B reaching 4A → one tenant's data leaking into another's window (contamination)
- The backflow preventer → isolation enforcement (tenant-scoped keys, namespaces, filters)
- Inspecting for cross-connections → leakage testing
- One tenant's waste in another's sink → a confidentiality breach you can never accept

## Key Topics (5)
1. **The contamination risk in shared systems** — Most production LLM apps are multi-tenant: many customers share one deployment. The danger is cross-tenant contamination — tenant A's filing, memory, or cached prompt surfacing in tenant B's context window. It's a confidentiality breach and a compliance violation (M22), and it usually happens by accident, not attack.
2. **Where leaks come from** — Contamination sneaks in through shared state: a retrieval index not filtered by tenant, a memory store keyed only by user (M13) that returns another tenant's facts, a prompt cache (M19) whose prefix is shared across tenants, an over-broad RAG query, or a "shared" memory layer with no scope. Each shared component is a potential cross-connection. *(UCC domain example lives here.)*
3. **Isolation strategies along a spectrum** — From strongest/most-expensive to lightest: fully separate deployments per tenant (hard isolation, costly), separate data stores/indexes per tenant, shared store with mandatory tenant-scoped filtering (a tenant_id on every read), and logical namespacing with enforced scoping at the assembly layer. The right level depends on data sensitivity and scale.
4. **Enforcing scope at every boundary** — Isolation isn't one switch; it's a tenant_id that must travel with and constrain *every* context operation: every retrieval query, every memory read/write, every cache key, every log entry. A single un-scoped read is the leak. Make tenant-scoping mandatory and fail-closed (no tenant_id → no data).
5. **Leakage testing — proving isolation** — You don't trust isolation, you test it: seed tenant A with a unique canary fact, run tenant B's queries, and assert A's canary never appears in B's context or output. Continuous, adversarial leakage tests across retrieval, memory, and cache are how you prove the building's plumbing is actually separate.

UCC domain example appears in: Topic 2 — a SaaS UCC risk platform serving two competing lenders. A retrieval index over filings is *not* filtered by tenant, so lender B's query "show high-risk debtors in Florida" returns filings lender A uploaded privately — leaking A's portfolio to a competitor. The fix: a mandatory `tenant_id` filter on every retrieval, tenant-scoped memory and cache keys, and a leakage test seeding a canary debtor in A and asserting it never appears for B.

## Sections Outline

### Section 1: content — "Shared Infrastructure, Separate Contents"
- Most LLM apps are multi-tenant: one deployment, many customers. That's efficient — and dangerous.
- The risk: cross-tenant contamination, where one tenant's context enters another's window. A confidentiality breach and a compliance violation (M22), usually accidental.
- The apartment principle: share the infrastructure, never the contents.

### Section 2: content — "Where Leaks Come From, and How to Stop Them"
- Leak sources: unfiltered retrieval indexes, user-keyed memory that ignores tenant, shared cache prefixes (M19), over-broad RAG, scopeless "shared" memory (M13).
- Isolation spectrum: separate deployments → separate stores → shared store + mandatory tenant filter → logical namespacing with enforced scoping. Match to sensitivity/scale.
- The core rule: a `tenant_id` must travel with and constrain *every* context operation — retrieval, memory, cache key, log. Fail-closed: no tenant_id, no data.
- UCC tie-in: the unfiltered filing index leaking lender A's portfolio to competitor lender B.

### Section 3: code — "Tenant-Scoped Context Assembly"
- Language: Python
- Demonstrates: a context assembler where every operation is tenant-scoped — `retrieve(query, tenant_id)` filters the index by tenant, memory reads are namespaced by tenant, the cache key includes the tenant_id, and an assertion fails-closed if tenant_id is missing. Shows a cross-tenant query returning nothing of the other tenant's.
- UCC tie-in: lender B's query returns only lender B's filings; lender A's canary filing is unreachable.
- Emphasize: scoping is mandatory at every boundary, not optional.

### Section 4: quiz — "The Competitor's Portfolio"
- Question: "Your SaaS UCC platform serves two competing lenders on one deployment. Lender B runs 'show me high-risk debtors in Florida' and the results include filings that lender A uploaded privately. Your retrieval index is shared and not filtered by tenant. What's the fix?"
- Options:
  - A. Tell lender B to ignore any results that aren't theirs
  - B. Enforce tenant isolation: add a mandatory tenant_id filter to every retrieval (and every memory read and cache key), fail-closed when tenant_id is absent, and add a leakage test that seeds a canary in tenant A and asserts it never appears for tenant B
  - C. Give each lender a separate copy of the entire application and database
  - D. Add a line to the system prompt: 'only show the current tenant's data'
  - correct: B (index 1)
- Explanation: The leak is structural — a shared retrieval index with no tenant filter — so the fix must be structural and mandatory: every context operation (retrieval, memory, cache) carries and is constrained by a tenant_id, and the system fails closed when it's missing (no tenant_id → no data). Then you *prove* it with leakage tests (a canary in A that must never surface for B). Asking the user to ignore stray results (A) leaves the breach in place; a fully separate deployment per tenant (C) is one valid but heavyweight isolation level that may be overkill versus mandatory filtering at scale; and a system-prompt instruction (D) is unenforced — the wrong data is already in the window, and the model is not a security boundary.

### Section 5: antipattern — "Trusting the Shared Pipe"
- Anti-pattern 1: Un-scoped retrieval — a shared index queried without a tenant filter, so any tenant's broad query can surface another tenant's documents.
- Anti-pattern 2: The model as the isolation boundary — relying on a system-prompt instruction ('only show this tenant') to keep data separate, when the leaked data is already in the window and the model is not a security control.
- Anti-pattern 3: No leakage testing — assuming isolation works because it was configured once, with no canary-based tests proving tenant A's data never reaches tenant B across retrieval, memory, and cache.

## SVG Diagram Plan
**"Shared Infrastructure, Isolated Tenants" — two tenants sharing a system, contents kept separate, a leak blocked**

```
        ┌──────────── SHARED LLM SYSTEM (model, infra) ────────────┐
        │                                                           │
   TENANT A                                                  TENANT B
   ┌─────────┐   tenant_id=A on every op    tenant_id=B on every op  ┌─────────┐
   │ A's index│◄── retrieve(q, A) ──┐          ┌── retrieve(q, B) ──►│ B's index│
   │ A's memory│                    │          │                     │ B's memory│
   │ A's cache │   ✕ ── retrieve(q, B) reaches A's index ── BLOCKED  │ B's cache │
   └─────────┘                                                       └─────────┘
        │                                                           │
        └──── leakage test: canary in A must NEVER appear for B ────┘
   "share the pump, never the pipes — fail closed if tenant_id is missing"
```

- A large "SHARED LLM SYSTEM" container holding two tenant columns (TENANT A, TENANT B), each with its own index/memory/cache.
- Arrows: `retrieve(q, A) → A's store` and `retrieve(q, B) → B's store` (allowed, green); a crossing arrow `retrieve(q, B) → A's store` struck with a red ✕ "BLOCKED — tenant filter."
- A bottom rail: "leakage test: canary in A must NEVER appear for B."
- A backflow-preventer / valve icon on the boundary; a fail-closed note "no tenant_id → no data."
- Colors: signal-red #c0392b for the isolation boundary and the blocked leak; green-ish for the allowed same-tenant reads; amber accent on the leakage-test rail; warm paper background; Fraunces title, JetBrains Mono labels.
- Reinforces the apartment-plumbing analogy: shared building, separate pipes, backflow preventer.

## Cross-Links
- None tagged in the curriculum map for M23. `crosslinks: []`. (In prose, lean on M13 (scope discipline for shared/persistent memory), M19 (cache key must include tenant), M22 (isolation is a compliance control), M11 (trust/scope) — but no formal Agent/SDLC tags.)

## Lab Briefs

### Understand It: Find the Cross-Tenant Leak
- Give the learner a multi-tenant UCC retrieval setup with a shared, unfiltered index and two tenants; they run tenant B's query and observe tenant A's private filings in the results, then trace which shared components (index, memory, cache) carry the leak.
- They mark each component as isolated or leaking and specify the scoping fix for each.
- Expected output: a table (component → tenant-scoped? → leak? → fix) and a demonstration that B's query currently returns A's canary filing.
- Duration: ~25 minutes.

### Build It with AI: Tenant-Scoped Assembly + a Leakage Test
- With Claude, build a context layer where retrieval, memory, and cache are all tenant-scoped (mandatory tenant_id, fail-closed when absent) and a leakage test that seeds a unique canary in tenant A and asserts it never appears in tenant B's retrieved context, memory, or output.
- Steps: add tenant_id to every read (retrieve/memory/cache key) → fail-closed guard → seed canary in A → run B's queries → assert canary absent for B across all paths → confirm same-tenant reads still work.
- Expected deliverable: a tenant-scoped assembler + a passing leakage test proving A's canary never reaches B (and a deliberately un-scoped version where the test FAILS, to show the test has teeth).
- Duration: ~40 minutes.

## Context Engineering Takeaway
In a shared multi-tenant system, isolation is not optional or model-enforced: a tenant_id must travel with and constrain every context operation — retrieval, memory, cache, and log — failing closed when it's absent, and you prove it holds with canary-based leakage tests, because one un-scoped read is a confidentiality breach.

## Anti-Patterns
1. Un-scoped retrieval — a shared index queried without a tenant filter, so any tenant's broad query can surface another tenant's documents.
2. The model as the isolation boundary — relying on a system-prompt instruction to keep tenants separate when the leaked data is already in the window and the model is not a security control.
3. No leakage testing — assuming isolation works because it was configured once, with no canary tests proving tenant A's data never reaches tenant B.

## Continuity Notes
- **Builds on:** M13 (scope discipline for shared/persistent memory — the per-tenant boundary), M19 (the cache key must include the tenant or prefixes leak across tenants), M22 (isolation is a core compliance control — one tenant's PII must not reach another), M11 (trust/scope). Closes Track 6 — the security/governance track.
- **Referenced by:** M26 (multi-agent context sharing — agents must respect tenant boundaries too), M28 (monitoring for leakage), M31 (the capstone is a multi-tenant-aware production pipeline). With M20 (input), M21 (output), M22 (compliance), and M23 (isolation), Track 6 fully governs the context window; Track 7 turns to agent-specific patterns.
