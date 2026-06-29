# M04 Lab: Understand It — Dissect a Production System Prompt

## Objective
Take a realistic but deliberately messy UCC extraction system prompt, label every line by its section type, and flag the architectural defects — so you can see structure (or its absence) the way the model effectively does.

## Prerequisites
- Completed M04 module content
- A text editor; no API calls required for this lab (analysis only)

## Setup (3 min)

Save this as `messy_prompt.txt` — a ~40-line system prompt that jumbles everything together:

```
You are a helpful assistant that works with UCC filings and you should be
accurate and professional at all times. Extract the debtor name from filings.
Return JSON. Here are some things to keep in mind: amendments (UCC-3) point to
an original filing and the real name might be in that original document not the
amendment itself. Preserve capitalization exactly as written. Also you should
explain your reasoning so the analyst understands how you got the answer.
Names longer than 80 characters are probably truncated. The collateral section
can be ignored for this task. Redacted debtors show up as [REDACTED] and you
should return null for those. Never invent a debtor name that isn't there.
Below is the filing: FILING 2024-FL-0019988 TYPE UCC-3 AMENDMENT TO
2024-FL-0012345 ACTION debtor name changed see original filing for prior name.
Output only valid JSON with no extra text. Be concise. Use your best judgment.
```

## Exercise (25 min)

### Step 1: Label each line by section type

Go line by line and tag each with one of: `ROLE`, `OBJECTIVE`, `RULE`, `REFERENCE`, `OUTPUT_CONTRACT`, `DATA`, or `VAGUE` (filler that constrains nothing).

**Expected result:** you'll find the six section types are *interleaved randomly* — a rule, then reference, then another rule, then the data, then another output instruction.

### Step 2: Flag the architectural defects

Identify at least four. Expected findings:

| # | Defect | Why it hurts | Fix (principle) |
|---|--------|--------------|-----------------|
| 1 | No delimiters between sections | Model can't tell a hard rule from a footnote | Named delimited sections (anatomy) |
| 2 | Critical rule "never invent a name" buried mid-prompt | Lowest-salience position for the highest-stakes rule | Promote to top `<rules>` (ordering) |
| 3 | Filing text inlined flush with instructions, no boundary | Instruction/data confusion + injection risk | Wrap in `<filing>` data boundary |
| 4 | Contradiction: "explain your reasoning" vs "output only valid JSON, no extra text" | Model must guess which wins | State output contract once (conflict) |
| 5 | Vague filler ("be concise", "use your best judgment") | Tokens that constrain nothing — dilution | Delete |

### Step 3: Predict the failure

Given these defects, predict how this prompt fails on the UCC-3 amendment specifically. (It will likely either fabricate a name OR emit prose + JSON, violating the contract.)

## Reflection Questions
1. The critical rule "never invent a debtor name" is present — the prompt *says* it. Why isn't saying it enough?
2. Which single defect is most dangerous in a security sense, and why (think about who else might write text inside that filing)?
3. How does this map to the employee-handbook analogy — which defect is the "fire-exit plan hidden in the dress-code section"?

## Key Insight
A system prompt can contain every correct instruction and still fail, because the model responds to *structure and position*, not just presence — an unarchitected prompt buries its most important rules exactly where the model attends least.
