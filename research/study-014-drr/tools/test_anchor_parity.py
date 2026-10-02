#!/usr/bin/env python3
"""Runs test_anchor_parity.mjs over the given files and compares every anchor set with the Python extractors.
Usage: python3 tools/test_anchor_parity.py <file> [<file> ...]   exit 0 only if every set matches."""
import json, os, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "..", "drr-suite-v0.9", "lib"))
import anchors_v10 as A, anchors_v12 as V
files = sys.argv[1:]
bad = 0
for i in range(0, len(files), 200):
    out = subprocess.run(["node", os.path.join(HERE, "test_anchor_parity.mjs")] + files[i:i + 200], capture_output=True, text=True, check=True).stdout
    for line in out.splitlines():
        j = json.loads(line); t = open(j["f"], encoding="utf8").read()
        py = {"date": sorted(A.dates(t)), "citation": sorted(V.citations(t)), "attribution": sorted(A.attributions(t)), "quote": sorted(V.quotes(t))}
        for k in py:
            if py[k] != j[k]:
                bad += 1
                print("MISMATCH", os.path.basename(j["f"]), k, "py-only", sorted(set(py[k]) - set(j[k]))[:3], "js-only", sorted(set(j[k]) - set(py[k]))[:3])
print(f"{len(files)} files, {bad} mismatched sets")
sys.exit(1 if bad else 0)
