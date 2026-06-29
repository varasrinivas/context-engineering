# M19 Lab: Build It with AI — A Cacheable Prompt Builder

## Objective
With Claude, build a prompt builder that assembles deliberately cacheable UCC requests (frozen prefix, volatile suffix) plus a *cacheability linter* that catches silent invalidators before they ship — then prove the hit rate goes from 0% (invalidator present) to high (removed).

## Prerequisites
- Completed the M19 Understand It lab (you have `cache_demo.py` and the RULES block)
- Claude API access, Python 3.10+ with `anthropic`

## The Build (40 min)

### Step 1: Build the cacheable prompt builder with Claude (12 min)

Claude prompt to use:
```
"Write prompt_builder.py with build_request(filing_text, rules, examples) for a UCC
extraction call. It must return a dict with 'system' and 'messages' suitable for the
Anthropic SDK, where:
- The system is a single text block containing rules + examples, assembled
  DETERMINISTICALLY (sort examples by a stable key; never include timestamps, UUIDs,
  or per-call IDs), with cache_control {'type':'ephemeral'} on it.
- The per-filing text goes ONLY in messages as a user turn — never in system.
Add a build_request_1h variant that uses cache_control {'type':'ephemeral','ttl':'1h'}.
Return only the code."
```

Save as `prompt_builder.py`.

### Step 2: Build the cacheability linter with Claude (12 min)

Claude prompt to use:
```
"Write cache_lint.py with lint_prefix(text) -> list[str] that scans a cached prompt
prefix for SILENT INVALIDATORS and returns a list of human-readable warnings. Detect:
- date/time patterns (ISO timestamps, 'Current date', 'today', \\d{4}-\\d{2}-\\d{2})
- UUIDs (8-4-4-4-12 hex) and obvious request/session IDs ('req_', 'sess_', 'id=')
- likely-unsorted JSON: a JSON object literal whose keys are not in sorted order
- per-user markers ('user_id', 'tenant', an email address)
Each warning names the offending substring and why it breaks caching. If the prefix
is clean, return []. Return only the code."
```

Save as `cache_lint.py`. Test it on a clean prefix (should return `[]`) and a dirty one (`"Current date: 2026-06-29\nrules..."` → one warning).

### Step 3: Wire builder + linter + a cache-rate harness (12 min)

Create `cache_harness.py`:
```python
import anthropic
from prompt_builder import build_request
from cache_lint import lint_prefix

client = anthropic.Anthropic()
RULES = open("rules.txt").read() if False else ("...your padded RULES from the Understand lab...")
EXAMPLES = [("redacted", "..."), ("clean", "...")]  # stable, will be sorted by builder

FILINGS = [f"FILING 2024-FL-{12000+i:07d} DEBTOR: CO {i} LLC" for i in range(5)]

def hit_rate(make_system_text):
    reads = 0
    for i, f in enumerate(FILINGS):
        sys_text = make_system_text()
        # lint BEFORE sending
        warns = lint_prefix(sys_text)
        r = client.messages.create(
            model="claude-sonnet-4-6", max_tokens=120,
            system=[{"type":"text","text":sys_text,"cache_control":{"type":"ephemeral"}}],
            messages=[{"role":"user","content":f}])
        if r.usage.cache_read_input_tokens > 0: reads += 1
    return reads/len(FILINGS), warns

# CLEAN prefix
clean_rate, clean_warns = hit_rate(lambda: RULES)
# DIRTY prefix (planted invalidator)
import datetime
dirty_rate, dirty_warns = hit_rate(lambda: f"Current date: {datetime.date.today()}\n"+RULES)

print(f"CLEAN  hit-rate={clean_rate:.0%}  lint={clean_warns}")
print(f"DIRTY  hit-rate={dirty_rate:.0%}  lint={dirty_warns}")
```

Run it. **Expected:**
- **CLEAN**: hit-rate ~80% (every call after the first reads the cache), lint returns `[]`.
- **DIRTY**: hit-rate 0%, and the linter *predicted it* by flagging the `Current date:` line before you even sent the request.

### Step 4: Make the linter a guardrail (4 min)

Make `build_request` raise (or refuse) if `lint_prefix` finds any invalidator in the system text — so an un-cacheable prompt can't ship by accident:
```
"Add a check in build_request: call lint_prefix on the assembled system text and, if
it returns any warnings, raise ValueError listing them. Return the updated code."
```
Confirm a dirty prefix now fails loudly at build time instead of silently at runtime.

## Deliverable
A `m19-lab/` folder containing:
- `prompt_builder.py` — deterministic, frozen-prefix request builder (5-min and 1-hour TTL variants) with a build-time cacheability guard
- `cache_lint.py` — a linter that detects date/UUID/unsorted-JSON/per-user invalidators
- `cache_harness.py` — a hit-rate comparison proving CLEAN ≈ high vs. DIRTY = 0%, with the linter predicting the failure

You can now build prompts that are cacheable *by construction* and catch the silent invalidators that would otherwise quietly cost you full price forever.

## Stretch Goals
- Add a cost estimate: given a per-1M input price and a cache-read multiplier (~0.1×), compute monthly savings of the CLEAN vs. DIRTY prefix at 50,000 calls/day (M03 tie-in).
- Add a pre-warm step: fire one `max_tokens`-minimal call at startup to write the cache before real traffic, and measure first-real-request latency with and without it.
- Combine with M18: cache the *compressed* stable prefix, so compression and caching savings stack.

## Connection to Next Module
Track 5 is complete — you've shaped the window's position (M16), order (M17), size (M18), and cost-over-time (M19). Track 6 (Guardrails & Safety Context) shifts from optimization to protection: M20 (Input Guardrails) returns to the trust and injection themes from M05, now as a dedicated discipline — detecting prompt injection, enforcing boundaries, and defending the context window from adversarial input.
