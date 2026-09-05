#!/usr/bin/env python3
"""Nine unsupported prevalence assertions, scoped to what evidence supports.

WHY. /reference/unsupported-generalization/ publishes the site's own test:
"Unsupported Generalization is the gap between the strength of a claim and the
strength of its evidence ... The remedy is to scope each claim to what the
anchored evidence actually establishes." These nine sentences fail that test on
the site that publishes it.

THE LINE DRAWN, AND IT IS DELIBERATE. Corrected here are prevalence claims about
RECORDS and their review conditions, which is the evidentiary domain JRS itself
measures. Retained untouched are roughly seventeen "Most organizations begin
selectively" style statements: those are adoption guidance, presented as
guidance, and the protocol says to preserve them.
"""
import io, re, sys

AUTHORIZED = {"index.html", "jrsstandard.html", "workflow-fit.html"}

EDITS = [
 # --- E1 / E5 : the strongest claim, present identically on both twins ---
 ("index.html",
  "That is not a hypothetical condition. It is the ordinary condition under which most organizational records are eventually reviewed.",
  "That is not a hypothetical condition. It is the condition under which an organizational record may eventually be reviewed.", 1),
 ("jrsstandard.html",
  "That is not a hypothetical condition. It is the ordinary condition under which most organizational records are eventually reviewed.",
  "That is not a hypothetical condition. It is the condition under which an organizational record may eventually be reviewed.", 1),

 # --- E2 / E6 : two stacked prevalence assertions in the investigator note.
 # The paragraph two sentences earlier already frames the section as "observed
 # intake phenomena", so this only makes the rest of it consistent.
 ("index.html",
  "These limitations are routine in investigation review environments. They do not indicate procedural failure. They reflect the ordinary conditions under which investigative records are assembled and later examined.",
  "These limitations are observed in investigation review environments. They do not indicate procedural failure. They reflect conditions under which investigative records can be assembled and later examined.", 1),
 ("jrsstandard.html",
  "These limitations are routine in investigation review environments. They do not indicate procedural failure. They reflect the ordinary conditions under which investigative records are assembled and later examined.",
  "These limitations are observed in investigation review environments. They do not indicate procedural failure. They reflect conditions under which investigative records can be assembled and later examined.", 1),

 # --- E3 : asserts a failure rate for records generally ---
 ("index.html",
  "This is the condition most records fail without anyone noticing.",
  "This is the condition a record can fail without anyone noticing.", 1),

 # --- E4 / E9 : "Most organizations find" asserts an empirical finding about
 # what organizations discover. Same construction on two pages.
 ("index.html",
  "Most organizations find that applying it to 3-5 records is sufficient to calibrate reviewer judgment.",
  "Applying it to 3-5 records is generally enough to begin calibrating reviewer judgment.", 1),
 ("workflow-fit.html",
  "Most organizations find that applying the review structure to 3-5 records is sufficient to calibrate reviewer judgment before expanding.",
  "Applying the review structure to 3-5 records is generally enough to begin calibrating reviewer judgment before expanding.", 1),

 # --- E7 : two claims in one passage, prevalence plus a prediction ---
 ("jrsstandard.html",
  "These are not exceptional circumstances. They are the ordinary conditions under which organizational records deteriorate, compress, and become partially reconstructable across institutional time. A record that appears complete at drafting will encounter most of these conditions before it is reviewed by anyone outside the original workflow.",
  "These are not exceptional circumstances. They are conditions under which organizational records deteriorate, compress, and become partially reconstructable across institutional time. A record that appears complete at drafting can encounter these conditions before it is reviewed by anyone outside the original workflow.", 1),

 # --- E8 ---
 ("jrsstandard.html",
  "The personnel, systems, and context available at drafting are not the conditions under which most records are eventually reviewed.",
  "The personnel, systems, and context available at drafting are not necessarily the conditions under which a record is eventually reviewed.", 1),
]

