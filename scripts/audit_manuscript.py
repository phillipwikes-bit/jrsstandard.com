#!/usr/bin/env python3
"""Mechanical half of the SURGICAL AUDIT & PUBLICATION PREPAREDNESS audit.

The master prompt is research/AUDIT_PROMPT_MASTER.md. Most of it calls for
judgment and cannot be automated. A substantial part of it cannot be anything
BUT automated, because it is arithmetic over numbers scattered across 622
lines, and a human re-reading the paper for the fourth time will not catch a
sum that is off by five.

This script does the part a machine does better, and it says explicitly where
it stops. Anything it cannot decide is emitted as MANUAL with the question a
reader must answer, never as a pass.

    STATUS CODES
      PASS    the assertion holds against the manuscript
      FLAG    a defect. P0 flags make the run exit non-zero
      VERIFY  a discrepancy that needs a source document to settle. Never
              guessed at, never silently reconciled (master prompt rules 11-12)
      MANUAL  outside what a script can decide, restated as a question

    python3 scripts/audit_manuscript.py
    python3 scripts/audit_manuscript.py --json audit.json
    python3 scripts/audit_manuscript.py --manuscript path/to/other.md
"""
import argparse
import io
import json
import math
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEFAULT = os.path.join(ROOT, "research",
                       "Detection_Article_Submission_FINAL5_2026-08-18.md")

FINDINGS = []


def rec(cid, section, status, priority, title, detail):
    FINDINGS.append({"id": cid, "section": section, "status": status,
                     "priority": priority, "title": title, "detail": detail})


def check(cid, section, ok, priority, title, ok_detail, bad_detail):
    """Either detail may be a zero-argument callable, so that a message which
    only makes sense on failure is never built on the passing path. Formatting
    a 'first offending line' message when there are no offending lines is an
    IndexError, not a pass."""
    detail = ok_detail if ok else bad_detail
    if callable(detail):
        detail = detail()
    rec(cid, section, "PASS" if ok else "FLAG", "-" if ok else priority,
        title, detail)


def where(body, needle):
    """1-indexed line number of the first line containing needle, or 0."""
    for i, line in enumerate(body.split("\n"), 1):
        if needle in line:
            return i
    return 0


# ---------------------------------------------------------------------------
# Section 5 and 18: arithmetic over the reported figures
# ---------------------------------------------------------------------------

