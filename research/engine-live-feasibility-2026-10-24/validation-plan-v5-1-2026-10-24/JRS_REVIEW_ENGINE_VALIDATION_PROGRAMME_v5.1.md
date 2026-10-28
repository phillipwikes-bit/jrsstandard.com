# JRS REVIEW ENGINE: MASTER OWNER-LED, EVIDENCE-BASED VALIDATION PROGRAMME, VERSION 5.1

**PROPOSED FOR OWNER APPROVAL. NOT EFFECTIVE. Prepared 2026-10-24 outside the
repository.** This directive replaces Version 5.0 in full. It authorizes no execution.
Every operational phase requires its own recorded owner authorization. **B-018 remains
OPEN. Release status remains NO_GO_NOT_VERIFIED.**

(The title uses a colon in place of the dash used in Version 5.0, under the repository
prose rule that bans the em dash.)

---

## 1. Executive purpose

1.1 This programme produces version-specific, owner-led feasibility evidence about how
the JRS Review Engine candidate behaves on constructed supplier-access exception records:
whether it can be executed end to end, where it fails, how often it gives false
reassurance, whether its citations hold up, and how stable it is.

1.2 It is designed for one owner with AI assistance. It does not depend on volunteers,
paid staff or institutions.

1.3 It does not produce independent validation, and no result from it satisfies any
release gate. It identifies what stronger, independent evidence would be needed and
when that evidence would be justified.

1.4 What success looks like: a reproducible report that states, for one frozen Engine
version and one model identity, what was tested, what was found (including every
critical failure), the uncertainty around every number, and what remains unknown.

## 2. Governing constraints

2.1 **Scope.** Pre-finalization diagnostic review of completed, non-HR supplier-access
exception drafts. Excluded: employment, housing, lending, insurance, medical and
legal-outcome decisions (`docs/architecture/CURRENT_ENGINE_HANDOFF_2026-10-05.md`).

2.2 **Human review** is mandatory for every Engine output. The Engine never produces an
overall pass, score, determination, readiness verdict or recommendation.

2.3 **Live provider calls** are prohibited without a new explicit owner instruction
(handoff). This programme requests one (OD-V-01) and confines it to Track A synthetic
records.

2.4 **Preserved without change:** B-018 OPEN; NO_GO_NOT_VERIFIED; release gates 1 to 5
in the handoff (independent labeled and adjudicated holdout evaluation; operator-control
evidence; counsel review of real data flows and claims; recorded owner release
authorization; independent production QA); counsel dependencies; lineage separation.

2.5 **Proposed decisions are not operative.** P-01 to P-07 (proposed owner decision record,
revision 2) are referred to where relevant but are not treated as in force until
approved.

2.6 **No real records, personal data or holdout material from any external source** are
used in any phase.

2.7 **No result** may be used for release status, public claims, licensing or commercial
statements while B-018 is OPEN, except within an owner G1 statement (OD-V-15) and the
publication policy.

2.8 **Identifiers.** This programme uses VP (phases), VG (gates), OD-V (owner decisions),
R (risks), CA (corrective actions), AT (adversarial tests) and TA or TB (records). It
creates no E-nnn evidence identifiers. Repository ledger entries are cited as "local
E-nnn" if P-01 is approved, and otherwise by path.

## 3. Roles and responsibilities

| Role | Holder | Duties | Limits |
|---|---|---|---|
| Owner | Programme owner | Authorizes each phase; writes Layer 1 logs and Layer 2 references; adjudicates; decides | Results remain owner-led; owner involvement is disclosed in every report |
| AI construction assistant | Claude Code (Claude model family) | Drafts records from owner specifications; prepares tooling; analyses; drafts reports | Never sets references; never runs the Engine or a provider without the phase authorization; its model family is disclosed |
| Engine under test | Lineage L3 candidate with the authorized adapter and model | Produces outputs | Frozen per VG-3 |
| AI evaluator (optional) | A model chosen under OD-V-07 | Blind challenge reading | Never a reference; never sees Engine output or references |
| Optional practitioner | Jackie Garrick, only if approached under OD-V-16 | Qualitative realism and evidentiary-quality feedback on five packets | Not a dependency; no endorsement implied; no co-authorship promised |
| Counsel | Only if engaged | Data-flow, publication and rights questions | Not engaged at present |

Independence achieved by this programme is classified in section 13.4.

## 4. Authoritative source hierarchy

4.1 Order of precedence for this programme:
1. Recorded owner decisions (operative only once signed).
2. The October 5 handoff, for current Engine scope, prohibitions and release gates.
3. The October 3 source-aligned documents, identified by SHA-256 in the handoff. They
   are not present in the repository and are not read by this programme. Statements
   about their content are owner-reported until verified in an authorized workspace.
4. Repository records: `CLAUDE.md`, `.jrs/state/`, the Phase 8 registries, protocol and
   handoff freeze, the Phase 9 materials.
5. This directive.

4.2 Two sources at the same level that conflict stop the affected step; the conflict is
recorded and put to the owner. Conflicts identified on 2026-10-24:

| ID | Conflict | Resolution path |
|---|---|---|
| C-01 | Version 5.0 assumed actual Engine execution; the handoff prohibits live provider calls without a new explicit owner instruction | OD-V-01 |
| C-02 | Two Engine lineages with different conditions and routes (V1 `0.1.0-validation`; L3 `0.3.1-candidate`) | OD-V-02; parallel-lineage rule (P-03, proposed) |
| C-03 | Track B uses employment records; the handoff excludes employment and the L3 scope gate refuses HR content | OD-V-13 (section 26) |
| C-04 | Gate 3A options cover independent evaluation only; this programme is owner-led | OD-V-03 |
| C-05 | Publication planned; no local result may support public claims while B-018 is OPEN | OD-V-15 (section 31.5) |
| C-06 | The pinned model's recorded review date (2026-10-15) has passed; availability not checked | OD-V-02 |
| C-07 | The L3 scope gate accepts only the `synthetic_engineering_fixture` origin class | OD-V-04 |

## 5. Engine baseline procedure (VP0)

