#!/usr/bin/env python3
"""Fail-closed JRS candidate preview identity check.

This verifies static publication bytes for the exact checked-out PR head. It does
not certify visual quality, authenticated APIs, privacy execution or production.
A Vercel sign-in page, stale preview, HTTP error or missing URL is a release HOLD.
"""
import ast
import hashlib
import json
import os
import re
from pathlib import Path
import subprocess
import sys
from urllib.error import HTTPError, URLError
from urllib.parse import urlparse, urljoin
from urllib.request import Request, urlopen, build_opener, HTTPRedirectHandler

ROOT = Path(__file__).resolve().parents[1]
CHECKS = {
    "/": "index.html",
    "/jrsstandard.html": "jrsstandard.html",
    "/resources.html": "resources.html",
    "/training.html": "training.html",
    "/assets/jrs-institutional-reference.css": "assets/jrs-institutional-reference.css",
    "/assets/jrs-mobile-navigation.js": "assets/jrs-mobile-navigation.js",
    "/assets/jrs-resource-catalog.js": "assets/jrs-resource-catalog.js",
}

# Ten tracked public PDF routes must deliver their exact local file bytes:
# all nine locked edition originals plus the separately tracked DRR article.
# Verification uses src=verify to avoid contaminating download metrics.
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
REFERENCE_FILES = (
    "JRS-Reference-9d4f2a7c.pdf",
    "JRS_Investigator_Field_Guide.pdf",
)

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
    print("PASS: narrow Vercel feedback allowance, no arbitrary source modifications.")
    assert len(sitewide_paths()) == 60
    print("PASS: exact 60-route website source and redirect coverage.")
    locked = json.loads((ROOT / "docs/JRS_Published_PDF_Identity_Manifest.json").read_text("utf-8"))
    published = {a["file"] for a in locked["assets"]}
    checked = set(DOWNLOADS.values()) | set(REFERENCE_FILES)
    if len(locked["assets"]) != 9 or len(published) != 9 or not published.issubset(checked):
        fail("tracked PDF route coverage does not include every locked published edition")
    if len(checked) != 10:
        fail("tracked PDF route inventory unexpectedly changed")
    print("PASS: all nine locked original PDF editions covered by ten tracked routes.")
    # Diagnostics must not expose a response body, host or query token in
    # public CI logs. Do not infer which authorization layer rejected a 403.
    hidden = "private-token-do-not-print"
    for code, expected in [
        (401, "HTTP 401: access refused"),
        (403, "HTTP 403: access refused"),
        (302, "HTTP 302: unexpected preview redirect"),
        (404, "HTTP 404: exact preview"),
        (402, "HTTP 402: deployment"),
        (429, "HTTP 429: request"),
        (503, "HTTP 503: preview")
    ]:
        error = HTTPError("https://secret.example/path?" + hidden,
                          code, hidden, {"x-secret": hidden}, None)
        message = network_failure(error)
        assert message.startswith(expected), (code, message)
        assert hidden not in message and "secret.example" not in message
    assert network_failure(TimeoutError(hidden)) == "TimeoutError"
    print("PASS: hosted network errors report status without exposing credentials or response data.")


def network_failure(error):
    """Return a bounded public CI diagnostic, never raw URL, body or headers.

    HTTP errors can be Vercel SSO/Trusted Sources denials, application denials,
    missing resources or rate limits. A numeric status is useful evidence but
    does not by itself establish the responsible security control.
    """
    if isinstance(error, HTTPError):
        code = error.code
        if code in (401, 403):
            return ("HTTP " + str(code) +
                    ": access refused; inspect Vercel preview authentication/"
                    "Trusted Sources and application authorization")
        if code in (301, 302, 303, 307, 308):
            return "HTTP " + str(code) + ": unexpected preview redirect; check authentication"
        if code == 404:
            return "HTTP 404: exact preview file or route unavailable"
        if code == 402:
            return "HTTP 402: deployment or account limit may apply"
        if code == 429:
            return "HTTP 429: request rate limited"
        if isinstance(code, int) and 500 <= code <= 599:
            return "HTTP " + str(code) + ": preview server error"
        return "HTTP " + str(code) if isinstance(code, int) else "HTTP error"
    return type(error).__name__


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
    oidc = os.environ.get("JRS_VERCEL_TRUSTED_OIDC_TOKEN", "")
    secret = os.environ.get("JRS_VERCEL_PREVIEW_BYPASS", "")
    if oidc and secret:
        fail("ambiguous CI preview credentials")
    if oidc:
        if not (128 <= len(oidc) <= 8192) or not re.fullmatch(
                r"[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+", oidc):
            fail("invalid short-lived CI identity format")
        headers["x-vercel-trusted-oidc-idp-token"] = oidc
    elif secret:
        if not (32 <= len(secret) <= 256) or chr(13) in secret or chr(10) in secret:
            fail("invalid CI preview-bypass credential format")
        headers["x-vercel-protection-bypass"] = secret
    return Request(url, headers=headers)


def verify_downloads(base, parsed):
    from urllib.parse import urlencode
    requests = [(urlencode({"e": edition, "src": "verify"}), path)
                for edition, path in DOWNLOADS.items()]
    requests.extend((urlencode({"f": path, "src": "verify"}), path)
                    for path in REFERENCE_FILES)
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
                 network_failure(error) + ")")
        expected_target = "/" + path
        target = urlparse(location)
        if status != 302 or target.scheme != "https" or target.netloc != parsed.netloc or target.path != expected_target:
            detail = ("HTTP " + str(status) + ": " if status != 302 else "")
            fail(path + ": tracked route did not issue an exact-file 302 redirect (" +
                 detail + "source/host/target mismatch)")
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
                 network_failure(error) + ")")
        if not data.startswith(b"%PDF-") or kind != "application/pdf":
            fail(path + ": download is not served as a PDF")
        expected = (ROOT / path).read_bytes()
        if len(data) > 15_000_000 or data != expected:
            fail(path + ": delivered PDF bytes differ from the release candidate")
        print("PASS: tracked download", path, sha(data)[:16])

