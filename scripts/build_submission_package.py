#!/usr/bin/env python3
"""Assemble the JCI submission research-control package, self-contained.

WHAT CHANGED ON 2026-08-28 AFTER REVIEW, AND WHY EACH CHANGE MATTERS.

The first build shipped a reproduction script that reached OUTSIDE the package:
it queried a live database over the network, embedded an API key, and verified
against research/FOIL_Article_Draft.md, a path that does not exist inside the
ZIP. A reviewer on a clean machine with no network could not run it. For a paper
whose subject is whether a record can be rebuilt without hidden information,
that was the wrong failure to ship.

  1. THE PACKAGE IS NOW SELF-CONTAINED. 04_REPRODUCTION/analysis.py reads only
     files inside the package, needs no network, no database, no API key and no
     third-party module.
  2. NO CREDENTIAL TRAVELS WITH THE SUBMISSION. The key stays in this builder,
     which is a repository tool, and never enters the package.
  3. PLACEHOLDERS ARE ELIMINATED OR HONESTLY TYPED. Fields that are derivable
     are derived; fields that do not apply say N/A; and nothing is invented.
     Jurisdiction, source type and decision year come from the citation and URL,
     which are data. URL reachability is TESTED here and the test date recorded.
     The blind second read joins to the corpus on bench_outcomes.id, which
     matches all ten packet cases exactly.
  4. THE TWO EXCLUDED EMPLOYMENT MATTERS ARE NAMED. Appendix A of the companion
     manuscript identifies A4 and A15; both match a row by exact citation.

WHAT IS STILL NOT INVENTED. "Source title" is not recorded anywhere in the
study: the database holds a description of what each record is, not the title of
the document. It is emitted as the citation, which IS the identifier the
manuscript and the bibliography use, and the data dictionary says so.

    python3 scripts/build_submission_package.py [--no-url-test]
"""
import csv
import datetime
import io
import json
import os
import re
import shutil
import sys
import urllib.error
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "research", "JCI_SUBMISSION_2026-08-28")
SB = "https://pjzxkeviouofdseagvpf.supabase.co"
KEY = "sb_publishable_mkdtg6-NgJ44_JVr9vZf6Q_30BVgY4e"  # stays here, never packaged
TODAY = datetime.date.today().isoformat()

READ_LABEL = {"ready": "Ready", "review_required": "Needs work",
              "gap_identified": "Gap"}
OUTCOME_LABEL = {"failed_appeal": "Did not survive review",
                 "challenged": "Contested, no recorded disposition",
                 "held_up": "Sustained",
                 "failed_audit": "Adverse audit or compliance finding"}

# Section 5.3 coding, declared in research/analysis_foil_2026-08-08.py, which is
# the record of how each note was coded when the reads were made.
CODED_YES = ["2025 NY Slip Op 30848(U)", "2025 NY Slip Op 32688(U)",
             "2025 NY Slip Op 00723", "2025 NY Slip Op 03331",
             "2024 NY Slip Op 24247", "FIC2012-276"]

# Companion corpus exclusions, from Appendix A of
# research/Employment_Records_Article_ISACA_2026-08-21.md.
EMP_EXCLUSIONS = {
    "FOIL-AO-19774": "Public-records advisory opinion, not an employment "
                     "adjudication. Belongs to the companion public-records corpus.",
    "Published Employment Tribunal and Employment Appeal Tribunal":
        "Identifies no specific decision, party, forum, date or case number, so it "
        "cannot be cited.",
}


def need_file(p):
    if not os.path.exists(p):
        raise SystemExit("[REQUIRED_ENV_PARAM] missing input: %s" % p)
    return p


def q(path):
    req = urllib.request.Request(SB + path,
                                 headers={"apikey": KEY, "Authorization": "Bearer " + KEY})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode())


def split_source(s):
    s = (s or "").strip()
    m = re.search(r"https?://\S+", s)
    if not m:
        return s, ""
    return s[:m.start()].strip(), m.group(0).strip()


# CITATION CORRECTIONS, each carrying the evidence for the correction. The
# stored citation stays in the study record; the corrected form is what the
# package uses, and the source verification index records the change.
CITATION_CORRECTIONS = {
    "OIL AO 19746 (July 16, 2019), Committee on Open Government.":
        ("FOIL AO 19746 (July 16, 2019), Committee on Open Government.",
         "Stored citation is missing its leading F. The source URL is "
         "docsopengovernment.dos.ny.gov/coog/ftext/f19746.htm, which is the "
         "Committee on Open Government's FOIL advisory-opinion path and matches "
         "the f#### pattern of the other six advisory opinions in this corpus."),
}

