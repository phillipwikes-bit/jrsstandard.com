#!/usr/bin/env python3
"""Generate confirmation links and outreach text for EVERY completer, both arms.

WHAT THIS PRODUCES
    research/Evaluator_Outreach/            one .md per evaluator, ready to send
    research/Evaluator_Outreach_INDEX.md    the dispatch sheet, one row per person

SOURCES, and none of them are re-transcribed here:
    Expert_Roster_All_Studies_*.csv   WHO COMPLETED. The authoritative list
    api/honor.js                      organization, where one is on record
    api/_contributor-roster.js        the unguessable confirmation key per person
    api/contributor.js                the fallback date

WHO COMPLETED COMES FROM THE CSV, NOT THE HONOR ROSTER. The honor roster was
built on 2026-08-09 and three Arm B reviewers finished after that date, so
sourcing the list from it would have silently dropped RR-113, RR-117 and
RR-127. The CSV is rebuilt with live verification on every roster build.

BOTH ARMS ARE INCLUDED. The Arm B exclusion that used to sit in this pipeline
was a blind protection: while the comparison study was running, a JRS-branded
page naming the standard would have told an unaided-arm reviewer that the
standard existed. **The owner closed the study on 2026-08-14, so that
protection is retired and every completer is treated identically.**

WHAT IS STILL NOT GUESSED. Two Arm B completers finished anonymously and have
no name on record. Their files are generated with the salutation and the
citation left as explicit placeholders rather than filled with an invented
name, and the index flags them. A citation that names someone who chose not to
be named would be the worst possible failure of this whole exercise.

Run:
    python3 research/build_evaluator_outreach.py

Exit code: 0 if every completer resolved to a key, 1 if any did not.

PRIVATE. The output carries per-person unguessable keys. research/ is excluded
from the deploy for exactly this reason.
"""
import csv
import io
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
HONOR = os.path.join(ROOT, "api", "honor.js")
CONTRIB_ROSTER = os.path.join(ROOT, "api", "_contributor-roster.js")
CONTRIB_JS = os.path.join(ROOT, "api", "contributor.js")
OUTDIR = os.path.join(HERE, "Evaluator_Outreach")
BASE = "https://jrsstandard.com/contributor.html?k="

DESIGNATION = ("Appointed Expert, Global AI Resilience & Governance "
               "International Evaluator Panel")

CITATION = (
    "In recognition of distinguished service as an Appointed Expert on the Global AI "
    "Resilience & Governance International Evaluator Panel during the evaluation of "
    "Justification Review Standard. {name} demonstrated critical oversight in "
    "stress-testing automated decision systems, mitigating systemic drift, and ensuring "
    "multi-jurisdictional alignment across complex regulatory and operational environments."
)

ANON_PLACEHOLDER = "[EVALUATOR NAME: not on record, this person completed anonymously]"


def js_entries(path):
    """Parse the honor roster out of api/honor.js.

    Read as text rather than executed. The file is an edge function with a
    default handler, so importing it to reach one constant would run unrelated
    module code for no benefit.
    """
    src = io.open(path, encoding="utf-8").read()
    entries = []
    for m in re.finditer(r"'([a-z0-9]{10})':\s*\{(.*?)\n  \}", src, re.S):
        key, body = m.group(1), m.group(2)

        def field(nm):
            fm = re.search(r"\b%s:\s*'((?:[^'\\]|\\.)*)'" % nm, body)
            return fm.group(1).replace("\\'", "'") if fm else ""

        entries.append({
            "honor_key": key,
            "code": field("code"),
            "participant": field("participant"),
            "name": field("name"),
            "first": field("first"),
            "title": field("title"),
            "org": field("org"),
        })
    return entries


def contributor_keys():
    """participant code -> unguessable contributor key, from the shared roster."""
    src = io.open(CONTRIB_ROSTER, encoding="utf-8").read()
    out = {}
    for m in re.finditer(r"'([a-z0-9]{10})':\s*\{[^}]*?code:\s*'([^']+)'", src, re.S):
        out[m.group(2)] = m.group(1)
    return out


