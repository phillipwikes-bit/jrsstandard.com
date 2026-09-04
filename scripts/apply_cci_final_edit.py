#!/usr/bin/env python3
"""Final surgical editorial pass on the CCI resubmission.

WHY THIS EXISTS. The manuscript was already revised to Jennifer Gaskin's
direction and reads well. The brief is explicit that changes are made only
where they improve accuracy, clarity, readability, precision, legal discipline
or editorial flow, and that the goal is a better manuscript rather than
evidence that editing occurred. Six changes qualified. They are listed here so
the diff is auditable sentence by sentence.

WHAT WAS DELIBERATELY NOT TOUCHED:
  * the European section, paragraphs 42-44, which is Hekim Colpan's approved
    substantive content. It was read for grammar, internal contradiction and
    legal overstatement and needed none of them.
  * ISO/IEC 42001 and DORA in the author biography. The brief excludes them
    from the BODY of this version; they are credentials in a bio, not article
    content, and removing them would misstate an author's expertise.
  * every hyperlink, all five preserved unchanged.

    python3 scripts/apply_cci_final_edit.py SOURCE.docx OUT.docx
"""
import argparse
import os
import re
import sys
import zipfile

# (paragraph-opening anchor, exact old text, new text, reason)
EDITS = [
    ("We call that gap Decision Reconstruction Risk",
     "In employment matters that gap matters because discrimination disputes "
     "can turn on the reasons an employer gives and the evidence surrounding "
     "them.",
     "In employment matters this is consequential because discrimination "
     "disputes can turn on the reasons an employer gives and the evidence "
     "surrounding them.",
     "removes 'that gap ... that gap matters' inside one paragraph"),

    ("McDonnell Douglas Corp. v. Green established",
     "established a burden-shifting framework under which, where that "
     "framework applies, an employer may articulate a legitimate, "
     "nondiscriminatory reason for an employment action and the plaintiff may "
     "seek to show that reason is pretextual.",
     "established a burden-shifting framework. Where it applies, an employer "
     "may articulate a legitimate, nondiscriminatory reason for an employment "
     "action and the plaintiff may seek to show that reason is pretextual.",
     "'under which, where that framework applies' doubles the same "
     "qualifier; split preserves the legal restraint and reads cleanly"),

    ("The underlying history may include",
     "The underlying history may include emails, attendance records, "
     "completed work and prior feedback, while the final document",
     "Consider a file where the underlying history includes emails, "
     "attendance records, completed work and prior feedback, while the final "
     "document",
     "the paragraph opened on 'The underlying history' with no antecedent"),

    ("One way to operationalize this",
     "The Justification Review Standard, developed by one of the authors, "
     "runs inside existing HR, compliance, investigations, audit and legal "
     "workflows and asks whether an AI-assisted record can withstand "
     "independent review before it is finalized.",
     "The Justification Review Standard, developed by one of the authors, "
     "applies within existing HR, compliance, investigations, audit and legal "
     "review processes. It asks whether an AI-assisted record can withstand "
     "independent review before it is finalized.",
     "'runs inside' reads as a product capability; 'applies within' is "
     "accurate for a review discipline and the split shortens a 38-word "
     "sentence"),

    ("For compliance and HR leaders",
     "the practical question is not whether AI should write employment "
     "records. It is whether the organization has a control at the point "
     "where AI-assisted language becomes part of the permanent record.",
     "the practical question is not whether AI should write employment "
     "records but whether the organization has a control at the point where "
     "AI-assisted language becomes part of the permanent record.",
     "third use of the same 'not X. It is Y' two-sentence shape; merging "
     "varies the rhythm and drops a near-formulaic opener"),

    ("When employment records are reviewed side by side",
     "the issue may no longer be an individual employee's wording. It may be "
     "whether the organization's records reveal standards that were "
     "subjective, inconsistently applied or difficult to defend.",
     "the question may shift from an individual employee's wording to whether "
     "the organization's records reveal standards that were subjective, "
     "inconsistently applied or difficult to defend.",
     "same two-sentence shape again, two paragraphs after the last one"),
]

# Content the brief requires to survive.
MUST_KEEP = [
    "Decision Reconstruction Risk",
    "McDonnell Douglas Corp. v. Green",
    "The Supreme Court did not hold that documentation quality determines",
    "cultural fit", "executive presence", "not adaptable",
    "communication style", "struggles with change",
    "None establishes discrimination by itself",
    "Disparate treatment and disparate impact remain distinct theories",
    "What happened?", "What evidence supports the characterization?",
    "Why did those facts matter?",
    "Was the same reasoning applied consistently?",
    "Attendance issues affecting the team", "Lacks professionalism",
    "preservation rather than retention",
    "accountability principle", "Article 22", "Annex III",
    "Regulation (EU) 2026/1744", "2 December 2027",
    "undergoing structured validation",
    "The instrument matters less than the discipline",
    "right to know why",
    "not a legal doctrine",
]

# Language the brief forbids.
FORBIDDEN = ["—", "the key question is", "in today's",
             "it is important to note", "this highlights", "at its core",
             "in conclusion", "in an era of", "organizations must navigate"]

# Must not reappear in the BODY.
BODY_FORBIDDEN = ["ISO/IEC 42001", "ISO 42001", "DORA"]


