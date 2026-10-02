#!/usr/bin/env python3
"""Sealed private test set for the DRR Test Suite (blocker B-023). Owner approval 2026-10-03.

  python3 tools/build_sealed_set.py --out <dir outside the repository> [--n 30]

Candidate pool: the Study 014 search rule (PROTOCOL.md), which is public. The DRAW is not reproducible from public
information: candidates are ordered by a secret random seed, and the first n eligible decisions not used before are
taken. Eligibility is the Study 014 rule. "Used before" is checked by text hash against the practice set and the
held-out set, and duplicates inside the new set are dropped by text hash (the defect found in both earlier sets).

Writes <out>/texts/SEALED-NN.txt, <out>/SEALED_MANIFEST.json (seed, URLs, hashes; PRIVATE) and
<out>/SEALED_PUBLIC_RECORD.json (counts, text hashes, SHA-256 of the seed; safe to commit). Nothing is written in
the repository.
"""
import argparse, hashlib, json, os, random, secrets, subprocess, sys, time, urllib.parse
sys.path.insert(0, os.path.dirname(__file__))
import build_corpus as B
from anchors import counts

ROOT = B.ROOT
REPO = os.path.abspath(os.path.join(ROOT, "..", ".."))


def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--out", required=True); ap.add_argument("--n", type=int, default=30); a = ap.parse_args()
    if os.path.abspath(a.out).startswith(REPO): sys.exit("--out must be outside the public repository")
    os.makedirs(os.path.join(a.out, "texts"), exist_ok=True); cache = os.path.join(a.out, "pdf"); os.makedirs(cache, exist_ok=True)
    used = {c["text_sha256"] for c in json.load(open(os.path.join(ROOT, "corpus", "MANIFEST.json")))["public"]}
    used |= set(json.load(open(os.path.join(REPO, "research", "drr-suite-v0.9", "VERSION.json")))["private_set"]["text_sha256"].values())
    seed = secrets.token_hex(16)
    cands, pages = B.search()
    order = list(cands); random.Random(seed).shuffle(order)
    chosen, seen, examined, skipped_used, skipped_dup = [], set(), 0, 0, 0
    for url, folder in order:
        if len(chosen) >= a.n: break
        examined += 1
        name = urllib.parse.unquote(url.rsplit("/", 1)[1]).replace(" ", "_")
        pdf = os.path.join(cache, folder + "_" + name)
        try:
            if not os.path.exists(pdf): B.curl(url, pdf); time.sleep(0.3)
        except Exception:
            continue
        txt = subprocess.run(["pdftotext", "-layout", pdf, "-"], capture_output=True, text=True).stdout
        if B.re.search(r"Request No\.|REQUEST FOR RECONSIDERATION", txt[:4000]): continue
        bg = B.background(txt); w = len(bg.split()); c = counts(bg)
        if not (400 <= w <= 2500 and c["date"] >= 3 and c["attribution"] >= 3): continue
        h = hashlib.sha256(bg.encode()).hexdigest()
        if h in used: skipped_used += 1; continue
        if h in seen: skipped_dup += 1; continue
        seen.add(h)
        chosen.append({"url": url, "posted": folder, "text": bg, "text_sha256": h, "words": w, "anchors": c,
                       "pdf_sha256": hashlib.sha256(open(pdf, "rb").read()).hexdigest()})
    built = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    for i, c in enumerate(chosen, 1):
        open(os.path.join(a.out, "texts", f"SEALED-{i:02d}.txt"), "w").write(c["text"] + "\n")
    common = {"built_utc": built, "query": B.QUERY, "result_pages_read": pages, "pdf_candidates": len(cands),
              "examined": examined, "skipped_previously_used": skipped_used, "skipped_duplicates": skipped_dup,
              "count": len(chosen), "seed_sha256": hashlib.sha256(seed.encode()).hexdigest()}
    json.dump({**common, "seed": seed, "items": [{k: v for k, v in c.items() if k != "text"} | {"id": f"SEALED-{i:02d}"}
               for i, c in enumerate(chosen, 1)]}, open(os.path.join(a.out, "SEALED_MANIFEST.json"), "w"), indent=1)
    json.dump({**common, "text_sha256": {f"SEALED-{i:02d}": c["text_sha256"] for i, c in enumerate(chosen, 1)},
               "note": "Texts, URLs and the seed are held privately by the owner. This record lets a later release prove which "
                       "texts were sealed (text hashes) and that the draw was fixed in advance (seed hash), without revealing either."},
              open(os.path.join(a.out, "SEALED_PUBLIC_RECORD.json"), "w"), indent=1)
    print(json.dumps(common))


if __name__ == "__main__":
    main()
