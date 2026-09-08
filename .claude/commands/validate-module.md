---
description: Validate a module against the 22-point quality checklist
argument-hint: "MXX (e.g., M01, M14, M31)"
---

Validate module: $ARGUMENTS

Follow these steps:

1. Read `CLAUDE.md` for the 22-point quality checklist
2. Read `course/index.html` and extract the module object for $ARGUMENTS from the MODS array
3. Read `plans/$ARGUMENTS-plan.md` to verify the build matches the plan

Run every check from the Quality Checklist:

1. ✅/❌ File is self-contained HTML (all CSS/JS inline, fonts from CDN)
2. ✅/❌ Module has all required fields (id, track, title, subtitle, icon, color, topics, analogy, devLens, sections, takeaway)
3. ✅/❌ Everyday analogy appears BEFORE technical explanation in sections array
4. ✅/❌ Analogy is from a familiar domain (not tech-on-tech)
5. ✅/❌ At least one UCC domain example in module content
6. ✅/❌ Exactly 4-6 key topics listed
7. ✅/❌ At least one quiz section with WHY/WHEN question (not WHAT recall)
8. ✅/❌ Anti-patterns section present
9. ✅/❌ Cross-links tagged where applicable (check against CLAUDE.md cross-link table)
10. ✅/❌ Context Engineering Takeaway is exactly one sentence
11. ✅/❌ SVG diagram present in renderVisual() for this module
12. ✅/❌ `</script>` escaped as `<\/script>` in JSON strings
13. ✅/❌ No trailing commas in MODS array
14. ✅/❌ Progressive complexity appropriate for position in track
15. ✅/❌ Lab descriptions present (labUnderstand + labBuild)
16. ✅/❌ Code examples use UCC pipeline domain
17. ✅/❌ No hardcoded API keys
18. ✅/❌ Section types valid (content, analogy, code, quiz, antipattern)
19. ✅/❌ Track color matches TRACK_META
20. ✅/❌ Module ID follows MXX format and is sequential
21. ✅/❌ Dev Lens present — `devLens.title` and `devLens.body` non-empty, 2-4 sentences, naming a
    concrete coding-agent mechanism and the failure it produces
22. ✅/❌ Dev Lens routes nowhere — no `[Agent MXX]`, `[SDLC Track X]`, links, or other course names
    inside `devLens`

Points 4, 13, 21 and 22 are checked mechanically — run `node scripts/check-module.js $ARGUMENTS`
and use its output rather than re-deriving them by eye. The full PowerShell run is
`.\scriptsalidate-module.ps1 -ModuleId $ARGUMENTS`.

Report format:
```
═══ VALIDATION: $ARGUMENTS ═══
Score: XX/22
Status: PASS (≥20) | WARN (17-19) | FAIL (<17)

✅ 1. Self-contained HTML
❌ 7. Quiz question tests WHAT not WHY — fix: rephrase to "When should you..."
...

Fixes needed:
1. [specific fix with code snippet]
```

If score ≥ 20: module passes, suggest minor improvements
If score 17-19: list fixes in priority order
If score < 17: recommend re-reading the plan and rebuilding
