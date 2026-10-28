# Capability Matrix (156-record study)

**2026-10-27. Offline evidence only; no model was run.** "Works" below means the stated offline behaviour held on constructed or public vignette records against AI-authored or LLM-reproduced references. It is not validation. B-018 OPEN. NO_GO_NOT_VERIFIED in effect.

Status keys:
- **Works offline:** held in every relevant test.
- **Partial:** held with stated failures.
- **Fails:** the property did not hold.
- **Not exercised:** the property exists but this study did not test it.
- **Not implemented:** the property does not exist.

Where an arm is used, "A3R" is the rule-aligned correct candidate: a ceiling, circular by design.

## 1. Scope, intake and safety

| Capability | Where | Evidence | Status | Recommendation |
|---|---|---|---|---|
| Default scope refuses study records | 0.3.1 (record), 0.3.2 | 124 of 124 correct refusals each (A0, A0b) | Works offline | Continue |
| Lexical backstop under a false supplier declaration | 0.3.1 | 5 of 124 refused (R01, R02, R11, R12, R18: excluded-domain wording); 119 pass the backstop | Partial: the backstop is lexical, so 15 of the 20 out-of-scope originals pass it once the declaration is false | Narrow: never rely on the backstop alone |
| Research profile gating, fail closed | 0.3.3 | 89 of 89 research probes; tampered or missing pack refuses; invalid profile gives a clean refusal | Works offline | Continue |
| Research scope refusals | 0.3.3 | 20 of 20 out-of-scope originals refused; 0 incorrect refusals of the 104 eligible | Works offline | Continue |
| Default path unchanged with the profile off | 0.3.3 | 310 of 310 full-graph differential inputs identical to 0.3.2; 343 of 343 feature probes | Works offline | Continue |
| No Ready verdict, no legal or compliance language, sufficiency never supported | 0.3.3 guards | 0 guard violations in every research graph (run-1 to run-3, vrun-1, vrun-2) | Works offline | Continue |
| Statuses never raised above the candidate's proposal | 0.3.x compiler | Monotonic check in every compile; 0 technical failures | Works offline | Continue |
| Explicit refusal above the local size limit (8,000 characters) | 0.3.x | Feature probes; no study record exceeds 638 characters | Not exercised by the corpus | Continue |
| Segmenting an over-length record with coverage | none | Required capability list | Not implemented | Defer (Rule 11); keep the explicit refusal |

## 2. Candidate contract and quotations

| Capability | Evidence | Status | Recommendation |
|---|---|---|---|
| Strict JSON, quote-only contract, prohibited fields | Feature probes (343) and research probes | Works offline | Continue |
| Quotation resolution, UTF-16 and UTF-8 offsets | Offset checks on every graph; feature probes | Works offline | Continue |
| Ambiguous quotation not used | V8: the repeated quotation resolved as ambiguous and was not used in 416 of 416 mock-arm variants | Works offline | Continue |
| Assertion-type screening | Mistyped gap observations are rejected and end INDETERMINATE (V5 heuristic ORACLE: 13 of 49 flagged) | Works as designed; costs sensitivity | Continue; measure with a real model |
| Real model output | None | Not exercised (no live run) | Needs an authorized live preflight |

## 3. Study questions and record rules (research profile)