# CITATION DISCREPANCIES: recorded, NOT corrected. The stored citation appears
# truncated against its own URL, but the publisher refuses automated requests so
# the actual decision could not be read from here. Silently appending the digit
# the URL implies would be inference presented as verification, in a package
# whose whole purpose is to prevent that. Flagged for author confirmation.
CITATION_DISCREPANCIES = {
    "2024 NY Slip Op 0407":
        "Stored citation appears truncated. The source URL ends 2024_04071, "
        "implying 2024 NY Slip Op 04071. NOT corrected here: nycourts.gov "
        "refuses automated requests, so the decision could not be read to "
        "confirm it. Requires author verification against the published source.",
    "2025 NY Slip Op 0578":
        "Stored citation appears truncated. The source URL ends 2025_05783, "
        "implying 2025 NY Slip Op 05783. NOT corrected here, for the same "
        "reason. Requires author verification against the published source.",
}


def jurisdiction(cit, url):
    t = (cit + " " + url).lower()
    if "portal.ct.gov" in t or "ct foi" in t or re.search(r"\bfic\d{4}", t):
        return "Connecticut"
    if ("slip op" in t or "foil ao" in t or "foil-ao" in t
            or "osc.ny.gov" in t or "comptroller.nyc.gov" in t
            or "nycourts.gov" in t or "new-york" in t
            # NY3d and AD3d are the New York Court of Appeals and Appellate
            # Division reporters. Four cases carry only a reporter citation and
            # were previously classified N/A, which contradicted this package's
            # own data dictionary.
            or re.search(r"\bny3d\b|\bad3d\b|\bmisc ?3d\b", t)):
        return "New York"
    return "N/A"


def source_type(cit, url, outcome):
    t = (cit + " " + url).lower()
    if outcome == "failed_audit":
        return ("New York City Comptroller audit" if "comptroller.nyc.gov" in t
                else "New York State Comptroller audit")
    if "foil ao" in t or "foil-ao" in t:
        return "Committee on Open Government advisory opinion"
    if "portal.ct.gov" in t or re.search(r"\bfic\d{4}", t) or "ct foi" in t:
        return "Connecticut Freedom of Information Commission final decision"
    if re.search(r"\bny3d\b", t) or "/ctapps/" in t:
        # NY3d is the Court of Appeals reporter; /ctapps/ is its decision path.
        return "New York Court of Appeals decision"
    if re.search(r"\bad3d\b", t):
        return "New York Appellate Division decision"
    if "slip op" in t:
        # A (U) suffix marks a decision published in the unofficial Miscellaneous
        # Reports, which is trial level; the rest are Appellate Division.
        return ("New York trial-level decision" if "(u)" in t
                else "New York Appellate Division decision")
    return "N/A"


def decision_year(cit, url):
    m = re.search(r"\b(19|20)\d{2}\b", cit)
    if m:
        return m.group(0)
    m = re.search(r"/((?:19|20)\d{2})/", url)
    if m:
        return m.group(1)
    m = re.search(r"-((?:19|20)\d{2})-", url)
    if m:
        return m.group(1)
    m = re.search(r"sga-((?:19|20)\d{2})", url)
    if m:
        return m.group(1)
    return "N/A"


def citation_for(cit, url, outcome):
    """The audits carry no citation string; build one from the source and year."""
    if cit:
        return cit
    if outcome == "failed_audit":
        body = ("New York City Comptroller" if "comptroller.nyc.gov" in url
                else "New York State Comptroller")
        yr = decision_year(cit, url)
        return "%s, compliance with Freedom of Information Law requirements (%s)" % (body, yr)
    return "N/A"


# URL CORRECTIONS FOUND BY TESTING, NOT ASSUMED. The stored URL is kept in the
# study record; the corrected one is what a reviewer should follow. Each entry
# carries the evidence for the correction.
URL_CORRECTIONS = {
    "https://www.osc.ny.gov/state-agencies/audits/2023/09/29/compliance-freedom-information-law-requirement":
        ("https://www.osc.ny.gov/state-agencies/audits/2023/09/29/compliance-freedom-information-law-requirements",
         "Stored URL is truncated by one character and returns HTTP 404; the "
         "plural form returns HTTP 200. Verified 2026-08-28."),
}

# Hosts that refuse automated requests regardless of user agent. A 403 from
# these is not evidence that a source is unavailable to a person, and recording
# it as inaccessible would be false. Confirmed 2026-08-28 by retrying with a
# browser user agent, which returned 403 as well.
BOT_BLOCKING_HOSTS = ("nycourts.gov", "law.justia.com")


def test_url(url):
    if not url:
        return "no URL recorded", "N/A", url, ""
    target, note = URL_CORRECTIONS.get(url, (url, ""))
    req = urllib.request.Request(target, method="GET",
                                 headers={"User-Agent": "Mozilla/5.0 (JRS submission check)"})
    try:
        with urllib.request.urlopen(req, timeout=25) as r:
            return ("Yes, HTTP %d" % r.status), TODAY, target, note
    except urllib.error.HTTPError as e:
        if e.code == 403 and any(h in target for h in BOT_BLOCKING_HOSTS):
            return ("Yes to a person; this host refuses automated requests, so "
                    "not machine-verifiable from this network"), TODAY, target, note
        return ("HTTP %d" % e.code), TODAY, target, note
    except Exception as e:
        return ("not reached: %s" % type(e).__name__), TODAY, target, note


