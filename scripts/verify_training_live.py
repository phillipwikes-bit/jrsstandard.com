#!/usr/bin/env python3
"""Assert the training is ungated ON PRODUCTION, not in the working tree.

WHY THIS IS SEPARATE FROM check_zero_drift.py::check_training_is_ungated.
That guard reads training.html on disk and answers "is the wall absent from
the source". This one fetches the page the public actually receives and answers
"is the wall absent from the thing being served". Those came apart before: a
deploy is a selective checkout onto main, so a correct working tree proves
nothing about what the edge returns until the edge is asked.

Checks the served HTML for:
  1. the by-invitation overlay element                      must be ABSENT
  2. the access-granting code table                         must be ABSENT
  3. the preview lock on modules 2 to 6                     must be ABSENT
  4. a write to the retired jrs-training-access key         must be ABSENT
  5. the channel-attribution block that replaced the gate   must be PRESENT
  6. the open-access strip copy                             must be PRESENT
  7. the registration overlay and its trigger               must be PRESENT
  8. the reviewer landing page's corrected promise          must be PRESENT

7 and 8 matter as much as 1 to 4. Removing the wall is only correct if the
certificate can still be claimed and if no other page is left promising that
registration unlocks something it no longer locks.

Usage: python3 scripts/verify_training_live.py [--base https://www.jrsstandard.com]
Exit 0 = production is serving the ungated training.
"""
import sys
import urllib.request

BASE = "https://www.jrsstandard.com"
for i, a in enumerate(sys.argv):
    if a == "--base" and i + 1 < len(sys.argv):
        BASE = sys.argv[i + 1].rstrip("/")

results = []


def check(name, ok, detail=""):
    results.append((name, ok, detail))
    return ok


def fetch(path):
    req = urllib.request.Request(BASE + path,
                                 headers={"User-Agent": "jrs-verify/1.0"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.status, r.read().decode("utf-8", "replace")


def main():
    try:
        status, training = fetch("/training.html")
    except Exception as e:
        check("training.html is served", False, "fetch failed: %r" % (e,))
        report()
        return 1
    check("training.html is served", status == 200,
          "HTTP %s, %d bytes" % (status, len(training)))

    # The wall and every part of its machinery.
    absent = [
        ("by-invitation overlay", 'id="gate-overlay"'),
        ("access-granting code table", "ACCESS_CODES"),
        ("module lock on 2 to 6", "_jrsPreview && idx"),
        ("retired jrs-training-access write", "setItem('jrs-training-access'"),
    ]
    for label, needle in absent:
        check("absent from production: " + label,
              needle not in training,
              "found in served HTML" if needle in training else "absent")

    # What replaced it, and what had to survive it.
    present = [
        ("channel attribution replaced the gate", "CHANNEL ATTRIBUTION"),
        ("open-access strip is served",
         "All six modules are open to read right now"),
        ("certificate registration still reachable", 'id="enroll-overlay"'),
        ("registration trigger still bound", "openEnroll()"),
    ]
    for label, needle in present:
        check("present on production: " + label,
              needle in training,
              "present" if needle in training else "MISSING from served HTML")

    # No other page may still promise that registration unlocks modules.
    try:
        rstatus, reviewer = fetch("/reviewer/")
    except Exception as e:
        check("reviewer landing is served", False, "fetch failed: %r" % (e,))
    else:
        check("reviewer landing is served", rstatus == 200,
              "HTTP %s, %d bytes" % (rstatus, len(reviewer)))
        stale = "Registration unlocks the remaining five"
        check("reviewer landing no longer promises an unlock",
              stale not in reviewer,
              "stale promise still served" if stale in reviewer else "corrected")
        fresh = "All six modules are open to read now"
        check("reviewer landing states open access",
              fresh in reviewer,
              "present" if fresh in reviewer else "MISSING")

    return report()


def report():
    width = max(len(n) for n, _, _ in results)
    failed = 0
    for name, ok, detail in results:
        if not ok:
            failed += 1
        print("%s  %-*s  %s" % ("PASS" if ok else "FAIL", width, name, detail))
    print("\n%d checks, %d failed  (base %s)" % (len(results), failed, BASE))
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
