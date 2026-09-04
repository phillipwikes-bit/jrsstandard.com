#!/usr/bin/env python3
"""Version 9 surgical edits to the ISACA employment-records article.

The reviewer's minimal set, plus items 1 and 21 from the full list, which are
textual and unambiguous. Everything the reviewer marked KEEP is left alone and
is asserted intact afterwards, so a "tightening" edit cannot quietly erode a
safeguard sentence.

FAIL-CLOSED. Every replacement must match EXACTLY ONCE. A target that is
missing, already applied, or ambiguous aborts the entire batch before anything
is written. This exists because a previous batch applied silently in part and
the partial state was only caught by reading the rebuilt .docx.

Item 6 REVERSES an edit applied earlier today ("outcome-based documentation
control test" was itself the product of the previous round). Later instruction
governs, so it goes back to "outcome-based test of documentation control".

Usage: python3 scripts/apply_v9_surgical.py [--dry-run]
Exit 0 = all edits applied and all KEEP sentences verified intact.
"""
import io
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MD = os.path.join(ROOT, "research", "Employment_Records_Article_ISACA_2026-08-21.md")
DRY = "--dry-run" in sys.argv

# (item number, description, exact old text, exact new text)
EDITS = [
    (1, "semicolon in the methodological sequence",
     "The classification was recorded before the outcome was consulted, and the "
     "outcome and citation were then entered from the decision.",
     "The classification was recorded before the outcome was consulted; the "
     "outcome and citation were then entered from the decision."),

    (2, "single-practitioner limitation, less telegraphic",
     "one qualified specialist, one field application within an ordinary "
     "professional workflow.",
     "one qualified specialist applying the review within an ordinary "
     "professional workflow."),

    (3, "adverse-finding definition: where -> when",
     "an adverse finding was recorded where the employer's position did not "
     "survive review or where the matter drew an adverse audit or compliance "
     "finding.",
     "an adverse finding was recorded when the employer's position did not "
     "survive review or the matter drew an adverse audit or compliance "
     "finding."),

    (5, "split the sensitivity-analysis sentence in the body",
     "Including the 2 excluded matters produces p = 0.0073, but those matters "
     "do not meet the stated inclusion criteria and are therefore treated only "
     "as a sensitivity analysis.",
     "Including the 2 excluded matters produces p = 0.0073. Because those "
     "matters do not meet the stated inclusion criteria, this result is "
     "reported only as a sensitivity analysis."),

    (6, "comparison-corpus conclusion, reverses the prior round",
     "can influence an outcome-based documentation control test.",
     "can influence an outcome-based test of documentation control."),

    (8, "narrative substitution: present tense for a general control risk",
     "The source material that would have supported the conclusion may not be "
     "attached",
     "The source material that would support the conclusion may not be "
     "attached"),

    (9, "patterned compliance: conditional inference",
     "At population level this can indicate a broader control weakness "
     "requiring examination, since it suggests the control environment "
     "produced the appearance of documentation rather than the substance.",
     "At the population level, this can indicate a broader control weakness "
     "requiring examination because the control environment may be producing "
     "the appearance of documentation rather than its substance."),

    (10, "second-line review paragraph",
     "Under examination the absence of a documented review step can weaken "
     "confidence in the wider process rather than in that single decision.",
     "Under examination, the absence of a documented review step can weaken "
     "confidence in the wider process rather than only in that decision."),

    (11, "first control: examples are alternatives, not cumulative",
     "The evidence must exist independently of the draft, such as logs, "
     "communications and measurable data.",
     "The supporting evidence must exist independently of the draft, such as "
     "logs, communications or measurable data."),

    (14, "split the first-line / second-line sentence",
     "The review is most efficient when applied\nbefore a record is finalized, "
     "so its preventive value sits at the first line as a drafter\nself-check "
     "and at the second line as a sampling control by compliance or risk.",
     "The review is most useful when applied\nbefore a record is finalized. Its "
     "preventive value sits at the first line as a drafter\nself-check and at "
     "the second line as a sampling control by compliance or risk."),

    (20, "final validation recommendation, grammar",
     "put two reviewers on each case with the classification and outcome "
     "recorded separately, fix the treatment of unresolved contests in "
     "advance, and where feasible obtain the underlying record independently "
     "of the decision.",
     "assign two reviewers to each case with classification and outcome "
     "recorded separately, fix the treatment of unresolved contests in "
     "advance, and, where feasible, obtain the underlying record independently "
     "of the decision."),

    (21, "endnote 2: split the sensitivity sentence",
     "Including them produces p = 0.0073 with an odds ratio of 19.25, reported "
     "only as a sensitivity analysis because they do not meet the stated "
     "inclusion criteria.",
     "Including them produces p = 0.0073 with an odds ratio of 19.25. Because "
     "they do not meet the stated inclusion criteria, this result is reported "
     "only as a sensitivity analysis."),
]

