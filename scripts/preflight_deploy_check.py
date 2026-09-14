#!/usr/bin/env python3
"""Prove production is serving the current commit, by bytes rather than by status code.

WHY THIS EXISTS
---------------
On 2026-09-13 PR #28 merged, GitHub reported everything green, and the
production build never ran. Twenty minutes later check.html was still serving
the pre-merge 33,801 bytes against 39,437 on main, and compliance.html, a brand
new route, returned 404.

EVERY CONVENTIONAL SIGNAL PASSED THE WHOLE TIME. The apex returned 200.
check.html returned 200. The sitemap returned 200. A release gate built on
status codes would have called that deployment a success while the entire
change was absent from production.

Three traps this script is shaped around, all of them hit that day:

  1. THE EDGE CACHE CANNOT BE TRUSTED TO TELL YOU. A cache-busting query string
     returned an identical age and etag, because Vercel keys static assets on
     path alone. So this compares BODIES, never headers.
  2. A 200 IS NOT EVIDENCE. The branch preview returned 200 on three paths at
     roughly 339 KB each. It was the Vercel SSO login page. Any check that
     stopped at the status code would have recorded a pass.
  3. THE RIGHT REMEDY IS RE-TRIGGER, NOT REVERT. Production was healthy and
     self-consistent on the previous build. Nothing was broken, so nothing
     needed reverting; the deployment was absent rather than bad. This script
     therefore reports STALE and says to re-trigger. It never reverts.

WHAT IT CHECKS
  For every tracked file that is actually deployed (see .vercelignore), fetch
  the live body and compare its sha256 with the blob in the target git ref.
  A file that differs is stale. A file that 404s but exists in the ref is
  missing, which is the new-route case that the 13 September failure hid.

USAGE
  python3 scripts/preflight_deploy_check.py                 # all deployed HTML + sitemap
  python3 scripts/preflight_deploy_check.py --ref origin/main
  python3 scripts/preflight_deploy_check.py --all           # include PDFs and json
  python3 scripts/preflight_deploy_check.py --paths check.html compliance.html

EXIT CODES
  0  every checked asset is byte-identical to the ref
  1  at least one asset is stale or missing   -> re-trigger the deployment
  2  could not run the comparison at all
"""

import argparse
import concurrent.futures
import hashlib
import os
import subprocess
import sys
import urllib.request
import urllib.error

BASE = "https://www.jrsstandard.com"
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TIMEOUT = 30

# Mirrors .vercelignore. A file matching any of these is not deployed, so a 404
# for it is correct and must not be reported as a failed deployment.
#
# "api/" IS DEPLOYED BUT IS NOT BYTE-COMPARABLE, which is a different thing and
# was worth getting right. Those files are Edge Functions: Vercel EXECUTES them
# and never serves their source. Comparing them against the repository blob
# compares a function's JSON response with its own source code, so every one
# reports STALE or MISSING. A first run of --all produced 45 stale and 16
# missing on that basis alone, all false. An alarm that cries wolf 61 times
# teaches the reader to ignore it, and a real staleness would then sit unread
# in the noise, so they are excluded here rather than explained away in a
# report. Their health belongs in the endpoint sweep, not a byte diff.
NOT_DEPLOYED_PREFIX = ("research/", "scripts/", "docs/enterprise-diligence/",
                       "cep-article-prep/", "templates/", ".claude/", "build/",
                       "api/")
NOT_DEPLOYED_SUFFIX = (".md", ".docx", ".csv", ".py", ".pyc", ".sh", ".sql")

# Named exclusions that are not covered by a prefix or a suffix rule.
#   supabase-ALL.sql  is listed in .vercelignore by name (the .sql suffix above
#                     now covers it too, kept here so the intent is explicit).
#   vercel.json       is the platform's own configuration. Vercel reads it and
#                     never serves it, so its 404 is correct and permanent.
NOT_DEPLOYED_EXACT = ("vercel.json", "supabase-ALL.sql", ".vercelignore",
                      ".gitignore", "CLAUDE.md")


def git(*args):
    return subprocess.run(["git"] + list(args), capture_output=True, text=True)


def tracked(ref):
    r = git("ls-tree", "-r", "--name-only", ref)
    if r.returncode != 0:
        return []
    return [p for p in r.stdout.split("\n") if p.strip()]


def _vercelignore_rules():
    """Read the real exclusion rules from .vercelignore.

    The lists above used to be the only source of truth and they DRIFTED: on
    2026-09-14 `standard/` was excluded in .vercelignore and this tool went on
    reporting the file as deployable, because the two lists are maintained by
    hand in two places. Reading the file removes that failure mode for every
    directory rule added in future.

    The hardcoded lists are still needed and are UNIONED with this, not replaced:
    .vercelignore says nothing about `api/`, which IS deployed but is executed
    rather than served and therefore cannot be byte-compared at all.
    """
    dirs, exts = [], []
    try:
        for line in open(os.path.join(ROOT_DIR, ".vercelignore"), encoding="utf-8"):
            line = line.strip()
            if not line or line.startswith("#") or line.startswith("!"):
                continue
            if line.endswith("/"):
                dirs.append(line)
            elif line.startswith("*."):
                exts.append(line[1:])
    except OSError:
        pass
    return tuple(dirs), tuple(exts)


