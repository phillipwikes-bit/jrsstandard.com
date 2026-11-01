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
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
CHECKS = {
    "/": "index.html",
    "/jrsstandard.html": "jrsstandard.html",
    "/resources.html": "resources.html",
    "/training.html": "training.html",
    "/assets/jrs-institutional-reference.css": "assets/jrs-institutional-reference.css",
    "/assets/jrs-mobile-navigation.js": "assets/jrs-mobile-navigation.js",
}

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
    print("PASS: sampled hosted static source matches the exact PR head.")
    print("NOT CERTIFIED: screenshot quality, API runtime or production deployment.")

if __name__ == "__main__":
    main()
