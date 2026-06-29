# M15 Plan — User Modeling as Context: Personalization Without Overfitting

## Module Identity
- **ID:** M15
- **Track:** 4 (Memory & Conversation Context)
- **Title:** User Modeling as Context — Personalization Without Overfitting
- **Subtitle:** Building a model of the person you serve that helps — without overfitting to noise or hardening into a stale stereotype
- **Icon:** 👤
- **Color:** #7a4a8c (amethyst)

## Everyday Analogy
**The Good Barista Who Remembers Your Order**

A great regular barista remembers your usual — oat-milk flat white — and has it half-made when you walk in. That's personalization done right: a few stable, high-signal preferences that save you time. A *bad* personalization would be the barista who, because you once ordered a hot chocolate on a freezing day, now insists that's "your drink" and acts surprised every time you don't want it (overfitting to a one-off). Worse is the barista who remembers your order from two years ago and refuses to update when your tastes changed (a stale model). The best baristas hold a light, current model: confident about what's stable, quick to update, and happy to just ask when unsure.

Mapping:
- Remembering your usual order → a few stable, high-signal user preferences
- Drink half-made when you arrive → personalization that genuinely helps
- "Your drink is hot chocolate" from one cold day → overfitting to a one-off signal
- Refusing to update a two-year-old order → a stale user model (M14 decay applies)
- Just asking when unsure → graceful fallback instead of confident wrong personalization
- A light, current model → progressive, decaying, low-overfit user profile

## Key Topics (5)
1. **User context as a layer** — What the system knows about *this specific user* — expertise, role, preferences, history — is a distinct context layer (M02's Layer 5), living in persistent memory (M13). Used well, it raises relevance and cuts repetition; used badly, it injects confident wrong assumptions.
2. **Signal vs. noise in user data** — Not every observed behavior is a preference. A one-off action (the analyst once asked for a verbose explanation) is noise; a repeated pattern (always wants concise JSON) is signal. Overfitting treats noise as signal, hardening a stereotype from a single data point. *(UCC domain example lives here.)*
3. **Progressive profiling** — Build the model gradually and by confidence: start with nothing, add a preference only after enough corroboration, and weight it by how well-established it is. Don't front-load assumptions; earn them. (Confidence-weighting connects to M14's freshness weight.)
4. **The privacy spectrum and consent** — User modeling sits on a spectrum from session-only ephemerality to long-term persistent profiles, each with privacy and consent implications. More personalization isn't automatically better — it's more data to govern, secure, and justify (forward ref to M22 compliance). Model the minimum that genuinely helps.
5. **Decay, correction, and graceful fallback** — User models go stale (M14) and can be wrong. Design for it: decay old preferences, let the user correct the model, and when confidence is low, *ask* rather than assume. A wrong confident personalization is worse than none.

UCC domain example appears in: Topic 2 — an analyst's profile. Signal: across 50 sessions they always want concise JSON and always flag related-party concerns → high-confidence preferences worth storing. Noise: in one session they asked for a long prose explanation of a borderline case → a context-specific request, NOT a standing preference. Overfitting would store "Dana wants verbose prose" from that one session and then bury every future output in unwanted explanation.

## Sections Outline

