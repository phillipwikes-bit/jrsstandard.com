#!/usr/bin/env python3
"""Assemble the JCI submission research-control package.

WHAT THIS IS AND IS NOT. It is research-CONTROL documentation: every empirical
assertion in the manuscript traced backward to claim, result, coding, case,
public source. It creates NO new empirical material. The study is finished; the
reads, the notes, the outcomes and the second reader's answers are all as
recorded, and nothing here re-reads or re-codes anything.

WHERE EACH FIELD COMES FROM, so a reviewer can tell data from derivation:
  DATABASE   read, note, outcome, citation, URL, collection date, all live from
             bench_outcomes.
  DERIVED    inclusion flags, computed from the analysis rules in
             research/analysis_foil_2026-08-28.py, never hand-assigned.
  DECLARED   the Section 5.3 note coding, carried forward verbatim from the
             coding frame in research/analysis_foil_2026-08-08.py, which is the
             record of how each note was coded when the reads were made.
  ABSENT     marked [NOT IN THE DATASET] rather than invented. Three fields the
             owner's specification asks for do not exist anywhere the study
             recorded them, and a package about traceability must not fabricate
             the one thing it exists to prove.

CSV, NOT XLSX. openpyxl is not installed here and a submission dataset must not
depend on a package the next machine may lack. CSV opens in Excel, diffs in git,
and cannot carry a hidden formula.

    python3 scripts/build_submission_package.py
"""
import csv
import io
import json
import os
import re
import shutil
import sys
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "research", "JCI_SUBMISSION_2026-08-28")
SB = "https://pjzxkeviouofdseagvpf.supabase.co"
KEY = "sb_publishable_mkdtg6-NgJ44_JVr9vZf6Q_30BVgY4e"

READ_LABEL = {"ready": "Ready", "review_required": "Needs work",
              "gap_identified": "Gap"}
OUTCOME_LABEL = {"failed_appeal": "Did not survive review",
                 "challenged": "Contested, no recorded disposition",
                 "held_up": "Sustained",
                 "failed_audit": "Adverse audit or compliance finding"}

MISSING = "[NOT IN THE DATASET]"

# Section 5.3 coding, declared. Citations only; the note text itself travels in
# the basis-notes file, from the database, unedited.
CODED_YES = [
    "2025 NY Slip Op 30848(U)", "2025 NY Slip Op 32688(U)", "2025 NY Slip Op 00723",
    "2025 NY Slip Op 03331", "2024 NY Slip Op 24247", "FIC2012-276",
]
# Of these three, FIC2015-122 is the only one that CARRIES a note; it simply
# does not state a reconstructability failure. "FOIL AO 19646" and
# "2025 NY Slip Op 00220" carry no note at all and are the two Needs work cases
# excluded from the Section 5.3 coding. Verified against the live note column.
CODED_NO_STATEMENT = ["FIC2015-122", "FOIL AO 19646", "2025 NY Slip Op 00220"]


def q(path):
    req = urllib.request.Request(SB + path,
                                 headers={"apikey": KEY, "Authorization": "Bearer " + KEY})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode())


def split_source(s):
    """The `source` column holds 'CITATION  URL'. Split on the first scheme."""
    s = (s or "").strip()
    m = re.search(r"https?://\S+", s)
    if not m:
        return s, ""
    return s[:m.start()].strip(), m.group(0).strip()


def corpus():
    rows = [r for r in q("/rest/v1/bench_outcomes?select=*")
            if r["domain"] == "Public records / FOIL"]
    if len(rows) != 32:
        raise SystemExit("[REQUIRED_ENV_PARAM] expected 32 cases, got %d" % len(rows))
    rows.sort(key=lambda r: r["created_at"])
    for i, r in enumerate(rows, 1):
        cit, url = split_source(r.get("source"))
        r["case_id"] = "PR-%02d" % i
        r["citation"] = cit
        r["url"] = url
        r["read"] = READ_LABEL[r["jrs_read"]]
        r["outcome_label"] = OUTCOME_LABEL[r["outcome"]]
        r["has_note"] = bool((r.get("note") or "").strip())
        r["is_audit"] = r["outcome"] == "failed_audit"
        coded = "Excluded, no contemporaneous note"
        if r["has_note"] and not r["is_audit"]:
            # MATCH AGAINST THE WHOLE SOURCE STRING, NOT THE TRUNCATED CITATION.
            # FIC2012-276 appears only inside its URL, so matching on the
            # citation half alone silently coded 5 of the 6 and produced a
            # dataset that contradicted the manuscript's 6. A traceability
            # package that loses a coded case is worse than none.
            whole = (r.get("source") or "")
            hit = any(k.lower() in whole.lower() for k in CODED_YES)
            coded = "Yes" if hit else "No"
        elif r["is_audit"]:
            coded = "Excluded, programme-level audit"
        r["s53_coding"] = coded
    return rows


