# M18 Lab: Build It with AI — A Tiered Compression Pipeline

## Objective
With Claude, build a `compress()` that combines all three techniques in the right order — prune, extract verbatim, abstract the remainder — stops at a token budget, and *asserts* every active-lien identifier survived, then prove a risk decision reaches the same verdict on the compressed history at a fraction of the tokens.

## Prerequisites
- Completed the M18 Understand It lab (you have `history.py`, `compressors.py`)
- Claude API access, Python 3.10+ with `anthropic`

## The Build (40 min)

### Step 1: Build the tiered compressor with Claude (15 min)

Claude prompt to use:
```
"Write compress.py with compress(history, budget_tokens=400) for UCC debtor history
(each filing: filing_id, secured_party, filed, status, collateral). Apply three
stages in this order and return a single string:

1. PRUNE: drop filings with status != 'active' (keep them only for an aggregate count).
2. EXTRACT (verbatim): for each ACTIVE filing, keep an exact line
   '<filing_id> | <secured_party> | <filed>' — NEVER paraphrased.
3. ABSTRACT: replace all the pruned/terminated filings with ONE summary line
   like '<N> terminated filings, <minyear>-<maxyear>'. (A deterministic rollup is
   fine; no LLM call needed for the routine remainder.)

Then enforce budget_tokens: if the block is still over budget, drop the OLDEST
active extract lines last-resort (and note it), never truncating mid-identifier.

FIDELITY CHECK: before returning, assert every active filing_id appears in the
output; raise AssertionError naming any lost id. Return only the code."
```

Save as `compress.py`.

### Step 2: Compress and verify fidelity (10 min)

Create `run_compress.py`:
```python
import anthropic, json
from history import HISTORY, ACTIVE_IDS
from compress import compress
client = anthropic.Anthropic()

block = compress(HISTORY, budget_tokens=400)
print(block)

# Independent fidelity re-check
missing = [i for i in ACTIVE_IDS if i not in block]
assert not missing, f"FIDELITY FAILURE: lost {missing}"
print("\n✓ all active-lien identifiers preserved")

def toks(s): return client.messages.count_tokens(model="claude-sonnet-4-6",
    messages=[{"role":"user","content":s}]).input_tokens
print(f"full: {toks(json.dumps(HISTORY))} tokens -> compressed: {toks(block)} tokens")
```

Run it. **Expected:** the compressed block shows the 3 active liens verbatim + a one-line terminated rollup, the fidelity check passes, and tokens drop dramatically.

### Step 3: Prove the decision is preserved (12 min)

Create `decision.py`:
```python
import anthropic, json
from history import HISTORY
from compress import compress
client = anthropic.Anthropic()

RULES = ("You are a UCC risk analyst. From the history, return JSON "
         '{"risk":"LOW|MEDIUM|HIGH","active_liens":int,"lien_ids":[]}. '
         "List the exact filing_id of every ACTIVE lien.")

def decide(ctx, label):
    t = client.messages.count_tokens(model="claude-sonnet-4-6",
        messages=[{"role":"user","content":ctx}]).input_tokens
    r = client.messages.create(model="claude-sonnet-4-6", max_tokens=200,
        system=RULES, messages=[{"role":"user","content":ctx}])
    print(f"\n=== {label} ({t} tokens) ===\n{r.content[0].text.strip()}")

decide(json.dumps(HISTORY), "FULL history")
decide(compress(HISTORY, 400), "COMPRESSED")
```

Run it. **Expected:** both return the same risk level and the **same exact lien_ids** — but COMPRESSED uses a fraction of the tokens. Because identifiers were *extracted, not abstracted*, the model can still list them exactly.

### Step 4: Break it on purpose (3 min)

Temporarily swap the extract step for an LLM abstraction of the active liens, re-run `run_compress.py`, and watch the fidelity assertion **fail** (a corrupted/missing ID). Then revert. This proves the assertion is real protection, not decoration.

## Deliverable
A `m18-lab/` folder containing:
- `compress.py` — tiered prune → extract-verbatim → abstract compressor with a budget cap and a fidelity assertion
- `run_compress.py`, `decision.py` — fidelity verification and a full-vs-compressed decision showing identical verdict + lien IDs at far fewer tokens
- A note recording the token-reduction ratio and the deliberate fidelity-failure demonstration

You can now compress large context to fit the budget *without* losing the identifiers a decision depends on — and you have a check that fails loudly if you ever do.

## Stretch Goals
- Add a `must_preserve(patterns)` parameter (regex for IDs, dollar amounts, dates) so the fidelity check generalizes beyond filing IDs.
- Combine with M16: feed the compressed block into your position-aware assembler so the active-lien lines land at an edge.
- Track compression ratio per stage (how much pruning vs. extraction vs. abstraction contributed) to tune the pipeline.

## Connection to Next Module
You've shaped the window's contents (Tracks 2-4) and its shape — positioning (M16), ordering (M17), and size (M18). The final module of Track 5 optimizes its *cost over time*: M19 (Caching and Prefilling) is about not paying to re-process the stable parts of your context on every call — caching the compressed, ordered prefix so only the variable tail costs full price.
