#!/usr/bin/env python3
"""Check sitewide source-rendered mobile presentation evidence.

This validates the current sitemap and retained public route sources at four widths.
It is NOT WCAG certification, PDF accessibility, VoiceOver testing or a live
submission/consent acceptance test. Preserve small-control observations
for manual investigation without implying all targets have been certified.
"""
import html
import json
import re
import sys
import xml.etree.ElementTree as ET
from urllib.parse import urlsplit
from collections import Counter
from pathlib import Path

raw=Path(sys.argv[1]).read_text(encoding="utf-8",errors="replace")
match=re.search(r"JRS_SITEWIDE_JSON_BEGIN(.*?)JRS_SITEWIDE_JSON_END",raw,re.S)
if not match:
    raise SystemExit("FAIL: no complete sitewide Chrome render evidence")
try:
    rows=json.loads(html.unescape(match.group(1)))
except (ValueError,TypeError) as exc:
    raise SystemExit(f"FAIL: invalid sitewide browser JSON ({exc})")
root=Path(__file__).resolve().parent.parent
sitemap=ET.parse(root/'sitemap.xml')
expected=set()
for loc in sitemap.findall('.//{*}loc'):
    path=urlsplit(loc.text).path.lstrip('/')
    expected.add('index.html' if not path else path+'index.html' if path.endswith('/') else path)
fixture=(root/'tests/jrs-sitewide-mobile-browser-audit.html').read_text()
extra=re.search(r'const additionalPaths=(\[[^\n;]*\]);',fixture)
if not extra:
    raise SystemExit('FAIL: retained public browser inventory is missing')
expected.update(json.loads(extra.group(1)))
widths={320,390,768,1440}
pairs={(r.get('path'),r.get('width')) for r in rows}
expected_pairs={(path,width) for path in expected for width in widths}
if pairs!=expected_pairs or len(rows)!=len(expected_pairs):
    raise SystemExit(f'FAIL: expected {len(expected_pairs)} unique current route/viewport samples; received {len(rows)}')
pages={r.get('path') for r in rows}
failed=[r for r in rows if not r.get("pass")]
small=[r for r in rows if r.get("undersizedControls")]
for r in failed:
    print("FAIL",r.get("path"),r.get("width"),r.get("failures") or r.get("error"))
print(f"Measured {len(pages)} distinct public routes and {len(rows)} responsive viewport samples.")
print(f"Potentially undersized controls on {len(small)} viewport samples; require review of target-size exceptions.")
print(f"Advisory: {sum(r.get('advisoryUnder44px',0) for r in rows)} visible control samples shorter than 44px; not all may fail WCAG target spacing or exception rules.")
for r in rows:
    if r.get('advisoryUnder44px',0):
        print('REVIEW TOUCH TARGET', r.get('path'), r.get('width'), 'control count', r['advisoryUnder44px'])
if small:
    for r in small[:15]:
        print("REVIEW",r["path"],r["width"],r["undersizedControls"])
if failed:
    raise SystemExit(f"FAIL: {len(failed)} source-rendered mobile route checks failed")
print("PASS: no horizontal overflow, missing title/language/viewport/H1, institutional theme regression or mobile navigation semantics defect in checked samples.")
print("LIMITATION: no PDF, live form, screen reader or complete WCAG certification performed.")
