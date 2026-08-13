#!/usr/bin/env python3
"""Opportunity scout: score freelance/consulting postings against the JRS asset inventory.

WHAT THIS IS NOT. It does not log into Upwork, scrape any marketplace, or fetch
job listings from anywhere. Automated scraping of Upwork breaches their terms of
service, needs credentials this repository does not hold, and a script that
pretended to do it would be fabricating its own inputs. You supply the postings;
this scores them.

WHAT IT DOES. Reads postings from a JSON file or from stdin, scores each against
what JRS can actually evidence, maps each to one of the three commercialization
packages in IP_COMMERCIALIZATION_AUDIT.md, applies the binding guardrails as hard
disqualifiers, and emits a ranked shortlist plus a proposal opening built from
figures read live from production.

HOW TO GET THE POSTINGS IN. Copy the listings you are already reading into a JSON
file. One object per posting, `title` and `description` required:

    [{"title": "...", "description": "...", "url": "...", "budget": "..."}]

Or pipe a single posting as plain text on stdin with --stdin.

Usage:
  python3 scripts/scout_opportunities.py postings.json
  python3 scripts/scout_opportunities.py postings.json --json      # machine output
  python3 scripts/scout_opportunities.py postings.json --markdown  # tracker section
  pbpaste | python3 scripts/scout_opportunities.py --stdin --title "AI policy review"

Exit code: 0 if at least one posting scores QUALIFIED, 1 if none do.
"""
import json
import re
import sys
import urllib.request

PANEL_URL = "https://jrsstandard.com/api/panel-stats"

# Figures used in the proposal opening. Read live; the fallback is only used when
# the endpoint cannot be reached, and it is labelled in the output so a stale
# number can never be mistaken for a live one.
FALLBACK_PANEL = {"completers": 36, "countries": 16, "continents": 5,
                  "detection_completers": 16, "detection_countries": 11}

# ---------------------------------------------------------------------------
# SIGNALS. Weighted, and every weight is visible so a score can be argued with.
# A signal is evidence the poster has the problem JRS measures, NOT evidence
# they will buy. Nothing here predicts demand.
# ---------------------------------------------------------------------------
SIGNALS = [
    # (weight, package, label, pattern)
    (5, 1, "record defensibility",
     r"\b(defensib|audit trail|documentation (quality|standard)|record[- ]keeping|"
     r"investigat\w+ report|case file|decision record)\b"),
    (5, 1, "AI-drafted records",
     r"\b(ai[- ]?(generated|drafted|assisted)|llm[- ]?(generated|drafted)|"
     r"chatgpt|copilot)\b.{0,40}\b(report|record|document|memo|note)\b"),
    (4, 1, "investigation / ER practice",
     r"\b(workplace investigation|employee relations|grievance|misconduct|"
     r"disciplinary|whistleblow)\w*\b"),
    (4, 1, "litigation or tribunal exposure",
     r"\b(tribunal|litigation|discovery|deposition|eeoc|mspb|employment claim)\b"),
    (5, 2, "model evaluation / reproducibility",
     r"\b(model (evaluation|validation|risk)|reproducib|inter[- ]?rater|"
     r"benchmark\w*|eval harness|red[- ]?team)\b"),
    (4, 2, "AI governance programme",
     r"\b(ai governance|responsible ai|ai (policy|assurance|oversight)|"
     r"iso[/ ]?iec ?42001|nist ai rmf|eu ai act)\b"),
    (3, 2, "audit evidence for a board",
     r"\b(board report|audit evidence|assurance report|control testing|"
     r"third[- ]party audit)\b"),
    (5, 3, "needs labelled evaluation data",
     r"\b(labell?ed data|ground truth|gold (standard|set|key)|annotation|"
     r"rater|test set|validation set)\b"),
    (3, 3, "assurance vendor building a claim",
     r"\b(detection (tool|model|accuracy)|accuracy claim|false positive|"
     r"precision and recall)\b"),
    (2, 0, "standards or framework authoring",
     r"\b(standard|framework|rubric|scoring (guide|rubric)|taxonomy|codebook)\b"),
    (2, 0, "policy writing",
     r"\b(polic(y|ies) (writing|drafting|development)|sop|procedure manual)\b"),
]