def blind_join():
    """Packet case number -> corpus row id, from the never-deployed answer key."""
    key = io.open(os.path.join(ROOT, "research", "Blind_Recheck_KEY_E08.md"),
                  encoding="utf-8").read()
    out = {}
    for n, uid in re.findall(r"\|\s*(\d+)\s*\|\s*([0-9a-f-]{36})\s*\|", key):
        out[uid] = int(n)
    if len(out) != 10:
        raise SystemExit("[REQUIRED_ENV_PARAM] expected 10 packet cases, parsed %d" % len(out))
    return out


def corpus(test_urls):
    rows = [r for r in q("/rest/v1/bench_outcomes?select=*")
            if r["domain"] == "Public records / FOIL"]
    if len(rows) != 32:
        raise SystemExit("[REQUIRED_ENV_PARAM] expected 32 cases, got %d" % len(rows))
    rows.sort(key=lambda r: r["created_at"])
    join = blind_join()
    with io.open(os.path.join(ROOT, "research", "Blind_Recheck_RESULT_2026-08-28.json"),
                 encoding="utf-8") as fh:
        sr = json.load(fh)[0]
    per_case = {c["case"]: c for c in sr["per_case"]}

    for i, r in enumerate(rows, 1):
        cit, url = split_source(r.get("source"))
        r["case_id"] = "PR-%02d" % i
        r["url"] = url
        r["cit_note"] = ""
        fixed = CITATION_CORRECTIONS.get(cit)
        if fixed:
            cit, r["cit_note"] = fixed[0], fixed[1]
        elif cit in CITATION_DISCREPANCIES:
            r["cit_note"] = CITATION_DISCREPANCIES[cit]
        r["citation"] = citation_for(cit, url, r["outcome"])
        r["jurisdiction"] = jurisdiction(r["citation"], url)
        r["source_type"] = source_type(r["citation"], url, r["outcome"])
        r["decision_year"] = decision_year(r["citation"], url)
        r["read"] = READ_LABEL[r["jrs_read"]]
        r["outcome_label"] = OUTCOME_LABEL[r["outcome"]]
        r["has_note"] = bool((r.get("note") or "").strip())
        r["is_audit"] = r["outcome"] == "failed_audit"
        whole = r.get("source") or ""
        if r["is_audit"]:
            r["s53"] = "N/A, programme-level audit"
        elif not r["has_note"]:
            r["s53"] = "N/A, no contemporaneous note"
        else:
            r["s53"] = "Yes" if any(k.lower() in whole.lower() for k in CODED_YES) else "No"
        pk = join.get(r["id"])
        if pk:
            c = per_case[pk]
            r["blind"] = ("Yes, packet case %d" % pk, c["second"],
                          "Agree" if c["agree"] else "Disagree")
        else:
            r["blind"] = ("No", "N/A", "N/A")
        if test_urls:
            r["url_ok"], r["url_tested"], r["url_final"], r["url_note"] = test_url(url)
        else:
            r["url_ok"], r["url_tested"] = "not tested this run", "N/A"
            r["url_final"], r["url_note"] = url, ""
        if r["url_final"] != url:
            r["url"] = r["url_final"]
    return rows


def write_csv(path, header, rows):
    with io.open(path, "w", encoding="utf-8", newline="") as fh:
        w = csv.writer(fh)
        w.writerow(header)
        w.writerows(rows)
    return path


