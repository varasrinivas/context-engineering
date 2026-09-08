# CLAUDE.md — Context Engineering Course

## Project Identity
This project generates the **Context Engineering: Mastering the LLM Context Window** course — a 32-module program across 8 tracks, teaching developers and AI engineers how to design, assemble, optimize, and govern everything that enters and exits an LLM's context window. All modules are anchored in the **UCC Public Records / Lien Risk Pipeline** domain — processing US Secretary of State filings for commercial credit risk profiling.

Published at **ai.varasrinivas.com** as part of the three-pillar curriculum:
- **Context Engineering** (this course) → the science of context design (foundational)
- **Building AI Agents with Claude** → applied practice using context principles
- **AI-SDLC Series** → enterprise process integration

## Architecture

### Single-File HTML Player
- One `course/index.html` file contains all modules
- `MODS` array holds module data objects
- `renderVisual(key)` switch returns per-module SVG diagrams
- `TRACK_META` array defines track colors and metadata
- Module navigation, progress tracking, keyboard shortcuts all self-contained

### Design System
| Element | Value |
|---|---|
| Display font | Fraunces (Google Fonts CDN) |
| Mono/label font | JetBrains Mono (Google Fonts CDN) |
| Body font | Inter (Google Fonts CDN) |
| Background | `#f6f3ec` (warm paper) |
| Surface | `#ffffff` |
| Text | `#2c2a26` |
| T1 Foundations | `#4a6741` forest |
| T2 System Context | `#8b5e3c` leather |
| T3 Dynamic Assembly | `#2e6b8a` deep water |
| T4 Memory | `#7a4a8c` amethyst |
| T5 Positioning | `#b8860b` amber |
| T6 Guardrails | `#c0392b` signal red |
| T7 Agent Patterns | `#1a5276` steel |
| T8 Production | `#2c3e50` charcoal |

### Content Rules (14-Rule Depth System)
1. Every concept gets an everyday analogy FIRST, then the technical explanation
2. Analogies must be from familiar domains: restaurants, airports, hospitals, offices, libraries, construction
3. No concept introduced without a concrete UCC domain example
4. Code examples are secondary to understanding — pseudocode is fine for concepts
5. Every module has exactly 2 labs: "Understand It" (observe/analyze) and "Build It with AI" (construct with Claude)
6. Diagrams are SVG, embedded in `renderVisual()` — no external images
7. **All 32 modules** carry an interactive walkthrough — a `data-wt="ce-<slug>"` div inside a content section, fed by `walkthroughs/*.json` and rendered by the shared runtime in `../shared/walkthrough/` (repo: varasrinivas/course-walkthrough-runtime, sibling checkout). This course has no measured dataset, so every scenario is `illustrative` and says so on screen — never relabel one `measured`. Rebuild the player AND `walkthrough/index.html` together or they drift.
8. Each module has 4-6 key topics, one analogy box, and cross-links to Agent/SDLC courses where applicable
9. **Every module carries a Dev Lens** (`devLens`) — 2-4 sentences naming the AI-assisted-development form of the module's idea, rendered as the *In your IDE* box between the analogy and Key Topics. It must (a) name the concrete coding-agent mechanism, (b) name the failure that mechanism produces, and (c) not restate the takeaway. Lead with Claude Code specifics (`CLAUDE.md`, `/compact`, plan mode, subagents, permission prompts) and name the Cursor/Copilot equivalent in a clause where one exists. **The Dev Lens routes nowhere — no cross-course tags, no links out.** Where the fit is genuinely weak (M15, M22, M23) say so in a clause rather than manufacturing a parallel; never stretch a lens to fill the field. Content is authored in `docs/devlens.json` and injected by `scripts/inject_devlens.py`; the reading order it supports is `docs/ai-assisted-dev-path.md`.
10. Quiz questions test understanding of WHEN and WHY, not recall of WHAT
11. Progressive complexity within each track: M+0 is "what is this", M+3 is "production edge cases"
12. Cross-links use tags: `[Agent MXX]` for Agent course, `[SDLC Track X]` for AI-SDLC — in module `sections`, never in the Dev Lens
13. Anti-patterns section in every module: "what goes wrong when you skip this"
14. Every module ends with a "Context Engineering Takeaway" — one sentence summary

### Module Object Schema
```json
{
  "id": "M00",
  "track": 1,
  "title": "Course Orientation & The Context Engineering Manifesto",
  "subtitle": "What context engineering is and why it matters more than prompting",
  "icon": "🎯",
  "color": "#4a6741",
  "topics": [
    "What is context engineering",
    "The context window as shared workspace",
    "Course structure and lab setup",
    "UCC Lien domain sandbox"
  ],
  "analogy": {
    "title": "The Chef's Mise en Place",
    "text": "Think of the context window as a chef's mise en place..."
  },
  "devLens": {
    "title": "Your coding agent has all five layers already",
    "body": "<p>2-4 sentences naming the coding-agent form of this module's idea. HTML string; <code>&lt;/script&gt;</code> escaped as <code>&lt;\/script&gt;</code>. Authored in docs/devlens.json, injected by scripts/inject_devlens.py.</p>"
  },
  "antiPatterns": [
    "Treating the context window as 'just a text box'",
    "Ignoring token economics until the bill arrives"
  ],
  "crosslinks": [],
  "sections": [
    {
      "type": "content",
      "title": "Section Title",
      "body": "HTML content..."
    },
    {
      "type": "analogy",
      "title": "Analogy Title",
      "body": "The analogy explanation..."
    },
    {
      "type": "code",
      "title": "Code Example",
      "language": "python",
      "code": "# example code"
    },
    {
      "type": "quiz",
      "question": "When should you...",
      "options": ["A", "B", "C", "D"],
      "correct": 2,
      "explanation": "Because..."
    },
    {
      "type": "antipattern",
      "title": "What Goes Wrong",
      "items": ["Pattern 1", "Pattern 2"]
    }
  ],
  "takeaway": "One sentence summary of the module.",
  "labUnderstand": "Brief description of the Understand It lab",
  "labBuild": "Brief description of the Build It with AI lab"
}
```