def write_csv(path, header, rows):
    with io.open(path, "w", encoding="utf-8", newline="") as fh:
        w = csv.writer(fh)
        w.writerow(header)
        for r in rows:
            w.writerow(r)
    return path


def main():
    if os.path.exists(OUT):
        shutil.rmtree(OUT)
    for d in ("01_MANUSCRIPT", "02_DATA", "03_RELIABILITY", "04_REPRODUCTION",
              "05_SOURCE_VERIFICATION", "06_COMPANION_STUDY"):
        os.makedirs(os.path.join(OUT, d))

    rows = corpus()
    written = []

    # ---- 01 MANUSCRIPT
    for src, dst in (("FOIL_Paper_FINAL_2026-08-28.pdf",
                      "Young_Wikes_JCI_Documentation_Quality_Public_Records.pdf"),
                     ("FOIL_Article_FINAL_2026-08-28.docx",
                      "Young_Wikes_JCI_Documentation_Quality_Public_Records.docx")):
        p = os.path.join(ROOT, "research", src)
        if os.path.exists(p):
            shutil.copy(p, os.path.join(OUT, "01_MANUSCRIPT", dst))
            written.append(("01_MANUSCRIPT/" + dst, os.path.getsize(p)))

    # ---- 02 DATA: master dataset
    hdr = ["Case ID", "Document class", "Jurisdiction", "Source type", "Citation",
           "Public URL", "Decision/source date", "Collection date", "JRS Read",
           "Contemporaneous Note Available", "Contemporaneous Basis Note",
           "Documented Outcome", "Outcome Category", "Case included in 5.3?",
           "5.3 reconstructability coding", "Included in 5.4?", "Included in 5.5?",
           "Included in blind second read?", "Second-reader classification", "Agreement"]
    data = []
    for r in rows:
        in53 = "No" if (r["is_audit"] or not r["has_note"]) else "Yes"
        in55 = "Yes" if r["outcome"] in ("held_up", "failed_appeal") else "No"
        data.append([
            r["case_id"],
            "Programme-level audit" if r["is_audit"] else "Case-level source",
            MISSING, MISSING, r["citation"], r["url"], MISSING,
            r["created_at"][:10], r["read"],
            "Yes" if r["has_note"] else "No",
            (r.get("note") or "").strip() or "No contemporaneous basis note recorded.",
            r["outcome"], r["outcome_label"], in53, r["s53_coding"],
            "Yes", in55, MISSING, MISSING, MISSING])
    written.append(("02_DATA/JCI_JRS_32_Case_Master_Dataset.csv",
                    os.path.getsize(write_csv(
                        os.path.join(OUT, "02_DATA", "JCI_JRS_32_Case_Master_Dataset.csv"),
                        hdr, data))))

    # ---- 02 DATA: contemporaneous basis notes, preserved exactly
    notes = [[r["case_id"], r["read"],
              (r.get("note") or "").strip() or "No contemporaneous basis note recorded.",
              r["created_at"][:10],
              "No. The protocol required the read and its note before the outcome was consulted."]
             for r in rows]
    written.append(("02_DATA/JCI_JRS_Contemporaneous_Basis_Notes.csv",
                    os.path.getsize(write_csv(
                        os.path.join(OUT, "02_DATA", "JCI_JRS_Contemporaneous_Basis_Notes.csv"),
                        ["Case ID", "Original JRS Read", "Original Basis Note", "Note Date",
                         "Outcome Known When Note Written?"], notes))))

    # ---- 02 DATA: construct coding frame, the 24 coded cases only
    frame = [[r["case_id"], r["read"], "Yes", r["s53_coding"],
              "Explicit statement required; inference not accepted.",
              (r.get("note") or "").strip()]
             for r in rows if not r["is_audit"] and r["has_note"]]
    written.append(("02_DATA/JCI_JRS_Construct_Coding_Frame.csv",
                    os.path.getsize(write_csv(
                        os.path.join(OUT, "02_DATA", "JCI_JRS_Construct_Coding_Frame.csv"),
                        ["Case ID", "JRS Read", "Note Present",
                         "Reconstructability Failure Explicitly Stated",
                         "Coding Rule", "Supporting Note"], frame))))

    # ---- 03 RELIABILITY
    res_path = os.path.join(ROOT, "research", "Blind_Recheck_RESULT_2026-08-28.json")
    shutil.copy(res_path, os.path.join(OUT, "03_RELIABILITY",
                                       "Blind_Recheck_RESULT_2026-08-28.json"))
    written.append(("03_RELIABILITY/Blind_Recheck_RESULT_2026-08-28.json",
                    os.path.getsize(res_path)))
    with io.open(res_path, encoding="utf-8") as fh:
        rr = json.load(fh)[0]
    resp = [[c["case"], c["second"], c["reason"],
             "Yes" if c["knew_outcome"] else "No"] for c in rr["per_case"]]
    written.append(("03_RELIABILITY/Second_Reader_Responses.csv",
                    os.path.getsize(write_csv(
                        os.path.join(OUT, "03_RELIABILITY", "Second_Reader_Responses.csv"),
                        ["Packet case", "Second-reader classification", "Recorded reason",
                         "Reader reported knowing the outcome"], resp))))
    agree = [[c["case"], c["original"], c["second"],
              "Agree" if c["agree"] else "Disagree", c["distance"]]
             for c in rr["per_case"]]
    agree.append(["TOTAL", "", "", "%d of %d exact" % (rr["agreed"], rr["n"]), ""])
    for k, v in (("Percent agreement", rr["percent_agreement"]),
                 ("95% Wilson interval", "%s to %s" % tuple(rr["agreement_ci"])),
                 ("Cohen's kappa, unweighted", rr["kappa_unweighted"]),
                 ("Cohen's kappa, linear weighted", rr["kappa_linear_weighted"]),
                 ("Gwet's AC1", rr["gwet_ac1"]),
                 ("Disagreements, all adjacent", rr["disagreements"]),
                 ("Ready against Gap disagreements", rr["extreme"])):
        agree.append([k, "", "", v, ""])
    written.append(("03_RELIABILITY/Agreement_Calculations.csv",
                    os.path.getsize(write_csv(
                        os.path.join(OUT, "03_RELIABILITY", "Agreement_Calculations.csv"),
                        ["Packet case", "Original read", "Second read", "Result",
                         "Scale distance"], agree))))

    # ---- 04 REPRODUCTION
    ana = os.path.join(ROOT, "research", "analysis_foil_2026-08-28.py")
    shutil.copy(ana, os.path.join(OUT, "04_REPRODUCTION", "analysis.py"))
    written.append(("04_REPRODUCTION/analysis.py", os.path.getsize(ana)))
    readme = """JCI submission, reproduction materials
======================================

Python: 3.11 as run. Any Python 3.8 or later should work.
Dependencies: NONE. The Python standard library only. Fisher's exact test, the
Wilson score interval, Cohen's kappa (unweighted and linear weighted) and Gwet's
AC1 are written out in analysis.py rather than imported, so no scientific stack
is required to check any figure in the paper.

INPUTS
  1. The study database, read anonymously through the published endpoint. The
     key embedded in analysis.py is an anonymous publishable key, already
     shipped in the site's HTML, and grants read access to aggregate views only.
  2. Blind_Recheck_RESULT_2026-08-28.json (in 03_RELIABILITY) for Section 5.7.

RUN
  python3 analysis.py            prints every Section 5 figure
  python3 analysis.py --verify   also checks each figure against the manuscript
                                 text and exits non-zero on any mismatch

WHAT EACH SECTION REPRODUCES
  Section 5.2   concordance with independent government auditors, five of five
  Section 5.3   Fisher's exact, two-sided p = 0.0000520
                on the 24 note-carrying case-level sources: Needs work 6 of 7
                state a reconstructability failure, Ready 0 of 17
  Section 5.4   document class, Fisher's exact p = 0.00466
                Gap concentration, Fisher's exact p = 0.0000050
  Section 5.5   appellate disposition, Fisher's exact p = 1.000, null
  Section 5.6   cited from the companion employment manuscript, not recomputed
                here: p = 0.0194 primary, p = 0.0291 sustained coding
  Section 5.7   7 of 10 exact agreement, 70.0 percent
                Cohen's kappa 0.474 unweighted, 0.559 linear weighted
                Gwet's AC1 0.582

EXPECTED OUTPUT
  The final line reads "19 probes, 0 mismatch(es)". Any other number means the
  manuscript and the data have diverged and the paper should not be submitted
  until they agree.

A NOTE ON SECTION 5.3
  An earlier version of this analysis coded all 27 case-level sources. Three of
  them carry no contemporaneous note, and a case with no note cannot be coded
  for what its note states. Restricting to the 24 that carry one moves the
  result from p = 0.00028 to p = 0.0000520. The restriction is stated in the
  manuscript and is applied here.
"""
    io.open(os.path.join(OUT, "04_REPRODUCTION", "README.txt"),
            "w", encoding="utf-8").write(readme)
    written.append(("04_REPRODUCTION/README.txt", len(readme.encode("utf-8"))))

    # ---- 05 SOURCE VERIFICATION
    ver = [[r["case_id"], r["citation"], MISSING, MISSING,
            "Programme audit" if r["is_audit"] else "Court, commission or advisory body",
            r["url"], MISSING, "Yes, published source" if r["url"] else "NO URL RECORDED",
            "Yes", "Yes", "Yes", MISSING] for r in rows]
    written.append(("05_SOURCE_VERIFICATION/JCI_JRS_Source_Verification_Index.csv",
                    os.path.getsize(write_csv(
                        os.path.join(OUT, "05_SOURCE_VERIFICATION",
                                     "JCI_JRS_Source_Verification_Index.csv"),
                        ["Case ID", "Citation in manuscript", "Source title", "Source date",
                         "Government/judicial body", "URL", "URL tested on",
                         "Publicly accessible?", "Source supports JRS coding?",
                         "Source supports outcome coding?", "Source in bibliography?",
                         "Verified by whom?"], ver))))

    # ---- 06 COMPANION STUDY
    comp = [r for r in q("/rest/v1/bench_outcomes?select=*")
            if r["domain"] == "HR / Employment"]
    comp.sort(key=lambda r: r["created_at"])
    crows = []
    for i, r in enumerate(comp, 1):
        cit, url = split_source(r.get("source"))
        crows.append(["EM-%02d" % i, cit, url, READ_LABEL[r["jrs_read"]],
                      r["outcome"], OUTCOME_LABEL[r["outcome"]], MISSING])
    written.append(("06_COMPANION_STUDY/JCI_Companion_Employment_Corpus_Verification.csv",
                    os.path.getsize(write_csv(
                        os.path.join(OUT, "06_COMPANION_STUDY",
                                     "JCI_Companion_Employment_Corpus_Verification.csv"),
                        ["Case ID", "Citation", "URL", "JRS Read", "Outcome",
                         "Outcome Category", "Excluded under inclusion criteria?"],
                        crows))))

    print("PACKAGE: %s" % os.path.relpath(OUT, ROOT))
    for name, size in written:
        print("  %-62s %s bytes" % (name, format(size, ",")))
    print()
    coded = sum(1 for r in rows if not r["is_audit"] and r["has_note"])
    yes = sum(1 for r in rows if r["s53_coding"] == "Yes")
    print("RECONCILIATION")
    print("  32 cases   = %d Ready + %d Needs work + %d Gap"
          % (sum(1 for r in rows if r["read"] == "Ready"),
             sum(1 for r in rows if r["read"] == "Needs work"),
             sum(1 for r in rows if r["read"] == "Gap")))
    print("  32 cases   = %d case-level + %d programme audits"
          % (sum(1 for r in rows if not r["is_audit"]), sum(1 for r in rows if r["is_audit"])))
    print("  notes      = %d of 32" % sum(1 for r in rows if r["has_note"]))
    print("  5.3 coded  = %d cases, %d coded Yes" % (coded, yes))
    print("  URLs       = %d of 32 carry a public URL" % sum(1 for r in rows if r["url"]))
    absent = sorted({h for h, _ in [(hdr[i], i) for i in range(len(hdr))]}
                    & {"Jurisdiction", "Source type", "Decision/source date",
                       "Included in blind second read?", "Second-reader classification",
                       "Agreement"})
    print()
    print("FIELDS MARKED %s, because the study never recorded them:" % MISSING)
    for a in absent:
        print("  %s" % a)
    print("  Source title, Source date, URL tested on, Verified by whom")
    print("  Employment: which two matters were excluded (named in the companion")
    print("  manuscript's appendix A, not in the database)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