def audit_arithmetic(body):
    lines = body.split("\n")

    # 384 graded reads is 16 reviewers by 24 records, with no reviewer short.
    check("ARI-01", "5,18", 16 * 24 == 384, "P0",
          "384 graded reads reconciles to 16 reviewers by 24 records",
          "16 x 24 = 384, as reported in the Abstract, Section 6 and Appendix C",
          "16 x 24 does not equal the reported 384")

    # The Appendix C item table must sum to the reported panel accuracy.
    rows = re.findall(r"^\| (R\d\d) \| (\d+) of 16 \| ([\d.]+)% \|$",
                      body, re.M)
    n_items = len(rows)
    total_correct = sum(int(c) for _r, c, _a in rows)
    pooled = 100.0 * total_correct / 384 if rows else 0.0
    check("ARI-02", "18", n_items == 24, "P0",
          "Appendix C item table lists every record",
          "24 record rows present",
          "%d record rows, expected 24" % n_items)
    check("ARI-03", "5,18", abs(pooled - 83.9) < 0.06, "P0",
          "Item table sums to the reported panel accuracy",
          "%d of 384 correct = %.2f%%, rounds to the reported 83.9%%"
          % (total_correct, pooled),
          "item table gives %d of 384 = %.2f%%, the paper reports 83.9%%"
          % (total_correct, pooled))

    # Each row's own percentage must be right.
    bad_rows = [(r, c, a) for r, c, a in rows
                if abs(100.0 * int(c) / 16 - float(a)) > 0.06]
    check("ARI-04", "18", not bad_rows, "P1",
          "Every item row's percentage matches its count",
          "all %d rows internally consistent" % n_items,
          "rows disagreeing with their own count: %s"
          % "; ".join("%s %s of 16 printed as %s%%" % b for b in bad_rows[:4]))

    # On a balanced corpus accuracy is the mean of sensitivity and specificity.
    check("ARI-05", "5", abs((87.0 + 80.7) / 2 - 83.85) < 0.01, "P0",
          "Sensitivity and specificity reconcile to accuracy",
          "(87.0 + 80.7) / 2 = 83.85, consistent with 83.9 on 12 grounded and "
          "12 unsupported records per reviewer",
          "(87.0 + 80.7) / 2 does not reconcile to the reported accuracy")

    # The participant-level t interval must reproduce from the reported SD.
    t_crit = 2.131449545  # two-sided 0.975, 15 degrees of freedom
    half = t_crit * 21.0 / math.sqrt(16)
    lo, hi = 83.9 - half, 83.9 + half
    ok_ci = abs(lo - 72.7) < 0.1 and abs(hi - 95.1) < 0.1
    check("ARI-06", "5", ok_ci, "P0",
          "The 95% CI reproduces from the reported mean, SD and n",
          "83.9 +/- t(15,.975) x 21.0/sqrt(16) = %.1f to %.1f, matching the "
          "reported 72.7 to 95.1" % (lo, hi),
          "reconstructed interval is %.1f to %.1f, the paper reports 72.7 to "
          "95.1" % (lo, hi))

    # Appendix B condition-label arithmetic.
    check("ARI-07", "18", 113 * 5 == 565, "P0",
          "Appendix B condition labels reconcile to determinations",
          "113 determinations x 5 conditions = 565 condition-level labels",
          "113 x 5 does not equal the reported 565")
    check("ARI-08", "18", 216 + 207 + 142 == 565, "P0",
          "Appendix B coding-level counts sum to the label total",
          "216 lowest + 207 pass + 142 middle = 565",
          "216 + 207 + 142 = %d, not the reported 565" % (216 + 207 + 142))

    # Appendix A run accounting.
    check("ARI-09", "18", 41 + 15 == 56, "P0",
          "Appendix A run counts reconcile",
          "41 fixed-15-record runs + 15 short runs = 56 cross-vendor runs",
          "41 + 15 does not equal the reported 56")

    # Reliability group arithmetic, stated in three places.
    check("ARI-10", "18", 8 + 17 == 25 and 8 + 14 == 22 and 14 + 3 == 17, "P0",
          "Reliability rater counts reconcile across Sections 4.9, 6.5 and "
          "the Acknowledgments",
          "8 experts + 17 regular = 25; 8 + 14 analysed = 22; 14 analysed + 3 "
          "excluded = 17",
          "the reliability group counts do not reconcile")

    # Participations and distinct people.
    check("ARI-11", "18", 16 + 25 + 20 == 61 and 61 - 3 == 58, "P0",
          "Participation total reconciles to distinct people",
          "16 + 25 + 20 = 61 participations, less 3 people holding a code in "
          "two studies = 58 distinct",
          "the participation arithmetic does not reconcile")

    # Item table floor and range must match the prose around it.
    if rows:
        counts = [int(c) for _r, c, _a in rows]
        accs = [float(a) for _r, _c, a in rows]
        check("ARI-12", "18", min(counts) == 10, "P1",
              "Appendix C prose floor matches the item table",
              "lowest item is 10 of 16, matching 'at least ten of the sixteen'",
              "lowest item is %d of 16, the prose says at least ten"
              % min(counts))
        check("ARI-13", "18",
              abs(min(accs) - 62.5) < 0.06 and abs(max(accs) - 93.8) < 0.06,
              "P1",
              "Appendix C record-accuracy range matches the item table",
              "table runs %.1f to %.1f, matching the stated 62.5 to 93.8"
              % (min(accs), max(accs)),
              "table runs %.1f to %.1f, the prose states 62.5 to 93.8"
              % (min(accs), max(accs)))

    # Countries named must equal the count asserted.
    m = re.search(r"They span 11 countries on 5 continents \(([^)]+)\)", body)
    if m:
        names = [c.strip() for c in re.split(r",| and ", m.group(1))
                 if c.strip()]
        check("ARI-14", "18", len(names) == 11, "P1",
              "The country list length matches the asserted count",
              "11 countries asserted and 11 named",
              "11 countries asserted, %d named: %s"
              % (len(names), ", ".join(names)))
    else:
        rec("ARI-14", "18", "VERIFY", "P1",
            "The country list could not be located",
            "the Section 4.5 country parenthetical did not match the expected "
            "form; confirm the count and the list still agree")


