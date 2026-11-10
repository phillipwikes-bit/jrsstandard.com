# Failure Mode Register (v0.3)

Local ID: EGC-DOC-11 (NON-CANONICAL).

## Claim
These are the known ways the v0.3 compiler can produce a misleading result, and the defects found and corrected while building it.

## Local engineering evidence
Fixtures, probes and mutations cited per row.

## Known residual failure modes
| ID | Failure mode | Current control | Residual risk |
|---|---|---|---|
| FM-01 | Exact quotation used out of context | Assertion type markers; presence limitation; human review | Not detected mechanically |
| FM-02 | Record states something false | Assertions say "the record states"; no truth claim allowed (GV-11) | Engine cannot know |
| FM-03 | Implicit or paraphrased conflict | K1 to K6 patterns only | Missed conflicts |
| FM-04 | Excluded domain phrased in a new way | Expanded REGULATED list (GC-022, GC-023) | Lexical list; new phrasings can pass |
| FM-05 | Instruction injection phrased in a new way | Expanded INSTRUCTION_PATTERNS (GC-021) | Lexical list; new phrasings can pass |
| FM-06 | Neutral-looking control that still frames a decision | v0.2 neutrality check | Lexical only |
| FM-07 | Lightly edited development record placed in a sealed set | Exact-hash overlap | Near duplicates not caught |
| FM-08 | Placeholder authority written in an unlisted form | `PLACEHOLDER_EXACT`, `PLACEHOLDER_WORD` | New forms can pass |
| FM-09 | Section heuristics mislabel an unusual record layout | Section-boundary checks on quotations | Wrong anchor sections possible |
| FM-10 | Live model behaviour differs from the mocks | No live run performed | Entirely unmeasured |

## Defects found and corrected during the build
| Defect | Correction |
|---|---|
| Registry status guard rejected the word "Completed" inside the scope field | Guard limited to `current_status` and `note` |
| Placeholder owner-authorisation identifier passed | `PLACEHOLDER_WORD` added; P-00 renamed; the "never authorises" test uses an in-memory ideal package |
| First replay: six cases failed GV-11 because the required negated conflict statement and the CONTRADICTS meaning were read as proof claims | Negation-aware `assertsProof` |
| Probe record too short (q.utf8_offsets) | Probe corrected; see `MUTATION_TEST_RECORD.md` |
| M-13 and M-17 survived (masked guards) | Isolating probes added; see `MUTATION_TEST_RECORD.md` |
| Workbench guard matched the word "upload" in the builder's own disclaimer | Builder text reworded to "file intake"; the guard pattern was not changed |

## Interpretation
The residual list is where human review and a future authorised evaluation must look first.

## Limitation
The list is drawn from engineering experience on synthetic fixtures. Unknown failure modes are not listed.

## External evidence still required
Failure discovery on authorised records by independent reviewers.
