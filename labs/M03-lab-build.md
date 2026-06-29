# M03 Lab: Build It with AI — A Budget-Aware Context Assembler

## Objective
With Claude, turn the M01 token estimator into a `Budget` allocator: a fixed token ceiling, per-layer caps, and a priority order that evicts the lowest-value layer first when a UCC call overflows — so every call lands at the knee of the curve instead of blowing past the ceiling.

## Prerequisites
- Completed the M03 Understand It lab (you've seen the curve and the knee)
- The `ucc-sandbox/` with `retrieval/search.py` and the token counter from M01
- Claude API access, Python 3.10+ with `anthropic`

## The Build (40 min)

### Step 1: Scaffold the Budget allocator (12 min)

Claude prompt to use:
```
"Write a Python module budget.py for a UCC context pipeline. Define a Budget class with:
- ceiling: int (total working token budget for one call, default 6000)
- caps: dict mapping each of the 5 layers (system, user, retrieval, tool, conversation)
  to a max token allowance
- a priority list ordering layers from LOWEST value to HIGHEST (evict-first order),
  e.g. ['conversation','tool','retrieval','user','system']

Method allocate(actual: dict) -> dict where actual is measured tokens per layer. It must:
1. Clamp each layer to its cap.
2. If the clamped total exceeds the ceiling, evict tokens from the lowest-priority
   layers first until it fits.
3. Return {kept: dict, total: int, fits: bool, report: list[str]} where report
   explains every trim ('trimmed N tokens from <layer>').
No hardcoded API key. Return only the code."
```

Save as `budget.py`. Read it before running.

### Step 2: Wire it to real measured tokens (12 min)

Now feed it actual token counts from a real UCC call instead of made-up numbers.

Claude prompt to use:
```
"Write measure_and_allocate.py that:
1. Builds the 5 context layers for a UCC risk call:
   - system: extraction + risk-scoring rules (a fixed string)
   - user: an analyst profile line
   - retrieval: the target filing's full JSON (from data/filings.json)
   - tool: a debtor history string (concatenate all filings for that debtor)
   - conversation: 3 fake prior turns
2. Counts tokens for each layer with client.messages.count_tokens(model='claude-sonnet-4-6').
3. Passes the measured dict to Budget().allocate() and prints the allocation report.
Use a debtor with MANY prior filings so the call overflows and eviction triggers.
Return only the code."
```

Run it: `python measure_and_allocate.py`

**Expected output (illustrative):**
```
measured: system=1180 user=140 retrieval=2600 tool=4200 conversation=1500  (total 9620)
ceiling: 6000
 - trimmed 1500 tokens from 'conversation'
 - trimmed 2120 tokens from 'tool'
kept total: 6000  fits: True
protected: system rules and the filing text were never touched
```

### Step 3: Prove it lands at the knee, not the ceiling (8 min)

Add a check: after allocation, the `tool` (debtor history) layer should be *trimmed to top-k most relevant*, not just truncated mid-JSON. Ask Claude:
```
"Improve the 'tool' trimming so that instead of cutting raw tokens mid-string, it
drops whole prior-filing records starting from the OLDEST, keeping the most recent
and most relevant ones until the layer fits its allocation. Return the updated code."
```

Verify the kept history is the *most recent N filings*, intact — this is the difference between trimming to the knee (keep the signal) and trimming to the ceiling (keep whatever bytes fit).

### Step 4: Emit an allocation report (8 min)

Have the allocator print a final budget table so the tradeoff is visible:
```
LAYER         CAP    MEASURED   KEPT    NOTE
system       1200      1180     1180    protected (cacheable)
user          150       140      140    protected
retrieval    2500      2600     2500    clamped to cap
tool         1500      4200     1180    evicted oldest history -> kept 3 most recent
conversation 1500      1500       0     evicted (lowest priority)
------------------------------------------------------
TOTAL        ----      9620     5000    fits 6000 ceiling
```

## Deliverable
A `m03-lab/` folder containing:
- `budget.py` — the `Budget` allocator (ceiling, caps, priority eviction, report)
- `measure_and_allocate.py` — counts real per-layer tokens for a UCC call and allocates
- A printed allocation report showing what was kept, clamped, evicted, and protected

You can now take any overflowing UCC call and land it within budget *on purpose*, protecting the highest-value layers (rules, the filing) and shedding the lowest (stale history).

## Stretch Goals
- Add a `dollars()` method that converts kept tokens to an estimated per-call cost using configurable input/output rates, and print cost before vs. after allocation.
- Make `priority` configurable per call type (extraction vs. risk-scoring may value different layers).
- Combine with your M03 Understand-lab curve: set each layer's cap at *its own* knee rather than a flat number.

## Connection to Next Module
M03 closes Track 1 (Foundations). Track 2 (System Context Design) zooms into the layer your allocator protected first — the **system** layer. M04 is about architecting that system prompt so it earns the budget it's protected with: layers, sections, ordering, and delimiters.
