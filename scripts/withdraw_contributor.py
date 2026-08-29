#!/usr/bin/env python3
"""Withdraw a named contributor from every programme surface, deterministically.

WHY A SCRIPT AND NOT AN EDIT PASS. A withdrawal touched 24 files across live
endpoints, generated documents, builders, historical logs and two manuscripts.
Doing that by hand means the next withdrawal is done by hand too, and the one
after that misses a file. This encodes the rules instead, so the second
withdrawal is a one-line change to WITHDRAWALS and a re-run.

It also encodes the distinction that makes a withdrawal defensible, which a
find-and-replace cannot:

  CREDIT surfaces      the entry comes out entirely. Acknowledgments, bylines,
                       honor rosters, contributor links, certificates,
                       invitation files. Nothing of the person remains.

  STUDY RECORD surfaces the row STAYS and the NAME goes. She completed the full
                       24-record set; deleting the row would understate the
                       panel and falsify the completion counts that every
                       published figure rests on. Naming consent is withdrawn.
                       Participation is not.

  HISTORICAL surfaces  the decision log keeps the decision and loses the name.
                       A tracker that erases its own decisions cannot later show
                       that a withdrawal was honoured, which is the one thing it
                       exists to show.

Usage:
  python3 scripts/withdraw_contributor.py --check     # report only, exit 1 if traces remain
  python3 scripts/withdraw_contributor.py --apply     # rewrite the files

Exit code: 0 if no trace of a withdrawn name remains outside the allowlist.
"""
import argparse
import io
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# --- The withdrawal register -------------------------------------------------
#
# One entry per withdrawn contributor. `names` is every spelling and short form
# that must not survive anywhere; `code` is the participant code that stays in
# the study record. `withheld` is what replaces the name where a row is kept.
WITHDRAWALS = [
    {
        "code": "V-AI-08",
        "date": "2026-08-16",
        # BASIS. Corrected 2026-08-29 on the owner's statement: "She never
        # withdrew consent. She was an expert reviewer."
        #
        # The record agrees with him and always did. Every line of the roster
        # entry says the 2026-08-16 action was taken AT THE OWNER'S
        # INSTRUCTION. Nothing anywhere says she asked for it. This register
        # nevertheless called her a withdrawn contributor, the manuscript said
        # a contributor had withdrawn "at her election", and on 2026-08-29 an
        # anonymity election was written into ANON_CODES on her behalf. All
        # three asserted an act she did not perform. Recording an election
        # someone did not make is the same class of error as ignoring one they
        # did, and it is worse here because it was attributed to her in print.
        #
        # The suppression stays, because the credit removal was instructed and
        # has not been reversed by a further instruction; the 2026-08-19
        # reinstatement was scoped to her link alone. What changes is the
        # reason it is recorded under, and what may be said about her.
        #
        #   owner_instructed_credit_removal   the credit came off on the
        #                                     owner's instruction. No election
        #                                     by the contributor is implied or
        #                                     may be asserted anywhere.
        #   contributor_withdrew              the contributor asked. Only this
        #                                     basis may be described as a
        #                                     withdrawal, and only this basis
        #                                     requires an ANON_CODES entry.
        "basis": "owner_instructed_credit_removal",
        # THE BARE FIRST NAME IS DELIBERATELY NOT LISTED. It was added on
        # 2026-08-27 and reverted the same hour: the repository contains 62
        # mentions of GABRIELA BAR, a different person and an active
        # collaborator, against 3 of Gabriela Cortez. Listing the bare name
        # produced 77 traces, almost all of them her. The original author
        # had already written this warning into the file and I overrode it
        # before checking. The greeting problem it was meant to solve is
        # handled where it belongs, in the generator, which addresses a
        # withdrawn contributor by code rather than by name.
        "names": ["Gabriela Cortez", "Gabi Cortez", "Cortez", "Gabi"],
        "withheld": "(name withheld)",
        # NO IDENTIFIER LIST FOR THIS WITHDRAWAL, deliberately, but NOT for
        # the reason first written here.
        #
        # CORRECTED 2026-08-29. The earlier note said "Maryland Commission on
        # Civil Rights" is wrong as her identifier because it is the FIRST
        # AUTHOR's former post. That is half true and it read as denying an
        # association the record actually shows. It is the first author's
        # former post AND it is hers: the credit strings this withdrawal
        # removed read "Gabriela Cortez (Maryland Commission on Civil Rights)"
        # (see the CREDIT rules below), and the roster line retired on
        # 2026-08-16 read "Civil-rights records and bilingual intake; Maryland
        # Commission on Civil Rights". They worked at the same body, which is
        # how the first author knows her.
        #
        # The operational decision is unchanged and still correct. The string
        # cannot serve as a scan identifier because it appears in 20 outreach
        # files, the reviewer page, the training page and the manuscript byline
        # for the FIRST AUTHOR's reasons, and using it produced 20 false
        # positives on the first run. It was removed from her own rows
        # individually instead, by the rules below. The reason is
        # disambiguation, not absence of association.
        "identifiers": [],
        # PARTIALLY REINSTATED 2026-08-19 at the owner's instruction: "She did
        # not withdraw from study ... should get a link ... just like all the
        # rest of the Arm A, Arm B, and Study 004 completers."
        #
        # The reinstatement is SCOPED TO THE CONTRIBUTOR LINK and nothing else.
        # Her link is the mechanism by which she elects how she is named, so it
        # has to carry her name to resolve to her at all; the credit surfaces
        # rewritten on 2026-08-16 (the manuscript acknowledgments, the byline
        # history, the honor entry H-2026-06) STAY REMOVED until a separate
        # instruction says otherwise. Restoring the link first and the printed
        # credit second is the right order: it lets her make the election
        # rather than having one made for her.
        "name_allowed_in": [
            "api/_contributor-roster.js",
            "research/Contributor_Links.md",
            "research/build_contributor_links.py",
            "research/Outreach_Emails_2026-08-19.md",
        ],
    },
]

