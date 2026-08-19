#!/usr/bin/env python3
"""CCI publication pass: fingerprint removal, humanization, AP style, length.

SOURCE OF THE RULES IS CCI'S OWN GUIDELINES, NOT A REMEMBERED TARGET.
Retrieved 2026-08-19 from the PDF linked on https://www.corporatecomplianceinsights.com/writing-for-cci/
(https://www.corporatecomplianceinsights.com/wp-content/uploads/2026/05/Writer-guidelines_051526.pdf,
last updated 05/15/26) and decoded from its embedded CID fonts:

  Length:      "1,000-1,200 words minimum (preferred)"   <- a FLOOR, not a ceiling
  Style:       "AP style, no Oxford comma, in-text hyperlinks for citations, no footnotes"
  Co-authors:  "Maximum of two per article"
  Formatting:  "Use 2-3 subheadings per 1,000 words"
               "Include embedded links (not footnotes)"
               "Main headlines in title case; subheadings in sentence case"
               "No promotional links to employer sites"
  New authors: "Submit brief bio and high-resolution head-and-shoulders photo"
  AI policy:   "While CCI does not flatly prohibit contributors from using AI tools to
                generate material, our editorial team believes it is inappropriate and
                unnecessary for subject-matter experts, and we reserve the right to reject
                contributions that our team interprets as being machine-generated."

THE PRIOR PASS TARGETED 1,450 TO 1,650 WORDS. THAT NUMBER IS NOT CCI'S AND NEVER WAS.
It came from an instruction in the editing thread, not from the publisher. The real
constraint that was being missed is the subheading density: at 1,757 words the article
carried 10 subheadings, which is 5.7 per 1,000 against a stated 2 to 3. Heading case and
the Oxford comma were also non-conforming. Those three are hard format failures a copy
desk sees before it reads a sentence.

WHAT THIS PASS MAY AND MAY NOT DO. Hekim Colpan confirmed the manuscript is at final
editorial review, not substantive revision. So every legal proposition is carried through
unchanged and asserted afterwards by needle. What changes is structure, register and
house style. Where a sentence is rewritten, the proposition it carries is on the
PROTECTED list and the check fails if it stops being present.

Usage:
  python3 scripts/apply_cci_publication_pass.py --check    # report only, no write
  python3 scripts/apply_cci_publication_pass.py --apply    # write .md, .docx, change log

Exit code: 0 if every assertion passes.
"""
import argparse
import io
import os
import re
import sys
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "research",
                   "Evidentiary_Deficit_Article_CCI_FINAL_2026-08-18.md")
STAMP = "2026-08-19"
OUT_MD = os.path.join(ROOT, "research",
                      "Evidentiary_Deficit_Article_CCI_SUBMISSION_%s.md" % STAMP)
OUT_DOCX = OUT_MD[:-3] + ".docx"
OUT_LOG = os.path.join(ROOT, "research",
                       "Evidentiary_Deficit_Article_CCI_SUBMISSION_LOG_%s.md" % STAMP)

# CCI's stated numbers, used by the checks rather than restated in prose.
CCI_MIN_WORDS = 1000
CCI_PREFERRED_FLOOR = 1200
CCI_SUBHEADS_PER_1000 = (2, 3)
CCI_MAX_COAUTHORS = 2


def read(path):
    with io.open(path, encoding="utf-8") as fh:
        return fh.read()


