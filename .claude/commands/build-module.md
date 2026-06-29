---
description: Build a module and inject it into the course HTML player
argument-hint: "MXX (e.g., M01, M14, M31)"
---

Build and inject module: $ARGUMENTS

Follow these steps in order:

1. Read `CLAUDE.md` for injection pattern, design system, and quality checklist
2. Read `plans/$ARGUMENTS-plan.md` for the module specification (REQUIRED — do not build without a plan)
3. Read `course/index.html` to understand current MODS array structure and renderVisual switch

Build the module:

4. Construct the module JSON object following the schema in CLAUDE.md
   - All required fields: id, track, title, subtitle, icon, color, topics, analogy, antiPatterns, crosslinks, sections, takeaway, labUnderstand, labBuild
   - Sections array with proper types (content, analogy, code, quiz, antipattern)
   - Escape `</script>` as `<\/script>` in ALL string values
   - No trailing commas

5. Create the SVG diagram as an HTML string for renderVisual()
   - Use track color from TRACK_META
   - Keep viewBox reasonable (700x400 or similar)
   - Labels in JetBrains Mono, titles in Fraunces
   - Warm paper background (#f6f3ec) for diagram background elements

6. Use the Python injection pattern from CLAUDE.md to inject:
   - Module object into MODS array (before the `];\n\nconst TRACK_META` marker)
   - SVG case into renderVisual switch (before the `default: return '';` marker)

7. Validate injection:
   - Run `node -e "const fs=require('fs'); const html=fs.readFileSync('course/index.html','utf8'); const match=html.match(/const MODS = (\[[\s\S]*?\]);/); JSON.parse(match[1]); console.log('MODS valid')"`
   - Open in browser: `Start-Process "course\index.html"`

CRITICAL:
- NEVER rewrite the full HTML file — use the Python injection pattern
- ALWAYS read the plan file first
- ALWAYS escape </script> tags in JSON strings
- ALWAYS validate with node --check equivalent after injection