# The browser WCAG preflight is the authority for public HTML inventory. Do
# not claim whole-site identity by checking only the seven headline routes.
SITEWIDE_AUDIT = ROOT / "tests/jrs-wcag-axe-browser.html"
CANONICAL_REDIRECTS = {"/privacy.html": "/privacy-notice.html"}

def sitewide_paths():
    match = re.search(r"const routes=(\\[[\\s\\S]*?\\]);", SITEWIDE_AUDIT.read_text("utf-8"))
    if not match:
        fail("source WCAG public-route inventory unavailable")
    try:
        paths = ast.literal_eval(match.group(1))
    except (ValueError, SyntaxError):
        fail("source WCAG route inventory malformed")
    if (not isinstance(paths, list) or len(paths) != 60 or
            len(set(paths)) != 60 or
            any(not isinstance(p, str) or
                not re.fullmatch(r"/(?:[A-Za-z0-9_-]+/)*[A-Za-z0-9_-]+\\.html", p)
                for p in paths)):
        fail("expected exactly 60 safe, unique public HTML routes")
    redirects = json.loads((ROOT / "vercel.json").read_text("utf-8")).get("redirects", [])
    for alias, dest in CANONICAL_REDIRECTS.items():
        if alias not in paths or dest not in paths:
            fail("canonical privacy redirect omitted from sitewide scan")
        valid = [r for r in redirects if r.get("source") == alias and
                 r.get("destination") == dest and r.get("permanent") is False]
        if len(valid) != 1:
            fail("sitewide canonical redirect differs from deployed routing policy")
    for path in paths:
        source = CANONICAL_REDIRECTS.get(path, path)
        if not (ROOT / source.lstrip("/")).is_file():
            fail("public source page missing: " + source)
    return paths

def verify_sitewide(base, parsed):
    no_redirect = build_opener(NoRedirect)
    paths = sitewide_paths()
    for route in paths:
        req = verified_request(base + route, parsed)
        try:
            with no_redirect.open(req, timeout=20) as response:
                code = response.status
                received = response.read(3_000_001)
                kind = response.headers.get("Content-Type", "").split(";")[0].strip().lower()
                served = urlparse(response.url)
                location = response.headers.get("Location", "")
        except HTTPError as exc:
            code = exc.code
            received = b""
            kind = ""
            served = urlparse(base + route)
            location = exc.headers.get("Location", "")
        except (URLError, TimeoutError, OSError) as error:
            fail(route + ": sitewide preview unavailable (" + network_failure(error) + ")")
        if route in CANONICAL_REDIRECTS:
            # Vercel's declared 307/308 canonicalization must stay on the
            # current origin. Never follow a redirect while holding credentials.
            target = urlparse(urljoin(base + route, location))
            if (code not in (307, 308) or target.scheme != "https" or
                target.netloc != parsed.netloc or
                target.path != CANONICAL_REDIRECTS[route] or
                target.query or target.fragment):
                fail(route + ": unexpected sitewide canonical redirect")
            print("PASS: hosted alias", route, "->", target.path)
            continue
        if (code != 200 or kind != "text/html" or
                served.netloc != parsed.netloc or len(received) > 3_000_000):
            fail(route + ": not an exact-host public HTML response")
        source = (ROOT / route.lstrip("/")).read_bytes()
        if not matches_release_source(received, source, route):
            fail(route + ": hosted public-page bytes differ from candidate")
        print("PASS: hosted public route", route, sha(source)[:16])
    print("PASS: complete 60-route protected public HTML source identity and canonical redirect policy.")

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
    no_redirect = build_opener(NoRedirect)
    for route, local in CHECKS.items():
        url = base + route
        try:
            req = verified_request(url, parsed)
            with no_redirect.open(req, timeout=20) as response:
                final = urlparse(response.url)
                if response.status != 200 or final.netloc != parsed.netloc:
                    fail(local + ": preview redirected or did not return HTTP 200")
                received = response.read(3_000_001)
        except (HTTPError, URLError, TimeoutError, OSError) as error:
            fail(local + ": preview unavailable (" + network_failure(error) + ")")
        if len(received) > 3_000_000:
            fail(local + ": unexpectedly large preview response")
        if b"Log in to Vercel" in received or b"Vercel Authentication" in received:
            fail(local + ": authentication page is not a published JRS preview")
        expected = (ROOT / local).read_bytes()
        if not matches_release_source(received, expected, local):
            fail(local + ": hosted bytes do not match PR head (" +
                 sha(received)[:12] + " != " + sha(expected)[:12] + ")")
        if received != expected:
            print("INFO: exact Vercel Live footer verified for", local)
        print("PASS:", local, sha(expected)[:16])
    verify_downloads(base, parsed)
    verify_sitewide(base, parsed)
    print("PASS: sampled and sitewide hosted static source match the exact PR head.")
    print("PASS: ten tracked PDF routes, including all nine locked originals, deliver identical files.")
    print("NOT CERTIFIED: screen reader testing, PDF tagging, runtime privacy, or production deployment.")

if __name__ == "__main__":
    main()