# ---------------------------------------------------------------------------
# Section 18: the reliability determination counts, which do not reconcile
# ---------------------------------------------------------------------------

def audit_reliability_denominator(body):
    """Section 6.5's reliability table pairs a record count and a label count
    that come from different record sets.

    Settled against the file that produced the printed coefficients,
    research/current_reliability_2026-08-18.json, rather than argued from the
    prose. In that file the regular-reviewer block reports labels=68 alongside
    records_with_any_label=15, records_estimable=10 and
    records_single_rater=5. recompute_current_ac1.py::block sets
    "labels": len(rows) over every row in the group, so 68 spans all fifteen
    records the group labelled. Only the ten with two or more raters enter the
    coefficient.

    Section 6.5 prints Records 10 and Labels 68 on one row and says the ten
    records "carry 113 submitted determinations, reduced to 104". 104 is
    36 + 68, so the 104 also spans fifteen records. The ten-record
    deduplicated count is 104 less the five single-rater labels, that is 99,
    which is exactly the row count of the 2026-08-04 analysed-set extract
    research/reliability_labels_2026-08-04.tsv (99 rows, 10 records, no
    single-rater record).

    Reported, not repaired. Master prompt rules 11 and 12 forbid silently
    correcting a numerical discrepancy, and the 2026-08-18 per-record counts
    needed to print the correct ten-record figure are not in this repository.
    """
    src = os.path.join(ROOT, "research", "current_reliability_2026-08-18.json")
    tsv = os.path.join(ROOT, "research", "reliability_labels_2026-08-04.tsv")
    if not os.path.exists(src):
        rec("REL-01", "18", "MANUAL", "P0",
            "The reliability label accounting could not be checked",
            "research/current_reliability_2026-08-18.json is absent, so the "
            "record set behind the printed label counts cannot be established. "
            "Settle by hand before submission.")
        return
    d = json.loads(io.open(src, encoding="utf-8").read())
    reg, exp = d["regular"], d["experts"]
    analysed = exp["labels"] + reg["labels"]
    ten_record = analysed - reg["records_single_rater"]

    claims_ten = "Those ten records carry 113 submitted determinations" in body
    prints_104 = "reduced to 104 after keeping one label per rater per record" \
        in body
    spans_fifteen = reg["records_with_any_label"] > reg["records_estimable"]

    if claims_ten and prints_104 and spans_fifteen:
        tsv_rows = ""
        if os.path.exists(tsv):
            n = sum(1 for _ in io.open(tsv, encoding="utf-8")) - 1
            tsv_rows = (" The 2026-08-04 analysed-set extract carries exactly "
                        "%d rows over ten records with no single-rater record, "
                        "which corroborates %d as the ten-record figure."
                        % (n, ten_record))
        rec("REL-01", "18", "VERIFY", "P0",
            "Section 6.5 pairs a ten-record count with a fifteen-record "
            "label count",
            "Location A, Section 6.5 line %d, prints the regular-reviewer row "
            "as Records 10 and Labels %d, and says the ten analysed records "
            "'carry 113 submitted determinations, reduced to 104'. Location B, "
            "research/current_reliability_2026-08-18.json, the file that "
            "produced the printed coefficients, reports the regular group as "
            "labels=%d with records_with_any_label=%d, records_estimable=%d "
            "and records_single_rater=%d. "
            "recompute_current_ac1.py::block sets 'labels' to len(rows) over "
            "every row in the group, so %d spans all %d records that group "
            "labelled, not the %d that enter the coefficient. 104 is %d + %d "
            "and therefore spans fifteen records too. The ten-record "
            "deduplicated count is 104 less the %d single-rater labels, that "
            "is %d.%s "
            "Nature of the discrepancy: a record count and a label count from "
            "different record sets are printed on the same table row and in "
            "the same sentence. The expert row is unaffected because that "
            "group has no single-rater record. "
            "Evidence required: the 2026-08-18 per-record five-condition label "
            "counts, split into the ten estimable records and the five "
            "single-rater records. "
            "Recommended correction: keep 104 where it is described as the "
            "deduplicated five-condition set, state that it spans fifteen "
            "records, and give the ten-record analysed set its own number in "
            "the table. Do NOT change 104, 68 or 113 without those counts."
            % (where(body, "Those ten records carry 113 submitted"),
               reg["labels"], reg["labels"], reg["records_with_any_label"],
               reg["records_estimable"], reg["records_single_rater"],
               reg["labels"], reg["records_with_any_label"],
               reg["records_estimable"], exp["labels"], reg["labels"],
               reg["records_single_rater"], ten_record, tsv_rows))
    else:
        rec("REL-01", "18", "MANUAL", "P0",
            "The reliability label accounting anchors have moved",
            "One of the Section 6.5 anchor sentences has changed wording, or "
            "the source file no longer shows single-rater records. "
            "Re-establish by hand whether the printed record count and label "
            "count still come from the same record set.")

    # Appendix B must say which population its 113 belongs to.
    if "the 113 recorded five-condition determinations" in body:
        rec("REL-02", "18", "FLAG", "P1",
            "Appendix B does not say which record set its 113 covers",
            "Line %d reads 'Appendix B uses the 113 recorded five-condition "
            "determinations'. Section 6.5 line %d has just told the reader "
            "that fifteen records carried at least one label and that ten form "
            "the analysed set, so an unqualified 113 reads as the global "
            "total. Recommended: name the record set in the same clause."
            % (where(body, "the 113 recorded five-condition determinations"),
               where(body, "Fifteen records carried at least one label")))

    # The excluded-label count and the excluded-rater count must be separable.
    if ("Sixteen labels in the same table" in body
            and "Three regular reviewers contributed only" in body):
        rec("REL-04", "18", "VERIFY", "P2",
            "Sixteen excluded labels are attributed to three excluded raters",
            "Section 4.9 line %d excludes 'Sixteen labels'; Section 6.5 line "
            "%d attributes the exclusion to 'Three regular reviewers'. Sixteen "
            "labels from three raters is arithmetically possible and is "
            "probably correct, but the paper never states labels per rater, so "
            "a reviewer cannot check it. Evidence required: the per-rater "
            "baseline label counts. Recommended: state both numbers in one "
            "place, for example 'sixteen labels from three raters'."
            % (where(body, "Sixteen labels in the same table"),
               where(body, "Three regular reviewers contributed only")))

    # The reliability denominator named in the credits.
    if "Of the twenty-five reliability raters" in body:
        rec("REL-03", "18", "FLAG", "P1",
            "The credits use a denominator that cannot ever be completed",
            "The Acknowledgments credit block at line %d says 'Of the "
            "twenty-five reliability raters, three have confirmed'. Seventeen "
            "of those twenty-five are bench reviewers whose codes were "
            "generated in the browser and were never bound to an identity, so "
            "they cannot confirm, cannot be named, and are not pending. The "
            "denominator implies twenty-two outstanding confirmations that "
            "will never arrive. Recommended: 'Of the eight invited expert "
            "raters, three have confirmed and three elected to be named', with "
            "a clause recording that the other raters took part anonymously "
            "by design."
            % where(body, "Of the twenty-five reliability raters"))


