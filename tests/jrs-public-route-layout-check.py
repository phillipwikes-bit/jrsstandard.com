#!/usr/bin/env python3
"""Check computed styles from a real local headless Chrome session."""
import html
import json
import re
import sys
from pathlib import Path
source=Path(sys.argv[1]).read_text(errors='replace')
match=re.search(r'JRS_LEGACY_JSON_BEGIN(.*?)JRS_LEGACY_JSON_END',source,re.S)
if not match:
    sys.exit('FAIL: browser never completed public route style measurements')
records=json.loads(html.unescape(match.group(1)))
assert len(records)==19, f'Expected 19 route/viewport measurements, got {len(records)}'
for record in records:
    print(('PASS' if record.get('pass') else 'FAIL'),json.dumps(record,ensure_ascii=False))
if not all(record.get('pass') for record in records):
    sys.exit('FAIL: legacy public route rendered tokens or viewport do not match institutional design')
print('PASS: 19 real-browser palette/typography/viewport samples across 11 public routes')