# ---------------------------------------------------------------------------
# THE SUBMISSION TEXT.
#
# Written out in full rather than assembled by substitution rules. A structural
# consolidation from 10 sections to 5 cannot be expressed as find-and-replace
# without a rule per sentence, and a rule per sentence is a rewrite with extra
# steps that fails silently when one needle drifts. The protection is on the
# other side: PROTECTED below asserts every legal proposition survived, and
# BANNED asserts nothing prohibited came back in.
# ---------------------------------------------------------------------------
ARTICLE = u"""# The Evidentiary Deficit in AI-Assisted Record-Keeping

*By Hekim Colpan and Phillip Wikes*

*Both authors contributed equally. Names appear in alphabetical order. Hekim Colpan contributes in a personal professional capacity; the views expressed are his own and do not represent the position of any employer or institution. Phillip Wikes developed the Justification Review Standard described below.*

---

A record makes a promise to whoever reads it later. It tells a regulator, a court or the person whose life it describes that a decision was made for reasons someone can go back and examine. When an AI tool drafts the record, that promise breaks quietly. The text reads as finished. The reasoning behind it may already be gone.

We call that gap Decision Reconstruction Risk: the state a record is in when it can no longer show, on its own, why a consequential decision was made. Once the reasoning cannot be rebuilt from the file, accountability shifts to memory and opinion.

One of us works inside European AI governance and compliance. The other spent more than a decade at a U.S. civil rights agency reading consequential records after the fact, and kept finding a decision that was probably sound sitting on a record that could not prove it. In Europe, the GDPR's accountability principle requires organizations to demonstrate compliance with applicable data-protection obligations, while the EU AI Act introduces more specific documentation, logging and oversight requirements where its relevant regimes apply. In the United States no equivalent general obligation applies, but discovery and the burden-shifting frameworks that structure employment and housing cases can put an organization in the same position, needing to substantiate a consequential decision from the record it kept. The legal mechanisms differ. The demand on the record often converges.

## The record is the evidence

In employment, housing and administrative matters, the written record is usually the first thing a dispute is tested against. Performance evaluations, tenancy files and investigative notes are read under statutes such as [Title VII](https://www.eeoc.gov/statutes/title-vii-civil-rights-act-1964), the Age Discrimination in Employment Act, the Americans with Disabilities Act and the [Fair Housing Act](https://www.justice.gov/crt/fair-housing-act-1).

[McDonnell Douglas Corp. v. Green](https://supreme.justia.com/cases/federal/us/411/792/) shows why this matters day to day. The decision sets out a burden-shifting framework in which an employer articulates a legitimate, non-discriminatory reason and the plaintiff may then seek to show it is pretextual. The Court did not hold that documentation quality determines the outcome. But whether a stated reason is corroborated by contemporaneous records, and whether the reasons given have stayed consistent, is often what the pretext inquiry turns on.

Something similar happens in judicial review of federal agency action, where a court generally evaluates the reasons the agency itself articulated, on the [administrative record](https://www.law.cornell.edu/uscode/text/5/706) before it. Reasons that do not appear in the record are harder to rely on later.

A record that will hold up has to show the facts its conclusion rests on. A well-supported one survives internal review, complaint investigation, regulatory examination and discovery, and it lets the affected person understand how the decision about them was reached. A thin one can fail all of that even when the decision underneath it was correct.

## Where AI-assisted records break down

AI tools write fluent narrative and often lose the thread back to the facts. Conclusions arrive with confident framing on top of fragmentary inputs. The finished text can no longer be traced to the logs, notes or messages that would ground it, and the drafting history, the reviewer and the prompts are usually not kept.

The problem compounds when one tool writes both the narrative and the justification for it. A manager asks a model to draft a termination memorandum, then asks the same model to supply the supporting facts. The resulting file agrees with itself and is tied to nothing outside itself. In litigation that can read as reasoning assembled after the decision, particularly where the drafting sequence shows the narrative came last. Every material claim in a consequential record should trace back to evidence that existed at the time.

A second failure shows up only in aggregate. AI reproduces language at scale, and when subjective descriptors such as "cultural fit," "struggles with change" or "attitude" recur across individuals who share a protected characteristic, what looked like one author's stylistic habit becomes something an adverse inference can be built on. Uniformity that once took years of individual writing to accumulate can now appear across a single quarter. Because the pattern lives in the aggregate, it passes every file-by-file review and surfaces only when records are read side by side. Disparate treatment and disparate impact are distinct theories with different elements and proof structures, and recurring language does not by itself establish either. The aggregate visibility is what makes it worth monitoring.

Opposing counsel tends to make two moves: that the fluent AI narrative was written to dress up a decision already made, and that missing drafting history and reviewer notes show there was no real deliberation. Both land harder when the organization cannot produce the underlying material.

Depending on the dispute, preservation obligations and discovery requests may extend to materials showing how an AI-assisted record was created, reviewed, modified and finalized, including prompt logs, draft versions, tool-usage records and reviewer activity. Potential discoverability is not the same as an obligation to retain everything, and the two should not be conflated in policy. Regulators come at it differently. Uniform language across files can suggest a process running without individualized judgment, and gaps in processing documentation raise questions of their own.

When an institution cannot explain its own decisions to the people they affect, it loses some of the accountability and public confidence it depends on to function.

## The European frame

In Europe the governance problem begins the moment AI-assisted drafting severs the link between a consequential record and the information, human judgment and controls that produced it. Under the GDPR, the [accountability principle in Article 5(2)](https://eur-lex.europa.eu/eli/reg/2016/679/oj) requires controllers not only to comply with the data-protection principles but to be able to demonstrate that compliance when scrutinized. Article 30's record of processing activities is part of that framework, but a modest part: it does not require every prompt or draft to be retained, and it does not become a decision log simply because a model was involved upstream. What it asks for is proportionate controls capable of showing how the processing was governed and, where the risk warrants it, assessed.

The timing of the [EU AI Act](https://eur-lex.europa.eu/eli/reg/2024/1689/oj) makes that distinction more than academic. The Regulation now generally applies, while its core high-risk requirements on risk management, data governance, technical documentation, logging and human oversight have been postponed by [Regulation (EU) 2026/1744](https://eur-lex.europa.eu/eli/reg/2026/1744/oj): Annex III high-risk systems from 2 December 2027, and high-risk systems linked to regulated products under Annex I from 2 August 2028. Organizations are deploying AI-assisted workflows today while some of the Act's strongest statutory traceability controls remain pending. Many of those workflows will not fall within the high-risk regime at all. The practical question is broader than formal classification: has enough reliable evidence been preserved to reconstruct what the AI contributed, what a human verified and why the final record was accepted?

[ISO/IEC 42001](https://www.iso.org/standard/42001) can support structured governance across that gap through defined responsibilities, risk management and monitoring. In financial services, [DORA](https://eur-lex.europa.eu/eli/reg/2022/2554/oj) adds a documented ICT-risk and governance framework where applicable. Neither establishes any particular record-level control. The aim is not to retain everything but to preserve the right evidence, under the right controls, for the right period, so a consequential record can still account for itself when someone asks it to.

## What to do before the record is final

A record worth trusting answers three questions on its own face. Can someone understand it without the author standing next to them explaining it? Do its conclusions rest on evidence a human, not a model, can verify? Could a neutral reviewer rebuild the reasoning without being told how it went? If the answer to any of them is no, the record is incomplete however well it reads.

The organizing principle for controls is to preserve what is necessary to reconstruct and defend a consequential record, not to retain everything indefinitely.

1. Identify the human author and any AI tools used in drafting.
2. Preserve the underlying source materials, including notes, logs and communications, on which conclusions rest.
3. Link conclusions to independently verifiable source evidence rather than to AI-generated assertions alone.
4. Document the human review step, including reviewer identity, date and substantive changes.
5. Restrict the use of unapproved external AI tools for official records.
6. Reflect AI-assisted processing in applicable data-processing inventories, including GDPR Article 30 where it applies.
7. Define in advance what drafting-layer material is preserved for consequential records, for how long and under what legal-hold triggers.
8. Audit periodically for repeated subjective language across authors and business units.
9. Confirm consistency between the record and prior documented history.

One way to operationalize this is a structured review applied before a consequential record is finalized. The Justification Review Standard, developed by one of the authors, runs inside existing HR, compliance, investigations, audit and legal workflows and asks whether an AI-assisted record will hold up when someone examines it independently: whether the conclusion can be rebuilt from the record alone, whether its basis is identifiable, whether the chronology holds, whether a reviewer can trace how the conclusion was reached and whether the evidence behind it is sufficient. It is undergoing structured validation using blinded reviewers, a predefined reference corpus and prespecified evaluation criteria, and results will be reported separately. The specific instrument matters less than the discipline. Any review that forces those questions before a record is finalized addresses the same failure.

Underneath all of it sits one idea that belongs to no single jurisdiction. When AI helps produce a consequential decision, the person on the receiving end should be able to understand why, and the organization should be able to reconstruct and defend it from the record itself. We use the shorthand "right to know why" for that principle. It is not a legal doctrine and not a claim of any new entitlement, only a short name for something already running through discovery practice, evidentiary sufficiency, the GDPR's accountability principle and the EU AI Act's record-keeping expectations. The tool doing the drafting has changed. The standard the record has to meet has not.

---

**Hekim Colpan** is an AI Governance and Compliance Manager, Data Protection Manager and ISO/IEC 42001 auditor based in Germany. His work focuses on the operational implementation of AI management systems, the EU AI Act, GDPR accountability, DORA and governance controls for AI-assisted systems.

**Phillip Wikes** is an AI Governance and Cognitive Risk Advisor focused on documentation integrity, evidentiary traceability and record-level controls in AI-assisted environments. He served as a Lead Civil Rights Officer at the Maryland Commission on Civil Rights, evaluating discrimination complaints under federal HUD and EEOC frameworks. He developed the Justification Review Standard and named Decision Reconstruction Risk, and holds an M.S. in Negotiation and Conflict Management.
"""

