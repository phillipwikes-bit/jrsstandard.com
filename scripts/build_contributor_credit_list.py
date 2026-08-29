#!/usr/bin/env python3
"""Build the named-contributor credit list for the detection manuscript.

TWO SOURCES, JOINED, BECAUSE NEITHER IS SUFFICIENT ALONE.

  /api/contributor-stats   public, gives the authoritative set of confirmed
                           participant codes and the named/anonymous split, but
                           exposes no names by design.
  /api/people-9dd1ecdf6f8cdfd4  owner-only, gives each person's name, title and
                           organisation as THEY entered it on the confirmation
                           form, with the code and the election in `detail`,
                           e.g. "Code E-10, named in paper".

THE ELECTION IS THE PERSON'S, NOT THE ROSTER'S. api/_contributor-roster.js holds
the name the study recorded; the confirmation form holds the name they chose to
be printed under. Only the second may be published. Anyone whose row says
anything other than "named in paper", or whose consent_public is false, is
counted and never named.

RECONCILIATION IS ENFORCED. If the codes recovered from the owner endpoint do
not match the confirmed set from the public one, this exits non-zero rather than
publishing a list it cannot vouch for.

    python3 scripts/build_contributor_credit_list.py
"""
import collections
import io
import json
import os
import re
import sys
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STATS = "https://www.jrsstandard.com/api/contributor-stats"
PEOPLE = "https://www.jrsstandard.com/api/people-9dd1ecdf6f8cdfd4"
OUT = os.path.join(ROOT, "research", "Contributor_Credit_List_2026-08-29.md")

UA = {"User-Agent": "Mozilla/5.0 (JRS credit list)"}


def get(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30) as r:
        return json.loads(r.read().decode())


def tidy(text):
    """Repair transcription artefacts in a self-entered title.

    The words are the contributor's own and are never rewritten. Only two
    mechanical defects are cleaned, both introduced by the form rather than
    chosen by the person: a close bracket with no opening partner (E-10 typed
    "Independent Director);"), and surrounding whitespace or a trailing
    separator. Anything else stands exactly as submitted.
    """
    out = []
    depth = 0
    for ch in text:
        if ch == "(":
            depth += 1
        elif ch == ")":
            if depth == 0:
                continue
            depth -= 1
        out.append(ch)
    return re.sub(r"[\s,;|]+$", "", "".join(out).strip())


def describe(r):
    """One person, rendered as name then their own description of themselves."""
    bits = [r["name"]]
    title = tidy(r["title"] or "")
    if title:
        bits.append(title)
    org = tidy(r["org"] or "")
    # An organisation is dropped when it repeats the title or is simply the
    # person's own name, which is what a sole practitioner enters when the form
    # asks for an employer they do not have.
    if org and org not in title and org.lower() != r["name"].strip().lower():
        bits.append(org)
    return ", ".join(bits)


def sort_key(code):
    m = re.match(r"([A-Z-]+?)-?(\d+)$", code)
    return (m.group(1), int(m.group(2))) if m else (code, 0)


def main():
    stats = get(STATS)
    people = get(PEOPLE)["people"]
    confirmed = set(stats["confirmed_codes"])

    rows = {}
    for p in people:
        if p.get("source") != "contributor-confirm":
            continue
        m = re.search(r"Code ([A-Z]+(?:-[A-Z]+)?-\d+)", p.get("detail") or "")
        if not m:
            continue
        code = m.group(1)
        # Latest confirmation per code wins; a person may submit twice.
        if code in rows and rows[code]["date"] >= p["date"]:
            continue
        named = ("named in paper" in (p.get("detail") or "").lower()
                 and p.get("consent_public") is True)
        rows[code] = {"date": p["date"], "name": (p.get("name") or "").strip(),
                      "org": (p.get("organization") or "").strip(),
                      "title": (p.get("title") or "").strip(),
                      "country": p.get("country") or "",
                      "named": named, "detail": p.get("detail") or ""}

    recovered = set(rows)
    missing = sorted(confirmed - recovered, key=sort_key)
    extra = sorted(recovered - confirmed, key=sort_key)

    print("RECONCILIATION")
    print("  /api/contributor-stats confirmed   %d" % len(confirmed))
    print("  owner endpoint confirmation rows   %d unique codes from %d rows"
          % (len(recovered), sum(1 for p in people if p.get("source") == "contributor-confirm")))
    print("  confirmed but no row recovered     %d %s" % (len(missing), ", ".join(missing)))
    print("  row present but not in confirmed   %d %s" % (len(extra), ", ".join(extra)))
    if missing or extra:
        print()
        print("[REQUIRED_ENV_PARAM] the two sources disagree. No credit list is")
        print("written: publishing names from a set that does not reconcile with the")
        print("authoritative confirmed list risks naming someone who did not confirm,")
        print("or omitting someone who did.")
        return 2

    named = {c: r for c, r in rows.items() if r["named"]}
    anon = {c: r for c, r in rows.items() if not r["named"]}
    print("  elected to be named                %d" % len(named))
    print("  elected anonymity or withheld      %d" % len(anon))
    if len(named) != stats["named_in_paper"]:
        print()
        print("[REQUIRED_ENV_PARAM] named count %d does not match the endpoint's "
              "named_in_paper %d" % (len(named), stats["named_in_paper"]))
        return 2
    print()

    lines = ["# Contributor credit list", "",
             "Built %s from the confirmed set at `/api/contributor-stats` joined to "
             "each person's own confirmation entry. **Names, titles and "
             "organisations are as the contributor typed them on the form, not as "
             "the study roster recorded them.**" % "2026-08-29", "",
             "**%d confirmed of %d on the roster. %d elected to be named; %d are "
             "counted and not named.**" % (stats["confirmed"], stats["roster"],
                                           len(named), len(anon)), "",
             "## Named contributors", ""]
    for code in sorted(named, key=sort_key):
        r = named[code]
        lines.append("- **%s** — %s" % (code, describe(r)))
    lines += ["", "## Confirmed, not named at their election", "",
              "Counted in every figure. Named nowhere.", ""]
    for code in sorted(anon, key=sort_key):
        lines.append("- %s" % code)
    io.open(OUT, "w", encoding="utf-8").write("\n".join(lines) + "\n")

    print("NAMED CONTRIBUTORS (%d)" % len(named))
    for code in sorted(named, key=sort_key):
        r = named[code]
        print("  %-8s %-30s %s" % (code, r["name"][:30], (r["org"] or r["title"])[:58]))
    print()
    print("NOT NAMED, AT THEIR ELECTION (%d): %s"
          % (len(anon), ", ".join(sorted(anon, key=sort_key))))
    print()
    print("written: %s" % os.path.relpath(OUT, ROOT))
    return 0


if __name__ == "__main__":
    sys.exit(main())
