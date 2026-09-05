#!/usr/bin/env python3
"""Six unsupported empirical assertions, eleven instances, two files.

STANDARD APPLIED, from the site's own /reference/unsupported-generalization/:
"the gap between the strength of a claim and the strength of its evidence ...
scope each claim to what the anchored evidence actually establishes."

WHAT AN EARLIER PASS MISSED, AND WHY. The 2026-09-05 prevalence pass searched
for the phrase "the ordinary condition under which most organizational
records" and corrected it. It did not search the bare phrase, so a SECOND
sentence carrying "most organizational records" survived on both twins. Nor
did it search for superlatives at all, so five "the most common / the most
likely" rankings survived. This pass searches the claim shape, not the
remembered wording.

RETAINED, DELIBERATELY. Roughly eleven "Most organizations begin selectively"
statements (category 4 guidance), "Most records are self-reviewed by the
drafter" (category 2, a routing model the page diagrams), every "not usually
the product of misconduct" style sentence (category 4, these LIMIT an
accusation rather than inflate a claim), and the whole "typically" family
(category 3/4 deployment guidance). Gates below assert they survive.
"""
import io, re, sys

AUTHORIZED = {"index.html", "jrsstandard.html"}

EDITS = [
 # 1. prevalence across "most organizational records" -- the sentence the
 #    earlier pass did not reach.
 ("index.html",
  "Some degree of timeline compression, system fragmentation, and institutional memory loss is present in most organizational records over time.",
  "Some degree of timeline compression, system fragmentation, and institutional memory loss can be present in an organizational record over time.", 1),
 ("jrsstandard.html",
  "Some degree of timeline compression, system fragmentation, and institutional memory loss is present in most organizational records over time.",
  "Some degree of timeline compression, system fragmentation, and institutional memory loss can be present in an organizational record over time.", 1),

 # 2. superlative ranking of failure types. Recast as the checklist's purpose,
 #    which is what the surrounding "Purpose" heading already frames it as.
 ("index.html",
  "Timeline deficiency is the most common documentation failure.",
  "Timeline deficiency is the documentation failure this checklist is built to catch.", 1),
 ("jrsstandard.html",
  "Timeline deficiency is the most common documentation failure.",
  "Timeline deficiency is the documentation failure this checklist is built to catch.", 1),

 # 3. superlative ranking of review triggers.
 ("index.html",
  "Termination files without a referenced counseling trail are the most common secondary review trigger.",
  "Termination files without a referenced counseling trail are a secondary review trigger.", 1),
 ("jrsstandard.html",
  "Termination files without a referenced counseling trail are the most common secondary review trigger.",
  "Termination files without a referenced counseling trail are a secondary review trigger.", 1),

 # 4. two superlatives in one passage. Recast as this standard's own risk
 #    classification, which is a methodological statement rather than a
 #    claim about the world.
 ("index.html",
  "Performance evaluations, disciplinary documentation, termination records, and accommodation files are the most likely to be reviewed during disputes, audits, or proceedings. They are also the most likely to fail reconstruction review when examined by someone without original context.",
  "Performance evaluations, disciplinary documentation, termination records, and accommodation files are treated here as higher-risk record types. They are the records likely to be reviewed during disputes, audits, or proceedings, and they can fail reconstruction review when examined by someone without original context.", 1),
 ("jrsstandard.html",
  "Performance evaluations, disciplinary documentation, termination records, and accommodation files are the most likely to be reviewed during disputes, audits, or proceedings. They are also the most likely to fail reconstruction review when examined by someone without original context.",
  "Performance evaluations, disciplinary documentation, termination records, and accommodation files are treated here as higher-risk record types. They are the records likely to be reviewed during disputes, audits, or proceedings, and they can fail reconstruction review when examined by someone without original context.", 1),

 # 5. superlative ranking of adoption entry points. The sentence answers
 #    "which records should we start with", so it stays guidance, minus the
 #    measured-fact framing.
 ("index.html",
  "Performance records are the most common entry point for teams new to structured documentation review.",
  "Performance records are a practical entry point for teams new to structured documentation review.", 1),
 ("jrsstandard.html",
  "Performance records are the most common entry point for teams new to pre-finalization review.",
  "Performance records are a practical entry point for teams new to pre-finalization review.", 1),

 # 7. FOUND BY VALIDATION A, NOT BY THE ORIGINAL TARGET LIST. jrsstandard.html
 # carries a SECOND "These are not exceptional circumstances" passage. The
 # 2026-09-05 pass corrected the one worded "the ordinary conditions" and left
 # this one, worded "the common conditions", because it searched a remembered
 # string instead of the claim shape. Same category 5 assertion.
 ("jrsstandard.html",
  "These are not exceptional circumstances. They are the common conditions under which organizational records are eventually examined.",
  "These are not exceptional circumstances. They are conditions under which an organizational record may eventually be examined.",
  1),

 # 6. superlative ranking of gap types.
 ("jrsstandard.html",
  "Pattern claims missing dates are the most common single gap.",
  "Pattern claims missing dates are a further flag of the same kind.", 1),
]

