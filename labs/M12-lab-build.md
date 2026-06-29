# M12 Lab: Build It with AI — A Token-Aware History Manager

## Objective
With Claude, build a `History` manager that keeps recent turns verbatim, compresses older turns into a running summary, pins load-bearing facts as structured state, and triggers on a token budget — then prove it remembers the turn-2 rule at turn 30 while a naive window forgets it, at a fraction of the cost.

## Prerequisites
- Completed the M12 Understand It lab (you have `session.py`, `forget.py`)
- Claude API access, Python 3.10+ with `anthropic`

## The Build (40 min)

### Step 1: Build the manager with Claude (15 min)

Claude prompt to use:
```
"Write history.py with a History class for an LLM chat manager:
- __init__(keep=6, budget_tokens=1500)
- add(role, text, pin: dict|None=None): append a turn; merge any pin dict into a
  persistent self.pins; after adding, if estimated tokens (sum of len(text)//4 over
  verbatim turns) exceeds budget_tokens, call _compress().
- _compress(): move all but the last `keep` turns into a running self.summary by
  calling summarize(prev_summary, old_turns). For the lab, implement summarize() as
  an Anthropic call (model claude-sonnet-4-6) that returns a <=80-word digest folding
  the previous summary and the old turns together. Re-summarize cumulatively.
- render(): return a string with three labeled sections in this order:
  'PINNED FACTS: ...', 'EARLIER (summary): ...', then the verbatim recent turns.
- messages(): return render() shaped for an API call (pins+summary as a system-ish
  preface, recent turns as role/content).
Read ANTHROPIC_API_KEY from the environment. Return only the code."
```

Save as `history.py`.

### Step 2: Feed the scripted session with pins (10 min)

Create `replay.py`:
```python
from session import TURNS
from history import History

h = History(keep=6, budget_tokens=1200)
for i, (role, text) in enumerate(TURNS, start=1):
    pin = None
    if i == 2:  # the safety rule
        pin = {"scoring_rule": "verified lien records ONLY, never notes"}
    if i == 5:  # the decision
        pin = {"2024-FL-0012345": "risk=HIGH (3 verified active liens)"}
    h.add(role, text, pin=pin)

print(h.render()[:800])
print("\nPINS:", h.pins)
```

Run it. **Expected:** after 30 turns, the verbose middle is compressed into a short summary, but `PINS` still contains BOTH the scoring rule and the HIGH-risk decision verbatim.

### Step 3: Re-run the turn-30 query (10 min)

Create `managed_query.py`:
```python
import anthropic
from session import TURNS
from history import History

client = anthropic.Anthropic()
h = History(keep=6, budget_tokens=1200)
for i, (role, text) in enumerate(TURNS, start=1):
    pin = {"scoring_rule":"verified lien records ONLY, never notes"} if i==2 else \
          {"2024-FL-0012345":"risk=HIGH"} if i==5 else None
    h.add(role, text, pin=pin)

context = h.render()
resp = client.messages.create(model="claude-sonnet-4-6", max_tokens=120,
    messages=[{"role":"user","content":
        context + "\n\nFor ACME LOGISTICS LLC, may I use the collateral-notes field "
        "to lower the risk? Answer yes/no and cite the rule I gave you."}])
toks = client.messages.count_tokens(model="claude-sonnet-4-6",
    messages=[{"role":"user","content":context}]).input_tokens
print(f"MANAGED ({toks} tokens):\n{resp.content[0].text.strip()}")
```

Run it. **Expected:** the model answers **"no"** and cites the verified-records rule — correctly — while using **far fewer tokens** than the N=60 full-window run from the Understand lab. Compare the two token counts side by side.

### Step 4: Prove the win (5 min)

Make a small table:

| Strategy | Turn-2 rule retained? | Turn-30 answer | Input tokens |
|----------|----------------------|----------------|--------------|
| Naive window N=10 | no | wrong/unsafe | low |
| Naive window N=60 (all) | yes | correct | **high** |
| Managed (summary+pins) | yes | correct | **low** |

The managed history hits the only good quadrant: correct AND cheap.

## Deliverable
A `m12-lab/` folder containing:
- `history.py` — token-aware `History` with keep/compress/pin
- `replay.py` — shows pins surviving while the middle is compressed
- `managed_query.py` — the turn-30 query answered correctly at low token cost
- A 3-row comparison table proving managed history beats both naive extremes

You now manage conversation as a budget — keeping the thread without paying to carry every turn.

## Stretch Goals
- Auto-detect pin-worthy facts (decisions, IDs, explicit "important:" statements) instead of hardcoding which turns to pin.
- Add a `budget` knob and plot retention/quality as you tighten it — finding the conversation's own knee (M03).
- Persist `pins` to disk so they survive across *sessions* — a direct bridge to M13's persistent memory layer.

## Connection to Next Module
You just built one running summary plus a pinned-fact store — informally, two different *memory layers* with different lifetimes. M13 (Multi-Layer Memory Architecture) formalizes this: ephemeral, session, persistent, and shared memory, each with its own scope, update strategy, and place in the context window.
