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
    """Item 2. The checkout path must stay wired end to end.

    Three request pages each pointing at /api/checkout, an endpoint that resolves
    an offer and captures a lead when it cannot take a card. A payment link being
    absent is a configuration gap; the PATH being removed is a decision, and this
    fails if anyone makes that decision quietly.
    """
    try:
        ck = read("api/checkout.js")
    except Exception:
        check("checkout path is active", False, "api/checkout.js is missing")
        return
    wired = [p for p in ("audit-request.html", "governance-request.html",
                         "calibration-request.html")
             if "api/checkout" in (read(p) if os.path.exists(os.path.join(ROOT, p)) else "")]
    has_capture = "checkout-fallback" in ck
    has_offer = "offerFor" in ck
    check("checkout path is active", len(wired) == 3 and has_capture and has_offer,
          "%d/3 request pages wired, capture=%s, offer resolution=%s"
          % (len(wired), has_capture, has_offer))


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


DUAL_TRACK_PAGES = ("index.html", "enterprise.html", "training.html",
                    "review-engine.html", "pilot.html")


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
    buried = []
    for p in DUAL_TRACK_PAGES:
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
          else "all %d pages place it within the first 12%% of visible text"
               % len(DUAL_TRACK_PAGES))

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


# Internal-voice copy that must never reach a public page. Owner constraints,
# 2026-08-25. Each entry was actually present in supplied copy on that date and
# was removed, so this list is a record of what happened rather than a
# precaution against the hypothetical.
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
               check_no_internal_voice_copy,
               check_retention_claim_is_scoped,
               check_robots_directives_coherent,
               check_style_tags_balanced,
               check_training_is_ungated,
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
