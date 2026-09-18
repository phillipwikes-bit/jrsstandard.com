#!/usr/bin/env python3
"""ESTATE-WIDE STALE CURRENT-STATE SWEEP.

Reads every current-state record in the estate and reports, per proposition,
whether any record still asserts a state that an authoritative correction has
superseded. It is a SWEEP, not a control: recall is its job, and every flag it
raises is triaged by a person. The standing controls live in
scripts/check_zero_drift.py, which asserts named propositions exactly.

RUN: python3 scripts/estate_state_sweep.py

WHY IT IS COMMITTED. The reconciliation of 2026-09-18 claimed that no material
stale current-state representation remained. A claim of that shape is worth
nothing if it cannot be re-derived, so the instrument that produced it is kept
beside the report rather than discarded with the session that wrote it.

WHAT IT GETS RIGHT, EACH BECAUSE IT FIRST GOT IT WRONG. The corrections are
documented at their sites below; the short version is that every one of them is
the same mistake -- judging an assertion by what sits NEAR it rather than by what
sits IN it. That mistake let three live stale claims through on the first pass.
"""

import re, json, sys, os, glob
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# PROPOSITION BASELINE: id -> (current state, patterns that would assert the OLD state)
PROPS = {
 # \bS-1\b, with a LEFT boundary too. Without it the pattern matched the HTML id
 # "module-status-1" on a deployed training page and reported a public page as
 # carrying estate state. A missing boundary on one side of a token is the
 # cheapest false positive there is and the easiest to stop believing the scan over.
 "S-1":            ("CLOSED (E-031)", [r"\bS-1\b", r"de-identification review"]),
 "S-6/T-6":        ("CLOSED (E-032)", [r"\bS-6\b", r"\bT-6\b", r"superseded figures"]),
 "Section 2.1":    ("CLOSED (E-033,E-036)", [r"Section 2\.1"]),
 "V-AI-08/Gabi":   ("PARTICIPATION PRESERVED; contribution corrected", [r"V-AI-08", r"Cortez"]),
 "X-15":           ("CLOSED", [r"X-15"]),
 "CT-1/Ubayet":    ("FACTUAL CLOSED; legal with B-004", [r"CT-1\b", r"Ubayet"]),
 "domain":         ("CONTROL CONFIRMED (E-035)", [r"domain registrar", r"registrar (record|account)"]),
 "B-001":          ("OWNER-CONFIRMED", [r"B-001"]),
 "CT-2":           ("CLOSED AS FRAMED", [r"CT-2\b"]),
 "CT-5":           ("ACCOUNT SUPPLIED (E-029)", [r"CT-5\b"]),
}

# OLD-STATE assertions, incl. semantic variants
OLD = re.compile(r"OWNER INPUT REQUIRED|OWNER ACTION REQUIRED|OWNER FACTUAL CONFIRMATION REQUIRED|"
                 r"COUNSEL REVIEW REQUIRED|COUNSEL ACTION|COUNSEL REQUIRED|"
                 r"awaiting owner|pending owner|owner confirmation required|owner decision required|"
                 r"owner has not confirmed|awaiting factual confirmation|needs owner|"
                 r"\bOPEN\b|UNRESOLVED|\bUNKNOWN\b|BLOCKED|\bPENDING\b|REMAINING QUESTION|"
                 r"NOT CONFIRMED|NOT RESOLVED|ACTIVE DEPENDENCY|NOT ESTABLISHED|"
                 # DEPENDENCY VOCABULARY, added 2026-09-18 after a mutation test.
                 # "The revocation is queued behind B-001" asserts the old state
                 # as plainly as any status word, and NONE of the terms above
                 # appear in it. Three live claims of exactly this shape were
                 # found by hand, not by this scan; restoring one under test was
                 # then classified "no assertion in unit". A proposition baseline
                 # that cannot see a stale DEPENDENCY is not a baseline.
                 # NARROWED the same day: as bare words, "prerequisite",
                 # "depends on" and "blocked on" are ordinary prose and produced
                 # 27 flags across the ledger and three reports, none of them a
                 # stale claim. A dependency assertion only matters here when it
                 # NAMES the thing depended on, so the item id is required.
                 r"(?:queued behind|blocked on|waiting on|waits on|depend(?:s|ent) on|"
                 r"prerequisite(?:\s+is)?[:,]?|behind)\s*\**"
                 r"(?:B-0\d\d|S-\d+|T-\d+|X-\d+|CT-[\w.]+|V-4)|"
                 # WITHDRAWN the same day: a bare "OWNER FACTUAL" was added to
                 # catch a record re-labelling a closed matter, and it matched
                 # the SOURCE LABEL "Owner factual confirmation directive" on
                 # every attestation row in the ledger and every category cell in
                 # the continuity index - 17 flags, not one of them a claim. The
                 # proposition it was meant to protect (Section 2.1 in the
                 # chain-of-title record) is a NAMED, STANDING matter, so it
                 # belongs to a guard in check_zero_drift.py, which can assert
                 # the specific thing that must hold. A broad sweep and a
                 # standing control are different instruments; widening the
                 # sweep until it does the control's job only blunts it.
                 r"ACTIVE BLOCKER", re.I)

