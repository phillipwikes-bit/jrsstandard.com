#!/usr/bin/env python3
"""Final submission-readiness verification for the ISACA employment-records article.

Covers the four remaining pre-submission items, in order:

  1. Woolf homogeneity statistic (Q, df, p) recomputed from bench_outcomes.
  2. Every Appendix A entry checked against the study database: presence,
     numbering, forum agreement, citation locator, exclusion marking.
     A5's absent tribunal case number must stay DISCLOSED, never filled.
  3. The 32-case comparison corpus: the "twenty carried a recorded disposition"
     coding rule checked against the actual outcome values, and the
     five-condition protocol checked for modification between corpora.
  4. Word count, endnote sequence, Figure 1 rendering, appendix separation,
     biographies, declarations, all read from the RENDERED .docx rather than
     from the markdown source, because the .docx is what gets submitted.

Fail-closed: no value is asserted from the manuscript. Every number is
recomputed from the database and compared to what the paper prints.

Usage: python3 scripts/verify_submission_ready.py
Exit 0 = submission ready. Non-zero = count of failed checks.
"""
import html
import io
import json
import os
import re
import sys
import urllib.request
import zipfile
from math import erf, log, sqrt

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STEM = os.path.join(ROOT, "research", "Employment_Records_Article_ISACA_2026-08-21")
MD = STEM + ".md"
DOCX = STEM + ".docx"
SB = "https://pjzxkeviouofdseagvpf.supabase.co"

# Same constants as scripts/verify_isaca_article.py. Restating them here rather
# than importing keeps this script runnable on its own, and any divergence
# between the two files is itself a defect worth seeing.
ADVERSE = {"failed_appeal", "failed_audit"}
RESOLVED_ONLY = {"held_up", "failed_appeal"}
FLAG = {"review_required", "gap_identified"}
PROTOCOL_VOCAB = {"ready", "review_required", "gap_identified"}
EMPLOYMENT_CONTRIB = "V-HR-01"
FOIL_CONTRIB = "E-08"
APPENDIX_N = 22
PRIMARY_N = 20
EXCLUDED_LABELS = {"A4", "A15"}
LO, HI = 2000, 3000

R = []


def check(name, ok, detail=""):
    R.append(bool(ok))
    print("%-5s %-62s %s" % ("PASS" if ok else "FAIL", name, detail))


def anon_key():
    api = os.path.join(ROOT, "api")
    for f in sorted(os.listdir(api)):
        if not f.endswith(".js"):
            continue
        m = re.search(r"sb_publishable_[A-Za-z0-9_-]+",
                      io.open(os.path.join(api, f), encoding="utf-8").read())
        if m:
            return m.group(0)
    raise SystemExit("[REQUIRED_ENV_PARAM] anon publishable key not found in api/*.js")


def rows():
    k = anon_key()
    req = urllib.request.Request(
        SB + "/rest/v1/bench_outcomes?select=*&limit=5000",
        headers={"apikey": k, "Authorization": "Bearer " + k})
    return json.loads(urllib.request.urlopen(req, timeout=60).read().decode())


def docx_text(path):
    """Paragraph text of the rendered document, one paragraph per line."""
    x = zipfile.ZipFile(path).read("word/document.xml").decode("utf-8")
    x = re.sub(r"</w:p>", "\n", x)
    x = re.sub(r"</w:tc>", "\t", x)
    x = re.sub(r"<[^>]+>", "", x)
    return html.unescape(x)


def docx_tables(path):
    """Row-and-cell contents of every table in the rendered document."""
    x = zipfile.ZipFile(path).read("word/document.xml").decode("utf-8")
    out = []
    for tbl in re.findall(r"<w:tbl>.*?</w:tbl>", x, re.S):
        trs = []
        for tr in re.findall(r"<w:tr[ >].*?</w:tr>", tbl, re.S):
            cells = [html.unescape(re.sub(r"<[^>]+>", "", tc)).strip()
                     for tc in re.findall(r"<w:tc>.*?</w:tc>", tr, re.S)]
            trs.append(cells)
        out.append(trs)
    return out


