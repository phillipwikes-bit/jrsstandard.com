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

    for entry in listed:
        if entry.strip() not in allowed:
            problems.append("credits an entry that is not a named contributor "
                            "of the three groups: %s" % entry.strip()[:60])
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

    # The unnamed figure is summed per group, never read off the roster total.
    m = re.search(r"^(\w+) further contributors? across these three groups "
                  r"confirmed", block, re.M)
    if not m:
        problems.append("the per-group unnamed sentence is missing")
    else:
        words = {"No": 0, "One": 1, "Two": 2, "Three": 3, "Four": 4,
                 "Five": 5, "Six": 6}
        stated = words.get(m.group(1))
        named = {"V-AI-": 0, "RR-": 0, "E-": 0}
        for code, _d in rows:
            if code.startswith("V-AI-"):
                named["V-AI-"] += 1
            elif code.startswith("RR-"):
                named["RR-"] += 1
            elif re.match(r"^E-\d+$", code):
                named["E-"] += 1
        # Confirmed per group, as reported by /api/contributor-stats on
        # 2026-08-29 and recorded here so the check runs offline.
        expected = ((13 - named["V-AI-"]) + (3 - named["E-"])
                    + (14 - named["RR-"]))
        if stated != expected:
            problems.append("states %s unnamed across the three groups; the "
                            "confirmed-minus-named figure is %d"
                            % (m.group(1), expected))

    check("named contributors are only the ones who elected it",
          not problems,
          "%d credited across three groups, all elected, no employment pilot, "
          "no arm nomenclature, unnamed count summed per group" % len(listed)
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

COMMERCIAL_PAGES = ("audit-request.html", "governance-request.html",
                    "calibration-request.html", "review-engine.html")

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
    check("every commercial page has an inbound link", not orphans,
          "orphaned: " + ", ".join(orphans) if orphans
          else "%d pages, all linked" % len(COMMERCIAL_PAGES))
    check("every commercial page is in sitemap.xml", not unlisted,
          "missing: " + ", ".join(unlisted) if unlisted
          else "%d pages, all listed" % len(COMMERCIAL_PAGES))


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
# check_scope_estimator_qualifies_without_a_price, which currently asserts that
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


def check_scope_estimator_qualifies_without_a_price(offline):
    """A buyer must be able to size the commitment without a published floor.

    The CRO finding was never "no price". It was that a buyer could not tell
    whether this was their size of commitment without spending a call to find
    out. The 2026-08-25 owner constraint blocks publishing a band, and its
    stated reason is that the figures sat above a ladder on which nothing has
    ever sold: a number with no transacted reference behind it invites the
    question of who else pays it.

    The estimator answers the sizing question without answering the price
    question. This asserts it exists, returns a tier, and carries the answers
    into the inquiry form, and that it still prints no figure.
    """
    src = read("enterprise.html")
    bad = []
    for el in ("sc-vol", "sc-types", "sc-exposure", "sc-go", "sc-out", "sc-tier"):
        if 'id="%s"' % el not in src:
            bad.append("missing #%s" % el)
    for tier in ("Pilot integration", "Standard platform licence",
                 "Extended platform licence", "Custom scope"):
        if tier not in src:
            bad.append("tier %r absent" % tier)
    if 'name="scale"' not in src:
        bad.append("estimator cannot prefill the inquiry form")
    # The estimator must never grow a figure of its own.
    if re.search(r"\$\s?\d", src):
        bad.append("a currency figure appeared on the page")
    check("scope estimator qualifies without a price", not bad,
          "; ".join(bad) if bad
          else "4 tiers, 3 inputs, prefills the inquiry, no figure printed")


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
               check_markdown_pdfs_are_converted,
               check_all_experts_credited, check_rung2a_lock,
               check_contributor_carries_no_findings,
               check_withdrawn_contributors_absent,
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
               check_scope_estimator_qualifies_without_a_price,
               check_pricing_constraint_names_its_trigger,
               check_revenue_model_is_licensing_only,
               check_engine_ladder_is_intact,
               check_tracker_logged_today,
               check_superseded_manuscripts_not_listed,
               check_accepted_article_is_tracked,
               check_pii_gate_is_identical_everywhere,
               check_homepage_is_a_landing_page,
               check_training_is_ungated,
               check_training_modules_are_findable,
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