# Markers that make an occurrence HISTORICAL rather than a current claim
# TIGHTENED after a manual false-negative check. The first version included bare
# \bnot\b and \bnever\b as historical markers, so "the old token was not tested"
# and "CONDITIONS NOT MET" excused three LIVE stale claims in
# HUMAN_DECISIONS_REQUIRED.md. A negation somewhere in a 600-character window
# says nothing about whether THIS sentence asserts the old state.
HIST = re.compile(r"~~|SUPERSEDED|RECONCILED|CORRECTED|WITHDRAWN|raised in error|"
                  r"OWNER-CONFIRMED|OWNER ACTION COMPLETED|ANSWERED|SUPPLIED|"
                  r"\bCLOSED\b|LIMB CLOSED|FACTUALLY RESOLVED|"
                  r"prior (text|status|wording|finding)|was once|previously|"
                  r"earlier record|snapshot|historical|attestation|"
                  r"no longer (an|a|open|required)|deferred by|INTENTIONALLY UNRESOLVED", re.I)


def flat(t):
    return re.sub(r"\s+", " ", re.sub(r"^\s*>\s?", "", t, flags=re.M))

# ---- CURRENT-STATE RECORD SCOPE: seven mandatory + discovered ----
MANDATORY = [
 ".jrs/state/BLOCKERS.json",
 "docs/enterprise-diligence/HUMAN_DECISIONS_REQUIRED.md",
 "docs/enterprise-diligence/JRS_QUESTION_RESOLUTION_MATRIX_2026-09-16.md",
 "docs/enterprise-diligence/COUNSEL_REVIEW_PACKET_2026-09-16.md",
 "docs/enterprise-diligence/JRS_BOARD_DECISION_REGISTER_2026-09-16.md",
 "docs/enterprise-diligence/JRS_CURRENT_DEPENDENCY_GRAPH_2026-09-16.md",
 "docs/enterprise-diligence/OWNER_RESOLUTION_BATCH_2026-09-18.md",
]
ALSO = [
 "docs/enterprise-diligence/JRS_MASTER_ASSET_EVIDENCE_AND_CHAIN_OF_TITLE_REGISTER.md",
 "docs/enterprise-diligence/EVIDENCE_LEDGER.md",
 "docs/enterprise-diligence/CHAIN_OF_TITLE_STATUS.md",
 "docs/enterprise-diligence/JRS_PHASE_0_CLOSURE_DETERMINATION_2026-09-17.md",
 "docs/enterprise-diligence/FINAL_PRE_GATE_1_READINESS_AUDIT_2026-09-16.md",
 "docs/enterprise-diligence/DEPLOYMENT_READINESS_REPORT_2026-09-17.md",
 "docs/enterprise-diligence/JRS_INSTITUTIONAL_CONTINUITY_INDEX.md",
 "docs/enterprise-diligence/JRS_NEXT_STEPS_CLAUDE_CODE_INSTRUCTIONS_2026-09-16.md",
 "docs/enterprise-diligence/MISSING_EVIDENCE_REGISTER.md",
 "docs/enterprise-diligence/OWNER_INPUT_QUESTIONNAIRE.md",
 "docs/enterprise-diligence/RIGHTS_EVIDENCE_GAP_MEMO.md",
 "docs/enterprise-diligence/GATE_1_REMEDIATION_REPORT.md",
 ".jrs/reports/GATE_1_REMAINING_ITEMS.md",
 ".jrs/reports/GATE_1_REPORT.md",
 ".jrs/registries/COMMERCIAL_RIGHTS_REGISTER.json",
 ".jrs/registries/RIGHTS_REGISTER.json",
 ".jrs/registries/DEPENDENCY_REGISTER.json",
 ".jrs/state/CURRENT_PHASE.json",
]



