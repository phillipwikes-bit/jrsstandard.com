#!/usr/bin/env python3
"""Study 014 confirmatory run (CONFIRMATORY_PROTOCOL.md).

  python3 tools/confirm014.py draft <private_dir> <out_dir>   174 drafts (P1, P2, P4 x Sonnet, Haiku x 29 texts); skips drafts already present
  python3 tools/confirm014.py score <private_dir> <out_dir>   prints only scores and counts, never text

Both directories must be outside the public repository. The prompts and the provider are imported unchanged from study014.py.
"""
import concurrent.futures as cf, glob, hashlib, json, os, subprocess, sys
sys.path.insert(0, os.path.dirname(__file__))
import study014 as S

REPO = S.REPO
SUITE = os.path.join(REPO, "research", "drr-suite-v0.9")
sys.path.insert(0, os.path.join(SUITE, "lib"))
import anchors_v12 as V
PROMPTS = ("P1", "P2", "P4")


def outside(p):
    if os.path.abspath(p).startswith(REPO): sys.exit("refusing: " + p + " is inside the public repository")


def texts(private_dir):
    ver = json.load(open(os.path.join(SUITE, "VERSION.json")))["private_set"]["text_sha256"]
    out = {}
    for f in sorted(glob.glob(os.path.join(private_dir, "P014-*.txt"))):
        t = open(f).read().strip()
        if hashlib.sha256(t.encode()).hexdigest() != ver.get(os.path.basename(f)): sys.exit("hash mismatch " + f)
        out[os.path.basename(f)[:-4]] = t
    if len(out) != len(ver): sys.exit(f"expected {len(ver)} texts, found {len(out)}")
    return out


def cmd_draft(private_dir, out_dir):
    outside(private_dir); outside(out_dir); os.makedirs(out_dir, exist_ok=True)
    jobs = [(cid, src, m, p) for cid, src in texts(private_dir).items() for m in (S.SONNET, S.HAIKU) for p in PROMPTS
            if not os.path.exists(os.path.join(out_dir, f"{cid}_{m}_{p}.txt"))]
    print(f"{len(jobs)} drafts to make")
    def fn(job):
        cid, src, m, p = job
        j, st = S.call(S.body(m, S.DRAFT_SYSTEM, f"{S.PROMPTS[p]}\n\n<record>\n{src}\n</record>", max_tokens=16000 if m != S.HAIKU else 4000))
        rec = {"case": cid, "model": m, "prompt": p, "status": st}
        if j:
            t = S.text_of(j); rec.update(stop=j.get("stop_reason"), words=len(t.split()))
            open(os.path.join(out_dir, f"{cid}_{m}_{p}.txt"), "w").write(t)
        return rec
    with cf.ThreadPoolExecutor(3) as ex:
        recs = list(ex.map(fn, jobs))
    with open(os.path.join(out_dir, "results.jsonl"), "a") as f:
        for r in recs: f.write(json.dumps(r) + "\n")
    print(json.dumps(S.STATE), {s: sum(1 for r in recs if r["status"] == s) for s in {r["status"][:20] for r in recs}})


def cmd_score(private_dir, out_dir):
    outside(private_dir); outside(out_dir)
    if subprocess.run([sys.executable, os.path.join(SUITE, "score.py"), "verify"], capture_output=True).returncode: sys.exit("suite modified; not a v0.9 score")
    src = texts(private_dir); out = {}
    for m in (S.SONNET, S.HAIKU):
        for p in PROMPTS:
            pooled, unsup, n, trunc, per = [], {"date": 0, "citation": 0, "quote": 0}, 0, 0, {}
            ret = {k: [] for k in ("date", "citation", "attribution", "quote")}
            for cid, s in src.items():
                f = os.path.join(out_dir, f"{cid}_{m}_{p}.txt")
                if not os.path.exists(f): continue
                d = open(f).read(); n += 1
                r = V.retention(s, d); fb = V.fabricated(s, d)
                for k in ret: ret[k].append(r[k])
                pooled += [x for x in r.values()]
                for k, v in fb.items(): unsup[k] += len(v)
                per[cid] = {k: len(v) for k, v in fb.items() if v}
            out[f"{m}|{p}"] = {"drafts": n, "median_retention": {k: S.med(v) for k, v in ret.items()}, "median_pooled": S.med(pooled),
                               "unsupported": unsup, "unsupported_total": sum(unsup.values()), "unsupported_by_text": {k: v for k, v in per.items() if v}}
    h = {}
    for m in (S.SONNET, S.HAIKU):
        g = lambda p: out[f"{m}|{p}"]
        h[m] = {"retention": g("P4")["median_pooled"] > g("P1")["median_pooled"] and g("P4")["median_pooled"] > g("P2")["median_pooled"],
                "unsupported": g("P4")["unsupported_total"] <= g("P1")["unsupported_total"]}
    out["H4c"] = {"by_drafter": h, "holds": all(v["retention"] and v["unsupported"] for v in h.values())}
    print(json.dumps(out, indent=1))


if __name__ == "__main__":
    c = sys.argv[1]
    if c == "draft":
        if not S.MOCK and not os.environ.get("ANTHROPIC_API_KEY"): sys.exit("BLOCKED: ANTHROPIC_API_KEY not set")
        cmd_draft(sys.argv[2], sys.argv[3])
    elif c == "score": cmd_score(sys.argv[2], sys.argv[3])
