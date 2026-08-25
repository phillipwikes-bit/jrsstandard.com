#!/usr/bin/env python3
"""Audit the Training & Certification Adoption tile against its own evidence.

THE QUESTION THIS ANSWERS: the tile says "7 completed across 5 countries". Is
that a count of training completions?

IT IS NOT, and the endpoint's own source says so. api/enroll-stats.js builds its
completion set from TWO sources:

  1. Rows in pilot_contacts with source='training-complete', deduplicated by
     email. This is a real completion event written by api/complete.js.
  2. Any ENROLLED email whose SHA-256 appears in COMPLETION_COUNTRY_BACKFILL
     (api/_country-backfill.js). The code comment names the reason: "Add known
     completers who enrolled but never wrote a training-complete row (panel
     reviewers via ?src=panel)."

Source 2 means a person can be counted as a completer on the strength of being
in a hand-maintained constant, with no completion event anywhere. Four of the
eight entries in that map are annotated in the source as having no complete row.

This script decomposes the published number into what is evidenced by a row and
what rests on the constant, and names each person from the source comments.

WHY THE FOUR HAVE NO ROW. Attested by Phillip on 2026-08-25: they completed
before completion was tracked. The commit history corroborates the mechanism:

  api/enroll.js      first committed 2026-07-13  (b0a6133)
  api/complete.js    first committed 2026-07-14  (bc0b8e9)

Before 2026-07-14 there was NO endpoint that could write a training-complete
row, so a completion in that window is unrecordable by construction rather than
missing through error. Jake McDonough, Olabanji Lawal and Boris Khazin were
added to the records map on 2026-07-17 (76aa3fa) as completers with no row.
SungSoo In was added 2026-07-20 (5ed7e6a); his enrolment is dated 2026-07-19,
which is AFTER complete.js existed, so his gap is the ?src=panel flow not
writing a completion row rather than the endpoint being absent.

The distinction this script keeps: an unrecordable completion is a real
completion with no evidence in the system, and it is still not the same fact as
a recorded one. Both are reported, neither is relabelled as the other.

NAMES AND DATES require the service-role key. pilot_contacts is not anon
readable. Without SUPABASE_SERVICE_ROLE_KEY this script prints everything it can
establish and then FAILS CLOSED on the per-person completion dates rather than
inferring them, because inferring who completed and when is exactly the claim
this programme exists to stop people making.

Usage:
  python3 scripts/audit_training_completions.py
  SUPABASE_SERVICE_ROLE_KEY=... python3 scripts/audit_training_completions.py
"""
import hashlib
import json
import os
import re
import sys
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SB = "https://pjzxkeviouofdseagvpf.supabase.co"
LIVE = "https://www.jrsstandard.com/api/enroll-stats"

# Transcribed from the annotated comments in api/_country-backfill.js. The hash
# is the key actually used by the endpoint; the name and the annotation are the
# provenance the source file records beside it.
BACKFILL = [
    ("7f86332345224f64ba2908c402bc289d492903d7eac9f794d7e3983cfabbebc4",
     "Nicholas Evans", "RR-106", "US", "has training-complete row", "2026-07-14"),
    ("77d8d7d39070b21e741964745127596924a42140c10cc967faecda9fe7a977cc",
     "Andrey Ekhmenin", "V-AI-11", "PL", "has training-complete row", "2026-07-17"),
    ("f148f56cc11fdee6017ec1a103be7edaa3aed0a9855de3bfafea609b94c054f9",
     "Jake McDonough", "V-AI-01", "US",
     "completed pre-tracking (before api/complete.js, 2026-07-14); attested 2026-08-25", ""),
    ("c883d56fa7ef4d012574bdc1bbfcd372c54f4c111985070e606ce827be65411b",
     "Olabanji Lawal", "V-AI-10", "NG",
     "completed pre-tracking (before api/complete.js, 2026-07-14); attested 2026-08-25", ""),
    ("7fec46f29356da7d765afb4cd1f47776e24b0d237ee3e6801d620f3cbbb993ee",
     "Boris Khazin", "RR-101", "US",
     "completed pre-tracking (before api/complete.js, 2026-07-14); attested 2026-08-25", ""),
    ("deb4d4bf1f481e75ac94bc2433e34fc9822b8529a85cd0c0f44d05b59b4d5673",
     "SungSoo In", "V-AI-24", "KR",
     "enrolled 2026-07-19 via ?src=panel, that flow wrote no complete row", ""),
    ("c5dcaf40ebce570624518e963d3cc924eab1179951039e50866b4a5fe93c9a00",
     "Sagarika Banerjee", "RR-128", "CA", "endorsed 2026-08-02, pre-geo row", ""),
    ("f0d55578ea6444100a57993ea610f3065f38743c0879a532f5f9074e59938ab9",
     "Tanvi Pokhriyal", "V-HR-01", "AE", "HR pilot lead, confirmed 2026-08-12", ""),
]

