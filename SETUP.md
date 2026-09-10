# Setup — Context Engineering labs

## Requirements
- **Python 3.10+**
- **`pip install anthropic`** — for the labs that call the API from code
- **A Claude API key for 28 of the 64 labs.** The other 36 need a chat window or nothing at all.

```bash
export ANTHROPIC_API_KEY="your-key-here"     # macOS / Linux
setx ANTHROPIC_API_KEY "your-key-here"       # Windows, then reopen the terminal
```

## What actually needs a key

| Labs | What they need | Why |
|---|---|---|
| **28** | `ANTHROPIC_API_KEY` in the environment | they build an `anthropic.Anthropic()` client and call it |
| **14** | Claude, but by hand | the lab hands you a prompt to paste — **claude.ai is enough**, no key |
| **22** | nothing | pencil, editor, or the sandbox you already built |

Every lab states its own requirement in its **Prerequisites** section, and none of them calls the
API without saying so first. This table is only here so you can plan before you start rather than
discover it at the first lab.

**The first lab that needs a key is M00's "Understand It"** — the second thing you do in the course.

### Working without a key
Three labs name their own substitute, so you can still do them:

- **M01 · Understand It** — any public BPE tokenizer visualizer instead of the API
- **M01 · Build It** — claude.ai for the prompting work
- **M29 · Build It** — no network at all if your `strategy_fn` is a stub

The remaining key-requiring labs have no offline path. If you are working without a key, read them
rather than skipping them: the "Understand It" halves are mostly observation, and the reasoning is
the transferable part.

## The domain

The labs process **UCC filings** — the public records a lender files with a US Secretary of State
to announce a claim on a business's assets. You do not need to know the domain to start.

**[`labs/DOMAIN.md`](labs/DOMAIN.md)** is the whole of it in one page: an annotated filing, the cast
of companies the course reuses, what each of the ten filings is there to teach, and every term.
Keep it open beside the labs. The course player carries the same material — the primer opens M00,
and the glossary (◫ in the top bar, or press `g`) is reachable from every module.

## The sandbox

**M00's "Build It" creates `ucc-sandbox/`**, and later labs build on it. Keep the directory:

```
ucc-sandbox/
├── data/filings.json        10 mock UCC filings (you generate these with a Claude prompt)
├── retrieval/search.py      search and history functions
├── context/assembler.py     5-layer context assembly
└── main.py                  end-to-end context-engineered call
```

Because `filings.json` is generated rather than shipped, **your data differs from anyone else's**.
Labs whose output depends on it say so — look for *illustrative*, *approximate*, or *your exact
numbers will vary* beside the expected output. Any lab that quotes an exact figure is quoting one
that does not depend on your filings.

Every later lab that reuses an earlier artifact names it in its own Prerequisites.
