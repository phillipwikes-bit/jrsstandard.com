#!/usr/bin/env python3
"""Deployment lock: record exactly what is live, then detect any drift from it.

WHAT A LOCK IS HERE. A dated manifest naming the production commit, the SHA-256
of every deployed surface at that commit, and the result of every live probe run
against production at lock time. Once written it is a fixed point: `--verify`
re-runs the same probes and re-hashes the same files and reports anything that
moved.

WHY IT IS NOT A GIT TAG. A tag records what was committed. It does not record
that /api/reviewer-eval actually refuses to issue a certificate, or that a
withdrawn contributor's link actually 404s. Those are properties of the running
system, and they are the properties that were verified by hand this month and
would otherwise have to be re-verified by hand every time.

WHY IT DOES NOT COVER research/. research/ is not deployed by design. The lock
is a statement about production, and including files that never reach production
would make it one.

Usage:
  python3 scripts/deployment_lock.py --set      # write the lock from live state
  python3 scripts/deployment_lock.py --verify   # compare live state to the lock
  python3 scripts/deployment_lock.py --show     # print the current lock

Exit code: 0 if the lock holds, 1 if anything drifted, 2 on an operational error.
"""
import argparse
import hashlib
import io
import json
import os
import subprocess
import sys
import urllib.error
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LOCK = os.path.join(ROOT, "research", "DEPLOYMENT_LOCK.json")
SITE = "https://www.jrsstandard.com"

# Every file that reaches production and whose contents were verified this
# month. A file not on this list is not covered, which is why the list is
# explicit rather than a glob over the repository.
LOCKED_FILES = [
    "api/contributor.js",
    "api/_contributor-roster.js",
    "api/honor.js",
    "api/reviewer-cert.js",
    "api/reviewer-eval.js",
    "api/variance-6b1d90fa2c47e8b3.js",
    "api/panel-stats.js",
    "api/people-9dd1ecdf6f8cdfd4.js",
    "api/review.js",
    "access.html",
    "contributor.html",
    "reviewer/index.html",
    "reviewer/evaluation.html",
    "reviewer/completion.html",
    "vercel.json",
    "CLAUDE.md",
    "scripts/check_zero_drift.py",
]

# Live probes. Each is (label, path, method, body_or_None, assertion, why).
# The assertion is a callable taking the decoded body and returning True/False.
# Every one of these was verified by hand during August 2026; the lock is what
# stops them having to be.


def _has(needle):
    return lambda b: needle in b


def _lacks(needle):
    return lambda b: needle not in b


def _json_eq(path, want):
    def f(b):
        try:
            d = json.loads(b)
        except Exception:
            return False
        for k in path.split("."):
            if not isinstance(d, dict) or k not in d:
                return False
            d = d[k]
        return d == want
    return f