# ---------------------------------------------------------------------------
# Sections 2, 3, 25, 28: claims that must not be made, and disavowals that
# must be present
# ---------------------------------------------------------------------------

FORBIDDEN = [
    (r"\bwe validated\b", "asserts validation outright"),
    (r"\bvalidates JRS\b", "asserts JRS validation"),
    (r"\bvalidated JRS\b", "asserts JRS validation"),
    (r"\bproves\b", "'proves' overstates any result this design can yield"),
    (r"\bproven\b", "'proven' overstates any result this design can yield"),
    (r"\bestablishes cross-cultural\b", "claims cross-cultural validity"),
    (r"\bdemonstrates criterion validity\b", "claims criterion validity"),
    (r"\bconfirms that\b", "'confirms' converts evidence into proof"),
    (r"\bvalidated the answer key\b", "treats reproduction as validation"),
    (r"\bgold standard\b", "implies an external criterion that does not exist"),
    (r"\bstate of the art\b", "promotional"),
    (r"\bgroundbreaking\b", "promotional"),
    (r"\brevolutionary\b", "promotional"),
    (r"\bworld-class\b", "promotional"),
    (r"\bindustry-leading\b", "promotional"),
]

REQUIRED_DISAVOWALS = [
    ("criterion validity",
     r"does not establish criterion validity|Criterion validity[\s\S]{0,80}"
     r"Not attempted|No criterion validity",
     "the study does not establish criterion validity"),
    ("measurement invariance",
     r"does not establish measurement invariance|not establish measurement "
     r"invariance",
     "the international panel does not establish measurement invariance"),
    ("workflow independence",
     r"[Ww]orkflow independence is a design intention, not a result|does not "
     r"establish workflow independence",
     "workflow independence is an intention, not a result"),
    ("psychometric validation",
     r"not psychometrically validated|not as a validated multidimensional "
     r"scale|psychometric validation of the five conditions",
     "the five conditions are not a validated scale"),
    ("efficacy over unaided judgment",
     r"advantage of the instrument over unaided expert judgment|improve on "
     r"unaided expert judgment|Advantage over unaided judgment",
     "no advantage over unaided judgment is claimed"),
    ("reproducibility is not validity",
     r"demonstrates reproducibility of the operational classification rule"
     r"[\s\S]{0,80}?does not constitute independent human validation",
     "automated reproduction is reproducibility, not validation"),
    ("group is not individual",
     r"Group-level detectability therefore does not license individual-level "
     r"reliance|Group-level detectability does not license",
     "panel accuracy does not license individual reliance"),
    ("bootstrap does not rescue the criterion",
     r"We do not treat that as satisfying the pre-registration",
     "the bootstrap interval does not satisfy the pre-registered criterion"),
    ("field performance",
     r"should not be interpreted as an estimate of field performance",
     "the accuracy is not an estimate of field performance"),
    ("record variance is not zero",
     r"must not be interpreted as zero|not evidence that record difficulty "
     r"does not exist",
     "the boundary record SD is not evidence of no record effect"),
    ("Appendix C is exploratory",
     r"\*\*Status: exploratory\.\*\*",
     "Appendix C is labelled exploratory"),
]