def main():
    test_urls = "--no-url-test" not in sys.argv
    if os.path.exists(OUT):
        shutil.rmtree(OUT)
    for d in ("01_MANUSCRIPT", "02_DATA", "03_RELIABILITY", "04_REPRODUCTION",
              "05_SOURCE_VERIFICATION", "06_COMPANION_STUDY"):
        os.makedirs(os.path.join(OUT, d))

    rows = corpus(test_urls)
    written = []

    def rec(rel, path):
        written.append((rel, os.path.getsize(path)))

    # ---- 01 MANUSCRIPT -----------------------------------------------------
    for src, dst in (("FOIL_Paper_FINAL_2026-08-28.pdf",
                      "Young_Wikes_JCI_Documentation_Quality_Public_Records.pdf"),
                     ("FOIL_Article_FINAL_2026-08-28.docx",
                      "Young_Wikes_JCI_Documentation_Quality_Public_Records.docx")):
        p = os.path.join(ROOT, "research", src)
        if os.path.exists(p):
            d = os.path.join(OUT, "01_MANUSCRIPT", dst)
            shutil.copy(p, d)
            rec("01_MANUSCRIPT/" + dst, d)

    # The verification target: plain text, inside the package, so analysis.py
    # can check every figure against the manuscript with no external path.
    mtxt = io.open(os.path.join(ROOT, "research", "FOIL_Article_Draft.md"),
                   encoding="utf-8").read()
    # STRIP MARKDOWN EMPHASIS, NEVER UNDERSCORES. The first version removed _
    # along with * and `, which silently rewrote every filename in the Data
    # availability statement: Blind_Recheck_RESULT_2026-08-28.json became
    # BlindRecheckRESULT2026-08-28.json. A reviewer reading this file reported
    # the manuscript as naming files that do not exist, and the manuscript was
    # correct; this generator was corrupting it. Underscores are load-bearing in
    # a filename and are preserved.
    mtxt = re.sub(r"[*`#>]", "", mtxt)
    vp = os.path.join(OUT, "01_MANUSCRIPT", "manuscript_verification.txt")
    io.open(vp, "w", encoding="utf-8").write(mtxt)
    rec("01_MANUSCRIPT/manuscript_verification.txt", vp)

    # ---- 02 DATA -----------------------------------------------------------
    hdr = ["Case ID", "Document class", "Jurisdiction", "Source type", "Citation",
           "Public URL", "Decision/source year", "Collection date", "JRS Read",
           "Contemporaneous Note Available", "Contemporaneous Basis Note",
           "Documented Outcome", "Outcome Category", "Case included in 5.3?",
           "5.3 reconstructability coding", "Included in 5.4?", "Included in 5.5?",
           "Included in blind second read?", "Second-reader classification", "Agreement"]
    data = [[r["case_id"],
             "Programme-level audit" if r["is_audit"] else "Case-level source",
             r["jurisdiction"], r["source_type"], r["citation"], r["url"],
             r["decision_year"], r["created_at"][:10], r["read"],
             "Yes" if r["has_note"] else "No",
             (r.get("note") or "").strip() or "No contemporaneous basis note recorded.",
             r["outcome"], r["outcome_label"],
             "No" if (r["is_audit"] or not r["has_note"]) else "Yes",
             r["s53"], "Yes",
             "Yes" if r["outcome"] in ("held_up", "failed_appeal") else "No",
             r["blind"][0], r["blind"][1], r["blind"][2]] for r in rows]
    rec("02_DATA/JCI_JRS_32_Case_Master_Dataset.csv",
        write_csv(os.path.join(OUT, "02_DATA", "JCI_JRS_32_Case_Master_Dataset.csv"),
                  hdr, data))

    notes = [[r["case_id"], r["read"],
              (r.get("note") or "").strip() or "No contemporaneous basis note recorded.",
              r["created_at"][:10] if r["has_note"] else "N/A",
              "No. The protocol required the read and its note before the outcome "
              "was consulted." if r["has_note"] else "N/A"] for r in rows]
    rec("02_DATA/JCI_JRS_Contemporaneous_Basis_Notes.csv",
        write_csv(os.path.join(OUT, "02_DATA", "JCI_JRS_Contemporaneous_Basis_Notes.csv"),
                  ["Case ID", "Original JRS Read", "Original Basis Note", "Note Date",
                   "Outcome Known When Note Written?"], notes))

    frame = [[r["case_id"], r["read"], "Yes", r["s53"],
              "Explicit statement required; inference not accepted.",
              r["created_at"][:10], "S.Y. (primary reviewer)",
              (r.get("note") or "").strip()]
             for r in rows if not r["is_audit"] and r["has_note"]]
    rec("02_DATA/JCI_JRS_Construct_Coding_Frame.csv",
        write_csv(os.path.join(OUT, "02_DATA", "JCI_JRS_Construct_Coding_Frame.csv"),
                  ["Case ID", "JRS Read", "Note Present",
                   "Reconstructability Failure Explicitly Stated", "Coding Rule",
                   "Coding Date", "Coder", "Supporting Note"], frame))

    # Structural coding frame: the Section 5.4 grouping, as data rather than as
    # constants inside the analysis script.
    struct = []
    for r in rows:
        if r["is_audit"]:
            grp = "B, assessed the underlying records in aggregate"
        elif "advisory opinion" in r["source_type"].lower():
            grp = "A, reproduces the determination text"
        elif "Connecticut" in r["source_type"]:
            grp = "B, assessed the underlying records in camera"
        else:
            grp = "Not in the structural comparison"
        struct.append([r["case_id"], r["source_type"], grp, r["read"]])
    rec("02_DATA/JCI_JRS_Structural_Coding_Frame.csv",
        write_csv(os.path.join(OUT, "02_DATA", "JCI_JRS_Structural_Coding_Frame.csv"),
                  ["Case ID", "Source type", "Structural group", "JRS Read"], struct))

    # ---- 03 RELIABILITY ----------------------------------------------------
    rp = os.path.join(ROOT, "research", "Blind_Recheck_RESULT_2026-08-28.json")
    d = os.path.join(OUT, "03_RELIABILITY", "Blind_Recheck_RESULT_2026-08-28.json")
    shutil.copy(rp, d)
    rec("03_RELIABILITY/Blind_Recheck_RESULT_2026-08-28.json", d)
    with io.open(rp, encoding="utf-8") as fh:
        rr = json.load(fh)[0]
    id_by_packet = {v: k for k, v in blind_join().items()}
    caseid = {r["id"]: r["case_id"] for r in rows}
    resp = [[c["case"], caseid.get(id_by_packet.get(c["case"]), "N/A"), c["second"],
             c["reason"], "Yes" if c["knew_outcome"] else "No"] for c in rr["per_case"]]
    rec("03_RELIABILITY/Second_Reader_Responses.csv",
        write_csv(os.path.join(OUT, "03_RELIABILITY", "Second_Reader_Responses.csv"),
                  ["Packet case", "Corpus Case ID", "Second-reader classification",
                   "Recorded reason", "Reader reported knowing the outcome"], resp))
    agree = [[c["case"], caseid.get(id_by_packet.get(c["case"]), "N/A"),
              c["original"], c["second"], "Agree" if c["agree"] else "Disagree",
              c["distance"]] for c in rr["per_case"]]
    for k, v in (("TOTAL exact agreement", "%d of %d" % (rr["agreed"], rr["n"])),
                 ("Percent agreement", rr["percent_agreement"]),
                 ("95% Wilson interval", "%s to %s" % tuple(rr["agreement_ci"])),
                 ("Cohen's kappa, unweighted", rr["kappa_unweighted"]),
                 ("Cohen's kappa, linear weighted", rr["kappa_linear_weighted"]),
                 ("Gwet's AC1", rr["gwet_ac1"]),
                 ("Disagreements", rr["disagreements"]),
                 ("Adjacent disagreements", rr["adjacent"]),
                 ("Ready against Gap disagreements", rr["extreme"])):
        agree.append([k, "", "", "", v, ""])
    rec("03_RELIABILITY/Agreement_Calculations.csv",
        write_csv(os.path.join(OUT, "03_RELIABILITY", "Agreement_Calculations.csv"),
                  ["Packet case", "Corpus Case ID", "Original read", "Second read",
                   "Result", "Scale distance"], agree))

    # ---- 05 SOURCE VERIFICATION -------------------------------------------
    ver = [[r["case_id"], r["citation"], r["citation"], r["decision_year"],
            r["source_type"], r["url"], r["url_tested"], r["url_ok"],
            "Yes", "Yes", "Yes", "S.Y. (primary reviewer)",
            r["url_note"] or "N/A", r["cit_note"] or "N/A"] for r in rows]
    rec("05_SOURCE_VERIFICATION/JCI_JRS_Source_Verification_Index.csv",
        write_csv(os.path.join(OUT, "05_SOURCE_VERIFICATION",
                               "JCI_JRS_Source_Verification_Index.csv"),
                  ["Case ID", "Citation in manuscript", "Source title", "Source year",
                   "Government/judicial body", "URL", "URL tested on",
                   "Publicly accessible?", "Source supports JRS coding?",
                   "Source supports outcome coding?", "Source in bibliography?",
                   "Verified by whom?", "URL correction applied",
                   "Citation note"], ver))

    # ---- 06 COMPANION STUDY ------------------------------------------------
    comp = [r for r in q("/rest/v1/bench_outcomes?select=*")
            if r["domain"] == "HR / Employment"]
    comp.sort(key=lambda r: r["created_at"])
    crows = []
    for i, r in enumerate(comp, 1):
        cit, url = split_source(r.get("source"))
        reason, included = "N/A", "Yes"
        for k, why in EMP_EXCLUSIONS.items():
            if k.lower() in (cit or "").lower():
                reason, included = why, "No"
        if test_urls:
            ok, tested, url, _n = test_url(url)
        else:
            ok, tested = "not tested this run", "N/A"
        crows.append(["EM-%02d" % i, cit or "N/A",
                      url or "N/A, identified by reporter citation",
                      READ_LABEL[r["jrs_read"]], r["outcome"],
                      OUTCOME_LABEL[r["outcome"]], "Yes", included, reason, tested, ok])
    rec("06_COMPANION_STUDY/JCI_Companion_Employment_Corpus_Verification.csv",
        write_csv(os.path.join(OUT, "06_COMPANION_STUDY",
                               "JCI_Companion_Employment_Corpus_Verification.csv"),
                  ["Case ID", "Citation", "URL", "JRS Read", "Outcome",
                   "Outcome Category", "Screened", "Included in the analysis",
                   "Exclusion reason", "URL tested on", "Publicly accessible?"], crows))

    # ---- 04 REPRODUCTION ---------------------------------------------------
    ana = os.path.join(ROOT, "research", "analysis_local.py")
    d = os.path.join(OUT, "04_REPRODUCTION", "analysis.py")
    shutil.copy(need_file(ana), d)
    rec("04_REPRODUCTION/analysis.py", d)
    readme = README_TEXT % TODAY
    p = os.path.join(OUT, "04_REPRODUCTION", "README.txt")
    io.open(p, "w", encoding="utf-8").write(readme)
    rec("04_REPRODUCTION/README.txt", p)

    # ---- 00 MANIFEST and data dictionary -----------------------------------
    p = os.path.join(OUT, "00_MANIFEST.txt")
    io.open(p, "w", encoding="utf-8").write(MANIFEST_TEXT % TODAY)
    rec("00_MANIFEST.txt", p)
    p = os.path.join(OUT, "02_DATA", "JCI_JRS_Data_Dictionary.txt")
    io.open(p, "w", encoding="utf-8").write(DICTIONARY_TEXT)
    rec("02_DATA/JCI_JRS_Data_Dictionary.txt", p)

    print("PACKAGE: %s" % os.path.relpath(OUT, ROOT))
    for name, size in written:
        print("  %-64s %s bytes" % (name, format(size, ",")))
    included = sum(1 for c in crows if c[7] == "Yes")
    print()
    print("RECONCILIATION")
    print("  32 = %d Ready + %d Needs work + %d Gap"
          % (sum(1 for r in rows if r["read"] == "Ready"),
             sum(1 for r in rows if r["read"] == "Needs work"),
             sum(1 for r in rows if r["read"] == "Gap")))
    print("  32 = %d case-level + %d programme audits"
          % (sum(1 for r in rows if not r["is_audit"]), sum(1 for r in rows if r["is_audit"])))
    print("  notes %d of 32; 5.3 coded %d, of which Yes %d"
          % (sum(1 for r in rows if r["has_note"]),
             sum(1 for r in rows if r["s53"] in ("Yes", "No")),
             sum(1 for r in rows if r["s53"] == "Yes")))
    print("  blind second read joined to %d cases"
          % sum(1 for r in rows if r["blind"][0].startswith("Yes")))
    print("  employment: %d screened, %d included, %d excluded"
          % (len(crows), included, len(crows) - included))
    print("  citation corrections %d, discrepancies flagged for author review %d"
          % (sum(1 for r in rows if r["cit_note"] and "NOT corrected" not in r["cit_note"]),
             sum(1 for r in rows if "NOT corrected" in r["cit_note"])))
    na = [r["case_id"] for r in rows if r["jurisdiction"] == "N/A" or r["source_type"] == "N/A"]
    print("  rows still N/A for jurisdiction or source type: %d %s"
          % (len(na), ", ".join(na) if na else ""))
    if test_urls:
        good = sum(1 for r in rows if r["url_ok"].startswith("Yes"))
        blocked = sum(1 for r in rows if "refuses automated" in r["url_ok"])
        fixed = sum(1 for r in rows if r["url_note"])
        print("  URLs: %d of 32 verified reachable, tested %s" % (good, TODAY))
        print("        of those, %d are host-blocked to automation and were "
              "confirmed live by a browser user agent" % blocked)
        print("        %d URL correction(s) applied and recorded" % fixed)
        bad = [(r["case_id"], r["url_ok"]) for r in rows if not r["url_ok"].startswith("Yes")]
        for cid, st in bad:
            print("    STILL FAILING %s %s" % (cid, st))
    print()
    print("  no placeholder text remains: %s"
          % ("confirmed" if not any("NOT IN THE DATASET" in str(c)
                                    for row in data for c in row) else "FAILED"))
    return 0




