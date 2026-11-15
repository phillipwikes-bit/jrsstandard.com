#!/usr/bin/env python3
"""Fail-closed JRS candidate preview identity check.

This verifies static publication bytes for the exact checked-out PR head. It does
not certify visual quality, authenticated APIs, privacy execution or production.
A Vercel sign-in page, stale preview, HTTP error or missing URL is a release HOLD.
"""
import hashlib
import json
import os
import re
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import subprocess
import sys
from urllib.error import HTTPError, URLError
from urllib.parse import urlparse
from urllib.request import Request, urlopen, build_opener, HTTPRedirectHandler

ROOT = Path(__file__).resolve().parents[1]
# The browser regression inventory supplies all 68 institutional route paths.
# One declared route is intentionally redirected; never byte-compare it as HTML.
# Keep this sourced from the independently guarded audit, not a second short
# hand-maintained subset that can silently overlook other public pages.
STATIC_CHECKS = {
    "/": "index.html",
    "/assets/jrs-institutional-reference.css": "assets/jrs-institutional-reference.css",
    "/assets/jrs-mobile-navigation.js": "assets/jrs-mobile-navigation.js",
    "/assets/jrs-resource-catalog.js": "assets/jrs-resource-catalog.js",
}
EXPECTED_REDIRECTS = {"/privacy.html": "/privacy-notice.html"}


def release_inventory():
    fixture = (ROOT / "tests/jrs-sitewide-mobile-browser-audit.html").read_text(
        encoding="utf-8")
    match = re.search(r"const paths=(\[[^\n;]*\]);", fixture)
    if not match:
        fail("missing independently guarded source route inventory")
    try:
        routes = json.loads(match.group(1))
        redirects = json.loads((ROOT / "vercel.json").read_text(encoding="utf-8"))["redirects"]
    except (ValueError, TypeError, KeyError):
        fail("malformed published route or Vercel redirect inventory")
    if (not isinstance(routes, list) or len(routes) != 68
            or len(set(routes)) != 68):
        fail("expected 68 unique institutional route paths")
    actual_redirects = {
        item["source"]: item["destination"]
        for item in redirects if "/" + str(item.get("source", "")).lstrip("/") in
        {"/" + route for route in routes}
    }
    if actual_redirects != EXPECTED_REDIRECTS:
        fail("published route redirect set changed without exact-host verification review")
    # The one source redirect must be temporary, not a silently permanent move.
    privacy = [item for item in redirects if item.get("source") == "/privacy.html"]
    if len(privacy) != 1 or privacy[0].get("permanent") is not False:
        fail("privacy redirect contract changed")
    html = {}
    for route in routes:
        if not isinstance(route, str) or not re.fullmatch(
                r"(?:[a-z0-9-]+/)*[a-z0-9-]+\.html", route):
            fail("invalid route in verified HTML source inventory")
        local = ROOT / route
        if not local.is_file():
            fail("source HTML file missing from release inventory: " + route)
        if "/" + route not in EXPECTED_REDIRECTS:
            html["/" + route] = route
    if len(html) != 67 or not all((ROOT / x).is_file() for x in STATIC_CHECKS.values()):
        fail("incomplete 67-page plus four static-source exact-byte comparison scope")
    return {**STATIC_CHECKS, **html}, EXPECTED_REDIRECTS


# These nine public PDF routes must deliver their exact local file bytes. All
# verification requests use src=verify to avoid contaminating download metrics.
DOWNLOADS = {
    "standard": "JRS-Standard.pdf",
    "card": "JRS_Rapid_Review_Card.pdf",
    "employment": "JRS_Investigator_Field_Guide_Employment.pdf",
    "fairhousing": "JRS_Investigator_Field_Guide_FairHousing.pdf",
    "international": "JRS_Investigator_Field_Guide_International.pdf",
    "drr": "DRR_Article.pdf",
    "paper": "JRS_Research_Paper.pdf",
    "accuracy": "JRS_Reliability_Accuracy.pdf",
}
REFERENCE_FILE = "JRS-Reference-9d4f2a7c.pdf"

# Vercel may append its own preview feedback script AFTER the published HTML.
# Accept only this exact platform trailer, never changes to the JRS source.
VERCEL_LIVE_TRAILER = re.compile(
    rb'<script async data-explicit-opt-in="true" data-deployment-id="dpl_[A-Za-z0-9]+" '
    rb'src="https://vercel\.live/_next-live/feedback/feedback\.js"></script>'
)