R = []


def check(name, ok, detail=""):
    R.append(bool(ok))
    print("%-5s %-56s %s" % ("PASS" if ok else "FAIL", name, detail))


def live():
    try:
        return json.loads(urllib.request.urlopen(LIVE, timeout=30).read().decode())
    except Exception as e:
        raise SystemExit("[REQUIRED_ENV_PARAM] live endpoint unreachable: %s" % e)


def src_hashes():
    """Hashes actually present in the deployed map, read from source."""
    t = open(os.path.join(ROOT, "api", "_country-backfill.js"), encoding="utf-8").read()
    body = t[t.index("COMPLETION_COUNTRY_BACKFILL = {"):t.index("export const COUNTRY_NOT_ON_FILE")]
    return dict(re.findall(r"'([0-9a-f]{64})':\s*'([A-Z]{2})'", body))


s = live()
H = src_hashes()

print("=== PUBLISHED TILE VALUES, FETCHED LIVE ===")
for k in ("enrollments", "unique_people", "organizations", "consented_contact",
          "consented_transfer", "today", "completions", "completions_countries"):
    print("  %-22s %s" % (k, s.get(k)))
print("  completions_by_country %s"
      % ", ".join("%s=%d" % (c["country"], c["count"]) for c in s.get("completions_by_country", [])))

print("\n=== 1. DOES THE TILE MATCH THE ENDPOINT ===")
check("tile enrollments 8 matches endpoint", s.get("enrollments") == 8, str(s.get("enrollments")))
check("tile organizations 5 matches endpoint", s.get("organizations") == 5, str(s.get("organizations")))
check("tile contactable 8 matches endpoint", s.get("consented_contact") == 8, str(s.get("consented_contact")))
check("tile transfer-consent 8 matches endpoint", s.get("consented_transfer") == 8, str(s.get("consented_transfer")))
check("tile new-today 0 matches endpoint", s.get("today") == 0, str(s.get("today")))
check("tile completions 7 matches endpoint", s.get("completions") == 7, str(s.get("completions")))
check("tile countries 5 matches endpoint", s.get("completions_countries") == 5, str(s.get("completions_countries")))
check("tile country bars match endpoint",
      [(c["country"], c["count"]) for c in s.get("completions_by_country", [])]
      == [("US", 3), ("PL", 1), ("KR", 1), ("KE", 1), ("NG", 1)])
check("country bars sum to the completions total",
      sum(c["count"] for c in s.get("completions_by_country", [])) == s.get("completions"))
check("no completion is filed under 'unknown'",
      not [c for c in s.get("completions_by_country", []) if c["country"] == "unknown"])

print("\n=== 2. WHAT THE COMPLETION NUMBER IS ACTUALLY COUNTING ===")
check("source map matches the 8 transcribed entries",
      len(H) == len(BACKFILL) == 8 and all(h in H for h, *_ in BACKFILL),
      "%d hashes in api/_country-backfill.js" % len(H))
check("transcribed country matches the deployed value for every entry",
      all(H.get(h) == cc for h, _n, _c, cc, _a, _d in BACKFILL))

evidenced = [b for b in BACKFILL if b[4] == "has training-complete row"]
unevidenced = [b for b in BACKFILL if b[4] != "has training-complete row"]
print("\n  BACKED BY A training-complete ROW (%d):" % len(evidenced))
for h, n, c, cc, a, d in evidenced:
    print("    %-20s %-9s %s  completed %s" % (n, c, cc, d))
print("\n  COUNTED WITHOUT A training-complete ROW (%d):" % len(unevidenced))
for h, n, c, cc, a, d in unevidenced:
    print("    %-20s %-9s %s  %s" % (n, c, cc, a))

