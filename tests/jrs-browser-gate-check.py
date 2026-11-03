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
    "/codebook.html", "/reference/index.html", "/recheck.html", "/compliance.html",
    "/reference/reviewer-worksheet/index.html", "/reference/escalation-triggers/index.html", "/reference/record-survivability/index.html", "/reviewer/index.html", "/evidence-ledger.html", "/datasets.html", "/questions.html", "/security.html", "/results.html", "/finding.html",

)
WIDTHS = (390, 1440)

STATES = (
    "resource-filter", "resource-empty", "mobile-navigation-open",
    "training-module-expanded", "training-optional-dialog",
    "training-completion-text", "accessible-format-routing",
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
        if data.get("scans") != 68 or data.get("expectedScans") != 68:
            raise ValueError("incomplete browser test coverage: " + str(data.get("scans")))
        if data.get("status") != "PASS" or data.get("errors"):
            raise ValueError("WCAG-tagged automated rule violations: " +
                             json.dumps(data.get("errors", []), ensure_ascii=False)[:9000])
        if len(data.get("reports", [])) != 68:
            raise ValueError("missing per-route axe audit records")
        expected_pairs = {(r, w) for r in ROUTES for w in WIDTHS}
        observed_pairs = {(row.get("route"), row.get("width")) for row in data["reports"]}
        if observed_pairs != expected_pairs:
            raise ValueError("non-exhaustive or duplicate route/width set in axe evidence")
        if any(row.get("violations") for row in data["reports"]):
            raise ValueError("axe report contains violations despite PASS summary")
        print("Axe WCAG-tagged preflight: 68/68 scans with zero automated violations.")
        print("Manual screen reader, zoom, PDF structure, and full WCAG acceptance remain separate.")
    elif expected == "reflow":
        try:
            data = json.loads(value)
        except ValueError as exc:
            raise ValueError("reflow fixture did not finish: " + value[:300]) from exc
        if not isinstance(data, dict):
            raise ValueError("invalid reflow result schema")
        expected_pairs = {(r, w) for r in ROUTES for w in (320, 400)}
        rows = data.get("reports")
        if not isinstance(rows, list) or len(rows) != len(expected_pairs):
            raise ValueError("missing or duplicated reflow observations")
        observed_pairs = {(r.get("route"), r.get("width")) for r in rows}
        if observed_pairs != expected_pairs or data.get("scans") != 68 or data.get("expectedScans") != 68:
            raise ValueError("incomplete or mismatched reflow coverage")
        for row in rows:
            width = row["width"]
            if (row.get("status") != "PASS" or
                    not isinstance(row.get("clientWidth"), (int, float)) or
                    not isinstance(row.get("scrollWidth"), (int, float)) or
                    not width-20 <= row["clientWidth"] <= width+2 or
                    row["scrollWidth"] > row["clientWidth"]+2):
                raise ValueError("reflow overflow or invalid geometry: " + json.dumps(row))
        if data.get("status") != "PASS" or data.get("errors"):
            raise ValueError("reflow audit failed: " + json.dumps(data.get("errors", []))[:9000])
        print("PASS: 68/68 320/400 CSS-pixel layout reflow observations across 34 public routes.")
        print("This is NOT independent browser-zoom, VoiceOver or PDF/UA acceptance.")
    elif expected == "states":
        try:
            data = json.loads(value)
        except ValueError as exc:
            raise ValueError("interaction fixture not finished: " + value[:300]) from exc
        expected_pairs = {(state, width) for state in STATES for width in WIDTHS}
        reports = data.get("reports") if isinstance(data, dict) else None
        expected_count = len(STATES) * len(WIDTHS)
        if (not isinstance(reports, list) or
                data.get("scans") != expected_count or data.get("expectedScans") != expected_count):
            raise ValueError("incomplete interaction-state coverage: " +
                             json.dumps({"scans": data.get("scans") if isinstance(data, dict) else None,
                                         "errors": data.get("errors", []) if isinstance(data, dict) else []},
                                        ensure_ascii=False)[:9000])
        observed_pairs = {(r.get("state"), r.get("width")) for r in reports}
        if observed_pairs != expected_pairs or len(reports) != expected_count:
            raise ValueError("duplicate or missing interaction-state evidence")
        # A visual axe PASS without keyboard dismissal and restored focus
        # is insufficient for dynamic-state acceptance.
        for row in reports:
            state, width = row.get("state"), row.get("width")
            expected_post = {
                "resource-empty": "filter-reset-restored",
                "mobile-navigation-open": ("menu-escape-focus-restored"
                                           if width == 390 else "desktop-navigation-visible"),
                "training-module-expanded": "module-collapse-restored",
                "training-optional-dialog": "dialog-escape-focus-restored",
            }.get(state, "not-applicable")
            if row.get("postCondition") != expected_post:
                raise ValueError("missing keyboard focus/dismissal evidence: %s at %s"
                                 % (state, width))
        if data.get("status") != "PASS" or data.get("errors") or any(
                r.get("violations") for r in reports):
            raise ValueError("interaction-state violations: " +
                             json.dumps(data.get("errors", []), ensure_ascii=False)[:9000])
        print("PASS: 14/14 dynamic interaction-state scans; WCAG-tagged automated rules report zero violations.")
        print("No form was submitted and no personal data was supplied.")
    elif expected == "check":
        try:
            data = json.loads(value)
        except ValueError as exc:
            raise ValueError("seven-point interaction fixture did not complete: " + value[:500]) from exc
        if not isinstance(data, dict) or data.get("scans") != 1 or data.get("expectedScans") != 1:
            raise ValueError("seven-point interaction fixture did not execute exactly once")
        if data.get("status") != "PASS" or data.get("errors") or len(data.get("checks", [])) < 12:
            raise ValueError("seven-point privacy/accessibility behavior failed: " +
                             json.dumps(data.get("errors", []), ensure_ascii=False)[:2500])
        print("PASS: seven-point live status, browser-local answers and path-only click telemetry.")
    else:
        raise ValueError("unknown fixture")
    return data if expected in ("axe", "states", "reflow", "check") else True


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
    sample = {"status": "PASS", "scans": 68, "expectedScans": 68,
              "errors": [], "reports": [{"route": r, "width": w, "violations": [],
                                     "incomplete": []} for r in ROUTES for w in WIDTHS]}
    verify('<html><pre id="result">' + json.dumps(sample) + '</pre></html>', "axe")
    try:
        verify('<html><script>PASS</script><pre id="result">RUNNING</pre></html>', "axe")
    except ValueError:
        pass
    else:
        raise ValueError("unexecuted axe fixture accepted")
    reflow = {"status": "PASS", "scans": 68, "expectedScans": 68,
              "errors": [], "reports": [
                  {"route": route, "width": width, "clientWidth": width-15,
                   "scrollWidth": width-15, "status": "PASS"}
                  for route in ROUTES for width in (320, 400)]}
    verify('<pre id="result">' + json.dumps(reflow) + '</pre>', "reflow")
    for mutation in ("overflow", "duplicate", "unexecuted"):
        bad = json.loads(json.dumps(reflow))
        if mutation == "overflow":
            bad["reports"][0]["scrollWidth"] = 800
        elif mutation == "duplicate":
            bad["reports"][0]["route"] = bad["reports"][1]["route"]
            bad["reports"][0]["width"] = bad["reports"][1]["width"]
        else:
            bad = {"status": "RUNNING", "scans": 0, "reports": []}
        try:
            verify('<pre id="result">' + json.dumps(bad) + '</pre>', "reflow")
        except ValueError:
            pass
        else:
            raise ValueError("invalid reflow evidence accepted: " + mutation)
    active = {"status": "PASS", "scans": len(STATES) * len(WIDTHS),
              "expectedScans": len(STATES) * len(WIDTHS),
              "errors": [], "reports": [
                  {"state": state, "width": width, "violations": [], "incomplete": [],
                   "postCondition": {
                       "resource-empty": "filter-reset-restored",
                       "mobile-navigation-open": ("menu-escape-focus-restored"
                                                  if width == 390 else "desktop-navigation-visible"),
                       "training-module-expanded": "module-collapse-restored",
                       "training-optional-dialog": "dialog-escape-focus-restored",
                   }.get(state, "not-applicable")}
                  for state in STATES for width in WIDTHS]}
    verify('<pre id="result">' + json.dumps(active) + '</pre>', "states")
    missing_dismissal = json.loads(json.dumps(active))
    missing_dismissal["reports"][0]["postCondition"] = "not-applicable"
    # First state is intentionally not applicable, so target the reset case.
    next(row for row in missing_dismissal["reports"]
         if row["state"] == "resource-empty")["postCondition"] = "not-applicable"
    try:
        verify('<pre id="result">' + json.dumps(missing_dismissal) + '</pre>', "states")
    except ValueError:
        pass
    else:
        raise ValueError("missing keyboard/clear-focus evidence accepted")
    duplicate = json.loads(json.dumps(active))
    duplicate["reports"][0]["state"] = "resource-empty"
    try:
        verify('<pre id="result">' + json.dumps(duplicate) + '</pre>', "states")
    except ValueError:
        pass
    else:
        raise ValueError("duplicate interaction-state results accepted")
    check_fixture={"status":"PASS","scans":1,"expectedScans":1,
                   "errors":[],"checks":["check-"+str(i) for i in range(14)]}
    verify('<pre id="result">'+json.dumps(check_fixture)+'</pre>', "check")
    for change in ("RUNNING","missing","errors"):
        bad=json.loads(json.dumps(check_fixture))
        if change=="RUNNING":bad["status"]="RUNNING"
        elif change=="missing":bad["checks"]=[]
        else:bad["errors"]=["unsent data"]
        try:verify('<pre id="result">'+json.dumps(bad)+'</pre>', "check")
        except ValueError:pass
        else:raise ValueError("unverified check privacy fixture accepted: "+change)
    print("PASS: parsed-result, unique interaction states and source-literal false-positive regressions.")


def main():
    if sys.argv[1:] == ["--self-test"]:
        self_test()
        return
    if len(sys.argv) not in (3, 4) or (len(sys.argv) == 4 and sys.argv[2] not in ("axe", "states", "reflow", "check")):
        raise SystemExit("Usage: jrs-browser-gate-check.py OUTPUT_HTML responsive|axe|states|reflow|check [EVIDENCE_JSON]")
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
