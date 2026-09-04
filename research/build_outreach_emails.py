#!/usr/bin/env python3
"""Generate the per-person outreach emails from api/_contributor-roster.js.

ONE SOURCE, ONE SHEET. The links in these emails are read out of the roster
module at build time and never typed. A hand-written email is how a person gets
sent a key that belongs to somebody else, or a key that was withdrawn and now
404s; both have happened on the link sheet before it was generated.

Output: research/Outreach_Emails_2026-08-19.md  (PRIVATE, research/ is not
deployed). Regenerate rather than edit.

  python3 research/build_outreach_emails.py
"""
import io
import os
import re
import textwrap

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ROSTER = os.path.join(ROOT, "api", "_contributor-roster.js")
HONOR = os.path.join(ROOT, "api", "honor.js")
OUT = os.path.join(ROOT, "research", "Outreach_Emails_2026-08-19.md")

BASE = "https://www.jrsstandard.com"
DEADLINE = "September 5, 2026"

ENTRY_RE = re.compile(
    r"^  '([a-z0-9]{10})': \{ code:'([^']+)',\s*kind:'([^']+)',\s*"
    r"first:'([^']*)',\s*name:'([^']*)',\s*title:'((?:[^']|\\')*)',\s*"
    r"org:'([^']*)'", re.M)


def read(p):
    with io.open(p, encoding="utf-8") as fh:
        return fh.read()


def roster():
    out = []
    for m in ENTRY_RE.finditer(read(ROSTER)):
        key, code, kind, first, name, title, org = m.groups()
        out.append(dict(key=key, code=code, kind=kind, first=first,
                        name=name, title=title, org=org))
    return out


def honor_key_for(participant):
    """The honor key bound to a participant code, or None."""
    body = read(HONOR)
    for blk in re.finditer(r"^  '([a-z0-9]{10})': \{(.*?)^  \},", body,
                           re.M | re.S):
        key, inner = blk.groups()
        pm = re.search(r"participant: '([^']+)'", inner)
        if pm and pm.group(1) == participant:
            return key
    return None


def link(key):
    return "%s/contributor.html?k=%s" % (BASE, key)


# --- The letters -------------------------------------------------------------
#
# Short on purpose. Each one says what the link does, what happens if they do
# nothing, and nothing else. The deadline sentence is the same in every letter
# and matches FALLBACK_DATE in api/contributor.js.

FALLBACK = (
    "If I do not hear from you by %s, the paper uses what is on file for you, "
    "and where there is no naming choice on file that means anonymous. A name "
    "is never printed on silence alone." % DEADLINE)

SIGNOFF = "Best,\nPhillip Wikes\nJRS Standard\ninfo@jrsstandard.com"

# What each group actually did, in the second person. Written per study rather
# than templated from the study name: "thank you for the comparison study" reads
# like a mail merge, which is the one thing these letters must not read like.
OPENING = {
    "international detection study":
        "Thank you again for reading the full 24-record set for the "
        "international detection study, cold and blind to the key. It is "
        "written up now and heading out, and before it goes I want your name "
        "on it the way you want it, or off it entirely if you would rather.",
    "comparison study":
        "Thank you again for working through the full record set for the "
        "comparison study. It is written up now and heading out, and before it "
        "goes I want your name on it the way you want it, or off it entirely "
        "if you would rather.",
    "reliability study":
        "Thank you again for rating the reliability set. That work is what "
        "lets the paper say the scoring holds up between independent readers "
        "rather than just asserting it. It is written up now, and before it "
        "goes out I want your name on it the way you want it, or off it "
        "entirely if you would rather.",
}

CLOSING = {
    "international detection study":
        "Thanks for the care you put into the reviews. The result does not "
        "exist without them.",
    "comparison study":
        "Thanks for the care you put into the reviews. The result does not "
        "exist without them.",
    "reliability study":
        "Thanks for the care you put into the ratings.",
}


def greet(p):
    """An anonymous entry has no name to greet, and inventing one is worse than
    a neutral opening. Falls back rather than emitting "Hi ,"."""
    return "Hi %s," % p["first"] if p["first"] else "Hello,"


def compose(subject, paragraphs):
    """Wrap every paragraph to 78 columns.

    THE WRAPPING IS NOT COSMETIC. These letters interpolate names, titles and
    URLs of wildly different lengths, so a hand-wrapped template produces one
    tidy line and one that runs to 140 characters. Wrapping at build time means
    the letter is laid out after the substitution rather than before it. Bare
    URLs are exempt: a wrapped URL is a broken URL.
    """
    out = ["Subject: " + subject, ""]
    for para in paragraphs:
        if para.startswith("http") or "\n" in para:
            out.append(para)
        else:
            out.append(textwrap.fill(para, width=78))
        out.append("")
    return "\n".join(out).rstrip() + "\n"


LINK_PARA = ("It takes about a minute. You choose how you are credited, correct "
             "your title and organisation if I have them wrong, and set one "
             "permission that covers how your contribution may be used. It also "
             "opens the Investigator Field Guide, the training and the private "
             "diagnostic.")


def letter_panel(p, study):
    return compose(
        "Your JRS contributor link, and how you'd like to be credited",
        [greet(p),
         OPENING[study],
         "This link is yours and only yours:",
         link(p["key"]),
         LINK_PARA,
         FALLBACK,
         CLOSING[study],
         SIGNOFF])


