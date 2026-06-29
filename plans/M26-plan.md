# M26 Plan — Multi-Agent Context Sharing: Hub-Spoke, Blackboard, Message Passing

## Module Identity
- **ID:** M26
- **Track:** 7 (Agent Context Patterns)
- **Title:** Multi-Agent Context Sharing — Hub-Spoke, Blackboard, Message Passing
- **Subtitle:** How multiple agents share context without the window exploding or one agent's state contaminating another's
- **Icon:** 🕸️
- **Color:** #1a5276 (steel)

## Everyday Analogy
**Three Ways an Office Coordinates**

A company coordinates work three ways, and each fits a different situation. The **CEO** model: everyone reports to one boss who holds the big picture, assigns work, and routes information — clear control, but the CEO is a bottleneck and sees everything. The **shared Slack channel**: everyone posts updates to one common board that all can read — great for shared awareness, but the channel gets noisy and everyone wades through messages that aren't theirs. **Direct email**: people message exactly the colleagues they need — efficient and private, but no one has the full picture and threads get tangled. Multi-agent context sharing is the same three choices: hub-and-spoke (the CEO), blackboard (the Slack channel), and message-passing (direct email) — each trading control, awareness, and context size differently.

Mapping:
- The CEO holding the big picture and routing → hub-and-spoke (a coordinator owns shared context)
- The CEO as bottleneck, seeing everything → the hub's context explodes; single point of pressure
- The shared Slack channel everyone reads → blackboard (one shared context store)
- The noisy channel everyone wades through → blackboard bloat / irrelevant context for each agent
- Direct email to exactly who you need → message passing (point-to-point, scoped context)
- No one has the full picture → message passing's weakness: fragmented awareness

