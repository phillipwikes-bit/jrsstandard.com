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
    "N_SELECT": "study design constant, the blind-recheck sample size used for "
                "stratified quotas in build_blind_recheck_packet.py. Not a copy "
                "of a figure held anywhere else",
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
    ("21 reviewers using the five conditions",
     "Rung 2a comparison result. api/panel-stats returns no key for it, so there "
     "is nothing to bind it to. Binding it would require a new endpoint figure."),
    ("16 labels from 3 reviewers",
     "Rung 2a unstructured-group size, quoted as a stated limitation beside its "
     "confidence interval. Not a panel figure."),
    ("2 or more reviewers", "an escalation rule, not a count of anyone"),
    ("62 trained reviewers", "Rung 2a reliability set size, not a panel-stats figure"),
    ("Eleven failure patterns with reviewer",
     "a count of documented failure patterns; 'reviewer' here modifies 'prompts', "
     "it is not a count of people"),
]


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


def main():
    offline = "--offline" in sys.argv
    for fn in (check_telemetry_parity, check_no_handwritten_counts,
               check_no_masking_fallbacks, check_panel_geo,
               check_html_figures_bound, check_panel_binder_identical,
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
