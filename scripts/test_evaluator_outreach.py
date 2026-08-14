#!/usr/bin/env python3
"""Assertion suite for research/build_evaluator_outreach.py.

Run:  python3 scripts/test_evaluator_outreach.py
Exit: 0 if every assertion passes, 1 otherwise.

Checks that every expert evaluator got a file, across Rung 2a, Rung 2b and both
arms; that each file carries a confirmation key which actually exists in the
roster; that the template blocks are present; that nothing in a message reveals
the blind; and above all that the two anonymous completers are NOT addressed by
an invented name.
"""
import glob
import io
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "research", "Evaluator_Outreach")
INDEX = os.path.join(ROOT, "research", "Evaluator_Outreach_INDEX.md")
ROSTER = os.path.join(ROOT, "api", "_contributor-roster.js")

SUBJECT = "Award Citation & Panelist Registry Confirmation"
DESIGNATION = "Appointed Expert, Global AI Resilience & Governance International Evaluator Panel"
AWARD = "Appointed Expert Award Citation"
REGISTRY = "Official Panelist Registry ID"

# The free grants that were removed on 2026-08-14. Any reappearance is a
# regression: a blanket enterprise licence to 36 people is an unmonetized
# giveaway of the only thing being sold.
FORBIDDEN_GRANTS = ("Founding Auditor", "Commercial Practice License",
                    "Commercial Practice Rights", "Institutional Enterprise Grant",
                    "12-month organizational deployment", "Founding Panelist")
ANON_CODES = ("RR-130", "RR-132")

# THE BLIND. The comparison study is open until 2026-08-15 and the B1/B2 split is
# what protects it. These tokens must never reach a message: RR-130 and RR-132
# carry the study-internal title "JRS-naive expert professional" in the roster
# CSV, and printing it back would tell an unaided-arm reviewer that a comparison
# exists, in writing, to the one person it protects.
BLIND_TOKENS = ("naive", "unaided", "randomiz", "arm b", "b1 ", "b2 ",
                "comparison study", "control arm")

checks = []


def t(name, got, want):
    checks.append((name, got, want))


def main():
    files = sorted(glob.glob(os.path.join(OUT, "*.md")))
    idx = io.open(INDEX, encoding="utf-8").read()
    roster_keys = set(re.findall(r"'([a-z0-9]{10})':", io.open(ROSTER, encoding="utf-8").read()))

    # The owner's instruction, 2026-08-14: every evaluator who served as an
    # EXPERT across Rung 2a, Rung 2b and both arms. 16 + 20 + 4, with three
    # dual-role people merged onto their Arm A row so nobody gets two letters.
    t("message files", len(files), 40)
    t("Rung 2b (Arm A) files", len([f for f in files if os.path.basename(f).startswith("A_")]), 16)
    t("Arm B files", len([f for f in files if os.path.basename(f).startswith("B_")]), 20)
    t("Rung 2a expert files", len([f for f in files if os.path.basename(f).startswith("2a_")]), 4)
    t("no duplicate letter to a dual-role person",
      sorted(os.path.basename(f) for f in files if os.path.basename(f)[3:] in
             ("E-09.md", "E-12.md", "E-13.md")), [])

    bad_key, no_sub, no_desig, no_lic, no_date = [], [], [], [], []
    grants, no_price, blind = [], [], []
    for f in files:
        s = io.open(f, encoding="utf-8").read()
        m = re.search(r"contributor\.html\?k=([a-z0-9]{10})", s)
        if not m or m.group(1) not in roster_keys:
            bad_key.append(os.path.basename(f))
        if SUBJECT not in s:
            no_sub.append(os.path.basename(f))
        if DESIGNATION not in s:
            no_desig.append(os.path.basename(f))
        if AWARD not in s or REGISTRY not in s:
            no_lic.append(os.path.basename(f))
        for g in FORBIDDEN_GRANTS:
            if g in s:
                grants.append("%s: %s" % (os.path.basename(f), g))
        for price in ("$250", "$500", "$750"):
            if price not in s:
                no_price.append("%s missing %s" % (os.path.basename(f), price))
        if "Monday, 31 August 2026" not in s:
            no_date.append(os.path.basename(f))
        low = s.lower()
        for tok in BLIND_TOKENS:
            if tok in low:
                blind.append("%s: %s" % (os.path.basename(f), tok.strip()))

    t("every file carries a key that exists in the roster", bad_key, [])
    t("subject line present everywhere", no_sub, [])
    t("designation present everywhere", no_desig, [])
    t("award and registry block present everywhere", no_lic, [])
    t("NO free-grant language anywhere", grants, [])
    t("all three paid tiers quoted everywhere", no_price, [])
    t("deadline present everywhere", no_date, [])
    t("NO blind-revealing token in any message", blind, [])

    # E-08 asked IN WRITING on 2026-08-09 that her agency title and employer be
    # removed from every piece of recognition, and api/honor.js records the
    # request with "Do not repopulate these from the study record." The roster CSV
    # still carries both, so this asserts the removal survives regeneration.
    e08 = io.open(os.path.join(OUT, "2a_E-08.md"), encoding="utf-8").read()
    t("E-08 agency title stays removed", "Deputy Records Access Officer" in e08, False)
    t("E-08 employer stays removed", "Housing Preservation" in e08, False)
    t("E-08 uses the spelling she confirmed", "Stacyann Young" in e08, True)

    # THE ONE THAT MATTERS MOST. Two people completed anonymously. A citation
    # printing a name they never gave would be the worst failure of this whole
    # exercise, so it is asserted rather than assumed.
    for code in ANON_CODES:
        s = io.open(os.path.join(OUT, "B_%s.md" % code), encoding="utf-8").read()
        t("%s salutation is a placeholder" % code, "not on record" in s, True)
        t("%s citation is not name-filled" % code, "[Evaluator Name]" in s, True)
        t("%s states the election holds" % code, "that election holds" in s, True)

    t("index rows", len(re.findall(r"^\| (?:A|B|2a) \| `", idx, re.M)), 40)
    t("index records who was NOT invited", "## Not invited, and why" in idx, True)
    t("index shows the dual-role second code", idx.count("| `E-09` |") +
      idx.count("| `E-12` |") + idx.count("| `E-13` |"), 3)
    t("index reports no missing keys", "NO KEY" in idx, False)

    fail = 0
    for name, got, want in checks:
        ok = got == want
        if not ok:
            fail += 1
        print(("PASS  " if ok else "FAIL  ") + name + ": got %r, expected %r" % (got, want))
    print("\n" + ("ALL %d ASSERTIONS PASSED" % len(checks) if not fail else "%d FAILED" % fail))
    return 0 if not fail else 1


if __name__ == "__main__":
    sys.exit(main())
