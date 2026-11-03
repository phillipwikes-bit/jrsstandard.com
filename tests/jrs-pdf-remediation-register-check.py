#!/usr/bin/env python3
"""Fail-closed consistency check for the nine locked PDF remediation records.

This checks metadata and coverage, not PDF accessibility or human acceptance.
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "docs/JRS_Published_PDF_Identity_Manifest.json"
REGISTER = ROOT / "docs/JRS_Accessibility_PDF_Remediation_Acceptance_Register_2026-11-03.md"


def validate(manifest, register):
    assets = manifest["assets"]
    if len(assets) != 9:
        raise ValueError("expected exactly nine locked PDF originals")
    rows = re.findall(r"^\| PDF-(\d{2}) \| ([^|]+) \| ([^|]+) \| ([0-9a-f]{40}) \| ([^|]+) \| ([^|]+) \|$", register, re.M)
    if len(rows) != 9:
        raise ValueError("register must contain exactly nine well-formed PDF edition rows")
    ids = [int(row[0]) for row in rows]
    if ids != list(range(1, 10)):
        raise ValueError("PDF register IDs are not unique and sequential")
    if len({a["file"] for a in assets}) != 9 or len({a["blob_sha"] for a in assets}) != 9:
        raise ValueError("duplicate original file or Git blob identity")
    for original, row in zip(assets, rows):
        _, name, _, sha, edition_status, witness = row
        if name.strip() != original["file"] or sha != original["blob_sha"]:
            raise ValueError("register original identity differs from locked manifest: " + original["file"])
        if edition_status.strip() == "PASS" or witness.strip() == "PASS":
            raise ValueError("generic PASS is insufficient; require identified edition and witnessed evidence")
    if "NOT TESTED" not in register:
        raise ValueError("register must retain explicit untested-state vocabulary")
    return len(rows)


def self_test():
    sample = {
        "assets": [{"file": f"original-{i}.pdf", "blob_sha": f"{i:040x}"} for i in range(1, 10)]
    }
    rows = "\n".join(
        f"| PDF-{i:02d} | original-{i}.pdf | role | {i:040x} | NOT PREPARED | NOT TESTED |"
        for i in range(1, 10)
    )
    assert validate(sample, rows) == 9
    for corrupted in (
        rows.replace("original-1.pdf", "renamed.pdf", 1),
        rows.replace(f"{1:040x}", f"{99:040x}", 1),
        rows.replace("NOT PREPARED", "PASS", 1),
        rows.replace("NOT TESTED", "PASS", 1),
        rows.replace("PDF-09", "PDF-08", 1),
    ):
        try:
            validate(sample, corrupted)
        except ValueError:
            pass
        else:
            raise AssertionError("PDF register corruption was not detected")
    print("PASS: five negative register/identity regressions")


if __name__ == "__main__":
    self_test()
    count = validate(json.loads(MANIFEST.read_text(encoding="utf-8")), REGISTER.read_text(encoding="utf-8"))
    print(f"PASS: {count} locked PDF originals and register identities agree.")
    print("LIMIT: metadata consistency only; no accessible editions or screen-reader acceptance certified.")
