#!/usr/bin/env python3
"""INDEPENDENT verification of the Woolf statistic, Appendix A, and ISACA format.

Independence is the point. scripts/verify_isaca_article.py and
scripts/verify_submission_ready.py both compute Q with the SAME weighted-variance
routine, so agreement between them proves only that one function is
deterministic. This script recomputes Q by four structurally different routes
and p by three different algorithms, none of which shares code with the
existing verifiers, and cross-checks the cells against the counts printed in
the manuscript prose rather than against a constant in another script.

No third-party library is available in this environment (no numpy, no scipy),
so every numerical routine is implemented here from first principles. That is
stronger for this purpose than importing one library twice.

  ITEM 1  Woolf Q by four routes, p by three algorithms, plus a seeded
          permutation test and the uncorrected-Q sensitivity.
  ITEM 2  All 22 Appendix A entries matched ENTRY BY ENTRY to their database
          row, with the corpus reconciliation recomputed.
  ITEM 3  ISACA submission format read from the rendered .docx.

Usage: python3 scripts/independent_woolf_check.py
Exit 0 = every route agrees and every check passes.
"""
import html
import io
import json
import os
import re
import sys
import urllib.request
import zipfile
from decimal import Decimal, getcontext
from fractions import Fraction
from math import erf, exp, lgamma, log, sqrt

getcontext().prec = 60

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STEM = os.path.join(ROOT, "research", "Employment_Records_Article_ISACA_2026-08-21")
MD = STEM + ".md"
DOCX = STEM + ".docx"
SB = "https://pjzxkeviouofdseagvpf.supabase.co"

PRINTED_Q = 1.949
PRINTED_P = 0.163
TOL = 5e-4
R = []


def check(name, ok, detail=""):
    R.append(bool(ok))
    print("%-5s %-60s %s" % ("PASS" if ok else "FAIL", name, detail))


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


def get(path):
    k = anon_key()
    req = urllib.request.Request(SB + path,
                                 headers={"apikey": k, "Authorization": "Bearer " + k})
    return json.loads(urllib.request.urlopen(req, timeout=60).read().decode())


# ===================================================================== NUMERICS
def log_or_and_weight(a, b, c, d, corr=0.5):
    """log odds ratio and inverse-variance weight for one 2x2 table."""
    a, b, c, d = a + corr, b + corr, c + corr, d + corr
    L = log(a * d / (b * c))
    V = 1 / a + 1 / b + 1 / c + 1 / d
    return L, 1 / V, V


def q_route_weighted_variance(tables, corr=0.5):
    """Route A. Q = sum w_i (L_i - Lbar)^2, the textbook Woolf form."""
    lw = [log_or_and_weight(*t, corr=corr) for t in tables]
    W = sum(w for _, w, _ in lw)
    Lbar = sum(w * L for L, w, _ in lw) / W
    return sum(w * (L - Lbar) ** 2 for L, w, _ in lw)


def q_route_algebraic(tables, corr=0.5):
    """Route B. Q = sum w_i L_i^2 - (sum w_i L_i)^2 / sum w_i.

    Algebraically identical to route A but computed without ever forming the
    residuals, so a mistake in the mean would show up as disagreement.
    """
    lw = [log_or_and_weight(*t, corr=corr) for t in tables]
    S0 = sum(w for _, w, _ in lw)
    S1 = sum(w * L for L, w, _ in lw)
    S2 = sum(w * L * L for L, w, _ in lw)
    return S2 - S1 * S1 / S0


def q_route_two_group_z(tables, corr=0.5):
    """Route C. For k = 2 only: Q = (L1 - L2)^2 / (V1 + V2).

    This is the squared Z statistic for the difference of two independent log
    odds ratios. It reaches the same number through the difference rather than
    through a weighted mean, which is a genuinely different derivation.
    """
    if len(tables) != 2:
        raise ValueError("route C applies to exactly two tables")
    (L1, _, V1), (L2, _, V2) = [log_or_and_weight(*t, corr=corr) for t in tables]
    return (L1 - L2) ** 2 / (V1 + V2)