5.1 **Lineage under test.** Lineage L3: `phase7-candidate`, compiler `0.3.1-candidate`,
package SHA-256 `815c5d5671d0cfcaf62edca0a11938b920e37d058d3e8655ae9e4f9c735925c3`
(147 files), rule-pack hashes as recorded in the Phase 8 handoff freeze, prompt
`jrs-engine-local-0.3.0/prompt-1` with SHA-256
`0ceda8887463a515d241751133c9b0d3bf3364f89b63fa6ac5dda6ac70c8eec2`. Lineage V1
(`0.1.0-validation`, closed endpoint) is not tested and receives no results (OD-V-02).

5.2 **Baseline checks (read-only; may be repeated at any time):**
1. HEAD, branch, tracked and untracked fingerprints.
2. Candidate manifest verifies (147 of 147) and equals the registry value.
3. Rule-pack hashes equal the handoff freeze.
4. Prompt hash equals its manifest.
5. Whole-worktree composition reports declared conditions only.
6. Existing local suites reproduce their recorded results (local and mocked only).

5.3 **Baseline gaps to close before any live run:**

| Gap | Closing record | Decision |
|---|---|---|
| No model bound to L3 | Model identity, version string, provider, review date | OD-V-02 |
| No provider adapter | Adapter specification and qualification (section 15) | OD-V-05 |
| Only `local_mocked` and `local_deterministic` modes exist | Authorized live mode identifier recorded in the adapter, not in the frozen compiler | OD-V-05 |
| Scope gate accepts one origin class | Origin-class decision | OD-V-04 |
| No live-call permission | Owner instruction | OD-V-01 |
| Stale live tool `tools/run-live-manifest-evaluation.mjs` targets the closed production endpoint | Recorded as not to be used | None |

5.4 **Baseline status values:** ESTABLISHED (all checks pass, all gaps closed) or NOT
ESTABLISHED (list what is missing). VP2 does not start while NOT ESTABLISHED.

## 6. Validation objectives

| ID | Objective | Primary evidence | Not claimed |
|---|---|---|---|
| O-1 | Technical feasibility of end-to-end execution | Execution records; failure counts | Production reliability |
| O-2 | Detection of planted material deficiencies | Record-level sensitivity with intervals | Real-world sensitivity |
| O-3 | False reassurance on deficient records | Count, rate and upper bound; every instance | Absence of false reassurance |
| O-4 | Behaviour on adequately supported records | Specificity, over-flagging | Real-world specificity |
| O-5 | Evidence grounding | Five-level citation table | Semantic support by the Engine |
| O-6 | Repeatability and robustness | Material-change rates | Determinism |
| O-7 | Failure-mode catalogue | Adversarial results | Completeness |
| O-8 | Evaluator marginal value | Owner-confirmed issues found only by the evaluator | Evaluator accuracy |

## 7. Risk-based architecture

7.1 Record flow: construction log (Layer 1) -> interpretive reference (Layer 2) ->
freeze -> sealed corpus -> live Engine run -> optional blind evaluator run -> masked
comparison -> owner adjudication -> analysis -> report.

7.2 Risk priorities (from the register, section 33): invalid reference (R-01), shared
model error (R-08), false reassurance (R-14), owner bias (R-40), incomplete execution
path (R-16), holdout contamination (R-05), uncontrolled tuning (R-06), scope violation
(R-24), premature publication (R-35).

7.3 Each risk has a control in a named section and a stop condition in section 37.

## 8. Reference-standard methodology

8.1 **Layer 1: constructed facts.** For each record the owner writes, before any model
drafts prose and before any Engine or evaluator run, a construction log listing:
documents present; documents deliberately absent; planted chronology conflicts (with
both dates); fabricated or altered quotations; statements with no documentary support;
relevant evidence anchors (exact text); planted distractors; intended difficulty. Each
item is checkable against the record text alone.

8.2 **Layer 2: interpretive reference.** For each of the five conditions
(reconstructability, identifiable basis, chronology integrity, reasoning traceability,
sufficiency), the owner records: expected status (`supported`, `gap`, `review_required`,
or `not_assessed` where the Engine should abstain); materiality (none, minor, moderate,
material, critical; section 17.3); the Layer 1 items relied on; a confidence flag
(clear, arguable, ambiguous).

8.3 **Freeze.** Layer 1 and Layer 2 are hashed and the hashes recorded before the corpus
is sealed. The frozen files are never edited.

8.4 **Corrections.** A correction after any run is a new dated file stating the item,
the original value, the corrected value, the reason and whether Engine output was seen
first. Results are reported against both the original and the corrected reference.
A correction never defaults in the Engine's favour; an unresolved disagreement is
reported as unresolved.

8.5 **Ambiguity.** Items flagged ambiguous are reported separately and excluded from
primary rates, with their count disclosed.

8.6 **Objective and interpretive results are always reported separately.** Layer 1
results (did the Engine notice a planted fact) are the stronger evidence.

8.7 **Limit.** Layer 2 remains the owner's judgment. Its credibility rests on its
written basis, not on its author.

## 9. Synthetic corpus design

9.1 **Realism dimensions** (each record is tagged): length (short, medium, near the
8,000-character limit); document mix (request, approval, risk note, expiry, email
excerpt); institutional context (three fictional organizations with distinct styles);
chronology complexity; evidence quality; ambiguity; contradiction; missingness;
rationale quality; organization (ordered, disordered); writing style (terse, verbose,
formal, informal); AI-drafting artifacts present or absent.

9.2 **Class mix.** Deficient records (one or more planted material deficiencies);
adequately supported records; hard negatives (a deficiency looks plausible but the
record supports the decision); mixed records.

9.3 **Construction.** The owner writes a specification and the Layer 1 log; the AI
construction assistant drafts prose to that specification; the owner edits and checks
every Layer 1 item against the final text. Each record carries a provenance block:
author, drafting model family, date, specification hash, Layer 1 hash.

9.4 **Similarity control.** Before sealing, pairwise text similarity is computed locally
(no model) and any pair above a frozen threshold is rewritten or removed. Template
phrases are capped.