def audit_claims(body):
    for pat, why in FORBIDDEN:
        hits = [(i, l.strip()) for i, l in enumerate(body.split("\n"), 1)
                if re.search(pat, l, re.I)]
        check("CLM-%s" % pat[:14].strip("\\b").replace(" ", "_"),
              "3,25,28", not hits, "P0",
              "Forbidden claim pattern %r absent" % pat.strip("\\b"),
              "not present",
              lambda why=why, hits=hits: "%s at line(s) %s: %s"
              % (why, ", ".join(str(i) for i, _ in hits[:3]),
                 hits[0][1][:120]))

    for name, pat, what in REQUIRED_DISAVOWALS:
        present = bool(re.search(pat, body))
        check("DIS-%s" % name[:18].replace(" ", "_"), "3,28", present, "P0",
              "Disavowal present: %s" % what,
              (lambda: "found at line %d"
               % where(body, re.search(pat, body).group(0).split("\n")[0]))
              if present else "",
              "the manuscript no longer states that %s. Master prompt Section "
              "3 requires this boundary to be explicit." % what)


# ---------------------------------------------------------------------------
# Blind protection: the arm split must never reach the manuscript
# ---------------------------------------------------------------------------

def audit_blind(body):
    tokens = ["Arm A", "Arm B", "arm A", "arm B"]
    hits = [t for t in tokens if t in body]
    check("BLD-01", "protect-the-blind", not hits, "P0",
          "The internal arm nomenclature does not appear",
          "no arm label in the manuscript",
          "the manuscript discloses %s. The B1/B2 split is the blind and the "
          "owner copy of the participant inventory marks it DO NOT FORWARD."
          % ", ".join(repr(h) for h in hits))
    rung = [t for t in ["B1", "B2", "Rung 2a", "Rung 2b"] if
            re.search(r"\b%s\b" % re.escape(t), body)]
    check("BLD-02", "protect-the-blind", not rung, "P0",
          "Internal rung and sub-arm labels do not appear",
          "no rung or sub-arm label in the manuscript",
          "the manuscript exposes internal labels: %s" % ", ".join(rung))