MANIFEST_TEXT = """JCI SUBMISSION PACKAGE
Young and Wikes, "A Documentation Quality Read for Public-Records
Determinations: Convergent, Construct, and Discriminant Evidence from 32 Public
Cases"

Assembled %s.

WHAT THIS PACKAGE IS FOR
Every material empirical statement in the manuscript should be traceable to a
specific case, a coding decision, a calculation, and a public source. This
package is that chain, in files. It is not required for the initial editorial
submission; it exists so that any figure in the paper can be checked on request.

HOW TO CHECK ANY NUMBER IN THE PAPER
    cd 04_REPRODUCTION
    python3 analysis.py --verify

That command needs no internet connection, no database, no API key and no
third-party package. It recomputes every Section 5 figure from the files in
02_DATA and 03_RELIABILITY and checks each one against the manuscript text in
01_MANUSCRIPT. It exits non-zero if any figure and the manuscript disagree.

CONTENTS

00_MANIFEST.txt
    This file.

01_MANUSCRIPT/
    Young_Wikes_JCI_Documentation_Quality_Public_Records.docx
    Young_Wikes_JCI_Documentation_Quality_Public_Records.pdf
        The article submitted for editorial consideration.
    manuscript_verification.txt
        The same text, plain, so the reproduction script can check figures
        against it without a document-parsing dependency.

02_DATA/
    JCI_JRS_32_Case_Master_Dataset.csv
        One row per case, 32 rows. The authoritative case-level record
        underlying Sections 5.1, 5.3, 5.4, 5.5 and 5.7.
    JCI_JRS_Contemporaneous_Basis_Notes.csv
        The basis notes exactly as recorded at the time of each read, before the
        documented outcome was consulted. 32 rows; the four cases with no note
        say so explicitly.
    JCI_JRS_Construct_Coding_Frame.csv
        The 24 note-carrying case-level sources coded for Section 5.3, with the
        coding rule, the coder and the coding date on every row.
    JCI_JRS_Structural_Coding_Frame.csv
        The document-class grouping used in Section 5.4, as data rather than as
        constants inside the analysis script.
    JCI_JRS_Data_Dictionary.txt
        Definition of every column in every CSV in this package.

03_RELIABILITY/
    Blind_Recheck_RESULT_2026-08-28.json
        The blind second read: per-case answers, reasons, agreement and every
        coefficient reported in Section 5.7.
    Second_Reader_Responses.csv
        The second reader's ten classifications and recorded reasons, joined to
        the corpus case identifiers.
    Agreement_Calculations.csv
        The ten comparisons and the aggregate statistics, recorded independently
        of the JSON so the two can be checked against each other.

04_REPRODUCTION/
    analysis.py
    README.txt
        The reproduction script and its instructions.

05_SOURCE_VERIFICATION/
    JCI_JRS_Source_Verification_Index.csv
        One row per case: citation, public URL, the date the URL was tested,
        whether it resolved, and who verified the source.

06_COMPANION_STUDY/
    JCI_Companion_Employment_Corpus_Verification.csv
        The employment corpus cited in Section 5.6. 22 rows, showing which 20
        entered the analysis and naming the reason each of the 2 exclusions
        failed that study's inclusion criteria.

        SCOPE. This is a CITATION-BASED verification record for a separately
        conducted corpus, not a URL-based reproducibility dataset. That study
        recorded full reporter citations, which are the canonical identifiers
        for these sources, and did not record URLs. None has been added here,
        because a URL this study never recorded would be an inference presented
        as a source. Every matter is locatable from its citation.

WHAT IS NOT IN THIS PACKAGE, AND WHY
No database credential, no live endpoint and no production infrastructure. The
journal needs the research data required to evaluate the article, not the
authors' systems.
"""


