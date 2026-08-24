#!/usr/bin/env python3
"""Build the 22-case citation appendix for the employment article from the study database.

THE CITATIONS WERE NEVER MISSING. They live in bench_outcomes.source, the same table the
article's own verifier already queries. An earlier pass searched only research/*.md, found
nothing, and wrongly recorded them as absent from the workspace. This script reads them from
the source of truth so the appendix cannot drift from the data and cannot be hand-typed.

It also classifies the adjudicating forum for each case, because the manuscript described the
corpus as spanning three jurisdictional systems and the data shows seven.

Usage:
    python3 scripts/build_case_citations.py            # print the appendix
    python3 scripts/build_case_citations.py --check    # verify only, print counts
    python3 scripts/build_case_citations.py --write    # splice into the manuscript

Exit codes:
    0  22 rows, every one carrying a distinct non-empty citation
    1  a row is missing a citation, or the count is not 22
    2  the anon key or the endpoint could not be reached
"""

import argparse
import collections
import io
import json
import os
import re
import sys
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MS = os.path.join(ROOT, "research", "Employment_Records_Article_ISACA_2026-08-21.md")
SB = "https://pjzxkeviouofdseagvpf.supabase.co"
DOMAIN = "HR / Employment"
EXPECTED = 22
CORPORA = {"HR / Employment": 22, "Public records / FOIL": 32}

# Forum classification, ordered so the most specific pattern wins.
FORUMS = [
    (r"\bFLRA\b", "US Federal Labor Relations Authority"),
    (r"\bEEOC\b", "US Equal Employment Opportunity Commission"),
    (r"Unemployment Insurance Appeal Board", "New York Unemployment Insurance Appeal Board"),
    (r"Committee on Open Government", "New York Committee on Open Government"),
    (r"Employment Appeal Tribunal|Employment Tribunal", "UK Employment Tribunal"),
    (r"\bU\.S\. \d+ \(|U\.S\. Supreme Court", "US Supreme Court"),
    (r"AD3d|Slip Op", "New York Appellate Division"),
]

# A citation must identify a decision. Three grades, applied to the source string:
#
#   FULL       a named party or docket reference AND a locating number or docket
#   PARTIAL    a named party or forum but no docket, number or reporter reference
#   NONE       a narrative description that identifies no specific decision
#
# Grading exists because "non-empty" is not the same as "citable", and one row in this
# corpus carries a description with no identifying feature at all. It is reported as such
# and never dressed up.
DESCRIPTION_NOT_CITATION = re.compile(
    r"^Published .* proceedings involving", re.I)

PRIMARY_URL = re.compile(
    r"https?://\S*(nycourts\.gov|dos\.ny\.gov|osc\.ny\.gov|comptroller\.nyc\.gov"
    r"|portal\.ct\.gov|law\.justia\.com|gov\.uk|govinfo\.gov|flra\.gov|eeoc\.gov)\S*",
    re.I)

LOCATOR = re.compile(
    r"\d+\s+U\.S\.\s+\d+"          # US Reports
    r"|\d+\s+FLRA\s+No\.\s*\d+"     # FLRA
    r"|\d+\s+AD3d\s+\d+"             # NY Appellate Division
    r"|Slip Op"                        # NY slip opinion
    r"|Appeal Board No\.\s*\d+"       # NY UIAB
    r"|Appeal No\.\s*\d+"             # EEOC
    r"|FOIL-AO-\d+"                    # NY COOG advisory opinion
    r"|Case No\.\s*\S+",              # UK ET case number
    re.I)


def grade(src):
    """FULL if the entry can be located, PARTIAL if it names something without a locator,
    NONE if it identifies no specific decision at all.

    A resolvable primary-source URL counts as a locator. Marking a row PARTIAL because it
    links straight to the decision instead of citing a reporter would penalise the more
    verifiable form."""
    if not src or DESCRIPTION_NOT_CITATION.match(src):
        return "NONE"
    if LOCATOR.search(src) or PRIMARY_URL.search(src):
        return "FULL"
    return "PARTIAL"


def anon_key():
    api = os.path.join(ROOT, "api")
    for f in sorted(os.listdir(api)):
        if f.endswith(".js"):
            m = re.search(r"sb_publishable_[A-Za-z0-9_-]+",
                          io.open(os.path.join(api, f), encoding="utf-8").read())
            if m:
                return m.group(0)
    print("[REQUIRED_ENV_PARAM] anon key not found in api/", file=sys.stderr)
    sys.exit(2)


