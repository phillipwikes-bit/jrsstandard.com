#!/usr/bin/env python3
"""Mechanical consistency audit of the RMJ manuscript. Reports, does not edit.

Checks only what Phillip's final list names: reference completeness and
consistency, figure numbering, in-text citations, capitalisation of key terms,
spelling of repeated terminology, and agreement between the abstract, methods,
results and conclusion. Substantive argument, methodology, findings and
limitations are out of scope by his instruction.

    python3 scripts/audit_rmj_mechanical.py [path/to/manuscript.docx]
"""
import os
import re
import sys
import zipfile
from collections import Counter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEFAULT = os.path.join(ROOT, "research", "rmj_submission_2026-09-01",
                       "01_RMJ_Manuscript_R6.docx")

findings = []


def note(area, detail):
    findings.append((area, detail))


def load(path):
    z = zipfile.ZipFile(path)
    doc = z.read("word/document.xml").decode("utf-8")
    out, raw = [], []
    for m in re.finditer(r"<w:p\b.*?</w:p>", doc, re.S):
        t = re.sub(r"<[^>]+>", "", m.group(0))
        t = (t.replace("&amp;", "&").replace("&lt;", "<")
              .replace("&gt;", ">").replace("&quot;", '"'))
        out.append(t.strip())
        raw.append(m.group(0))
    media = [n for n in z.namelist() if n.startswith("word/media/")]
    z.close()
    return out, raw, media


