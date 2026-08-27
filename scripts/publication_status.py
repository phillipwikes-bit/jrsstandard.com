#!/usr/bin/env python3
"""What is written, where it goes, and what is actually stopping it.

WHY THIS EXISTS. Seven manuscripts sit in research/ across roughly forty
files, several with five or more "FINAL" variants of the same paper. Asked
which are pending submission, the honest answer required reading the tree
rather than recalling it, and the recall would have been wrong: MASTER_TRACKER
section 10 records "three papers in flight" and names a different three than
the ones now nearest to sending.

WHAT IT DOES NOT DO. It cannot tell you a manuscript was submitted. Nothing in
this repository records a send, because a send happens in an email client. Any
row reading "no send recorded" means exactly that and nothing stronger.

    python3 scripts/publication_status.py
"""
import io
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RES = os.path.join(ROOT, "research")

# SUPERSEDED MANUSCRIPTS ARE NOT PENDING SUBMISSIONS.
#
# The first version of this table was hand-built from filenames in research/,
# and it reported research/Article1_Rungs1and2.md as a seventh manuscript
# awaiting submission with "[REQUIRED_ENV_PARAM] venue not recorded". It is
# neither. MASTER_TRACKER.md:750, dated 2026-07-27, records: "CONSOLIDATION
# EXECUTED: standalone Rungs 1-2 paper merged into the international paper
# (Detection_ArmB_Article_Draft.md), per Phillip's decision to publish ONE
# flagship artifact."
#
# A file on disk is not evidence of a live submission. The tracker is the
# record of what is live, and the owner had to correct this by hand.
# check_superseded_manuscripts_not_listed enforces it.
#
# Each entry: key -> (display title, venue, canonical file, co-author, blocker)
# Venues and co-authors are read from the manuscripts and from
# MASTER_TRACKER section 10, not assigned here from memory.
PAPERS = [
    ("isaca",
     "When a Defensible Decision Becomes an Indefensible File",
     "ISACA Journal",
     "Employment_Records_Article_ISACA_2026-08-21.md",
     "Tanvi Pokhriyal (first author)",
     "First author has not seen any version. Package written 2026-08-24."),
    ("cci",
     "The Evidentiary Deficit in AI-Assisted Record-Keeping",
     "Corporate Compliance Insights",
     "Evidentiary_Deficit_Article_CCI_SUBMISSION_2026-08-19.md",
     "Hekim Colpan (equal contribution)",
     "Submission copy and playbook both complete."),
    ("detection",
     "Detectability of Decision Reconstruction Risk in AI-Generated Records",
     "AI and Ethics (Springer)",
     "Detection_Article_Submission_FINAL5_2026-08-18.md",
     "Ubayet Hossain, FRM (co-author); international expert panel",
     "Paper A, the flagship. ABSORBED the standalone Rungs 1-2 paper on "
     "2026-07-27 (MASTER_TRACKER.md:750), per the decision to publish ONE "
     "artifact. research/Article1_Rungs1and2.md is SUPERSEDED, not pending."),
    ("foil",
     "A Documentation-Quality Read for Public-Records Determinations",
     "Journal of Civic Information",
     "FOIL_Article_Draft.md",
     "Stacyann Young (confirmed)",
     "Tracker gates on n>=20 cases; draft reports 32."),
    ("business_ethics",
     "Documentation Governance in AI-Assisted Decision-Making",
     "Journal of Business Ethics",
     "BusinessEthics_Article_Draft.md",
     "Sanya Dalal (pending acceptance)",
     "Gated on a co-author who has not accepted."),
    ("edpacs",
     "Decision Reconstruction Risk: A Record-Level Control",
     "EDPACS",
     "Backup_Article_EDPACS_DRR_Control.md",
     "single-authored",
     "Explicitly a backup position. No co-author dependency."),
]

SEND_WORDS = ("submitted to", "sent to the editor", "uploaded to",
              "acknowledgement received", "under review at")


def words(path):
    full = os.path.join(RES, path)
    if not os.path.exists(full):
        return None
    return len(io.open(full, encoding="utf-8", errors="replace").read().split())


# Words that turn a send phrase into a plan rather than an event. "Submitted
# to AI and Ethics ONCE RESULTS ARE IN" is a decision about the future, and the
# first version of this script reported it as a completed submission. A status
# tool that reports intentions as facts is worse than no status tool.
FUTURE_MARKERS = (" once ", " when ", " after ", " if ", " will be",
                  " to be ", " plan to", " intend")
FUTURE_WINDOW = 90


def send_recorded(title_key, display):
    """Look for any record of an actual send. Absence is reported as absence."""
    tracker = os.path.join(RES, "MASTER_TRACKER.md")
    if not os.path.exists(tracker):
        return None
    text = io.open(tracker, encoding="utf-8", errors="replace").read().lower()
    stem = display.split(":")[0].lower()[:28]
    for w in SEND_WORDS:
        for m in re.finditer(re.escape(w), text):
            seg = text[max(0, m.start() - 160):m.start() + 160]
            if not (stem in seg or title_key in seg):
                continue
            ahead = text[m.end():m.end() + FUTURE_WINDOW]
            if any(f in ahead for f in FUTURE_MARKERS):
                continue
            return text[max(0, m.start() - 60):m.start() + 90]
    return None


def main():
    rows = []
    for key, title, venue, path, coauthor, blocker in PAPERS:
        w = words(path)
        rows.append((key, title, venue, path, coauthor, blocker, w,
                     send_recorded(key, title)))

    missing = [r for r in rows if r[6] is None]
    print("%d manuscripts tracked, %d files present, %d missing"
          % (len(rows), len(rows) - len(missing), len(missing)))
    print()

    for key, title, venue, path, coauthor, blocker, w, sent in rows:
        state = "FILE MISSING" if w is None else "%s words" % format(w, ",")
        print("%-16s %s" % (key.upper(), title[:64]))
        print("    venue     : %s" % venue)
        print("    file      : research/%s  (%s)" % (path, state))
        print("    co-author : %s" % coauthor)
        print("    status    : %s" % blocker)
        print("    send      : %s" % ("RECORDED: " + sent.strip()[:70]
                                      if sent else "no send recorded in this repository"))
        print()

    print("NOTE. This repository cannot observe a submission. Every 'no send")
    print("recorded' line means the tree holds no evidence either way, not that")
    print("the manuscript is unsent.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