9.5 **Contamination control.** Records and references are drafted with the Claude model
family. The Engine model is chosen under OD-V-02. If it is also a Claude model, the
shared family is disclosed and treated as a limitation, not removed. Where an evaluator
is used, a different family is preferred subject to OD-V-07. Separate prompts are not
treated as independence.

9.6 **Origin class.** Records carry the origin class decided under OD-V-04 and a corpus
label (development, calibration, protected, regression, confirmatory).

## 10. Sample-size rationale

10.1 **Principle.** Sizes follow from the claims to be made. Records, not conditions or
runs, are the primary unit.

10.2 **Reference values (exact, 95 percent):**

| Relevant records with zero failures | One-sided upper bound on failure rate |
|---|---|
| 10 | 25.9 percent |
| 20 | 13.9 percent |
| 30 | 9.5 percent |
| 50 | 5.8 percent |
| 59 | 5.0 percent |
| 99 | 3.0 percent |
| 299 | 1.0 percent |

Zero observed failures does not establish zero risk; it bounds the rate under the
assumption that the records are representative, which synthetic records only partly are.

10.3 **Interval width.** With 50 records and an observed rate of 90 percent, the Wilson
95 percent interval is about 79 to 96 percent; at 50 percent it is about 37 to 63 percent.

10.4 **Clustering.** Five conditions per record are correlated. Condition-level counts
are reported with the number of records they come from; a design effect between 1.8 and
3.0 is plausible (intra-record correlation 0.2 to 0.5), so 250 condition judgments may
carry the information of roughly 80 to 140 independent ones.

10.5 **Corpus sizes (PROPOSAL, OD-V-08).**

| Set | Size | Composition | Purpose |
|---|---|---|---|
| Development (TA-D) | 10 | 6 deficient, 2 adequate, 2 hard negative | Procedure and adapter debugging |
| Calibration | 5 | Mixed | Owner scoring practice; never reported |
| Protected (TA-P) | 50 | 30 deficient (each with at least one material deficiency), 12 adequate, 8 hard negative | Primary feasibility evidence |
| Adversarial supplement (TA-X) | 25 | One per AT item | Targeted failure probes; reported separately |
| Robustness variants (TA-R) | 40 | 10 protected-equivalent records times 4 variants, built from development-style twins, not from protected records | Stability |
| Confirmatory (TA-C) | at least 60 deficient plus 25 adequate | New, untouched | Only after an Engine change (VP7) or when tighter bounds are required |

With 30 deficient records and zero false reassurance, the record-level upper bound is
9.5 percent. A claim below 5 percent requires at least 59 deficient records with zero
false reassurance.

10.6 **Stopping rules (fixed at VG-3).** The protected set is run in full; there is no
early stop for favourable results. The run stops early only for an execution failure
rate above 20 percent over the first 10 records, a governance stop, or a hash mismatch.

## 11. Development and holdout separation

11.1 Sets are disjoint and recorded in a set register before VG-3.

11.2 Protected records are written after development records, stored outside the
repository in a sealed archive with an access log, and opened only for the VP4 run.

11.3 No Engine, prompt, rule-pack, adapter or configuration change between seal and
run. Any change voids protected status for the changed system (OD-V-10) and requires a
new confirmatory set (VP7).

11.4 Targeted post-failure records (regression) are never reported as random
confirmation.

11.5 Development, calibration and regression material is never moved into a sealed set.

## 12. AI evaluator design

12.1 **Role.** A challenge reader. It reads each record blind and lists possible
deficiencies with quotations. Its output prompts owner attention; it never sets or
changes a reference.

12.2 **Selection criteria (OD-V-07).** Different model family from the Engine model where
authorized; reliable structured output; long-document reading; version stability;
recorded identifier and date; data-flow approval. No model, availability or price is
assumed by this directive.

12.3 **Inputs.** Record text and a frozen instruction only. Never Engine output, references,
earlier errors, targets or preferred conclusions.

12.4 **Value test.** After VP3, count owner-confirmed issues the evaluator found that the
Engine missed and the owner's Layer 2 did not anticipate. If none in 10 development
records, the evaluator is dropped for VP4 unless the owner records a reason to keep it.

12.5 **Shared-error cases.** The adversarial supplement includes cases where both systems
might miss the same defect, invent the same inference, overstate sufficiency, accept an
unsupported quotation, fail to abstain or misread chronology (AT-26 to AT-31). Agreement
between the Engine and the evaluator is never treated as correctness.

## 13. Blinding controls

13.1 The owner locks Layer 1 and Layer 2 before any output exists.

13.2 Outputs are presented to the owner with source masked (A or B), in randomized order,
with the record identifier replaced by a random code.

13.3 The evaluator never sees Engine output; the Engine never sees evaluator output.

13.4 **Independence classification** (reported in every result):

| Form | Achieved |
|---|---|
| Operational separation (separate runs, no shared context) | Yes |
| Model-family separation | Only if OD-V-07 selects a different family |
| Blinded assessment | Partial: the evaluator is blind; the owner is blind to source but not to record content they wrote |
| Independent reference construction | No |
| Independent human adjudication | No |
| Independent external validation | No |

## 14. Owner adjudication

14.1 **Form per record:** for each condition, the Engine status, the masked comparison
status, the reference status, agreement, error type (section 16), severity, citation
level (section 18), confidence, and notes. Original entries are locked on submission.

14.2 **Bias controls:** frozen rubric; masked source; randomized order; sessions of at
most 90 minutes; mandatory review of favourable and unfavourable cases in equal measure;
an explicit "unresolved" category; second look at every critical item after at least 24
hours, recorded as a separate entry.

14.3 **Changes:** an adjudication entry is never edited; a later view is a new dated entry.

14.4 **Disclosure:** every report states that the owner built the Engine, wrote the
references and adjudicated, and that these controls reduce but do not eliminate bias.

14.5 **Independent challenge where affordable:** a second person may review a random
10 percent of adjudications later; not required for VP4.

## 15. Actual Engine execution procedure