def fetch():
    k = anon_key()
    url = (SB + "/rest/v1/bench_outcomes"
           "?select=source,jrs_read,outcome,created_at"
           "&domain=eq." + urllib.parse.quote(DOMAIN) +
           "&order=created_at.asc&limit=500")
    req = urllib.request.Request(url, headers={"apikey": k,
                                               "Authorization": "Bearer " + k})
    try:
        return json.loads(urllib.request.urlopen(req, timeout=60).read().decode())
    except Exception as exc:                                   # noqa: BLE001
        print("[REQUIRED_ENV_PARAM] endpoint unreachable: %s" % exc, file=sys.stderr)
        sys.exit(2)


def forum(src):
    for pat, name in FORUMS:
        if re.search(pat, src):
            return name
    return "Unclassified"


def main():
    global DOMAIN, EXPECTED
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true")
    ap.add_argument("--write", action="store_true")
    ap.add_argument("--corpus", default=DOMAIN, choices=sorted(CORPORA))
    args = ap.parse_args()

    DOMAIN = args.corpus
    EXPECTED = CORPORA[DOMAIN]
    rows = fetch()
    srcs = [(r.get("source") or "").strip() for r in rows]

    bad = 0
    if len(rows) != EXPECTED:
        print("FAIL  expected %d rows, got %d" % (EXPECTED, len(rows)), file=sys.stderr)
        bad += 1
    empty = [i + 1 for i, s in enumerate(srcs) if not s]
    if empty:
        print("FAIL  rows with no citation: %s" % empty, file=sys.stderr)
        bad += 1
    if len(set(srcs)) != len(srcs):
        print("FAIL  duplicate citations present", file=sys.stderr)
        bad += 1

    grades = [grade(s) for s in srcs]
    described = [i + 1 for i, g in enumerate(grades) if g == "NONE"]
    partial = [i + 1 for i, g in enumerate(grades) if g == "PARTIAL"]

    counts = collections.Counter(forum(s) for s in srcs)

    print("PASS  %d rows, %d distinct non-empty citations"
          % (len(rows), len(set(s for s in srcs if s))))
    print("      forums represented: %d" % len(counts))
    for name, n in counts.most_common():
        print("        %-46s %d" % (name, n))
    print("      citation grades: FULL %d, PARTIAL %d, NONE %d"
          % (grades.count("FULL"), grades.count("PARTIAL"), grades.count("NONE")))
    if partial:
        print("WARN  row %s names a decision but carries no docket, reporter or case "
              "number. Supply the locator before submission."
              % ", ".join(str(x) for x in partial))
    if described:
        print("FAIL  row %s identifies no specific decision. It cannot be cited and must "
              "be resolved or excluded before submission."
              % ", ".join(str(x) for x in described))
        bad += 1

    if args.check:
        return 1 if bad else 0

    lines = []
    for i, (r, s) in enumerate(zip(rows, srcs), 1):
        g = grade(s)
        if g == "NONE":
            flag = ("  **[REQUIRED_ENV_PARAM: CASE_%02d_CITATION]** This entry identifies "
                    "no specific decision and cannot be cited. See endnote 6 for the "
                    "sensitivity analysis excluding it." % i)
        elif g == "PARTIAL":
            flag = ("  **[REQUIRED_ENV_PARAM: CASE_%02d_LOCATOR]** Named decision, no case "
                    "number on file. Supply the tribunal case number before submission." % i)
        else:
            flag = ""
        lines.append("%d. %s (%s)%s" % (i, s.rstrip("."), forum(s), flag))
    block = "\n".join(lines)

    if not args.write:
        print()
        print(block)
        return 1 if bad else 0

    ms = io.open(MS, encoding="utf-8").read()
    start = ms.index("## Appendix: case list")
    end = ms.index("---", start)
    ms = ms[:start] + "## Appendix: case list\n\n" + block + "\n\n" + ms[end:]
    io.open(MS, "w", encoding="utf-8").write(ms)
    print("wrote appendix into %s" % os.path.relpath(MS, ROOT))
    return 1 if bad else 0


if __name__ == "__main__":
    import urllib.parse
    sys.exit(main())