def is_deployed(path):
    ig_dirs, ig_exts = _vercelignore_rules()
    if path in NOT_DEPLOYED_EXACT:
        return False
    if path.startswith(NOT_DEPLOYED_PREFIX) or path.startswith(ig_dirs):
        return False
    if ig_exts and path.endswith(ig_exts):
        return False
    if path.endswith(NOT_DEPLOYED_SUFFIX):
        return False
    if path.startswith("."):
        return False
    return True


def blob_sha(ref, path):
    r = subprocess.run(["git", "show", "%s:%s" % (ref, path)],
                       capture_output=True)
    if r.returncode != 0:
        return None
    return hashlib.sha256(r.stdout).hexdigest(), len(r.stdout)


def fetch(path):
    url = "%s/%s" % (BASE, path)
    req = urllib.request.Request(url, headers={
        # A real browser UA: /api/telemetry and /api/support both drop requests
        # from tooling agents, and a verification run must never alter counts.
        "User-Agent": "Mozilla/5.0 (compatible; jrs-preflight/1.0)",
        "Cache-Control": "no-cache",
    })
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
            body = r.read()
            return r.status, hashlib.sha256(body).hexdigest(), len(body)
    except urllib.error.HTTPError as e:
        try:
            e.read()
        except Exception:
            pass
        return e.code, None, 0
    except Exception as e:
        return None, None, 0


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--ref", default="origin/main", help="git ref production should match")
    ap.add_argument("--all", action="store_true", help="check every deployed asset, not just HTML and XML")
    ap.add_argument("--paths", nargs="*", help="check only these paths")
    a = ap.parse_args()

    if git("rev-parse", "--verify", a.ref).returncode != 0:
        print("cannot resolve ref %r. Run: git fetch origin" % a.ref)
        return 2

    if a.paths:
        paths = list(a.paths)
    else:
        paths = [p for p in tracked(a.ref) if is_deployed(p)]
        if not a.all:
            paths = [p for p in paths if p.endswith((".html", ".xml", ".txt"))]

    if not paths:
        print("nothing to check")
        return 2

    head = git("rev-parse", "--short", a.ref).stdout.strip()
    print("Comparing %d deployed asset(s) on %s against %s (%s)\n"
          % (len(paths), BASE, a.ref, head))

    stale, missing, unreachable, ok = [], [], [], 0

    def one(path):
        want = blob_sha(a.ref, path)
        status, got, size = fetch(path)
        return path, want, status, got, size

    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as ex:
        for path, want, status, got, size in ex.map(one, paths):
            if want is None:
                continue
            want_sha, want_len = want
            if status is None:
                unreachable.append(path)
                print("  UNREACHABLE  %s" % path)
            elif status == 404:
                missing.append(path)
                print("  MISSING      %s  (in %s, 404 live)" % (path, a.ref))
            elif got != want_sha:
                stale.append(path)
                print("  STALE        %s  (live %d b, ref %d b)" % (path, size, want_len))
            else:
                ok += 1

    print("\n%d byte-identical, %d stale, %d missing, %d unreachable"
          % (ok, len(stale), len(missing), len(unreachable)))

    if stale or missing:
        bad = set(stale) | set(missing)
        # CLASSIFY, DO NOT JUST REPORT. A silent skip and a partial rollout look
        # identical in a count of stale files, and they need opposite responses.
        # The signature of a skip is that every stale file is one the newest
        # commit touched: main moved, production did not. A partial rollout
        # leaves stale files the commit never touched.
        touched = set()
        r = git("show", "--name-only", "--format=", a.ref)
        if r.returncode == 0:
            touched = {p for p in r.stdout.split("\n") if p.strip()}
        skip_signature = bool(touched) and bad.issubset(touched)

        print("\nPRODUCTION IS NOT SERVING %s." % a.ref)
        if skip_signature:
            print("\n  *** SILENT DEPLOYMENT SKIP ***")
            print("  Every stale asset is a file the newest commit changed, and nothing")
            print("  else is stale. Production is intact on the PREVIOUS build: the new")
            print("  deployment never ran. This is the 13 September 2026 failure mode,")
            print("  in which GitHub reported the merge green and every route returned")
            print("  200 while the change was absent from production.")
            print("\n  DO NOT REVERT. There is no bad deployment to undo, and a revert")
            print("  would change nothing. RE-TRIGGER: push any commit to main, or")
            print("  redeploy from the Vercel dashboard.")
        else:
            print("\n  *** PARTIAL OR UNRELATED STALENESS ***")
            print("  Some stale assets are NOT files the newest commit touched, so this")
            print("  is not a clean skip. Check whether a deployment is still rolling")
            print("  out before acting, then re-run this check.")
            extra = sorted(bad - touched)[:8]
            if extra:
                print("  Stale but untouched by %s: %s" % (a.ref, ", ".join(extra)))
        print("\n  A green GitHub check and an HTTP 200 are not evidence of deployment")
        print("  on this project. This byte comparison is.")
        return 1

    if unreachable:
        print("\nSome assets could not be fetched. Network, not a deployment verdict.")
        return 1

    print("\nPRODUCTION IS BYTE-IDENTICAL TO %s. Deployment verified." % a.ref)
    return 0


if __name__ == "__main__":
    sys.exit(main())