# Files allowed to carry a withdrawn name: none. The register itself is the only
# place a withdrawn name may appear, and it appears there so the guard has
# something to search for.
ALLOWLIST = {
    "scripts/withdraw_contributor.py",
}

SKIP_DIRS = {".git", "node_modules", "__pycache__", ".vercel"}
SKIP_EXT = {".pdf", ".png", ".jpg", ".jpeg", ".gif", ".docx", ".pyc", ".zip"}


def walk_text_files():
    for dirpath, dirnames, filenames in os.walk(ROOT):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
        for name in filenames:
            if os.path.splitext(name)[1].lower() in SKIP_EXT:
                continue
            full = os.path.join(dirpath, name)
            rel = os.path.relpath(full, ROOT)
            if rel in ALLOWLIST:
                continue
            yield rel, full


def read(path):
    try:
        with io.open(path, encoding="utf-8") as fh:
            return fh.read()
    except (UnicodeDecodeError, OSError):
        return None


# --- Per-file rewrite rules --------------------------------------------------
#
# Each rule is (relative path, old exact text, new exact text). Exact text, not
# a regex, so a rule that stops matching fails loudly instead of matching
# something else. Every rule is listed in full; none is generated.
RULES = [
    # ---- CREDIT SURFACES: the contribution statement and the acknowledgment
    # paragraph come out of both manuscripts. Section 2.1 itself STAYS. It was
    # rewritten into the paper's voice on 2026-08-02b and carries no attribution.
    (
        "research/Detection_Article_v3_2026-08-15.md",
        "**Contributor.** Gabriela Cortez (Maryland Commission on Civil Rights) contributed the argument developed in Section 2.1, that a record must remain understandable to the person it describes and that linguistic and jurisdictional range is a property of review rather than a courtesy. That argument is the reason this study was designed around an international panel rather than a single-jurisdiction one. She reviewed the corpus as a panel member and is credited here with her permission.\n\n",
        "",
    ),
    (
        "research/Detection_Article_v3_2026-08-15.md",
        "Gabriela Cortez (Maryland Commission on Civil Rights) is named as a contributor to this paper. The argument in Section 2.1, that a record must stay understandable to the person it describes and that linguistic and jurisdictional range is part of what makes review real, came out of conversations with her and is credited to her with permission. It is not a decorative point in this manuscript. It is the reason the panel was built across eleven countries and several first languages instead of one, and that design choice is what the detection result rests on.\n\n",
        "",
    ),
    (
        "research/Detection_Article_v2_ExpertFocus.md",
        "**Contributor.** Gabriela Cortez (Maryland Commission on Civil Rights) contributed the argument developed in Section 2.1, that a record must remain understandable to the person it describes and that linguistic and jurisdictional range is a property of review rather than a courtesy. That argument is the reason this study was designed around an international panel rather than a single-jurisdiction one. She reviewed the corpus as a panel member and is credited here with her permission.\n\n",
        "",
    ),
    (
        "research/Detection_Article_v2_ExpertFocus.md",
        "Gabriela Cortez (Maryland Commission on Civil Rights) is named as a contributor to this paper. The argument in Section 2.1, that a record must stay understandable to the person it describes and that linguistic and jurisdictional range is part of what makes review real, came out of conversations with her and is credited to her with permission. It is not a decorative point in this manuscript. It is the reason the panel was built across eleven countries and several first languages instead of one, and that design choice is what the detection result rests on.\n\n",
        "",
    ),
    (
        "research/Detection_Article_v2_ExpertFocus.md",
        "- 2026-08-02b: **Byline returned to two authors.** Gabriela Cortez is credited as a named panel reviewer and as the origin of the Section 2.1 argument in the Acknowledgments, at her preference; she is not a co-author at this time. Section 2.1 is retained in the paper's voice. The dual-role disclosure is removed as no longer applicable.",
        "- 2026-08-02b: **Byline returned to two authors.** A panel reviewer (V-AI-08) was credited as the origin of the Section 2.1 argument in the Acknowledgments, at her preference, and was not a co-author. Section 2.1 is retained in the paper's voice. The dual-role disclosure is removed as no longer applicable. That credit was withdrawn on 2026-08-16 at the owner's instruction; Section 2.1 is unchanged and carries no attribution.",
    ),
    (
        "research/Detection_Article_v2_ExpertFocus.md",
        " Gabriela Cortez reinstated as co-author with authorship of Section 2.1, which is expanded into a fuller treatment of accessibility as an accountability property and the methodological rationale for an internationally and linguistically diverse panel; dual-role disclosure added.",
        " A panel reviewer (V-AI-08) was reinstated as co-author with authorship of Section 2.1, which is expanded into a fuller treatment of accessibility as an accountability property and the methodological rationale for an internationally and linguistically diverse panel; dual-role disclosure added. Both the authorship and the later contributor credit were withdrawn on 2026-08-16.",
    ),
    # ---- CREDIT SURFACE: the backup article carries the same acknowledgment.
    (
        "research/Backup_Article_EDPACS_DRR_Control.md",
        " The argument that a record must remain understandable to the person it describes originated in conversations with panel reviewer Gabriela Cortez. Each is credited with permission.",
        " Each is credited with permission.",
    ),
    (
        "research/Backup_Article_EDPACS_DRR_Control.md",
        "- Confirm Ubayet's acknowledgment wording, and Nanda's and Cortez's, all of which are already agreed in principle.",
        "- Confirm Ubayet's acknowledgment wording and Nanda's, both of which are already agreed in principle.",
    ),
    # ---- CREDIT SURFACES: submission byline maps.
    (
        "research/submission/Combined_Paper_STATUS_and_ODDS.md",
        "- **Authors:** Phillip Wikes, Gabriela Cortez, Ubayet Hossain (FRM)",
        "- **Authors:** Phillip Wikes, Ubayet Hossain (FRM)",
    ),
    (
        "research/submission/Research_Coverage_Map.md",
        "- **Byline co-author** of the combined paper (Phillip Wikes, Gabriela Cortez, Ubayet Hossain, FRM).",
        "- **Byline co-author** of the combined paper (Phillip Wikes, Ubayet Hossain, FRM).",
    ),
    # ---- CREDIT SURFACE: the honor roster link sheet. The link is dead; the row
    # would otherwise still print her name beside a retired code.
    (
        "research/Honor_Roster_Links_2026-08-09.md",
        "| H-2026-06 | detection | V-AI-08 | Gabriela Cortez | https://jrsstandard.com/honor.html?k=apuyyioat6 |\n",
        "",
    ),
    # ---- CREDIT SURFACE: the stale contributor link snapshot. Superseded by
    # research/Contributor_Links.md, and it publishes a live key beside a name.
    (
        "research/Contributor_Links_2026-08-03.md",
        "| Gabriela Cortez | V-AI-08 | https://www.jrsstandard.com/contributor.html?k=agbhlh6n4d |\n",
        "",
    ),
    # ---- CREDIT SURFACE: the verification send table.
    (
        "research/Message_Contributor_Verification.md",
        "| Gabriela Cortez | V-AI-08 | Civil-rights records, bilingual intake | confirm she still consents to be named |\n",
        "",
    ),
    # ---- CREDIT SURFACE: an unsent nudge message written to her personally.
    (
        "research/Panel_NonCompleter_DMs.md",
        "## V-AI-08 Gabriela Cortez (\"Gabi\", US) - not started  [SPECIAL: DRR-article inspiration]\nGabi, this whole thing started with you and \"stand on business,\" so it would mean a lot to have your name on the study. Your 24 records are still open, about an hour, and finishing by month-end gets your read counted. Panel credit, a certificate, and a recommendation whenever you want one. And I would love for you and the Commission's folks to have the training and guide, free: https://www.jrsstandard.com/training.html?access=k7m2p9x4t1c8&src=panel-org . Thank you, always. Phillip\n\n",
        "",
    ),
    # ---- CREDIT SURFACE: a naming precedent cited in someone else's reference.
    (
        "research/LinkedIn_Recommendation_Sidharth_Borah.md",
        "consistent with the Kyle McMullan / Gabriela Cortez / Gabriela Bar precedent",
        "consistent with the Kyle McMullan / Gabriela Bar precedent",
    ),
    # ---- STUDY RECORD SURFACES: the row stays, the name goes.
    (
        "research/Expert_Roster_All_Studies_2026-08-06.md",
        "| 5 | V-AI-08 | Gabriela Cortez | Civil-rights records and bilingual intake; Maryland Commission on Civil Rights | US |",
        "| 5 | V-AI-08 | (name withheld) | (withheld) | US |",
    ),
    (
        "research/PROJECT_STATE.md",
        "| V-AI-08 | Gabriela Cortez | Civil rights / bilingual intake | US (LatinX) | 24/24 | Complete (2026-07-17) |",
        "| V-AI-08 | (name withheld) | (withheld) | US | 24/24 | Complete (2026-07-17) |",
    ),
    (
        "research/Data_Analysis_2026-08-01.md",
        "Gabriela Cortez (V-AI-08)",
        "(name withheld) (V-AI-08)",
    ),
    (
        "research/International_Study_Results_2026-07-31.md",
        "Nitin Deshpande, Gabriela Cortez, Lawal Olabanji",
        "Nitin Deshpande, (name withheld, V-AI-08), Lawal Olabanji",
    ),
    (
        "research/Detection_ArmB_Completion_Checklist_2026-08-01.md",
        "- Gabriela Cortez (V-AI-08) — civil-rights records, bilingual intake (US) [see 1.4]",
        "- (name withheld) (V-AI-08) — withdrawn as a contributor 2026-08-16 [see 1.4]",
    ),
    (
        "research/Detection_ArmB_Completion_Checklist_2026-08-01.md",
        "**[1.4] Confirm Gabriela Cortez's status.**",
        "**[1.4] SUPERSEDED. V-AI-08 was withdrawn as a contributor on 2026-08-16 at the owner's instruction; there is no status left to confirm.**",
    ),
    # ---- HISTORICAL SURFACES: the decision survives, the name does not.
    (
        "research/Detection_ArmB_Article_Draft.md",
        "- 2026-08-01 - **Gabriela Cortez removed as co-author (per Phillip's decision).**",
        "- 2026-08-01 - **A panel reviewer (V-AI-08) removed as co-author (per Phillip's decision).**",
    ),
    (
        "research/Detection_ArmB_Article_Draft.md",
        "Companion artifacts that still reference her and were NOT touched here: DRR_Perspective_AIandEthics.md, CoverLetter_AIandEthics_DRR_Perspective.md, Cortez_CoAuthor_Invite.md, Reference_Gabriela_Cortez.md, Message_Gabriela_Cortez.md, and the submission/ status maps.",
        "SUPERSEDED 2026-08-16: she was withdrawn as a contributor entirely on the owner's instruction. The companion artifacts named in the original entry were deleted in that change, and the submission status maps were corrected.",
    ),
    (
        "research/Detection_ArmB_Article_Draft.md",
        "- 2026-07-25 - Gabriela Cortez (V-AI-08, \"Gabi\") opened as EARNED co-author (per Phillip).",
        "- 2026-07-25 - A panel reviewer (V-AI-08) opened as EARNED co-author (per Phillip).",
    ),
    (
        "research/Detection_ArmB_Article_Draft.md",
        " Invitation: `research/Cortez_CoAuthor_Invite.md`.",
        " The invitation file was deleted on 2026-08-16 with the withdrawal.",
    ),
    (
        "research/Reply_Hekim_EqualCoAuthors_2026-08-06.md",
        "The Gabriela Cortez credit added earlier today is out. She did not contribute to this article. Her credit stands in the detection paper, where the contribution is real.",
        "The V-AI-08 credit added earlier today is out. That reviewer did not contribute to this article. (SUPERSEDED 2026-08-16: withdrawn as a contributor from the detection paper as well, on the owner's instruction.)",
    ),
]


