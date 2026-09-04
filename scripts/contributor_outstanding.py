#!/usr/bin/env python3
"""Who has not confirmed through their contributor link.

Two sources, joined locally:

  api/contributor-stats.js   LIVE, token-free, returns confirmed_codes only.
                             It exposes codes and never names, deliberately:
                             "a bare study code identifies nobody outside the
                             private roster held in /api/contributor".

  research/Contributor_Links.md   PRIVATE, local only, maps code -> person.
                             research/ is excluded from the deploy for exactly
                             this reason.

The join happens here and nowhere else. No name is sent anywhere, and nothing
this prints should be pasted into a public surface.

    python3 scripts/contributor_outstanding.py [--json out.json]
"""
import io
import json
import os
import re
import sys
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LINKS = os.path.join(ROOT, "research", "Contributor_Links.md")
STATS = "https://www.jrsstandard.com/api/contributor-stats"


def roster_from_links():
    """code -> (name, section, role note). Parsed from the generated table."""
    if not os.path.exists(LINKS):
        raise SystemExit("missing %s" % LINKS)
    text = io.open(LINKS, encoding="utf-8").read()
    people, section = {}, "(unsectioned)"
    for line in text.splitlines():
        h = re.match(r"^##\s+(.*)$", line.strip())
        if h:
            section = h.group(1).strip()
            continue
        # | Name | `CODE` | role note | link |
        m = re.match(r"^\|\s*([^|]+?)\s*\|\s*`([^`]+)`\s*\|\s*([^|]*?)\s*\|", line)
        if not m:
            continue
        name, code, note = m.group(1).strip(), m.group(2).strip(), m.group(3).strip()
        if name.lower() in ("person", "name"):
            continue
        people[code] = (name, section, note)
    return people


def live_stats():
    req = urllib.request.Request(STATS, headers={"User-Agent": "jrs-outstanding/1.0"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode("utf-8"))


def main():
    people = roster_from_links()
    stats = live_stats()
    confirmed = set(stats.get("confirmed_codes") or [])
    roster_n = stats.get("roster")

    outstanding = {c: v for c, v in people.items() if c not in confirmed}
    # Codes the endpoint reports confirmed that the local roster cannot name.
    unmapped = sorted(confirmed - set(people))

    print("LIVE   roster=%s confirmed=%s outstanding=%s"
          % (roster_n, stats.get("confirmed"), stats.get("outstanding")))
    print("LOCAL  roster file lists %d people, %d unconfirmed"
          % (len(people), len(outstanding)))
    if roster_n is not None and roster_n != len(people):
        print("  MISMATCH: the endpoint counts %s, the links file lists %d."
              % (roster_n, len(people)))
        print("  The endpoint imports its size from api/_contributor-roster.js;")
        print("  the links file is generated from the same roster. A gap means")
        print("  one of them was regenerated and the other was not.")
    if unmapped:
        print("  CONFIRMED BUT NOT IN THE LINKS FILE: %s" % ", ".join(unmapped))

    print()
    by_section = {}
    for code, (name, section, note) in sorted(outstanding.items()):
        by_section.setdefault(section, []).append((code, name, note))

    for section in sorted(by_section):
        rows = by_section[section]
        print("%s  (%d outstanding)" % (section, len(rows)))
        for code, name, note in sorted(rows, key=lambda r: r[0]):
            print("    %-10s %-32s %s" % (code, name, note))
        print()

    if "--json" in sys.argv:
        path = sys.argv[sys.argv.index("--json") + 1]
        io.open(path, "w", encoding="utf-8").write(json.dumps({
            "live": stats,
            "outstanding": [{"code": c, "name": v[0], "section": v[1], "note": v[2]}
                            for c, v in sorted(outstanding.items())],
            "unmapped_confirmed": unmapped,
        }, indent=2))
        print("wrote %s" % path)
    return 0


if __name__ == "__main__":
    sys.exit(main())
