# M00 Lab: Understand It — Inspect Raw Context Windows

## Objective
Inspect the raw context windows of 3 real Claude API calls — a simple query, a RAG-augmented query, and a tool-using agent loop — and map every token to one of the 5 context layers introduced in M00.

## Prerequisites
- Completed M00 module content
- Claude API access (API key set in environment)
- Python 3.10+ with `anthropic` package installed
- A token counter (use `anthropic`'s built-in usage reporting)

## Setup (5 min)

1. Install the Anthropic Python SDK if not already installed:
   ```bash
   pip install anthropic
   ```
2. Set your API key:
   ```bash
   export ANTHROPIC_API_KEY="your-key-here"
   ```
3. Create a working directory:
   ```bash
   mkdir ce-m00-lab && cd ce-m00-lab
   ```

## Exercise (25 min)

### Step 1: Run a Simple Query (no context engineering)

Create `simple_call.py`:
```python
import anthropic

client = anthropic.Anthropic()

response = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=256,
    messages=[
        {"role": "user", "content": "What is a UCC-1 financing statement?"}
    ]
)

print("=== RESPONSE ===")
print(response.content[0].text)
print(f"\n=== TOKEN USAGE ===")
print(f"Input tokens:  {response.usage.input_tokens}")
print(f"Output tokens: {response.usage.output_tokens}")
```

Run it and record the token counts.

**What to observe:** How many input tokens does a bare query use? There's no system prompt, no examples, no history — just one user message. This is your baseline.

**Expected output:** ~15-20 input tokens, ~150-200 output tokens.

### Step 2: Run a Context-Engineered Query (all 5 layers)

Create `engineered_call.py`:
```python
import anthropic

client = anthropic.Anthropic()

# Layer 1: System Context
system = """You are a UCC filing analyst at a commercial credit bureau.
Extract debtor information from Secretary of State filings.
Rules:
- Preserve exact capitalization as filed
- Return JSON with keys: debtor_name, debtor_address, filing_type
- Flag truncated names (>80 chars)"""

# Layer 2: Retrieval Context (simulated RAG result)
retrieved_filing = """FILING: 2024-FL-001234
TYPE: UCC-1
DEBTOR: ACME INDUSTRIAL SOLUTIONS LLC
ADDRESS: 1234 COMMERCE BLVD, MIAMI, FL 33101
SECURED PARTY: FIRST NATIONAL BANK OF FLORIDA
COLLATERAL: All inventory, equipment, and accounts receivable"""

# Layer 3: Tool Context (simulated database lookup)
prior_filings = """Prior filings for ACME INDUSTRIAL SOLUTIONS LLC:
- 2023-FL-000891 (UCC-1, active, First National Bank)
- 2022-FL-000445 (UCC-1, terminated, SunTrust Bank)"""

# Layer 4: Conversation Context (simulated prior turn)
history = [
    {"role": "user", "content": "I'm analyzing Florida filings from Q1 2024."},
    {"role": "assistant", "content": "I'll help you analyze the Q1 2024 Florida filings. Please share the first filing."}
]

# Layer 5: User Context (embedded in system prompt)
user_context = "\nAnalyst profile: Senior analyst, 5+ years experience, prefers concise JSON output."

response = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=512,
    system=system + user_context,
    messages=[
        *history,
        {"role": "user", "content": f"""Filing text:
{retrieved_filing}

Prior filings for context:
{prior_filings}

Extract the debtor information as JSON."""}
    ]
)

print("=== RESPONSE ===")
print(response.content[0].text)
print(f"\n=== TOKEN USAGE ===")
print(f"Input tokens:  {response.usage.input_tokens}")
print(f"Output tokens: {response.usage.output_tokens}")
```

**What to observe:** Compare input tokens to Step 1. The difference is the cost of context engineering — but look at the quality difference in the output.

**Expected output:** ~250-350 input tokens. Output should be clean JSON with the correct debtor info.

### Step 3: Map Tokens to Layers

Create a table like this and fill it in:

| Layer | What's in it | Approx. tokens | % of total input |
|-------|-------------|-----------------|-----------------|
| 1. System | Instructions + user profile | ? | ? |
| 2. Retrieval | Filing text | ? | ? |
| 3. Tool | Prior filings lookup | ? | ? |
| 4. Conversation | 2 prior turns | ? | ? |
| 5. User | Analyst profile line | ? | ? |
| **Total** | | ? | 100% |

**Tip:** You can estimate per-layer tokens by running each piece through the API separately or using a tokenizer like `tiktoken`.

## Reflection Questions
1. Which layer consumed the most tokens? Is that the layer delivering the most value to the output?
2. If you had to cut 40% of the input tokens, which layer would you trim first? Why?
3. How does this connect to the chef's mise en place analogy — which "ingredients" are essential vs nice-to-have?

## Key Insight
The context window is not free — every token has a cost (money and attention). Context engineering is the discipline of allocating this budget deliberately across layers, not dumping everything in and hoping for the best.
