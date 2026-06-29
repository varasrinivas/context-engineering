# M16 Lab: Build It with AI — A Position-Aware Assembler

## Objective
With Claude, build an assembler that places the highest-priority context items at the START and END of the window (and bulk in the middle), caps total length, and prove it catches a disqualifying lien that naive arrival-order assembly buries in the dead middle.

## Prerequisites
- Completed the M16 Understand It lab (you have `probe.py` and your U-curve)
- Ideally the M09 reranker (ranked items) — or use the priority field provided here
- Claude API access, Python 3.10+ with `anthropic`

## The Build (40 min)

### Step 1: Build the position-aware assembler with Claude (14 min)

Claude prompt to use:
```
"Write assemble.py with position_aware(items, max_items=None) for context assembly.
Each item is a dict {text, priority} where higher priority = more important.

Rules:
1. Sort items by priority descending.
2. If max_items is set, keep only the top max_items (shorten context -> shallower
   middle trough).
3. PLACE them so the highest-priority items land at the EDGES of the final order:
   alternate placing top items at the front and back, pushing lower-priority items
   toward the middle. (e.g. ranks [1,2,3,4,5] -> order [1,3,5,4,2] so 1 is first,
   2 is last, and the lowest ranks sit in the middle.)
4. Return the assembled context as a newline-joined string.
Also write naive(items): just join in the given (arrival) order.
Return only the code."
```

Save as `assemble.py`. Sanity-check: for priorities `[5,4,3,2,1]`, the top item (priority 5) is first and the second-highest (4) is last.

### Step 2: Stage a needle in low-priority noise (8 min)

Create `case.py`:
```python
# The disqualifying lien is HIGH priority but, by arrival order, lands mid-list.
NEEDLE = {"text": "DISQUALIFYING: BLUE RIDGE FARMS INC has an undischarged federal "
                  "tax lien (IRS, 2024-03, $1.2M).", "priority": 10}

FILLER = [{"text": f"Filing 2024-FL-{20000+i:05d}: ROUTINE CO {i}, 1 lien, MEDIUM.",
           "priority": 1} for i in range(30)]

# Arrival order buries the needle in the middle (index 15 of 31):
ARRIVAL = FILLER[:15] + [NEEDLE] + FILLER[15:]
```

### Step 3: A/B the two assemblies (12 min)

Create `ab_position.py`:
```python
import anthropic
from assemble import naive, position_aware
from case import ARRIVAL

client = anthropic.Anthropic()
Q = ("Does BLUE RIDGE FARMS INC have a disqualifying lien? "
     "Answer yes/no and name it.")

def ask(ctx, label):
    resp = client.messages.create(model="claude-sonnet-4-6", max_tokens=80,
        messages=[{"role":"user","content": f"{ctx}\n\n{Q}"}])
    out = resp.content[0].text.strip()
    print(f"\n=== {label} ===\n{out}")

ask(naive(ARRIVAL), "NAIVE arrival order (needle ~middle)")
ask(position_aware(ARRIVAL, max_items=20), "POSITION-AWARE (needle -> edge)")
```

Run it: `python ab_position.py`

**Expected behavior:**
- **NAIVE** — the high-priority needle sits in the middle of 31 items; the model likely answers "no" or misses the tax lien.
- **POSITION-AWARE** — the priority-10 needle is placed FIRST (or last), and the context is capped to 20 items; the model catches it and answers "yes — federal tax lien."

### Step 4: Confirm it's position, not luck (6 min)

- Run each 3×; the position-aware version should be consistently correct, naive consistently worse.
- Print the final ordering from `position_aware` and verify the needle is at index 0 (or last) — proving the fix is *placement*, not randomness.
- Note the context length: position-aware also *shortened* it (max_items=20), shrinking the trough — two M16 levers at once.

## Deliverable
A `m16-lab/` folder containing:
- `assemble.py` — `position_aware()` (edge-placement + length cap) and `naive()`
- `case.py`, `ab_position.py` — the buried-needle A/B test
- A short note: naive missed the disqualifying lien; position-aware caught it by moving it to an edge and shortening the context

You can now place assembled context where the model actually reads it — turning M09's *ranking* into M16's *positioning*.

## Stretch Goals
- Feed real reranked chunks from your M09 lab into `position_aware` so ranking and positioning compose end-to-end.
- Add a "two-edge" mode that pins the single most critical item at BOTH a top summary line and the final line (belt-and-suspenders for must-not-miss facts).
- Re-run your M16 probe but with `position_aware` assembly and show the U-curve flattens for high-priority needles.

## Connection to Next Module
You've learned *that* edges beat the middle and how to exploit it for one critical fact. M17 (Context Ordering Strategies) generalizes positioning into full sequencing: standard orderings, when to break them, interleaving vs. grouping, and narrative structure — deciding the order of *everything* in the window, not just where the one needle goes.
