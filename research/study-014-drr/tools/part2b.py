#!/usr/bin/env python3
"""Study 014 Part 2b (PART2B_PROTOCOL.md): Engine 0.1.0 against Engine 0.3.0 on the 29 held-out texts.

  python3 tools/part2b.py run <private_dir> <confirm_dir> <out_dir>    522 Haiku calls; skips calls already saved
  python3 tools/part2b.py score <private_dir> <confirm_dir> <out_dir>  prints counts only, never record text

Both arms send exactly what the production handler sends to the model (system prompt read from the Engine source,
the same user message, the same model), as Part 2's C0 arm did. Directories must be outside the public repository.
"""
import concurrent.futures as cf, glob, hashlib, json, os, re, subprocess, sys
sys.path.insert(0, os.path.dirname(__file__))
import study014 as S
REPO = S.REPO
sys.path.insert(0, os.path.join(REPO, "research", "drr-suite-v0.9", "lib"))
import anchors_v12 as V

E1_COMMIT, E1_SHA = "35c33f6", "97176e22"
MISSING_KEYS = ["dates", "record_citations", "attributions", "decision_maker", "criteria", "responses_considered"]
TYPE_KEY = {"citations": "record_citations", "attributions": "attributions", "dates": "dates"}
ANCHOR = {"citations": "citation", "attributions": "attribution", "dates": "date"}
# Which named items count as naming a type. The condition mapping is Part 2's (PROTOCOL.md): it can name
# dates and sources but never record_citations. The 0.3.0 missing list names each type by its own key.
HIT_KEYS = {"cond_map": {"dates": {"dates"}, "citations": {"record_citations"}, "attributions": {"attributions", "sources"}},
            "missing": {"dates": {"dates"}, "citations": {"record_citations"}, "attributions": {"attributions"}}}


def outside(p):
    if os.path.abspath(p).startswith(REPO): sys.exit("refusing: " + p + " is inside the public repository")


def engine(src):
    prompt = re.search(r"const SYSTEM_PROMPT = `([\s\S]*?)`;", src).group(1)
    maxtok = int(re.search(r"max_tokens: (\d+),", src).group(1))
    return prompt, maxtok


def arms():
    e1 = subprocess.run(["git", "-C", REPO, "show", f"{E1_COMMIT}:api/review-engine.js"], capture_output=True, text=True, check=True).stdout
    e3 = open(os.path.join(REPO, "api", "review-engine.js")).read()
    if not hashlib.sha256(e1.encode()).hexdigest().startswith(E1_SHA): sys.exit("E1 source is not the production Engine 0.1.0")
    h3 = hashlib.sha256(e3.encode()).hexdigest()
    fixed = re.search(r"Engine 0\.3\.0 source SHA-256: `([0-9a-f]{64})`", open(os.path.join(S.ROOT, "PART2B_PROTOCOL.md")).read())
    if not fixed or fixed.group(1) != h3: sys.exit("api/review-engine.js differs from the source fixed in PART2B_PROTOCOL.md")
    return {"E1": engine(e1), "E3": engine(e3)}


def delete_citations(text):
    """Part 2b citation deletion (PART2B_PROTOCOL.md). Removes exactly the spans the v1.2 extractor reads as record
    citations (with a "See", "Supplement to" or "at" lead-in), repeating until none is left, then removes parentheses
    left empty. Nothing else in the text is touched, so dates and attributions inside a citation sentence survive.
    Part 2's rule used the v1.0 patterns and left citations behind."""
    lead = r"(?:(?:[Ss]ee|Supplement to|[Ss]ee also)\s+)?"
    t, prev = text, None
    while prev != t:
        prev = t
        # "Id. S1 stated" is read by v1.2 as a citation to page "S1"; only the "Id." is a citation there.
        spans = [(m.start(), m.start() + 3 if m.group(1) == "Id." and re.fullmatch(r"[A-Z]\d+", m.group(2)) else m.end())
                 for m in V.RE_CIT12.finditer(t)]
        for a, b in reversed(spans):
            pre = re.search(lead + r"$", t[:a])
            a = pre.start() if pre and pre.group(0) else a
            t = t[:a] + t[b:]
    t = re.sub(r"\(\s*[,;.]*\s*\)", "", t)
    t = re.sub(r"\s+([.,;)])", r"\1", re.sub(r"[ \t]{2,}", " ", t))
    return re.sub(r"(?<=[.;])\s*[.;]+", "", t).strip()


