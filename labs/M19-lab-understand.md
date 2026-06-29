# M19 Lab: Understand It — Watch a Cache Hit (and a Miss)

## Objective
Make two identical-prefix UCC calls and watch prompt caching write-then-read the stable system prompt — then deliberately break it with a silent invalidator and watch the cache hit rate collapse to zero.

## Prerequisites
- Completed M19 module content
- Claude API access, Python 3.10+ with `anthropic`
- Note: the cached prefix must exceed the model's minimum cacheable size (~1–4K tokens depending on model), so pad the system prompt if your rules are short.

## Setup (5 min)

Create `cache_demo.py`:
```python
import anthropic
client = anthropic.Anthropic()

# A STABLE system prefix. Pad with realistic rules/examples so it's large enough
# to cache (repeat the block if needed to clear the model's minimum).
RULES = ("You are a UCC filing analyst. Extract the debtor name as JSON: "
         '{"debtor_name": string|null, "flags": []}. '
         "Preserve exact capitalization. Return null if the debtor is redacted. "
         "Flag any name >= 80 characters as possibly truncated. "
         "<examples>\n"
         "INPUT: DEBTOR: [REDACTED] -> {\"debtor_name\":null,\"flags\":[\"redacted\"]}\n"
         "INPUT: DEBTOR: ACME LOGISTICS LLC -> {\"debtor_name\":\"ACME LOGISTICS LLC\",\"flags\":[]}\n"
         "</examples>\n") * 12   # repeated to exceed the minimum cacheable size

FILINGS = [
    "FILING 2024-FL-0012345 DEBTOR: ACME LOGISTICS LLC ADDRESS: MIAMI FL",
    "FILING 2024-FL-0019988 DEBTOR: REDLINE FREIGHT LLC ADDRESS: HOUSTON TX",
    "FILING 2024-NY-0008812 DEBTOR: IRONCLAD SECURITY INC ADDRESS: ALBANY NY",
]
```

## Exercise (25 min)

### Step 1: The working case — write then read

Add to `cache_demo.py`:
```python
def call(filing, system_blocks):
    r = client.messages.create(
        model="claude-sonnet-4-6", max_tokens=200,
        system=system_blocks,
        messages=[{"role": "user", "content": filing}],
    )
    u = r.usage
    return u.cache_creation_input_tokens, u.cache_read_input_tokens, u.input_tokens

GOOD_SYSTEM = [{"type": "text", "text": RULES, "cache_control": {"type": "ephemeral"}}]

print("=== WORKING (frozen prefix) ===")
print(f"{'call':<6}{'write':>8}{'read':>8}{'input':>8}")
for i, f in enumerate(FILINGS, 1):
    w, rd, inp = call(f, GOOD_SYSTEM)
    print(f"{i:<6}{w:>8}{rd:>8}{inp:>8}")
```

Run it: `python cache_demo.py`

**Expected:** call 1 shows `write > 0, read = 0` (cache written); calls 2–3 show `write = 0, read > 0` (the rules were reused). The big stable block is paid once, then read cheaply.

### Step 2: Break it with a silent invalidator

Add a changing line to the TOP of the prefix and re-run:
```python
import datetime
def broken_system():
    # A per-call timestamp at the TOP of the prefix — the classic silent invalidator
    stamp = datetime.datetime.now().isoformat()
    return [{"type": "text", "text": f"Current time: {stamp}\n" + RULES,
             "cache_control": {"type": "ephemeral"}}]

print("\n=== BROKEN (timestamp in prefix) ===")
print(f"{'call':<6}{'write':>8}{'read':>8}{'input':>8}")
for i, f in enumerate(FILINGS, 1):
    w, rd, inp = call(f, broken_system())
    print(f"{i:<6}{w:>8}{rd:>8}{inp:>8}")
```

**Expected:** every call shows `read = 0` and a fresh `write` — the cache never hits because the prefix changes every call. You are now paying full (write-premium!) price every time.

### Step 3: Tabulate the cost difference

| Case | call-2 read tokens | call-2 input tokens | paying full price? |
|------|-------------------|---------------------|--------------------|
| Working (frozen) | high | low | no — ~10% on the cached part |
| Broken (timestamp) | 0 | high | yes — every call |

## Reflection Questions
1. In the broken case, the timestamp line is *tiny* — a few tokens. Why does such a small change wipe out the cache for the entire (large) prefix that follows it?
2. Nothing errored in the broken case — the code ran fine and returned correct answers. How would you actually *detect* this in production?
3. Map both cases to the prep-kitchen analogy: what did the timestamp line do to the "base sauce"?

## Key Insight
A cache hit requires a byte-identical prefix, so any per-call value in the cached region — even a tiny timestamp — silently zeroes your hit rate; the only reliable detector is the cache-read token count, because nothing throws an error.
