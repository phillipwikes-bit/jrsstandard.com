#!/usr/bin/env python3
"""Has the Master Tracker actually been written to today?

WHY THIS EXISTS. The standing directive is that every response updates
research/MASTER_TRACKER.md. On 2026-08-27 the owner asked how he could trust
that it was happening, and the measurement proved him right: that day held ONE
entry against about five substantive turns. Two turns, a strategic assessment
and a delivery-defect fix, had no entry at all.

The answer to "how can I trust you" is not a stronger promise. It is a number
he can read. This prints that number.

WHAT IT CANNOT DO. It cannot count conversational turns; nothing in the
repository records them. It counts entries per date and the age of the newest
one. A low count on a busy day is the signal.

    python3 scripts/check_tracker_current.py            # today
    python3 scripts/check_tracker_current.py --days 7   # a week

Exit 0 if today has at least one entry, 1 if it does not.
"""
import collections
import datetime
import io
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "research", "MASTER_TRACKER.md")


def main():
    days = 1
    if "--days" in sys.argv:
        days = int(sys.argv[sys.argv.index("--days") + 1])

    if not os.path.exists(SRC):
        print("MASTER_TRACKER.md NOT FOUND at %s" % SRC)
        return 1

    text = io.open(SRC, encoding="utf-8").read()
    dates = re.findall(r"\n- (20\d\d-\d\d-\d\d)", text)
    if not dates:
        print("no dated entries found")
        return 1

    counts = collections.Counter(dates)
    newest = max(counts)
    today = datetime.date.today().isoformat()

    print("file    : research/MASTER_TRACKER.md  %s bytes"
          % format(len(text), ","))
    print("entries : %s across %d dates"
          % (format(len(dates), ","), len(counts)))
    print("newest  : %s" % newest)
    print()

    wanted = sorted(counts)[-days:]
    for d in wanted:
        print("  %s  %2d entr%s" % (d, counts[d],
                                    "y" if counts[d] == 1 else "ies"))

    print()
    if newest != today:
        stale = (datetime.date.fromisoformat(today)
                 - datetime.date.fromisoformat(newest)).days
        print("NOT LOGGED TODAY. Newest entry is %s, %d day(s) old."
              % (newest, stale))
        return 1

    n = counts[today]
    print("Logged today: %d entr%s." % (n, "y" if n == 1 else "ies"))
    if n < 3:
        print("Low for an active day. If more than %d exchanges happened, "
              "entries are missing." % n)
    return 0


if __name__ == "__main__":
    sys.exit(main())