# HARD DISQUALIFIERS. These are the guardrails from research/IP_Sale_Playbook.md
# expressed as patterns. A posting that trips one is not a ranking problem, it is
# a do-not-bid, and the reason is printed rather than the posting silently
# dropped.
DISQUALIFIERS = [
    ("asks for the answer key or the scoring internals",
     r"\b(answer key|scoring (algorithm|internals|weights)|proprietary (model|scoring)|"
     r"source code of your)\b"),
    ("requires a proven-effectiveness claim",
     r"\b(proven (to|effective)|guarantee\w* (accuracy|outcome|result)|"
     r"clinically validated|certified effective)\b"),
    ("asks for identifiable case material",
     r"\b(send (us )?(real|actual) (case|personnel|hr) (file|record)s?|"
     r"upload your (client|case) files)\b"),
    ("ghostwriting or white-label of the research itself",
     r"\b(white[- ]?label|ghost[- ]?writ|publish under (our|my) name|"
     r"transfer (all )?authorship)\b"),
]

PACKAGES = {
    1: ("Seven-Point Record Defensibility Check",
        "General Counsel, Head of ER and Investigations", "days"),
    2: ("Model-Agreement Evidence Pack",
        "Chief AI Officer, Model Risk", "weeks"),
    3: ("Benchmark Access and Calibration",
        "AI assurance vendors, audit firms", "months"),
    0: ("No package maps cleanly", "unclear", "n/a"),
}

QUALIFY_AT = 6  # total weighted score at or above which a posting is shortlisted


def fetch_panel():
    """Live panel figures. Returns (dict, is_live)."""
    try:
        with urllib.request.urlopen(PANEL_URL, timeout=15) as r:
            d = json.load(r)
        if not isinstance(d, dict) or "completers" not in d:
            return FALLBACK_PANEL, False
        return d, True
    except Exception:
        return FALLBACK_PANEL, False


def score_posting(p):
    """Score one posting. Returns a result dict. Pure function, no I/O."""
    text = ((p.get("title") or "") + "\n" + (p.get("description") or "")).lower()

    blocked = [why for why, pat in DISQUALIFIERS if re.search(pat, text, re.I)]

    hits, by_pkg, total = [], {}, 0
    for weight, pkg, label, pat in SIGNALS:
        if re.search(pat, text, re.I):
            hits.append({"signal": label, "weight": weight, "package": pkg})
            by_pkg[pkg] = by_pkg.get(pkg, 0) + weight
            total += weight

    # Package assignment goes to the highest-weighted package with at least one
    # package-specific hit. Package 0 signals are generic and never decide it.
    specific = {k: v for k, v in by_pkg.items() if k != 0}
    package = max(specific, key=specific.get) if specific else 0

    if blocked:
        verdict = "DO NOT BID"
    elif total >= QUALIFY_AT and package != 0:
        verdict = "QUALIFIED"
    elif total > 0:
        verdict = "WEAK"
    else:
        verdict = "NO MATCH"

    return {
        "title": p.get("title") or "(untitled)",
        "url": p.get("url") or "",
        "budget": p.get("budget") or "",
        "score": total,
        "package": package,
        "package_name": PACKAGES[package][0],
        "persona": PACKAGES[package][1],
        "speed": PACKAGES[package][2],
        "verdict": verdict,
        "signals": sorted(hits, key=lambda h: -h["weight"]),
        "disqualifiers": blocked,
    }


def proposal_opening(res, panel, live):
    """Three sentences, built only from figures this repository can evidence."""
    if res["verdict"] != "QUALIFIED":
        return ""
    n = panel.get("completers", "?")
    c = panel.get("countries", "?")
    basis = ("%s reviewers across %s countries have completed a full 24-record "
             "set against a key fixed before scoring" % (n, c))
    if res["package"] == 1:
        body = ("I work on whether a written decision record can still explain "
                "itself months later, which is a different question from whether "
                "the decision was right. There are seven named ways an AI-assisted "
                "record fails that test, and they are checkable against your own "
                "closed files in about an hour.")
    elif res["package"] == 2:
        body = ("I run a nightly harness that puts the same constructed records to "
                "independent AI vendors and only escalates a finding when two or "
                "more agree, which produces a dated agreement series rather than a "
                "policy document. That is the artifact an auditor can actually test.")
    else:
        body = ("I hold a 24-record detection set with a held-out answer key, "
                "independently verified 24 of 24 by raters blind to it, with "
                "published inter-rater reliability. If you need to substantiate a "
                "detection claim, this is something to test against.")
    tail = ("Evidence base: %s.%s" % (basis, "" if live else
            " [FIGURES FROM CACHE, the live endpoint was unreachable, re-run before sending]"))
    return body + " " + tail