def main():
    path = sys.argv[1] if len(sys.argv) > 1 else DEFAULT
    if not os.path.exists(path):
        raise SystemExit("[REQUIRED_ENV_PARAM] manuscript not found: %s" % path)
    paras, raw, media = load(path)
    full = "\n".join(paras)

    # Split body from the reference apparatus.
    try:
        ri = next(i for i, p in enumerate(paras) if p == "References")
        pi = next(i for i, p in enumerate(paras)
                  if p == "Cited determinations, opinions, and audits")
    except StopIteration:
        raise SystemExit("[REQUIRED_ENV_PARAM] References or primary-source "
                         "heading not found")
    body = "\n".join(paras[:ri])
    refs = [p for p in paras[ri + 1:pi] if p]

    # 1. References: every entry cited, every citation resolves, order, format.
    for r in refs:
        m = re.match(r"^([A-Z][^.(]*?)(?:,| &|\.)", r)
        if not m:
            note("references", "cannot parse leading author from: %s" % r[:60])
            continue
        surname = m.group(1).split(",")[0].strip()
        if surname == "International Organization for Standardization":
            key = "ISO 15489-1:2016"
        elif surname == "Chief FOIA Officers Council":
            key = "Chief FOIA Officers Council"
        else:
            key = surname
        if key not in body:
            note("references", "entry never cited in body: %s" % r[:70])
    if refs != sorted(refs, key=lambda r: r.lower()):
        note("references", "reference list is not alphabetical")
    years = [bool(re.search(r"\((?:19|20)\d\d", r)) for r in refs]
    if not all(years):
        note("references", "%d entry/entries carry no parenthetical year"
             % years.count(False))

    # In-text author-year citations must resolve to an entry.
    for m in re.finditer(r"\b([A-Z][a-z]+(?: and [A-Z][a-z]+"
                         r"(?: [A-Z][a-z]+)*)?) \((?:19|20)\d\d\)", body):
        name = m.group(1)
        first = name.split(" and ")[0]
        if not any(first in r for r in refs):
            note("citations", "in-text citation with no entry: %s" % m.group(0))

    # 2. Figures: sequential, each captioned once, each referenced in text.
    caps = sorted(set(int(m.group(1))
                      for m in re.finditer(r"^Figure (\d+)\.", full, re.M)))
    if caps != list(range(1, len(caps) + 1)):
        note("figures", "caption numbers are not sequential from 1: %s" % caps)
    if len(caps) != len(media):
        note("figures", "%d captions but %d embedded images"
             % (len(caps), len(media)))
    for n in caps:
        refd = re.search(r"Figure %d\b(?!\.)" % n, body)
        if not refd:
            note("figures", "Figure %d is captioned but never referenced in "
                            "the text" % n)
    tables = re.findall(r"^Table (\d+)", full, re.M)
    if tables:
        note("tables", "numbered tables found (%s); the manuscript otherwise "
                       "presents tables unnumbered" % ", ".join(tables))

    # 3. Key-term capitalisation. The three reads are proper labels.
    for term, wrong in [("Needs work", r"\bNeeds Work\b"),
                        ("Needs work", r"\bneeds work\b"),
                        ("Ready", r"\bready read\b"),
                        ("Gap", r"\bgap read\b")]:
        hits = re.findall(wrong, body)
        if hits:
            note("capitalisation", "%d occurrence(s) of %r where %r is the "
                                   "form used elsewhere"
                 % (len(hits), hits[0], term))

    # 4. Repeated terminology and spelling variants.
    variants = [
        ("reconstructability", ["reconstructibility", "reconstructablity"]),
        ("programme", ["program"]),
        ("finalised", ["finalized"]),
        ("organisation", ["organization"]),
        ("analyse", ["analyze"]),
        ("characterise", ["characterize"]),
    ]
    for main_form, others in variants:
        # Whole words only. A prefix match counts "programme" as "program"
        # and "analyses" as "analyse", which overstates every pair.
        c = Counter()
        c[main_form] = len(re.findall(r"\b%ss?\b" % main_form, body, re.I))
        for o in others:
            c[o] = len(re.findall(r"\b%ss?\b" % o, body, re.I))
        present = {k: v for k, v in c.items() if v}
        if len(present) > 1:
            note("spelling", "mixed forms: "
                 + ", ".join("%s x%d" % (k, v)
                             for k, v in sorted(present.items(),
                                                key=lambda kv: -kv[1])))

    # 5. Abstract against Methods, Results and Conclusion.
    ai = next(i for i, p in enumerate(paras) if p == "Abstract")
    abstract = "\n".join(paras[ai:ai + 10])
    rest = "\n".join(paras[ai + 10:ri])
    for label, pat in [("case count", r"\b32\b"),
                       ("document classes", r"\bfour document classes\b"),
                       ("re-read size", r"\b(?:10|ten) cases\b"),
                       ("p = 0.0000520", r"p = 0\.0000520"),
                       ("p = 0.00466", r"p = 0\.00466"),
                       ("p = 1.000", r"p = 1\.000")]:
        in_a = bool(re.search(pat, abstract, re.I))
        in_b = bool(re.search(pat, rest, re.I))
        if in_a and not in_b:
            note("abstract/body", "%s appears in the abstract but not in the "
                                  "body" % label)
    nums = {}
    for label, pat in [("Ready", r"\b18 Ready\b"),
                       ("Needs work", r"\b9 Needs work\b"),
                       ("Gap", r"\b5 Gap\b")]:
        nums[label] = len(re.findall(pat, full))
    for m in re.finditer(r"(\d+) of (\d+) noted Ready", full):
        pass
    six_seven = len(re.findall(r"six of seven noted Needs work", full))
    numeric = len(re.findall(r"of the 7 Needs work cases", full))
    if six_seven and numeric:
        note("consistency", "the 6-of-7 Needs work figure is written out in "
                            "one place and in numerals in another")

    # 6. Journal-facing structure.
    for element in ["Purpose.", "Design/methodology/approach.", "Findings.",
                    "Research limitations/implications.",
                    "Practical implications.", "Originality/value."]:
        if element not in abstract:
            note("abstract", "structured element missing: %s" % element)
    kw = [p for p in paras if p.startswith("Keywords")]
    if len(kw) != 1:
        note("abstract", "%d keyword lines found, expected exactly 1"
             % len(kw))
    else:
        n = len([k for k in kw[0].split(":", 1)[-1].split(";") if k.strip()])
        if not 4 <= n <= 12:
            note("abstract", "%d keywords; Emerald asks for a short list" % n)

    # 7. Formatting. Every pass in this repo rewrites paragraphs as a single
    #    unformatted run, so stripped bold or italic and inherited heading
    #    styles are the standing risk, not a hypothetical one.
    for a, b in zip(paras, raw):
        if re.search(r'w:val="Heading[123]"', b) and len(a) > 120:
            note("formatting", "body paragraph carries a heading style, so it "
                               "lands in the outline: %s" % a[:60])
    def first_run_bold(text_prefix):
        for a, b in zip(paras, raw):
            if a.startswith(text_prefix):
                m = re.search(r"<w:r>(?:(?!</w:r>).)*</w:r>", b, re.S)
                return bool(m and "<w:b/>" in m.group(0))
        return None
    bylines = [a for a in paras[:4]
               if re.match(r"^(Stacyann Young|Phillip Wikes)", a)]
    states = [first_run_bold(a[:20]) for a in bylines]
    if len(set(states)) > 1:
        note("formatting", "the two author lines disagree on bold: %s"
             % dict(zip([a[:16] for a in bylines], states)))
    for label in ["Purpose.", "Design/methodology/approach.", "Findings.",
                  "Research limitations/implications.",
                  "Practical implications.", "Originality/value.",
                  "Author contributions.", "Disclosure.",
                  "Competing interests."]:
        if any(a.startswith(label) for a in paras):
            if first_run_bold(label) is False:
                note("formatting", "label not bold where its neighbours are: "
                                   "%s" % label)
    ref_raw = [b for a, b in zip(paras, raw)
               if any(a.startswith(x) for x in
                      ("Duranti", "Farrell", "Gwet", "Yeo",
                       "International Organization", "Chief FOIA"))]
    plain_refs = [b for b in ref_raw if "<w:i/>" not in b]
    if plain_refs:
        note("formatting", "%d reference entry/entries carry no italic title "
                           "or journal name" % len(plain_refs))

    print("MECHANICAL AUDIT: %s" % os.path.relpath(path, ROOT))
    print("paragraphs %d, references %d, figures %d, images %d"
          % (len(paras), len(refs), len(caps), len(media)))
    print()
    if not findings:
        print("no mechanical inconsistencies found")
        return 0
    area_w = max(len(a) for a, _ in findings)
    for area, detail in findings:
        print("  %-*s  %s" % (area_w, area, detail))
    print()
    print("%d finding(s)" % len(findings))
    return 0


if __name__ == "__main__":
    sys.exit(main())
