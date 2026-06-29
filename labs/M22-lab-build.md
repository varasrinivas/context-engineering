# M22 Lab: Build It with AI — A PII-Masking + Audit Layer

## Objective
With Claude, build a compliance layer — `redact()` (minimize + tokenize PII), `audit()` (log access metadata, never the secret), and `erase()` (honor a deletion request) — then prove the SSN never appears in the prompt, output, cache, or audit log, while the access is fully logged and erasable.

## Prerequisites
- Completed the M22 Understand It lab (you have the leak-path map)
- Claude API access (optional — masking/audit/erase are local), Python 3.10+

## The Build (40 min)

### Step 1: Build the tokenizing redactor with Claude (14 min)

Claude prompt to use:
```
"Write compliance.py for a UCC pipeline. Implement:

1. A Vault class (in-memory dict) with tokenize(value, kind) -> 'tok_<kind>_<n>' that
   stores value->token both ways, and resolve(token) -> value (used OUTSIDE the model).
2. redact(filing: dict, needed_fields: set, vault: Vault) -> dict that:
   - MINIMIZES: drops any key not in needed_fields.
   - TOKENIZES PII: detects SSN (\\d{3}-\\d{2}-\\d{4}), EIN (\\d{2}-\\d{7}), and any
     field named like ssn/ein/home_address, replacing the value with a vault token.
   - Returns a 'safe' dict containing ONLY needed fields, with PII tokenized.
3. assert_no_clear_pii(text, vault) -> raises if any original PII VALUE appears in text
   (used to check the prompt, the output, and any log line before it's written).
Return only the code."
```

Save as `compliance.py`.

### Step 2: Build audit + erase with Claude (10 min)

Claude prompt to use:
```
"Extend compliance.py:
- audit(store: list, *, user, subject_id, action, flags) appends a record with a UTC
  timestamp and NO clear PII (subject_id is a stable opaque id, not a name/SSN).
- erase(subject_id, *, vault, memory: dict, logs: list) removes the subject's data from
  the vault, the memory dict, and any log entries that reference the subject_id's content
  (keep audit ACCESS records but purge any content fields), returning a report of what
  was deleted from each store.
Return the updated code."
```

### Step 3: Run the compliant pipeline (12 min)

Create `run_compliance.py`:
```python
from compliance import Vault, redact, assert_no_clear_pii, audit, erase

vault = Vault(); audit_log = []; memory = {}

RAW = {"debtor":"ACME LOGISTICS LLC", "ein":"12-3456789",
       "guarantor_ssn":"123-45-6789", "home_address":"55 Oak St",
       "lien_count":3, "secured_parties":["FIRST CAPITAL"]}

NEEDED = {"debtor", "lien_count", "secured_parties"}   # the risk task's real needs

safe = redact(RAW, NEEDED, vault)
prompt = f"Score lien risk:\n{safe}"

# COMPLIANCE ASSERTIONS — clear PII must not appear anywhere it could leak
assert_no_clear_pii(prompt, vault)          # not in the prompt
# (simulate model output that only saw `safe`)
output = '{"risk":"HIGH","verified_lien_count":3,"flags":[]}'
assert_no_clear_pii(output, vault)          # not in the output

# Log the ACCESS, not the secret
audit(audit_log, user="analyst_dana", subject_id="debtor_ACME",
      action="risk_score", flags=[])
assert all("123-45-6789" not in str(e) for e in audit_log)   # no SSN in the log

memory["debtor_ACME"] = {"last_risk":"HIGH"}   # masked, minimal — no raw PII

print("safe context:", safe)
print("audit log:", audit_log)
print("SSN appears anywhere?:",
      any("123-45-6789" in str(x) for x in [prompt, output, audit_log, memory]))  # -> False
```

Run it. **Expected:**
- `safe context` contains only debtor/lien_count/secured_parties (SSN, EIN, address dropped or tokenized).
- The three `assert_no_clear_pii` checks pass — the SSN is in none of prompt/output/log.
- `SSN appears anywhere?: False`.

### Step 4: Honor a deletion request (4 min)

```python
report = erase("debtor_ACME", vault=vault, memory=memory, logs=audit_log)
print("erasure report:", report)
print("memory after erase:", memory)        # debtor_ACME content removed
# Access audit records may remain (metadata), but no content/PII does.
```
Confirm the subject's data is gone from the vault and memory, while the *access* audit record (who/when/action) is retained — that's the compliant balance.

## Deliverable
A `m22-lab/` folder containing:
- `compliance.py` — `Vault` (tokenize/resolve), `redact` (minimize + tokenize), `assert_no_clear_pii`, `audit`, `erase`
- `run_compliance.py` — a pipeline proving clear PII never enters prompt/output/log, the access is logged, and an erasure request cleanly removes the subject's data
- A short note: SSN/EIN never in the clear anywhere; access logged with metadata only; deletion request satisfied across vault/memory/logs

You've made the context window auditable, minimal, and erasable — compliance by design, not by hope.

## Stretch Goals
- Add data residency: tag each record with a region and refuse to route an EU subject's data to a non-EU processor.
- Make the audit log tamper-evident: hash-chain each entry (entry N includes the hash of N-1) so deletion/alteration is detectable.
- Combine with M19: prove the *cache* never holds clear PII by masking before the cached prefix is assembled.

## Connection to Next Module
You've protected the data of one subject across the pipeline. M23 (Multi-Tenant Context Isolation) protects *between* tenants: in a shared system, one customer's context — their filings, memory, and cached data — must never leak into another's window, even by accident. It's compliance and security at the boundary between users.