# Adoption guidance that MUST survive untouched: the retain decision, enforced.
MUST_SURVIVE = {
 "index.html": [
   "Most organizations begin with one reviewer or one record type",
   "Most organizations begin selectively and expand based on where documentation failures have historically surfaced",
   "Most organizations do not begin with organizational-wide deployment",
   "Most organizations start selectively and expand once the value is visible",
   "Most organizations begin at Stage 1 or 2 and expand incrementally",
   "Most organizations begin with one record type or one department",
   "Incremental adoption is realistic adoption",
   "does not establish certification",
   "Not a certification or accreditation system",
   'id="jrs-total-claims"', 'id="jrs-scs-output"', 'id="scs-band"',
   "technical implementation of that", "It is not software and it needs none",
 ],
 "jrsstandard.html": [
   "Most organizations start with one record type",
   "Most organizations begin at Stage 1 or 2 and expand incrementally",
   "Most organizations begin with one record type or one department",
   "Most records are self-reviewed by the drafter",
   "technical implementation of that", "It is not software and it needs none",
   "Core principle", "Substrate neutrality",
 ],
 "workflow-fit.html": [
   "Most organizations do not begin with enterprise-wide deployment",
   "Most Organizations Start Here",
   "Most organizations begin selectively and expand based on where documentation failures have historically surfaced",
   "does not establish certification",
 ],
}

BANNED_AFTER = {
 "index.html": [
   "the ordinary condition under which most organizational records",
   "the ordinary conditions under which investigative records",
   "the condition most records fail",
   "Most organizations find that applying",
   "limitations are routine in investigation",
 ],
 "jrsstandard.html": [
   "the ordinary condition under which most organizational records",
   "the ordinary conditions under which investigative records",
   "the ordinary conditions under which organizational records deteriorate",
   "will encounter most of these conditions",
   "the conditions under which most records are eventually reviewed",
   "limitations are routine in investigation",
 ],
 "workflow-fit.html": [
   "Most organizations find that applying",
 ],
}

# Research figures that must not move.
FIGURES = ["83.9", "72.7", "95.1", "384", "87.0", "80.7", "0.739", "0.623"]


def main():
    for f, *_ in EDITS:
        if f not in AUTHORIZED:
            sys.exit("REFUSE: %s not authorized" % f)

    src = {f: io.open(f, encoding="utf-8").read() for f in AUTHORIZED}
    before = {f: len(s.encode("utf-8")) for f, s in src.items()}

    for f, old, new, n in EDITS:
        got = src[f].count(old)
        if got != n:
            sys.exit("REFUSE: %s expected %d of %r, found %d" % (f, n, old[:80], got))
        if "—" in new:
            sys.exit("REFUSE: replacement introduces a banned em-dash: %r" % new[:80])
        if "frequently" in new:
            sys.exit("REFUSE: replacement introduces banned filler 'frequently'")

    out = dict(src)
    for f, old, new, n in EDITS:
        out[f] = out[f].replace(old, new, n)

    for f, keep in MUST_SURVIVE.items():
        for k in keep:
            if k not in out[f]:
                sys.exit("REFUSE: %s lost required content %r" % (f, k))

    for f, ban in BANNED_AFTER.items():
        for k in ban:
            if k in out[f]:
                sys.exit("REFUSE: %s still contains %r" % (f, k))

    for f in AUTHORIZED:
        for v in FIGURES:
            if src[f].count(v) != out[f].count(v):
                sys.exit("REFUSE: %s figure %s moved %d -> %d"
                         % (f, v, src[f].count(v), out[f].count(v)))
        for tag in ("div", "p", "h2", "h3", "a", "span"):
            o = len(re.findall(r'<%s[\s>]' % tag, src[f])) - len(re.findall(r'</%s>' % tag, src[f]))
            c = len(re.findall(r'<%s[\s>]' % tag, out[f])) - len(re.findall(r'</%s>' % tag, out[f]))
            if o != c:
                sys.exit("REFUSE: %s <%s> balance changed %d -> %d" % (f, tag, o, c))
        d = len(out[f].encode("utf-8")) - before[f]
        if abs(d) > 1200:
            sys.exit("REFUSE: %s byte delta %+d exceeds ceiling" % (f, d))

    for f in AUTHORIZED:
        io.open(f, "w", encoding="utf-8").write(out[f])
        print("%-20s %7d -> %7d  (%+d bytes)"
              % (f, before[f], len(out[f].encode("utf-8")),
                 len(out[f].encode("utf-8")) - before[f]))
    print("all gates passed; %d edits applied" % len(EDITS))


if __name__ == "__main__":
    main()
