# BUILD-THE-COURSE.md — Step-by-Step Windows Guide

## Context Engineering: Mastering the LLM Context Window
### Claude Code Authoring Guide

---

## Quick Start (5 minutes)

1. **Unzip** the `context-eng-kit` folder to your workspace
2. **Open** Claude Code in the folder:
   ```powershell
   cd context-eng-kit
   claude
   ```
   Claude Code reads `CLAUDE.md` automatically on first interaction.
3. **Preview M00** (already seeded):
   ```powershell
   Start-Process "course\index.html"
   ```

---

## How It Works

The course is a **single HTML file** (`course/index.html`) containing all modules. You build one module at a time using four slash commands, then inject it into the HTML file using a Python script. This means you never have to touch the full HTML — only the module data gets inserted.

### The Four-Stage Pipeline

```
/plan-module M01    →  creates plans/M01-plan.md
                        (review and edit this — cheapest place to fix things)

/build-module M01   →  injects into course/index.html
                        (uses Python injection, never rewrites the file)

/validate-module M01 → runs 24-point quality checklist
                        (flags issues against CLAUDE.md standards)

/build-lab M01      →  creates labs/M01-lab-understand.md
                                  labs/M01-lab-build.md
```

### Recommended Session Workflow

Each module is **one Claude Code session**. Don't batch.

```
1. /plan-module MXX          → creates plans/MXX-plan.md
2. Review & refine the plan  → edit in your text editor
3. /build-module MXX         → injects into course/index.html
4. Preview in browser:       → Start-Process "course\index.html"
5. /validate-module MXX      → run 24-point checklist
6. Fix any issues            → Claude Code can apply fixes
7. /build-lab MXX            → create lab files
8. git add -A && git commit -m "Add MXX: <title>"
9. /clear                    → start next session fresh
```

---

## Build Order

### Phase 1: Calibration (2 modules)
Build M00 is already done. Build M01 next:

```
/plan-module M01
# Review the plan
/build-module M01
# Preview in browser
/validate-module M01
/build-lab M01
```

Then **jump to M20** (Guardrails track — very different content). If your pipeline survives both M01 (foundations) and M20 (security), it'll survive everything.

### Phase 2: Track-by-Track
After calibration, build in track order:

```
Track 1: M02, M03           (M00 and M01 already done)
Track 2: M04, M05, M06, M07
Track 3: M08, M09, M10, M11
Track 4: M12, M13, M14, M15
Track 5: M16, M17, M18, M19
Track 6: M21, M22, M23      (M20 already done in calibration)
Track 7: M24, M25, M26, M27
Track 8: M28, M29, M30, M31
```

### Phase 3: Capstone Polish
M31 (Capstone) should be built last — it references every prior track.

---

## File Layout

```
context-eng-kit/
├── CLAUDE.md                    ← Master context file (Claude Code reads this)
├── BUILD-THE-COURSE.md          ← This guide
├── .claude/
│   └── commands/
│       ├── plan-module.md       ← /plan-module slash command
│       ├── build-module.md      ← /build-module slash command
│       ├── validate-module.md   ← /validate-module slash command
│       └── build-lab.md         ← /build-lab slash command
├── course/
│   └── index.html               ← Single-file course player (M00 seeded)
├── docs/
│   ├── curriculum-map.md        ← Full 32-module blueprint
│   ├── devlens.json             ← Dev Lens content, keyed M00-M31
│   ├── domain-examples.json     ← Worked UCC examples + the M00 domain primer
│   └── ucc-corpus.json          ← Canonical filings + glossary (single source of domain truth)
├── labs/
│   ├── DOMAIN.md                ← GENERATED: the domain in one page, for lab readers
│   ├── M00-lab-understand.md    ← M00 lab (reference)
│   └── M00-lab-build.md         ← M00 lab (reference)
├── plans/
│   └── M00-plan.md              ← M00 plan (reference)
├── templates/
│   └── module-schema.json       ← Copy-paste module template
└── scripts/
    ├── validate-module.ps1      ← Per-module validation (24 checks)
    ├── validate-all.ps1         ← Batch validation
    ├── check-module.js          ← Module-scoped checks 4, 13, 21-24 (--drift)
    ├── inject_devlens.py        ← Injects docs/devlens.json into MODS
    ├── inject_domain_examples.py ← Injects worked examples + M00 primer; writes labs/DOMAIN.md
    └── deploy_site_build.py     ← Site build + deploy (--deploy to publish)
```

## Publishing

```powershell
python scripts\deploy_site_build.py            # build scripts\dist\ only
python scripts\deploy_site_build.py --deploy   # upload changed files, invalidate
```

Rewrites repo-relative cross-course links to the deployed `courses/<slug>/`
layout, skips any file already byte-identical on S3, and waits for the
CloudFront invalidation. The catalog landing page is deployed separately — its
source is `learnings-hub/agenticai/index.html`.

---

## Troubleshooting

### "MODS array parse error"
The Python injection likely introduced a trailing comma or unescaped character. Run:
```powershell
node -e "const fs=require('fs'); const html=fs.readFileSync('course/index.html','utf8'); const m=html.match(/const MODS = (\[[\s\S]*?\]);\s*\n\s*const TRACK_META/); try{JSON.parse(m[1]);console.log('VALID')}catch(e){console.log('ERROR:',e.message)}"
```

### "Module not rendering"
Check that the module's `track` number matches a TRACK_META entry (1-8).

### "SVG not showing"
Verify the `renderVisual()` switch has a case for your module ID (exact match, case-sensitive).

### PowerShell execution policy
```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

---

## Quality Standards Summary

Every module must have:
- ✅ Everyday analogy BEFORE technical explanation (from familiar domain)
- ✅ At least one UCC Lien domain example
- ✅ 4-6 key topics
- ✅ At least one WHY/WHEN quiz question
- ✅ Anti-patterns section ("what goes wrong")
- ✅ SVG diagram in renderVisual()
- ✅ One-sentence Context Engineering Takeaway
- ✅ Dual-path lab descriptions (Understand It + Build It with AI)
- ✅ Cross-links to Agent/SDLC courses where applicable
- ✅ Dev Lens naming the coding-agent form of the idea (self-contained — no links out)
- ✅ Worked UCC example showing the idea happening to a real filing (self-contained — no links out)

Content that lives in `docs/` is authored there, never edited inside `course/index.html`:

```
python scripts/inject_devlens.py            # Dev Lens
python scripts/inject_domain_examples.py    # worked examples + M00 primer + labs/DOMAIN.md
python ../shared/domain/build.py --corpus docs/ucc-corpus.json --root .     --target course/index.html --prose course/index.html --prose-mode mods   # the glossary runtime
node scripts/check-module.js                # checks 4, 13, 21-24 across all 32
node scripts/check-module.js --drift        # filing ids in prose that miss the corpus
```

Both injectors are idempotent and touch only their own region of `course/index.html` — the
generated `WT:START`/`WT:END` walkthrough bundle is never modified. Add a filing to
`docs/ucc-corpus.json` before citing it in an example; check 23 rejects ids that do not resolve.