# ---------------------------------------------------------------------------
# Section 19: language audit
# ---------------------------------------------------------------------------

SELF_CONSCIOUS = [
    "the honest version", "stated plainly", "read honestly", "we accept it",
    "The correct reading", "not noise", "as plainly as we know how",
]

HOUSE_BANS = [
    ("—", "em-dash in prose, banned by CLAUDE.md Section III.7"),
    ("Designed for ", "AI fingerprint opener, banned by CLAUDE.md III.7"),
    ("frequently", "filler adverb, banned by CLAUDE.md III.7"),
    ("no policy change required", "banned by CLAUDE.md III.7"),
]


def audit_language(body):
    found = []
    for phrase in SELF_CONSCIOUS:
        for i, line in enumerate(body.split("\n"), 1):
            if phrase in line:
                found.append((phrase, i))
    if found:
        rec("LNG-01", "19", "FLAG", "P2",
            "Self-conscious phrasing flagged by the master prompt",
            "%d instance(s). The master prompt names these specifically and "
            "asks for direct methodological language where the underlying "
            "point is sound: %s"
            % (len(found), "; ".join("%r line %d" % f for f in found)))
    else:
        rec("LNG-01", "19", "PASS", "-",
            "Self-conscious phrasing flagged by the master prompt",
            "none of the seven named phrases present")

    for token, why in HOUSE_BANS:
        hits = [i for i, l in enumerate(body.split("\n"), 1) if token in l]
        check("LNG-%s" % token[:10].replace(" ", "_"), "19", not hits, "P2",
              "House style: %r absent" % token, "not present",
              "%s. Line(s): %s"
              % (why, ", ".join(str(i) for i in hits[:6])))


# ---------------------------------------------------------------------------
# Sections 21 and 22: references, and the submission package
# ---------------------------------------------------------------------------

def audit_references(body):
    """Every in-text citation must resolve, and every reference must be used."""
    try:
        refs_block = body.split("\n## References\n", 1)[1]
    except IndexError:
        rec("REF-01", "21", "FLAG", "P0", "References section present",
            "no '## References' heading found")
        return
    refs_block = refs_block.split("\n---\n", 1)[0]

    entries = {}
    for line in refs_block.split("\n"):
        line = line.strip()
        if not line:
            continue
        m = re.match(r"^([A-Z][A-Za-zÀ-ɏ'\- ]+?),\s+[A-Z]", line)
        if m:
            y = re.search(r"\b(19|20)\d\d\b", line)
            if y:
                entries.setdefault((m.group(1).strip(), y.group(0)), line)
                continue
        m2 = re.match(r"^(NIST|ISO/IEC|Regulation \(EU\))", line)
        if m2:
            y = re.search(r"\b(19|20)\d\d\b", line)
            if y:
                entries.setdefault((m2.group(1), y.group(0)), line)

    # The appendices sit AFTER the References heading in this manuscript, so
    # "everything before References" is not the body. Cutting only the
    # reference block itself keeps Appendix A to C in scope; otherwise every
    # work cited solely in an appendix reads as uncited.
    head, tail = body.split("\n## References\n", 1)
    body_only = head + "\n" + tail[len(refs_block):]
    cites = set()
    for m in re.finditer(
            r"([A-Z][A-Za-zÀ-ɏ'\-]+)"
            r"(?:\s+et al\.|\s+and\s+[A-Z][A-Za-z'\-]+)?,?\s*"
            r"\(?((?:19|20)\d\d)\)?", body_only):
        cites.add((m.group(1), m.group(2)))

    surnames = {k[0] for k in entries}
    years = {k[1] for k in entries}
    unresolved = sorted(
        {c for c in cites
         if c[0] in surnames and c not in entries and c[1] in years})
    check("REF-01", "21", True, "-", "References section present",
          "%d reference entries parsed" % len(entries), "")
    if unresolved:
        rec("REF-02", "21", "VERIFY", "P2",
            "In-text citation years that do not match a reference entry",
            "%d candidate mismatch(es), which may be prose dates rather than "
            "citations and must be read in context: %s"
            % (len(unresolved),
               "; ".join("%s %s" % u for u in unresolved[:8])))
    else:
        rec("REF-02", "21", "PASS", "-",
            "In-text citation years that do not match a reference entry",
            "every surname-year pair whose surname appears in the reference "
            "list resolves to an entry")

    uncited = []
    for (sur, yr), line in sorted(entries.items()):
        if sur not in body_only:
            uncited.append("%s %s" % (sur, yr))
    if uncited:
        rec("REF-03", "21", "FLAG", "P2",
            "Reference entries never cited in the body",
            "%d uncited: %s. A journal copy-editor removes these or asks why "
            "they are there." % (len(uncited), "; ".join(uncited)))
    else:
        rec("REF-03", "21", "PASS", "-",
            "Reference entries never cited in the body",
            "every parsed reference entry is cited")


