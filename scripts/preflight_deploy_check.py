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
import json
import re
from urllib.parse import urlsplit
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
                      ".gitignore", "CLAUDE.md", "package.json", "proxy.js")

# These are protected runtime routes, not public static source artifacts.
# Their correct production behavior is an unauthenticated sign-in response.
PRIVATE_GATED_EXACT = ("programme-status-9872fb93cc94.html",)


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
    dirs, exts, negations = [], [], []
    try:
        for line in open(os.path.join(ROOT_DIR, ".vercelignore"), encoding="utf-8"):
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            if line.startswith("!"):
                # A NEGATION RE-INCLUDES A FILE. Dropping it silently would class
                # a deployed file as not-deployed and skip it in byte
                # verification, which is the silent-skip class this tool exists
                # to catch. .vercelignore already contains one (`!404.md`).
                negations.append(line[1:])
                continue
            if line.endswith("/"):
                dirs.append(line)
            elif line.startswith("*."):
                exts.append(line[1:])
    except OSError:
        pass
    return tuple(dirs), tuple(exts), tuple(negations)


def is_deployed(path):
    ig_dirs, ig_exts, ig_neg = _vercelignore_rules()
    if path in ig_neg:
        return True
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


def declared_redirects(ref):
    """Resolve literal redirects from the exact Git ref, never from a stale worktree.

    Redirect-source files are not the bodies served at their public URLs.
    The final destination must itself be a tracked deployable asset. This
    makes canonical-path checks stronger than blindly skipping redirects.
    """
    r = git("show", "%s:vercel.json" % ref)
    if r.returncode:
        raise ValueError("Cannot read Vercel routing from reference")
    try:
        config = json.loads(r.stdout)
        rules = config.get("redirects", [])
        if not isinstance(rules, list):
            raise ValueError("Invalid redirects structure")
    except (ValueError, TypeError) as err:
        raise ValueError("Invalid Vercel routing: %s" % err)
    declared = {}
    for item in rules:
        source, destination = item.get("source"), item.get("destination")
        if not isinstance(source, str) or not isinstance(destination, str):
            raise ValueError("Invalid redirect rule")
        if not source.startswith("/") or not destination.startswith("/"):
            raise ValueError("Redirect must remain internal")
        if any(character in source for character in (":", "*", "(", ")")):
            continue  # Pattern routes cannot be identified by a single source file.
        key = source.lstrip("/")
        if key in declared:
            raise ValueError("Duplicate redirect source " + key)
        declared[key] = destination.split("?", 1)[0].lstrip("/")
    return declared


def resolve_public_target(path, redirects, tracked_set):
    """Return the bytes that Vercel must serve at a literal source route.

    Explicitly fail on a redirect to a nonexistent, private or ignored file.
    """
    target = redirects.get(path)
    if target is None:
        return path
    if (target not in tracked_set or not is_deployed(target)
            or target in PRIVATE_GATED_EXACT):
        raise ValueError("Redirect source %s has unsafe/untracked destination %s" % (path, target))
    return target


