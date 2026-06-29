# M25 Lab: Understand It — Model the Same Task Three Ways

## Objective
Represent one UCC task's plan as a flat list, a DAG, and a hierarchical plan, then introduce a discovered sub-task and a parallelism opportunity — and see which representation actually holds up.

## Prerequisites
- Completed M25 module content
- A text editor; no API calls required (modeling exercise)

## Setup (2 min)

The task: **"Produce a full risk report for debtor ACME."** Its real structure:
1. Resolve the entity + aliases.
2. (depends on 1) Pull liens per state.
3. (depends on 1) Pull related parties.  ← can run in parallel with step 2.
4. (depends on 2 **and** 3) Fuse + score.
5. (depends on 4) Format the report.

Mid-run event: step 3 (related parties) **discovers a hidden affiliated entity** whose liens must also feed the score.

## Exercise (25 min)

### Step 1: Write the flat list

```
[ ] resolve entity
[ ] pull liens per state
[ ] pull related parties
[ ] fuse + score
[ ] format report
```

Now answer on this representation:
- Can you tell that "pull liens" and "pull related parties" can run **in parallel**? (No — a list implies order.)
- Can you express that "fuse + score" must wait for **both**? (Only by convention, not structurally.)
- Where does the discovered "pull liens for the hidden entity" go, and how do you make scoring wait for it? (Append-to-end loses the dependency — scoring may already be "next.")

### Step 2: Write the DAG

```
1 resolve
2a liens/state   deps: {1}
2b related       deps: {1}
3 fuse+score     deps: {2a, 2b}
4 format         deps: {3}
```
Then mutate for the discovery:
```
2c liens(related)  deps: {2b}          # the inserted node
3 fuse+score       deps: {2a, 2b, 2c}  # dependency added
```
Now answer:
- Parallelism: nodes with all-satisfied deps and `pending` status are runnable together → 2a and 2b surface together. ✓
- Gating: 3 structurally waits for its deps. ✓
- Mutation: insert 2c, add it to 3's deps — scoring cleanly waits. ✓

### Step 3: Write the hierarchical plan

```
GOAL: risk report
  └ gather (sub-plan)
      ├ liens/state
      └ related parties
          └ [if related entity found] liens for related entity   # nested mutation
  └ score
  └ format
```
Note: hierarchy expresses *decomposition depth* well (the discovered step nests naturally under "related parties"), but the cross-branch dependency (score needs both gather sub-steps) is still really a DAG edge. Hierarchy + DAG often coexist.

### Step 4: Score the three

| Representation | Expresses dependencies? | Enables parallelism? | Absorbs the mutation cleanly? |
|----------------|------------------------|----------------------|-------------------------------|
| flat list | no (only implied order) | no | no (append loses the dependency) |
| DAG | **yes** | **yes** | **yes** |
| hierarchical | partially (nesting) | partially | yes for nesting, needs DAG edges for cross-branch gating |

## Reflection Questions
1. The flat list *can* hold all five tasks — so why is "it fits" not the same as "it's the right representation"?
2. When the hidden entity is discovered, what exactly breaks if scoring was already marked "next" on the flat list?
3. Map the three representations to a Gantt chart — which one is actually a Gantt chart, and which is just a checklist?

## Key Insight
A plan's representation must match the task's structure: a flat list erases the dependencies and parallelism a multi-step agent task actually has, while a DAG expresses them and absorbs the inevitable mid-run discoveries — so "what can fit the steps" is the wrong question; "what can express the relationships" is the right one.
