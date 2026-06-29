# M06 Lab: Build It with AI — A Persona-Fit Selector

## Objective
With Claude, build a small selector that, given a task's needs, picks the best-fit persona from a behaviorally-anchored library — and then prove the fitted persona beats a mismatched one on the same UCC filing.

## Prerequisites
- Completed the M06 Understand It lab (you have `personas.py`)
- The `ucc-sandbox/`, Claude API access, Python 3.10+ with `anthropic`

## The Build (35 min)

### Step 1: Define task profiles (5 min)

A persona is "fit" when its behavioral defaults match the task's needs. Capture needs as a profile. Create `profiles.py`:
```python
# Each profile scores what the TASK needs, 0-3.
PROFILES = {
  "bulk_extraction":  {"throughput": 3, "scrutiny": 0, "false_flag_tolerance": 0, "verbosity": 0},
  "compliance_review":{"throughput": 0, "scrutiny": 3, "false_flag_tolerance": 3, "verbosity": 2},
  "credit_decision":  {"throughput": 1, "scrutiny": 2, "false_flag_tolerance": 1, "verbosity": 1},
}
```

### Step 2: Build the selector with Claude (12 min)

Claude prompt to use:
```
"I have three UCC personas (auditor, clerk, risk) each with behavioral anchors,
and three task profiles scoring throughput, scrutiny, false_flag_tolerance, and
verbosity from 0-3. Write choose_persona(profile) in Python that:
1. Encodes each persona's behavioral PROFILE on the same 4 axes
   (clerk = high throughput/low scrutiny; auditor = high scrutiny/high verbosity;
    risk = balanced, decisive).
2. Scores fit between a task profile and each persona (e.g. negative sum of
   absolute differences across the 4 axes).
3. Returns the best-fit persona name plus a one-line justification naming the
   axis that drove the match.
Return only the code."
```

Save as `selector.py`. Expected mapping:
- `bulk_extraction` → **clerk**
- `compliance_review` → **auditor**
- `credit_decision` → **risk**

### Step 3: Prove fit beats mismatch (12 min)

Now demonstrate the *cost* of getting it wrong. Create `fit_vs_mismatch.py`:
```python
import anthropic
from personas import PERSONAS, RULES, FILING
from profiles import PROFILES
from selector import choose_persona

client = anthropic.Anthropic()

task = "bulk_extraction"
fit = choose_persona(PROFILES[task])          # -> 'clerk'
mismatch = "auditor"                           # deliberately wrong for throughput

def run(persona_name):
    resp = client.messages.create(
        model="claude-sonnet-4-6", max_tokens=400,
        system=PERSONAS[persona_name] + "\n\n" + RULES,
        messages=[{"role": "user", "content": FILING}],
    )
    return resp.content[0].text.strip(), resp.usage.output_tokens

for label, name in [("FIT", fit), ("MISMATCH", mismatch)]:
    out, toks = run(name)
    print(f"\n=== {label} ({name}) — {toks} output tokens ===\n{out}")
```

Run it: `python fit_vs_mismatch.py`

**Expected:** For `bulk_extraction`, FIT (clerk) returns compact JSON in far fewer output tokens; MISMATCH (auditor) returns longer output with caveats the throughput task doesn't want. Project the token delta across 50,000 filings/day to a real cost gap (M03 tie-in).

### Step 4: Add behavioral anchors that close the gap (6 min)

Ask Claude to tighten the clerk persona so its output is *guaranteed* compact:
```
"Add behavioral anchors to the clerk persona that enforce: output ONLY the JSON
object, no prose, no markdown fences, maximum 3 keys. Return the updated block."
```
Re-run and confirm the fitted persona's output is now strict and minimal.

## Deliverable
A `m06-lab/` folder containing:
- `personas.py` — three behaviorally-anchored persona blocks
- `profiles.py`, `selector.py` — task profiles and the fit-based selector
- `fit_vs_mismatch.py` — a demonstration that the fitted persona beats a mismatched one (correctness AND token cost) on the same filing

You can now choose personas by *fit to task needs*, not by which title sounds most impressive — and you can show the cost of getting it wrong.

## Stretch Goals
- Add a fourth persona ("forensic investigator") and a profile that should select it; confirm the selector picks it without you hardcoding the mapping.
- Add a guard: if no persona scores above a fit threshold, return a warning that the task needs a new persona block — preventing silent mismatch.
- Combine with M05: ensure every persona block still defers to the system instruction hierarchy (persona shapes behavior, never authority).

## Connection to Next Module
M07 (Few-Shot Context Design) adds the final piece of the static scaffolding: examples. Examples are how you *reinforce* a persona's behavior and teach output shape by demonstration — but they have their own economics (selection, ordering, and sharp diminishing returns) that you'll learn to respect.