## Key Topics (5)
1. **Why multi-agent, and the context problem it creates** — Splitting a task across specialized agents (a researcher, a scorer, a reporter) improves focus and parallelism (M25's DAG sub-tasks). But it creates a new problem: how do agents share what they've learned? Each agent has its own loop context (M24); coordinating them means moving context between windows — and that's where it explodes or leaks.
2. **Pattern 1 — Hub-and-spoke** — A coordinator agent holds the shared context and delegates scoped sub-tasks to worker agents, collecting their results. Clear control and clean worker contexts, but the hub's context accumulates everything (a bottleneck and a context-pressure point — M24 applies to the hub).
3. **Pattern 2 — Blackboard** — All agents read from and write to one shared context store. Maximum awareness — any agent sees any other's findings — but the blackboard grows noisy: each agent's window fills with content irrelevant to its task (dilution, M16/M03). Needs scoped reads. *(UCC domain example lives here.)*
4. **Pattern 3 — Message passing** — Agents send scoped messages directly to the agents that need them. Each agent's context stays minimal and relevant; private and efficient. The cost is fragmented awareness — no single place has the whole picture — and coordination complexity.
5. **The context-size explosion and how to contain it** — The core risk across all patterns: shared context grows super-linearly with agents and steps. Containment: pass *summaries not raw context* between agents (M10/M18), scope what each agent receives to its task, and respect tenant/trust boundaries (M23/M05) so one agent's context can't contaminate another's. Choose the pattern by the task's control/awareness/size tradeoff.

UCC domain example appears in: Topic 3 — a UCC risk pipeline split into a lien-researcher, a related-party-researcher, and a report-writer. With a naive blackboard, the report-writer's window fills with every raw filing both researchers pulled (thousands of tokens of irrelevant detail). The fix: researchers write *shaped summaries* to the blackboard ("debtor ACME: 7 active liens across 3 states; 1 related entity"), the report-writer reads only the summaries it needs, and the raw filings stay in each researcher's own scoped context.

## Sections Outline

### Section 1: content — "Many Agents, Many Windows"
- Why split a task across agents: specialization, parallelism (M25's DAG), focus. Each sub-agent is its own loop (M24) with its own context.
- The new problem: agents must share what they learn, which means moving context between windows. Done naively, the shared context explodes or one agent's state contaminates another.
- Thesis: multi-agent design is fundamentally a *context-sharing* design decision.

### Section 2: content — "Three Patterns and Their Tradeoffs"
- Hub-and-spoke (CEO): coordinator holds shared context, delegates scoped tasks, collects results. Clean workers, but the hub is a bottleneck and accumulates everything.
- Blackboard (Slack channel): shared store all read/write. Max awareness, but noisy — each window fills with irrelevant content; needs scoped reads.
- Message passing (direct email): point-to-point scoped messages. Minimal, private contexts; but fragmented awareness and coordination complexity.
- Choose by the task's control vs. awareness vs. context-size needs.

### Section 3: content — "Containing the Context Explosion"
- The core risk: shared context grows super-linearly with agents × steps. Every pattern can blow up.
- Containment principles: pass summaries, not raw context (M10 shaping, M18 compression); scope each agent's reads to its task; enforce trust/tenant boundaries (M05/M23) so contamination can't cross.
- UCC tie-in: the researchers write shaped summaries to a blackboard; the report-writer reads only what it needs; raw filings stay in each researcher's scoped context.

### Section 4: quiz — "Why Is the Report-Writer Out of Context?"
- Question: "Your UCC pipeline has a lien-researcher, a related-party-researcher, and a report-writer sharing one blackboard. The report-writer keeps running out of context window and producing incomplete reports. Inspecting the blackboard, it's full of every raw filing both researchers retrieved. What's the fix?"
- Options:
  - A. Give the report-writer a bigger context window
  - B. Have the researchers write shaped SUMMARIES to the blackboard (not raw filings), and have the report-writer read only the summaries relevant to its task — keeping raw context in each researcher's own scoped window so the shared context stays small and relevant
  - C. Merge all three agents back into one agent
  - D. Add more report-writer agents to share the load
  - correct: B (index 1)
- Explanation: The blackboard is sharing raw context instead of conclusions, so the report-writer's window fills with thousands of tokens of filing detail it doesn't need — context explosion plus dilution (M16/M03). The fix is to share summaries, not raw data: each researcher shapes its findings down to the conclusions the writer needs (M10/M18) and writes those to the blackboard, while the bulky raw filings stay in the researcher's own scoped context. The report-writer reads only the relevant summaries. A bigger window (A) just delays the explosion; merging agents (C) abandons the specialization/parallelism you split for; more writers (D) all face the same bloated blackboard.

### Section 5: antipattern — "Context Sprawl Across Agents"
- Anti-pattern 1: Sharing raw context instead of summaries — agents pass full tool dumps and histories to each other, so the shared context explodes super-linearly.
- Anti-pattern 2: Unscoped blackboard — every agent reads the entire shared store, filling each window with content irrelevant to its task (dilution).
- Anti-pattern 3: No boundary between agents' contexts — one agent's state (or a tenant's data, M23) bleeds into another's window, causing contamination and confusion.

## SVG Diagram Plan
**"Three Sharing Patterns" — hub-spoke, blackboard, message-passing side by side, with the 'share summaries' rule**

```
   HUB-AND-SPOKE         BLACKBOARD            MESSAGE PASSING
   (CEO)                 (Slack channel)       (direct email)
        ┌───┐            ┌───────────┐          A ──► B
     ┌──┤Hub├──┐         │ shared    │          │     │
     ▼  └─┬─┘  ▼         │ store     │          ▼     ▼
    W1   W2   W3      A──►│ (all r/w) │◄──B      C ──► D
     ▲    ▲    ▲         └─────┬─────┘
     └────┴────┘            C ─┘
   control, hub bloats   awareness, gets noisy   minimal+private, fragmented
   ─────────────────────────────────────────────────────────────────
   ACROSS ALL: share SUMMARIES not raw context · scope reads · keep boundaries
```

- Three mini-diagrams side by side: HUB-AND-SPOKE (a central hub with workers radiating), BLACKBOARD (agents around a central shared store with read/write arrows), MESSAGE-PASSING (agents with point-to-point arrows).
- Under each, its one-line tradeoff (control/hub bloats · awareness/noisy · minimal+private/fragmented).
- A bottom rule banner spanning all three: "share SUMMARIES not raw context · scope reads · keep boundaries."
- Colors: steel #1a5276 primary for the agents/structures; amber #b8860b accent on the bottom containment rule; a subtle red hint on the "bloats/noisy" warnings; warm paper background; Fraunces title, JetBrains Mono labels.
- Reinforces the CEO/Slack/email analogy directly, three-up.

## Cross-Links
- **Agent M14** (type: agent, label "Agent M14 — Multi-Agent Orchestration"): CLAUDE.md table maps M26↔Agent M14 (CE = context sharing; Agent = orchestration). This module is the context-sharing half; the Agent course covers orchestration. Reference in the patterns section.

## Lab Briefs

### Understand It: Compare the Three Patterns' Context Cost
- Give the learner the 3-agent UCC pipeline and have them estimate each agent's window size under (A) blackboard with raw sharing, (B) blackboard with summary sharing, (C) message passing with scoped summaries.
- They compute the report-writer's context size in each and identify which patterns explode and why.
- Expected output: a table (pattern → report-writer context tokens → awareness level → explodes?) showing raw-sharing explodes while summary/scoped sharing stays bounded.
- Duration: ~25 minutes.

### Build It with AI: A Summary-Sharing Blackboard
- With Claude, build a `Blackboard` where agents write *shaped summaries* (not raw context) under scoped keys, and a `read(scope)` that returns only the entries an agent's task needs; wire the 3-agent UCC pipeline so researchers write summaries and the report-writer reads only what it needs.
- Steps: researchers pull raw filings into their OWN context → shape to a summary → write to the blackboard under a scope → report-writer reads only relevant scopes → confirm the report-writer's context stays small and the report is complete; show the naive raw-sharing version exploding.
- Expected deliverable: a scoped summary-sharing blackboard + a comparison showing the report-writer's context bounded under summary sharing and blown out under raw sharing, with the raw filings confined to each researcher.
- Duration: ~40 minutes.

## Context Engineering Takeaway
Multi-agent systems are a context-sharing design: choose hub-and-spoke, blackboard, or message-passing by the task's control/awareness/size tradeoff, and across all of them share summaries rather than raw context, scope each agent's reads to its task, and enforce boundaries — because shared context grows super-linearly and is the thing most likely to explode or leak.

## Anti-Patterns
1. Sharing raw context instead of summaries — passing full tool dumps and histories between agents, so the shared context explodes super-linearly.
2. Unscoped blackboard — every agent reads the entire shared store, filling each window with content irrelevant to its task.
3. No boundary between agents' contexts — one agent's state or a tenant's data bleeds into another's window, causing contamination.

## Continuity Notes
- **Builds on:** M24 (each agent has its own loop context; the hub accumulates), M25 (the coordinator delegates DAG sub-tasks), M10/M18 (share shaped summaries, not raw), M11 (fusing multi-agent outputs), M23/M05 (boundaries between agents). The multi-agent view of context.
- **Referenced by:** M27 (a human is another 'agent' to share scoped context with), M31 (the capstone is a multi-agent pipeline). Agent M14 covers the orchestration this module's context-sharing supports. Closes the autonomous-agent middle of Track 7; M27 adds the human.