# A STATUS DECLARATION, not a word that happens to appear in the prose.
#
# v2 classified "| T-6 | Could the CORRECTED distribution read as a decline? |
# **OWNER FACTUAL CONFIRMATION REQUIRED** |" as HISTORICAL, because "corrected"
# occurs inside the QUESTION TEXT. A live "REQUIRED" status was excused by a
# vocabulary word in its own subject line. Bare CORRECTED, SUPPLIED, ANSWERED
# and RESOLVED are therefore dropped as markers; each is re-admitted only in a
# form that can only be a status declaration.
STRONG_HIST = re.compile(
    r"SUPERSEDED|WITHDRAWN|RECONCILED|OWNER-CONFIRMED|OWNER ACTION COMPLETED|"
    r"\bCLOSED\b|LIMB CLOSED|FACTUALLY RESOLVED|raised in error|"
    r"CORRECTED(?:\s+(?:as to|in place|20\d\d|[:—-]))|\*\*Corrected\.?\*\*|"
    r"prior (?:text|status|wording|finding|version)|was once|previously|"
    r"no longer (?:an|a|open|required|true)|INTENTIONALLY UNRESOLVED|"
    r"DEFERRED BY OWNER|DEFERRED_BY_OWNER|earlier record|historical snapshot",
    re.I)

# Text the record has EXPRESSLY RETIRED: struck through, or quoted as prior
# wording. Rule 10 requires the old words be preserved in place, so a scanner
# that reads them as live claims would make every correction look like a defect.
RETIRED = re.compile(r"~~.+?~~|prior text read '.+?'", re.S)

def mask_retired(text):
    """Blank out EXPRESSLY RETIRED text - struck through, or quoted as prior
    wording - across the WHOLE document, one space per character.

    Doing this per unit failed: a strikethrough routinely spans several
    sentences, so a unit could hold the closing "~~" without the opening one and
    the span went unrecognised. The greedy fallback added to cope with that then
    swallowed everything after any stray marker. Masking at document scope sees
    whole spans; replacing character-for-character keeps every offset exact, so
    unit boundaries computed on the masked text still address the real file.

    Rule 10 requires retired wording to stay in place. A scanner that read it as
    a live claim would report every correction this project has ever made as a
    fresh defect."""
    return RETIRED.sub(lambda m: " " * len(m.group(0)), text)

def live(unit):
    return unit

def flat(t):
    return re.sub(r"[ \t]+", " ", re.sub(r"^\s*>\s?", "", t, flags=re.M))

def soften(text):
    """Replace SOFT-WRAP newlines with spaces, LENGTH-PRESERVINGLY.

    These documents are hard-wrapped at ~90 columns, so a sentence routinely
    spans two or three physical lines. Splitting per line cut sentences in half
    and scored each half alone. Joining the lines with " ".join() fixed the
    meaning but SHIFTED EVERY OFFSET by one character per line, so matches then
    resolved to the wrong unit - a silent, worse bug than the one it replaced.

    Newline -> space is 1 character for 1 character, so doing the substitution
    in place keeps every offset exact. A newline is softened only when it joins
    two ordinary prose lines: blank lines (paragraph breaks) and any line that
    is a table row, heading, list item or fence stay hard.
    """
    lines = text.split("\n")
    def hard(l):
        s = l.strip()
        # A LIST MARKER IS "- " OR "* ", NOT A BARE ASTERISK. Treating "*" as a
        # marker made every line opening with bold ("**OWNER-CONFIRMED...**") a
        # hard break, so a wrapped sentence stayed split and its second half -
        # which carried the CURRENT status - never reached the first half.
        return (not s) or l.count("|") >= 2 or s.startswith(("#", "```", "|")) \
               or bool(re.match(r"(?:[-*+]|\d+\.)\s", s))
    out = []
    for i, l in enumerate(lines):
        out.append(l)
        if i == len(lines) - 1:
            continue
        out.append(" " if not (hard(l) or hard(lines[i + 1])) else "\n")
    return "".join(out)

