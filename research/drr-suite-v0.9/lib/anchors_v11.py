#!/usr/bin/env python3
"""Study 014 anchor extractor v1.1: a POST-HOC CORRECTION, made 2026-10-02 after Part 1 data were seen.

v1.0 (anchors.py, pre-registered) is unchanged and remains the primary measure. v1.1 fixes defects found
by reading the sources behind apparent "fabricated citations":
  1. "Report of Investigation (ROI) at N" and "(ROI), at N" were not matched.
  2. "Id. at N" (which in these decisions follows a record citation) was not matched; it is normalized to roi.
  3. Page lists ("ROI at 19- 24, 78, 85") matched only the first page; v1.1 captures every page in the list.
  5. Quotes: brackets are stripped before matching. A draft quote is "altered" if it is not an exact substring of the
     source, and "unsupported" if fewer than half of its four-word sequences occur in the source; only unsupported
     quotes count as fabricated.
  4. Fabricated dates: a date counts as fabricated only if its year and month do not occur in the source,
     so a shortened date ("March 2018" for "March 3, 2018") is not counted as invented.
Dates, attributions and quotes are otherwise identical to v1.0.
"""
import re
import anchors_v10 as A

RE_CIT11 = re.compile(
    r"\b(Report of Investigation\s*\(ROI\)|ROI|IR|Report of Investigation|Exhibit|Ex\.|Tab|Id\.)\)?\s*,?\s*(?:at\s*)?(?:pp?\.\s*)?"
    r"((?:[A-Z]?\d+[A-Za-z]?(?:\s*[-–]\s*\d+)?)(?:\s*,\s*(?:and\s+)?\d+(?:\s*[-–]\s*\d+)?)*|[A-Z])\b")


def citations(text):
    out = set()
    for m in RE_CIT11.finditer(text):
        kind = m.group(1).lower().rstrip(".")
        if kind.startswith("report of investigation") or kind in ("roi", "id"):
            kind = "roi"
        kind = {"ex": "exhibit"}.get(kind, kind)
        ref = m.group(2)
        if re.fullmatch(r"[A-Z]", ref):
            out.add(f"{kind}:{ref}")
            continue
        for part in re.split(r"\s*,\s*(?:and\s+)?", ref):
            first = re.match(r"[A-Z]?\d+", part.strip())
            if first:
                out.add(f"{kind}:{first.group(0).lstrip('0') or '0'}")
    return out


def extract(text):
    e = A.extract(text)
    e["citation"] = citations(text)
    return e


def retention(source, draft):
    s, d = extract(source), extract(draft)
    dn = A._qnorm(draft)
    out = {}
    for k in s:
        if not s[k]:
            out[k] = None
        elif k == "quote":
            out[k] = sum(1 for q in s[k] if q in dn) / len(s[k])
        else:
            out[k] = len(s[k] & d[k]) / len(s[k])
    return out


def _nb(t):
    return A._qnorm(re.sub(r"\[[^\]]*\]", " ", t))


def _grams(t, n=4):
    w = t.split()
    return {" ".join(w[i:i + n]) for i in range(max(0, len(w) - n + 1))}


def quote_status(source, draft):
    sn = _nb(source); sg = _grams(sn)
    altered, unsupported = [], []
    for m in A.RE_QUOTE.finditer(draft):
        if len(m.group(1).split()) < 3:
            continue
        q = _nb(m.group(1))
        if q in sn:
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
