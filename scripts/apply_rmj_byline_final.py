#!/usr/bin/env python3
"""Drop the Maryland Commission clause from the RMJ byline.

WHY THIS EXISTS. Phillip's decision of 2026-09-01 on the question left open by
the previous pass: the byline he specified omits the former-post clause, and he
has now confirmed it goes. The byline becomes exactly his string.

The clause appears once in the manuscript, in the byline, so no cross-reference
or affiliation elsewhere is orphaned by removing it. The competing-interests
statement added with the byline neutralisation is untouched and asserted.

    python3 scripts/apply_rmj_byline_final.py --check
    python3 scripts/apply_rmj_byline_final.py --apply
"""
import argparse
import os
import re
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "research", "rmj_submission_2026-09-01",
                   "01_RMJ_Manuscript_R7.docx")
DST = os.path.join(ROOT, "research", "rmj_submission_2026-09-01",
                   "01_RMJ_Manuscript_R8.docx")

BYLINE = ("Phillip Wikes, Independent Researcher; Developer of the "
          "Justification Review Standard")

DROPPED = "Maryland Commission on Civil Rights"

# Must survive: the disclosure the byline neutralisation depends on, and the
# sentences the previous pass was told to leave alone.
KEEP = [
    "Competing interests. P.W. developed the Justification Review Standard",
    "S.Y. declares no competing interests.",
    "Concordance is five of five",
    "although the sample is too small to treat this result as a stable "
    "estimate of category-specific reliability",
    "it should be interpreted as preliminary evidence of convergence rather "
    "than as a stable estimate of instrument validity",
]


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
        raise SystemExit("[REQUIRED_ENV_PARAM] R7 DOCX not found at %s"
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

    before = flat()
    n_before = before.count(DROPPED)
    if n_before == 0:
        raise SystemExit("[REQUIRED_ENV_PARAM] the clause is already absent; "
                         "the source is not R7")
    if n_before > 1:
        raise SystemExit("[REQUIRED_ENV_PARAM] the clause appears %d times, "
                         "not only in the byline; removing it here would "
                         "leave the others" % n_before)

    idx = -1
    for i, (a, b) in enumerate(spans()):
        if text_at(a, b).startswith("Phillip Wikes,"):
            idx = i
            break
    if idx < 0:
        raise SystemExit("[REQUIRED_ENV_PARAM] byline not found")
    a, b = spans()[idx]
    st = re.search(r'<w:pStyle w:val="([^"]+)"/>', doc[a:b])
    doc = doc[:a] + para(BYLINE, st.group(1) if st else None) + doc[b:]
    log.append("byline: former-post clause removed")

    after = flat()
    if DROPPED in after:
        raise SystemExit("[REQUIRED_ENV_PARAM] the clause survives")
    if BYLINE not in after:
        raise SystemExit("[REQUIRED_ENV_PARAM] the byline was not written")
    for s in KEEP:
        if s not in after:
            raise SystemExit("[REQUIRED_ENV_PARAM] protected sentence lost: %s"
                             % s[:60])
    log.append("competing-interests statement and guarded sentences intact")

    must = ["five of five", "p = 0.0000520", "p = 0.00466", "p = 0.0000050",
            "p = 1.000", "0.582", "0.559", "0.474", "7 of 10",
            "39.7 to 89.2", "Figure 1.", "Figure 2.", "Figure 3.",
            "85.7%", "23.1%", "28.6%",
            "Can Public-Records Determinations Be Independently Reconstructed",
            "Duranti (1995)", "Yeo (2007)", "Farrell (2024)",
            "International Organization for Standardization",
            "18 Ready, 9 Needs work, 5 Gap"]
    missing = [m for m in must if m not in after]
    if missing:
        raise SystemExit("[REQUIRED_ENV_PARAM] byline pass dropped: %s"
                         % "; ".join(missing))

    body = after.split("\nReferences")[0]
    for n in (1, 2, 3):
        if not re.search(r"Figure %d\b(?!\.)" % n, body):
            raise SystemExit("[REQUIRED_ENV_PARAM] Figure %d is captioned but "
                             "never referenced" % n)

    imgs = [n for n in zin.namelist() if n.startswith("word/media/")]
    for line in log:
        print("  " + line)
    print("  evidence carried: %d/%d" % (len(must) - len(missing), len(must)))
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