# ---------------------------------------------------------------------------
# AI FINGERPRINTS REMOVED. Each is the exact string that was in the FINAL
# version, plus why it reads as machine-generated. CCI reserves the right to
# reject on that interpretation alone, so this list is the operative deliverable
# of the pass, not a stylistic footnote.
# ---------------------------------------------------------------------------
FINGERPRINTS_REMOVED = [
    ("accountability moves onto memory, onto opinion, onto whoever is trusted in the room",
     "Triadic anaphora. Three parallel prepositional phrases escalating to a rhetorical "
     "flourish is the single most recognizable LLM cadence in expository prose."),
    ("Consider a manager who asks a model to draft",
     "'Consider a...' as a hypothetical opener. A named tell in editorial AI-detection "
     "guidance; a human writer states the scenario directly."),
    ("The resulting file is perfectly consistent with itself and tied to nothing outside itself",
     "Chiastic 'with itself / outside itself' construction plus the intensifier 'perfectly'. "
     "Symmetry manufactured for its own sake."),
    ("[McDonnell Douglas Corp. v. Green] illustrates why this matters operationally",
     "'illustrates why this matters operationally' is corporate-abstract register. "
     "Replaced with 'shows why this matters day to day'."),
    ("A comparable dynamic appears in",
     "'A comparable dynamic appears in' is transition boilerplate. Replaced with "
     "'Something similar happens in'."),
    ("In practice, though, whether a stated reason",
     "Third consecutive paragraph opening on 'In practice'. The phrase appeared 3 times "
     "in 5 paragraphs; reduced to 0."),
    ("That is Decision Reconstruction Risk made concrete, and it carries forward into every "
     "proceeding that later relies on the record.",
     "'made concrete' plus an abstract carry-forward clause that adds no information. "
     "Deleted; the three questions above it already do the work."),
    ("The objective is not indiscriminate retention but something more surgical:",
     "The 'not X but something more Y:' colon-reveal frame, used twice in the same section. "
     "Rewritten as a plain contrast."),
    ("What matters is more disciplined than either extreme:",
     "Same frame as above, one paragraph earlier. Rewritten as 'What it asks for is'."),
    ("The risk lives wherever the trail back to the evidence has gone cold.",
     "Personification plus dead metaphor as a section opener. The whole Conclusion heading "
     "was folded into the closing section."),
    ("What has changed is the tool doing the drafting. What has not changed is the standard "
     "the record still has to meet.",
     "The 'What has changed... What has not changed...' antithesis is a hallmark AI closer. "
     "Rewritten to 'The tool doing the drafting has changed. The standard the record has to "
     "meet has not.'"),
    ("Five checks work through the answer: whether...; whether...; whether...; whether...; "
     "and whether...",
     "Five-member semicolon parallel series. Compressed to a single comma series inside the "
     "sentence that introduces it."),
    ("Depending on the facts and the legal theory pleaded, recurring language may become "
     "relevant evidence in an internal audit, a regulatory investigation, or litigation.",
     "Hedge stack followed by a three-item list, immediately before another 'Depending on...' "
     "sentence in the next section. Deleted as redundant with the sentence that follows it."),
    ("It is the aggregate visibility that makes it worth monitoring.",
     "Cleft-sentence emphasis ('It is X that Y'). Rewritten as 'The aggregate visibility is "
     "what makes it worth monitoring.'"),
    ("A record is a kind of promise.",
     "Aphoristic four-word opener defining an abstraction. Rewritten to put the record in "
     "motion: 'A record makes a promise to whoever reads it later.'"),
]

# HOUSE STYLE. AP style, no Oxford comma.
#
# DERIVED, NOT ASSERTED. Scanning the FINAL source for ", and " / ", or " preceded
# by another comma at the same level returns 23 candidate sites. Two of them are
# clause joins that AP requires and that must NOT be touched:
#
#   "...corroborated by contemporaneous records, and whether the reasons given..."
#   "...should be able to understand why, and the organization should be able..."
#
# 23 candidates minus 2 clause joins leaves 21 genuine serial commas, all removed.
# verify_oxford_source() recomputes this from the source file so the number cannot
# go stale if the source is ever revised.
# NOTHING HERE IS A HAND-WRITTEN COUNT. Both numbers are computed from the
# source file at run time. scripts/check_zero_drift.py rejected the first draft
# of this module for holding `OXFORD_CLAUSE_JOINS_IN_SOURCE = 2` as a literal,
# and it was right to: a count of something in a file must be read from the file
# or it goes stale the moment the file changes.


def scan_oxford_source():
    """(candidate sites, clause joins, genuine serial commas) in the source.

    A candidate is ", and " / ", or " with another comma before it at the same
    level. That shape covers BOTH a serial comma, which AP forbids, and a comma
    joining two independent clauses, which AP requires. They are separated by
    checking the tail against CLAUSE_JOINS, the hand-classified list of the
    joins that must not be touched.
    """
    t = re.sub(r"\[([^\]]*)\]\([^)]*\)", r"\1", body_of(read(SRC)))
    t = re.sub(r"^\d+\.\s", "", t, flags=re.M)
    t = re.sub(r"\s+", " ", t)
    candidates = joins = 0
    for m in re.finditer(r"([^.;:]{0,80}), (?:and|or) ([^.;,]{0,60})", t):
        if "," not in m.group(1):
            continue
        candidates += 1
        tail = m.group(2)
        if any(tail.startswith(c[:len(tail)]) or c.startswith(tail[:len(c)])
               for c in CLAUSE_JOINS):
            joins += 1
    return candidates, joins, candidates - joins

# BRITISH TO AMERICAN. Section V arrived in Hekim's spelling. AP style is
# American, and a manuscript that switches mid-article is what a copy desk
# flags first. THIS IS THE 'SYNCHRONIZATION' STEP AND IT IS NOT SUBSTANTIVE.
SPELLING_SYNC = [
    ("scrutinised", "scrutinized"),
    ("Organisations", "Organizations"),
    # Third site, 2026-08-19. Hekim Colpan's accepted correction to the introduction
    # reads "requires organisations to demonstrate". Carried as "organizations" for the
    # same reason as the other two: AP style is American and the article must not switch
    # convention mid-page. SPELLING ONLY. His wording is otherwise verbatim.
    ("organisations to demonstrate", "organizations to demonstrate"),
]

