#!/usr/bin/env python3
"""Post-deployment production verification for the B-001 queue.

WHY THIS EXISTS. The queue behind B-001 was documented in prose across several
records. Prose is re-derived by whoever reads it next, and re-derivation is where
a step gets skipped. This is the queue as an executable: one run, one evidence
file, one pass/fail line per control.

IT DOES NOT DEPLOY AND IT DOES NOT REVOKE. Deployment is authorized elsewhere and
database grants are changed elsewhere. This VERIFIES what is already true, which
is the only thing that converts a control from REMEDIATED to PRODUCTION VERIFIED.

IT COMPLEMENTS preflight_deploy_check.py RATHER THAN REPLACING IT. That script
answers "did the deployment actually happen", by byte-comparing served bodies
against a git ref. This one answers "are the controls in force", which is a
different question and runs after it.

STATUS AT WRITING: NEVER EXECUTED. Every check below is prepared and unrun.
Several require reading production, which this environment correctly refuses
outside an authorized verification run. A check that has not run establishes
NOTHING, and the report says so on its face rather than in a footnote.

    python3 scripts/production_verify.py --plan     # print the queue, no network
    python3 scripts/production_verify.py --run      # execute and write evidence

USAGE NOTE. --run is for use AFTER B-001 is rotated and the deployment is
authorized and complete. Running it before then records failures that are
expected, which pollutes the evidence trail with noise that looks like findings.
"""

import argparse
import json
import os
import re
import subprocess
import sys
import urllib.request
from datetime import datetime, timezone

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = "https://www.jrsstandard.com"
TIMEOUT = 20

# Paths that MUST 404. Each cites the blocker that put it here, because a bare
# list of paths invites someone to "tidy" one out.
MUST_404 = [
    ("/supabase-engine-reviews-setup.sql", "B-014. Publishes the anon SELECT grant B-013 limb A treats as the open exposure, plus the full column list"),
    ("/supabase-setup.sql",                "B-014. Schema and policy definitions at a guessable public URL"),
    ("/supabase/functions/run-study/index.ts", "B-014. Supabase Edge Function SOURCE served as a static file by Vercel"),
]

# Tables whose anonymous SELECT must be DENIED or return zero rows after the
# queued revocations. Neither revocation is performed here.
MUST_DENY_ANON = [
    ("engine_reviews",    "B-013 limb A. Holds record-derived model output"),
    ("finding_responses", "B-017. Collected under an explicit promise of non-publication"),
]


def _now():
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def _get(url, headers=None):
    req = urllib.request.Request(url, headers=headers or {})
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
            return r.status, r.read(), dict(r.headers)
    except urllib.error.HTTPError as e:
        return e.code, e.read(), dict(e.headers)
    except Exception as e:
        return None, str(e).encode(), {}