# Category 1-4 language that MUST survive: the retain decision, enforced.
MUST_SURVIVE = {
 "index.html": [
   "Most organizations begin with one reviewer or one record type",
   "Most organizations begin selectively and expand based on where documentation failures have historically surfaced",
   "Most organizations do not begin with organizational-wide deployment",
   "Most organizations start selectively and expand once the value is visible",
   "Most organizations begin at Stage 1 or 2 and expand incrementally",
   "Most organizations begin with one record type or one department",
   "in most cases, doing their jobs under ordinary operational conditions",
   "not usually the product of misconduct or intentional falsification",
   "The supporting documentation usually exists",
   "Deployment typically progresses in stages",
   # strategic architecture that must not be damaged
   "technical implementation of that", "It is not software and it needs none",
   "Not a certification or accreditation system",
   'id="jrs-total-claims"', 'id="jrs-scs-output"', 'id="scs-band"',
   "Commercial Inquiries",
 ],
 "jrsstandard.html": [
   "Most organizations start with one record type",
   "Most organizations begin at Stage 1 or 2 and expand incrementally",
   "Most organizations begin with one record type or one department",
   "Most records are self-reviewed by the drafter",
   "most commonly arise from ordinary workflow pressures, not from deliberate falsification",
   "The supporting documentation usually exists",
   "technical implementation of that", "It is not software and it needs none",
   "Core principle", "Substrate neutrality",
 ],
}

BANNED_AFTER = {
 "index.html": [
   "is present in most organizational records",
   "the most common documentation failure",
   "the most common secondary review trigger",
   "are the most likely to be reviewed",
   "the most likely to fail reconstruction review",
   "the most common entry point",
 ],
 "jrsstandard.html": [
   "is present in most organizational records",
   "the most common documentation failure",
   "the most common secondary review trigger",
   "are the most likely to be reviewed",
   "the most likely to fail reconstruction review",
   "the most common entry point",
   "the most common single gap",
   "the common conditions under which organizational records",
 ],
}

FIGURES = ["83.9", "72.7", "95.1", "384", "87.0", "80.7", "0.739", "0.623", "86.7"]


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
        for bad, why in (("—", "banned em-dash"),
                         ("frequently", "banned filler 'frequently'"),
                         ("most common", "replacement reintroduces a superlative"),
                         ("most likely", "replacement reintroduces a superlative"),
                         ("in most ", "replacement reintroduces a prevalence claim")):
            if bad in new:
                sys.exit("REFUSE: replacement contains %s: %r" % (why, new[:90]))

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
        for tag in ("div", "p", "h2", "h3", "a", "span", "li"):
            o = len(re.findall(r'<%s[\s>]' % tag, src[f])) - len(re.findall(r'</%s>' % tag, src[f]))
            c = len(re.findall(r'<%s[\s>]' % tag, out[f])) - len(re.findall(r'</%s>' % tag, out[f]))
            if o != c:
                sys.exit("REFUSE: %s <%s> balance changed %d -> %d" % (f, tag, o, c))
        d = len(out[f].encode("utf-8")) - before[f]
        if abs(d) > 1500:
            sys.exit("REFUSE: %s byte delta %+d exceeds ceiling" % (f, d))

    for f in AUTHORIZED:
        io.open(f, "w", encoding="utf-8").write(out[f])
        print("%-20s %7d -> %7d  (%+d bytes)"
              % (f, before[f], len(out[f].encode("utf-8")),
                 len(out[f].encode("utf-8")) - before[f]))
    print("all gates passed; %d edits applied" % len(EDITS))


if __name__ == "__main__":
    main()