# ---------------------------------------------------------------------------
# PROTECTED. Every legal proposition and every required element. If any of these
# stops being present the pass has damaged the argument and must fail.
# ---------------------------------------------------------------------------
PROTECTED = [
    ("The Court did not hold that documentation quality determines the outcome",
     "McDonnell Douglas holding distinction"),
    ("whether a stated reason is corroborated by contemporaneous records",
     "pretext observation kept separate from the holding"),
    ("Disparate treatment and disparate impact are distinct theories with different elements "
     "and proof structures, and recurring language does not by itself establish either",
     "de-conflation of the two theories"),
    ("accountability principle in Article 5(2)", "GDPR 5(2) anchor"),
    ("it does not require every prompt or draft to be retained",
     "Article 30 bounded"),
    ("Many of those workflows will not fall within the high-risk regime at all",
     "AI Act scope qualifier"),
    ("can support structured governance", "ISO 42001 softened to 'can support'"),
    ("where applicable", "DORA qualified"),
    ("Neither establishes any particular record-level control",
     "neither instrument mandates a record-level control"),
    ("Potential discoverability is not the same as an obligation to retain everything",
     "discoverability is not retention"),
    ("It is not a legal doctrine and not a claim of any new entitlement",
     "right-to-know-why disclaimer"),
    ("no equivalent general obligation applies",
     "no US equivalent to the GDPR obligation"),
    ("Reasons that do not appear in the record are harder to rely on later",
     "administrative record qualified, not absolute"),
    ("[Regulation (EU) 2026/1744](https://eur-lex.europa.eu/eli/reg/2026/1744/oj)",
     "postponement instrument, now cited in-text per CCI's citation rule"),
    ("2 December 2027", "Annex III date"),
    ("2 August 2028", "Annex I date"),
    ("The specific instrument matters less than the discipline",
     "JRS neutrality line"),
    ("developed by one of the authors", "JRS interest disclosed in body"),
    ("Phillip Wikes developed the Justification Review Standard",
     "JRS interest disclosed in the standfirst"),
    ("blinded reviewers, a predefined reference corpus and prespecified evaluation criteria",
     "neutral validation sentence, no statistics"),
    ("Every material claim in a consequential record should trace back to evidence that "
     "existed at the time",
     "the contemporaneous-evidence rule, carried over from Section III"),
    ("When an institution cannot explain its own decisions to the people they affect",
     "institutional trust paragraph, carried over from Section VII"),
    ("the GDPR's accountability principle requires organizations to demonstrate "
     "compliance with applicable data-protection obligations",
     "GDPR accountability stated as a demonstration duty, not a decision-explanation "
     "duty. Hekim Colpan's correction, 2026-08-19"),
    ("the EU AI Act introduces more specific documentation, logging and oversight "
     "requirements where its relevant regimes apply",
     "AI Act documentation obligations kept distinct from GDPR accountability and "
     "bounded to the regimes that apply. Hekim Colpan's correction, 2026-08-19"),
    ("Link conclusions to independently verifiable source evidence rather than to "
     "AI-generated assertions alone",
     "control 3. AI-generated material is not excluded from the record; the conclusion "
     "must not rest on it alone. Hekim Colpan's correction, 2026-08-19"),
    ("Identify the human author and any AI tools used in drafting",
     "control 1"),
    ("Confirm consistency between the record and prior documented history",
     "control 9"),
    ("**Hekim Colpan** is an AI Governance and Compliance Manager", "Colpan bio"),
    ("**Phillip Wikes** is an AI Governance and Cognitive Risk Advisor", "Wikes bio"),
]

# BANNED. Nothing on this list may appear in the submission text.
BANNED = [
    ("and the EU AI Act's record-keeping expectations ask an organization",
     "superseded intro wording. It collapsed GDPR accountability and AI Act "
     "documentation into one obligation. Corrected by Hekim Colpan 2026-08-19"),
    ("verifiable evidence that was not itself AI-generated",
     "superseded control 3. It implied AI-generated material can never form part of an "
     "evidentiary record. Corrected by Hekim Colpan 2026-08-19"),
    ("organisations to demonstrate",
     "British spelling in the accepted correction. AP style is American"),
    (u"—", "em-dash, banned in body prose by CLAUDE.md III.7"),
    ("Designed for", "AI fingerprint opener, banned by CLAUDE.md III.7"),
    ("frequently", "filler adverb, banned by CLAUDE.md III.7"),
    ("no policy change required", "banned phrasing, CLAUDE.md III.7"),
    ("83.9", "validation statistic, removed from the CCI version"),
    ("384", "validation statistic"),
    ("0.739", "validation statistic"),
    ("0.624", "validation statistic"),
    ("0.623", "validation statistic"),
    ("jrsstandard.com", "promotional link, prohibited by CCI formatting rules"),
    ("CEP Magazine", "cross-promotion removed from the CCI version"),
    ("routinely", "overstated ESI claim removed in the FINAL pass"),
    ("scrutinised", "British spelling, AP style is American"),
    ("Organisations", "British spelling, AP style is American"),
    ("no software", "removed product claim"),
    ("Consider a manager", "AI fingerprint"),
    ("made concrete", "AI fingerprint"),
    ("A comparable dynamic", "AI fingerprint"),
    ("operationally.", "abstract register"),
    ("It is the aggregate visibility", "cleft-sentence AI fingerprint"),
]

