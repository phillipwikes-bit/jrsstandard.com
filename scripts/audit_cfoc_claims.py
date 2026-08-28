#!/usr/bin/env python3
"""Verify every empirical claim in the CFOC outreach emails against the manuscript.

WHY. research/CFOC_Submission_20260808.md is outreach sent under Stacyann
Young's name to the Chief FOIA Officers Council and to a named DOI attorney. It
asserts figures that must match research/FOIL_Article_Draft.md exactly, because
a recipient who asks for the draft will read both. A number that drifts between
an outreach email and the paper it advertises is the same defect this repository
guards everywhere else, expressed in prose.

CLAIMS ARE DECLARED, NOT INFERRED. Each entry names the claim, the regex that
must match the manuscript, and the sentence in the email it comes from. Inferring
claims by scanning the email for numerals was tried and rejected: it flagged
"20 years of experience" and "28 May memorandum", neither of which the manuscript
is obliged to contain.

    python3 scripts/audit_cfoc_claims.py
"""
import io
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAPER = os.path.join(ROOT, "research", "FOIL_Article_Draft.md")
EMPLOY = os.path.join(ROOT, "research", "Employment_Records_Article_ISACA_2026-08-21.md")

# (label, source file, regex that must match, the email sentence it comes from)
CLAIMS = [
    ("corpus size is 32", PAPER, r"\b32\s+(?:real\s+)?(?:publicly available |public )?(?:cases|determinations)",
     "I applied it to 32 real public-records cases"),
    ("five compliance audits", PAPER, r"\bfive\b[^.]{0,80}audit",
     "All five compliance audits in the set were flagged"),
    ("audit concordance is total", PAPER, r"all five|five of five",
     "agreed with independent government auditors in every case where both existed"),
    # CORRECTED 2026-08-28. The construct coding runs on the 24 case-level
    # sources that carry a note, not on all 27: three carry no note and cannot
    # be coded for what their note states. Both documents now say so.
    ("seven noted Needs work cases", PAPER, r"Needs work \(n = 7\)|seven Needs work",
     "Of the seven Needs work assessments carrying a contemporaneous note"),
    ("seventeen noted Ready cases", PAPER, r"Ready \(n = 17\)|seventeen noted Ready",
     "against none of the seventeen noted Ready assessments"),
    ("corrected construct p value", PAPER, r"0\.0000520",
     "Fisher's exact test, two-sided: p = 0.0000520"),
    ("three uncoded sources named", PAPER, r"[Tt]hree case-level sources (carry no note|without a note)|3 case-level sources without a note",
     "Three case-level sources carry no note and are excluded"),
    ("second read agreement", PAPER, r"70\.0 percent",
     "The two readers agreed on 7 of 10, 70.0 percent"),
    ("second read kappa", PAPER, r"0\.474",
     "Cohen's kappa 0.474 unweighted"),
    # The paper does not use the phrase "no relationship"; it reports the null
    # directly as "is null (p = 1.000)". The first version of this rule searched
    # for the email's wording in the manuscript and reported a real, supported
    # claim as missing. Match the manuscript's own phrasing.
    ("no association with appellate outcome", PAPER,
     r"prevailed on appeal, is null \(p = 1\.000\)",
     "A fourth check found no relationship between the read and whether an agency prevailed"),

    ("employment six of eight", EMPLOY, r"(six of eight|6 of 8|6/8)",
     "sustained in six of eight resolved cases"),
    ("employment two of twelve", EMPLOY, r"(2 of 12|two of twelve)",
     "against two of twelve assessed as complete"),
    ("employment p = 0.0194", EMPLOY, r"0\.0194",
     "p = 0.0194"),
    ("employment sustained coding p = 0.0291", EMPLOY, r"0\.0291",
     "the association holds at p = 0.0291"),
    ("employment 20 met inclusion", EMPLOY, r"20 met the inclusion criteria",
     "Twenty-two matters were screened and 20 met that study's inclusion criteria"),
]

# Vocabulary the emails must NOT contain, because the manuscript does not support
# it. Checked against the email, not the paper.
# Figures the email carried until 2026-08-28, every one of them computed on the
# 22-case SCREENED employment set. The corpus was corrected on 2026-08-24 and the
# analysis runs on 20 matters. Reproduced from live bench_outcomes by
# scripts/recompute_sustained_coding.py, which returns p = 0.0406 on the 22-case
# set: the email quoted its source correctly, and the source was superseded.
#
# This matters more than an ordinary stale number because the email went to a
# federal council under a co-author's name, and one of the two excluded matters
# is a public-records advisory opinion, which is the corpus the email is about.
BANNED_IN_EMAIL = [
    (r"\b0\.041\b", "22-case sustained coding; corrected corpus gives p = 0.0291"),
    (r"one of eight", "22-case cell count; superseded"),
    (r"22 adjudicated", "22 were screened, 20 met the inclusion criteria"),
    (r"odds ratio 21", "22-case sustained coding; superseded"),
    (r"\bpeer[- ]reviewed\b", "the manuscript is under submission, not peer reviewed"),
    (r"\bvalidated\b", "no validation claim is supported"),
    (r"\bproves\b", "the study measures concordance, not proof"),
    # SCOPED TO JRS CLAIMS. A bare /certif/ fired on "I hold professional
    # certifications through SUNY and the New York State Archives", which is
    # Stacyann Young's own credential and is true. The rule exists to stop the
    # STUDY being described as certified, not to stop a co-author describing
    # herself.
    (r"(JRS|standard|study|instrument|method)[^.]{0,40}certif", "no JRS certification exists"),
    (r"certif[^.]{0,40}(JRS|standard|instrument)", "no JRS certification exists"),
    (r"\bdetects? (bias|intent)", "the instrument does neither"),
]

EMAIL = os.path.join(ROOT, "research", "CFOC_Submission_2026-08-08.md")


def read(p):
    if not os.path.exists(p):
        return None
    return io.open(p, encoding="utf-8").read()


def main():
    missing_files = [p for p in {PAPER, EMPLOY, EMAIL} if not os.path.exists(p)]
    if missing_files:
        raise SystemExit("[REQUIRED_ENV_PARAM] source not in the repository: %s"
                         % ", ".join(os.path.relpath(p, ROOT) for p in missing_files))

    bodies = {p: read(p) for p in {PAPER, EMPLOY}}
    failures = []
    print("%-34s %-38s %s" % ("CLAIM", "SOURCE", "RESULT"))
    for label, src, pat, sentence in CLAIMS:
        body = bodies[src]
        ok = re.search(pat, body, re.I) is not None
        print("%-34s %-38s %s" % (label, os.path.relpath(src, ROOT), "OK" if ok else "NOT FOUND"))
        if not ok:
            failures.append("%s: %r not found in %s (email says: %s)"
                            % (label, pat, os.path.relpath(src, ROOT), sentence))

    email = read(EMAIL)
    print()
    print("%-34s %s" % ("BANNED VOCABULARY", "RESULT"))
    for pat, why in BANNED_IN_EMAIL:
        hits = re.findall(pat, email, re.I)
        print("%-34s %s" % (pat, "clean" if not hits else "%d HIT(S)" % len(hits)))
        if hits:
            failures.append("email contains %r (%s)" % (pat, why))

    print()
    if failures:
        print("%d FAILURE(S):" % len(failures))
        for f in failures:
            print("  " + f)
        return 1
    print("All %d claims verified against the manuscripts. Email vocabulary clean."
          % len(CLAIMS))
    return 0


if __name__ == "__main__":
    sys.exit(main())