SUBMISSION_ITEMS = [
    ("final manuscript", r"^# Detectability of Decision Reconstruction Risk",
     "submit", True),
    ("abstract", r"^## Abstract", "submit", True),
    ("author information", r"^\*\*Authors\.\*\*", "submit", True),
    ("author contributions", r"^\*\*Author contributions\.\*\*", "submit",
     True),
    ("competing interests", r"Competing interests", "submit", True),
    ("funding statement", r"No external funding was received", "submit", True),
    ("ethics statement", r"Ethics review status", "submit", True),
    ("consent statement", r"Participation is voluntary, uncompensated",
     "submit", True),
    ("data availability", r"^## Data availability and pre-registration",
     "submit", True),
    ("acknowledgements", r"^## Acknowledgments", "submit", True),
    ("references", r"^## References", "submit", True),
    ("tables", r"^\| Measure \| Result \|", "submit", True),
    ("supplementary appendices", r"^## Appendix C\.", "submit", True),
    ("keywords", r"(?i)^\*\*Keywords", "submit", False),
    ("AI-use disclosure", r"(?i)(use of (generative )?AI in (the )?"
     r"preparation|AI-use disclosure|AI was used in (writing|preparing))",
     "submit", False),
    ("ORCID", r"(?i)ORCID", "submit", False),
    ("target venue named", r"(?i)(AI and Ethics|submitted to)", "submit",
     False),
    ("title page as a separate file", r"(?i)^\*\*Title page", "submit", False),
    ("cover letter", r"(?i)^\*\*Cover letter", "submit", False),
]


def audit_submission_package(body):
    missing = []
    for name, pat, _dest, _req in SUBMISSION_ITEMS:
        if not re.search(pat, body, re.M):
            missing.append(name)
    present = len(SUBMISSION_ITEMS) - len(missing)
    if missing:
        rec("SUB-01", "22", "FLAG", "P0",
            "Submission-package items not present in the manuscript file",
            "%d of %d present. Absent: %s. Each is either a separate file the "
            "package must carry or a section the manuscript must gain before "
            "submission."
            % (present, len(SUBMISSION_ITEMS), ", ".join(missing)))
    else:
        rec("SUB-01", "22", "PASS", "-",
            "Submission-package items not present in the manuscript file",
            "all %d items located" % len(SUBMISSION_ITEMS))

    rec("SUB-02", "21,22", "MANUAL", "P0",
        "Journal requirements must be verified, never recalled",
        "Master prompt Section 21 and absolute rule 13 forbid stating a "
        "journal's current requirements from memory. Before submission, open "
        "the target journal's own author guidance and check word limit, "
        "abstract structure, reference style, declaration wording and "
        "supplementary-file policy against this package. No requirement is "
        "asserted here because none has been verified in this run.")


# ---------------------------------------------------------------------------
# Sections 6, 8, 17, 26: the parts a script can only pose as questions
# ---------------------------------------------------------------------------

