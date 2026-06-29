# M11 Lab: Build It with AI — A Context Fusion Engine

## Objective
With Claude, build a `fuse(sources)` engine that dedupes, resolves conflicts by trust and freshness, attaches provenance, and flags genuine disagreements — then prove that fused context produces the correct, attributed risk decision where naive concatenation produces a wrong one.

## Prerequisites
- Completed the M11 Understand It lab
- The `ucc-sandbox/`, Claude API access, Python 3.10+ with `anthropic`

## The Build (40 min)

### Step 1: Define the source-item schema (5 min)

Create `sources.py` — tagged items from three sources for one debtor:
```python
from dataclasses import dataclass

@dataclass(frozen=True)
class Item:
    source: str    # 'memory' | 'tool' | 'retrieval'
    trust: int     # 1=memory/cache, 3=verified tool/retrieval (M05 tiers)
    ts: str        # ISO date for freshness
    fact: str      # normalized key: 'risk=LOW', 'lien:FIRST_CAPITAL', 'lien:MERIDIAN'
    text: str      # human-readable claim

ITEMS = [
  Item("memory",    1, "2023-04", "risk=LOW",            "Cached: ACME LOW risk (2023-04)"),
  Item("memory",    1, "2023-04", "risk=LOW",            "Cached note: ACME LOW risk, stable (2023)"),
  Item("retrieval", 3, "2024-02", "lien:FIRST_CAPITAL",  "Filing 2024-FL-0012345: FIRST CAPITAL lien"),
  Item("retrieval", 3, "2024-02", "lien:FIRST_CAPITAL",  "Filing 2024-FL-0012345 (dup): FIRST CAPITAL lien"),
  Item("tool",      3, "2024-09", "lien:MERIDIAN",       "get_debtor_history: new MERIDIAN lien 2024-09"),
  Item("retrieval", 3, "2024-09", "lien:MERIDIAN",       "Filing 2024-FL-0019988 confirms MERIDIAN lien"),
]
```

### Step 2: Build the fusion engine with Claude (15 min)

Claude prompt to use:
```
"Write fuse(items) in Python where each item has fields source, trust(int),
ts(ISO date str), fact(normalized key str), text(str). It must:

1. DEDUPE by 'fact': among items sharing a fact, keep the single best by
   (trust, ts) descending. EXCEPTION: items with the SAME fact but DIFFERENT
   source are corroboration — keep one representative but record corroboration
   count so two independent sources confirming a lien aren't collapsed to 'weak'.
2. RESOLVE conflict on subject 'risk=*': if multiple risk claims survive, the one
   with highest (trust, ts) wins; drop the losers; append a flag string
   'risk re-evaluated: <winner.text> supersedes <loser.text>'.
   Note: a fresh corroborated lien implies higher risk, so if any 2024 lien exists,
   a stale 'risk=LOW' memory must be flagged as superseded.
3. ORDER surviving items by (trust, ts) descending.
4. Return {'context': '\\n'.join(f'[{s}|{ts}|trust={t}] {text}'),
           'flags': [...], 'corroborated': {fact: count}}.
Return only the code."
```

Save as `fusion.py`.

### Step 3: Decision bake-off — naive vs. fused (12 min)

Create `fusion_test.py`:
```python
import anthropic
from sources import ITEMS
from fusion import fuse

client = anthropic.Anthropic()
RULES = ("You are a UCC risk analyst. Based ONLY on the context, return JSON "
         '{"risk":"LOW|MEDIUM|HIGH","reason":"...","flags":[]}. '
         "A 2024 lien from a new secured party raises risk.")

naive = "\n".join(it.text for it in ITEMS)                # arrival-order concat
fused = fuse(ITEMS)

def decide(ctx, label):
    resp = client.messages.create(model="claude-sonnet-4-6", max_tokens=200,
        system=RULES, messages=[{"role":"user","content":ctx}])
    print(f"\n=== {label} ===\n{resp.content[0].text.strip()}")

decide(naive, "NAIVE concatenation")
decide(fused["context"] + "\nflags: " + "; ".join(fused["flags"]), "FUSED")
```

Run it: `python fusion_test.py`

**Expected behavior:**
- **NAIVE** — the duplicated stale "LOW risk" lines anchor the model; it may return **LOW** or hedge, missing that the 2024 lien changes everything.
- **FUSED** — deduped, stale belief flagged as superseded, 2024 MERIDIAN lien corroborated and ordered first → returns **HIGH** with a flag explaining the re-evaluation and provenance.

### Step 4: Verify the editorial guarantees (8 min)

Check `fused`:
1. The two `risk=LOW` memory lines collapsed to one (dedupe).
2. The two FIRST_CAPITAL retrieval lines collapsed to one (dedupe).
3. The MERIDIAN lien shows `corroborated: {'lien:MERIDIAN': 2}` (tool + retrieval — *not* deduped to "weak").
4. `flags` contains the supersession notice.
5. Every context line carries `[source|date|trust]` provenance.

## Deliverable
A `m11-lab/` folder containing:
- `sources.py` — tagged multi-source items for one debtor
- `fusion.py` — `fuse()`: dedupe, conflict resolution by trust×freshness, corroboration tracking, ordering, provenance, flags
- `fusion_test.py` — naive vs. fused decision bake-off
- A short note: naive returned the wrong/hedged risk; fused returned HIGH with a flagged, attributed rationale

You've built the capstone of dynamic assembly — turning many shaped sources into one coherent, auditable context.

## Stretch Goals
- Add a third conflicting source (an injected "fresh" untrusted claim that the debtor is exempt) and confirm trust tier prevents it from winning despite a recent timestamp (M05 tie-in).
- Emit the `flags` and provenance as a structured audit record (preview of M22 compliance).
- Reuse M09's RRF to merge two *ranked* retrieval lists before they enter fusion — combining ranking fusion with source fusion.

## Connection to Next Module
You've now mastered assembling context in space — across sources, in one window, at one moment. Track 4 (Memory & Conversation Context) adds the dimension of **time**: M12 begins with conversation history management — how context accumulates across turns, and how to keep a growing conversation inside a fixed window without losing the thread.