15.1 **Adapter.** A provider adapter sits outside the frozen candidate package. It sends
the pinned prompt and record, receives the candidate response text, and passes it
unchanged to `compileEvidenceGraph` in an authorized live mode. The adapter has its own
version and hash; the system under test is the tuple (candidate package hash, prompt
hash, adapter hash, model identifier, configuration).

15.2 **Qualification (VP2).** Three development records run end to end; the trace shows
real provider responses reaching the compiler; mocked results are excluded by mode stamp.

15.3 **Execution record (13 fields, every run):** input identifier; input SHA-256; Engine
version; candidate package SHA-256; prompt SHA-256; model and provider identifier with
version string and review date; configuration (temperature and token limits as set);
UTC timestamp; raw provider response; output graph SHA-256; error status and code;
operator authorization reference; lineage label (L3).

15.4 **Retries.** At most one retry on a transport error, recorded; no retry on a content
or validation failure.

15.5 **Storage.** Execution records stay outside the repository in the study archive unless
a later owner decision says otherwise.

15.6 **Not substitutes for execution:** mock outputs, handwritten examples, prompt-only
assessments and unit-test results.

## 16. Diagnostic metrics

16.1 **Unit definitions.** A condition finding is "flagged" if its status is `gap` or
`review_required`; "supported" if `supported`; "abstained" if `not_assessed`. A record is
"refused" if intake refuses it.

16.2 **Primary measures (record level, with Wilson 95 percent intervals):**
- Material deficiency sensitivity: share of deficient records where every material
  deficiency's condition is flagged or abstained.
- False reassurance rate (section 17).
- Specificity on adequate records: share with no condition flagged as `gap`.
- Over-flagging on hard negatives.
- Execution failure rate: refusals of in-scope records, graph validation failures,
  provider errors.

16.3 **Secondary measures:** condition-level agreement with Layer 2 (with record counts);
Layer 1 detection rate per planted fact type; abstention rate; repeatability; robustness;
schema compliance; evaluator disagreement and marginal value.

16.4 **Error types:** missed deficiency; false reassurance; over-flag; wrong condition;
unsupported citation; execution failure; scope error (wrong refusal or wrong acceptance).

16.5 **Calibration** is not reported: the Engine produces no confidence scores.

## 17. False-reassurance testing

17.1 **Definition (PROPOSAL, OD-V-09).** A false reassurance occurs when, for a
condition that Layer 2 marks as carrying a material or critical deficiency, the Engine
returns `supported` for that condition. A record-level false reassurance occurs when any
such condition in the record is returned `supported`.

17.2 The Engine has no overall ready field and is not given one.

17.3 **Severity scale:**

| Severity | Meaning |
|---|---|
| Minor | Wording or presentation issue with no effect on the condition |
| Moderate | Incomplete flag (for example, `review_required` where `gap` was expected) |
| Material | Missed deficiency that a reviewer relying on the output could overlook |
| Critical | `supported` returned on a condition with a material or critical deficiency, or a fabricated or misattributed citation presented as support |

17.4 Every critical item is preserved with its raw output, listed individually in the
report, and analysed in VP5. Aggregate rates never replace the list.

## 18. Semantic citation testing

18.1 Each cited quotation is assessed at five levels:
1. Citation exists in the output.
2. It points to the correct record section.
3. The quotation is exact (verified by the compiler).
4. The quotation supports the asserted proposition (owner judgment).
5. The proposition supports the condition finding (owner judgment).

18.2 Levels 1 to 3 are objective. Levels 4 and 5 are interpretive and reported
separately.

18.3 The candidate's `supported` status means text presence in a linked section; it does
not assert semantic support (P7B-013). Level 4 and 5 failures on `supported` findings
are reported as evidence-grounding failures, and critical where 17.3 applies.

## 19. Adversarial evaluation

19.1 **Matrix.** Each item: failure hypothesis; construction; expected behaviour;
detection; severity if failed; evidence required; retest.

| ID | Challenge | Expected Engine behaviour |
|---|---|---|
| AT-01 | Missing evidence | Flag sufficiency or basis |
| AT-02 | Contradictory chronology | Flag chronology integrity |
| AT-03 | Unsupported conclusion | Flag reasoning traceability |
| AT-04 | Fabricated quotation in the record's own text | Flag; not cite as support |
| AT-05 | Misleading quotation (true text, wrong proposition) | Not `supported`; level 4 failure if supported |
| AT-06 | Circular reasoning | Flag reasoning traceability |
| AT-07 | AI-generated invented detail | Flag basis |
| AT-08 | Prompt injection in the record | Quarantine; no instruction followed |
| AT-09 | Excessive irrelevant documents | No false support from distractors |
| AT-10 | Long-context omission near the size limit | Flag or abstain; no silent truncation (records over the limit are refused) |
| AT-11 | Conflicting witness statements | Flag conflict |
| AT-12 | Incorrect document dates | Flag chronology |
| AT-13 | Duplicate evidence | No double counting |
| AT-14 | Missing attachment referenced | Flag sufficiency |
| AT-15 | Unsupported positive finding | Flag basis |
| AT-16 | Misleading heading | Not rely on the heading |
| AT-17 | Ambiguous language | `review_required` |
| AT-18 | Partially supported reasoning | `review_required` |
| AT-19 | Record requiring abstention | `not_assessed` or `review_required` |
| AT-20 | Inconsistent document identifiers | Flag |
| AT-21 | Incorrect cross-reference | Flag |
| AT-22 | Incomplete decision record | Flag reconstructability |
| AT-23 | Unsupported causal inference | Flag reasoning traceability |
| AT-24 | Apparently complete but defective | Flag the planted defect |
| AT-25 | Adequate record built to trigger over-flagging | No `gap` |
| AT-26 to AT-31 | Shared-error cases (section 12.5) | Each system assessed separately against Layer 1 |

19.2 Construction method for every item: owner specification and Layer 1 log first,
drafted to the same realism standard as the protected set, held as a separate set.

19.3 Retest: after any VP6 correction, the failed item and its variants are rerun as
regression, never reported as confirmation.

