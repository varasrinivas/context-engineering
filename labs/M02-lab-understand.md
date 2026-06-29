# M02 Lab: Understand It — Diagnose the Failure Layer

## Objective
Run a single fixed extraction prompt against five very different UCC filings, observe which ones fail, and classify each failure by the *missing context layer* — proving that the prompt isn't the problem, the absent layers are.

## Prerequisites
- Completed M02 module content
- The `ucc-sandbox/` directory from the M00 lab
- Claude API access (API key in environment), Python 3.10+ with `anthropic`

## Setup (5 min)

1. From your sandbox, create a lab folder:
   ```bash
   cd ucc-sandbox && mkdir -p m02-lab && cd m02-lab
   ```
2. Create `cases.json` with five deliberately diverse filings (one clean, four that stress a different layer):
   ```json
   [
     {"id":"CASE-1-clean","text":"FILING: 2024-FL-0012345 TYPE: UCC-1\nDEBTOR: ACME LOGISTICS LLC\nADDRESS: 1450 NW 107TH AVE, MIAMI, FL 33172"},
     {"id":"CASE-2-amendment","text":"FILING: 2024-FL-0019988 TYPE: UCC-3\nAMENDMENT TO: 2024-FL-0012345\nACTION: Debtor name changed. See original filing for prior name."},
     {"id":"CASE-3-redacted","text":"FILING: 2024-NY-0007711 TYPE: UCC-1\nDEBTOR: [REDACTED PER COURT ORDER]\nADDRESS: ON FILE WITH SECRETARY OF STATE"},
     {"id":"CASE-4-nonenglish","text":"FILING: 2024-TX-0004410 TYPE: UCC-1\nDEBTOR: Société Générale de Transport et Logistique S.à r.l.\nADDRESS: 800 BRICKELL AVE, HOUSTON, TX"},
     {"id":"CASE-5-truncated","text":"FILING: 2024-CA-0006655 TYPE: UCC-1\nDEBTOR: PACIFIC COASTAL HOLDINGS AND INVESTMENT MANAGEMENT GROUP INTERNATION\nADDRESS: 55 MARKET ST, SAN FRANCISCO, CA"}
   ]
   ```

## Exercise (25 min)

### Step 1: Run one fixed prompt against all five cases

Create `diagnose.py`:
```python
import anthropic, json
from pathlib import Path

client = anthropic.Anthropic()
cases = json.loads(Path("cases.json").read_text())

# ONE fixed prompt — no retrieval, no tools, no governance schema. Just words.
PROMPT = "Extract the debtor name from this filing. Return it as JSON: {{\"debtor_name\": \"...\"}}.\n\n{filing}"

for c in cases:
    resp = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=200,
        messages=[{"role": "user", "content": PROMPT.format(filing=c["text"])}],
    )
    print(f"\n=== {c['id']} ===")
    print(resp.content[0].text.strip())
```

Run it twice: `python diagnose.py && python diagnose.py`

**What to observe:** Note both *correctness* and *consistency across the two runs*. The clean case is fine. The others fail in instructive ways — and the output shape may even wander between runs.

### Step 2: Classify each failure by its missing layer

Fill in this table from what you saw:

| Case | Pass/Fail | What went wrong | Missing layer |
|------|-----------|-----------------|---------------|
| CASE-1-clean | Pass | — | none needed |
| CASE-2-amendment | Fail | Invents a name; the real name is in the *original* filing | **Retrieval** (grounding) |
| CASE-3-redacted | Fail? | Guesses or fabricates instead of reporting "redacted/unavailable" | **Governance** (output rules) |
| CASE-4-nonenglish | ? | May mangle accents/suffix or over-tokenize (recall M01) | **Governance** + tokenization |
| CASE-5-truncated | Fail | Returns a clearly truncated name with no flag | **Governance** (validation rule) |

**What to observe:** Not one of these failures is fixable by *rewording the prompt*. CASE-2 needs a document the prompt never had. CASE-3/5 need rules the prompt never stated. The instruction was fine.

### Step 3: Predict the fix (don't build it yet)

For each failing case, write one sentence: *which single layer*, added, would fix it? (You'll actually build one of these in the Build lab.)

## Reflection Questions
1. CASE-2 (the amendment) failed even though the prompt was perfectly clear. Why can no amount of prompt rewording fix it?
2. Which failures share the *same* missing layer? What does that tell you about where to invest first?
3. How does this map to the sticky-note-vs-briefing-packet analogy — which "tab" of the packet was missing for each failing contractor?

## Key Insight
A prompt has no grounding, memory, tools, or governance by default — so failures at scale are almost never wording problems; they are *missing-layer* problems, and the first skill of context engineering is diagnosing which layer is absent.
