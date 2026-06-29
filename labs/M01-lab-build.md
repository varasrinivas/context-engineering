# M01 Lab: Build It with AI — A Token Budget Estimator for the UCC Pipeline

## Objective
Use Claude to build a reusable `token_budget.py` tool that counts the real token cost of a batch of UCC filings, compares it against a configurable working budget inside a 200K window, and tells you which filings to drop, compress, or reposition — turning "it probably fits" into a measured decision.

## Prerequisites
- Completed the Understand It lab
- Claude API access (or Claude.ai for prompting)
- The `ucc-sandbox/` directory from M00 (reusing `data/filings.json`)
- Python 3.10+ with `anthropic`

## The Build (35 min)

### Step 1: Scaffold the estimator (8 min)

From inside `ucc-sandbox/`, create `budget/` and ask Claude to generate the core counter.

Claude prompt to use:
```
"Write a Python module token_budget.py for a UCC filing pipeline. It must:

1. Define a function count_filing_tokens(filing: dict) -> int that uses the
   Anthropic SDK's client.messages.count_tokens(model='claude-sonnet-4-6', ...)
   on json.dumps(filing) and returns input_tokens.
2. Define estimate_batch(filings: list[dict], working_budget: int) -> dict that
   returns total_tokens, per_filing token counts, a boolean 'fits', and the
   percentage of the working_budget consumed.
3. Use only the anthropic and json standard imports. No hardcoded API key —
   rely on the ANTHROPIC_API_KEY environment variable.
Return only the code."
```

Save the result as `budget/token_budget.py`. Read it before running — confirm there's no hardcoded key and that it reads from the environment.

**Expected intermediate output:** a module that imports cleanly (`python -c "import budget.token_budget"` with no error).

### Step 2: Add the drop/compress/reposition decision (10 min)

Now extend it with the part that makes it a *context engineering* tool, not just a counter.

Claude prompt to use:
```
"Extend token_budget.py with a function plan_fit(filings, working_budget) that:

- Counts tokens for every filing.
- If the batch fits the working_budget, returns ordering advice: place the
  single highest-token (most detailed) filing FIRST and the most recently
  dated filing LAST, leaving lower-priority filings in the middle — and add a
  one-line note explaining this uses primacy/recency to fight lost-in-the-middle.
- If the batch OVERFLOWS, greedily drop the lowest-priority filings (oldest
  filing_date first) until it fits, and return: kept[], dropped[], and a
  'compress_candidates' list naming the 3 largest kept filings as the best
  targets for summarization.

Return a dict with keys: fits, ordering, kept, dropped, compress_candidates, note.
Return only the code."
```

**What to observe:** This is the M01 idea made executable — the window is a fixed ceiling, so when content exceeds the budget you *must* drop or compress, and *where* you place what survives is a deliberate choice.

### Step 3: Test it against the sandbox (10 min)

Create `budget/run_budget.py`:
```python
import json
from pathlib import Path
from token_budget import estimate_batch, plan_fit

filings = json.loads(Path("../data/filings.json").read_text())

# A deliberately tight working budget so we can watch it make decisions.
WORKING_BUDGET = 1500  # tokens reserved for filings inside a larger 200K call

est = estimate_batch(filings, WORKING_BUDGET)
print(f"Total: {est['total_tokens']} tokens "
      f"({est['percentage']:.0%} of {WORKING_BUDGET}) -> "
      f"{'FITS' if est['fits'] else 'OVERFLOWS'}\n")

plan = plan_fit(filings, WORKING_BUDGET)
print("NOTE:", plan["note"])
if plan["fits"]:
    print("Ordering:", plan["ordering"])
else:
    print("Kept:   ", [f['filing_id'] for f in plan["kept"]])
    print("Dropped:", [f['filing_id'] for f in plan["dropped"]])
    print("Compress these first:", plan["compress_candidates"])
```

Run it: `python budget/run_budget.py`

**Test cases to try (from the UCC domain):**
- `WORKING_BUDGET = 1500` → should OVERFLOW and drop the oldest filings.
- `WORKING_BUDGET = 50000` → should FIT and return ordering advice.
- Add one giant filing (paste a long `collateral_description`) → confirm it shows up as a `compress_candidate`.

**Expected final output (overflow case, approximate):**
```
Total: 2840 tokens (189% of 1500) -> OVERFLOWS

NOTE: Window is a fixed ceiling; dropped oldest filings, flagged largest for compression.
Kept:    ['2024-FL-0012345', '2024-NY-0008812', ...]
Dropped: ['2022-CA-0004410', ...]
Compress these first: ['2024-FL-0012345', ...]
```

### Step 4: Refine for the edge cases (7 min)

Harden the tool with one more pass.

Claude prompt to use:
```
"Review token_budget.py for these edge cases and fix any it mishandles:
1. An empty filings list (should return fits=True, no crash).
2. A single filing that ALONE exceeds the working_budget (cannot be dropped to
   fit — it must be flagged 'requires compression', not silently dropped).
3. Filings missing a 'filing_date' key (sort them as oldest, don't crash).
Return the corrected full module."
```

**What to observe:** the single-filing-too-big case is the important one — it's the real-world moment where "just drop something" fails and compression (M18) becomes mandatory.

## Deliverable
A working `ucc-sandbox/budget/` directory containing:
- `token_budget.py` — `count_filing_tokens()`, `estimate_batch()`, `plan_fit()`, edge-case hardened
- `run_budget.py` — a runnable demo that prints fit/overflow, drop list, and compression candidates against your mock filings

You can now answer, for any batch of filings, "does this fit the window, and if not, what do I do about it?" — measured in tokens, not guessed in pages.

## Stretch Goals
- Add a `--model` flag so you can compare token counts across two models on the same filings and see how the budget shifts.
- Make `plan_fit` accept a `priority_key` (e.g., risk score) instead of always using filing_date for drop ordering.
- Plot a simple bar chart of tokens-per-filing so the "token-heavy" filings are visually obvious.

## Connection to Next Module
M02 (From Prompt Engineering to Context Engineering) zooms back out from the mechanics of the window to the full five-layer lifecycle. Your token estimator becomes the measuring stick for every later track — M03 (economics) turns these counts into dollars, M16 (positional effects) justifies the ordering advice you just built, and M18 (compression) builds the tooling for the `compress_candidates` this lab only flagged.
