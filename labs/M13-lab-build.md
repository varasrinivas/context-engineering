# M13 Lab: Build It with AI — A Layered Memory Store with Promotion

## Objective
With Claude, build a four-layer `Memory` store with per-layer write policies, a durability-gated `promote()`, and a scope-filtered `assemble()` — then prove a transient fact never reaches persistent, a durable preference is promoted and survives a session flush, and one user's persistent memory never leaks into another's context.

## Prerequisites
- Completed the M13 Understand It lab (you have the 12-fact classification)
- Claude API access, Python 3.10+ with `anthropic`

## The Build (40 min)

### Step 1: Build the layered store with Claude (15 min)

Claude prompt to use:
```
"Write memory.py with a Memory class implementing four memory layers for an LLM app:
- ephemeral: dict, flushed each request (write-and-discard)
- session: dict, per conversation
- persistent: dict keyed by user_id -> dict (cross-session, per user)
- shared: dict keyed by entity_id -> value (cross-agent, permissioned)

Methods:
- write(layer, key, value, user_id=None, entity_id=None)
- flush_ephemeral()
- promote(key, to='persistent', user_id=None, durable=False): copy a fact from
  session up a tier. If to=='persistent', REFUSE unless durable=True (the durability
  gate that prevents transient noise from polluting the profile).
- assemble(user_id, allowed_entities=()): return a dict with keys
  now/session/profile/shared, where 'profile' contains ONLY persistent[user_id]
  and 'shared' contains ONLY entities in allowed_entities (scope filtering).
Return only the code."
```

Save as `memory.py`.

### Step 2: Demonstrate correct promotion (10 min)

Create `promote_demo.py`:
```python
from memory import Memory

m = Memory()
# A transient fact and a durable preference both enter via the session.
m.write("ephemeral", "ocr_glitch", "page 3 garbled", )
m.write("session", "fmt_pref", "concise JSON")
m.write("session", "scratch_calc", "2+1=3")

# Try to promote BOTH to persistent for user 'dana'
m.promote("fmt_pref",     to="persistent", user_id="dana", durable=True)   # allowed
m.promote("scratch_calc", to="persistent", user_id="dana", durable=False)  # GATED

m.flush_ephemeral()   # the OCR glitch disappears

print("persistent[dana]:", m.persistent.get("dana"))
print("ephemeral:", m.ephemeral)
```

Run it. **Expected:**
```
persistent[dana]: {'fmt_pref': 'concise JSON'}
ephemeral: {}
```
The durable preference was promoted; the transient calc was refused; the OCR glitch is gone. No leakage.

### Step 3: Prove survival across a session flush (8 min)

Add to `promote_demo.py`:
```python
# Simulate a NEW session: clear session, keep persistent.
m.session.clear()
asm = m.assemble(user_id="dana")
print("new-session profile:", asm["profile"])   # -> {'fmt_pref': 'concise JSON'}
```
**Expected:** Dana's concise-JSON preference is still there in a brand-new session — it outlived the conversation. That's the persistent layer doing its job.

### Step 4: Prove scope isolation (7 min)

Create `scope_test.py`:
```python
from memory import Memory
m = Memory()
m.write("persistent", "pref", "concise JSON", user_id="dana")
m.write("persistent", "pref", "verbose prose", user_id="sam")
m.write("shared", "verdict", "ACME=HIGH", entity_id="ACME")
m.write("shared", "verdict", "REDLINE=LOW", entity_id="REDLINE")

# Assemble for Dana, analyzing ONLY debtor ACME
asm = m.assemble(user_id="dana", allowed_entities=("ACME",))
print("Dana sees profile:", asm["profile"])   # only Dana's pref
print("Dana sees shared:", asm["shared"])     # only ACME, NOT REDLINE
assert "verbose prose" not in str(asm), "LEAK: Sam's prefs reached Dana!"
assert "REDLINE" not in str(asm),       "LEAK: wrong entity in scope!"
print("no scope leaks ✓")
```

Run it. **Expected:** Dana's assembly contains only Dana's profile and only the ACME verdict — Sam's preferences and the REDLINE verdict are absent. The asserts pass.

## Deliverable
A `m13-lab/` folder containing:
- `memory.py` — four-layer store with durability-gated promotion and scope-filtered assembly
- `promote_demo.py` — transient refused, durable promoted, ephemeral flushed
- `scope_test.py` — cross-user and cross-entity isolation proven with assertions

You now have a memory architecture that prevents both leakage and loss — and respects scope.

## Stretch Goals
- Add an auto-classifier (LLM-assisted) that suggests a layer for an incoming fact, so writers don't have to choose manually — and review its mistakes.
- Add a `last_written` timestamp to persistent facts so you can expire stale ones (the exact hook M14 needs).
- Wire `assemble()` output through your M11 `fuse()` so multi-layer memory becomes one coherent, attributed context block.

## Connection to Next Module
Your persistent layer can now hold facts forever — but "forever" is a trap. A debtor's risk verdict from 2022 is stale; an address from last week may still be fresh. M14 (Context Decay and Refresh) is about *time*: detecting when a stored fact has gone stale, and deciding when to expire, demote, or refresh it.
