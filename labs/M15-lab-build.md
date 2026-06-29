# M15 Lab: Build It with AI — A Confidence-Gated User Model

## Objective
With Claude, build a `UserModel` that earns preferences by corroboration, decays them over time, accepts user corrections, and — crucially — *asks* instead of assuming when confidence is low. Then prove a one-off never hardens into a preference and a stale preference decays out.

## Prerequisites
- Completed the M15 Understand It lab (you have Dana's behavior log)
- The M14 freshness/decay concepts (confidence weighting)
- Claude API access (optional for the assemble step), Python 3.10+

## The Build (40 min)

### Step 1: Build the confidence-gated model with Claude (15 min)

Claude prompt to use:
```
"Write user_model.py with a UserModel class for progressive, decaying personalization:

- observe(key, value, weight=1.0, explicit=False, ts=now): record an observation.
  Maintain per-(key,value) a confidence score. Each corroborating observation
  raises confidence toward 1.0 (e.g. conf = 1 - (1-conf)*exp(-weight)); an explicit
  user statement gets a large weight bump. Conflicting values for the same key
  compete (raising one lowers the other).
- decay(now, half_life_days=90): reduce every confidence based on age since last
  observation (exponential), so unsupported preferences fade.
- correct(key, value): user override — set this value's confidence to 1.0 and zero
  the competitors for that key (explicit correction wins immediately).
- preferences(threshold=0.6): return only {key: value} whose confidence >= threshold.
- need(key, threshold=0.6): return ('use', value) if a confident value exists,
  else ('ask', None) — the graceful fallback.
Return only the code."
```

Save as `user_model.py`.

### Step 2: Replay Dana's log (10 min)

Create `replay_dana.py`:
```python
from datetime import datetime, timedelta
from user_model import UserModel

NOW = datetime(2026, 6, 28)
um = UserModel()

# Corroborated preferences
for _ in range(54): um.observe("output_format", "concise_json", ts=NOW)
for _ in range(31): um.observe("flag", "related_party", ts=NOW)
for _ in range(12): um.observe("explain_borderline", True, ts=NOW)

# Explicit instruction (1x but explicit -> high weight)
um.observe("verify", "secured_party_names", explicit=True, ts=NOW)

# One-off NOISE (single ambiguous-case prose request)
um.observe("output_format", "verbose_prose", ts=NOW)

# STALE preference: 9 observations, all ~10 months ago
old = NOW - timedelta(days=300)
for _ in range(9): um.observe("verbosity", "medium", ts=old)

um.decay(NOW)
print("PREFERENCES (conf>=0.6):", um.preferences())
```

Run it. **Expected:**
- `output_format` resolves to **concise_json** (54 obs crush the 1 verbose_prose).
- `flag=related_party`, `verify=secured_party_names`, `explain_borderline=True` are present.
- `verbosity=medium` is **absent** — decayed below threshold (all observations are 10 months old).

### Step 3: Prove the fallbacks (10 min)

Create `fallbacks.py`:
```python
from datetime import datetime
from user_model import UserModel
NOW = datetime(2026, 6, 28)
um = UserModel()
for _ in range(54): um.observe("output_format", "concise_json", ts=NOW)

# 1) Graceful 'ask' when there's no confident preference for a needed key
print("tone needed:", um.need("tone", threshold=0.6))      # -> ('ask', None)
print("format needed:", um.need("output_format"))          # -> ('use', 'concise_json')

# 2) User correction overrides the model immediately
um.correct("output_format", "markdown_table")
print("after correction:", um.preferences()["output_format"])  # -> 'markdown_table'
```

Run it. **Expected:**
- An unknown key (`tone`) returns `('ask', None)` — the system would *ask* rather than guess.
- A known key returns `('use', 'concise_json')`.
- After `correct()`, the format is immediately `markdown_table` (explicit user override beats inferred history).

### Step 4: Assemble for the window (5 min)

Show the model emitting only high-confidence prefs into a context block, plus an `ask` note for any below-threshold need:
```python
prefs = um.preferences()
block = "USER PREFERENCES:\n" + "\n".join(f"- {k}: {v}" for k,v in prefs.items())
# If a needed pref is missing, append: "ASK USER: preferred <key>?"
print(block)
```

## Deliverable
A `m15-lab/` folder containing:
- `user_model.py` — confidence updates, decay, correction, threshold gate, `need()` fallback
- `replay_dana.py` — one-off held as noise, stale preference decayed out, corroborated prefs promoted
- `fallbacks.py` — low-confidence `ask` fallback and explicit user correction overriding the model

You now build personalization that's *earned*: confident where it should be, silent (asking) where it shouldn't, and self-correcting over time.

## Stretch Goals
- Add a "conditional preference" type so the one-off prose request can be stored as "detail on ambiguous cases" without becoming a global default.
- Emit a per-preference `provenance` (how many observations, explicit vs. inferred) so a user (or auditor — M22) can see *why* the model believes a preference.
- Cap stored preferences and enforce a "minimum that helps" policy — refuse to store low-value traits even when confident (privacy/over-collection guard).

## Connection to Next Module
Track 4 is complete — you've managed context across turns, layers, time, and users. Track 5 (Context Positioning & Optimization) shifts from *what* context to include to *where* it goes: M16 (Positional Effects) returns to the primacy/recency and lost-in-the-middle phenomena you've referenced since M01 — now as a discipline for placing the context you've so carefully assembled.