def units(text):
    """Yield (start, end, unit_text) over SOFTENED text: the smallest span that
    can carry ONE assertion about one subject, with exact offsets.

    A MARKDOWN TABLE ROW IS ONE UNIT, NEVER ITS CELLS. The subject sits in
    column 1 and its status in column 3; splitting on "|" severed "| S-6 |"
    from "| OWNER FACTUAL CONFIRMATION REQUIRED |", and the subject cell was
    then scored "no assertion in unit" - a false negative on a live stale row.
    """
    for lm in re.finditer(r"[^\n]+", text):
        line, base = lm.group(0), lm.start()
        if line.count("|") >= 2:
            yield base, base + len(line), line
            continue
        # Boundaries are taken from the separators' ACTUAL spans. Assuming a
        # one-character separator and advancing by len(s)+1 desynchronised every
        # unit after a two-space sentence break.
        # A "~~" IS A UNIT BOUNDARY IN ITS OWN RIGHT. Struck text and the note
        # that replaces it are never the same assertion, and they are frequently
        # not separated by ". " - "...behind B-001.~~ **EDGE REMOVED...**" has no
        # split point the sentence rule can see. Without this, a PARTIAL revert
        # (one "~~" removed, its partner left behind) merged the revived stale
        # claim into its own correction note and the note's status marker then
        # excused it. That is drift dressed as a fix, which is the exact shape
        # this scan exists to catch.
        cuts = [0] + [m.end() for m in
                      re.finditer(r"(?<=[.!?])\s+(?=[A-Z*_`~(\[])|~~", line)] + [len(line)]
        for a, b in zip(cuts, cuts[1:]):
            s = line[a:b].rstrip()
            yield base + a, base + a + len(s), s

def json_units(path):
    """For a .json record, the unit is ONE DECODED STRING VALUE, not a slice of
    the serialized file. Scanning the raw bytes made a whole object look like one
    sentence, so a CLOSED marker in a sibling field excused a stale field beside
    it - the same "read the storage, not the meaning" error that the \\n escape
    caused earlier in this project.
    Yields (path_label, string_value)."""
    out = []
    def walk(node, label):
        if isinstance(node, dict):
            ident = node.get("id") or node.get("blocker_id") or ""
            for k, v in node.items():
                walk(v, f"{label}.{ident or ''}.{k}".replace("..", "."))
        elif isinstance(node, list):
            for i, v in enumerate(node):
                walk(v, f"{label}[{i}]")
        elif isinstance(node, str):
            out.append((label, node))
    walk(json.load(open(path, encoding="utf-8")), "")
    return out