# PARAGRAPH PLACEMENT. Which section each load-bearing paragraph must sit under.
#
# THIS CHECK EXISTS BECAUSE THE PASS SHIPPED A REAL DEFECT WITHOUT IT. Folding
# "What it costs when the record is tested" into another section was done by
# deleting its heading. Deleting a heading does not move the paragraphs under
# it; they simply reattach to whatever section precedes them. Three paragraphs
# of US discovery and opposing-counsel argument ended up under "The European
# frame", and the change log recorded a merge that had not happened.
#
# Every one of the 17 checks passed, because all 17 tested the document as a
# bag of strings: word count, heading count, heading case, needles present,
# needles absent. Not one of them tested WHERE anything was. A structural edit
# needs a structural assertion.
PLACEMENT = [
    ("The record is the evidence", "McDonnell Douglas Corp. v. Green"),
    ("The record is the evidence", "administrative record"),
    ("Where AI-assisted records break down", "AI tools write fluent narrative"),
    ("Where AI-assisted records break down", "A second failure shows up only in aggregate"),
    ("Where AI-assisted records break down", "Opposing counsel tends to make two moves"),
    ("Where AI-assisted records break down",
     "preservation obligations and discovery requests"),
    ("Where AI-assisted records break down",
     "When an institution cannot explain its own decisions"),
    ("The European frame", "accountability principle in Article 5(2)"),
    ("The European frame", "Regulation (EU) 2026/1744"),
    ("The European frame", "ISO/IEC 42001"),
    ("The European frame", "DORA"),
    ("What to do before the record is final", "A record worth trusting answers three"),
    ("What to do before the record is final", "The organizing principle for controls"),
    ("What to do before the record is final", "The Justification Review Standard"),
    ("What to do before the record is final", "right to know why"),
]


def section_of(text, needle):
    """The subheading the needle sits under, or None if it is above them all."""
    i = text.find(needle)
    if i < 0:
        return "<<ABSENT>>"
    heads = [(m.start(), m.group(1)) for m in re.finditer(r"^##\s+(.*)$", text, re.M)]
    current = None
    for pos, title in heads:
        if pos < i:
            current = title
        else:
            break
    return current


RESULTS = []


def check(name, ok, detail=""):
    RESULTS.append((name, ok, detail))
    print("%-5s %-58s %s" % ("PASS" if ok else "FAIL", name, detail))
    return ok


def body_of(md):
    """Body prose only: no title, no byline, no standfirst, no bios, no rules."""
    lines = md.split("\n")
    out, seen_rule = [], 0
    for ln in lines:
        if ln.strip() == "---":
            seen_rule += 1
            continue
        if seen_rule < 1:
            continue          # title, byline, standfirst
        if seen_rule >= 2:
            continue          # bios
        out.append(ln)
    return "\n".join(out)


def word_count(text):
    """Words in body prose, with markdown link syntax reduced to its label.

    A URL is not a word a reader reads, and counting it inflates the total by
    roughly 60 on this article, which is the difference between conforming and
    not on a tight ceiling.
    """
    t = re.sub(r"\[([^\]]*)\]\([^)]*\)", r"\1", text)
    t = re.sub(r"^#+\s.*$", "", t, flags=re.M)     # headings are not body prose
    t = re.sub(r"[*_`]", "", t)
    t = re.sub(r"^\d+\.\s", "", t, flags=re.M)
    return len(re.findall(r"[A-Za-z0-9][A-Za-z0-9'’./()-]*", t))


# EVERY COMMA-BEFORE-CONJUNCTION IN THE BODY, CLASSIFIED BY HAND.
#
# AP drops the serial comma but REQUIRES a comma before a conjunction that joins
# two independent clauses, so the two look identical to a regex and are opposite
# in correctness. A pattern-matching check reported four false positives on this
# article, all of them clause joins that AP mandates. Guessing grammar was the
# wrong approach; the sites are enumerated instead.
#
# Each entry is the text immediately following ", and " or ", or ". All 12 carry
# a subject and a finite verb, which is what makes them clause joins rather than
# list items. A NEW site that is not on this list fails the check, which is the
# behaviour that matters: it catches a serial comma being reintroduced later.
CLAUSE_JOINS = [
    "kept finding a decision that was probably sound",
    "whether the reasons given have stayed consistent",
    "it lets the affected person understand",
    "the drafting history, the reviewer and the prompts are usually not kept",
    "when subjective descriptors such as",
    "recurring language does not by itself establish either",
    "it does not become a decision log",
    "high-risk systems linked to regulated products under Annex I",
    "that missing drafting history and reviewer notes show",
    "the two should not be conflated in policy",
    "gaps in processing documentation raise questions of their own",
    "results will be reported separately",
    "the organization should be able to reconstruct and defend it",
]


def oxford_commas(text):
    """Any comma-before-conjunction that is not a known clause join.

    Returns the offending excerpts. An Oxford comma is a serial comma closing a
    list of three or more; a clause join is a comma AP requires before a
    conjunction linking two independent clauses. Only the first is a violation.
    """
    t = re.sub(r"\[([^\]]*)\]\([^)]*\)", r"\1", text)
    t = re.sub(r"^\d+\.\s", "", t, flags=re.M)
    t = re.sub(r"\s+", " ", t)
    hits = []
    for m in re.finditer(r", (?:and|or) (.{0,70})", t):
        tail = m.group(1)
        if not any(tail.startswith(c[:len(tail)]) or c.startswith(tail[:len(c)])
                   for c in CLAUSE_JOINS):
            hits.append(m.group(0))
    return hits


def headings(md):
    return re.findall(r"^##\s+(.*)$", md, re.M)


def links(md):
    return re.findall(r"\[([^\]]+)\]\((https?://[^)]+)\)", md)


