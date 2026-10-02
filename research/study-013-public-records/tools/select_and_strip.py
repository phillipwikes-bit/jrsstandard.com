#!/usr/bin/env python3
"""Study 013 step 3: select 15 GAP and 15 date-matched PASS, strip outcome text, write cases and key.

Selection follows SELECTION_RULE.md (amendments 1 to 4). Case order is shuffled with a
fixed seed so labels are not in sequence. Every removed sentence is logged.
"""
import datetime, hashlib, json, os, random, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
QUOTA = 15
MIN_BG = 250
SEED = 13
# Ruling verbs are matched in capitals only (the EEOC's ruling style), so witness
# testimony such as "S2 affirmed that ..." stays in the record text.
OUTCOME_CAPS = re.compile(r"\b(AFFIRM|VACATE|REMAND|REVERSE|MODIF(Y|IES))")
OUTCOME = re.compile(
    r"remand|vacat|supplemental investigation|\bwe find\b|\bwe conclude\b|Commission (finds|concludes)|"
    r"\bon appeal\b|\bthe instant appeal\b|\bthis appeal\b|filed (an|the instant|a timely) appeal|"
    r"inadequate|adequately developed|sanction|randomly assigned a pseudonym", re.I)


def background(t):
    m = re.search(r"\n\s*BACKGROUND\s*\n(.*?)\n\s*(CONTENTIONS ON APPEAL|STANDARD OF REVIEW|ANALYSIS AND FINDINGS|ANALYSIS|ISSUES? PRESENTED)\s*\n", t, re.S)
    return m.group(1) if m else ""


def clean(bg):
    lines = []
    for ln in bg.splitlines():
        s = ln.strip()
        if re.fullmatch(r"\d{1,3}\s+\d{9,10}|\d{9,10}|\d{1,3}", s):  # page header or footer numbers
            continue
        lines.append(s)
    text = re.sub(r"\s+", " ", " ".join(lines)).strip()
    text = re.sub(r"(?<=[a-z\)])\d{1,2}(?=\s)", "", text)  # footnote markers
    sents = re.split(r"(?<=[.!?])\s+(?=[A-Z\"“])", text)
    kept, removed = [], []
    for s in sents:
        (removed if (OUTCOME.search(s) or OUTCOME_CAPS.search(s)) else kept).append(s)
    out = " ".join(kept)
    out = re.sub(r"\b\d{9,10}\b|\b(Agency|Appeal|Request) No\. [\w-]+", "[number removed]", out)
    return out, removed


def date(folder):
    return datetime.date(*map(int, folder.split("_")))


def main():
    rows = json.load(open(os.path.join(ROOT, "raw", "classified.json")))
    ok = [r for r in rows if r.get("label") and r.get("background_words", 0) >= MIN_BG]
    gaps = sorted([r for r in ok if r["label"] == "GAP"], key=lambda r: (r["folder"], r["appeal"]), reverse=True)[:QUOTA]
    passes = [r for r in ok if r["label"] == "PASS"]
    chosen = []
    for g in gaps:
        best = min(passes, key=lambda p: (abs((date(p["folder"]) - date(g["folder"])).days), p["appeal"]))
        passes.remove(best)
        chosen += [g, best]
    random.Random(SEED).shuffle(chosen)
    os.makedirs(os.path.join(ROOT, "cases"), exist_ok=True)
    key, log = [], []
    for i, r in enumerate(chosen, 1):
        cid = f"S013-{i:02d}"
        t = open(os.path.join(ROOT, r["text_file"]), errors="replace").read()
        text, removed = clean(background(t))
        body = f"{cid}\n\nInvestigative record summary (background section of a published federal-sector EEO appellate decision; outcome text removed).\n\n{text}\n"
        open(os.path.join(ROOT, "cases", cid + ".txt"), "w").write(body)
        key.append({"case": cid, "label": r["label"], "edge": r["edge"], "appeal": r["appeal"], "posted": r["folder"],
                    "source_url": r["url"], "pdf_sha256": r["sha256"], "eeoc_evidence": r["evidence"],
                    "case_sha256": hashlib.sha256(body.encode()).hexdigest(), "words": len(text.split())})
        log.append({"case": cid, "removed_sentences": removed})
    json.dump({"built_utc": datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"), "seed": SEED, "key": key},
              open(os.path.join(ROOT, "KEY.json"), "w"), indent=1)
    json.dump(log, open(os.path.join(ROOT, "STRIP_LOG.json"), "w"), indent=1)
    from collections import Counter
    print(Counter(k["label"] for k in key), "edge:", sum(k["edge"] for k in key))
    print("posted years GAP:", Counter(k["posted"][:4] for k in key if k["label"] == "GAP"))
    print("posted years PASS:", Counter(k["posted"][:4] for k in key if k["label"] == "PASS"))
    print("words min/max:", min(k["words"] for k in key), max(k["words"] for k in key))


if __name__ == "__main__":
    main()
