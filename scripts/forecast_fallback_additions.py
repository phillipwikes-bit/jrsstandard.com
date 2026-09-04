#!/usr/bin/env python3
"""Who gets added to the credit list on the fallback date, and who does not.

THE RULE, from api/contributor.js:50-52, printed on every contributor's own
page: if a contributor does not respond by the fallback date, the paper uses
the name and title already on file for them, or anonymity where that is the
election on file.

So the fallback date does not add everyone who is silent. It adds the silent
contributors whose roster row carries named_on_file: true and who are not on
the anonymity list. Silence from anyone else changes nothing.

WHAT THIS DOES NOT DO. It does not write, and it does not apply the fallback.
The credit pipeline in scripts/apply_contributor_credits.py currently credits
only codes on the confirmed list, so nothing is added anywhere until someone
runs it with the fallback in force. This tells you what that run would print,
before it prints it.

Reads three sources and joins them:
  api/_contributor-roster.js      every code, and named_on_file for each
  api/contributor.js             ANON_CODES, the anonymity elections on file
  /api/contributor-stats         who has actually confirmed, live

    python3 scripts/forecast_fallback_additions.py
"""
import io
import json
import os
import re
import sys
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ROSTER_JS = os.path.join(ROOT, "api", "_contributor-roster.js")
CONTRIB_JS = os.path.join(ROOT, "api", "contributor.js")
STATS = "https://www.jrsstandard.com/api/contributor-stats"
UA = {"User-Agent": "Mozilla/5.0 (JRS fallback forecast)"}

# Only these prefixes are credited in the detection paper. V-HR is the
# employment pilot, a different study, and is not one of the three groups the
# Acknowledgments names.
CREDITED_PREFIXES = ("V-AI-", "E-", "RR-")


def roster():
    """Every roster row: code -> (name, title, org, named_on_file)."""
    if not os.path.exists(ROSTER_JS):
        raise SystemExit("[REQUIRED_ENV_PARAM] roster not found at %s"
                         % os.path.relpath(ROSTER_JS, ROOT))
    src = io.open(ROSTER_JS, encoding="utf-8").read()
    out = {}
    for m in re.finditer(
            r"^\s*'[0-9a-z]+':\s*\{\s*code:\s*'([^']+)',\s*"
            r"kind:\s*'([^']*)'.*?"
            r"name:\s*'([^']*)'.*?title:\s*'([^']*)'.*?org:\s*'([^']*)'.*?"
            r"named_on_file:\s*(true|false|null)", src, re.M | re.S):
        code, kind, name, title, org, named = m.groups()
        if code in out:
            continue
        out[code] = (name, title, org,
                     {"true": True, "false": False, "null": None}[named],
                     kind)
    return out


def anon_codes():
    """Codes whose election on file is anonymity."""
    if not os.path.exists(CONTRIB_JS):
        raise SystemExit("[REQUIRED_ENV_PARAM] api/contributor.js not found")
    src = io.open(CONTRIB_JS, encoding="utf-8").read()
    m = re.search(r"const ANON_CODES = \[([^\]]*)\];", src)
    if not m:
        raise SystemExit("[REQUIRED_ENV_PARAM] ANON_CODES not found in "
                         "api/contributor.js; the fallback cannot be resolved")
    return set(re.findall(r"'([^']+)'", m.group(1)))


def fallback_date():
    src = io.open(CONTRIB_JS, encoding="utf-8").read()
    m = re.search(r"const FALLBACK_DATE = '([^']+)'", src)
    return m.group(1) if m else "[REQUIRED_ENV_PARAM] no FALLBACK_DATE"


def confirmed():
    try:
        with urllib.request.urlopen(
                urllib.request.Request(STATS, headers=UA), timeout=30) as r:
            d = json.loads(r.read().decode())
    except Exception as e:
        raise SystemExit("[REQUIRED_ENV_PARAM] /api/contributor-stats did not "
                         "answer: %r. No cached copy exists, so there is "
                         "nothing to fall back to." % (e,))
    return set(d.get("confirmed_codes") or []), d


def sort_key(code):
    m = re.match(r"([A-Z-]+?)-?(\d+)$", code)
    return (m.group(1), int(m.group(2))) if m else (code, 0)


