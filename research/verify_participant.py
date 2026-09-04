#!/usr/bin/env python3
"""Establish exactly what one person did, before any recognition is written.

WHY THIS EXISTS SEPARATELY FROM check_completion.py. That script answers one
question, "did this study code complete 24 records", and it answers it well. It
cannot answer "what did this person actually do", because most people in this
programme never held a study code. They enrolled in training, or submitted the
reviewer evaluation, or endorsed an initiative, or ran an organisation pilot,
and each of those is a different artifact with a different truthful claim
attached to it.

THE FAILURE THIS PREVENTS. On 2026-08-16 a roster tile reading "18 RECORDS" was
read as one person having reviewed 18 records. It is `total_rows` from
api/people-9dd1ecdf6f8cdfd4: 18 rows in the private contact table across 12
people. The person in question has records_run = 0. A recognition written from
that reading would have credited a record review that never happened, in a
public LinkedIn post, under the programme's name.

WHAT IT PRINTS. Every row the person holds, what each row's source means, which
claims the data supports, and, explicitly, which claims it does NOT support.
The refusals are the point.

Usage:
  python3 research/verify_participant.py "Aigul Moiseeva"
  python3 research/verify_participant.py moiseevaaigul@gmail.com
  python3 research/verify_participant.py --list

Exit code: 0 if the person was found, 1 if not found, 2 on a data error.
No credential is needed: this reads the same no-token endpoint the programme
status page reads.
"""
import json
import sys
import urllib.error
import urllib.request

PEOPLE = "https://www.jrsstandard.com/api/people-9dd1ecdf6f8cdfd4"
ASSETS = "https://www.jrsstandard.com/api/asset-stats"
PANEL = "https://www.jrsstandard.com/api/panel-stats"

# What each contact-row source actually attests. A source not in this map is
# reported as unknown rather than guessed at, because guessing here is exactly
# how an unsupported credential gets written.
SOURCE_MEANING = {
    "training-enroll": (
        "Enrolled in the six-module JRS Reviewer Training.",
        ["enrolled in the training"],
        ["completed the training (enrolment is not completion; look for a "
         "training-complete row)"],
    ),
    "training-complete": (
        "Completed the six-module JRS Reviewer Training.",
        ["completed the six-module JRS Reviewer Training"],
        ["reviewed any record", "took part in the detection study"],
    ),
    "reviewer-eval-incentive": (
        "Submitted the reviewer evaluation and asked for a LinkedIn "
        "recommendation in the optional incentive block at the end of it.",
        ["submitted the reviewer evaluation",
         "asked for a recommendation, which is consent for that one artifact"],
        ["reviewed any record", "graded records against the answer key",
         "was on the international detection panel",
         "completed the training, unless a training-complete row also exists"],
    ),
    "reviewer-cert": (
        "Submitted the reviewer evaluation and requested the completion "
        "certificate. The certificate is self-serve from the completion code.",
        ["submitted the reviewer evaluation",
         "already holds a certificate, or can render one at any time"],
        ["reviewed any record", "completed the training, unless a "
         "training-complete row also exists"],
    ),
    "honor-accept": (
        "Accepted a JRS Honor designation.",
        ["accepted the honor named in their honor_code"],
        [],
    ),
    "support-register": (
        "Registered support for an initiative through the gate.",
        ["endorsed an initiative"],
        ["reviewed any record", "completed any training"],
    ),
    "support": (
        "Endorsed an initiative before the registration gate (2 August 2026).",
        ["endorsed an initiative"],
        ["reviewed any record", "completed any training"],
    ),
    "contributor-confirm": (
        "Confirmed their contributor details for the paper.",
        ["confirmed how they wish to be credited"],
        [],
    ),
    "guide-register": (
        "Registered to download an Investigator Field Guide.",
        ["downloaded a field guide"],
        ["reviewed any record", "completed any training"],
    ),
}

# Claims that require a study code and a verified completion. Never inferable
# from a contact row, whatever it says.
STUDY_CLAIMS = [
    "reviewed the 24-record set",
    "graded records against the verified answer key",
    "was a member of the international detection panel",
    "is one of the 58 independent experts who graded records",
    "completed a full 24-record set",
]