def scan(files):
    rows = []
    for f in files:
        p = os.path.join(ROOT, f)
        if not os.path.exists(p):
            rows.append(dict(file=f, prop="-", tok="-", strict="MISSING",
                             loose="MISSING", unit="")); continue
        if f.endswith(".json"):
            # A LONG FIELD IS NOT ONE ASSERTION. A required_action string can run
            # to a paragraph, and treating the whole value as a unit let a
            # "prior text preserved" marker at one end excuse a live dependency
            # claim at the other - the window failure again, at field scope.
            # Values are therefore sentence-split, exactly as prose is.
            pieces = []
            for label, val in json_units(p):
                # A JSON record preserves history in its KEY, because it cannot
                # carry a strikethrough. update_2026_09_15, _at_evaluation_ and
                # the like are archives, and reading them as live assertions
                # reports the act of preserving history as a failure to.
                if re.search(r"update_\d|remediation_\d|correction_\d|_at_evaluation|"
                             r"_history|prior|conditions_corrected|_cleared", label, re.I):
                    continue
                if len(val) > 240:
                    for s in re.split(r"(?<=[.!?])\s+(?=[A-Z*_`~(\[])", val):
                        pieces.append((label, s))
                else:
                    pieces.append((label, val))
            for label, val in pieces:
                for pid, (cur, pats) in PROPS.items():
                    for pat in pats:
                        for m in re.finditer(pat, val, re.I):
                            if not OLD.search(val):
                                continue
                            lv = RETIRED.sub(" ", val)
                            strict = ("HISTORICAL" if STRONG_HIST.search(lv)
                                      else ("STALE CURRENT-STATE" if OLD.search(lv)
                                            else "NO ASSERTION IN UNIT"))
                            rows.append(dict(file=f + " :: " + label, prop=pid,
                                             tok=m.group(0)[:22], strict=strict,
                                             loose=strict,
                                             unit=re.sub(r"\s+", " ", val).strip()[:200]))
                            break
            continue
        body = mask_retired(soften(flat(open(p, encoding="utf-8", errors="replace").read())))
        us = list(units(body))
        for pid, (cur, pats) in PROPS.items():
            for pat in pats:
                for m in re.finditer(pat, body, re.I):
                    win = body[max(0, m.start()-300):m.end()+300]
                    if not OLD.search(win):
                        continue
                    unit = next((u for s, e, u in us if s <= m.start() < e), "")
                    loose  = "HISTORICAL" if HIST.search(win)  else "STALE CURRENT-STATE"
                    lv = live(unit)
                    strict = ("HISTORICAL" if STRONG_HIST.search(lv)
                              else ("STALE CURRENT-STATE" if OLD.search(lv)
                                    else "NO ASSERTION IN UNIT"))
                    rows.append(dict(file=f, prop=pid, tok=m.group(0)[:22],
                                     strict=strict, loose=loose,
                                     unit=re.sub(r"\s+", " ", unit).strip()[:200]))
    return rows


# ---------------------------------------------------------------------------
# RECORD CLASSIFICATION, added 2026-09-18 for the estate-wide pass.
#
# The 2026-09-18 discovery pass established that the estate is 294 records, not
# 25. Sweeping all 294 with the 25-record rules reported 128 stale occurrences,
# and almost none of them were claims: they were superseded execution reports
# doing their job, guard SOURCE CODE whose patterns necessarily contain the very
# wording they hunt, and an append-only dated log. A number that large is not a
# finding, it is an instrument that has not been told what it is reading.
#
# Three classes, each excluded explicitly and counted, never silently:
#   HISTORICAL   - the record classifies ITSELF historical in its opening block.
#                  The token must be distinctive: a bare "SUPERSEDED" also occurs
#                  inside a corrected ROW, and using it would exempt a record for
#                  the act of correcting it.
#   CONTROL CODE - guards, tests and page scripts. check_zero_drift.py contains
#                  "queued behind B-001" because that is the string it exists to
#                  catch. Reading a detector's pattern as an assertion makes every
#                  control look like the defect it prevents.
#   APPEND-ONLY  - research/MASTER_TRACKER.md, whose every entry is dated and
#                  states what was true on its date.
HEAD_HISTORICAL = re.compile(
    r"HISTORICAL EXECUTION RECORD|HISTORICAL RECORD \u2014 NO LONGER MAINTAINED|"
    r"NOT THE PRIMARY REGISTER|NOT CURRENT-STATE AUTHORITY|COMPLETED GATE RECORD|"
    r"HISTORICAL \u2014 20\d\d-\d\d-\d\d REPORT|APPEND-ONLY DATED LOG", re.I)

CONTROL_CODE = re.compile(r"^(scripts|tests|lib|api)/|\.(py|mjs|ts|js)$")

# Records that control current state by ROLE and can never be excluded, whatever
# their text says.
NEVER_EXCLUDE = set(MANDATORY) | {
    "docs/enterprise-diligence/JRS_MASTER_ASSET_EVIDENCE_AND_CHAIN_OF_TITLE_REGISTER.md",
    "docs/enterprise-diligence/EVIDENCE_LEDGER.md",
    "docs/enterprise-diligence/CHAIN_OF_TITLE_STATUS.md",
    ".jrs/state/ACTIVE_GATE.json", ".jrs/state/CURRENT_PHASE.json",
    ".jrs/state/PROGRAM_STATE.json", ".jrs/reports/GATE_1_REMAINING_ITEMS.md",
}