def matches_release_source(received, expected, local):
    if received == expected:
        return True
    return (local.endswith(".html")
            and received.startswith(expected)
            and bool(VERCEL_LIVE_TRAILER.fullmatch(received[len(expected):])))

def self_test():
    original = b"<html><body>JRS</body></html>\n"
    trailer = (b'<script async data-explicit-opt-in="true" '
               b'data-deployment-id="dpl_A1b2C3" '
               b'src="https://vercel.live/_next-live/feedback/feedback.js"></script>')
    checks = [
        ("unaltered HTML", original, original, "index.html", True),
        ("exact Vercel appendix", original + trailer, original, "index.html", True),
        ("changed body", original.replace(b"JRS", b"BAD") + trailer, original, "index.html", False),
        ("unexpected HTML appendix", original + b"<script>bad</script>", original, "index.html", False),
        ("duplicate Vercel appendix", original + trailer + trailer, original, "index.html", False),
        ("altered Vercel host", original + trailer.replace(b"vercel.live", b"other.live"), original, "index.html", False),
        ("modified CSS", b"body{}" + trailer, b"body{}", "assets/site.css", False),
        ("modified PDF", b"%PDF-" + trailer, b"%PDF-", "JRS-Standard.pdf", False),
    ]
    for name, received, expected, local, wanted in checks:
        if matches_release_source(received, expected, local) is not wanted:
            fail("preview verifier regression: " + name)
        print("PASS: preview verifier", name)
    checks, redirects = release_inventory()
    if len(checks) != 71 or redirects != EXPECTED_REDIRECTS:
        fail("release inventory did not cover all published route contracts")
    print("PASS: 68 route contracts: 67 exact HTML bytes, one explicit redirect, four static assets/root checks.")
    print("PASS: narrow Vercel feedback allowance, no arbitrary source modifications.")

class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None

def verified_request(url, parsed):
    # Bypass header is strictly scoped to the immutable JRS HTTPS hostname.
    # All calls use a no-redirect opener so it cannot follow external redirects.
    target = urlparse(url)
    if (target.scheme != "https" or target.netloc != parsed.netloc
            or target.username or target.password or target.fragment):
        fail("refusing to send protected-preview credential to another origin")
    headers = {
        "User-Agent": "JRS-publication-preview-verifier/1.0",
        "Cache-Control": "no-cache",
    }
    secret = os.environ.get("JRS_VERCEL_PREVIEW_BYPASS", "")
    if secret:
        if not (32 <= len(secret) <= 256) or chr(13) in secret or chr(10) in secret:
            fail("invalid CI preview-bypass credential format")
        headers["x-vercel-protection-bypass"] = secret
    return Request(url, headers=headers)


def verify_downloads(base, parsed):
    from urllib.parse import urlencode
    requests = [(urlencode({"e": edition, "src": "verify"}), path)
                for edition, path in DOWNLOADS.items()]
    requests.append((urlencode({"f": REFERENCE_FILE, "src": "verify"}), REFERENCE_FILE))
    no_redirect = build_opener(NoRedirect)
    for query, path in requests:
        url = base + "/api/dl?" + query
        req = verified_request(url, parsed)
        try:
            with no_redirect.open(req, timeout=20) as resp:
                status = resp.status
                location = resp.headers.get("Location", "")
        except HTTPError as exc:
            status = exc.code
            location = exc.headers.get("Location", "")
        except (URLError, TimeoutError, OSError) as error:
            fail(path + ": tracked download did not respond (" +
                 type(error).__name__ + ")")
        expected_target = "/" + path
        target = urlparse(location)
        if status != 302 or target.scheme != "https" or target.netloc != parsed.netloc or target.path != expected_target:
            fail(path + ": tracked route did not issue an exact-file 302 redirect")
        if target.query or target.fragment:
            fail(path + ": redirect contains unexpected query or fragment")
        try:
            with no_redirect.open(verified_request(location, parsed), timeout=30) as resp:
                if resp.status != 200 or urlparse(resp.url).netloc != parsed.netloc:
                    fail(path + ": PDF file did not return HTTP 200 on same host")
                data = resp.read(15_000_001)
                kind = resp.headers.get("Content-Type", "").split(";")[0].lower().strip()
        except (HTTPError, URLError, TimeoutError, OSError) as error:
            fail(path + ": PDF could not be downloaded (" +
                 type(error).__name__ + ")")
        if not data.startswith(b"%PDF-") or kind != "application/pdf":
            fail(path + ": download is not served as a PDF")
        expected = (ROOT / path).read_bytes()
        if len(data) > 15_000_000 or data != expected:
            fail(path + ": delivered PDF bytes differ from the release candidate")
        print("PASS: tracked download", path, sha(data)[:16])