# --- Bulk rules for the internal decision log --------------------------------
#
# research/MASTER_TRACKER.md carries 50 occurrences across 18 months of decision
# entries. Listing each one as an exact rule would triple the length of this
# file and add nothing: every occurrence is the same substitution.
#
# THE LOG KEEPS ITS DECISIONS AND LOSES THE NAME. A tracker that deletes the
# entries recording a withdrawal cannot later show that the withdrawal was
# honoured, which is the one thing an audit record exists to do. The
# participant code is substituted so every entry stays traceable.
#
# ORDER MATTERS. The longest form is replaced first, or "Gabriela Cortez"
# becomes "Gabriela V-AI-08".
#
# "Gabriela Bar" is a DIFFERENT PERSON and is never touched: she appears as
# "Gabriela Bar" or "Bar", never as "Gabi", and the word-boundary patterns
# below cannot reach either form. Verified: 26 occurrences of "Gabriela Bar"
# and 69 of "Bar" survive this pass unchanged.
BULK_RULES = [
    ("research/MASTER_TRACKER.md", [
        (r'Gabriela Cortez \("Gabi"\)', "V-AI-08"),
        (r"\bGabi Cortez\b", "V-AI-08"),
        (r"\bGabriela Cortez\b", "V-AI-08"),
        (r"\bCortez\b", "V-AI-08"),
        (r"\bGabi\b", "V-AI-08"),
    ]),
    ("research/submission/Combined_Paper_STATUS_and_ODDS.md", [
        (r"\bGabi\b", "V-AI-08"),
    ]),
    # The Arm B draft's progress log. Three occurrences survive the exact rules
    # above because they sit inside longer sentences that the exact rules do not
    # cover: a first-person voice note, an alphabetical byline fragment, and a
    # narrative reference. Same substitution, same reason.
    ("research/Detection_ArmB_Article_Draft.md", [
        (r"\bGabi Cortez\b", "V-AI-08"),
        (r"\bGabriela Cortez\b", "V-AI-08"),
        (r"alphabetical Cortez/Hossain", "alphabetical V-AI-08/Hossain"),
        (r"\bCortez\b", "V-AI-08"),
        (r"\bGabi\b", "V-AI-08"),
    ]),
]


