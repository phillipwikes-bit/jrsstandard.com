#!/usr/bin/env python3
"""Freeze a named, immutable snapshot of the detection manuscript.

WHY THIS EXISTS. Phillip's procedural rule of 2026-08-29, attached to the
master audit prompt: never overwrite the master manuscript during an audit.
Keep the original, the surgical revision, the post-audit revision and the
submission version as separate frozen versions, so there is a defensible
version history if questions arise later.

Git already records history, but git history is editable by anyone with a
force push and is not what a journal or an institution will ask to see. A
frozen version is a file plus a SHA-256 recorded in a manifest, checked on
every drift run. If a frozen file changes by a single byte, the check fails
and names the version.

    python3 scripts/freeze_manuscript_version.py --list
    python3 scripts/freeze_manuscript_version.py --freeze v1-preaudit \\
        --note "state audited by Audit 1"
    python3 scripts/freeze_manuscript_version.py --verify

A version name may be reused only with --refreeze, which is refused unless
the content is byte-identical to what is already frozen under that name. To
record a changed manuscript, freeze it under a NEW name. That is the whole
point: a frozen version never moves.
"""
import argparse
import datetime
import hashlib
import io
import json
import os
import shutil
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SOURCE = os.path.join(ROOT, "research",
                      "Detection_Article_Submission_FINAL5_2026-08-18.md")
STORE = os.path.join(ROOT, "research", "frozen_versions")
MANIFEST = os.path.join(STORE, "MANIFEST.json")

VALID_NAME = ("a version name is lowercase letters, digits and hyphens, "
              "2 to 60 characters, e.g. v1-preaudit")


def sha256(path):
    h = hashlib.sha256()
    with open(path, "rb") as fh:
        for chunk in iter(lambda: fh.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def load():
    if not os.path.exists(MANIFEST):
        return {"source": os.path.relpath(SOURCE, ROOT), "versions": []}
    return json.loads(io.open(MANIFEST, encoding="utf-8").read())


def save(man):
    if not os.path.isdir(STORE):
        os.makedirs(STORE)
    io.open(MANIFEST, "w", encoding="utf-8").write(
        json.dumps(man, indent=2, ensure_ascii=False) + "\n")


def valid_name(name):
    if not (2 <= len(name) <= 60):
        return False
    return all(c.islower() or c.isdigit() or c == "-" for c in name)


def cmd_list(man):
    if not man["versions"]:
        print("no frozen versions")
        return 0
    print("%-22s %-12s %-9s %s" % ("VERSION", "FROZEN", "WORDS", "SHA-256"))
    for v in man["versions"]:
        print("%-22s %-12s %-9d %s"
              % (v["name"], v["frozen"], v["words"], v["sha256"][:16]))
        if v.get("note"):
            print("%-22s %s" % ("", v["note"]))
    return 0


def cmd_verify(man):
    """Every frozen file must still hash to what the manifest recorded."""
    problems = []
    for v in man["versions"]:
        path = os.path.join(STORE, v["file"])
        if not os.path.exists(path):
            problems.append("%s: frozen file is missing (%s)"
                            % (v["name"], v["file"]))
            continue
        got = sha256(path)
        if got != v["sha256"]:
            problems.append("%s: content changed. manifest %s, file %s"
                            % (v["name"], v["sha256"][:16], got[:16]))
    if problems:
        for p in problems:
            print("FAIL  %s" % p)
        return 1
    print("OK  %d frozen version(s), every hash matches the manifest"
          % len(man["versions"]))
    return 0


def cmd_freeze(man, name, note, refreeze):
    if not valid_name(name):
        print("[REQUIRED_ENV_PARAM] %s" % VALID_NAME)
        return 2
    if not os.path.exists(SOURCE):
        print("[REQUIRED_ENV_PARAM] source manuscript not found at %s"
              % os.path.relpath(SOURCE, ROOT))
        return 2
    digest = sha256(SOURCE)
    existing = next((v for v in man["versions"] if v["name"] == name), None)
    if existing and not refreeze:
        print("FAIL  %s is already frozen. A frozen version never moves. "
              "Freeze the new state under a NEW name, or pass --refreeze if "
              "the content is byte-identical." % name)
        return 1
    if existing and refreeze:
        if existing["sha256"] != digest:
            print("FAIL  --refreeze refused. %s is frozen at %s and the "
                  "manuscript is now %s. Refreezing would rewrite history. "
                  "Use a new version name."
                  % (name, existing["sha256"][:16], digest[:16]))
            return 1
        print("OK  %s already frozen at this exact content, nothing to do"
              % name)
        return 0

    if not os.path.isdir(STORE):
        os.makedirs(STORE)
    fname = "%s__Detection_Article.md" % name
    shutil.copy2(SOURCE, os.path.join(STORE, fname))
    body = io.open(SOURCE, encoding="utf-8").read()
    man["versions"].append({
        "name": name,
        "file": fname,
        "frozen": datetime.date.today().isoformat(),
        "sha256": digest,
        "bytes": os.path.getsize(SOURCE),
        "words": len(body.split()),
        "lines": body.count("\n") + 1,
        "note": note or "",
    })
    save(man)
    print("FROZEN  %s" % name)
    print("  file    research/frozen_versions/%s" % fname)
    print("  sha256  %s" % digest)
    print("  words   %d" % len(body.split()))
    if note:
        print("  note    %s" % note)
    return 0


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--list", action="store_true")
    ap.add_argument("--verify", action="store_true")
    ap.add_argument("--freeze", metavar="NAME")
    ap.add_argument("--note", default="")
    ap.add_argument("--refreeze", action="store_true",
                    help="permit reuse of a name ONLY when the content is "
                         "byte-identical to what is already frozen")
    a = ap.parse_args()
    man = load()
    if a.freeze:
        return cmd_freeze(man, a.freeze, a.note, a.refreeze)
    if a.verify:
        return cmd_verify(man)
    return cmd_list(man)


if __name__ == "__main__":
    sys.exit(main())