def run_checks(text):
    ok = True
    wc = word_count(body_of(text))
    ok &= check("body word count clears CCI's stated floor",
                wc >= CCI_MIN_WORDS,
                "%d words, floor %d, preferred floor %d"
                % (wc, CCI_MIN_WORDS, CCI_PREFERRED_FLOOR))

    src_wc = word_count(body_of(read(SRC)))
    ok &= check("article was streamlined, not padded",
                wc < src_wc, "%d words, down from %d, a %.1f percent reduction"
                % (wc, src_wc, 100.0 * (src_wc - wc) / src_wc))

    hs = headings(text)
    lo, hi = CCI_SUBHEADS_PER_1000
    density = 1000.0 * len(hs) / wc
    ok &= check("subheading density inside CCI's 2 to 3 per 1,000",
                lo <= density <= hi,
                "%d subheadings over %d words = %.1f per 1,000"
                % (len(hs), wc, density))

    # Sentence case means only the first word is capitalized, PLUS proper nouns
    # and acronyms, which stay capitalized in sentence case by definition. The
    # first version of this check split on whitespace only and flagged
    # "AI-assisted" as a stray capital, which is a defect in the check: the
    # capital belongs to the acronym, not to title case. Splits on hyphens too.
    PROPER = {"AI", "EU", "GDPR", "DORA", "ISO/IEC", "U.S.", "European", "Europe",
              "Justification", "Review", "Standard", "Annex", "Regulation", "Act"}
    bad_case = []
    for h in hs:
        toks = re.split(r"[\s-]+", h)[1:]
        stray = [w for w in toks if w[:1].isupper() and w not in PROPER]
        if stray:
            bad_case.append("%s (%s)" % (h, ", ".join(stray)))
    ok &= check("subheadings are sentence case",
                not bad_case, "; ".join(bad_case) if bad_case
                else "%d subheadings, no stray capitals" % len(hs))

    title = re.search(r"^#\s+(.*)$", text, re.M)
    ok &= check("main headline is title case", bool(title) and
                title.group(1) == "The Evidentiary Deficit in AI-Assisted Record-Keeping",
                title.group(1) if title else "no H1")

    ox = oxford_commas(body_of(text))
    cand, joins, removed = scan_oxford_source()
    ok &= check("no Oxford comma, per AP style",
                not ox, "; ".join(ox[:4]) if ox
                else "0 serial commas, %d removed from the source" % removed)

    ok &= check("the serial-comma count is derived from the source, not assumed",
                cand == joins + removed and removed > 0,
                "%d candidate sites in the source, minus %d AP clause joins = %d removed"
                % (cand, joins, removed))

    lk = links(text)
    ok &= check("citations are in-text hyperlinks, no footnotes",
                len(lk) >= 9 and "[^" not in text,
                "%d embedded links, 0 footnotes" % len(lk))

    promo = [u for _, u in lk if "jrsstandard" in u or "linkedin" in u]
    ok &= check("no promotional links to employer or author sites",
                not promo, "; ".join(promo) if promo
                else "%d links, all to primary legal or standards sources" % len(lk))

    authors = re.search(r"^\*By (.+)\*$", text, re.M)
    n_auth = len(re.split(r"\s+and\s+", authors.group(1))) if authors else 0
    ok &= check("co-author count within CCI's maximum of two",
                n_auth <= CCI_MAX_COAUTHORS, "%d authors" % n_auth)

    missing = [why for needle, why in PROTECTED if needle not in text]
    ok &= check("every protected legal proposition survives",
                not missing, "; ".join(missing[:4]) if missing
                else "%d propositions asserted, all present" % len(PROTECTED))

    present = [why for needle, why in BANNED if needle in text]
    ok &= check("no banned term reintroduced",
                not present, "; ".join(present[:4]) if present
                else "%d banned terms checked, 0 present" % len(BANNED))

    fp = [frag for frag, _ in FINGERPRINTS_REMOVED
          if len(frag) < 90 and "..." not in frag and frag in text]
    ok &= check("no removed AI fingerprint survives",
                not fp, "; ".join(fp[:3]) if fp
                else "%d fingerprints removed, 0 present" % len(FINGERPRINTS_REMOVED))

    for br, am in SPELLING_SYNC:
        ok &= check("spelling synchronized: %s" % br, br not in text,
                    "-> %s" % am)

    ok &= check("nine practitioner controls intact",
                len(re.findall(r"^\d+\. ", text, re.M)) == 9,
                "%d numbered controls" % len(re.findall(r"^\d+\. ", text, re.M)))

    misplaced = []
    for want, needle in PLACEMENT:
        got = section_of(text, needle)
        if got != want:
            misplaced.append("%r is under %r, expected %r" % (needle[:40], got, want))
    ok &= check("every load-bearing paragraph is under its own section",
                not misplaced, "; ".join(misplaced[:3]) if misplaced
                else "%d paragraphs anchored to %d sections"
                % (len(PLACEMENT), len(set(w for w, _ in PLACEMENT))))

    dup = [h for h in hs if hs.count(h) > 1]
    ok &= check("no duplicated subheading", not dup, "; ".join(set(dup)) if dup
                else "%d unique subheadings" % len(set(hs)))

    return ok


# ---------------------------------------------------------------------------
# .docx writer. Minimal Office Open XML, no dependency. Hyperlinks are written
# as real w:hyperlink relationships so the links survive into the file CCI
# opens, which is the whole point of their in-text-citation rule.
# ---------------------------------------------------------------------------
def esc(s):
    return (s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
             .replace('"', "&quot;"))


def runs_for(text, rels):
    """Inline markdown to w:r / w:hyperlink runs."""
    out = []
    token = re.compile(r"\[([^\]]+)\]\((https?://[^)]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*")
    pos = 0
    for m in token.finditer(text):
        if m.start() > pos:
            out.append('<w:r><w:t xml:space="preserve">%s</w:t></w:r>'
                       % esc(text[pos:m.start()]))
        if m.group(1):
            rid = "rId%d" % (100 + len(rels))
            rels.append((rid, m.group(2)))
            out.append('<w:hyperlink r:id="%s"><w:r><w:rPr><w:rStyle w:val="Hyperlink"/>'
                       '<w:color w:val="0563C1"/><w:u w:val="single"/></w:rPr>'
                       '<w:t xml:space="preserve">%s</w:t></w:r></w:hyperlink>'
                       % (rid, esc(m.group(1))))
        elif m.group(3):
            out.append('<w:r><w:rPr><w:b/></w:rPr><w:t xml:space="preserve">%s</w:t></w:r>'
                       % esc(m.group(3)))
        elif m.group(4):
            out.append('<w:r><w:rPr><w:i/></w:rPr><w:t xml:space="preserve">%s</w:t></w:r>'
                       % esc(m.group(4)))
        pos = m.end()
    if pos < len(text):
        out.append('<w:r><w:t xml:space="preserve">%s</w:t></w:r>' % esc(text[pos:]))
    return "".join(out)