def apply_bulk(dry_run):
    applied, failed = [], []
    for rel, subs in BULK_RULES:
        path = os.path.join(ROOT, rel)
        body = read(path)
        if body is None:
            failed.append((rel, "unreadable or missing"))
            continue
        out = body
        for pattern, repl in subs:
            out, n = re.subn(pattern, repl, out)
            if n:
                applied.append((rel, "%d x /%s/" % (n, pattern)))
        if out != body and not dry_run:
            with io.open(path, "w", encoding="utf-8") as fh:
                fh.write(out)
    return applied, failed


def apply_rules(dry_run):
    applied, failed = [], []
    by_file = {}
    for rel, old, new in RULES:
        by_file.setdefault(rel, []).append((old, new))

    for rel, edits in sorted(by_file.items()):
        path = os.path.join(ROOT, rel)
        body = read(path)
        if body is None:
            failed.append((rel, "unreadable or missing"))
            continue
        out = body
        for old, new in edits:
            n = out.count(old)
            if n == 0:
                # A DELETION WHOSE TARGET IS GONE IS SATISFIED, NOT BROKEN.
                # Re-running --apply must be a no-op, and a rule with an empty
                # replacement leaves nothing behind to recognise on the second
                # pass. Treating that as a failure made a clean second run
                # report eight false failures. scan_traces() below is the
                # authority on whether the withdrawal actually holds.
                if not new:
                    applied.append((rel, "already removed"))
                elif new in out:
                    applied.append((rel, "already applied"))
                else:
                    failed.append((rel, "no match: %r" % old[:70]))
                continue
            out = out.replace(old, new)
            applied.append((rel, "%d x %r" % (n, old[:60])))
        if out != body and not dry_run:
            with io.open(path, "w", encoding="utf-8") as fh:
                fh.write(out)
    return applied, failed


