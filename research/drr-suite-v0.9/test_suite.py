#!/usr/bin/env python3
"""Tests for the DRR Test Suite v0.9 scorer (extractor v1.2). Run: python3 test_suite.py"""
import glob, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "lib"))
import anchors_v12 as V
from cloze import cloze_items, cloze_correct

fails = 0
def check(name, cond):
    global fails
    print(("PASS " if cond else "FAIL ") + name)
    fails += 0 if cond else 1

SRC = ('On March 3, 2018, S1 stated that Complainant was late. RMO2 averred that the decision was made in April 2018 '
       '(ROI at 125). CW1 testified that "she was never told about the policy" and Complainant alleged reprisal on 4/9/2018. '
       'See Exhibit F. Supervisor said "huh?" and then "you will [not] be paid for that day." Manager directed staff to '
       '"tamper any escalation of [human resources (HR)] issues for the team." ROI at 77- 80 and 90; ROI1 at 437; 448.')

e = V.extract(SRC)
check("dates unchanged from v1.0", e["date"] == {"2018-03-03", "2018-04", "2018-04-09"})
check("page lists joined by and / semicolon", {"roi:125", "roi:77", "roi:90", "roi:437", "roi:448", "exhibit:F"} <= e["citation"])
check("short quote does not open a false quote", not any(q.startswith("and then") for q in e["quote"]))
check("quote after a short quote is still found", "you will not be paid for that day" in e["quote"])
check("self retention 1.0", all(v in (None, 1.0) for v in V.retention(SRC, SRC).values()))
check("self fabrication empty", not any(V.fabricated(SRC, SRC).values()))

ok_draft = ('S1 stated on March 3, 2018 that Complainant was late (ROI at 125, 90). The manager directed staff to "tamper any '
            'escalation of HR issues for the team." CW1 said "she was never told about the policy" and Supervisor said '
            '"huh?" before "you will not be paid for that day."')
f = V.fabricated(SRC, ok_draft)
check("faithful bracket resolution is not fabricated", f["quote"] == [])
check("cited pages present in a list are not fabricated", f["citation"] == [])

bad = 'On May 1, 2019, S1 stated "the file was complete and reviewed by everyone" (ROI at 400). See ROI1 (ROI1 at 437).'
f = V.fabricated(SRC, bad)
check("invented date caught", f["date"] == ["2019-05-01"])
check("invented citation caught, and ROI1 label not read as page 1", f["citation"] == ["roi:400"])
check("invented quote caught", len(f["quote"]) == 1)
check("heading then numbered list is not a citation", "roi:7" not in V.citations("Report of Investigation (ROI)\n\n7. The Agency"))
check("shortened date is not fabrication", V.fabricated(SRC, "In March 2018, S1 stated it.")["date"] == [])

for f_ in sorted(glob.glob(os.path.join(HERE, "practice", "*.txt"))):
    s = open(f_).read()
    if any(v not in (None, 1.0) for v in V.retention(s, s).values()) or any(V.fabricated(s, s).values()):
        check("practice self-consistency " + os.path.basename(f_), False)
check("practice set self-consistency (30 texts)", fails == 0)

items = cloze_items(SRC)
check("cloze items generated", len(items) >= 3 and all("[MASK]" in it["sentence"] for it in items))
check("cloze scoring exact", cloze_correct(items[0], "March 3, 2018") and not cloze_correct(items[0], "not stated"))
print(f"{fails} failed")
sys.exit(1 if fails else 0)
