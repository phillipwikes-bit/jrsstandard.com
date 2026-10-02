"""DRR Test Suite anchor extractor v1.2: a POST-HOC CORRECTION, made 2026-10-02 after Study 014 Part 1 data were seen.

Builds on v1.1 (anchors_v11.py). It fixes the three defects found by reading every quote and citation that v1.1 still
flagged as unsupported in the Study 014 P1 and P4 drafts (all 23 were extractor errors, none was invented text):
  1. Quote pairing. v1.0 paired quote marks by regex and skipped short quotes ("huh?", "H", "2."), so the closing mark of
     a short quote opened a false "quote" running to the next opening mark. v1.2 pairs every mark in order, lets a curly
     closing mark never open, and treats a span whose first character is a space as a closing mark followed by prose.
  2. Bracket resolution. The source "[human resources (HR)]" written as "HR" is faithful. Source quotes are matched
     against variants with each bracket replaced by its text, by its parenthesized short form, and removed.
  3. Page lists joined by "and", by semicolons or by a parenthesis ("ROI at 77- 80 and 90", "ROI1 at 437; 448",
     "ROI at 197-198 (209-210)") now yield every page. A record label must not run into a digit ("ROI1 (ROI1 at 431)"
     no longer yields "roi:1") and a citation does not cross a line break (a heading followed by a numbered list).
Dates and attributions are unchanged from v1.0. Validated against the held-out private set before v0.9 was frozen.
"""
import re
import anchors_v10 as A

SEP = r"(?:[ \t]*[,;][ \t]*(?:and[ \t]+)?|[ \t]+and[ \t]+|[ \t]*\()"
RE_CIT12 = re.compile(
    r"\b(Report of Investigation[ \t]*\(ROI\)|ROI\d?|IR|Report of Investigation|Exhibit|Ex\.|Tab|Id\.)(?![A-Za-z0-9])\)?[ \t]*,?[ \t]*(?:at[ \t]*)?(?:pp?\.[ \t]*)?"
    r"((?:[A-Z]?\d+[A-Za-z]?(?:[ \t]*[-–][ \t]*\d+)?)(?:" + SEP + r"\d+(?:[ \t]*[-–][ \t]*\d+)?)*|[A-Z])\b")
MARKS = "\"“”"


def citations(text):
    out = set()
    for m in RE_CIT12.finditer(text):
        kind = m.group(1).lower().rstrip(".")
        if kind.startswith("report of investigation") or re.fullmatch(r"roi\d?|id", kind):
            kind = "roi"
        kind = {"ex": "exhibit"}.get(kind, kind)
        ref = m.group(2)
        if re.fullmatch(r"[A-Z]", ref):
            out.add(f"{kind}:{ref}")
            continue
        for part in re.split(SEP, ref):
            first = re.match(r"[A-Z]?\d+", part.strip())
            if first:
                out.add(f"{kind}:{first.group(0).lstrip('0') or '0'}")
    return out


def quote_spans(text):
    pos = [i for i, ch in enumerate(text) if ch in MARKS]
    out, i = [], 0
    while i < len(pos) - 1:
        o, c = pos[i], pos[i + 1]
        body = text[o + 1:c]
        if text[o] == "”" or text[c] == "“" or not body or body[0].isspace() or len(body) > 400:
            i += 1
            continue
        out.append(body)
        i += 2
    return out


def quotes(text):
    return {A._qnorm(q) for q in quote_spans(text) if len(q.split()) >= 3}


def extract(text):
    e = A.extract(text)
    e["citation"] = citations(text)
    e["quote"] = quotes(text)
    return e


def _variants(text):
    full = re.sub(r"\[([^\]\(]*?)\s*\(([^)]*)\)\]", r"\1", text)
    short = re.sub(r"\[([^\]\(]*?)\s*\(([^)]*)\)\]", r"\2", text)
    vs = {text, re.sub(r"\[[^\]]*\]", " ", text)}
    for t in (full, short):
        vs.add(re.sub(r"\[([^\]]*)\]", r"\1", t))
    return {A._qnorm(v) for v in vs}


def _grams(t, n=4):
    w = t.split()
    return {" ".join(w[i:i + n]) for i in range(max(0, len(w) - n + 1))}


def _in(q, variants):
    return any(q in v for v in variants)


def retention(source, draft):
    s, d = extract(source), extract(draft)
    dv = _variants(draft)
    out = {}
    for k in s:
        if not s[k]:
            out[k] = None
        elif k == "quote":
            out[k] = sum(1 for q in s[k] if _in(q, dv) or any(_in(x, dv) for x in _variants(q))) / len(s[k])
        else:
            out[k] = len(s[k] & d[k]) / len(s[k])
    return out


def quote_status(source, draft):
    sv = _variants(source)
    sg = set().union(*(_grams(v) for v in sv))
    altered, unsupported = [], []
    for raw in quote_spans(draft):
        if len(raw.split()) < 3:
            continue
        q = A._qnorm(re.sub(r"\[[^\]]*\]", " ", raw))
        if _in(q, sv) or _in(A._qnorm(raw), sv):
            continue
        g = _grams(q)
        if g and len(g & sg) / len(g) < 0.5:
            unsupported.append(q)
        else:
            altered.append(q)
    return altered, unsupported


def fabricated(source, draft):
    s, d = extract(source), extract(draft)
    src_ym = {x[:7] for x in s["date"]}
    return {
        "date": sorted(x for x in d["date"] - s["date"] if x[:7] not in src_ym),
        "citation": sorted(d["citation"] - s["citation"]),
        "quote": sorted(quote_status(source, draft)[1]),
    }
