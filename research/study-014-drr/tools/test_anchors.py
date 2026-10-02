#!/usr/bin/env python3
"""Tests for the anchor extractor, fixed before any study run."""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from anchors import extract, retention, fabricated

SRC = ('On March 3, 2018, S1 stated that Complainant was late. RMO2 averred that the decision was made in April 2018 '
       '(ROI at 125). CW1 testified that "she was never told about the policy" and Complainant alleged reprisal on 4/9/2018. '
       'See Exhibit F.')
fails = 0
def check(name, cond):
    global fails
    print(("PASS " if cond else "FAIL ") + name)
    fails += 0 if cond else 1

a = extract(SRC)
check("dates", a["date"] == {"2018-03-03", "2018-04", "2018-04-09"})
check("citations", a["citation"] == {"roi:125", "exhibit:F"})
check("attributions", a["attribution"] == {"s1", "rmo2", "cw1", "complainant"})
check("quote", a["quote"] == {"she was never told about the policy"})
check("month-year not double counted inside full date", "2018-03" not in a["date"])

full = retention(SRC, SRC)
check("self retention is 1.0 for every type", all(v == 1.0 for v in full.values()))
draft = "Complainant alleged she was disciplined after a manager said she was late. Management made the decision in spring 2018."
r = retention(SRC, draft)
check("draft loses dates", r["date"] == 0.0)
check("draft loses citations", r["citation"] == 0.0)
check("draft keeps only the complainant attribution", r["attribution"] == 0.25)
check("draft loses the quote", r["quote"] == 0.0)
fab = fabricated(SRC, 'On May 1, 2019, S1 stated "the file was complete and reviewed" (ROI at 400).')
check("fabricated date found", fab["date"] == ["2019-05-01"])
check("fabricated citation found", fab["citation"] == ["roi:400"])
check("fabricated quote found", len(fab["quote"]) == 1)
check("no fabrication when draft only reuses source", all(not v for v in fabricated(SRC, SRC).values()))
check("empty type gives None retention", retention("No anchors here at all.", "x")["date"] is None)
print(f"{fails} failed")
sys.exit(1 if fails else 0)