## Slash Commands

| Command | Description |
|---|---|
| `/plan-module MXX` | Create a detailed plan at `plans/MXX-plan.md` |
| `/build-module MXX` | Inject module into `course/index.html` using Python |
| `/validate-module MXX` | Run 22-point checklist against this CLAUDE.md |
| `/build-lab MXX` | Generate lab files at `labs/MXX-lab-understand.md` and `labs/MXX-lab-build.md` |

## Injection Pattern (Python)

NEVER rewrite the full HTML file. Use Python to inject module data:

```python
import json

# Read current HTML
with open("course/index.html", "r", encoding="utf-8") as f:
    src = f.read()

# Find MODS array end and inject new module
marker = "];\n\nconst TRACK_META"
new_module = json.dumps(module_obj, indent=2)
src = src.replace(marker, f",\n{new_module}\n{marker}")

# Find renderVisual switch and inject new case
visual_marker = "default: return '';"
new_visual = f'case "{visual_key}": return `{svg_html}`;'
src = src.replace(visual_marker, f'{new_visual}\n      {visual_marker}')

with open("course/index.html", "w", encoding="utf-8") as f:
    f.write(src)
```

## Session Workflow

```
1. /plan-module MXX          → creates plans/MXX-plan.md
2. Review & refine the plan
3. /build-module MXX          → injects into course/index.html
4. Preview in browser:        Start-Process "course\index.html"
5. /validate-module MXX       → run 22-point checklist
6. /build-lab MXX             → create lab files
7. git add -A && git commit -m "Add MXX: <title>"
8. /clear                     → start next session fresh
```

Plan files persist across sessions as durable memory.

## Cross-Link Reference

| CE Module | Agent Course | Relationship |
|---|---|---|
| M02 | Agent M03 | CE expands frame; Agent applies to prompts |
| M04 | Agent M03, M08 | CE goes deeper on layering |
| M07 | Agent M04 | CE covers example selection; Agent applies to schemas |
| M08-M09 | Agent M09-M10 | Same domain; CE = context quality, Agent = pipeline |
| M10 | Agent M05-M06 | CE = shaping returns; Agent = calling tools |
| M12 | Agent M08 | Direct overlap + compression theory |
| M13 | Agent M11 | CE = architectural patterns; Agent = implementation |
| M16 | Agent M08 | CE = research; Agent = positioning rules |
| M20 | Agent M16 | CE = injection defense; Agent = broader safety |
| M24 | Agent M12 | CE = what persists; Agent = the loop itself |
| M25 | Agent M13 | CE = state management; Agent = decomposition |
| M26 | Agent M14 | CE = context sharing; Agent = orchestration |
| M27 | Agent M15 | CE = escalation context; Agent = approval flows |
| M31 | Agent Capstones | Both use UCC domain |

## Quality Checklist (22 Points)
- [ ] 1. File is self-contained HTML (all CSS/JS inline, fonts from CDN)
- [ ] 2. Module has all required fields (id, track, title, subtitle, icon, color, topics, analogy, devLens, sections, takeaway)
- [ ] 3. Everyday analogy appears BEFORE technical explanation
- [ ] 4. Analogy is from a familiar domain (not tech-on-tech)
- [ ] 5. At least one UCC domain example per module
- [ ] 6. Exactly 4-6 key topics listed
- [ ] 7. At least one quiz section with WHY/WHEN question
- [ ] 8. Anti-patterns section present
- [ ] 9. Cross-links tagged where applicable (Agent or SDLC)
- [ ] 10. Context Engineering Takeaway is exactly one sentence
- [ ] 11. SVG diagram present in renderVisual()
- [ ] 12. `</script>` escaped as `<\/script>` in JSON strings
- [ ] 13. No trailing commas in MODS array
- [ ] 14. Progressive complexity appropriate for module position in track
- [ ] 15. Lab descriptions present (labUnderstand + labBuild)
- [ ] 16. Code examples use UCC pipeline domain
- [ ] 17. No hardcoded API keys
- [ ] 18. Section types valid (content, analogy, code, quiz, antipattern)
- [ ] 19. Track color matches TRACK_META
- [ ] 20. Module ID follows MXX format and is sequential
- [ ] 21. Dev Lens present: `devLens.title` and `devLens.body` both non-empty, 2-4 sentences,
      naming a concrete coding-agent mechanism and the failure it produces
- [ ] 22. Dev Lens routes nowhere — no `[Agent MXX]`, `[SDLC Track X]`, or any other cross-course
      tag or link inside `devLens`

## Windows Notes
- All paths use backslashes in PowerShell commands
- Browser preview: `Start-Process "course\index.html"`
- Node check: `node -e "JSON.parse(require('fs').readFileSync('temp.json','utf8'))"`
- PowerShell execution policy: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`
