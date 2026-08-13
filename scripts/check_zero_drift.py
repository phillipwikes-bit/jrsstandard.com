#!/usr/bin/env python3
"""Standing drift guard. One command that checks the whole defect class at once.

WHY THIS EXISTS. This repository has hit the same defect five separate times in
one month, and each time it was found by accident rather than by a check:

  1. Panel country and continent counts were hand-transcribed constants.
  2. The endorsement classifier carried a hand-maintained deny list.
  3. api/contributor-stats.js carried a hand-written ROSTER_SIZE = 20, with a
     comment asking a future editor to keep it in step by hand.
  4. link-click telemetry was written by one emit point and read by nothing.
  5. REVIEWER_ROSTER_COMPLETE.md was produced by an ad-hoc script that was never
     saved, so it had to be hand-patched and drifted inside a single turn.

Every one is the same shape: a second copy of a fact that nothing forces to
agree with the first. This checks for that shape directly.

Usage:
  python3 scripts/check_zero_drift.py            # all checks
  python3 scripts/check_zero_drift.py --offline  # skip checks needing production

Exit code: 0 if every check passes, 1 if any fails. Safe to wire into a hook.
"""
import json
import os
import re
import subprocess
import sys
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PANEL = "https://jrsstandard.com/api/panel-stats"
ASSET = "https://jrsstandard.com/api/asset-stats"
CONTRIB = "https://jrsstandard.com/api/contributor-stats"

results = []


def check(name, ok, detail=""):
    results.append((name, bool(ok), detail))
    return bool(ok)


def read(path):
    try:
        with open(os.path.join(ROOT, path), encoding="utf-8") as fh:
            return fh.read()
    except Exception:
        return ""


def live(url):
    try:
        with urllib.request.urlopen(url, timeout=25) as r:
            return json.load(r)
    except Exception:
        return None


def run(cmd):
    return subprocess.run(cmd, cwd=ROOT, capture_output=True, text=True)


# ---------------------------------------------------------------------------
# 1. TELEMETRY PARITY. Every emitted source must be read by an endpoint and
#    rendered by a panel. An emit point with no ingestion point is the
#    zero-discrepancy rule broken.
# ---------------------------------------------------------------------------
def check_telemetry_parity(offline):
    emits = set(re.findall(r"source:\s*'([a-z-]+)'", read("api/telemetry.js")))
    stats = read("api/asset-stats.js")
    page = read("programme-status-9872fb93cc94.html")
    for src in sorted(emits):
        key = src.replace("-", "_")
        ingested = ("'%s'" % src) in stats
        rendered = (key in page) or (src in page)
        check("telemetry '%s' has an ingestion point" % src, ingested,
              "written by api/telemetry.js, read by api/asset-stats.js")
        check("telemetry '%s' has a panel" % src, rendered,
              "rendered on the private status page")
    if not offline:
        d = live(ASSET)
        check("live /api/asset-stats exposes link_clicks",
              d is not None and "link_clicks" in d,
              "" if d else "endpoint unreachable")


# ---------------------------------------------------------------------------
# 2. NO HAND-WRITTEN COUNTS. A literal assignment to a *_SIZE or *_COUNT
#    constant in api/ is the exact shape of defect 3.
# ---------------------------------------------------------------------------
#    The first version of this check only matched names ENDING in SIZE, COUNT or
#    TOTAL. A negative test caught that: ROSTER_SIZE_LEGACY, N_REVIEWERS and
#    COMPLETERS all slipped through. The word now has to appear anywhere in the
#    name, and the count-like vocabulary is wider.
COUNT_WORDS = r"SIZE|COUNT|TOTAL|N_|NUM|REVIEWERS|COMPLETERS|COUNTRIES|CONTINENTS|RATERS|COHORT"

# Numbers that are configuration rather than a duplicated fact. Each needs a
# reason, so the allowlist cannot quietly become a place to hide drift.
COUNT_ALLOW = {
    "MIN_CELL_N": "disclosure threshold, deliberately fixed before data arrived",
    "NEEDED": "study design constant, the 24-record completion bar",
}


def check_no_handwritten_counts(offline):
    offenders = []
    api = os.path.join(ROOT, "api")
    for name in sorted(os.listdir(api)):
        if not name.endswith(".js"):
            continue
        for m in re.finditer(r"const\s+([A-Z][A-Z0-9_]*)\s*=\s*(\d+)\s*;", read("api/" + name)):
            const, val = m.group(1), m.group(2)
            if const in COUNT_ALLOW:
                continue
            if re.search(COUNT_WORDS, const):
                offenders.append("%s: %s = %s" % (name, const, val))
    check("no hand-written count constants in api/", not offenders,
          "; ".join(offenders) if offenders
          else "all derived (%d allowlisted design constants)" % len(COUNT_ALLOW))