def para_text(seg: str) -> str:
    t = "".join(re.findall(r"<w:t[^>]*>(.*?)</w:t>", seg, re.S))
    return (t.replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">")
             .replace("&quot;", '"').replace("&apos;", "'"))


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("source")
    ap.add_argument("out")
    args = ap.parse_args()
    if not os.path.exists(args.source):
        raise SystemExit("[REQUIRED_ENV_PARAM] source not found: %s"
                         % args.source)

    zin = zipfile.ZipFile(args.source)
    names = zin.namelist()
    infos = zin.infolist()
    src = {n: zin.read(n) for n in names}
    zin.close()
    doc = src["word/document.xml"].decode("utf-8")

    links_before = doc.count("<w:hyperlink")

    for anchor, old, new, reason in EDITS:
        spans = [(m.start(), m.end())
                 for m in re.finditer(r"<w:p\b.*?</w:p>", doc, re.S)]
        idx = -1
        for i, (a, b) in enumerate(spans):
            if para_text(doc[a:b]).strip().startswith(anchor):
                idx = i
                break
        if idx < 0:
            raise SystemExit("[REQUIRED_ENV_PARAM] paragraph not found: %s"
                             % anchor)
        a, b = spans[idx]
        seg = doc[a:b]
        whole = para_text(seg)
        if old not in whole:
            raise SystemExit("[REQUIRED_ENV_PARAM] target text not found in "
                             "the paragraph beginning %r" % anchor[:40])
        # The paragraph may hold a hyperlink, so rebuild it run by run only
        # when it does not; otherwise splice the text of the single run that
        # carries the target.
        updated = whole.replace(old, new)
        if "<w:hyperlink" in seg:
            # Keep the hyperlink element byte-for-byte and rebuild only the
            # run content after it. The closing </w:p> MUST be re-appended:
            # omitting it merged this paragraph into the next one on the first
            # run, which the verification below now also catches.
            marker = "</w:hyperlink>"
            if marker not in seg:
                raise SystemExit("[REQUIRED_ENV_PARAM] hyperlink close tag "
                                 "missing in %r" % anchor[:40])
            hl_end = seg.rfind(marker) + len(marker)
            head = seg[:hl_end]
            tail = seg[hl_end:]
            tail_text = para_text(tail)
            if old not in tail_text:
                raise SystemExit("[REQUIRED_ENV_PARAM] %r spans a hyperlink; "
                                 "refusing to rebuild and risk losing it"
                                 % anchor[:40])
            pr = re.search(r"<w:rPr>.*?</w:rPr>", tail, re.S)
            run = ('<w:r>%s<w:t xml:space="preserve">%s</w:t></w:r>'
                   % (pr.group(0) if pr else "",
                      tail_text.replace(old, new)
                      .replace("&", "&amp;").replace("<", "&lt;")
                      .replace(">", "&gt;")))
            seg = head + run + "</w:p>"
        else:
            pr = re.search(r"<w:pPr>.*?</w:pPr>", seg, re.S)
            rpr = re.search(r"<w:rPr>.*?</w:rPr>", seg, re.S)
            seg = ('<w:p>%s<w:r>%s<w:t xml:space="preserve">%s</w:t></w:r>'
                   '</w:p>' % (pr.group(0) if pr else "",
                               rpr.group(0) if rpr else "",
                               updated.replace("&", "&amp;")
                               .replace("<", "&lt;").replace(">", "&gt;")))
        doc = doc[:a] + seg + doc[b:]
        print("  edited: %s" % reason)

    paras_after = re.findall(r"<w:p\b.*?</w:p>", doc, re.S)
    paras_before = re.findall(r"<w:p\b.*?</w:p>",
                              src["word/document.xml"].decode("utf-8"), re.S)
    if len(paras_after) != len(paras_before):
        raise SystemExit("[REQUIRED_ENV_PARAM] paragraph count changed %d -> "
                         "%d; a rebuilt paragraph lost its closing tag and "
                         "merged with its neighbour"
                         % (len(paras_before), len(paras_after)))
    plain = "\n".join(para_text(p) for p in paras_after)

    missing = [k for k in MUST_KEEP if k not in plain]
    if missing:
        raise SystemExit("[REQUIRED_ENV_PARAM] required content lost: %s"
                         % "; ".join(missing))
    present = [f for f in FORBIDDEN if f.lower() in plain.lower()]
    if present:
        raise SystemExit("[REQUIRED_ENV_PARAM] forbidden language present: %s"
                         % "; ".join(present))

    body = plain.split("About the authors")[0]
    inbody = [f for f in BODY_FORBIDDEN if f in body]
    if inbody:
        raise SystemExit("[REQUIRED_ENV_PARAM] excluded topic in the body: %s"
                         % "; ".join(inbody))

    links_after = doc.count("<w:hyperlink")
    if links_after != links_before:
        raise SystemExit("[REQUIRED_ENV_PARAM] hyperlink count changed: %d -> "
                         "%d" % (links_before, links_after))

    src["word/document.xml"] = doc.encode("utf-8")
    with zipfile.ZipFile(args.out + ".tmp", "w", zipfile.ZIP_DEFLATED) as zout:
        for item in infos:
            zout.writestr(item, src[item.filename])
    os.replace(args.out + ".tmp", args.out)

    words = len(plain.split())
    print("  required content retained: %d/%d" % (len(MUST_KEEP), len(MUST_KEEP)))
    print("  forbidden language: none; ISO 42001 and DORA absent from the body")
    print("  hyperlinks preserved: %d" % links_after)
    print("  word count: %d" % words)
    print("\nwrote %s" % args.out)
    return 0


if __name__ == "__main__":
    sys.exit(main())
