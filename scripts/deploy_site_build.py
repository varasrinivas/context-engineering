# -*- coding: utf-8 -*-
"""Build (and optionally deploy) the site copy of this course for
agenticai.varasrinivas.com/courses/context-engineering/.

Local repo-relative cross-course links assume the sibling-checkout layout
(`../../ultimate-context-eng/course/index.html`). The deployed site uses
`courses/<slug>/`, so those links are rewritten here. Same approach as
`../ultimate-context-eng/scripts/deploy_site_build.py`.

    python scripts/deploy_site_build.py             # build scripts/dist/ only
    python scripts/deploy_site_build.py --deploy    # build, upload, invalidate

Deploying requires the explicit --deploy flag: a bare run never touches the
bucket. Uploads skip any file already byte-identical on S3 (compared against
the object's ETag), so an unchanged walkthrough page costs neither an upload
nor a cache invalidation.
"""
from __future__ import annotations

import argparse
import hashlib
import shutil
import subprocess
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
OUT = Path(__file__).resolve().parent / "dist"
SLUG = "context-engineering"

BUCKET = "agenticai.varasrinivas.com"
DISTRIBUTION = "E204WFPQTUDQ3Q"
CONTENT_TYPE = "text/html; charset=utf-8"
CACHE_CONTROL = "public, max-age=300"

# Repo-relative sibling-checkout paths -> the deployed courses/<slug>/ layout.
SUBS = [
    ("../../ultimate-context-eng/course/index.html", "../ultimate-context-eng/index.html"),
]


def build() -> list[tuple[Path, str]]:
    """Write the site-adjusted copy to scripts/dist/. Returns (local, s3 key) pairs."""
    if OUT.exists():
        shutil.rmtree(OUT)
    course_out = OUT / "courses" / SLUG
    course_out.mkdir(parents=True)

    src = (REPO / "course" / "index.html").read_text(encoding="utf-8")
    rewritten = 0
    for old, new in SUBS:
        rewritten += src.count(old)
        src = src.replace(old, new)
    (course_out / "index.html").write_text(src, encoding="utf-8")
    print("courses/%s/index.html: %d links rewritten, %.0f kB"
          % (SLUG, rewritten, len(src.encode("utf-8")) / 1024))

    # No repo-relative link may survive into the site build. A leftover ../../
    # would 404 on the deployed site, where there is no sibling checkout.
    assert "../../" not in src, "unrewritten ../../ link remains - add it to SUBS"

    shipped = [(course_out / "index.html", "courses/%s/index.html" % SLUG)]

    # The walkthrough page's only relative link is ../index.html, already correct
    # for courses/<slug>/walkthrough/ -> the course index. Copied verbatim.
    wt = REPO / "walkthrough" / "index.html"
    if wt.exists():
        (course_out / "walkthrough").mkdir()
        shutil.copy(wt, course_out / "walkthrough" / "index.html")
        print("courses/%s/walkthrough/index.html: copied verbatim, %.0f kB"
              % (SLUG, wt.stat().st_size / 1024))
        shipped.append((course_out / "walkthrough" / "index.html",
                        "courses/%s/walkthrough/index.html" % SLUG))
    else:
        print("no walkthrough page (skipped) - rebuild it with "
              "../shared/walkthrough/build.py if that is unexpected")

    print("\ndist: %d files" % len(shipped))
    return shipped


def aws(*args: str) -> str:
    return subprocess.run(("aws",) + args, check=True, capture_output=True,
                          text=True).stdout.strip()


def live_etag(key: str) -> str | None:
    try:
        return aws("s3api", "head-object", "--bucket", BUCKET, "--key", key,
                   "--query", "ETag", "--output", "text").strip('"')
    except subprocess.CalledProcessError:
        return None  # not deployed yet


def deploy(shipped: list[tuple[Path, str]]) -> None:
    changed: list[str] = []
    for local, key in shipped:
        digest = hashlib.md5(local.read_bytes()).hexdigest()
        if digest == live_etag(key):
            print("unchanged, skipping: %s" % key)
            continue
        aws("s3", "cp", str(local), "s3://%s/%s" % (BUCKET, key),
            "--content-type", CONTENT_TYPE, "--cache-control", CACHE_CONTROL)
        print("uploaded: %s" % key)
        changed.append("/" + key)

    if not changed:
        print("\nnothing changed - no invalidation needed")
        return

    inv = aws("cloudfront", "create-invalidation", "--distribution-id", DISTRIBUTION,
              "--paths", *changed, "--query", "Invalidation.Id", "--output", "text")
    print("\ninvalidation %s on %s" % (inv, " ".join(changed)))
    aws("cloudfront", "wait", "invalidation-completed",
        "--distribution-id", DISTRIBUTION, "--id", inv)
    print("invalidation complete - https://%s/courses/%s/" % (BUCKET, SLUG))


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--deploy", action="store_true",
                    help="upload changed files to S3 and invalidate CloudFront")
    args = ap.parse_args()

    shipped = build()
    if args.deploy:
        print()
        deploy(shipped)
    else:
        print("\nbuild only. Re-run with --deploy to upload and invalidate.")
    return 0


if __name__ == "__main__":
    sys.exit(main())


# ---------------------------------------------------------------------------
# The catalog landing page is NOT deployed from here. Its source of truth is
# learnings-hub/agenticai/index.html — edit it there, then:
#   aws s3 cp index.html s3://agenticai.varasrinivas.com/index.html \
#       --content-type "text/html; charset=utf-8" --cache-control "public, max-age=300"
#   MSYS_NO_PATHCONV=1 aws cloudfront create-invalidation \
#       --distribution-id E204WFPQTUDQ3Q --paths "/" "/index.html"
# Under Git Bash, MSYS_NO_PATHCONV=1 stops the leading "/" in --paths being
# rewritten into a Windows path. Preview it with agenticai/serve-local.py, which
# maps the deployed URL structure onto the sibling checkouts.
# ---------------------------------------------------------------------------