## 20. Repeatability

20.1 Ten protected records (chosen at random before the run, stratified by class) are run
four further times each, with identical inputs and configuration.

20.2 Assessed: condition status changes; citation changes; deficiency detection changes;
abstention changes; execution errors; any change of material conclusion.

20.3 Repeats are never counted as additional records.

20.4 Reported: share of records with any material change, with interval; list of every
change.

## 21. Robustness

21.1 Variants that should preserve the expected outcome: document reordering; formatting
change; added irrelevant paragraph; minor rewording; structured versus unstructured
layout.

21.2 Variants that should change it: moving or removing the conflicting evidence; adding
the missing document.

21.3 Variants are built from development-style twins, never from protected records.

21.4 Reported: share of preserving variants with a material change; share of changing
variants with no change.

## 22. Software assurance

22.1 **Read-only checks (any time):** schema definitions; refusal paths; size limits;
prohibited outputs; error handling paths; network guard in local modes; prompt and
package hash checks.

22.2 **Requires controlled execution (after authorization):** adapter timeout and retry
behaviour; provider error handling; logging completeness; schema compliance of live
outputs.

22.3 **Out of scope for this programme, and still release gates:** authentication,
authorization and credential handling in any deployed service; data retention and
deletion; backup restoration; environment separation in production; operator-control
evidence; independent production QA.

22.4 Credentials are read from the environment only, never placed in records, prompts or
reports, and never accepted in conversation.

## 23. Operator-control evidence

23.1 This programme records, for its own runs: who authorized each run; where inputs and
outputs are stored; who can access them; how they are retained and deleted at study end.

23.2 This is study-operations evidence only. It does not satisfy release gate 2
(operator-control evidence for actual operation).

## 24. Statistical analysis

24.1 Analysis plan frozen at VG-3: measures, denominators, interval method (Wilson for
proportions; exact zero-failure bound), exclusions (ambiguous items, refused out-of-scope
records), and handling of corrections (both references reported).

24.2 Primary analysis is record level. Condition-level results carry record counts.

24.3 No hypothesis tests, thresholds or pass marks are set unless the owner approves
them at VG-3; none is proposed here.

24.4 Every number is reported with its denominator and interval. Subgroups with fewer
than 10 records are reported as counts only.

24.5 Negative and null results are reported in full.

## 25. Track A programme (priority)

25.1 Track A is the supplier-access exception evaluation of Lineage L3 within the
current scope. It is not delayed by Track B.

25.2 Sequence: VP0 baseline -> VP1 reference and corpus -> VP2 technical assurance and
adapter qualification -> VP3 development pilot -> VP4 protected evaluation (with
repeatability, robustness and adversarial supplement) -> VP5 failure analysis -> VP6
corrections proposed -> VP7 confirmation if changed -> VP8 report.

25.3 Each step has a gate in section 34.

## 26. Track B experimental programme

26.1 **Purpose.** Investigate documentation integrity and possible domain transfer for
fictional retaliation-related employment records. It never determines legal retaliation.

26.2 **Constraint.** Lineage L3 refuses HR and employment content by design. Track B
therefore has two parts.

26.3 **B0 (refusal behaviour).** Fictional employment records run through the L3 intake
gate in `local_deterministic` mode, with no model and no provider. Expected result:
refusal. Measures: refusal rate; false acceptance of employment content (a scope
failure). Requires owner authorization under Track B but no scope change.

26.4 **B1 (diagnostic study).** Requires: an owner instruction departing from the October 5
exclusion for a bounded research purpose (OD-V-13); a separately versioned experimental
variant with its own package hash and lineage label; counsel review if the owner so
decides; its own corpus (provisionally 40 records: 10 adequate, 10 missing evidence,
8 chronology, 8 unsupported reasoning, 4 mixed or adversarial); its own reference and
report.

26.5 No Track A claim transfers to Track B and no Track B finding is described as
evidence of employment-product readiness.

## 27. Optional practitioner collaboration

27.1 Only after VP8, only if the owner decides (OD-V-16).

27.2 Five packets: record plus anonymized Engine output, presented after the practitioner
records an initial independent reading of the record alone.

27.3 Questions limited to realism of the records, evidentiary quality of the findings and
usability of the output. Not asked to judge legal outcomes.

27.4 Time estimate: 3 to 5 hours of the practitioner's time.

27.5 Terms stated in writing before any material is shared: no endorsement by the
practitioner or any organization is implied; no co-authorship is promised; how feedback
may be cited, if at all. Disclosure of material requires the publication review.

27.6 No contact occurs under this directive.

## 28. Independent validation pathway

28.1 Independent evidence is required for release gate 1 and is not produced here.

28.2 VP10 decides whether an independent step is justified, using the VP8 report:
Gate 3 Option B (independent methods rehearsal) or Option C (controlled evaluation on
approved materials), each under its own prerequisites.

28.3 External validation is conditional for research progression and mandatory wherever
existing release governance requires it.

## 29. Cost controls

29.1 Verified costs: none at the date of this directive. Before VG-2 the owner records the
provider's current prices and computes the phase cost from the call and token budgets.

29.2 Budgets (PROPOSAL): at most 300 Engine calls and 150 evaluator calls across VP2 to VP4;
at most about 2.0 million tokens (ESTIMATE).

29.3 A phase stops at its budget; extension needs a recorded owner decision.

## 30. Workload controls

30.1 Ceiling (PROPOSAL): 6 owner hours per week; 200 owner hours in total for Track A.

30.2 Estimated owner time: 120 to 185 hours for the full Track A; 60 to 90 hours for the
minimum viable evaluation (10 development plus 30 protected records, no evaluator,
5-record repeatability subset).

30.3 Each VG gate is a stopping point. Stopping at any gate leaves a complete, reportable
record of what was done.

30.4 Controls that are never removed to save time: reference freeze, sealing, masking,
critical-failure preservation, execution records.

## 31. Publication standards

31.1 **Supportable claims (after VP8, within the G1 statement):** technical feasibility of
end-to-end execution for the stated version; synthetic-record diagnostic behaviour with
intervals; evidence-grounding behaviour; repeatability on the tested subset; evaluator
agreement and marginal value; identified failure modes.