def main():
    print("OWNER COPY. Contains names and elections. Do not forward.")
    print()
    ros = roster()
    anon = anon_codes()
    conf, stats = confirmed()

    silent = [c for c in ros if c not in conf]
    add, stay_anon, not_this_paper, no_election, authors = [], [], [], [], []
    for code in silent:
        name, title, org, named, kind = ros[code]
        if kind == "author":
            # An author is credited on the byline, not in the contributor
            # list, and no fallback applies to a byline.
            authors.append(code)
        elif code in anon:
            stay_anon.append(code)
        elif named is None:
            no_election.append(code)
        elif named:
            if code.startswith(CREDITED_PREFIXES):
                add.append(code)
            else:
                not_this_paper.append(code)
        else:
            stay_anon.append(code)

    print("FALLBACK DATE: %s" % fallback_date())
    print("roster %d, confirmed %d, silent %d"
          % (len(ros), len(conf), len(silent)))
    print()
    print("WOULD BE ADDED TO THE CREDITS  (%d)" % len(add))
    print("  Silent, named_on_file true, no anonymity election, and in a group")
    print("  this paper credits.")
    if add:
        for code in sorted(add, key=sort_key):
            name, title, org, _n, _k = ros[code]
            tail = ", ".join(x for x in (title, org) if x)
            print("  %-9s %-24s %s" % (code, name, tail[:60]))
    else:
        print("  none")
    print()

    print("SILENT, BUT STAY UNNAMED  (%d)" % len(stay_anon))
    print("  An election to stay unnamed is on file. Silence changes nothing.")
    for code in sorted(stay_anon, key=sort_key):
        print("  %-9s %s" % (code, ros[code][0] or "(no name on the row)"))
    print()

    if no_election:
        print("SILENT, NO ELECTION ON FILE  (%d)" % len(no_election))
        print("  named_on_file is null. The page tells them silence means the")
        print("  aggregate without a name, so they are NOT added.")
        for code in sorted(no_election, key=sort_key):
            print("  %-9s %s" % (code, ros[code][0] or "(no name)"))
        print()

    if not_this_paper:
        print("SILENT AND NAMED ON FILE, BUT NOT CREDITED IN THIS PAPER  (%d)"
              % len(not_this_paper))
        print("  A different study. The detection paper credits V-AI, E and RR")
        print("  only.")
        for code in sorted(not_this_paper, key=sort_key):
            print("  %-9s %s" % (code, ros[code][0] or "(no name)"))
        print()

    if authors:
        print("NOT A CONTRIBUTOR ROW AT ALL  (%d)" % len(authors))
        print("  Credited on the byline. No fallback applies to a byline, and")
        print("  silence on a contributor link cannot change authorship.")
        for code in sorted(authors, key=sort_key):
            print("  %-9s %s" % (code, ros[code][0] or "(no name)"))
        print()

    # The current printed count is read from the manuscript itself rather
    # than assumed, so this line cannot go stale when the credits change.
    paper = os.path.join(ROOT, "research",
                         "Detection_Article_Submission_FINAL5_2026-08-18.md")
    now = 0
    if os.path.exists(paper):
        body = io.open(paper, encoding="utf-8").read()
        if "**Named contributors, as at" in body:
            blk = body.split("**Named contributors, as at", 1)[1]
            blk = blk.split("\n\nThe reliability and validation", 1)[0]
            now = len(re.findall(r"^- ", blk, re.M))
    print("RESULT IF THE FALLBACK IS APPLIED AS WRITTEN")
    if now:
        print("  the credits go from %d named to %d named, a delta of +%d"
              % (now, now + len(add), len(add)))
    else:
        print("  [REQUIRED_ENV_PARAM] the current credit block could not be "
              "read from the manuscript, so the delta is +%d against an "
              "unknown base" % len(add))
    print()
    print("NOTHING IS APPLIED BY THIS SCRIPT. apply_contributor_credits.py")
    print("credits only codes on the confirmed list, so the fallback is a")
    print("policy on the page and not yet a code path. Making it one is a")
    print("decision, not a maintenance task.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
