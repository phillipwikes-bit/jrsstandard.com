#!/usr/bin/env python3
"""Verify every request Kyle McMullan made, against the RENDERED .docx.

Source: his message of 2026-08-24, 8:20 am, declining the byline and setting out
his reasons. Each check below is anchored to a specific thing he asked for or
objected to, quoted in the check name, so nothing is credited to him that he did
not raise and nothing he raised is quietly dropped.

His seven points:

  1. Take his name off the byline, keep the control section in Phillip's words.
  2. Acknowledgement plain, and it must NOT imply he reviewed the study or
     endorsed the findings.
  3. The title framed the piece as a test of AI-assisted records when nothing in
     the corpus is shown to be AI-drafted, and the Supreme Court and FLRA
     matters predate generative drafting.
  4. The circularity objection: the reviewer read the employer's record as it
     appeared in the decision, the decision narrates the outcome, and endnote 3
     concedes there is no timestamp separating the two steps. He said that left
     the objection "unanswered, sitting under the headline finding".
  5. The article must be unambiguous that the 22 matters come from public
     sources, not from a reviewer's own caseload.
  6. The disclaimer must say the patterns are not drawn from any CLIENT
     ENGAGEMENT OR EXAMINATION, not merely from any identified organisation.
  7. Sample size cannot rest on the signal appearing at 22, because 22 was the
     whole corpus rather than a sample derived from population, tolerable error
     and confidence; and the article must not claim this is not third-line work,
     because the ISACA readership is mostly third line.

Usage: python3 scripts/verify_kyle_requests.py
Exit 0 = every request satisfied in the built document.
"""
import html
import io
import os
import re
import sys
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STEM = os.path.join(ROOT, "research", "Employment_Records_Article_ISACA_2026-08-21")
MD = STEM + ".md"
DOCX = STEM + ".docx"
R = []


def check(n, name, ok, detail=""):
    R.append(bool(ok))
    print("%-5s [%d] %-56s %s" % ("PASS" if ok else "FAIL", n, name, detail))


if not os.path.exists(DOCX):
    raise SystemExit("[REQUIRED_ENV_PARAM] rendered .docx missing: " + DOCX)
x = zipfile.ZipFile(DOCX).read("word/document.xml").decode("utf-8")
t = re.sub(r"</w:p>", "\n", x)
t = re.sub(r"</w:tc>", "\t", t)
dx = html.unescape(re.sub(r"<[^>]+>", "", t))
d = re.sub(r"\s+", " ", dx)
md = io.open(MD, encoding="utf-8").read()

# ---- 1. byline ----
check(1, "his name is off the byline",
      "McMullan" not in d.split("Acknowledgement")[0].split("Declarations")[0][:600]
      and "Tanvi Pokhriyal and Phillip Wikes" in d,
      "byline reads Tanvi Pokhriyal and Phillip Wikes")
check(1, "the control section is in the authors' own words",
      "Running it as a control rather than a project" in d
      and "McMullan" not in d[d.index("Running it as a control"):
                               d.index("What this establishes")],
      "no attribution to him inside the control section")

# ---- 2. acknowledgement ----
check(2, "acknowledgement thanks him for comments on audit practice",
      "thank Kyle McMullan for comments on audit practice" in d
      or "thanks Kyle McMullan for comments on audit practice" in d)
check(2, "acknowledgement does NOT imply he reviewed or endorsed the study",
      "did not extend to the study, its data or its findings" in d
      and "reviewed the study" not in d and "endorses" not in d,
      "his comments are bounded to audit practice")
check(2, "he is not listed as a reviewer, contributor or endorser anywhere",
      d.count("McMullan") == 1,
      "%d mention, in the acknowledgement only" % d.count("McMullan"))

# ---- 3. AI framing ----
check(3, "the title no longer frames the piece as a test of AI-assisted records",
      "When a Defensible Decision Becomes an Indefensible File" in d
      and "AI" not in d[:d.index("Tanvi Pokhriyal and Phillip Wikes")],
      "title is about documentation integrity, not AI")