def items(private_dir, confirm_dir):
    ver = json.load(open(os.path.join(REPO, "research", "drr-suite-v0.9", "VERSION.json")))["private_set"]["text_sha256"]
    src = {}
    for f in sorted(glob.glob(os.path.join(private_dir, "P014-*.txt"))):
        t = open(f).read().strip()
        if hashlib.sha256(t.encode()).hexdigest() != ver[os.path.basename(f)]: sys.exit("hash mismatch " + f)
        src[os.path.basename(f)[:-4]] = t
    # The held-out set holds 5 duplicate pairs (identical text under two EEOC links). Each text is used once:
    # the first ID of a pair is kept and the second dropped.
    seen, order = set(), []
    for c in sorted(src):
        h = hashlib.sha256(src[c].encode()).hexdigest()
        if h not in seen: seen.add(h); order.append(c)
    src = {c: src[c] for c in order}
    cit = [c for c in order if V.citations(src[c])]
    rest = [c for c in order if c not in cit]
    half = (len(rest) + 1) // 2
    kinds = {**{c: "citations" for c in cit}, **{c: "attributions" for c in rest[:half]}, **{c: "dates" for c in rest[half:]}}
    out = []
    for c in order:
        out.append({"item": f"{c}-control", "case": c, "kind": "control", "text": src[c]})
        out.append({"item": f"{c}-del-{kinds[c]}", "case": c, "kind": "deletion", "deleted": kinds[c], "text": delete_citations(src[c]) if kinds[c] == "citations" else S.delete(src[c], kinds[c])})
        out.append({"item": f"{c}-draft", "case": c, "kind": "draft", "text": open(os.path.join(confirm_dir, f"{c}_{S.SONNET}_P1.txt")).read()})
    return src, out


def parse(arm, txt):
    p = json.loads(re.search(r"\{[\s\S]*\}", txt).group(0))
    conds = p.get("conditions") or {}
    for k in ("basis_identification", "reasoning_traceability", "cold_reviewer_clarity", "accountability_support", "temporal_reconstructability"):
        if (conds.get(k) or {}).get("status") not in ("pass", "review", "gap"): raise ValueError("invalid status")
    miss = [k for k in MISSING_KEYS if isinstance(p.get("missing"), list) and k in p["missing"]] if arm == "E3" else []
    return {"cond_map": S.c0_missing(conds), "missing": miss}


def cmd_run(private_dir, confirm_dir, out_dir):
    outside(private_dir); outside(confirm_dir); outside(out_dir); os.makedirs(out_dir, exist_ok=True)
    A = arms(); _, its = items(private_dir, confirm_dir)
    jobs = [(it, a, r) for it in its for a in ("E1", "E3") for r in (1, 2, 3) if not os.path.exists(os.path.join(out_dir, f"{it['item']}_{a}_r{r}.txt"))]
    print(f"{len(jobs)} calls to send")
    def fn(job):
        it, a, r = job
        prompt, maxtok = A[a]
        j, st = S.call({"model": S.HAIKU, "max_tokens": maxtok, "system": prompt,
                        "messages": [{"role": "user", "content": "Examine this record against the five JRS conditions:\n\n" + it["text"]}]})
        rec = {"item": it["item"], "arm": a, "run": r, "status": st}
        if j:
            t = S.text_of(j); rec["stop"] = j.get("stop_reason")
            open(os.path.join(out_dir, f"{it['item']}_{a}_r{r}.txt"), "w").write(t)
        return rec
    with cf.ThreadPoolExecutor(4) as ex:
        recs = list(ex.map(fn, jobs))
    with open(os.path.join(out_dir, "results.jsonl"), "a") as f:
        for r in recs: f.write(json.dumps(r) + "\n")
    print(json.dumps(S.STATE))


