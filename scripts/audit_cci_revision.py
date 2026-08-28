#!/usr/bin/env python3
"""Audit the CCI resubmission against the editor's brief and the prior draft.

The editor, Jennifer Gaskin, named four topics CCI has already covered and one
frame she wants instead. That is a testable specification, so it is tested here
rather than judged by eye.

  OVERLAPS she named, which must not dominate the piece:
      AI-generated records; what a file says versus what it can prove;
      ISO 42001/NIST as scaffolding rather than safe harbour; Mobley v. Workday.

  FRAME she asked for, which must be present and must lead:
      pretext, burden-shifting, and AI-drafted records read side by side
      across a workforce.

IT ALSO GUARDS THE CO-AUTHOR'S SECTION. Hekim Colpan is a certified ISO/IEC
42001 auditor and the European material carries his byline. Any change to it is
his to approve, so this reports what changed rather than asserting nothing did.

    python3 scripts/audit_cci_revision.py
"""
import io
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NEW = os.path.join(ROOT, "research", "Evidentiary_Deficit_CCI_RESUBMISSION_2026-08-28_REV2.md")
PRIOR = os.path.join(ROOT, "research", "Evidentiary_Deficit_CCI_RESUBMISSION_MASTER_20260828.md")
HEKIM = os.path.join(ROOT, "research", "Evidentiary_Deficit_Article_Hekim_Version_rev2026-08-18.md")

# Present and load-bearing.
REQUIRED = [
    ("pretext", r"\bpretext"),
    ("burden-shifting", r"burden-shifting"),
    ("McDonnell Douglas", r"McDonnell Douglas"),
    ("side-by-side", r"[Ss]ide.by.side|side by side"),
    ("across a workforce", r"across employees|across a workforce|across records"),
    ("disparate treatment and impact kept distinct", r"remain distinct theories"),
    ("no discrimination claim asserted", r"None establishes discrimination by itself"),
    ("JRS framed as undergoing validation", r"undergoing structured validation"),
    ("right to know why disclaimed", r"not a legal doctrine"),
]

# Absent, or present only as a minor note.
CAPPED = [
    ("Mobley v. Workday", r"Mobley|Workday", 0),
    ("NIST", r"\bNIST\b", 0),
    ("ISO/IEC 42001 outside the author bio", r"ISO/?\s?(IEC)?\s?42001", 1),
]

BANNED = [
    ("peer-reviewed", r"peer[- ]reviewed"),
    ("validated as a completed claim", r"\bis validated\b|\bfully validated\b"),
    ("proves", r"\bproves\b"),
    ("guarantee", r"guarantee"),
    ("detects bias or intent", r"detects? (bias|intent)"),
    ("em dash", r"—"),
    ("stray GDPR token", r"systems\. GDPR|it to\. GDPR"),
    ("collapsed sentence spacing", r"[a-z]\.[A-Z]|\?[A-Z]"),
    ("dangling repeated citation", r"pretextual\. McDonnell Douglas"),
    ("run-together numbered list", r"\d\. [A-Z][^\n]{10,}\d\. [A-Z]"),
]


def read(p):
    return io.open(p, encoding="utf-8").read()


def sections(md):
    out, cur, buf = {}, "(front matter)", []
    for line in md.split("\n"):
        m = re.match(r"^##\s+(.*)$", line)
        if m:
            out[cur] = "\n".join(buf)
            cur, buf = m.group(1).strip(), []
        else:
            buf.append(line)
    out[cur] = "\n".join(buf)
    return out


def main():
    new = read(NEW)
    flat = re.sub(r"\s+", " ", new)
    prior = read(PRIOR)
    problems = []

    print("EDITOR'S FRAME, must be present")
    for label, pat in REQUIRED:
        ok = re.search(pat, flat) is not None
        print("  %-46s %s" % (label, "present" if ok else "MISSING"))
        if not ok:
            problems.append("missing: %s" % label)
    print()

    print("EDITOR'S OVERLAPS, must be absent or capped")
    for label, pat, cap in CAPPED:
        n = len(re.findall(pat, flat, re.I))
        ok = n <= cap
        print("  %-46s %d (cap %d) %s" % (label, n, cap, "" if ok else "OVER"))
        if not ok:
            problems.append("%s appears %d times, cap %d" % (label, n, cap))
    print()

    print("BANNED VOCABULARY AND FORMATTING DEFECTS")
    for label, pat in BANNED:
        n = len(re.findall(pat, new))
        print("  %-46s %d" % (label, n))
        if n:
            problems.append("%s: %d occurrence(s)" % (label, n))
    print()

    secs = sections(new)
    total = len(new.split())
    euro = [k for k in secs if "Europe" in k]
    core = [k for k in secs if k in ("When the stated reason becomes the issue",
                                     "Pretext starts with the record",
                                     "The pattern may appear only across employees",
                                     "What a defensible employment record should show")]
    cw = sum(len(secs[k].split()) for k in core)
    ew = sum(len(secs[k].split()) for k in euro)
    print("BALANCE, the editor asked for a piece FOCUSED on the employment frame")
    print("  total words                                    %d" % total)
    print("  employment core                                %d  %.1f%%" % (cw, 100.0 * cw / total))
    print("  European note                                  %d  %.1f%%" % (ew, 100.0 * ew / total))
    if cw <= ew:
        problems.append("the European note is not smaller than the employment core")
    if 100.0 * ew / total > 12.0:
        problems.append("the European note is %.1f%% of the piece, over the 12%% cap"
                        % (100.0 * ew / total))
    print()

    # What changed in the co-author's material, reported not asserted.
    hek = read(HEKIM)
    m = re.search(r"## V\. Data Protection.*?(?=## VI\.)", hek, re.S)
    horig = re.sub(r"\s+", " ", m.group(0)).strip()
    enew = re.sub(r"\s+", " ", " ".join(secs[k] for k in euro)).strip()
    import difflib
    print("CO-AUTHOR'S SECTION, change report for his approval")
    print("  Hekim's original Section V                     %d words" % len(horig.split()))
    # The prior draft is a flat docx extraction with no "## " headings, so
    # sections() finds nothing and reported 0 words. Locate its European block
    # by content instead: from the heading line to the next blank-line boundary.
    pm = re.search(r"The European frame(.*?)(?=\n\nA pre-finalization)", prior, re.S)
    pw = len(re.sub(r"\s+", " ", pm.group(1)).split()) if pm else 0
    print("  prior resubmission draft                       %d words" % pw)
    print("  this revision                                  %d words" % len(enew.split()))
    print("  similarity to his original                     %.3f"
          % difflib.SequenceMatcher(None, horig, enew).ratio())
    print("  CITATIONS RETAINED FROM HIS TEXT:")
    for cite in ("Article 5(2)", "Regulation (EU) 2026/1744", "Annex III",
                 "2 December 2027", "Annex I", "2 August 2028"):
        print("    %-34s %s" % (cite, "kept" if cite in enew else "REMOVED"))
    print("  CITATIONS DROPPED, each requires his sign-off:")
    for cite in ("Article 30", "ISO/IEC 42001", "DORA"):
        if cite not in enew:
            print("    %s" % cite)
    print()

    print("%d problem(s)" % len(problems))
    for p in problems:
        print("  " + p)
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())
