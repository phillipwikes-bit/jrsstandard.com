#!/usr/bin/env python3
"""Fail-closed checks for synthetic, source-rendered JRS review printouts."""
from pathlib import Path
import sys

if len(sys.argv) != 3:
    raise SystemExit("Usage: jrs-check-print-evidence.py EMPTY_TEXT SELECTED_TEXT")
empty = " ".join(Path(sys.argv[1]).read_text(encoding="utf-8").split())
selected = " ".join(Path(sys.argv[2]).read_text(encoding="utf-8").split())
title = "JRS | Seven-Point Record Review Summary"
for phrase in (title, "Tick the boxes that apply to the record in front of you."):
    if phrase not in empty:
        raise SystemExit("RELEASE HOLD: unselected print missing required content: " + phrase)
for phrase in (
    title, "2 checked questions warrant review",
    "Fluent groundlessness", "Chronology collapse",
    "A larger count does not establish a diagnostic category",
    "Not certification, not accreditation, not a credential",
):
    if phrase not in selected:
        raise SystemExit("RELEASE HOLD: selected review print missing: " + phrase)
for name, output in (("empty", empty), ("selected", selected)):
    for forbidden in (
        "Site menu", "Close site menu", "Seven documentation-risk patterns",
        "Check one record now", "Take it further", "Make this a policy",
        "Copy summary", "Print or save as PDF",
        "What trained reviewers found", "83.9%",
    ):
        if forbidden in output:
            raise SystemExit("RELEASE HOLD: " + name + " print includes non-record material: " + forbidden)
print("PASS: empty and synthetic selected printed notes retain record-relevant findings, warnings and provenance only.")
print("LIMITATION: printed-text assertions are not tagged PDF, physical zoom or human screen-reader conformance.")
