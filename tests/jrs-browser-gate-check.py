#!/usr/bin/env python3
"""Parse the rendered result element, never the fixture's script source.

Chrome --dump-dom includes <script> contents, so grep for a PASS literal can
report success even when the browser never executed its test. Fail closed.
"""
import json
import sys
from html.parser import HTMLParser
from pathlib import Path


class ResultParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.in_result = False
        self.results = []
        self.fragments = []

    def handle_starttag(self, tag, attrs):
        if tag == "pre" and dict(attrs).get("id") == "result":
            if self.in_result:
                raise ValueError("nested result element")
            self.in_result = True
            self.fragments = []

    def handle_endtag(self, tag):
        if tag == "pre" and self.in_result:
            self.results.append("".join(self.fragments).strip())
            self.in_result = False

    def handle_data(self, data):
        if self.in_result:
            self.fragments.append(data)


def verify(html, expected):
    parser = ResultParser()
    parser.feed(html)
    if parser.in_result or len(parser.results) != 1:
        raise ValueError("missing or duplicated rendered result element")
    value = parser.results[0]
    if expected == "responsive":
        if value != "PASS 12/12 responsive route checks; guide headings, table associations and menu keyboard states verified":
            raise ValueError("responsive browser result not passing: " + value[:1800])
    elif expected == "axe":
        try:
            data = json.loads(value)
        except ValueError as exc:
            raise ValueError("axe fixture did not complete with JSON evidence: " + value[:200]) from exc
        if not isinstance(data, dict):
            raise ValueError("invalid axe result schema")
        if data.get("scans") != 16 or data.get("expectedScans") != 16:
            raise ValueError("incomplete browser test coverage: " + str(data.get("scans")))
        if data.get("status") != "PASS" or data.get("errors"):
            raise ValueError("WCAG-tagged automated rule violations: " +
                             json.dumps(data.get("errors", []), ensure_ascii=False)[:9000])
        if len(data.get("reports", [])) != 16:
            raise ValueError("missing per-route axe audit records")
        print("Axe WCAG-tagged preflight: 16/16 scans with zero automated violations.")
        print("Manual screen reader, zoom, PDF structure, and full WCAG acceptance remain separate.")
    else:
        raise ValueError("unknown fixture")
    return True


def self_test():
    good = '<html><pre id="result">PASS 12/12 responsive route checks; guide headings, table associations and menu keyboard states verified</pre></html>'
    verify(good, "responsive")
    # Source-only PASS text must not satisfy the parser.
    fake = '<html><script>const v="PASS 12/12 responsive route checks; guide headings, table associations and menu keyboard states verified";</script><pre id="result">Running</pre></html>'
    try:
        verify(fake, "responsive")
    except ValueError:
        pass
    else:
        raise ValueError("PASS-in-script false positive accepted")
    sample = {"status": "PASS", "scans": 16, "expectedScans": 16,
              "errors": [], "reports": [{} for _ in range(16)]}
    verify('<html><pre id="result">' + json.dumps(sample) + '</pre></html>', "axe")
    try:
        verify('<html><script>PASS</script><pre id="result">RUNNING</pre></html>', "axe")
    except ValueError:
        pass
    else:
        raise ValueError("unexecuted axe fixture accepted")
    print("PASS: parsed-result and source-literal false-positive regressions.")


def main():
    if sys.argv[1:] == ["--self-test"]:
        self_test()
        return
    if len(sys.argv) != 3:
        raise SystemExit("Usage: jrs-browser-gate-check.py OUTPUT_HTML responsive|axe")
    try:
        verify(Path(sys.argv[1]).read_text(encoding="utf-8"), sys.argv[2])
    except (ValueError, OSError) as exc:
        raise SystemExit("RELEASE HOLD: " + str(exc)) from None


if __name__ == "__main__":
    main()
