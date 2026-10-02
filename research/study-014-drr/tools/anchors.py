#!/usr/bin/env python3
"""Study 014 anchor extractor (PROTOCOL.md, "Anchors"). Deterministic; no model involved.

extract(text) -> {"date": set, "citation": set, "attribution": set, "quote": set}
retention(source, draft) -> per-type share of source anchors found in the draft
fabricated(source, draft) -> per-type draft anchors absent from the source (date, citation, quote)
"""
import re

MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august",
          "september", "october", "november", "december"]
MON = r"(January|February|March|April|May|June|July|August|September|October|November|December|Jan\.|Feb\.|Mar\.|Apr\.|Jun\.|Jul\.|Aug\.|Sept?\.|Oct\.|Nov\.|Dec\.)"
RE_MDY = re.compile(MON + r"\s+(\d{1,2}),?\s+(\d{4})")
RE_MY = re.compile(MON + r"\s+(\d{4})")
RE_NUM = re.compile(r"\b(\d{1,2})/(\d{1,2})/(\d{2,4})\b")
RE_CIT = re.compile(r"\b(ROI|IR|Report of Investigation|Exhibit|Ex\.|Tab)\s*(?:at\s*)?(?:p\.\s*)?([A-Z]?\d+[A-Za-z]?|[A-Z])\b")
ROLE = (r"(Complainant|Petitioner|the Agency|Agency|S\d{1,2}|RMO\s?\d{0,2}|RMO|CW\s?\d{1,2}|C\d{1,2}|Witness\s?\d{1,2}|W\d{1,2}|"
        r"Supervisor\s?\d{1,2}|Supervisor|Manager\s?\d{1,2}|Manager|Coworker\s?\d{1,2}|Coworker|Director|Chief|"
        r"Specialist\s?\d{1,2}|Official\s?\d{1,2}|Investigator|Selecting Official|SO\d{0,2}|HR\s?\d{0,2})")
VERB = r"(stated|states|averred|avers|testified|asserted|asserts|alleged|alleges|denied|denies|explained|explains|maintained|maintains|indicated|indicates|affirmed|affirms|contended|contends|claimed|claims|noted|notes|reported|reports|attested|attests|recalled|recalls|acknowledged|acknowledges|confirmed|confirms|averred)"
RE_ATTR = re.compile(r"\b" + ROLE + r"\b[^.;:]{0,40}?\b" + VERB + r"\b")
RE_QUOTE = re.compile(r"[\"“]([^\"”]{6,400})[\"”]")


def _mon(m):
    m = m.lower().rstrip(".")
    for i, name in enumerate(MONTHS):
        if name.startswith(m[:3]):
            return i + 1
    return 0


def dates(text):
    out = set()
    spans = []
    for m in RE_MDY.finditer(text):
        out.add(f"{int(m.group(3)):04d}-{_mon(m.group(1)):02d}-{int(m.group(2)):02d}")
        spans.append(m.span())
    for m in RE_MY.finditer(text):
        if any(a <= m.start() < b for a, b in spans):
            continue
        out.add(f"{int(m.group(2)):04d}-{_mon(m.group(1)):02d}")
    for m in RE_NUM.finditer(text):
        y = int(m.group(3)); y = y + 2000 if y < 100 else y
        mo, d = int(m.group(1)), int(m.group(2))
        if 1 <= mo <= 12 and 1 <= d <= 31:
            out.add(f"{y:04d}-{mo:02d}-{d:02d}")
    return out


def _role_norm(r):
    r = re.sub(r"\s+", "", r).lower()
    return {"theagency": "agency"}.get(r, r)


def citations(text):
    out = set()
    for m in RE_CIT.finditer(text):
        kind = m.group(1).lower().rstrip(".")
        kind = {"report of investigation": "roi", "ex": "exhibit"}.get(kind, kind)
        out.add(f"{kind}:{m.group(2).upper()}")
    return out


def attributions(text):
    return {_role_norm(m.group(1)) for m in RE_ATTR.finditer(text)}


def _qnorm(q):
    return re.sub(r"[^a-z0-9 ]", "", re.sub(r"\s+", " ", q.lower())).strip()


def quotes(text):
    return {_qnorm(m.group(1)) for m in RE_QUOTE.finditer(text) if len(m.group(1).split()) >= 3}


def extract(text):
    return {"date": dates(text), "citation": citations(text), "attribution": attributions(text), "quote": quotes(text)}


def retention(source, draft):
    s, d = extract(source), extract(draft)
    dn = _qnorm(draft)
    out = {}
    for k in s:
        if not s[k]:
            out[k] = None
            continue
        if k == "quote":
            kept = sum(1 for q in s[k] if q in dn)
        elif k == "attribution":
            # a role counts as kept if the draft attributes any statement to the same role
            kept = len(s[k] & d[k])
        else:
            kept = len(s[k] & d[k])
        out[k] = kept / len(s[k])
    return out


def fabricated(source, draft):
    s, d = extract(source), extract(draft)
    sn = _qnorm(source)
    return {
        "date": sorted(d["date"] - s["date"]),
        "citation": sorted(d["citation"] - s["citation"]),
        "quote": sorted(q for q in d["quote"] if q not in sn),
    }


def counts(text):
    return {k: len(v) for k, v in extract(text).items()}
