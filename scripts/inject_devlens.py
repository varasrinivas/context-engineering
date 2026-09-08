# -*- coding: utf-8 -*-
"""Inject the Dev Lens blocks from docs/devlens.json into the MODS array.

Adds a "devLens" key to each module object, immediately before its "antiPatterns"
key. Targeted insertion rather than re-serialisation, so the diff stays small and
the file's existing indentation and module separators are preserved.

Idempotent: re-running replaces any devLens already present rather than adding a
second one.

Run from the repo root:

    python scripts/inject_devlens.py            # inject / refresh
    python scripts/inject_devlens.py --check    # report only, change nothing

Only the region between `const MODS = [` and `];\\n\\nconst TRACK_META` is touched.
Everything else in course/index.html -- including the generated block between
WT:START and WT:END -- is left byte-for-byte alone.
"""
import json
import re
import sys

HTML = "course/index.html"
LENSES = "docs/devlens.json"

MODS_START = "const MODS = ["
MODS_END = "];\n\nconst TRACK_META"


def esc(value):
    """JSON-encode a string for embedding in the inline MODS literal."""
    # json.dumps gives us correct escaping; the </script> guard is required
    # because MODS lives inside a <script> block (CLAUDE.md checklist rule 12).
    return json.dumps(value, ensure_ascii=False).replace("</script>", "<\\/script>")


def build_block(indent, lens):
    pad = indent + "  "
    return (
        '%s"devLens": {\n'
        '%s"title": %s,\n'
        '%s"body": %s\n'
        '%s},\n'
    ) % (indent, pad, esc(lens["title"]), pad, esc(lens["body"]), indent)


def main():
    check_only = "--check" in sys.argv

    with open(LENSES, encoding="utf-8") as f:
        lenses = json.load(f)

    # Read with newlines normalised to \n so the regexes stay simple, then write
    # back using whatever convention the file already had (it is CRLF today).
    with open(HTML, encoding="utf-8", newline="") as f:
        raw = f.read()
    newline = "\r\n" if "\r\n" in raw else "\n"
    src = raw.replace("\r\n", "\n")

    start = src.index(MODS_START)
    end = src.index(MODS_END, start)
    head, mods, tail = src[:start], src[start:end], src[end:]

    # Existing devLens keys are stripped first so a re-run refreshes rather than
    # duplicates. The block is always exactly the four lines build_block emits.
    existing = len(re.findall(r'^\s*"devLens": \{$', mods, re.M))
    mods = re.sub(
        r'^[ \t]*"devLens": \{\n'
        r'[ \t]*"title": .*\n'
        r'[ \t]*"body": .*\n'
        r'[ \t]*\},\n',
        "", mods, flags=re.M)

    injected = 0
    for mid in sorted(lenses):
        if mid not in lenses:
            continue
        m = re.search(r'"id": "%s"' % re.escape(mid), mods)
        if not m:
            print("  ! %s: no module object found in MODS" % mid)
            continue

        ap = re.search(r'^([ \t]*)"antiPatterns":', mods[m.end():], re.M)
        if not ap:
            print("  ! %s: no antiPatterns key found" % mid)
            continue

        # The anchor must belong to this module, not the next one.
        nxt = re.search(r'"id": "M\d\d"', mods[m.end():])
        if nxt and nxt.start() < ap.start():
            print("  ! %s: antiPatterns anchor crosses into the next module" % mid)
            continue

        at = m.end() + ap.start()
        mods = mods[:at] + build_block(ap.group(1), lenses[mid]) + mods[at:]
        injected += 1

    print("%d module(s) already carried a Dev Lens; injecting %d" % (existing, injected))

    if injected != len(lenses):
        print("ERROR: expected %d, injected %d" % (len(lenses), injected))
        return 1

    if check_only:
        print("--check: no file written")
        return 0

    with open(HTML, "w", encoding="utf-8", newline="") as f:
        f.write((head + mods + tail).replace("\n", newline))
    print("wrote %s (%s line endings)" % (HTML, "CRLF" if newline == "\r\n" else "LF"))
    return 0


if __name__ == "__main__":
    sys.exit(main())