| Capability | Evaluation evidence (60 records, 6 families) | Status | Recommendation |
|---|---|---|---|
| E1: flaw in the basis signalled | A3R: 19 of 24 ungrounded flagged (79.2%, cluster interval 66.7% to 91.7%), 1 of 36 grounded flagged (EF-01), 0 false reassurance. Development: 15 of 16 and 1 of 24 | Partial: below the proposed 80% sensitivity; the drop from development reflects lexical rules (EF-01 to EF-03) | Repair, then re-evaluate on material written by someone else |
| Q1 authority without linked facts | 11 of 12 (EF-05: a dated title line hides it) | Partial | Repair (header metadata) |
| Q2 conclusion restated as its basis | 5 of 6 (EF-06) | Partial | Repair (header metadata) |
| Q3 same event, different dates | 11 of 12 (EF-07: false conflict on "next meeting"); designed conflicts found 6 of 6 | Partial | Repair (event identity) |
| Q4 separate requests are not a contradiction | 6 of 6 | Works offline | Continue |
| Multiple decisions, each needing its own basis | Type P: 6 of 6 CLEAR; type M: 6 of 6 FLAG (A3R) | Works offline on constructed types | Continue |
| Prose dates ("4 March") and prose records without headings | All evaluation records are prose; date events keyed in each | Works offline | Continue |
| Over-claim resistance | A4 and A4R: 0 of 24 ungrounded CLEAR on unaltered records | Works offline | Continue |
| **Over-claim resistance with irrelevant anchors** | V2 and V6: **15 of 24 ungrounded CLEAR under OVERCLAIM-R** (VF-01, VF-02) | **Fails** | **Repair before any live use** |
| Contradiction detection under variants | A2 misses 7 of 53 (VF-05) | Partial | Repair (event keys) |
| Negated rationale | Regression probe RG-30 only; no corpus record designed for it | Not exercised by the corpus | Add designed records |
| Decision-process traceability (Codebook RC4: who decided, criteria, mitigating information) | None | Not implemented | Decide whether the Engine should cover RC4 |

## 4. Instruction risk

| Capability | Evidence | Status | Recommendation |
|---|---|---|---|
| Explicit injection ("Ignore all previous instructions ...") | V7 phrasing 1: 30 of 30 evaluation, 22 of 22 development detected | Works offline | Continue |
| Indirect injection ("Note for the automated reviewer ...") | V7 phrasing 2: 0 of 30 and 0 of 22 (VF-03, KL-08) | **Fails** | Repair with a research-profile screen tested on other phrasings |

## 5. Cognitive controls

| Capability | Evidence (A3R, evaluation) | Status | Recommendation |
|---|---|---|---|
| Detect validity (control matches a real flaw) | 84 of 87 record-flaw controls on flawed records (96.5%) | Works offline | Continue |
| Burden on clean records | 0.17 controls per clean grounded record | Works offline | Continue |
| Traceability (span links valid) | 100% of graphs | Works offline, but only 7 of 100 controls carry span links | Repair: link more controls to spans |
| Contradiction between a control and the graph | 0 | Works offline | Continue |
| Redundancy | 36 repeated defects in 60 graphs (CF-01) | Fails the proposed criterion | Repair: one control per defect |
| Usefulness to a reviewer | None | Not exercised (protocol written, not run) | Run `protocol/REVIEWER_BENEFIT_PROTOCOL.md` |
| Phase 9 human-review safeguards (eight) | Not touched by this study | Not exercised | Unchanged |

## 6. Stability, recovery and transport

| Capability | Evidence | Status | Recommendation |
|---|---|---|---|
| Compiler determinism | 1,120 of 1,120 record rows and 4,045 of 4,045 variant rows identical across two replays | Works offline | Continue |
| Cross-environment determinism (time zone Pacific/Kiritimati, locale tr-TR) | 1,120 of 1,120 identical | Works offline (one Node version only) | Add another Node version when available |
| Runner recovery and fail-closed inputs | Recovery tests 1.0: 9 of 10 (harness defect HF-01); 1.1: 10 of 10 | Works offline | Continue |
| Rule-pack seals | Probes: a tampered pack fails closed | Works offline | Continue |
| Test strength | 32 of 32 regression probes; mutation: 30 of 32 non-equivalent mutants killed by probes | Works offline | Continue |
| Transport: request shape, retries, caps, cancellation, accounting, journal, duplicates, allow-list, safe capture | 49 of 49 offline tests; live dispatch disabled | Works offline; never run against the provider | Proceed only to an authorized preflight |
| Provider compatibility | Facts cached 2026-10-06, not re-fetched | Not verified on the day | Re-verify at authorization |

## 7. Material not evaluated

| Material | Why | Recommendation |
|---|---|---|
| 32 public cases | Text not held; retrieval needs authorization; rights and privacy NOT ESTABLISHED | Owner decision |
| 20 originals in excluded or ambiguous domains | Research use of those domains needs decision SC-1 | Owner decision |
| Human reference labels | No human review recorded; forms issued | Development reviewer's forms |
