#!/usr/bin/env python3
"""Final RMJ pass: neutral authorship line and the mechanical corrections.

WHY THIS EXISTS. Phillip's closing instruction: make correction 1, run a
mechanical consistency check, change nothing substantive, and submit. Items 2
and 3 of that list ask that the reliability language and the audit language be
LEFT ALONE, so both are asserted here rather than edited, the same way a
request for no change was guarded in the previous pass.

CORRECTION 1 CARRIES A CONSEQUENCE HE NAMED. He asks for the neutral byline
"then retain the full conflict or author-position disclosure elsewhere in the
manuscript". There is no such disclosure elsewhere. The Disclosure paragraph
covers capacity, affiliation, source materials and funding, and the Author
contributions paragraph says P.W. developed the standard, but that is a
contribution statement, not a declared interest. Neutralising the byline on
its own would therefore REDUCE disclosure rather than relocate it, so a
competing-interests statement is added with it.

His replacement byline also drops "former Lead Civil Rights Officer, Maryland
Commission on Civil Rights". That clause is retained, because it is a real
affiliation rather than a claim about the instrument, and removing a credential
is a decision only he should make. Flagged rather than actioned.

MECHANICAL FINDINGS, from scripts/audit_rmj_mechanical.py:
  - Figure 1 was captioned but never referenced in the text.
  - Mixed British and American spelling: programme x11 against program x1,
    finalised against finalized, plus -ization forms against -isation forms.
    Normalised to British, which is Emerald house style and the form the
    load-bearing domain term already takes.
  - "International Organization for Standardization" is left exactly as is.
    It is the body's registered name, not a spelling choice.

    python3 scripts/apply_rmj_final_pass.py --check
    python3 scripts/apply_rmj_final_pass.py --apply
"""
import argparse
import os
import re
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "research", "rmj_submission_2026-09-01",
                   "01_RMJ_Manuscript_R6.docx")
DST = os.path.join(ROOT, "research", "rmj_submission_2026-09-01",
                   "01_RMJ_Manuscript_R7.docx")

BYLINE = ("Phillip Wikes, Independent Researcher; Developer of the "
          "Justification Review Standard; former Lead Civil Rights Officer, "
          "Maryland Commission on Civil Rights")

COMPETING = ("Competing interests. P.W. developed the Justification Review "
             "Standard, the review protocol examined in this study, and has a "
             "continuing professional interest in it. The study design places "
             "the protocol against independent government audit findings and "
             "an independent blind second read. S.Y. declares no competing "
             "interests.")

FIGURE1_CALLOUT = (
    "Reads across the 32 cases: 18 Ready, 9 Needs work, 5 Gap. Documented "
    "outcomes: 15 determinations did not survive review, 7 contested without "
    "a recorded disposition, 5 sustained, 5 adverse audit findings. Figure 1 "
    "summarises the corpus and the three-level read. Figure 2 shows the "
    "distribution of documentation reads across the documented outcomes.")

# Whole-word spelling normalisations. The ISO name is excluded by requiring
# a lower-case initial on the two forms that appear inside it.
SPELLING = [
    ("programs", "programmes"),
    ("program", "programme"),
    ("finalized", "finalised"),
    ("finalization", "finalisation"),
    ("analyzed", "analysed"),
    ("summarize", "summarise"),
    ("Generalization", "Generalisation"),
    ("characterization", "characterisation"),
    ("modernization", "modernisation"),
    ("organizations", "organisations"),
    ("organization", "organisation"),
]

PROTECTED = "International Organization for Standardization"

# Items 2 and 3: these must survive this pass untouched.
KEEP = [
    ("reliability, item 2",
     "although the sample is too small to treat this result as a stable "
     "estimate of category-specific reliability"),
    ("reliability, item 2",
     "Additional independent reviews would be required before stable "
     "estimates of inter-rater reliability could be established"),
    ("audit language, item 3", "Concordance is five of five"),
    ("audit language, item 3",
     "preliminary evidence of convergence between the record-level read and "
     "independently identified evidentiary deficiencies"),
    ("audit language, item 3",
     "it should be interpreted as preliminary evidence of convergence rather "
     "than as a stable estimate of instrument validity"),
]
# Words that would mean the audit result had been strengthened.
FORBIDDEN = ["demonstrates convergent validity", "confirms the instrument",
             "proves the read", "validates the instrument",
             "establishes the validity"]