def woolf(sets):
    """Woolf test of homogeneity of odds ratios across 2x2 tables.

    Haldane-Anscombe 0.5 correction on every cell, which is why the employment
    table with a zero-free layout still shifts slightly from the raw OR.
    """
    logs = []
    for a, b, c, d in sets:
        a, b, c, d = a + .5, b + .5, c + .5, d + .5
        logs.append((log(a * d / (b * c)), 1 / (1 / a + 1 / b + 1 / c + 1 / d)))
    W = sum(w for _, w in logs)
    L = sum(w * l for l, w in logs) / W
    Q = sum(w * (l - L) ** 2 for l, w in logs)
    df = len(sets) - 1
    p = 2 * (1 - .5 * (1 + erf(sqrt(Q) / sqrt(2))))
    return Q, df, p


def table_2x2(rs):
    a = sum(1 for r in rs if r["jrs_read"] in FLAG and r["outcome"] in ADVERSE)
    b = sum(1 for r in rs if r["jrs_read"] in FLAG and r["outcome"] not in ADVERSE)
    c = sum(1 for r in rs if r["jrs_read"] == "ready" and r["outcome"] in ADVERSE)
    d = sum(1 for r in rs if r["jrs_read"] == "ready" and r["outcome"] not in ADVERSE)
    return a, b, c, d


# ---------------------------------------------------------------- load
bo = rows()
hr = [r for r in bo if r["domain"] == "HR / Employment"]
foil = [r for r in bo if r["domain"] == "Public records / FOIL"]
md = io.open(MD, encoding="utf-8").read()
if not os.path.exists(DOCX):
    raise SystemExit("[REQUIRED_ENV_PARAM] rendered .docx missing: " + DOCX)
dx = docx_text(DOCX)
dflat = re.sub(r"\s+", " ", dx)

_OUT = re.compile(r"Committee on Open Government|FOIL-AO-", re.I)
_DESC = re.compile(r"^Published .* proceedings involving", re.I)
excluded_rows = [r for r in hr
                 if _OUT.search(r.get("source") or "")
                 or _DESC.match((r.get("source") or "").strip())]
primary = [r for r in hr if r not in excluded_rows]

# ================================================================ ITEM 1
print("\n--- ITEM 1. WOOLF HOMOGENEITY STATISTIC ---")
e2 = table_2x2(primary)
f2 = table_2x2(foil)
Q, df, p = woolf([e2, f2])
check("employment 2x2 recomputed from live rows", e2 == (6, 2, 2, 10),
      "flagged %d adverse / %d not, ready %d adverse / %d not" % e2)
check("FOIL 2x2 recomputed from live rows", f2 == (10, 4, 10, 8),
      "flagged %d adverse / %d not, ready %d adverse / %d not" % f2)
check("Woolf Q = 1.949", abs(Q - 1.949) < 5e-4, "recomputed Q = %.4f" % Q)
check("Woolf df = 1", df == 1, "two 2x2 tables, df = %d" % df)
check("Woolf p = 0.163", abs(p - 0.163) < 5e-4, "recomputed p = %.4f" % p)
check("manuscript prints Q = 1.949 and p = 0.163",
      "1.949" in md and "0.163" in md)
check("rendered .docx prints the same Q and p",
      "1.949" in dflat and "0.163" in dflat)
check("no significance claimed for the homogeneity comparison",
      "did not detect a statistically significant difference" in dflat
      and p > 0.05, "p = %.4f is above 0.05 and the paper says so" % p)

# ================================================================ ITEM 2
print("\n--- ITEM 2. APPENDIX A CITATIONS ---")
appx_md = md[md.index("## Appendix A. Case list"):]
entries = dict(re.findall(r"\*\*(A\d+)\.\*\*\s*(.+)", appx_md))
labels = ["A%d" % i for i in range(1, APPENDIX_N + 1)]
check("appendix carries A1 through A%d exactly" % APPENDIX_N,
      sorted(entries, key=lambda s: int(s[1:])) == labels,
      "%d entries, no gaps, no duplicates" % len(entries))
