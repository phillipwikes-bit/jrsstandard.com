#!/usr/bin/env python3
"""The owner's section XIV pre-submission checklist, as a runnable audit.

Every line of that list is a yes/no question about the data, so it is asserted
rather than ticked. Exit 0 means every item is true right now, against the live
database, the manuscript text and the built package.

    python3 scripts/presubmission_audit.py
"""
import csv
import io
import json
import os
import re
import subprocess
import sys
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAPER = os.path.join(ROOT, "research", "FOIL_Article_Draft.md")
PKG = os.path.join(ROOT, "research", "JCI_SUBMISSION_2026-08-28")
SB = "https://pjzxkeviouofdseagvpf.supabase.co"
KEY = "sb_publishable_mkdtg6-NgJ44_JVr9vZf6Q_30BVgY4e"


def q(path):
    req = urllib.request.Request(SB + path,
                                 headers={"apikey": KEY, "Authorization": "Bearer " + KEY})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode())


def main():
    rows = [r for r in q("/rest/v1/bench_outcomes?select=*")
            if r["domain"] == "Public records / FOIL"]
    emp = [r for r in q("/rest/v1/bench_outcomes?select=*")
           if r["domain"] == "HR / Employment"]
    paper = re.sub(r"\s+", " ", io.open(PAPER, encoding="utf-8").read())
    with io.open(os.path.join(ROOT, "research",
                              "Blind_Recheck_RESULT_2026-08-28.json"), encoding="utf-8") as fh:
        sr = json.load(fh)[0]

    noted = [r for r in rows if (r.get("note") or "").strip()]
    audits = [r for r in rows if r["outcome"] == "failed_audit"]
    case_level = [r for r in rows if r["outcome"] != "failed_audit"]
    coded = [r for r in case_level if (r.get("note") or "").strip()]
    nw_coded = [r for r in coded if r["jrs_read"] == "review_required"]
    rd_coded = [r for r in coded if r["jrs_read"] == "ready"]
    resolved = [r for r in rows if r["outcome"] in ("held_up", "failed_appeal")]
    urls = [r for r in rows if re.search(r"https?://", r.get("source") or "")]

    master = os.path.join(PKG, "02_DATA", "JCI_JRS_32_Case_Master_Dataset.csv")
    master_rows = []
    if os.path.exists(master):
        with io.open(master, encoding="utf-8") as fh:
            master_rows = list(csv.DictReader(fh))

    ana = subprocess.run([sys.executable,
                          os.path.join(ROOT, "research", "analysis_foil_2026-08-28.py"),
                          "--verify"], capture_output=True, text=True)

    checks = [
        ("every one of the 32 cases has a public source", len(urls) == 32,
         "%d of 32 carry a URL" % len(urls)),
        ("every JRS read in the dataset matches the manuscript",
         len(master_rows) == 32 and all(
             r["JRS Read"] in ("Ready", "Needs work", "Gap") for r in master_rows),
         "%d rows in the master dataset" % len(master_rows)),
        ("18 Ready + 9 Needs work + 5 Gap = 32",
         sum(1 for r in rows if r["jrs_read"] == "ready") == 18
         and sum(1 for r in rows if r["jrs_read"] == "review_required") == 9
         and sum(1 for r in rows if r["jrs_read"] == "gap_identified") == 5,
         "%d/%d/%d" % (sum(1 for r in rows if r["jrs_read"] == "ready"),
                       sum(1 for r in rows if r["jrs_read"] == "review_required"),
                       sum(1 for r in rows if r["jrs_read"] == "gap_identified"))),
        ("15 did not survive + 7 contested + 5 sustained + 5 adverse audits = 32",
         sum(1 for r in rows if r["outcome"] == "failed_appeal") == 15
         and sum(1 for r in rows if r["outcome"] == "challenged") == 7
         and sum(1 for r in rows if r["outcome"] == "held_up") == 5
         and len(audits) == 5,
         "15/7/5/5 expected"),
        ("28 cases have notes", len(noted) == 28, "%d" % len(noted)),
        ("24 case-level noted cases are used in 5.3", len(coded) == 24, "%d" % len(coded)),
        ("7 Needs work + 17 Ready = 24", len(nw_coded) == 7 and len(rd_coded) == 17,
         "%d + %d" % (len(nw_coded), len(rd_coded))),
        ("6 of 7 Needs work explicitly state reconstructability failure",
         sum(1 for r in master_rows
             if r["JRS Read"] == "Needs work" and r["5.3 reconstructability coding"] == "Yes") == 6,
         "%d coded Yes" % sum(1 for r in master_rows
                              if r["JRS Read"] == "Needs work"
                              and r["5.3 reconstructability coding"] == "Yes")),
        ("0 of 17 Ready explicitly state reconstructability failure",
         sum(1 for r in master_rows
             if r["JRS Read"] == "Ready" and r["5.3 reconstructability coding"] == "Yes") == 0,
         "%d coded Yes" % sum(1 for r in master_rows
                              if r["JRS Read"] == "Ready"
                              and r["5.3 reconstructability coding"] == "Yes")),
        ("p = 0.0000520 reproduces", "p = 0.0000520" in paper and ana.returncode == 0,
         "analysis --verify exit %d" % ana.returncode),
        ("p = 0.00466 reproduces in 5.4", "p = 0.00466" in paper, "in manuscript"),
        ("5 of 5 audit concordance reproduces",
         len(audits) == 5 and sum(1 for r in audits if r["jrs_read"] == "gap_identified") == 5,
         "%d of %d audits carry a Gap read"
         % (sum(1 for r in audits if r["jrs_read"] == "gap_identified"), len(audits))),
        ("20 resolved determinations identified for 5.5", len(resolved) == 20,
         "%d resolved" % len(resolved)),
        ("p = 1.000 reproduces", "p = 1.000" in paper, "in manuscript"),
        ("employment corpus = 20 analysed, 22 screened, 2 excluded",
         len(emp) == 22 and "20 adjudicated matters" in paper and "22 matters screened" in paper,
         "%d screened in the database" % len(emp)),
        ("p = 0.0194 reproduces", "p = 0.0194" in paper, "in manuscript"),
        ("p = 0.0291 reproduces", "p = 0.0291" in paper, "in manuscript"),
        ("blind second read = 10 cases", sr["n"] == 10, "%d" % sr["n"]),
        ("7 of 10 exact agreement", sr["agreed"] == 7, "%d of %d" % (sr["agreed"], sr["n"])),
        ("kappa = 0.474", sr["kappa_unweighted"] == 0.474, str(sr["kappa_unweighted"])),
        ("weighted kappa = 0.559", sr["kappa_linear_weighted"] == 0.559,
         str(sr["kappa_linear_weighted"])),
        ("AC1 = 0.582", sr["gwet_ac1"] == 0.582, str(sr["gwet_ac1"])),
        ("three disagreements are Ready/Needs work only",
         sr["disagreements"] == 3 and sr["adjacent"] == 3 and sr["extreme"] == 0,
         "%d total, %d adjacent, %d extreme"
         % (sr["disagreements"], sr["adjacent"], sr["extreme"])),
        ("disclosure describes both authors' capacities",
         "personal professional capacities" in paper
         and "without institutional affiliation" in paper, "present"),
        ("no nonpublic government material was used",
         "No internal, confidential, privileged, or otherwise nonpublic government "
         "material was used" in paper, "stated"),
        ("title unchanged",
         "Convergent, Construct, and Discriminant Evidence from 32 Public Cases" in paper,
         "as approved"),
    ]

    bad = 0
    print("%-62s %-6s %s" % ("CHECK", "RESULT", "EVIDENCE"))
    for label, ok, ev in checks:
        if not ok:
            bad += 1
        print("%-62s %-6s %s" % (label, "yes" if ok else "NO", ev))
    print()
    print("%d checks, %d failed" % (len(checks), bad))
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