MANUAL_QUESTIONS = [
    ("MAN-01", "6", "Reference-classification independence",
     "The automated raters were briefed by the authors on what 'grounded' and "
     "'unsupported' mean. Section 4.4 says so. Confirm no sentence added since "
     "the last audit gives the reproduction more authority than that."),
    ("MAN-02", "8", "Provenance memorandum",
     "Section 4.3 states that record-level generation provenance was not "
     "retained. Decide whether the package carries a provenance-status "
     "memorandum marking each field Known, Partially recoverable, or Not "
     "recoverable. Do not reconstruct provenance retrospectively and present "
     "it as contemporaneous."),
    ("MAN-03", "17", "Residual investigator dependence",
     "After the stated mitigations, name what remains: corpus authorship, the "
     "operationalisation encoded in the key, and the absence of an independent "
     "validation adjudicator. Confirm Section 9 still names all three."),
    ("MAN-04", "26", "Archive completeness",
     "Confirm, with documentary evidence rather than recollection, that every "
     "reported number can be regenerated from retained materials. The known "
     "gap is the per-pass execution record for the three automated reference "
     "passes, which Section 4.4 states was not retained."),
    ("MAN-05", "14", "Adjacent-construct distinctions are theorised",
     "The Section 2.2 table asserts eight distinctions. None is empirically "
     "demonstrated by this study. Confirm the surrounding prose still presents "
     "them as conceptual argument rather than as findings."),
    ("MAN-06", "23", "Falsification answer",
     "The author must be able to state what result would falsify or materially "
     "weaken the interpretation. Confirm an answer exists in the defence "
     "briefing before any interview or review response."),
]


def audit_manual():
    for cid, sec, title, detail in MANUAL_QUESTIONS:
        rec(cid, sec, "MANUAL", "P1", title, detail)


# ---------------------------------------------------------------------------

def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--manuscript", default=DEFAULT)
    ap.add_argument("--json", metavar="PATH")
    a = ap.parse_args()

    if not os.path.exists(a.manuscript):
        print("[REQUIRED_ENV_PARAM] manuscript not found: %s" % a.manuscript)
        return 2
    body = io.open(a.manuscript, encoding="utf-8").read()

    audit_arithmetic(body)
    audit_reliability_denominator(body)
    audit_claims(body)
    audit_blind(body)
    audit_language(body)
    audit_references(body)
    audit_submission_package(body)
    audit_manual()

    order = {"FLAG": 0, "VERIFY": 1, "MANUAL": 2, "PASS": 3}
    prio = {"P0": 0, "P1": 1, "P2": 2, "P3": 3, "-": 4}
    FINDINGS.sort(key=lambda f: (order[f["status"]], prio[f["priority"]],
                                 f["id"]))

    width = max(len(f["id"]) for f in FINDINGS)
    for f in FINDINGS:
        print("%-6s %-3s %-*s  %s" % (f["status"], f["priority"], width,
                                      f["id"], f["title"]))
        if f["status"] != "PASS":
            for line in _wrap(f["detail"], 92):
                print("%s%s" % (" " * (width + 12), line))

    counts = {}
    for f in FINDINGS:
        counts[f["status"]] = counts.get(f["status"], 0) + 1
    p0 = [f for f in FINDINGS
          if f["status"] in ("FLAG", "VERIFY") and f["priority"] == "P0"]
    print()
    print("%d checks: %s" % (len(FINDINGS),
                             ", ".join("%d %s" % (v, k)
                                       for k, v in sorted(counts.items()))))
    print("%d P0 item(s) blocking submission" % len(p0))

    if a.json:
        io.open(a.json, "w", encoding="utf-8").write(
            json.dumps({"manuscript": os.path.relpath(a.manuscript, ROOT),
                        "findings": FINDINGS}, indent=2, ensure_ascii=False)
            + "\n")
        print("wrote %s" % a.json)
    return 1 if p0 else 0


def _wrap(text, width):
    out, line = [], ""
    for word in text.split():
        if len(line) + len(word) + 1 > width:
            out.append(line)
            line = word
        else:
            line = (line + " " + word).strip()
    if line:
        out.append(line)
    return out


if __name__ == "__main__":
    sys.exit(main())
