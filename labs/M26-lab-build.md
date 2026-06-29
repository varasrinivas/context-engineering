# M26 Lab: Build It with AI — A Summary-Sharing Blackboard

## Objective
With Claude, build a scoped `Blackboard` where agents share *shaped summaries* rather than raw context, wire the 3-agent UCC pipeline through it, and prove the report-writer's context stays bounded — then show the naive raw-sharing version exploding.

## Prerequisites
- Completed the M26 Understand It lab (you have the context-cost estimates)
- The M10 shaper concept (shaping raw → summary); Claude API access optional
- Python 3.10+

## The Build (40 min)

### Step 1: Build the scoped blackboard with Claude (12 min)

Claude prompt to use:
```
"Write blackboard.py with a Blackboard class for multi-agent context sharing:
- write(scope: str, key: str, summary: str): store a SHORT summary under (scope, key).
  Reject (raise) if summary is longer than max_summary_chars=200 — the board holds
  conclusions, not raw dumps.
- read(scopes: set[str]) -> dict: return only entries whose scope is in scopes
  (scoped reads — an agent gets only what its task needs, not the whole board).
- size_tokens() -> rough token estimate of the whole board (len//4).
Return only the code."
```

Save as `blackboard.py`. Note the design: the `write` cap *structurally* prevents raw-dump sharing.

### Step 2: Wire the 3-agent pipeline (14 min)

Create `pipeline.py`:
```python
from blackboard import Blackboard

# Each researcher pulls RAW data into ITS OWN context (not shared).
def lien_researcher(bb):
    raw = "\n".join(f"filing 2024-S{i}: ...verbose 800-token dump..." for i in range(5))  # ~4000 tok
    # ...analyze raw locally...
    summary = "ACME: 7 active liens across FL(3), TX(2), NY(2)"   # the conclusion only
    bb.write(scope="liens", key="ACME", summary=summary)
    return len(raw)   # raw stayed here, in the researcher's context

def related_researcher(bb):
    raw = "...verbose 2500-token corporate records dump..."
    summary = "ACME: 1 related entity — ACME HOLDINGS (shared address)"
    bb.write(scope="related", key="ACME", summary=summary)
    return len(raw)

def report_writer(bb):
    prefix = "You are a UCC report writer. Write a risk summary. " * 8   # ~400 tok fixed
    # SCOPED read: only the summaries the writer needs.
    facts = bb.read({"liens", "related"})
    context = prefix + "\nFACTS:\n" + "\n".join(f"{k}: {v}" for k, v in facts.items())
    return len(context) // 4   # token estimate of the writer's window

bb = Blackboard()
lien_researcher(bb); related_researcher(bb)
print("blackboard size (tokens):", bb.size_tokens())
print("report-writer context (tokens):", report_writer(bb))
```

Run it: `python pipeline.py`

**Expected:**
- `blackboard size` is tiny (two short summaries, ~tens of tokens).
- `report-writer context` is small (prefix + two summaries, a few hundred tokens) — the raw 4,000/2,500-token dumps never left the researchers.

### Step 3: Show the naive raw-sharing explosion (8 min)

Create `naive_pipeline.py` — researchers write *raw* output to the board (bypassing the cap by using a separate dict, to simulate the anti-pattern):
```python
naive_board = {}
naive_board["liens_raw"]   = "x" * 16000   # ~4000 tokens of raw filings
naive_board["related_raw"] = "x" * 10000   # ~2500 tokens

prefix = "You are a UCC report writer..." * 8
# Report-writer reads the WHOLE raw board:
writer_ctx = (len(prefix) + sum(len(v) for v in naive_board.values())) // 4
print("NAIVE report-writer context (tokens):", writer_ctx)   # ~6500+ and growing
```

Run it. **Expected:** the naive writer context is an order of magnitude larger (~6,500+ tokens) — and would grow with every researcher and step. Compare directly to the scoped version's few hundred.

### Step 4: Prove the boundary + scoping (6 min)

Two checks:
1. **Cap enforced:** confirm `bb.write("liens", "ACME", "x"*5000)` raises — the board *cannot* hold a raw dump by construction.
2. **Scoped reads:** confirm `bb.read({"liens"})` returns only the liens summary, not the related-party one — an agent gets only its scope (a tie-in to M23 boundaries).

## Deliverable
A `m26-lab/` folder containing:
- `blackboard.py` — a scoped, summary-only blackboard (write cap + scoped reads)
- `pipeline.py` — the 3-agent pipeline sharing summaries, with a bounded report-writer context
- `naive_pipeline.py` — the raw-sharing version showing the explosion
- A short note: report-writer context stays small under summary sharing and blows out under raw sharing; raw filings stayed confined to each researcher

You've turned multi-agent coordination into a bounded context-sharing design: summaries cross the boundary, raw data stays home.

## Stretch Goals
- Add a hub-and-spoke variant: a coordinator reads the blackboard summaries and assembles the final scoped context for the writer — and measure the hub's own context growth (M24 pressure on the hub).
- Add tenant scoping to the blackboard (M23): `write`/`read` carry a tenant_id so one tenant's summaries never reach another's reader.
- Have a researcher use an LLM to *generate* the summary from its raw context (M18 abstractive), with a fidelity check that the lien count survives.

## Connection to Next Module
You've shared context among autonomous agents. M27 (Human-in-the-Loop Context) adds the most important "agent" of all — a person. When an agent escalates a decision, it must hand the human exactly the right scoped context to decide quickly and correctly: approval flows, escalation context, and summarizing a long agent run for a human reviewer.
