#!/usr/bin/env python3
"""JRS DRR Test Suite v0.9 scorer. Deterministic; no model calls; no network.

  python3 score.py drafts <dir> [--set practice]   score a folder of drafts named <ID>.txt (for example S014-01.txt)
  python3 score.py cloze-items [--set practice]    print the cloze reconstruction items (answers withheld unless --with-answers)
  python3 score.py cloze-score <answers.json>      score reader answers: {"S014-01": ["answer 1", ...], ...}
  python3 score.py verify                          check every frozen file against VERSION.json

Measures (see README.md): anchor retention by type, pooled retention, unsupported additions (fabrication) and
cloze reconstruction accuracy. It does not measure accuracy, fairness, legal sufficiency or compliance.
"""
import hashlib, json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "lib"))
import anchors_v10 as V10
import anchors_v12 as V12
from cloze import cloze_items, cloze_correct

TYPES = ("date", "citation", "attribution", "quote")


def texts(setname):
    d = os.path.join(HERE, setname)
    if not os.path.isdir(d): sys.exit(f"set '{setname}' not present in this copy of the suite")
    return {f[:-4]: open(os.path.join(d, f)).read().strip() for f in sorted(os.listdir(d)) if f.endswith(".txt")}


def med(v):
    v = sorted(x for x in v if x is not None)
    if not v: return None
    n = len(v)
    return v[n // 2] if n % 2 else (v[n // 2 - 1] + v[n // 2]) / 2


def score_one(src, dr):
    r = V12.retention(src, dr)
    s, d = V12.extract(src), V12.extract(dr)
    kept = sum(len(s[k] & d[k]) for k in ("date", "citation", "attribution")) + (round(r["quote"] * len(s["quote"])) if s["quote"] else 0)
    fab = V12.fabricated(src, dr)
    return {"retention": r, "pooled": med(list(r.values())), "kept_anchors": kept,
            "unsupported": {k: len(v) for k, v in fab.items()}, "unsupported_items": fab,
            "unsupported_v10_legacy": {k: len(v) for k, v in V10.fabricated(src, dr).items()},
            "length_ratio": round(len(dr.split()) / max(1, len(src.split())), 3)}


def cmd_drafts(folder, setname):
    src = texts(setname)
    per, missing = {}, []
    for cid, s in src.items():
        f = os.path.join(folder, cid + ".txt")
        if not os.path.exists(f): missing.append(cid); continue
        per[cid] = score_one(s, open(f).read())
    unsup = {k: sum(p["unsupported"][k] for p in per.values()) for k in ("date", "citation", "quote")}
    kept = sum(p["kept_anchors"] for p in per.values())
    summary = {
        "suite": json.load(open(os.path.join(HERE, "VERSION.json")))["suite_version"], "set": setname,
        "scored": len(per), "missing": missing, "complete": not missing,
        "median_retention": {k: med([p["retention"][k] for p in per.values()]) for k in TYPES},
        "median_pooled_retention": med([x for p in per.values() for x in p["retention"].values()]),
        "unsupported_total": unsup, "kept_anchors_total": kept,
        "unsupported_per_100_kept": round(100 * sum(unsup.values()) / kept, 2) if kept else None,
        "median_length_ratio": med([p["length_ratio"] for p in per.values()]),
    }
    print(json.dumps({"summary": summary, "per_text": per}, indent=1, default=sorted))


def cmd_cloze_items(setname, with_answers):
    out = {}
    for cid, s in texts(setname).items():
        out[cid] = [it if with_answers else {k: v for k, v in it.items() if k != "answer"} for it in cloze_items(s)]
    print(json.dumps(out, indent=1))


def cmd_cloze_score(path, setname="practice"):
    ans = json.load(open(path)); k = n = 0; per = {}
    for cid, s in texts(setname).items():
        items = cloze_items(s); a = ans.get(cid) or []
        c = sum(1 for it, x in zip(items, a) if cloze_correct(it, x))
        per[cid] = [c, len(items)]; k += c; n += len(items)
    print(json.dumps({"correct": k, "items": n, "rate": round(k / n, 3) if n else None, "per_text": per}, indent=1))


def cmd_verify():
    v = json.load(open(os.path.join(HERE, "VERSION.json"))); bad = []
    for rel, h in v["files"].items():
        p = os.path.join(HERE, rel)
        if not os.path.exists(p) or hashlib.sha256(open(p, "rb").read()).hexdigest() != h: bad.append(rel)
    print("OK, all frozen files match VERSION.json" if not bad else "MISMATCH: " + ", ".join(bad))
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    a = sys.argv[1:]
    setname = a[a.index("--set") + 1] if "--set" in a else "practice"
    if not a: sys.exit(__doc__)
    if a[0] == "drafts": cmd_drafts(a[1], setname)
    elif a[0] == "cloze-items": cmd_cloze_items(setname, "--with-answers" in a)
    elif a[0] == "cloze-score": cmd_cloze_score(a[1], setname)
    elif a[0] == "verify": cmd_verify()
    else: sys.exit(__doc__)
