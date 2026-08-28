#!/usr/bin/env python3
"""Pull the blind second-read submissions and score them against the answer key.

WHY THIS EXISTS. api/recheck.js writes the ten answers into
pilot_contacts.message as JSON, tagged source='recheck-submit'. NO DEPLOYED
SURFACE READS THAT COLUMN. api/people-9dd1ecdf6f8cdfd4 lists the row with
detail:"" and api/asset-stats reports only submitted:1, so the owner can see
that a second read happened and cannot see what it said. That gap is why this
script exists: the paper's single-reader limitation cannot be retired from a
count, only from the answers.

WHAT IT MEASURES. Percent agreement and Cohen's kappa between the second
reader's ten labels and contributor E-08's original reads in
research/Blind_Recheck_KEY_E08.md, which is never deployed. Kappa rather than
raw agreement alone, because with 6 of 10 cases coded Ready a reader who
answered Ready ten times would score 60% and have demonstrated nothing.

FAIL-CLOSED. pilot_contacts has RLS on and no anon read, so this needs the
service role key. It is NOT in this repository and must not be. Supply it in
the environment; the script exits non-zero and prints what is missing rather
than degrading to a partial answer.

    SUPABASE_SERVICE_KEY=... python3 scripts/score_blind_recheck.py
    SUPABASE_SERVICE_KEY=... python3 scripts/score_blind_recheck.py --json out.json
"""
import io
import json
import os
import re
import sys
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KEY_FILE = os.path.join(ROOT, "research", "Blind_Recheck_KEY_E08.md")
RECHECK_JS = os.path.join(ROOT, "api", "recheck.js")

# [REQUIRED_ENV_PARAM] service role key for the study database. Never committed.
SERVICE_ENV = ("SUPABASE_SERVICE_KEY", "SUPABASE_SERVICE_ROLE_KEY", "SB_SERVICE_KEY")


def supabase_url():
    """Read the project URL from api/recheck.js rather than restating it here."""
    src = io.open(RECHECK_JS, encoding="utf-8").read()
    m = re.search(r"const SB = '([^']+)'", src)
    if not m:
        raise SystemExit("SB constant not found in api/recheck.js")
    return m.group(1)


def labels():
    """The label vocabulary, read from the endpoint that enforces it."""
    src = io.open(RECHECK_JS, encoding="utf-8").read()
    m = re.search(r"const LABELS = \[([^\]]+)\]", src)
    if not m:
        raise SystemExit("LABELS not found in api/recheck.js")
    return [x.strip().strip("'\"") for x in m.group(1).split(",")]


def answer_key():
    """Case number -> original read, parsed from the never-deployed key file."""
    rows = {}
    for line in io.open(KEY_FILE, encoding="utf-8"):
        m = re.match(r"^\|\s*(\d+)\s*\|\s*([0-9a-f-]{36})\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|", line)
        if m:
            rows[int(m.group(1))] = {"case_id": m.group(2),
                                     "original": m.group(3),
                                     "outcome": m.group(4)}
    if len(rows) != 10:
        raise SystemExit("expected 10 key rows, parsed %d from %s" % (len(rows), KEY_FILE))
    return rows


def service_key():
    for name in SERVICE_ENV:
        v = os.environ.get(name)
        if v:
            return name, v
    raise SystemExit(
        "[REQUIRED_ENV_PARAM] no service role key in the environment.\n"
        "  pilot_contacts has RLS on with no anon read, so the ten answers "
        "cannot be reached without it.\n"
        "  Set one of: %s\n"
        "  It lives in the Vercel project environment. It is not in this "
        "repository and must not be committed to it." % ", ".join(SERVICE_ENV))


