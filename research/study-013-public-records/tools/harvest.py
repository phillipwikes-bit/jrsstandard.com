#!/usr/bin/env python3
"""Study 013: collect candidate EEOC appellate decisions under SELECTION_RULE.md.

Step 1 of 2. Runs the fixed queries, keeps 2026-posted PDFs, downloads each,
extracts text with pdftotext and writes raw/candidates.json. No classification here.
"""
import hashlib, json, os, re, subprocess, sys, time, urllib.parse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, "raw")
BASE = "https://www.eeoc.gov/federal-sector/appellate-decisions"
QUERIES = {
    "Q1": '"supplemental investigation" inadequate',
    "Q2": '"final agency decision" AFFIRM "investigative record"',
    # Amendment 1 (SELECTION_RULE.md), added before any classification
    "Q3": '"did not request a hearing" AFFIRM',
    "Q4": '"requested a final agency decision" AFFIRMS',
    "Q5": '"supplemental investigation" "adequately developed"',
    # Amendment 2
    "Q6": 'VACATES "supplemental investigation" "final decision"',
}
PDF_RE = re.compile(r'href="(https://www\.eeoc\.gov/sites/default/files/decisions/(\d{4}_\d\d_\d\d)/[^"]+\.pdf)"')
ANY_RE = re.compile(r'href="(https://www\.eeoc\.gov/sites/default/files/(?:migrated_files/)?decisions/[^"]+)"')
MAX_PAGES = 60


def curl(url, out=None):
    cmd = ["curl", "-sSL", "--max-time", "60", "-A", "Mozilla/5.0", url]
    if out:
        cmd += ["-o", out]
    r = subprocess.run(cmd, capture_output=True, text=out is None)
    if r.returncode != 0:
        raise RuntimeError(f"curl failed {r.returncode}: {url}")
    return r.stdout


def search(query):
    found, seen_pages = [], set()
    for page in range(MAX_PAGES):
        url = BASE + "?" + urllib.parse.urlencode({"appellate_keywords": query, "page": page})
        html = curl(url)
        hits = PDF_RE.findall(html)
        anyres = tuple(ANY_RE.findall(html))
        if not anyres or anyres in seen_pages:
            break
        seen_pages.add(anyres)
        found += hits
        time.sleep(0.5)
    return found, page


def appeal_no(url):
    m = re.search(r"/(\d{9,10})[^/]*\.pdf$", urllib.parse.unquote(url))
    return m.group(1) if m else "0"


def main():
    os.makedirs(RAW, exist_ok=True)
    pool = {}
    log = {}
    for qid, q in QUERIES.items():
        hits, pages = search(q)
        log[qid] = {"query": q, "pages_read": pages, "pdf_hits_2026": len(hits)}
        for url, folder in hits:
            pool.setdefault(url, {"url": url, "folder": folder, "queries": []})
            if qid not in pool[url]["queries"]:
                pool[url]["queries"].append(qid)
    cands = sorted(pool.values(), key=lambda c: (c["folder"], appeal_no(c["url"])), reverse=True)  # Amendment 3: newest first
    # Amendment 2: de-duplicate by appeal number, keeping the earliest posting
    seen, dedup = set(), []
    for c in cands:
        a = appeal_no(c["url"])
        if a in seen:
            continue
        seen.add(a)
        dedup.append(c)
    cands = dedup
    for c in cands:
        c["appeal"] = appeal_no(c["url"])
        pdf = os.path.join(RAW, f'{c["folder"]}_{c["appeal"]}.pdf')
        if not os.path.exists(pdf):
            curl(c["url"], pdf)
            time.sleep(0.3)
        c["sha256"] = hashlib.sha256(open(pdf, "rb").read()).hexdigest()
        txt = pdf[:-4] + ".txt"
        subprocess.run(["pdftotext", "-layout", pdf, txt], check=False, capture_output=True)
        c["text_file"] = os.path.relpath(txt, ROOT)
        c["words"] = len(open(txt, errors="replace").read().split()) if os.path.exists(txt) else 0
    out = {"run_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "queries": log,
           "candidates": cands}
    json.dump(out, open(os.path.join(RAW, "candidates.json"), "w"), indent=1)
    print(json.dumps(log, indent=1), len(cands), "candidates")


if __name__ == "__main__":
    sys.exit(main())
