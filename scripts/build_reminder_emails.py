#!/usr/bin/env python3
"""Generate contributor-link reminder emails, one file per person.

Nothing here is hand-copied. Names, codes and unguessable links come from
research/Contributor_Links.md, which is itself generated from
api/_contributor-roster.js; the fallback date is read out of
api/contributor.js. A reminder that carries a wrong link is worse than no
reminder, and a date typed ten times is a date that drifts.

PRIVATE OUTPUT. Each file contains one person's unguessable key. research/ is
excluded from the deploy for exactly this reason.

    python3 scripts/build_reminder_emails.py [--out DIR]
"""
import io
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LINKS = os.path.join(ROOT, "research", "Contributor_Links.md")
CONTRIB = os.path.join(ROOT, "api", "contributor.js")

# Codes to remind, in the order supplied by the owner on 2026-08-27.
TARGETS = ["E-10", "E-14", "RR-106", "RR-109", "RR-110", "RR-116",
           "V-AI-08", "V-AI-12", "V-AI-23", "V-AI-27"]

# What each group actually did. A reminder that thanks someone for the wrong
# study reads as a form letter, which is the one thing it must not be.
CONTRIBUTION = {
    "E":     "your expert ratings in the reliability study",
    "RR":    "completing the comparison study",
    "V-AI":  "completing the detection panel",
}


def group_of(code):
    if code.startswith("V-AI"):
        return "V-AI"
    if code.startswith("RR"):
        return "RR"
    return "E"


# A withdrawn contributor's name must not enter a new file. V-AI-08 withdrew
# naming consent on 2026-08-16 and was PARTIALLY reinstated on 2026-08-19,
# scoped to the contributor link and to the four files listed in
# scripts/withdraw_contributor.py under name_allowed_in. A reminder about that
# link is within the reinstatement, but a NEW file carrying her name is not.
#
# Her reminder is therefore generated with no name in the filename and a
# neutral greeting in the body. The owner sends it to an address he already
# holds; the file does not need to identify her to do its job.
WITHDRAWN_CODES = {"V-AI-08"}


def first_name(full):
    n = full.strip()
    for p in ("Dr. ", "Dr ", "Prof. ", "Prof "):
        if n.startswith(p):
            n = n[len(p):]
    return n.split()[0]


def roster():
    text = io.open(LINKS, encoding="utf-8").read()
    out = {}
    for line in text.splitlines():
        m = re.match(r"^\|\s*([^|]+?)\s*\|\s*`([^`]+)`\s*\|\s*([^|]*?)\s*\|\s*(\S+)\s*\|", line)
        if m:
            out[m.group(2)] = {"name": m.group(1).strip(),
                               "note": m.group(3).strip(),
                               "link": m.group(4).strip()}
    return out


def fallback_date():
    src = io.open(CONTRIB, encoding="utf-8").read()
    m = re.search(r"FALLBACK_DATE\s*=\s*'([^']+)'", src)
    if not m:
        raise SystemExit("FALLBACK_DATE not found in api/contributor.js")
    return m.group(1)


TEMPLATE = """Subject: Quick one, {first} - your name on the JRS write-up

Hi {first},

A short reminder rather than anything urgent. Thank you again for {what}.

I am putting the write-ups together and I would rather not guess how you want
to be credited. Your link is below. It takes about a minute and asks three
things: how you want your name and title printed, an address to reach you at,
and three yes or no permissions.

{link}

The link is yours alone, so there is nothing to log in to.

If I have not heard from you by {date}, I will use what I already have on
file rather than chase you again. Choosing to stay anonymous is a perfectly
good answer and the form handles it in one click.

Thanks for the time you already gave this.

Best,
Phillip

Phillip Wikes
info@jrsstandard.com
"""


def main():
    out_dir = os.path.join(ROOT, "research", "Reminder_Emails_2026-08-27")
    if "--out" in sys.argv:
        out_dir = sys.argv[sys.argv.index("--out") + 1]
    os.makedirs(out_dir, exist_ok=True)

    people = roster()
    date = fallback_date()
    missing = [c for c in TARGETS if c not in people]
    if missing:
        raise SystemExit("codes absent from the roster: %s" % ", ".join(missing))

    written = []
    for code in TARGETS:
        p = people[code]
        withdrawn = code in WITHDRAWN_CODES
        body = TEMPLATE.format(first="there" if withdrawn else first_name(p["name"]),
                               what=CONTRIBUTION[group_of(code)],
                               link=p["link"],
                               date=date)
        if withdrawn:
            fname = "%s.md" % code
        else:
            fname = "%s_%s.md" % (code, p["name"].replace(" ", "_").replace(".", ""))
        path = os.path.join(out_dir, fname)
        io.open(path, "w", encoding="utf-8").write(body)
        written.append((code, p["name"], fname, len(body.split())))

    print("fallback date read from api/contributor.js: %s" % date)
    print("%d reminders written to %s" % (len(written), os.path.relpath(out_dir, ROOT)))
    for code, name, fname, words in written:
        label = "(withdrawn: name withheld)" if code in WITHDRAWN_CODES else name
        print("  %-9s %-26s %-44s %d words" % (code, label, fname, words))
    return 0


if __name__ == "__main__":
    sys.exit(main())
