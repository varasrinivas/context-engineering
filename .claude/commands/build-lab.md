---
description: Generate dual-path lab files for a module
argument-hint: "MXX (e.g., M01, M14, M31)"
---

Generate lab files for: $ARGUMENTS

Follow these steps:

1. Read `CLAUDE.md` for lab structure rules
2. Read `plans/$ARGUMENTS-plan.md` for lab briefs
3. Read `course/index.html` and extract the module's labUnderstand and labBuild fields
4. If this is NOT M00, read `labs/M00-lab-understand.md` and `labs/M00-lab-build.md` as reference

Generate two files:

## labs/$ARGUMENTS-lab-understand.md (Understand It)

Structure:
```markdown
# $ARGUMENTS Lab: Understand It — [Lab Title]

## Objective
What the learner will observe, analyze, or deconstruct (1-2 sentences)

## Prerequisites
- Completed module $ARGUMENTS content
- [any tools, API access, or data needed]

## Setup (5 min)
Step-by-step environment setup

## Exercise (20-30 min)

### Step 1: [Action verb] ...
- What to do
- What to observe
- Expected output (show exact expected output in a code block)

### Step 2: [Action verb] ...
...

### Step 3: [Action verb] ...
...

## Reflection Questions
1. Why did [observation] happen?
2. What would change if [variable] was different?
3. How does this connect to [analogy from module]?

## Key Insight
One sentence connecting observation to the module's takeaway.
```

## labs/$ARGUMENTS-lab-build.md (Build It with AI)

Structure:
```markdown
# $ARGUMENTS Lab: Build It with AI — [Lab Title]

## Objective
What the learner will build using Claude (1-2 sentences)

## Prerequisites
- Completed the Understand It lab
- Claude API access (or Claude.ai)
- [any additional tools]

## The Build (30-45 min)

### Step 1: [Scaffold] ...
- What to create
- Starter code or template
- Claude prompt to use: `"[exact prompt text]"`

### Step 2: [Extend] ...
- What to add
- How to iterate with Claude
- Expected intermediate output

### Step 3: [Test] ...
- How to verify it works
- Test cases from UCC domain
- Expected final output

### Step 4: [Refine] ...
- Edge cases to handle
- Performance or quality improvements
- Final Claude prompt for polish

## Deliverable
What the learner should have at the end (be specific)

## Stretch Goals
- [Optional extension 1]
- [Optional extension 2]

## Connection to Next Module
How this build prepares for the next module's concepts.
```

CRITICAL:
- Labs must use UCC Lien domain for all examples and test data
- "Build It with AI" labs include EXACT Claude prompts the learner should use
- Every step has expected output so the learner can self-verify
- Labs are completable in under 45 minutes each
