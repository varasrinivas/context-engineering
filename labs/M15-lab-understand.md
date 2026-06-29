# M15 Lab: Understand It — Separate Signal from Noise

## Objective
Take an analyst's observed-behavior log across many sessions and decide, for each observation, whether it's a real preference (signal), a one-off (noise), or a once-true-now-stale preference — then build the minimal, defensible user model.

## Prerequisites
- Completed M15 module content
- A text editor; no API calls required (analysis only)

## Setup (2 min)

Observed behaviors for analyst **Dana** over ~60 sessions:

```
A.  Requested concise JSON output ............................... 54 sessions
B.  Flagged related-party concerns proactively ................. 31 sessions
C.  Asked for a detailed prose explanation ...................... 1 session (an ambiguous filing)
D.  Wanted risk thresholds explained on borderline scores ...... 12 sessions
E.  Preferred MEDIUM verbosity ................. 9 sessions (all > 8 months ago; 0 since)
F.  Used keyboard shortcut to skip the summary ................. 2 sessions
G.  Asked you to "always double-check secured-party names" ..... 1 session (explicit instruction)
H.  Worked exclusively on Florida filings ...................... 60 sessions
```

## Exercise (25 min)

### Step 1: Classify and assign confidence + action

| Obs | Count | Signal / Noise / Stale | Confidence | Action |
|-----|-------|------------------------|-----------|--------|
| A concise JSON | 54 | signal | 0.95 | **store** (high-confidence pref) |
| B flag related-party | 31 | signal | 0.85 | **store** |
| C detailed prose | 1 | noise (one-off, ambiguous case) | 0.10 | **hold** (maybe conditional: "detail on ambiguous cases") |
| D explain borderline thresholds | 12 | signal | 0.70 | **store** (moderate) |
| E MEDIUM verbosity | 9, all old | **stale** | decaying → ~0.2 | **decay out** (contradicted by A; no recent support) |
| F keyboard skip-summary | 2 | weak signal | 0.30 | **hold** (watch) |
| G "always double-check names" | 1 but **explicit** | signal (explicit instruction ≠ inferred) | 0.80 | **store** (user *told* you) |
| H Florida filings only | 60 | signal (but maybe role/context, not preference) | 0.9 | **store as context, not preference** |

### Step 2: Note the two special cases

- **E is stale, not noise.** It had real support (9 sessions) but all old and now contradicted by A's 54. This is a *decayed* preference (M14), handled differently from C (never had support).
- **G is a one-off by count, but it's an explicit instruction**, not an inferred behavior. Explicit statements earn higher confidence than inferred patterns at the same count — the user *told* you.

### Step 3: Write the minimal user model

Produce the model you'd actually store:
```
Dana:
  output_format: concise JSON           (conf 0.95)
  proactively_flag: related_party       (conf 0.85)
  verify: secured_party_names           (conf 0.80, explicit)
  explain_borderline_thresholds: true   (conf 0.70)
  [context] domain: Florida filings
  [conditional, low-conf] may want detail on ambiguous cases
  # NOT stored: MEDIUM verbosity (stale), one-off prose request (noise)
```

### Step 4: The damage question

Which single overfit would hurt Dana most? Argue it: overfitting **C** ("always verbose prose") against 54 sessions of concise-JSON would bury *every* future output in unwanted explanation — the highest-frequency, highest-annoyance error.

## Reflection Questions
1. C and G are both "1 session." Why does G earn a place in the model while C doesn't?
2. E and C are both *not* in the final model — but for different reasons. What's the difference between "stale" and "noise," and why does it matter for how you handle them?
3. Map A, C, and E to the barista analogy (the usual, the one cold-day order, the two-year-old order).

## Key Insight
Building a user model is mostly *rejection*: most observations are noise, staleness, or context — and the discipline is promoting only well-corroborated or explicitly-stated preferences, because every wrongly-stored trait misfires on every future interaction.
