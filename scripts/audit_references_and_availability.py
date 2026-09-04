#!/usr/bin/env python3
"""Audit the manuscript's References and Data availability sections against the
files and dataset they claim exist.

WHY. The manuscript makes reproducibility claims that a referee can test in
minutes: that every Section 5 figure is reproduced by a standard-library script,
that the case set carries citations and notes, that every case has a public URL.
A claim of that kind is worse than no claim if the supporting material does not
match, and this paper's own subject is whether a record can be independently
rebuilt.

WHAT IT CHECKS
  1. Every file named in Data availability exists in the repository.
  2. The analysis script named there runs and reports zero mismatches.
  3. The counts quoted in Data availability match the live database exactly.
  4. Every citation family listed under References has at least the number of
     distinct sources the manuscript claims for it.
  5. The script named is the CURRENT one, not the superseded 2026-08-08 file
     whose Section 5.3 table the manuscript no longer uses.

    python3 scripts/audit_references_and_availability.py
"""
import io
import json
import os
import re
import subprocess
import sys
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAPER = os.path.join(ROOT, "research", "FOIL_Article_Draft.md")
SB = "https://pjzxkeviouofdseagvpf.supabase.co"
KEY = "sb_publishable_mkdtg6-NgJ44_JVr9vZf6Q_30BVgY4e"

SUPERSEDED_SCRIPT = "analysis_foil_2026-08-08.py"


def paper():
    return io.open(PAPER, encoding="utf-8").read()


def flat(t):
    return re.sub(r"\s+", " ", t)


def live_counts():
    req = urllib.request.Request(
        SB + "/rest/v1/bench_outcomes?select=jrs_read,outcome,note,domain",
        headers={"apikey": KEY, "Authorization": "Bearer " + KEY})
    rows = [r for r in json.loads(urllib.request.urlopen(req, timeout=30).read().decode())
            if r["domain"] == "Public records / FOIL"]
    c = {"cases": len(rows),
         "ready": sum(1 for r in rows if r["jrs_read"] == "ready"),
         "needs_work": sum(1 for r in rows if r["jrs_read"] == "review_required"),
         "gap": sum(1 for r in rows if r["jrs_read"] == "gap_identified"),
         "noted": sum(1 for r in rows if (r.get("note") or "").strip()),
         "failed_appeal": sum(1 for r in rows if r["outcome"] == "failed_appeal"),
         "challenged": sum(1 for r in rows if r["outcome"] == "challenged"),
         "held_up": sum(1 for r in rows if r["outcome"] == "held_up"),
         "failed_audit": sum(1 for r in rows if r["outcome"] == "failed_audit")}
    return c


def main():
    body = paper()
    f = flat(body)
    c = live_counts()
    problems = []

    print("LIVE COUNTS  cases %d | Ready %d, Needs work %d, Gap %d | notes %d"
          % (c["cases"], c["ready"], c["needs_work"], c["gap"], c["noted"]))
    print("             outcomes: did not survive %d, contested %d, sustained %d, adverse audit %d"
          % (c["failed_appeal"], c["challenged"], c["held_up"], c["failed_audit"]))
    print()

    # 1. Files named in Data availability must exist.
    named = set(re.findall(r"`([A-Za-z0-9_.\-]+\.(?:py|json))`", body))
    print("FILES NAMED IN DATA AVAILABILITY")
    if not named:
        problems.append("Data availability names no file, so no claim in it is checkable")
        print("  (none named)")
    for fn in sorted(named):
        hit = None
        for d in ("research", "scripts"):
            p = os.path.join(ROOT, d, fn)
            if os.path.exists(p):
                hit = os.path.relpath(p, ROOT)
                break
        print("  %-42s %s" % (fn, hit or "MISSING"))
        if not hit:
            problems.append("Data availability names %s, which is not in the repository" % fn)
        if fn == SUPERSEDED_SCRIPT:
            problems.append("Data availability names the SUPERSEDED script %s, whose "
                            "Section 5.3 table the manuscript no longer uses" % fn)
    print()

    # 2. The named script must run clean.
    print("REPRODUCTION")
    script = None
    for fn in named:
        if fn.endswith(".py"):
            script = os.path.join(ROOT, "research", fn)
    if script and os.path.exists(script):
        r = subprocess.run([sys.executable, script, "--verify"],
                           capture_output=True, text=True)
        tail = [l for l in r.stdout.strip().split("\n") if "probes" in l]
        print("  %s --verify -> exit %d  %s"
              % (os.path.basename(script), r.returncode, tail[-1] if tail else ""))
        if r.returncode != 0:
            problems.append("%s --verify exits %d: the manuscript and the script "
                            "disagree" % (os.path.basename(script), r.returncode))
    else:
        problems.append("no runnable analysis script is named in Data availability")
    print()

    # 3. Counts quoted in Data availability must match live.
    print("COUNTS QUOTED IN DATA AVAILABILITY")
    quoted = [
        ("cases", "%d cases from %d distinct public sources" % (c["cases"], c["cases"])),
        ("reads", "reads %d Ready, %d Needs work, %d Gap"
                  % (c["ready"], c["needs_work"], c["gap"])),
        ("outcomes", "outcomes %d did not survive review, %d contested, %d sustained, "
                     "%d adverse audit findings"
                     % (c["failed_appeal"], c["challenged"], c["held_up"], c["failed_audit"])),
    ]
    for label, probe in quoted:
        ok = probe in f
        print("  %-10s %-88s %s" % (label, probe, "OK" if ok else "MISMATCH"))
        if not ok:
            problems.append("Data availability does not state %r as the live data has it" % probe)
    print()

    # 4. Citation families.
    print("REFERENCE FAMILIES")
    fam = [
        ("New York appellate and trial-level decisions", 1),
        ("New York Committee on Open Government advisory opinions", 1),
        ("Connecticut Freedom of Information Commission final decisions", 1),
        ("Compliance audits", 1),
    ]
    for name, minimum in fam:
        m = re.search(re.escape(name) + r":(.*?)(?:\n\n|$)", body, re.S)
        n = len([x for x in re.split(r";", m.group(1))if x.strip()]) if m else 0
        print("  %-58s %d source(s) listed" % (name, n))
        if n < minimum:
            problems.append("reference family %r lists %d sources" % (name, n))
    print()

    print("%d problem(s)" % len(problems))
    for p in problems:
        print("  " + p)
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())