def q_route_high_precision(tables, corr=Fraction(1, 2)):
    """Route D. Exact rational cell arithmetic with 60-digit Decimal logs.

    Rules out the possibility that the agreement of routes A to C is an
    artifact of binary floating point rather than of the mathematics.
    """
    Ls, Ws = [], []
    for a, b, c, d in tables:
        a, b, c, d = (Fraction(a) + corr, Fraction(b) + corr,
                      Fraction(c) + corr, Fraction(d) + corr)
        ratio = Decimal(( a * d).numerator) / Decimal((a * d).denominator) \
            / (Decimal((b * c).numerator) / Decimal((b * c).denominator))
        L = ratio.ln()
        V = sum(Decimal(x.denominator) / Decimal(x.numerator) for x in (a, b, c, d))
        Ls.append(L)
        Ws.append(Decimal(1) / V)
    W = sum(Ws)
    Lbar = sum(w * L for L, w in zip(Ls, Ws)) / W
    return sum(w * (L - Lbar) ** 2 for L, w in zip(Ls, Ws))


def p_route_erf(Q):
    """Algorithm 1. chi-square on 1 df is Z^2, so p = 2 * (1 - Phi(sqrt(Q)))."""
    return 2 * (1 - .5 * (1 + erf(sqrt(Q) / sqrt(2))))


def p_route_incomplete_gamma(Q, df=1):
    """Algorithm 2. Upper regularized incomplete gamma Q(df/2, Q/2).

    Lentz continued fraction for the upper tail, series for the lower tail.
    Shares no code path with the erf route.
    """
    a, x = df / 2.0, Q / 2.0
    if x <= 0:
        return 1.0
    if x < a + 1:                       # series for P(a, x), return 1 - P
        term = 1.0 / a
        s = term
        n = 0
        while True:
            n += 1
            term *= x / (a + n)
            s += term
            if abs(term) < abs(s) * 1e-18 or n > 10000:
                break
        return 1.0 - s * exp(-x + a * log(x) - lgamma(a))
    tiny = 1e-300                        # Lentz continued fraction for Q(a, x)
    b = x + 1 - a
    c = 1 / tiny
    d = 1 / b
    h = d
    for i in range(1, 10001):
        an = -i * (i - a)
        b += 2
        d = an * d + b
        if abs(d) < tiny:
            d = tiny
        c = b + an / c
        if abs(c) < tiny:
            c = tiny
        d = 1 / d
        delta = d * c
        h *= delta
        if abs(delta - 1) < 1e-18:
            break
    return exp(-x + a * log(x) - lgamma(a)) * h


def p_route_simpson(Q, df=1, panels=2000000):
    """Algorithm 3. Composite Simpson integration of the chi-square density.

    Integrates the df=1 density from Q to a far upper limit under the
    substitution u = sqrt(t), which removes the 1/sqrt(t) singularity at the
    origin and makes the integrand smooth. Numerical, not analytic, so it
    agrees with the other two only if all three are right.

      f(t) = t^(-1/2) e^(-t/2) / (sqrt(2) Gamma(1/2)),  t = u^2, dt = 2u du
      => integrand in u becomes  2 e^(-u^2/2) / sqrt(2 pi)
    """
    if df != 1:
        raise ValueError("simpson route implemented for df = 1")
    lo, hi = sqrt(Q), sqrt(Q) + 40.0
    n = panels if panels % 2 == 0 else panels + 1
    h = (hi - lo) / n
    g = lambda u: 2 * exp(-u * u / 2) / sqrt(2 * 3.14159265358979323846)
    s = g(lo) + g(hi)
    for i in range(1, n):
        s += (4 if i % 2 else 2) * g(lo + i * h)
    return s * h / 3