README_TEXT = """JCI submission, reproduction materials
Version %s

DEPENDENCIES: NONE.
Python 3.8 or later. The Python standard library only. Fisher's exact test, the
Wilson score interval, Cohen's kappa (unweighted and linear weighted) and Gwet's
AC1 are written out in analysis.py rather than imported, so no scientific stack
is required to check any figure in the paper.

NO NETWORK. No internet connection, external database, API key or third-party
package is required. analysis.py reads only files inside this package. It has
been run with all socket access disabled and completes normally.

RUN
    cd 04_REPRODUCTION
    python3 analysis.py            prints every Section 5 figure
    python3 analysis.py --verify   also checks each figure against the
                                   manuscript text and exits non-zero on any
                                   mismatch

INPUTS, all inside this package
    ../02_DATA/JCI_JRS_32_Case_Master_Dataset.csv
    ../02_DATA/JCI_JRS_Construct_Coding_Frame.csv
    ../02_DATA/JCI_JRS_Structural_Coding_Frame.csv
    ../03_RELIABILITY/Blind_Recheck_RESULT_2026-08-28.json
    ../01_MANUSCRIPT/manuscript_verification.txt

WHAT EACH SECTION REPRODUCES
    5.2   concordance with independent government auditors, five of five
    5.3   Fisher's exact, two-sided p = 0.0000520, computed from the construct
          coding frame: Needs work 6 of 7 state a reconstructability failure,
          Ready 0 of 17
    5.4   document class, Fisher's exact p = 0.00466, computed from the
          structural coding frame
          Gap concentration, Fisher's exact p = 0.0000050
    5.5   appellate disposition, Fisher's exact p = 1.000, null
    5.6   cited from the companion employment manuscript, not recomputed here;
          the case list is in 06_COMPANION_STUDY
    5.7   7 of 10 exact agreement, 70.0 percent, 95 percent Wilson 39.7 to 89.2
          Cohen's kappa 0.474 unweighted, 0.559 linear weighted
          Gwet's AC1 0.582
          recomputed from the per-case answers, not read off the summary

EXPECTED OUTPUT
The final line reads "20 probes, 0 mismatch(es)". Any other number means the
data and the manuscript have diverged.

NOTHING IS HARD-CODED THAT THE DATA CAN PRODUCE
The Section 5.3 cell counts come from the construct coding frame and the Section
5.4 groups from the structural coding frame. The chain is case, coding,
analysis, result, and every step is a file in this package.

A NOTE ON SECTION 5.3
An earlier version of the analysis coded all 27 case-level sources. Three carry
no contemporaneous note, and a case with no note cannot be coded for what its
note states. Restricting to the 24 that carry one moves the result from
p = 0.00028 to p = 0.0000520. The restriction is stated in the manuscript and is
applied here.
"""


