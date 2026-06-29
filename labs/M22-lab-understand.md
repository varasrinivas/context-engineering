# M22 Lab: Understand It — Find the PII Leak Paths

## Objective
Trace a UCC pipeline that sends a raw filing (with SSN/EIN) into the window and logs the full prompt, and map *every* place the clear PII comes to rest — then identify the control for each and what a deletion request would have to touch.

## Prerequisites
- Completed M22 module content
- A text editor; no API calls required (analysis only)

## Setup (3 min)

Here is a (non-compliant) pipeline sketch. PII is in **bold**.

```
1. retrieve(filing_id) -> filing text containing: DEBTOR ACME LLC, EIN **12-3456789**,
   GUARANTOR Jane Roe, SSN **123-45-6789**, home address **55 Oak St**.
2. system_prompt = RULES                       # cached (M19) for reuse
3. user_message  = full filing text            # SSN/EIN included verbatim
4. response      = model(system_prompt, user_message)   # may echo PII
5. log.write({"prompt": user_message, "response": response})   # full prompt logged
6. memory.persist(debtor="ACME", last_filing=filing_text)     # PII into memory (M13)
7. cache: the system_prompt prefix is cached; the user message is not — but the
   provider may retain request data per its retention policy.
```

The risk task only needs: debtor name, lien count, secured parties, dates. It does **not** need the SSN, EIN, or guarantor's home address.

## Exercise (25 min)

### Step 1: Map the leak paths

| # | Location | Clear PII lands here? | Why it's a problem | Control to apply |
|---|----------|----------------------|--------------------|------------------|
| 3 | the prompt (user message) | **yes** | PII the task doesn't need enters the window | **minimize** (drop SSN/EIN/address) + **tokenize** what's needed |
| 4 | the model output | possibly | model may echo PII into the response | mask input → can't echo what it never saw + output check (M21) |
| 5 | the prompt log | **yes** | clear PII persisted in logs = breach + retention problem | log **metadata only** (debtor id, analyst, ts, flags) |
| 6 | the memory store | **yes** | `last_filing=filing_text` persists raw PII across sessions | persist masked/needed fields only (M13) |
| 7 | the cache / provider retention | partial | the per-call message may be retained per policy | residency + retention config; mask before send |

### Step 2: Rank the highest-risk path

Argue the worst one. Expected: **#5 (clear PII in the prompt log)** — logs are widely accessible, long-retained, often replicated, and rarely scrubbed; clear SSNs there are the classic breach. Close second: **#6 (raw PII in persistent memory)** because it survives the session and multiplies the erasure surface.

### Step 3: Trace a deletion request

Jane Roe withdraws consent and requests erasure. List every system you must touch to comply:
- the memory store (#6), the prompt logs (#5), any cached request data (#7), any derived risk records, and the audit trail (you keep the *access metadata* but purge the *content*).

Note how a system that *minimized and masked* up front (so clear PII never landed in #3–#7) makes this request trivial — there's almost nothing to delete because the SSN was never stored.

## Reflection Questions
1. The task never needed the SSN. How does *data minimization alone* eliminate most of these leak paths before masking or tokenization even comes up?
2. Why is "encrypt the logs at rest" an insufficient fix for leak path #5? (What does encryption not solve here?)
3. Map paths #5 and #6 to the hospital analogy — which is "the clerk photocopied the psych notes," and which is "the old chart was never shredded"?

## Key Insight
Clear PII doesn't leak in one place — it spreads to the prompt, output, logs, memory, and cache — so the cheapest compliance control is to never let it enter the window: minimize first, mask what's needed, and an erasure request becomes trivial because there was nothing to find.
