# M24 Lab: Understand It — Watch Context Pressure Build

## Objective
Run a naive append-only agent loop over a multi-step UCC investigation, chart the window growing every iteration, and catch the exact moment the agent's goal gets buried and it re-does a step.

## Prerequisites
- Completed M24 module content
- Claude API access, Python 3.10+ with `anthropic`

## Setup (5 min)

Create `investigation.py` — a 5-state lien investigation with verbose tool results:
```python
GOAL = "Compute total active liens for debtor ACME across FL, TX, NY, GA, CA."

# Each tool call returns a deliberately verbose filing dump (lots of noise).
def tool_lookup(state):
    rows = "\n".join(f"  filing 2024-{state}-{i:05d}: routine UCC-1, secured party "
                     f"COMMUNITY BANK {i}, collateral all-assets, status "
                     f"{'active' if i < {'FL':3,'TX':2,'NY':2,'GA':0,'CA':1}[state] else 'terminated'}"
                     for i in range(8))
    active = {'FL':3,'TX':2,'NY':2,'GA':0,'CA':1}[state]
    return f"STATE {state} FILINGS (verbose):\n{rows}\nACTIVE COUNT: {active}"
```

## Exercise (25 min)

### Step 1: A naive append-only loop

Create `naive_loop.py`:
```python
import anthropic
from investigation import GOAL, tool_lookup
client = anthropic.Anthropic()

STATES = ["FL", "TX", "NY", "GA", "FL"]   # NOTE: FL appears twice on purpose

context = GOAL + "\n"
print(f"{'iter':<5}{'state':<7}{'win_tokens':>12}{'goal_legible':>14}")
for i, state in enumerate(STATES, 1):
    # APPEND-ONLY: every raw tool dump is kept in the growing context.
    context += "\n" + tool_lookup(state)
    msgs = [{"role": "user", "content":
             context + "\n\nWhich states have you covered so far, and what's the running "
             "active-lien total? Answer in one line."}]
    toks = client.messages.count_tokens(model="claude-sonnet-4-6", messages=msgs).input_tokens
    ans = client.messages.create(model="claude-sonnet-4-6", max_tokens=80,
            messages=msgs).content[0].text.strip()
    # Is the GOAL still near the top / legible? crude proxy: does the model still
    # name the goal correctly when asked?
    print(f"{i:<5}{state:<7}{toks:>12}  {ans[:40]}")
```

Run it: `python naive_loop.py`

**What to observe:**
- `win_tokens` climbs every iteration (append-only).
- Early iterations: the model correctly lists covered states and a running total.
- Late iterations: as the verbose dumps pile up, the model's "covered states / total" answer drifts — it may miscount, omit an early state, or treat the **repeated FL** as new (re-doing the step) because the record of the first FL is now buried.

### Step 2: Find the break

| iter | state | win tokens | covered-states correct? | total correct? |
|------|-------|-----------|------------------------|----------------|
| 1 | FL | | yes | yes |
| 2 | TX | | | |
| 3 | NY | | | |
| 4 | GA | | | |
| 5 | FL (repeat) | | **no?** | **no?** |

Mark the iteration where the running total first goes wrong and where the repeated FL is treated as new.

### Step 3: Connect to the trough

The goal and the early findings sat at the *top* of the context (primacy) — but as the window filled, the *running record of what's been covered* ended up in the crowded middle. Tie this directly to M16: the agent didn't get dumber; its own state got lost-in-the-middle.

## Reflection Questions
1. The agent had every fact it needed — all five tool results are in the context. Why did it still miscount and re-query FL?
2. "Just use a bigger window" would let more dumps fit. Why does that delay the failure rather than fix it (recall M03 and M16)?
3. Map the growing append-only context to the case-board analogy — what happens to a detective who pins every scrap of paper and never prunes?

## Key Insight
An agent's failure to track its own progress is a context-pressure problem, not an intelligence problem: append-only loop context buries the goal and the record of completed work in the lost-in-the-middle zone, so the fix is managing what persists, not enlarging the window.
