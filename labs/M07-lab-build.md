# M07 Lab: Build It with AI — A Few-Shot Selector with a Stop Rule

## Objective
With Claude, build an example bank and a `select_examples()` function that assembles a *diverse, distribution-covering* few-shot block under a token budget — placing the canonical example last and refusing to add examples past the knee — then prove 4 diverse beats 10 redundant on accuracy-per-token.

## Prerequisites
- Completed the M07 Understand It lab (you have `blocks.py` and the bias result)
- The `ucc-sandbox/`, Claude API access, Python 3.10+ with `anthropic`

## The Build (40 min)

### Step 1: Build a tagged example bank (8 min)

Create `bank.py` — examples tagged by the case type they teach:
```python
BANK = [
  {"type":"clean",       "canonical":True,  "input":"DEBTOR: ACME LOGISTICS & DISTRIBUTION, L.L.C.",
   "output":'{"debtor_name":"ACME LOGISTICS & DISTRIBUTION, L.L.C.","flags":[]}'},
  {"type":"clean",       "canonical":False, "input":"DEBTOR: BLUE RIDGE FARMS INC",
   "output":'{"debtor_name":"BLUE RIDGE FARMS INC","flags":[]}'},
  {"type":"clean",       "canonical":False, "input":"DEBTOR: SUMMIT STEEL CO",
   "output":'{"debtor_name":"SUMMIT STEEL CO","flags":[]}'},
  {"type":"redacted",    "canonical":False, "input":"DEBTOR: [REDACTED PER COURT ORDER]",
   "output":'{"debtor_name":null,"flags":["redacted"]}'},
  {"type":"amendment",   "canonical":False, "input":"TYPE: UCC-3 AMENDMENT TO: 2024-FL-0012345 ACTION: name changed",
   "output":'{"debtor_name":null,"flags":["see_original:2024-FL-0012345"]}'},
  {"type":"truncated",   "canonical":False, "input":"DEBTOR: PACIFIC COASTAL HOLDINGS AND INVESTMENT MANAGEMENT GROUP INTERNATION",
   "output":'{"debtor_name":"PACIFIC COASTAL HOLDINGS AND INVESTMENT MANAGEMENT GROUP INTERNATION","flags":["possibly_truncated"]}'},
]
```

### Step 2: Write the diversity-aware selector with Claude (14 min)

Claude prompt to use:
```
"Write select_examples(bank, k, max_tokens=None) in Python for few-shot assembly. Rules:
1. DIVERSITY FIRST: pick at most one example per 'type' until all distinct types are
   covered, before allowing any second example of a type. This guarantees coverage
   over redundancy.
2. ORDER: place all chosen examples with the one marked canonical=True LAST
   (recency anchor); others before it.
3. STOP RULE: never return more than k examples, and if max_tokens is given, stop
   adding examples once the rendered block would exceed it (use len(text)//4 as a
   rough token estimate). Return fewer rather than exceed.
4. Render each as 'INPUT: ... -> OUTPUT: ...' lines, return the block string.
No hardcoded API key. Return only the code."
```

Save as `selector.py`. Verify:
- `select_examples(BANK, k=4)` returns one of each type (clean/redacted/amendment/truncated), canonical clean **last**.
- `select_examples(BANK, k=10)` still returns only the available diverse set first — it does not pad with redundant clean examples before covering all types.

### Step 3: Diverse-small vs redundant-large bake-off (12 min)

Create `bakeoff.py`:
```python
import anthropic
from bank import BANK
from selector import select_examples
from blocks import RULES, TESTS  # reuse the M07 test set

client = anthropic.Anthropic()

diverse  = select_examples(BANK, k=4)                 # 4 diverse
redundant = "\n".join(                                # 10 clean-ish redundant
    f'INPUT: {e["input"]} -> OUTPUT: {e["output"]}'
    for e in [b for b in BANK if b["type"]=="clean"] * 4
)[:1]  # build a redundant clean-only block (expand as needed to ~10 lines)

def score(block, label):
    correct = 0
    for kind, filing in TESTS:
        r = client.messages.create(model="claude-sonnet-4-6", max_tokens=120,
            system=RULES + "\n\nExamples:\n" + block,
            messages=[{"role":"user","content":filing}]).content[0].text
        ok = ("null" in r) if kind in ("redacted","amendment") else True
        correct += ok
    toks = client.messages.count_tokens(model="claude-sonnet-4-6",
        messages=[{"role":"user","content":block}]).input_tokens
    print(f"{label}: {correct}/{len(TESTS)} correct, {toks} tokens, "
          f"{correct/toks*1000:.2f} correct-per-1k-tokens")

score(diverse, "DIVERSE-4")
score(redundant, "REDUNDANT-10")
```

> Adjust the redundant block to ~10 clean lines. The point: it costs more tokens and scores worse on the edge cases.

**Expected:** `DIVERSE-4` scores higher AND uses fewer tokens → dramatically better correct-per-1k-tokens. That ratio is the M03 economics of examples made concrete.

### Step 4: Prove the stop rule (6 min)

Call `select_examples(BANK, k=4, max_tokens=120)` and confirm it returns *fewer* than 4 examples rather than exceeding the budget — the selector respects the knee and the token ceiling instead of maximizing count.

## Deliverable
A `m07-lab/` folder containing:
- `bank.py` — a tagged, canonical-marked example bank
- `selector.py` — diversity-first selection, canonical-last ordering, k + token stop rule
- `bakeoff.py` — a head-to-head showing diverse-small beats redundant-large on accuracy-per-token

You can now assemble few-shot blocks that *cover the distribution* under budget — the bridge from "writing examples" to "selecting context by relevance," which is exactly what Track 3 generalizes.

## Stretch Goals
- Make selection *query-aware*: given the incoming filing, bias selection toward the example types most similar to it (a tiny preview of retrieval-augmented few-shot).
- Add a `coverage_report()` that lists which case types are represented in the returned block, so gaps are visible.
- Wire the selector into your M04 architected prompt as the `<examples>` section, keeping it within the M03 budget allocator's cap for that layer.

## Connection to Next Module
You just learned to *select* the right few examples by relevance and diversity. Track 3 (Dynamic Context Assembly) generalizes that skill to all runtime context: M08 reframes RAG itself as a selection-and-formatting problem — retrieving, ranking, and shaping documents into the window, using the very same instincts you just built for examples.