def fallback_date():
    s = io.open(CONTRIB_JS, encoding="utf-8").read()
    m = re.search(r"const FALLBACK_DATE = '([^']+)'", s)
    return m.group(1) if m else "[NOT FOUND IN api/contributor.js]"


def arm_of(participant):
    if participant.startswith("V-AI-"):
        return "A"
    if participant.startswith("RR-"):
        return "B"
    return "other"


def message(p, key, date):
    named = bool(p["name"])
    who = p["name"] if named else ANON_PLACEHOLDER
    org = p["org"] or "[Organization/Firm Name]"
    title = p["title"] or "[Evaluator Title]"
    url = BASE + key if key else "[NO CONFIRMATION KEY: see index]"

    L = []
    A = L.append
    A("**Subject:** Citation Preference & Founding License Confirmation, Action Required")
    A("")
    A("---")
    A("")
    A("Dear %s," % who)
    A("")
    A("Your work on the Justification Review Standard evaluation is complete, and the "
      "study paper is being prepared. Before it is finalized I need your confirmation on "
      "two things: how you wish to be cited, and the license that comes with your service.")
    A("")
    A("**Designation:** %s" % DESIGNATION)
    A("")
    A("**Official citation inscription, as it would appear:**")
    A("")
    A("> " + CITATION.format(name=(p["name"] if named else "[Evaluator Name]")))
    A("")
    A("**Unlocking the Founding Auditor & Commercial Practice License.** On confirmation "
      "you receive:")
    A("")
    A("- **Commercial Practice Rights.** Authorization to use the JRS diagnostic rubrics "
      "and investigator field guides within your own client engagements.")
    A("- **Institutional Enterprise Grant.** A 12-month organizational deployment license "
      "for %s." % org)
    A("- **Founding Panelist Credentials.** A verifiable registry ID confirming your status "
      "on the inaugural panel.")
    A("")
    A("**Confirm Details & View Results Summary:**")
    A("")
    A(url)
    A("")
    A("**If I do not hear from you by %s**, the paper uses the baseline data already on "
      "file for you:" % date)
    A("")
    A("- **Name:** %s" % (p["name"] if named else "no name on record"))
    A("- **Title:** %s" % title)
    A("- **Organization:** %s" % (p["org"] or "none on record"))
    A("")
    if not named:
        A("**You completed anonymously, and that election holds.** Nothing is printed "
          "under your name unless you tell me to print it. If you would rather stay "
          "anonymous, you do not need to reply at all, and the confirmation page will not "
          "ask you to identify yourself.")
        A("")
    A("That deadline is a hard one only because the paper has to go out with accurate "
      "attribution. Either answer is a good answer, and no reply means the fallback above.")
    A("")
    A("With appreciation,")
    A("")
    A("Phillip Wikes")
    A("Former Lead Civil Rights Officer, Maryland Commission on Civil Rights")
    return "\n".join(L) + "\n"


def newest_csv():
    names = sorted(n for n in os.listdir(HERE)
                   if n.startswith("Expert_Roster_All_Studies_") and n.endswith(".csv"))
    if not names:
        sys.stderr.write("No Expert_Roster_All_Studies_*.csv. Run build_expert_roster.py.\n")
        sys.exit(2)
    return os.path.join(HERE, names[-1])