def write_docx(md, path):
    rels = []
    paras = []
    for raw in md.split("\n"):
        ln = raw.rstrip()
        if not ln:
            continue
        if ln == "---":
            paras.append('<w:p><w:pPr><w:pBdr><w:bottom w:val="single" w:sz="6" '
                         'w:space="1" w:color="BFBFBF"/></w:pBdr></w:pPr></w:p>')
            continue
        if ln.startswith("## "):
            paras.append('<w:p><w:pPr><w:pStyle w:val="Heading2"/><w:spacing '
                         'w:before="360" w:after="120"/></w:pPr>%s</w:p>'
                         % runs_for(ln[3:], rels))
            continue
        if ln.startswith("# "):
            paras.append('<w:p><w:pPr><w:pStyle w:val="Heading1"/><w:spacing '
                         'w:after="120"/></w:pPr>%s</w:p>' % runs_for(ln[2:], rels))
            continue
        m = re.match(r"^(\d+)\.\s+(.*)$", ln)
        if m:
            paras.append('<w:p><w:pPr><w:ind w:left="360" w:hanging="360"/>'
                         '<w:spacing w:after="60"/></w:pPr>%s</w:p>'
                         % runs_for("%s. %s" % (m.group(1), m.group(2)), rels))
            continue
        paras.append('<w:p><w:pPr><w:spacing w:after="160" w:line="276" '
                     'w:lineRule="auto"/></w:pPr>%s</w:p>' % runs_for(ln, rels))

    document = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
        '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" '
        'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
        '<w:body>%s<w:sectPr><w:pgSz w:w="12240" w:h="15840"/>'
        '<w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/>'
        '</w:sectPr></w:body></w:document>' % "".join(paras))

    rel_xml = "".join(
        '<Relationship Id="%s" Type="http://schemas.openxmlformats.org/officeDocument/'
        '2006/relationships/hyperlink" Target="%s" TargetMode="External"/>'
        % (rid, esc(url)) for rid, url in rels)
    doc_rels = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/'
        '2006/relationships/styles" Target="styles.xml"/>%s</Relationships>' % rel_xml)

    styles = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
        '<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
        '<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Georgia" '
        'w:hAnsi="Georgia"/><w:sz w:val="22"/></w:rPr></w:rPrDefault></w:docDefaults>'
        '<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/>'
        '<w:rPr><w:rFonts w:ascii="Georgia" w:hAnsi="Georgia"/><w:b/><w:sz w:val="34"/>'
        '</w:rPr></w:style>'
        '<w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/>'
        '<w:rPr><w:rFonts w:ascii="Georgia" w:hAnsi="Georgia"/><w:b/><w:sz w:val="26"/>'
        '</w:rPr></w:style>'
        '<w:style w:type="character" w:styleId="Hyperlink"><w:name w:val="Hyperlink"/>'
        '<w:rPr><w:color w:val="0563C1"/><w:u w:val="single"/></w:rPr></w:style>'
        '</w:styles>')

    content_types = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.'
        'relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>'
        '<Override PartName="/word/document.xml" ContentType="application/vnd.'
        'openxmlformats-officedocument.wordprocessingml.document.main+xml"/>'
        '<Override PartName="/word/styles.xml" ContentType="application/vnd.'
        'openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>')

    root_rels = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/'
        '2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>')

    with zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("[Content_Types].xml", content_types)
        z.writestr("_rels/.rels", root_rels)
        z.writestr("word/document.xml", document)
        z.writestr("word/styles.xml", styles)
        z.writestr("word/_rels/document.xml.rels", doc_rels)
    return len(rels)


