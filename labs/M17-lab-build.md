# M17 Lab: Build It with AI — An Order Strategy Selector

## Objective
With Claude, build assemblers for the three core orderings plus a `choose_order(question_type)` selector — then prove the fitted ordering beats a mismatched one on both a cross-entity question and a per-entity question.

## Prerequisites
- Completed the M17 Understand It lab (you have `filings.py`, `reorder.py`)
- Claude API access, Python 3.10+ with `anthropic`

## The Build (40 min)

### Step 1: Build the three assemblers + selector with Claude (14 min)

Claude prompt to use:
```
"Write ordering.py with three context assemblers for UCC filings (each filing is a
dict with debtor, addr, id) and a selector:

- standard_order(rows): instructions placeholder first, filings as-is, the question
  last (frame-first, ask-last).
- group_by(rows, key='debtor'): sort/cluster by key so each entity's filings are
  contiguous.
- interleave_by(rows, key='addr'): sort by key so filings sharing that key are
  adjacent (surfaces cross-entity relationships).
- choose_order(question_type) -> the function to use:
    'per_entity'   -> group_by
    'cross_entity' -> interleave_by
    'format'       -> standard_order (canonical example last handled elsewhere)
Each assembler returns a newline-joined string of '[debtor] id @ addr' lines.
Return only the code."
```

Save as `ordering.py`.

### Step 2: Define the two questions (5 min)

Create `questions.py`:
```python
CROSS_ENTITY = ("Are any of these debtors likely related parties? Name them and "
                "give the evidence.")           # signal is cross-entity (shared addr)
PER_ENTITY   = ("Summarize ACME LOGISTICS's filing history and current exposure.")
                                                 # signal is within one entity
```

### Step 3: Fitted vs. mismatched bake-off (15 min)

Create `order_bakeoff.py`:
```python
import anthropic
from filings import FILINGS
from questions import CROSS_ENTITY, PER_ENTITY
from ordering import group_by, interleave_by, choose_order

client = anthropic.Anthropic()

def ask(ctx, q, label):
    resp = client.messages.create(model="claude-sonnet-4-6", max_tokens=220,
        messages=[{"role":"user","content": f"{ctx}\n\n{q}"}])
    print(f"\n=== {label} ===\n{resp.content[0].text.strip()}")

# Cross-entity question: FITTED = interleave, MISMATCH = group
fit = choose_order("cross_entity")              # -> interleave_by
ask(fit(FILINGS, "addr"),       CROSS_ENTITY, "CROSS-ENTITY + FITTED (interleave)")
ask(group_by(FILINGS, "debtor"), CROSS_ENTITY, "CROSS-ENTITY + MISMATCH (group)")

# Per-entity question: FITTED = group, MISMATCH = interleave
fit2 = choose_order("per_entity")               # -> group_by
ask(fit2(FILINGS, "debtor"),     PER_ENTITY, "PER-ENTITY + FITTED (group)")
ask(interleave_by(FILINGS,"addr"), PER_ENTITY, "PER-ENTITY + MISMATCH (interleave)")
```

Run it: `python order_bakeoff.py`

**Expected behavior:**
- **Cross-entity + interleave (fitted)** → finds the shared-address related-party link, names all three debtors.
- **Cross-entity + group (mismatch)** → weaker; the link is scattered, often missed.
- **Per-entity + group (fitted)** → clean, complete ACME history in one contiguous block.
- **Per-entity + interleave (mismatch)** → ACME's filings are scattered by address among other debtors; the summary is harder to assemble and more error-prone.

### Step 4: Score the fit (6 min)

| Question type | Fitted order | Mismatched order | Winner |
|---------------|--------------|------------------|--------|
| cross_entity | interleave (link found) | group (link missed) | **fitted** |
| per_entity | group (clean summary) | interleave (scattered) | **fitted** |

The selector picks the right order from the question's *shape* — and the fitted order wins both ways.

## Deliverable
A `m17-lab/` folder containing:
- `ordering.py` — `standard_order`, `group_by`, `interleave_by`, `choose_order`
- `questions.py`, `order_bakeoff.py` — the fitted-vs-mismatch demonstration
- A 2-row scorecard showing the fitted ordering wins for both question types

You can now select context ordering from the question's structure instead of defaulting to arrival or "tidiest" order.

## Stretch Goals
- Add a `narrative_order(rows)` that sequences background → evidence → the anomaly → the question, and test it on a reasoning task.
- Have Claude *classify* an incoming question as per_entity / cross_entity / format, so `choose_order` is fully automatic.
- Compose with M16: after ordering, run the result through your position-aware assembler so the single most important item also lands on an edge.

## Connection to Next Module
Ordering decides the sequence of what's in the window — but everything so far assumes the content already fits. M18 (Context Compression) tackles the case where it doesn't: summarization, distillation, and pruning to make context smaller while keeping the signal — which also shrinks the lost-in-the-middle trough you learned to fear in M16.