def main():
    # Organization lives only on the honor roster, so index it for enrichment.
    orgs = {}
    for h in js_entries(HONOR):
        if h["participant"]:
            orgs[h["participant"]] = {"org": h["org"], "honor": h["code"]}

    keys = contributor_keys()
    date = fallback_date()

    ANON = ("anonymous by choice", "no identity on record", "not recorded", "anonymous by design")
    completers = []
    with io.open(newest_csv(), encoding="utf-8") as fh:
        for row in csv.DictReader(fh):
            if row["status"] != "COMPLETE":
                continue
            code = row["code"]
            if arm_of(code) not in ("A", "B"):
                continue
            nm = row["name"].strip()
            if nm.lower() in ANON:
                nm = ""
            extra = orgs.get(code, {})
            completers.append({
                "participant": code,
                "name": nm,
                "first": nm.split(" ")[0] if nm else "",
                "title": row["title"].strip(),
                "org": extra.get("org", ""),
                "code": extra.get("honor", "not on the honor roster"),
            })
    completers.sort(key=lambda p: (arm_of(p["participant"]), p["participant"]))

    if not os.path.isdir(OUTDIR):
        os.makedirs(OUTDIR)
    # Remove stale per-person files so a person dropped from the roster does not
    # linger as a sendable file. That defect already happened once with the
    # contributor link sheet.
    for fn in os.listdir(OUTDIR):
        if fn.endswith(".md"):
            os.unlink(os.path.join(OUTDIR, fn))

    rows, missing = [], []
    for p in completers:
        key = keys.get(p["participant"], "")
        if not key:
            missing.append(p["participant"])
        fn = "%s_%s.md" % (arm_of(p["participant"]), p["participant"])
        io.open(os.path.join(OUTDIR, fn), "w", encoding="utf-8").write(message(p, key, date))
        rows.append({
            "arm": arm_of(p["participant"]),
            "participant": p["participant"],
            "honor": p["code"],
            "name": p["name"] or "*anonymous, no name on record*",
            "org": p["org"] or "",
            "key": key,
            "file": "Evaluator_Outreach/" + fn,
        })

    L = []
    A = L.append
    A("# Evaluator outreach dispatch sheet")
    A("")
    A("**PRIVATE. Do not publish.** Carries one unguessable confirmation key per person.")
    A("")
    A("**Generated by `research/build_evaluator_outreach.py`.** Do not edit by hand. "
      "Names, titles and organizations come from `api/honor.js`; confirmation keys from "
      "`api/_contributor-roster.js`; the deadline from `api/contributor.js`.")
    A("")
    A("**Both arms included.** The Arm B exclusion was a blind protection while the "
      "comparison study was running. **The owner closed the study on 2026-08-14**, so it "
      "is retired and every completer is treated identically.")
    A("")
    A("**Deadline on every message: %s.**" % date)
    A("")
    A("| Arm | Code | Honor | Evaluator | Organization | Confirmation link | File |")
    A("|---|---|---|---|---|---|---|")
    for r in rows:
        link = (BASE + r["key"]) if r["key"] else "**NO KEY**"
        A("| %s | `%s` | `%s` | %s | %s | %s | `%s` |"
          % (r["arm"], r["participant"], r["honor"], r["name"], r["org"], link, r["file"]))
    A("")
    a_n = sum(1 for r in rows if r["arm"] == "A")
    b_n = sum(1 for r in rows if r["arm"] == "B")
    anon = sum(1 for r in rows if r["name"].startswith("*anonymous"))
    A("**%d evaluators: %d Arm A, %d Arm B.** %d completed anonymously and their files "
      "carry a placeholder rather than an invented name." % (len(rows), a_n, b_n, anon))
    A("")
    if missing:
        A("## Missing confirmation keys")
        A("")
        A("**%d evaluators have no entry in `api/_contributor-roster.js`, so their link "
          "cannot be generated.** They are listed rather than silently dropped, and their "
          "message files carry an explicit placeholder instead of a broken URL." % len(missing))
        A("")
        for c in missing:
            A("- `%s`" % c)
        A("")
    io.open(os.path.join(HERE, "Evaluator_Outreach_INDEX.md"), "w", encoding="utf-8").write(
        "\n".join(L) + "\n")

    print("wrote %d message files to %s" % (len(rows), OUTDIR))
    print("wrote %s" % os.path.join(HERE, "Evaluator_Outreach_INDEX.md"))
    print("  Arm A: %d | Arm B: %d | anonymous: %d | missing keys: %d"
          % (a_n, b_n, anon, len(missing)))
    if missing:
        print("  MISSING KEYS: " + ", ".join(missing))
    return 0 if not missing else 1


if __name__ == "__main__":
    sys.exit(main())