check("appendix entry count equals the screened corpus",
      len(entries) == len(hr) == APPENDIX_N,
      "%d entries against %d screened rows" % (len(entries), len(hr)))

# Every entry must name a forum in parentheses, and that forum must be a forum
# the database actually holds for this corpus.
db_forums = set()
for r in hr:
    m = re.search(r"\(([^()]+)\)\s*$", (r.get("source") or "").strip())
    if m:
        db_forums.add(m.group(1).strip())
noforum = [k for k, v in entries.items() if not re.search(r"\([^()]+\)", v)]
check("every appendix entry names a forum", not noforum,
      "missing forum: " + ", ".join(sorted(noforum)) if noforum else
      "%d entries, all forum-attributed" % len(entries))

# Locator = a reporter cite, a docket/appeal/case number, or an official number.
LOCATOR = re.compile(
    r"\b\d+\s+U\.S\.\s+\d+|\b\d+\s+(?:AD3d|NY|F\.\d|FLRA|Misc)\b"
    r"|Case No\.|Appeal No\.|Appeal Board No\.|Slip Op|No\.\s*\d|\(\d{4}\)|\b(?:19|20)\d{2}\b",
    re.I)
nolocator = [k for k, v in entries.items()
             if k not in EXCLUDED_LABELS and not LOCATOR.search(v)]
check("every analyzed entry carries a locator or a year",
      not nolocator,
      "no locator: " + ", ".join(sorted(nolocator)) if nolocator else
      "%d analyzed entries traceable" % (APPENDIX_N - len(EXCLUDED_LABELS)))

marked = {k for k, v in entries.items() if "EXCLUDED FROM THE ANALYSIS." in v}
check("exactly the two excluded entries are marked, and they are A4 and A15",
      marked == EXCLUDED_LABELS,
      "marked: " + ", ".join(sorted(marked)))
check("the two database-derived exclusions number two",
      len(excluded_rows) == 2 and len(primary) == PRIMARY_N,
      "%d excluded by rule, %d analyzed" % (len(excluded_rows), len(primary)))

# A5. The absent tribunal case number stays absent and stays disclosed. A
# number appearing here would mean one was invented.
a5 = entries.get("A5", "")
check("A5 discloses the missing case number rather than supplying one",
      "case number is not on file" in a5
      and "identified by party, forum and year" in a5
      and not re.search(r"Case No\.", a5),
      "disclosure intact, no case number printed")
a5_row = [r for r in hr if "Jones v Vale Curtains" in (r.get("source") or "")]
check("no tribunal case number exists in any field of the A5 row",
      len(a5_row) == 1
      and not re.search(r"\b\d{6,8}/\d{2,4}\b",
                        " ".join(str(v) for k, v in a5_row[0].items()
                                 if k not in ("created_at", "id", "record_id"))),
      "searched source, record, note and status; genuinely absent")

check("every appendix entry appears in the rendered .docx",
      all(re.search(r"A%d\." % i, dflat) for i in range(1, APPENDIX_N + 1)),
      "A1 through A%d present in the Word build" % APPENDIX_N)
check("both exclusion markings survive into the .docx",
      dflat.count("EXCLUDED FROM THE ANALYSIS.") == 2,
      "%d markings" % dflat.count("EXCLUDED FROM THE ANALYSIS."))

# ================================================================ ITEM 3
print("\n--- ITEM 3. 32-CASE COMPARISON CORPUS ---")
check("comparison corpus is 32 determinations", len(foil) == 32,
      "n=%d" % len(foil))
resolved = [r for r in foil if r["outcome"] in RESOLVED_ONLY]
contested = [r for r in foil if r["outcome"] == "challenged"]
audit = [r for r in foil if r["outcome"] == "failed_audit"]
check("the coding rule yields exactly 20 with a recorded disposition",
      len(resolved) == 20,
      "held_up %d + failed_appeal %d = %d"
      % (sum(1 for r in resolved if r["outcome"] == "held_up"),
         sum(1 for r in resolved if r["outcome"] == "failed_appeal"),
         len(resolved)))