def letter_author(p):
    return compose(
        "Your JRS contributor link, and how you'd like to be credited",
        [greet(p),
         "We are close to sending the write-up out, and before it goes I want "
         "your credit recorded the way you want it rather than the way I "
         "guessed.",
         "Your link:",
         link(p["key"]),
         LINK_PARA,
         FALLBACK,
         "Thank you for the work on this.",
         SIGNOFF])


def letter_hossain(p, hkey):
    return compose(
        "Your honoree certificate, and one link to confirm your credit",
        ["Hi %s," % p["first"],
         "The methodology you designed is the part of this programme that "
         "decides what counts as evidence: the reference-panel design, the "
         "chance-corrected reliability framework, and the acceptance "
         "thresholds we fixed before we had any results to be tempted by. That "
         "is the piece nobody can add afterwards, and it is why the findings "
         "hold up.",
         "So I have named you an honoree. Yours is the only certificate in the "
         "programme awarded for a contribution rather than for a completed "
         "review, and this page is where you accept it:",
         "%s/honor.html?k=%s" % (BASE, hkey),
         "Your certificate itself, once you have accepted:",
         "%s/api/honor-cert?k=%s" % (BASE, hkey),
         "And this is your contributor link, the same one every named "
         "contributor gets, for how you want your name, title and organisation "
         "printed and for the one permission covering use of your work:",
         link(p["key"]),
         FALLBACK,
         "Thank you, genuinely. You built the part of this that had to be right "
         "first.",
         SIGNOFF])


STUDY_BY_PREFIX = [
    ("V-AI-", "international detection study"),
    ("RR-", "comparison study"),
    ("E-", "reliability study"),
]


def study_for(code):
    for pre, s in STUDY_BY_PREFIX:
        if code.startswith(pre):
            return s
    return None


def main():
    people = roster()
    hoss = [p for p in people if p["code"] == "M-01"]
    hkey = honor_key_for("M-01")
    if not hoss or not hkey:
        raise SystemExit("M-01 or his honor entry is missing; refusing to write "
                         "a sheet that would send an honoree a dead link")

    groups = {"international detection study": [], "comparison study": [],
              "reliability study": [], "other": []}
    for p in people:
        if p["code"] == "M-01":
            continue
        s = study_for(p["code"])
        groups[s if s else "other"].append(p)
    for g in groups:
        groups[g].sort(key=lambda p: p["code"])

    L = []
    W = L.append
    W("# Outreach emails, one per contributor")
    W("")
    W("**PRIVATE. Do not publish this file.** Every email below carries one "
      "person's unguessable link. `research/` is excluded from the deploy for "
      "exactly this reason.")
    W("")
    W("**Generated by `research/build_outreach_emails.py` from "
      "`api/_contributor-roster.js` and `api/honor.js`.** Do not edit by hand. "
      "The links are read out of the roster at build time so an email can never "
      "carry a key that belongs to someone else or a key that has been "
      "withdrawn.")
    W("")
    W("**Deadline in every letter: %s**, matching `FALLBACK_DATE` in "
      "`api/contributor.js`. Change it there and regenerate; do not edit it "
      "here." % DEADLINE)
    W("")
    W("**One honoree certificate.** Only M-01 receives a certificate for a "
      "contribution. Every other person here already holds a completion "
      "designation from finishing their review, and these letters do not "
      "re-issue it; they collect the naming election the paper needs.")
    W("")
    W("---")
    W("")
    W("## Honoree: methodology")
    W("")
    p = hoss[0]
    W("### %s (`%s`)" % (p["name"], p["code"]))
    W("")
    W("```")
    W(letter_hossain(p, hkey).rstrip())
    W("```")
    W("")

    for title, key in [
        ("International detection panel (Arm A)", "international detection study"),
        ("Comparison study (Arm B)", "comparison study"),
        ("Reliability study expert raters (Study 004)", "reliability study"),
        ("Facilitators and other named contributors", "other"),
    ]:
        rows = groups[key]
        if not rows:
            continue
        W("---")
        W("")
        W("## %s (%d)" % (title, len(rows)))
        W("")
        for p in rows:
            label = p["name"] or "(anonymous by choice)"
            W("### %s (`%s`)" % (label, p["code"]))
            W("")
            W("```")
            if key == "other" or p["kind"] == "author":
                W(letter_author(p).rstrip())
            else:
                W(letter_panel(p, key).rstrip())
            W("```")
            W("")

    W("---")
    W("")
    W("**%d letters, %d roster entries.** Equal by construction: every roster "
      "entry is rendered once and nothing else is."
      % (len(people), len(people)))
    W("")
    W("**Anonymous entries carry no name to address.** Where the roster holds no "
      "name the greeting is a plain \"Hello,\" and no name is invented. The "
      "person elected anonymity, and their link is reached through the channel "
      "they registered on; send those there rather than filling in a name.")

    body = "\n".join(L) + "\n"
    with io.open(OUT, "w", encoding="utf-8") as fh:
        fh.write(body)
    print("wrote %s" % OUT)
    print("  letters: %d | roster entries: %d | honoree key: %s"
          % (len(people), len(people), hkey))


if __name__ == "__main__":
    main()
