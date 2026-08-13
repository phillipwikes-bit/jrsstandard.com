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
from concurrent.futures import ThreadPoolExecutor

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PANEL = "https://jrsstandard.com/api/panel-stats"
ASSET = "https://jrsstandard.com/api/asset-stats"
CONTRIB = "https://jrsstandard.com/api/contributor-stats"

results = []
SKIPPED = object()


def check(name, ok, detail=""):
    """ok may be True, False, or SKIPPED. A skip is not a failure.

    An unreachable endpoint is not drift, and reporting it as a failure trains
    a reader to ignore the guard. That happened on the first run: one of two
    calls to the same endpoint blipped and produced a red line beside nine
    green ones for no real reason.
    """
    results.append((name, ok, detail))
    return ok is True


def read(path):
    try:
        with open(os.path.join(ROOT, path), encoding="utf-8") as fh:
            return fh.read()
    except Exception:
        return ""


_live_cache = {}


def live(url, attempts=3):
    """Fetch once per URL per run, retrying a transient failure.

    Cached because several checks read the same endpoint, and without the cache
    one blip could fail one check while another passed on the same data, which
    reads as an inconsistency in the system rather than in the network.
    """
    if url in _live_cache:
        return _live_cache[url]
    got = None
    for _ in range(attempts):
        try:
            with urllib.request.urlopen(url, timeout=25) as r:
                got = json.load(r)
                break
        except Exception:
            continue
    _live_cache[url] = got
    return got


def run(cmd):
    return subprocess.run(cmd, cwd=ROOT, capture_output=True, text=True)


# ---------------------------------------------------------------------------
# 1. TELEMETRY PARITY. Every emitted source must be read by an endpoint and
#    rendered by a panel. An emit point with no ingestion point is the
#    zero-discrepancy rule broken.
# ---------------------------------------------------------------------------
def check_telemetry_parity(offline):
    """Every event source WRITTEN anywhere in api/ must have a reader.

    Widened 2026-08-13 from api/telemetry.js alone to every writer in api/. The
    narrow version passed clean while api/reviewer-cert.js wrote
    'reviewer-cert-render' that no endpoint read, and which was silently landing
    in the public artifact-download total.

    Matches the event field `source: '...'` only. `page_source:` and `src:` are
    different fields carrying different values, and treating them as event
    sources produced a false positive on 'contributor'.
    """
    writers = {}
    api = os.path.join(ROOT, "api")
    for name in sorted(os.listdir(api)):
        if not name.endswith(".js"):
            continue
        body = read("api/" + name)
        for m in re.finditer(r"(?<![a-z_])source:\s*'([a-z0-9-]+)'", body):
            writers.setdefault(m.group(1), set()).add(name)

    readers = {}
    for name in sorted(os.listdir(api)):
        if not name.endswith(".js"):
            continue
        body = read("api/" + name)
        for src in writers:
            # A reader compares against the source; a writer assigns it.
            # A reader compares, indexes, keys, or PASSES the source as an
            # argument. The argument form was missed at first, which produced
            # four false orphans: asset-stats reads them via opened('honor-link',
            # ...) rather than a direct comparison.
            if re.search(r"===\s*'%s'|\['%s'\]|'%s':|\(\s*'%s'\s*," % (src, src, src, src), body):
                readers.setdefault(src, set()).add(name)

    orphans = sorted(s for s in writers if not readers.get(s))
    check("every event source written in api/ has a reader", not orphans,
          ("orphaned: " + ", ".join(orphans)) if orphans
          else "%d sources, all consumed" % len(writers))

    if not offline:
        d = live(ASSET)
        if d is None:
            check("live /api/asset-stats exposes link_clicks", SKIPPED, "endpoint unreachable")
        else:
            check("live /api/asset-stats exposes link_clicks", "link_clicks" in d, "present")


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
# 2b. NO MASKING FALLBACKS. A published metric field that falls back to a
#     numeric literal publishes a hand-typed number dressed as a computed one.
#     api/panel-stats.js did exactly this with `geo.countries || COUNTRIES_FALLBACK`
#     while geo_source still reported "computed". Status codes and slice limits
#     are not facts and are allowed.
# ---------------------------------------------------------------------------
FALLBACK_ALLOW = re.compile(r"\b(status|limit|max_tokens|slice|timeout|runs|n)\b", re.I)


