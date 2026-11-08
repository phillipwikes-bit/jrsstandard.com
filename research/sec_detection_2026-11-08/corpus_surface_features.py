#!/usr/bin/env python3
"""Recompute descriptive class cues in the frozen 24-record verification packet.

No reviewer scores, reference labels or study observations are changed.
Run at repository root: python3 research/sec_detection_2026-11-08/corpus_surface_features.py

Data: research/AnswerKey_Verification_Packet.md, record text blocks R01–R24.
Intended labels: research/Verified_Key.md. Whitespace word and numerical-token
counts are descriptive only; no attempt at causal inference.
"""
import json
import re
from pathlib import Path
from statistics import mean

ROOT = Path(__file__).resolve().parents[2]
packet = (ROOT / "research/AnswerKey_Verification_Packet.md").read_text(encoding="utf-8")
key = (ROOT / "research/Verified_Key.md").read_text(encoding="utf-8")
grounded = set(re.findall(r"\| (R\d{2}) \| GROUNDED \|", key))
ungrounded = set(re.findall(r"\| (R\d{2}) \| UNGROUNDED \|", key))
assert len(grounded) == len(ungrounded) == 12, (grounded, ungrounded)
blocks = re.findall(r"\*\*(R\d{2}) \(([^)]*)\)\.\*\* ([\s\S]*?)(?=\n\n\*\*R\d{2}|\n\n---|\s*$)", packet)
assert len(blocks) == 24, len(blocks)
rows = []
for rid, domain, body in blocks:
    body = body.strip()
    assert rid in grounded or rid in ungrounded, rid
    rows.append({
        "record": rid,
        "class": "grounded" if rid in grounded else "ungrounded",
        "word_count": len(body.split()),
        "numeric_token_count": len(re.findall(r"\b\d+(?:[.,]\d+)*\b", body)),
    })
assert len(set(x["record"] for x in rows)) == 24
summary={}
for label in ("grounded","ungrounded"):
    group=[x for x in rows if x["class"] == label]
    summary[label]={
        "records":len(group),
        "mean_words":round(mean(x["word_count"] for x in group),2),
        "mean_numeric_tokens":round(mean(x["numeric_token_count"] for x in group),2),
        "records_with_numeric_tokens":sum(x["numeric_token_count"]>0 for x in group),
    }
result={
    "source":"research/AnswerKey_Verification_Packet.md",
    "reference":"research/Verified_Key.md",
    "metric_definitions":{"word_count":"len(text.split())","numeric_token_count":"regex \\b\\d+(?:[.,]\\d+)*\\b"},
    "summary":summary,
    "per_record":rows,
    "limitations":"Designed classes and different surface cues. Descriptive only; no independent reference adjudication.",
}
print(json.dumps(result, indent=2))