# Sentences the reviewer marked KEEP or DO NOT CHANGE. Asserted intact after the
# batch. Items 4, 7, 12, 15, 17, 18, 19, 22, 26, 27.
KEEP = [
    (4, "The result depends on how an adverse outcome is defined, and no rule was "
        "fixed before the data closed."),
    (4, "The primary association should therefore be interpreted as exploratory "
        "rather than confirmatory."),
    (7, "That distribution reflects the selection and publication process rather "
        "than providing a measure of how those agencies documented."),
    (11, "A material claim contributes directly to the stated basis for the "
         "decision."),
    (12, "Treat AI output as unverified draft material until independently "
         "substantiated."),
    (15, "In practice, third-line testing is primarily diagnostic, while first "
         "and second-line application is primarily preventive."),
    (17, "Such patterns are more informative than an isolated classification, but "
         "they can be identified reliably only when individual classifications "
         "are recorded consistently."),
    (18, "It demonstrates that an association of this size can be observed at "
         "practitioner scale in adjudicated matters using a review that a working "
         "specialist can apply within an ordinary professional workflow."),
    (19, "Twenty cases reviewed by one practitioner, selected from published "
         "sources rather than sampled at random, constitute a field pilot."),
    (22, "No employer record was obtained independently of the decision."),
    (26, "Phillip Wikes developed the review method described in this article and "
         "may benefit from its adoption. He did not participate in the case "
         "classifications or outcome recording."),
    (27, "Generative AI changes how records may be produced, but it does not "
         "change the underlying examination question: can the record account for "
         "the decision it documents?"),
]

# Items the reviewer explicitly declined to change. Asserted UNCHANGED, so a
# stray edit to them fails the run.
NO_CHANGE = [
    (16, "Build the sampling plan in the ordinary way, using whatever sampling "
         "standard the function already applies."),
    (24, "Q = 1.949 on 1 degree of freedom, p = 0.163."),
]

def norm(t):
    """Collapse hard wrapping and inline emphasis.

    The KEEP and NO_CHANGE sentences are quoted from the rendered document, but
    the markdown source hard-wraps them and marks some with inline bold. A
    literal comparison reports erosion where none exists, so presence is tested
    against a normalized copy. The EDITS themselves are still matched literally
    against the raw source, because a replacement has to know the exact bytes.
    """
    return " ".join(t.replace("**", "").replace("*", "").split())


src = io.open(MD, encoding="utf-8").read()

# ---- pre-flight: every target must match exactly once, before any write ----
problems = []
for n, desc, old, new in EDITS:
    c = src.count(old)
    if c != 1:
        problems.append("item %-2d %-52s target matches %d times" % (n, desc, c))
    if new in src:
        problems.append("item %-2d %-52s replacement ALREADY present" % (n, desc))
if problems:
    print("ABORTED. Nothing written.")
    for p in problems:
        print("  " + p)
    sys.exit(len(problems))

out = src
for n, desc, old, new in EDITS:
    out = out.replace(old, new, 1)
    print("APPLY item %-2d %s" % (n, desc))

# ---- post-flight, in memory ----
fail = 0
for n, desc, old, new in EDITS:
    if new not in out or old in out:
        print("FAIL  item %-2d %s did not take" % (n, desc))
        fail += 1
nout = norm(out)
for n, sentence in KEEP:
    if norm(sentence) not in nout:
        print("FAIL  KEEP item %-2d eroded: %s" % (n, sentence[:60]))
        fail += 1
for n, sentence in NO_CHANGE:
    if norm(sentence) not in nout:
        print("FAIL  NO-CHANGE item %-2d altered: %s" % (n, sentence[:60]))
        fail += 1
if fail:
    print("\n%d failure(s). Nothing written." % fail)
    sys.exit(fail)

print("\n%d edits applied, %d KEEP sentences intact, %d NO-CHANGE items intact."
      % (len(EDITS), len(KEEP), len(NO_CHANGE)))
if DRY:
    print("--dry-run: file not written.")
    sys.exit(0)
io.open(MD, "w", encoding="utf-8").write(out)
print("wrote " + MD)
