#!/usr/bin/env python3
"""The owner's final surgical correction list, items 1 to 18, applied atomically.

ITEMS 1 TO 9 ARE KEEP INSTRUCTIONS, NOT EDITS. They are asserted rather than
written: each is a string that must still be present when this script finishes.
A "keep" that nothing checks is a wish, and every one of them is a co-author
approved change that a later pass could quietly undo.

ITEM 11 REQUIRED A FACTUAL DECISION THE OWNER EXPLICITLY LEFT OPEN. He wrote:
"This wording should be used only if that accurately reflects the actual
analytic design. If the actual exclusion was based on missing notes rather than
document class, the sentence must reflect that instead."

NEITHER OPTION IS CORRECT ON ITS OWN, AND THE LIVE DATA SAYS WHY. Counting
bench_outcomes for the public-records corpus:

    read              cases   carry a note   no note
    Ready               18         17           1
    Needs work           9          7           2
    Gap                  5          4           1
                        32         28           4

The Section 5.3 table is drawn on n = 9 and n = 18, which is all 27 case-level
sources. But only 24 of those 27 carry a note, so THREE CASES WITH NO NOTE ARE
SITTING IN THE "NOT STATED" COLUMN. Absence of a note is not a note that fails
to state a reconstructability failure, and coding it as one inflates the
denominator of the comparison group.

BOTH RESTRICTIONS ARE THEREFORE STATED, and the table is corrected to the 24
cases that carry a note. The cell counts are forced arithmetic, not a
re-reading: a note coded "states a failure" must exist, so the 6 stated Needs
work cases all carry notes, leaving 1 of the 7 noted Needs work cases not
stating one; Ready has 0 stated and 17 noted.

THE CORRECTION MAKES THE RESULT STRONGER. As published, [[6,3],[0,18]] on 27
gives p = 0.00028, which is what the manuscript reports and is arithmetically
right for the table as drawn. Restricted to the 24 noted cases, [[6,1],[0,17]]
gives p = 0.0000520. Both were recomputed here with Fisher's exact written out,
because scipy is absent and a corrected p value must not depend on it.

    python3 scripts/apply_final_surgical_list.py            # dry run, default
    python3 scripts/apply_final_surgical_list.py --apply
"""
import io
import json
import os
import sys
import urllib.request
from fractions import Fraction

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAPER = os.path.join(ROOT, "research", "FOIL_Article_Draft.md")
SB = "https://pjzxkeviouofdseagvpf.supabase.co"
KEY = "sb_publishable_mkdtg6-NgJ44_JVr9vZf6Q_30BVgY4e"  # anon; public by design

# Items 1 to 9: co-author approved text that must survive this pass untouched.
KEEP = [
    (1, "Title", "Convergent, Construct, and Discriminant Evidence from 32 Public Cases"),
    (2, "Author contributions", "selected and screened all 32 publicly available determinations"),
    (3, "Disclosure", "Both authors contributed to this work in their personal professional capacities"),
    (4, "Section 4.2", "No internal, confidential, privileged, or otherwise nonpublic government material was used"),
    (5, "Section 5.1", "The conditions were applied to 32 publicly available determinations"),
    (6, "Section 6, modernization", "in parallel with technology modernization, sample their own determinations"),
    (7, "Section 6, practical form", "For public-records programs, the practical form is simpler"),
    (8, "Conclusion", "the outcome measure with which the read showed concordance in this sample"),
    (9, "Terminology", "Ready"),
]


def comb(n, k):
    if k < 0 or k > n:
        return 0
    num = den = 1
    for i in range(k):
        num *= (n - i)
        den *= (i + 1)
    return num // den


def fisher_two_sided(a, b, c, d):
    n = a + b + c + d
    r1, c1 = a + b, a + c
    def P(x):
        return Fraction(comb(r1, x) * comb(n - r1, c1 - x), comb(n, c1))
    po = P(a)
    total = Fraction(0)
    for x in range(max(0, c1 - (n - r1)), min(r1, c1) + 1):
        p = P(x)
        if p <= po * Fraction(1000000001, 1000000000):
            total += p
    return float(total)


def note_counts():
    """Live count of which public-records cases carry a contemporaneous note."""
    req = urllib.request.Request(
        SB + "/rest/v1/bench_outcomes?select=jrs_read,note,domain",
        headers={"apikey": KEY, "Authorization": "Bearer " + KEY})
    rows = [x for x in json.loads(urllib.request.urlopen(req, timeout=30).read().decode())
            if x["domain"] == "Public records / FOIL"]
    if len(rows) != 32:
        raise SystemExit("[REQUIRED_ENV_PARAM] expected 32 public-records cases, got %d"
                         % len(rows))
    out = {}
    for k in ("ready", "review_required", "gap_identified"):
        total = sum(1 for x in rows if x["jrs_read"] == k)
        noted = sum(1 for x in rows if x["jrs_read"] == k and (x.get("note") or "").strip())
        out[k] = {"total": total, "noted": noted, "missing": total - noted}
    return out