def _post(url, body, headers=None):
    h = {"Content-Type": "application/json"}
    h.update(headers or {})
    req = urllib.request.Request(url, data=body, headers=h, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
            return r.status, r.read()
    except urllib.error.HTTPError as e:
        return e.code, e.read()
    except Exception as e:
        return None, str(e).encode()


def _publishable_key():
    """Read the publishable key from a page that already ships it.

    It is published in 17 HTML files by design, so reading it here discloses
    nothing. NO OTHER CREDENTIAL IS READ, DERIVED OR ACCEPTED ANYWHERE IN THIS
    SCRIPT, and none may be added: the service-role key must never leave the
    server environment.
    """
    src = open(os.path.join(ROOT, "finding.html"), encoding="utf-8").read()
    m = re.search(r"sb_publishable_[A-Za-z0-9_-]+", src)
    return m.group(0) if m else None


def _supabase_url():
    src = open(os.path.join(ROOT, "finding.html"), encoding="utf-8").read()
    m = re.search(r"https://[a-z0-9]+\.supabase\.co", src)
    return m.group(0) if m else None


def _retention_days():
    pol = open(os.path.join(ROOT, "lib/retention/policy.js"), encoding="utf-8").read()
    lit = re.search(r"ENGINE_REVIEW_RETENTION\s*=\s*\{(.*?)\n\};", pol, re.S)
    decl = re.sub(r"//[^\n]*", "", lit.group(1)) if lit else ""
    m = re.search(r"\bdays:\s*(\d+)", decl)
    return int(m.group(1)) if m else None


# The only place in this file where a secret variable NAME appears, and it is a
# pattern to search a RESPONSE for, never a value to read. A 401 that names the
# flag governing access tells an unauthenticated caller how the endpoint is
# configured; that defect was fixed once already and this asserts it stays fixed.
# check_production_verifier_reads_no_secret exempts this one declaration by name
# and stays strict everywhere else, so the exemption cannot spread.
SECRET_NAMES_THAT_MUST_NOT_LEAK = (
    r"REVIEW_API_TOKEN|JRS_SANDBOX_OPEN|SUPABASE|ANTHROPIC")

CHECKS = []


def check(name, blocker, fn):
    CHECKS.append((name, blocker, fn))


# ---------------------------------------------------------------------------
# 1. B-014 — protected files must not be served.
# ---------------------------------------------------------------------------
def _c_protected_paths():
    out = []
    for path, why in MUST_404:
        status, body, _ = _get(SITE + path)
        ok = status == 404
        out.append({"path": path, "why": why, "expected": 404,
                    "actual": status, "bytes": len(body or b""), "pass": ok})
    return all(r["pass"] for r in out), out


# ---------------------------------------------------------------------------
# 2. BD-12 / BD-13 — the disclosure is live AND states the enforced number.
# ---------------------------------------------------------------------------
def _c_retention_disclosure():
    days = _retention_days()
    out = []
    for page in ("privacy.html", "security.html"):
        status, body, _ = _get("%s/%s" % (SITE, page))
        text = (body or b"").decode("utf-8", "replace")
        anchor = "kept for %d days" % days if days else None
        found = bool(anchor and anchor in text)
        # The three-category shape must survive too: a bare period would read as
        # the whole row being deleted, which is false.
        shape = ("never stored at all" in text) and ("condition statuses" in text)
        out.append({"page": page, "http": status, "enforced_days": days,
                    "discloses_that_number": found, "keeps_three_category_shape": shape,
                    "pass": bool(found and shape)})
    return all(r["pass"] for r in out), out


# ---------------------------------------------------------------------------
# 3. B-013 limb A and B-017 — anonymous SELECT must be denied.
# ---------------------------------------------------------------------------
def _c_anon_select_denied():
    base, key = _supabase_url(), _publishable_key()
    if not base or not key:
        return False, [{"error": "could not read the publishable key or project URL"}]
    out = []
    for table, why in MUST_DENY_ANON:
        status, body, _ = _get("%s/rest/v1/%s?select=*&limit=1" % (base, table),
                               {"apikey": key, "Authorization": "Bearer " + key})
        text = (body or b"").decode("utf-8", "replace")
        denied = status in (401, 403) or text.strip() in ("[]", "")
        # A 200 with rows is the failure. A 200 with [] is ambiguous: it may mean
        # the grant is gone OR that the table is simply empty, and those are NOT
        # the same fact. Recorded as such rather than scored as a pass.
        ambiguous = status == 200 and text.strip() == "[]"
        out.append({"table": table, "why": why, "http": status,
                    "denied": denied, "ambiguous_empty_table": ambiguous,
                    "pass": bool(denied and not ambiguous)})
    return all(r["pass"] for r in out), out


# ---------------------------------------------------------------------------
# 4. The service-role read must still work after revocation.
# ---------------------------------------------------------------------------
def _c_service_role_path_intact():
    status, body, _ = _get(SITE + "/api/engine-activity")
    text = (body or b"").decode("utf-8", "replace")
    leaked = any(k in text for k in ("compliant_version", '"note"', "input_preview"))
    return (status == 200 and not leaked), [{
        "endpoint": "/api/engine-activity", "http": status,
        "record_derived_field_leaked": leaked,
        "note": "200 proves the page survives revocation. A 503 here after the "
                "grant is revoked means the service-role path is NOT configured, "
                "which breaks the page the revocation was designed to protect.",
        "pass": status == 200 and not leaked}]


# ---------------------------------------------------------------------------
# 5. BD-15 / V-11 — the two 401 branches must be indistinguishable.
# ---------------------------------------------------------------------------
def _c_401_parity():
    details = []
    for hdrs in ({}, {"Authorization": "Bearer definitely-not-a-valid-token"}):
        status, body = _post(SITE + "/api/v1/review-engine", b"not-json", hdrs)
        try:
            detail = json.loads(body.decode()).get("detail", "")
        except Exception:
            detail = "(unparseable)"
        details.append({"http": status, "detail": detail})
    same = len({d["detail"] for d in details}) == 1
    names_env = any(re.search(SECRET_NAMES_THAT_MUST_NOT_LEAK, d["detail"])
                    for d in details)
    return (same and not names_env), [{
        "branches": details, "details_identical": same,
        "names_an_environment_variable": names_env,
        "note": "Differing details disclose whether a token is provisioned. That "
                "difference was used on 2026-09-16 to read the deployment's "
                "configuration state from outside.",
        "pass": same and not names_env}]


check("B-014 protected files are not served", "B-014", _c_protected_paths)
check("BD-12/BD-13 retention disclosure is live and matches the policy", "BD-12/BD-13", _c_retention_disclosure)
check("anonymous SELECT is denied on the restricted tables", "B-013 limb A / B-017", _c_anon_select_denied)
check("the service-role read path still serves", "BD-02", _c_service_role_path_intact)
check("both 401 branches are indistinguishable", "BD-15 / V-11", _c_401_parity)


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument("--plan", action="store_true", help="print the queue; no network")
    g.add_argument("--run", action="store_true", help="execute and write evidence")
    ap.add_argument("--out", default=".jrs/reports/PRODUCTION_VERIFICATION_EVIDENCE.json")
    a = ap.parse_args()

    if a.plan:
        print("PRODUCTION VERIFICATION QUEUE — %d controls, NOT EXECUTED\n" % len(CHECKS))
        for i, (name, blocker, _) in enumerate(CHECKS, 1):
            print("  %d. [%s] %s" % (i, blocker, name))
        print("\nPreconditions, all of which are outside this script:")
        print("  - B-001 credential rotated externally by the owner")
        print("  - deployment authorized and completed")
        print("  - preflight_deploy_check.py reports byte identity")
        print("  - the queued database grant revocations performed")
        print("\nNothing here deploys, revokes, or reads a secret credential.")
        return 0

    results, failed = [], 0
    for name, blocker, fn in CHECKS:
        ok, detail = fn()
        if not ok:
            failed += 1
        results.append({"check": name, "blocker": blocker,
                        "pass": ok, "detail": detail})
        print("%-5s %-58s %s" % ("PASS" if ok else "FAIL", name, blocker))

    ev = {
        "_what_this_establishes": (
            "Live production behaviour at the timestamp below, for these controls "
            "only. It does NOT establish that any other control is verified, and a "
            "control absent from this file is NOT verified by its absence."
        ),
        "run_at": _now(),
        "site": SITE,
        "repo_head": subprocess.run(["git", "rev-parse", "--short", "HEAD"],
                                    capture_output=True, text=True, cwd=ROOT).stdout.strip(),
        "checks": len(CHECKS), "failed": failed, "results": results,
    }
    out = os.path.join(ROOT, a.out)
    os.makedirs(os.path.dirname(out), exist_ok=True)
    with open(out, "w", encoding="utf-8") as fh:
        json.dump(ev, fh, indent=2)
        fh.write("\n")
    print("\n%d controls, %d failed. Evidence: %s" % (len(CHECKS), failed, a.out))
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
