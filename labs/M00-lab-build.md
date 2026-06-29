# M00 Lab: Build It with AI — Set Up the UCC Lien Domain Sandbox

## Objective
Build the UCC Lien domain sandbox that will be used throughout all 32 modules — mock filings, sample data, a retrieval function, and your first context-engineered API call using all 5 layers.

## Prerequisites
- Completed the Understand It lab
- Claude API access (or Claude.ai for prompting)
- Python 3.10+ with `anthropic` and `json` packages

## The Build (35 min)

### Step 1: Scaffold the Sandbox (5 min)

Create the project structure:
```bash
mkdir -p ucc-sandbox/{data,retrieval,context}
cd ucc-sandbox
```

Use this Claude prompt to generate your mock filing data:
```
"Generate 10 realistic UCC filing records as a JSON array. Include a mix of:
- 6 UCC-1 (original filings)
- 3 UCC-3 (amendments)
- 1 UCC-3 (termination)

Each record should have: filing_id, state (mix of FL, NY, CA, TX), filing_type,
filing_date (2023-2024), debtor_name, debtor_address, secured_party,
collateral_description, and status (active/amended/terminated).

Make the debtor names realistic business names. Include one edge case:
a debtor name that's exactly 80 characters long (truncation boundary).
Return ONLY the JSON array, no explanation."
```

Save the output as `data/filings.json`.

### Step 2: Build the Retrieval Function (10 min)

Create `retrieval/search.py`:
```python
import json
from pathlib import Path

# Load filings
FILINGS = json.loads(Path("data/filings.json").read_text())

def search_by_id(filing_id: str) -> dict | None:
    """Retrieve a single filing by ID."""
    return next((f for f in FILINGS if f["filing_id"] == filing_id), None)

def search_by_debtor(name: str) -> list[dict]:
    """Search filings by debtor name (case-insensitive partial match)."""
    name_lower = name.lower()
    return [f for f in FILINGS if name_lower in f["debtor_name"].lower()]

def search_by_state(state: str) -> list[dict]:
    """Filter filings by state code."""
    return [f for f in FILINGS if f["state"] == state.upper()]

def get_debtor_history(debtor_name: str) -> str:
    """Get formatted history for a debtor (used as Tool Context - Layer 3)."""
    matches = search_by_debtor(debtor_name)
    if not matches:
        return f"No prior filings found for {debtor_name}"
    lines = [f"Prior filings for {debtor_name}:"]
    for f in matches:
        lines.append(f"- {f['filing_id']} ({f['filing_type']}, {f['status']}, {f['secured_party']})")
    return "\n".join(lines)

if __name__ == "__main__":
    # Quick test
    print(f"Loaded {len(FILINGS)} filings")
    fl_filings = search_by_state("FL")
    print(f"Florida filings: {len(fl_filings)}")
    if fl_filings:
        print(f"First FL filing: {fl_filings[0]['filing_id']}")
        history = get_debtor_history(fl_filings[0]["debtor_name"])
        print(history)
```

Run it to verify: `python retrieval/search.py`

**Expected output:** Filing count, Florida subset, and a debtor history summary.

### Step 3: Build the Context Assembler (10 min)

Create `context/assembler.py` — this is the core of context engineering:
```python
import json
from retrieval.search import search_by_id, get_debtor_history

# Layer 1: System Context
SYSTEM_PROMPT = """You are a UCC filing analyst at a commercial credit risk bureau.
Your job is to extract and validate debtor information from Secretary of State filings.

Extraction rules:
- Preserve EXACT capitalization as filed in the original document
- Return structured JSON with keys: debtor_name, debtor_address, filing_type, risk_flags
- Flag any debtor name >= 80 characters as potentially truncated
- For UCC-3 amendments: identify what changed from the original filing
- For UCC-3 terminations: confirm the filing being terminated

Output format:
{
  "debtor_name": "string",
  "debtor_address": "string",
  "filing_type": "UCC-1 | UCC-3-amendment | UCC-3-termination",
  "risk_flags": ["list of any flags"]
}"""

# Layer 5: User Context (appended to system prompt)
USER_PROFILES = {
    "senior": "\nAnalyst profile: Senior analyst, concise output preferred, flag anomalies.",
    "junior": "\nAnalyst profile: Junior analyst, include explanations with each extraction.",
    "auditor": "\nAnalyst profile: Compliance auditor, flag ALL potential data quality issues."
}

def assemble_context(filing_id: str, user_type: str = "senior", history: list = None):
    """Assemble all 5 context layers for a filing extraction request."""

    # Layer 2: Retrieval Context
    filing = search_by_id(filing_id)
    if not filing:
        raise ValueError(f"Filing {filing_id} not found")

    filing_text = json.dumps(filing, indent=2)

    # Layer 3: Tool Context
    debtor_history = get_debtor_history(filing["debtor_name"])

    # Layer 4: Conversation Context
    conv_history = history or []

    # Layer 5: User Context
    user_ctx = USER_PROFILES.get(user_type, USER_PROFILES["senior"])

    # Assemble
    system = SYSTEM_PROMPT + user_ctx

    user_message = f"""Filing record:
{filing_text}

Debtor history:
{debtor_history}

Extract the debtor information as JSON."""

    return {
        "system": system,
        "messages": [*conv_history, {"role": "user", "content": user_message}],
        "metadata": {
            "layers_used": 5,
            "filing_id": filing_id,
            "user_type": user_type,
            "has_history": len(conv_history) > 0
        }
    }
```

### Step 4: Make Your First Context-Engineered Call (10 min)

Create `main.py`:
```python
import anthropic
import json
import sys
sys.path.insert(0, ".")
from context.assembler import assemble_context

client = anthropic.Anthropic()

# Pick a filing from your sandbox data
filings = json.loads(open("data/filings.json").read())
test_filing_id = filings[0]["filing_id"]

print(f"=== Analyzing filing: {test_filing_id} ===\n")

# Assemble context (all 5 layers)
ctx = assemble_context(test_filing_id, user_type="senior")

print(f"Context metadata: {json.dumps(ctx['metadata'], indent=2)}\n")

# Call Claude
response = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=512,
    system=ctx["system"],
    messages=ctx["messages"]
)

print("=== EXTRACTION RESULT ===")
print(response.content[0].text)
print(f"\n=== TOKEN USAGE ===")
print(f"Input:  {response.usage.input_tokens} tokens")
print(f"Output: {response.usage.output_tokens} tokens")
print(f"Layers used: {ctx['metadata']['layers_used']}")
```

Run it: `python main.py`

**Expected output:** Clean JSON extraction with the debtor info, risk flags (if any), and token usage stats.

## Deliverable
A working `ucc-sandbox/` directory containing:
- `data/filings.json` — 10 mock UCC filings
- `retrieval/search.py` — Search and history functions
- `context/assembler.py` — 5-layer context assembly
- `main.py` — End-to-end context-engineered API call

This sandbox is your foundation for every lab in the remaining 31 modules.

## Stretch Goals
- Add a 6th "edge case" filing with a debtor name in ALL CAPS with special characters (test extraction robustness)
- Modify `assemble_context()` to accept a `budget` parameter that limits total context tokens
- Try all 3 user profiles (senior, junior, auditor) on the same filing — compare output differences

## Connection to Next Module
M01 (Anatomy of a Context Window) will use this sandbox to measure exactly how many tokens each layer consumes and how tokenization differences across models affect your budget. Keep the sandbox directory — you'll build on it throughout the course.