def render_text(results, panel, live):
    out = []
    q = [r for r in results if r["verdict"] == "QUALIFIED"]
    b = [r for r in results if r["verdict"] == "DO NOT BID"]
    out.append("%d posting%s scored. %d qualified, %d blocked by a guardrail."
               % (len(results), "" if len(results) == 1 else "s", len(q), len(b)))
    out.append("Panel figures: %s" % ("LIVE" if live else "CACHED FALLBACK, endpoint unreachable"))
    out.append("")
    for r in results:
        out.append("[%s]  score %d  %s" % (r["verdict"], r["score"], r["title"]))
        if r["url"]:
            out.append("    %s" % r["url"])
        if r["disqualifiers"]:
            for d in r["disqualifiers"]:
                out.append("    BLOCKED: %s" % d)
        else:
            out.append("    package: %s" % r["package_name"])
            out.append("    persona: %s   speed: %s" % (r["persona"], r["speed"]))
            if r["signals"]:
                out.append("    signals: " + ", ".join(
                    "%s (+%d)" % (s["signal"], s["weight"]) for s in r["signals"]))
        op = proposal_opening(r, panel, live)
        if op:
            out.append("    OPENING: " + op)
        out.append("")
    out.append("Scoring is a keyword heuristic over text you supplied. It indicates "
               "which postings are worth your reading time. It is not a judgment "
               "that anyone will hire you, and it measures no demand.")
    return "\n".join(out)


def render_markdown(results, panel, live):
    q = [r for r in results if r["verdict"] == "QUALIFIED"]
    b = [r for r in results if r["verdict"] == "DO NOT BID"]
    lines = ["### Opportunity scout run", "",
             "| | |", "|---|---|",
             "| Postings scored | %d |" % len(results),
             "| Qualified | **%d** |" % len(q),
             "| Blocked by a guardrail | %d |" % len(b),
             "| Panel figures | %s |" % ("live" if live else "**cached fallback, endpoint unreachable**"),
             "", "| Verdict | Score | Posting | Package |", "|---|---|---|---|"]
    for r in results:
        lines.append("| %s | %d | %s | %s |" % (
            r["verdict"], r["score"], r["title"].replace("|", "/"),
            r["package_name"] if not r["disqualifiers"] else "; ".join(r["disqualifiers"])))
    lines += ["", "**Scoring is a keyword heuristic over supplied text. It ranks "
              "reading time, not likelihood of being hired, and it measures no demand.**"]
    return "\n".join(lines)


def main(argv):
    args = [a for a in argv[1:] if not a.startswith("--")]
    flags = set(a for a in argv[1:] if a.startswith("--"))

    if "--stdin" in flags:
        title = ""
        for i, a in enumerate(argv):
            if a == "--title" and i + 1 < len(argv):
                title = argv[i + 1]
        postings = [{"title": title, "description": sys.stdin.read()}]
    elif args:
        with open(args[0], encoding="utf-8") as fh:
            postings = json.load(fh)
        if isinstance(postings, dict):
            postings = [postings]
    else:
        print(__doc__)
        return 1

    panel, live = fetch_panel()
    results = sorted((score_posting(p) for p in postings),
                     key=lambda r: (r["verdict"] == "DO NOT BID", -r["score"]))

    if "--json" in flags:
        print(json.dumps({"panel_live": live, "panel": panel, "results": results}, indent=2))
    elif "--markdown" in flags:
        print(render_markdown(results, panel, live))
    else:
        print(render_text(results, panel, live))

    return 0 if any(r["verdict"] == "QUALIFIED" for r in results) else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