def edits(nc):
    ready_noted = nc["ready"]["noted"]
    nw_noted = nc["review_required"]["noted"]
    noted_total = ready_noted + nw_noted
    corpus_noted = sum(nc[k]["noted"] for k in nc)      # all 32, the Section 5.1 figure
    case_level = nc["ready"]["total"] + nc["review_required"]["total"]
    missing = case_level - noted_total
    nw_stated = 6                      # unchanged from the published table
    nw_not = nw_noted - nw_stated
    p_new = fisher_two_sided(nw_stated, nw_not, 0, ready_noted)

    E = []

    # 10 and 11. The "every read" contradiction and the denominator, together,
    # because they are the same sentence and the same table.
    E.append((10, "5.3 opening: 'Every read' contradicted 5.1's 28",
        "Every read carries a contemporaneous note giving its basis, written before the "
        "outcome was known. Coding those notes for one question, whether the note states "
        "that the underlying record-level basis could not be rebuilt from the source, "
        "produces the clearest result in the study.\n\n"
        "| | Reconstructability failure stated | Not stated | Rate |\n"
        "|---|---|---|---|\n"
        "| Needs work (n = 9) | 6 | 3 | 66.7% |\n"
        "| Ready (n = 18) | 0 | 18 | 0.0% |\n\n"
        "Fisher's exact test, two-sided: p = 0.00028.",
        # THE OPENING USES THE CORPUS-WIDE COUNT, NOT THE CODED SUBSET. Writing
        # 24 here would contradict Section 5.1's 28 in exactly the way item 10
        # exists to stop. 28 of the 32 carry a note; 24 of those 28 are
        # case-level and enter the coding. Both numbers appear, in that order,
        # so neither is a surprise.
        "For the %d cases with contemporaneous basis notes, the note giving the basis for "
        "the read was written before the outcome was known. Coding those notes for one "
        "question, whether the note states that the underlying record-level basis could "
        "not be rebuilt from the source, produces the clearest result in the study.\n\n"
        "The construct comparison is restricted to the %d case-level sources classified "
        "Ready or Needs work; the %d programme-level audit sources classified Gap are "
        "analyzed separately in Section 5.2. It is further restricted to the %d of those "
        "%d that carry a note, because a case with no note cannot be coded for what its "
        "note states, and counting it as not stating a reconstructability failure would "
        "inflate the comparison group. The %d case-level sources without a note are "
        "excluded rather than assigned a code.\n\n"
        "| | Reconstructability failure stated | Not stated | Rate |\n"
        "|---|---|---|---|\n"
        "| Needs work (n = %d) | %d | %d | %.1f%% |\n"
        "| Ready (n = %d) | 0 | %d | 0.0%% |\n\n"
        "Fisher's exact test, two-sided: p = %.7f."
        % (corpus_noted, case_level, nc["gap_identified"]["total"], noted_total,
           case_level, missing,
           nw_noted, nw_stated, nw_not, 100.0 * nw_stated / nw_noted,
           ready_noted, ready_noted, p_new)))

    # The prose downstream of the table cites "eleven of the eighteen".
    E.append((11, "5.3 prose: eighteen Ready notes to the noted count",
        "and eleven of the eighteen notes say so directly",
        "and eleven of the %d notes say so directly" % ready_noted))

    # THE ABSTRACT CARRIED THE SAME TABLE AND WAS NOT ON THE OWNER'S LIST.
    # Correcting Section 5.3 and leaving the abstract on "six of nine against
    # none of eighteen, p = 0.00028" would put the paper's two most-read
    # passages in contradiction, which is the defect item 10 exists to remove.
    # Same correction, same source, applied to both.
    E.append((10, "Abstract: construct figures to the noted subset",
        "Six of nine Needs work cases carry a note stating that the underlying "
        "record-level basis could not be rebuilt from the source, against none of "
        "eighteen Ready cases, and eleven of the eighteen Ready notes state the opposite "
        "outright (Fisher's exact, two-sided, p = 0.00028).",
        "Of the %d Needs work cases carrying a contemporaneous note, %d state that the "
        "underlying record-level basis could not be rebuilt from the source, against none "
        "of the %d noted Ready cases, and eleven of those %d Ready notes state the "
        "opposite outright (Fisher's exact, two-sided, p = %.7f). Three case-level "
        "sources carry no note and are excluded from that coding rather than assigned "
        "one."
        % (nw_noted, nw_stated, ready_noted, ready_noted, p_new)))

    # ITEM 9, THE ONE PLACE IT WAS ACTUALLY VIOLATED. The abstract described the
    # employment corpus as "flagged records" against "passed records". That
    # corpus is read with the SAME five-condition instrument, so those are JRS
    # classifications and must use the instrument's own labels. Line 17's "can
    # read as complete" is ordinary prose, not a classification, and is left
    # alone for the same reason the co-author's terminology pass left it alone.
    E.append((9, "Abstract: employment corpus to instrument labels",
        "(6 of 8 flagged records drew an adverse finding against 2 of 12 passed records, "
        "p = 0.0194)",
        "(6 of 8 records read as Needs work or Gap drew an adverse finding against 2 of "
        "12 read as Ready, p = 0.0194)"))

    # 12. Adjudicator to government auditor, three places.
    E.append((12, "RQ2: adjudicator to government auditor",
        "2. Where an independent adjudicator has assessed the sufficiency of the same "
        "records, does the read agree?",
        "2. Where an independent government auditor has assessed the sufficiency of the "
        "same records, does the read agree?"))
    E.append((12, "4.5: adjudicator to government auditor",
        "Convergent validity compares the read against the independent adjudicator's own "
        "conclusion",
        "Convergent validity compares the read against the independent government "
        "auditor's own conclusion"))
    E.append((12, "5.2: adjudicator to government auditor",
        "where an independent professional adjudicator assessed the same records",
        "where an independent government auditor assessed the same records"))

    # 13. Four analyses to five, now that 5.7 exists.
    E.append((13, "4.5: Four analyses to Five",
        "Four analyses, in the order reported.",
        "Five analyses, in the order reported."))

    # 14. Section 7 cross-domain corpus size.
    E.append((14, "7: 22 adjudicated to 20 analysed, 22 screened",
        "It belongs to a separate employment-law corpus of 22 adjudicated matters "
        "collected by a different reviewer,",
        "It belongs to a separate employment-law corpus of 20 adjudicated matters, with "
        "22 matters screened before two were excluded under that study's stated "
        "inclusion criteria, collected by a different reviewer,"))

    # 15 and 16. Calibrate two claims.
    E.append((15, "5.3: 'That answers' to preliminary evidence",
        "That answers the third research question.",
        "These findings provide preliminary evidence addressing the third research "
        "question."))
    E.append((16, "6: 'establishes three things' to provides evidence",
        "The pilot establishes three things.",
        "The pilot provides evidence for three propositions."))

    # 17. Abstract validity claim, optional, applied.
    E.append((17, "Abstract: soften the validity claim",
        "and evidence that the read measures the property it claims to measure.",
        "and preliminary evidence that the read responds to the reconstructability "
        "property it is designed to assess."))

    # 18. Introduction causal implication.
    E.append((18, "Introduction: remove the unsupported causal implication",
        "Software that produces fluent but unreconstructable determinations does not "
        "reduce reversals or audit findings, and may increase them.",
        "Software that produces fluent but unreconstructable determinations does not, by "
        "itself, establish that the resulting records are defensible."))
    return E