# THE RESEARCH CORPUS IS NOT THE CONTROL ESTATE.
#
# Semantic discovery pulled in 106 dated research files - article drafts v4 to
# v9, submission packets, coding frames, a FOIL production, CSV datasets -
# because scholarly prose says "requires", "not established" and "remains open"
# constantly. Sweeping them for BLOCKER state produced noise in proportion to how
# much research exists, which is the wrong thing to measure. CLAUDE.md section 4
# maps the estate: `.jrs/` is the control architecture and `docs/` the diligence
# record; `research/` is the research programme, governed by its own tracker.
# The three research files that DO carry estate state are named individually
# rather than inferred, so adding a fourth is a decision and not an accident.
# A CORRECTION NARRATIVE QUOTES THE OLD STATE BY DESIGN. A synchronization matrix
# has a column headed "Old representation"; reading those cells as live claims
# reports the record of the fix as the defect, and would grow with every cycle.
CORRECTION_NARRATIVE = {
    "docs/enterprise-diligence/JRS_ESTATE_WIDE_SYNCHRONIZATION_MATRIX_2026-09-18.md",
    "docs/enterprise-diligence/JRS_ESTATE_WIDE_DOWNSTREAM_RECONCILIATION_REPORT_2026-09-18.md",
    "docs/enterprise-diligence/STALE_STATUS_CORRECTION_REGISTER.md",
    "docs/enterprise-diligence/D-10_STATUS_RECONCILIATION.md",
}

RESEARCH_STATE_BEARING = {
    "research/MASTER_TRACKER.md",
    "research/TRACKER_RECENT.md",
    "research/IP_SALE_TRACKER.md",
}


def classify(rel):
    """CURRENT, HISTORICAL, CONTROL CODE or RESEARCH CORPUS, with the reason."""
    if rel in NEVER_EXCLUDE:
        return "CURRENT", "controls current state by role"
    if CONTROL_CODE.search(rel):
        return "CONTROL CODE", "a detector or a page script, not a state assertion"
    if rel in CORRECTION_NARRATIVE:
        return "CORRECTION NARRATIVE", ("a record whose subject IS the old wording; every "
                                        "row quotes a state in order to correct it")
    if rel.startswith("research/") and rel not in RESEARCH_STATE_BEARING:
        return "RESEARCH CORPUS", ("a research deliverable, not a control-state record; "
                                   "the research programme is tracked by its own log")
    try:
        head = "\n".join(open(os.path.join(ROOT, rel), encoding="utf-8",
                              errors="replace").read().splitlines()[:45])
    except OSError:
        return "CURRENT", "unreadable head"
    if HEAD_HISTORICAL.search(head):
        return "HISTORICAL", "self-classified in its opening block"
    return "CURRENT", "no self-classification"


if __name__ == "__main__":
    scope = MANDATORY + ALSO
    rows = scan(scope)
    stale  = [r for r in rows if r["strict"] == "STALE CURRENT-STATE"]
    hist   = [r for r in rows if r["strict"] == "HISTORICAL"]
    none_  = [r for r in rows if r["strict"] == "NO ASSERTION IN UNIT"]
    miss   = [r for r in rows if r["strict"] == "MISSING"]
    downg  = [r for r in rows if r["strict"] == "STALE CURRENT-STATE"
                             and r["loose"] == "HISTORICAL"]
    print("RECORDS IN SCOPE:", len(scope), f"({len(MANDATORY)} mandatory + {len(ALSO)} discovered)")
    print("TOTAL OCCURRENCES:", len(rows))
    print("  HISTORICAL (sentence scope) :", len(hist))
    print("  NO ASSERTION IN UNIT        :", len(none_))
    print("  STALE CURRENT-STATE         :", len(stale))
    print("  MISSING FILES               :", len(miss))
    print("  WINDOW SCOPE WOULD HAVE EXCUSED:", len(downg))
    print("\n--- STALE CURRENT-STATE (sentence scope) ---")
    for r in stale:
        flagd = "  [window scope excused this]" if r in downg else ""
        print(f"  {r['file']}{flagd}\n     [{r['prop']}] {r['tok']!r} :: {r['unit']}")
    if not stale: print("   none")
