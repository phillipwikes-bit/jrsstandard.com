#!/usr/bin/env python3
"""Read the local Chrome iframe audit. Fail on missing/stale browser execution."""
import html
import json
import re
import sys
from pathlib import Path

raw = Path(sys.argv[1]).read_text(encoding="utf-8", errors="replace")
m = re.search(r"JRS_THEME_JSON_BEGIN(.*?)JRS_THEME_JSON_END", raw, re.S)
if not m:
    sys.exit("FAIL: no computed browser theme measurements")
try:
    rows = json.loads(html.unescape(m.group(1)))
except ValueError as exc:
    sys.exit(f"FAIL: invalid browser theme JSON ({exc})")
# Expect all 12 currently served publication and retained legacy pages, not the
# retired Review Engine HTML page. Require both independent viewport samples.
routes = (
    "jrsstandard.html", "training.html", "access.html",
    "reviewer/evaluation.html", "reviewer/completion.html",
    "recheck.html", "security.html", "coauthor.html", "honor.html",
    "ai-records-arm-b.html", "404.html", "people.html",
)
expected = {(route, width) for route in routes for width in (390, 1440)}
actual = [(row.get("path"), row.get("width")) for row in rows]
if len(actual) != len(expected) or set(actual) != expected:
    sys.exit(
        f"FAIL: expected all {len(expected)} current page/viewport combinations, "
        f"got {len(actual)} with missing={sorted(expected-set(actual))} "
        f"extra={sorted(set(actual)-expected)}"
    )
for item in rows:
    state = "PASS" if item.get("pass") else "FAIL"
    print(state, json.dumps(item, ensure_ascii=False))
if not all(item.get("pass") for item in rows):
    sys.exit("FAIL: at least one JRS source-rendered light-theme sample disagrees")
print("PASS: computed-color/type samples on 12 routes at 390px and 1440px (not a full accessibility audit)")