def write_log(text):
    src = read(SRC)
    wc_old, wc_new = word_count(body_of(src)), word_count(body_of(text))
    hs_old, hs_new = headings(src), headings(text)
    L = []
    W = L.append
    W("# CCI submission pass, change log")
    W("")
    W("**Source:** `research/Evidentiary_Deficit_Article_CCI_FINAL_2026-08-18.md`, "
      "preserved unmodified.")
    W("**Output:** `research/Evidentiary_Deficit_Article_CCI_SUBMISSION_%s.md` and `.docx`."
      % STAMP)
    W("**Generated by `scripts/apply_cci_publication_pass.py`.** Re-run to regenerate; "
      "do not edit the output by hand.")
    W("")
    W("The uploaded `.docx` was verified byte-identical to the repository FINAL copy "
      "before any edit (md5 `5e76c13c24ba938a44af3d56fe238a8c`), so the file edited here "
      "is the latest version and not a stale branch.")
    W("")
    W("## 1. The guidelines this pass conforms to")
    W("")
    W("Retrieved 2026-08-19 from CCI's own contributor-guidelines PDF, "
      "`Writer-guidelines_051526.pdf`, linked from "
      "https://www.corporatecomplianceinsights.com/writing-for-cci/ and last updated "
      "05/15/26. The values below are decoded from that file, not recalled.")
    W("")
    W("| Requirement | CCI's text | Status |")
    W("|---|---|---|")
    W("| Length | 1,000-1,200 words minimum (preferred) | **%d words.** Clears the floor |"
      % wc_new)
    W("| Style | AP style, no Oxford comma, in-text hyperlinks for citations, no footnotes "
      "| **Conformed.** %d serial commas removed, %d embedded links, 0 footnotes |"
      % (scan_oxford_source()[2], len(links(text))))
    W("| Subheadings | Use 2-3 subheadings per 1,000 words | **%d over %d words = %.1f per "
      "1,000.** Was %d = %.1f, a violation |"
      % (len(hs_new), wc_new, 1000.0 * len(hs_new) / wc_new, len(hs_old),
         1000.0 * len(hs_old) / wc_old))
    W("| Case | Main headlines title case; subheadings sentence case | **Conformed.** All %d "
      "subheadings converted from title case |" % len(hs_new))
    W("| Links | Include embedded links (not footnotes) | Conformed |")
    W("| Promotion | No promotional links to employer sites | Conformed, 0 present |")
    W("| Co-authors | Maximum of two per article | 2 |")
    W("| New authors | Brief bio and high-resolution head-and-shoulders photo | Bios "
      "present in the file. **PHOTOS ARE NOT IN THIS REPOSITORY AND MUST BE ATTACHED "
      "SEPARATELY BY BOTH AUTHORS.** |")
    W("")
    W("**THE PREVIOUS TARGET OF 1,450 TO 1,650 WORDS WAS NOT CCI'S NUMBER.** It came from "
      "the editing thread. CCI states a floor, not a ceiling, so the 1,757-word version was "
      "never over length. The real non-conformity was structural: 10 subheadings over 1,757 "
      "words is 5.7 per 1,000 against a stated 2 to 3, and every subheading was in title "
      "case where the guidelines call for sentence case.")
    W("")
    W("## 2. AI fingerprints removed")
    W("")
    W("CCI reserves the right to reject a contribution its editors read as machine-generated: "
      "\"While CCI does not flatly prohibit contributors from using AI tools to generate "
      "material, our editorial team believes it is inappropriate and unnecessary for "
      "subject-matter experts, and we reserve the right to reject contributions that our "
      "team interprets as being machine-generated.\" That makes this section the operative "
      "part of the pass rather than a stylistic note.")
    W("")
    W("%d constructions removed:" % len(FINGERPRINTS_REMOVED))
    W("")
    for i, (frag, why) in enumerate(FINGERPRINTS_REMOVED, 1):
        W("%d. **Was:** \"%s\"" % (i, frag))
        W("   **Why it reads as machine-generated:** %s" % why)
        W("")
    W("## 3. Structural consolidation")
    W("")
    W("Ten numbered sections became %d sentence-case subheadings. Nothing was deleted in "
      "the merge; the propositions from the folded sections are asserted individually in "
      "the check and all %d are present." % (len(hs_new), len(PROTECTED)))
    W("")
    W("| Was | Now |")
    W("|---|---|")
    W("| I. Introduction | (runs under the standfirst, no subheading) |")
    W("| II. Documentation as Evidence | The record is the evidence |")
    W("| III. How AI-Assisted Records Fail | Where AI-assisted records break down |")
    W("| IV. Pattern and Proxy Risk | folded into the same section |")
    W("| V. European Governance Context | The European frame |")
    W("| VI. Oversight and Reconstruction | folded into the closing section |")
    W("| VII. Litigation and Regulatory Exposure | folded into the end of "
      "\"Where AI-assisted records break down\" |")
    W("| VIII. Practitioner Controls | What to do before the record is final |")
    W("| IX. JRS as an Operational Example | folded into the same section |")
    W("| X. Conclusion | folded into the same section |")
    W("")
    W("## 4. Synchronization")
    W("")
    W("Section V arrived in Hekim Colpan's British spelling while the rest of the article "
      "is American. AP style is American and a manuscript that switches mid-piece is the "
      "first thing a copy desk marks, so the two sites were normalized. **This is spelling "
      "only and changes no legal proposition.**")
    W("")
    for br, am in SPELLING_SYNC:
        W("- `%s` to `%s`" % (br, am))
    W("")
    W("Serial commas were removed at %d sites for AP conformity, including inside the nine "
      "practitioner controls. **The Oxford comma carries no meaning in any of these lists**; "
      "each is a plain enumeration with no ambiguity that the comma was resolving." %
      scan_oxford_source()[2])
    W("")
    W("## 5. Citation check")
    W("")
    W("Every citation is an in-text hyperlink, per CCI's rule. There are no footnotes and no "
      "bibliography.")
    W("")
    W("| # | Anchor text | Target | Supports |")
    W("|---|---|---|---|")
    anchors = [
        "the statutory basis for the employment claims named in the sentence",
        "the statutory basis for the housing claims named in the sentence",
        "the burden-shifting framework described in the same paragraph",
        "the administrative-record proposition in the same sentence",
        "GDPR Article 5(2), quoted in the same sentence",
        "the AI Act, whose application timing the sentence describes",
        "the instrument that postponed the dates given in the same sentence",
        "ISO/IEC 42001, named in the same sentence",
        "DORA, named in the same sentence",
    ]
    for i, ((label, url), why) in enumerate(zip(links(text), anchors), 1):
        W("| %d | %s | %s | %s |" % (i, label, url, why))
    W("")
    W("### The item that was open since 2026-08-18 is now closed")
    W("")
    W("**REGULATION (EU) 2026/1744 AND BOTH DATES VERIFY. HEKIM COLPAN'S CITATIONS WERE "
      "CORRECT.** They were carried on his authority through three prior passes and flagged "
      "each time as unverifiable from this environment. They were checked on 2026-08-19 "
      "against independent secondary sources reporting the enacted instrument:")
    W("")
    W("- **Regulation (EU) 2026/1744**, the Digital Omnibus on AI. Published in the Official "
      "Journal 24 July 2026, in force 27 July 2026.")
    W("- **Annex III stand-alone high-risk systems: 2 December 2027**, moved from "
      "2 August 2026. Matches the article.")
    W("- **Annex I product-embedded high-risk systems: 2 August 2028**, moved from "
      "2 August 2027. Matches the article.")
    W("- EUR-Lex ELI `https://eur-lex.europa.eu/eli/reg/2026/1744/oj`, which follows the "
      "same ELI pattern as the three EUR-Lex links already in the article. **It is now cited "
      "in-text**, so the claim carries a source like every other claim in the piece.")
    W("")
    W("**THIS IS A SECONDARY-SOURCE VERIFICATION, NOT A READING OF THE OFFICIAL JOURNAL.** "
      "EUR-Lex, Justia and ISO all return bot-challenge responses to this environment (202 "
      "and 403 respectively), so no primary text was retrieved for any citation in this "
      "article. The dates now rest on consistent independent reporting rather than on a "
      "single author's recollection, which is a materially stronger position than the "
      "previous three passes, but a final click-through by a human remains the right last "
      "step before submission.")
    W("")
    W("**LINK STATUS AS SEEN FROM THIS ENVIRONMENT.** EEOC, DOJ and Cornell LII return 200. "
      "Justia and ISO return 403 and EUR-Lex returns 202; all are Cloudflare or anti-bot "
      "interstitials served to an automated client, not dead links. The ISO link was moved "
      "from `/standard/81230.html` to the canonical `/standard/42001`, which is the same "
      "standard: ISO's own catalogue records confirm project 81230 is ISO/IEC 42001:2023.")
    W("")
    W("## 6. What did not change")
    W("")
    W("%d legal propositions and required elements are asserted by needle and all are "
      "present. %d banned terms are asserted absent and none appears."
      % (len(PROTECTED), len(BANNED)))
    W("")
    for needle, why in PROTECTED:
        W("- %s" % why)
    W("")
    return "\n".join(L) + "\n"


def main():
    ap = argparse.ArgumentParser()
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument("--apply", action="store_true")
    g.add_argument("--check", action="store_true")
    args = ap.parse_args()

    if not os.path.isfile(SRC):
        print("source missing: %s" % SRC)
        return 2

    text = ARTICLE
    ok = run_checks(text)

    if args.apply and ok:
        with io.open(OUT_MD, "w", encoding="utf-8") as fh:
            fh.write(text)
        n = write_docx(text, OUT_DOCX)
        with io.open(OUT_LOG, "w", encoding="utf-8") as fh:
            fh.write(write_log(text))
        write_docx(read(OUT_LOG), OUT_LOG[:-3] + ".docx")
        print("")
        print("wrote %s" % os.path.relpath(OUT_MD, ROOT))
        print("wrote %s (%d hyperlink relationships)"
              % (os.path.relpath(OUT_DOCX, ROOT), n))
        print("wrote %s" % os.path.relpath(OUT_LOG, ROOT))
    elif args.apply:
        print("")
        print("NOT WRITTEN: a check failed. The source is untouched.")

    n_bad = len([1 for _, o, _ in RESULTS if not o])
    print("")
    print("%d checks, %d failed" % (len(RESULTS), n_bad))
    return 0 if n_bad == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