def check_no_masking_fallbacks(offline):
    offenders = []
    api = os.path.join(ROOT, "api")
    for name in sorted(os.listdir(api)):
        if not name.endswith(".js"):
            continue
        for line in read("api/" + name).splitlines():
            stripped = line.strip()
            if stripped.startswith("//"):
                continue
            # A response field assigned `<expr> || <number>`.
            # `|| 0` is a zero default: absence really is zero and no figure is
            # invented. Only a NON-ZERO literal substitutes a fact.
            m = re.search(r"^([a-z_][a-z0-9_]*)\s*:\s*[^,;]*\|\|\s*([1-9]\d*)", stripped)
            if m and not FALLBACK_ALLOW.search(m.group(1)):
                offenders.append("%s: %s falls back to %s" % (name, m.group(1), m.group(2)))
    check("no published metric falls back to a numeric literal", not offenders,
          "; ".join(offenders) if offenders else "none")


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
            check("live panel geo fully resolved", SKIPPED, "endpoint unreachable")
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
def _rebuild_one(builder, doc, offline):
    """Read, rebuild, compare, restore. Returns (doc, builder, ok_rebuild, detail, identical)."""
    path = os.path.join(ROOT, doc)
    try:
        with open(path, "rb") as fh:
            before = fh.read()
    except Exception:
        return (doc, builder, False, "file missing; run %s" % builder, None)
    env = dict(os.environ, JRS_OFFLINE="1") if offline else None
    r = subprocess.run([sys.executable, builder], cwd=ROOT,
                       capture_output=True, text=True, env=env)
    try:
        with open(path, "rb") as fh:
            after = fh.read()
    finally:
        # Always put the original back. The guard must never be the thing that
        # changes the file it is checking.
        with open(path, "wb") as fh:
            fh.write(before)
    tail = (r.stderr.strip() or r.stdout.strip()).splitlines()
    detail = "builder exited %d: %s" % (r.returncode, tail[-1] if tail else "no output")
    return (doc, builder, r.returncode == 0, detail, before == after)


def check_generated_docs_current(offline):
    """Compares BYTES, not git state.

    The first version asked git whether the file was dirty and bailed out when it
    was, which reported "uncommitted edits present" instead of finding the drift
    and would have fired a false failure during any ordinary editing session.

    The builders run in parallel: two Python interpreter starts in series put the
    guard over the one-second budget the pre-commit hook has to meet.
    """
    with ThreadPoolExecutor(max_workers=len(GENERATED)) as pool:
        futures = [pool.submit(_rebuild_one, b, d, offline) for b, d in GENERATED]
        for f in futures:
            doc, builder, built, detail, identical = f.result()
            if identical is None:
                check("%s exists" % doc, False, detail)
                continue
            if not built:
                check("%s rebuilds cleanly" % os.path.basename(builder), False, detail)
            check("%s matches its builder" % doc, identical,
                  "regenerating changed it, so the on-disk copy had drifted"
                  if not identical else "byte-identical")


# ---------------------------------------------------------------------------
# 5. CROSS-ENDPOINT AGREEMENT. The headline figures must agree between the
#    roster on disk and production.
# ---------------------------------------------------------------------------
def check_cross_endpoint(offline):
    if offline:
        return
    p, c = live(PANEL), live(CONTRIB)
    if p is None:
        check("live panel figures readable", SKIPPED, "endpoint unreachable")
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
    for fn in (check_telemetry_parity, check_no_handwritten_counts,
               check_no_masking_fallbacks, check_panel_geo,
               check_generated_docs_current, check_cross_endpoint):
        try:
            fn(offline)
        except Exception as e:
            check(fn.__name__, False, "check itself raised: %r" % (e,))

    width = max(len(n) for n, _, _ in results)
    failed = skipped = 0
    for name, ok, detail in results:
        if ok is SKIPPED:
            label = "SKIP"
            skipped += 1
        elif ok is True:
            label = "PASS"
        else:
            label = "FAIL"
            failed += 1
        print("%s  %-*s  %s" % (label, width, name, detail))
    tail = ", %d skipped (not reachable, not drift)" % skipped if skipped else ""
    print("\n%d checks, %d failed%s" % (len(results), failed, tail))
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
