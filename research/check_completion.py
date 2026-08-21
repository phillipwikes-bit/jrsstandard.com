#!/usr/bin/env python3
"""Reviewer completion checker (MANDATORY before any completion recognition).

Rule (standing directive, 2026-07-20): no certificate, reference, LinkedIn
recommendation, completer thank-you, tracker "Complete" status, or aggregate
roll-up may be produced from a verbal or secondhand report alone. Run this
first. It needs NO service-role key: it reads the same anon-readable aggregate
views the public status page uses (pilot_progress for Arm A V-AI-## codes,
armb_progress for Arm B RR-### codes, realcase_progress for the real-case domain
pilots). Raw read tables stay RLS-locked; these views expose counts only.

REAL-CASE DOMAIN PILOTS ADDED 2026-08-21. Before this, a V-HR- or E- domain-pilot
code returned "NO ROW ... Do NOT issue recognition", because the script only read
the two constructed-corpus views. That is a FALSE NEGATIVE: those contributors are
recorded in realcase_progress and their work is real. The guard was blocking
legitimate recognition for the one class of contributor whose corpus is actual
adjudicated cases. Their completion bar is the study's stated target of 20 to 30
cases, not the 24 reads that applies to a constructed 24-record set, so the two
are checked against different thresholds and the script says which it used.

Usage:
  python3 research/check_completion.py V-AI-06     # Arm A: verdict + details
  python3 research/check_completion.py RR-106      # Arm B code works the same
  python3 research/check_completion.py V-HR-01     # real-case domain pilot
  python3 research/check_completion.py             # full table, all sources

Exit code: 0 if the queried code is COMPLETE, 1 otherwise.
With no argument, exit code is always 0 (listing mode).
"""
import json
import sys
import urllib.request

SB = "https://pjzxkeviouofdseagvpf.supabase.co"
KEY = "sb_publishable_mkdtg6-NgJ44_JVr9vZf6Q_30BVgY4e"  # anon key; public by design (shipped in site HTML)
NEEDED = 24
REALCASE_TARGET = 20  # the study's stated floor for a real-case domain pilot


def q(path):
    req = urllib.request.Request(SB + path, headers={"apikey": KEY, "Authorization": "Bearer " + KEY})
    with urllib.request.urlopen(req, timeout=25) as r:
        return json.loads(r.read().decode())


def fetch(code=None):
    rows = []
    flt = "&code=eq." + code if code else ""
    for r in q("/rest/v1/pilot_progress?select=code,name,total_reads,reads_today,last_at" + flt):
        rows.append({"arm": "A", "code": r["code"], "name": r.get("name") or "",
                     "reads": r.get("total_reads") or 0, "today": r.get("reads_today") or 0,
                     "last": r.get("last_at") or ""})
    for r in q("/rest/v1/armb_progress?select=code,arm_code,reads,reads_today,last_at" + flt):
        rows.append({"arm": "B(" + (r.get("arm_code") or "?") + ")", "code": r["code"], "name": "",
                     "reads": r.get("reads") or 0, "today": r.get("reads_today") or 0,
                     "last": r.get("last_at") or ""})
    # realcase_progress keys on `contributor`, not `code`, so it needs its own filter.
    rflt = "&contributor=eq." + code if code else ""
    for r in q("/rest/v1/realcase_progress?select=contributor,domain,cases,cases_today,last_at" + rflt):
        rows.append({"arm": "REAL", "code": r["contributor"], "name": r.get("domain") or "",
                     "reads": r.get("cases") or 0, "today": r.get("cases_today") or 0,
                     "last": r.get("last_at") or "", "realcase": True})
    return rows


def show(r):
    bar = REALCASE_TARGET if r.get("realcase") else NEEDED
    status = "COMPLETE" if r["reads"] >= bar else ("IN PROGRESS %d/%d" % (min(r["reads"], bar), bar) if r["reads"] else "NOT STARTED")
    if r.get("realcase"):
        status += " (real-case pilot, bar is the %d-case target)" % bar
    extra = " (+%d today)" % r["today"] if r["today"] else ""
    last = (" last " + r["last"][:16] + "Z") if r["last"] else ""
    name = (" " + r["name"]) if r["name"] else ""
    print("%-8s %-8s %-24s reads=%-3d %s%s%s" % (r["arm"], r["code"], name.strip() or "-", r["reads"], status, extra, last))
    return r["reads"] >= bar


def main():
    code = sys.argv[1].strip() if len(sys.argv) > 1 else None
    try:
        rows = fetch(code)
    except Exception as e:
        print("QUERY FAILED (%s). Do NOT issue recognition; retry or check connectivity." % e)
        sys.exit(1)
    if code:
        if not rows:
            print("NO ROW for %s in pilot_progress, armb_progress or realcase_progress. Do NOT issue recognition: the code may be unregistered or misspelled." % code)
            sys.exit(1)
        ok = all(show(r) for r in rows)
        print("VERDICT: %s" % ("COMPLETE, recognition may be issued." if ok else "NOT COMPLETE, do not issue recognition."))
        sys.exit(0 if ok else 1)
    rows.sort(key=lambda r: (-r["reads"], r["code"]))
    done = sum(1 for r in rows if r["reads"] >= (REALCASE_TARGET if r.get("realcase") else NEEDED))
    for r in rows:
        show(r)
    print("-- %d rows; %d complete (>=%d reads, or >=%d cases for a real-case pilot)"
          % (len(rows), done, NEEDED, REALCASE_TARGET))
    sys.exit(0)


if __name__ == "__main__":
    main()