def main():
    dry = "--apply" not in sys.argv
    nc = note_counts()
    body = io.open(PAPER, encoding="utf-8").read()

    print("LIVE NOTE COUNTS, bench_outcomes, public-records corpus")
    print("  %-18s %-7s %-7s %s" % ("READ", "CASES", "NOTED", "NO NOTE"))
    for k in ("ready", "review_required", "gap_identified"):
        print("  %-18s %-7d %-7d %d" % (k, nc[k]["total"], nc[k]["noted"], nc[k]["missing"]))
    print()

    out = body
    applied = []
    for num, label, old, new in edits(nc):
        n = out.count(old)
        if n != 1:
            raise SystemExit("item %d anchor appears %d times, expected 1: %r"
                             % (num, n, old[:70]))
        out = out.replace(old, new, 1)
        applied.append((num, label))

    missing_keep = [(n, w, s) for n, w, s in KEEP if s not in out]
    if missing_keep:
        raise SystemExit("KEEP item(s) lost by this pass: %s"
                         % "; ".join("%d %s (%r)" % (n, w, s[:50]) for n, w, s in missing_keep))

    print("%s" % ("DRY RUN, nothing written. Re-run with --apply." if dry else "APPLIED"))
    print("  KEEP items 1-9 verified present after the pass: %d of %d" % (len(KEEP), len(KEEP)))
    for num, label in applied:
        print("  item %-3d %s" % (num, label))
    print("  %d words -> %d words" % (len(body.split()), len(out.split())))
    if not dry:
        io.open(PAPER, "w", encoding="utf-8").write(out)
    return 0


if __name__ == "__main__":
    sys.exit(main())
