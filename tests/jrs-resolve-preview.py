#!/usr/bin/env python3
"""Resolve a reviewed exact-head Vercel preview without weakening release checks.

Uses an explicitly supplied preview URL first. Otherwise, inspects successful
GitHub deployment statuses for the current exact SHA using a read-only GitHub
token. It never creates a deployment, changes deployment protection, or treats
a source-rendered local page as a verified hosted preview.
"""
import json
import os
import re
import sys
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode, urlparse
from urllib.request import Request, urlopen

API = "https://api.github.com"
EXPECTED_REPOSITORY = "phillipwikes-bit/jrsstandard.com"


def vercel_preview_url(value):
    if not isinstance(value, str):
        return None
    parsed = urlparse(value.strip())
    host = (parsed.hostname or "").lower()
    if (parsed.scheme != "https" or not host.endswith(".vercel.app")
            or host == "vercel.app" or parsed.username or parsed.password
            or parsed.port is not None or parsed.path not in ("", "/")
            or parsed.query or parsed.fragment
            or not re.fullmatch(r"[a-z0-9.-]+", host)):
        return None
    # Require a JRS project host, not an arbitrary third-party Vercel deployment.
    if not host.startswith("jrsstandard-") and not host.startswith("jrsstandardcom-"):
        return None
    return "https://" + host


def status_candidate(deployment, statuses, expected_sha):
    if deployment.get("sha") != expected_sha:
        return None
    if deployment.get("production_environment") or str(
            deployment.get("environment", "")).lower() == "production":
        return None
    for status in statuses:
        if status.get("state") != "success":
            continue
        result = vercel_preview_url(status.get("environment_url"))
        if result:
            return result
    return None


def api_get(path, token):
    req = Request(API + path, headers={
        "Authorization": "Bearer " + token,
        "Accept": "application/vnd.github+json",
        "User-Agent": "JRS-exact-head-preview-verifier/1.0",
        "X-GitHub-Api-Version": "2022-11-28",
    })
    with urlopen(req, timeout=15) as response:
        return json.load(response)


def self_test():
    good = "https://jrsstandard-abc123-phillip-wikes-projects.vercel.app"
    assert vercel_preview_url(good) == good
    for bad in (
        "http://jrsstandard-abc123.vercel.app",
        "https://vercel.app",
        "https://evil.vercel.app",
        "https://jrsstandard-abc123.vercel.app.evil.com",
        "https://jrsstandard-abc123.vercel.app/path",
        "https://jrsstandard-abc123.vercel.app/?x=1",
        "https://user:pass@jrsstandard-abc123.vercel.app",
        "https://jrsstandard-abc123.vercel.app:8080",
    ):
        assert vercel_preview_url(bad) is None, bad
    head = "f" * 40
    preview = {"sha": head, "environment": "Preview"}
    statuses = [{"state": "success", "environment_url": good}]
    assert status_candidate(preview, statuses, head) == good
    assert status_candidate(preview, statuses, "0" * 40) is None
    assert status_candidate(preview, [{"state": "pending", "environment_url": good}], head) is None
    assert status_candidate({"sha": head, "environment": "Production"}, statuses, head) is None
    assert status_candidate({"sha": head, "production_environment": True}, statuses, head) is None
    print("PASS: read-only exact-head preview discovery rejects stale, pending and non-Vercel targets")


def main():
    if len(sys.argv) == 2 and sys.argv[1] == "--self-test":
        self_test()
        return
    if len(sys.argv) != 2:
        raise SystemExit("RELEASE HOLD: expected GITHUB_ENV destination")
    head = os.getenv("JRS_EXPECTED_HEAD", "")
    if not re.fullmatch("[0-9a-f]{40}", head):
        raise SystemExit("RELEASE HOLD: no valid exact PR-head SHA")
    url = os.getenv("JRS_PREVIEW_URL_INPUT", "").strip()
    if url:
        resolved = vercel_preview_url(url)
        if not resolved:
            raise SystemExit("RELEASE HOLD: configured preview URL is not an immutable JRS Vercel hostname")
        print("INFO: using explicitly supplied Vercel preview URL")
    else:
        token = os.getenv("GITHUB_TOKEN", "")
        repo = os.getenv("GITHUB_REPOSITORY", "")
        if repo != EXPECTED_REPOSITORY or not token:
            raise SystemExit("RELEASE HOLD: read-only GitHub deployment discovery unavailable")
        try:
            deployments = api_get(
                "/repos/" + repo + "/deployments?" +
                urlencode({"sha": head, "per_page": 50}), token)
            resolved = None
            for deployment in deployments:
                statuses = api_get(
                    "/repos/" + repo + "/deployments/" +
                    str(int(deployment["id"])) + "/statuses?per_page=30", token)
                resolved = status_candidate(deployment, statuses, head)
                if resolved:
                    break
        except (HTTPError, URLError, TimeoutError, ValueError, KeyError, TypeError) as error:
            raise SystemExit(
                "RELEASE HOLD: exact-head deployment discovery was unavailable (" +
                type(error).__name__ + ")") from None
        if not resolved:
            raise SystemExit(
                "RELEASE HOLD: no successful exact-head GitHub Vercel preview status. "
                "Create a preview within quota and supply its immutable URL through "
                "workflow_dispatch preview_url if the GitHub integration does not publish deployment statuses.")
        print("INFO: read-only GitHub deployment record matched exact PR head")
    # GITHUB_ENV is read by GitHub Actions; never write tokens or auth credentials.
    with open(sys.argv[1], "a", encoding="utf-8") as fh:
        fh.write("JRS_PREVIEW_URL=" + resolved + "\n")
    print("INFO: selected preview host", urlparse(resolved).hostname)
    print("NEXT: byte-compare hosted source and all tracked published PDFs with current PR")


if __name__ == "__main__":
    main()
