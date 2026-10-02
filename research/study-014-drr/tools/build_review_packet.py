#!/usr/bin/env python3
"""Builds the blind human-review packet for Study 014's flagged items (practice set only; public texts).

Writes review/FLAGGED_ITEMS_REVIEW_PACKET.md (for the reviewer, no verdicts shown) and
review/CLAUDE_VERDICTS_KEY.md (Claude Code's own reading, to compare AFTER the reviewer finishes).
Items: every quote or citation extractor v1.1 flagged in P1 and P4 drafts (the set read for RESULTS.md), plus every
item extractor v1.2 still flags in any prompt. S014-11 is skipped (duplicate of S014-09).
"""
import difflib, os, re, sys
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
sys.path.insert(0, os.path.join(ROOT, "..", "drr-suite-v0.9", "lib"))
import anchors_v10 as A, anchors_v11 as V11, anchors_v12 as V12
R = os.path.join(ROOT, "runs", "2026-10-02-draft", "raw"); P = os.path.join(ROOT, "..", "drr-suite-v0.9", "practice")
MODELS = [("claude-sonnet-5-5", "Sonnet"), ("claude-haiku-4-5-20251001", "Haiku")]

# Claude Code's reading (RESULTS.md, "What the extractor got wrong" and "Genuine misquotation was found, but not in P4").
ALTERED = {("S014-05", "Haiku", "P1"), ("S014-10", "Sonnet", "P2"), ("S014-26", "Sonnet", "P2")}
INVENTED_QUOTE = ("S014-09", "Haiku", "P3", "accept this offer")


def verdict(cid, mn, p, kind, label, x):
    if label == "v1.2" and kind == "quote":
        if (cid, mn, p) == INVENTED_QUOTE[:3]:
            return "Invented" if INVENTED_QUOTE[3] in x else "Altered (words changed inside quote marks)"
        if (cid, mn, p) in ALTERED:
            return "Altered (words changed inside quote marks)"
    return "Faithful (scorer error: mis-paired quote marks, an unread page list or a resolved bracket)"


def sentences(t):
    return re.split(r"(?<=[.!?])\s+", t)


def window(text, needle, pad=140):
    i = text.find(needle)
    if i < 0:
        return None
    return text[max(0, i - pad): i + len(needle) + pad]


def draft_context(d, kind, x):
    if kind == "quote":
        words = x.split()[:5]
        for mm in re.finditer(re.escape(words[0]), d, re.I):
            seg = d[mm.start(): mm.start() + 400]
            if A._qnorm(seg).startswith(" ".join(words[:3])):
                return d[max(0, mm.start() - 140): mm.start() + len(x) + 140]
        return x
    tok = x.split(":")[-1] if kind == "citation" else x[:4]
    mm = re.search(r"\b" + re.escape(tok) + r"\b", d)
    return d[max(0, mm.start() - 160): mm.end() + 80] if mm else x


def best_source(s, dctx):
    dn = A._qnorm(dctx)
    best = max(sentences(s), key=lambda z: difflib.SequenceMatcher(None, A._qnorm(z), dn).ratio())
    i = s.find(best)
    return s[max(0, i - 80): i + len(best) + 80]


def main():
    items, seen = [], set()
    for prompts, ext, label in ((("P1", "P4"), V11, "v1.1"), (("P1", "P2", "P3", "P4"), V12, "v1.2")):
        for m, mn in MODELS:
            for p in prompts:
                for i in range(1, 31):
                    cid = f"S014-{i:02d}"
                    if cid == "S014-11":
                        continue
                    s = open(os.path.join(P, cid + ".txt")).read(); d = open(os.path.join(R, f"{cid}_{m}_{p}.txt")).read()
                    for kind, xs in ext.fabricated(s, d).items():
                        for x in xs:
                            key = (cid, mn, p, kind, x[:40])
                            if key in seen:
                                continue
                            seen.add(key)
                            dc = draft_context(d, kind, x)
                            items.append((cid, mn, p, kind, label, x, dc, best_source(s, dc)))
    head = ["# Study 014: independent check of flagged items", "",
            "**For a human reviewer. Phone-readable. Please do not open CLAUDE_VERDICTS_KEY.md until you have finished.**", "",
            "Each item is something the automatic scorer flagged as possibly invented: a quotation, record citation or date "
            "in an AI draft that it could not match to the source. Read the draft passage and the source passage, then tick one box.", "",
            "- **Invented:** the draft states something the source does not say at all.",
            "- **Altered:** the draft puts words in quotation marks that the source words differently.",
            "- **Faithful:** the draft matches the source; the flag was a scorer error.", "",
            "If the source passage shown is not the right one, the full source is `research/drr-suite-v0.9/practice/<ID>.txt` "
            "and the draft is `research/study-014-drr/runs/2026-10-02-draft/raw/`. S014-11 is omitted (duplicate of S014-09).", "",
            f"**{len(items)} items.** Reviewer name and date: ________________", ""]
    body, key = [], ["# Claude Code's verdicts (compare after review)", "",
                     "Claude Code (an AI) read every item; these are its verdicts, not independent evidence.", ""]
    for n, (cid, mn, p, kind, label, x, dc, sc) in enumerate(items, 1):
        body += [f"## {n}. {cid}, {mn} {p}, flagged {kind} (scorer {label})",
                 f"**Flagged text:** {x[:200]}", "", f"**Draft passage:** {dc.strip()}", "",
                 f"**Source passage:** {sc.strip()}", "",
                 "Your verdict: [ ] Invented  [ ] Altered  [ ] Faithful   Note: ____________", ""]
        key.append(f"{n}. {cid}, {mn} {p}, {kind}: {verdict(cid, mn, p, kind, label, x)}")
    os.makedirs(os.path.join(ROOT, "review"), exist_ok=True)
    open(os.path.join(ROOT, "review", "FLAGGED_ITEMS_REVIEW_PACKET.md"), "w").write("\n".join(head + body) + "\n")
    open(os.path.join(ROOT, "review", "CLAUDE_VERDICTS_KEY.md"), "w").write("\n".join(key) + "\n")
    print(len(items), "items")


if __name__ == "__main__":
    main()