PROBES = [
    ("contributor roster size is 41", "/api/contributor-stats", "GET", None,
     _json_eq("roster", 41),
     "V-AI-08 was withdrawn as a contributor on 2026-08-16; the roster went 42 to 41"),

    ("withdrawn contributor link is dead", "/api/contributor?k=agbhlh6n4d&src=owner",
     "GET", None, _has('"error":"unknown_key"'),
     "her confirmation link must not resolve"),

    ("withdrawn honor link is dead", "/api/honor?k=apuyyioat6", "GET", None,
     _has('"found":false'),
     "honor entry H-2026-06 was retired; the code is not reused"),

    ("a control honor link still resolves", "/api/honor?k=f6t7aw2wya", "GET", None,
     _has('"found":true'),
     "proves the honor endpoint still works and the previous probe is not a false pass"),

    ("contributor POST returns no study findings", "/api/contributor", "POST",
     '{"k":"selftest00","consent_named":"no","consent_use":"yes","consent_transfer":"yes"}',
     _lacks('"results"'),
     "the gated results summary was removed on 2026-08-16"),

    ("evaluation issues no certificate", "/api/reviewer-eval", "POST",
     '{"src":"selftest","consent_research":true,"want_certificate":true,'
     '"name":"Lock Probe","email":"probe@example.com","consent_contact":true,'
     '"answers":{"q_readers":"Two","q_second":"Always","q_useful":"5"}}',
     _json_eq("certificate", False),
     "certificates are for training completions only; wantsCert is pinned false"),

    ("evaluation returns no completion code", "/api/reviewer-eval", "POST",
     '{"src":"selftest","consent_research":true,"want_certificate":true,'
     '"name":"Lock Probe","email":"probe@example.com","consent_contact":true,'
     '"answers":{"q_readers":"Two","q_second":"Always","q_useful":"5"}}',
     _json_eq("code", ""),
     "no new JRS-R- code may be minted from the evaluation"),

    ("an issued certificate still renders",
     "/api/reviewer-cert?code=JRS-R-DOGUUVV9&name=Lock%20Probe", "GET", None,
     _has("submitted the JRS reviewer evaluation"),
     "withdrawing an offer does not retract what was already given"),

    ("the certificate claims no training", "/api/reviewer-cert?code=JRS-R-DOGUUVV9&name=Lock%20Probe",
     "GET", None, _lacks("six-module"),
     "the training claim was an overclaim the database contradicted"),

    ("the evaluation page has no certificate control", "/reviewer/evaluation.html",
     "GET", None, _lacks("want-cert"),
     "the opt-in checkbox and its contact fields were removed"),

    ("access.html promises no certificate", "/access.html", "GET", None,
     _lacks("Recommendation or Certificate"),
     "the funnel from /api/support must not offer one"),

    ("legacy Cloudflare function is not served", "/functions/record.js", "GET", None,
     lambda b: "Cloudflare Pages Function" not in b,
     "it returned 200 and 1814 bytes of dead code until 2026-08-18"),

    ("programme totals hold", "/api/panel-stats", "GET", None,
     lambda b: (_json_eq("reviewers_all", 58)(b)
                and _json_eq("completers_all", 36)(b)
                and _json_eq("countries_all", 16)(b)),
     "58 reviewers, 36 completers, 16 countries; unchanged by the withdrawal"),

    ("variance endpoint computes", "/api/variance-6b1d90fa2c47e8b3", "GET", None,
     _json_eq("ok", True),
     "Appendix C is computed server-side and needs no service key from anyone"),

    ("variance endpoint withholds the answer key", "/api/variance-6b1d90fa2c47e8b3",
     "GET", None,
     lambda b: '"class"' not in b and "GROUNDED" not in b,
     "per-record accuracy beside the class would publish the key"),
]


def die(msg):
    sys.stderr.write(msg.rstrip() + "\n")
    sys.exit(2)


def sha256(rel):
    p = os.path.join(ROOT, rel)
    if not os.path.isfile(p):
        return None
    h = hashlib.sha256()
    with open(p, "rb") as fh:
        for block in iter(lambda: fh.read(65536), b""):
            h.update(block)
    return h.hexdigest()


def git(*args):
    try:
        return subprocess.check_output(["git"] + list(args), cwd=ROOT,
                                       stderr=subprocess.DEVNULL).decode().strip()
    except Exception:
        return ""


def probe(path, method, body):
    url = SITE + path
    data = body.encode("utf-8") if body else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("Accept", "*/*")
    req.add_header("User-Agent", "jrs-deployment-lock/1.0 (+https://jrsstandard.com)")
    if body:
        req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req, timeout=90) as r:
            return r.status, r.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8", "replace")
    except Exception as e:
        return 0, "REQUEST_FAILED: %r" % (e,)


def run_probes():
    out = []
    for label, path, method, body, assertion, why in PROBES:
        status, text = probe(path, method, body)
        try:
            ok = bool(assertion(text))
        except Exception:
            ok = False
        out.append({"label": label, "path": path, "method": method,
                    "http": status, "pass": ok, "why": why})
    return out