def cmd_score(private_dir, confirm_dir, out_dir):
    outside(private_dir); outside(confirm_dir); outside(out_dir)
    src, its = items(private_dir, confirm_dir)
    res = {"residual_after_deletion": {}, "parse_errors": {"E1": 0, "E3": 0}, "missing_runs": {"E1": 0, "E3": 0}}
    for it in its:
        if it["kind"] == "deletion":
            res["residual_after_deletion"][it["item"]] = len(V.extract(it["text"])[ANCHOR[it["deleted"]]])
    named = {}
    for it in its:
        for a in ("E1", "E3"):
            got = []
            for r in (1, 2, 3):
                f = os.path.join(out_dir, f"{it['item']}_{a}_r{r}.txt")
                if not os.path.exists(f): res["missing_runs"][a] += 1; continue
                try: got.append(parse(a, open(f).read()))
                except Exception: res["parse_errors"][a] += 1
            for layer in ("cond_map", "missing"):
                cnt = {}
                for g in got:
                    for k in g[layer]: cnt[k] = cnt.get(k, 0) + 1
                need = 2 if len(got) >= 2 else 1
                named[(it["item"], a, layer)] = {k for k, n in cnt.items() if n >= need} if got else None
    tables = {}
    for a, layer in (("E1", "cond_map"), ("E3", "missing"), ("E3", "cond_map")):
        t = {}
        for typ in TYPE_KEY:
            keys = HIT_KEYS[layer][typ]
            dele = [named[(it["item"], a, layer)] for it in its if it["kind"] == "deletion" and it["deleted"] == typ]
            ctrl_all = [named[(it["item"], a, layer)] for it in its if it["kind"] == "control"]
            ctrl_has = [named[(it["item"], a, layer)] for it in its if it["kind"] == "control" and V.extract(src[it["case"]])[ANCHOR[typ]]]
            hit = lambda xs: [sum(1 for x in xs if x is not None and x & keys), sum(1 for x in xs if x is not None)]
            t[typ] = {"deletion_hits": hit(dele), "false_flags_all_controls": hit(ctrl_all), "false_flags_controls_with_type": hit(ctrl_has)}
        drafts = []
        for it in its:
            if it["kind"] != "draft": continue
            r = V.retention(src[it["case"]], it["text"])
            lost = [k for k in TYPE_KEY if r[ANCHOR[k]] is not None and r[ANCHOR[k]] < 0.5]
            if lost:
                want = set().union(*(HIT_KEYS[layer][k] for k in lost))
                drafts.append(bool((named[(it["item"], a, layer)] or set()) & want))
        t["draft_hits"] = [sum(drafts), len(drafts)]
        tables[f"{a}|{layer}"] = t
    res["tables"] = tables
    h = {}
    for typ in ("citations", "attributions", "dates"):
        e = tables["E3|missing"][typ]
        d, n = e["deletion_hits"]; f, m = e["false_flags_controls_with_type"]
        h[typ] = {"hit_rate": round(d / n, 3) if n else None, "false_flag_rate": round(f / m, 3) if m else None,
                  "meets": bool(n and m and d / n >= 0.7 and f / m <= 0.2)}
    res["H6"] = {"by_type": h, "citations_and_attributions_met": h["citations"]["meets"] and h["attributions"]["meets"], "dates_no_regression_met": h["dates"]["meets"]}
    print(json.dumps(res, indent=1))


if __name__ == "__main__":
    c = sys.argv[1]
    if c == "run":
        if not S.MOCK and not os.environ.get("ANTHROPIC_API_KEY"): sys.exit("BLOCKED: ANTHROPIC_API_KEY not set")
        cmd_run(*sys.argv[2:5])
    elif c == "score": cmd_score(*sys.argv[2:5])
