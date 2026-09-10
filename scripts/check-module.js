// Module-scoped checks for validate-module.ps1 — the ones that need the module's
// own JSON object rather than a regex over the whole 900KB file.
//
//   node scripts/check-module.js M04     one module
//   node scripts/check-module.js         all 32
//
// Emits "<n> PASS|FAIL|TODO <detail>" per checklist point (4, 13, 21-24) and
// exits non-zero if anything failed.
//
//   4  — analogy is from a familiar (non-tech) domain
//   13 — MODS parses as JSON
//   21 — Dev Lens present, 2-4 sentences
//   22 — Dev Lens routes nowhere
//   23 — worked UCC example present, inside the class vocabulary, filings resolve
//   24 — worked example routes nowhere
//
// Flag:  --drift   list filing ids in module prose that miss docs/ucc-corpus.json

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

// The closed class vocabulary for worked examples, mirroring the CSS in
// course/index.html. Anything outside it, or an inline style=, means the figure
// has started freelancing and the 32 will stop reading as one system.
const UE_CLASSES = new Set([
  'ue-rec', 'ue-rec-h', 'ue-f', 'ue-fk', 'ue-fv', 'ue-ann', 'ue-mark',
  'ue-cols', 'ue-panel', 'ue-panel-h',
  'ue-layers', 'ue-layer', 'ue-l1', 'ue-l2', 'ue-l3', 'ue-l4', 'ue-l5',
  'ue-lname', 'ue-lnote',
  'ue-out', 'ue-ok', 'ue-bad',
  'ue-tab', 't-mono', 't-ok', 't-bad',
  'ue-tok', 'ue-arrow', 'ue-note',
]);

const CORPUS = JSON.parse(fs.readFileSync('docs/ucc-corpus.json', 'utf8'));
const CORPUS_IDS = new Set(CORPUS.filings.map(f => f.id));

const args = process.argv.slice(2);
const DRIFT = args.includes('--drift');     // report ids in prose that miss the corpus
const wanted = args.find(a => !a.startsWith('--'));
const targets = wanted ? MODS.filter(x => x.id === wanted) : MODS;
if (wanted && !targets.length) { console.log('21 FAIL module ' + wanted + ' not found'); process.exit(1); }

// Reports the drift the corpus was introduced to end. Advisory: existing module
// prose was deliberately not rewritten when the corpus landed.
if (DRIFT) {
  const seen = new Map();
  for (const mod of MODS) {
    const blob = JSON.stringify(mod);
    for (const id of (blob.match(/\b\d{4}-[A-Z]{2}-\d{4,}\b/g) || [])) {
      if (CORPUS_IDS.has(id)) continue;
      if (!seen.has(id)) seen.set(id, new Set());
      seen.get(id).add(mod.id);
    }
  }
  if (!seen.size) { console.log('drift: none — every filing id in MODS resolves in the corpus'); }
  else {
    console.log('drift: ' + seen.size + ' filing id(s) in module prose do not resolve in docs/ucc-corpus.json');
    for (const [id, mods] of [...seen].sort()) {
      console.log('  ' + id + '  ' + [...mods].sort().join(', '));
    }
  }
  process.exit(0);
}

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

  // ── 23 / 24 ── the worked UCC example. Checked before the Dev Lens block,
  // which `continue`s on a missing lens and would otherwise skip these.
  const de = mod.domainExample;
  if (!de || typeof de.title !== 'string' || typeof de.body !== 'string'
      || !de.title.trim() || !de.body.trim()) {
    console.log(tag + '23 FAIL domainExample missing or empty');
    console.log(tag + '24 FAIL not checked (no domainExample)');
    failed++;
  } else {
    const problems = [];

    const classes = new Set();
    for (const m of de.body.matchAll(/class="([^"]*)"/g)) {
      m[1].split(/\s+/).filter(Boolean).forEach(c => classes.add(c));
    }
    const unknown = [...classes].filter(c => !UE_CLASSES.has(c));
    if (unknown.length) problems.push('class outside the vocabulary: ' + unknown.join(', '));
    if (![...classes].some(c => c.startsWith('ue-'))) problems.push('no ue- class; this is prose, not a figure');
    if (/\sstyle\s*=/.test(de.body)) problems.push('inline style= (use the class vocabulary)');
    // Not preceded by & — numeric HTML entities (&#9660;) are not colours.
    if (/(?:^|[^&\w])#[0-9a-fA-F]{3,8}\b/.test(de.body)) problems.push('hardcoded colour (use theme tokens)');

    // Every filing referenced must resolve in the canonical corpus.
    const ids = new Set((de.body.match(/\b\d{4}-[A-Z]{2}-\d{4,}\b/g) || []));
    const unresolved = [...ids].filter(id => !CORPUS_IDS.has(id));
    if (unresolved.length) problems.push('filing id not in docs/ucc-corpus.json: ' + unresolved.join(', '));

    if (problems.length) {
      console.log(tag + '23 FAIL ' + problems.join('; '));
      failed++;
    } else {
      console.log(tag + '23 PASS worked example (' + classes.size + ' classes, '
        + (ids.size || 'no') + ' filing id' + (ids.size === 1 ? '' : 's') + ' resolved)');
    }

    const deHit = (de.title + ' ' + de.body + ' ' + (de.caption || '')).match(ROUTING);
    if (deHit) {
      console.log(tag + '24 FAIL worked example routes out: "' + deHit[0] + '"');
      failed++;
    } else {
      console.log(tag + '24 PASS worked example routes nowhere');
    }
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
