#!/usr/bin/env python3
"""Study 014 corpus builder (PROTOCOL.md, "Corpus"). Fixed query, fixed ordering, rule-based eligibility.

Writes corpus/public/S014-NN.txt and corpus/MANIFEST.json for the first 30 eligible decisions.
The next 30 eligible (the v0.9 private set) are written only to the directory given by --private-out,
which must be outside the public repository.
"""
import argparse, hashlib, json, os, re, subprocess, sys, time, urllib.parse
sys.path.insert(0, os.path.dirname(__file__))
from anchors import counts

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE = "https://www.eeoc.gov/federal-sector/appellate-decisions"
QUERY = '"report of investigation" affidavit'
PDF_RE = re.compile(r'href="(https://www\.eeoc\.gov/sites/default/files/decisions/(\d{4}_\d\d_\d\d)/[^"]+\.pdf)"')
ANY_RE = re.compile(r'href="(https://www\.eeoc\.gov/sites/default/files/(?:migrated_files/)?decisions/[^"]+)"')
HEADS = r"(CONTENTIONS ON APPEAL|STANDARD OF REVIEW|ANALYSIS AND FINDINGS|ANALYSIS|ISSUES? PRESENTED|LEGAL ANALYSIS)"


def curl(url, out=None):
    cmd = ["curl", "-sSL", "--max-time", "60", "-A", "Mozilla/5.0", url] + (["-o", out] if out else [])
    r = subprocess.run(cmd, capture_output=True, text=out is None)
    if r.returncode:
        raise RuntimeError(f"curl {r.returncode} {url}")
    return r.stdout


def search():
    hits, seen = [], set()
    for page in range(80):
        html = curl(BASE + "?" + urllib.parse.urlencode({"appellate_keywords": QUERY, "page": page}))
        anyres = tuple(ANY_RE.findall(html))
        if not anyres or anyres in seen:
            break
        seen.add(anyres)
        hits += PDF_RE.findall(html)
        time.sleep(0.4)
    uniq = {}
    for url, folder in hits:
        uniq.setdefault(url, folder)
    return sorted(uniq.items(), key=lambda kv: (kv[1], kv[0]), reverse=True), page


def background(t):
    m = re.search(r"\n\s*BACKGROUND\s*\n(.*?)\n\s*" + HEADS + r"\s*\n", t, re.S)
    if not m:
        return ""
    lines = []
    for ln in m.group(1).splitlines():
        s = ln.strip()
        if re.fullmatch(r"\d{1,3}\s+\d{9,10}|\d{9,10}|\d{1,3}", s):
            continue
        lines.append(s)
    text = re.sub(r"\s+", " ", " ".join(lines)).strip()
    text = re.sub(r"(?<=[a-z\)\.])\d{1,2}(?=\s)", "", text)
    text = re.sub(r"[^.]*randomly assigned a pseudonym[^.]*\.", "", text)
    text = re.sub(r"\b\d{9,10}\b|\b(Agency|Appeal|Request) No\. [\w-]+", "[number removed]", text)
    return text.strip()


def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--private-out", required=True); a = ap.parse_args()
    if os.path.abspath(a.private_out).startswith(os.path.abspath(os.path.join(ROOT, "..", ".."))):
        sys.exit("--private-out must be outside the repository")
    cache = os.path.join(a.private_out, "pdf"); os.makedirs(cache, exist_ok=True)
    os.makedirs(os.path.join(ROOT, "corpus", "public"), exist_ok=True)
    os.makedirs(os.path.join(a.private_out, "private"), exist_ok=True)
    cands, pages = search()
    chosen, examined = [], 0
    for url, folder in cands:
        if len(chosen) >= 60:
            break
        examined += 1
        name = urllib.parse.unquote(url.rsplit("/", 1)[1]).replace(" ", "_")
        pdf = os.path.join(cache, folder + "_" + name)
        if not os.path.exists(pdf):
            curl(url, pdf); time.sleep(0.3)
        txt = subprocess.run(["pdftotext", "-layout", pdf, "-"], capture_output=True, text=True).stdout
        if re.search(r"Request No\.|REQUEST FOR RECONSIDERATION", txt[:4000]):
            continue
        bg = background(txt)
        w = len(bg.split()); c = counts(bg)
        if 400 <= w <= 2500 and c["date"] >= 3 and c["attribution"] >= 3:
            chosen.append({"url": url, "posted": folder, "pdf_sha256": hashlib.sha256(open(pdf, "rb").read()).hexdigest(),
                           "text": bg, "words": w, "anchors": c})
    pub, prv = chosen[:30], chosen[30:60]
    man = {"built_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "query": QUERY, "result_pages_read": pages,
           "pdf_candidates": len(cands), "examined": examined, "public": [], "private_count": len(prv)}
    for i, c in enumerate(pub, 1):
        cid = f"S014-{i:02d}"
        open(os.path.join(ROOT, "corpus", "public", cid + ".txt"), "w").write(c["text"] + "\n")
        man["public"].append({"id": cid, "url": c["url"], "posted": c["posted"], "pdf_sha256": c["pdf_sha256"],
                              "text_sha256": hashlib.sha256(c["text"].encode()).hexdigest(), "words": c["words"], "anchors": c["anchors"]})
    for i, c in enumerate(prv, 1):
        open(os.path.join(a.private_out, "private", f"P014-{i:02d}.txt"), "w").write(c["text"] + "\n")
    json.dump(man, open(os.path.join(ROOT, "corpus", "MANIFEST.json"), "w"), indent=1)
    print(json.dumps({k: man[k] for k in ("pdf_candidates", "examined", "private_count", "result_pages_read")}), len(pub), "public")


if __name__ == "__main__":
    main()
