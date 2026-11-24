#!/usr/bin/env python3
"""SEC-0111-2026, round 2: surface-cue and order checks requested by Referee 2.

Reads the frozen 24-record packet and reference labels, and the item-level
numerators behind Figure 1. Changes no study data.

Usage:
  python3 surface_cue_and_order_check.py <AnswerKey_Verification_Packet.md> <Verified_Key.md> <Figure_1_Item_Level_Source.csv>
"""
import csv
import re
import sys
from statistics import mean


def ranks(v):
    order = sorted(range(len(v)), key=lambda i: v[i])
    r = [0.0] * len(v)
    i = 0
    while i < len(v):
        j = i
        while j + 1 < len(v) and v[order[j + 1]] == v[order[i]]:
            j += 1
        for k in range(i, j + 1):
            r[order[k]] = (i + j) / 2 + 1
        i = j + 1
    return r


def spearman(a, b):
    ra, rb = ranks(a), ranks(b)
    ma, mb = mean(ra), mean(rb)
    num = sum((x - ma) * (y - mb) for x, y in zip(ra, rb))
    den = (sum((x - ma) ** 2 for x in ra) * sum((y - mb) ** 2 for y in rb)) ** 0.5
    return num / den if den else float("nan")


packet, key, items = sys.argv[1:4]
labels = dict(re.findall(r"(R\d{2}) \| (GROUNDED|UNGROUNDED)", open(key, encoding="utf-8").read()))
blocks = re.findall(r"\*\*(R\d{2}) \(([^)]*)\)\.\*\* ([\s\S]*?)(?=\n\n\*\*R\d{2}|\n\n---|\s*$)",
                    open(packet, encoding="utf-8").read())
assert len(labels) == 24 and len(blocks) == 24
feat = {rid: (len(body.split()), len(re.findall(r"\b\d+(?:[.,]\d+)*\b", body))) for rid, _, body in blocks}
matched = {r["record_id"]: int(r["matched_reference_n"]) for r in csv.DictReader(open(items, encoding="utf-8"))}

ids = sorted(labels)
supported = [r for r in ids if labels[r] == "GROUNDED"]
unsupported = [r for r in ids if labels[r] == "UNGROUNDED"]
print("supported records with numerical tokens:", sum(feat[r][1] > 0 for r in supported), "of", len(supported))
print("unsupported records with numerical tokens:", sum(feat[r][1] > 0 for r in unsupported), "of", len(unsupported))
num_rule = sum((feat[r][1] > 0) == (labels[r] == "GROUNDED") for r in ids)
print(f"rule 'contains a number = supported': {num_rule}/24 ({num_rule / 24:.1%})")
best = max((sum((feat[r][0] >= t) == (labels[r] == "GROUNDED") for r in ids), t) for t in range(10, 150))
print(f"best word-count rule (>= {best[1]} words = supported): {best[0]}/24 ({best[0] / 24:.1%})")
for name, group in (("supported", supported), ("unsupported", unsupported)):
    acc = [matched[r] for r in group]
    print(f"{name}: item agreement {sum(acc) / (16 * len(group)):.1%}; "
          f"rho(words, agreement) = {spearman([feat[r][0] for r in group], acc):.2f}; "
          f"rho(numbers, agreement) = {spearman([feat[r][1] for r in group], acc):.2f}")
no_num = [r for r in supported if feat[r][1] == 0]
for r in no_num:
    print(f"supported record without numbers: {r}, matched by {matched[r]} of 16 reviewers")
pos = [int(r[1:]) for r in ids]
print(f"order: rho(position, agreement) = {spearman(pos, [matched[r] for r in ids]):.2f}; "
      f"R01-R12 {sum(matched[r] for r in ids[:12]) / 192:.1%}, R13-R24 {sum(matched[r] for r in ids[12:]) / 192:.1%}")