def p_route_permutation(tables, observed_q, trials=200000, seed=20260824):
    """Sanity check, not a definitive p. Reshuffles classification labels within
    each corpus under the null that classification and outcome are independent,
    then measures how often the heterogeneity exceeds what was observed.

    Deterministic: a fixed-seed linear congruential generator, because
    Math.random-style nondeterminism would make the run unreproducible.
    """
    state = seed
    def rnd():
        nonlocal state
        state = (6364136223846793005 * state + 1442695040888963407) % (1 << 64)
        return (state >> 11) / float(1 << 53)

    pools = []
    for a, b, c, d in tables:
        flagged = [1] * (a + b)
        ready = [0] * (c + d)
        adverse = [1] * (a + c) + [0] * (b + d)
        pools.append((flagged + ready, adverse))

    hits = 0
    for _ in range(trials):
        sim = []
        for labels, adverse in pools:
            perm = adverse[:]
            for i in range(len(perm) - 1, 0, -1):
                j = int(rnd() * (i + 1))
                perm[i], perm[j] = perm[j], perm[i]
            aa = sum(1 for k in range(len(labels)) if labels[k] and perm[k])
            bb = sum(1 for k in range(len(labels)) if labels[k] and not perm[k])
            cc = sum(1 for k in range(len(labels)) if not labels[k] and perm[k])
            dd = sum(1 for k in range(len(labels)) if not labels[k] and not perm[k])
            sim.append((aa, bb, cc, dd))
        if q_route_weighted_variance(sim) >= observed_q:
            hits += 1
    return hits / float(trials)


# ===================================================================== LOAD
hr = get("/rest/v1/bench_outcomes?select=*&domain=eq.HR%20/%20Employment"
         "&order=created_at.asc&limit=500")
foil = get("/rest/v1/bench_outcomes?select=*&domain=eq.Public%20records%20/%20FOIL"
           "&order=created_at.asc&limit=500")
md = io.open(MD, encoding="utf-8").read()

xdoc = zipfile.ZipFile(DOCX).read("word/document.xml").decode("utf-8")
_t = re.sub(r"</w:p>", "\n", xdoc)
_t = re.sub(r"</w:tc>", "\t", _t)
dx = html.unescape(re.sub(r"<[^>]+>", "", _t))
dflat = re.sub(r"\s+", " ", dx)

# Cells derived here from the rule as the manuscript states it, written out
# inline rather than imported, so this script does not inherit another file's
# definition of "adverse".
ADVERSE = {"failed_appeal", "failed_audit"}
FLAGGED = {"review_required", "gap_identified"}
_OUT = re.compile(r"Committee on Open Government|FOIL-AO-", re.I)
_DESC = re.compile(r"^Published .* proceedings involving", re.I)
excluded = [r for r in hr if _OUT.search(r.get("source") or "")
            or _DESC.match((r.get("source") or "").strip())]
primary = [r for r in hr if r not in excluded]


def cells(rows):
    a = sum(1 for r in rows if r["jrs_read"] in FLAGGED and r["outcome"] in ADVERSE)
    b = sum(1 for r in rows if r["jrs_read"] in FLAGGED and r["outcome"] not in ADVERSE)
    c = sum(1 for r in rows if r["jrs_read"] == "ready" and r["outcome"] in ADVERSE)
    d = sum(1 for r in rows if r["jrs_read"] == "ready" and r["outcome"] not in ADVERSE)
    return a, b, c, d


E, F = cells(primary), cells(foil)
TABLES = [E, F]

# ===================================================== ITEM 1: WOOLF
print("\n=== ITEM 1. INDEPENDENT WOOLF VERIFICATION ===")
print("employment 2x2 = %s   public-records 2x2 = %s" % (E, F))

# The cells are anchored to the prose, not to another script's constant.
# The counts appear in the results table, not in running prose, so the anchor
# is the rendered table row. Anchoring to a prose phrase that does not exist
# would have reported a manuscript defect where the defect was in this check.
_res = [t for t in re.findall(r"<w:tbl>.*?</w:tbl>", xdoc, re.S)
        if "Adverse finding" in re.sub(r"<[^>]+>", "", t)]
_restxt = re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", _res[0])) if _res else ""
check("employment cells match the counts printed in the results table",
      E == (6, 2, 2, 10) and len(_res) == 1
      and "Needs work or Gap (n = 8) 6 2 75.0%" in _restxt
      and "Ready (n = 12) 2 10 16.7%" in _restxt,
      "flagged %d/%d adverse, ready %d/%d adverse, table row-for-row"
      % (E[0], E[0] + E[1], E[2], E[2] + E[3]))
check("public-records cells reconcile with the endnote 6 partition",
      F == (10, 4, 10, 8) and sum(F) == 32,
      "flagged %d/%d adverse, ready %d/%d adverse, n = %d"
      % (F[0], F[0] + F[1], F[2], F[2] + F[3], sum(F)))