### Section 1: content — "The User Is a Context Layer"
- Recap M02's Layer 5 / M13's persistent layer: what the system knows about this user is context.
- The upside: relevance, less repetition, appropriate depth (an expert doesn't need basics re-explained).
- The downside if done badly: confident wrong assumptions injected into every interaction. User modeling is high-leverage in both directions.

### Section 2: content — "Signal vs. Noise, and Progressive Profiling"
- The central discipline: distinguish a repeated pattern (signal → preference) from a one-off action (noise → not a preference). Overfitting = treating one data point as a standing trait.
- Progressive profiling: start empty, add preferences only after corroboration, weight by confidence (M14's freshness/confidence weighting reused).
- UCC tie-in: the analyst whose one verbose request gets wrongly hardened into "always verbose," vs. the 50-session pattern of concise JSON that legitimately becomes a stored preference.

### Section 3: content — "Privacy, Decay, and Graceful Fallback"
- The privacy/consent spectrum: ephemeral session personalization vs. long-term profiles — more modeling = more data to govern (forward to M22). Model the minimum that helps.
- Decay and correction: user models go stale (M14); let users correct them; decay low-confidence or old preferences.
- Graceful fallback: when confidence is low, ask rather than assume — a wrong confident personalization is worse than none.

### Section 4: quiz — "The One-Off Request"
- Question: "Across 50 sessions, an analyst always asks for concise JSON. In one session reviewing an unusually ambiguous filing, they ask for a detailed prose explanation of your reasoning. How should the user model update?"
- Options:
  - A. Update the profile to 'prefers detailed prose explanations' — it's the most recent signal
  - B. Treat the prose request as context-specific noise (a one-off tied to an ambiguous case), keep the high-confidence 'concise JSON' preference, and at most note 'may want detail on ambiguous cases' as a low-confidence, conditional signal
  - C. Average the two into 'medium verbosity' for all future outputs
  - D. Stop modeling this user — their preferences are inconsistent
  - correct: B (index 1)
- Explanation: One request against 50 sessions of contrary evidence is noise, not a new standing preference — overfitting would harden it into 'always verbose' and bury every future output in unwanted explanation. The right move is to keep the well-corroborated 'concise JSON' preference and, if anything, record a low-confidence *conditional* signal ('may want detail on ambiguous cases'). Recency alone (A) doesn't override 50 corroborations; averaging (C) invents a preference no one expressed; abandoning the model (D) throws away real signal over one outlier.

### Section 5: antipattern — "Personalization That Hurts"
- Anti-pattern 1: Overfitting to one-offs — hardening a single action into a permanent trait, then confidently applying a preference the user never had.
- Anti-pattern 2: The stale stereotype — never decaying or letting the user correct the model, so an outdated assumption persists long after the user changed.
- Anti-pattern 3: Over-collection — building a maximal profile because 'more data = better,' creating privacy/consent liability (M22) and dilution for personalization that didn't need it.

## SVG Diagram Plan
**"Signal vs. Noise in the User Model" — corroborated preferences vs. a one-off, with a confidence gate and decay**

```
   OBSERVED BEHAVIOR            CONFIDENCE GATE          USER MODEL
   ──────────────────          ───────────────          ──────────
   "concise JSON" ×50  ──────▶  conf 0.95  ──promote──▶  ✓ concise JSON
   "flag related party" ×30 ─▶  conf 0.88  ──promote──▶  ✓ flag related party
   "verbose prose" ×1  ──────▶  conf 0.10  ──hold─────▶  ✗ (noise; maybe conditional)
                                              │
                                       low conf → ASK, don't assume
   stale preference ──(decay)──▶ confidence falls over time (M14)
```

- Left column: observed behaviors with occurrence counts (×50, ×30, ×1).
- Middle: a CONFIDENCE GATE that converts corroboration into a confidence score and decides promote vs. hold.
- Right: the USER MODEL holding only the high-confidence preferences (✓), with the one-off held out (✗ noise).
- A "low conf → ASK, don't assume" branch off the gate; a "decay over time (M14)" arrow showing confidence falling for stale preferences.
- Colors: amethyst #7a4a8c primary; green check tint for promoted preferences; signal-red/grey for the rejected one-off; amber on the confidence gate (the key decision) and the ASK fallback; warm paper background; Fraunces title, JetBrains Mono labels.
- Reinforces the barista analogy: confident about the stable usual, skeptical of the one cold-day order, ready to just ask.

## Cross-Links
- None tagged in the curriculum map for M15. `crosslinks: []`. (In prose, lean on M13 (persistent layer the model lives in), M14 (decay/confidence weighting), M06 (persona is system-set behavior vs. user model is learned about the user — keep the distinction), and forward to M22 (privacy/compliance) — but no formal Agent/SDLC tags.)

## Lab Briefs

### Understand It: Separate Signal from Noise
- Give the learner an analyst's observed-behavior log across many sessions (repeated patterns + a few one-offs + a since-changed preference).
- They classify each observation as signal (corroborated preference), noise (one-off), or stale (a real preference that has since changed), assigning a confidence and a keep/hold/decay decision.
- Expected output: a table (observation, count, confidence, signal/noise/stale, action) plus the resulting minimal user model and a note on which one-off would do the most damage if overfit.
- Duration: ~25 minutes.

### Build It with AI: A Confidence-Gated User Model
- With Claude, build a `UserModel` that ingests observations, maintains a confidence per candidate preference (rising with corroboration, decaying with age — reusing M14), promotes only above a confidence threshold, supports user correction, and at assembly time emits only high-confidence preferences (and asks when a needed preference is below threshold).
- Steps: ingest observations → confidence update (corroboration + decay) → promote/hold gate → user-correction override → assemble preferences for the window with a low-confidence 'ask' fallback → demonstrate a one-off NOT hardening into a preference and a stale preference decaying out.
- Expected deliverable: a user-model module + a demo showing the 50× concise-JSON preference promoted, the 1× verbose request held as noise, a corrected preference overriding the model, and a low-confidence case triggering an 'ask' instead of a wrong assumption.
- Duration: ~40 minutes.

## Context Engineering Takeaway
A user model is personalization earned by corroboration: store only high-confidence, repeated preferences, weight them by confidence, decay them over time, let the user correct them, and when confidence is low just ask — because a confident wrong assumption helps less than no model at all.

## Anti-Patterns
1. Overfitting to one-offs — hardening a single action into a permanent trait and applying a preference the user never had.
2. The stale stereotype — never decaying or allowing correction, so an outdated assumption outlives the user's actual preference.
3. Over-collection — building a maximal profile because 'more data = better,' creating privacy/consent liability and dilution for personalization that wasn't needed.

## Continuity Notes
- **Builds on:** M13 (the persistent layer the user model lives in), M14 (confidence and decay weighting applied to preferences), M06 (distinct from system-set persona: persona is what you tell the model to be, the user model is what it learns about whom it serves), M02 (Layer 5). Closes the memory dimension by turning to the user.
- **Referenced by:** M22 (compliance — PII, consent, and governance of the user data this module collects), M27 (human-in-the-loop — escalation tailored to the user model), Track 8 (evaluating personalization quality). Completes Track 4; the course now pivots from temporal/memory context to Track 5's positioning and optimization.