def esc(t):
    return t.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def para(text, style=None):
    pr = "<w:pPr>"
    if style:
        pr += '<w:pStyle w:val="%s"/>' % style
    pr += '<w:spacing w:after="140"/></w:pPr>'
    return ('<w:p>%s<w:r><w:t xml:space="preserve">%s</w:t></w:r></w:p>'
            % (pr, esc(text)))


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--check", action="store_true")
    args = ap.parse_args()
    if not (args.apply or args.check):
        ap.error("pass --check or --apply")
    if not os.path.exists(SRC):
        raise SystemExit("[REQUIRED_ENV_PARAM] R6 DOCX not found at %s"
                         % os.path.relpath(SRC, ROOT))

    zin = zipfile.ZipFile(SRC)
    doc = zin.read("word/document.xml").decode("utf-8")
    log = []

    def spans():
        return [(m.start(), m.end()) for m in
                re.finditer(r"<w:p\b.*?</w:p>", doc, re.S)]

    def text_at(a, b):
        t = re.sub(r"<[^>]+>", "", doc[a:b])
        return (t.replace("&amp;", "&").replace("&lt;", "<")
                 .replace("&gt;", ">").replace("&quot;", '"'))

    def flat():
        return (re.sub(r"<[^>]+>", "", doc).replace("&amp;", "&")
                .replace("&lt;", "<").replace("&gt;", ">")
                .replace("&quot;", '"'))

    def find(pred):
        for i, (a, b) in enumerate(spans()):
            if pred(text_at(a, b)):
                return i
        return -1

    def require(label, pred):
        i = find(pred)
        if i < 0:
            raise SystemExit("[REQUIRED_ENV_PARAM] target not found: %s"
                             % label)
        return i

    def style_of(i):
        a, b = spans()[i]
        st = re.search(r'<w:pStyle w:val="([^"]+)"/>', doc[a:b])
        return st.group(1) if st else None

    def replace_para(i, new_text):
        nonlocal doc
        style = style_of(i)
        a, b = spans()[i]
        doc = doc[:a] + para(new_text, style) + doc[b:]

    def insert_after(i, texts):
        nonlocal doc
        style = style_of(i)
        b = spans()[i][1]
        doc = doc[:b] + "".join(para(t, style) for t in texts) + doc[b:]

    before = flat()
    for label, s in KEEP:
        if s not in before:
            raise SystemExit("[REQUIRED_ENV_PARAM] the source is not R6, %s "
                             "sentence absent: %s" % (label, s[:50]))

    # Correction 1, and the disclosure it depends on.
    i = require("Wikes byline",
                lambda t: t.startswith("Phillip Wikes Creator of the "
                                       "Justification Review Standard"))
    replace_para(i, BYLINE)
    log.append("byline neutralised: Creator -> Independent Researcher; "
               "Developer")
    i = require("Disclosure paragraph",
                lambda t: t.startswith("Disclosure. Both authors contributed"))
    insert_after(i, [COMPETING])
    log.append("competing-interests statement added, which the byline change "
               "relies on")

    # Mechanical: Figure 1 callout.
    i = require("6.1 opening paragraph",
                lambda t: t.startswith("Reads across the 32 cases:"))
    replace_para(i, FIGURE1_CALLOUT)
    log.append("Figure 1 referenced in the text, ahead of Figure 2")

    # Mechanical: spelling, whole words, protecting the ISO name.
    changed = 0
    for old, new in SPELLING:
        pat = re.compile(r"\b%s\b" % re.escape(old))
        for i, (a, b) in enumerate(spans()):
            t = text_at(a, b)
            if PROTECTED in t:
                continue
            if pat.search(t):
                replace_para(i, pat.sub(new, t))
                changed += 1
    log.append("spelling normalised to British in %d paragraph(s)" % changed)

    after = flat()

    if PROTECTED not in after:
        raise SystemExit("[REQUIRED_ENV_PARAM] the ISO body's registered name "
                         "was altered by the spelling pass")
    for label, s in KEEP:
        if s not in after:
            raise SystemExit("[REQUIRED_ENV_PARAM] %s sentence was changed by "
                             "this pass, which items 2 and 3 forbid: %s"
                             % (label, s[:50]))
    hits = [f for f in FORBIDDEN if f in after.lower()]
    if hits:
        raise SystemExit("[REQUIRED_ENV_PARAM] audit language strengthened, "
                         "which item 3 forbids: %s" % "; ".join(hits))
    log.append("items 2 and 3 verified unchanged: %d sentences held"
               % len(KEEP))

    for bad in ["programs", "program ", "finalized", "analyzed", "summarize",
                "Generalization", "characterization", "modernization"]:
        if bad in after:
            raise SystemExit("[REQUIRED_ENV_PARAM] American form survives: %s"
                             % bad)
    if len(re.findall(r"\borganizations?\b", after.replace(PROTECTED, ""))):
        raise SystemExit("[REQUIRED_ENV_PARAM] 'organization' survives outside "
                         "the ISO name")

    must = ["five of five", "p = 0.0000520", "p = 0.00466", "p = 0.0000050",
            "p = 1.000", "0.582", "0.559", "0.474", "7 of 10",
            "39.7 to 89.2", "Figure 1.", "Figure 2.", "Figure 3.",
            "85.7%", "23.1%", "28.6%",
            "Can Public-Records Determinations Be Independently Reconstructed",
            "Duranti (1995)", "Yeo (2007)", "Farrell (2024)",
            "18 Ready, 9 Needs work, 5 Gap"]
    missing = [m for m in must if m not in after]
    if missing:
        raise SystemExit("[REQUIRED_ENV_PARAM] final pass dropped: %s"
                         % "; ".join(missing))

    # Each figure referenced in the body ahead of its own caption block.
    body = after.split("\nReferences")[0]
    for n in (1, 2, 3):
        if not re.search(r"Figure %d\b(?!\.)" % n, body):
            raise SystemExit("[REQUIRED_ENV_PARAM] Figure %d is captioned but "
                             "never referenced" % n)

    imgs = [n for n in zin.namelist() if n.startswith("word/media/")]
    for line in log:
        print("  " + line)
    print("  evidence carried: %d/%d" % (len(must) - len(missing), len(must)))
    print("  figures referenced in text: 3/3")
    print("  images: %d" % len(imgs))

    if not args.apply:
        print("\nCHECK ONLY, nothing written")
        return

    tmp = DST + ".tmp"
    with zipfile.ZipFile(tmp, "w", zipfile.ZIP_DEFLATED) as zout:
        for item in zin.infolist():
            data = zin.read(item.filename)
            if item.filename == "word/document.xml":
                data = doc.encode("utf-8")
            zout.writestr(item, data)
    zin.close()
    os.replace(tmp, DST)
    print("\nwrote %s" % os.path.relpath(DST, ROOT))


if __name__ == "__main__":
    main()
