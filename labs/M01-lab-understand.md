# M01 Lab: Understand It — Watch Text Become Tokens

## Objective
Tokenize three different kinds of text — plain English prose, a raw UCC filing snippet, and a JSON object — and see with your own eyes that "words" and "tokens" are not the same unit, and that some content types are far more token-expensive than others.

## Prerequisites
- Completed M01 module content
- The `ucc-sandbox/` directory from the M00 lab (you'll reuse `data/filings.json`)
- Claude API access (API key set in environment) **or** any public BPE tokenizer visualizer
- Python 3.10+ with the `anthropic` package installed

## Setup (5 min)

1. Make sure the SDK is installed and your key is set:
   ```bash
   pip install anthropic
   export ANTHROPIC_API_KEY="your-key-here"
   ```
2. Work inside your existing sandbox so you can reuse the mock filings:
   ```bash
   cd ucc-sandbox
   mkdir -p m01-lab && cd m01-lab
   ```

## Exercise (20 min)

### Step 1: Tokenize three contrasting samples

Create `count_tokens.py`:
```python
import anthropic

client = anthropic.Anthropic()

samples = {
    "plain_english": (
        "A financing statement is a document a lender files to give public "
        "notice that it has a security interest in the personal property of a "
        "borrower. It protects the lender's claim if the borrower defaults."
    ),
    "ucc_filing": (
        "FILING: 2024-FL-0012345  TYPE: UCC-1\n"
        "DEBTOR: ACME LOGISTICS & DISTRIBUTION, L.L.C.\n"
        "ADDRESS: 1450 N.W. 107TH AVE, STE 310, MIAMI, FL 33172\n"
        "SECURED PARTY: FIRST CAPITAL EQUIPMENT FINANCE, INC."
    ),
    "json_object": (
        '{"filing_id":"2024-FL-0012345","type":"UCC-1",'
        '"debtor_name":"ACME LOGISTICS & DISTRIBUTION, L.L.C.",'
        '"collateral":["accounts","inventory","equipment"],"active":true}'
    ),
}

print(f"{'sample':<16}{'chars':>8}{'words':>8}{'tokens':>8}{'tok/word':>10}")
print("-" * 50)
for name, text in samples.items():
    chars = len(text)
    words = len(text.split())
    tokens = client.messages.count_tokens(
        model="claude-sonnet-4-6",
        messages=[{"role": "user", "content": text}],
    ).input_tokens
    print(f"{name:<16}{chars:>8}{words:>8}{tokens:>8}{tokens/words:>10.2f}")
```

Run it: `python count_tokens.py`

**What to observe:** The `tok/word` column. Plain prose sits near the famous "~0.75 word per token" rule (≈1.3 tokens/word). The filing and JSON samples are noticeably higher — every `&`, `.`, `,`, digit run, and quote mark spends extra tokens.

**Expected output** (your exact numbers will vary slightly by model/tokenizer version):
```
sample            chars   words  tokens  tok/word
--------------------------------------------------
plain_english       219      37      48      1.30
ucc_filing          180      22      66      3.00
json_object         180      11      72      6.55
```

### Step 2: Find the token-heavy fragments

Take just the debtor name and compare it against a "clean" version. Add to your script:
```python
pairs = {
    "messy_name": "ACME LOGISTICS & DISTRIBUTION, L.L.C.",
    "clean_name": "Acme Logistics and Distribution",
    "filing_id":  "2024-FL-0012345",
}
print("\nfragment-level:")
for name, text in pairs.items():
    t = client.messages.count_tokens(
        model="claude-sonnet-4-6",
        messages=[{"role": "user", "content": text}],
    ).input_tokens
    print(f"  {name:<12} {len(text.split()):>2} words -> {t:>3} tokens   '{text}'")
```

**What to observe:** The messy ALL-CAPS, punctuated name costs meaningfully more tokens than the clean version with the *same meaning*, and the filing ID costs far more tokens than its single "word" suggests because the digit groups fragment.

**Expected output** (approximate):
```
fragment-level:
  messy_name    4 words ->  16 tokens   'ACME LOGISTICS & DISTRIBUTION, L.L.C.'
  clean_name    4 words ->   7 tokens   'Acme Logistics and Distribution'
  filing_id     1 words ->  11 tokens   '2024-FL-0012345'
```

### Step 3: Scale it to a real batch

Estimate what a folder of filings actually costs. Add:
```python
import json
from pathlib import Path

filings = json.loads(Path("../data/filings.json").read_text())
total = 0
for f in filings:
    t = client.messages.count_tokens(
        model="claude-sonnet-4-6",
        messages=[{"role": "user", "content": json.dumps(f)}],
    ).input_tokens
    total += t
print(f"\n{len(filings)} filings ~= {total:,} tokens")
print(f"Naive 'just paste them all' into a 200K window: "
      f"{'FITS' if total < 200_000 else 'OVERFLOWS'} "
      f"({total/200_000:.1%} of ceiling)")
```

**What to observe:** Even 10 small mock filings consume a surprising token count once you measure rather than eyeball "pages."

## Reflection Questions
1. Why does the JSON object have the worst tokens-per-word ratio of the three samples, even though it carries the least prose?
2. The clean debtor name and the messy one mean the same thing — what would change about your token budget if your pipeline normalized names *before* sending them to the model? What might you lose by doing that?
3. How does this connect to the meeting-room-whiteboard analogy — if a token is one marker-stroke, which of your three samples "uses up the board" the fastest, and why?

## Key Insight
A token is the only unit the model and the bill actually count in — and punctuation, capitalization, IDs, and structured syntax all cost more tokens than their word count implies, so context budgeting must start with measuring tokens, never words or pages.