def fetch_private_gate(path):
    """An unauthenticated request must produce private sign-in, never dashboard data."""
    req = urllib.request.Request(BASE + "/" + path, headers={
        "User-Agent": "Mozilla/5.0 (compatible; jrs-preflight/1.0)",
        "Cache-Control": "no-cache",
    })
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
            body = r.read(65536).decode("utf-8", "replace")
            cache = r.headers.get("Cache-Control", "").lower()
            robots = r.headers.get("X-Robots-Tag", "").lower()
            return (r.status == 200 and "Private Owner Sign-In" in body
                    and "private" in cache and "no-store" in cache
                    and "noindex" in robots and "nofollow" in robots
                    and "/owner-login" in body and
                    "JRS Owner Dashboard" not in body)
    except (urllib.error.HTTPError, OSError, ValueError):
        return False



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
            return r.status, hashlib.sha256(body).hexdigest(), len(body), r.geturl()
    except urllib.error.HTTPError as e:
        try:
            e.read()
        except Exception:
            pass
        return e.code, None, 0, url
    except Exception as e:
        return None, None, 0, url


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--ref", default="origin/main", help="git ref production should match")
    ap.add_argument("--all", action="store_true", help="verify every deployed asset, including redirected sources")
    ap.add_argument("--paths", nargs="*", help="verify these exact paths")
    a = ap.parse_args()

    if git("rev-parse", "--verify", a.ref).returncode:
        print("cannot resolve ref %r. Run: git fetch origin" % a.ref)
        return 2

    tracked_set = set(tracked(a.ref))
    try:
        redirects = declared_redirects(a.ref)
        if a.paths:
            paths = list(a.paths)
            for path in paths:
                if path not in tracked_set:
                    raise ValueError("Explicit path not tracked: " + path)
        else:
            paths = [p for p in sorted(tracked_set) if is_deployed(p)]
            if not a.all:
                paths = [p for p in paths if p.endswith((".html", ".xml", ".txt"))]
        for path in paths:
            if path not in PRIVATE_GATED_EXACT:
                resolve_public_target(path, redirects, tracked_set)
    except ValueError as err:
        print("INVALID VERIFICATION CONFIGURATION: " + str(err))
        return 2

    if not paths:
        print("nothing to check")
        return 2

    head = git("rev-parse", "--short", a.ref).stdout.strip()
    print("Comparing %d served route(s) on %s against %s (%s)\n"
          % (len(paths), BASE, a.ref, head))

    stale, missing, unreachable, routing_errors, private_failures = [], [], [], [], []
    direct_ok, redirects_ok, private_ok = 0, 0, 0

    def one(path):
        if path in PRIVATE_GATED_EXACT:
            return path, None, None, None, None, None, fetch_private_gate(path)
        expected = resolve_public_target(path, redirects, tracked_set)
        want = blob_sha(a.ref, expected)
        status, got, size, final_url = fetch(path)
        return path, expected, want, status, got, size, final_url

    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as ex:
        for path, expected, want, status, got, size, final_url in ex.map(one, paths):
            if expected is None:
                if final_url is True:
                    private_ok += 1
                else:
                    private_failures.append(path)
                    print("  PRIVATE FAIL %s  (sign-in, no-store or noindex not established)" % path)
                continue

            if want is None:
                routing_errors.append(path)
                print("  ROUTE ERROR  %s  (target missing from ref)" % path)
                continue
            want_sha, want_len = want
            if status is None:
                unreachable.append(path)
                print("  UNREACHABLE  %s" % path)
            elif status == 404:
                missing.append(path)
                print("  MISSING      %s  (in %s, 404 live)" % (path, a.ref))
            elif status != 200:
                routing_errors.append(path)
                print("  ROUTE ERROR  %s  (unexpected HTTP %s)" % (path, status))
            elif (path in redirects and
                  urlsplit(final_url).path != "/" + expected):
                routing_errors.append(path)
                print("  ROUTE ERROR  %s  (expected redirect to /%s)" % (path, expected))
            elif got != want_sha:
                stale.append(path)
                print("  STALE        %s  (live %d b, ref %d b)" % (path, size, want_len))
            elif path in redirects:
                redirects_ok += 1
            else:
                direct_ok += 1

    print("\n%d direct assets byte-identical, %d redirects verified against canonical"
          " bytes, %d private gates confirmed, %d stale, %d missing, %d routing failures,"
          " %d private failures, %d unreachable"
          % (direct_ok, redirects_ok, private_ok, len(stale), len(missing),
             len(routing_errors), len(private_failures), len(unreachable)))

    if stale or missing or routing_errors or private_failures:
        print("\nPRODUCTION VERIFICATION FAILED for %s." % a.ref)
        if stale or missing:
            bad = set(stale) | set(missing)
            touched = set()
            r = git("show", "--name-only", "--format=", a.ref)
            if r.returncode == 0:
                touched = {p for p in r.stdout.split("\n") if p.strip()}
            skip_signature = bool(touched) and bad.issubset(touched)
            print("  *** %s ***" % ("POSSIBLE SILENT DEPLOYMENT SKIP" if skip_signature else "PARTIAL OR UNRELATED STALENESS"))
            print("  Compare the exact deployment identity and affected assets; do not automatically deploy or revert.")
        if routing_errors or private_failures:
            print("  Redirect destination or owner authentication requirement was not met.")
        return 1
    if unreachable:
        print("\nSome assets could not be fetched. Network, not a deployment verdict.")
        return 1

    print("\nPRODUCTION VERIFIED: direct assets match source bytes, redirects resolve"
          " to expected destination bytes, and private gates fail closed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