31.2 **Not established by this programme:** independent external validation; real-world
accuracy; legal decision correctness; employment-domain readiness; production safety;
commercial efficacy; institutional endorsement.

31.3 **Mandatory disclosures:** owner involvement in construction, reference and
adjudication; synthetic records; AI-assisted construction and its model family; evaluator
use and identity; sample sizes and intervals; model and version dependence; conflicts of
interest; all negative findings; version specificity; absence of independent validation.

31.4 **Suggested titles:** "Owner-Led Feasibility Evaluation of a Quote-Verified
Documentation Review Candidate on Constructed Supplier-Access Records"; "Failure Modes and
False-Reassurance Behaviour of a Documentation Review Candidate: An Owner-Led Synthetic
Study".

31.5 **Gate.** No external text before OD-V-15 (B-018 G1 statement) and the publication
review required by repository policy; counsel where the owner so decides.

## 32. Commercial claims boundaries

32.1 The programme can inform technical due diligence, research credibility and
controlled demonstrations. It does not establish operational readiness, regulatory or
legal readiness, buyer demand or commercial viability.

32.2 Favourable synthetic results do not indicate willingness to pay.

32.3 What a buyer would reasonably require beyond this programme: independent evaluation
on approved material; operator-control and security evidence; counsel-reviewed rights
and data flows (B-004, B018-CQ-05); production QA; evidence of demand.

32.4 No commercial, licensing or acquisition statement is made under this programme.

## 33. Risk register

Likelihood (L), severity (S) and detectability (D): Low, Medium or High. Risks with high
severity and low detectability are prioritized first: R-01, R-08, R-14, R-40; then R-16,
R-05, R-06, R-24, R-35; then the rest.

| ID | Category | Risk | Evidence | L | S | D | Existing controls | Mitigation in v5.1 | Residual | Responsible | Decision | Stop condition |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| R-01 | Scientific | Invalid reference standard | W-02 | H | H | L | None for interpretive layer | Two-layer reference; Layer 1 facts verified by construction log; Layer 2 frozen before execution; ambiguity flags; corrections logged | M | Owner | OD-V-06 | Reference not frozen before protected run |
| R-02 | Scientific | Synthetic-data bias | W-07 | H | M | M | Phase 6 to 9 fixture variety | Realism dimensions, hard negatives, style variation, similarity check | M | Owner | None | Similarity check fails |
| R-03 | Scientific | Small samples | W-03 | H | M | H | None | Precision tables; confidence intervals; claims bounded to stated bounds | M | Owner | OD-V-08 | None |
| R-04 | Scientific | Incorrect statistical assumptions (independence of conditions or runs) | W-03 | M | M | M | None | Record-level primary analysis; clustering disclosed; repeats never counted as records | L | Owner | None | None |
| R-05 | Scientific | Holdout contamination | Handoff prohibition | M | H | L | Phase 8 material separation rules | Sealed holdout outside repository; access log; no Engine change between seal and run | M | Owner | None | Any holdout access before run |
| R-06 | Scientific | Uncontrolled tuning | W-11 | M | H | M | Phase 8 change-impact model | Freeze at VG-3; any change creates a new version and requires fresh confirmation | L | Owner | OD-V-10 | Package hash differs from freeze |
| R-07 | Scientific | Overgeneralization | W-09 | H | H | M | Release gates | Claims framework (D-24) | M | Owner | OD-V-15 | Unbounded claim drafted |
| R-08 | AI | Shared model errors | W-02 | H | H | L | None | Different-family evaluator where authorized; shared-error cases; owner Layer 1 facts independent of any model | M-H | Owner | OD-V-07 | None |
| R-09 | AI | Evaluator hallucination | W-05 | M | M | M | None | Evaluator output treated as a prompt for owner review, never as reference | L | Owner | None | None |
| R-10 | AI | Prompt drift | CLAUDE.md s21 | M | H | H | Prompt SHA-256 pin and test | Prompt hash recorded per run; mismatch stops | L | Owner | None | Prompt hash mismatch |
| R-11 | AI | Model drift or retirement | C-06 | H | H | M | `api/_model.js` change record | Model identity and date per run; drift triggers new version | M | Owner | OD-V-02 | Model identifier change mid-study |
| R-12 | AI | Unstable outputs | Unknown | M | M | H | Deterministic compiler | Repeatability protocol (D-17) | M | Owner | None | Material instability above threshold |
| R-13 | AI | Unsupported citations | W-10 | H | H | M | Quote verification in compiler | Five-level citation assessment (D-15) | M | Owner | None | None |
| R-14 | AI | False reassurance | W-04 | M | H | L | Keep-or-lower rule; mandatory human review | Operational definition; critical classification; every instance preserved | M | Owner | OD-V-09 | Any critical false reassurance in protected run triggers VP5 analysis |
| R-15 | Technical | Wrong Engine version | Two lineages | M | H | H | Package hash | Version and hash check before every run | L | Owner | OD-V-02 | Hash mismatch |
| R-16 | Technical | Incomplete execution path | W-01 | H | H | M | None | Adapter qualification in VP2; end-to-end trace | M | Owner | OD-V-05 | Adapter not qualified |
| R-17 | Technical | Mock and live confusion | Execution modes | M | H | M | Execution-mode field | Separate live mode identifier; output stamped with mode; mocked results excluded from metrics | L | Owner | OD-V-05 | Mode not recorded |
| R-18 | Technical | Schema failures | Compiler | M | M | H | Graph validation | Count as execution failures | L | Owner | None | None |
| R-19 | Technical | Incomplete logging and provenance | CLAUDE.md s21 | M | H | H | Run identity node | 13-field execution record (D-12) | L | Owner | None | Missing field |
| R-20 | Technical | Dependency changes | None | L | M | M | Manifests | Environment record at freeze and run | L | Owner | None | Environment change |
| R-21 | Technical | Provider failure or outage | None | M | L | H | None | Retry rule fixed in advance; failures counted | L | Owner | None | Failure rate above 20 percent |
| R-22 | Technical | Stale live tool sends records to the closed production endpoint | `tools/run-live-manifest-evaluation.mjs` | L | M | H | Endpoint now returns 503 | Do not use; note in VP0 | L | Owner | None | Any use |
| R-23 | Governance | Unauthorized execution | Handoff | M | H | H | Execution-mode refusal | VG gates; written authorization per phase | L | Owner | OD-V-01 | Execution without record |
| R-24 | Governance | Employment-scope violation | C-03 | M | H | H | Scope gate | Track B separated; no scope change without OD-V-13 | L | Owner | OD-V-13 | HR content run outside authorization |
| R-25 | Governance | B-018 closure error | P-06 proposed | L | H | H | Closure rule (proposed) | No v5.1 step changes B-018 | L | Owner | None | Any B-018 edit |
| R-26 | Governance | Evidence-lineage contamination | P-03 proposed | M | H | M | Parallel-lineage rule (proposed) | Results labeled L3 only; no transfer to V1 or source-era Engine | L | Owner | None | Cross-lineage citation |
| R-27 | Governance | Unresolved counsel dependency | B-004, CQ-05 | H | M | H | Counsel brief | Counsel question flagged for provider data flow and publication | M | Owner, counsel | OD-V-14 | Counsel needed and absent |
| R-28 | Governance | Unsupported release claim | Handoff | M | H | H | Release gates | Required statement on every report | L | Owner | None | Claim drafted |
| R-29 | Operational | Excessive owner workload | Estimates | H | M | H | None | Ceilings and stopping points (D-23) | M | Owner | OD-V-11 | Ceiling reached |
| R-30 | Operational | Cost escalation | Unknown prices | M | M | M | None | Call ceiling; verified-price check before each phase | M | Owner | OD-V-12 | Ceiling reached |
| R-31 | Operational | Reviewer fatigue | Single adjudicator | H | M | M | None | Session limits; randomized order | M | Owner | None | Session over limit |
| R-32 | Operational | Incomplete adjudication | Workload | M | M | H | None | Unresolved category; no imputation | L | Owner | None | None |
| R-33 | Operational | Collaborator unavailable | Jackie Garrick optional | M | L | H | None | Optional pathway only | L | Owner | None | None |
| R-34 | Operational | Reproducibility inadequate | None | M | M | M | Manifests | Reproduction package (D-12) | M | Owner | None | Package incomplete |
| R-35 | Strategic | Premature publication | C-05 | M | H | H | Publication policy | Claims framework; B-018 G1 | L | Owner | OD-V-15 | Publication without review |
| R-36 | Strategic | Commercial overclaiming | Handoff | M | H | H | Claim policy | D-25 boundaries | L | Owner | None | Claim drafted |
| R-37 | Strategic | Misleading independence claims | W-05 | M | H | M | None | Independence classification (D-11) | L | Owner | None | Unclassified independence claim |
| R-38 | Strategic | Weak buyer relevance | D-25 | M | M | M | None | Evidence mapped to diligence questions | M | Owner | None | None |
| R-39 | Strategic | Reputational damage from negative findings handled poorly | None | L | M | M | None | Negative findings reported in full | L | Owner | None | Suppression of a finding |
| R-40 | Scientific | Owner bias in adjudication | W-06 | H | H | L | None | Blinding of output source, frozen forms, preserved originals | M-H | Owner | None | Original judgment changed without log |