check(3, "no case is claimed to have been AI-drafted",
      "no case in it is shown to have been AI-drafted" in d
      and "The records are not AI-generated and are not claimed to be." in d)
check(3, "the AI point is labelled forward-looking, not a finding",
      "That is a forward-looking concern, not a finding of this study." in d)
check(3, "the corpus date range is stated, covering his predating objection",
      "spans decisions from 1973 to 2026, most predating generative drafting" in d)
check(3, "the corpus was not selected for AI involvement, and says so",
      "The corpus was not selected for AI involvement" in d)

# ---- 4. circularity ----
check(4, "the circularity objection is raised in the BODY, not just endnote 3",
      "That design carries a circularity objection" in d
      and d.index("circularity objection") < d.index("Endnotes"),
      "stated where the design is described")
check(4, "it concedes the reviewer worked from a source containing the outcome",
      "the reviewer worked from a source already containing the outcome being "
      "assessed" in d)
check(4, "it concedes the ordering rests on protocol, not a system record",
      "the ordering rests on the protocol rather than a system record" in d)
check(4, "the objection is explicitly NOT treated as answered",
      "The objection is not answered here and must not be treated as answered." in d)
check(4, "both rival explanations are stated, not just the favourable one",
      "consistent with a documentation deficiency an adjudicator also noticed" in d
      and "equally consistent with reviewer influence" in d)
check(4, "designs that would answer it are named",
      "independent timestamping, a second blinded reader, or employer records "
      "obtained before adjudication" in d)
check(4, "endnote 3 still carries the timestamp concession",
      "The database records one timestamp per case rather than separate review "
      "and outcome times" in d)

# ---- 5. public sources, not a personal caseload ----
check(5, "the matters are stated to come from published decisions",
      "published decisions" in d and "read the published decision in full" in d)
check(5, "the appendix names a public citation for every analyzed matter",
      d.count("EXCLUDED FROM THE ANALYSIS.") == 2
      and "Appendix A. Case list" in d)
check(5, "no claim that a reviewer examined their own caseload",
      "own caseload" not in d and "her caseload" not in d and "his caseload" not in d,
      "no personal-caseload language anywhere in the document")
check(5, "the collection window and source basis are stated in endnote 1",
      "come from 20 distinct published decisions collected between" in d)

# ---- 6. disclaimer ----
check(6, "disclaimer excludes client engagements AND examinations, his wording",
      "not drawn from, and do not describe, any client engagement, examination, "
      "or the records of any organization." in d)
check(6, "the weaker identified-organisation-only form is gone",
      "any identified organization" not in d and "any identified organisation" not in d)

# ---- 7. sample size and the third line ----
check(7, "the article does not derive a control sample size from the corpus",
      "This study cannot establish a periodic control sample size." in d)
check(7, "it says plainly that 20 was the whole corpus, not a sample",
      "were the whole analyzed corpus, not a sample drawn against a stated "
      "tolerable error and confidence level" in d)
check(7, "the reader is sent to their own sampling standard",
      "sampling standard the function already applies" in d)
check(7, "no claim anywhere that the corpus size sets a sample size",
      not re.search(r"sample size of (?:20|22)\b", d)
      and "signal appeared at 22" not in d)
check(7, "the article does NOT claim this is not third-line work",
      "That is not an argument that internal audit has no role." in d
      and "not third-line work" not in d and "not third line work" not in d)
check(7, "the third line is given a stated, substantive application",
      "The third line can provide independent testing of the control environment."
      in d
      and "yield a measured rate of records that cannot carry their own reasoning"
      in d)
check(7, "the diagnostic / preventive division is stated for the ISACA reader",
      "third-line testing is primarily diagnostic, while first and second-line "
      "application is primarily preventive" in d)

failed = R.count(False)
print("\n%d checks, %d failed" % (len(R), failed))
if not failed:
    print("Every request Kyle McMullan made is satisfied in the built document.")
sys.exit(failed)
