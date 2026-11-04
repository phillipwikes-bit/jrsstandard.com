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
if len(rows) != 26:
    sys.exit(f"FAIL: expected 26 page/viewport measurements, got {len(rows)}")
for item in rows:
    state = "PASS" if item.get("pass") else "FAIL"
    print(state, json.dumps(item, ensure_ascii=False))
if not all(item.get("pass") for item in rows):
    sys.exit("FAIL: at least one JRS source-rendered light-theme sample disagrees")
print("PASS: computed-color/type samples on 13 routes at 390px and 1440px (not a full accessibility audit)")
