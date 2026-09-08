// Module-scoped checks for validate-module.ps1 — the ones that need the module's
// own JSON object rather than a regex over the whole 900KB file.
//
//   node scripts/check-module.js M04     one module
//   node scripts/check-module.js         all 32
//
// Emits "<n> PASS|FAIL <detail>" per checklist point (4, 13, 21, 22) and exits
// non-zero if anything failed.
//
//   4  — analogy is from a familiar (non-tech) domain
//   13 — MODS parses as JSON
//   21 — Dev Lens present, 2-4 sentences
//   22 — Dev Lens routes nowhere

const fs = require('fs');

const html = fs.readFileSync('course/index.html', 'utf8');
const m = html.match(/const MODS = (\[[\s\S]*?\]);\s*\n\s*const TRACK_META/);
if (!m) { console.log('13 FAIL could not locate the MODS array'); process.exit(1); }

let MODS;
try {
  MODS = JSON.parse(m[1]);
} catch (e) {
  console.log('13 FAIL MODS is not valid JSON: ' + e.message);
  process.exit(1);
}
console.log('13 PASS MODS parses (' + MODS.length + ' modules)');

// Tech vocabulary that would make an analogy tech-on-tech (CLAUDE.md rule 2).
// Matched against the analogy TITLE only: the title is what names the domain,
// while the body legitimately ends by mapping the analogy back to the technical
// concept (M10's office-email analogy closes on "a database query or API", which
// is the mapping sentence doing its job, not a tech-on-tech analogy).
const TECHY = /\b(server|API|database|microservice|kubernetes|docker|load balancer|endpoint|daemon)\b/i;

// Any cross-course routing inside a Dev Lens is a point-22 failure. The lens is
// deliberately self-contained (CLAUDE.md content rule 9).
const ROUTING = /\[(Agent\s+M\d+|SDLC\s+Track\s+\d+)\]|<a\s|href=|Code With AI|10x Toolkit|Ultimate Context Engineering|Knowledge Graph/i;

const wanted = process.argv[2];
const targets = wanted ? MODS.filter(x => x.id === wanted) : MODS;
if (wanted && !targets.length) { console.log('21 FAIL module ' + wanted + ' not found'); process.exit(1); }

let failed = 0;

for (const mod of targets) {
  const tag = targets.length > 1 ? mod.id + ' ' : '';

  // ── 4 ── analogy from a familiar domain
  const title = mod.analogy ? String(mod.analogy.title || '') : '';
  const body = mod.analogy ? String(mod.analogy.text || '') : '';
  if (!title.trim() || !body.trim()) {
    console.log(tag + '4 FAIL no analogy object');
    failed++;
  } else {
    const techy = title.match(TECHY);
    if (techy) { console.log(tag + '4 FAIL analogy is tech-on-tech: "' + techy[0] + '"'); failed++; }
    else { console.log(tag + '4 PASS analogy from a familiar domain'); }
  }

  // ── 21 / 22 ── the Dev Lens
  const dl = mod.devLens;
  if (!dl || typeof dl.title !== 'string' || typeof dl.body !== 'string'
      || !dl.title.trim() || !dl.body.trim()) {
    console.log(tag + '21 FAIL devLens missing or empty');
    console.log(tag + '22 FAIL not checked (no devLens)');
    failed++;
    continue;
  }

  // Sentence count on the body text, tags stripped. 2-4 per CLAUDE.md rule 9;
  // 5 is tolerated as the upper bound before it stops being a lens.
  const text = dl.body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const sentences = (text.match(/[.!?](\s|$)/g) || []).length;

  if (sentences < 2 || sentences > 5) {
    console.log(tag + '21 FAIL devLens is ' + sentences + ' sentence(s); want 2-4');
    failed++;
  } else {
    console.log(tag + '21 PASS devLens present (' + sentences + ' sentences, ' + text.length + ' chars)');
  }

  const hit = (dl.title + ' ' + dl.body).match(ROUTING);
  if (hit) {
    console.log(tag + '22 FAIL devLens routes out: "' + hit[0] + '"');
    failed++;
  } else {
    console.log(tag + '22 PASS devLens routes nowhere');
  }
}

process.exit(failed ? 1 : 0);
