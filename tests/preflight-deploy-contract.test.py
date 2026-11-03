"""Offline acceptance checks for the production verifier's route classification.

Synthetic requests never call production, use private data, or write metrics.
The deployment job executes live checks separately after this contract passes.
"""
import importlib.util
import pathlib
import types
import unittest
from unittest.mock import patch

ROOT = pathlib.Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location(
    "preflight_deploy_check", ROOT / "scripts/preflight_deploy_check.py")
checker = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(checker)


class RouteContract(unittest.TestCase):
    def setUp(self):
        self.tracked = {"index.html", "resources.html", "organization.html",
                        "manifest.html", "programme-status-9872fb93cc94.html"}

    def test_public_redirect_targets_exact_canonical_bytes(self):
        redirect = {"enterprise.html": "organization.html",
                    "openapi.json": "manifest.html"}
        self.assertEqual(checker.resolve_public_target(
            "enterprise.html", redirect, self.tracked), "organization.html")
        self.assertEqual(checker.resolve_public_target(
            "openapi.json", redirect, self.tracked), "manifest.html")
        self.assertEqual(checker.resolve_public_target(
            "index.html", redirect, self.tracked), "index.html")

    def test_redirect_to_untracked_ignored_or_private_source_is_refused(self):
        with self.assertRaises(ValueError):
            checker.resolve_public_target("enterprise.html",
                {"enterprise.html": "absent.html"}, self.tracked)
        with self.assertRaises(ValueError):
            checker.resolve_public_target("enterprise.html",
                {"enterprise.html": "programme-status-9872fb93cc94.html"}, self.tracked)
        with self.assertRaises(ValueError):
            checker.resolve_public_target("enterprise.html",
                {"enterprise.html": "scripts/private.py"}, self.tracked|{"scripts/private.py"})

    def test_platform_inputs_and_internal_code_are_not_static_assets(self):
        for path in ("package.json", "proxy.js", "vercel.json",
                     "scripts/preflight_deploy_check.py", "api/owner-session.js"):
            self.assertFalse(checker.is_deployed(path), path)
        for path in ("index.html", "organization.html", "assets/jrs-a-pathways.css"):
            self.assertTrue(checker.is_deployed(path), path)

    def test_exact_git_ref_declares_redirects_not_stale_worktree(self):
        payload = '{"redirects":[{"source":"/enterprise.html","destination":"/organization.html"},' \
                  '{"source":"/openapi.json","destination":"/manifest.html"}]}'
        def fake_git(*args):
            self.assertEqual(args[0:2], ("show", "stable:vercel.json"))
            return types.SimpleNamespace(returncode=0, stdout=payload)
        with patch.object(checker, "git", fake_git):
            routes = checker.declared_redirects("stable")
        self.assertEqual(routes["enterprise.html"], "organization.html")
        self.assertEqual(routes["openapi.json"], "manifest.html")

    def test_external_redirect_or_duplicate_is_rejected(self):
        cases = [
            '{"redirects":[{"source":"/enterprise.html","destination":"https://external.example/"}]}',
            '{"redirects":[{"source":"/enterprise.html","destination":"/organization.html"},'
            '{"source":"/enterprise.html","destination":"/resources.html"}]}'
        ]
        for payload in cases:
            with patch.object(checker, "git", return_value=types.SimpleNamespace(returncode=0, stdout=payload)):
                with self.assertRaises(ValueError):
                    checker.declared_redirects("HEAD")

    def test_private_gate_requires_unauthenticated_signin_no_store_and_noindex(self):
        class FakeReply:
            status = 200
            def __init__(self, cache, robots, html):
                self.headers = {"Cache-Control": cache, "X-Robots-Tag": robots}
                self.html = html
            def __enter__(self): return self
            def __exit__(self, *a): return False
            def read(self, _): return self.html.encode()
        good = FakeReply("private, no-store, max-age=0","noindex, nofollow",
            "<title>Private Owner Sign-In</title><form id="verify-code"></form><form id="access-form"></form>")
        no_cache = FakeReply("public, max-age=600","noindex, nofollow",good.html)
        exposed = FakeReply("private, no-store","noindex, nofollow",
            good.html+"<h1>JRS Owner Dashboard</h1>")
        with patch.object(checker.urllib.request, "urlopen", return_value=good):
            self.assertTrue(checker.fetch_private_gate("programme-status-9872fb93cc94.html"))
        for reply in [no_cache, exposed]:
            with patch.object(checker.urllib.request, "urlopen", return_value=reply):
                self.assertFalse(checker.fetch_private_gate("programme-status-9872fb93cc94.html"))

    def test_new_guide_typography_is_readable_without_touching_evidence_or_owner(self):
        css = (ROOT / "assets/jrs-a-pathways.css").read_text()
        for name in [".jrs-fast-chooser p{font-size:16px",
                     ".jrs-task-links a span{display:block;font-size:15px",
                     ".jrs-guide-page p,body.jrs-institutional.jrs-guide-page li{font-size:16px",
                     "overflow-wrap:anywhere;font-size:15px}"]:
            self.assertIn(name, css)
        self.assertNotIn("jrs-a-pathways.css",
            (ROOT/"programme-status-9872fb93cc94.html").read_text())
        self.assertNotIn("jrs-a-pathways.css",(ROOT/"owner-login.html").read_text())
        self.assertIn("@media print", css)
        self.assertIn(".jrs-guide-page .jrs-version-table thead", css)


if __name__ == "__main__":
    unittest.main()