qa = q_route_weighted_variance(TABLES)
qb = q_route_algebraic(TABLES)
qc = q_route_two_group_z(TABLES)
qd = float(q_route_high_precision(TABLES))
print("  route A weighted variance   Q = %.10f" % qa)
print("  route B algebraic identity  Q = %.10f" % qb)
print("  route C two-group Z squared Q = %.10f" % qc)
print("  route D exact rational      Q = %.10f" % qd)
check("routes A and B agree", abs(qa - qb) < 1e-10, "delta %.2e" % abs(qa - qb))
check("routes A and C agree", abs(qa - qc) < 1e-10, "delta %.2e" % abs(qa - qc))
check("routes A and D agree, so float error is not carrying the result",
      abs(qa - qd) < 1e-12, "delta %.2e" % abs(qa - qd))
check("Q rounds to the printed %.3f" % PRINTED_Q, abs(qa - PRINTED_Q) < TOL,
      "Q = %.6f" % qa)

pa = p_route_erf(qa)
pb = p_route_incomplete_gamma(qa, 1)
pc = p_route_simpson(qa, 1)
print("  algorithm 1 erf normal tail        p = %.10f" % pa)
print("  algorithm 2 incomplete gamma       p = %.10f" % pb)
print("  algorithm 3 Simpson integration    p = %.10f" % pc)
check("erf and incomplete-gamma tails agree", abs(pa - pb) < 1e-12,
      "delta %.2e" % abs(pa - pb))
check("erf and Simpson integration agree", abs(pa - pc) < 1e-9,
      "delta %.2e" % abs(pa - pc))
check("p rounds to the printed %.3f" % PRINTED_P, abs(pa - PRINTED_P) < TOL,
      "p = %.6f" % pa)
check("df = 1, the only value consistent with two 2x2 tables",
      len(TABLES) - 1 == 1 and "1 degree of freedom" in dflat)

perm = p_route_permutation(TABLES, qa)
check("permutation test agrees the heterogeneity is unremarkable",
      perm > 0.05, "permutation p = %.4f over 200,000 reshuffles" % perm)

qu = q_route_weighted_variance(TABLES, corr=0.0)
pu = p_route_erf(qu)
check("conclusion is not an artifact of the Haldane 0.5 correction",
      pu > 0.05, "uncorrected Q = %.4f, p = %.4f, same conclusion" % (qu, pu))
check("the article claims no significant difference, matching p > 0.05",
      "did not detect a statistically significant difference" in dflat
      and pa > 0.05)
check("the article does not overstate the comparison",
      "descriptive rather than evidence that the two corpora behave identically"
      in dflat)

# ===================================================== ITEM 2: APPENDIX
print("\n=== ITEM 2. APPENDIX A, ENTRY BY ENTRY ===")
appx = md[md.index("## Appendix A. Case list"):]
entries = dict(re.findall(r"\*\*(A(\d+))\.\*\*\s*(.+)", appx)
               and [(m[0], m[2]) for m in
                    re.findall(r"\*\*(A(\d+))\.\*\*\s*(.+)", appx)])
order = ["A%d" % i for i in range(1, 23)]
check("22 entries, numbered A1 to A22 with no gap or duplicate",
      sorted(entries, key=lambda s: int(s[1:])) == order,
      "%d entries" % len(entries))
check("22 entries against 22 database rows", len(entries) == len(hr) == 22)


def core(s):
    """Comparable core of a citation: letters and digits, case-folded."""
    return re.sub(r"[^a-z0-9]", "", s.lower())


mismatch = []
for i, row in enumerate(hr, 1):
    label = "A%d" % i
    entry = entries.get(label, "")
    src = (row.get("source") or "").strip()
    # The database source ends with a trailing period or a parenthesized forum;
    # the appendix appends the forum in parentheses. Compare on the leading
    # citation text, which must be present in the entry verbatim.
    # "Public citation:" is a database field label, not part of the citation.
    stem = re.sub(r"^\s*Public citation:\s*", "", src)
    stem = re.sub(r"\s*\([^()]*\)\s*$", "", stem).rstrip(". ")
    if core(stem)[:60] not in core(entry):
        mismatch.append("%s: %s" % (label, stem[:50]))