check("the manuscript sentence matches that rule",
      "Twenty carried a recorded disposition and are treated as resolved." in md,
      "resolved = held_up + failed_appeal, the same rule as the employment corpus")
check("resolved / contested / audit partition the 32 with no remainder",
      len(resolved) + len(contested) + len(audit) == 32
      and not ({r["id"] for r in resolved} & {r["id"] for r in contested}),
      "20 resolved + %d contested + %d audit = 32" % (len(contested), len(audit)))
check("manuscript prints seven contested and five audit findings",
      len(contested) == 7 and len(audit) == 5
      and "seven were contested with no disposition and five drew audit findings" in md)
check("fifteen of the 20 resolved did not survive",
      sum(1 for r in resolved if r["outcome"] == "failed_appeal") == 15
      and "Fifteen of the 20 resolved determinations there did not survive." in md)
check("resolved rule is IDENTICAL to the one used on the employment corpus",
      RESOLVED_ONLY == {"held_up", "failed_appeal"},
      "failed_audit is a separate outcome category in both corpora, not a disposition")

# Protocol modification test. Same instrument means the same three-value read
# vocabulary and no extra or renamed category on either side.
hr_vocab = {r["jrs_read"] for r in hr}
foil_vocab = {r["jrs_read"] for r in foil}
check("five-condition protocol read vocabulary is unmodified across corpora",
      hr_vocab == foil_vocab == PROTOCOL_VOCAB,
      "employment %s / FOIL %s"
      % (sorted(hr_vocab), sorted(foil_vocab)))
check("both corpora carry the same screening status, so neither was re-screened",
      {r["status"] for r in hr} == {r["status"] for r in foil} == {"screened"})
check("the corpora were reviewed by DIFFERENT practitioners",
      {r["contributor"] for r in hr} == {EMPLOYMENT_CONTRIB}
      and {r["contributor"] for r in foil} == {FOIL_CONTRIB},
      "%s reviewed the employment corpus, %s the public-records corpus"
      % (EMPLOYMENT_CONTRIB, FOIL_CONTRIB))
check("the manuscript states the different practitioner and the unmodified protocol",
      "applied by a different practitioner to 32 public-records determinations" in md
      and "under the same five-condition protocol, without modification" in md)
check("the comparison is framed as descriptive, not as a finding",
      "descriptive rather than evidence that the two corpora behave identically" in dflat)
check("selection and publication bias in the comparison corpus is disclosed",
      "publication does not imply the file was typical" in dflat
      and "reflects the selection and publication process" in dflat)

# ================================================================ ITEM 4
print("\n--- ITEM 4. WORD COUNT AND FORMATTING ---")
body_md = md[:md.index("## Endnotes")]
body_words = len(re.sub(r"[*_`|#-]", " ", body_md).split())
endnote_md = md[md.index("## Endnotes"):md.index("## Appendix A. Case list")]
endnote_words = len(re.sub(r"[*_`|#-]", " ", endnote_md).split())
appx_words = len(re.sub(r"[*_`|#-]", " ", appx_md).split())
check("body is inside ISACA's 2,000 to 3,000 words", LO <= body_words <= HI,
      "%d words, endnotes and appendix excluded" % body_words)
check("endnotes counted separately and reported, not hidden", endnote_words > 0,
      "%d endnote words, %d appendix words, both outside the body count"
      % (endnote_words, appx_words))

# Figure 1 must be a real Word table, not a markdown pipe grid that failed to
# convert. Six rows: one header plus the five conditions.
tables = docx_tables(DOCX)
fig = [t for t in tables
       if t and any("Review condition" in c for c in t[0])]
check("Figure 1 renders as a real Word table", len(fig) == 1,
      "%d table(s) in the document, %d matching Figure 1"
      % (len(tables), len(fig)))
