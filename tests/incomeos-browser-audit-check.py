"""Check actual headless Chrome DOM results from a synthetic IncomeOS viewport audit."""
import html
import json
import pathlib
import re
import sys

if len(sys.argv) != 2:
    raise SystemExit("Usage: incomeos-browser-audit-check.py DOM_FILE")
body = pathlib.Path(sys.argv[1]).read_text(encoding="utf-8", errors="replace")
match = re.search(
    r'<output\\b[^>]*id=["\\']incomeos-browser-audit["\\'][^>]*>(.*?)</output>',
    body,
    re.IGNORECASE | re.DOTALL,
)
if not match:
    raise SystemExit("FAILED: Chrome did not render the IncomeOS audit output")
text = html.unescape(match.group(1))
try:
    result = json.loads(text)
except ValueError as exc:
    raise SystemExit("FAILED: invalid Chrome audit result: " + str(exc))
if result.get("status") != "PASS":
    raise SystemExit("FAILED: browser audit: " + repr(result.get("errors")))
expected = [320, 375, 430, 650]
actual = [r["width"] for r in result.get("widths", [])]
if actual != expected:
    raise SystemExit("FAILED: missing mobile widths: " + repr(actual))
for row in result["widths"]:
    if row["contentWidth"] > row["viewport"] + 2:
        raise SystemExit("FAILED: horizontal overflow at " + str(row["width"]))
    if row["studies"] < 1:
        raise SystemExit("FAILED: empty research feed at " + str(row["width"]))
if len(result.get("checks", [])) < 70:
    raise SystemExit("FAILED: missing expected browser assertions")
print(
    "IncomeOS Chrome source-rendered audit passed: "
    + ", ".join(str(x) + "px" for x in expected)
    + "; 4 viewports, " + str(len(result["checks"])) + " assertions."
)
print("This is NOT an authenticated iPhone Safari or VoiceOver test.")