def fetch_submissions(url, key):
    q = (url + "/rest/v1/pilot_contacts"
         "?source=eq.recheck-submit&select=name,email,organization,message,created_at"
         "&order=created_at.asc")
    req = urllib.request.Request(q, headers={
        "apikey": key, "Authorization": "Bearer " + key, "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode("utf-8"))


def kappa(a, b, vocab):
    """Cohen's kappa. Returns None when it is undefined rather than a number."""
    n = len(a)
    if n == 0:
        return None
    po = sum(1 for x, y in zip(a, b) if x == y) / float(n)
    pe = 0.0
    for v in vocab:
        pe += (a.count(v) / float(n)) * (b.count(v) / float(n))
    if abs(1.0 - pe) < 1e-12:
        return None          # both readers used one label; kappa is undefined
    return (po - pe) / (1.0 - pe)


def score(sub, key, vocab):
    try:
        payload = json.loads(sub.get("message") or "{}")
    except ValueError:
        return {"error": "message column is not JSON", "name": sub.get("name")}
    answers = payload.get("answers") or []
    pairs = []
    per_case = []
    for a in answers:
        n = a.get("n")
        mine = (a.get("label") or "").strip()
        orig = key.get(n, {}).get("original", "")
        agree = bool(mine) and mine == orig
        per_case.append({"case": n, "second_read": mine or "(unanswered)",
                         "original": orig, "agree": agree,
                         "knew_outcome": a.get("knew_outcome") is True,
                         "reason": (a.get("reason") or "")[:400]})
        if mine:
            pairs.append((mine, orig))
    answered = len(pairs)
    agreed = sum(1 for m, o in pairs if m == o)
    k = kappa([p[0] for p in pairs], [p[1] for p in pairs], vocab) if answered else None
    return {
        "name": sub.get("name"),
        "email": sub.get("email"),
        "organization": sub.get("organization") or "",
        "submitted_at": sub.get("created_at"),
        "slot": payload.get("slot", ""),
        "prior_familiarity": payload.get("prior_familiarity", ""),
        "consent_named_in_paper": payload.get("consent_named_in_paper") is True,
        "answered": answered,
        "total_cases": payload.get("total_cases", 10),
        "agreed": agreed,
        "percent_agreement": round(100.0 * agreed / answered, 1) if answered else None,
        "cohens_kappa": round(k, 3) if k is not None else None,
        "kappa_note": ("undefined: one reader used a single label"
                       if k is None and answered else ""),
        "knew_outcome_count": sum(1 for c in per_case if c["knew_outcome"]),
        "per_case": per_case,
    }


def main():
    vocab = labels()
    key = answer_key()
    name, sk = service_key()
    url = supabase_url()
    subs = fetch_submissions(url, sk)

    print("service key      : %s" % name)
    print("labels           : %s" % ", ".join(vocab))
    print("key rows         : %d from research/Blind_Recheck_KEY_E08.md" % len(key))
    print("submissions      : %d" % len(subs))
    print()

    out = []
    for sub in subs:
        r = score(sub, key, vocab)
        out.append(r)
        if "error" in r:
            print("!! %s: %s" % (r.get("name"), r["error"]))
            continue
        print("%s  <%s>  %s" % (r["name"], r["email"], r["organization"]))
        print("  slot %s, submitted %s" % (r["slot"] or "(none)", r["submitted_at"]))
        print("  answered %d of %d, agreed %d, %s%% agreement, kappa %s %s"
              % (r["answered"], r["total_cases"], r["agreed"],
                 r["percent_agreement"], r["cohens_kappa"], r["kappa_note"]))
        print("  named in paper: %s | said they knew the outcome on %d case(s)"
              % ("YES" if r["consent_named_in_paper"] else "no", r["knew_outcome_count"]))
        if r["prior_familiarity"]:
            print("  prior familiarity: %s" % r["prior_familiarity"][:300])
        print("  %-5s %-12s %-12s %s" % ("CASE", "SECOND READ", "ORIGINAL", "AGREE"))
        for c in r["per_case"]:
            print("  %-5s %-12s %-12s %s" % (c["case"], c["second_read"],
                                             c["original"], "yes" if c["agree"] else "NO"))
        print()

    if "--json" in sys.argv:
        p = sys.argv[sys.argv.index("--json") + 1]
        io.open(p, "w", encoding="utf-8").write(json.dumps(out, indent=2))
        print("written: %s" % p)
    return 0


if __name__ == "__main__":
    sys.exit(main())