def build(stamp):
    return {
        "locked_on": stamp,
        "production_commit": git("rev-parse", "origin/main"),
        "production_subject": git("log", "-1", "--format=%s", "origin/main"),
        "development_commit": git("rev-parse", "HEAD"),
        "development_branch": git("rev-parse", "--abbrev-ref", "HEAD"),
        "site": SITE,
        "files": {rel: sha256(rel) for rel in LOCKED_FILES},
        "probes": run_probes(),
        "scope_note": "research/ is not deployed and is deliberately outside this lock. "
                      "The lock is a statement about production.",
        "cloudflare_note": "The failing 'Workers Builds' check on pull requests is driven "
                           "by a Cloudflare-to-GitHub integration held in the Cloudflare "
                           "dashboard, outside this repository. Every Cloudflare artifact "
                           "was deleted from the repo on 2026-08-18 and the build still "
                           "fails, which confirms it. Only disconnecting it in the "
                           "dashboard stops it.",
    }


def main():
    ap = argparse.ArgumentParser()
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument("--set", action="store_true", help="write the lock from live state")
    g.add_argument("--verify", action="store_true", help="compare live state to the lock")
    g.add_argument("--show", action="store_true", help="print the current lock")
    ap.add_argument("--stamp", default="", help="ISO date for the lock; required with --set")
    args = ap.parse_args()

    if args.show:
        if not os.path.isfile(LOCK):
            die("no lock at %s" % LOCK)
        sys.stdout.write(io.open(LOCK, encoding="utf-8").read())
        return 0

    if args.set:
        if not args.stamp:
            die("--set requires --stamp YYYY-MM-DD, so the lock date is never inferred "
                "from a clock this script does not control.")
        lock = build(args.stamp)
        failed = [p for p in lock["probes"] if not p["pass"]]
        missing = [k for k, v in lock["files"].items() if v is None]
        if failed or missing:
            for p in failed:
                sys.stderr.write("PROBE FAILED  %-46s http %s\n" % (p["label"], p["http"]))
            for m in missing:
                sys.stderr.write("FILE MISSING  %s\n" % m)
            die("\nREFUSING TO SET THE LOCK. A lock recorded over a failing probe is a "
                "record that the failure is normal. Fix production first.")
        os.makedirs(os.path.dirname(LOCK), exist_ok=True)
        with io.open(LOCK, "w", encoding="utf-8") as fh:
            fh.write(json.dumps(lock, indent=2, sort_keys=True) + "\n")
        print("LOCK SET  %s" % args.stamp)
        print("  production commit %s" % lock["production_commit"][:12])
        print("  files hashed      %d" % len(lock["files"]))
        print("  probes passed     %d of %d" % (len(lock["probes"]), len(lock["probes"])))
        print("  written to        %s" % os.path.relpath(LOCK, ROOT))
        return 0

    if not os.path.isfile(LOCK):
        die("no lock at %s. Run --set first." % LOCK)
    lock = json.loads(io.open(LOCK, encoding="utf-8").read())

    drift = []
    print("DEPLOYMENT LOCK VERIFY  (locked %s)" % lock["locked_on"])
    print("  lock production commit %s" % lock["production_commit"][:12])
    now_main = git("rev-parse", "origin/main")
    if now_main and now_main != lock["production_commit"]:
        drift.append("production moved: %s -> %s"
                     % (lock["production_commit"][:12], now_main[:12]))
        print("  live production commit %s   MOVED" % now_main[:12])
    else:
        print("  live production commit %s   unchanged" % (now_main or "?")[:12])

    print()
    print("  FILES")
    for rel, want in sorted(lock["files"].items()):
        got = sha256(rel)
        if got is None:
            drift.append("%s is missing" % rel)
            print("    MISSING  %s" % rel)
        elif got != want:
            drift.append("%s changed" % rel)
            print("    CHANGED  %s" % rel)
    if not any(d.startswith(tuple(lock["files"])) for d in drift):
        print("    %d files, all unchanged" % len(lock["files"]))

    print()
    print("  LIVE PROBES")
    for p in run_probes():
        if p["pass"]:
            print("    PASS  %s" % p["label"])
        else:
            drift.append("probe failed: %s (http %s)" % (p["label"], p["http"]))
            print("    FAIL  %-46s http %s" % (p["label"], p["http"]))
            print("          %s" % p["why"])

    print()
    if drift:
        print("LOCK BROKEN: %d item(s) drifted" % len(drift))
        for d in drift:
            print("  %s" % d)
        return 1
    print("LOCK HOLDS: production matches the lock and every probe passes.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
