# M26 Lab: Understand It — Compare the Three Patterns' Context Cost

## Objective
Estimate how big each agent's context window gets under three sharing strategies, and see — in tokens — why raw-context sharing explodes while summary/scoped sharing stays bounded.

## Prerequisites
- Completed M26 module content
- A calculator or Python; no API calls required (estimation exercise)

## Setup (3 min)

The 3-agent UCC pipeline:
- **lien-researcher** — pulls raw filings across 5 states. Raw output ≈ **5 × 800 = 4,000 tokens**. Its conclusion ≈ **30 tokens** ("ACME: 7 active liens across FL/TX/NY").
- **related-party-researcher** — pulls raw corporate records. Raw output ≈ **2,500 tokens**. Conclusion ≈ **25 tokens** ("ACME: 1 related entity — ACME HOLDINGS").
- **report-writer** — needs the two conclusions + a fixed instruction prefix ≈ **400 tokens** to write the report.

## Exercise (25 min)

### Step 1: Strategy A — blackboard with RAW sharing

Both researchers write their *raw output* to the shared blackboard; the report-writer reads the whole board.

- Blackboard size = 4,000 + 2,500 = **6,500 tokens**.
- report-writer context = 400 (prefix) + 6,500 (whole board) = **6,900 tokens**.
- And every other agent that reads the board also pays the 6,500.

### Step 2: Strategy B — blackboard with SUMMARY sharing

Researchers keep raw output in their *own* context; write only conclusions to the board.

- Blackboard size = 30 + 25 = **55 tokens**.
- report-writer context = 400 + 55 = **455 tokens**.
- Raw 4,000/2,500 stay confined to each researcher.

### Step 3: Strategy C — message passing with SCOPED summaries

Each researcher sends *only its conclusion* directly to the report-writer.

- report-writer context = 400 + 30 + 25 = **455 tokens** (same as B for the writer).
- No shared board at all; each message is scoped. Awareness is lower (the researchers don't see each other), but the writer's context is minimal.

### Step 4: Tabulate

| Strategy | blackboard size | report-writer context | awareness | explodes? |
|----------|-----------------|----------------------|-----------|-----------|
| A: blackboard, raw | 6,500 | **6,900** | high | **yes** — and worsens with every agent/step |
| B: blackboard, summary | 55 | 455 | high | no |
| C: message passing, scoped | (none) | 455 | low | no |

Now project the explosion: add a 3rd researcher (another ~3,000 raw tokens) and a second report pass.
- Strategy A's board → ~9,500+ tokens, and **every reader** pays it: super-linear growth.
- Strategy B/C → a few more summary tokens. Bounded.

## Reflection Questions
1. Strategies B and C give the report-writer the *same* tiny context. What does the report-writer lose in C that it keeps in B, and when would that matter?
2. In strategy A, the raw filings were genuinely retrieved and correct — so why is putting them on the shared board still the wrong move?
3. Map each strategy to the office analogy — which is "forward me the entire email thread," and which is "just tell me the decision"?

## Key Insight
The thing that explodes in a multi-agent system is the *shared* context, and it explodes because agents share raw data instead of conclusions — so the single highest-leverage rule is to share summaries, not raw context, and keep the heavy data confined to the agent that produced it.
