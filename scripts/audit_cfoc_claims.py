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
# Figures the emails MUST now carry, because an email preserved in an
# administrative record and the eventual publication have to describe the same
# study. Checked against the EMAIL, not the manuscript.
REQUIRED_IN_EMAIL = [
    (r"32 publicly available public-records cases|32 publicly available cases",
     "corpus size and public-source framing"),
    (r"seven Needs work cases carrying a contemporaneous basis note",
     "the construct denominator is the noted subset, not all nine"),
    (r"none of the 17 noted Ready cases", "the Ready denominator is 17, not 18"),
    (r"p = 0\.0000520", "the corrected construct p value"),
    (r"six of seven cases", "the structural comparison as the manuscript reports it"),
    (r"p = 0\.00466", "the structural p value"),
    (r"p = 1\.000", "the specification check is reported, not omitted"),
    (r"6 of 8 records read as Needs work or Gap", "companion corpus, instrument labels"),
    (r"2 of 12 records read as Ready", "companion corpus, instrument labels"),
    (r"p = 0\.0194", "companion primary result"),
    (r"p = 0\.0291", "companion resolved-disposition result"),
    (r"personal professional capacity", "capacity statement"),
    (r"does not represent the views, policies, or practices of the City of New York",
     "institutional separation"),
    (r"No internal or nonpublic government materials were used",
     "materials statement"),
    (r"five of five", "auditor concordance in the second email"),
]

BANNED_IN_EMAIL = [
    (r"\bpartial assessments\b", "superseded terminology; the instrument codes "
                                  "Ready, Needs work and Gap"),
    (r"assessed as complete", "superseded terminology"),
    (r"\bI applied it to\b", "attributes the whole 32-case study to one author"),
    (r"can send the current draft on request", "superseded status language"),
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
# The clean text that actually goes out. It must carry every required figure and
# none of the working notes, and it must not carry a second signature: the
# owner's decision of 2026-08-28 is that Stacyann sends both emails alone.
SEND_COPY = os.path.join(ROOT, "research", "CFOC_Emails_SEND_COPY_2026-08-28.md")
BANNED_IN_SEND_COPY = [
    (r"Phillip Wikes", "Email 1 must not carry a second signature when the "
                       "stated arrangement is that Stacyann sends alone"),
    (r"Working notes|Send note", "editorial material must not travel with the "
                                 "correspondence"),
    (r"currently under submission", "overstates the article's status while it is "
                                    "still being submitted"),
]


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
    flat_email = re.sub(r"\s+", " ", email)
    print()
    print("%-52s %s" % ("REQUIRED IN THE EMAILS", "RESULT"))
    for pat, why in REQUIRED_IN_EMAIL:
        ok = re.search(pat, flat_email) is not None
        print("%-52s %s" % (pat[:52], "present" if ok else "MISSING"))
        if not ok:
            failures.append("email is missing %r (%s)" % (pat, why))
    print()
    print("%-34s %s" % ("BANNED VOCABULARY", "RESULT"))
    for pat, why in BANNED_IN_EMAIL:
        hits = re.findall(pat, email, re.I)
        print("%-34s %s" % (pat, "clean" if not hits else "%d HIT(S)" % len(hits)))
        if hits:
            failures.append("email contains %r (%s)" % (pat, why))

    send = read(SEND_COPY)
    if send is None:
        failures.append("the send copy %s does not exist"
                        % os.path.relpath(SEND_COPY, ROOT))
    else:
        flat_send = re.sub(r"\s+", " ", send)
        print()
        print("%-52s %s" % ("SEND COPY", "RESULT"))
        for pat, why in REQUIRED_IN_EMAIL:
            ok = re.search(pat, flat_send) is not None
            print("%-52s %s" % ("carries " + pat[:43], "present" if ok else "MISSING"))
            if not ok:
                failures.append("send copy is missing %r (%s)" % (pat, why))
        for pat, why in BANNED_IN_SEND_COPY:
            hits = re.findall(pat, flat_send)
            print("%-52s %s" % ("free of " + pat[:43], "clean" if not hits else "%d HIT(S)" % len(hits)))
            if hits:
                failures.append("send copy contains %r (%s)" % (pat, why))

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
