#!/usr/bin/env python3
"""Programme-wide participant count across EVERY study (reproducible source of
truth for the reviewer figures used on the site and in outreach copy).

WHY THIS EXISTS: the public copy carried "32", which is the number of people who
completed a full 24-record set across Study 011 (Arm A) and Study 012 (Arm B).
That silently excluded Study 004, the reliability study, whose raters graded a
shared record set through a different instrument with different codes. This
script counts every study and prints the figures actually safe to publish.

NO SERVICE KEY NEEDED: reads the same anon-readable aggregate views the public
status page uses. Raw read tables stay RLS-locked.

  python3 research/count_participants.py

IDENTITY CAVEAT, and the reason for the conservative headline figure:
participant codes are issued per study, and the anon views expose no name for
the reliability raters, so cross-study identity cannot be resolved here. The
manuscript states Study 012 has "its own participants, its own recruitment, its
own participant codes", so Arm A and Arm B are disjoint. The reliability raters
whose codes begin with E are described in the manuscript as experts and MAY
overlap the detection panel, so they are EXCLUDED from the published headline.
The R- raters are a separately recruited bench pool and are counted. The headline
figure is therefore a floor that stays true even if every E- rater is also a
panel member.
"""
import json
import urllib.request

SB = "https://pjzxkeviouofdseagvpf.supabase.co"
KEY = "sb_publishable_mkdtg6-NgJ44_JVr9vZf6Q_30BVgY4e"  # anon key; public by design
NEEDED = 24


def q(path):
    req = urllib.request.Request(SB + path, headers={"apikey": KEY, "Authorization": "Bearer " + KEY})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode())


def main():
    a = q("/rest/v1/pilot_progress?select=code,total_reads&limit=5000")
    b = q("/rest/v1/armb_progress?select=code,arm_code,reads&limit=5000")
    lab = q("/rest/v1/bench_labels?select=labeler_code,record_id&limit=20000")

    a_reg = {r["code"] for r in a}
    a_done = {r["code"] for r in a if (r["total_reads"] or 0) >= NEEDED}
    b_reg = {r["code"] for r in b}
    b_done = {r["code"] for r in b if (r["reads"] or 0) >= NEEDED}

    raters = {r["labeler_code"] for r in lab}
    experts = {c for c in raters if str(c).startswith("E-")}
    bench = raters - experts

    print("STUDY 011  Detection panel (Arm A, V-AI-##)")
    print("  registered %d | completed a full %d-record set %d" % (len(a_reg), NEEDED, len(a_done)))
    print("STUDY 012  Randomized comparison (Arm B, RR-###)")
    print("  registered %d | completed a full %d-record set %d" % (len(b_reg), NEEDED, len(b_done)))
    print("STUDY 004  Reviewer reliability (shared record set)")
    print("  raters %d (%d E- experts, %d bench reviewers) | labels %d"
          % (len(raters), len(experts), len(bench), len(lab)))

    floor = len(a_done) + len(b_done) + len(bench)
    upper = len(a_done) + len(b_done) + len(raters)
    print()
    print("PUBLISHED HEADLINE (floor, true even if every E- rater is also a panel member):")
    print("  %d reviewers have graded records across the three studies," % floor)
    print("  of whom %d independent experts each completed a full %d-record set."
          % (len(a_done) + len(b_done), NEEDED))
    print("UPPER BOUND if no cross-study overlap exists: %d" % upper)
    print("REGISTERED PARTICIPANT CODES ACROSS ALL STUDIES: %d"
          % (len(a_reg) + len(b_reg) + len(raters)))


if __name__ == "__main__":
    main()
