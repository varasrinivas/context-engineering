# M06 Lab: Understand It — Same Filing, Three Personas

## Objective
Run one fixed UCC filing through the model under three different personas — with identical rules and the same output request — and measure how only the *frame* changes what gets surfaced, flagged, and omitted.

## Prerequisites
- Completed M06 module content
- The `ucc-sandbox/`, Claude API access, Python 3.10+ with `anthropic`

## Setup (4 min)

Create `personas.py` with three role blocks that differ ONLY in persona + behavioral anchors:
```python
PERSONAS = {
  "auditor": (
    "You are a senior UCC compliance auditor. Behavioral defaults: scrutinize "
    "every field for risk; FLAG anomalies rather than resolving them; prefer "
    "caution over speed; note any related-party or data-quality concerns."
  ),
  "clerk": (
    "You are a fast UCC data-entry clerk. Behavioral defaults: extract the "
    "requested fields quickly and consistently; do not add caveats or analysis; "
    "return only the clean JSON."
  ),
  "risk": (
    "You are a credit risk analyst. Behavioral defaults: foreground lien exposure "
    "and secured-party concentration; summarize the debtor's risk posture; be "
    "decisive about a LOW/MEDIUM/HIGH call."
  ),
}

RULES = ('Read the filing. Return JSON with keys: debtor_name, address, notes. '
         'Preserve exact capitalization. Flag names >= 80 chars as truncated.')

FILING = (
  "FILING: 2024-FL-0012345  TYPE: UCC-1\n"
  "DEBTOR: ACME LOGISTICS & DISTRIBUTION, L.L.C.\n"
  "ADDRESS: 1450 NW 107TH AVE, MIAMI, FL 33172\n"
  "SECURED PARTY: FIRST CAPITAL EQUIPMENT FINANCE, INC.\n"
  "RELATED: shares address with ACME HOLDINGS L.L.C. (2024-FL-0012001)\n"
  "PRIOR LIENS: 3 active from 3 different secured parties"
)
```

## Exercise (25 min)

### Step 1: Run all three personas on the same filing

Create `compare.py`:
```python
import anthropic
from personas import PERSONAS, RULES, FILING

client = anthropic.Anthropic()
for name, persona in PERSONAS.items():
    resp = client.messages.create(
        model="claude-sonnet-4-6", max_tokens=400,
        system=persona + "\n\n" + RULES,
        messages=[{"role": "user", "content": FILING}],
    )
    out = resp.content[0].text.strip()
    print(f"\n========== {name.upper()} ==========")
    print(out)
    print(f"[length: {len(out)} chars, output tokens: {resp.usage.output_tokens}]")
```

Run it: `python compare.py`

**What to observe:** Same rules, same filing. The **auditor** likely flags the RELATED address (related-party concern) and adds caveats. The **clerk** returns terse clean JSON, ignoring the related line. The **risk** analyst foregrounds the 3-lien stack and may volunteer a HIGH posture.

### Step 2: Tabulate the differences

| Dimension | Auditor | Clerk | Risk Analyst |
|-----------|---------|-------|--------------|
| Output length / tokens | | | |
| Flags raised | related-party? truncation? | (none) | lien concentration |
| What it omitted | | the RELATED concern | |
| Vocabulary / tone | cautious, hedged | terse | decisive |
| Best-fit downstream job | compliance review | bulk extraction | credit decisioning |

### Step 3: Find the mismatch cost

Pick the **clerk** output and ask: what risk did it *miss* that the auditor caught? Then pick the **auditor** output and ask: what would its verbosity cost across 50,000 filings/day (tokens × calls — recall M03)?

## Reflection Questions
1. Nothing in the *rules* changed between runs. Why did the flags differ? What does that tell you about where "flag related parties" behavior actually came from?
2. Which persona is "wrong"? (Trick question — argue why fit, not correctness, is the right lens.)
3. Map each persona to the plumber/architect analogy — which is the plumber, which the architect, and what's the third trade?

## Key Insight
Identical rules under different personas produce different — and differently *useful* — outputs, because the behavioral frame, not just the instructions, determines what the model attends to and surfaces.