def scan_traces():
    """Every surviving occurrence of a withdrawn name or identifier."""
    traces = []

    # FILENAMES ARE SCANNED TOO. Added 2026-08-27: the scan read file contents
    # only, so a withdrawn name in a PATH was invisible. A generated reminder
    # file called V-AI-08_Gabriela_Cortez.md sat in the tree and the check
    # reported clean. A name is exposed by a directory listing just as surely
    # as by a paragraph.
    for rel, full in walk_text_files():
        for w in WITHDRAWALS:
            if rel in w.get("name_allowed_in", []):
                continue
            flat = rel.replace("_", " ").replace("-", " ").replace("/", " ")
            for name in w["names"]:
                if re.search(r"\b%s\b" % re.escape(name), flat):
                    traces.append((rel, 0, "%s (in the filename)" % name))
                    break

    for rel, full in walk_text_files():
        body = read(full)
        if body is None:
            continue
        for w in WITHDRAWALS:
            if rel in w.get("name_allowed_in", []):
                continue
            for name in w["names"]:
                # Whole-word match so "Cortez" does not fire on a substring and
                # "Gabi" does not fire inside "Gabriela Bar", a different person.
                for m in re.finditer(r"\b%s\b" % re.escape(name), body):
                    line = body.count("\n", 0, m.start()) + 1
                    traces.append((rel, line, name))
            if rel in w.get("identifier_exempt", []):
                continue
            for ident in w.get("identifiers", []):
                for m in re.finditer(re.escape(ident), body):
                    line = body.count("\n", 0, m.start()) + 1
                    traces.append((rel, line, ident))
    # De-duplicate: "Gabriela Cortez" also matches "Cortez" at a later offset.
    seen, out = set(), []
    for rel, line, needle in sorted(traces):
        if (rel, line) in seen:
            continue
        seen.add((rel, line))
        out.append((rel, line, needle))
    return out


def main():
    ap = argparse.ArgumentParser()
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument("--apply", action="store_true", help="rewrite the files")
    g.add_argument("--check", action="store_true", help="report only")
    args = ap.parse_args()

    if args.apply:
        applied, failed = apply_rules(dry_run=False)
        b_applied, b_failed = apply_bulk(dry_run=False)
        applied += b_applied
        failed += b_failed
        for rel, what in applied:
            print("  applied  %-58s %s" % (rel, what))
        for rel, why in failed:
            print("  FAILED   %-58s %s" % (rel, why))
        print("\n%d edits applied, %d rules failed to match" % (len(applied), len(failed)))
        if failed:
            return 1

    traces = scan_traces()
    if traces:
        print("\nREMAINING TRACES (%d):" % len(traces))
        for rel, line, needle in traces:
            print("  %s:%d  %s" % (rel, line, needle))
        return 1
    print("\nNo trace of any withdrawn contributor remains outside the register.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
