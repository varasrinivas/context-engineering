# M07 Lab: Understand It — Watch Example Bias Happen

## Objective
Build two few-shot extraction blocks — one biased (all clean filings), one diverse (covers edge cases) — run both against the same messy test set, and watch the biased set fabricate exactly where the diverse set succeeds.

## Prerequisites
- Completed M07 module content
- The `ucc-sandbox/`, Claude API access, Python 3.10+ with `anthropic`

## Setup (5 min)

Create `blocks.py` with the two few-shot blocks and a shared test set:
```python
RULES = ('Extract the debtor name. Return {"debtor_name": string|null, "flags": []}. '
         'Use null if no clear debtor name is present.')

# (A) BIASED: 6 clean examples, all with an obvious name
BLOCK_A = """
INPUT: DEBTOR: ACME LOGISTICS LLC          -> {"debtor_name":"ACME LOGISTICS LLC","flags":[]}
INPUT: DEBTOR: BLUE RIDGE FARMS INC         -> {"debtor_name":"BLUE RIDGE FARMS INC","flags":[]}
INPUT: DEBTOR: SUMMIT STEEL CO              -> {"debtor_name":"SUMMIT STEEL CO","flags":[]}
INPUT: DEBTOR: HARBOR POINT MARINA LLC      -> {"debtor_name":"HARBOR POINT MARINA LLC","flags":[]}
INPUT: DEBTOR: CEDAR VALLEY DAIRY LLC       -> {"debtor_name":"CEDAR VALLEY DAIRY LLC","flags":[]}
INPUT: DEBTOR: IRONClad SECURITY INC        -> {"debtor_name":"IRONClad SECURITY INC","flags":[]}
"""

# (B) DIVERSE: 4 examples covering the real distribution (canonical LAST)
BLOCK_B = """
INPUT: DEBTOR: [REDACTED PER COURT ORDER]   -> {"debtor_name":null,"flags":["redacted"]}
INPUT: TYPE: UCC-3 AMENDMENT TO: 2024-FL-0012345 ACTION: name changed
                                            -> {"debtor_name":null,"flags":["see_original:2024-FL-0012345"]}
INPUT: DEBTOR: PACIFIC COASTAL HOLDINGS AND INVESTMENT MANAGEMENT GROUP INTERNATION
                                            -> {"debtor_name":"PACIFIC COASTAL HOLDINGS AND INVESTMENT MANAGEMENT GROUP INTERNATION","flags":["possibly_truncated"]}
INPUT: DEBTOR: ACME LOGISTICS & DISTRIBUTION, L.L.C. -> {"debtor_name":"ACME LOGISTICS & DISTRIBUTION, L.L.C.","flags":[]}
"""

TESTS = [
  ("clean",      "DEBTOR: MERIDIAN TRANSPORT LLC"),
  ("redacted",   "DEBTOR: [REDACTED PER COURT ORDER]"),
  ("amendment",  "TYPE: UCC-3 AMENDMENT TO: 2024-NY-0008812 ACTION: debtor name changed"),
  ("truncated",  "DEBTOR: GREAT LAKES SHIPPING AND FREIGHT FORWARDING CONSOLIDATED ENTERPRIS"),
]
```

## Exercise (25 min)

### Step 1: Run both blocks against the test set

Create `bias.py`:
```python
import anthropic
from blocks import RULES, BLOCK_A, BLOCK_B, TESTS

client = anthropic.Anthropic()

def run(block, label):
    print(f"\n========== {label} ==========")
    for kind, filing in TESTS:
        resp = client.messages.create(
            model="claude-sonnet-4-6", max_tokens=120,
            system=RULES + "\n\nExamples:\n" + block,
            messages=[{"role": "user", "content": filing}],
        )
        print(f"  [{kind:9}] {resp.content[0].text.strip()}")

run(BLOCK_A, "BLOCK A (clean-only, biased)")
run(BLOCK_B, "BLOCK B (diverse)")
```

Run it: `python bias.py`

**What to observe:**
- **BLOCK A** handles `clean` fine but on `redacted`/`amendment` it likely **fabricates** a plausible-looking name (or returns the redaction marker as a name) instead of `null`. On `truncated` it may not flag.
- **BLOCK B** returns `null` with the right flags on the edge cases and flags the truncation — because it was *shown* those cases.

### Step 2: Tabulate it

| Test case | BLOCK A output | BLOCK B output | Correct? |
|-----------|----------------|----------------|----------|
| clean | | | |
| redacted | fabricated? | null + redacted | |
| amendment | fabricated? | null + see_original | |
| truncated | unflagged? | flagged | |

### Step 3: Count the tokens

Use `count_tokens` on each block. BLOCK A (6 examples) is *larger* than BLOCK B (4 examples) — so the biased set costs **more** tokens and delivers **worse** robustness. Record both numbers.

## Reflection Questions
1. BLOCK A never said "always output a name" — so why did it behave as if it had?
2. BLOCK A is bigger than BLOCK B yet performs worse. What does that do to the intuition "more examples = better"?
3. Map to the mail-room analogy: what did the all-Legal training set teach the new sorter, and how is that the same failure?

## Key Insight
A few-shot set is a distribution you teach by demonstration — so an unbalanced set silently biases outputs, and a smaller, diverse set routinely beats a larger, redundant one on both robustness and token cost.