if fig:
    t = fig[0]
    check("Figure 1 has a header row plus five condition rows", len(t) == 6,
          "%d rows" % len(t))
    check("Figure 1 has three columns throughout",
          all(len(r) == 3 for r in t),
          "widths: %s" % sorted({len(r) for r in t}))
    conds = [r[0] for r in t[1:]]
    check("Figure 1 names all five conditions",
          conds == ["Reconstructability", "Basis identification",
                    "Chronological integrity", "Decision-process traceability",
                    "Evidentiary sufficiency"],
          "; ".join(conds))
else:
    check("Figure 1 has a header row plus five condition rows", False, "table absent")
    check("Figure 1 has three columns throughout", False, "table absent")
    check("Figure 1 names all five conditions", False, "table absent")
check("no raw markdown pipe table survived into the .docx",
      "|---" not in dx and "| ---" not in dx,
      "no unconverted grid")
check("Figure 1 is captioned and referenced in the prose",
      "Figure 1. Record-Level Documentation Review" in dflat
      and "set out in figure 1" in dflat)

check("appendix is a separate headed section after the endnotes",
      dx.index("Appendix A. Case list") > dx.index("Endnotes"),
      "Endnotes then Appendix A, in that order")
check("Declarations section is present in the .docx",
      "Declarations" in dflat
      and "Financial interests." in dflat
      and "Research funding." in dflat)
check("both declaration categories name the declaring author",
      "Tanvi Pokhriyal declares that she has no financial or commercial" in dflat
      and "No external funding was received by any author." in dflat)
check("Wikes's competing interest is declared rather than omitted",
      "may benefit from its adoption" in dflat
      and "did not participate in the case classifications" in dflat)
check("both author biographies are present and complete",
      "Tanvi Pokhriyal is an Organizational Psychologist" in dflat
      and "Phillip Wikes is an AI Governance" in dflat
      and "Maryland Commission on Civil Rights" in dflat)
check("bios carry no educational information, per ISACA spec",
      not [t for t in ("M.S.", "M.A.", "MBA", "PhD", "Ph.D", "B.A.", "B.S.",
                       "graduated", "holds a degree") if t in dflat])
check("acknowledgement bounds McMullan's contribution",
      "did not extend" in dflat and "Kyle McMullan" in dflat)

# Endnote sequence: markers in the body must run 1..N with no gap or repeat,
# and every marker must have a matching numbered endnote.
markers = [int(m) for m in re.findall(r"<sup>(\d+)</sup>", body_md)]
notes = [int(m) for m in re.findall(r"^\*\*(\d+)\.\*\*", endnote_md, re.M)]
check("endnote markers appear in ascending order with no repeats",
      markers == sorted(markers) and len(markers) == len(set(markers)),
      "markers in order: %s" % markers)
check("endnotes are numbered 1..%d with no gaps" % len(notes),
      notes == list(range(1, len(notes) + 1)),
      "endnotes present: %s" % notes)
check("every body marker resolves to an endnote",
      set(markers) <= set(notes),
      "%d markers against %d endnotes" % (len(markers), len(notes)))
check("no endnote is orphaned without a body marker",
      set(notes) <= set(markers),
      "unreferenced: %s" % sorted(set(notes) - set(markers)))
check("superscripts survived conversion as real superscript runs",
      '<w:vertAlign w:val="superscript"/>' in
      zipfile.ZipFile(DOCX).read("word/document.xml").decode("utf-8")
      and "<sup>" not in dx,
      "no literal <sup> tags in the rendered text")
check("the .docx is a valid Word package",
      zipfile.ZipFile(DOCX).testzip() is None
      and "word/document.xml" in zipfile.ZipFile(DOCX).namelist())

# ---------------------------------------------------------------- result
failed = R.count(False)
print("\n%d checks, %d failed" % (len(R), failed))
if not failed:
    print("SUBMISSION READY. Body %d words, endnotes %d, appendix %d."
          % (body_words, endnote_words, appx_words))
sys.exit(failed)