def get(url):
    try:
        with urllib.request.urlopen(url, timeout=45) as r:
            return json.loads(r.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        sys.stderr.write("HTTP %s from %s\n" % (e.code, url))
        sys.exit(2)
    except Exception as e:
        sys.stderr.write("request failed for %s: %r\n" % (url, e))
        sys.exit(2)


def match(person, needle):
    n = needle.strip().lower()
    return (n in (person.get("name") or "").lower()
            or n == (person.get("email") or "").strip().lower())


def main():
    if len(sys.argv) < 2:
        sys.stderr.write(__doc__)
        return 2

    data = get(PEOPLE)
    people = data.get("people") or []

    if sys.argv[1] == "--list":
        print("%-24s %-24s %-4s %s" % ("NAME", "SOURCE", "CTRY", "ACTIVITY"))
        for p in people:
            print("%-24s %-24s %-4s %s"
                  % ((p.get("name") or "")[:24], (p.get("source") or "")[:24],
                     p.get("country") or "", p.get("activity") or ""))
        print("\n%s rows, %s unique people, %s organizations"
              % (data.get("total_rows"), data.get("unique_people"),
                 data.get("organizations")))
        return 0

    needle = sys.argv[1]
    rows = [p for p in people if match(p, needle)]

    print("=" * 74)
    print("PARTICIPANT VERIFICATION: %s" % needle)
    print("=" * 74)

    # The tile that caused the misreading, stated first so it cannot cause it
    # again from this output.
    print()
    print("ROSTER TILE CONTEXT, so no per-person figure is read off it:")
    print("  total_rows    %s   <- the 'RECORDS' tile. Rows in the contact"
          % data.get("total_rows"))
    print("                       table, NOT records anyone reviewed.")
    print("  unique_people %s" % data.get("unique_people"))
    print("  organizations %s" % data.get("organizations"))

    if not rows:
        print()
        print("NOT FOUND. No contact row carries that name or address.")
        print("Do not write any recognition. The person may be under a")
        print("different spelling, or may hold only a study code, in which")
        print("case run: python3 research/check_completion.py <CODE>")
        return 1

    print()
    print("ROWS HELD BY THIS PERSON: %d" % len(rows))
    supports, refuses, unknown_sources = [], [], []
    records_run_total = 0
    codes = {"completion": set(), "honor": set()}
    linkedin = set()
    orgs = set()
    countries = set()
    consent_public = False
    consent_transfer = False

    for i, r in enumerate(rows, 1):
        src = r.get("source") or ""
        print()
        print("  [%d] %s" % (i, r.get("date") or ""))
        print("      source        %s" % src)
        print("      activity      %s" % (r.get("activity") or ""))
        print("      detail        %s" % (r.get("detail") or ""))
        print("      organization  %s" % (r.get("organization") or "(none on file)"))
        print("      title         %s" % (r.get("title") or "(none on file)"))
        print("      country       %s (%s)" % (r.get("country") or "",
                                               r.get("country_source") or ""))
        print("      records_run   %s" % r.get("records_run"))
        print("      consent_public   %s" % r.get("consent_public"))
        print("      consent_transfer %s" % r.get("consent_transfer"))
        if src in SOURCE_MEANING:
            meaning, sup, ref = SOURCE_MEANING[src]
            print("      MEANS         %s" % meaning)
            supports.extend(sup)
            refuses.extend(ref)
        else:
            print("      MEANS         UNKNOWN SOURCE. Not interpreted.")
            unknown_sources.append(src)
        records_run_total += r.get("records_run") or 0
        if r.get("completion_code"):
            codes["completion"].add(r["completion_code"])
        if r.get("honor_code"):
            codes["honor"].add(r["honor_code"])
        if r.get("linkedin_url"):
            linkedin.add(r["linkedin_url"])
        if r.get("organization"):
            orgs.add(r["organization"])
        if r.get("country"):
            countries.add(r["country"])
        consent_public = consent_public or bool(r.get("consent_public"))
        consent_transfer = consent_transfer or bool(r.get("consent_transfer"))

    # Training is only meaningful on the enrolment and completion rows. On any
    # other row type the field defaults to False and means nothing, which is a
    # trap: it reads as "did not complete" when it means "not applicable".
    has_enroll = any((r.get("source") == "training-enroll") for r in rows)
    has_complete = any((r.get("source") == "training-complete") for r in rows)

    print()
    print("-" * 74)
    print("ESTABLISHED")
    print("-" * 74)
    print("  records reviewed by this person   %d" % records_run_total)
    print("  organization on file              %s"
          % (", ".join(sorted(orgs)) if orgs else "(none)"))
    print("  country                           %s"
          % (", ".join(sorted(countries)) if countries else "(none)"))
    print("  completion code                   %s"
          % (", ".join(sorted(codes["completion"])) or "(none)"))
    print("  honor code                        %s"
          % (", ".join(sorted(codes["honor"])) or "(none)"))
    print("  LinkedIn                          %s"
          % (", ".join(sorted(linkedin)) or "(none on file)"))
    print("  training enrolment row            %s" % ("YES" if has_enroll else "NO"))
    print("  training completion row           %s" % ("YES" if has_complete else "NO"))
    if not has_enroll and not has_complete:
        print("    NOTE: the training_completed field on this person's rows is")
        print("    False because it is only set on training rows. It is NOT")
        print("    evidence either way. The absence of both rows above is.")
    print("  consented to be named publicly    %s" % consent_public)
    print("  consented to transfer             %s" % consent_transfer)

    print()
    print("-" * 74)
    print("THE DATA SUPPORTS THESE CLAIMS")
    print("-" * 74)
    for c in sorted(set(supports)):
        print("  YES  %s" % c)
    if has_complete:
        print("  YES  completed the six-module JRS Reviewer Training")

    print()
    print("-" * 74)
    print("THE DATA DOES NOT SUPPORT THESE CLAIMS. DO NOT WRITE THEM.")
    print("-" * 74)
    seen = set()
    for c in refuses:
        if c in seen:
            continue
        seen.add(c)
        print("  NO   %s" % c)
    if not has_complete:
        print("  NO   completed the six-module JRS Reviewer Training "
              "(no training-complete row exists)")
    for c in STUDY_CLAIMS:
        print("  NO   %s  [requires a study code and check_completion.py]" % c)
    if not consent_public:
        print()
        print("  CONSENT LIMIT: consent_public is False. This person did not")
        print("  tick 'list my name publicly as a JRS-trained reviewer'.")
        print("  A public artifact naming them is only in scope where they")
        print("  asked for that specific artifact, which the rows above show.")

    if unknown_sources:
        print()
        print("  UNINTERPRETED SOURCES: %s" % ", ".join(sorted(set(unknown_sources))))
        print("  Add them to SOURCE_MEANING before writing anything from them.")

    print()
    print("-" * 74)
    print("CROSS-CHECK AGAINST THE STUDY ROSTER")
    print("-" * 74)
    panel = get(PANEL)
    print("  programme reviewers who graded records   %s" % panel.get("reviewers_all"))
    print("  completed a full 24-record set           %s" % panel.get("completers_all"))
    print("  This person is in that population only if a study code resolves")
    print("  through research/check_completion.py. A contact row never proves it.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
