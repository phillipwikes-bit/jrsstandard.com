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
import glob
import json
import io
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
_R2A_WHY = ("the Rung 2a analysis sample as locked on 2026-08-01, which is what the "
            "published confidence interval, Fisher p and rate ratio were computed on. "
            "A dated snapshot is not a duplicated live fact, and this one is not taken "
            "on trust: check_rung2a_lock compares it against the database on every "
            "online run and fails when they diverge.")

COUNT_ALLOW = {
    "MIN_CELL_N": "disclosure threshold, deliberately fixed before data arrived",
    "NEEDED": "study design constant, the 24-record completion bar",
    "N_SELECT": "study design constant, the blind-recheck sample size used for "
                "stratified quotas in build_blind_recheck_packet.py. Not a copy "
                "of a figure held anywhere else",
    "R2A_LOCKED_STRUCTURED_REVIEWERS": _R2A_WHY,
    "R2A_LOCKED_STRUCTURED_LABELS": _R2A_WHY,
    "R2A_LOCKED_STRUCTURED_GAPS": _R2A_WHY,
    "R2A_LOCKED_UNSTRUCTURED_REVIEWERS": _R2A_WHY,
    "R2A_LOCKED_UNSTRUCTURED_LABELS": _R2A_WHY,
    "R2A_LOCKED_UNSTRUCTURED_GAPS": _R2A_WHY,
    "MIN_READS": "the PRE-REGISTERED exclusion rule, 18 of 24, in "
                 "scripts/analyze_item_and_reviewer_variance.py. It is a design "
                 "constant fixed before data collection, not a copy of a count "
                 "held anywhere else, and deriving it from the data is exactly "
                 "what a pre-registered rule must not do",
    "CORPUS_SIZE": "the study design constant, 24 records. Same reasoning as "
                   "NEEDED above, which is the same number in the builders",
    # THESE ARE SOMEONE ELSE'S PUBLISHED REQUIREMENTS, NOT COUNTS OF ANYTHING
    # HERE. They come from CCI's contributor-guidelines PDF and exist so
    # scripts/apply_cci_publication_pass.py checks the article against the
    # publisher's stated numbers instead of a remembered target, which is the
    # exact defect that pass was written to fix. Deriving them from the
    # repository would be meaningless: the repository is not the authority.
    # Update them only when CCI updates the guidelines.
    "CCI_MIN_WORDS": "CCI's stated length floor, 1,000 words, from their "
                     "contributor-guidelines PDF last updated 05/15/26",
    "CCI_PREFERRED_FLOOR": "CCI's stated preferred floor, 1,200 words, same source",
    "CCI_MAX_COAUTHORS": "CCI's stated maximum of two co-authors per article, "
                         "same source",
}


def check_no_handwritten_counts(offline):
    """Counts are derived from the data, never transcribed into a constant.

    WHAT IT PROTECTS. Every published figure -- reviewers, completers,
    countries, downloads -- must be computed at request time. A constant like
    `const REVIEWER_COUNT = 58;` is correct on the day it is written and wrong
    on the day someone completes, and nothing announces the change. The
    project's figure-drift forensic record is the reason this guard exists.

    WHAT IT CHECKS. Every `const NAME = <digits>;` in api/*.js whose NAME
    matches COUNT_WORDS and is not in COUNT_ALLOW (genuine design constants,
    such as page sizes). It then repeats the sweep over the Python builders in
    research/ and scripts/.

    WHY BOTH LANGUAGES. Recorded inline below and repeated here because it is
    the whole point: on 2026-08-14 a proposed replacement scanned only .py
    files, where no defect was, and none of the .js files, where all six were.
    It passed while sitting on every one of them. The answer was not to swap one
    blind spot for the other.

    DOCSTRING ADDED 2026-09-17 (X-5). Mutation-tested before writing: inserting
    `const REVIEWER_COUNT = 58;` into api/asset-stats.js fails the guard.
    """
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

    # The Python builders can hold a duplicated fact just as easily as the
    # endpoints can. Added 2026-08-14: a proposed replacement guard scanned
    # only .py files and none of the .js where every real defect actually was,
    # so it passed while sitting on all six. The right answer was not to swap
    # one blind spot for the other, it was to cover both.
    py_offenders = []
    for base in ("research", "scripts"):
        d = os.path.join(ROOT, base)
        if not os.path.isdir(d):
            continue
        for name in sorted(os.listdir(d)):
            if not name.endswith(".py") or name.startswith("check_zero_drift"):
                continue
            # UNANCHORED, matching the JS half. Corrected 2026-09-17 by the
            # second-order check after X-5. This required the assignment to be
            # the WHOLE line, so `REVIEWER_COUNT = 58; COMPLETER_COUNT = 36`
            # PASSED -- two hand-written counts on one line, which is exactly
            # what the guard exists to refuse. It errs toward PASSING, the
            # dangerous direction. The asymmetry is also the defect this
            # guard's own docstring records: the JS half already matched
            # `const\s+NAME` anywhere in the line while the Python half
            # insisted on owning the line.
            for m in re.finditer(r"(?:^|[;\s])([A-Z][A-Z0-9_]*)\s*=\s*(\d+)\b",
                                 read(base + "/" + name), re.M):
                const, val = m.group(1), m.group(2)
                if const in COUNT_ALLOW:
                    continue
                if re.search(COUNT_WORDS, const):
                    py_offenders.append("%s/%s: %s = %s" % (base, name, const, val))
    check("no hand-written count constants in research/ or scripts/", not py_offenders,
          "; ".join(py_offenders) if py_offenders else "none")


# ---------------------------------------------------------------------------
# 2b. NO MASKING FALLBACKS. A published metric field that falls back to a
#     numeric literal publishes a hand-typed number dressed as a computed one.
#     api/panel-stats.js did exactly this with `geo.countries || COUNTRIES_FALLBACK`
#     while geo_source still reported "computed". Status codes and slice limits
#     are not facts and are allowed.
# ---------------------------------------------------------------------------
FALLBACK_ALLOW = re.compile(r"\b(status|limit|max_tokens|slice|timeout|runs|n)\b", re.I)


def check_no_masking_fallbacks(offline):
    """No endpoint substitutes an invented figure when the real one is missing.

    WHAT IT PROTECTS. A published metric must come from the data or not be
    published. `reviewers: live || 58` looks defensive and is not: when the
    query fails the endpoint serves 58 as though it were measured, and nobody
    downstream can tell a fallback from a fact. This project has the defect on
    the record -- seven public pages once hard-coded 57 reviewers as a pre-JS
    fallback against a live 58, and the stale figure read as current.

    `|| 0` IS DELIBERATELY ALLOWED. Absence genuinely is zero and no figure is
    invented. Only a NON-ZERO literal substitutes a fact. FALLBACK_ALLOW
    additionally exempts names that are configuration rather than measurement:
    status, limit, max_tokens, slice, timeout, runs, n.

    DOCSTRING ADDED AND THE GUARD REPAIRED 2026-09-17 (X-5). Writing down what
    it protects required testing that it protects it, and it did not. The
    pattern was anchored with `^` against the STRIPPED LINE, so it only fired
    when the field began its own line. A directed mutation adding
    `var _p = { reviewers: live || 58 };` -- the same defect written inline --
    PASSED, while the identical fallback split across lines FAILED. The guard
    was agreeing with a formatting convention rather than with the code. The
    anchor is replaced by a structural boundary so the field is recognised
    wherever it sits in the line.
    """
    offenders = []
    api = os.path.join(ROOT, "api")
    for name in sorted(os.listdir(api)):
        if not name.endswith(".js"):
            continue
        for line in read("api/" + name).splitlines():
            stripped = line.strip()
            if stripped.startswith("//"):
                continue
            # Strip a trailing line comment so prose about a fallback is not
            # read as one.
            code_part = re.split(r"//", stripped)[0]
            # A response field assigned `<expr> || <number>`, ANYWHERE in the
            # line. The boundary keeps `name:` an object property rather than a
            # fragment of a longer token.
            for m in re.finditer(
                    r"(?:^|[{,(\s])([a-z_][a-z0-9_]*)\s*:\s*[^,;{}]*?\|\|\s*([1-9]\d*)",
                    code_part):
                if FALLBACK_ALLOW.search(m.group(1)):
                    continue
                offenders.append("%s: %s falls back to %s" % (name, m.group(1), m.group(2)))
    check("no published metric falls back to a numeric literal", not offenders,
          "; ".join(offenders) if offenders
          else "no api/ endpoint substitutes a non-zero literal for a measured "
               "figure; `|| 0` and %d configuration names remain allowed"
               % len(FALLBACK_ALLOW.pattern.split("|")))


# ---------------------------------------------------------------------------
# 3. PANEL GEOGRAPHY. Every completer resolves to a country, and the map covers
#    every completer code in the roster CSV.
# ---------------------------------------------------------------------------
def _has_research():
    """research/ is deliberately excluded from the deploy, so it does not exist
    on the production branch. Its absence there is the design working, not drift.

    Without this, the pre-commit hook blocked a deploy commit on a temp branch
    cut from origin/main with three "file missing" failures and a
    FileNotFoundError, none of which was a real defect. A guard that fires on
    correct state is a guard that gets bypassed.

    A BARE os.path.isdir IS NOT ENOUGH, and it blocked a deploy on 2026-08-18.
    research/__pycache__/ is gitignored, so checking out the deploy branch
    removes every tracked file under research/ and leaves the directory standing
    with nothing in it but bytecode. isdir then returned True on a branch that
    has no research tree, the generated-doc checks looked for three .md files
    that are not on main by design, and all three failed as "file missing".

    Nothing was wrong with the repository. The predicate was wrong. It now asks
    whether any real research file is present, ignoring caches, so a directory
    containing only compiled artifacts reads as absent, which is what it is.
    """
    d = os.path.join(ROOT, "research")
    if not os.path.isdir(d):
        return False
    for name in os.listdir(d):
        if name in ("__pycache__", ".DS_Store") or name.endswith(".pyc"):
            continue
        return True
    return False


def check_panel_geo(offline):
    """Every completer resolves to a country, so the country count cannot undercount.

    WHAT IT PROTECTS. The published country figure is computed from
    api/_panel-countries.js. A reviewer who completes but is missing from that
    map is counted as a completer and contributes no country, so the figure
    silently undercounts and no error appears anywhere. The country figure is
    already governed by a standing scope rule on this project -- 16 countries
    belongs to the full-set completers and 11 to the detection panel alone, and
    attaching either to the reviewer total is a recorded past defect -- so an
    undercount here lands directly on a figure buyers and reviewers read.

    WHAT IT CHECKS. Every row in the newest Expert_Roster_All_Studies_*.csv with
    status COMPLETE has its code present in the country map.

    WHY IT SKIPS RATHER THAN FAILS ON THE DEPLOY BRANCH. research/ is
    deliberately excluded from deployment, so the roster CSV is absent there.
    Its absence is the design working, not drift, and the check records SKIPPED
    rather than inventing a pass. The live half still runs when online.

    DOCSTRING ADDED 2026-09-17 (X-5). Mutation-tested before writing: removing
    a single mapped code fails the guard and names it.
    """
    mapped = set(re.findall(r"'([A-Z]{1,2}-[A-Za-z0-9-]+)'\s*:\s*'[A-Z]{2}'",
                            read("api/_panel-countries.js")))
    if not _has_research():
        check("every completer code is in the panel country map", SKIPPED,
              "research/ is not on this branch by design, so the roster CSV is absent")
        if not offline:
            _panel_geo_live()
        return
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
        _panel_geo_live()


def _panel_geo_live():
    d = live(PANEL)
    if d is None:
        check("live panel geo fully resolved", SKIPPED, "endpoint unreachable")
        return
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
    ("research/build_contributor_links.py", "research/Contributor_Links.md"),
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


def check_public_engine_endpoints_carry_no_record_text(offline):
    """The RAW record is never passed to logReview, and derived content still is.

    WHAT THIS GUARD ACTUALLY PROVES, restated 2026-09-16 after finding F-7.

    The predicate has always been narrow and useful: the record text is not a
    parameter of logReview, and no raw-record field name appears in the payload.
    That is what stops input_preview returning under its old spelling after it
    was removed on 2026-08-14.

    ITS PASS MESSAGE WAS FALSE. It read "no record text reaches logReview". An
    adversarial pass established that record-DERIVED text certainly does:
    api/review-engine.js:48 instructs the model to write a per-condition note
    "grounded in the record text", and finding.compliant_version is a model
    rewrite of the customer's passage, up to 600 characters. Both are written to
    engine_reviews and one is rendered on a public page.

    A guard whose PASS string states a false proposition is worse than no guard,
    because eighteen public sentences were leaning on this one.

    THE ASSERTION NOW MATCHES THE PREDICATE, AND RUNS IN BOTH DIRECTIONS:
      1. the raw record is not a parameter and no raw-record field name is in
         the payload  (unchanged, and still the point);
      2. the derived fields ARE present, so the public disclosure that says they
         are retained cannot quietly become false either. If someone removes
         them, the disclosure needs rewriting and this guard says so.
    """
    engines = ("api/review-engine.js", "api/v1/review-engine.js")
    problems = []
    for path in ("api/review.js",) + engines:
        src = read(path)
        if not src:
            problems.append("%s is missing" % path)
            continue
        if "runtime: 'edge'" not in src:
            problems.append("%s no longer declares the edge runtime" % path)
    for path in engines:
        src = read(path)
        if not src:
            continue
        body = src.split("async function logReview", 1)
        if len(body) != 2:
            problems.append("%s: logReview not found" % path)
            continue
        sig = body[1].split(")", 1)[0]
        if "text" in sig:
            problems.append("%s: record text is a parameter of logReview again"
                            % path)
        payload = body[1].split("JSON.stringify(", 1)
        if len(payload) != 2:
            problems.append("%s: logReview payload not found" % path)
            continue
        sent = payload[1].split("}),", 1)[0]
        live = "\n".join(ln for ln in sent.splitlines()
                          if not ln.strip().startswith("//"))
        for banned in ("input_preview", "record_text", "preview", "input:",
                       "text:", "body:", "content:"):
            if banned in live:
                problems.append("%s: logReview payload carries %r"
                                % (path, banned))
    # Direction 2: the derived fields must still be there, because the public
    # pages now disclose that they are retained.
    for path in engines:
        src = read(path)
        if not src:
            continue
        if "compliant_version" not in src:
            problems.append("%s: compliant_version is gone, so the public "
                            "statement that a suggested rewrite is retained is "
                            "no longer true and needs revisiting" % path)
        if not re.search(r"grounded in the record text", src):
            problems.append("%s: the prompt no longer grounds the per-condition "
                            "note in the record text; the disclosure describing "
                            "the note as record-derived needs revisiting" % path)

    check("raw record never reaches logReview; derived content still does",
          not problems,
          "; ".join(problems) if problems
          else "3 endpoints on edge runtime; raw record is not a logReview "
               "parameter and no raw-record field name is in the payload; "
               "record-DERIVED note and compliant_version are present and "
               "disclosed")


def check_owner_only_endpoints_are_not_swept_up_by_the_pii_rule(offline):
    """Same ratification: the owner-only surfaces are EXEMPT and must survive.

    A literal reading of "never persist or log PII" would delete the owner's
    only lead pipeline and the contributor roster. That reading was raised on
    2026-09-02 and rejected. This guard exists so a future pass that re-reads
    the rule literally fails loudly instead of quietly removing them.
    """
    required = ("api/leads-4b7e2c9af106d385.js",
                "api/people-9dd1ecdf6f8cdfd4.js",
                "api/_contributor-roster.js",
                "programme-status-9872fb93cc94.html")
    missing = [p for p in required
               if not os.path.exists(os.path.join(ROOT, p))]
    check("owner-only surfaces exempt from the PII rule are intact",
          not missing,
          "deleted: " + "; ".join(missing) if missing
          else "%d owner-only surface(s) present, exempt by ratification"
               % len(required))


def check_no_new_subscription_funnel(offline):
    """Same ratification: the SaaS constraint is forward-looking only.

    The existing transaction endpoints stay as built. What is barred is a NEW
    recurring-subscription funnel, so this guard allowlists the three that
    exist and fails on any api/ file that introduces recurring billing.
    """
    allowed = {"checkout.js", "checkout-stats.js", "enterprise-inquiry.js"}
    markers = ("subscription", "recurring", "billing_cycle", "price_monthly",
               "mode: 'subscription'", "interval:")
    offenders = []
    api_dir = os.path.join(ROOT, "api")
    for base, _dirs, files in os.walk(api_dir):
        for fn in files:
            if not fn.endswith(".js") or fn in allowed:
                continue
            full = os.path.join(base, fn)
            rel = os.path.relpath(full, ROOT)
            try:
                with open(full, encoding="utf-8") as fh:
                    src = fh.read()
            except Exception:
                continue
            hits = [m for m in markers if m in src.lower()]
            if hits:
                offenders.append("%s (%s)" % (rel, ", ".join(hits)))
    check("no new recurring-subscription funnel in api/", not offenders,
          "; ".join(offenders) if offenders
          else "%d existing transaction endpoint(s) allowlisted, no new "
               "recurring billing" % len(allowed))


# Reliability figures that a public page may NOT carry, mapped to the line of the
# submission manuscript that supersedes each one. Added 2026-09-02 after the
# research-summary build found four public surfaces still printing the 4 August
# numbers, three months after the 18 August manuscript replaced them.
#
# research/AUDIT_1_2026-08-29.md line 199 had already caught the label total as
# P0-1, "fix before submission". It was fixed in the manuscript and never
# followed through to the site, which is precisely the direction of drift this
# file exists to catch: the paper moves, the pages do not.
SUPERSEDED_RELIABILITY = {
    "0.624": "trained-reviewer AC1 is 0.623 on the analysed set "
             "(Detection_Article_Submission_Final_2026-08-18.md, line 224)",
    "99 retained labels": "the ten analysed records carry 113 submitted "
             "determinations reduced to 104 (same manuscript, line 281)",
    "99 labels": "superseded label total; the analysed set is 104 after "
             "de-duplication (same manuscript, line 281)",
    "substantial band under Landis": "section 6.5 drops the verbal band: the "
             "boundaries are arbitrary by their authors' own account and the "
             "adjective implies an adequacy the failed lower bound contradicts",
}


def check_reliability_figures_are_current(offline):
    """No public page may print a reliability figure the manuscript has replaced.

    A superseded coefficient is worse than a missing one. It is checkable in
    seconds by the one reader who matters, and finding the site and the paper
    disagreeing on the same number costs more than the number was ever worth.
    """
    hits = []
    for rel in _html_files():
        try:
            body = read(rel)
        except Exception:
            continue
        for frag, why in SUPERSEDED_RELIABILITY.items():
            if frag not in body:
                continue
            # A page may state that a characterisation WAS dropped. That is the
            # correction itself, not the defect, so an explicit retraction in the
            # same sentence is allowed and nothing else is.
            i = body.find(frag)
            window = body[max(0, i - 260):i + 260]
            if "has been dropped" in window or "drops that characterisation" in window:
                continue
            hits.append("%s: %r (%s)" % (rel, frag, why))
    check("reliability figures on public pages are the current ones", not hits,
          "; ".join(hits[:4]) if hits
          else "%d pages scanned against %d superseded figure(s)"
               % (len(_html_files()), len(SUPERSEDED_RELIABILITY)))


def check_research_summary_leads_with_its_boundaries(offline):
    """The limitations must sit ABOVE the headline figure, not below it.

    research-summary.html exists to put 83.9% in front of a risk officer, and the
    only thing that makes that defensible is the order: a reader who meets the
    figure first and the limitations later has already formed the belief the
    limitations were written to constrain. Reordering the page is a one-line
    edit that changes what it claims without changing a word of its copy, so the
    order is asserted here rather than left to whoever edits it next.

    Four facts are required to survive any future edit: the boundary block
    precedes the headline figure, the failed pre-registered criterion is named
    on the page, the reviewer dispersion is stated, and the exploratory label
    stays attached to the crossed mixed-effects model.
    """
    rel = "research-summary.html"
    if not os.path.exists(os.path.join(ROOT, rel)):
        skip("research summary leads with its boundaries", "%s not present" % rel)
        return
    body = read(rel)
    problems = []

    marks = {
        "boundary block": 'class="bound-box"',
        "headline figure": 'class="headline"',
    }
    at = {}
    for label, needle in marks.items():
        i = body.find(needle)
        if i < 0:
            problems.append("%s is gone (%s)" % (label, needle))
        at[label] = i
    if not problems and at["boundary block"] > at["headline figure"]:
        problems.append("the headline figure precedes the boundary block, which "
                        "inverts the whole point of the page")

    # The failed criterion, the dispersion, and the exploratory label. Each is a
    # concession, and a concession is the first thing an optimising edit drops.
    for needle, why in (
        ("Not met", "the failed pre-registered reliability criterion"),
        ("0.402", "the expert lower bound that missed the 0.41 floor"),
        ("37.5 to 100", "the reviewer dispersion"),
        ("Exploratory", "the exploratory label on the crossed mixed-effects model"),
        ("bimodal", "the bimodal-corpus limitation"),
        ("not psychometrically validated", "the open psychometric structure"),
    ):
        if needle not in body:
            problems.append("%s is no longer stated (%r)" % (why, needle))

    check("research summary leads with its boundaries", not problems,
          "boundaries at %d, headline at %d, all six concessions stated"
          % (at.get("boundary block", -1), at.get("headline figure", -1))
          if not problems else "%d problem(s): %s"
          % (len(problems), "; ".join(problems[:4])))


def check_public_downloads_are_not_blocked_by_a_redirect(offline):
    """Every file a public page offers for download must actually be servable.

    A blanket "/:path*.docx" redirect to /404.html sat in vercel.json and sent
    BOTH public .docx downloads to the 404 page: the homepage's Twenty-Record
    Evaluation Study and pilot.html's Full Case Review. Live checks on
    2026-09-02 confirmed both resolved to /404.html while the files were
    present on main. The rule protected nothing that "/research/:path*" and
    "/scripts/:path*" do not already cover, since the only .docx outside those
    directories were the two the site links on purpose.

    THE RULE WAS NOT REMOVED. Twelve private .docx sit at the repository root
    on the development branch, including TRADEMARK_FILING_DOSSIER_JRS_DRR.docx
    and MASTER_SYSTEM_AUDIT_AND_TRADEMARK_DOSSIER.docx. None is on main, so
    deleting the rule would not expose them today, but the rule is the second
    layer that makes a mistaken full-branch deploy harmless, and trading it
    away to fix two buttons is the owner's call, not a maintenance decision.

    So this guard FAILS on purpose while both buttons are broken. It is a
    live defect with an open decision behind it, not a passing state.
    """
    import glob
    cfg = read("vercel.json")
    if not cfg:
        check("public downloads are not blocked by a redirect", False,
              "vercel.json unreadable")
        return
    try:
        rules = json.loads(cfg).get("redirects", [])
    except Exception as e:
        check("public downloads are not blocked by a redirect", False,
              "vercel.json does not parse: %r" % (e,))
        return
    blockers = [r.get("source", "") for r in rules
                if r.get("destination") == "/404.html"]
    offered, problems = set(), []
    for page in glob.glob(os.path.join(ROOT, "*.html")):
        try:
            with open(page, encoding="utf-8") as fh:
                html = fh.read()
        except Exception:
            continue
        for m in re.finditer(r'href="([^":]+\.(?:docx|pdf|xlsx|csv))"', html):
            offered.add((os.path.basename(page), m.group(1)))
    for page, href in sorted(offered):
        target = href.split("?")[0].split("#")[0].lstrip("/")
        if not os.path.exists(os.path.join(ROOT, target)):
            problems.append("%s offers %s, which is not in the repo"
                            % (page, target))
            continue
        ext = "." + target.rsplit(".", 1)[-1]
        for src in blockers:
            if src == "/:path*" + ext:
                problems.append("%s offers %s but vercel.json sends every %s "
                                "to 404.html" % (page, target, ext))
            elif src.lstrip("/") == target:
                problems.append("%s offers %s but vercel.json redirects that "
                                "exact path to 404.html" % (page, target))
    check("public downloads are not blocked by a redirect", not problems,
          "; ".join(problems) if problems
          else "%d download link(s) across public pages, all present and "
               "servable" % len(offered))


def check_generated_docs_current(offline):
    """Compares BYTES, not git state.

    The first version asked git whether the file was dirty and bailed out when it
    was, which reported "uncommitted edits present" instead of finding the drift
    and would have fired a false failure during any ordinary editing session.

    The builders run in parallel: two Python interpreter starts in series put the
    guard over the one-second budget the pre-commit hook has to meet.
    """
    if not _has_research():
        for _, doc in GENERATED:
            check("%s matches its builder" % doc, SKIPPED,
                  "research/ is not on this branch by design")
        return
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
    """Live endpoints agree with each other and with the modules behind them.

    WHAT IT PROTECTS, and this is a LIVE-ONLY check: it returns immediately when
    offline, which is one of the three reasons the offline and online guard
    totals differ. A figure can be right in the repository and wrong in the
    response, and only a live read can tell the difference.

    TWO INVARIANTS.
      1. countries <= completers. The country figure belongs to the reviewers
         who completed the full set, NOT to every reviewer on the panel.
         Attaching it to the reviewer total is a recorded past defect on this
         project, and this inequality is the shape that defect would take.
      2. The live contributor roster size equals the number of entries in
         api/_contributor-roster.js. A response that disagrees with its own
         source module means one of them is stale.

    DOCSTRING ADDED 2026-09-17 (X-5). It could not be mutation-tested the way
    the other three were: mutating the module without a matching live change
    proves only that the live endpoint still serves the old build, which is
    already known and is B-001's queue. It is recorded as verified by INSPECTION
    rather than by mutation, and that distinction is the point.
    """
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


# ---------------------------------------------------------------------------
# HTML CHECKS. Added 2026-08-14 after the forensic audit in
# research/FIGURE_DRIFT_ROOT_CAUSE.md.
#
# Until today this guard read api/, research/ and scripts/ and never opened a
# single .html file, so all 69 pages, carrying every figure the public and a
# buyer actually see, were outside it. That is why the top-versus-bottom
# mismatch survived roughly twenty localized fixes: nothing could fail when it
# came back.
# ---------------------------------------------------------------------------

# The words that mark a sentence as making a claim about the reviewer panel.
PANEL_VOCAB = r"(?:reviewers?|completers?|independent experts?|countries|continents)"

# A numeral in front of that vocabulary, which is the shape of a published panel
# figure: "16 independent experts", "11 countries", "36 completers".
#
# THE GAP RULE IS WHAT MAKES THIS USABLE. Only spaces and lowercase words may sit
# between the numeral and the vocabulary word. A first pass without it produced
# 26 hits of which 22 were headings and list indices, and a check that cries wolf
# 22 times out of 26 gets switched off within a week. Rejected by the gap rule:
#
#   "4: Reviewer"                punctuation in the gap
#   "24 constructed records; reviewer"   punctuation in the gap
#   "5 Could an independent reviewer"    a capital in the gap
#   "6 of 6: no human reviewer"          punctuation in the gap
#
# Zero-padded numerals are rejected outright: "01 HR Reviewer", "05 Audit
# Reviewer", "008 Professional Reviewer". A count is never written "01".
#
# Spelled-out numbers count. The sentence this whole exercise started from was
# "Sixteen reviewers across 11 countries", and a digits-only pattern walks past
# the first half of it.
# Eleven upward only. One through ten in prose are almost always guidance
# ("Two reviewers sign off", "one reviewer per record"), never a published panel
# total, and including them produced 11 false positives against 0 real ones.
# Every real spelled-out figure on this site is eleven or larger.
PANEL_WORDS = (r"eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|"
               r"eighteen|nineteen|twenty|thirty|forty|fifty|sixty")
#
# CASE MATTERS AND THE PATTERN IS DELIBERATELY NOT re.I. A published claim is
# lowercase ("16 independent experts", "11 countries"); a heading or list item
# capitalises ("4: Reviewer", "05 Audit Reviewer", "5 Evidentiary Sufficiency
# Could a reviewer"). Adding re.I for the spelled-out words silently made [a-z]
# match capitals too and brought 12 headings back as failures. Only the number
# words are case-insensitive, inline.
PANEL_CLAIM = re.compile(
    r"(?<![\w.,%\-])([1-9]\d{0,2}|(?i:" + PANEL_WORDS + r")(?:[- ](?i:one|two|three|four|five|six|seven|eight|nine))?)"
    r"(?![\w.,%\-])((?: +[a-z]+)*) +" + PANEL_VOCAB + r"\b")

# Numbers that sit next to the vocabulary but are NOT panel figures. Each entry
# is a literal fragment plus the reason it is exempt. A bare number is never
# allowlisted; the surrounding words have to make the exemption checkable.
PANEL_ALLOWLIST = [
    ("2 or more reviewers", "an escalation rule, not a count of anyone"),
    ("Eleven failure patterns with reviewer",
     "a count of documented failure patterns; 'reviewer' here modifies 'prompts', "
     "it is not a count of people"),
]
# REMOVED 2026-08-15, and worth recording why each one went:
#
#   "21 reviewers using the five conditions" and "16 labels from 3 reviewers"
#   are now bound to rung2a_* keys on api/panel-stats.
#
#   "62 trained reviewers" was never a figure at all. Every occurrence is the
#   decimal half of Gwet's AC1 0.62 or 0.624, a reliability coefficient. No
#   count of 62 people exists anywhere in this programme, and the entry was
#   already dead: removing it changed nothing, because the tightened gap rule
#   never reached it. Adding an endpoint key for it would have published a
#   number that does not exist.


def _html_files():
    """Every HTML page in the repository, not just the root, and not just .html.

    The first version used os.listdir(ROOT) and scanned 50 of 70 pages. The 20 it
    skipped are reviewer/ and the whole reference/ hub, which are exactly the
    pages nobody looks at and where a frozen figure would sit longest.

    .htm ADDED 2026-09-16, finding F-11. vp-7c1f9a4e8d2b6035.htm existed for
    three weeks and NO HTML GUARD IN THIS SUITE HAD EVER EXAMINED IT: not the
    secrets scan, not the processor disclosure, not the data-handling claims,
    not the noindex checks. The file is benign, but it sits at a CONFIDENTIAL
    BUYER slug, which is the worst place in the estate to have a blind spot.

    An extension is not a security boundary. Vercel serves .htm exactly as it
    serves .html, so a guard that reads one and not the other is a guard with a
    documented hole in it.
    """
    out = []
    for base, dirs, files in os.walk(ROOT):
        dirs[:] = [d for d in dirs if d not in (".git", "node_modules", "research")]
        for f in files:
            if f.endswith((".html", ".htm")):
                out.append(os.path.relpath(os.path.join(base, f), ROOT))
    return sorted(out)


def _panel_keys():
    """The keys api/panel-stats.js actually returns, read from the source."""
    src = read("api/panel-stats.js")
    body = src[src.find("return json({"):] if "return json({" in src else src
    return set(re.findall(r"^\s{4}([a-z_]+):", body, re.M))


def check_html_figures_bound(offline):
    """Every panel figure in a page must be inside a [data-panel] span.

    A numeral next to panel vocabulary that is not bound is a frozen copy of a
    fact, and frozen copies are the entire defect. Allowlisted fragments carry a
    written reason so an exemption can be argued with.
    """
    keys = _panel_keys()
    unbound, badkey, orphan_scope = [], [], []
    scope_labels = set(re.findall(r"^\s{6}([a-z_]+): '", read("api/panel-stats.js"), re.M))

    for name in _html_files():
        src = read(name)
        # Bindings must resolve to a key the endpoint really returns.
        for k in set(re.findall(r'data-panel="([a-z_]+)"', src)):
            if k not in keys:
                badkey.append("%s: data-panel=\"%s\" is not returned by api/panel-stats.js" % (name, k))
        for k in set(re.findall(r'data-panel-scope="([a-z_]+)"', src)):
            if k not in scope_labels:
                orphan_scope.append("%s: data-panel-scope=\"%s\" has no entry in scope_labels" % (name, k))

        # A page carrying a binding must carry the binder, or the binding is
        # decoration and the number never moves.
        if "data-panel=" in src and "JRS PANEL BINDER v2 ::" not in src:
            unbound.append("%s: has data-panel spans but no binder block" % name)

        # Strip script, style and comments: a figure inside them is not published.
        body = re.sub(r"<script.*?</script>|<style.*?</style>|<!--.*?-->", " ", src, flags=re.S)
        # Entities before tags: "&#39;s AC1, experts and trained reviewers"
        # matched on the 39 inside &#39; and reported an apostrophe as a figure.
        body = re.sub(r"&#\d+;|&[a-z]+;", " ", body)

        # REMOVE BOUND ELEMENTS ENTIRELY, rather than skipping whole lines that
        # happen to contain one. The first version of this check was
        # line-granular and an adversarial test walked straight through it: one
        # bound span gave cover to every frozen figure sharing its line. That is
        # not hypothetical, it is what acquisition-9f3c2a7d4b.html line 116
        # actually looked like, half bound and half frozen in one sentence.
        #
        # A marker, not a space. Replacing a bound span with whitespace let a
        # match run straight THROUGH it: "384 graded reads by <bound>16</bound>
        # independent experts" collapsed to "384 graded reads by  independent
        # experts" and reported 384 as an unbound expert count. The marker
        # contains a character the gap rule cannot cross, so a claim can never be
        # stitched together across a figure that is already bound.
        body = re.sub(r"<(\w+)[^>]*\sdata-(?:panel|bound)[^>]*>.*?</\1>", " ~BOUND~ ", body, flags=re.S)
        # Ids that this page's own script assigns, so a figure bound to a
        # different endpoint can be recognised as bound rather than frozen.
        scripts = " ".join(re.findall(r"<script.*?</script>", src, flags=re.S))
        assigned = set(re.findall(r"getElementById\('([\w-]+)'\)", scripts))

        # data-bound marks a figure fed live by a DIFFERENT endpoint. The
        # attribute alone is not enough: the element's id must actually be
        # written by a script on this page, or the marker is a claim with
        # nothing behind it. Checked against the original source, since the
        # elements themselves have just been removed from `body`.
        for el in re.finditer(r"<\w+[^>]*\sdata-bound=[^>]*>", src):
            ids = re.findall(r'id="([\w-]+)"', el.group(0))
            unfed = sorted(i for i in ids if i not in assigned)
            if unfed or not ids:
                unbound.append("%s: data-bound on %s that no script on this page "
                               "assigns" % (name, ("id(s) " + ", ".join(unfed)) if unfed
                                            else "an element with no id"))

        for line in body.split("\n"):
            text = re.sub(r"<[^>]+>", " ", line)
            for m in PANEL_CLAIM.finditer(text):
                frag = m.group(0).strip()
                window = text[max(0, m.start() - 40):m.end() + 40]
                if any(a in window or a in frag for a, _ in PANEL_ALLOWLIST):
                    continue
                unbound.append("%s: unbound panel figure %r" % (name, frag[:60]))

    problems = badkey + orphan_scope + unbound
    check("every published panel figure is bound to api/panel-stats",
          not problems,
          "%d HTML files scanned, all figures bound" % len(_html_files())
          if not problems else "%d problem(s): %s" % (len(problems), "; ".join(problems[:6])))


# Pages that ask a cold visitor for trust, mapped to the reason each one needs
# the proof sentence. A page is on this list because a stranger arrives on it
# and is asked to act: to check a record, to open an integration conversation,
# to request a token, or to put a name and a work email into a form.
#
# check.html is DELIBERATELY ABSENT and must stay absent. It publishes
# completers_detection and countries_detection, the DETECTION PANEL figures.
# Adding completers_all and countries_all beside them puts two populations in
# one viewport, which is the top-versus-bottom mismatch the scoped keys exist
# to prevent. Excluding it is the finding, not an omission.
TRUST_PAGES = {
    "index.html":          "the homepage: first contact, and it asks for a click into both tracks",
    "enterprise.html":     "asks a platform buyer to open an integration scoping call",
    "review-engine.html":  "asks a technical buyer to request a token",
    "training.html":       "asks for a full name and a work email in the enrolment overlay",
    "access.html":         "the campaign screen a cold reader lands on from a DM",
    "org-pilot.html":      "asks an organisation to commit people to a pilot",
    "investigator-guides.html": "the free guides, entry point for the practitioner track",
    "reviewer/index.html": "asks a reviewer to grade 24 records unpaid",
}

# The three figures the sentence stands on, and the scope each one is allowed
# to claim. A figure attached to the wrong population is the recorded defect
# this file already guards in check_panel_geo: 16 countries belongs to the 36
# who COMPLETED, never to the 58 who graded at least one record.
PROOF_BINDINGS = ("reviewers_all", "completers_all", "countries_all")


# Figures the public-records manuscript cites from the COMPANION employment
# study, mapped to the line of that study which establishes each one. The paper
# carried the 22-case screened figures in two places, and the companion
# manuscript states plainly that the 22-case result "is reported only as a
# sensitivity analysis" because two matters fail its inclusion criteria. One of
# those two is a public-records advisory opinion, so the public-records paper
# was leaning on a public-records case to make its cross-domain point.
SUPERSEDED_CROSSDOMAIN = {
    "p = 0.0073":      "22-case sensitivity analysis, not the primary result",
    "odds ratio 19.25": "22-case sensitivity analysis",
    "7 of 9":          "22-case cell count, corrected to 6 of 8",
    "2 of 13":         "22-case cell count, corrected to 2 of 12",
    "p = 0.041":       "22-case sustained coding, corrected to p = 0.0291",
    "odds ratio 21.0": "22-case sustained coding",
    "22 cases from 22": "22 were screened; 20 met the inclusion criteria",
}


def check_markdown_pdfs_are_converted(offline):
    """A .md source must be converted before it becomes a PDF, never wrapped.

    render_report_pdf.py dropped its source straight into <body>, so a manuscript
    in Markdown rendered with literal '#', '**' and '---' markers and every
    heading, table and paragraph collapsed into running text. It was delivered
    that way once. Two invariants: the renderer must route .md through
    md_to_html.py, and md_to_html.py must exist and report unconverted markers
    rather than emitting them silently.
    """
    r = read("scripts/render_report_pdf.py")
    problems = []
    if ".md" not in r or "md_to_html" not in r:
        problems.append("render_report_pdf.py does not route a .md source through "
                        "md_to_html.py, so markdown would be wrapped rather than "
                        "converted")
    conv = read("scripts/md_to_html.py")
    if conv is None:
        problems.append("scripts/md_to_html.py is missing")
    else:
        if "unconverted markers" not in conv:
            problems.append("md_to_html.py does not report unconverted markers")
        for feature in ("<h%d>", "<table>", "<blockquote>", "<ol", "<ul>"):
            if feature not in conv:
                problems.append("md_to_html.py emits no %s" % feature)
    check("a markdown manuscript is converted before it is rendered",
          not problems,
          "render_report_pdf.py routes .md through md_to_html.py"
          if not problems else "; ".join(problems[:3]))


def check_second_read_reported_honestly(offline):
    """The manuscript's agreement figures must match the computed result, and the
    limitation must narrow rather than vanish.

    Three ways this could go wrong and all three are asserted against:

      1. A figure in the prose drifts from research/Blind_Recheck_RESULT_*.json.
      2. Only the most favourable of the three coefficients is reported. The
         unweighted kappa is the lowest and is the one a referee will look for.
      3. The single-reviewer limitation is deleted rather than narrowed. Ten of
         thirty-two is not thirty-two, and one reader is not a panel.
    """
    import json as _json
    paper = read("research/FOIL_Article_Draft.md")
    path = os.path.join(ROOT, "research", "Blind_Recheck_RESULT_2026-08-28.json")
    problems = []
    if not os.path.exists(path):
        problems.append("Blind_Recheck_RESULT_2026-08-28.json is missing, so no "
                        "figure in the manuscript can be sourced")
    else:
        with open(path, encoding="utf-8") as _fh:
            r = _json.load(_fh)[0]
        for label, val in (("percent agreement", "%.1f percent" % r["percent_agreement"]),
                           ("unweighted kappa", "%.3f" % r["kappa_unweighted"]),
                           ("weighted kappa", "%.3f" % r["kappa_linear_weighted"]),
                           ("Gwet AC1", "%.3f" % r["gwet_ac1"]),
                           ("exact agreement", "%d of %d" % (r["agreed"], r["n"]))):
            if val not in paper:
                problems.append("manuscript does not carry the computed %s (%s)"
                                % (label, val))
        # The lowest coefficient must be present: reporting only the highest is
        # choosing a statistic after seeing the data.
        lowest = min(r["kappa_unweighted"], r["kappa_linear_weighted"], r["gwet_ac1"])
        if ("%.3f" % lowest) not in paper:
            problems.append("the lowest of the three coefficients (%.3f) is not "
                            "reported" % lowest)
    # The limitation narrows; it does not disappear.
    for phrase in ("not all 32", "is not a panel"):
        if phrase not in paper:
            problems.append("Limitations no longer states %r, so a subset re-read "
                            "is being presented as if it settled the corpus" % phrase)
    check("second read reported honestly in the manuscript",
          not problems,
          "all computed figures present, lowest coefficient reported, limitation narrowed"
          if not problems else "%d problem(s): %s" % (len(problems), "; ".join(problems[:3])))


def check_coding_frames_match_the_manuscript(offline):
    """The packaged coding frames must produce the manuscript's own tables.

    A reviewer opening the supplementary data and recomputing the tables is the
    single most likely way a discrepancy gets found, and it happened: the
    structural coding frame put 6 cases in group A where the manuscript reports
    7, because one advisory opinion's stored citation is missing its leading F
    and a classifier keyed on "FOIL AO" silently dropped it. The manuscript was
    right and the frame was wrong. This asserts they agree.
    """
    import csv as _csv
    pkg = os.path.join(ROOT, "research", "JCI_SUBMISSION_2026-08-28", "02_DATA")
    if not os.path.isdir(pkg):
        skip("packaged coding frames match the manuscript", "package not built")
        return
    paper = re.sub(r"\s+", " ", read("research/FOIL_Article_Draft.md"))
    problems = []

    def rows_of(name):
        with open(os.path.join(pkg, name), encoding="utf-8", newline="") as fh:
            return list(_csv.DictReader(fh))

    struct = rows_of("JCI_JRS_Structural_Coding_Frame.csv")
    a = [r for r in struct if r["Structural group"].startswith("A")]
    b = [r for r in struct if r["Structural group"].startswith("B")]
    a_ready = sum(1 for r in a if r["JRS Read"] == "Ready")
    b_ready = sum(1 for r in b if r["JRS Read"] == "Ready")
    if not (len(a) == 7 and a_ready == 6):
        problems.append("structural group A is %d Ready of %d; the manuscript "
                        "reports six of seven" % (a_ready, len(a)))
    if not (len(b) == 7 and b_ready == 0):
        problems.append("structural group B is %d Ready of %d; the manuscript "
                        "reports none of seven" % (b_ready, len(b)))

    con = rows_of("JCI_JRS_Construct_Coding_Frame.csv")
    nw = [r for r in con if r["JRS Read"] == "Needs work"]
    rd = [r for r in con if r["JRS Read"] == "Ready"]
    nw_yes = sum(1 for r in nw
                 if r["Reconstructability Failure Explicitly Stated"] == "Yes")
    rd_yes = sum(1 for r in rd
                 if r["Reconstructability Failure Explicitly Stated"] == "Yes")
    if "Needs work (n = %d)" % len(nw) not in paper:
        problems.append("construct frame has %d Needs work rows, not the "
                        "manuscript's table" % len(nw))
    if "Ready (n = %d)" % len(rd) not in paper:
        problems.append("construct frame has %d Ready rows, not the "
                        "manuscript's table" % len(rd))
    if nw_yes != 6 or rd_yes != 0:
        problems.append("construct frame codes %d Needs work and %d Ready as "
                        "stating a failure; the manuscript reports 6 and 0"
                        % (nw_yes, rd_yes))

    # No dataset row may be left unclassified: N/A for jurisdiction or source
    # type contradicts this package's own data dictionary.
    master = rows_of("JCI_JRS_32_Case_Master_Dataset.csv")
    na = [r["Case ID"] for r in master
          if r["Jurisdiction"] == "N/A" or r["Source type"] == "N/A"]
    if na:
        problems.append("%d row(s) still N/A for jurisdiction or source type: %s"
                        % (len(na), ", ".join(na)))
    check("packaged coding frames match the manuscript",
          not problems,
          "structural 6/7 and 0/7, construct %d and %d rows, no unclassified row"
          % (len(nw), len(rd))
          if not problems else "%d problem(s): %s" % (len(problems), "; ".join(problems[:3])))


def check_named_contributors_are_only_the_ones_who_elected_it(offline):
    """The detection manuscript credits three groups and only those three, and
    it credits only the people who chose to be credited.

    Four ways to publish someone wrongly, all of them silent:

      1. A contributor who confirmed and elected anonymity gets swept in
         because the roster records participation while the election lives
         somewhere else. Four people across the roster chose anonymity.
      2. The employment pilot's contributor gets credited. That is a separate
         study and is not one of the three groups the Acknowledgments names.
      3. The unnamed figure is read off the roster total instead of summed per
         group. It reads correctly today at four only because all three
         credited groups happen to account for all four; a further election in
         the employment pilot would break that and nothing else would notice.
      4. The internal arm nomenclature reaches the page. Each group must be
         introduced with the label the manuscript already uses in public prose;
         "Arm A" and "Arm B" name the design under test and must not appear.

    None of the four changes a single number in the results, which is exactly
    why nothing else in this file would catch them.
    """
    paper = "research/Detection_Article_Submission_FINAL5_2026-08-18.md"
    creds = "research/Contributor_Credit_List_2026-08-29.md"
    if not (os.path.exists(os.path.join(ROOT, paper))
            and os.path.exists(os.path.join(ROOT, creds))):
        skip("named contributors are only the ones who elected it",
             "manuscript or credit list not present")
        return
    body = read(paper)
    if "**Named contributors, as at" not in body:
        skip("named contributors are only the ones who elected it",
             "credits block not applied")
        return
    block = body.split("**Named contributors, as at", 1)[1]
    block = block.split("\n\nThe reliability and validation methodology", 1)[0]
    listed = re.findall(r"^- (.+)$", block, re.M)
    problems = []

    # Every code in the credit list carries its study in its prefix. V-AI
    # (detection panel), E (reliability) and RR (comparison study) are the three
    # groups this paper acknowledges; V-HR is the employment pilot and is not.
    rows = re.findall(r"^- \*\*([A-Z-]+\d+)\*\* — (.+)$", read(creds), re.M)
    allowed, forbidden = set(), {}
    for code, desc in rows:
        name = desc.split(",")[0].strip()
        if (code.startswith("V-AI-") or code.startswith("RR-")
                or re.match(r"^E-\d+$", code)):
            allowed.add(desc.strip())
        else:
            forbidden[name] = code

    # Membership is checked by NAME against the credit list, not by the whole
    # string. Since 2026-08-29 the printed string comes from the spelling
    # authority, so the description a person typed and the description that
    # prints are deliberately different text for several of them. What must
    # still hold is that the person printed is a person who confirmed and
    # elected naming.
    def nkey(t):
        return "".join(c for c in t.split(",")[0].lower() if c.isalnum())
    allowed_names = {nkey(a) for a in allowed}
    for entry in listed:
        if nkey(entry) not in allowed_names:
            problems.append("credits someone who is not a named contributor "
                            "of the three groups: %s"
                            % entry.strip().split(",")[0])
    for name, code in forbidden.items():
        if name and name in block:
            problems.append("%s (%s) is in the employment pilot, which this "
                            "paper does not credit" % (name, code))

    # The four who elected anonymity may appear nowhere in the manuscript.
    for name in ("Kyle McMullan", "Marguerite Maroudis", "Tuneer Mondal",
                 "Alexandria Davis"):
        if name in body:
            problems.append("%s elected anonymity and is named in the paper"
                            % name)

    # The arm nomenclature names the design under test.
    for token in ("Arm A", "Arm B"):
        if token in body:
            problems.append("the manuscript discloses %r" % token)

    # No group may be named in the credits at all. The 2026-08-29 direction
    # removed the study language, and code-ordered or group-labelled credits
    # would put it straight back.
    for phrase in ("detection panel members", "reliability raters",
                   "comparison study", "in these two groups",
                   "across these three groups"):
        if phrase in block:
            problems.append("the credits place contributors in a study (%r); "
                            "the 2026-08-29 direction removed that language"
                            % phrase)

    # The unnamed figure must be computed, not asserted, so it cannot go stale
    # while the list grows.
    m = re.search(r"^(\w+) further contributors? confirmed and elected not to "
                  r"be named", block, re.M)
    if not m:
        problems.append("the unnamed-contributor sentence is missing")
    else:
        words = {"No": 0, "One": 1, "Two": 2, "Three": 3, "Four": 4,
                 "Five": 5, "Six": 6, "Seven": 7, "Eight": 8}
        stated = words.get(m.group(1))
        named_n = len([1 for c, _d in rows
                       if c.startswith("V-AI-") or c.startswith("RR-")
                       or re.match(r"^E-\d+$", c)])
        # THE CONFIRMED TOTAL IS READ LIVE, NOT HARD-CODED. It used to be the
        # frozen triple (13 + 3 + 14) = 30 "as reported by
        # /api/contributor-stats on 2026-08-29, recorded here so the check runs
        # offline". Confirmations kept arriving. By 2026-09-06 the live figure
        # was 14 + 4 + 14 = 32, and because the manuscript's own applier reads
        # the same endpoint, the applier and this check disagreed by two: the
        # applier wrote the correct "Six", and the guard failed it against a
        # snapshot a week out of date. A number that only goes stale in one of
        # the two places that use it is worse than no number, so the constant
        # is gone and the endpoint is the single source.
        confirmed_total = None
        if not offline:
            stats = live("https://www.jrsstandard.com/api/"
                         "contributor-stats")
            codes = (stats or {}).get("confirmed_codes")
            if codes:
                # V-HR-01 is the employment pilot and is deliberately not one
                # of the three groups this paper acknowledges, so it is
                # excluded here exactly as the applier excludes it.
                confirmed_total = len(
                    [c for c in codes
                     if c.startswith("V-AI-") or c.startswith("RR-")
                     or re.match(r"^E-\d+$", c)])
        if confirmed_total is None:
            # Offline, assert only what is checkable without the endpoint:
            # the sentence must state a number and it cannot exceed the
            # confirmed population, which is at least the named count.
            if stated is None:
                problems.append("the unnamed count %r is not a number this "
                                "check can read" % m.group(1))
        else:
            expected = confirmed_total - named_n
            if stated != expected:
                problems.append("states %s unnamed; the confirmed-minus-named "
                                "figure is %d (live confirmed %d, named %d)"
                                % (m.group(1), expected, confirmed_total,
                                   named_n))

    # Alphabetical, insensitive to punctuation, because code order would
    # reassemble the grouping and a stray full stop would look like disorder.
    def akey(t):
        return "".join(c for c in t.lower() if c.isalnum() or c.isspace())
    if listed != sorted(listed, key=akey):
        problems.append("the credited names are not in alphabetical order, so "
                        "the ordering may still carry the study grouping")

    # Every printed entry must be exactly what Phillip supplied on 2026-08-29.
    # The self-entered strings are the record of what each person typed; the
    # spelling authority is the record of how he approved it printed. Drift
    # between them is invisible in a diff of the manuscript alone.
    spell_path = "research/Contributor_Spellings_2026-08-29.md"
    if not os.path.exists(os.path.join(ROOT, spell_path)):
        problems.append("the contributor spelling authority is missing at %s"
                        % spell_path)
    else:
        approved = [l[2:].strip() for l in read(spell_path).split("\n")
                    if l.startswith("- ")]
        aset = set(approved)
        off = [e for e in listed if e.strip() not in aset]
        if off:
            problems.append("%d credited entr(y/ies) do not match the "
                            "supplied spelling authority: %s"
                            % (len(off), "; ".join(x[:44] for x in off[:2])))
        unused = [a for a in approved if a not in set(x.strip() for x in listed)]
        if unused:
            problems.append("%d approved spelling(s) reach no printed entry: "
                            "%s" % (len(unused),
                                    "; ".join(x.split(",")[0]
                                              for x in unused[:3])))

    check("named contributors are only the ones who elected it",
          not problems,
          "%d credited in one alphabetical list, all elected, no study "
          "named, no employment pilot, no arm nomenclature" % len(listed)
          if not problems else "%d problem(s): %s"
          % (len(problems), "; ".join(problems[:3])))


def check_frozen_manuscript_versions_are_immutable(offline):
    """A frozen manuscript version must never change after it is frozen.

    Phillip's procedural rule of 2026-08-29, attached to the master audit
    prompt: never overwrite the master manuscript during an audit, and keep the
    original, the surgical revision, the post-audit revision and the submission
    version as separate frozen versions, so there is a defensible version
    history if questions arise later.

    Git history alone does not satisfy that. History is rewritable by a force
    push and is not the artefact a journal or an institution asks to see. A
    frozen version is a file plus a recorded SHA-256, and this check is what
    makes the record defensible: if any frozen file moves by one byte, the
    build fails and names the version that moved.
    """
    import hashlib as _h
    store = os.path.join(ROOT, "research", "frozen_versions")
    manifest = os.path.join(store, "MANIFEST.json")
    if not os.path.exists(manifest):
        skip("frozen manuscript versions are immutable", "nothing frozen yet")
        return
    man = json.loads(read("research/frozen_versions/MANIFEST.json"))
    problems = []
    for v in man.get("versions", []):
        path = os.path.join(store, v["file"])
        if not os.path.exists(path):
            problems.append("%s: the frozen file is gone (%s)"
                            % (v["name"], v["file"]))
            continue
        h = _h.sha256()
        with open(path, "rb") as fh:
            for chunk in iter(lambda: fh.read(65536), b""):
                h.update(chunk)
        if h.hexdigest() != v["sha256"]:
            problems.append("%s: content changed since it was frozen on %s. "
                            "manifest %s, file now %s"
                            % (v["name"], v["frozen"], v["sha256"][:16],
                               h.hexdigest()[:16]))
    # A version name must appear once. Two entries under one name would make
    # "which file is v1" unanswerable, which is the whole thing this prevents.
    names = [v["name"] for v in man.get("versions", [])]
    dupes = sorted({n for n in names if names.count(n) > 1})
    if dupes:
        problems.append("duplicate version name(s): %s" % ", ".join(dupes))
    check("frozen manuscript versions are immutable",
          not problems,
          "%d frozen version(s), every hash matches the manifest" % len(names)
          if not problems else "%d problem(s): %s"
          % (len(problems), "; ".join(problems[:3])))


def check_audit_prompt_is_present_and_whole(offline):
    """The master audit prompt must stay in the repository, intact.

    It is the contract the manuscript is audited against at every revision. A
    summarised or truncated copy silently weakens every future audit, and the
    weakening would not be visible in a diff review of the manuscript itself.
    Anchored on the section headings the prompt defines rather than on a byte
    count, so ordinary formatting fixes are allowed and a missing section is
    not.
    """
    path = "research/AUDIT_PROMPT_MASTER.md"
    if not os.path.exists(os.path.join(ROOT, path)):
        check("the master audit prompt is present and whole", False,
              "%s is missing. It is the contract every manuscript audit runs "
              "against." % path)
        return
    body = read(path)
    required = [
        "1. CORE EDITORIAL MANDATE",
        "2. PRESERVE THE CENTRAL CONCEPTUAL ARCHITECTURE",
        "3. PRIMARY RESEARCH CLAIM",
        "4. CLAIM AUDIT",
        "5. STATISTICAL AUDIT",
        "6. REFERENCE CLASSIFICATION AUDIT",
        "7. CORPUS AUDIT",
        "8. PROVENANCE AUDIT",
        "9. REVIEWER HETEROGENEITY AUDIT",
        "10. RELIABILITY AUDIT",
        "11. APPENDIX C AUDIT",
        "12. JRS AUDIT",
        "13. AI ETHICS RELEVANCE AUDIT",
        "14. ADJACENT-CONSTRUCT AUDIT",
        "15. INTERNATIONAL PANEL AUDIT",
        "16. ETHICS AND RESEARCH-INTEGRITY AUDIT",
        "17. CONFLICT-OF-INTEREST AUDIT",
        "18. INTERNAL-CONSISTENCY AUDIT",
        "19. LANGUAGE AUDIT",
        "20. SURGICAL EDITING RULE",
        "21. PUBLICATION-READINESS AUDIT",
        "22. SUBMISSION-PACKAGE AUDIT",
        "23. PEER-REVIEW DEFENSE AUDIT",
        "24. AUTHOR DEFENSE PREPARATION",
        '25. "DO NOT SAY" AUDIT',
        "26. RESEARCH-ARCHIVE PREPAREDNESS",
        "27. FINAL OUTPUT FORMAT",
        "28. ABSOLUTE RULES",
        "29. STANDARD OF SUCCESS",
    ]
    missing = [h for h in required if h not in body]
    # The twenty absolute rules are the part most likely to be trimmed.
    rules = len(re.findall(r"^\d{1,2}\. Never |^\d{1,2}\. Prefer |"
                           r"^\d{1,2}\. Preserve |^\d{1,2}\. Treat |"
                           r"^\d{1,2}\. Distinguish |^\d{1,2}\. Use |"
                           r"^\d{1,2}\. The objective ", body, re.M))
    if rules != 20:
        missing.append("the absolute-rules block has %d rules, not 20" % rules)
    check("the master audit prompt is present and whole",
          not missing,
          "all 29 sections and 20 absolute rules present"
          if not missing else "missing: %s" % "; ".join(missing[:4]))


def check_owner_only_research_files_say_so(offline):
    """A file that carries the internal arm vocabulary must be marked.

    The B1/B2 split is the blind. Two files in research/ name the internal
    nomenclature: the participant inventory, which shows the split itself, and
    the audit report, which names the tokens in order to certify that none of
    them reaches the manuscript. Neither is harmful on its own and both are
    useful, but a file that can be forwarded without the reader knowing it
    should not be is one accidental attachment away from a problem. The banner
    is what makes the restriction travel with the file.
    """
    marked = "OWNER COPY. DO NOT FORWARD."
    tokens = ("Arm B", "B1 / B2", "B1/B2")
    problems = []
    base = os.path.join(ROOT, "research")
    if not os.path.isdir(base):
        skip("owner-only research files say so", "research/ not present")
        return
    checked = 0
    for name in sorted(os.listdir(base)):
        if not name.endswith(".md"):
            continue
        rel = "research/%s" % name
        body = read(rel)
        if not any(t in body for t in tokens):
            continue
        checked += 1
        # A file whose only mention is inside guardrail instructions to the
        # author is a working note, not a distributable artefact. The two that
        # matter are the ones built to be read as documents.
        if name in ("PARTICIPANT_INVENTORY_BY_RUNG.md",
                    "AUDIT_1_2026-08-29.md"):
            if marked not in body:
                problems.append("%s names the arm vocabulary and carries no "
                                "owner-copy banner" % rel)
    check("owner-only research files say so",
          not problems,
          "%d research file(s) name the arm vocabulary; both distributable "
          "ones carry the banner" % checked
          if not problems else "%d problem(s): %s"
          % (len(problems), "; ".join(problems[:3])))


def check_every_credited_participant_is_an_expert(offline):
    """Every Arm B participant is a credentialed expert, and the manuscript
    must keep saying so.

    Standing instruction from Phillip, 2026-08-29. The hazard is specific and
    it has already caught this repository once: RR- reads like an abbreviation
    of "regular reviewer", which is the RELIABILITY study's term for its R-
    coded raters, a group with no identity verification. Attaching that term
    to an Arm B participant would misdescribe a credentialed expert and would
    also misstate the comparison, whose whole point is that the two conditions
    differ in method and not in caliber.

    Two things are enforced. The manuscript must keep the three sentences that
    establish expert parity, because a revision that drops them lets a reader
    infer a weaker population. And no file anywhere may put an RR- code on the
    same line as non-expert vocabulary.

    Evidence for the underlying fact, recorded in
    research/PARTICIPANT_NOMENCLATURE.md: the protocol at line 46, the
    2026-08-18 readiness audit which marks the point VERIFIED, and the two
    anonymous Arm B entries who self-describe as expert professionals.
    """
    problems = []
    paper = "research/Detection_Article_Submission_FINAL5_2026-08-18.md"
    # EVERY participant in every credited group is an expert. The guard used
    # to cover Arm B alone, which left the detection panel's own status
    # asserted only in prose that nothing checked. Section 8.9 was rewritten on
    # 2026-08-29 because its earlier phrasing, "detectability by people who
    # review records for a living" followed by "performance by less experienced
    # reviewers ... is unknown", could be read as conceding that the sixteen
    # were something less than the credentialed panel Section 4.5 describes.
    # They are not, Section 4.5 and Section 6.3 both say so, and the retired
    # sentence must not come back.
    anchors = [
        ("expertise parity in the design",
         "differ in the method applied and not in the expertise of the people "
         "applying it"),
        ("JRS-naive is about exposure",
         "a statement about exposure and not about expertise"),
        ("same professional standing",
         "of the same professional standing as the detection panel"),
        ("the detection panel is credentialed, Section 4.5",
         "Every panel member is a credentialed practitioner or researcher in "
         "one of those fields and was recruited on that basis"),
        ("the detection panel is credentialed, Section 6.3",
         "These are real observations from credentialed professionals"),
        ("Section 8.9 names the recruitment basis",
         "credentialed practitioners and researchers recruited for expertise "
         "in AI governance"),
        ("Section 8.9 attributes the limit to self-selection",
         "the sample was not probability-based"),
    ]
    retired = [
        ("the pre-2026-08-29 Section 8.9 phrasing",
         "detectability by people who review records for a living"),
        ("the pre-2026-08-29 Section 8.9 phrasing",
         "Performance by less experienced reviewers, or by reviewers working "
         "outside their domain, is unknown"),
    ]
    if os.path.exists(os.path.join(ROOT, paper)):
        body = read(paper)
        for label, sentence in anchors:
            if sentence not in body:
                problems.append("the manuscript no longer states %s (%r)"
                                % (label, sentence[:48]))
        for label, sentence in retired:
            if sentence in body:
                problems.append("%s has returned (%r); it reads as conceding "
                                "that the sixteen were less than credentialed"
                                % (label, sentence[:48]))
        # The credits name no study at all since 2026-08-29, so there is no
        # group label there to demote. If one ever returns, it must carry the
        # expert wording; the named-contributor check forbids the label
        # outright and this is the backstop for the wording itself.
        if "**Named contributors, as at" in body:
            blk = body.split("**Named contributors, as at", 1)[1]
            if ("comparison study" in blk
                    and "independent experts in the comparison study"
                    not in blk):
                problems.append("the credit block names the comparison study "
                                "without calling its members independent "
                                "experts")

    # No file may attach non-expert vocabulary to an Arm B code.
    banned = ("regular reviewer", "non-expert", "unverified", "self-enrolled",
              "lay reviewer", "untrained reviewer")
    scanned = 0
    for sub in ("research", "scripts", "api"):
        base = os.path.join(ROOT, sub)
        if not os.path.isdir(base):
            continue
        for name in sorted(os.listdir(base)):
            if not name.endswith((".md", ".py", ".js")):
                continue
            # Two files are out of scope, for the same reason. The
            # nomenclature file exists to name the trap, and the tracker is an
            # append-only log that records errors verbatim in order to prevent
            # them, including a note about this very check firing on a note
            # about this very check. Scanning a log for error-shaped strings is
            # a category mistake: neither file describes a participant to a
            # reader, and any real error would also sit in the artefact the log
            # is describing, which is scanned.
            if name in ("PARTICIPANT_NOMENCLATURE.md", "MASTER_TRACKER.md"):
                continue
            rel = "%s/%s" % (sub, name)
            scanned += 1
            for i, line in enumerate(read(rel).split("\n"), 1):
                codes = [m.start() for m in re.finditer(r"\bRR-\d", line)]
                if not codes:
                    continue
                low = line.lower()
                # Proximity, not co-occurrence. A tracker paragraph runs to
                # thousands of characters and legitimately discusses the
                # reliability study's regular reviewers and an Arm B code
                # hundreds of characters apart. What is actually wrong is the
                # phrase attached to the code, as in "RR-113, a regular
                # reviewer", so the window is a clause rather than a line.
                # Which code the phrase belongs to is decided by which code
                # is nearest, not by whether an Arm B code appears somewhere
                # on the line. The code map itself reads "R-<hash> reliability
                # regular reviewers, RR-### Arm B", where the phrase sits
                # closer to the R- code it correctly describes. Firing there
                # would flag the one sentence that prevents the error.
                r_codes = [m.start() for m in re.finditer(r"\bR-", line)]
                for b in banned:
                    for m in re.finditer(re.escape(b), low):
                        near_rr = min(abs(m.start() - c) for c in codes)
                        near_r = (min(abs(m.start() - c) for c in r_codes)
                                  if r_codes else near_rr + 1)
                        if near_rr <= 120 and near_rr < near_r:
                            problems.append(
                                "%s:%d attaches %r to an Arm B code %d "
                                "characters away, nearer than any reliability "
                                "code" % (rel, i, b, near_rr))
                            break
    check("every credited participant is described as an expert",
          not problems,
          "%d manuscript anchors intact, 2 retired phrasings absent, %d "
          "files scanned, no Arm B code described as non-expert"
          % (len(anchors), scanned)
          if not problems else "%d problem(s): %s"
          % (len(problems), "; ".join(problems[:3])))


def check_ubayet_is_described_as_he_asked(offline):
    """The co-author's former employer must not appear anywhere, and his role
    must not be understated.

    He instructed on 2026-08-28 that his affiliation come off. That fix, commit
    39b5316, changed api/_coauthor-roster.js, api/_contributor-roster.js and
    api/honor.js and stopped there. It missed acquisition-9f3c2a7d4b.html,
    which is live on main and was still naming the employer beside his name in
    a buyer-facing paragraph. Nothing in this file would have caught it,
    because no check for his affiliation existed at all.

    Using a person's employer to lend weight to a commercial page is exactly
    what he asked to have removed, so the check is a flat prohibition on the
    name rather than a judgment about context.

    The second half guards the description of his role. The honor citation at
    api/honor.js calls him the author of the methodology and a co-author of the
    paper that reports it, and the manuscript byline says the same. A live page
    calling him an adviser contradicts both, and that is what the page said.
    """
    problems = []
    # The employer name, nowhere, in anything that ships.
    for sub in (".", "api"):
        base = ROOT if sub == "." else os.path.join(ROOT, sub)
        if not os.path.isdir(base):
            continue
        for name in sorted(os.listdir(base)):
            if not name.endswith((".html", ".js")):
                continue
            rel = name if sub == "." else "%s/%s" % (sub, name)
            body = read(rel)
            if "KPMG" in body:
                for i, line in enumerate(body.split("\n"), 1):
                    if "KPMG" in line:
                        problems.append("%s:%d names the co-author's former "
                                        "employer on a deployed surface"
                                        % (rel, i))
                        break

    # Where he is named on a shipping surface, the description must match the
    # honor citation and the manuscript byline.
    understated = ("advised by", "adviser", "advisor", "consultant to",
                   "reviewed by")
    canonical = "Independent Financial Risk & Model Validation Professional"
    seen = 0
    for sub in (".", "api"):
        base = ROOT if sub == "." else os.path.join(ROOT, sub)
        if not os.path.isdir(base):
            continue
        for name in sorted(os.listdir(base)):
            if not name.endswith((".html", ".js")):
                continue
            rel = name if sub == "." else "%s/%s" % (sub, name)
            for i, line in enumerate(read(rel).split("\n"), 1):
                if "Ubayet" not in line:
                    continue
                seen += 1
                low = line.lower()
                for u in understated:
                    j = low.find(u)
                    if j < 0:
                        continue
                    k = low.find("ubayet")
                    if abs(j - k) <= 140:
                        problems.append("%s:%d describes him as %r, which "
                                        "contradicts the honor citation and "
                                        "the byline" % (rel, i, u))
                        break
    # The canonical title must still be the one the roster and honor record
    # carry, so a rename cannot drift the two apart silently.
    for rel in ("api/honor.js", "api/_coauthor-roster.js",
                "api/_contributor-roster.js"):
        if os.path.exists(os.path.join(ROOT, rel)):
            if canonical not in read(rel):
                problems.append("%s no longer carries his canonical title"
                                % rel)
    check("the co-author is described as he asked",
          not problems,
          "no former-employer name on any deployed surface, %d line(s) name "
          "him, all consistent with the honor citation" % seen
          if not problems else "%d problem(s): %s"
          % (len(problems), "; ".join(problems[:3])))


def check_private_paths_stay_unreachable(offline):
    """Four redirect rules are the only thing keeping the research directory
    off the public web. Nothing asserted they were still there.

    Found while answering a question about anonymity elections. The four
    contributors who elected not to be named appear by name in dozens of
    research/ files, which is correct for study administration and harmless
    because research/ is not served. It is not served because vercel.json
    redirects it to 404.html. Remove that one line and the participant
    inventory, which shows the arm split and is marked DO NOT FORWARD, is
    fetchable by anyone who guesses the path.

    The .md rule covers every markdown file in the repository, which is what
    keeps CLAUDE.md's private owner slugs off the web. Those slugs are the
    entire access control on the owner surfaces, because the standing decision
    is that they carry no token.

    A blanket "/:path*.docx" rule sat here too and WAS REMOVED on 2026-09-02.
    It guarded a mechanism rather than the property. The property is that no
    manuscript is reachable, and the research/ and scripts/ rules already give
    that: on 2026-09-02 the only .docx anywhere outside those two directories
    were the two the site deliberately links, the homepage's Twenty-Record
    Evaluation Study and pilot.html's Full Case Review, and the blanket rule
    was sending BOTH of those download buttons to /404.html in production.
    So this check no longer requires the extension rule. It instead asserts
    the property directly: every .docx outside research/ and scripts/ must be
    one a public page links on purpose. A private manuscript dropped at the
    repository root fails here.

    A redirect is a deployment property, so this checks the config that
    produces it. The live behaviour was confirmed by request on 2026-08-29:
    each of the four returned 307 to 404.html.
    """
    cfg = "vercel.json"
    if not os.path.exists(os.path.join(ROOT, cfg)):
        check("private paths stay unreachable", False,
              "vercel.json is missing; nothing routes the site")
        return
    try:
        conf = json.loads(read(cfg))
    except ValueError as e:
        check("private paths stay unreachable", False,
              "vercel.json does not parse: %r" % (e,))
        return
    required = {
        "/:path*.md": "every markdown file, including CLAUDE.md and its "
                      "private owner slugs",
        "/:path*.docx": "every built manuscript and report",
        "/research/:path*": "the whole research directory, including the "
                            "participant inventory and the correspondence",
        "/scripts/:path*": "the whole scripts directory",
    }
    have = {r.get("source"): r.get("destination")
            for r in conf.get("redirects", [])}
    problems = []
    # Defence in depth. The blanket .docx rule is what makes a mistaken
    # full-branch deploy harmless: twelve private .docx sit at the repository
    # root on the development branch, including two trademark dossiers, and
    # none of them is on main. They are off the web today because the
    # selective-deploy procedure keeps them off main AND because that rule
    # would 404 them even if a deploy shipped them. If the rule is ever
    # removed, the second layer goes with it, so the property check below
    # activates and names every private file that would become reachable.
    import glob as _glob
    linked = set()
    for page in _glob.glob(os.path.join(ROOT, "*.html")):
        try:
            with open(page, encoding="utf-8") as fh:
                html = fh.read()
        except Exception:
            continue
        for m in re.finditer(r'href="([^":]+\.docx)"', html):
            linked.add(m.group(1).split("?")[0].lstrip("/"))
    docx_blanket = "/:path*.docx" in have
    for path in _glob.glob(os.path.join(ROOT, "**", "*.docx"), recursive=True):
        rel = os.path.relpath(path, ROOT)
        if docx_blanket:
            break
        if rel.startswith("research" + os.sep) or rel.startswith("scripts" + os.sep):
            continue
        if rel not in linked:
            problems.append("%s sits outside research/ and scripts/ and no "
                            "public page links it, so it is reachable and "
                            "unaccounted for" % rel)
    for src, what in sorted(required.items()):
        if src not in have:
            problems.append("%s is no longer redirected, exposing %s"
                            % (src, what))
        elif have[src] != "/404.html":
            problems.append("%s now redirects to %r rather than /404.html"
                            % (src, have[src]))
    check("private paths stay unreachable",
          not problems,
          "%d redirect rules present, all to /404.html" % len(required)
          if not problems else "%d problem(s): %s"
          % (len(problems), "; ".join(problems[:2])))


def check_withdrawn_contributor_is_not_defaulted_into_being_named(offline):
    """A contributor who withdrew naming consent must not be told that silence
    means consent.

    api/contributor.js prints a fallback rule on every contributor's own page:
    if they do not respond by the fallback date, the paper uses the name and
    title already on file, or anonymity where that is the election on file.
    Which of those two a person gets is decided by ANON_CODES.

    V-AI-08 withdrew consent to be named on 2026-08-16. Her roster row still
    carries named_on_file: true, because the row is the study record and the
    row is what makes her link resolve to her at all. Until 2026-08-29 she was
    not in ANON_CODES, so her own page told her that silence on 5 September
    would be read as agreement to be named.

    The credit pipeline would not have printed her either way, because it
    credits only codes on the confirmed list and she is not on it. That is not
    the point and it is not a defence: the page was making a promise to her
    that contradicted her withdrawal.

    Every withdrawn code must therefore appear in ANON_CODES, and the register
    in scripts/withdraw_contributor.py is the list of them, so the two cannot
    drift apart.
    """
    api = "api/contributor.js"
    reg = os.path.join(ROOT, "scripts", "withdraw_contributor.py")
    if not os.path.exists(os.path.join(ROOT, api)):
        skip("no withdrawn contributor is defaulted into being named",
             "api/contributor.js not present")
        return
    body = read(api)
    m = re.search(r"const ANON_CODES = \[([^\]]*)\];", body)
    if not m:
        check("no withdrawn contributor is defaulted into being named", False,
              "ANON_CODES could not be located in %s, so the fallback rule "
              "cannot be verified" % api)
        return
    anon = set(re.findall(r"'([^']+)'", m.group(1)))

    withdrawn = []
    if os.path.exists(reg):
        sys.path.insert(0, os.path.join(ROOT, "scripts"))
        try:
            import withdraw_contributor as wc
            withdrawn = []
        except Exception as e:
            check("no withdrawn contributor is defaulted into being named",
                  False, "the withdrawal register did not import: %r" % (e,))
            return
    # Only a contributor's OWN withdrawal is an election, and only an election
    # belongs in ANON_CODES. A credit removal made on the owner's instruction
    # records no choice by the contributor, so forcing an anonymity entry for
    # it would assert an election they never made. Their accurate state is
    # named_on_file: null, no election on file.
    withdrawn = [w["code"] for w in getattr(wc, "WITHDRAWALS", [])
                 if w.get("basis", "contributor_withdrew")
                 == "contributor_withdrew"]
    missing = [c for c in withdrawn if c not in anon]
    check("no withdrawn contributor is defaulted into being named",
          not missing,
          "%d withdrawn code(s), all present in ANON_CODES; %d code(s) fall "
          "back to anonymity" % (len(withdrawn), len(anon))
          if not missing else "%s withdrew naming consent and %s not in "
          "ANON_CODES, so the fallback rule on their own page reads their "
          "silence as consent to be named"
          % (", ".join(missing), "is" if len(missing) == 1 else "are"))


def check_no_endpoint_relies_on_an_uncapped_limit(offline):
    """No api/ read may ask for more rows than Supabase will ever return.

    Supabase caps every PostgREST response at 1,000 rows. The cap is applied
    AFTER the query's own `limit`, it is not an error, and nothing in the
    response says it happened: `limit=20000` against a 1,031-row table returns
    1,000 rows and HTTP 200. Rows come back in physical order when no `order`
    is given, so what is lost is always the most recently inserted, which is
    the data a dashboard is being read for.

    This is how the Investigator Guide download chart came to stop at 31 August
    while the table held rows through 7 September, reporting 137 against 145.
    Nothing looked broken. It looked quiet, which is worse, and no arithmetic
    check could catch it because every number was internally consistent.

    A limit above the cap is the signature of the bug: it proves the author
    expected more than 1,000 rows, which is exactly the case the cap silently
    truncates. Paging through api/_sb-fetch.js is the only correct fix, so a
    file that imports it is exempt for the reads it pages.
    """
    import glob
    bad = []
    for path in sorted(glob.glob(os.path.join(ROOT, "api", "**", "*.js"),
                                 recursive=True)):
        rel = os.path.relpath(path, ROOT)
        body = read(rel)
        if body is None:
            continue
        # The pager itself documents the broken pattern in its own header
        # comment, so it matches its own rule. Exempt by path, not by content.
        if os.path.basename(rel) == "_sb-fetch.js":
            continue
        if "_sb-fetch" in body:
            continue          # pages; the limit is no longer what bounds it
        for m in re.finditer(r"limit=(\d+)", body):
            n = int(m.group(1))
            if n > 1000:
                line = body.count("\n", 0, m.start()) + 1
                bad.append("%s:%d limit=%d" % (rel, line, n))
    check("no endpoint relies on a limit above the Supabase row cap",
          not bad,
          "%d api file(s) scanned, none asks for more than the 1,000-row cap "
          "without paging" % len(glob.glob(os.path.join(ROOT, "api", "**",
                                                        "*.js"), recursive=True))
          if not bad else
          "%d read(s) above the cap, each silently truncated: %s"
          % (len(bad), "; ".join(bad[:4])))


def check_inquiry_options_are_backed_by_the_allowlist(offline):
    """Every interest the forms offer must be one the endpoint accepts, the
    three forms must offer the same set, and the four pathways must be named.

    api/enterprise-inquiry.js validates with oneOf(), which returns an empty
    string for any value not on its allowlist. A new <option> added to a form
    alone does not error and does not warn: the inquiry saves, and the interest
    arrives at the owner's dashboard as "unspecified". The failure is invisible
    on both ends and lands hardest on the option added last, which is the one
    someone bothered to add because it mattered.

    The same inquiry block appears on index.html, review-engine.html and
    enterprise.html. If they drift, one page quietly stops offering a pathway
    the others do, and the dashboard cannot reveal it because it records only
    what was actually chosen.

    The four pathways must also be readable in the labels. A value of
    "acquisition" behind a label that never says Acquisition is not an
    available pathway to the person reading the form.
    """
    pages = ("enterprise.html", "index.html", "review-engine.html")
    api = "api/enterprise-inquiry.js"
    for f in pages + (api,):
        if not os.path.exists(os.path.join(ROOT, f)):
            skip("inquiry options are backed by the allowlist", "%s absent" % f)
            return
    a = re.search(r"const INTEREST = \[(.*?)\];", read(api), re.S)
    if not a:
        check("inquiry options are backed by the allowlist", False,
              "the INTEREST allowlist could not be found in %s" % api)
        return
    allow = re.findall(r"'([a-z-]+)'", a.group(1))
    problems, sets, labels = [], {}, {}
    for page in pages:
        m = re.search(r'name="interest">(.*?)</select>', read(page), re.S)
        if not m:
            problems.append("the interest select could not be found in %s"
                            % page)
            continue
        sets[page] = re.findall(r'value="([^"]+)"', m.group(1))
        labels[page] = m.group(1)
        for o in sets[page]:
            if o not in allow:
                problems.append("%s offers %r, which the endpoint would store "
                                "as an empty interest" % (page, o))
    if len({tuple(v) for v in sets.values()}) > 1:
        problems.append("the three inquiry forms offer different option sets: "
                        + "; ".join("%s=%d" % (k, len(v))
                                    for k, v in sorted(sets.items())))
    if sets:
        first = next(iter(sets.values()))
        orphan = [x for x in allow if x not in first]
        if orphan:
            problems.append("the allowlist accepts %s, which no form offers"
                            % ", ".join(repr(o) for o in orphan))
        for page, blk in sorted(labels.items()):
            for word in ("Licensing", "Integration", "Acquisition",
                         "Not sure yet"):
                if word not in blk:
                    problems.append("%s names no %r pathway in its labels"
                                    % (page, word))
    check("inquiry options are backed by the allowlist",
          not problems,
          "3 forms, %d identical options, all on the allowlist, four pathways "
          "named" % len(next(iter(sets.values())) if sets else [])
          if not problems else "%d problem(s): %s"
          % (len(problems), "; ".join(problems[:2])))


def check_blinded_manuscript_carries_no_identity(offline):
    """The double-blind submission file must contain no author or contributor
    identity, and the title page must carry what was removed.

    AI and Ethics is explicit that anonymising is the author's responsibility,
    not the journal's. A leak is invisible in a diff of the blinded file alone,
    because the sentence reads correctly either way, and it is only detectable
    by checking the file against the list of people who must not appear in it.

    The name list is built from the spelling authority rather than typed here,
    so a contributor added later is checked automatically instead of relying on
    someone remembering to extend a constant.
    """
    d = os.path.join(ROOT, "research", "aie_submission_2026-09-01")
    blind = os.path.join(d, "01_Blinded_Manuscript.md")
    title = os.path.join(d, "02_Title_Page.md")
    spell = os.path.join(ROOT, "research",
                         "Contributor_Spellings_2026-08-29.md")
    if not (os.path.exists(blind) and os.path.exists(title)):
        skip("blinded manuscript carries no identity", "submission not built")
        return
    b = read("research/aie_submission_2026-09-01/01_Blinded_Manuscript.md")
    t = read("research/aie_submission_2026-09-01/02_Title_Page.md")
    names = []
    if os.path.exists(spell):
        names = [l[2:].split(",")[0].strip() for l in
                 read("research/Contributor_Spellings_2026-08-29.md").split("\n")
                 if l.startswith("- ")]
    ident = ["Phillip Wikes", "Ubayet Hossain", "Wikes", "Hossain",
             "Maryland Commission on Civil Rights", "Saurabh Nanda"]
    problems = []
    for n in ident + names:
        if n and re.search(r"\b%s\b" % re.escape(n), b):
            problems.append("the blinded manuscript names %s" % n)
    # What was removed has to land somewhere, or it is lost rather than moved.
    if "**Authors.**" not in t:
        problems.append("the title page carries no byline")
    if "## Acknowledgments" not in t:
        problems.append("the title page carries no acknowledgements")
    missing = [n for n in names if n and n not in t]
    if missing:
        problems.append("%d contributor(s) appear on neither file: %s"
                        % (len(missing), ", ".join(missing[:3])))
    check("blinded manuscript carries no identity",
          not problems,
          "0 identity leaks, title page carries the byline, the "
          "acknowledgements and all %d contributors" % len(names)
          if not problems else "%d problem(s): %s"
          % (len(problems), "; ".join(problems[:3])))


def check_send_copy_is_clean(offline):
    """The correspondence that goes out must carry no editorial material and no
    signature the stated arrangement does not authorise.

    Email 1 carried both authors' signatures while the file's own header said
    Stacyann sends both alone, and the working file ended with an editorial note
    about status wording. Neither belongs in correspondence to a federal council.
    A separate send copy now exists and is asserted here.
    """
    send = read("research/CFOC_Emails_SEND_COPY_2026-08-28.md")
    problems = []
    if send is None:
        problems.append("research/CFOC_Emails_SEND_COPY_2026-08-28.md is missing")
    else:
        flat = re.sub(r"\s+", " ", send)
        for bad, why in (("Phillip Wikes", "a second signature the stated "
                                           "arrangement does not authorise"),
                         ("Working notes", "editorial material"),
                         ("Send note", "editorial material"),
                         ("currently under submission", "status language that "
                                                        "overstates the article")):
            if bad in flat:
                problems.append("send copy contains %r (%s)" % (bad, why))
        for need in ("Stacyann Young", "being submitted for publication",
                     "personal professional capacity", "p = 0.0000520"):
            if need not in flat:
                problems.append("send copy is missing %r" % need)
    check("correspondence send copy is clean",
          not problems,
          "no editorial material, one signature, accurate status language"
          if not problems else "%d problem(s): %s" % (len(problems), "; ".join(problems[:3])))


def check_submission_package_is_self_contained(offline):
    """The package a reviewer receives must not reach outside itself.

    The first build shipped a reproduction script that queried a live database,
    embedded an API key, and verified against a path that does not exist inside
    the ZIP. For a paper about whether a record can be rebuilt without hidden
    information, that was the wrong failure to ship. Four invariants:

      1. No credential travels with the submission.
      2. No path outside the package appears in the analysis script.
      3. No placeholder text survives in any delivered file.
      4. The analysis script imports nothing outside the standard library.
    """
    pkg = os.path.join(ROOT, "research", "JCI_SUBMISSION_2026-08-28")
    if not os.path.isdir(pkg):
        skip("submission package is self-contained", "package not built")
        return
    problems = []
    for base, _dirs, files in os.walk(pkg):
        for fn in files:
            p = os.path.join(base, fn)
            rel = os.path.relpath(p, pkg)
            if fn.endswith((".pdf", ".docx")):
                continue
            try:
                with open(p, encoding="utf-8") as fh:
                    body = fh.read()
            except (UnicodeDecodeError, OSError):
                continue
            for bad, why in (("sb_publishable", "a database credential"),
                             ("supabase", "a live database host"),
                             ("NOT IN THE DATASET", "placeholder text"),
                             ("analysis_foil_2026-08-08", "the superseded script")):
                if bad in body:
                    problems.append("%s contains %s (%r)" % (rel, why, bad))
    ana = os.path.join(pkg, "04_REPRODUCTION", "analysis.py")
    if not os.path.exists(ana):
        problems.append("04_REPRODUCTION/analysis.py is missing")
    else:
        with open(ana, encoding="utf-8") as fh:
            src = fh.read()
        if "research/" in src:
            problems.append("analysis.py references a path outside the package")
        allowed = {"csv", "io", "json", "os", "re", "sys", "fractions"}
        for m in re.findall(r"^\s*(?:import|from)\s+([\w.]+)", src, re.M):
            top = m.split(".")[0]
            if top not in allowed:
                problems.append("analysis.py imports %r, which is outside the "
                                "declared standard-library set" % top)
    check("submission package is self-contained",
          not problems,
          "no credential, no external path, no placeholder, stdlib only"
          if not problems else "%d problem(s): %s" % (len(problems), "; ".join(problems[:3])))


def check_crossdomain_citation_is_current(offline):
    """The FOIL paper must cite the employment study's analysed set, not its screened one.

    Every replacement figure is also required to exist in the companion
    manuscript, so this cannot pass by citing a number nobody can source.
    """
    paper = read("research/FOIL_Article_Draft.md")
    source = read("research/Employment_Records_Article_ISACA_2026-08-21.md")
    flat = re.sub(r"\s+", " ", source)
    problems = []
    for frag, why in sorted(SUPERSEDED_CROSSDOMAIN.items()):
        if frag in paper:
            problems.append("FOIL_Article_Draft.md still cites %r (%s)" % (frag, why))
    for probe in ("p = 0.0194", "odds ratio 15.00", "p = 0.0291", "2 of 12"):
        if probe not in paper:
            problems.append("FOIL_Article_Draft.md does not carry %r" % probe)
        if probe not in flat:
            problems.append("%r is not in the companion manuscript that must "
                            "establish it" % probe)
    check("cross-domain citation matches the companion study",
          not problems,
          "4 current figures cited, 7 superseded ones absent"
          if not problems else "%d problem(s): %s" % (len(problems), "; ".join(problems[:4])))


def check_second_read_completeness_is_published(offline):
    """A returned packet must report whether it finished, and no more than that.

    api/recheck.js accepts a partial return by design, so `submitted` counts
    arrivals and says nothing about completion. The owner asked exactly that
    question and no deployed surface could answer it. Two invariants:

      1. blind_second_read publishes complete_returns, so completeness is
         readable without a service role key.
      2. It publishes NO label, case, or agreement figure. An agreement number
         beside a public case list reconstructs the answer key, and the blind is
         the whole instrument.
    """
    src = read("api/asset-stats.js")
    problems = []
    m = re.search(r"blind_second_read: \{(.*?)\n      \}", src, re.S)
    if not m:
        problems.append("blind_second_read block not found in api/asset-stats.js")
    else:
        block = m.group(1)
        # FIELD NAMES ONLY, NEVER THE PROSE. The first version of this check
        # scanned the whole block for the word "agreement" and failed on the
        # note that explains why no agreement figure is published. A guard that
        # fires on its own documentation is a broken probe, and acting on it
        # would have meant deleting a correct explanation to satisfy a bad test.
        fields = set(re.findall(r"^\s*(\w+):", block, re.M))
        for field in ("complete_returns", "partial_returns", "answers_recorded"):
            if field not in fields:
                problems.append("blind_second_read does not publish %s" % field)
        for banned in sorted(f for f in fields
                             if re.search(r"agreement|kappa|label|per_case|answers$|"
                                          r"score|correct|key", f)):
            problems.append("blind_second_read publishes the field %r, which "
                            "leaks the answer key" % banned)
    # The suppressed-cohort entry must not assert a send it cannot observe.
    if re.search(r"cohort: 'Blind second-read links',.*?None has been sent\.'\s*,",
                 src, re.S) and "recheckSubmitted > 0" not in src:
        problems.append("the blind second-read cohort hardcodes 'None has been "
                        "sent' with no test against submitted")
    check("second-read completeness is published, agreement is not",
          not problems,
          "complete_returns published; no label, case or agreement figure exposed"
          if not problems else "; ".join(problems[:4]))


def check_completion_date_implies_completion(offline):
    """A completion date must never be emitted for someone who did not complete.

    api/people-9dd1ecdf6f8cdfd4.js fell back to the row's own created_at for
    every non-enrolment row, so 46 of 58 rows carried a training_completed_on
    value while training_completed was false. The owner table guarded the field
    and looked right; the CSV export did not, so a downloaded file asserted 46
    completions that never happened. Checked in the SOURCE, because the live
    endpoint is not reachable from an offline run.
    """
    src = read("api/people-9dd1ecdf6f8cdfd4.js")
    m = re.search(r"training_completed_on:.*?,\n", src, re.S)
    problems = []
    if not m:
        problems.append("training_completed_on assignment not found")
    else:
        expr = m.group(0)
        if "r.created_at" in expr and "training-complete" not in expr:
            problems.append("training_completed_on falls back to r.created_at "
                            "with no completion test, so a row date is emitted "
                            "as a completion date")
    # The CSV export must not be the only thing standing between the owner and
    # a wrong date, so the endpoint is required to be correct at source.
    page = read("programme-status-9872fb93cc94.html")
    if "training_completed_on" in page and "r.training_completed_on" not in page:
        problems.append("owner page references training_completed_on in a form "
                        "this check cannot verify")
    check("a completion date implies a completion",
          not problems,
          "training_completed_on is empty unless the person completed"
          if not problems else "; ".join(problems))


def check_trust_pages_carry_their_proof(offline):
    """Every page that asks a stranger to act must show who built this and who checked it.

    The credential alone is not proof and the figures alone are not authority.
    A page carrying one without the other is a claim with half its support, so
    both halves are asserted together.
    """
    problems = []
    for name, why in sorted(TRUST_PAGES.items()):
        src = read(name)
        if "Lead Civil Rights Officer" not in src:
            problems.append("%s: no credential (%s)" % (name, why))
            continue
        missing = [k for k in PROOF_BINDINGS if 'data-panel="%s"' % k not in src]
        if missing:
            problems.append("%s: credential present but unproven, missing %s (%s)"
                            % (name, ", ".join(missing), why))
            continue
        # The figures must be BOUND, never typed into the prose beside them.
        if "JRS PANEL BINDER v2 ::" not in src:
            problems.append("%s: proof figures present but no binder, so they never move" % name)
    # check.html must NOT carry the all-studies figures beside its detection ones.
    chk = read("check.html")
    collide = [k for k in ("completers_all", "countries_all") if 'data-panel="%s"' % k in chk]
    if collide:
        problems.append("check.html: all-studies figure %s sits beside the detection-panel "
                        "figures it already publishes; two populations, one viewport"
                        % ", ".join(collide))
    check("trust pages carry the credential and its proof",
          not problems,
          "%d pages, credential and all 3 bound figures on each" % len(TRUST_PAGES)
          if not problems else "%d problem(s): %s" % (len(problems), "; ".join(problems[:4])))


def check_panel_binder_identical(offline):
    """The five, now nine, copies of the binder must stay byte-identical.

    They were five separately edited copies of the same twelve lines with
    nothing asserting they matched, which is the same defect as a duplicated
    constant, expressed in JavaScript.
    """
    pat = re.compile(r"<!-- JRS PANEL BINDER v2.*?<!-- /JRS PANEL BINDER v2 -->", re.S)
    found = {}
    for name in _html_files():
        blocks = pat.findall(read(name))
        if blocks:
            found[name] = blocks
    if not found:
        check("panel binder copies are byte-identical", False, "no binder block found anywhere")
        return
    texts = set(b for v in found.values() for b in v)
    many = [n for n, v in found.items() if len(v) != 1]
    ok = len(texts) == 1 and not many
    check("panel binder copies are byte-identical", ok,
          "%d pages, 1 identical block each" % len(found) if ok else
          "%d distinct binder texts across %d pages%s" % (
              len(texts), len(found),
              ("; pages with != 1 copy: " + ", ".join(many)) if many else ""))


# Files that speak about the PROGRAMME rather than about one study, and must
# therefore credit every independent expert who graded records, not only the 16
# on the detection panel. Added 2026-08-15 after the owner found the manuscript
# acknowledging Arm A alone.
#
# The rule is not "mention 58 somewhere". It is: if the file cites a
# detection-only reviewer figure, it must ALSO carry the programme figure, so a
# reader is never handed 16 as though it were the whole panel.
PROGRAMME_SCOPE_FILES = [
    "research/Detection_Article_Submission_FINAL5_2026-08-18.md",
    "research/Detection_Article_v7_2026-08-18.md",
    "research/Detection_Article_v6_2026-08-18.md",
    "research/Detection_Article_v5_2026-08-18.md",
    "research/Detection_Article_v4_2026-08-16.md",
    "research/Detection_Article_v3_2026-08-15.md",
    "research/Positioning_Lines_2026-08-15.md",
    "research/LinkedIn_Results_Section_2026-08-15.md",
    "LINKEDIN_LAUNCH_POSTS.md",
    "UPWORK_PROPOSAL_TEMPLATES.md",
]

# Any of these counts as crediting the whole programme.
PROGRAMME_MARKERS = (
    "58 independent experts",
    # v4 opened the Acknowledgments by spelling the number. The guard is on the
    # fact that the whole programme is credited, not on how the sentence is
    # written, so the spelled form counts.
    "Fifty-eight independent experts",
    # 2026-08-18: an editorial review required the programme-level
    # acknowledgments compressed, on the ground that a journal manuscript is not
    # a programme report. THE CREDIT TO ALL 58 SURVIVED THAT COMPRESSION and is
    # still required here; only the phrasing carrying it changed. This marker was
    # missed when the same widening was applied to verify_manuscript_figures.py,
    # and this guard caught the omission.
    "All 58 worked unpaid",
    "58 international reviewers",
    "58 reviewers",
    "across three studies",
)

# Any of these is a detection-only reviewer figure.
DETECTION_ONLY = (
    "16 independent experts",
    "sixteen independent experts",
    "Sixteen independent experts",
)


def check_all_experts_credited(offline):
    """A file citing the detection panel must also credit the whole programme.

    The manuscript credited the 16 detection reviewers in full and mentioned the
    other 42 only as a count, in a sentence that called them context. The owner's
    standing instruction, on the record repeatedly, is that recognition covers
    every completer in both arms and is not scoped to whichever study a given
    document happens to report. This check makes that mechanical.
    """
    bad, missing = [], []
    for rel in PROGRAMME_SCOPE_FILES:
        src = read(rel)
        if not src:
            # ABSENT BY DESIGN ON THE DEPLOY BRANCH, NOT DRIFT. Every file in
            # this list lives only on the dev branch; none is deployed. Counting
            # their absence as a failure blocked a deploy on 2026-08-18 with six
            # "missing" lines and nothing actually wrong. A file that is present
            # and fails to credit the programme is still a failure.
            missing.append(rel)
            continue
        cites_detection = any(m in src for m in DETECTION_ONLY)
        credits_all = any(m in src for m in PROGRAMME_MARKERS)
        if cites_detection and not credits_all:
            bad.append("%s: cites the 16-expert detection figure and never credits "
                       "the full programme" % rel)
    if bad:
        check("programme-scope files credit every independent expert", False,
              "; ".join(bad))
    elif len(missing) == len(PROGRAMME_SCOPE_FILES):
        check("programme-scope files credit every independent expert", SKIPPED,
              "none of the %d scope files is on this branch by design"
              % len(PROGRAMME_SCOPE_FILES))
    else:
        check("programme-scope files credit every independent expert", True,
              "%d files checked, all credit the whole programme%s"
              % (len(PROGRAMME_SCOPE_FILES) - len(missing),
                 "" if not missing else "; %d absent on this branch" % len(missing)))


def check_rung2a_lock(offline):
    """The locked Rung 2a sample must still match the database, or say it does not.

    The published sentence quotes 69.4% versus 6.2% with a confidence interval, a
    Fisher p and a rate ratio, all computed on 21 reviewers and 108 labels. Those
    four figures are bound to constants in api/panel-stats.js rather than to a
    live recount, deliberately: rendering the live count beside statistics
    computed on a different sample would make the sentence contradict itself.

    A frozen constant is only defensible while somebody is watching it. This is
    that watch. The endpoint recounts the same sample on every request and sets
    rung2a_sample_drift; this check reads it, so a divergence is reported
    continuously instead of being found by accident a month later.

    A divergence is NOT a code defect. It means the analysis needs re-running,
    which is held pending the owner's decision in
    research/Accuracy_Sweep_2026-08-01.md on whether the Rung 2a set is
    accumulating or curated. It is reported as a failure because a published
    figure no longer describing the database is exactly what this guard exists
    to surface.
    """
    if offline:
        check("Rung 2a locked sample still matches the database", SKIPPED,
              "needs production; the lock itself is offline-checkable only for syntax")
        return
    d = live(PANEL)
    if d is None:
        check("Rung 2a locked sample still matches the database", SKIPPED,
              "endpoint unreachable")
        return
    if "rung2a_sample_drift" not in d:
        check("Rung 2a locked sample still matches the database", False,
              "api/panel-stats no longer reports rung2a_sample_drift")
        return
    lv = d.get("rung2a_live") or {}
    detail = ("locked %s/%s structured, %s/%s unstructured, taken %s"
              % (d.get("rung2a_structured_reviewers"), d.get("rung2a_structured_labels"),
                 d.get("rung2a_unstructured_reviewers"), d.get("rung2a_unstructured_labels"),
                 d.get("rung2a_locked_on")))
    if d["rung2a_sample_drift"]:
        detail = ("the set has GROWN since the analysis was locked on %s: live is "
                  "%s reviewers / %s labels structured and %s / %s unstructured, against "
                  "locked %s / %s and %s / %s. The published CI, Fisher p and rate ratio "
                  "need recomputing. Held pending the owner decision in "
                  "research/Accuracy_Sweep_2026-08-01.md"
                  % (d.get("rung2a_locked_on"),
                     lv.get("structured_reviewers"), lv.get("structured_labels"),
                     lv.get("unstructured_reviewers"), lv.get("unstructured_labels"),
                     d.get("rung2a_structured_reviewers"), d.get("rung2a_structured_labels"),
                     d.get("rung2a_unstructured_reviewers"), d.get("rung2a_unstructured_labels")))
    check("Rung 2a locked sample still matches the database",
          not d["rung2a_sample_drift"], detail)


# Figures the results summary carried. Any one of them reappearing in the
# contributor path means the summary is back. Chosen because each is specific
# to a study finding rather than to general site copy: a generic number such
# as 58 or 16 also appears in credit lines, so it is deliberately not listed.
CONTRIBUTOR_FINDING_STRINGS = [
    "83.9", "72.7 to 95.1", "87.0 percent", "80.7 percent",
    "0.739", "0.623", "87.2 percent", "86.2 to 88.2",
    "75.0 percent", "67.6 percent", "384 graded reads",
    "PRE-REGISTERED BAR NOT MET", "pre-registered bar",
    "resultsBlock", "RESULTS_RELEASED", "RESULTS_LOCKED_ON",
]

CONTRIBUTOR_PATH = ["api/contributor.js", "contributor.html"]


def check_contributor_carries_no_findings(offline):
    """The contributor path must return no study findings.

    Removed 2026-08-16 on the owner's instruction. The summary was gated behind
    the POST branch, which made it invisible to anyone reading the page source,
    which in turn makes its accidental return invisible too. This is the check
    that would catch it: a findings figure reappearing anywhere in the endpoint
    or the page it feeds.

    Offline by construction. It reads the two files, so it is the same check on
    a laptop, in a hook and in a deploy branch.
    """
    hits = []
    for path in CONTRIBUTOR_PATH:
        body = read(path)
        if not body:
            check("contributor path carries no study findings", False,
                  "%s is unreadable" % path)
            return
        for needle in CONTRIBUTOR_FINDING_STRINGS:
            if needle in body:
                hits.append("%s contains %r" % (path, needle))
    # The POST response shape is the other half. A `results` key returning from
    # the handler is the exact thing that was removed, and a grep for the
    # figures alone would miss a summary rewritten in different numbers.
    api = read("api/contributor.js")
    # ANYWHERE IN THE LINE. Corrected 2026-09-17 by the same second-order pass.
    # The pattern required `results:` to open its own line, so
    # `var _bad = { results: [1,2,3] };` PASSED -- the key the guard exists to
    # refuse, written inline. Third instance of the line-anchoring class found
    # in a single pass, and like the others it erred toward passing.
    if re.search(r"(?:^|[{,(\s])results\s*:", api, re.M):
        hits.append("api/contributor.js emits a `results:` key from the handler")
    html = read("contributor.html")
    if re.search(r"\bd\.results\b", html):
        hits.append("contributor.html reads d.results")
    check("contributor path carries no study findings", not hits,
          "; ".join(hits) if hits else "2 files, no findings figure and no results key")


def check_withdrawn_contributors_absent(offline):
    """No withdrawn contributor's name survives anywhere in the repository.

    THE DEFECT THIS CATCHES HAS ALREADY HAPPENED ONCE. E-08 asked in writing on
    2026-08-09 that her agency title and employer come off every piece of
    recognition. api/honor.js said so in terms, "Do not repopulate these from
    the study record", and a builder repopulated them from the roster CSV
    anyway, because the CSV records participation and knows nothing about
    consent. A written removal request was undone by a script.

    A withdrawal is therefore not a state you reach by editing files. It is a
    state something has to keep checking, because every builder in research/
    reads a study record that still contains the person.

    scripts/withdraw_contributor.py owns the register and the scan. This runs it
    rather than re-implementing it, so there is one list of withdrawn names and
    not two that can disagree.
    """
    # scripts/ IS NOT DEPLOYED, so the register is absent on the production
    # branch. Its absence there is the design working, exactly as research/ is,
    # and failing on it blocked a deploy. The dev branch runs this check on
    # every commit, which is where a name could actually be reintroduced.
    reg = os.path.join(ROOT, "scripts", "withdraw_contributor.py")
    if not os.path.isfile(reg):
        check("no withdrawn contributor name survives", SKIPPED,
              "scripts/withdraw_contributor.py is not on this branch by design")
        return
    sys.path.insert(0, os.path.join(ROOT, "scripts"))
    try:
        import withdraw_contributor as wc
    except Exception as e:
        check("no withdrawn contributor name survives", False,
              "scripts/withdraw_contributor.py did not import: %r" % (e,))
        return
    traces = wc.scan_traces()
    # COUNT WHAT IS ACTUALLY SCANNED. Reading WITHDRAWALS whole made the
    # success line report name forms that scan_traces() no longer hunts, so a
    # register with every entry retired still announced "3 withdrawn name
    # forms, 0 occurrences" and read as active enforcement.
    active = wc.active_withdrawals() if hasattr(wc, "active_withdrawals") \
        else [w for w in wc.WITHDRAWALS if w.get("active", True)]
    names = sorted(n for w in active for n in w["names"])
    retired = len(wc.WITHDRAWALS) - len(active)
    if traces:
        shown = "; ".join("%s:%d %s" % t for t in traces[:6])
        if len(traces) > 6:
            shown += " (+%d more)" % (len(traces) - 6)
        check("no withdrawn contributor name survives", False, shown)
        return
    check("no withdrawn contributor name survives", True,
          "%d withdrawn name forms, 0 occurrences outside the register%s"
          % (len(names),
             "" if not retired else
             "; %d entry/entries retired (reinstated by the owner) and not "
             "scanned" % retired))


# The honor roster's header comment states its composition. A comment is not a
# constant, so the hand-written-count check cannot see it, and it went stale the
# moment an entry was withdrawn: it still claimed 34 entries and 16 detection
# honorees after the count moved to 36 and 15.
HONOR_COMPOSITION_RE = re.compile(
    r"^// (\d+) entries: (\d+) public-records \+ (\d+) detection \+ (\d+) records-review"
    r"(?: \+ (\d+) methodology)?(?: \+ (\d+) employment)?\.",
    re.M)


def check_honor_roster_composition(offline):
    """api/honor.js's stated composition must match the roster it sits above."""
    body = read("api/honor.js")
    if not body:
        check("honor roster composition matches its own comment", False,
              "api/honor.js is unreadable")
        return
    m = HONOR_COMPOSITION_RE.search(body)
    if not m:
        check("honor roster composition matches its own comment", False,
              "the composition comment is gone; restore it or drop this check")
        return
    gs = m.groups()
    claimed_total, claimed_pr, claimed_det, claimed_rr = (int(x) for x in gs[:4])
    # METHODOLOGY IS A REAL HONOREE AND MUST BE COUNTED. It is optional in the
    # pattern only so the check still parses a roster written before the
    # category existed; absent means zero, never means ignore.
    claimed_meth = int(gs[4]) if len(gs) > 4 and gs[4] else 0
    # EMPLOYMENT IS A REAL HONOREE BUCKET, added 2026-08-21 with H-2026-39.
    # Optional in the pattern only so a roster written before the category
    # existed still parses; absent means zero, never means ignore.
    claimed_emp = int(gs[5]) if len(gs) > 5 and gs[5] else 0

    start = body.index("const ROSTER = {")
    i = body.index("{", start)
    depth = 0
    for j in range(i, len(body)):
        if body[j] == "{":
            depth += 1
        elif body[j] == "}":
            depth -= 1
            if depth == 0:
                break
    block = body[i:j + 1]
    # NO SYNTHETIC ROW MAY ENTER THIS COUNT. A demonstration key was added to
    # api/honor.js on 2026-08-18 and stripped again before production deploy,
    # because a fake honoree in the live roster is a record recognising nobody.
    # The exclusion is kept as a standing rule rather than removed with the row:
    # if a synthetic key is ever reintroduced, the stated composition must not
    # silently absorb it.
    block = re.sub(r"^  '(?:selftest\d*|test\w*)': \{.*?^  \},\n", "", block,
                   flags=re.M | re.S)
    keys = re.findall(r"^  '[a-z0-9]{10}': \{", block, re.M)
    studies = re.findall(r"^    study: '([a-z-]+)'", block, re.M)
    actual = {
        "total": len(keys),
        "public-records": studies.count("public-records"),
        "detection": studies.count("detection"),
        "records-review": studies.count("records-review"),
        "methodology": studies.count("methodology"),
        "employment": studies.count("employment"),
    }
    claimed = {
        "total": claimed_total,
        "public-records": claimed_pr,
        "detection": claimed_det,
        "records-review": claimed_rr,
        "methodology": claimed_meth,
        "employment": claimed_emp,
    }
    bad = [k for k in claimed if claimed[k] != actual[k]]
    detail = ("%d entries: %d public-records + %d detection + %d records-review"
              " + %d methodology + %d employment"
              % (actual["total"], actual["public-records"],
                 actual["detection"], actual["records-review"],
                 actual["methodology"], actual["employment"]))
    if bad:
        detail = ("the comment says %r but the roster is %r; disagreeing on %s"
                  % (claimed, actual, ", ".join(sorted(bad))))
    check("honor roster composition matches its own comment", not bad, detail)


# Text on the JRS-R certificate path that would assert a credential the
# completion code does not prove. Each entry is a literal fragment plus the
# reason. Found 2026-08-16: the certificate said the holder "completed the
# six-module JRS Reviewer Training", the code is issued on submitting the
# evaluation, and the evaluation is reachable without enrolling in the training
# at all. The one person holding a rendered certificate had no training row.
CERT_OVERCLAIMS = [
    ("completed the six-module JRS Reviewer Training",
     "the JRS-R code proves an evaluation submission, not a training completion"),
    ("completed the JRS Reviewer Training",
     "same overclaim, share-snippet wording"),
    ("The certificate records that you completed the training and submitted",
     "same overclaim, reviewer landing boundary note"),
]

# THE CERTIFICATE OFFER IS OFF THE EVALUATION, 2026-08-18, on the owner's
# instruction: a certificate is issued for completing the training only.
#
# THE FIRST VERSION OF THE GUARD ABOVE MISSED THIS ENTIRELY. It listed three
# exact overclaim fragments and scanned reviewer/evaluation.html among its
# files, and the checkbox on that page read "Issue me a certificate for
# completing the training and this evaluation" the whole time. The fragment was
# not on the list, so the check passed while sitting on the offer itself. A
# blocklist only catches what somebody already thought of.
#
# This pair closes it from the other side: the control ids cannot come back, and
# the endpoint cannot issue a code. Neither depends on guessing the wording.
CERT_OFFER_CONTROLS = [
    ("want-cert", "the certificate opt-in checkbox on the evaluation"),
    ("cert-fields", "the certificate name and email block it revealed"),
    ("Issue me a certificate", "the checkbox label, in any wording"),
    ("what the certificate records", "copy tying the certificate to the evaluation"),
    ("it is what the certificate records", "same, reviewer landing step"),
]

CERT_OFFER_FILES = ["reviewer/evaluation.html", "access.html"]

CERT_PATH_FILES = [
    "api/reviewer-cert.js",
    "reviewer/index.html",
    "reviewer/completion.html",
    "reviewer/evaluation.html",
]


def check_certificate_claims_supported(offline):
    """The reviewer certificate may only assert what its code proves.

    A certificate is a record making a claim about a person. This programme
    exists to measure whether a record's claim is supported by the record, so a
    certificate of its own that overstates is not an irony, it is a defect of
    the exact class under study.

    api/reviewer-cert.js is credential-free by design and cannot look up a
    training completion, so it cannot condition on one. The only safe wording is
    the one bounded by what the JRS-R code proves: the evaluation submission.
    """
    hits = []
    for rel in CERT_PATH_FILES:
        body = read(rel)
        if not body:
            check("reviewer certificate claims only what the code proves", False,
                  "%s is unreadable" % rel)
            return
        for frag, why in CERT_OVERCLAIMS:
            # The correction note in api/reviewer-cert.js quotes the old wording
            # to say it was removed. Quoting it inside a comment that records the
            # removal is the opposite of asserting it.
            for idx in _all_indexes(body, frag):
                line_start = body.rfind("\n", 0, idx) + 1
                line = body[line_start:body.find("\n", idx)]
                if line.lstrip().startswith("//") or line.lstrip().startswith("#"):
                    continue
                hits.append("%s: %r (%s)" % (rel, frag[:46], why))
    check("reviewer certificate claims only what the code proves", not hits,
          "; ".join(hits) if hits
          else "%d files, no unsupported credential claim" % len(CERT_PATH_FILES))


def check_evaluation_offers_no_certificate(offline):
    """The evaluation must not offer a certificate, and the endpoint must refuse.

    The evaluation sits at the end of a public funnel: /api/support?c=rtkw and
    ?c=defend go to access.html, which links straight to it. A reader following
    an initiative link from LinkedIn could obtain a certificate without opening
    a single training module, and one did.

    Two independent conditions, because copy can be reworded and a control can
    be re-added under a different label:
      1. no certificate control or offer copy on the funnel pages, and
      2. api/reviewer-eval.js pins wantsCert false rather than reading the body.
    """
    hits = []
    for rel in CERT_OFFER_FILES:
        body = read(rel)
        if not body:
            check("the evaluation offers no certificate", False,
                  "%s is unreadable" % rel)
            return
        for frag, why in CERT_OFFER_CONTROLS:
            for idx in _all_indexes(body, frag):
                line_start = body.rfind("\n", 0, idx) + 1
                line = body[line_start:body.find("\n", idx)]
                stripped = line.lstrip()
                if stripped.startswith("//") or stripped.startswith("#"):
                    continue
                hits.append("%s: %r (%s)" % (rel, frag, why))

    api = read("api/reviewer-eval.js")
    if not api:
        check("the evaluation offers no certificate", False,
              "api/reviewer-eval.js is unreadable")
        return
    # STRUCTURE, NOT THE WHOLE LINE. Corrected 2026-09-17 by the second-order
    # check that followed X-5. The pattern required the assignment to be the
    # ENTIRE line, so appending a trailing comment to a CORRECTLY pinned
    # `const wantsCert = false;` failed the guard with the message "no longer
    # pins wantsCert to false" -- while it still did. That failure direction is
    # safe, but the message is false, and a guard that reports a defect which is
    # not there teaches the next reader to distrust it. Distrusted guards get
    # weakened. Matching the assignment itself keeps the real defect caught
    # (reading the value from the request body) without the false alarm.
    if not re.search(r"\bconst\s+wantsCert\s*=\s*false\s*;", api):
        hits.append("api/reviewer-eval.js no longer pins wantsCert to false, so "
                    "the endpoint can issue a completion code again")

    check("the evaluation offers no certificate", not hits,
          "; ".join(hits) if hits
          else "%d funnel pages clean, endpoint pins wantsCert false"
               % len(CERT_OFFER_FILES))


def _all_indexes(hay, needle):
    out, i = [], hay.find(needle)
    while i != -1:
        out.append(i)
        i = hay.find(needle, i + 1)
    return out


def check_printed_certificate_matches_endpoint(offline):
    """The handover PDF and the browser certificate must say the same thing.

    research/build_reviewer_eval_certificate.py parses BODY out of
    api/reviewer-cert.js instead of holding its own copy, so a person handed a
    printed certificate and a person who self-serves one cannot be told
    different things about what they did. This confirms the parse still
    resolves, because a silent parse failure is how the two would drift apart
    without anyone noticing.
    """
    if not _has_research():
        check("printed certificate wording matches the endpoint", SKIPPED,
              "research/ is not on this branch by design, so the builder is absent")
        return
    try:
        sys.path.insert(0, os.path.join(ROOT, "research"))
        import build_reviewer_eval_certificate as brec
    except Exception as e:
        check("printed certificate wording matches the endpoint", False,
              "research/build_reviewer_eval_certificate.py did not import: %r" % (e,))
        return
    src = read("api/reviewer-cert.js")
    if not src:
        check("printed certificate wording matches the endpoint", False,
              "api/reviewer-cert.js is unreadable")
        return
    try:
        body = brec.endpoint_body()
    except SystemExit:
        check("printed certificate wording matches the endpoint", False,
              "the BODY parse in build_reviewer_eval_certificate.py no longer "
              "resolves against api/reviewer-cert.js")
        return
    ok = bool(body) and body in src.replace("'\n           + '", "")
    inline = ("submitted the JRS reviewer evaluation" in body
              and "six-module" not in body)
    check("printed certificate wording matches the endpoint", bool(body) and inline,
          "%d chars, parsed from the endpoint, no training claim" % len(body)
          if inline else "parsed body carries an unsupported claim: %r" % body[:90])


# Cloudflare Pages artifacts. Deleted 2026-08-18 when the legacy pipeline was
# severed from this repository. Each entry is a path plus why it must not return.
CLOUDFLARE_ARTIFACTS = [
    ("functions/record.js",
     "Cloudflare Pages Function; was served publicly as a static file at "
     "/functions/record.js and binds a KV namespace this deployment lacks"),
    ("functions/results.js",
     "Cloudflare Pages Function; same KV binding, same dead pipeline"),
    ("_headers",
     "Cloudflare Pages and Netlify header format. Vercel ignores it and honours "
     "the headers block in vercel.json, so it reads as active policy while "
     "doing nothing"),
    ("wrangler.toml", "no wrangler config has ever existed here"),
    ("wrangler.json", "no wrangler config has ever existed here"),
    ("wrangler.jsonc", "no wrangler config has ever existed here"),
    ("_worker.js", "Cloudflare Workers advanced-mode entry point"),
    ("_routes.json", "Cloudflare Pages routing manifest"),
]


def check_no_cloudflare_artifacts(offline):
    """No Cloudflare Pages or Workers artifact is back in the repository.

    Severed on 2026-08-18. The risk is not that any of these does damage on
    Vercel; it is that they read as live configuration and do nothing.
    _headers in particular declares no-store on every HTML page and Vercel
    never applied one line of it, so anyone reading the repo would conclude
    the caching policy was set when it was not.

    THIS DOES NOT STOP THE FAILING WORKERS BUILD ON PULL REQUESTS. That build
    comes from a Cloudflare-to-GitHub integration held in the Cloudflare
    dashboard, outside this repository. Only disconnecting it there stops it.
    This check exists so the repository side stays severed, not to fix the
    dashboard side.
    """
    back = []
    for rel, why in CLOUDFLARE_ARTIFACTS:
        if os.path.exists(os.path.join(ROOT, rel)):
            back.append("%s is back (%s)" % (rel, why))
    fn = os.path.join(ROOT, "functions")
    if os.path.isdir(fn) and os.listdir(fn):
        back.append("functions/ exists again with %d entries" % len(os.listdir(fn)))
    check("no Cloudflare Pages artifact is back", not back,
          "; ".join(back) if back
          else "%d paths checked, all absent" % len(CLOUDFLARE_ARTIFACTS))


# ---------------------------------------------------------------- COMMERCIAL SURFACE
#
# Added 2026-08-25. Four guards over the commercial surface, each written because
# the defect it catches was actually found in this repository on that date, not
# because it is theoretically possible.

# Pages that are OPEN for commerce and must therefore stay reachable.
# Narrowed on 2026-09-04: the three request pages were retired with the
# founder-service layer, so requiring an inbound link and a sitemap entry for
# them would now enforce the funnel the retirement removed. They move to
# RETIRED_COMMERCIAL_PAGES below, where the same guard asserts the opposite.
COMMERCIAL_PAGES = ("review-engine.html",)

# Retired 2026-09-04. These must stay unlinked and unlisted. The assertion is
# inverted rather than dropped, because an orphaned page is the exact condition
# the original 2026-08-25 finding was written about: it is only acceptable here
# because the page no longer takes money, and if one ever regains a funnel this
# must fail.
RETIRED_COMMERCIAL_PAGES = ("audit-request.html", "governance-request.html",
                            "calibration-request.html", "engagement.html")

# Framework names that may never appear on a page without a non-establishment
# clause in the same file. terms.html:139 already states in writing that JRS
# establishes compliance with none of them.
FRAMEWORK_NAMES = ("ISO/IEC 42001", "ISO 42001", "NIST AI RMF", "EU AI Act",
                   "AI Act Article 14")

# The phrases that count as an actual disclaimer. A page may use any of them.
NON_ESTABLISHMENT = ("does not establish compliance",
                     "does not establish legal or regulatory compliance",
                     "no framework requires",
                     # enterprise.html:295 reads "or a substitute for obligations
                     # under the EU AI Act". The first version of this list held
                     # "not a substitute for obligations", which never matched it
                     # and reported a compliant page as a compliance claim.
                     "substitute for obligations")


def check_no_price_literals_in_html(offline):
    """A price may exist in api/_offer-config.js and nowhere else.

    That file's own header calls a price "the worst possible place" for a value
    to drift, because a figure that says $250 on one surface and $500 on another
    is read by a buyer as either a mistake or a bait. Catching it in HTML is the
    only way the single-source property is actually enforced rather than merely
    intended.
    """
    pat = re.compile(r"\$\s?\d{2,5}(?:[.,]\d{2})?\b")
    hits = []
    for rel in _html_files():
        try:
            body = read(rel)
        except Exception:
            continue
        # Strip <style> and <script>, where a dollar sign is template syntax
        # rather than a price, and $ in a regex is not a currency symbol.
        body = re.sub(r"<style[^>]*>.*?</style>", " ", body, flags=re.S | re.I)
        body = re.sub(r"<script[^>]*>.*?</script>", " ", body, flags=re.S | re.I)
        for m in pat.finditer(body):
            hits.append("%s: %s" % (rel, m.group(0)))
    check("no price literal in any HTML file", not hits,
          "; ".join(sorted(set(hits))[:6]) if hits
          else "%d pages scanned, prices live only in api/_offer-config.js"
               % len(_html_files()))


def check_sitemap_no_duplicates(offline):
    """sitemap.xml carried 67 <loc> entries for 43 unique URLs on 2026-08-25.

    Canonical tags limited the ranking harm, but a duplicated sitemap wastes
    crawl budget and reads as unmaintained to anyone auditing the site.
    """
    try:
        sm = read("sitemap.xml")
    except Exception:
        check("sitemap has no duplicate <loc>", SKIPPED, "sitemap.xml not present")
        return
    locs = re.findall(r"<loc>([^<]+)</loc>", sm)
    dupes = sorted(set(u for u in locs if locs.count(u) > 1))
    check("sitemap has no duplicate <loc>", not dupes,
          "%d duplicated: %s" % (len(dupes), ", ".join(dupes[:3])) if dupes
          else "%d entries, all unique" % len(locs))


def check_commercial_pages_reachable(offline):
    """Every page that can take money must be linked from somewhere and listed.

    On 2026-08-25 all three request pages had ZERO inbound links from any page in
    the repository and were absent from sitemap.xml, while carrying 13 recorded
    purchase attempts. Demand was arriving through a door nobody had built.

    Narrowed 2026-09-04. Those three pages were retired with the founder-service
    layer and are now deliberately unlinked and unlisted, so the original
    assertion is kept for the pages still open for commerce and inverted for the
    retired ones. Both halves matter: an open page that goes dark is the 2026-08-25
    finding, and a retired page that regains a link or a sitemap entry is the
    2026-09-04 finding.
    """
    pages = _html_files()
    try:
        sm = read("sitemap.xml")
    except Exception:
        sm = ""
    orphans, unlisted = [], []
    for target in COMMERCIAL_PAGES:
        inbound = 0
        for rel in pages:
            if os.path.basename(rel) == target:
                continue
            try:
                if target in read(rel):
                    inbound += 1
            except Exception:
                continue
        if inbound == 0:
            orphans.append(target)
        if target not in sm:
            unlisted.append(target)
    check("every open commercial page has an inbound link", not orphans,
          "orphaned: " + ", ".join(orphans) if orphans
          else "%d page(s), all linked" % len(COMMERCIAL_PAGES))
    check("every open commercial page is in sitemap.xml", not unlisted,
          "missing: " + ", ".join(unlisted) if unlisted
          else "%d page(s), all listed" % len(COMMERCIAL_PAGES))

    # The inverse, for the pages retired on 2026-09-04.
    relinked, relisted = [], []
    for target in RETIRED_COMMERCIAL_PAGES:
        for rel in pages:
            if os.path.basename(rel) in RETIRED_COMMERCIAL_PAGES:
                continue
            try:
                if 'href="%s"' % target in read(rel) or 'href="/%s"' % target in read(rel):
                    relinked.append("%s <- %s" % (target, rel))
            except Exception:
                continue
        if target in sm:
            relisted.append(target)
    check("retired commercial pages stay unlinked and unlisted",
          not relinked and not relisted,
          "; ".join(relinked + ["listed again: " + t for t in relisted])
          if (relinked or relisted)
          else "%d retired page(s), 0 inbound links, 0 sitemap entries"
               % len(RETIRED_COMMERCIAL_PAGES))


def check_framework_names_qualified(offline):
    """A framework name without a non-establishment clause is a compliance claim.

    terms.html:139 states that JRS "does not establish compliance with the EU AI
    Act, NIST AI RMF, ISO/IEC 42001 or any other framework". A page that names one
    of those and omits the qualifier contradicts the site's own terms, which is a
    worse position than never mentioning the framework at all.
    """
    bad = []
    for rel in _html_files():
        try:
            body = read(rel)
        except Exception:
            continue
        named = [f for f in FRAMEWORK_NAMES if f in body]
        if not named:
            continue
        if not any(q in body for q in NON_ESTABLISHMENT):
            bad.append("%s (%s)" % (rel, named[0]))
    check("no framework name appears without a non-establishment clause", not bad,
          "; ".join(bad[:4]) if bad
          else "every page naming a framework carries the qualifier")


# Claims that assert or imply a certification, attestation or audit status this
# programme does not hold. Added 2026-08-25 after a directive asked for the site
# to market "SOC 2 bypass via architecture". No architecture bypasses SOC 2: it
# is an attestation about an organisation's controls, produced by an auditor.
# Publishing that phrase to a GRC buyer, who is the one audience certain to know
# it is false, would cost the credibility the rest of the site is built on.
#
# The defensible version is a SCOPE claim: an engine holding no records at rest
# narrows what a vendor security review has to examine. That wording is allowed;
# these are not.
FALSE_ASSURANCE = (
    "SOC 2 bypass", "SOC2 bypass", "bypass SOC 2", "bypasses SOC 2",
    "SOC 2 compliant", "SOC2 compliant", "SOC 2 certified",
    "ISO certified", "ISO 42001 certified", "ISO/IEC 42001 certified",
    "NIST certified", "AI Act compliant", "EU AI Act compliant",
    "GDPR compliant", "HIPAA compliant",
    "compliance guaranteed", "guarantees compliance",
    "pre-packaged compliance", "compliance out of the box",
)


def check_no_false_assurance_claims(offline):
    """No page may claim a certification, attestation or bypass that does not exist.

    This is the highest-consequence guard in the file. Every other drift here
    costs tidiness; this one costs the enterprise sale outright, because the
    reader is a compliance professional and the claim is checkable in seconds.
    """
    hits = []
    for rel in _html_files():
        try:
            body = read(rel)
        except Exception:
            continue
        low = body.lower()
        for phrase in FALSE_ASSURANCE:
            if phrase.lower() in low:
                hits.append("%s: %s" % (rel, phrase))
    check("no certification, attestation or bypass claim", not hits,
          "; ".join(hits[:5]) if hits
          else "%d pages scanned, %d phrases each" % (len(_html_files()), len(FALSE_ASSURANCE)))


def check_zero_retention_claim_is_true(offline):
    """A zero-retention claim on any page must match what the engines actually do.

    The claim is currently TRUE: api/review.js states no part of the submitted
    record is echoed back or logged, and logReview() in both engine routes stores
    the determination and per-condition results but no record text, after the
    first-200-characters field was removed on 2026-08-14 while the table held
    zero rows.

    If someone reinstates record-text storage, the marketing claim silently
    becomes false. This fails the build at that moment rather than at the moment
    a licensee's security team finds it.
    """
    claimed = []
    for rel in _html_files():
        try:
            body = read(rel).lower()
        except Exception:
            continue
        if ("no record text retained" in body or "zero retention" in body
                or "record text is assessed and discarded" in body):
            claimed.append(rel)

    retains = []
    for route in ("api/review-engine.js", "api/v1/review-engine.js"):
        try:
            src = read(route)
        except Exception:
            continue
        block = src[src.find("function logReview"):]
        block = block[:block.find("export default")] if "export default" in block else block
        # A body field assigned from the record text is the thing that breaks it.
        if re.search(r"(record_text|text_excerpt|excerpt|snippet)\s*:", block):
            retains.append(route)
        elif re.search(r":\s*text\b", block) or re.search(r"text\.slice\(", block):
            retains.append(route)

    if not claimed:
        check("zero-retention claim matches the code", SKIPPED,
              "no page currently makes the claim")
        return
    check("zero-retention claim matches the code", not retains,
          "CLAIMED on %d page(s) but record text is stored by: %s"
          % (len(claimed), ", ".join(retains)) if retains
          else "claimed on %d page(s); neither engine route stores record text"
               % len(claimed))


# ---------------------------------------------------------------- LOCKED DECISIONS
#
# Phillip locked these on 2026-08-25 after a pivot directive proposed reversing
# all three. They are enforced here rather than remembered, because the previous
# directive would have removed them silently and a decision that lives only in a
# chat log is a decision that gets undone by the next chat log.
#
#   1. Free training links, desk references and guide downloads stay visible.
#   2. Checkout and payment pathways stay active. Nobody is turned away.
#   3. sitemap.xml keeps the free material indexed and discoverable.

FREE_FUNNEL_TARGETS = ("training.html", "investigator-guides.html", "check.html")
LOCKED_SITEMAP_ENTRIES = ("training.html", "investigator-guides.html",
                          "check.html", "index.html")


def check_free_funnel_preserved(offline):
    """Item 1. The free top of funnel must remain reachable from the public site.

    It is not charity, it is the funnel: 245 PDF downloads, 195 kit downloads and
    105 guide downloads against 13 purchase attempts. Removing the free surface
    removes the only thing currently producing traffic.
    """
    pages = _html_files()
    missing = []
    for target in FREE_FUNNEL_TARGETS:
        inbound = 0
        for rel in pages:
            if os.path.basename(rel) == target:
                continue
            try:
                if target in read(rel):
                    inbound += 1
            except Exception:
                continue
        if inbound == 0:
            missing.append(target)
    check("free training and guide links stay reachable", not missing,
          "unreachable: " + ", ".join(missing) if missing
          else "%d free surfaces, all linked" % len(FREE_FUNNEL_TARGETS))


def check_checkout_path_active(offline):
    """Item 2. Every request page must still route a reader somewhere real.

    THE ORIGINAL FORM OF THIS CHECK required all three request pages to point
    at /api/checkout, and said so for a reason worth preserving: "a payment
    link being absent is a configuration gap; the PATH being removed is a
    decision, and this fails if anyone makes that decision quietly."

    THAT DECISION WAS MADE ON 2026-08-26, and not quietly. The revenue model
    collapsed to engine licensing alone: audit, governance and calibration
    were fixed-scope engagements consuming owner hours against a recorded
    weekly capacity of 10 to 15 hours, all three had an empty checkout_url,
    and none had ever taken a payment. The rationale is recorded in
    api/_offer-config.js above OFFERS and in research/MASTER_TRACKER.md.

    The purpose survives the change. A reader on one of those pages must
    still reach something that works, and the lead-capture machinery that
    catches enterprise buyers who cannot use a card must stay. Only the
    destination moved, from a checkout to the licensing inquiry.
    """
    try:
        ck = read("api/checkout.js")
    except Exception:
        check("checkout path is active", False, "api/checkout.js is missing")
        return

    pages = ("audit-request.html", "governance-request.html",
             "calibration-request.html")
    unrouted = []
    for page in pages:
        if not os.path.exists(os.path.join(ROOT, page)):
            unrouted.append("%s missing" % page)
            continue
        src = read(page)
        if "enterprise.html#enterprise-inquiry" not in src:
            unrouted.append("%s does not reach the inquiry" % page)

    has_capture = "checkout-fallback" in ck
    has_offer = "offerFor" in ck
    has_retired_route = "RETIRED OFFER GUARD" in ck

    bad = list(unrouted)
    if not has_capture:
        bad.append("lead capture removed from api/checkout.js")
    if not has_offer:
        bad.append("offer resolution removed from api/checkout.js")
    if not has_retired_route:
        bad.append("no route for a retired offer link")

    check("checkout path is active", not bad,
          "; ".join(bad) if bad
          else "%d/%d request pages route to the licensing inquiry, "
               "capture and retired-offer route intact" % (len(pages), len(pages)))

def check_sitemap_keeps_free_material(offline):
    """Item 3. The free material stays indexed.

    A sitemap trimmed to commercial pages deindexes the material that produces
    the traffic. Enterprise positioning does not require hiding the free work.
    """
    try:
        sm = read("sitemap.xml")
    except Exception:
        check("sitemap keeps free material indexed", SKIPPED, "sitemap.xml not present")
        return
    missing = [p for p in LOCKED_SITEMAP_ENTRIES if p not in sm and p != "index.html"]
    if "index.html" in LOCKED_SITEMAP_ENTRIES:
        # The homepage is listed as the bare domain rather than as index.html.
        if "<loc>https://www.jrsstandard.com/</loc>" not in sm:
            missing.append("homepage")
    check("sitemap keeps free material indexed", not missing,
          "missing: " + ", ".join(missing) if missing
          else "%d free surfaces indexed" % len(LOCKED_SITEMAP_ENTRIES))


# Mail provider keys, added 2026-08-25 with api/_notify.js. Same rule as
# ANTHROPIC_API_KEY: the key lives in the server environment and never in a
# committed file. A leaked transactional key lets anyone send mail as this
# domain, which is a deliverability and impersonation problem, not just a bill.
SECRET_PATTERNS = (
    (r"re_[A-Za-z0-9]{16,}", "Resend API key"),
    (r"SG\.[A-Za-z0-9_-]{20,}", "SendGrid API key"),
    (r"sk-ant-[A-Za-z0-9_-]{20,}", "Anthropic API key"),
    (r"eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.", "JWT / service-role key"),
)


def check_no_secrets_in_source(offline):
    """No provider secret may appear in any committed file.

    Scans api/, scripts/ and every HTML page. The publishable Supabase anon key
    is deliberately not matched: it is designed to be public and is already in
    api/*.js by design.
    """
    targets = []
    for sub in ("api", "scripts"):
        base = os.path.join(ROOT, sub)
        if not os.path.isdir(base):
            continue
        for b, dirs, files in os.walk(base):
            dirs[:] = [d for d in dirs if d != "__pycache__"]
            for fn in files:
                if fn.endswith((".js", ".py", ".mjs", ".sh")):
                    targets.append(os.path.relpath(os.path.join(b, fn), ROOT))
    targets += _html_files()

    hits = []
    for rel in sorted(set(targets)):
        try:
            body = read(rel)
        except Exception:
            continue
        for pat, label in SECRET_PATTERNS:
            m = re.search(pat, body)
            if m:
                hits.append("%s: %s" % (rel, label))
    check("no provider secret in any committed file", not hits,
          "; ".join(hits[:4]) if hits
          else "%d files scanned, %d patterns each" % (len(set(targets)), len(SECRET_PATTERNS)))


def check_alerts_disabled(offline):
    """Email alerts must stay OFF. Owner directive, 2026-08-25.

    "The owner relies exclusively on the dashboard for leads. Do NOT configure or
    send email alerts."

    The switch is a single constant in api/_notify.js, checked here rather than
    trusted, and the guard also asserts the early return actually precedes any
    key read. A flag that is set but not honoured is worse than no flag.
    """
    try:
        src = read("api/_notify.js")
    except Exception:
        check("email alerts are disabled", SKIPPED, "api/_notify.js not present")
        return
    flag_off = re.search(r"const\s+ALERTS_ENABLED\s*=\s*false", src) is not None
    guarded = "if (!ALERTS_ENABLED)" in src
    # The early return must come before the first environment read inside notify().
    body = src[src.find("export async function notify("):]
    body = body[:body.find("export function notifyConfigured")] if "export function notifyConfigured" in body else body
    ret = body.find("alerts_disabled_by_owner_directive")
    envread = body.find("RESEND_API_KEY")
    ordered = ret != -1 and (envread == -1 or ret < envread)
    check("email alerts are disabled", flag_off and guarded and ordered,
          "ALERTS_ENABLED=false, guarded, and the return precedes any key read"
          if (flag_off and guarded and ordered)
          else "flag=%s guarded=%s ordered=%s" % (flag_off, guarded, ordered))


def check_notifications_wired(offline):
    """Every lead-capture endpoint must store first, then attempt any alert.

    A capture endpoint that stores silently is what produced thirteen unnoticed
    purchase attempts. The wiring is kept even though alerts are disabled: it
    documents the intent, and the kill switch in api/_notify.js is what enforces
    the directive. What matters here is ORDER, which stays correct whether alerts
    are on or off, so a future re-enable cannot introduce a lost lead.
    """
    unwired = []
    for rel in ("api/checkout.js", "api/enterprise-inquiry.js"):
        try:
            body = read(rel)
        except Exception:
            unwired.append(rel + " (missing)")
            continue
        if "_notify.js" not in body or "notify(" not in body:
            unwired.append(rel)
            continue
        # The alert must not precede the insert it is alerting about.
        first_notify = body.find("await notify(")
        first_insert = body.find("pilot_contacts")
        if first_notify != -1 and first_insert != -1 and first_notify < first_insert:
            unwired.append(rel + " (alerts before storing)")
    check("lead capture raises an alert, after storing", not unwired,
          "; ".join(unwired) if unwired
          else "checkout and enterprise inquiry both wired to api/_notify.js")


# WHERE THE DUAL-TRACK BAND BELONGS, AND WHERE IT ARGUES AGAINST THE PAGE.
#
# The band offers a reader a choice between two tracks. That is useful where the
# choice is still open. It is not useful on the pages whose entire job is Track
# 1: a visitor who pressed Enterprise has already chosen, and half the band then
# tells them the whole thing is "Free, ungated, and staying that way", which
# argues against the page it sits on.
#
# Removed from enterprise.html and review-engine.html, then from pilot.html on
# 2026-08-26 at the owner's objection. It was originally placed on enterprise.html at his own
# direction; the direction changed and the guard follows it rather than
# outranking it. BANNED there now, so it cannot drift back.
DUAL_TRACK_PAGES = ("index.html", "training.html")
DUAL_TRACK_BANNED = ("enterprise.html", "review-engine.html", "pilot.html",
                     "org-pilot.html")


def check_dual_track_band(offline):
    """The dual-track band must exist on all five core pages and be identical.

    Five hand-editable copies of the same positioning is the defect the panel
    binder already taught this repository: they drift, and the drift is invisible
    because nobody reads five pages side by side. Identical copies also mean the
    Track 2 promise, that guides and training stay free, cannot quietly weaken on
    one page while holding on the others.
    """
    pat = re.compile(r"<!-- JRS DUAL TRACK v1.*?<!-- /JRS DUAL TRACK v1 -->", re.S)
    found = {}
    for p in DUAL_TRACK_PAGES:
        try:
            blocks = pat.findall(read(p))
        except Exception:
            blocks = []
        if blocks:
            found[p] = blocks
    missing = [p for p in DUAL_TRACK_PAGES if p not in found]
    many = [p for p, v in found.items() if len(v) != 1]
    texts = set(b for v in found.values() for b in v)
    ok = not missing and not many and len(texts) == 1
    check("dual-track band present and identical on core pages", ok,
          "%d pages, 1 identical block each" % len(found) if ok
          else "missing: %s; duplicated: %s; distinct texts: %d"
               % (", ".join(missing) or "none", ", ".join(many) or "none", len(texts)))

    # PLACEMENT, not just presence. Measured against visible text with script and
    # style stripped, because a band buried below the fold is a band nobody sees.
    #
    # training.html IS DELIBERATELY EXEMPT FROM THE TOP-OF-PAGE RULE, 2026-08-25.
    # On that page the band is not a positioning statement, it is an obstacle.
    # It sat between the headline and the first module and, on a 390px phone,
    # filled a screen and a half of enterprise licensing copy in front of a
    # reader who had come for the six free modules. The owner opened the page,
    # saw B2B API copy where the training should be, and reported it broken.
    #
    # The band still has to be there and still has to be byte-identical, which
    # the check above enforces. On this one page it must sit AFTER the module
    # list instead of before it, and that ordering is asserted below rather than
    # left to whoever edits the file next.
    TRAINING_EXEMPT = "training.html"
    buried = []
    for p in DUAL_TRACK_PAGES:
        if p == TRAINING_EXEMPT:
            continue
        try:
            body = read(p)
        except Exception:
            continue
        if "<body" not in body:
            continue
        vis = body[body.index("<body"):]
        vis = re.sub(r"<script.*?</script>|<style.*?</style>", " ", vis, flags=re.S)
        vis = re.sub(r"<[^>]+>", " ", vis)
        vis = re.sub(r"\s+", " ", vis)
        i = vis.find("The Enterprise Platform Track")
        if i < 0:
            buried.append("%s (absent)" % p)
        elif len(vis) and (100.0 * i / len(vis)) > 12.0:
            buried.append("%s (%.1f%% down)" % (p, 100.0 * i / len(vis)))
    check("dual-track band sits near the top of each page", not buried,
          "; ".join(buried) if buried
          else "all %d pages place it within the first 12%% of visible text "
               "(training.html exempt, see below)"
               % (len(DUAL_TRACK_PAGES) - 1))

    # The exemption is not a free pass. On training.html the band must come
    # AFTER the modules, which is the whole point of exempting it.
    tsrc = read(TRAINING_EXEMPT)
    i_mod = tsrc.find('id="module-list"')
    i_band = tsrc.find("The Enterprise Platform Track")
    check("on training.html the dual-track band sits after the modules",
          i_mod > 0 and i_band > i_mod,
          "module-list=%d band=%d" % (i_mod, i_band))

    # Track 2 is a promise, not decoration. If the band ever stops saying the
    # public material is free, that is a reversal of a locked decision.
    if texts:
        body = next(iter(texts))
        check("dual-track band still promises the free public track",
              "Free, ungated, and staying that way" in body,
              "Track 2 language intact" )
    else:
        check("dual-track band still promises the free public track", False,
              "no band found")

    # The ban is asserted, not assumed. A block that is merely absent today can
    # be pasted back tomorrow by anyone reading the other four pages.
    intruders = [p for p in DUAL_TRACK_BANNED
                 if "The Enterprise Platform Track" in read(p)]
    check("dual-track band stays off the Track 1 pages", not intruders,
          ", ".join(intruders) if intruders
          else "absent from %s" % ", ".join(DUAL_TRACK_BANNED))


# Internal-voice copy that must never reach a public page. Owner constraints,
# 2026-08-25. Each entry was actually present in supplied copy on that date and
# was removed, so this list is a record of what happened rather than a
# precaution against the hypothetical.
#
# REVISIT WHEN: the pricing entries below are STAGE-DEPENDENT, not permanent.
# They hold because nothing has yet transacted on this ladder, so a published
# band would be a number with no reference behind it and every negotiation
# would open at its bottom. The condition that ends them is a CLOSED LICENCE
# that can be pointed at. When there is one, publish the band, delete the three
# pricing entries from this table, and update
# check_no_custom_pricing_estimator_returns, which currently asserts that
# no currency figure appears on enterprise.html. The other entries in this
# table are not stage-dependent and stay.
INTERNAL_VOICE = (
    # Pricing floors. Publishing a band means every negotiation opens at its
    # bottom, and these sat above a ladder on which nothing has ever sold.
    ("$7,500", "licence pricing floor"),
    ("$15,000", "licence pricing floor"),
    ("$40,000", "ARR band"),
    # Internal capacity. Reads to an enterprise buyer as key-person risk.
    ("10 to 15 hours", "internal bandwidth"),
    ("weekly time commitment", "internal bandwidth"),
    ("key-person", "internal capacity framing"),
    # Describing the free track as a lure, to the audience it describes.
    ("Trojan Horse", "free-track framed as a lure"),
    ("trojan horse", "free-track framed as a lure"),
    # The security-audit avoidance claim, in every phrasing seen so far.
    ("triggering complex security compliance audits", "audit-avoidance claim"),
    ("without triggering", "audit-avoidance claim"),
    ("avoids security review", "audit-avoidance claim"),
    ("no security review", "audit-avoidance claim"),
)


def check_no_internal_voice_copy(offline):
    """No public page may carry internal strategy language.

    This catches the class that check_no_false_assurance_claims missed: the
    audit-avoidance claim written as "without triggering complex security
    compliance audits" rather than as "SOC 2 bypass". That gap was found by
    reading supplied copy, not by the guard, which is the reason the guard now
    matches phrasing as well as branded terms.
    """
    hits = []
    for rel in _html_files():
        try:
            body = read(rel)
        except Exception:
            continue
        for phrase, why in INTERNAL_VOICE:
            if phrase in body:
                hits.append("%s: %s (%s)" % (rel, phrase, why))
    check("no internal strategy language on any public page", not hits,
          "; ".join(hits[:5]) if hits
          else "%d pages scanned, %d phrases each"
               % (len(_html_files()), len(INTERNAL_VOICE)))


def check_retention_claim_is_scoped(offline):
    """Wherever zero retention is claimed, the scope limit must sit with it.

    "No data at rest" narrows a vendor security review; it does not remove one.
    Stating the first without the second is the claim the owner ruled out, and
    separating them by a page is the same thing as omitting the second.
    """
    bad = []
    for rel in _html_files():
        try:
            body = read(rel)
        except Exception:
            continue
        claims = ("no data at rest" in body.lower()
                  or "zero data retention at rest" in body.lower())
        if not claims:
            continue
        scoped = ("does not remove the review" in body
                  or "does not remove the assessment" in body
                  or "not a substitute for any certification" in body)
        if not scoped:
            bad.append(rel)
    check("zero-retention claims carry their scope limit", not bad,
          "unscoped on: " + ", ".join(bad) if bad
          else "every page claiming it also states what it does not do")


def check_robots_directives_coherent(offline):
    """No page may carry two robots directives, or noindex plus a sitemap entry.

    Both defects were live on 2026-08-25 and both were invisible from either
    surface alone. Three request pages carried BOTH index,follow and
    noindex,nofollow, so they behaved as noindex while the source read as
    indexable. Four pages sat in sitemap.xml while carrying noindex, which the
    2026-08-15 withdrawal commit had explicitly avoided: "A noindex page in a
    sitemap asks to be crawled and then asks not to be indexed."

    The second defect was mine. I added the sitemap entries on 2026-08-25 without
    checking the robots tag, which is how a deliberate withdrawal got half
    reversed without anyone deciding to reverse it.
    """
    try:
        sm = read("sitemap.xml")
    except Exception:
        sm = ""
    dupes, conflicts = [], []
    for rel in _html_files():
        try:
            body = read(rel)
        except Exception:
            continue
        tags = re.findall(r'<meta name="robots" content="([^"]+)"', body)
        if len(set(tags)) > 1:
            dupes.append("%s (%s)" % (rel, " AND ".join(sorted(set(tags)))))
        if any("noindex" in t for t in tags) and os.path.basename(rel) in sm:
            conflicts.append(rel)
    check("one unambiguous robots directive per page", not dupes,
          "; ".join(dupes[:4]) if dupes else "no page carries conflicting directives")
    check("no noindex page sits in the sitemap", not conflicts,
          "; ".join(conflicts[:4]) if conflicts
          else "sitemap membership agrees with every robots directive")


def check_style_tags_balanced(offline):
    """A page must not carry a nested or orphaned <style> tag.

    Found live on 2026-08-25 on audit-request, governance-request and
    calibration-request, and pre-existing in HEAD: each opened <style> twice.
    <style> cannot nest, so the browser closed the element at the first
    </style> and rendered everything after it, roughly thirty lines of CSS, as
    VISIBLE TEXT on the page. Those three surfaces carry every recorded
    purchase attempt on this site.

    Nothing in the grader or the link checker could see it, because the markup
    was well formed by tag count and every link resolved. Only counting opens
    against closes catches it.
    """
    bad = []
    for rel in _html_files():
        try:
            body = read(rel)
        except Exception:
            continue
        opens = [m.start() for m in re.finditer(r"<style[^>]*>", body)]
        closes = [m.start() for m in re.finditer(r"</style>", body)]
        if len(opens) != len(closes):
            bad.append("%s (%d open, %d close)" % (rel, len(opens), len(closes)))
            continue
        for i in range(len(opens) - 1):
            nxt = [c for c in closes if c > opens[i]]
            if nxt and opens[i + 1] < nxt[0]:
                bad.append("%s (nested <style>)" % rel)
                break
    check("no nested or orphaned <style> tag", not bad,
          "; ".join(bad[:4]) if bad
          else "%d pages, every <style> opened and closed once" % len(_html_files()))


def check_training_is_ungated(offline):
    """The training must open to a cold visitor with nothing in front of it.

    The owner gives the training and the guides away free and has said so
    repeatedly. Until 2026-08-25 training.html still put a full-screen
    "By invitation" overlay in front of every visitor who arrived without a
    code, and locked modules 2 to 6 behind a registration form. A wall in front
    of a thing you are giving away costs you the audience without earning
    anything, and it contradicts the copy on the pages that link to it.

    This guard fails if any part of that wall comes back:

      1. the by-invitation overlay element,
      2. a code table used to DECIDE access rather than to label a channel,
      3. the preview lock that sent later modules to the registration form,
      4. the retired jrs-training-access localStorage key.

    Channel attribution is deliberately NOT checked against, because
    ?access= links already handed out must keep tagging their source. The
    distinction this guard enforces is between a code that labels and a code
    that admits.
    """
    src = read("training.html")
    if not src:
        check("training.html is readable", False, "file missing or empty")
        return

    check("no by-invitation overlay in training.html",
          'id="gate-overlay"' not in src,
          "gate-overlay element is present" if 'id="gate-overlay"' in src else "absent")

    # A code table is fine as a label map. It is not fine as a gate, and the
    # tell is the old name plus a granted flag driven by it.
    gate_shapes = [
        "ACCESS_CODES",
        "granted = true",
        "granted = false",
        "stored.granted",
    ]
    present = [g for g in gate_shapes if g in src]
    check("no access-granting logic in training.html",
          not present,
          ("found " + ", ".join(present)) if present else "channel attribution only")

    check("no module is locked behind registration",
          "_jrsPreview && idx" not in src,
          "preview lock re-added" if "_jrsPreview && idx" in src else "all six modules open")

    # The key went with the wall. A write would mean the wall's state machine
    # is being rebuilt around it.
    check("retired jrs-training-access key is not written",
          "setItem('jrs-training-access'" not in src
          and 'setItem("jrs-training-access"' not in src,
          "key write re-added" if "setItem('jrs-training-access'" in src else "absent")

    # The offer must survive too. Removing the wall is only correct if the
    # certificate can still be claimed, which needs a name.
    check("certificate registration is still reachable",
          'id="enroll-overlay"' in src and "openEnroll()" in src,
          "enroll overlay and its trigger present")


def check_training_modules_are_findable(offline):
    """The six modules must be near the top of training.html, not buried.

    On 2026-08-25 the by-invitation overlay was removed so the training would be
    open to everyone. It was, and the page still read as broken: the modules sat
    18,870 CSS px down, below the hero, the dual-track band, the simulation
    cards, the role paths, the simulator, the record workspace, the poll and the
    kit documents. The wall had been hiding that ordering, so removing the wall
    turned a hidden problem into a visible one. The owner's report was "the
    training modules are gone".

    Depth is measured against VISIBLE text with script and style stripped, the
    same method check_dual_track_band uses, because a section's position in the
    source says nothing about where a reader meets it.
    """
    src = read("training.html")
    if not src or "<body" not in src:
        check("training.html is readable", False, "file missing or has no body")
        return

    vis = src[src.index("<body"):]
    vis = re.sub(r"<script.*?</script>|<style.*?</style>", " ", vis, flags=re.S)
    vis = re.sub(r"<[^>]+>", " ", vis)
    vis = re.sub(r"\s+", " ", vis)

    # Anchored on Module 1's outcome line, which appears exactly once and only
    # inside the module list. The heading text "Training Modules" is NOT usable:
    # it also appears as a jump link in the Start Here bar, so measuring it
    # reported the section as near the top while the section itself was 18,870px
    # down. That false pass was observed on the pre-fix file.
    NEEDLE = "By the end you can test any record against the five conditions"
    i = vis.find(NEEDLE)
    pct = (100.0 * i / len(vis)) if (i >= 0 and len(vis)) else -1.0
    check("training modules sit near the top of training.html",
          0 <= pct <= 12.0,
          "absent from visible text" if i < 0 else "%.1f%% down" % pct)

    # Source order, checked separately: the modules block must precede the role
    # paths and the simulator, which is what pushed it down in the first place.
    im = src.find('id="training-modules"')
    ir = src.find('id="roles"')
    isim = src.find('id="simulator"')
    check("modules block precedes the role paths and the simulator",
          im >= 0 and ir > im and isim > im,
          "modules=%d roles=%d simulator=%d" % (im, ir, isim))

    # A reader who lands at the very top must have one obvious way in.
    check("a hero call to action points at the modules",
          '<a href="#training-modules" class="btn-hero-primary"' in src,
          "primary hero CTA targets #training-modules")

    # The sticky nav is the other way in, and it must not contradict the order
    # of the page it navigates.
    nav = src.find('class="sticky-nav"')
    if nav < 0:
        check("sticky nav lists the modules first", False, "no sticky nav found")
    else:
        seg = src[nav:nav + 900]
        first = re.search(r'<a href="#([a-z-]+)" class="sticky-nav-link"', seg)
        check("sticky nav lists the modules first",
              bool(first) and first.group(1) == "training-modules",
              "first link is #%s" % (first.group(1) if first else "none"))


def check_dual_track_phone_compaction(offline):
    """The band must be compacted on phones, identically, on every page that
    carries it.

    It leads TEN pages, not the five the identity check names. On a 390px phone
    each card ran about twenty lines, so ten pages opened with roughly a screen
    and a half of enterprise licensing copy before their own content. The owner
    reported it as "All sections now begin with this".

    The block itself is untouched, because it is compared for byte identity and
    carries the Track 2 free promise. Only the phone rendering is compacted, and
    that compaction must be the same everywhere or the ten pages drift apart the
    way five hand-edited copies of the block would.

    THE FREE PROMISE IS NOT WHAT GETS CUT. The rule hides the second paragraph
    of the ENTERPRISE card only. Hiding Track 2's second paragraph would delete
    "Free, ungated, and staying that way" while keeping the sales pitch, which
    is the wrong half to cut, so the guard asserts the rule does not target the
    public card.
    """
    import glob
    pages = []
    for p in sorted(glob.glob(os.path.join(ROOT, "*.html"))):
        rel = os.path.relpath(p, ROOT)
        if "JRS DUAL TRACK v1" in read(rel):
            pages.append(rel)

    MARKER = "/* JRS DUAL TRACK :: PHONE COMPACTION v1 */"
    END = "/* /JRS DUAL TRACK :: PHONE COMPACTION v1 */"
    missing, blocks = [], set()
    for p in pages:
        src = read(p)
        i, j = src.find(MARKER), src.find(END)
        if i < 0 or j < 0 or j < i:
            missing.append(p)
            continue
        blocks.add(src[i:j + len(END)])

    check("dual-track phone compaction present on every page carrying the band",
          not missing,
          "missing on: %s" % ", ".join(missing) if missing
          else "%d pages carry the band, all compacted" % len(pages))

    check("dual-track phone compaction is identical everywhere",
          len(blocks) <= 1,
          "%d distinct compaction blocks" % len(blocks))

    if blocks:
        rule = next(iter(blocks))
        check("compaction hides the enterprise detail, not the free promise",
              ".dt-enterprise .dt-body:nth-of-type(n+2){display:none}" in rule
              and ".dt-public .dt-body" not in rule,
              "targets the enterprise card only")


def check_inline_scripts_parse(offline):
    """Every inline script on every page must parse.

    On 2026-08-25 a rendered-page audit found three pages serving almost nothing:
    coauthor.html rendered 24 characters of text and no heading, contributor.html
    175, honor.html 195. The cause was the same on all three: a `</main>` tag had
    been inserted INSIDE a JavaScript string literal, breaking the string across
    a newline, so the whole script failed to parse and nothing on the page ran.

    coauthor.html is the co-author confirmation form. Its links were already live
    and had been sent to three people. Every source checker in this repository
    passed the whole time, because a broken string is still valid-looking HTML.

    Parsing is delegated to node --check, which is the same parser a browser
    uses in spirit and does not need the page to load. Script blocks with a
    non-JavaScript type, notably application/ld+json, are skipped: they are data,
    not code, and feeding JSON to a JavaScript parser produces a false failure.
    That false failure was observed on decision-reconstruction-risk.html the
    first time this ran.
    """
    import glob
    import subprocess
    import tempfile

    JS_TYPES = ("", "text/javascript", "application/javascript", "module")
    pages = []
    for pat in ("*.html", "*/*.html", "*/*/*.html"):
        for p in glob.glob(os.path.join(ROOT, pat)):
            rel = os.path.relpath(p, ROOT)
            if rel.split(os.sep)[0] in ("research", "templates", "scripts",
                                        "node_modules"):
                continue
            pages.append(rel)
    pages = sorted(set(pages))

    broken, blocks = [], 0
    for rel in pages:
        src = read(rel)
        for i, m in enumerate(re.finditer(
                r"<script([^>]*)>(.*?)</script>", src, re.S)):
            attrs, body = m.group(1), m.group(2)
            if re.search(r"\bsrc\s*=", attrs):
                continue
            t = re.search(r'type\s*=\s*["\']([^"\']+)["\']', attrs)
            if t and t.group(1).strip().lower() not in JS_TYPES:
                continue
            if not body.strip():
                continue
            blocks += 1
            fh = tempfile.NamedTemporaryFile("w", suffix=".js", delete=False,
                                             encoding="utf-8")
            fh.write(body)
            fh.close()
            try:
                r = subprocess.run(["/opt/node22/bin/node", "--check", fh.name],
                                   capture_output=True, text=True, timeout=20)
            except Exception as e:
                check("inline scripts parse", SKIPPED, "node unavailable: %r" % (e,))
                return
            finally:
                try:
                    os.unlink(fh.name)
                except Exception:
                    pass
            if r.returncode != 0:
                msg = [l for l in r.stderr.strip().split("\n")
                       if "SyntaxError" in l]
                broken.append("%s block %d: %s"
                              % (rel, i, (msg[0] if msg else "parse failed")[:60]))

    check("every inline script on every page parses", not broken,
          "; ".join(broken[:4]) if broken
          else "%d script blocks across %d pages" % (blocks, len(pages)))


def check_nav_links_reach_their_section(offline):
    """No menu entry may land on the front page instead of what it names.

    index.html is a thirteen-panel tab switcher: every section is display:none
    until showSection() runs. A page that is not index.html cannot call that
    function, so ten nav links across enterprise.html, review-engine.html and
    pilot.html were written as a bare "index.html", or as an #section- fragment
    that does nothing because a fragment cannot open a hidden element. Whichever
    menu entry a reader pressed, they arrived at the homepage default panel.
    The owner's report: "Almost all links to menu are pulling up front page".

    Two things have to hold together, so both are checked. index.html must read
    the section out of the URL on load, and no nav link anywhere may point at a
    bare index.html. Either one alone leaves the defect in place.
    """
    import glob

    idx = read("index.html")
    check("index.html opens the section named in its URL",
          "OPEN A SECTION NAMED IN THE URL" in idx
          and "hashchange" in idx,
          "handler and hashchange listener present")

    # Every fragment a nav link points at must be a real section on index.html.
    sections = set(re.findall(r'id="section-([a-z0-9-]+)"', idx))
    bare, unknown = [], []
    for p in sorted(glob.glob(os.path.join(ROOT, "*.html"))):
        rel = os.path.relpath(p, ROOT)
        if rel == "index.html":
            continue
        src = read(rel)
        i = src.find('id="primary-nav-items"')
        if i < 0:
            continue
        nav = src[i:src.find("</nav>", i)]
        for m in re.finditer(r'<a\s[^>]*href="(index\.html[^"]*)"[^>]*>(.*?)</a>',
                             nav, re.S):
            href = m.group(1)
            label = re.sub(r"<[^>]+>|&[a-z]+;|&#\d+;", " ", m.group(2))
            label = re.sub(r"\s+", " ", label).strip().lower()
            if href == "index.html":
                # An entry actually LABELLED Home is supposed to reach the bare
                # homepage. The rule exists to catch an entry named for a
                # SECTION that lands on the front page instead. The first
                # version had no such carve-out and fired on the Home entry
                # added to jrsstandard.html, which is the one page that had no
                # way back to the site at all.
                if label in ("home", "jrs", "jrs™", ""):
                    continue
                bare.append("%s -> %s (%r)" % (rel, href, label[:22]))
            elif "#section-" in href:
                sid = href.split("#section-", 1)[1]
                if sid not in sections:
                    unknown.append("%s -> #section-%s" % (rel, sid))

    check("no nav link lands on the bare front page", not bare,
          "; ".join(bare) if bare else "every nav link names its destination")

    # THE NAV IS NOT THE ONLY PLACE THIS HAPPENS. Two links in the body of
    # enterprise.html were labelled "View Free Resources" and pointed at a bare
    # index.html, landing on the homepage default panel exactly as the nav
    # links did. The first version of this guard inspected only the nav and
    # could not see them. A link whose own text names a section must reach it.
    #
    # A bare index.html is still correct for a link that means "the home page":
    # the logo, and anything labelled Home. Those are listed rather than
    # pattern-matched, so a new offender cannot hide behind a vague rule.
    HOME_LABELS = ("jrs", "home", "jrs™", "jrs&trade;")
    SECTION_WORDS = {
        "free resources": "tools",
        "review resources": "tools",
        "documentation failures": "scenarios",
        "implementation": "guidance",
        "about": "about",
    }
    mislabelled = []
    for p in sorted(glob.glob(os.path.join(ROOT, "*.html"))):
        rel = os.path.relpath(p, ROOT)
        if rel == "index.html":
            continue
        src = read(rel)
        for m in re.finditer(r'<a\s[^>]*href="index\.html"[^>]*>(.*?)</a>', src, re.S):
            label = re.sub(r"<[^>]+>|&[a-z]+;|&#\d+;", " ", m.group(1))
            label = re.sub(r"\s+", " ", label).strip().lower()
            if not label or label in HOME_LABELS:
                continue
            for phrase, sid in SECTION_WORDS.items():
                if phrase in label:
                    mislabelled.append("%s: %r should reach #section-%s"
                                       % (rel, label[:34], sid))
                    break

    check("no body link names a section then lands on the front page",
          not mislabelled,
          "; ".join(mislabelled) if mislabelled
          else "every section-naming link reaches its section")
    check("every nav fragment matches a real section on index.html", not unknown,
          "; ".join(unknown) if unknown
          else "%d sections available" % len(sections))


def check_site_nav_present(offline):
    """Every public page must carry the same navigation bar.

    Measured on 2026-08-26: of 72 pages, SIX carried any navigation and 66
    carried none. On those 66 the only header links were the JRS wordmark and,
    in some footers, "Home", and both correctly go to the front page. So from
    almost anywhere on the site the only reachable destination WAS the front
    page. The owner reported it as "almost every link pulls up the home
    default panel", which is exactly what a missing menu looks like from the
    outside. Nothing was broken; there was nowhere to go.

    The bar is byte-identical wherever it appears, for the same reason the
    dual-track block is: a menu maintained separately on sixty pages drifts,
    and the drift is invisible because nobody reads sixty pages side by side.
    Pages under reference/ carry the same block with ../../ prefixes, so those
    are compared after normalising the prefix away rather than excused.

    The exclusion list is explicit. Private owner surfaces and personal
    key-gated pages must not carry public chrome, and the pages that already
    have a full menu do not need a second one.
    """
    import glob

    OPEN = "<!-- JRS SITE NAV v1"
    CLOSE = "<!-- /JRS SITE NAV v1 -->"
    EXCLUDE = {
        "programme-status-9872fb93cc94.html", "acquisition-9f3c2a7d4b.html",
        "vp-7c1f9a4e8d2b6035.html", "vp-7c1f9a4e8d2b6035.htm",
        "bench-admin.html", "coauthor.html", "honor.html", "contributor.html",
        "access.html", "people.html", "404.html", "index.html",
        "jrsstandard.html", "enterprise.html", "pilot.html",
        "review-engine.html", "training.html",
    }

    pages = []
    for pat in ("*.html", "*/*.html", "*/*/*.html"):
        for p in glob.glob(os.path.join(ROOT, pat)):
            rel = os.path.relpath(p, ROOT)
            if rel.split(os.sep)[0] in ("research", "templates", "scripts",
                                        "node_modules"):
                continue
            pages.append(rel)
    pages = sorted(set(pages))

    # Exclusion is by exact path, and by bare filename ONLY at the repository
    # root. Matching on basename anywhere silently excused all sixteen
    # reference/<slug>/index.html pages plus reviewer/index.html, because their
    # basename is index.html: the guard reported 38 of 55 and looked healthy
    # while quietly checking 17 fewer pages than exist. A denominator that
    # shrinks without saying so is the defect this file exists to catch.
    missing, blocks = [], set()
    carried = 0
    for rel in pages:
        at_root = os.sep not in rel
        if rel in EXCLUDE or (at_root and os.path.basename(rel) in EXCLUDE):
            continue
        src = read(rel)
        i, j = src.find(OPEN), src.find(CLOSE)
        if i < 0 or j < 0 or j < i:
            missing.append(rel)
            continue
        carried += 1
        blk = src[i:j + len(CLOSE)]
        # Normalise the relative prefix so a nested page compares equal.
        blk = blk.replace('href="../../', 'href="').replace('href="../', 'href="')
        blocks.add(blk)

    check("site nav present on every public page", not missing,
          "missing on: %s" % ", ".join(missing[:6]) if missing
          else "%d of %d pages carry it, the rest excluded by name"
               % (carried, len(pages)))

    check("site nav is byte-identical everywhere", len(blocks) <= 1,
          "%d distinct nav blocks" % len(blocks))

    # A menu whose entries do not resolve is worse than no menu.
    if blocks:
        nav = next(iter(blocks))
        targets = re.findall(r'href="([^"]+)"', nav)
        idx = read("index.html")
        sections = set(re.findall(r'id="section-([a-z0-9-]+)"', idx))
        broken = []
        for t in targets:
            t = t.replace("&amp;", "&")
            if t.startswith("/api/"):
                # An endpoint, not a file. Its token is checked against the
                # endpoint's own vocabulary rather than the filesystem: the
                # first version of this check looked for a file called
                # "/api/dl?e=standard&src=sitenav" and reported the Review
                # Controls PDF as broken while it was serving 326,013 bytes.
                q = t.split("?", 1)[1] if "?" in t else ""
                params = dict(p.split("=", 1) for p in q.split("&") if "=" in p)
                dl = read(os.path.join("api", "dl.js"))
                known = set(re.findall(r"(\w+):\s*'[^']+\.pdf'", dl))
                e = re.sub(r"[^a-z]", "", (params.get("e") or "").lower())
                aliases = {"std": "standard", "jrs": "standard"}
                if not t.startswith("/api/dl") or \
                   (aliases.get(e, e) not in known and e not in known):
                    broken.append(t)
            elif t.startswith("index.html#section-"):
                if t.split("#section-", 1)[1] not in sections:
                    broken.append(t)
            elif not os.path.exists(os.path.join(ROOT, t.split("#")[0])):
                broken.append(t)
        check("every site-nav destination resolves", not broken,
              ", ".join(broken) if broken
              else "%d destinations, all reachable" % len(targets))


def check_review_controls_is_the_pdf(offline):
    """A control labelled "Review Controls" must serve the standard PDF.

    index.html:950 carried this, as the FIRST entry in the primary menu:

        <button class="nav-item active" onclick="showSection('home')">Review Controls</button>

    On every other page a control with that exact label is /api/dl?e=standard,
    which serves JRS-Standard.pdf, 326,013 bytes, verified live. On the busiest
    page the same words opened the home panel instead. The owner pressed Review
    Controls, got the home default panel, and reported exactly that.

    Two words meaning two different things is not a naming quibble here: it is
    the difference between handing someone the standard and showing them the
    page they were already on.
    """
    import glob

    offenders = []
    checked = 0
    for pat in ("*.html", "*/*.html", "*/*/*.html"):
        for p in sorted(glob.glob(os.path.join(ROOT, pat))):
            rel = os.path.relpath(p, ROOT)
            if rel.split(os.sep)[0] in ("research", "templates", "scripts",
                                        "node_modules"):
                continue
            src = read(rel)
            # Only interactive controls, not prose that mentions the phrase.
            for m in re.finditer(
                    r"<(a|button)\b([^>]*)>\s*Review Controls\s*(?:PDF)?\s*</\1>", src):
                checked += 1
                attrs = m.group(2)
                href = re.search(r'href="([^"]+)"', attrs)
                target = href.group(1).replace("&amp;", "&") if href else ""
                if not target.startswith("/api/dl?e=standard"):
                    label = "showSection" if "showSection" in attrs else (target or "no href")
                    offenders.append("%s: Review Controls -> %s" % (rel, label))

    check("every Review Controls control serves the standard PDF",
          not offenders,
          "; ".join(offenders) if offenders
          else "%d controls, all pointing at /api/dl?e=standard" % checked)


def check_only_the_active_nav_item_is_gold(offline):
    """Gold in a menu must mean one thing: the entry you are on.

    It meant three. index.html carried the real rule,
    .nav-item.active{color:var(--accent)}, plus a permanent badge class
    .nav-item.kit-item{color:var(--accent)}, plus an inline
    style="color:var(--accent)" on a third entry. So Training and Research &
    Validation were gold in every page state, and the genuinely active entry
    was gold as well: three gold items, one of which meant "you are here". The
    owner counted them on a phone and asked why.

    The badge colouring was left from when the highlighted entry was
    "Deployment Kit"; collapsing the bar earlier that day carried the class
    onto Training rather than removing it.

    Two things are asserted. No nav item may hardcode the accent colour
    inline, and no rule may paint a nav item accent except through .active.
    Either one alone leaves a second meaning for the same colour.
    """
    import glob

    inline, badge = [], []
    for pat in ("*.html", "*/*.html", "*/*/*.html"):
        for p in sorted(glob.glob(os.path.join(ROOT, pat))):
            rel = os.path.relpath(p, ROOT)
            if rel.split(os.sep)[0] in ("research", "templates", "scripts",
                                        "node_modules"):
                continue
            src = read(rel)
            for m in re.finditer(r'<(?:a|button)\s[^>]*class="[^"]*\bnav-item\b[^"]*"[^>]*>', src):
                tag = m.group(0)
                if "active" in tag:
                    continue
                st = re.search(r'style="([^"]*)"', tag)
                if st and "var(--accent)" in st.group(1):
                    label = src[m.end():m.end() + 40]
                    label = re.sub(r"<[^>]+>|&#\d+;|\s+", " ", label).strip()[:22]
                    inline.append("%s: %s" % (rel, label))

            # A CSS rule painting a nav item accent without requiring .active.
            for m in re.finditer(r'(\.nav-item[^{,]*)\{([^}]*)\}', src):
                sel, body = m.group(1), m.group(2)
                if "var(--accent)" not in body or "color" not in body:
                    continue
                if ".active" in sel:
                    continue
                badge.append("%s: %s" % (rel, sel.strip()))

    check("no nav item hardcodes the active colour inline", not inline,
          "; ".join(inline) if inline else "gold is set only by .active")
    check("no CSS rule paints a nav item gold except .active", not badge,
          "; ".join(sorted(set(badge))) if badge else "no badge rules remain")


def check_no_duplicate_nav_strips(offline):
    """A page must not stack a navigation strip that duplicates the one below it.

    pilot.html carried FOUR chrome layers before a single line of content: the
    site header, a cross-site strip (Home | Pilot Program | Training
    Simulations), the primary nav, and a utility bar. Home, Pilot Program and
    Training were all present in the primary nav directly beneath the strip, so
    the word Training appeared three times in three bars. Measured on a 390px
    phone the chrome ran to y=217 before the page said anything.

    The cross-site strip is removed from the two pages that carried it. This
    asserts it stays gone, and that no page stacks more than the header plus two
    navigation surfaces.
    """
    import glob

    revived, stacked = [], []
    for pat in ("*.html", "*/*.html", "*/*/*.html"):
        for p in sorted(glob.glob(os.path.join(ROOT, pat))):
            rel = os.path.relpath(p, ROOT)
            if rel.split(os.sep)[0] in ("research", "templates", "scripts",
                                        "node_modules"):
                continue
            src = read(rel)
            if 'class="cross-site-nav"' in src or "csn-link" in src:
                revived.append(rel)
            layers = sum(1 for marker in ('class="primary-nav"',
                                          'class="util-bar"',
                                          "jrs-sitenav",
                                          'class="cross-site-nav"')
                         if marker in src)
            if layers > 2:
                stacked.append("%s (%d nav surfaces)" % (rel, layers))

    check("the duplicated cross-site strip stays removed", not revived,
          ", ".join(revived) if revived else "absent from every page")
    check("no page stacks more than two navigation surfaces", not stacked,
          "; ".join(stacked) if stacked else "no page exceeds two")


def check_no_redirect_shadows_a_real_page(offline):
    """A redirect must not steal the URL of a page that exists.

    vercel.json sent /pilot to org-pilot.html while pilot.html existed, and
    /check to org-pilot.html while check.html existed. So the obvious URL for
    the Pilot Program served the organisation diagnostic, and the Record
    Defensibility Check was unreachable at its own name. pilot.html had been
    pushed onto the longer /pilot-program alias to work around the collision,
    which is the shape of a workaround outliving the reason for it.

    The owner sent the link https://jrsstandard.com/pilot and asked for it to
    be fixed; what he was looking at was a different page entirely.

    Aliases that point somewhere unrelated are fine and common here: /guides to
    investigator-guides, /rtkw to an API route, /second-read to recheck. The
    rule is narrower than that. A redirect may not take a name that a real page
    already owns.
    """
    import glob
    import json as _json

    try:
        cfg = _json.loads(read("vercel.json"))
    except Exception as e:
        check("vercel.json parses", False, repr(e)[:60])
        return

    shadowed = []
    for r in cfg.get("redirects", []):
        src = (r.get("source") or "").strip("/")
        dst = r.get("destination") or ""
        if not src or ":" in src or "/" in src:
            continue
        own = src + ".html"
        if not os.path.exists(os.path.join(ROOT, own)):
            continue
        want = "/" + own
        if dst.split("?")[0].split("#")[0] != want:
            shadowed.append("/%s -> %s but %s exists" % (src, dst, own))

    check("no redirect shadows a page that exists", not shadowed,
          "; ".join(shadowed) if shadowed
          else "%d redirects, none steals an existing page's name"
               % len(cfg.get("redirects", [])))


def check_a_page_leads_with_its_own_action(offline):
    """The loudest button on a page must be that page's own job.

    pilot.html's hero row read, in order: "See the Research & Validation" as the
    gold primary, "Open the Training Simulations", "View Research Findings",
    and then "Join Pilot Program" last, in the faintest ghost style. Three of
    the four sent the reader off the page, and the one action the Pilot Program
    page exists for was the quietest thing on it.

    Checked structurally rather than by taste: the first .btn-primary in the
    hero must be an action that stays on this page, not a link to another one.
    """
    src = read("pilot.html")
    i = src.find('<div class="btn-row"')
    if i < 0:
        check("pilot.html has a hero button row", False, "not found")
        return
    row = src[i:src.find("</div>", i)]
    m = re.search(r'<a\s[^>]*class="[^"]*btn-primary[^"]*"[^>]*>(.*?)</a>', row, re.S)
    if not m:
        check("pilot.html leads with its own action", False,
              "no primary button in the hero row")
        return
    tag = m.group(0)
    label = re.sub(r"<[^>]+>|&[a-z]+;|&#\d+;", " ", m.group(1))
    label = re.sub(r"\s+", " ", label).strip()
    href = re.search(r'href="([^"]+)"', tag)
    target = href.group(1) if href else ""
    stays = target.startswith("#")
    check("pilot.html leads with its own action", stays,
          "primary is %r -> %s" % (label[:34], target or "no href"))


def check_util_bar_does_not_hide_links_on_a_phone(offline):
    """Every link in the utility bar must be reachable at phone width.

    pilot.html, enterprise.html and review-engine.html gave the bar
    overflow-x:auto. At 390px that put two of pilot's three links, and one
    of the other two pages', entirely past the right edge. A phone draws no
    scrollbar on that strip, so it did not read as "drag me", it read as
    clipped text: the header showed "SIMULATION TRAII" and stopped.

    Checked at the source: the phone-width rule must wrap the bar, and must
    not restore a horizontal scroll strip. jrsstandard.html has always
    wrapped and is the pattern the other three now match.
    """
    pages = ("pilot.html", "enterprise.html", "review-engine.html",
             "jrsstandard.html")
    bad = []
    for page in pages:
        src = read(page)
        rules = re.findall(r"\.util-bar-inner\s*{([^}]*)}", src)
        if not rules:
            bad.append("%s: no util bar rule" % page)
            continue
        # The last .util-bar-inner rule in the file is the phone override.
        phone = rules[-1].replace("\n", " ")
        if "overflow-x:auto" in phone.replace(" ", ""):
            bad.append("%s: still a scroll strip" % page)
        elif "flex-wrap:wrap" not in phone.replace(" ", ""):
            bad.append("%s: phone rule does not wrap" % page)
    check("util bar wraps instead of hiding links on phones", not bad,
          "; ".join(bad) if bad else "%d pages wrap, none scroll" % len(pages))


def check_skip_token_lands_where_cloudflare_reads_it(offline):
    """The CI skip token must sit near the top of the commit message.

    The hook used to append it to the very end. On 2026-08-26 that was shown
    to fail silently on any commit with a detailed body: seven commits split
    cleanly by the byte offset of the token, every skip having it within the
    first 194 bytes and both token-carrying failures burying it past byte
    1000. A commit pushed deliberately without the token (899bbbf) failed
    where the same kind of change with it (c9add51) had skipped, which is
    what proves the token is read at all.

    Exercised, not just read: the installed hook is run against a synthetic
    long message and the resulting offset is measured.
    """
    import io, subprocess, tempfile
    setup = "scripts/setup_skip_cloudflare_hook.sh"
    src = read(setup)
    appends = "printf '\\n%s\\n' \"$TOKEN\" >> \"$MSG_FILE\"" in src
    if appends:
        check("skip token lands where Cloudflare reads it", False,
              "%s still appends the token to the end of the message" % setup)
        return

    hook = ".git/hooks/commit-msg"
    if not os.path.exists(hook):
        check("skip token lands where Cloudflare reads it", not appends,
              "hook not installed; source no longer appends")
        return
    branch = subprocess.run(["git", "rev-parse", "--abbrev-ref", "HEAD"],
                            capture_output=True, text=True).stdout.strip()
    m = re.search(r'DEV_BRANCH="([^"]+)"', src)
    if not m or branch != m.group(1):
        check("skip token lands where Cloudflare reads it", not appends,
              "on %r, not the dev branch; source no longer appends" % branch)
        return

    body = "A representative subject line\n\n" + ("filler body line\n" * 60)
    with tempfile.NamedTemporaryFile("w", suffix=".msg", delete=False) as fh:
        fh.write(body)
        path = fh.name
    try:
        subprocess.run([hook, path], check=True, capture_output=True)
        out = io.open(path, encoding="utf-8").read()
    finally:
        os.unlink(path)
    idx = out.lower().find("[skip ci]")
    # 194 is the largest offset observed to be honoured; stay well inside it.
    ok = 0 <= idx <= 194
    check("skip token lands where Cloudflare reads it", ok,
          "token at byte %d of a %d byte message" % (idx, len(out))
          if idx >= 0 else "hook did not add a token")


def check_enterprise_page_leads_with_its_own_action(offline):
    """The enterprise page must sell the licence, not the free pilot.

    Audited 2026-08-26 on the rendered page: the inquiry form sat at
    y=17,728 of a 20,458px page (86.7% down, roughly 24 phone screens), and
    the loudest button above it was btn-primary "Request Pilot
    Participation" pointing at pilot.html. The API contract link, the one
    document a technical buyer needs, carried btn-ghost.

    Asserted structurally: the first .btn-primary must target the inquiry
    form, the API contract must not be the faintest style on the page, and
    no enterprise call to action may be a mailto.
    """
    src = read("enterprise.html")
    bad = []

    m = re.search(r'<a\s[^>]*class="[^"]*btn-primary[^"]*"[^>]*>', src)
    if not m:
        bad.append("no primary button")
    else:
        href = re.search(r'href="([^"]+)"', m.group(0))
        target = href.group(1) if href else ""
        if target != "#enterprise-inquiry":
            bad.append("first primary points at %s" % target)

    if re.search(r'<a\s[^>]*href="review-engine\.html"[^>]*class="btn btn-ghost"', src):
        bad.append("API contract is still btn-ghost")

    # Both Track 1 pages, not just this one: review-engine.html kept two
    # mailto token requests through the first pass because the guard only
    # looked at enterprise.html.
    for page in ("enterprise.html", "review-engine.html"):
        psrc = read(page)
        for m in re.finditer(r'<a\s[^>]*href="(mailto:[^"]+)"[^>]*class="([^"]*)"', psrc):
            cls = m.group(2)
            if "btn" in cls or "accent-link" in cls:
                bad.append("%s mailto CTA: %s" % (page, m.group(1)[:40]))

    check("enterprise.html leads with its own action", not bad,
          "; ".join(bad) if bad else "primary -> #enterprise-inquiry, contract promoted, no mailto CTA")


def check_inquiry_form_is_not_buried(offline):
    """The enterprise inquiry form must sit in the top half of its page."""
    src = read("enterprise.html")
    i = src.find('id="enterprise-inquiry"')
    if i < 0:
        check("enterprise inquiry form is reachable", False, "form not found")
        return
    pct = 100.0 * i / len(src)
    check("enterprise inquiry form is not buried", pct < 40.0,
          "form at %.1f%% of source (was 86.7%% of rendered page)" % pct)


def check_free_track_bridges_to_the_licence(offline):
    """Free-track pages must offer a route to the commercial track.

    jrsstandard.html is 505,622 bytes, the flagship standard and the page
    most likely to be read end to end by the engineer who could specify JRS
    into a product. Before 2026-08-26 it mentioned the enterprise track zero
    times and linked to it zero times.
    """
    pages = ("jrsstandard.html", "codebook.html", "simulations.html",
             "investigator-guides.html", "check.html")
    blocks, missing = {}, []
    for page in pages:
        src = read(page)
        a = src.find("<!-- JRS TRACK BRIDGE v1")
        if a < 0:
            missing.append(page)
            continue
        b = src.find("<footer", a)
        blocks[page] = src[a:b]
    if missing:
        check("free-track pages bridge to the licence", False,
              "no bridge on: %s" % ", ".join(missing))
        return
    uniq = set(blocks.values())
    check("free-track pages bridge to the licence", len(uniq) == 1,
          "%d pages, %d distinct copies" % (len(blocks), len(uniq)))


def check_api_contract_has_a_runnable_example(offline):
    """A technical buyer evaluates by pasting into a terminal."""
    src = read("review-engine.html")
    has_curl = "curl -X POST" in src
    has_auth = "Authorization: Bearer" in src
    has_resp = '"routing"' in src or "routing" in src
    check("API contract carries a runnable example", has_curl and has_auth and has_resp,
          "curl=%s bearer=%s response=%s" % (has_curl, has_auth, has_resp))


def check_homepage_hero_offers_both_tracks(offline):
    """Both doors must sit directly under the headline, one per track."""
    src = read("index.html")
    i = src.find('class="hero-sub"')
    j = src.find('<div class="dual-track">')
    if i < 0 or j < 0 or j < i:
        check("homepage hero offers both tracks", False, "hero landmarks not found")
        return
    between = src[i:j]
    free = "check.html" in between
    ent = "enterprise.html#enterprise-inquiry" in between
    check("homepage hero offers both tracks", free and ent,
          "free=%s enterprise=%s, between hero-sub and the dual-track block" % (free, ent))


def check_openapi_matches_the_implementation(offline):
    """The published contract must not drift from the endpoint it describes.

    A machine-readable spec that disagrees with the code is worse than no
    spec, because an integrator builds against it. Both directions are
    checked: every error string the implementation can emit must appear in
    the spec's enum, and the spec may not invent one the code cannot return.
    """
    import json as _json
    # Served from the repository root: Vercel treats everything under api/
    # as a function, so a .json placed there is never served as an asset.
    spec_path = "openapi.json"
    if not os.path.exists(spec_path):
        check("openapi spec matches the implementation", False, "no openapi.json at the repository root")
        return
    try:
        spec = _json.loads(read(spec_path))
    except Exception as exc:
        check("openapi spec matches the implementation", False, "invalid JSON: %s" % exc)
        return
    impl_src = read("api/v1/review-engine.js")
    impl = set(re.findall(r"error:\s*'([a-z_]+)'", impl_src))
    try:
        declared = set(spec["components"]["schemas"]["Error"]
                       ["properties"]["error"]["enum"])
    except KeyError:
        check("openapi spec matches the implementation", False, "no Error enum in spec")
        return
    missing = impl - declared
    invented = declared - impl
    bad = []
    if missing:
        bad.append("in code, not in spec: %s" % ", ".join(sorted(missing)))
    if invented:
        bad.append("in spec, not in code: %s" % ", ".join(sorted(invented)))
    path = "/api/v1/review-engine"
    if path not in spec.get("paths", {}):
        bad.append("spec does not document %s" % path)
    check("openapi spec matches the implementation", not bad,
          "; ".join(bad) if bad else "%d error codes agree, path documented" % len(impl))


def check_security_page_exists_and_is_linked(offline):
    """Procurement asks for a data-handling page; it must exist and be reachable."""
    if not os.path.exists("security.html"):
        check("security one-pager exists and is linked", False, "security.html missing")
        return
    src = read("security.html")
    required = ("stateless", "not written to any table", "fail-closed",
                "Rate limit", "request_id")
    absent = [t for t in required if t.lower() not in src.lower()]
    linkers = [p for p in ("enterprise.html", "review-engine.html")
               if 'href="security.html"' in read(p)]
    bad = []
    if absent:
        bad.append("missing claims: %s" % ", ".join(absent))
    if len(linkers) < 2:
        bad.append("linked from only %d of 2 Track 1 pages" % len(linkers))
    # The key must never be named on a public page.
    if "ANTHROPIC_API_KEY" in src:
        bad.append("names the API key environment variable")
    check("security one-pager exists and is linked", not bad,
          "; ".join(bad) if bad else "present, linked from both Track 1 pages, key not named")


def check_vendor_question_is_asked_once(offline):
    """The warmest signal in the funnel must be captured, and stay optional."""
    html = read("training.html")
    api = read("api/enroll.js")
    bad = []
    if 'id="en-builds"' not in html:
        bad.append("no vendor question on the registration form")
    if "builds_software:builds" not in html.replace(" ", ""):
        bad.append("value not sent to the endpoint")
    if "builds_software" not in api:
        bad.append("endpoint drops the field")
    if 'id="en-builds"' in html:
        block = html[html.find('id="en-builds"'):]
        block = block[:block.find("</select>") + 9]
        if "required" in block:
            bad.append("field is required; it must never block registration")
    check("vendor question asked once, never blocking", not bad,
          "; ".join(bad) if bad else "optional select, wired through api/enroll.js")


def check_track1_pages_lead_with_an_action(offline):
    """No Track 1 page may strand its headline.

    Measured on production 2026-08-26: review-engine.html, the page a
    technical buyer is sent to, had its first button at y=5,884 of a
    7,916px page, 74% down. enterprise.html and index.html had already been
    corrected; this one had been audited and missed.

    Checked at the source: on every Track 1 page a .btn-row must appear
    within 1,200 characters of the h1.
    """
    bad = []
    for page in ("enterprise.html", "review-engine.html", "security.html"):
        src = read(page)
        h = src.find("<h1")
        if h < 0:
            bad.append("%s: no h1" % page)
            continue
        row = src.find('class="btn-row"', h)
        if row < 0:
            bad.append("%s: no action row after the h1" % page)
            continue
        gap = row - h
        if gap > 1200:
            bad.append("%s: first action %d chars after the h1" % (page, gap))
    check("Track 1 pages lead with an action", not bad,
          "; ".join(bad) if bad
          else "enterprise, review-engine and security all act above the fold")


def check_sandbox_is_failclosed(offline):
    """A public unauthenticated route onto a paid model must be fail-closed.

    The sandbox removes the last human step from evaluation: before it, an
    integrator could read the contract, the runnable example, the OpenAPI
    spec and the security page, then had to email someone for a token before
    running one record. That convenience is also cost and abuse surface, so
    the route must stay off until the owner turns it on, and must carry its
    own caps rather than inheriting the paid route's.
    """
    if not os.path.exists("api/sandbox.js"):
        check("sandbox is fail-closed", False, "api/sandbox.js missing")
        return
    src = read("api/sandbox.js")
    bad = []
    if "SANDBOX_ENABLED" not in src:
        bad.append("no enable flag")
    elif "!== '1'" not in src.replace('"', "'"):
        bad.append("enable flag is not a strict opt-in")
    for cap in ("SANDBOX_PER_IP_PER_DAY", "SANDBOX_GLOBAL_PER_DAY", "SANDBOX_MAX_CHARS"):
        if cap not in src:
            bad.append("no %s cap" % cap)
    if "ANTHROPIC_API_KEY" in src and "process.env.ANTHROPIC_API_KEY" not in src:
        bad.append("key referenced outside process.env")
    # The sandbox must never write a row.
    for sink in ("/rest/v1/", "SUPABASE", "SERVICE_ROLE"):
        if sink in src:
            bad.append("writes to a store (%s)" % sink)
    check("sandbox is fail-closed", not bad,
          "; ".join(bad) if bad else "opt-in flag, three caps, no store, no key leak")


def check_sandbox_is_reachable_and_gated(offline):
    """The sandbox UI must exist, be linked, and run the PII gate first."""
    src = read("review-engine.html")
    bad = []
    if 'id="sandbox"' not in src:
        bad.append("no sandbox section")
    if "'/api/sandbox'" not in src and '"/api/sandbox"' not in src:
        bad.append("UI does not call /api/sandbox")
    if "jrsSanitizeCheck" not in src:
        bad.append("no PII gate before submit")
    if ".catch(" not in src:
        bad.append("fetch has no catch handler")
    ent = read("enterprise.html")
    if "review-engine.html#sandbox" not in ent:
        bad.append("not linked from enterprise.html")
    check("sandbox is reachable and gated", not bad,
          "; ".join(bad) if bad else "section present, gate applied, catch present, linked")


def check_pricing_is_published(offline):
    """A buyer must be able to size the commitment before a call."""
    src = read("enterprise.html")
    bad = []
    if 'id="pricing"' not in src:
        bad.append("no pricing section")
    # NO FIGURES. check_no_internal_strategy_language records an owner
    # constraint of 2026-08-25 against publishing a licence floor. What is
    # asserted instead is that the SHAPE of the commitment is stated, which
    # is what lets a buyer self-qualify without opening a negotiation at its
    # bottom.
    for term in ("Integration setup", "Platform licence", "Evaluation",
                 "What moves it"):
        if term not in src:
            bad.append("pricing section does not state %r" % term)
    if "#pricing" not in src:
        bad.append("pricing not linked from the page")
    check("pricing posture is published", not bad,
          "; ".join(bad) if bad
          else "commitment shape stated, no floor published per owner constraint")


def check_pii_gate_is_identical_everywhere(offline):
    """One PII gate, byte-identical on every page that accepts free text.

    index.html carried a compact variant and pilot.html the spaced form
    printed in CLAUDE.md III.3. The drift was invisible until a third copy
    was added for the sandbox, which is exactly the failure mode this file
    exists to catch.
    """
    def body(text):
        i = text.find("function jrsSanitizeCheck")
        if i < 0:
            return None
        depth, k = 0, text.find("{", i)
        while k < len(text):
            if text[k] == "{":
                depth += 1
            elif text[k] == "}":
                depth -= 1
                if depth == 0:
                    return text[i:k + 1]
            k += 1
        return None

    pages = ("index.html", "pilot.html", "review-engine.html")
    got = {}
    for page in pages:
        b = body(read(page))
        if b is None:
            check("PII gate identical on every text-input page", False,
                  "%s has no jrsSanitizeCheck" % page)
            return
        got[page] = b
    uniq = set(got.values())
    check("PII gate identical on every text-input page", len(uniq) == 1,
          "%d pages, %d distinct copies" % (len(got), len(uniq)))


def check_homepage_is_a_landing_page(offline):
    """The home panel must not carry the whole site.

    Measured 2026-08-26 at 390x844: the home panel was 38,696px of a
    39,361px page, about forty-six phone screens, with 55 top-level blocks,
    while twelve other panels existed in the same document for most of those
    subjects. Thirty-three blocks were moved byte-for-byte into the panel
    built for each one.
    """
    src = read("index.html")
    i = src.find('id="section-home"')
    if i < 0:
        check("homepage is a landing page", False, "section-home not found")
        return
    m = re.compile(r'<div\s+id="section-[a-z]+"\s+class="page-section"').search(src, i + 10)
    if not m:
        check("homepage is a landing page", False, "no following panel")
        return
    home_bytes = m.start() - i
    total = len(src)
    share = 100.0 * home_bytes / total
    check("homepage is a landing page", share < 12.0,
          "home panel is %.1f%% of the document (%d bytes)" % (share, home_bytes))


def check_no_custom_pricing_estimator_returns(offline):
    """The custom-pricing estimator is retired and must not come back.

    It was written on 2026-08-25 to answer the sizing question without
    publishing a band, and this guard asserted it existed. The 2026-09-04
    passive-IP-asset correction reverses that requirement: a tool that returns
    a per-buyer tier and carries the answers into an inquiry form is a custom
    pricing tool, and a tier body that reads "how much of the condition
    mapping your team does rather than us" is founder-delivered setup priced
    per engagement. Both were removed.

    What the page keeps is the licence itself: the annual platform licence,
    the one-time integration, and a stated refusal to publish a floor while
    nothing has transacted. That is licensing, and licensing is preserved.
    This guard therefore asserts the inverse of what it used to: the widget
    and its script are gone, no per-buyer tier ladder is printed, no currency
    figure appeared, and the licence rows survived the removal.
    """
    src = read("enterprise.html")
    bad = []
    for el in ("sc-vol", "sc-types", "sc-exposure", "sc-go", "sc-out",
               "sc-tier", "sc-body", "sc-send"):
        if el in src:
            bad.append("estimator element %s is back" % el)
    if "SCOPE ESTIMATOR" in src:
        bad.append("estimator script is back")
    for tier in ("Pilot integration", "Standard platform licence",
                 "Extended platform licence", "Custom scope"):
        if tier in src:
            bad.append("per-buyer tier %r is back" % tier)
    # The page must still carry the licence, which is not what was removed.
    for keep in ("Platform licence", "Annual, per organisation",
                 "Scope and cost", 'id="pricing"'):
        if keep not in src:
            bad.append("licensing content lost: %r" % keep)
    # And it must never grow a published figure.
    if re.search(r"[$\u00a3\u20ac]\s?\d", src):
        bad.append("a currency figure appeared on the page")
    check("no custom pricing estimator returns", not bad,
          "; ".join(bad) if bad
          else "estimator and tier ladder absent, licence rows intact, no figure")


def check_pricing_constraint_names_its_trigger(offline):
    """A standing constraint must say what would end it.

    A constraint with no stated trigger becomes permanent by default, and
    nobody remembers why. The 2026-08-25 rule against publishing a licence
    floor is stage-dependent: it holds while nothing has transacted, and the
    thing that ends it is a closed licence to point at. That trigger is
    recorded beside the rule so a future editor can act on it rather than
    guess at it.
    """
    src = read(__file__ if False else "scripts/check_zero_drift.py")
    i = src.find("INTERNAL_VOICE = (")
    if i < 0:
        check("pricing constraint names its trigger", False,
              "INTERNAL_VOICE table not found")
        return
    window = src[max(0, i - 1400):i + 400]
    has_trigger = "REVISIT WHEN" in window
    check("pricing constraint names its trigger", has_trigger,
          "trigger recorded beside the rule" if has_trigger
          else "no REVISIT WHEN condition recorded")



def check_founder_service_layer_is_retired(offline):
    """The public service surface must match the config-level retirement.

    api/_offer-config.js marked audit, governance and calibration
    `retired: true` on 2026-08-26 and check_revenue_model_is_licensing_only
    asserts that holds at the config and checkout layer. The HTML surface did
    not follow: a fee catalogue with turnarounds and Scope it actions, three
    intake pages offering a scoping call, four sitemap entries and twelve
    footer links were all still live on 2026-09-04, so a reader arriving from
    any of four corrected pages was one click from a founder-delivered
    engagement business.

    The pages are archived rather than deleted, because an existing client or
    a forwarded link should still resolve to a readable record of what was
    offered. This asserts the archive holds: the four pages are noindex, each
    carries the retirement notice, neither the scoping-call offer nor the
    Scope it action survives, no public page links into them, and the sitemap
    does not list them. It also asserts the retirement did not take the
    commercial pathways with it.
    """
    retired = ["engagement.html", "audit-request.html",
               "governance-request.html", "calibration-request.html"]
    bad = []

    for page in retired:
        src = read(page)
        # noindex,follow since 2026-09-05. The pages must stay out of the index,
        # but their outbound links to the live licensing, integration and
        # acquisition pathways should still be followed, which is the whole
        # point of keeping them reachable rather than deleting them.
        if '<meta name="robots" content="noindex,' not in src:
            bad.append("%s is not noindex" % page)
        if "SERVICE LAYER RETIRED" not in src:
            bad.append("%s lost its retirement notice" % page)
        if "scoping call" in src:
            bad.append("%s offers a scoping call again" % page)
        if "Scope it" in src:
            bad.append("%s carries a Scope it action again" % page)

    # No public page may route a reader into the retired layer.
    for path in sorted(glob.glob("*.html")) + sorted(glob.glob("reviewer/*.html")):
        name = os.path.basename(path)
        if name in retired:
            continue
        src = read(path)
        for page in retired:
            if 'href="%s"' % page in src or 'href="/%s"' % page in src:
                bad.append("%s links into the retired layer (%s)" % (path, page))

    sm = read("sitemap.xml")
    for page in retired:
        if page in sm:
            bad.append("sitemap.xml still lists %s" % page)
    # terms.html was required in the sitemap until 2026-09-05, when it was
    # taken out of the index with the rest of the archival layer: it governs
    # engagements closed to new requests, so search discoverability serves no
    # reader. The assertion is inverted rather than dropped, so a silent
    # re-listing fails.
    if "terms.html" in sm:
        bad.append("sitemap.xml lists terms.html, which is archival since 2026-09-05")
    terms = read("terms.html")
    if '<meta name="robots" content="noindex,' not in terms:
        bad.append("terms.html is not noindex")

    # The retirement must not have removed the commercial pathways.
    ent = read("enterprise.html")
    for needle in ("Platform licence", "Review Engine API", "Acquisition"):
        if needle not in ent:
            bad.append("enterprise.html lost a commercial pathway: %s" % needle)

    check("founder service layer is retired", not bad,
          "; ".join(bad) if bad
          else "4 pages archived noindex, 0 inbound links, 0 sitemap entries, "
               "licensing and acquisition intact")

def check_revenue_model_is_licensing_only(offline):
    """One revenue motion: the engine licence ladder.

    api/_offer-config.js:58 states the principle the model now follows: the
    engine is the only offer that scales without the owner's time, so it is
    the one that belongs in a tier ladder. Three fixed-scope engagements sat
    above that line contradicting it (audit $250, governance $500,
    calibration $750), each consuming owner hours against a recorded weekly
    capacity of 10 to 15 hours, and each with an empty checkout_url that had
    never taken a payment.

    They are retired rather than deleted, because four surfaces resolve
    historical rows through those keys. This asserts the retirement holds:
    the flags are present, nothing public renders a price for them, and no
    page still routes a reader into a purchase for one.
    """
    cfg = read("api/_offer-config.js")
    bad = []
    for key in ("audit", "governance", "calibration"):
        i = cfg.find("\n  %s: {" % key)
        if i < 0:
            bad.append("%s: key deleted, history would orphan" % key)
            continue
        if "retired: true" not in cfg[i:i + 500]:
            bad.append("%s: not marked retired" % key)

    info = read("api/offer-info.js")
    if "o.retired === true" not in info:
        bad.append("offer-info still emits prices for retired offers")

    chk = read("api/checkout.js")
    if "RETIRED OFFER GUARD" not in chk:
        bad.append("checkout has no retired-offer route")

    import glob
    for page in sorted(glob.glob(os.path.join(ROOT, "*.html"))):
        rel = os.path.relpath(page, ROOT)
        src = read(rel)
        for key in ("audit", "governance", "calibration"):
            if "/api/checkout?o=%s" % key in src:
                bad.append("%s still links a purchase for %s" % (rel, key))

    check("revenue model is licensing only", not bad,
          "; ".join(bad) if bad
          else "3 offers retired, no public price, no purchase path, keys kept")


def check_engine_ladder_is_intact(offline):
    """The licence ladder is now the entire revenue model and must stay whole."""
    cfg = read("api/_offer-config.js")
    bad = []
    for tier in ("evaluation", "single_function", "enterprise",
                 "governance_reporting"):
        if "\n  %s: {" % tier not in cfg:
            bad.append("missing tier %s" % tier)
    i = cfg.find("\n  evaluation: {")
    if i >= 0 and "price_usd: 0" not in cfg[i:i + 400]:
        bad.append("evaluation tier is no longer free")
    check("engine licence ladder intact", not bad,
          "; ".join(bad) if bad else "4 tiers present, evaluation free at 0")


def check_tracker_logged_today(offline):
    """The Master Tracker must carry an entry for the day work was committed.

    THE STANDING DIRECTIVE IS THAT EVERY RESPONSE UPDATES THE TRACKER, AND ON
    2026-08-27 THE OWNER ASKED HOW HE COULD TRUST THAT IT WAS HAPPENING. The
    measurement proved him right: that date held ONE entry against about five
    substantive turns, and two of them, a strategic assessment and a delivery
    defect fix, had no entry at all. They were backfilled and marked as
    backfilled rather than quietly inserted.

    A promise cannot fix that. A failing commit can. This blocks any commit
    made on a day the tracker has not been written to.

    WHAT IT CANNOT CATCH, stated plainly: a turn that produces no commit. The
    repository has no record of conversational turns, so nothing here can
    count them. scripts/check_tracker_current.py prints the per-day entry
    count so the owner can judge that himself rather than take my word for it.
    """
    import datetime
    path = os.path.join(ROOT, "research", "MASTER_TRACKER.md")
    if not os.path.isfile(path):
        # research/ is absent on the production branch by design, exactly as
        # scripts/ is. Its absence there is the deploy working.
        check("Master Tracker written to today", SKIPPED,
              "research/MASTER_TRACKER.md not present on this branch")
        return
    text = read("research/MASTER_TRACKER.md")
    dates = re.findall(r"\n- (20\d\d-\d\d-\d\d)", text)
    if not dates:
        check("Master Tracker written to today", False, "no dated entries")
        return
    today = datetime.date.today().isoformat()
    n = dates.count(today)
    check("Master Tracker written to today", n > 0,
          "%d entr%s for %s" % (n, "y" if n == 1 else "ies", today) if n
          else "NO ENTRY for %s; newest is %s" % (today, max(dates)))


def check_superseded_manuscripts_not_listed(offline):
    """A merged manuscript must never be reported as awaiting submission.

    scripts/publication_status.py was hand-built from filenames in research/
    and reported research/Article1_Rungs1and2.md as a seventh manuscript
    pending submission with an unrecorded venue. It is neither.
    MASTER_TRACKER.md:750, dated 2026-07-27: "CONSOLIDATION EXECUTED:
    standalone Rungs 1-2 paper merged into the international paper
    (Detection_ArmB_Article_Draft.md), per Phillip's decision to publish ONE
    flagship artifact." The owner corrected it by hand.

    THE LIST BELOW IS DECLARED, NOT INFERRED, AND THAT IS DELIBERATE. The
    first version of this check searched the tracker for "merged into" and
    took any nearby .md filename as the superseded one. It immediately
    produced a false positive: it flagged BusinessEthics_Article_Draft.md,
    which is the DESTINATION of a merge, not its subject. In the Rungs entry
    the opposite holds, the destination is the filename and the source is
    named only in prose. Prose does not reliably say which side is which.

    A false alarm in a drift checker teaches the reader to ignore it, so
    inference is replaced with data: each entry cites the tracker line that
    establishes it, and a human adds entries by reading that line.
    """
    # filename -> tracker line establishing supersession
    SUPERSEDED = {
        "Article1_Rungs1and2.md":
            "MASTER_TRACKER.md:750 (2026-07-27) merged into the "
            "international detection paper",
    }
    status_path = os.path.join(ROOT, "scripts", "publication_status.py")
    if not os.path.isfile(status_path):
        check("superseded manuscripts are not listed as pending", SKIPPED,
              "scripts/publication_status.py not on this branch")
        return
    src = read("scripts/publication_status.py")
    bad = [f for f in sorted(SUPERSEDED) if re.search(r'"%s"' % re.escape(f), src)]
    check("superseded manuscripts are not listed as pending", not bad,
          "; ".join("%s listed as pending, but %s" % (f, SUPERSEDED[f])
                    for f in bad) if bad
          else "%d declared supersession(s), none listed as pending"
               % len(SUPERSEDED))

def check_accepted_article_is_tracked(offline):
    """The one accepted article must be present, preserved and marked.

    "When the Record Cannot Speak for Itself" was accepted by CEP Magazine
    (SCCE) on 2026-07-16 for the November issue and advanced to copy-editing
    on 2026-07-21. It is the only accepted piece in the portfolio, and
    scripts/publication_status.py omitted it entirely: the table was built
    from research/*.md filenames and the article lived as a .docx outside the
    repository. The same root cause produced the phantom Rungs entry, once in
    each direction, an invented pending paper and a missing accepted one.

    Three things are asserted. The accepted text is preserved in the
    repository so it cannot be lost with a laptop. The inventory lists it.
    And the inventory carries a status column at all, because a publication
    status tool that renders ACCEPTED and unsubmitted identically is not
    reporting status.
    """
    bad = []
    docx = "research/CEP_When_the_Record_Cannot_Speak_for_Itself_ACCEPTED.docx"
    md = "research/CEP_When_the_Record_Cannot_Speak_for_Itself_ACCEPTED.md"
    for f in (docx, md):
        if not os.path.isfile(os.path.join(ROOT, f)):
            bad.append("%s missing" % f)

    status_rel = "scripts/publication_status.py"
    if not os.path.isfile(os.path.join(ROOT, status_rel)):
        check("accepted article is tracked", SKIPPED,
              "scripts/publication_status.py not on this branch")
        return
    src = read(status_rel)
    if '"ACCEPTED"' not in src:
        bad.append("inventory has no ACCEPTED status")
    if "CEP Magazine" not in src:
        bad.append("inventory does not name the venue")
    if "(status, display title" not in src and "status," not in src:
        bad.append("inventory has no status column")

    check("accepted article is tracked", not bad,
          "; ".join(bad) if bad
          else "CEP accepted piece preserved as .docx + .md and listed ACCEPTED")


def check_no_founder_service_funnel_survives_anywhere(offline):
    """No public page may carry an active founder-delivered record-review funnel.

    WHY THIS EXISTS, AND WHY IT IS SITE-WIDE RATHER THAN PAGE-SCOPED. The
    2026-09-04 retirement pass removed the "Book a twenty-minute record read"
    action from engagement.html and was reported as closing the last of these.
    It was not. The identical anchor, same subject line and same pre-filled
    body fields, was still live on check.html on 2026-09-05: a page with no
    noindex, listed in sitemap.xml, carrying 76 inbound links from 60 of the
    71 public pages, and linked by name from three of the four retired pages.

    It survived every earlier scan for one reason: those scans tested
    class="cta-primary" and were scoped to the four named retired pages. That
    anchor is class="cta-secondary" on a page that was never in scope. So this
    guard deliberately does NOT test a class name or a page list. It tests the
    mechanism: a mailto: link carrying a body= parameter is a pre-filled
    service-request form, and no public page gets to have one.

    It also holds the other three corrections from the same pass in place.
    """
    bad = []

    # 1. Site-wide: no pre-filled service-request mailto anywhere.
    pages = sorted(
        [os.path.relpath(x, ROOT) for x in glob.glob(os.path.join(ROOT, "*.html"))] +
        [os.path.relpath(x, ROOT) for x in glob.glob(os.path.join(ROOT, "*", "index.html"))] +
        [os.path.relpath(x, ROOT) for x in glob.glob(os.path.join(ROOT, "reviewer", "*.html"))]
    )
    for page in pages:
        src = read(page)
        for m in re.findall(r'href="mailto:[^"]*"', src):
            if "body=" in m:
                bad.append("%s carries a pre-filled service-request mailto: %s"
                           % (page, m[:110]))

    # 2. check.html: the funnel gone, the methodology intact.
    chk = read("check.html")
    for phrase in ("Want it read with you", "Book a twenty-minute",
                   "twenty-minute record read", "Twenty minutes, no charge",
                   "with you watching"):
        if phrase in chk:
            bad.append("check.html has regained founder-service language: %r" % phrase)
    for keep in ("The seven failure modes", "Fluent groundlessness",
                 "What this page does not do"):
        if keep not in chk:
            bad.append("check.html lost self-directed methodology content: %r" % keep)
    if '<meta name="robots"' in chk:
        bad.append("check.html must stay indexable; it is a public resource, not a retired page")

    # 3. engagement.html metadata archival, not only its body.
    eng = read("engagement.html")
    for m in re.findall(r'<title>([^<]*)</title>', eng) + \
             re.findall(r'<meta property="og:title" content="([^"]*)"', eng):
        if "engagement works" in m or "engagement work " in m:
            bad.append("engagement.html metadata is present-tense again: %r" % m)
    for m in re.findall(r'<meta name="description" content="([^"]*)"', eng) + \
             re.findall(r'<meta property="og:description" content="([^"]*)"', eng):
        if "Written to be forwarded" in m:
            bad.append("engagement.html description reads as an active procurement pathway")

    # 4. The standard / engine hierarchy on all four pages that must carry it.
    for page in ("index.html", "jrsstandard.html", "enterprise.html",
                 "review-engine.html"):
        src = read(page)
        if "technical implementation of that" not in src:
            bad.append("%s no longer distinguishes the standard from the engine" % page)
    if "It is not software and it needs none" not in read("jrsstandard.html"):
        bad.append("jrsstandard.html lost the independence half of the hierarchy")

    # 5. terms.html stays historical about closed engagements.
    tm = read("terms.html")
    for phrase in ("before the first engagement is signed", "before you engage",
                   "your scope is countersigned",
                   "How an engagement runs in practice"):
        if phrase in tm:
            bad.append("terms.html has regained forward-facing language: %r" % phrase)

    check("no founder-service funnel survives anywhere", not bad,
          "; ".join(bad[:6]) if bad else
          "0 pre-filled service mailto site-wide; check.html clean and indexable; "
          "engagement metadata archival; hierarchy on 4 pages; terms historical")


def check_tracked_guides_carry_exactly_one_routing_page(offline):
    """Each tracked field guide ends with exactly one Check routing page.

    WHY. On 2026-09-13 the three tracked guides gained a routing page appended
    by scripts/generate_field_guides.py. Once published, the shipped file IS
    the routed document, so a second --build would append a SECOND routing page
    and the guide would grow a page on every run. The script now skips an
    already-routed guide, but a script can be edited and a PDF can be replaced
    by hand, so the invariant is enforced here rather than trusted there.

    It also catches the opposite failure: a guide republished from an old copy
    would lose the routing page silently, and the route to the diagnostic would
    disappear from the asset without anything else changing.

    Scope is the three editions api/dl.js tracks behind ?e=. The combined
    overview is a separate untracked distribution and is deliberately excluded;
    it must NOT carry a routing page.
    """
    import subprocess as _sp

    tracked = ["JRS_Investigator_Field_Guide_Employment.pdf",
               "JRS_Investigator_Field_Guide_FairHousing.pdf",
               "JRS_Investigator_Field_Guide_International.pdf"]
    MARK = "jrsstandard.com/check"
    findings = []

    def pages(path):
        out = _sp.run(["pdfinfo", path], capture_output=True, text=True).stdout
        m = re.search(r"^Pages:\s+(\d+)", out, re.M)
        return int(m.group(1)) if m else 0

    def text(path, i):
        return _sp.run(["pdftotext", "-f", str(i), "-l", str(i), path, "-"],
                       capture_output=True, text=True).stdout or ""

    for name in tracked:
        path = os.path.join(ROOT, name)
        if not os.path.exists(path):
            findings.append("%s missing" % name)
            continue
        n = pages(path)
        if not n:
            findings.append("%s unreadable" % name)
            continue
        hits = sum(1 for i in range(1, n + 1) if MARK in text(path, i))
        if hits != 1:
            findings.append("%s has %d routing pages, expected exactly 1" % (name, hits))
        elif MARK not in text(path, n):
            findings.append("%s routing page is not the last page" % name)

    combined = os.path.join(ROOT, "JRS_Investigator_Field_Guide.pdf")
    if os.path.exists(combined):
        n = pages(combined)
        if n and any(MARK in text(combined, i) for i in range(1, n + 1)):
            findings.append("the untracked combined overview gained a routing page")

    check("tracked guides carry exactly one routing page",
          not findings,
          "; ".join(findings) if findings
          else "3 tracked guides, 1 routing page each on the last page; combined overview clean")


def check_disclosed_retention_matches_the_policy(offline):
    """The retention period a reader is told equals the period in the code.

    WHY THIS GUARD EXISTS. BD-10 set a 90-day expiry for record-derived fields.
    BD-12 then disclosed it, because having chosen a period and not published it
    was the weaker position: the pages said model output about the record "is
    retained" and never said for how long.

    THE DRIFT THIS PREVENTS is specific and likely: someone changes
    ENGINE_REVIEW_RETENTION.months and the public pages keep saying 90 days. The
    disclosure then becomes false without anyone editing a sentence, which is the
    hardest kind of false statement to notice.

    It also holds the three-category shape. A bare "90 days" would let a reader
    conclude the whole row is deleted, which is worse than silence, so the guard
    requires the retained-evidence half and the never-stored half alongside it.
    """
    findings = []
    pol = read("lib/retention/policy.js")
    # CORRECTED 2026-09-16, same day. This read `months:` and then computed
    # `days = months * 30`. That conversion was an ASSUMPTION WRITTEN INTO A
    # GUARD TO MAKE TWO NUMBERS AGREE, and it was hiding a real defect: the
    # policy expired at three CALENDAR months, which is 89 to 92 days depending
    # on the month, against a public page promising 90. On the date the
    # disclosure was written the true window was 92 days, so the page understated
    # retention by two days and this guard passed. The policy now declares days,
    # the guard reads days, and no conversion happens anywhere.
    # STRUCTURE, NOT CONTAINMENT, and the first version of this correction proved
    # why in the same minute it was written: a lazy `.*?` scan for "months:"
    # matched the COMMENT explaining that months had been removed. Sixth time on
    # this project. So: take the object literal only, up to its own closing
    # brace, and strip line comments before reading a field out of it.
    lit = re.search(r"ENGINE_REVIEW_RETENTION\s*=\s*\{(.*?)\n\};", pol, re.S)
    if not lit:
        check("disclosed retention matches the policy", False,
              "cannot locate the ENGINE_REVIEW_RETENTION object literal")
        return
    decl = re.sub(r"//[^\n]*", "", lit.group(1))
    m = re.search(r"\bdays:\s*(\d+)", decl)
    if not m:
        check("disclosed retention matches the policy", False,
              "ENGINE_REVIEW_RETENTION declares no DAY count. If the policy has "
              "gone back to calendar months, the disclosed number and the enforced "
              "number are no longer the same number: a month is 28 to 31 days and "
              "the public page states a fixed figure. That is the defect this "
              "guard was corrected to catch, not a reason to convert units here")
        return
    days = int(m.group(1))
    if re.search(r"\bmonths:\s*\d+", decl):
        findings.append("ENGINE_REVIEW_RETENTION declares months again alongside "
                        "days; a calendar month is 28 to 31 days and the public "
                        "page states a fixed number, so the two cannot both hold")

    PAGES = ("security.html", "privacy.html")
    for rel in PAGES:
        body = read(rel)
        if not body:
            findings.append("%s is missing" % rel)
            continue
        low = body.lower()
        anchor = "kept for %d days" % days
        i = low.find(anchor)
        if i == -1:
            findings.append("%s does not disclose the %d-day period the policy sets"
                            % (rel, days))
            continue
        # PROXIMITY, NOT PAGE-WIDE. A mutation removing the retained-evidence
        # clause from the disclosure sentence passed a page-wide search on
        # 2026-09-16, because "condition statuses" also appears in an unrelated
        # retention table further down. The two qualifying halves must sit WITH
        # the period, or a reader meets the period without them.
        window = low[i:i + 700]
        if "condition statuses" not in window:
            findings.append("%s discloses a period without saying what is RETAINED "
                            "alongside it; a bare period reads as the whole record being "
                            "deleted" % rel)
        if "never stored at all" not in window:
            findings.append("%s does not state, alongside the period, that the submitted "
                            "record is never stored" % rel)
        # Wording that would overclaim.
        for phrase in ("all data is deleted", "everything is deleted",
                       "no data is retained", "nothing is retained"):
            if phrase in low:
                findings.append("%s claims %r, which is false: the evaluation record remains"
                                % (rel, phrase))

    check("disclosed retention matches the policy",
          not findings,
          "; ".join(findings) if findings
          else "policy sets %d days, read from the literal with no unit conversion; "
               "both pages disclose that same number and state what is retained and "
               "what is never stored" % (days,))


def check_record_derived_fields_have_no_export_path(offline):
    """No public read path returns model text derived from a customer's record.

    WHY THIS GUARD EXISTS. engine_reviews holds a per-condition note the prompt
    requires to be "grounded in the record text" and finding.compliant_version,
    a model rewrite of the customer's passage up to 600 characters. Those are the
    most sensitive fields in the estate's persistence layer.

    Two export paths reached them and both were found by audit rather than by a
    guard: engine-activity.html read the table directly with the publishable key
    (B-013 limb A), and research-data.html offered it as a data-room export with
    select=* (T-11, found 2026-09-16 while deciding T-4). Both were latent only
    because the table holds zero rows.

    WHAT IT CHECKS
      1. No deployable page selects * from engine_reviews.
      2. No deployable page selects the record-derived columns by name.
      3. api/engine-activity.js, the one sanctioned read path, does not name them.
      4. The retention policy still carries a decision id, a version and an
         effective date, and still computes rather than deletes.
    """
    findings = []
    DERIVED = ("compliant_version", "input_preview")

    # ALLOW-LIST, PARSED FROM THE QUERY, added 2026-09-16 by the Round F
    # verification pass, and it was added because this branch FAILED a directed
    # test. It previously checked two things: literal "select=*", and whether a
    # derived column name appeared anywhere in the page BUT ONLY IF the page did
    # not mention BD-11 or BD-02. research-data.html mentions BD-11 in the very
    # comment describing its own safe projection, so the column check was
    # switched off for the one page it most needed to cover. A mutation adding
    # `conditions` to that page's select list PASSED: `conditions` carries
    # conditions[].note, the per-condition text grounded in the customer's
    # record, so the guard would have let a record-derived export through.
    #
    # The two public read paths must enforce the SAME boundary. The endpoint is
    # checked by column name below; the browser paths are now checked the same
    # way, by parsing the select list and requiring every column to be permitted
    # rather than by looking for known-bad names. A column added to the schema
    # tomorrow is refused by default instead of silently exported.
    PUBLIC_SELECT_ALLOWED = {
        "created_at", "determination", "runs", "overall_consistency",
        "engine_version", "id", "request_id",
    }
    for rel in _html_files():
        body = read(rel)
        for sel in re.findall(r"engine_reviews\?select=([^'\"&\s]+)", body):
            if sel.strip() == "*":
                findings.append("%s exports engine_reviews with select=*, which "
                                "returns record-derived model text" % rel)
                continue
            for col in [c.strip() for c in sel.split(",") if c.strip()]:
                bare = col.split("(")[0].split(":")[-1].strip()
                if bare not in PUBLIC_SELECT_ALLOWED:
                    findings.append(
                        "%s selects %r from engine_reviews, which is not on the "
                        "public projection allow-list. conditions carries "
                        "conditions[].note and finding carries compliant_version, "
                        "both derived from the customer's record" % (rel, bare))
        # REMOVED 2026-09-16 by the guard-integrity sweep. This branch read:
        #
        #     if col in body and "BD-11" not in body and "BD-02" not in body:
        #
        # It was the exemption that let a `conditions` export through on
        # research-data.html, because that page names BD-11 in the comment
        # describing its own projection. The allow-list above SUPERSEDES it and
        # is strictly stronger: it parses the query and refuses any column not
        # explicitly permitted, including columns that do not exist yet.
        #
        # It is deleted rather than left beside the allow-list because a
        # known-defective branch sitting next to a working one is how a later
        # reader concludes the defective behaviour was intentional.

    act = read("api/engine-activity.js")
    if act:
        # The select list is the control. Comments explaining what is excluded are
        # expected; a column name inside the select string is not.
        m = re.search(r"const select = '([^']+)'", act)
        if not m:
            findings.append("api/engine-activity.js no longer declares an explicit select list")
        else:
            for col in DERIVED + ("note", "finding"):
                if col in m.group(1):
                    findings.append("api/engine-activity.js select list now includes %r" % col)

    pol = read("lib/retention/policy.js")
    if pol:
        # STRUCTURE, NOT SUBSTRING. A mutation stripping `decision: 'BD-10'`
        # passed a substring check on 2026-09-16, because "BD-10" survives in the
        # comments that explain it. Match the declared FIELDS instead.
        for label, pattern in (
                ("decision id", r"decision:\s*'BD-10'"),
                ("policy version", r"version:\s*'[^']+'"),
                ("effective date", r"decided:\s*'\d{4}-\d{2}-\d{2}'"),
                ("engine-review rule", r"export const ENGINE_REVIEW_RETENTION\b"),
                ("explicit expiring field list", r"expiring_fields:\s*\["),
                ("explicit retained field list", r"retained_fields:\s*\["),
        ):
            if not re.search(pattern, pol):
                findings.append("retention policy no longer declares its %s" % label)
        if re.search(r"(?i)\bDELETE\b", re.sub(r"//.*", "", pol)):
            findings.append("retention policy contains a DELETE operation; it must compute only")
        if re.search(r"\bfetch\s*\(", pol):
            findings.append("retention policy performs a fetch; it must compute only")
        if "'engine_reviews'" in pol and re.search(
                r"excluded_tables:\s*\[[^\]]*'engine_reviews'", pol):
            findings.append("engine_reviews is back in excluded_tables, so BD-10's rule "
                            "would not apply to it")

    check("record-derived fields have no export path",
          not findings,
          "; ".join(findings) if findings
          else "no page exports engine_reviews with select=*; the sanctioned endpoint's "
               "select list excludes note, finding and the derived columns; retention "
               "policy is versioned and computation-only")


def check_no_unapproved_outbound_destination(offline):
    """Every outbound host in the estate is in the approved inventory.

    WHY THIS GUARD EXISTS. The processor disclosure on privacy.html is only true
    while the set of outbound destinations is the set that was disclosed. The
    failure mode is not someone writing a false sentence; it is someone adding a
    fetch and nobody remembering the disclosure page exists.

    This FAILS CLOSED. A host that is not in
    .jrs/registries/OUTBOUND_DESTINATIONS.json is a failure, not a pass, which
    forces a human to classify it rather than letting silence be the default.

    CLASSIFICATION IS BY TRACED EXECUTION PATH. The inventory records OpenAI and
    Generative Language as CLOSED_RESEARCH, not ACTIVE, because api/run-study.js
    returns on STUDIES_CLOSED before any key is read, and the last study_runs row
    is 2026-08-21. A live cron entry and a present credential are not evidence of
    an active processor, which is exactly the mistake this file is guarding.

    It deliberately does NOT re-derive the classifications. It checks that the
    code and the inventory still describe the same set of destinations, and that
    the two dormancy flags the inventory relies on are still set in the code.
    """
    findings = []
    try:
        inv = json.loads(read(".jrs/registries/OUTBOUND_DESTINATIONS.json"))
    except Exception as e:
        check("no unapproved outbound destination", False,
              "approved inventory missing or unparseable: %r" % (e,))
        return

    approved = {d["host"]: d for d in inv.get("destinations", [])}
    # RETIRED entries are history, not live destinations. They are excluded from
    # the staleness check and are NOT treated as approved: if a retired host is
    # called again it is absent from `approved` and fails as unapproved, which is
    # the point. Added 2026-09-16 when BD-06 removed the verify-drift calls and
    # the guard correctly reported the entry as stale.
    retired = {d["host"] for d in inv.get("retired_destinations", [])}

    # WHAT THIS SCANS, AND WHY IT IS WIDER THAN IT WAS.
    # An adversarial pass on 2026-09-15 defeated the first version four ways:
    #   - a new api/shadow.mjs was invisible, because only ".js" was matched;
    #   - a root app.js was invisible, because only api/ and pages were walked;
    #   - supabase/functions/run-study/index.ts imports from esm.sh and was
    #     invisible on both counts, and esm.sh is a REAL destination that was
    #     missing from the inventory as a result;
    #   - plain http:// and protocol-relative //host were invisible, because the
    #     pattern required https://.
    # All four are closed here. Passing is now a statement about the repository,
    # not about api/ and the pages.
    # Protocol-relative URLs must be quoted or follow =, or every "// comment"
    # in the tree matches. That fired immediately on api/reviewer-eval.js, where
    # a comment line produced the "host" i.test. Absolute URLs need no such
    # anchor because "https://" is already unambiguous.
    HOST_RE = re.compile(
        r"""https?://([A-Za-z0-9][A-Za-z0-9._-]*\.[A-Za-z]{2,})"""
        r"""|['"=]\s*//([A-Za-z0-9][A-Za-z0-9._-]*\.[A-Za-z]{2,})""")
    CODE_EXT = (".js", ".mjs", ".cjs", ".ts", ".tsx", ".jsx")
    seen = {}
    for dirpath, dirs, files in os.walk(ROOT):
        rel_dir = os.path.relpath(dirpath, ROOT)
        rel_dir = "" if rel_dir == "." else rel_dir
        parts = rel_dir.split(os.sep) if rel_dir else []
        if any(p in (".git", "node_modules", "__pycache__", ".claude") for p in parts):
            dirs[:] = []
            continue
        for fn in sorted(files):
            if not fn.endswith(CODE_EXT):
                continue
            rel = os.path.join(rel_dir, fn) if rel_dir else fn
            try:
                body = read(rel)
            except Exception:
                continue
            for m in HOST_RE.findall(body):
                host = m[0] or m[1]
                if host:
                    seen.setdefault(host, rel)
    for rel in _html_files():
        for m in HOST_RE.findall(read(rel)):
            host = m[0] or m[1]
            if host:
                seen.setdefault(host, rel)

    for host in sorted(seen):
        if host not in approved:
            findings.append("%s calls out to %r, which is NOT in the approved outbound "
                            "inventory. Classify it and update the disclosure before "
                            "this passes." % (seen[host], host))

    # Hosts the inventory lists that no longer appear anywhere. Not a failure in
    # itself, but a stale inventory is how a disclosure drifts out of true.
    stale = [h for h in approved if h not in seen and h not in retired]
    if stale:
        findings.append("inventory lists %d host(s) no longer referenced anywhere: %s"
                        % (len(stale), ", ".join(sorted(stale))))

    # The two flags the CLOSED_RESEARCH and DORMANT rows depend on.
    if not re.search(r"STUDIES_CLOSED\s*=\s*true", read("api/_study-status.js")):
        findings.append("STUDIES_CLOSED is no longer true, so the CLOSED_RESEARCH "
                        "classification for OpenAI and Generative Language is false")
    if not re.search(r"const\s+ALERTS_ENABLED\s*=\s*false", read("api/_notify.js")):
        findings.append("ALERTS_ENABLED is no longer false, so the DORMANT "
                        "classification for Resend and SendGrid is false")

    by_class = {}
    for d in approved.values():
        by_class[d["classification"]] = by_class.get(d["classification"], 0) + 1
    summary = ", ".join("%s %d" % (k.lower(), v) for k, v in sorted(by_class.items()))

    check("no unapproved outbound destination",
          not findings,
          "; ".join(findings) if findings
          else "%d hosts referenced, all approved (%s); dormancy flags intact"
               % (len(seen), summary))


def check_manifest_implementation_is_not_deployable(offline):
    """Manifest implementation directories stay out of the deployable set.

    WHY THIS GUARD EXISTS. The red-team pass on 2026-09-15 flagged that
    lib/manifest/, tools/ and tests/manifest/ sit in a repository that deploys
    to a public host, and that nobody had checked whether they would be served.
    They would have been.

    VERIFIED ON PRODUCTION RATHER THAN ASSUMED: /openapi.json and
    /openapi-review-engine.json both return 200. A root .json not listed in
    .vercelignore IS served, so a .js under lib/ or tools/ would have been too.
    An existing served file answered the question; nothing was deployed to find
    out.

    The rule is PUBLICIZE THE STANDARD, PROTECT THE IMPLEMENTATION. Generator
    internals, the offline validator and the test harness are implementation.

    schemas/ is different and is excluded for a different reason: the schema is
    a GOOD publication candidate, but publishing is a Section 23 act requiring
    human approval, so the exclusion is written to be removed deliberately. If
    that rule disappears without a recorded decision, this guard fires, because
    a publication that happened by accident is the thing being prevented.
    """
    rules = read(".vercelignore")
    findings = []
    # *.sql added 2026-09-15: ten root schema files were deployable and one
    # published the anon SELECT grant that B-013 limb A treats as the open exposure.
    if not re.search(r"(?m)^\*\.sql\s*$", rules):
        findings.append("*.sql is not excluded in .vercelignore; root schema files "
                        "publish table structures and anon grants at guessable URLs")
    for d in ("lib/", "tools/", "tests/", "schemas/",
              "docs/manifest-independent-review/"):
        if not re.search(r"(?m)^%s\s*$" % re.escape(d), rules):
            findings.append("%s is no longer excluded in .vercelignore and would be "
                            "served as static files on the next deployment" % d)
    # The engine layer must never move under an excluded path, or the Edge
    # Functions would stop being deployed at all.
    if re.search(r"(?m)^api/\s*$", rules):
        findings.append("api/ is excluded, which would stop the Edge Functions being "
                        "deployed at all")
    # Directories .vercelignore actually excludes, read from the file itself.
    excluded_prefixes = tuple(
        line.strip() for line in rules.splitlines()
        if line.strip().endswith("/") and not line.strip().startswith(("#", "!"))
    )

    # A copy of an excluded file at a non-excluded path is the same exposure.
    # This happened on 2026-09-15: building the independent-review package copied
    # tools/validate-manifest.js and the schema into docs/, outside every rule
    # then in force. Catching the DUPLICATE is what stops the exclusion being
    # defeated by a copy rather than by an edit.
    # DUPLICATION-BASED EXPOSURE, not merely path-based exposure.
    #
    # A path rule protects a path. On 2026-09-15 the exclusion was defeated
    # within the hour by COPYING the validator and the schema into docs/. So
    # this matches on CONTENT SIGNATURE as well as filename, which also catches
    # a rename, a changed extension and a nested copy under a new directory.
    protected_names = ("validate-manifest.js", "build.js", "canonicalize.js",
                       "hash.js", "run.mjs",
                       "jrs-decision-reconstruction-manifest.schema.json")
    # Distinctive strings from each implementation file. A copy that renames the
    # file still carries these; a file that does not carry them is not a copy.
    signatures = (
        ("manifest generator", "manifest_build_failed: unknown condition_vocabulary"),
        ("offline validator", "is not implemented by this validator, so the manifest hash"),
        ("canonicalizer", "CANONICALIZATION_ID = 'jrs-dev-canon-1'"),
        ("manifest schema", '"$id": "https://www.jrsstandard.com/schemas/jrs-decision'),
        ("test harness", "RT forged no_record_content with notes is REJECTED"),
        # A GENERATED MANIFEST itself. Caught by a mutation on 2026-09-15 that
        # copied a fixture to the repository root and passed: the first draft
        # protected the code and forgot the artifacts the code produces. A
        # manifest is low-sensitivity by design, but it still carries engine
        # versions and model identifiers, and a manifest at a guessable public
        # path is a disclosure nobody decided to make. The intentional copy in
        # the independent-review package lives in an excluded directory, so it
        # does not trip this.
        ("generated manifest", '"canonicalization": "jrs-dev-canon-1"'),
    )
    protected = protected_names
    for dirpath, dirs, files in os.walk(ROOT):
        rel = os.path.relpath(dirpath, ROOT)
        if rel == ".":
            rel = ""
        if any(part in (".git", "node_modules", "__pycache__") for part in rel.split(os.sep)):
            continue
        prefix = (rel + "/") if rel else ""
        # SKIP SET DERIVED FROM .vercelignore, not hardcoded. A hardcoded list
        # drifts out of step with the file that actually governs deployment, and
        # on 2026-09-15 it also made this guard match ITSELF: removing the
        # extension allow-list meant check_zero_drift.py, which necessarily
        # contains the signature strings as literals, looked like a copy.
        if any(prefix.startswith(x) for x in excluded_prefixes):
            continue
        for fn in files:
            rel_path = prefix + fn
            if fn in protected:
                findings.append("%s sits outside every exclusion rule; a copy at a "
                                "servable path defeats the exclusion" % rel_path)
                continue
            # Renamed, re-extensioned or nested copies: match on content.
            # EXTENSION ALLOW-LIST REMOVED. An adversarial pass on 2026-09-15
            # defeated this guard by copying the validator to .svg and .css and
            # the schema to .xml, none of which were in the old list, all of
            # which Vercel serves. Scan everything that is plausibly text and
            # let the signature decide, rather than trusting a file extension.
            if os.path.splitext(fn)[1].lower() in (
                    ".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico", ".pdf",
                    ".woff", ".woff2", ".ttf", ".zip", ".gz", ".docx", ".mp4"):
                continue
            try:
                body = read(rel_path)
            except Exception:
                continue
            # SIZE CAP REMOVED for signature scanning. The same pass defeated the
            # guard by padding a copy past 400 KB. A large file is exactly where
            # someone would hide one.
            if len(body) > 8000000:
                continue
            for label, sig in signatures:
                if sig in body:
                    findings.append("%s carries the %s content signature but sits "
                                    "outside every exclusion rule; a renamed or "
                                    "re-extensioned copy defeats the exclusion"
                                    % (rel_path, label))
                    break

    check("manifest implementation is not deployable",
          not findings,
          "; ".join(findings) if findings
          else "5 implementation paths excluded, no protected file copied outside "
               "them; api/ still deployable")








def _strip_py_docstrings(text):
    """Remove triple-quoted blocks so a guard reads code and not prose about it."""
    text = re.sub(r'"' * 3 + r'(?:.|\n)*?' + r'"' * 3, "", text)
    text = re.sub(r"'" * 3 + r"(?:.|\n)*?" + r"'" * 3, "", text)
    return text











def _assertion_units(body):
    """Split a record into the smallest spans that can carry ONE assertion.

    WHY THIS EXISTS. Guards in this file judged an old-state wording by whether a
    superseding marker appeared within a few hundred characters of it. On
    2026-09-18 an estate-wide sweep built on that same rule missed THREE live
    stale claims -- each sat near an unrelated CLOSED or OWNER-CONFIRMED marker
    belonging to a different sentence. Proximity is not scope. A marker excuses
    the sentence it is in, and nothing else.

    Four things this gets right that a window and a line-split do not:
      - A MARKDOWN TABLE ROW IS ONE UNIT, never its cells: the subject is in
        column 1 and its status in column 3, and splitting on "|" severs them.
      - PROSE IS SOFT-WRAPPED here, so a newline mid-sentence is joined - and
        joined length-preservingly, because rebuilding the text with " ".join()
        shifts every offset and matches then resolve to the wrong unit.
      - EXPRESSLY RETIRED TEXT is blanked, so wording kept under Rule 10 is not
        read back as a live claim.
      - A "~~" IS ITSELF A BOUNDARY: struck text and the note replacing it are
        never one assertion, and they are often not separated by ". ".
    """
    text = re.sub(r"^\s*>\s?", "", body, flags=re.M)
    text = re.sub(r"[ \t]+", " ", text)

    lines = text.split("\n")
    def _hard(l):
        s = l.strip()
        return (not s) or l.count("|") >= 2 or s.startswith(("#", "```", "|")) \
               or bool(re.match(r"(?:[-*+]|\d+\.)\s", s))
    out = []
    for i, l in enumerate(lines):
        out.append(l)
        if i < len(lines) - 1:
            out.append(" " if not (_hard(l) or _hard(lines[i + 1])) else "\n")
    text = "".join(out)
    # Struck spans AND wording quoted as prior text. A JSON record cannot carry
    # a strikethrough, so BLOCKERS.json preserves superseded wording the only way
    # it can - by quoting it after "prior text read". Without this, the guard
    # read a correction's own citation of what it corrected as a fresh defect,
    # which would punish the exact practice Rule 10 requires.
    text = re.sub(r"~~.+?~~|prior text read '.+?'",
                  lambda m: " " * len(m.group(0)), text, flags=re.S)

    units = []
    for lm in re.finditer(r"[^\n]+", text):
        line, base = lm.group(0), lm.start()
        if line.count("|") >= 2:
            units.append((base, base + len(line), line))
            continue
        cuts = [0] + [m.end() for m in
                      re.finditer(r"(?<=[.!?])\s+(?=[A-Z*_`~(\[])|~~", line)] + [len(line)]
        for a, b in zip(cuts, cuts[1:]):
            s = line[a:b].rstrip()
            units.append((base + a, base + a + len(s), s))
    return text, units


def _json_string_fields(rel):
    """Every string value in a JSON record, labelled by its key path.

    A JSON file has no sentences and no table rows. Its unit is the FIELD, and
    the field's KEY carries the record's own statement about whether the value is
    current or archived. Scanning the serialized bytes instead throws that away.
    """
    out = []
    try:
        data = json.loads(read(rel) or "null")
    except ValueError:
        return out

    def walk(node, label):
        if isinstance(node, dict):
            ident = node.get("id") or node.get("blocker_id") or ""
            for k, v in node.items():
                walk(v, "%s.%s.%s" % (label, ident, k) if ident else "%s.%s" % (label, k))
        elif isinstance(node, list):
            for i, v in enumerate(node):
                walk(v, "%s[%d]" % (label, i))
        elif isinstance(node, str):
            out.append((label, node))

    walk(data, "")
    return out


def check_ledger_index_matches_the_ledger(offline):
    """The register's evidence index equals the ledger's actual entry count.

    WHY THIS GUARD EXISTS. The register's own section 23 records that this exact
    step was missed: the index read "27 entries, E-001 to E-027" while the ledger
    already held 28, and it stayed wrong until a later cycle noticed. Section 24
    makes updating the index part of the update rule, and a rule that has already
    failed once is a rule that needs a control rather than another reminder.

    WHAT IT CHECKS. The count stated in the register, the range it names, and the
    number of entries actually in the ledger all agree.
    """
    findings = []
    led = read("docs/enterprise-diligence/EVIDENCE_LEDGER.md")
    reg = read("docs/enterprise-diligence/"
               "JRS_MASTER_ASSET_EVIDENCE_AND_CHAIN_OF_TITLE_REGISTER.md")
    if not led or not reg:
        check("ledger index matches the ledger", False,
              "the ledger or the master register is missing")
        return

    ids = re.findall(r"^\| (E-\d{3}) \|", led, re.M)
    actual = len(ids)
    highest = max(ids) if ids else "E-000"

    # A SPELLED-OUT COUNT EVADES EVERY NUMERIC GUARD IN THIS SUITE, so it is
    # rejected rather than parsed. FOUND BY MUTATION 2026-09-20: replacing
    # "**38 ledger entries.**" with "**thirty-seven ledger entries.**" left this
    # guard silent and the discovery sweep silent with it, because both look for
    # digits. Teaching the guard to read number words would widen the parser and
    # leave the next spelling to be discovered the same way. The narrower and
    # more durable rule is that the ledger count is asserted in digits, which is
    # how every count in this estate is already written.
    WORDS = ("twenty", "thirty", "forty", "fifty", "sixty")
    for src, name in ((led, "EVIDENCE_LEDGER.md"),
                      (reg, "the master register")):
        for w in WORDS:
            for mw in re.finditer(w + r"[a-z-]*", src, re.I):
                tail = src[mw.end():mw.end() + 40].lower()
                if "ledger entr" in tail or "entries" in tail.split(".")[0]:
                    findings.append("%s states the ledger count in words (%r); "
                                    "counts are asserted in digits so they stay "
                                    "discoverable" % (name, mw.group(0)))

    m = re.search(r"`EVIDENCE_LEDGER\.md`,\s*\*\*(\d+) entries\*\*,\s*E-001 to (E-\d{3})", reg)
    if not m:
        findings.append("the register's evidence index no longer states a count and a range "
                        "in the form section 23 established")
    else:
        stated, stated_top = int(m.group(1)), m.group(2)
        if stated != actual:
            findings.append("the register's index says %d ledger entries; the ledger holds %d. "
                            "This is the drift section 23 records happening once already"
                            % (stated, actual))
        if stated_top != highest:
            findings.append("the register's index names the range ending %s; the ledger's "
                            "highest entry is %s" % (stated_top, highest))

    t2 = re.search(r"\*\*(\d+) ledger entries\*\* in `EVIDENCE_LEDGER\.md`", reg)
    if t2 and int(t2.group(1)) != actual:
        findings.append("the register's traceability row says %s entries; the ledger holds %d"
                        % (t2.group(1), actual))

    # THE LEDGER'S OWN COUNT, WHICH THIS GUARD ORIGINALLY DID NOT READ.
    # It checked the register's two references and nothing in the ledger itself.
    # On 2026-09-19 E-037 and E-038 were added, the register's index was moved to
    # 38, and the ledger's own footer stayed at 36 -- so the two canonical records
    # disagreed, with the authoritative one correct and the source wrong. A guard
    # that reads only the pointer and never the thing pointed at will always miss
    # that direction. Struck text is masked first: the corrected footer preserves
    # the old figure beside the new one, and reading the preserved value would
    # report the correction as the defect.
    led_live = re.sub(r"~~.+?~~", " ", led, flags=re.S)
    for m in re.finditer(r"\*\*(\d+) ledger entries\.?\*\*", led_live):
        if int(m.group(1)) != actual:
            findings.append("the ledger's own footer says %s entries while the ledger holds "
                            "%d rows. The ledger was stale about itself" % (m.group(1), actual))
            break

    # ---------------------------------------------------------------
    # DYNAMIC DISCOVERY, because a fixed list of places has failed FOUR TIMES.
    # The count was corrected in the ledger footer and the register's two
    # references, and each time a further copy surfaced afterwards: the ledger's
    # own footer, then `.jrs/registries/EVIDENCE_LEDGER.json` (28 against 38),
    # then `DEPENDENCY_REGISTER.json`'s key-person evidence field (36) and
    # `docs/enterprise-diligence/README.md` (27). Every one was missed the same
    # way -- the guard checked the places it had been told about.
    #
    # It no longer holds a list. It SEARCHES the tracked repository for anything
    # asserting a ledger entry count and requires every LIVE one to equal the
    # count derived from the ledger's physical rows. A representation added
    # tomorrow is covered the day it appears, with nobody remembering to register
    # it.
    #
    # A record is exempt only when it classifies ITSELF historical in its opening
    # block, or when the assertion is struck through or quoted as prior wording.
    # Those exemptions are structural, and the count of them is reported rather
    # than hidden.
    ASSERTION = [
        re.compile(r"\*\*(\d+) ledger entries", re.I),
        re.compile(r"(?<!\*)\b(\d+) ledger entries", re.I),
        re.compile(r"`?EVIDENCE_LEDGER\.md`?[^.\n]{0,70}?\b(\d+)\s+entries", re.I),
        re.compile(r"\b(\d+)\s+entries\*{0,2},\s*E-001 to E-\d{3}", re.I),
        re.compile(r'"?entry_count"?\s*[:=]\s*(\d+)'),
        # ENGLISH PROSE NAMING THE LEDGER. An adversarial pass showed "The
        # evidence ledger contains 31 entries" passing silently: the filename
        # pattern needs `EVIDENCE_LEDGER.md`, and a generated summary writes the
        # name in words. The estate already contains this form -- the
        # initialization report says "Evidence Ledger held **28** entries".
        re.compile(r"[Ee]vidence [Ll]edger\b[^.\n]{0,40}?\b\*{0,2}(\d+)\*{0,2}\s+entries"),
    ]
    # DELIBERATELY OUTSIDE THE DETECTION CONTRACT, with the reason recorded so
    # the boundary is a decision rather than an oversight:
    #   `ledger_count = N` and `"last_entry": "E-0NN"` -- neither key exists
    #     anywhere in this repository. Recognising them would be inventing a
    #     schema and guarding a shape nothing writes.
    #   a BARE range, "E-001 through E-031", with no count beside it -- this
    #     estate writes `E-001 to E-0NN` mostly as a SUBSET CITATION ("consents
    #     E-001 to E-004"), not as an extent claim, so a bare-range rule would
    #     fire on correct prose. An extent claim here is written WITH its count
    #     ("38 entries, E-001 to E-038") and that form is already covered.
    HEAD_HIST = re.compile(
        r"HISTORICAL EXECUTION RECORD|HISTORICAL RECORD|NOT THE PRIMARY REGISTER|"
        r"NOT CURRENT-STATE AUTHORITY|COMPLETED GATE RECORD|APPEND-ONLY DATED LOG|"
        r"HISTORICAL \u2014 20\d\d-\d\d-\d\d REPORT", re.I)
    # "the index read \"27 entries\"" is a QUOTATION OF HISTORY, and this guard's
    # own docstring contains one. Discovery flagged it on its first run, which is
    # the right behaviour from a rule that was too narrow: a straight quote after
    # "read" is the same construct as the asterisked one it already knew.
    QUOTED = re.compile(r"\bwas \d|previously|prior|CORRECTED|SUPERSEDED|stale|"
                        r"read [\*\"\u201c']|index note|\(was |holds \*\*\d+\*\*|"
                        # "self-describing" was in this list from when the
                        # dependency register's key-person field held the STALE
                        # value and I was excluding it. That is exactly backwards:
                        # an exclusion added to quieten a defect hides the field
                        # after it is fixed. A mutation proved it - changing that
                        # field to 37 did not fire.
                        r"already held", re.I)
    EXT = {".md", ".json", ".txt", ".yml", ".yaml", ".py", ".js", ".mjs", ".html"}

    try:
        tracked = subprocess.run(["git", "ls-files"], cwd=ROOT, capture_output=True,
                                 text=True, check=True).stdout.split()
    except Exception as exc:
        tracked = []
        findings.append("could not enumerate tracked files to discover count "
                        "representations: %r" % (exc,))

    live_reps = []
    exempt = 0
    for rel in tracked:
        if os.path.splitext(rel)[1].lower() not in EXT:
            continue
        body = read(rel)
        if not body:
            continue
        # THE FILE GATE MUST BE AS WIDE AS THE PATTERNS IT FEEDS. An adversarial
        # fixture saying "The evidence ledger contains 31 entries" stayed silent
        # even after the prose pattern was added, because the file was never
        # opened: the gate wanted `EVIDENCE_LEDGER` or the exact words "ledger
        # entries", and that sentence has neither. A cheap pre-filter that is
        # narrower than the test it guards silently shrinks the test.
        if not re.search(r"EVIDENCE_LEDGER|ledger entries|evidence ledger|entry_count",
                         body, re.I):
            continue
        if HEAD_HIST.search("\n".join(body.splitlines()[:45])):
            exempt += 1
            continue
        # A GUARD'S OWN PROSE ABOUT AN ASSERTION IS NOT THE ASSERTION. The new
        # English-prose pattern matched this file's own comment explaining it --
        # "the evidence ledger contains 31 entries" -- the ninth time in this
        # suite that commentary has been read as a claim. Python comments and
        # docstrings are stripped, length-preservingly, before matching; real
        # code stays visible.
        scan = body
        if rel.endswith(".py"):
            scan = re.sub(r'("""|\u0027\u0027\u0027)(?:.|\n)*?\1|#[^\n]*',
                          lambda mm: re.sub(r"[^\n]", " ", mm.group(0)), body)
        masked = re.sub(r"~~.+?~~", lambda mm: " " * len(mm.group(0)), scan, flags=re.S)
        for pat in ASSERTION:
            for mm in pat.finditer(masked):
                if masked[mm.start():mm.end()].strip() == "":
                    continue
                # THE LEAD, NOT A WINDOW. A 170-character context excluded the
                # live footer and both register references, because each sits in
                # a paragraph that also explains the correction -- so discovery
                # reported 2 assertions where it should have reported 6. A value
                # is history when the words IMMEDIATELY BEFORE IT say so, not
                # when the paragraph around it discusses history.
                lead = re.sub(r"\s+", " ", masked[max(0, mm.start() - 40):mm.start()])
                if QUOTED.search(lead):
                    continue
                # A REPORTED CLAIM IS NOT AN ASSERTION. Two forms remained after
                # the lead rule: a value introduced by a reporting verb -- "the
                # document control SAYS **27 ledger entries**", which a
                # verification table writes in order to reject it -- and a value
                # sitting inside quotation marks, which is how the correction
                # history preserves superseded wording. Both are structure, not
                # a guess about tone.
                if re.search(r"\b(?:says|said|reads?|claimed?|stated?|asserts?)\s*\**[\"\u201c']?$",
                             lead, re.I):
                    continue
                # THE QUOTE RULE IS FOR PROSE CITATIONS AND MUST NOT APPLY TO
                # JSON. In markdown a quote before the value marks a citation of
                # superseded wording. In JSON every string value opens with one,
                # so this rule silently exempted EVERY JSON prose field -- the
                # dependency register's key-person evidence field among them,
                # proved by a mutation to 37 that did not fire. An exemption that
                # covers a whole file format is not an exemption, it is a hole.
                if not rel.endswith(".json") and re.search(r"[\"\u201c']\s*\**$", lead):
                    continue
                live_reps.append((rel, int(mm.group(1))))

    for rel, val in live_reps:
        if val != actual:
            findings.append("%s asserts %d ledger entries while the ledger holds %d rows. "
                            "Every live count derives from the same source or it is drift"
                            % (rel, val, actual))

    check("ledger index matches the ledger",
          not findings,
          "; ".join(findings) if findings
          else "ledger holds %d entries E-001 to %s, derived from its physical rows; "
               "%d live count assertion(s) DISCOVERED across %d tracked file(s) and every one "
               "agrees; %d record(s) exempt by explicit historical self-classification"
               % (actual, highest, len(live_reps), len(tracked), exempt))


def check_reliability_is_recorded_as_measured_and_failed(offline):
    """Reliability stays MEASURED WITH A FAILED CRITERION -- in BOTH directions.

    WHY THIS GUARD EXISTS. On 2026-09-19 a directive arrived instructing that the
    estate be corrected to record reliability as NOT MEASURED / NOT ASSESSED, on
    the stated premise that this was the already-established research-integrity
    determination. It was not. The live record establishes the opposite, and the
    directive carried its own exception for exactly that case.

    RELIABILITY WAS MEASURED. Gwet's AC1 on a defined sample, against a
    two-part pre-registered criterion, with confidence intervals computed two
    ways and a disclosed exclusion rule:
        invited        10 records, 36 labels,  8 raters, AC1 0.739, CI 0.402-1.000
        open enrolment 10 records, 68 labels, 14 raters, AC1 0.623, CI 0.252-0.993
    Both point estimates clear the 0.61 floor. BOTH ANALYTIC LOWER BOUNDS FALL
    BELOW 0.41. The criterion was tested and it failed on the lower-bound leg.

    THE ESTATE ALREADY GUARDED ONE DIRECTION AND NOT THE OTHER. A claim that the
    criterion WAS MET is caught: EVIDENCE_AND_LIMITATIONS_REGISTER B-4 records it
    VERIFIED FALSE, and the research-summary guard requires the concessions to
    survive. Nothing stopped the opposite error -- restating a measured, failed
    criterion as one that was never measured. That is not a softer claim; it is a
    DIFFERENT AND FALSE ONE, and it would delete a reported negative result that
    the authoritative record calls a strength of the work rather than a weakness
    to be managed. Absence of a measurement and a measurement that missed its
    threshold are not the same fact, and neither may be written over the other.

    WHAT IT CHECKS. The authoritative research status records reliability as
    measured; the figures and the failed leg survive; the sentence forbidding the
    result from being summarised as established survives; and no current record
    asserts that reliability was never measured or assessed.
    """
    findings = []
    REL = "docs/enterprise-diligence/RESEARCH_AND_VALIDATION_STATUS.md"
    body = read(REL)
    if not body:
        check("reliability is recorded as measured and failed", False,
              "%s is missing; it is the authoritative research status" % REL)
        return

    flat = re.sub(r"\s+", " ", body)
    for needle, why in (
        ("Human inter-rater reliability", "the reliability row itself"),
        ("Measured", "that reliability was MEASURED, not merely criterion-bearing"),
        ("0.739", "the invited-group coefficient"),
        ("0.623", "the open-enrolment coefficient"),
        ("0.402", "the expert lower bound that missed the 0.41 floor"),
        # THE TABLE CELLS, not just the numbers. A mutation deleted the invited
        # group's analytic interval and this check still passed, because "0.402"
        # also appears in the prose sentence beneath the table. Confirming a
        # figure survives SOMEWHERE is not confirming the table is intact.
        ("0.402 to 1.000", "the invited group's analytic confidence interval"),
        ("0.252 to 0.993", "the open-enrolment analytic confidence interval"),
        ("0.61", "the pre-registered point-estimate floor"),
        ("0.41", "the pre-registered lower-bound floor"),
        ('never be summarised as "reliability was established"',
         "the sentence forbidding the result from being read as validation"),
    ):
        if needle not in flat:
            findings.append("%s is gone from the research status (%r)" % (why, needle))

    # THE ERROR THIS GUARD WAS WRITTEN AFTER: a current record asserting the
    # measurement never happened. Scoped to current records; a correction
    # narrative quoting the phrase in order to reject it is not an assertion.
    NOT_MEASURED = re.compile(
        r"reliability[^.\n]{0,40}\b(?:was |is )?(?:not|never)\s+"
        r"(?:measured|assessed|computed|calculated|analysed|analyzed)|"
        r"\bno reliability (?:measurement|analysis|study)\b", re.I)
    CURRENT = [
        "docs/enterprise-diligence/JRS_MASTER_ASSET_EVIDENCE_AND_CHAIN_OF_TITLE_REGISTER.md",
        "docs/enterprise-diligence/EVIDENCE_LEDGER.md",
        "docs/enterprise-diligence/RESEARCH_AND_VALIDATION_STATUS.md",
        "docs/enterprise-diligence/EVIDENCE_AND_LIMITATIONS_REGISTER.md",
        "docs/enterprise-diligence/JRS_INSTITUTIONAL_CONTINUITY_INDEX.md",
    ]
    checked = 0
    for rel in CURRENT:
        b = read(rel)
        if not b:
            continue
        checked += 1
        # ROW SCOPE, NOT A CHARACTER WINDOW. The first version used +/-200
        # characters and fired on THIS PROJECT'S OWN CLAIM-CONTROL ROW, which
        # quotes the false claim in order to classify it VERIFIED FALSE -- the
        # exclusion words sat further away than the window reached. A claim
        # register records claims in order to reject them, so a guard that reads
        # the quotation as the assertion punishes the record for doing its job.
        # A table row is one unit here, as it is everywhere else in this suite.
        flat_b, units_b = _assertion_units(b)
        for m in NOT_MEASURED.finditer(flat_b):
            seg = next((u for s, e, u in units_b if s <= m.start() < e), "")
            if re.search(r"incorrect|prior representation|must not|rather than|"
                         r"would have|VERIFIED FALSE|not the established|"
                         r"zero\b|returned no|none located|stops a", seg, re.I):
                continue
            # A SCOPED STATEMENT IS NOT THE FALSE CLAIM. Established 2026-09-19
            # from the manuscript: reliability was measured on a SEPARATE SAMPLE,
            # not on the detection panel. "Reliability was not measured on this
            # panel or this corpus" is therefore TRUE and is the correction this
            # register needed. The prohibition is on the UNSCOPED claim that
            # reliability was never measured anywhere. This guard was written
            # before the two-sample architecture was established and would
            # otherwise block the more precise record it exists to protect.
            if re.search(r"on this (?:panel|corpus|sample|study)|in the detection panel|"
                         r"as an outcome of (?:the|this) (?:article|detection)|"
                         r"on the 24-record|by the detection (?:panel|study)|"
                         r"detection panel or this corpus", seg, re.I):
                continue
            findings.append("%s asserts reliability was not measured: %r. It WAS measured; "
                            "the criterion failed on the lower-bound leg, and a failed "
                            "measurement is not an absent one"
                            % (rel, m.group(0).strip()[:70]))
            break

    # THE CLAIM REGISTER'S TWO ROWS, ASSERTED BY THEIR CLASSIFICATION.
    # Flipping B-4b's classification from VERIFIED FALSE to VERIFIED left the
    # prose scan quiet, because the row still carried the words that excuse a
    # quotation. The classification is the controlling field, so it is read
    # directly rather than inferred from the sentence around it.
    # BOTH SAMPLES MUST BE NAMED IN THE REGISTER. Removing the detection-panel
    # scope line would let the criterion drift back onto the 16-expert study;
    # removing the reliability-sample block would delete the measurement.
    reg_body = read("docs/enterprise-diligence/"
                    "JRS_MASTER_ASSET_EVIDENCE_AND_CHAIN_OF_TITLE_REGISTER.md")
    if reg_body:
        reg_flat = re.sub(r"\s+", " ", reg_body)
        # EACH FIGURE INSIDE ITS OWN BLOCK, not anywhere in the file. Deleting
        # the detection panel's "384" and the reliability sample's "104" both
        # passed a whole-file check, because the correction-history row quotes
        # them too. Confirming a figure survives somewhere is not confirming it
        # survives where it belongs -- the third time this suite has learned it.
        DET_H = "**DETECTION PANEL \u2014 detection/performance MEASURED.**"
        REL_H = "**SEPARATE RELIABILITY SAMPLE \u2014 inter-rater reliability MEASURED"
        for head, why in ((DET_H, "the detection-panel evidence object"),
                          (REL_H, "the separate reliability sample as its own object")):
            if head not in reg_flat:
                findings.append("the master register no longer states %s. The two samples must "
                                "stay distinct or the criterion drifts back onto the detection "
                                "study" % why)
        if DET_H in reg_flat and REL_H in reg_flat:
            det_block = reg_flat[reg_flat.index(DET_H):reg_flat.index(REL_H)]
            rel_block = reg_flat[reg_flat.index(REL_H):][:1800]
            for block, name, needles in (
                (det_block, "detection panel",
                 [("384", "graded judgments"), ("83.9", "the accuracy result"),
                  ("24-record", "the corpus"), ("16 reviewers", "the panel size")]),
                (rel_block, "separate reliability sample",
                 [("104", "the deduplicated label count"),
                  ("25 reliability", "the participant count"),
                  ("0.739", "the invited coefficient"),
                  ("10 records", "the analysed record set")]),
            ):
                for needle, why in needles:
                    if needle not in block:
                        findings.append("the master register's %s block no longer states %s "
                                        "(%r). A sample described without its own parameters "
                                        "cannot be told apart from the other one"
                                        % (name, why, needle))

    # THE RESEARCH STATUS ROW MUST CARRY ITS SCOPE. Dropping "on the separate
    # reliability sample" from that row restores exactly the ambiguity this
    # correction removed, and nothing else in the suite would notice.
    if "Human inter-rater reliability" in flat:
        row = next((ln for ln in body.splitlines()
                    if ln.startswith("| Human inter-rater reliability |")), "")
        if not re.search(r"separate reliability sample", row, re.I):
            findings.append("the research status row for inter-rater reliability no longer "
                            "says it was measured on the SEPARATE reliability sample, so a "
                            "reader takes it as an outcome of the detection panel")
        if not re.search(r"not on the detection panel", row, re.I):
            findings.append("the research status row no longer states that reliability was "
                            "not measured on the detection panel")

    lim = read("docs/enterprise-diligence/EVIDENCE_AND_LIMITATIONS_REGISTER.md")
    if not lim:
        findings.append("the evidence and limitations register is missing; it carries the "
                        "two reliability claim controls")
    else:
        for rid, claim in (("B-4", "the criterion was met"),
                           ("B-4b", "reliability was not measured")):
            row = next((ln for ln in lim.splitlines()
                        if ln.startswith("| %s |" % rid)), None)
            if row is None:
                findings.append("claim control %s is gone. It is the register's record that "
                                "%r is false" % (rid, claim))
            elif "VERIFIED FALSE" not in row:
                findings.append("claim control %s no longer reads VERIFIED FALSE, so the "
                                "register now tolerates %r" % (rid, claim))

    check("reliability is recorded as measured and failed",
          not findings,
          "; ".join(findings[:3]) if findings
          else "reliability recorded MEASURED with both coefficients, both floors and the "
               "failed lower-bound leg intact; %d current record(s) checked and none asserts "
               "the measurement never happened" % checked)


def check_key_person_record_is_honest(offline):
    """The key-person record does not drift upward, and its one empirical claim stays true.

    WHY THIS GUARD EXISTS. A key-person assessment is the easiest document in an
    estate to write dishonestly. Every MATERIAL row can be softened to MODERATE
    by pointing at a document, and the page then reads as transferability. The
    test this register sets is deliberately harder: documentation that nobody has
    ever executed is a CLAIM about transferability, not evidence of it.

    WHAT IT CHECKS.
      1. All twenty functions are present and each carries a class and evidence.
      2. The bus-factor finding survives: two human committer identities, both
         the same person, and no second human has ever committed.
      3. THE ONE EMPIRICAL CLAIM IS RE-TESTED, not trusted: that verification
         runs from a bare clone with no credentials. If `check_zero_drift.py` or
         `verify_synchronization.py` ever starts requiring a credential, the
         largest transferability fact in the register becomes false and this
         fails.
      4. The non-transferable residue is not quietly emptied.

    WHAT IT DOES NOT CHECK. Whether a class is the RIGHT call. That is judgement.
    It checks that the record cannot improve without someone saying why.
    """
    findings = []
    raw = read(".jrs/registries/DEPENDENCY_REGISTER.json")
    if not raw:
        check("key-person record is honest", False, "the dependency register is missing")
        return
    reg = json.loads(raw)
    kp = reg.get("key_person")
    if not kp:
        findings.append("the key-person section is gone from the dependency register")
        check("key-person record is honest", False, "; ".join(findings))
        return

    fns = kp.get("functions", [])
    if len(fns) != 20:
        findings.append("key-person functions number %d, not the twenty assessed" % len(fns))
    VALID = {"LOW", "MODERATE", "MATERIAL", "CRITICAL"}
    for f in fns:
        if f.get("class") not in VALID:
            findings.append("function %r carries class %r, outside %s"
                            % (f.get("function"), f.get("class"), sorted(VALID)))
        if not (f.get("evidence") or "").strip():
            findings.append("function %r is classified with no evidence. A class without "
                            "evidence is an opinion" % f.get("function"))
        # THE CLASS IS DERIVED FROM THE EVIDENCE, NOT ASSERTED BESIDE IT.
        #
        # A mutation softened every MATERIAL row to MODERATE and the guard passed.
        # That is precisely the dishonesty its own docstring says it exists to
        # prevent: an assessment reads as transferability the moment someone
        # lowers the classes. The floor is therefore not pinned by fiat, which
        # would go stale; it is read off the row's OWN evidence. A function whose
        # evidence says it needs an account, a credential, a console or an act
        # only the owner can perform is at least MATERIAL, and if the evidence
        # genuinely changes the class may move with it.
        ev = (f.get("evidence") or "")
        needs_owner = re.search(
            r"\baccount\b|\bcredential\b|\bconsole\b|\bkey\b|ANTHROPIC_API_KEY|"
            r"deploy hook|Vercel|Supabase|registrar|only he can|owner['\u2019]s to give|"
            r"revocable at will|Level A instrument", ev, re.I)
        if needs_owner and f.get("class") in ("LOW", "MODERATE"):
            findings.append("function %r is classified %s while its own evidence says it needs "
                            "something only the owner holds (%r). Documentation that nobody "
                            "else can execute is a claim about transferability, not evidence "
                            "of it" % (f.get("function"), f.get("class"),
                                       needs_owner.group(0)))

    bf = kp.get("_bus_factor_evidence", {})
    if bf.get("bus_factor") != 1 or bf.get("human_committers_all_time") != 2:
        findings.append("the bus-factor finding changed to %r/%r. That is a material estate "
                        "fact and must be re-measured against `git shortlog`, not edited"
                        % (bf.get("bus_factor"), bf.get("human_committers_all_time")))

    tr = kp.get("_transfer_requirements", {})
    if len(tr.get("not_transferable_by_a_grant", [])) < 3:
        findings.append("the non-transferable residue has shrunk below three. The attestation "
                        "record, the rights determination and the relationships do not move "
                        "with an account, and removing one of them overstates transferability")

    # 3. RE-TEST THE EMPIRICAL CLAIM rather than believe the sentence recording it.
    if not offline:
        import subprocess as _sp
        env = {k: v for k, v in os.environ.items()
               if k not in ("SUPABASE_ACCESS_TOKEN", "VERCEL_TOKEN", "ANTHROPIC_API_KEY",
                            "SUPABASE_SERVICE_ROLE_KEY", "REVIEW_API_TOKEN")}
        env["JRS_OFFLINE"] = "1"
        r = _sp.run([sys.executable, os.path.join(ROOT, "scripts", "verify_synchronization.py")],
                    capture_output=True, text=True, env=env, cwd=ROOT)
        if "partition closed: True" not in r.stdout:
            findings.append("verification NO LONGER runs from a bare clone without credentials. "
                            "That was the single largest transferability fact in this register "
                            "and it was empirical; it is now false")

    check("key-person record is honest",
          not findings,
          "; ".join(findings[:3]) if findings
          else "20 function(s) classified with evidence; bus factor 1 on 2 human committer "
               "identities; 3 non-transferable items retained; credential-free verification "
               "re-tested and still reproduces the estate partition")


def check_blocker_evidence_targets_agree_with_the_blocker(offline):
    """A blocker's cited evidence does not contradict the blocker's own state.

    WHY THIS GUARD EXISTS. B-001 closed on 2026-09-18. Its `evidence_refs` name
    `SECURITY_REGISTER.json#incidents/SEC-001`, and on 2026-09-19 that incident
    still read `"status": "OPEN"` with the instruction "Revoke and reissue the
    token at Vercel Settings, Tokens." A reviewer following the blocker's OWN
    POINTER landed on a record saying the work was outstanding.

    The estate sweep could not see it, and no widening of the sweep would have.
    That record never names B-001, so no proposition pattern reached it. It was
    found by walking the pointer in the other direction -- from the blocker to
    what it cites -- which is a different traversal, not a bigger one.

    WHAT IT CHECKS. For each CLOSED blocker, each evidence target that lives in
    this repository is read, and the specific record it names must not still
    present the matter as outstanding.

    WHAT IT DOES NOT CHECK. Whether the evidence supports the closure. That is
    the ledger's job and a human's. This only stops a record and its own citation
    from saying opposite things.
    """
    findings = []
    raw = read(".jrs/state/BLOCKERS.json")
    if not raw:
        check("blocker evidence targets agree with the blocker", False,
              "the blocker registry is missing")
        return
    OUTSTANDING = re.compile(r'"status"\s*:\s*"(?:OPEN|OUTSTANDING|UNRESOLVED)"|'
                             r"\bstatus\b[^\n]{0,20}\bOPEN\b", re.I)
    checked = 0
    for b in json.loads(raw)["blockers"]:
        status = (b.get("status") or "").upper()
        closed = (("RESOLVED" in status or "OWNER-CONFIRMED" in status
                   or "COMPLETED" in status) and "NOT " not in status)
        if not closed:
            continue
        for ref in b.get("evidence_refs", []) or []:
            path, _, frag = str(ref).partition("#")
            path = path.strip()
            if not path or path.endswith(".md") and not os.path.exists(
                    os.path.join(ROOT, path)):
                # a ledger reference such as EVIDENCE_LEDGER.md#E-030 resolves by
                # entry id, checked by the ledger's own guards
                continue
            # locate the file, tolerating a bare filename under .jrs/registries
            cand = [path, os.path.join(".jrs/registries", os.path.basename(path)),
                    os.path.join("docs/enterprise-diligence", os.path.basename(path))]
            body = next((read(c) for c in cand if os.path.exists(os.path.join(ROOT, c))), None)
            if body is None:
                findings.append("%s cites %r and no such record exists. A closure that points "
                                "at nothing cannot be checked" % (b["blocker_id"], ref))
                continue
            checked += 1
            if not frag:
                continue
            ident = frag.rsplit("/", 1)[-1]
            # READ THE FIELD, NOT A TEXT WINDOW AROUND THE IDENTIFIER.
            # The first version scanned 600 characters after the id and excused
            # anything containing "prior_status" or "closure" -- words this very
            # record carries permanently BECAUSE it was corrected. Reverting the
            # status to OPEN therefore still passed. A JSON record has fields;
            # the field is the assertion and the text around it is not.
            if path.endswith(".json"):
                try:
                    data = json.loads(body)
                except ValueError:
                    findings.append("%s cites %s, which does not parse"
                                    % (b["blocker_id"], ref))
                    continue
                entry = None

                def _find(node):
                    global_found = None
                    if isinstance(node, dict):
                        if str(node.get("id")) == ident:
                            return node
                        for v in node.values():
                            global_found = _find(v)
                            if global_found:
                                return global_found
                    elif isinstance(node, list):
                        for v in node:
                            global_found = _find(v)
                            if global_found:
                                return global_found
                    return None

                entry = _find(data)
                if entry is None:
                    findings.append("%s cites %s and no entry %r exists in it"
                                    % (b["blocker_id"], ref, ident))
                    continue
                live_status = str(entry.get("status", ""))
                if re.match(r"\s*(OPEN|OUTSTANDING|UNRESOLVED)\b", live_status, re.I):
                    findings.append("%s is closed (%s) but its cited evidence %s records "
                                    "%s status %r. A reviewer following the blocker's own "
                                    "pointer is told the work is undone"
                                    % (b["blocker_id"], status[:34], ref, ident, live_status))
                act = str(entry.get("required_action", ""))
                if act and not re.match(r"\s*(NONE|N/?A)\b", act, re.I):
                    findings.append("%s is closed but %s still carries a required_action for "
                                    "%s: %r" % (b["blocker_id"], ref, ident, act[:60]))
                continue
            if OUTSTANDING.search(body[body.find(ident): body.find(ident) + 400]):
                findings.append("%s is closed (%s) but its cited evidence %s still presents "
                                "%s as outstanding" % (b["blocker_id"], status[:34], ref, ident))
    check("blocker evidence targets agree with the blocker",
          not findings,
          "; ".join(findings[:3]) if findings
          else "%d in-repository evidence target(s) of closed blockers read; none still "
               "presents its matter as outstanding" % checked)


def check_every_blocker_says_who_acts_next(offline):
    """Every blocker carries an unambiguous `next_action_by`, consistent with its status.

    WHY THIS GUARD EXISTS. An independent-review simulation on 2026-09-18 asked
    the registry "what needs the owner?" by filtering `owner == "HUMAN"`. It
    returned SEVEN blockers and MISSED B-017 -- one of the two production
    revocations -- because that row says "OWNER" while the others say "HUMAN",
    B-016 says "COUNSEL", and B-007 says "CLAUDE (proposal) then HUMAN
    (approval)". The field also means "who did the work" in some rows and "who
    does the next step" in others. Two readers could reasonably reach two
    different answers about who is holding the estate up, which is the exact
    condition that fails a synchronization check.

    `owner` is deliberately left untouched: it is the historical record of who
    was assigned. `next_action_by` is the unambiguous field and this guard keeps
    it that way.

    WHAT IT CHECKS.
      1. Every blocker has a `next_action_by` from the controlled vocabulary.
      2. Every blocker has a stated basis for it.
      3. A CLOSED blocker takes NONE, and a live one does not.
      4. A blocker whose status demands counsel is not routed to the owner, and
         one demanding a production or deployment act is not routed to counsel.

    WHAT IT DOES NOT CHECK. Whether the routing is the RIGHT call on the merits.
    That is the owner's and counsel's to say; this only keeps the registry from
    answering the same question two ways.
    """
    findings = []
    raw = read(".jrs/state/BLOCKERS.json")
    if not raw:
        check("every blocker says who acts next", False, "the blocker registry is missing")
        return
    blockers = json.loads(raw)["blockers"]
    VOCAB = {"OWNER", "COUNSEL", "CLAUDE", "NONE"}
    counts = {}
    for b in blockers:
        bid = b.get("blocker_id", "?")
        nxt = b.get("next_action_by")
        if nxt not in VOCAB:
            findings.append("%s has next_action_by %r, outside the controlled vocabulary %s"
                            % (bid, nxt, sorted(VOCAB)))
            continue
        counts[nxt] = counts.get(nxt, 0) + 1
        if not (b.get("next_action_basis") or "").strip():
            findings.append("%s routes to %s with no stated basis. A routing without a reason "
                            "is a guess the next reader has to re-make" % (bid, nxt))
        status = (b.get("status") or "").upper()
        closed = (("RESOLVED" in status or "OWNER-CONFIRMED" in status
                   or "COMPLETED" in status) and "NOT " not in status)
        if closed and nxt != "NONE":
            findings.append("%s is closed (%r) but still routes to %s" % (bid, status[:40], nxt))
        if not closed and nxt == "NONE":
            findings.append("%s is live (%r) but routes to NONE, so nothing moves it"
                            % (bid, status[:40]))
        if "COUNSEL REVIEW REQUIRED" in status and nxt not in ("COUNSEL",):
            findings.append("%s says COUNSEL REVIEW REQUIRED but routes to %s" % (bid, nxt))
        if re.search(r"NOT DEPLOYED|GRANT NOT REVOKED|PRODUCTION VERIFICATION|"
                     r"DEPLOYMENT VERIFICATION", status) and nxt == "COUNSEL":
            findings.append("%s needs a production or deployment act but routes to COUNSEL"
                            % bid)
    check("every blocker says who acts next",
          not findings,
          "; ".join(findings[:4]) if findings
          else "%d blocker(s) routed: %s. `owner` is preserved as the historical assignment; "
               "`next_action_by` answers who takes the next step"
               % (len(blockers), ", ".join("%s=%d" % kv for kv in sorted(counts.items()))))


def check_superseded_records_declare_themselves_superseded(offline):
    """A record that no longer controls says so, in its own opening block.

    WHY THIS GUARD EXISTS. On 2026-09-18 a repository-wide discovery pass found
    TWO DUPLICATE AUTHORITIES, each announcing itself as current:
      * `ASSET_AND_CHAIN_OF_TITLE_REGISTER.md` opens "Version 2.0, rebuilt from
        underlying evidence". The Master Register had superseded it as the primary
        register since the day it was created -- and said so THERE, not here.
      * `DEPLOYMENT_READINESS_REPORT.md` carries the plainest, most authoritative
        filename of any readiness record and is the 2026-09-15 one. The 09-17
        report states that it supersedes earlier records -- again, there, not here.
    In both cases a reader arriving by filename read the older document as current
    and nothing in it disagreed. A supersession recorded only in the document that
    WINS is not a control; the reader opens the other one.

    WHAT IT CHECKS. Each superseded record below still carries its self-declaration
    in its opening block, and still names what replaced it.

    WHAT IT DOES NOT DO. Delete anything. Both files are retained in full: one is
    the evidence the Master Register was built from, the other is the record of a
    readiness determination that was correct on its date.
    """
    findings = []
    PAIRS = {
        "docs/enterprise-diligence/ASSET_AND_CHAIN_OF_TITLE_REGISTER.md":
            ("NOT THE PRIMARY REGISTER",
             "JRS_MASTER_ASSET_EVIDENCE_AND_CHAIN_OF_TITLE_REGISTER.md"),
        "docs/enterprise-diligence/DEPLOYMENT_READINESS_REPORT.md":
            ("HISTORICAL", "DEPLOYMENT_READINESS_REPORT_2026-09-17.md"),
    }
    checked = 0
    for rel, (token, replacement) in PAIRS.items():
        body = read(rel)
        if body is None:
            findings.append("%s is missing; it is retained deliberately as an evidence "
                            "source and must not be deleted" % rel)
            continue
        checked += 1
        head = "\n".join(body.splitlines()[:25])
        if token not in head.upper():
            findings.append("%s no longer declares itself superseded in its opening block. "
                            "Its replacement says so, but a reader who opens THIS file by "
                            "name never sees that" % rel)
        elif replacement not in head:
            findings.append("%s declares itself superseded without naming %s, so the reader "
                            "is told to stop reading and not where to go" % (rel, replacement))
    check("superseded records declare themselves superseded",
          not findings,
          "; ".join(findings) if findings
          else "%d superseded record(s) checked; each declares itself in its opening block "
               "and names the record that replaced it" % checked)


def check_the_owner_queue_matches_the_item_states(offline):
    """The "still requiring your action" queue lists the items that are open.

    WHY THIS GUARD EXISTS. On 2026-09-19 that queue had drifted three ways at
    once: it still listed D-8, which closed the day before; it gated D-9 on D-8
    and therefore on nothing; and ELEVEN genuinely open items -- D-15 to D-17
    and D-19 to D-26 -- were absent entirely. A queue that asks for finished work
    and omits live work is worse than no queue, because it is read as if it were
    complete.

    WHAT IT CHECKS. Every item the register records CLOSED is absent from the
    live queue, and every item it records OPEN is present. Closed items may
    still appear under the "Closed, and not to be asked again" heading, which is
    where the evidence for their closure lives; the test is the LIVE queue.

    WHAT IT DOES NOT CHECK. Whether a state is the right one. Closing a decision
    is the owner's, the Board's or counsel's act, never this file's.
    """
    findings = []
    rel = "docs/enterprise-diligence/HUMAN_DECISIONS_REQUIRED.md"
    body = read(rel)
    if not body:
        check("the owner queue matches the item states", False,
              "the human decisions register is missing")
        return

    m = re.search(r"## Open now, by route(.*?)## Closed, and not to be asked again",
                  body, re.S)
    c = re.search(r"## Closed, and not to be asked again(.*)$", body, re.S)
    if not m or not c:
        findings.append("the register no longer separates an open queue from a closed list, "
                        "which is the structure that stopped it drifting")
        check("the owner queue matches the item states", False, "; ".join(findings))
        return

    open_block, closed_block = m.group(1), c.group(1)
    live = set(re.findall(r"\*\*(D-\d+)\*\*", open_block))
    closed = set(re.findall(r"\*\*(D-\d+)\*\*", closed_block))

    # THE TWO FIXED SETS THAT USED TO SIT HERE ARE GONE. They listed every
    # D-item by hand, which is the failure class this suite has replaced with
    # discovery four times elsewhere and which cost something here on
    # 2026-09-20: D-3 had to be moved between two literals by hand, and nothing
    # would have noticed if it had not been. A roster maintained by the same
    # edit it is meant to police is not a control.
    #
    # DERIVED INSTEAD, from the document's own structure. Every decision in this
    # register announces itself with a "## D-N ·" section, and the register has
    # exactly two destinations: the live queue and the closed table. So the
    # roster is the set of sections, and the invariants are structural:
    #   1. no item is in BOTH destinations;
    #   2. every item that has a section reaches ONE of them, unless its own
    #      section declares itself historical, superseded or renumbered;
    #   3. every closed row states the evidence for its closure.
    # Adding a decision now extends the check by writing the section, which is
    # the act that should extend it.
    secs = list(re.finditer(r"^## (D-\d+)(?: to (D-\d+))? \u00b7(.*)$", body, re.M))
    sections = {}
    for i, sm in enumerate(secs):
        end = secs[i + 1].start() if i + 1 < len(secs) else len(body)
        sec = body[sm.start():end]
        lo = int(sm.group(1)[2:])
        hi = int(sm.group(2)[2:]) if sm.group(2) else lo
        for n in range(lo, hi + 1):
            sections.setdefault("D-%d" % n, []).append(sec)

    if not sections:
        findings.append("no '## D-N' decision sections were found, so the queue can no longer "
                        "be derived from the register's own structure")

    # A section may legitimately be in neither destination, but it has to SAY so
    # in its own text. These are the forms this register actually uses; a new
    # one has to be added deliberately, which is the point.
    EXEMPT = ("SUPERSEDED", "preserved as history", "NOT current state",
              "original entry, preserved", "is preserved", "HISTORICAL",
              "NOW TRACKED AS")
    for d in sorted(sections, key=lambda s: int(s[2:])):
        secbodies = sections[d]
        in_live, in_closed = d in live, d in closed
        if in_live and in_closed:
            findings.append("%s is in the live queue and in the closed list at once. One of "
                            "the two is wrong and a reader cannot tell which" % d)
        elif not in_live and not in_closed:
            # THE EXEMPTION IS PER ITEM, NOT PER SECTION. Found by mutation
            # 2026-09-20: "## D-12 to D-17" covers six items in one section, and
            # a section-wide test let D-16's and D-17's renumbering pointers
            # excuse D-15 when D-15's own pointer was deleted. That is the
            # window-versus-scope defect wearing a different hat -- a marker in
            # a NEIGHBOURING row answering for this one. So where the item has
            # its own table row, that row is the unit, and only where it has
            # none does the section answer for it.
            scope = []
            for b in secbodies:
                own = re.findall(r"^\>?\s*\|\s*\*\*%s\*\*\s*\|[^\n]*$" % d, b, re.M)
                scope.extend(own if own else [b])
            if not any(any(k in s for k in EXEMPT) for s in scope):
                findings.append("%s has a section in this register but reaches neither the "
                                "live queue nor the closed list, and its section does not "
                                "declare itself historical, superseded or renumbered. An item "
                                "in no destination reads exactly like a finished one" % d)

    # Anything routed in the queue or the closed table must be a real decision,
    # not a typo that silently creates an item nobody wrote a section for.
    for d in sorted(live | closed, key=lambda s: int(s[2:])):
        if d not in sections:
            findings.append("%s is routed in the register but has no '## %s ·' section, so "
                            "there is nothing stating what it is" % (d, d))

    # A closure with no evidence cell is an assertion, not a record.
    for row in re.findall(r"^\|\s*\*\*(D-\d+)\*\*\s*\|([^|]*)\|([^|]*)\|",
                          closed_block, re.M):
        did, how, evidence = row[0], row[1].strip(), row[2].strip()
        if not how or not evidence:
            findings.append("%s is listed as closed without stating both how it closed and "
                            "the evidence. A closure that cites nothing cannot be checked"
                            % did)

    # the routes must stay distinguished; "owner action" is not a route
    for route in ("OWNER", "COUNSEL", "PRODUCTION"):
        if route not in open_block:
            findings.append("the queue no longer separates the %s route, which hides the "
                            "difference between an act and a question" % route)

    check("the owner queue matches the item states",
          not findings,
          "; ".join(findings[:4]) if findings
          else "%d item(s) live and %d closed; every closed item is out of the queue and "
               "every open item is in it; routes kept separate"
               % (len(live), len(closed)))


def check_no_owner_decision_asks_for_completed_work(offline):
    """The owner queue does not ask for work the working tree shows is done.

    WHY THIS GUARD EXISTS. On 2026-09-18 a repository-wide pass found
    HUMAN_DECISIONS_REQUIRED.md heading a block of six red-team findings
    "ALL OPEN, NONE FIXED". Three of the six had been remediated in later cycles
    and the page had gone on asking for all six -- including D-14, the one it
    itself called "the one with a safety edge", whose fix was sitting in
    pilot.html. D-11 and D-10 were the same story: one sentence deleted, one
    question decided by the Board, both still listed as awaiting the owner.

    The estate-wide sweep could not see any of it. Its ten propositions were
    owner and rights facts; nothing in it compared an OWNER QUESTION against the
    CODE THAT ANSWERS IT. That comparison is this guard.

    HOW IT CHECKS. Each pair below names a decision and a fact in the working
    tree that settles it. If the fact says the work is done, the decision must
    not still be presented as open. The facts are deliberately of the kind that
    cannot drift quietly: a call site that exists, a sentence that does not.

    WHAT IT DOES NOT CHECK. Whether a decision was CORRECT, and whether any
    still-open item should be closed. Three of these six are open and the page
    says so; a guard that pushed toward closure would be worse than none.

    THE KNOWN WEAKNESS IS THE LIST ITSELF, AND IT HAS NOW COST SOMETHING. PAIRS
    is a FIXED enumeration, which is the failure class this suite has hit four
    times in other guards and replaced with dynamic discovery each time. Here it
    stayed fixed, and on 2026-09-20 D-3 was found being asked of the owner FOUR
    DAYS after Board decision BD-04 answered it -- invisible to this guard for
    one reason only: D-3 was not in the list. It is now. A decision cannot be
    discovered dynamically the way a count can, because the "done" test is
    specific to each question, so the control is that EVERY item added to the
    owner queue gets a pair here at the same time.
    """
    findings = []
    hdr = read("docs/enterprise-diligence/HUMAN_DECISIONS_REQUIRED.md")
    if not hdr:
        check("no owner decision asks for completed work", False,
              "the human decisions register is missing")
        return

    # (decision, "done" test over the tree, what the queue must not still say)
    def absent(rel, needle):
        body = read(rel)
        return body is not None and needle not in (body or "")

    def present(rel, needle):
        return needle in (read(rel) or "")

    PAIRS = [
        ("D-11", lambda: absent("review-engine.html", "never leaves your control"),
         r"D-11[^\n]{0,120}?\*\*NEW, OPEN, NOT EDITED\*\*"),
        ("D-13", lambda: absent("terms.html", "transmits nothing")
                         and absent("engagement.html", "transmits nothing"),
         r"D-13[^|\n]{0,40}\|[^|\n]{0,40}\bOPEN\b"),
        ("D-14", lambda: present("pilot.html", "jrsSanitizeCheck(msgVal)"),
         r"D-14 is the one with a safety edge\*\*, because"),
        ("D-12 to D-17", lambda: absent("index.html", "api.jrsstandard.com/v1/verify-drift'")
                                 and absent("terms.html", "transmits nothing"),
         r"D-12 to D-17[^\n]{0,80}\*\*ALL OPEN, NONE FIXED\*\*(?!~)"),
        # ADDED 2026-09-20. D-3 asked which engine key corresponds to
        # Decision-Process Traceability. BOARD DECISION BD-04 DECLARED IT ON
        # 2026-09-16 and the queue went on asking for four more days, because
        # METHODOLOGY_TO_API_MAPPING.md carries TWO tables -- an analysis table
        # saying "Unresolved" and, further down, the Board decision that settles
        # it. A preparation pass read the first and stopped. The "done" test
        # below therefore looks for the DECISION, not for the absence of the
        # word "Unresolved", which is still correctly present in the historical
        # analysis row above it.
        ("D-3", lambda: present("docs/enterprise-diligence/METHODOLOGY_TO_API_MAPPING.md",
                                "BOARD DECISION BD-04"),
         r"\|\s*\*\*D-3\*\*\s*\|[^|\n]*\|[^\n]*Name which engine key"),
    ]
    checked = 0
    for did, done, stale_pat in PAIRS:
        try:
            is_done = done()
        except OSError:
            continue
        checked += 1
        if not is_done:
            continue
        # The stale heading may be RETAINED under Rule 10, struck through. Only an
        # unstruck one is a live request.
        live = re.sub(r"~~.+?~~", " ", hdr, flags=re.S)
        if re.search(stale_pat, live):
            findings.append("the owner queue still presents %s as awaiting a decision, and the "
                            "working tree shows the work is done. An estate that asks for "
                            "completed work trains its reader to skim the queue" % did)

    check("no owner decision asks for completed work",
          not findings,
          "; ".join(findings) if findings
          else "%d owner decision(s) cross-checked against the code that settles them; none "
               "that the tree shows complete is still presented as open" % checked)


def check_downstream_records_agree_with_the_blocker_registry(offline):
    """No current record says a blocker is still open that the registry has closed.

    WHY THIS GUARD EXISTS. On 2026-09-18 a repository-wide discovery pass found
    that the previous cycle had reconciled TEN OWNER AND RIGHTS PROPOSITIONS and
    had never asked the adjacent question: does the rest of the estate agree with
    `.jrs/state/BLOCKERS.json` about what each BLOCKER's state is? It did not.
    `.jrs/state/ACTIVE_GATE.json` -- the live file that governs whether Phase 2
    may proceed -- carried three conditions, ALL THREE STALE, including a
    "credential ... needs rotation" that the owner had already performed.
    `.jrs/reports/GATE_1_REMAINING_ITEMS.md` disagreed with the registry on seven
    rows. A page shipped to production still named a closed blocker as a queue.

    WHAT IT CHECKS, AND ONLY THIS. A record asserts a blocker is OPEN, BLOCKED or
    still REQUIRED while the registry records it RESOLVED, CLOSED, OWNER-CONFIRMED
    or COMPLETED. The blocker id must be the SUBJECT of the assertion -- within 60
    characters, in the same sentence or table row -- because a row can hold two
    subjects and "T-7 ... OPEN, LOW; folds into B-007" says nothing about B-007.

    WHAT IT DELIBERATELY DOES NOT CHECK. Wording equivalence in the other
    direction. A first version compared every status word against the registry
    string and produced TWENTY-ONE FALSE POSITIVES against ONE real finding: it
    read "B-017 open" as contradicting "GRANT NOT REVOKED - PRODUCTION
    VERIFICATION REQUIRED", which says the same thing in different words. A check
    that fires on correct prose teaches people to ignore it, so the rule was
    narrowed to the one direction that produced every genuine finding: an estate
    that keeps asking for work already done.

    Records that classify THEMSELVES historical in their opening block are
    excluded, listed rather than silent. That is a record-level scope, not a
    proximity window: a superseded execution report is evidence of what was
    believed then, and striking each of its sentences would destroy that.
    """
    findings = []
    raw = read(".jrs/state/BLOCKERS.json")
    if not raw:
        check("downstream records agree with the blocker registry", False,
              "the blocker registry is missing")
        return
    reg = {b["blocker_id"]: b.get("status", "").upper()
           for b in json.loads(raw)["blockers"]}
    DONE = [k for k, v in reg.items()
            if ("RESOLVED" in v or "OWNER-CONFIRMED" in v or "COMPLETED" in v)
            and "NOT " not in v]

    # Self-classification must be a distinct token. A bare "SUPERSEDED" also
    # matches a corrected ROW, and using it exempted four of the seven mandatory
    # records -- turning a correction into a way of escaping the check.
    HEAD = re.compile(r"HISTORICAL EXECUTION RECORD|HISTORICAL RECORD \u2014 NO LONGER "
                      r"MAINTAINED|NOT THE PRIMARY REGISTER|NOT CURRENT-STATE AUTHORITY|"
                      r"HISTORICAL \u2014 20\d\d-\d\d-\d\d REPORT|COMPLETED GATE RECORD", re.I)
    ALWAYS = {".jrs/state/BLOCKERS.json", ".jrs/state/ACTIVE_GATE.json",
              ".jrs/reports/GATE_1_REMAINING_ITEMS.md",
              "docs/enterprise-diligence/HUMAN_DECISIONS_REQUIRED.md",
              "docs/enterprise-diligence/JRS_QUESTION_RESOLUTION_MATRIX_2026-09-16.md",
              "docs/enterprise-diligence/JRS_CURRENT_DEPENDENCY_GRAPH_2026-09-16.md"}

    RECORDS = sorted(ALWAYS | {
        "docs/enterprise-diligence/COUNSEL_REVIEW_PACKET_2026-09-16.md",
        "docs/enterprise-diligence/JRS_BOARD_DECISION_REGISTER_2026-09-16.md",
        "docs/enterprise-diligence/OWNER_RESOLUTION_BATCH_2026-09-18.md",
        "docs/enterprise-diligence/B-006_DIAGNOSTIC_PROCEDURE.md",
        "docs/enterprise-diligence/DEPLOYMENT_READINESS_REPORT_2026-09-17.md",
        ".jrs/gates/GATE_0_ASSET_BASELINE.md",
        "research-data.html"})

    STILL_OPEN = re.compile(
        r"\b(?:is |remains |stays )?(?:still )?"
        r"(?:OPEN|BLOCKED|OUTSTANDING|UNRESOLVED|NOT MET|"
        r"OWNER ACTION REQUIRED|HUMAN DECISION REQUIRED|needs rotation|"
        r"awaiting|queued behind|waits on)\b", re.I)
    NEG = re.compile(r"\b(?:not|no longer|never|does not|cannot|without|rather than)\b", re.I)

    checked = 0
    skipped = []
    for rel in RECORDS:
        body = read(rel)
        if not body:
            findings.append("%s is missing; it carried blocker state" % rel)
            continue
        if rel not in ALWAYS and HEAD.search("\n".join(body.splitlines()[:45])):
            skipped.append(rel)
            continue
        checked += 1
        # JSON PRESERVES HISTORY IN THE KEY, NOT IN A STRIKETHROUGH. A JSON record
        # cannot carry "~~", so this project keeps superseded wording in dated
        # fields -- update_2026_09_15, remediation_2026_09_14, correction_*, and
        # conditions_at_evaluation_*. Reading those as live assertions reported
        # both of this guard's first two hits, and both were history filed exactly
        # where history belongs. The key names the scope; nothing here is a window.
        HIST_KEY = re.compile(r"update_\d|remediation_\d|correction_\d|_at_evaluation|"
                              r"prior|superseded|_history|conditions_corrected|"
                              r"b001_dependency_cleared", re.I)
        if rel.endswith(".json"):
            pairs = [(lbl, val) for lbl, val in _json_string_fields(rel)
                     if not HIST_KEY.search(lbl)]
        else:
            flat, units = _assertion_units(body)
            pairs = [(rel, u) for _s, _e, u in units]
        for bid in DONE:
            for lbl, unit in pairs:
                i = unit.find(bid)
                if i < 0:
                    continue
                if re.search(r"prior text read|PRESERVED|was open when|CORRECTED", unit, re.I):
                    continue
                # A TRANSITION IS NOT AN ASSERTION. This project writes state
                # machines inline - "`OPEN` -> `DIAGNOSTIC READY` (B-001
                # confirmed)" - and naming the state a thing LEAVES is not
                # claiming it is in it. The test is the arrow, which is structure,
                # not a guess about nearby words.
                if re.search(r"\u2192|->", unit):
                    continue
                # BOTH SIDES OF THE ID, INSIDE THE UNIT. A first version looked
                # only forward and a mutation walked straight past it: "the grant
                # is queued behind B-001" puts the status phrase BEFORE the id,
                # which is how every one of the six real findings was worded.
                # The span is still the sentence or row - never a window across
                # sentences - so this widens WHERE in the assertion to look, not
                # WHICH assertions count.
                before = unit[max(0, i - 60):i]
                sm = STILL_OPEN.search(unit[i:i + 60]) or STILL_OPEN.search(before)
                if sm and not NEG.search(unit[:i]):
                    findings.append("%s says %s is %r while the registry records it %r. An "
                                    "estate that keeps asking for work already done trains "
                                    "its reader to ignore the asking"
                                    % (rel, bid, sm.group(0).strip(), reg[bid]))
                    break

    check("downstream records agree with the blocker registry",
          not findings,
          "; ".join(findings[:4]) if findings
          else "%d current record(s) checked against %d registry blocker(s); %d closed "
               "blocker(s) named; no current record still calls a closed blocker open; "
               "%d record(s) self-classified historical and excluded"
               % (checked, len(reg), len(DONE), len(skipped)))


def check_no_stale_current_state_representation(offline):
    """A closed matter is not still represented as open anywhere current.

    WHY THIS GUARD EXISTS. X-15 was closed in the register's section 16, in the
    correction table, in CT-2 and in the question matrix -- and section 23 went on
    saying "Section 2.1 assignment ... OWNER INPUT REQUIRED", and the chain-of-title
    status went on listing it as a surviving owner matter. The owner had to point
    that out. A correction recorded in one section does not make a document
    synchronized, and five other current-state claims were stale for the same reason.

    THE RULE IT ENFORCES. ONE PROPOSITION, ONE CURRENT STATE, ONE AUTHORITATIVE
    CURRENT REPRESENTATION, PRESERVED HISTORY. History may keep the old wording; it
    may not masquerade as current. The test for "masquerading" is proximity: an old
    state within reach of a strike-through or a superseding marker is history, and
    an old state standing alone is a current claim.

    WHAT IT CHECKS. For each closed proposition below, no current-state record
    asserts the open state without a superseding marker beside it. The markers are
    deliberately narrow -- a strike-through, SUPERSEDED, RECONCILED, CLOSED,
    CORRECTED, ANSWERED, SUPPLIED -- so that a stale line cannot be excused by an
    unrelated word.

    WHAT IT DOES NOT CHECK. Whether a closure was correct. That is the evidence
    record's job, and section 17 of the register preserves how each one was reached.
    """
    findings = []

    # proposition -> (regex for the OPEN-state claim, records that must be current)
    CLOSED = {
        # PATTERNS WIDENED 2026-09-18 after the state-transition suite exposed them.
        # `[^.\n]` could not span a sentence period, so appending "Section 2.1
        # assignment for the accessibility argument. OWNER INPUT REQUIRED." PASSED.
        # `[^|\n]` could not span table cells, so reverting the domain row PASSED.
        # A guard whose own test suite cannot defeat it is the only kind worth
        # keeping, and these two were defeated on the first attempt.
        "Section 2.1 assignment": (
            r"Section 2\.1 assignment.{0,120}?OWNER INPUT REQUIRED",
            ["docs/enterprise-diligence/JRS_MASTER_ASSET_EVIDENCE_AND_CHAIN_OF_TITLE_REGISTER.md",
             "docs/enterprise-diligence/CHAIN_OF_TITLE_STATUS.md"]),
        "X-15 open": (
            r"X-15[^.\n]{0,60}(OPEN|COUNSEL REVIEW REQUIRED|counsel dependency)",
            ["docs/enterprise-diligence/JRS_MASTER_ASSET_EVIDENCE_AND_CHAIN_OF_TITLE_REGISTER.md",
             "docs/enterprise-diligence/JRS_QUESTION_RESOLUTION_MATRIX_2026-09-16.md",
             ".jrs/registries/COMMERCIAL_RIGHTS_REGISTER.json"]),
        "AI involvement account outstanding": (
            r"AI involvement account[^.\n]{0,80}(OWNER INPUT REQUIRED|outstanding)",
            ["docs/enterprise-diligence/JRS_MASTER_ASSET_EVIDENCE_AND_CHAIN_OF_TITLE_REGISTER.md"]),
        "domain registrar unknown": (
            r"domain (ownership|registrar).{0,140}?\*\*UNKNOWN\*\*",
            ["docs/enterprise-diligence/CHAIN_OF_TITLE_STATUS.md"]),
        # ADDED 2026-09-18. A CLOSED BLOCKER NAMED AS A LIVE DEPENDENCY IS A
        # STALE CURRENT-STATE CLAIM, and it is invisible to every status word
        # this guard previously looked for. B-001 closed on owner attestation
        # (E-030) and SIX records still said production operations were "queued
        # behind B-001" - a blocker registry entry, two board records, a
        # dependency graph, an audit and the question matrix. None of them used
        # the word OPEN. The reader is told to wait for something that has
        # already happened, which is how a queue stops being believed.
        # NO MARKER EXCUSES THIS ONE, and the "!" prefix says so.
        #
        # Six demonstration mutations showed why. The question matrix row reads
        # "| V-10 | ... | ANSWERED - FACT. Closes on deployment, which waits on
        # B-001 |": the row's own ANSWERED belongs to V-10, not to the
        # dependency, and any scope holding both excused the stale clause. The
        # readiness audit is worse -- restoring the old wording leaves it sitting
        # beside its own CORRECTED note, so marker proximity cannot tell a
        # corrected claim from an uncorrected one.
        #
        # It does not need to. Retired text is MASKED before matching, and this
        # project strikes superseded wording through as a matter of Rule 10. So a
        # match that survives masking is, by construction, wording that still
        # READS as live -- and no live text may say a production operation waits
        # on B-001, because B-001 closed on 2026-09-18 (E-030). The right test is
        # the absence of a match, not the presence of a nearby word.
        "!closed blocker named as a live dependency": (
            r"(?:queued behind|queue behind|blocked on|waits on|waiting on|"
            r"depends on|dependent on|prerequisite is|\bbehind)\s*\**B-001",
            [".jrs/state/BLOCKERS.json",
             "docs/enterprise-diligence/JRS_BOARD_DECISION_REGISTER_2026-09-16.md",
             "docs/enterprise-diligence/JRS_CURRENT_DEPENDENCY_GRAPH_2026-09-16.md",
             "docs/enterprise-diligence/JRS_QUESTION_RESOLUTION_MATRIX_2026-09-16.md",
             "docs/enterprise-diligence/FINAL_PRE_GATE_1_READINESS_AUDIT_2026-09-16.md"]),
    }
    SUPERSEDING = re.compile(r"~~|SUPERSEDED|RECONCILED|CLOSED|CORRECTED|ANSWERED|SUPPLIED|"
                             r"raised in error|no longer", re.I)

    checked = 0
    for prop, (pat, records) in CLOSED.items():
        for rel in records:
            body = read(rel)
            if not body:
                findings.append("%s is missing; it carried the %r state" % (rel, prop))
                continue
            checked += 1
            flat, units = _assertion_units(body)
            for m in re.finditer(pat, flat, re.I):
                # NEGATION IS NOT ASSERTION. The first run of this guard flagged the
                # closure's own limit sentence -- "does not support keeping X-15
                # open" -- as a live claim that X-15 is open. Ninth time a guard here
                # has read text that MENTIONS a state as text that ASSERTS it. The
                # lead-in is checked for a negation before the window is judged.
                # THE NEGATION MUST BE IN THE SAME UNIT, AND BEFORE THE MATCH.
                # This test used a 90-character lead-in window, and a
                # demonstration suite defeated it twice in one run: "was
                # expressly REJECTED rather than taken" two sentences earlier
                # excused a live B-017 dependency, and "That is no longer true."
                # excused a live graph edge. A negation in a NEIGHBOURING
                # sentence negates that sentence. This is the third place in
                # this guard where proximity had been standing in for scope.
                unit_span = next(((s, e, u) for s, e, u in units
                                  if s <= m.start() < e), None)
                lead = (unit_span[2][:m.start() - unit_span[0]] if unit_span
                        else flat[max(0, m.start() - 90):m.start()])
                if re.search(r"\b(not|no longer|never|without|rather than|ceased to)\b",
                             lead, re.I):
                    continue
                # SCOPE IS THE SENTENCE OR THE TABLE ROW, NOT A WINDOW.
                # The 260-character window this replaced let a marker belonging
                # to a neighbouring sentence excuse a live claim; three real ones
                # escaped that way and were found by hand instead.
                unit = next((u for s, e, u in units if s <= m.start() < e), "")
                absolute = prop.startswith("!")
                if absolute or not SUPERSEDING.search(unit or flat[m.start():m.end()]):
                    findings.append(
                        ("%s still asserts %r in text that reads as live. Superseded wording is "
                         "struck through, so anything left standing is a current claim"
                         % (rel, prop.lstrip("!")))
                        if absolute else
                        ("%s asserts %r as CURRENT with no superseding marker beside "
                         "it. A correction recorded elsewhere in the same document "
                         "does not make the document synchronized" % (rel, prop)))
                    break

    # The closure must keep stating its own limit, in the register.
    reg = re.sub(r"\s+", " ", read("docs/enterprise-diligence/"
                                   "JRS_MASTER_ASSET_EVIDENCE_AND_CHAIN_OF_TITLE_REGISTER.md"))
    if "does not support keeping X-15 open" not in reg:
        findings.append("the register no longer states the limit of the X-15 closure. Without it "
                        "a factual disposition reads as a legal conclusion")
    # Panel participation must survive every one of these edits.
    if "V-AI-08" not in reg:
        findings.append("V-AI-08 is gone from the register; the participation record must survive "
                        "every correction to the Section 2.1 characterisation")

    check("no stale current-state representation",
          not findings,
          "; ".join(findings) if findings
          else "%d record/proposition pairs checked across %d closed propositions; every open-state "
               "wording carries a superseding marker; the closure keeps its limit and the "
               "participation record survives" % (checked, len(CLOSED)))


def check_section_2_1_resolution_holds(offline):
    """The Section 2.1 closure keeps its distinctions and does not drift either way.

    WHY THIS GUARD EXISTS. This matter moved twice and I got it wrong twice. First
    I nearly deleted a verified participation record by applying "not a formal
    contribution" literally. Then I raised X-15 -- a counsel question built on a
    theoretical possibility with no affirmative evidence behind it, on a premise
    that was already superseded. Both errors point the same way: the facts here
    are adjacent and easy to collapse into each other.

    FIVE THINGS MUST HOLD, and each corresponds to one of the two ways this can
    go wrong: understating the record, or overstating a rights problem.
      1. The distinction between prior MCCR experience and a formal JRS research
         contribution survives.
      2. Gabriela Cortez's SEPARATE panel participation survives -- V-AI-08,
         COMPLETE. Correcting the Section 2.1 characterisation must never erase it.
      3. X-15 does not return as an open counsel matter without affirmative
         evidence appearing first.
      4. No third-party ownership claim appears without evidence supporting it.
      5. The closure introduces no ownership, assignment or licence claim in
         EITHER direction -- not for the owner, not for her, not for MCCR.

    WHAT IT DOES NOT CHECK. Whether any legal conclusion is correct. None is
    drawn, and the closure says so in terms: it establishes only that the evidence
    does not support keeping X-15 open.
    """
    findings = []
    reg_raw = read("docs/enterprise-diligence/JRS_MASTER_ASSET_EVIDENCE_AND_CHAIN_OF_TITLE_REGISTER.md")
    led = read("docs/enterprise-diligence/EVIDENCE_LEDGER.md")
    mat = read("docs/enterprise-diligence/JRS_QUESTION_RESOLUTION_MATRIX_2026-09-16.md")
    crr = read(".jrs/registries/COMMERCIAL_RIGHTS_REGISTER.json")
    if not (reg_raw and led and mat and crr):
        check("Section 2.1 resolution holds", False, "an authoritative record is missing")
        return

    # WHAT THE DOCUMENT SAYS, NOT HOW MARKDOWN WRAPPED IT. The first version of
    # this guard failed against a register that plainly contains both sentences,
    # because "was not a formal JRS research / contribution" and "does / not
    # support keeping X-15 open" are each split by a line wrap and a blockquote
    # marker. Same class as the JSON-escape miss: the guard was reading storage
    # and reasoning about meaning. Prose is normalised before matching; the
    # regex searches below run against the raw text where structure matters.
    reg = re.sub(r"\s+", " ", re.sub(r"^\s*>\s?", "", reg_raw, flags=re.M))

    # 1. The distinction itself.
    if "not a formal JRS research contribution" not in reg and \
       "NOT a formal JRS research contribution" not in reg:
        findings.append("the register no longer distinguishes prior MCCR experience from a "
                        "formal JRS research contribution; that distinction IS the resolution")
    if "E-036" not in led:
        findings.append("E-036 is gone from the ledger; the owner attestation the closure rests "
                        "on has no record")

    # 2. Participation preserved. Correcting the characterisation must not erase it.
    if not re.search(r"V-AI-08", reg_raw):
        findings.append("V-AI-08 no longer appears in the register")
    if "COMPLETE" not in reg or "panel participation" not in reg.lower():
        findings.append("Gabriela Cortez's separate panel participation is no longer preserved "
                        "in the register. Correcting the Section 2.1 characterisation must never "
                        "erase a verified participation record")
    inv = read("research/PARTICIPANT_INVENTORY_BY_RUNG.md")
    if inv and not re.search(r"`V-AI-08`[^\n]*COMPLETE", inv):
        findings.append("V-AI-08 is no longer recorded COMPLETE in the participant inventory")

    # 3 and 4. X-15 must not return open, and no ownership claim without evidence.
    for rel, body in (("question matrix", mat), ("commercial rights register", crr)):
        for m in re.finditer(r"X-15", body):
            w = body[max(0, m.start() - 300):m.end() + 300]
            if not re.search(r"CLOSED|closed|error|raised in", w):
                findings.append("X-15 appears in the %s outside a closure context. It does not "
                                "reopen without affirmative evidence, and none was located "
                                "across eight propositions" % rel)
                break
    if re.search(r"(MCCR|Maryland|State of Maryland)[^.\n]{0,80}(owns|ownership claim|"
                 r"proprietary right|holds title)", reg, re.I):
        findings.append("the register asserts a state-agency ownership interest. No affirmative "
                        "evidence supports one, and the employment context alone does not")

    # 5. No claim in EITHER direction.
    if re.search(r"Cortez[^.\n]{0,120}(assigned|assignment to|licensed to|transferred)", reg, re.I):
        findings.append("the register asserts an assignment or licence involving Cortez. The "
                        "owner has expressly not represented one, and none is located")
    if "does not support keeping X-15 open" not in reg:
        findings.append("the closure no longer states its own limit. It establishes only that "
                        "the evidence does not support keeping X-15 open, and that sentence is "
                        "the boundary between a factual disposition and a legal conclusion")

    # 6. THE MACHINE-READABLE STATUS, not only the prose.
    #
    # ADDED 2026-09-18 after a mutation test. Reopening CT-SEC-2.1 in
    # RIGHTS_REGISTER.json -- flipping one status field from CLOSED to OPEN --
    # produced a PASSING guard suite, because every limb above reads prose
    # documents and none read the register that a downstream consumer would
    # actually query. The narrative and the structured record could disagree and
    # nothing would say so.
    rr_raw = read(".jrs/registries/RIGHTS_REGISTER.json")
    if not rr_raw:
        findings.append("the rights register is missing; it carries the Section 2.1 disposition")
    else:
        try:
            entries = []
            def _collect(node):
                if isinstance(node, dict):
                    if "id" in node:
                        entries.append(node)
                    for v in node.values():
                        _collect(v)
                elif isinstance(node, list):
                    for v in node:
                        _collect(v)
            _collect(json.loads(rr_raw))
            sec = [e for e in entries if e.get("id") == "CT-SEC-2.1"]
            if not sec:
                findings.append("CT-SEC-2.1 is gone from the rights register; the Section 2.1 "
                                "disposition has no machine-readable record")
            elif sec[0].get("status") != "CLOSED":
                findings.append("the rights register records CT-SEC-2.1 as %r while the prose "
                                "records it CLOSED (E-033, E-036). The structured record is what "
                                "a downstream consumer reads, and it disagrees"
                                % sec[0].get("status"))
            elif "V-AI-08" not in json.dumps(sec[0]):
                findings.append("CT-SEC-2.1 no longer preserves the separate panel participation "
                                "in the rights register itself")
        except (ValueError, TypeError) as exc:
            findings.append("the rights register does not parse: %s" % exc)

    # 7. THE CHAIN-OF-TITLE RECORD, which reached the opposite conclusion first.
    #
    # ADDED 2026-09-18 after a mutation test. CHAIN_OF_TITLE_STATUS.md section 3
    # classified Section 2.1 as an open OWNER FACTUAL matter and then narrowed it
    # to "credit only" - both written before E-033 and E-036, and both resting on
    # a premise the owner has since corrected. Un-striking that section restored
    # a live contradiction of the closure, and the estate-wide sweep could not
    # see it: the sentence carrying the stale classification does not name
    # Section 2.1, and the sentence naming Section 2.1 carries no status word.
    # A broad sweep cannot catch that without matching ordinary prose everywhere.
    # A NAMED, STANDING PROPOSITION BELONGS TO A GUARD, which can assert the one
    # specific thing that must hold rather than guessing from vocabulary.
    cot = read("docs/enterprise-diligence/CHAIN_OF_TITLE_STATUS.md")
    if not cot:
        findings.append("the chain-of-title status record is missing; it carried the "
                        "pre-E-036 characterisation of Section 2.1")
    else:
        sec3 = re.search(r"### 3\. Section 2\.1 contributor.*?(?=\n### |\n## |\Z)",
                         cot, re.S)
        if not sec3:
            findings.append("chain-of-title section 3 (Section 2.1 contributor) is gone. "
                            "It is retained deliberately: deleting the reasoning destroys "
                            "the evidence of what was believed before E-036")
        else:
            body = sec3.group(0)
            if "SUPERSEDED" not in body.split("\n")[0].upper():
                findings.append("chain-of-title section 3 no longer marks itself superseded "
                                "in its heading. Its body predates E-033/E-036 and reads as "
                                "current state without that mark")
            if not re.search(r"E-036", body):
                findings.append("chain-of-title section 3 does not cite E-036, the attestation "
                                "that corrected its premise")
            # Mask the struck spans, then look for the superseded wording in
            # what is LEFT. Testing "is the phrase somewhere near a ~~" is the
            # window mistake in miniature; masking answers the actual question,
            # which is whether the phrase still READS as a live claim.
            live_body = re.sub(r"~~.+?~~", " ", body, flags=re.S)
            for stale in ("I classified it **OWNER FACTUAL**",
                          "The disposition is **DOCUMENTED \u2014 CREDIT ONLY**"):
                if stale in live_body:
                    findings.append("chain-of-title section 3 asserts %r outside a strikethrough. "
                                    "That classification was superseded by E-033 and E-036 and "
                                    "must not read as live" % stale[:44])

    check("Section 2.1 resolution holds",
          not findings,
          "; ".join(findings) if findings
          else "the experience/contribution distinction, the separate panel participation, the "
               "X-15 closure and the no-claim-in-either-direction boundary all hold")


def check_no_right_is_offered_beyond_its_evidence(offline):
    """No right is classified available for licensing while no instrument grants it.

    WHY THIS GUARD EXISTS. The rights-to-product map is the document a commercial
    conversation would be built on, and it is the one most exposed to optimism:
    every row can drift one classification upward under the pressure of wanting to
    sell something. The classifications are ordered, and the order is not
    decorative -- RIGHT AVAILABLE FOR LICENSING requires BOTH a contractual grant
    and a legal construction, and F-4 records that no executed signed instrument
    exists anywhere in the corpus.

    WHAT IT CHECKS.
      1. No right is marked AVAILABLE FOR LICENSING while F-4 stands.
      2. No right is marked CONTRACTUALLY GRANTED while F-4 stands.
      3. The governing facts that make those two impossible are still recorded --
         including that absence of a prohibition is not a grant, which is the
         specific inference E-034 invites and must not support.
      4. The seeded prohibition, "silence is not permission", survives.

    WHAT IT DOES NOT CHECK. Whether any right EXISTS. That is counsel's, and the
    map exists to hand counsel a gathered factual record rather than a conclusion.
    """
    findings = []
    raw = read(".jrs/registries/COMMERCIAL_RIGHTS_REGISTER.json")
    if not raw:
        check("no right is offered beyond its evidence", False,
              "the commercial rights register is missing")
        return
    d = json.loads(raw)

    # F-4 must still stand for the two hard bars below to be justified.
    reg = read("docs/enterprise-diligence/JRS_MASTER_ASSET_EVIDENCE_AND_CHAIN_OF_TITLE_REGISTER.md")
    f4_stands = "No executed signed instrument exists anywhere" in reg

    rights = d.get("rights_to_product") or {}
    if not rights:
        findings.append("the register carries no rights_to_product map")
    for name, r in rights.items():
        cls = (r.get("classification") or "").upper()
        if f4_stands and "AVAILABLE FOR LICENSING" in cls:
            findings.append("%s is classified AVAILABLE FOR LICENSING while F-4 records that no "
                            "executed signed instrument exists. Availability requires a grant "
                            "and a construction; neither exists" % name)
        if f4_stands and "CONTRACTUALLY GRANTED" in cls:
            findings.append("%s is classified CONTRACTUALLY GRANTED while F-4 stands. There is "
                            "no instrument to grant it" % name)
        if not r.get("evidence"):
            findings.append("%s carries a classification with no evidence field" % name)

    facts = " ".join(d.get("_governing_facts") or [])
    if "ABSENCE OF A PROHIBITION IS NOT A GRANT" not in facts.upper():
        findings.append("the governing facts no longer record that absence of a prohibition is "
                        "not a grant. That is the exact inference the owner's Ubayet attestation "
                        "invites and must not support")
    if "silence is not permission" not in (d.get("prohibition") or "").lower():
        findings.append("the seeded prohibition 'silence is not permission' is gone")

    det = (d.get("determination") or {}).get("available_for_licensing_today", "")
    if det and not det.strip().upper().startswith("NOTHING"):
        findings.append("the determination no longer states that nothing is available for "
                        "licensing today; if that changed, an instrument must exist and F-4 "
                        "must have been superseded")

    check("no right is offered beyond its evidence",
          not findings,
          "; ".join(findings) if findings
          else "%d right classes; none available for licensing and none contractually granted "
               "while F-4 stands; 'absence of a prohibition is not a grant' and 'silence is not "
               "permission' both intact" % len(rights))


def check_misuse_register_records_reality(offline):
    """Every misuse mode's recorded control actually exists, and NONE means none.

    WHY THIS GUARD EXISTS. A misuse register is the easiest document in an estate
    to write dishonestly: every row can be given a plausible-sounding control and
    the page then reads as coverage. This checks the rows that name a concrete,
    checkable control, and it checks that the one row recording NO CONTROL keeps
    saying so.

    M-4 IS THE ROW THAT MATTERS. JRS evaluates whether a record explains itself.
    A record can be perfectly reconstructable and describe a discriminatory
    decision, and the engine would route it "ready". That is not a defect in the
    evaluation -- it is a boundary of what the evaluation MEANS -- and nothing
    currently states that boundary to a user. The register records it as
    UNCONTROLLED. This guard fails if that row is quietly upgraded without a
    control appearing, because the temptation to tidy the one honest gap is
    exactly what would destroy the register's value.

    WHAT IT DOES NOT CHECK. Whether any control is EFFECTIVE, or whether a
    customer misrepresents JRS output downstream. Nothing in this repository
    reaches that, and M-1 says so rather than implying otherwise.
    """
    findings = []
    raw = read(".jrs/registries/MISUSE_REGISTER.json")
    if not raw:
        check("misuse register records reality", False,
              ".jrs/registries/MISUSE_REGISTER.json is missing")
        return
    modes = json.loads(raw)["misuses"]

    # Rows whose control is a concrete, checkable fact.
    ANCHORS = {
        "M-2": (lambda: "check_evaluation_offers_no_certificate" in read("scripts/check_zero_drift.py"),
                "the certificate guard named as M-2's control no longer exists"),
        "M-3": (lambda: re.search(r"human_review:\s*\{\s*required:\s*true", read("lib/manifest/build.js")) is not None,
                "M-3 claims human_review.required is hardcoded true; it is not"),
        "M-6": (lambda: os.path.exists(os.path.join(ROOT, "tools/validate-manifest.js")),
                "M-6 names tools/validate-manifest.js as its detection; it is absent"),
        "M-9": (lambda: "check_research_summary_leads_with_its_boundaries" in read("scripts/check_zero_drift.py"),
                "M-9 names the research-boundaries guard as its control; it no longer exists"),
        "M-10": (lambda: "INTEGRITY IS NOT AUTHENTICITY" in read("lib/manifest/build.js"),
                 "M-10 records the integrity-is-not-authenticity statement as sitting beside "
                 "the code that creates the field; it is gone"),
    }
    by_id = {m["id"]: m for m in modes}
    for mid, (test, why) in ANCHORS.items():
        if mid not in by_id:
            findings.append("%s is missing from the register" % mid)
            continue
        try:
            ok = test()
        except Exception as e:
            ok, why = False, "%s check raised %r" % (mid, e)
        if not ok:
            findings.append(why)

    # M-3 must also stay schema-required: a manifest asserting no human review
    # should be INVALID, not merely discouraged.
    sch = read("schemas/jrs-decision-reconstruction-manifest.schema.json")
    if sch:
        try:
            req = json.loads(sch).get("required", [])
            if "human_review" not in req:
                findings.append("human_review is no longer schema-required, so a manifest "
                                "asserting no human review would validate. M-3's control is "
                                "structural precisely because it is required")
        except Exception:
            findings.append("the manifest schema is not parseable")

    # The honest gap must stay honest.
    m4 = by_id.get("M-4")
    if not m4:
        findings.append("M-4 is missing from the register")
    elif "UNCONTROLLED" not in m4.get("status", ""):
        findings.append("M-4 is no longer recorded as UNCONTROLLED. If a control was built, "
                        "name it here and add an anchor above; if it was not, restore the "
                        "status. Tidying the one honest gap is what would make this register "
                        "worthless")

    # No row may claim a control while also recording that none exists.
    for m in modes:
        if m.get("control", "").strip().upper().startswith("NONE") and \
           "UNCONTROLLED" not in m.get("status", "").upper():
            findings.append("%s records control NONE but a status of %r"
                            % (m["id"], m.get("status")))

    check("misuse register records reality",
          not findings,
          "; ".join(findings) if findings
          else "%d misuse modes; %d anchored controls verified against code; M-4 still "
               "recorded UNCONTROLLED; human_review still schema-required"
               % (len(modes), len(ANCHORS)))


def check_no_stale_owner_action_survives_its_confirmation(offline):
    """A completed owner action is not still being asked for somewhere.

    WHY THIS GUARD EXISTS. On 2026-09-18 the owner confirmed the B-001 credential
    rotation, and the estate still carried the instruction to perform it in four
    records plus the forward-looking instruction set. The owner had to point that
    out. An estate that keeps asking for an action already taken trains its reader
    to ignore the asking, and the next genuine owner action gets ignored with it.

    IT ALSO CAUGHT A MISTAKE OF MINE. I had set B-001 to
    "PENDING EXTERNAL VERIFICATION", which would have required repository-side
    proof of an action performed in an external control plane. No such proof can
    exist here, so that status was a permanently open state dressed as rigour.
    An owner attestation IS the evidence class this blocker admits. Refusing the
    only admissible evidence is the mirror of upgrading evidence, and it is just
    as wrong.

    WHAT IT CHECKS. For each owner action recorded as confirmed, the forward-looking
    records do not still instruct that it be performed. Historical records may keep
    the instruction ONLY when carrying a superseding stamp beside it, because
    deleting the instruction would destroy the evidence that it was once live.

    WHAT IT DOES NOT CHECK. Whether the owner action actually happened. That is an
    attestation, not something a repository can verify, and pretending otherwise is
    the error this guard was written after.
    """
    findings = []

    reg = read(".jrs/state/BLOCKERS.json")
    if not reg:
        check("no stale owner action survives its confirmation", False,
              "the blocker registry is missing")
        return
    blockers = json.loads(reg)["blockers"]

    # blocker -> (what it asked for, forward-looking records that must not still ask)
    #
    # HUMAN_DECISIONS_REQUIRED.md WAS ADDED 2026-09-18 AFTER A MUTATION TEST.
    # It is the owner's live decision queue -- the most forward-looking record in
    # the estate -- and it was not in this list. Reasserting B-001 as outstanding
    # there produced a fully passing suite.
    ASKS = {
        "B-001": (r"rotate the (existing )?(production|vercel) credential",
                  ["docs/enterprise-diligence/JRS_NEXT_STEPS_CLAUDE_CODE_INSTRUCTIONS_2026-09-16.md",
                   "docs/enterprise-diligence/JRS_INSTITUTIONAL_CONTINUITY_INDEX.md",
                   "docs/enterprise-diligence/HUMAN_DECISIONS_REQUIRED.md"]),
    }
    # The SAME mutation test showed the instruction pattern alone is not enough.
    # Drift does not have to repeat the original wording: a record can simply
    # assert the action is still outstanding, in words the instruction regex has
    # never seen. These patterns match the STATE CLAIM rather than the request.
    UNDONE = re.compile(
        r"(?:credential|token|rotation)[^.\n]{0,60}(?:has not been|have not been|was not|"
        r"is not|not yet)\s+(?:rotated|performed|completed|done)|"
        r"(?:has not been|have not been|not yet)\s+rotated|"
        r"rotation (?:is|remains) (?:outstanding|pending|incomplete|unperformed|required)|"
        r"B-001 (?:is|remains) (?:open|outstanding|unresolved|pending|not met)",
        re.I)
    STAMP = "SUPERSEDED 2026-09-18"

    for bid, (pat, forward) in ASKS.items():
        hit = [b for b in blockers if b.get("blocker_id") == bid]
        if not hit:
            findings.append("%s is not in the registry" % bid)
            continue
        status = hit[0].get("status", "")
        confirmed = "OWNER-CONFIRMED" in status or "COMPLETED" in status
        if not confirmed:
            continue
        for rel in forward:
            body = read(rel)
            if not body:
                findings.append("%s is missing; it carried the %s instruction" % (rel, bid))
                continue
            for m in re.finditer(pat, body, re.I):
                window = body[max(0, m.start() - 700):m.end() + 400]
                if STAMP not in window and "UPDATED 2026-09-18" not in window:
                    findings.append("%s still instructs the %s action, which the owner "
                                    "confirmed complete. An estate that keeps asking for a "
                                    "done action trains its reader to ignore the asking"
                                    % (rel, bid))
                    break
            # A claim that the action is still undone, scoped to the SENTENCE.
            # A window would let a superseding stamp several paragraphs away
            # excuse a live assertion -- the failure this project has repeated
            # often enough that it is no longer an acceptable design here.
            flat = re.sub(r"[ \t]+", " ", re.sub(r"^\s*>\s?", "", body, flags=re.M))
            for sent in re.split(r"(?<=[.!?])\s+|\n{2,}", flat):
                live = re.sub(r"~~.+?~~", " ", sent, flags=re.S)
                if UNDONE.search(live) and STAMP not in live and \
                        not re.search(r"was open when|previously|prior (?:text|status)|"
                                      r"OWNER-CONFIRMED|no longer", live, re.I):
                    findings.append("%s asserts the %s action is still outstanding: %r. The "
                                    "owner confirmed it complete on 2026-09-18 (E-030)"
                                    % (rel, bid, sent.strip()[:110]))
                    break

    # The status itself must not demand proof the repository cannot hold.
    for b in blockers:
        if b.get("blocker_id") != "B-001":
            continue
        st = b.get("status", "")
        if "PENDING EXTERNAL VERIFICATION" in st:
            findings.append("B-001 is back to PENDING EXTERNAL VERIFICATION. The rotation "
                            "happened in an external control plane and no repository-side "
                            "proof can exist; requiring it makes a completed action "
                            "permanently open")

    check("no stale owner action survives its confirmation",
          not findings,
          "; ".join(findings) if findings
          else "%d recorded owner action(s) checked; no forward-looking record still asks "
               "for a confirmed action, and the historical records carry superseding stamps"
               % len(ASKS))


def check_version_inventory_matches_its_sources(offline):
    """Every declared version equals the value its named source actually holds.

    WHY THIS GUARD EXISTS. A version inventory that nobody checks is an assertion,
    not a control -- the same failure as the methodology mapping that described the
    engine vocabulary while nothing tied it to ENGINE_CONDITION_KEYS. The inventory
    in RELEASE_REGISTER.json names, for each version, the FILE AND SYMBOL that holds
    the real value. This reads each one back.

    WHAT IT ALSO CHECKS, and it is the finding that produced the inventory:
    jrs_version and codebook_version are CALLER-SUPPLIED to buildManifest and are
    validated only for PRESENCE. The builder throws when they are absent and accepts
    any string when present, so a manifest can assert a Codebook version that never
    existed and nothing fails. The manifest is the artifact a CUSTOMER keeps as
    durable evidence, which makes an unvalidated version field an unverifiable
    provenance claim on the one record they hold. This guard holds the gap open --
    it fails if the registry stops recording it -- rather than pretending a registry
    entry closed it.

    WHAT IT DOES NOT CHECK. Whether any version number is CORRECT in the sense of
    describing what it names. A string comparison cannot establish that, and the
    compatibility matrix deliberately records NOT_ESTABLISHED wherever no second
    version has ever existed to test against.
    """
    findings = []
    reg = read(".jrs/registries/RELEASE_REGISTER.json")
    if not reg:
        check("version inventory matches its sources", False,
              "RELEASE_REGISTER.json is missing; version state has no home")
        return
    r = json.loads(reg)
    inv = r.get("version_inventory")
    if not inv:
        check("version inventory matches its sources", False,
              "the release register carries no version_inventory")
        return

    # symbol readers: name -> (file, regex capturing the value)
    READERS = {
        "manifest_version":  ("lib/manifest/build.js",        r"MANIFEST_VERSION\s*=\s*'([^']+)'"),
        "canonicalization":  ("lib/manifest/canonicalize.js", r"CANONICALIZATION_ID\s*=\s*'([^']+)'"),
        "engine_version":    ("api/v1/review-engine.js",      r"ENGINE_VERSION\s*=\s*'([^']+)'"),
        "api_version":       ("api/v1/review-engine.js",      r"API_VERSION\s*=\s*'([^']+)'"),
        "model_identifier":  ("api/_model.js",                r"'(claude-[a-z0-9.-]+)'"),
        "retention_policy":  ("lib/retention/policy.js",      r"RETENTION\s*=\s*\{[^}]*?version:\s*'([^']+)'"),
    }
    for key, (rel, pat) in READERS.items():
        declared = (inv.get(key) or {}).get("value")
        if declared is None:
            findings.append("inventory has no entry for %s" % key)
            continue
        m = re.search(pat, read(rel) or "", re.S)
        if not m:
            findings.append("cannot read %s from %s; the inventory names a source that no "
                            "longer holds the value" % (key, rel))
            continue
        if m.group(1) != declared:
            findings.append("%s: inventory says %r, %s holds %r"
                            % (key, declared, rel, m.group(1)))

    # The caller-supplied gap must stay recorded until it is actually closed.
    gap = r.get("caller_supplied_gap")
    if not gap:
        findings.append("caller_supplied_gap is gone from the release register. "
                        "jrs_version and codebook_version are still caller-supplied "
                        "unless build.js validates them, so removing the record hides "
                        "an open gap rather than closing it")
    else:
        build = read("lib/manifest/build.js")
        validates = bool(re.search(r"jrsVersion\s*\)[^\n]{0,80}(includes|indexOf|===)", build)
                         or re.search(r"ALLOWED_JRS_VERSIONS", build))
        if validates and "OPEN" in str(gap.get("status", "")):
            findings.append("build.js now appears to validate jrsVersion, but the register "
                            "still records the gap as OPEN. Close it deliberately with the "
                            "evidence rather than leaving the record stale")

    # Compatibility must be declared, never inferred from version ordering.
    ALLOWED = {"COMPATIBLE", "INCOMPATIBLE", "MIGRATION_REQUIRED", "DEPRECATED",
               "UNSUPPORTED", "NOT_ESTABLISHED", "INCONSISTENT"}
    comps = (r.get("compatibility_matrix") or {}).get("components") or {}
    if not comps:
        findings.append("the release register carries no compatibility matrix")
    for name, c in comps.items():
        st = c.get("state")
        if st not in ALLOWED:
            findings.append("compatibility state %r for %s is not one of the declared "
                            "classifications" % (st, name))
        elif not c.get("why"):
            findings.append("%s is classified %s with no reason; compatibility requires "
                            "evidence, and the reason IS the evidence here" % (name, st))

    # The reproducibility determination must be one of the three defined values.
    tr = r.get("temporal_reproducibility") or {}
    if tr.get("determination") not in {"PASS", "CONDITIONAL", "FAIL"}:
        findings.append("temporal reproducibility determination is %r, which is not one of "
                        "PASS, CONDITIONAL or FAIL" % tr.get("determination"))
    props = tr.get("_four_distinct_properties") or {}
    for prop in ("reconstructable", "reproducible", "re_executable", "verified_re_execution"):
        if prop not in props:
            findings.append("the four reproducibility properties must stay distinct; %r is "
                            "missing. A documented environment is not a reproducible one, "
                            "and a rerun is not a verification" % prop)

    check("version inventory matches its sources",
          not findings,
          "; ".join(findings) if findings
          else "%d inventory entries read back from code; %d components classified; "
               "determination %s; the caller-supplied version gap is still recorded"
               % (len(READERS), len(comps), tr.get("determination")))


def _surface_text(rel, cls):
    """What a surface SAYS, not the bytes it is stored as.

    WHY THIS EXISTS. A directed mutation exposed it. The claim guard searched the
    RAW JSON FILE for r"\\bthe call is stateless\\b" and got no match, although
    openapi.json plainly contains that sentence. In the raw file the preceding
    characters are the ESCAPE SEQUENCE \\n\\n -- four literal characters ending in
    the letter n, which is a WORD character -- so the \\b before "the" had no
    boundary to match against.

    The guard was reading storage and reasoning about meaning. For JSON it now
    parses and concatenates the string values, so an escape sequence cannot hide a
    claim and cannot manufacture a boundary that is not there. HTML is read as
    written, because for HTML the bytes are the text.
    """
    body = read(rel)
    if not body:
        return ""
    if cls != "JSON":
        return body
    try:
        doc = json.loads(body)
    except Exception:
        return body
    out = []

    def walk(o):
        if isinstance(o, dict):
            for v in o.values():
                walk(v)
        elif isinstance(o, list):
            for v in o:
                walk(v)
        elif isinstance(o, str):
            out.append(o)

    walk(doc)
    return "\n".join(out)


def check_prohibited_claims_are_absent_from_every_surface_class(offline):
    """A claim the register prohibits does not appear on a surface it prohibits.

    WHY THIS GUARD EXISTS, and it is the B-016 lesson made mechanical. The
    2026-09-15 claims sweep removed a data-handling proposition from ten HTML
    pages and left it live in openapi.json, because the sweep read HTML. The
    claim was controlled in the register and uncontrolled on the surface that
    mattered: the published, commercially licensed machine artifact a buyer's
    security reviewer actually opens.

    A CLAIM IS NOT CONTROLLED BY BEING WRITTEN DOWN ONCE. It is controlled where
    it is SAID. So this guard reads the register as the source of truth and
    checks every surface CLASS the register names, HTML and JSON alike.

    WHAT IT CHECKS. For each claim with status PROHIBITED, its detection patterns
    are absent from the surface classes listed in surfaces_prohibited. One
    occurrence is known, registered and blocked on counsel: the C-13 statelessness
    text in openapi.json, which cannot be edited until B-016 is dispositioned. It
    is pinned by the claim id, not by a hash of the wording, so that the eventual
    authorized correction does not trip this guard on its way through.

    WHAT IT DOES NOT CHECK. Whether a permitted claim is TRUE, or whether its
    limitation travels with it. A register cannot establish truth; it can only
    stop a proposition appearing where the project has decided it must not.
    """
    findings = []

    reg = read(".jrs/registries/CLAIMS_REGISTER.json")
    if not reg:
        check("prohibited claims are absent from every surface class", False,
              "the claims register is missing; claim control has no source of truth")
        return
    claims = json.loads(reg)["claims"]

    # Detection patterns per prohibited claim. Deliberately narrow: a pattern that
    # fires on ordinary prose teaches the reader to ignore the guard.
    PATTERNS = {
        "C-13": [r"\bthe call is stateless\b", r"\bno data.residency\b",
                 r"\bstateless\b[^.]{0,40}\bdecision gate\b"],
        "C-16": [r"manifest is authenticated", r"proves authenticity",
                 r"proves authorship"],
        "C-17": [r"\bis rfc\s*8785 compliant\b", r"\bjcs compliant\b"],
        "C-19": [r"\bproduction[- ]verified\b(?![^.]{0,30}\b(none|no|not)\b)"],
    }
    # The one occurrence that is known, recorded and blocked on counsel.
    REGISTERED = {("C-13", "openapi.json"): "B-016, correction drafted and UNAPPLIED"}

    json_surfaces = sorted(g for g in os.listdir(ROOT)
                           if g.startswith("openapi") and g.endswith(".json"))

    for c in claims:
        if c.get("status") != "PROHIBITED":
            continue
        cid = c.get("claim_id")
        mode = c.get("enforcement")
        if mode is None:
            findings.append("claim %s is PROHIBITED but declares no enforcement mode. "
                            "Every prohibited claim must say whether it is caught by "
                            "pattern or held by human review" % cid)
            continue
        if mode == "human_review":
            # DELIBERATELY NOT AUTOMATED, decided 2026-09-15. These terms appear
            # legitimately inside negations, disclaimers, version strings and
            # quotations. A naive scan flagged "validated" in the version string
            # 0.1.0-validation and in "is NOT established as validated", and
            # flagged "legally defensible" inside a sentence denying it. The
            # recorded finding was that false-positive governance is worse than
            # none. This guard requires the REASON to survive, not the claim to
            # be automated.
            if not c.get("enforcement_reason"):
                findings.append("claim %s is held by human review with no recorded "
                                "reason; the 2026-09-15 decision turned on the "
                                "specific false positives, so the reason is the "
                                "control" % cid)
            continue
        pats = PATTERNS.get(cid)
        if not pats:
            findings.append("claim %s declares pattern enforcement but has no "
                            "detection pattern" % cid)
            continue
        banned = set(c.get("surfaces_prohibited") or [])
        targets = []
        if "HTML" in banned:
            targets += [(r, "HTML") for r in _html_files()]
        if "JSON" in banned:
            targets += [(r, "JSON") for r in json_surfaces]
        for rel, cls in targets:
            body = _surface_text(rel, cls)
            if not body:
                continue
            for pat in pats:
                if re.search(pat, body, re.I):
                    if (cid, rel) in REGISTERED:
                        break
                    findings.append("%s (%s surface) carries prohibited claim %s "
                                    "matching %r" % (rel, cls, cid, pat))
                    break

    # THE REGISTERED EXCEPTION MUST STILL BE THE THING IT SAYS IT IS, and this
    # check pins the SET of patterns, not any-of. The first version asked whether
    # ANY C-13 pattern still matched openapi.json, and a directed mutation passed:
    # deleting "The call is stateless." left the data-residency clause behind, so
    # "any" was still satisfied while the registered text had materially changed.
    # A registration that tolerates its own subject changing underneath it is not
    # a registration. C-13 in openapi.json is TWO distinct propositions and both
    # are pinned.
    EXPECTED = {("C-13", "openapi.json"): {r"\bthe call is stateless\b",
                                           r"\bno data.residency\b"}}
    for (cid, rel), why in REGISTERED.items():
        body = _surface_text(rel, "JSON" if rel.endswith(".json") else "HTML") or ""
        expected = EXPECTED.get((cid, rel), set(PATTERNS.get(cid, [])))
        missing = sorted(p for p in expected if not re.search(p, body, re.I))
        if missing:
            findings.append("the registered %s occurrence in %s no longer matches %s. "
                            "If the contract was corrected under counsel authority that "
                            "is good news and this registration should be retired "
                            "deliberately; if it changed any other way, the published "
                            "contract moved without authorization (%s)"
                            % (cid, rel, missing, why))

    check("prohibited claims are absent from every surface class",
          not findings,
          "; ".join(findings) if findings
          else "%d claims read, %d prohibited (%d by pattern, %d held by human "
               "review with recorded reasons); %d HTML and %d JSON surfaces swept; "
               "1 registered occurrence (C-13 in openapi.json, blocked on B-016)"
               % (len(claims),
                  sum(1 for c in claims if c.get("status") == "PROHIBITED"),
                  sum(1 for c in claims if c.get("enforcement") == "pattern"),
                  sum(1 for c in claims if c.get("enforcement") == "human_review"),
                  len(_html_files()), len(json_surfaces)))


def check_no_conditional_deployment_state(offline):
    """No record asserts a deployment state the state machine does not have.

    WHY THIS GUARD EXISTS. The production state machine has exactly four rungs:
    DEVELOPMENT REMEDIATION, DEPLOYMENT READY, DEPLOYMENT AUTHORIZED, DEPLOYED.
    There is no "conditional" rung. A deployment is authorized or it is not, and
    "conditionally authorized" is the phrase by which the second becomes the first
    without anybody deciding anything.

    The project used it once, in D-9. Both surviving occurrences carry their own
    negation ("CONDITIONS NOT MET"), so neither ever asserted live authorization —
    but a HEADING is read before its body, and the next reader of a readiness
    report does not always reach the qualifier.

    WHAT IT CHECKS. The phrase appears only at the two registered historical
    locations, each of which is preserved deliberately with a superseding note.
    Any NEW occurrence fails, including one in a fresh readiness report.

    WHY REGISTER RATHER THAN DELETE. Editing the historical heading to look
    cleaner would destroy the evidence that the project once used a state that
    does not exist. That evidence is worth more than the tidiness.
    """
    findings = []
    REGISTERED = {
        "docs/enterprise-diligence/HUMAN_DECISIONS_REQUIRED.md":
            "D-9 historical heading, preserved with a superseding note above it",
        ".jrs/state/BLOCKERS.json":
            "B-005 update_2026_09_15, a dated historical field that states the "
            "condition was NOT met",
    }
    pat = re.compile(r"conditionall?y\s+authori[sz]ed", re.I)

    for rel in sorted(set(_html_files()) | set(REGISTERED)):
        body = read(rel)
        if not body:
            continue
        if pat.search(body) and rel not in REGISTERED:
            findings.append("%s asserts a conditional deployment state; the state "
                            "machine has no such rung" % rel)

    for base in ("docs/enterprise-diligence", "docs/repository-operations", ".jrs/state",
                 ".jrs/reports"):
        d = os.path.join(ROOT, base)
        if not os.path.isdir(d):
            continue
        for name in sorted(os.listdir(d)):
            rel = base + "/" + name
            if not name.endswith((".md", ".json", ".txt")):
                continue
            if pat.search(read(rel) or "") and rel not in REGISTERED:
                findings.append("%s asserts a conditional deployment state; a "
                                "deployment is authorized or it is not" % rel)

    for rel in REGISTERED:
        if not pat.search(read(rel) or ""):
            findings.append("%s no longer contains the registered historical "
                            "occurrence. If it was deleted rather than superseded, "
                            "the evidence that this state was once used is gone"
                            % rel)

    check("no conditional deployment state",
          not findings,
          "; ".join(findings) if findings
          else "the phrase appears only at its %d registered historical locations, "
               "each preserved with its own negation" % len(REGISTERED))


def check_production_verifier_reads_no_secret(offline):
    """The production verification runbook can never acquire a secret credential.

    WHY THIS GUARD EXISTS. scripts/production_verify.py is written to run against
    production once B-001 clears. A verification script is exactly the kind of
    file that accretes credentials: the next check needs slightly more access,
    someone adds a service-role read "just for verification", and a secret now
    lives in a script that WRITES AN EVIDENCE FILE. The evidence file is the part
    that makes it dangerous, because it is designed to be kept and shared.

    WHAT IT CHECKS. The script references no secret environment variable and no
    secret-shaped literal in CODE, and reads only the PUBLISHABLE key, which
    ships in 17 HTML files by design and so discloses nothing. It also must not
    deploy, revoke or grant: verification and mutation are different acts.

    CODE ONLY, NOT THE PROSE ABOUT THE CODE. The first version of this guard
    failed on its own target, three ways, every one of them in commentary: the
    script's docstring names REVIEW_API_TOKEN while explaining what it must never
    hold, its comments use "revocation" while explaining that it does not revoke,
    and the bare token `service_role` matched the function name
    _c_service_role_path_intact, which verifies that the legitimate server-side
    path still serves. Eighth substring-versus-commentary miss on this project.
    Docstrings and comments are stripped first, and the credential is matched by
    its actual variable name rather than by a fragment of it.

    WHAT IT DOES NOT CHECK. Whether the script's assertions are correct, or
    whether it has ever been run. At the time of writing it had NOT been run, and
    a check that has not run establishes nothing.
    """
    findings = []
    rel = "scripts/production_verify.py"
    src = read(rel)
    if not src:
        check("production verifier reads no secret", False, "%s is missing" % rel)
        return

    code = re.sub(r"#[^\n]*", "", _strip_py_docstrings(src))
    # ONE NAMED EXEMPTION, and it is exempt because its purpose is the opposite
    # of the risk. SECRET_NAMES_THAT_MUST_NOT_LEAK is a pattern the script
    # searches a 401 RESPONSE for, to assert the endpoint does not name the flag
    # governing its own access. Removing the whole declaration keeps every other
    # occurrence in scope, so the exemption cannot spread past this one line.
    code = re.sub(r"SECRET_NAMES_THAT_MUST_NOT_LEAK\s*=\s*\([^)]*\)", "", code)

    BANNED = ("SUPABASE_SERVICE_ROLE_KEY", "ANTHROPIC_API_KEY", "REVIEW_API_TOKEN",
              "VERCEL_DEPLOY_HOOK_URL", "BENCH_SCORE_TOKENS", "BENCH_KEY_JSON",
              "sb_secret_")
    for name in BANNED:
        if name in code:
            findings.append("%s references %r in CODE; a verification script must "
                            "never hold or acquire a secret" % (rel, name))
    if re.search(r"eyJ[A-Za-z0-9_-]{10,}\.", code):
        findings.append("%s contains a JWT-shaped literal" % rel)
    if re.search(r"\bos\.environ\b|\bgetenv\b", code):
        findings.append("%s reads the environment; it is designed to need nothing "
                        "beyond the published key" % rel)
    if "sb_publishable_" not in src:
        findings.append("%s no longer locates the publishable key; if the access "
                        "method changed, re-read what it now uses" % rel)

    for pat, why in ((r"\bDROP\s+POLICY\b", "a grant change is a separate authorized operation"),
                     (r"\bREVOKE\s+\w", "a grant change is a separate authorized operation"),
                     (r"\bGRANT\s+\w+\s+ON\b", "a grant change is a separate authorized operation"),
                     (r"vercel\s+(?:deploy|--prod)", "deployment is authorized elsewhere")):
        if re.search(pat, code, re.I):
            findings.append("%s performs a mutation matching %r; %s" % (rel, pat, why))

    check("production verifier reads no secret",
          not findings,
          "; ".join(findings) if findings
          else "reads only the publishable key; no secret variable, no JWT literal, "
               "no environment read, and it neither deploys nor revokes")


def check_architecture_baseline_is_current(offline):
    """A pinned structural fact has not moved without the freeze being revised.

    WHY THIS GUARD EXISTS. Phase 0's exit criteria require an architecture
    baseline, and the operating architecture asks for a FREEZE so that later
    change becomes a recorded revision rather than informal evolution. Nothing in
    this repository could previously detect that the architecture had CHANGED.
    The suite catches drift in claims, projections, retention units and
    vocabulary; it did not catch a change in the SHAPE of the estate -- a sixth
    engine key, a different truncation cap, a retention unit, a new anon-readable
    table, a moved contract hash.

    WHAT IT CHECKS. Each pinned value in .jrs/state/ARCHITECTURE_BASELINE.json
    against the artifact it was copied from. The baseline ASSERTS NOTHING of its
    own: where it and the artifact disagree, the artifact controls and this guard
    fails so the disagreement is acknowledged rather than absorbed.

    WHAT IT DOES NOT CHECK. Whether the architecture is GOOD, or whether a change
    is undesirable. A failure here is not "something broke"; it is "the shape
    changed and the freeze has not been revised." Revising the freeze is the
    correct response to an intended change, and is itself a recorded act.

    COUNTS ARE PINNED AS FLOORS, NOT EQUALITIES, for the things that legitimately
    grow. Guards and tests are added constantly and a guard that failed on every
    added guard would be deleted within a week. A DECREASE is the signal: a guard
    suite that shrank, or a test suite that lost checks, is drift.
    """
    import json as _json
    findings = []

    raw = read(".jrs/state/ARCHITECTURE_BASELINE.json")
    if not raw:
        check("architecture baseline is current", False,
              ".jrs/state/ARCHITECTURE_BASELINE.json is missing; the freeze is the "
              "Phase 0 exit artifact and cannot be absent")
        return
    b = _json.loads(raw)

    # Methodology vocabulary, against the executable list.
    build = read("lib/manifest/build.js")
    m = re.search(r"ENGINE_CONDITION_KEYS\s*=\s*\[(.*?)\]", build, re.S)
    live_keys = set(re.findall(r"'([a-z_]+)'", m.group(1))) if m else set()
    if live_keys != set(b["methodology"]["engine_condition_keys"]):
        findings.append("engine condition keys moved: baseline %s, code %s"
                        % (sorted(b["methodology"]["engine_condition_keys"]),
                           sorted(live_keys)))

    # Interoperability constants.
    hsrc = read("lib/manifest/hash.js")
    tm = re.search(r"ENGINE_TRUNCATION_LIMIT\s*=\s*(\d+)", hsrc)
    if not tm or int(tm.group(1)) != b["interoperability"]["engine_truncation_limit_chars"]:
        findings.append("truncation limit moved: baseline %s, code %s"
                        % (b["interoperability"]["engine_truncation_limit_chars"],
                           tm.group(1) if tm else "absent"))

    # Retention, both rules, in their declared units.
    pol = read("lib/retention/policy.js")
    lit = re.search(r"ENGINE_REVIEW_RETENTION\s*=\s*\{(.*?)\n\};", pol, re.S)
    decl = re.sub(r"//[^\n]*", "", lit.group(1)) if lit else ""
    dm = re.search(r"\bdays:\s*(\d+)", decl)
    if not dm or int(dm.group(1)) != b["retention"]["engine_reviews_record_derived_days"]:
        findings.append("engine_reviews retention moved: baseline %s days, code %s"
                        % (b["retention"]["engine_reviews_record_derived_days"],
                           dm.group(1) if dm else "no day count"))
    rl = re.search(r"RETENTION\s*=\s*\{.*?months:\s*(\d+)", pol, re.S)
    if not rl or int(rl.group(1)) != b["retention"]["interaction_events_months"]:
        findings.append("telemetry retention moved: baseline %s months, code %s"
                        % (b["retention"]["interaction_events_months"],
                           rl.group(1) if rl else "absent"))

    # The published contract.
    import hashlib as _h
    live_hash = _h.sha256(open(os.path.join(ROOT, "openapi.json"), "rb").read()).hexdigest()[:16]
    if live_hash != b["published_contract"]["sha256"]:
        findings.append("openapi.json changed: baseline %s, now %s. B-016 freezes this "
                        "artifact pending counsel, so a change here is a "
                        "contract-integrity finding, NOT something to repair"
                        % (b["published_contract"]["sha256"], live_hash))

    # Surface shape.
    rules = len([l for l in read(".vercelignore").splitlines()
                 if l.strip() and not l.strip().startswith("#")])
    if rules < b["surface"]["vercelignore_rules"]:
        findings.append("deployment exclusions DROPPED: baseline %d rules, now %d. "
                        "Removing an exclusion widens the public surface"
                        % (b["surface"]["vercelignore_rules"], rules))

    # Floors, not equalities. A decrease is the signal.
    src = read("scripts/check_zero_drift.py")
    live_guards = len(re.findall(r"^def check_", src, re.M))
    pinned = b["controls"]["guards"]
    if live_guards < pinned:
        findings.append("guard count FELL: baseline %d, now %d. Guards are added "
                        "freely; a decrease means one was deleted" % (pinned, live_guards))
    elif live_guards > pinned:
        # A FLOOR BELOW THE LIVE COUNT PROTECTS NOTHING, and the pin is editable.
        # A mutation lowered it from 125 to 90 and the suite stayed green: at that
        # setting thirty-five guards could be deleted unnoticed. So the pin must
        # TRACK the live count rather than lag it, which also forces a guard added
        # today to be recorded in the same change rather than absorbed.
        findings.append("guard floor LAGS the live count: baseline %d, now %d. A floor "
                        "below the live count would let %d guard(s) be deleted without "
                        "failing. Re-pin it in the change that adds a guard"
                        % (pinned, live_guards, live_guards - pinned))

    # A GUARD THAT IS DEFINED BUT NEVER CALLED IS NOT A GUARD.
    #
    # ADDED 2026-09-18 after a mutation test. Deleting one name from the dispatch
    # list below left the function definition in place, so the count above was
    # unchanged and the suite reported a clean run -- with that guard never
    # executed. Counting definitions measures how much code exists, not how much
    # of it runs, and only the second is a control. The two lists are therefore
    # compared directly.
    defined = set(re.findall(r"^def (check_\w+)", src, re.M))
    # READ THE WHOLE DISPATCH TUPLE, NOT ONE NAME PER LINE. The first version of
    # this limb anchored on "^<indent>check_x,$" and reported TEN live guards as
    # orphaned: some share a line with a second name, and the last one ends the
    # tuple with ")" instead of ",". Line-anchoring a value that is not
    # line-shaped is a mistake this suite has now made four times, and it fails
    # in the dangerous direction here - it would have had me "fix" ten guards
    # that were never broken.
    disp = re.search(r"for fn in \((.*?)\):", src, re.S)
    dispatched = set(re.findall(r"check_\w+", disp.group(1))) if disp else set()
    orphaned = sorted(defined - dispatched)
    if orphaned:
        findings.append("%d guard(s) are defined but never dispatched, so they do "
                        "not run: %s. A guard removed from the call list while its "
                        "definition stays behind leaves the suite green and the "
                        "control gone" % (len(orphaned), ", ".join(orphaned[:6])))

    check("architecture baseline is current",
          not findings,
          "; ".join(findings) if findings
          else "baseline v%s frozen %s; vocabulary, truncation, both retention "
               "rules, contract hash, exclusions and guard floor all match their "
               "sources; %d guards defined and all %d dispatched"
               % (b["version"], b["frozen"], live_guards, len(dispatched)))


def check_every_public_table_projection_has_a_recorded_disposition(offline):
    """Every anonymously readable table a page queries has a reasoned disposition.

    WHY THIS GUARD EXISTS, and it starts with a correction to what the previous
    cycle appeared to establish.

    THE PAGE PROJECTION IS NOT THE CONTROL. Round G added an allow-list over
    engine_reviews and narrowed research-data.html. That prevents the PAGE from
    displaying a column and prevents silent drift. It does NOT protect the data.
    The publishable key ships in 17 HTML files by design, so anyone holding it
    can issue select=* against any anonymously readable table directly, whatever
    a page asks for. THE GRANT IS THE CONTROL. For engine_reviews that is
    B-013 limb A; for finding_responses it is B-017; both are production revocations
    queued behind B-001. Anyone reading the Round G work as "engine_reviews is
    protected" is reading it wrong, and this docstring exists so that reading
    does not survive.

    WHAT THIS GUARD IS FOR, given that. Defence in depth and drift control: a
    table that gains a public projection, or a projection that widens to
    select=*, must be a decision somebody recorded, not a line somebody added.

    WHY A REGISTRY AND NOT A BLANKET RULE. A blanket "no select=* where a text
    or jsonb column exists" would fire on studies.description,
    research_questions.question and findings.body, which are public by intent --
    the standard is published, that is the architecture. Analysing each table
    individually is required, so each disposition is written down and a table
    absent from the registry fails rather than defaulting to allowed.

    WHAT IT DOES NOT CHECK. Whether a disposition is CORRECT, and whether the
    underlying grant should exist at all. Those are Board and production
    questions respectively, and two of them are open blockers.
    """
    findings = []

    # table -> (allowed projection mode, recorded reason)
    #   "*"        select=* is dispositioned as acceptable
    #   "explicit" a named column list is required; select=* fails
    #   "none"     no public projection at all
    DISPOSITIONS = {
        "engine_reviews":     ("explicit", "BD-11/BD-02. Record-derived model output. Grant revocation is B-013 limb A"),
        "finding_responses":  ("none",     "BD-14/B-017. Collected under an explicit promise of non-publication"),
        "study_runs":         ("explicit", "BD-16. `raw jsonb` is declared for audit output and nothing writes it; select=* would publish it the moment anything did"),
        "bench_records":      ("explicit", "B-013B. Contributor-supplied record text, rendered by the review pages by design; the open question is factual, not technical"),
        "bench_labels":       ("explicit", "X-3. `note` is free text and is NOT projected; labeler_code is"),
        "bench_ai_verdicts":  ("explicit", "Model determinations over bench records"),
        "bench_outcomes":     ("*",        "X-4. Rung 3 real-case outcomes, deliberately open; `note` is free text and is recorded as an open question, not silently narrowed"),
        "finding_poll_votes": ("*",        "A/B/C/D tallies and a study id. No free-text column exists"),
        "findings":           ("explicit", "Published findings. Public by intent"),
        "findings_history":   ("*",        "Nightly reproducibility time series. Research output, public by intent"),
        # CORRECTED 2026-09-17 when X-1 was actually analysed. The previous
        # reason read: "Collected under 'no free text and no identifying
        # information are collected'". THAT ATTRIBUTED ONE PAGE'S PROMISE TO THE
        # WHOLE TABLE AND WAS WRONG. The promise appears on pilot.html ONLY, and
        # pilot.html honours it exactly: it writes payload {selection} and
        # nothing else. index.html has NO such promise and DOES write free text,
        # payload {selection, note}, from a field labelled "Optional: brief
        # operational note. Do not include names or personal identifiers" --
        # an instruction, not a promise, and jrsSanitizeCheck runs before the
        # send. So no promise is breached, and the disposition stands; the
        # REASON was inaccurate and is replaced rather than quietly reworded.
        "interaction_events": ("*",        "X-1 CLOSED. Two writers with different copy: pilot.html promises no free text and writes none; index.html promises nothing and writes an instructed operational note. No contradiction. The note is visitor-typed prose in an anon-readable table, mitigated by instruction and sanitisation, and is research data in a research export -- narrowing it would be a research-surface change made under a security heading"),
        "research_questions": ("*",        "Open research questions. Public by intent"),
        "studies":            ("*",        "Study registry. Public by intent"),
        "armb_progress":      ("explicit", "Owner surface only"),
        "pilot_progress":     ("explicit", "Owner surface only"),
        "realcase_progress":  ("*",        "Owner surface only; not a public page"),
    }

    def _strip(text):
        text = re.sub(r"<!--.*?-->", "", text, flags=re.S)
        return re.sub(r"^\s*//[^\n]*$", "", text, flags=re.M)

    seen = set()
    for rel in _html_files():
        body = _strip(read(rel))
        for m in re.finditer(r"rest/v1/([a-z_]+)\?select=([^'\"&\s]+)", body):
            table, sel = m.group(1), m.group(2)
            seen.add(table)
            if table not in DISPOSITIONS:
                findings.append("%s queries %s, which has no recorded disposition. "
                                "A table gaining a public projection is a decision, "
                                "not a line: analyse its columns and its collection "
                                "promise, then add it here with the reason"
                                % (rel, table))
                continue
            mode, _why = DISPOSITIONS[table]
            if mode == "none":
                findings.append("%s queries %s, which is dispositioned as having NO "
                                "public projection at all" % (rel, table))
            elif mode == "explicit" and sel.strip() == "*":
                findings.append("%s widened %s to select=*, against a recorded "
                                "disposition requiring a named column list" % (rel, table))

    stale = set(DISPOSITIONS) - seen - {"finding_responses"}
    if stale:
        findings.append("dispositions recorded for tables no page queries any more: "
                        "%s. Stale entries make the registry look like coverage it "
                        "no longer provides" % ", ".join(sorted(stale)))

    check("every public table projection has a recorded disposition",
          not findings,
          "; ".join(findings) if findings
          else "%d tables queried, all dispositioned; the registry holds %d entries. "
               "This is drift control, NOT protection: the grant is the control, "
               "and B-013 limb A and B-017 are the grants"
               % (len(seen), len(DISPOSITIONS)))


def check_the_methodology_mapping_tracks_the_executable_vocabulary(offline):
    """The authoritative Codebook/API mapping covers exactly the keys the code uses.

    WHY THIS GUARD EXISTS. Found 2026-09-16 by the Round G sweep. D-3's
    classification was complete and correct, and NOTHING TIED IT TO THE CODE.
    No guard referenced METHODOLOGY_TO_API_MAPPING.md, ENGINE_CONDITION_KEYS or
    cold_reviewer_clarity. Add a sixth engine key, rename one, or drop one, and
    the document the operating instructions call authoritative silently becomes
    wrong, with nothing failing.

    This is the same class as the manifest truncation limit: a value asserted in
    one place that must track a declaration somewhere else. It matters more here.
    The governing rule is that implementation vocabulary must NEVER silently
    redefine methodology vocabulary, and a mapping nobody checks is exactly how
    that happens.

    WHAT IT CHECKS.
      1. The API keys in the mapping's classification table and the keys in
         ENGINE_CONDITION_KEYS are the SAME SET. A key in code and not in the map
         is an undocumented condition; a key in the map and not in code is a
         mapping to something that no longer exists.
      2. cold_reviewer_clarity is still classified UNRESOLVED. It must not be
         quietly upgraded: whether it is the Codebook's AGGREGATE condition or a
         distinct fifth dimension is NOT EVIDENCED, and resolving it by reasoning
         about what it probably means would change the methodology rather than
         document it. That is D-2, INTENTIONALLY UNRESOLVED.
      3. No row reads EXACT except basis_identification. The other three are
         DECLARED, not UPGRADED: the declaration settles which engine key
         corresponds to which Codebook condition, not that the names mean the
         same thing.

    WHAT IT DOES NOT CHECK. Whether any mapping is CORRECT. That is a
    methodological judgement resting on evidence, not something a string
    comparison can establish, and three of the five remain SEMANTIC / INFERRED
    precisely because the evidence does not settle them.
    """
    findings = []

    doc = read("docs/enterprise-diligence/METHODOLOGY_TO_API_MAPPING.md")
    build = read("lib/manifest/build.js")
    if not doc or not build:
        check("the methodology mapping tracks the executable vocabulary", False,
              "the mapping document or lib/manifest/build.js is missing")
        return

    m = re.search(r"ENGINE_CONDITION_KEYS\s*=\s*\[(.*?)\]", build, re.S)
    if not m:
        check("the methodology mapping tracks the executable vocabulary", False,
              "ENGINE_CONDITION_KEYS is no longer declared as a list in "
              "lib/manifest/build.js; the mapping has nothing to track")
        return
    code_keys = set(re.findall(r"'([a-z_]+)'", m.group(1)))

    # The classification table only: rows of the form
    # | Condition | `api_key` | **RELATIONSHIP** |
    rows = re.findall(r"^\|\s*([^|]+?)\s*\|\s*`([a-z_]+)`\s*\|\s*(.+?)\s*\|\s*$",
                      doc, re.M)
    mapped = {k: rel for _, k, rel in rows}

    missing = code_keys - set(mapped)
    extra = set(mapped) - code_keys
    if missing:
        findings.append("engine keys absent from the authoritative mapping: %s. An "
                        "engine condition with no documented Codebook correspondence "
                        "is implementation vocabulary redefining methodology "
                        "vocabulary by default" % ", ".join(sorted(missing)))
    if extra:
        findings.append("mapping rows for keys the engine no longer has: %s"
                        % ", ".join(sorted(extra)))

    rel = mapped.get("cold_reviewer_clarity", "")
    if "UNRESOLVED" not in rel.upper():
        findings.append("cold_reviewer_clarity is no longer classified UNRESOLVED "
                        "(now %r). Whether it is the Codebook's aggregate condition "
                        "or a distinct fifth dimension is NOT EVIDENCED; resolving it "
                        "by reasoning about what it probably means would change the "
                        "methodology rather than document it. That is D-2, "
                        "INTENTIONALLY UNRESOLVED" % rel[:80])

    for key, relationship in mapped.items():
        if key not in code_keys:
            continue
        if "EXACT" in relationship.upper() and key != "basis_identification":
            findings.append("%s is now classified EXACT. Only basis_identification "
                            "is EXACT; the others are DECLARED, not UPGRADED, and a "
                            "declaration settles which key corresponds to which "
                            "condition rather than that the names mean the same "
                            "thing" % key)

    check("the methodology mapping tracks the executable vocabulary",
          not findings,
          "; ".join(findings) if findings
          else "%d engine keys, all mapped; cold_reviewer_clarity still UNRESOLVED; "
               "basis_identification the only EXACT row" % len(code_keys))


def check_a_privacy_promise_is_not_contradicted_by_an_export(offline):
    """Text collected under a promise of privacy has no public export path.

    WHY THIS GUARD EXISTS. B-017 / BD-14, found 2026-09-16 by the sweep that
    extended the engine_reviews allow-list to the other anonymously readable
    tables.

    finding.html tells every respondent, at the moment they type into the box:
    "Your response is recorded privately for the research program. It is not
    displayed publicly." It confirms on submit with "Recorded privately." The
    box accepts up to 4,000 characters of free text.

    research-data.html offered /rest/v1/finding_responses?select=* as a data-room
    export, and labelled it, on the page, "private discussion/debate responses" --
    describing data as private in the same row that published a link to it.

    supabase-ALL.sql grants `for select to anon using (true)` on the table, under
    a comment saying it was opened "for the data room", which contradicts the
    table's own earlier comment that "responses stay private". Both comments were
    in the same file.

    WHAT IT CHECKS, in three parts, because the promise and the plumbing can each
    drift independently:
      1. the promise is still on finding.html, in the form respondents are shown;
      2. no HTML page selects finding_responses at all, by any projection --
         narrowing it would not help, because `response` IS the sensitive column
         and the row exists to carry it;
      3. no page names the response column alongside the table.

    WHAT IT DOES NOT CHECK, and cannot from here: whether the anon SELECT grant
    has actually been revoked in the database. That is a PRODUCTION operation
    queued behind B-001. This guard closes the repository half only, and B-017
    stays open until production evidence exists.
    """
    findings = []

    PROMISE = "it is not displayed publicly"
    fh = read("finding.html")
    if not fh:
        findings.append("finding.html is missing; the promise this guard protects "
                        "cannot be located")
    elif PROMISE not in fh.lower():
        findings.append("finding.html no longer tells respondents their text is not "
                        "displayed publicly. If the promise was withdrawn that is a "
                        "decision with a record; if it was edited away, the export "
                        "ban below is now protecting nothing and should be re-read "
                        "rather than quietly relaxed")

    # READ PATHS ONLY. The first version of this check banned every mention of
    # the table and immediately failed on finding.html, which is the INSERT path:
    # the submit box POSTs the response there. Banning the write would ban the
    # feature. What must not exist is a READ.
    # STRIP COMMENTARY BEFORE SCANNING. The narrowed version of this check fired
    # on research-data.html, where the row HAD been removed -- it was matching the
    # BD-14 comment that quotes the path it removed, in order to explain why. That
    # is the seventh substring-versus-structure miss recorded on this project, and
    # this one was self-inflicted by documenting the fix. Guards read code, not
    # the prose about the code.
    def _strip_commentary(text):
        text = re.sub(r"<!--.*?-->", "", text, flags=re.S)
        text = re.sub(r"^\s*//[^\n]*$", "", text, flags=re.M)
        return text

    for rel in _html_files():
        body = _strip_commentary(read(rel))
        for m in re.finditer(r"finding_responses\?select=([^'\"&\s]*)", body):
            findings.append("%s selects %r from finding_responses. Responses are "
                            "collected under an explicit promise that they are not "
                            "displayed publicly, so the table has no public "
                            "projection at all, not a narrower one"
                            % (rel, m.group(1) or "(empty)"))
        # A read can also be spelled without ?select=. Catch a GET by shape.
        for m in re.finditer(r"finding_responses[^\n]{0,200}", body):
            seg = m.group(0)
            if "method:'POST'" in seg.replace(" ", "") or 'method:"POST"' in seg.replace(" ", ""):
                continue
            if "?select=" in seg:
                continue  # already reported above
            if re.search(r"\bfetch\s*\(", seg) or "rest/v1/finding_responses" in seg:
                if "POST" not in seg:
                    findings.append("%s reaches rest/v1/finding_responses without an "
                                    "explicit POST; a read of this table contradicts "
                                    "the promise made at collection" % rel)

    check("a privacy promise is not contradicted by an export",
          not findings,
          "; ".join(findings) if findings
          else "finding.html still carries the promise; no page exports "
               "finding_responses. The anon SELECT grant remains a production "
               "matter under B-017")


def check_manifest_truncation_limit_matches_the_engine(offline):
    """The manifest's truncation cap is the same number the engine truncates at.

    WHY THIS GUARD EXISTS. Found 2026-09-16 by the guard-integrity sweep, in the
    W3 class: a literal asserted in one place that silently must track a value
    declared somewhere else.

    lib/manifest/hash.js declares ENGINE_TRUNCATION_LIMIT = 8000 and computes
    input.length_chars and input.truncated against it. api/v1/review-engine.js
    and api/review-engine.js each carry a BARE 8000 in
    `if (text.length > 8000) text = text.slice(0, 8000)`. Three independent
    declarations of one number, with nothing tying them together.

    WHAT GOES WRONG IF THEY DIVERGE, and it is the worst failure this artifact
    has. Drop the engine cap to 6000 and leave the manifest at 8000: a 7,000
    character record is truncated to 6,000 by the engine, while the manifest
    computes length_chars = 7000 and truncated = FALSE, and omits source_hash.
    The manifest would then assert that the evaluation covered 1,000 characters
    the model never received. hash.js says so itself at the top of the file:
    "A manifest that hid truncation would claim the evaluation covered material
    the model never received." That is exactly what this divergence produces.

    WHY THE NUMBER IS DUPLICATED AT ALL, recorded so the duplication is not
    mistaken for an oversight. The engine routes are Vercel Edge Functions and
    lib/ is excluded by .vercelignore, deliberately, because the manifest
    implementation is protected and must not be deployable. Importing the
    constant into the routes would require deploying lib/ and would undo that
    exclusion. Duplication plus a guard is the correct trade here; a shared
    import is not available without giving up the public/private boundary.

    WHAT IT CHECKS. The constant in hash.js, and every truncation literal in
    both engine routes, are the same integer. Read structurally from the slice
    expression rather than by counting occurrences of "8000", so renaming or
    reformatting does not defeat it and so a second, different cap cannot hide.
    """
    findings = []

    h = read("lib/manifest/hash.js")
    m = re.search(r"ENGINE_TRUNCATION_LIMIT\s*=\s*(\d+)", h)
    if not m:
        check("manifest truncation limit matches the engine", False,
              "lib/manifest/hash.js no longer declares ENGINE_TRUNCATION_LIMIT; "
              "the manifest's truncation accounting has lost its anchor")
        return
    manifest_limit = int(m.group(1))

    seen = {}
    for rel in ("api/v1/review-engine.js", "api/review-engine.js"):
        src = read(rel)
        if not src:
            findings.append("%s is missing" % rel)
            continue
        # STRUCTURE: the guard is the slice expression, not the digits.
        caps = re.findall(
            r"text\.length\s*>\s*(\d+)\s*\)\s*text\s*=\s*text\.slice\(\s*0\s*,\s*(\d+)\s*\)",
            src)
        if not caps:
            findings.append("%s no longer truncates with the expected "
                            "`if (text.length > N) text = text.slice(0, N)` shape; "
                            "the manifest cannot be proven to match a cap that "
                            "cannot be located" % rel)
            continue
        for a, b in caps:
            if a != b:
                findings.append("%s compares against %s but slices at %s; a record "
                                "between the two is truncated by a different amount "
                                "than the comparison implies" % (rel, a, b))
            seen.setdefault(rel, set()).add(int(b))

    for rel, caps in seen.items():
        if len(caps) > 1:
            findings.append("%s declares more than one truncation cap %r; the "
                            "manifest can only match one of them" % (rel, sorted(caps)))
        for c in caps:
            if c != manifest_limit:
                findings.append(
                    "%s truncates at %d while lib/manifest/hash.js declares "
                    "ENGINE_TRUNCATION_LIMIT = %d. A record between the two is "
                    "truncated by the engine while the manifest records "
                    "truncated=false and omits source_hash, asserting that the "
                    "evaluation covered text the model never received"
                    % (rel, c, manifest_limit))

    check("manifest truncation limit matches the engine",
          not findings,
          "; ".join(findings) if findings
          else "hash.js declares %d and both engine routes truncate at %d, read "
               "from the slice expression rather than by digit count"
               % (manifest_limit, manifest_limit))


def check_manifest_library_holds_its_refusals(offline):
    """The Manifest builder still REFUSES the things it must refuse.

    WHY THIS GUARD EXISTS. The manifest library's value is not what it emits,
    it is what it declines to emit. Three refusals carry the weight:

      - relabelling engine keys as Codebook conditions, which would resolve D-2
        and D-3 in code rather than by owner declaration;
      - translating between the two routing vocabularies, which would invent a
        correspondence the API reconciliation says is undecided;
      - declaring a manifest record-free while per-condition notes, which are
        model output derived from the record, are present.

    A future edit that relaxed any of them would leave the tests passing and the
    artifact lying, so this runs the real suite rather than reading the source.

    It also asserts the canonicalization is still labelled as DEVELOPMENT
    canonicalization. Renaming it to JCS/RFC8785 without verifying against the
    RFC's test vectors would be a compliance claim resting on nothing.
    """
    findings = []
    runner = os.path.join(ROOT, "tests", "manifest", "run.mjs")
    if not os.path.exists(runner):
        check("manifest library holds its refusals", False,
              "tests/manifest/run.mjs is missing")
        return
    try:
        p = subprocess.run(["node", runner], cwd=ROOT, capture_output=True,
                           text=True, timeout=120)
    except FileNotFoundError:
        check("manifest library holds its refusals", SKIPPED, "node not available")
        return
    except Exception as e:
        check("manifest library holds its refusals", False, "runner failed: %r" % (e,))
        return

    out = (p.stdout or "") + (p.stderr or "")
    if p.returncode != 0:
        bad = [l for l in out.splitlines() if l.startswith("FAIL")]
        findings.append("manifest suite failed: " + ("; ".join(bad) if bad else out[-200:]))

    # The three refusals must be present as named, passing cases.
    # F-13, 2026-09-16: the oracle must be independent of the generator. The
    # harness used to write its own fixtures and then validate them, so a
    # generator regression could not fail the suite. These two cases prove the
    # comparison exists AND that it is capable of failing.
    for needle in ("F6 relabeling to Codebook without a declared mapping THROWS",
                   "RT silent routing conversion refused",
                   "RT forged no_record_content with notes is REJECTED",
                   "ORACLE 02-derived.manifest.json matches the frozen canonical fixture",
                   "ORACLE detects a generator regression"):
        if ("PASS  " + needle) not in out:
            findings.append("the suite no longer proves: %s" % needle)

    # The harness must never write into the oracle directory.
    harness = read("tests/manifest/run.mjs")
    if "./fixtures/canonical/" in harness and "writeFileSync" in harness:
        for line in harness.splitlines():
            if "writeFileSync" in line and "canonical" in line:
                findings.append("tests/manifest/run.mjs writes into the canonical "
                                "oracle directory; the oracle must be read-only")
    canon = read("lib/manifest/canonicalize.js")
    if "jrs-dev-canon-1" not in canon:
        findings.append("the development canonicalization identifier is gone")
    # PROXIMITY AND POLARITY, NOT PAGE-WIDE CONTAINMENT. Corrected 2026-09-16 by
    # the guard-integrity sweep, after a directed mutation PASSED: appending
    # "This implementation is RFC 8785 compliant." to the bottom of the file left
    # the existing disclaimer at line 5 intact, so the page-wide "NOT described
    # as" test was still satisfied and the guard reported all three refusals
    # proven. Third instance of the proximity class on this project.
    #
    # Now: every occurrence of the RFC must carry a negation NEAR IT, and the
    # affirmative phrasings are banned outright regardless of what else the file
    # says. A disclaimer somewhere in a file does not neutralise a claim
    # elsewhere in it.
    for m in re.finditer(r"RFC\s*8785|\bJCS\b", canon):
        window = canon[max(0, m.start() - 400):m.end() + 400]
        if not re.search(r"\bNOT\b|\bnot\b|deliberately|has not been verified", window):
            findings.append("canonicalize.js mentions the RFC at offset %d with no "
                            "negation within 400 characters; a disclaimer elsewhere "
                            "in the file does not qualify this mention" % m.start())
    for phrase in ("is rfc 8785 compliant", "rfc 8785 compliant",
                   "jcs compliant", "fully compliant with rfc 8785",
                   "conforms to rfc 8785", "implements rfc 8785"):
        idx = canon.lower().find(phrase)
        if idx == -1:
            continue
        lead = canon.lower()[max(0, idx - 60):idx]
        if not re.search(r"\bnot\b|never|deliberately", lead):
            findings.append("canonicalize.js asserts %r; the identifier is "
                            "jrs-dev-canon-1 and compliance has not been verified "
                            "against the RFC's test vectors" % phrase)

    total = ""
    for line in out.splitlines():
        if "checks," in line and "failed" in line:
            total = line.strip()
    check("manifest library holds its refusals",
          not findings,
          "; ".join(findings) if findings
          else "%s; all three refusals proven" % (total or "suite passed"))


def check_manifest_schema_keeps_its_safeguards(offline):
    """The Manifest schema keeps the three declarations that stop it lying.

    WHY THIS GUARD EXISTS. The Decision Reconstruction Manifest is the artifact a
    later reviewer would rely on, so its failure mode is not a crash, it is a
    confident wrong answer. Three fields carry that weight:

      condition_vocabulary  Three of the five Codebook-to-engine condition
                            mappings are UNRESOLVED. A manifest that dropped
                            this field would let engine keys be read as Codebook
                            conditions, silently resolving a question the owner
                            has not answered.
      routing.vocabulary    Two record-level vocabularies exist, Ready/Needs
                            work/Gap and ready/review_required/gap_identified.
                            Without the declaration a reader guesses.
      content_class         A manifest is described as not containing the
                            record. Per-condition notes are model output derived
                            from it and can paraphrase it. This field is where
                            that is admitted.

    It also checks that additionalProperties stays false at the root, which is
    what stops a raw record or a "legally_sufficient" field being added later,
    and that human_review is required, because defaulting to no human review
    would assert what the research does not support.
    """
    rel = "schemas/jrs-decision-reconstruction-manifest.schema.json"
    findings = []
    try:
        schema = json.loads(read(rel))
    except Exception as e:
        check("manifest schema keeps its safeguards", False,
              "%s is missing or unparseable: %r" % (rel, e))
        return

    required = schema.get("required", [])
    for field in ("condition_vocabulary", "content_class", "human_review",
                  "integrity", "conditions", "routing"):
        if field not in required:
            findings.append("%r is no longer required at the root" % field)

    if schema.get("additionalProperties") is not False:
        findings.append("root additionalProperties is not false, so a raw record or a "
                        "legal-sufficiency field could be added without failing validation")

    props = schema.get("properties", {})
    cv = props.get("condition_vocabulary", {}).get("enum", [])
    if "review_engine_keys" not in cv:
        findings.append("condition_vocabulary can no longer express review_engine_keys, "
                        "which is the value a generator must use while the mapping is "
                        "UNRESOLVED")
    rv = props.get("routing", {}).get("properties", {}).get("vocabulary", {}).get("enum", [])
    if len(rv) < 2:
        findings.append("routing.vocabulary no longer distinguishes the two record-level "
                        "vocabularies")
    if "vocabulary" not in props.get("routing", {}).get("required", []):
        findings.append("routing no longer requires its vocabulary")

    conds = props.get("conditions", {})
    if conds.get("minProperties") != 5 or conds.get("maxProperties") != 5:
        findings.append("conditions no longer pins exactly five entries")

    check("manifest schema keeps its safeguards",
          not findings,
          "; ".join(findings) if findings
          else "root sealed, 6 required fields present, both vocabulary declarations "
               "intact, conditions pinned at five")


def check_data_handling_claims_match_the_implementation(offline):
    """No public page claims a data-handling property the engine contradicts.

    WHY THIS GUARD EXISTS. A claims sweep on 2026-09-15 across all 75 deployed
    pages found the accurate description of this system's data handling sitting
    on privacy.html, and an overstated one on every surface a buyer, a
    procurement reviewer or a security reviewer is actually routed to:
    security.html, enterprise.html, review-engine.html, terms.html,
    engagement.html, the three request pages, index.html and training.html.

    The three propositions below were each published and each false:
      1. "the record never leaves your control" / "transmits nothing".
         Record text is POSTed to api.anthropic.com. check.html additionally
         loads GA4 and Google Fonts and beacons a page view to Supabase.
      2. "there is no record store to breach" / "zero data retention at rest".
         logReview() in both engine routes writes engine_reviews rows holding a
         per-condition note the prompt requires to be grounded in the record
         text, and finding.compliant_version, a model rewrite of the passage.
      3. "no data-residency obligation transfers to us". A legal conclusion
         (Rule 8), resting on proposition 1.

    WHAT IT CHECKS. The banned formulations are absent from every deployed page,
    and the two code facts that make them false are still true. If logReview
    were removed, proposition 2 would become sayable again and this guard should
    be revisited deliberately rather than silently satisfied.
    """
    findings = []

    BANNED = [
        ("never leaves your control", "record text is POSTed to a third-party model provider"),
        ("transmits nothing", "the page loads GA4 and Google Fonts and beacons a view"),
        ("no record store to breach", "engine_reviews holds record-derived model output"),
        ("zero data retention at rest", "engine_reviews holds record-derived model output"),
        ("no data-residency obligation", "a legal conclusion resting on a false premise"),
        ("data isolation guarantee", "banned claim vocabulary, and it was unscoped"),
        ("no intake page has a form of any kind", "forms exist on at least eight pages"),
    ]
    for rel in _html_files():
        low = read(rel).lower()
        for phrase, why in BANNED:
            if phrase in low:
                findings.append("%s republishes %r (%s)" % (rel, phrase, why))

    # The code facts the corrected wording depends on.
    eng = read("api/review-engine.js")
    # Word-boundary, not containment. A mutation test renaming logReview to
    # logReviewOFF passed a substring check on 2026-09-15, which is the whole
    # failure mode this guard exists to catch.
    if not re.search(r"\blogReview\s*\(", eng):
        findings.append("api/review-engine.js no longer calls logReview; the corrected "
                        "retention wording describes storage that may no longer happen, "
                        "so revisit the claims rather than leaving them")
    if not re.search(r"\bcompliant_version\b", eng):
        findings.append("compliant_version is gone from api/review-engine.js; the "
                        "public wording about a suggested rewrite needs rechecking")
    rev = read("api/review.js")
    if "supabase" in rev.lower():
        findings.append("api/review.js now touches Supabase; the public statement that "
                        "the free route stores nothing is no longer safe")

    check("data-handling claims match the implementation",
          not findings,
          "; ".join(findings) if findings
          else "%d pages carry none of the %d retired formulations; logReview and "
               "compliant_version still present; api/review.js still storage-free"
               % (len(_html_files()), len(BANNED)))



def check_published_api_contract_matches_the_write_path(offline):
    """A published OpenAPI contract never denies a write path the code contains.

    WHY THIS GUARD EXISTS. B-016, found 2026-09-16 while establishing whether
    JRS is licensed to anyone (V-9 Fact A), NOT by the claims sweep that was run
    to catch exactly this. openapi.json is served on production and describes one
    path, /api/v1/review-engine. Its info.summary called that endpoint
    "Stateless" and its info.description said "The call is stateless" and "no
    data-residency or retention obligation transfers to the operator of this
    API". api/v1/review-engine.js:272 calls logReview() on every authenticated
    request, writing a row to engine_reviews that carries a per-condition note
    grounded in the record text and a model rewrite of the passage.

    WHY THE 2026-09-15 SWEEP MISSED IT, twice over, either miss sufficient alone:
      1. check_data_handling_claims_match_the_implementation bans the substring
         "no data-residency obligation". The contract reads "no data-residency
         OR RETENTION obligation". Two inserted words defeated containment. This
         is the fifth recorded substring-versus-negation-or-structure miss on
         this project, so this guard matches on CONCEPT, via independent
         patterns, and never on one hand-copied phrase.
      2. That sweep iterates _html_files(). The contract is JSON. It was never
         read at all.

    WHAT IT CHECKS. For every openapi*.json at the repository root: if the code
    still contains a logReview call site, the contract must not assert
    statelessness or a no-write/no-retention property. One occurrence is KNOWN
    and REGISTERED below against B-016, because openapi.json is the published
    API contract and this repository's standing instruction is that it is not to
    be altered without authorization; Section 16 makes a contract conflict a stop
    condition. The exception is pinned to the exact bytes of the offending
    strings.

    THIS GUARD IS DESIGNED TO GO RED WHEN B-016 IS FIXED. The pin is a hash of
    the current wording. Correcting the contract changes the hash, the exception
    stops applying, and the guard fails until someone comes back and retires it
    deliberately. That is the intent: a registered defect must not be able to
    disappear quietly, in either direction.
    """
    import hashlib as _hashlib

    findings = []

    # Concept patterns, not one phrase. Each is independently sufficient.
    CLAIM_PATTERNS = [
        (r"\bstateless\b", "asserts statelessness"),
        (r"not\s+written\s+to\s+any\s+table", "asserts nothing is written to any table"),
        (r"no\s+data.residency", "asserts no data-residency obligation"),
        (r"\bno\b[^.]{0,60}\bretention\s+obligation", "asserts no retention obligation"),
        (r"\bnot\s+persisted\b", "asserts nothing is persisted"),
        (r"\bzero\s+retention\b", "asserts zero retention"),
    ]

    # B-016. The one occurrence that is known, recorded and blocked on
    # authorization. Pinned by sha256 of the exact string, so a reworded claim
    # is NOT covered and a second file is NOT covered.
    REGISTERED_B016 = {
        "40e5f23a9ceaa74cccb4d93e0535364fda4dd5c56f7c48ef448253dd1eeba798": "openapi.json info.summary",
        "3f1263f0b905f68ccb9f15b3f1846e8bb4c097e1f6a1ff40cc1652bc37fcf2aa": "openapi.json info.description",
    }

    # The code fact that makes the claims false. Word-boundary on a CALL SITE,
    # not on the definition: logReview is defined in both engine files and a
    # definition alone writes nothing.
    v1 = read("api/v1/review-engine.js")
    writes = bool(re.search(r"await\s+logReview\s*\(", v1))

    specs = sorted(g for g in os.listdir(ROOT)
                   if g.startswith("openapi") and g.endswith(".json"))
    if not specs:
        findings.append("no openapi*.json found at the repository root; this guard "
                        "was written against a published contract and is now blind")

    registered_hits = 0
    for name in specs:
        try:
            spec = json.loads(read(name))
        except Exception as e:
            findings.append("%s is not parseable JSON (%r); a published contract "
                            "that cannot be read cannot be checked" % (name, e))
            continue
        info = spec.get("info", {}) or {}
        for field in ("summary", "description", "title"):
            text = info.get(field)
            if not isinstance(text, str) or not text:
                continue
            h = _hashlib.sha256(text.encode("utf-8")).hexdigest()
            for pat, why in CLAIM_PATTERNS:
                if re.search(pat, text, re.I):
                    where = "%s info.%s" % (name, field)
                    if h in REGISTERED_B016 and REGISTERED_B016[h] == where:
                        registered_hits += 1
                        break
                    findings.append(
                        "%s %s, and api/v1/review-engine.js %s logReview(). "
                        "Either the contract is wrong or the code changed; this is "
                        "not a registered B-016 occurrence, so it is new"
                        % (where, why, "still calls" if writes else "no longer calls"))
                    break

    # If the code stopped writing, the claims would become sayable and B-016
    # would dissolve. That must be noticed, not silently inherited.
    if not writes:
        findings.append("api/v1/review-engine.js no longer awaits logReview(); the "
                        "statelessness claims in the published contract may now be "
                        "true, so B-016 must be re-read rather than left open")

    if registered_hits and not findings:
        check("published API contract matches the write path",
              True,
              "%d spec(s) read; %d registered B-016 occurrence(s) in openapi.json, "
              "pinned by content hash and blocked on authorization to correct the "
              "published contract; no new occurrence; logReview call site intact"
              % (len(specs), registered_hits))
        return

    check("published API contract matches the write path",
          not findings,
          "; ".join(findings) if findings
          else "%d spec(s) read; no statelessness or no-retention claim in any "
               "published contract" % (len(specs),))


def check_every_active_processor_is_disclosed(offline):
    """Every external destination that can receive data is named on privacy.html.

    WHY THIS GUARD EXISTS. B-009. The register recorded four subprocessors and
    inspection found eight destinations. The quietest was Google Fonts, which
    discloses a visitor's IP to Google on page load, on nearly every page,
    INDEPENDENTLY of any analytics cookie choice. A reader who blocked Google
    Analytics and believed that stopped Google receiving data was wrong, and
    privacy.html did not tell them.

    WHY THIS VERSION EXISTS. The first version of this guard was red-teamed on
    2026-09-15 and FAILED five ways, each recorded here so it is not rebuilt
    the same way:
      1. Every test was a bare substring over the whole file, so a page saying
         "We do NOT use Vercel, Supabase, Anthropic..." passed.
      2. Vercel was not in the map at all, because Vercel has no host string in
         api/. The processor that sees every request was entirely unguarded.
      3. The front-end scan used os.listdir(ROOT) and a hardcoded three-host
         list, so it missed the 20 pages under reference/ and reviewer/ AND any
         new client-side host. _html_files() already existed 5,000 lines above
         to fix exactly that, with its own post-mortem attached.
      4. Dormancy was asserted against a COMMENT. Setting ALERTS_ENABLED = true
         while leaving the prose intact passed.
      5. api.jrsstandard.com was classified "no disclosure needed" on the
         grounds that it appears "as a URL in content, not as a POST target".
         It is a POST target in three pages, carrying visitor free text.

    WHAT IT CHECKS NOW
      1. Outbound hosts are read from api/ AND from every page via _html_files(),
         so a new client-side destination is caught wherever it is added.
      2. Any host not classified here fails. Silence is the thing to catch.
      3. Named processors must appear inside the disclosure SECTION, not merely
         somewhere in the file, and the section must not be phrased as a denial.
      4. Dormancy is asserted against the CODE: ALERTS_ENABLED = false, and the
         nightly study's STUDIES_CLOSED flag. If either flips, a service moves
         from "not running" to running and the disclosure becomes false.
      5. The Google Fonts caveat states the part that is easy to omit.
    """
    findings = []

    KNOWN = {
        "pjzxkeviouofdseagvpf.supabase.co": "Supabase",
        "api.anthropic.com": "Anthropic",
        "api.openai.com": "OpenAI",
        "generativelanguage.googleapis.com": "Generative Language",
        "fonts.googleapis.com": "Google Fonts",
        "fonts.gstatic.com": "Google Fonts",
        "www.googletagmanager.com": "Google Analytics 4",
        "formspree.io": "Formspree",
        "api.resend.com": "Resend",
        "resend.com": "Resend",
        "api.sendgrid.com": "SendGrid",
        "sendgrid.com": "SendGrid",
        # A POST target carrying visitor free text from three pages. It is not
        # implemented in this repository, so who operates it is NOT ESTABLISHED.
        # It is disclosed rather than waved through as "our own domain".
        "api.jrsstandard.com": "api.jrsstandard.com",
        # Own origin and citation targets: URLs in content, never fetched.
        "www.jrsstandard.com": None,
        "jrsstandard.com": None,
        "law.justia.com": None,
        "docsopengovernment.dos.ny.gov": None,
        "www.nycourts.gov": None,
        "www.osc.ny.gov": None,
        "www.linkedin.com": None,
        "schema.org": None,
    }

    # Processors with no host string of their own. Vercel is the reason this
    # list exists: it serves every request and appears in no URL.
    HOSTLESS = ["Vercel"]

    policy = read("privacy.html")

    # The disclosure section, isolated. Containment over the whole file is what
    # let a denial pass, so every name test below runs against this slice only.
    sec_start = policy.find("The service providers we use")
    sec_end = policy.find("Registry members are listed by name", sec_start + 1)
    if sec_start == -1 or sec_end == -1 or sec_end <= sec_start:
        findings.append("the service-provider disclosure section is not present on "
                        "privacy.html in the expected position")
        section = ""
    else:
        section = policy[sec_start:sec_end]

    # A denial satisfies containment. Catch the shape, not just the names.
    for phrase in ("we do not use", "we don't use", "no service providers",
                   "we use none"):
        if phrase in section.lower():
            findings.append("the disclosure section contains %r, which would satisfy a "
                            "name check while telling the reader the opposite" % phrase)

    # 1 and 2. Hosts actually referenced, from BOTH layers.
    seen = {}
    api_dir = os.path.join(ROOT, "api")
    for dirpath, _dirs, files in os.walk(api_dir):
        for fn in sorted(files):
            if not fn.endswith(".js"):
                continue
            rel = os.path.relpath(os.path.join(dirpath, fn), ROOT)
            for host in re.findall(r"https://([A-Za-z0-9._-]+)", read(rel)):
                seen.setdefault(host, rel)
    for rel in _html_files():
        for host in re.findall(r"https://([A-Za-z0-9._-]+)", read(rel)):
            seen.setdefault(host, rel)

    for host in sorted(seen):
        if host not in KNOWN:
            findings.append("%s references %r, which is not classified in this guard "
                            "and may be undisclosed" % (seen[host], host))
            continue
        name = KNOWN[host]
        if name and name not in section:
            findings.append("%s (%s, seen in %s) is not named in the disclosure section"
                            % (name, host, seen[host]))

    for name in HOSTLESS:
        if name not in section:
            findings.append("%s has no host string to detect and must be named "
                            "explicitly; it is not in the disclosure section" % name)

    # 4. Dormancy asserted against code, not prose.
    notify = read("api/_notify.js")
    if not re.search(r"const\s+ALERTS_ENABLED\s*=\s*false", notify):
        findings.append("api/_notify.js no longer sets ALERTS_ENABLED = false, so the "
                        "Resend and SendGrid 'not running' disclosure is false")
    status = read("api/_study-status.js")
    if not re.search(r"STUDIES_CLOSED\s*=\s*true", status):
        findings.append("STUDIES_CLOSED is no longer true, so the OpenAI and Generative "
                        "Language 'not running' disclosure is false")
    for name in ("Resend", "SendGrid", "OpenAI", "Generative Language"):
        if name not in section:
            findings.append("%s is not named in the disclosure section as not running"
                            % name)

    # 5. The Fonts caveat has to say the part people get wrong.
    low = section.lower()
    if "google fonts" not in low:
        findings.append("the disclosure section does not name Google Fonts")
    elif not ("blocking google analytics does not" in low
              or "does not prevent it" in low):
        findings.append("the section names Google Fonts but does not state that opting "
                        "out of analytics does not stop it")

    check("every active processor is disclosed",
          not findings,
          "; ".join(findings) if findings
          else "%d hosts across api/ and %d pages, all classified; hostless "
               "processors, dormancy flags and the Fonts caveat all asserted"
               % (len(seen), len(_html_files())))


def check_pages_that_render_engine_output_disclose_validation_status(offline):
    """Any page that renders Review Engine output states the engine's validation status.

    WHY THIS GUARD EXISTS. B-008 was first written as "the engine lacks a
    validation declaration". Investigation on 2026-09-15 narrowed it to
    something smaller and more exact: review-engine.html already says
    "unvalidated, single-model engine in operational validation" and index.html
    carries the same disclosure three times, while training.html POSTed record
    text to /api/review and rendered routing, condition results, flags and
    revisions to a learner with ZERO validation statement anywhere on the page.
    It carried legal disclaimers, which are a different proposition: "this is
    not legal advice" does not tell a reader that the engine producing the
    output has never been empirically validated.

    A learner reading a routing determination is the reader most likely to
    mistake an implemented system for a validated one, so the page that teaches
    is the page where the omission costs most.

    WHAT IT CHECKS. For every page that calls /api/review, all four required
    propositions appear in the served text:
      1. the engine is operationally implemented,
      2. it is empirically unvalidated,
      3. reproducibility is not equivalent to accuracy,
      4. the output does not replace human judgment.

    WHAT IT DELIBERATELY DOES NOT CHECK. An earlier draft also banned the
    overclaim vocabulary ("legally defensible", "legally sufficient",
    "court-admissible") as substrings. That test was removed because it was
    demonstrably wrong: index.html uses two of those exact phrases inside
    NEGATING disclaimers, "Does not determine whether an employment decision
    was substantively correct, legally defensible, or consistent with policy".
    A substring cannot distinguish a claim from its denial, so the test flagged
    the very sentences doing the right thing. A check that fires on correct
    prose trains people to ignore it. Vocabulary is left to review.
    """
    findings = []
    pages = []
    for name in sorted(os.listdir(ROOT)):
        if not name.endswith(".html"):
            continue
        body = read(name)
        if "/api/review'" in body or '/api/review"' in body:
            pages.append((name, body))

    if not pages:
        findings.append("no page calls /api/review; the guard has lost its subject")

    REQUIRED = [
        ("operationally implemented", ["operationally implemented"]),
        ("empirically unvalidated", ["empirically unvalidated", "unvalidated"]),
        ("reproducibility is not accuracy",
         ["reproducibility is not equivalent to accuracy",
          "reproducibility is not accuracy"]),
        ("does not replace human judgment",
         ["does not replace human judgment", "reviewer judgment remains required",
          "do not replace organizational judgment"]),
    ]
    for name, body in pages:
        low = body.lower()
        for label, forms in REQUIRED:
            if not any(f in low for f in forms):
                findings.append("%s renders engine output without stating: %s" % (name, label))
    check("pages rendering engine output disclose validation status",
          not findings,
          "; ".join(findings) if findings
          else "%d page(s) calling /api/review, all 4 propositions present on each"
               % len(pages))


def check_the_check_page_never_transmits_an_answer(offline):
    """check.html may measure that it was opened. It may never transmit an answer.

    WHY THIS GUARD EXISTS. The page tells the reader, in visible text, that
    "Your assessment answers stay entirely in your browser. They are never sent,
    stored, or seen by anyone." On 2026-09-13 a check-view beacon was added so
    the diagnostic funnel could be measured at all. The beacon and the promise
    can coexist only while the beacon carries nothing derived from the boxes,
    and nothing in the code says so on its own: a later edit that adds a count
    to the payload would silently make a published privacy sentence false.

    This is not a style rule. It is the mechanical enforcement of a statement
    the site publishes to people deciding whether to open privileged files.

    WHAT IT CHECKS
      1. The promise sentence is still on the page. If someone deletes the
         promise the guard must not quietly pass; the wording is the thing being
         protected and its removal is itself the event to catch.
      2. The check-view emitter exists and posts to /api/telemetry.
      3. The emitter block references NO answer-derived identifier: not '.sa',
         not 'checked', not 'hit', not 'boxes', not 'sa-out'.
      4. The telemetry endpoint still gates view events behind an allow-list
         rather than writing an arbitrary meta.event.
    """
    page = read("check.html")
    findings = []

    promise = "They are never sent, stored, or seen by anyone."
    if promise not in page:
        findings.append("the published promise sentence is gone from check.html")

    start = page.find("CHECK-VIEW TELEMETRY")
    if start == -1:
        findings.append("check-view emitter not found")
        block = ""
    else:
        end = page.find("</script>", start)
        block = page[start:end if end != -1 else len(page)]
        if "/api/telemetry" not in block:
            findings.append("check-view emitter does not post to /api/telemetry")
        # Scan the CODE, not the prose. The block opens with a comment that
        # names the very tokens this guard bans, because it explains what the
        # emitter deliberately does not do. Scanning that text flags the
        # explanation instead of a defect, so the comment is dropped first.
        #
        # The marker searched for above sits INSIDE that opening comment, so
        # there is no leading "/*" left to match and a naive comment-strip
        # regex removes nothing. Cut from the comment's terminator instead.
        term = block.find("*/")
        if term != -1:
            block = block[term + 2:]
        block = re.sub(r"(?m)//.*$", " ", block)

    BANNED = [".sa", "checked", "hit.length", "boxes", "sa-out", "data-mode"]
    for token in BANNED:
        if token in block:
            findings.append("answer-derived token %r inside the check-view emitter" % token)

    api = read("api/telemetry.js")
    if "VIEW_EVENTS" not in api:
        findings.append("api/telemetry.js no longer gates view events behind an allow-list")
    elif "VIEW_EVENTS.indexOf(evt)" not in api:
        findings.append("api/telemetry.js defines VIEW_EVENTS but does not test membership")

    check("the check page never transmits an answer",
          not findings,
          "; ".join(findings) if findings
          else "promise intact, emitter present, 0 answer-derived tokens, endpoint allow-listed")


def check_reliability_raters_are_not_demoted(offline):
    """No packet artefact calls a study participant a "regular reviewer".

    THIS DEFECT WAS CORRECTED FOUR TIMES AND CAME BACK FOUR TIMES, and the
    reason is the whole point of this guard. The corrections were applied to
    the .docx that had been downloaded and handed back in chat. The SOURCE is
    research/aie_submission_2026-09-01/01_Blinded_Manuscript.md, from which the
    .docx and .pdf are generated. The source was never touched, so every
    regeneration restored the wording, and the owner reasonably concluded the
    fix was not being made at all.

    WHY A NUMBERS AUDIT COULD NOT CATCH IT. R- and RR- are different code sets.
    The 17 R- raters are the open-enrolment bench raters in the reliability
    study; the 20 RR- are the Arm B comparison completers, every one a
    credentialed expert. The phrase described the R- group, so 8 + 17 = 25
    reconciled on every arithmetic check, while any reader who knows RR- means
    Arm B read it as those experts being demoted.

    The split is a recruitment route, which the manuscript already said in
    terms: "the split records the recruitment channel and is not a measure of
    professional expertise". The labels now say so too: Invited, Open
    enrolment.

    This scans EVERY artefact in the packet, source and generated alike, so a
    fix to one and not the other fails here rather than in the owner's inbox.
    """
    import glob, zipfile
    d = os.path.join(ROOT, "research", "aie_submission_2026-09-01")
    if not os.path.isdir(d):
        return check("reliability raters are not demoted", SKIPPED,
                     "research/ is not on this branch by design")
    bad, seen = [], 0
    for path in sorted(glob.glob(os.path.join(d, "*"))):
        name = os.path.basename(path)
        if name.endswith((".md", ".html")):
            text = io.open(path, encoding="utf-8", errors="replace").read()
        elif name.endswith(".docx"):
            try:
                text = zipfile.ZipFile(path).read("word/document.xml").decode("utf-8")
            except Exception:
                continue
        elif name.endswith(".pdf"):
            continue          # covered by the .md it is generated from
        else:
            continue
        seen += 1
        for term in ("regular reviewer", "Regular reviewer", "regular-reviewer",
                     "invited experts whose credentials",
                     "without identity verification"):
            if term in text:
                bad.append("%s: %r" % (name, term))
    check("reliability raters are not demoted", not bad,
          "; ".join(bad[:5]) if bad else
          "%d packet artefacts scanned, 0 demoting terms" % seen)


def _rendered_blocks(body):
    """Split an HTML body into rendered block runs.

    THE UNIT MATTERS MORE THAN THE PATTERN. Four guards in this suite have been
    defective because they used a fixed character window, which lets a
    qualifier in a NEIGHBOURING sentence excuse a claim it does not govern.
    Splitting at every tag is the opposite defect: line 127 of research.html
    carries "the same 15 records" outside a <b> and the range inside it, so a
    per-tag split would report the page clean while it asserts both.

    So the unit is the BLOCK. Inline tags (b, span, a, em, strong, i) stay
    inside the run because they do not end a sentence; block tags end it.
    """
    marked = re.sub(
        r"</?(?:div|p|li|td|tr|th|section|article|h[1-6]|br|ul|ol|table)\b[^>]*>",
        "\x00", body, flags=re.I)
    out = []
    for run in marked.split("\x00"):
        txt = re.sub(r"<[^>]+>", "", run)
        txt = txt.replace("&ndash;", "-").replace("&#39;", "'").replace("&amp;", "&")
        txt = re.sub(r"\s+", " ", txt).strip()
        if txt:
            out.append(txt)
    return out


def _names_the_full15_series(unit):
    """The full-15 series is present only if the block says what the figure IS.

    FOUND BY MUTATION, NOT BY READING. The first version of this guard accepted
    any block containing the bare string "82.2". Stripping "at the full
    15-record set" while leaving the number behind passed it, which is the
    substring-versus-meaning defect this suite has now hit nine times: a number
    is not a proposition. A reader needs the denominator, not the digits.
    """
    if "82.2" not in unit:
        return False
    return bool(re.search(r"\b15[\s-]+(?:constructed\s+)?records?\b|\b15-record\b",
                          unit, re.I))


def check_the_cross_vendor_range_carries_its_denominator(offline):
    """The 61-run range and the 15-record denominator belong to DIFFERENT series.

    PROVENANCE, established from the repository and not from a production read.
    `findings_history` and `study_runs` are different tables with different
    schemas. STUDY_001_FIGURE_RESOLUTION.md sources "61 recorded runs, 66.7 to
    93.3 percent, mean 85.3" from findings_history with no completeness filter.
    verify_manuscript_figures.py sources its series from study_runs behind three
    explicit filters -- mode == cross_vendor, EXACTLY 15 non-null per_record
    values, and created_at on or before the 2026-08-15 lock -- and gets 41 runs
    ranging 82.2 to 93.3. IP_COMMERCIALIZATION_AUDIT.md reports 37 runs over the
    same 82.2 to 93.3 range and says so explicitly: "on the 15-record set".

    So 37 and 41 are one series at two observation windows, and the 61-run
    figure is the SAME nightly study counted under a different denominator rule.
    verify_manuscript_figures.py already names it: its SUPERSEDED list carries
    ("66.7 to 93.3", "mixed-denominator cross-vendor range") and the matching
    ("84.5 percent", "mixed-denominator cross-vendor mean").

    THE DEFECT THIS CATCHES. research.html line 104 states both series and
    attaches "at the full 15-record set" to the 37-run one, which is correct.
    Five other places print the 61-run range and attach "15 records" to it, or
    print it with no denominator at all. A reader who checks -- and the reader
    who matters will -- finds the same page claiming the full-15 denominator
    yields 37 runs in one paragraph and 61 in the next.

    THE RULE IS NOT A FIGURE CHOICE. Neither number is preferred here. Any
    block that publishes the 61-run range must identify the full-15-record
    series alongside it, so the denominator travels with the figure. That is
    the E-037/E-038 precedent: scope the claim, never pick the number.

    SUPERSEDED at verify_manuscript_figures.py protects the MANUSCRIPT BODY
    only. Nothing covered the five public surfaces, and the buyer surface was
    among them.
    """
    LOW, HIGH, FULL15_LOW = "66.7", "93.3", "82.2"
    hits = []
    scanned = 0
    for rel in _html_files():
        body = read(rel)
        if not body:
            continue
        scanned += 1
        blocks = _rendered_blocks(body)
        page_has_full15 = any(_names_the_full15_series(b) for b in blocks)
        for unit in blocks:
            if LOW not in unit or HIGH not in unit:
                continue
            if _names_the_full15_series(unit):
                continue  # the full-15 series travels with it: correct
            # A BARE FIGURE IS A LABEL, NOT AN ASSERTION. The big accent value
            # in a stat card makes no denominator claim and cannot carry one;
            # its caption is the sibling block and that is where the scope
            # belongs. Requiring the denominator inside the headline would be
            # the mirror of the window defect -- strictness in the wrong unit.
            # A label still has to be backed SOMEWHERE on its own page, or a
            # page could publish the range and nothing else.
            stripped = re.sub(r"[0-9.,%\s\u2013-]+", "", unit)
            if len(stripped) < 3:
                if not page_has_full15:
                    hits.append("%s: headline range with the full-15-record "
                                "series absent from the whole page [%s]" % (rel, unit[:90]))
                continue
            claim = re.search(r"\b15[\s-]+(?:constructed\s+)?records?\b|\b15-record\b",
                              unit, re.I)
            hits.append("%s: %s [%s]" % (
                rel,
                "asserts the 15-record denominator on the 61-run range"
                if claim else "publishes the 61-run range with no denominator",
                unit[:90]))
    check("the cross-vendor range carries its own denominator", not hits,
          " | ".join(h.split(" [")[0] for h in hits[:6]) if hits
          else "%d pages scanned; every 66.7-93.3 block names the full-15-record series"
               % scanned)




def check_reliability_claim_semantics(offline):
    """E-038's separate reliability result must carry its population and limitation.

    The current coefficients are 0.739 invited and 0.623 open enrolment.  They
    come from a separate human-reviewer sample, not the detection panel and not
    the cross-vendor study.  Both point estimates exceed 0.61, but the
    pre-registered two-part criterion was NOT MET because neither analytic
    lower bound reaches 0.41.

    Public blocks that publish both coefficients must therefore avoid the old
    expert/trained labels and must carry either the criterion result or the
    lower-bound limitation in the same rendered block.
    """
    bad = []
    scanned = 0
    for rel in _html_files():
        body = read(rel)
        if not body:
            continue
        scanned += 1
        for unit in _rendered_blocks(body):
            if "0.739" not in unit or "0.623" not in unit:
                continue
            if re.search(r"\b(?:experts?|trained reviewers?)\b", unit, re.I):
                bad.append("%s: current AC1 pair carries superseded population labels [%s]" %
                           (rel, unit[:170]))
                continue
            limited = re.search(
                r"\b(?:criterion\s+(?:was\s+)?not\s+met|not\s+cleared|"
                r"lower\s+(?:confidence\s+)?bound|lower-bound|interim)\b",
                unit, re.I)
            if not limited:
                bad.append("%s: current AC1 pair lacks E-038 criterion limitation [%s]" %
                           (rel, unit[:170]))

    check("reliability claims preserve E-038 population and criterion status",
          not bad,
          " | ".join(x.split(" [")[0] for x in bad[:8]) if bad
          else "%d public HTML pages scanned; E-038 semantic boundary intact" % scanned)

def check_cross_vendor_claim_semantics(offline):
    """Raw cross-vendor agreement must never be promoted to established reproducibility.

    E-039 records one cross-vendor series under two denominator rules.  The
    measurements are consistency/agreement measurements.  The pre-registered
    reproducibility criterion requires chance-corrected AC1 >= 0.61, and no
    chance-corrected coefficient was computed for this study.  Therefore the
    criterion is NOT ESTABLISHED -- not passed and not failed.

    This guard scans rendered public HTML blocks rather than a fixed filename
    list.  It catches the known quantitative series and generic cross-vendor
    numeric claims, while allowing a block to use the word "reproducibility"
    only when that same block explicitly carries the limiting proposition.
    """
    bad = []
    scanned = 0
    number_re = re.compile(r"\b(?:66\.7|82\.2|85\.3|87\.2|93\.3)\s*%?\b", re.I)
    cross_re = re.compile(r"\bcross[\s-]*vendor\b", re.I)
    promoted_re = re.compile(
        r"\b(?:cross[\s-]*vendor\s+(?:ai\s+|model\s+)?reproducibility|"
        r"reproducibility\s+(?:rate|result|figure|finding|demonstrated|established|validated))\b",
        re.I)
    limit_re = re.compile(
        r"\b(?:not\s+established|no\s+(?:chance[\s-]*corrected\s+)?ac1|"
        r"ac1\s+(?:was\s+)?not\s+(?:computed|calculated)|raw\s+agreement|"
        r"consistency)\b",
        re.I)

    for rel in _html_files():
        body = read(rel)
        if not body:
            continue
        scanned += 1
        for unit in _rendered_blocks(body):
            has_series = bool(number_re.search(unit) and cross_re.search(unit))
            has_promotion = bool(promoted_re.search(unit))
            if not (has_series or has_promotion):
                continue
            if has_promotion and not limit_re.search(unit):
                bad.append("%s: cross-vendor agreement promoted to reproducibility [%s]" %
                           (rel, unit[:160]))
                continue
            # A quantitative cross-vendor block may use "reproducibility" only
            # as a criterion/status term when the limitation travels with it.
            if has_series and re.search(r"\breproducib", unit, re.I) and not limit_re.search(unit):
                bad.append("%s: quantitative cross-vendor claim lacks E-039 limitation [%s]" %
                           (rel, unit[:160]))

    check("cross-vendor agreement is not promoted to established reproducibility",
          not bad,
          " | ".join(x.split(" [")[0] for x in bad[:8]) if bad
          else "%d public HTML pages scanned; E-039 semantic boundary intact" % scanned)

def main():
    offline = "--offline" in sys.argv
    for fn in (check_telemetry_parity, check_no_handwritten_counts,
               check_no_masking_fallbacks, check_panel_geo,
               check_html_figures_bound, check_panel_binder_identical,
               check_trust_pages_carry_their_proof,
               check_completion_date_implies_completion,
               check_second_read_completeness_is_published,
               check_crossdomain_citation_is_current,
               check_submission_package_is_self_contained,
               check_send_copy_is_clean,
               check_coding_frames_match_the_manuscript,
               check_second_read_reported_honestly,
               check_named_contributors_are_only_the_ones_who_elected_it,
               check_frozen_manuscript_versions_are_immutable,
               check_audit_prompt_is_present_and_whole,
               check_owner_only_research_files_say_so,
               check_every_credited_participant_is_an_expert,
               check_ubayet_is_described_as_he_asked,
               check_private_paths_stay_unreachable,
               check_inquiry_options_are_backed_by_the_allowlist,
               check_no_endpoint_relies_on_an_uncapped_limit,
               check_blinded_manuscript_carries_no_identity,
               check_withdrawn_contributor_is_not_defaulted_into_being_named,
               check_markdown_pdfs_are_converted,
               check_all_experts_credited, check_rung2a_lock,
               check_contributor_carries_no_findings,
               check_withdrawn_contributors_absent,
               check_tracked_guides_carry_exactly_one_routing_page,
               check_the_check_page_never_transmits_an_answer,
               check_reliability_raters_are_not_demoted,
               check_honor_roster_composition,
               check_certificate_claims_supported,
               check_printed_certificate_matches_endpoint,
               check_evaluation_offers_no_certificate,
               check_no_cloudflare_artifacts,
               check_no_price_literals_in_html,
               check_sitemap_no_duplicates,
               check_commercial_pages_reachable,
               check_framework_names_qualified,
               check_no_false_assurance_claims,
               check_zero_retention_claim_is_true,
               check_free_funnel_preserved,
               check_checkout_path_active,
               check_sitemap_keeps_free_material,
               check_no_secrets_in_source,
               check_notifications_wired,
               check_alerts_disabled,
               check_dual_track_band,
               check_dual_track_phone_compaction,
               check_no_internal_voice_copy,
               check_retention_claim_is_scoped,
               check_robots_directives_coherent,
               check_style_tags_balanced,
               check_inline_scripts_parse,
               check_nav_links_reach_their_section,
               check_site_nav_present,
               check_review_controls_is_the_pdf,
               check_only_the_active_nav_item_is_gold,
               check_no_duplicate_nav_strips,
               check_no_redirect_shadows_a_real_page,
               check_a_page_leads_with_its_own_action,
               check_util_bar_does_not_hide_links_on_a_phone,
               check_skip_token_lands_where_cloudflare_reads_it,
               check_enterprise_page_leads_with_its_own_action,
               check_inquiry_form_is_not_buried,
               check_free_track_bridges_to_the_licence,
               check_api_contract_has_a_runnable_example,
               check_homepage_hero_offers_both_tracks,
               check_openapi_matches_the_implementation,
               check_security_page_exists_and_is_linked,
               check_vendor_question_is_asked_once,
               check_track1_pages_lead_with_an_action,
               check_sandbox_is_failclosed,
               check_sandbox_is_reachable_and_gated,
               check_pricing_is_published,
               check_no_custom_pricing_estimator_returns,
               check_pricing_constraint_names_its_trigger,
               check_founder_service_layer_is_retired,
               check_no_founder_service_funnel_survives_anywhere,
               check_revenue_model_is_licensing_only,
               check_engine_ladder_is_intact,
               check_tracker_logged_today,
               check_superseded_manuscripts_not_listed,
               check_accepted_article_is_tracked,
               check_pii_gate_is_identical_everywhere,
               check_homepage_is_a_landing_page,
               check_training_is_ungated,
               check_training_modules_are_findable,
               check_public_downloads_are_not_blocked_by_a_redirect,
               check_disclosed_retention_matches_the_policy,
               check_record_derived_fields_have_no_export_path,
               check_no_unapproved_outbound_destination,
               check_manifest_implementation_is_not_deployable,
               check_manifest_library_holds_its_refusals,
               check_manifest_truncation_limit_matches_the_engine,
               check_a_privacy_promise_is_not_contradicted_by_an_export,
               check_the_methodology_mapping_tracks_the_executable_vocabulary,
               check_every_public_table_projection_has_a_recorded_disposition,
               check_architecture_baseline_is_current,
               check_production_verifier_reads_no_secret,
               check_no_conditional_deployment_state,
               check_prohibited_claims_are_absent_from_every_surface_class,
               check_version_inventory_matches_its_sources,
               check_no_stale_owner_action_survives_its_confirmation,
               check_misuse_register_records_reality,
               check_no_right_is_offered_beyond_its_evidence,
               check_section_2_1_resolution_holds,
               check_ledger_index_matches_the_ledger,
               check_reliability_is_recorded_as_measured_and_failed,
               check_key_person_record_is_honest,
               check_blocker_evidence_targets_agree_with_the_blocker,
               check_every_blocker_says_who_acts_next,
               check_superseded_records_declare_themselves_superseded,
               check_the_owner_queue_matches_the_item_states,
               check_no_owner_decision_asks_for_completed_work,
               check_downstream_records_agree_with_the_blocker_registry,
               check_no_stale_current_state_representation,
               check_manifest_schema_keeps_its_safeguards,
               check_data_handling_claims_match_the_implementation,
               check_published_api_contract_matches_the_write_path,
               check_every_active_processor_is_disclosed,
               check_pages_that_render_engine_output_disclose_validation_status,
               check_public_engine_endpoints_carry_no_record_text,
               check_owner_only_endpoints_are_not_swept_up_by_the_pii_rule,
               check_no_new_subscription_funnel,
               check_reliability_figures_are_current,
               check_reliability_claim_semantics,
               check_research_summary_leads_with_its_boundaries,
               check_the_cross_vendor_range_carries_its_denominator,
               check_cross_vendor_claim_semantics,
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
