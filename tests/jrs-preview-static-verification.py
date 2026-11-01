#!/usr/bin/env python3
"""Fail-closed JRS candidate preview identity check.

This verifies static publication bytes for the exact checked-out PR head. It does
not certify visual quality, authenticated APIs, privacy execution or production.
A Vercel sign-in page, stale preview, HTTP error or missing URL is a release HOLD.
"""
import hashlib
import os
from pathlib import Path
import subprocess
import sys
from urllib.error import HTTPError, URLError
from urllib.parse import urlparse
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

# These six public PDF routes must deliver their exact local file bytes. All
# verification requests use src=verify to avoid contaminating download metrics.
DOWNLOADS = {
    "standard": "JRS-Standard.pdf",
    "card": "JRS_Rapid_Review_Card.pdf",
    "employment": "JRS_Investigator_Field_Guide_Employment.pdf",
    "fairhousing": "JRS_Investigator_Field_Guide_FairHousing.pdf",
    "international": "JRS_Investigator_Field_Guide_International.pdf",
}
REFERENCE_FILE = "JRS-Reference-9d4f2a7c.pdf"

class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None

def verify_downloads(base, parsed):
    from urllib.parse import urlencode
    requests = [(urlencode({"e": edition, "src": "verify"}), path)
                for edition, path in DOWNLOADS.items()]
    requests.append((urlencode({"f": REFERENCE_FILE, "src": "verify"}), REFERENCE_FILE))
    no_redirect = build_opener(NoRedirect)
    for query, path in requests:
        url = base + "/api/dl?" + query
        req = Request(url, headers={
            "User-Agent": "JRS-publication-preview-verifier/1.0",
            "Cache-Control": "no-cache",
        })
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
            with urlopen(Request(location, headers={
                "User-Agent": "JRS-publication-preview-verifier/1.0",
                "Cache-Control": "no-cache",
            }), timeout=30) as resp:
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
    if len(sys.argv) != 2:
        fail("expected preview URL argument")
    base = sys.argv[1].rstrip("/")
    parsed = urlparse(base)
    if parsed.scheme != "https" or not parsed.netloc or parsed.username or parsed.password:
        fail("preview must have a credential-free HTTPS URL")
    expected_head = os.environ.get("JRS_EXPECTED_HEAD", "")
    actual_head = subprocess.check_output(
        ["git", "rev-parse", "HEAD"], cwd=ROOT, text=True
    ).strip()
    if not expected_head or actual_head != expected_head:
        fail("checked-out source differs from the PR head: " + actual_head[:12])
    print("Candidate PR source:", actual_head)
    for route, local in CHECKS.items():
        url = base + route
        try:
            req = Request(url, headers={
                "User-Agent": "JRS-publication-preview-verifier/1.0",
                "Cache-Control": "no-cache",
            })
            with urlopen(req, timeout=20) as response:
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
        if received != expected:
            fail(local + ": hosted bytes do not match PR head (" +
                 sha(received)[:12] + " != " + sha(expected)[:12] + ")")
        print("PASS:", local, sha(expected)[:16])
    verify_downloads(base, parsed)
    print("PASS: sampled hosted static source matches the exact PR head.")
    print("PASS: six tracked PDF routes redirect and deliver identical files.")
    print("NOT CERTIFIED: screen reader testing, PDF tagging, runtime privacy, or production deployment.")

if __name__ == "__main__":
    main()