## 34. Decision gates

| Gate | Opens | Requires | Authority |
|---|---|---|---|
| VG-0 | VP1 | Baseline checks pass; OD-V-02 recorded; this directive approved | Owner |
| VG-1 | VP2 | Reference protocol adopted (OD-V-06); sizes (OD-V-08); workload ceiling (OD-V-11); OD-V-04 | Owner |
| VG-2 | VP2 live calls and VP3 | OD-V-01, OD-V-03, OD-V-05, OD-V-12 (verified prices); OD-V-14 if counsel required | Owner (counsel if required) |
| VG-3 | VP4 | Adapter qualified; development pilot reviewed; system-under-test tuple frozen; protected corpus sealed with Layer 1 and 2 hashes; analysis plan frozen; OD-V-09, OD-V-10; evaluator decision (OD-V-07) | Owner |
| VG-4 | VP5 | VP4 complete and adjudicated | Owner |
| VG-5 | VP6 implementation | Owner authorization of any Engine change | Owner |
| VG-6 | VP7 | New confirmatory set sealed | Owner |
| VG-7 | VP8 external use | OD-V-15; publication review | Owner (counsel if required) |
| VG-8 | VP9 | OD-V-16 | Owner |
| VG-9 | VP10 | VP8 report | Owner |
| VG-10 | VP11 B0 | Track B authorization | Owner |
| VG-11 | VP11 B1 | OD-V-13; counsel if required | Owner (counsel if required) |

**Owner decisions required.**

| ID | Decision | Needed before | Counsel |
|---|---|---|---|
| OD-V-01 | Explicit instruction permitting live provider calls for Track A on synthetic records only, with limits | VP2 | Owner decides whether counsel review of the provider data flow is needed (the non-operative Gate 3 package proposes owner and counsel for any provider environment) |
| OD-V-02 | Lineage under test (L3 proposed) and model identity, version and review date | VP0 close | No |
| OD-V-03 | Authorization record for an owner-led feasibility study, distinct from Gate 3 Options A, B, C and from release gate 1 | VP2 | No |
| OD-V-04 | Origin class for evaluation records: reuse `synthetic_engineering_fixture` with a separate corpus label, or authorize a scope-gate change creating a new candidate version | VP2 | No |
| OD-V-05 | Authorization to build the live adapter outside the frozen compiler, and its versioning | VP2 | No |
| OD-V-06 | Adoption of the two-layer reference protocol and its freeze rule | VP1 close | No |
| OD-V-07 | Evaluator use: none, or a named model and provider, with data-flow approval | VP3 | As OD-V-01 |
| OD-V-08 | Corpus sizes and precision targets | VP1 close | No |
| OD-V-09 | False-reassurance definition and severity scale | VG-3 | No |
| OD-V-10 | Rule that any Engine change voids protected status and requires VP7 | VG-3 | No |
| OD-V-11 | Workload ceiling | VP1 | No |
| OD-V-12 | Cost and call ceiling, with verified prices | VG-2 | No |
| OD-V-13 | Track B: B0 only, or authorization of an experimental variant (departs from the October 5 exclusions) | VP11 | Likely; owner decides |
| OD-V-14 | Whether any counsel review is needed for synthetic-only provider use or for publication | Before VP2 and VP8 external use | Counsel, if engaged |
| OD-V-15 | G1 statement on B-018: which representations of results are permitted while it is OPEN | VP8 external use | No (counsel for rights wording) |
| OD-V-16 | Whether to approach the optional practitioner after VP8 | VP9 | No |
| OD-V-17 | Authorization of the tracker write deferred by this assignment | Any time | No |
| OD-V-18 | P-02 and P9-OD-01, if the Phase 9 dual-review protocol is used for adjudication forms | VP1 | No |

