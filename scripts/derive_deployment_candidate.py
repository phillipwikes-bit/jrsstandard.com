#!/usr/bin/env python3
"""Derive the deployment candidate from live state. Never read it from a record.

WHY THIS EXISTS. The deployment candidate has been named as a literal SHA three
times and been wrong three times. `23fe3e1` was the tip when it was written and
the branch moved past it. `42e3bff` replaced it and was wrong on its own day for
a different reason: it was the tip, and it changed nothing that deploys, so it
could not be a candidate at all. A remembered SHA is stale the moment the branch
advances, and the failure is silent because the record still reads plausibly.

WHAT A CANDIDATE IS. The newest commit between the production baseline and HEAD
that changes at least one file `.vercelignore` does not exclude. Commits after it
may exist; if none of them touches a deployable path, deploying the tip and
deploying the candidate publish byte-identical content, and this script says so.

    python3 scripts/derive_deployment_candidate.py              # baseline 0d94ce6
    python3 scripts/derive_deployment_candidate.py <baseline>

The ignore rules are PARSED FROM THE FILE, not copied here. A rule added to
`.vercelignore` takes effect in this derivation on the same commit that adds it,
which is the whole point: a second hard-coded list would drift from the first.
"""
import signal
import subprocess
import sys

# Piping this into `head` is the normal way to read it, and without this the
# reader gets a BrokenPipeError traceback instead of the six lines they asked
# for. Restoring the default SIGPIPE behaviour makes the tool behave like
# every other command they pipe.
try:
    signal.signal(signal.SIGPIPE, signal.SIG_DFL)
except (AttributeError, ValueError):
    pass

ROOT = subprocess.run(["git", "rev-parse", "--show-toplevel"],
                      capture_output=True, text=True).stdout.strip()


def sh(*args):
    return subprocess.run(args, capture_output=True, text=True, cwd=ROOT).stdout


def load_rules():
    rules = []
    with open(ROOT + "/.vercelignore", encoding="utf-8") as fh:
        for line in fh:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            neg = line.startswith("!")
            rules.append((neg, line[1:] if neg else line))
    return rules


def excluded(path, rules):
    """Last matching rule wins, which is how gitignore-style files are read."""
    verdict = False
    for neg, pat in rules:
        if pat.endswith("/"):
            d = pat.rstrip("/")
            hit = path == d or path.startswith(d + "/")
        elif pat.startswith("*."):
            hit = path.endswith(pat[1:])
        else:
            hit = (path == pat
                   or path.startswith(pat.rstrip("/") + "/")
                   or path.rsplit("/", 1)[-1] == pat)
        if hit:
            verdict = not neg
    return verdict


def main():
    baseline = sys.argv[1] if len(sys.argv) > 1 else "0d94ce6"
    rules = load_rules()
    head = sh("git", "rev-parse", "HEAD").strip()
    commits = sh("git", "rev-list", "--reverse", "%s..HEAD" % baseline).split()

    candidate, rows = None, []
    for c in commits:
        changed = [f for f in sh("git", "diff-tree", "--no-commit-id",
                                 "--name-only", "-r", c).split("\n") if f]
        dep = [f for f in changed if not excluded(f, rules)]
        rows.append((c, len(changed), dep, sh("git", "log", "-1", "--format=%s", c).strip()))
        if dep:
            candidate = c

    delta = [f for f in sh("git", "diff", "--name-only",
                           "%s..%s" % (baseline, head)).split("\n") if f]
    dep_all = sorted(f for f in delta if not excluded(f, rules))

    print("PRODUCTION BASELINE      %s" % baseline)
    print("CURRENT HEAD             %s" % head[:7])
    print("COMMITS SINCE BASELINE   %d" % len(commits))
    print("CANDIDATE                %s" % (candidate[:7] if candidate else "NONE"))
    print("FULL DELTA               %s" % sh("git", "diff", "--shortstat",
                                             "%s..%s" % (baseline, head)).strip())
    print("DEPLOYABLE / EXCLUDED    %d / %d" % (len(dep_all), len(delta) - len(dep_all)))
    print()

    if candidate and candidate != head:
        after = [f for f in sh("git", "diff", "--name-only",
                               "%s..%s" % (candidate, head)).split("\n") if f]
        leaked = [f for f in after if not excluded(f, rules)]
        print("COMMITS AFTER THE CANDIDATE   %d"
              % len(sh("git", "rev-list", "%s..%s" % (candidate, head)).split()))
        print("DEPLOYABLE PATHS AMONG THEM   %d %s"
              % (len(leaked), leaked if leaked else "(none)"))
        print("SO DEPLOYING THE TIP AND DEPLOYING THE CANDIDATE ARE %s"
              % ("NOT equivalent" if leaked else "byte-identical"))
        print()

    print("DEPLOYABLE FILES IN THE DELTA")
    for f in dep_all:
        print("  %s" % f)
    return 0


if __name__ == "__main__":
    sys.exit(main())
