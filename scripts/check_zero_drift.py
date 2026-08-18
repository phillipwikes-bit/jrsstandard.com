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
            for m in re.finditer(r"^([A-Z][A-Z0-9_]*)\s*=\s*(\d+)\s*$",
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
    """Every .html in the repository, not just the root.

    The first version used os.listdir(ROOT) and scanned 50 of 70 pages. The 20 it
    skipped are reviewer/ and the whole reference/ hub, which are exactly the
    pages nobody looks at and where a frozen figure would sit longest.
    """
    out = []
    for base, dirs, files in os.walk(ROOT):
        dirs[:] = [d for d in dirs if d not in (".git", "node_modules", "research")]
        for f in files:
            if f.endswith(".html"):
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
    # v4 opens the Acknowledgments by spelling the number. The guard is on the
    # fact that the whole programme is credited, not on how the sentence is
    # written, so the spelled form counts.
    "Fifty-eight independent experts",
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
    bad = []
    for rel in PROGRAMME_SCOPE_FILES:
        src = read(rel)
        if not src:
            bad.append("%s: missing" % rel)
            continue
        cites_detection = any(m in src for m in DETECTION_ONLY)
        credits_all = any(m in src for m in PROGRAMME_MARKERS)
        if cites_detection and not credits_all:
            bad.append("%s: cites the 16-expert detection figure and never credits "
                       "the full programme" % rel)
    check("programme-scope files credit every independent expert", not bad,
          "%d files checked, all credit the whole programme" % len(PROGRAMME_SCOPE_FILES)
          if not bad else "; ".join(bad))


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
    if re.search(r"^\s*results\s*:", api, re.M):
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
    sys.path.insert(0, os.path.join(ROOT, "scripts"))
    try:
        import withdraw_contributor as wc
    except Exception as e:
        check("no withdrawn contributor name survives", False,
              "scripts/withdraw_contributor.py did not import: %r" % (e,))
        return
    traces = wc.scan_traces()
    names = sorted(n for w in wc.WITHDRAWALS for n in w["names"])
    if traces:
        shown = "; ".join("%s:%d %s" % t for t in traces[:6])
        if len(traces) > 6:
            shown += " (+%d more)" % (len(traces) - 6)
        check("no withdrawn contributor name survives", False, shown)
        return
    check("no withdrawn contributor name survives", True,
          "%d withdrawn name forms, 0 occurrences outside the register"
          % len(names))


# The honor roster's header comment states its composition. A comment is not a
# constant, so the hand-written-count check cannot see it, and it went stale the
# moment an entry was withdrawn: it still claimed 34 entries and 16 detection
# honorees after the count moved to 36 and 15.
HONOR_COMPOSITION_RE = re.compile(
    r"^// (\d+) entries: (\d+) public-records \+ (\d+) detection \+ (\d+) records-review\.",
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
    claimed_total, claimed_pr, claimed_det, claimed_rr = (int(g) for g in m.groups())

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
    keys = re.findall(r"^  '[a-z0-9]{10}': \{", block, re.M)
    studies = re.findall(r"^    study: '([a-z-]+)'", block, re.M)
    actual = {
        "total": len(keys),
        "public-records": studies.count("public-records"),
        "detection": studies.count("detection"),
        "records-review": studies.count("records-review"),
    }
    claimed = {
        "total": claimed_total,
        "public-records": claimed_pr,
        "detection": claimed_det,
        "records-review": claimed_rr,
    }
    bad = [k for k in claimed if claimed[k] != actual[k]]
    detail = ("%d entries: %d public-records + %d detection + %d records-review"
              % (actual["total"], actual["public-records"],
                 actual["detection"], actual["records-review"]))
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
    if not re.search(r"^\s*const wantsCert = false;\s*$", api, re.M):
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


def main():
    offline = "--offline" in sys.argv
    for fn in (check_telemetry_parity, check_no_handwritten_counts,
               check_no_masking_fallbacks, check_panel_geo,
               check_html_figures_bound, check_panel_binder_identical,
               check_all_experts_credited, check_rung2a_lock,
               check_contributor_carries_no_findings,
               check_withdrawn_contributors_absent,
               check_honor_roster_composition,
               check_certificate_claims_supported,
               check_printed_certificate_matches_endpoint,
               check_evaluation_offers_no_certificate,
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