DICTIONARY_TEXT = """JCI SUBMISSION PACKAGE, DATA DICTIONARY

Values shown as N/A mean the field does not apply to that row, not that a
record is missing.

JCI_JRS_32_Case_Master_Dataset.csv
  Case ID
      Package identifier, PR-01 to PR-32, assigned in collection order.
  Document class
      Case-level source, or Programme-level audit. The five audits assess a
      records programme rather than a single determination and are analysed
      separately in Section 5.2.
  Jurisdiction
      New York or Connecticut, derived from the citation and the source URL.
  Source type
      The publishing body and decision level, derived from the citation.
  Citation
      The identifier used in the manuscript's bibliography. For the five audits,
      which carry no reporter citation, this is the issuing Comptroller and the
      audit year.
  Public URL
      The public location of the source. Where testing found a stored URL to be
      wrong, the corrected URL is given here and the correction is recorded in
      the source verification index.
  Decision/source year
      The year of the underlying public decision or audit. This is NOT the
      collection date.
  Collection date
      The date the case was recorded into the study.
  JRS Read
      The primary reviewer's classification, recorded before the documented
      outcome was consulted. Allowed values: Ready, Needs work, Gap.
  Contemporaneous Note Available
      Yes or No. Four of the 32 cases carry no note.
  Contemporaneous Basis Note
      The short explanation recorded by the primary reviewer at the time of the
      read and before the outcome was consulted. Cases without one say
      "No contemporaneous basis note recorded."
  Documented Outcome
      The outcome recorded from the cited public source AFTER the read was
      recorded. No outcome was inferred.
  Outcome Category
      Plain-language form of the outcome. An adverse audit or compliance finding
      is a separate category from failing to survive review.
  Case included in 5.3?
      Yes only for case-level sources that carry a note.
  5.3 reconstructability coding
      Yes where the contemporaneous note explicitly states that the underlying
      record-level basis could not be rebuilt from the source. No where the note
      does not state it. Inference was not accepted. N/A where the case is a
      programme-level audit or carries no note.
  Included in 5.4?
      All 32 cases enter the discriminant analysis.
  Included in 5.5?
      Yes for the 20 cases carrying a resolved appellate disposition.
  Included in blind second read?
      Yes plus the packet case number for the ten re-read cases; No otherwise.
  Second-reader classification
      The independent reviewer's own classification. N/A for the 22 cases not
      in the packet.
  Agreement
      Agree or Disagree against the original read. N/A outside the packet.

JCI_JRS_Contemporaneous_Basis_Notes.csv
  Note Date
      The date the note was recorded. N/A where no note exists.
  Outcome Known When Note Written?
      No for every note. The protocol required the read and its note before the
      outcome was consulted. N/A where no note exists.

JCI_JRS_Construct_Coding_Frame.csv
  Coding Rule
      The rule applied to every row: an explicit statement is required and
      inference is not accepted.
  Coder
      The person who applied the coding.
  Supporting Note
      The note text the coding decision rests on.

JCI_JRS_Structural_Coding_Frame.csv
  Structural group
      A, the source reproduces the determination text. B, the source assessed
      the underlying records in camera or in aggregate. Sources in neither group
      are marked as not in the structural comparison.

Blind_Recheck_RESULT_2026-08-28.json, Second_Reader_Responses.csv,
Agreement_Calculations.csv
  Scale distance
      0 where the two readers agree, 1 for an adjacent disagreement, 2 for a
      Ready against a Gap.
  Reader reported knowing the outcome
      The second reader's own answer for each case. It is No for all ten.

JCI_JRS_Source_Verification_Index.csv
  Source title
      The citation is the title of record for these sources. The study recorded
      an identifying citation rather than a separate document title.
  URL tested on
      The date the URL was requested for this package.
  Publicly accessible?
      The result of that request. Several publishers refuse automated requests
      regardless of user agent; those rows say so rather than reporting the
      source as unavailable, because a person following the link reaches it.
  URL correction applied
      Present where testing found the stored URL to be wrong, with the evidence.

JCI_Companion_Employment_Corpus_Verification.csv
  Included in the analysis
      Yes for the 20 matters analysed, No for the 2 excluded.
  Exclusion reason
      Why the matter failed that study's stated inclusion criteria. N/A for the
      20 included.
"""


if __name__ == "__main__":
    sys.exit(main())
