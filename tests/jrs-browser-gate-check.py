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


ROUTES = (
    "/index.html", "/resources.html", "/editions.html", "/organization.html",
    "/training.html", "/jrsstandard.html", "/investigator-guides.html",
    "/contact.html", "/research.html", "/check.html", "/simulations.html",
    "/about.html", "/methodology.html", "/decision-reconstruction-risk.html",
    "/research-summary.html", "/privacy-notice.html", "/operational-boundaries.html",
    "/implementation-scenarios.html", "/review-engine.html", "/research-register.html",
)
WIDTHS = (390, 1440)

STATES = (
    "resource-filter", "resource-empty", "mobile-navigation-open",
    "training-module-expanded", "training-optional-dialog",
    "accessible-format-routing",
)



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
        if data.get("scans") != 40 or data.get("expectedScans") != 40:
            raise ValueError("incomplete browser test coverage: " + str(data.get("scans")))
        if data.get("status") != "PASS" or data.get("errors"):
            raise ValueError("WCAG-tagged automated rule violations: " +
                             json.dumps(data.get("errors", []), ensure_ascii=False)[:9000])
        if len(data.get("reports", [])) != 40:
            raise ValueError("missing per-route axe audit records")
        expected_pairs = {(r, w) for r in ROUTES for w in WIDTHS}
        observed_pairs = {(row.get("route"), row.get("width")) for row in data["reports"]}
        if observed_pairs != expected_pairs:
            raise ValueError("non-exhaustive or duplicate route/width set in axe evidence")
        if any(row.get("violations") for row in data["reports"]):
            raise ValueError("axe report contains violations despite PASS summary")
        print("Axe WCAG-tagged preflight: 40/40 scans with zero automated violations.")
        print("Manual screen reader, zoom, PDF structure, and full WCAG acceptance remain separate.")
    elif expected == "states":
        try:
            data = json.loads(value)
        except ValueError as exc:
            raise ValueError("interaction fixture not finished: " + value[:300]) from exc
        expected_pairs = {(state, width) for state in STATES for width in WIDTHS}
        reports = data.get("reports") if isinstance(data, dict) else None
        if (not isinstance(reports, list) or
                data.get("scans") != 12 or data.get("expectedScans") != 12):
            raise ValueError("incomplete interaction-state coverage: " +
                             json.dumps({"scans": data.get("scans") if isinstance(data, dict) else None,
                                         "errors": data.get("errors", []) if isinstance(data, dict) else []},
                                        ensure_ascii=False)[:9000])
        observed_pairs = {(r.get("state"), r.get("width")) for r in reports}
        if observed_pairs != expected_pairs or len(reports) != 12:
            raise ValueError("duplicate or missing interaction-state evidence")
        if data.get("status") != "PASS" or data.get("errors") or any(
                r.get("violations") for r in reports):
            raise ValueError("interaction-state violations: " +
                             json.dumps(data.get("errors", []), ensure_ascii=False)[:9000])
        print("PASS: 12/12 dynamic interaction-state scans; WCAG-tagged automated rules report zero violations.")
        print("No form was submitted and no personal data was supplied.")
    else:
        raise ValueError("unknown fixture")
    return data if expected in ("axe", "states") else True


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
    sample = {"status": "PASS", "scans": 40, "expectedScans": 40,
              "errors": [], "reports": [{"route": r, "width": w, "violations": [],
                                     "incomplete": []} for r in ROUTES for w in WIDTHS]}
    verify('<html><pre id="result">' + json.dumps(sample) + '</pre></html>', "axe")
    try:
        verify('<html><script>PASS</script><pre id="result">RUNNING</pre></html>', "axe")
    except ValueError:
        pass
    else:
        raise ValueError("unexecuted axe fixture accepted")
    active = {"status": "PASS", "scans": 12, "expectedScans": 12,
              "errors": [], "reports": [
                  {"state": state, "width": width, "violations": [], "incomplete": []}
                  for state in STATES for width in WIDTHS]}
    verify('<pre id="result">' + json.dumps(active) + '</pre>', "states")
    duplicate = json.loads(json.dumps(active))
    duplicate["reports"][0]["state"] = "resource-empty"
    try:
        verify('<pre id="result">' + json.dumps(duplicate) + '</pre>', "states")
    except ValueError:
        pass
    else:
        raise ValueError("duplicate interaction-state results accepted")
    print("PASS: parsed-result, unique interaction states and source-literal false-positive regressions.")


def main():
    if sys.argv[1:] == ["--self-test"]:
        self_test()
        return
    if len(sys.argv) not in (3, 4) or (len(sys.argv) == 4 and sys.argv[2] not in ("axe", "states")):
        raise SystemExit("Usage: jrs-browser-gate-check.py OUTPUT_HTML responsive|axe|states [EVIDENCE_JSON]")
    try:
        result = verify(Path(sys.argv[1]).read_text(encoding="utf-8"), sys.argv[2])
        if len(sys.argv) == 4:
            Path(sys.argv[3]).write_text(
                json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
            print("PASS: wrote public-route-only machine-readable audit evidence.")

    except (ValueError, OSError) as exc:
        raise SystemExit("RELEASE HOLD: " + str(exc)) from None


if __name__ == "__main__":
    main()
