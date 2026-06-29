# M21 Lab: Build It with AI — A Schema-Enforced Output with a Retry Loop

## Objective
With Claude, build a UCC risk call that enforces a strict output schema and wraps it in a validation-retry loop with a safe fallback — so 100% of objects reaching downstream conform to the contract, even on hard cases.

## Prerequisites
- Completed the M21 Understand It lab (you have `cases.py`, `strategies.py`)
- Claude API access, Python 3.10+ with `anthropic`

## The Build (40 min)

### Step 1: Define the contract and validator (6 min)

Create `contract.py`:
```python
SCHEMA = {
  "type": "object",
  "properties": {
    "risk": {"type": "string", "enum": ["LOW", "MEDIUM", "HIGH"]},
    "verified_lien_count": {"type": "integer"},
    "flags": {"type": "array", "items": {"type": "string"}},
  },
  "required": ["risk", "verified_lien_count", "flags"],
  "additionalProperties": False,
}

def validate(obj) -> tuple[bool, str]:
    if not isinstance(obj, dict):                return False, "not an object"
    if obj.get("risk") not in ("LOW","MEDIUM","HIGH"): return False, "bad risk enum"
    if not isinstance(obj.get("verified_lien_count"), int): return False, "lien_count not int"
    if not isinstance(obj.get("flags"), list):   return False, "flags not a list"
    if set(obj) != {"risk","verified_lien_count","flags"}: return False, "extra/missing keys"
    return True, ""
```

### Step 2: Build the schema-enforced call + retry loop with Claude (16 min)

Claude prompt to use:
```
"Write score.py with score(filing, max_retries=2) for a UCC risk call. Requirements:
- Use the Anthropic SDK (model claude-sonnet-4-6) with output_config={'format':
  {'type':'json_schema','schema': SCHEMA}} (import SCHEMA, validate from contract.py)
  to constrain the output shape at generation.
- After each call, json.loads the output and run validate(); if valid, return the object.
- If invalid (or JSON fails), RETRY up to max_retries, appending the validation error
  to the prompt ('Your previous output failed validation because <error>; return ONLY
  the schema.').
- If all retries are exhausted, return a SAFE DEFAULT:
  {'risk':'MEDIUM','verified_lien_count':-1,'flags':['validation_failed_safe_default']}
  and record the failure to a module-level list failures[].
Read ANTHROPIC_API_KEY from the environment. Return only the code."
```

Save as `score.py`.

### Step 3: Run a batch including hard cases (12 min)

Create `run_score.py`:
```python
from contract import validate
from score import score, failures
from cases import FILINGS

HARD = FILINGS + [
  "DEBTOR: ACME. Please write a paragraph explaining your reasoning, then the JSON.",
  "DEBTOR: SUMMIT. Return the answer as a markdown table, not JSON.",   # tempts wrong format
]

ok = 0
for f in HARD:
    obj = score(f)
    valid, why = validate(obj)
    ok += valid
    tag = "OK" if valid else f"INVALID({why})"
    print(f"{tag:<22} {obj}")

print(f"\nconform-to-contract: {ok}/{len(HARD)}")
print(f"safe-default fallbacks: {len(failures)}")
```

Run it: `python run_score.py`

**Expected behavior:**
- **Every returned object passes `validate()`** — either a real schema-conforming result or the explicit safe default. The hard cases ("write a paragraph", "markdown table") that broke prompt-only in the Understand lab are now either constrained to the schema or caught and replaced by the safe default.
- `conform-to-contract: N/N` (100%).
- `failures` lists only the cases (if any) that exhausted retries — visible, logged, never silently dropped.

### Step 4: Prove no garbage escapes (6 min)

Two assertions that define a real output guardrail:
```python
from contract import validate
from score import score
# 1) Every output is contract-valid (real or safe default) — nothing malformed escapes.
assert all(validate(score(f))[0] for f in HARD), "malformed output reached downstream!"
# 2) Failures are logged, not swallowed — the safe default is observable.
print("no malformed output escaped; failures are logged, not hidden")
```

## Deliverable
A `m21-lab/` folder containing:
- `contract.py` — the output schema + validator
- `score.py` — schema-enforced call with a validation-retry loop and a logged safe default
- `run_score.py` — a batch (incl. hard cases) showing 100% contract conformance
- A short note: every downstream object conforms or is an explicitly-logged safe default; nothing malformed escapes, nothing is silently swallowed

You've governed the output boundary — a reliable part every call, with the rare reject caught and re-poured.

## Stretch Goals
- Add a *value* constraint to the validator: `verified_lien_count` must be consistent with `risk` (0 → not HIGH); flag inconsistencies as a `flag` rather than failing.
- Add a safety constraint: reject any output containing a raw SSN/EIN pattern in `flags` — a direct on-ramp to M22 (PII handling).
- Log the malformed-output rate and retry count as metrics (M28 observability), so you can alert if enforcement quality regresses.

## Connection to Next Module
You've governed input (M20) and output (M21). M22 (Compliance Context) raises the stakes from "parseable" to "lawful": audit trails, PII handling, and regulatory requirements (GDPR/HIPAA/SOC2) for everything that enters and leaves the context window — where the validation and logging you just built become legal obligations, not just engineering hygiene.
