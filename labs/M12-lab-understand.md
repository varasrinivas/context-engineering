# M12 Lab: Understand It — Watch the Window Forget

## Objective
Run a 30-turn UCC analyst session through a naive sliding-window manager, watch it forget a fact stated at turn 2, and chart the exact tradeoff between window size, retention, and token cost.

## Prerequisites
- Completed M12 module content
- The `ucc-sandbox/`, Claude API access, Python 3.10+ with `anthropic`

## Setup (5 min)

Create `session.py` — a scripted session with a load-bearing fact at turn 2 and a decision at turn 5:
```python
TURNS = []
TURNS.append(("user", "I'm reviewing filings for debtor ACME LOGISTICS LLC."))
TURNS.append(("user", "Important: only score risk from VERIFIED lien records, never from notes."))  # turn 2 fact
TURNS.append(("assistant", "Understood — verified records only."))
TURNS.append(("user", "Pull filing 2024-FL-0012345."))
TURNS.append(("assistant", "Marking 2024-FL-0012345 as HIGH risk: 3 verified active liens."))      # turn 5 decision
# ... pad to 30 turns of routine back-and-forth about other filings ...
for i in range(6, 31):
    TURNS.append(("user", f"What about filing 2024-FL-{12300+i:07d}?"))
    TURNS.append(("assistant", f"Filing {12300+i:07d}: 1 active lien, MEDIUM risk."))
```

## Exercise (25 min)

### Step 1: Build a naive sliding-window manager

Create `forget.py`:
```python
import anthropic
from session import TURNS
client = anthropic.Anthropic()

def run_with_window(N):
    window = TURNS[-N:]                       # keep last N turns only
    msgs = [{"role": r, "content": c} for r, c in window]
    # Turn-30 query depends on the TURN-2 instruction (verified records only)
    msgs.append({"role": "user", "content":
        "For ACME LOGISTICS LLC, may I use the collateral-notes field to lower the risk? "
        "Answer yes/no and cite the rule I gave you."})
    resp = client.messages.create(model="claude-sonnet-4-6", max_tokens=120, messages=msgs)
    toks = client.messages.count_tokens(model="claude-sonnet-4-6", messages=msgs).input_tokens
    return resp.content[0].text.strip(), toks

for N in (10, 20, 40, 60):
    ans, toks = run_with_window(N)
    print(f"\n--- window N={N} ({toks} tokens) ---\n{ans}")
```

Run it: `python forget.py`

**What to observe:** With a small window (N=10), the turn-2 rule ("verified records only") is gone — the model can't cite it and may answer "yes" (wrong/unsafe). As N grows large enough to include turn 2, the model correctly says "no" and cites the rule — but token cost balloons.

### Step 2: Chart the tradeoff

| Window N | Turn-2 rule retained? | Answer correct? | Input tokens |
|----------|----------------------|------------------|--------------|
| 10 | no | no (unsafe) | |
| 20 | ? | ? | |
| 40 | ? | ? | |
| 60 (all) | yes | yes | (highest) |

### Step 3: Find the breakeven and name the problem

Identify the smallest N that retains the rule, and its token cost. Then articulate: you're paying to keep *all* the intervening turns just to keep *one* early fact — the core inefficiency a summarizer/pinner fixes.

## Reflection Questions
1. The turn-2 rule is a safety constraint. What's the real-world consequence of the N=10 window "forgetting" it in a credit-risk pipeline?
2. Bigger N retained the fact but cost more tokens *and* (recall M01) risks lost-in-the-middle. Why is "just use the biggest window" not a real fix?
3. Map to the browser analogy: the turn-2 rule is the tab you needed — what should you have done with it instead of leaving it open for 28 turns?

## Key Insight
A sliding window trades memory for cost linearly — to remember one early fact you must pay to carry every turn since — which is exactly why summarization and pinning exist: keep the fact, drop the turns.
