#!/usr/bin/env python3
"""Fail-closed reader for headless Chrome's local JRS structural audit."""
import html
import json
import re
import sys
from pathlib import Path
source=Path(sys.argv[1]).read_text(errors="replace")
m=re.search(r'JRS_AUDIT_JSON_BEGIN(.*?)JRS_AUDIT_JSON_END',source,re.S)
if not m:
    print("FAIL: no executed layout measurements found (browser/JS/load failure)")
    sys.exit(1)
try:
    records=json.loads(html.unescape(m.group(1)))
except (ValueError,TypeError) as exc:
    print("FAIL: invalid browser measurements",exc)
    sys.exit(1)
assert len(records)==9, f"Expected nine viewport samples, received {len(records)}"
for rec in records:
    print(("PASS" if rec.get("pass") else "FAIL"),json.dumps(rec,ensure_ascii=False))
if not all(rec.get("pass") for rec in records):
    sys.exit("FAIL: at least one mobile/desktop structural gate is not met")
print("PASS: nine local browser viewport checks. Screenshot judgment remains separate.")