check("every appendix entry matches its database row in created_at order",
      not mismatch,
      "; ".join(mismatch) if mismatch else "22 of 22 matched on citation text")

# A4, A5 and A15 name their forum in parentheses and then continue with the
# exclusion marking or the missing-case-number disclosure. Requiring the forum
# at end-of-string flagged all three as unattributed, which they are not.
FORUM = re.compile(r"\((?:US|UK|New York|N\.Y\.)[^()]*\)")
noforum = [k for k in order if not FORUM.search(entries.get(k, ""))]
check("every entry names a forum in parentheses", not noforum,
      ", ".join(noforum) if noforum else "22 forum attributions")

LOCATOR = re.compile(
    r"\b\d+\s+U\.S\.\s+\d+|\b\d+\s+(?:AD3d|NY|F\.\d|FLRA|Misc)\b|Case No\."
    r"|Appeal No\.|Appeal Board No\.|Slip Op|No\.\s*\d|\b(?:19|20)\d{2}\b", re.I)
nolocator = [k for k in order
             if k not in ("A4", "A15") and not LOCATOR.search(entries.get(k, ""))]
check("all 20 analyzed entries carry a locator or a year", not nolocator,
      ", ".join(nolocator) if nolocator else "20 of 20 traceable")

marked = {k for k in order if "EXCLUDED FROM THE ANALYSIS." in entries.get(k, "")}
check("A4 and A15 are the only entries marked excluded",
      marked == {"A4", "A15"}, "marked: " + ", ".join(sorted(marked)))
check("the database exclusion rule selects those same two rows",
      len(excluded) == 2
      and {hr.index(r) + 1 for r in excluded} == {4, 15},
      "rows %s by rule" % sorted(hr.index(r) + 1 for r in excluded))

a5 = entries.get("A5", "")
check("A5 still discloses the missing case number and supplies none",
      "case number is not on file" in a5
      and "identified by party, forum and year" in a5
      and "Case No." not in a5)
a5row = hr[4]
check("no case-number pattern exists anywhere in the A5 row",
      not re.search(r"\b\d{6,8}/\d{2,4}\b",
                    " ".join(str(v) for k, v in a5row.items()
                             if k not in ("created_at", "id", "record_id"))),
      "searched source, record, note, status, jrs_read, outcome")

print("--- corpus reconciliation ---")
cls = {k: sum(1 for r in primary if r["jrs_read"] == k)
       for k in ("ready", "review_required", "gap_identified")}
out = {}
for r in primary:
    out[r["outcome"]] = out.get(r["outcome"], 0) + 1
check("22 screened, 2 excluded, 20 analyzed",
      len(hr) == 22 and len(excluded) == 2 and len(primary) == 20)
check("classification 12 Ready + 5 Needs work + 3 Gap = 20",
      (cls["ready"], cls["review_required"], cls["gap_identified"]) == (12, 5, 3)
      and sum(cls.values()) == 20,
      "ready %d, review_required %d, gap_identified %d" % (
          cls["ready"], cls["review_required"], cls["gap_identified"]))
check("outcomes 6 sustained + 7 not survived + 6 contested + 1 audit = 20",
      (out.get("held_up"), out.get("failed_appeal"), out.get("challenged"),
       out.get("failed_audit")) == (6, 7, 6, 1) and sum(out.values()) == 20,
      "held_up %s, failed_appeal %s, challenged %s, failed_audit %s"
      % (out.get("held_up"), out.get("failed_appeal"),
         out.get("challenged"), out.get("failed_audit")))
check("flagged 8 + ready 12 = 20 and matches the 2x2 margins",
      cls["review_required"] + cls["gap_identified"] == E[0] + E[1] == 8
      and cls["ready"] == E[2] + E[3] == 12)
check("adverse total from the 2x2 equals failed_appeal plus failed_audit",
      E[0] + E[2] == out.get("failed_appeal", 0) + out.get("failed_audit", 0) == 8,
      "%d adverse across both classification arms" % (E[0] + E[2]))
check("comparison corpus 20 resolved + 7 contested + 5 audit = 32",
      sum(1 for r in foil if r["outcome"] in ("held_up", "failed_appeal")) == 20
      and sum(1 for r in foil if r["outcome"] == "challenged") == 7
      and sum(1 for r in foil if r["outcome"] == "failed_audit") == 5
      and len(foil) == 32)