def fail(reason):
    raise SystemExit("RELEASE HOLD: " + reason)

def sha(data):
    return hashlib.sha256(data).hexdigest()

def main():
    if len(sys.argv) == 2 and sys.argv[1] == "--self-test":
        self_test()
        return
    if len(sys.argv) != 2:
        fail("expected preview URL argument")
    base = sys.argv[1].rstrip("/")
    parsed = urlparse(base)
    if (parsed.scheme != "https" or not parsed.netloc or parsed.username or parsed.password
            or parsed.path not in ("", "/") or parsed.query or parsed.fragment
            or not re.fullmatch(r"jrsstandard(?:com)?-[a-z0-9-]+\.vercel\.app", parsed.hostname or "")):
        fail("preview must have an immutable credential-free JRS Vercel HTTPS URL")
    expected_head = os.environ.get("JRS_EXPECTED_HEAD", "")
    actual_head = subprocess.check_output(
        ["git", "rev-parse", "HEAD"], cwd=ROOT, text=True
    ).strip()
    if not expected_head or actual_head != expected_head:
        fail("checked-out source differs from the PR head: " + actual_head[:12])
    print("Candidate PR source:", actual_head)
    checks, redirects = release_inventory()
    # Concurrency limits the complete public route review without weakening
    # byte equality, exact origin, request timeouts or redirect rejection.
    def verify_one(item):
        route, local = item
        url = base + route
        try:
            req = verified_request(url, parsed)
            with build_opener(NoRedirect).open(req, timeout=20) as response:
                final = urlparse(response.url)
                if response.status != 200 or final.netloc != parsed.netloc:
                    fail(local + ": preview redirected or did not return HTTP 200")
                received = response.read(3_000_001)
        except (HTTPError, URLError, TimeoutError, OSError) as error:
            fail(local + ": preview unavailable (" + type(error).__name__ + ")")
        if len(received) > 3_000_000:
            fail(local + ": unexpectedly large preview response")
        if b"Log in to Vercel" in received or b"Vercel Authentication" in received:
            fail(local + ": authentication page is not a published JRS preview")
        expected = (ROOT / local).read_bytes()
        if not matches_release_source(received, expected, local):
            fail(local + ": hosted bytes do not match PR head (" +
                 sha(received)[:12] + " != " + sha(expected)[:12] + ")")
        if received != expected:
            return "PASS: " + route + " " + sha(expected)[:16] + " (exact platform trailer)"
        return "PASS: " + route + " " + sha(expected)[:16]
    with ThreadPoolExecutor(max_workers=6) as pool:
        for evidence in pool.map(verify_one, checks.items()):
            print(evidence)
    for route, expected in redirects.items():
        url = base + route
        try:
            with build_opener(NoRedirect).open(verified_request(url, parsed), timeout=20) as response:
                status = response.status
                location = response.headers.get("Location", "")
        except HTTPError as error:
            status = error.code
            location = error.headers.get("Location", "")
        except (URLError, TimeoutError, OSError) as error:
            fail(route + ": published redirect unavailable (" +
                 type(error).__name__ + ")")
        target = urlparse(location)
        from urllib.parse import urljoin
        absolute = urlparse(urljoin(base, location))
        if (status not in (302, 307) or absolute.scheme != "https"
                or absolute.netloc != parsed.netloc or absolute.path != expected
                or absolute.query or absolute.fragment):
            fail(route + ": hosted redirect differs from approved exact destination")
        print("PASS: published redirect", route, "to", expected)
    verify_downloads(base, parsed)
    print("PASS: 68 hosted HTML route contracts match the exact PR head, including the privacy redirect.")
    print("PASS: nine tracked PDF routes redirect and deliver identical files.")
    print("NOT CERTIFIED: screen reader testing, PDF tagging, runtime privacy, or production deployment.")

if __name__ == "__main__":
    main()