## 35. Incremental roadmap

| Phase | Content | Execution | Output |
|---|---|---|---|
| VP0 | Baseline and governance | Read-only | Baseline record; decision list |
| VP1 | Reference protocol and corpus construction | None | Sealed sets; frozen references |
| VP2 | Technical assurance; adapter qualification | Live, 10 calls, after VG-2 | Qualification record |
| VP3 | Development pilot | Live, 10 records | Procedure fixes; evaluator value test |
| VP4 | Protected evaluation, repeatability, robustness, adversarial | Live, after VG-3 | Adjudicated results |
| VP5 | Failure analysis | None | Failure catalogue |
| VP6 | Corrections proposed | None until VG-5 | Change proposals |
| VP7 | Fresh confirmation | Live, after VG-6 | Confirmation results |
| VP8 | Research report | None | Internal report |
| VP9 | Optional practitioner review | None by Claude | Feedback |
| VP10 | Independent validation decision | None | Decision record |
| VP11 | Track B | B0 local; B1 after VG-11 | Separate report |

No phase starts automatically.

## 36. Success criteria

The programme succeeds when:
1. Every protected record has an execution record with all 13 fields.
2. Every result is reported with denominator and interval.
3. Every critical failure is listed with raw output.
4. Layer 1 and Layer 2 results are reported separately, against original and corrected
   references.
5. Repeatability and robustness are reported.
6. Independence achieved is classified.
7. A second qualified person could reproduce the analysis from the archive.
8. No governance constraint was breached.

**Adversarial reassessment (Pass Three) answers:**

| Auditor question | Answer in this design |
|---|---|
| Could the Engine score well while unreliable? | Yes on synthetic material; mitigated by hard negatives, adversarial set and bounded claims (sections 9, 19, 31) |
| Could the reference answers be wrong? | Yes; Layer 1 separation, freeze, correction log, dual reporting (section 8) |
| Could both AI systems share an error? | Yes; shared-error cases and the rule that agreement is not correctness (section 12.5) |
| Could the owner bias results? | Yes; masking, locking, randomization, disclosure; not eliminated (sections 13, 14) |
| Could protected records leak? | Sealed archive, access log, change voids protection (section 11) |
| Could statistics overstate confidence? | Record-level primary, intervals, clustering disclosed (sections 10, 24) |
| Could tests pass without the Engine working? | Live mode stamp, adapter trace, mocks excluded (section 15) |
| Could false reassurance go undetected? | Operational definition, critical listing (section 17) |
| Could it become too expensive? | Budgets and ceilings (sections 29, 30) |
| Could governance be bypassed? | Gates with written authorization (section 34) |
| Could it produce misleading claims? | Claims framework and VG-7 (section 31) |
| Could another person reproduce it? | Reproduction package (section 38) |

## 37. Failure and stopping criteria

Stop the affected phase and report to the owner when:
1. A hash in the system-under-test tuple differs from the freeze.
2. Execution failure exceeds 20 percent over the first 10 protected records.
3. A protected record is accessed before the VP4 run.
4. A record would be run outside the authorized scope or origin class.
5. A live call would be made without VG-2.
6. A reference would be changed without a correction file.
7. A budget or workload ceiling is reached.
8. Counsel review is required and not available.
9. A step would change B-018, release status or any blocker.
10. A result would be transferred across lineages.
11. A claim would be drafted beyond section 31.

A stop is not a failure of the study; it is recorded and reported.

## 38. Required evidence artifacts

1. Baseline record (VP0).
2. Set register.
3. Construction logs (Layer 1) with hashes.
4. Interpretive references (Layer 2) with hashes.
5. Correction files.
6. System-under-test tuple and environment record.
7. Adapter specification, hash and qualification record.
8. Execution records (13 fields) and raw responses.
9. Evaluator instruction, identity and outputs.
10. Masking key (held separately until adjudication is locked).
11. Adjudication forms (locked).
12. Analysis plan (frozen) and analysis outputs.
13. Critical failure list with raw outputs.
14. Archive manifest with SHA-256 for every file.

All held outside the repository unless an owner decision provides otherwise.

## 39. Reporting templates

**Run summary:** system-under-test tuple; date; records run; failures; budget used.

**Results table (per measure):** measure; numerator; denominator; rate; 95 percent
interval; exclusions; reference version (original or corrected).

**Critical failure entry:** record code; condition; reference status and basis; Engine
status; citation levels; raw output reference; severity; owner notes (original and later).

**Report required statement:** "Owner-led feasibility evidence for [version tuple] on
constructed supplier-access records. Not independent validation. Not a release,
deployment, licensing, commercial or production decision. B-018 [status]. Release
status NO_GO_NOT_VERIFIED."

## 40. Exact next authorized action

Owner review of this directive and the companion assessment, followed by an owner
decision on OD-V-02 (lineage under test and model identity). No execution or repository
change occurs until that decision is recorded and VG-0 is passed.

**B-018 remains OPEN. NO_GO_NOT_VERIFIED remains in effect.**