check("the two corpora were reviewed by different practitioners",
      {r["contributor"] for r in hr} == {"V-HR-01"}
      and {r["contributor"] for r in foil} == {"E-08"},
      "V-HR-01 and E-08")

# ===================================================== ITEM 3: FORMAT
print("\n=== ITEM 3. ISACA SUBMISSION FORMAT ===")
body = md[:md.index("## Endnotes")]
notes_md = md[md.index("## Endnotes"):md.index("## Appendix A. Case list")]
bw = len(re.sub(r"[*_`|#-]", " ", body).split())
nw = len(re.sub(r"[*_`|#-]", " ", notes_md).split())
aw = len(re.sub(r"[*_`|#-]", " ", appx).split())
check("body inside ISACA's 2,000 to 3,000 words", 2000 <= bw <= 3000,
      "%d body, %d endnotes, %d appendix, all counted separately" % (bw, nw, aw))
check("body plus endnotes also inside the range, on the inclusive reading",
      2000 <= bw + nw <= 3000, "%d words on the inclusive count" % (bw + nw))
check("citations are endnotes, not footnotes",
      "## Endnotes" in md and "[^" not in md and md.count("<sup>") >= 7)

markers = [int(m) for m in re.findall(r"<sup>(\d+)</sup>", body)]
notes = [int(m) for m in re.findall(r"^\*\*(\d+)\.\*\*", notes_md, re.M)]
check("endnote markers ascend with no repeat", markers == sorted(markers)
      and len(markers) == len(set(markers)), "markers %s" % markers)
check("endnotes numbered 1 to %d with no gap" % len(notes),
      notes == list(range(1, len(notes) + 1)), "notes %s" % notes)
check("markers and notes are in one-to-one correspondence",
      set(markers) == set(notes), "%d markers, %d notes" % (len(markers), len(notes)))

tbl = re.findall(r"<w:tbl>.*?</w:tbl>", xdoc, re.S)
fig = [t for t in tbl if "Review condition" in re.sub(r"<[^>]+>", "", t)]
rows_in_fig = len(re.findall(r"<w:tr[ >]", fig[0])) if fig else 0
check("Figure 1 is a real Word table with six rows", len(fig) == 1 and rows_in_fig == 6,
      "%d tables in the document, Figure 1 has %d rows" % (len(tbl), rows_in_fig))
check("all five review conditions render inside Figure 1",
      all(c in re.sub(r"<[^>]+>", "", fig[0]) for c in
          ("Reconstructability", "Basis identification", "Chronological integrity",
           "Decision-process traceability", "Evidentiary sufficiency"))
      if fig else False)
check("no unconverted markdown grid anywhere in the document",
      "|---" not in dx and "| ---" not in dx)
check("superscripts are real superscript runs, not literal tags",
      '<w:vertAlign w:val="superscript"/>' in xdoc and "<sup>" not in dx)
check("appendix follows the endnotes as its own section",
      dx.index("Appendix A. Case list") > dx.index("Endnotes"))
check("both biographies present, free of educational detail",
      "Tanvi Pokhriyal is an Organizational Psychologist" in dflat
      and "Phillip Wikes is an AI Governance" in dflat
      and not [t for t in ("M.S.", "M.A.", "MBA", "PhD", "Ph.D", "B.A.", "B.S.",
                           "graduated", "holds a degree") if t in dflat])
check("both declarations present, including the competing interest",
      "Financial interests." in dflat and "Research funding." in dflat
      and "may benefit from its adoption" in dflat
      and "did not participate in the case classifications" in dflat)
check("byline is Pokhriyal and Wikes", "Tanvi Pokhriyal and Phillip Wikes" in dflat)
check("the .docx is a valid Word package",
      zipfile.ZipFile(DOCX).testzip() is None
      and "word/document.xml" in zipfile.ZipFile(DOCX).namelist())

failed = R.count(False)
print("\n%d checks, %d failed" % (len(R), failed))
if not failed:
    print("Q = %.6f by four independent routes. p = %.6f by three independent "
          "algorithms. Body %d words." % (qa, pa, bw))
sys.exit(failed)
