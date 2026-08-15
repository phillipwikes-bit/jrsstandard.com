#!/usr/bin/env python3
"""Generate confirmation links and outreach text for every completer, both arms.

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

WHO IS ON THE LIST, per the owner (2026-08-14): the Rung 2b detection panel
(Arm A) and the Arm B randomized comparison. Rung 2a is NOT on the list. Its
expert raters were briefly added on 2026-08-14 and removed the same day on the
owner's instruction. Do not add them back.

The comparison study is OPEN and closes 2026-08-15. Everyone generated here has
already submitted their records, so the message cannot change work they have
already done. The B1 / B2 split never reaches a file name, an index row or a
message: the band comes from the participant code, never from the CSV's arm
column, because that split is the blind.

NO COMMERCIAL LANGUAGE. These messages quoted three prices and pointed at three
paid pages. Removed 2026-08-15 at the owner's instruction: he did not want it in
there, the site's commercial offer is withdrawn until the research programme is
complete, and a price list inside an award citation reads as a sales letter to
the people who did the work unpaid. The price reader was deleted with it rather
than left loaded, so a price cannot reappear here by accident.

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
    """Role band from the participant code. Derived from the code, never from
    the CSV `arm` column, because that column carries B1/B2 and THE B1/B2 SPLIT
    IS THE BLIND. It must not reach a filename, an index row, or a message."""
    if participant.startswith("V-AI-"):
        return "A"          # Rung 2b, detection panel
    if participant.startswith("RR-"):
        return "B"          # Arm B, randomized comparison
    return "other"


def message(p, key, date):
    named = bool(p["name"])
    who = p["name"] if named else ANON_PLACEHOLDER
    org = p["org"] or "[Organization/Firm Name]"
    title = p["title"] or "[Evaluator Title]"
    url = BASE + key if key else "[NO CONFIRMATION KEY: see index]"

    L = []
    A = L.append
    A("**Subject:** Award Citation & Panelist Registry Confirmation, Action Required")
    A("")
    A("---")
    A("")
    A("Dear %s," % who)
    A("")
    A("Your work on the Justification Review Standard evaluation is complete, and the "
      "study paper is being prepared. Before it is finalized I need your confirmation on "
      "one thing: how you wish to be cited.")
    A("")
    A("**Designation:** %s" % DESIGNATION)
    A("")
    A("**Official citation inscription, as it would appear:**")
    A("")
    A("> " + CITATION.format(name=(p["name"] if named else "[Evaluator Name]")))
    A("")
    A("**What confirming unlocks.** Two things, both recognition:")
    A("")
    A("- **Your Appointed Expert Award Citation**, in the wording above, issued in your name.")
    A("- **Your Official Panelist Registry ID**, a verifiable reference confirming your "
      "place on the panel.")
    A("")
    A("**That is the whole of it, and it is deliberate.** Nothing is being sold to you "
      "here and there is nothing to buy: this asks for a confirmation and gives you the "
      "citation, and that is the entire exchange.")
    A("")
    A("The seven-point check at https://jrsstandard.com/check.html is free and ungated, "
      "if you want to see the method itself.")
    A("")
    A("**Confirm your citation and claim your Registry ID:**")
    A("")
    A(url)
    A("")
    A("**If I do not hear from you by %s**, the paper uses the baseline data already on "
      "file for you:" % date)
    A("")
    A("- **Name:** %s" % (p["name"] if named else "no name on record"))
    # "none on record" rather than the [Evaluator Title] prompt: this block states
    # what the paper would fall back to, and the honest fallback for a blank field
    # is nothing, not a placeholder the reader might mistake for stored data.
    A("- **Title:** %s" % (p["title"] or "none on record"))
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
            orgs[h["participant"]] = {"org": h["org"], "honor": h["code"],
                                      "name": h["name"], "title": h["title"],
                                      "on_honor": True}

    keys = contributor_keys()
    date = fallback_date()

    ANON = ("anonymous by choice", "no identity on record", "not recorded", "anonymous by design")

    # ELIGIBILITY, set by the owner on 2026-08-14:
    #
    #   Rung 2b  detection panel    IN.  Codes V-AI-##.
    #   Arm B    randomized compare IN.  Codes RR-###.
    #   Rung 2a  everyone           OUT. Codes E-## and R-############.
    #
    # Rung 2a took part in the research; it is not on this invitation. The expert
    # raters were added here on 2026-08-14 and removed the same day on the
    # owner's instruction. Do not add them back.
    #
    # Exclusions are printed in the index rather than applied silently, so the
    # list can be checked against the roster without reading this file.
    eligible, excluded = [], []
    with io.open(newest_csv(), encoding="utf-8") as fh:
        for row in csv.DictReader(fh):
            code = row["code"].strip()
            band = arm_of(code)
            nm = row["name"].strip()
            display = nm if nm.lower() not in ANON else ""

            if band == "other":
                why = ("Rung 2a expert rater: took part in the research, not on this "
                       "invitation (owner, 2026-08-14)"
                       if row["arm"].strip() == "expert rater" else
                       "Rung 2a bench reviewer: the code was never bound to an identity, "
                       "so there is no person to write to")
                excluded.append((code, row["name"].strip(), why))
                continue
            if row["status"] != "COMPLETE":
                excluded.append((code, row["name"].strip(), "not COMPLETE"))
                continue

            extra = orgs.get(code, {})
            title = row["title"].strip()

            # THE HONOR ROSTER OUTRANKS THE STUDY RECORD, because its fields were
            # corrected by the people themselves.
            #
            # A name there is the spelling that person confirmed: E-08 is
            # "Stacyann Young" on the roster and "Stacy Young" in the CSV.
            #
            # An EXPLICITLY EMPTY title there is a removal request, not missing
            # data. E-08 asked in writing on 2026-08-09 that her agency title and
            # employer come off every piece of recognition, and api/honor.js says
            # so in terms: "Do not repopulate these from the study record."
            # Repopulating them from the CSV is exactly what this line prevents.
            if extra.get("on_honor"):
                if extra.get("name"):
                    display = extra["name"]
                if extra.get("title", None) == "":
                    title = ""

            # SOMEONE WITH NO NAME ON RECORD HAS NO TITLE ON RECORD EITHER.
            # RR-130 and RR-132 carry the study-internal label "JRS-naive expert
            # professional" in the title column. That is not a title they gave,
            # it is the arm they were in, and printing it back to them would tell
            # an unaided-arm reviewer that a comparison exists. It is the blind,
            # written to the one person it protects.
            if not display:
                title, extra = "", {"honor": extra.get("honor", "not on the honor roster")}

            eligible.append({
                "participant": code,
                "name": display,
                "first": display.split(" ")[0] if display else "",
                "title": title,
                "org": extra.get("org", ""),
                "code": extra.get("honor", "not on the honor roster"),
            })

    completers = eligible
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
    A("**Who is on this list, set by the owner on 2026-08-14:** the Rung 2b detection "
      "panel (Arm A) and the Arm B randomized comparison. **Rung 2a is not on it.** Its "
      "expert raters took part in the research but are not part of this invitation.")
    A("")
    A("**The comparison study is open and closes 2026-08-15.** Everyone listed here has "
      "already submitted their records, so the message cannot change work they have "
      "already done. **The B1 / B2 split never appears in this file or in any message**: "
      "the band column comes from the participant code, never from the roster CSV's arm "
      "column, because that split is the blind.")
    A("")
    A("**Deadline on every message: %s.**" % date)
    A("")
    A("| Band | Code | Honor | Evaluator | Organization | Confirmation link | File |")
    A("|---|---|---|---|---|---|---|")
    for r in rows:
        link = (BASE + r["key"]) if r["key"] else "**NO KEY**"
        A("| %s | `%s` | `%s` | %s | %s | %s | `%s` |"
          % (r["arm"], r["participant"], r["honor"], r["name"],
             r["org"], link, r["file"]))
    A("")
    a_n = sum(1 for r in rows if r["arm"] == "A")
    b_n = sum(1 for r in rows if r["arm"] == "B")
    anon = sum(1 for r in rows if r["name"].startswith("*anonymous"))
    A("**%d evaluators: %d Rung 2b (Arm A), %d Arm B.** %d completed anonymously and "
      "their files carry a placeholder rather than an invented name."
      % (len(rows), a_n, b_n, anon))
    A("")
    A("## Not invited, and why")
    A("")
    A("**Listed rather than silently dropped.** An evaluator quietly missing from an "
      "invitation list is the same defect as one quietly added to it.")
    A("")
    A("| Code | Name on record | Reason |")
    A("|---|---|---|")
    for code, nm, why in excluded:
        A("| `%s` | %s | %s |" % (code, nm or "*none*", why))
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
    print("  Rung 2b/Arm A: %d | Arm B: %d" % (a_n, b_n))
    print("  anonymous: %d | not invited: %d | missing keys: %d"
          % (anon, len(excluded), len(missing)))
    if missing:
        print("  MISSING KEYS: " + ", ".join(missing))
    return 0 if not missing else 1


if __name__ == "__main__":
    sys.exit(main())
