# M02 Lab: Build It with AI — Refactor a Prompt into a Lifecycle

## Objective
Take the single failing prompt from the Understand lab and, with Claude's help, refactor the worst case (the UCC-3 amendment) into a minimal context-engineered call that adds *exactly one* missing layer — proving the failure is fixable by design, not by wording, and practicing the discipline of NOT adding layers you don't need.

## Prerequisites
- Completed the M02 Understand It lab (you have `cases.json` and `diagnose.py`)
- The `ucc-sandbox/` with `retrieval/search.py` from M00
- Claude API access, Python 3.10+ with `anthropic`

## The Build (35 min)

### Step 1: Pick the failure and name the missing layer (5 min)

The clearest case is **CASE-2-amendment**: the prompt invents a debtor because the real name lives in the *original* filing `2024-FL-0012345`, which was never in context. Missing layer: **Retrieval** (grounding).

Add the original filing to your sandbox data so it can be retrieved:
```json
{"filing_id":"2024-FL-0012345","filing_type":"UCC-1","debtor_name":"ACME LOGISTICS LLC","status":"amended"}
```

### Step 2: Build the before/after with Claude (15 min)

Claude prompt to use:
```
"I have a UCC extraction call that fails on amendments because the debtor name
is only in the ORIGINAL filing, not the amendment text. Write a Python script
refactor_case2.py that demonstrates a before/after:

BEFORE: call Claude with ONLY the amendment text (reproduces the failure).
AFTER: add exactly ONE layer — retrieval. Parse the 'AMENDMENT TO: <id>' line,
look up that original filing from a dict of filings, inject it into the prompt
as grounding, then ask Claude to extract the debtor name.

Use the anthropic SDK (model claude-sonnet-4-6), read ANTHROPIC_API_KEY from the
environment, and print both results plus input_tokens for each so I can see the
token cost the retrieval layer added. Do NOT add memory, tools, or a schema —
only the retrieval layer. Return only the code."
```

Save and run it. **Expected behavior:**
- BEFORE prints a fabricated or "unknown" debtor name.
- AFTER prints `ACME LOGISTICS LLC` (pulled from the grounded original).
- You see the input-token delta — the measurable cost of the one layer you added.

### Step 3: Verify and measure (8 min)

Confirm three things:
1. **The failure is fixed** — AFTER returns the correct, grounded name.
2. **You added only one layer** — no memory, no tools, no schema crept in.
3. **You know the cost** — record the token delta between BEFORE and AFTER.

```
=== BEFORE (no retrieval) ===  debtor_name: "ACME HOLDINGS LLC"   (fabricated)  input_tokens: 78
=== AFTER  (+ retrieval) ===   debtor_name: "ACME LOGISTICS LLC"  (grounded)    input_tokens: 121
Layer added: Retrieval | token cost: +43
```

### Step 4: Practice the restraint (7 min)

Now the *context engineering judgment*. For the other four cases, write a one-line decision for each — and deliberately do NOT over-build:

```
CASE-1-clean      -> add nothing. A plain prompt is correct here.
CASE-3-redacted   -> add GOVERNANCE only (a rule: if debtor is redacted/unavailable,
                     return {"debtor_name": null, "flag": "redacted"}). No retrieval needed.
CASE-5-truncated  -> add GOVERNANCE only (validation: flag names >= 80 chars). No retrieval.
CASE-4-nonenglish -> add GOVERNANCE (preserve exact unicode) — NOT a new model or tool.
```

Ask Claude to sanity-check your decisions:
```
"Here are five UCC cases and the single layer I plan to add to each (or none).
Tell me if I'm over-engineering any of them or missing a cheaper fix: [paste]."
```

## Deliverable
A `m02-lab/` folder containing:
- `refactor_case2.py` — a runnable before/after proving one retrieval layer fixes the amendment failure, with token costs printed
- `decisions.md` — your one-line justification for every case: which layer you added, and (just as important) which layers you deliberately left out and why

You've now run one full turn of the lifecycle loop — **assemble** one layer, **observe** the token cost, and **decide** where the loop should and shouldn't go.

## Stretch Goals
- Implement the CASE-3 and CASE-5 governance fixes as a small output-validation function and confirm they fix those cases without any retrieval.
- Add a fifth column to your Understand-lab table: "token cost of the fix" — and rank the fixes by cost-per-case-fixed.
- Wrap all five decisions into a single `route(case)` function that adds only the layer(s) each case needs — a tiny preview of dynamic context assembly (Track 3).

## Connection to Next Module
M03 (Context Economics) is the **Observe** stage of the lifecycle made rigorous: every layer you add — like the +43 tokens here — has a dollar cost, a latency cost, and a dilution cost. M03 gives you the budgeting math to decide which layers earn their place in the window.