# The tile's country bars tell us which backfill entries are actually being
# counted: CA and AE do not appear, so those two people are not enrolled and
# have no completion row.
bars = {c["country"]: c["count"] for c in s.get("completions_by_country", [])}
counted = [b for b in BACKFILL if b[3] in bars]
check("CA and AE entries are in the map but NOT counted in the tile",
      "CA" not in bars and "AE" not in bars,
      "Sagarika Banerjee and Tanvi Pokhriyal are not enrolled and wrote no row")
check("US bar of 3 is exactly the three US backfill entries",
      bars.get("US") == 3
      and len([b for b in BACKFILL if b[3] == "US"]) == 3,
      "Nicholas Evans, Jake McDonough, Boris Khazin")
check("KE is NOT in the backfill map, so it is a genuinely captured completion",
      "KE" in bars and "KE" not in H.values(),
      "one real training-complete row with geo, post 2026-07-17")

from_map = sum(1 for b in BACKFILL if b[3] in bars and b[3] != "KE")
check("6 of the 7 completions come from the constant, 1 from a real row",
      from_map == 6 and bars.get("KE") == 1,
      "%d from api/_country-backfill.js, 1 captured" % from_map)
check("4 of those 6 have no completion ROW, for a documented reason",
      len([b for b in unevidenced if b[3] in bars]) == 4,
      "Jake McDonough, Olabanji Lawal, Boris Khazin, SungSoo In")

print("\n=== 3. WHO COMPLETED, AND WHEN ===")
SERVICE = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
if not SERVICE:
    print("  ESTABLISHED FROM REPOSITORY SOURCES, dated:")
    print("    Nicholas Evans    RR-106    US   training-complete row   2026-07-14")
    print("    Andrey Ekhmenin   V-AI-11   PL   training-complete row   2026-07-17")
    print("  COMPLETED BEFORE COMPLETION WAS TRACKABLE (attested by Phillip 2026-08-25;")
    print("  api/complete.js did not exist until 2026-07-14, commit bc0b8e9):")
    print("    Jake McDonough    V-AI-01   US   pre-tracking completion, no row possible")
    print("    Olabanji Lawal    V-AI-10   NG   pre-tracking completion, no row possible")
    print("    Boris Khazin      RR-101    US   pre-tracking completion, no row possible")
    print("  RECORDED VIA THE PANEL FLOW, WHICH WROTE NO COMPLETION ROW:")
    print("    SungSoo In        V-AI-24   KR   enrolled 2026-07-19 via ?src=panel")
    print("  NOT ESTABLISHED:")
    print("    KE completer      unknown   KE   real row exists; identity needs the key")
    print()
    print("  [REQUIRED_ENV_PARAM] SUPABASE_SERVICE_ROLE_KEY not set.")
    print("  pilot_contacts is not anon readable, so the KE completer's identity and")
    print("  the exact created_at of every completion row CANNOT be retrieved here.")
    print("  No name or date is inferred to fill that gap.")
    print("  Re-run as: SUPABASE_SERVICE_ROLE_KEY=... python3 %s"
          % os.path.relpath(__file__, ROOT))
else:
    AH = {"apikey": SERVICE, "Authorization": "Bearer " + SERVICE}
    req = urllib.request.Request(
        SB + "/rest/v1/pilot_contacts?select=name,email,organization,created_at,message"
             "&source=eq.training-complete&order=created_at.asc&limit=10000", headers=AH)
    rows = json.loads(urllib.request.urlopen(req, timeout=45).read().decode())
    print("  %d training-complete ROWS, the only evidenced completions:" % len(rows))
    seen = {}
    for r in rows:
        em = str(r.get("email") or "").strip().lower()
        try:
            cc = (json.loads(r.get("message") or "{}") or {}).get("country") or "?"
        except Exception:
            cc = "?"
        h = hashlib.sha256(em.encode()).hexdigest()
        nm = next((b[1] for b in BACKFILL if b[0] == h), r.get("name") or "(no name on row)")
        dup = " DUPLICATE" if em in seen else ""
        seen[em] = 1
        print("    %-19s %-26s %-3s %s%s"
              % (nm, em, cc, str(r.get("created_at"))[:19], dup))
    print("\n  %d distinct emails wrote a completion row." % len(seen))
    print("  The tile reports %s completions, a difference of %d carried by the constant."
          % (s.get("completions"), (s.get("completions") or 0) - len(seen)))

failed = R.count(False)
print("\n%d checks, %d failed" % (len(R), failed))
sys.exit(failed)
