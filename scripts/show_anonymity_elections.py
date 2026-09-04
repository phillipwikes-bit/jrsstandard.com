#!/usr/bin/env python3
"""Show, live, who elected not to be named, and who has no name to show.

WHY THIS READS AND DOES NOT STORE. Everyone this reports asked in some form not
to be listed. Writing them into a file in the repository would create a second
copy of exactly the thing they declined, one that then has to be kept in step
with their election and defended for as long as it exists. The owner endpoint
already holds the authoritative answer, so this queries it and prints to the
terminal. It writes nothing and takes no --output.

FOUR DIFFERENT SITUATIONS, WHICH A SINGLE LIST WOULD FLATTEN:

  1. Confirmed, elected anonymity     They confirmed participation and chose
                                      not to be named in the paper. A name
                                      exists and the owner holds it.
  2. Withdrew naming consent          Named once, then withdrew. Governed by
                                      the register in scripts/withdraw_contributor.py,
                                      which is why no name is printed here.
                                      Participation stands; naming does not.
  3. Anonymous by choice, no name     Took part without giving a name at all.
                                      Nothing to print.
  4. Anonymous by design              Reliability bench codes generated in the
                                      browser and never bound to an identity.
                                      No name exists anywhere to recover.

    python3 scripts/show_anonymity_elections.py
"""
import json
import os
import re
import sys
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENDPOINT = "https://www.jrsstandard.com/api/people-9dd1ecdf6f8cdfd4"
UA = {"User-Agent": "Mozilla/5.0 (JRS anonymity elections)"}
INVENTORY = os.path.join(ROOT, "research", "PARTICIPANT_INVENTORY_BY_RUNG.md")


def fetch():
    req = urllib.request.Request(ENDPOINT, headers=UA)
    with urllib.request.urlopen(req, timeout=30) as r:
        d = json.loads(r.read().decode())
    return d if isinstance(d, list) else d.get("people") or d.get("rows") or []


def main():
    print("OWNER COPY. These people asked not to be listed. Do not forward,")
    print("and do not copy any of it into a file.")
    print()

    try:
        rows = fetch()
    except Exception as e:
        print("[REQUIRED_ENV_PARAM] the owner endpoint did not answer: %r" % e)
        print("No cached copy exists by design, so there is nothing to fall")
        print("back to. Retry when the endpoint is reachable.")
        return 2

    elected = {}
    for r in rows:
        if r.get("source") != "contributor-confirm":
            continue
        if r.get("consent_public"):
            continue
        det = str(r.get("detail") or "")
        m = re.match(r"Code ([A-Z-]+\d+)", det)
        if not m:
            continue
        elected[m.group(1)] = (r.get("name") or "(no name on the row)",
                               r.get("country") or "")

    print("1. CONFIRMED AND ELECTED ANONYMITY  (%d)" % len(elected))
    print("   Counted in every figure. Named nowhere in the paper.")
    for code in sorted(elected):
        name, country = elected[code]
        print("   %-9s %-26s %s" % (code, name, country))
    print()

    print("2. WITHDREW NAMING CONSENT  (1)")
    print("   V-AI-08. Completed the full 24-record set on 2026-08-16 and")
    print("   withdrew consent to be named after data close. Her judgments")
    print("   remain in the analysis. Her name is governed by the register in")
    print("   scripts/withdraw_contributor.py and is deliberately not printed")
    print("   here: that register exists so the name lives in one allowlisted")
    print("   place rather than wherever it was last convenient.")
    print()

    print("3. ANONYMOUS BY CHOICE, NO NAME EVER GIVEN")
    no_name = []
    if os.path.exists(INVENTORY):
        for line in open(INVENTORY, encoding="utf-8"):
            if "Anonymous by choice" in line:
                m = re.search(r"`([A-Z-]+\d+)`", line)
                if m:
                    no_name.append(m.group(1))
    if no_name:
        print("   %s. They took part without supplying a name, so there is"
              % ", ".join(sorted(no_name)))
        print("   nothing to disclose and nothing to withhold.")
    else:
        print("   None recorded in the participant inventory.")
    print()

    print("4. ANONYMOUS BY DESIGN")
    print("   The reliability bench reviewers. Their codes were generated in")
    print("   the browser and were never bound to an identity, so no name")
    print("   exists anywhere to recover. This is a property of how that")
    print("   instrument was built, not an election any of them made.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