# ---------------------------------------------------------------------------
# 3. PANEL GEOGRAPHY. Every completer resolves to a country, and the map covers
#    every completer code in the roster CSV.
# ---------------------------------------------------------------------------
def check_panel_geo(offline):
    mapped = set(re.findall(r"'([A-Z]{1,2}-[A-Za-z0-9-]+)'\s*:\s*'[A-Z]{2}'",
                            read("api/_panel-countries.js")))
    csv_path = None
    research = os.path.join(ROOT, "research")
    names = sorted(n for n in os.listdir(research)
                   if n.startswith("Expert_Roster_All_Studies_") and n.endswith(".csv"))
    if names:
        csv_path = os.path.join(research, names[-1])
    missing = []
    if csv_path:
        import csv as _csv
        with open(csv_path, encoding="utf-8") as fh:
            for row in _csv.DictReader(fh):
                if row["status"] != "COMPLETE":
                    continue
                if row["code"] not in mapped:
                    missing.append(row["code"])
    check("every completer code is in the panel country map", not missing,
          ("missing: " + ", ".join(missing)) if missing else "%d codes mapped" % len(mapped))

    if not offline:
        d = live(PANEL)
        if d is None:
            check("live panel geo fully resolved", False, "endpoint unreachable")
        else:
            unresolved = d.get("geo_unresolved") or []
            check("live panel geo fully resolved", not unresolved,
                  ("unresolved: " + ", ".join(unresolved)) if unresolved
                  else "geo_resolved=%s" % d.get("geo_resolved"))


# ---------------------------------------------------------------------------
# 4. GENERATED DOCUMENTS ARE CURRENT. Re-run each builder and see whether the
#    on-disk file changes. If it does, someone edited the document by hand or
#    the source moved underneath it. This is defect 5, caught automatically.
# ---------------------------------------------------------------------------
GENERATED = [
    ("research/build_reviewer_roster_doc.py", "research/REVIEWER_ROSTER_COMPLETE.md"),
    ("research/build_participant_inventory.py", "research/PARTICIPANT_INVENTORY_BY_RUNG.md"),
]


#    Compares BYTES, not git state. The first version asked git whether the file
#    was dirty and bailed out when it was, which meant the check reported
#    "uncommitted edits present" instead of finding the drift, and would have
#    fired a false failure during any ordinary editing session. Reading the file,
#    regenerating, comparing and restoring needs no git at all and works on a
#    dirty tree.
def check_generated_docs_current(offline):
    for builder, doc in GENERATED:
        path = os.path.join(ROOT, doc)
        try:
            with open(path, "rb") as fh:
                before = fh.read()
        except Exception:
            check("%s exists" % doc, False, "file missing; run %s" % builder)
            continue
        r = run([sys.executable, builder])
        try:
            with open(path, "rb") as fh:
                after = fh.read()
        finally:
            # Always put the original back. The guard must never be the thing
            # that changes the file it is checking.
            with open(path, "wb") as fh:
                fh.write(before)
        if r.returncode != 0:
            tail = (r.stderr.strip() or r.stdout.strip()).splitlines()
            check("%s rebuilds cleanly" % os.path.basename(builder), False,
                  "builder exited %d: %s" % (r.returncode, tail[-1] if tail else "no output"))
        check("%s matches its builder" % doc, before == after,
              "regenerating changed it, so the on-disk copy had drifted"
              if before != after else "byte-identical")


# ---------------------------------------------------------------------------
# 5. CROSS-ENDPOINT AGREEMENT. The headline figures must agree between the
#    roster on disk and production.
# ---------------------------------------------------------------------------
def check_cross_endpoint(offline):
    if offline:
        return
    p, c = live(PANEL), live(CONTRIB)
    if p is None:
        check("live panel figures readable", False, "endpoint unreachable")
        return
    check("countries belong to completers, not all reviewers",
          p.get("countries", 0) <= p.get("completers", 0),
          "countries=%s completers=%s reviewers=%s"
          % (p.get("countries"), p.get("completers"), p.get("reviewers")))
    if c is not None:
        roster = c.get("roster")
        actual = len(re.findall(r"code:'", read("api/_contributor-roster.js")))
        check("live contributor roster size matches the roster module",
              roster == actual, "live=%s module=%s" % (roster, actual))


def main():
    offline = "--offline" in sys.argv
    for fn in (check_telemetry_parity, check_no_handwritten_counts, check_panel_geo,
               check_generated_docs_current, check_cross_endpoint):
        try:
            fn(offline)
        except Exception as e:
            check(fn.__name__, False, "check itself raised: %r" % (e,))

    width = max(len(n) for n, _, _ in results)
    failed = 0
    for name, ok, detail in results:
        if not ok:
            failed += 1
        print("%s  %-*s  %s" % ("PASS" if ok else "FAIL", width, name, detail))
    print("\n%d checks, %d failed" % (len(results), failed))
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
