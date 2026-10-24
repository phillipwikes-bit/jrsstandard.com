# JRS Review Engine Validation Plan v5.0: Critical Assessment

**READ-ONLY ASSESSMENT. Prepared 2026-10-24 outside the repository. Not a repository
record. Authorizes nothing.** No test was run, no Engine was invoked, no provider was
called, no repository file was changed, no person was contacted. B-018 remains OPEN.
Release status remains NO_GO_NOT_VERIFIED.

The specialist perspectives named in the directive are analytical lenses applied by one
AI assistant. No independent specialist participated.

Companion document: `JRS_REVIEW_ENGINE_VALIDATION_PROGRAMME_v5.1.md` (deliverable D-30,
the complete replacement directive).

**Labels used.** FACT (inspected in the repository today, path given). OWNER-REPORTED
(stated in the v5.0 directive or by the owner; not verifiable here). INFERENCE.
PROPOSAL. NOT ESTABLISHED.

**Repository instruction conflict (recorded, not resolved).** `CLAUDE.md` section 36.9
requires `research/MASTER_TRACKER.md` to be updated on every response. This assignment is
read-only. The tracker write is deferred pending explicit owner authorization.

---

## Response section 1 (D-01). Executive verdict

1. **The v5.0 architecture cannot run as written.** Its central chain (reference records,
   actual Engine, blinded AI evaluator, comparison, owner adjudication) assumes an Engine
   that can be executed end to end against a model. The current candidate has never been
   sent to any model, has no provider adapter, its scope gate accepts only one synthetic
   origin class, and live provider calls are prohibited without a new explicit owner
   instruction (FACT, section 2). Phase 0 of v5.1 exists to close exactly these gaps.
2. **The v5.0 design is directionally sound but overstated.** Frozen references,
   holdouts, blinding, false-reassurance focus and critical-failure preservation are the
   right controls. Its weaknesses are a reference standard authored by the same party and
   model family that built the Engine, a sample size that cannot support the precision
   implied, an AI evaluator whose added value is assumed rather than measured, and
   publication and Track B steps that conflict with current governance.
3. **Track B, as written, would not test what it intends.** The candidate refuses HR and
   employment content by design (FACT). Running fictional retaliation records through it
   would measure refusal behaviour, not documentation diagnosis. Testing diagnosis in
   that domain requires a separately versioned experimental variant and an owner
   instruction that departs from the October 5 exclusions.
4. **An owner-led programme can produce useful, bounded evidence**: technical feasibility,
   failure modes, false-reassurance behaviour on constructed records, repeatability, and
   evidence-grounding behaviour, all for one frozen version. It cannot produce independent
   validation and cannot satisfy release gate 1 (independent labeled and adjudicated
   holdout evaluation).
5. **Verdict.** Feasible and defensible only after the v5.1 corrections, and only as an
   owner-led feasibility study. Not ready for pilot execution today (Phase 0 blockers in
   D-28). The Engine is not validated; release readiness is NO_GO_NOT_VERIFIED.

## Response section 2 (D-02, D-03). Current Engine baseline and evidence status

### 2.1 Two Engine lineages exist in the repository (FACT)

| Field | Lineage V1 (historical deployed endpoint) | Lineage L3 (local candidate) |
|---|---|---|
| Identity | `0.1.0-validation`, API v1 (`docs/enterprise-diligence/API_CONTRACT_RECONCILIATION_2026-09-15.md`) | `phase7-candidate`, compiler `0.3.1-candidate`, package SHA-256 `815c5d56...25c3`, 147 files, verified today |
| Current state | Closed. `api/review.js`, `api/review-engine.js`, `api/v1/review-engine.js` and `api/sandbox.js` all return HTTP 503 `controlled_review_unavailable` via `api/_controlled-review.js` (since commit `0fb5c073`, 2026-10-04) | Local, uncommitted, untracked |
| Model | `claude-haiku-4-5-20251001` pinned in `api/_model.js`; recorded review date `MODEL_REVIEW_BY = 2026-10-15`, which has passed | None bound. No provider adapter exists |
| Prompt | Historical v1 prompt (hash recorded as HREF-v1-0.1.0-validation-baebb512) | `jrs-engine-local-0.3.0/prompt-1`, SHA-256 `0ceda8887463a515d241751133c9b0d3bf3364f89b63fa6ac5dda6ac70c8eec2` (verified today); manifest status "SPECIFICATION ONLY. Never sent to any model." |
| Conditions | `basis_identification`, `reasoning_traceability`, `cold_reviewer_clarity`, `accountability_support`, `temporal_reconstructability` (as used in `tools/score-engine-holdout.mjs`) | `reconstructability`, `identifiable_basis`, `chronology_integrity`, `reasoning_traceability`, `sufficiency` |
| Condition statuses | `pass`, `review`, `gap` | `supported`, `gap`, `review_required`, `not_assessed` |
| Record route | `ready`, `review_required`, `gap_identified` | No overall route. A fixed human-review route (`documentation_quality_reviewer`) on every output. `readiness_verdict`, `overall_pass` and `overall_determination` are prohibited outputs |
| Execution modes | Live provider calls (historical) | `local_mocked`, `local_deterministic` only; any other mode is refused |
| Scope gate | NOT ESTABLISHED for v1 | Accepts only `record_type: supplier_access_exception_draft`, `record_state: completed_draft`, `content_origin: synthetic_engineering_fixture`, `hr_content: false`; refuses regulated-domain patterns including employment; refuses records over 8,000 characters or under 40 |
| Architecture | Model returns condition statuses directly | Model proposes a quote-only candidate response; a deterministic local compiler verifies quotations, computes offsets and statuses, and can only keep or lower a proposed status |

**Consequence.** The five conditions named in v5.0 match Lineage L3 only. The `ready`
route exists only in Lineage V1. The v5.0 term "false-ready" therefore has no direct
counterpart in the Engine it intends to test; v5.1 defines it operationally against L3
outputs (D-14).

### 2.2 Baseline maturity (directive section 6 scale)

| Level | Lineage L3 status | Basis |
|---|---|---|
| 1 Designed | Yes | Contracts, prompt specification, rule packs |
| 2 Implemented | Yes | `lib/engine-evidence-graph-v0.3.1-candidate/` |
| 3 Technically tested | Yes, locally on synthetic fixtures with mocked candidate responses | Phase 7 recorded 328/328; Phase 8 523/523; Phase 9 318/318 (Gate 4C drill, 2026-10-24) |
| 4 Executed successfully end to end | **No.** Never executed against a model | Prompt manifest; execution modes |
| 5 Evaluated for diagnostic accuracy | No | `research/engine-remediation-phase7-2026-10-19/KNOWN_LIMITATIONS.md`: nothing about accuracy or any live model |
| 6 Independently validated | No | Phase 8 protocol `conducted: false` |
| 7 Qualified for production | No | Release gates 1 to 5 not met |

**Validation baseline for a live end-to-end study: NOT ESTABLISHED.** Missing: a bound
model identity and version, a provider adapter, an execution environment record, an
authorized execution mode, an origin class for evaluation records, and an owner
instruction permitting live provider calls.

### 2.3 Source and governance reconciliation (D-03)

| Record | Status in this assessment |
|---|---|
| October 3 Master Asset Register, Evidence Ledger, Architectural Blueprint | **Not read.** Not present in the repository or this workspace; standing instruction not to read, copy or quote them. Identified only by SHA-256 in the October 5 handoff. Directive statements about their content (historical 0.1.0 smoke evidence, 0.1.1 quotation-anchor implementation, five constructed records and ten dependent calls, the E-001 to E-045 namespace) are OWNER-REPORTED |
| October 5 handoff (`docs/architecture/CURRENT_ENGINE_HANDOFF_2026-10-05.md`, SHA-256 `ec9854d2...00ba5`) | Read. Governs current Engine work. Allows local and mocked regression tests; prohibits live provider calls, deployment and validation claims without a new explicit owner instruction; lists five release gates |
| `CLAUDE.md` | Read. Section 21 requires model, version, prompt, configuration and environment identity for every evaluation |
| `.jrs/state/BLOCKERS.json` | B-018 OPEN; B-004 OPEN (no Level A rights instrument); several others in prepared or deployed-not-verified states |
| `.jrs/state/ACTIVE_GATE.json` | Programme Gate 1 (IP integrity) FAIL since 2026-09-14 |
| Local evidence ledger | 39 entries, local E-001 to E-039. The owner-reported canonical source namespace is E-001 to E-045. v5.1 creates no E-nnn identifiers |
| P-01 to P-07 (proposed owner decision record, revision 2) | PROPOSED ONLY; none is effective. P-06's closure rule is therefore not yet an operative requirement |
| Gate 3A dossier and Options A, B, C | Non-operative. Concern independent evaluation; do not cover an owner-led feasibility study (conflict C-04 below) |

**Conflicts identified (none resolved by inference).**

| ID | Conflict | Effect | Resolution path |
|---|---|---|---|
| C-01 | v5.0 assumes actual Engine execution; the handoff prohibits live provider calls without a new explicit owner instruction | Track A phases 3, 4 and 7 cannot run | Owner instruction (OD-V-01) |
| C-02 | v5.0 conditions and "false-ready" assume one Engine; the repository holds two lineages with different conditions and routes | Metrics undefined until the lineage under test is fixed | Owner selects L3 (OD-V-02); P-03 parallel-lineage rule applies |
| C-03 | v5.0 Track B uses employment records; the handoff excludes employment uses and the L3 scope gate refuses HR content | Track B cannot test diagnosis on L3 | Owner decision on an experimental variant (OD-V-13), likely counsel |
| C-04 | Gate 3A options cover independent evaluation only; v5.0 is owner-led | An owner-led study needs its own authorization record | OD-V-03 |
| C-05 | v5.0 Part XIX plans publication; the Gate 3 brief records that no local result may be used for public claims while B-018 is OPEN | Publication blocked on present records | G1 statement on B-018 (OD-V-15) plus publication review |
| C-06 | Pinned model review date 2026-10-15 has passed; current availability cannot be checked without network access | Model identity NOT ESTABLISHED | OD-V-02 |
| C-07 | L3 scope gate accepts only `synthetic_engineering_fixture`; evaluation records are a different class | Running evaluation records would either mislabel them or require a scope-gate change (a new candidate version) | OD-V-04 |

## Response section 3 (D-04, D-05). Ten most consequential weaknesses

Probability and severity are judgments on a three-point scale (Low, Medium, High).

| # | Weakness | Why it matters | Probability | Severity | Root cause (D-05) |
|---|---|---|---|---|---|
| W-01 | The "actual Engine" cannot be executed end to end today | Without live execution, every v5.0 performance number would describe mocks or fixtures | High (certain on present code) | High | The plan was written against the historical deployed lineage; the Engine was later rebuilt as a local, quote-only compiler with live calls deliberately removed |
| W-02 | Reference answers, records, Engine prompt and (possibly) evaluator share one author and one model family | Shared blind spots make the Engine look accurate on exactly the errors it shares with its references | High | High | One owner, one AI assistant (Claude family), and an Engine historically pinned to a Claude model |
| W-03 | Sample size does not support condition-level precision | 50 records give a zero-failure upper bound of 5.8 percent only if all 50 are relevant positives; with 30 positives the bound is 9.5 percent, and condition-level results are clustered | High | Medium | Numbers chosen for feasibility, not derived from precision targets |
| W-04 | "False-ready" is undefined for the candidate | The highest-priority risk cannot be measured without an operational definition | High | High | Terminology inherited from Lineage V1 (`ready` route) |
| W-05 | AI evaluator value is assumed | Adds cost and an appearance of independence; agreement may reflect shared error | Medium | Medium | Desire for independence without human reviewers |
| W-06 | Owner adjudication sees Engine output | Anchoring and confirmation bias toward the Engine the owner built | High | High | Single-operator design |
| W-07 | Synthetic records are likely too clean and too similar | Overstates performance; misses real-world failure | High | Medium | AI-generated records with templated structure |
| W-08 | Track B conflicts with scope controls and governance | Wasted effort, or an unauthorized scope change | High (certain on present code) | High | Research ambition not reconciled with the October 5 exclusions |
| W-09 | Publication and commercial use of results are blocked or bounded by B-018 and the publication policy | Premature claims; reputational risk | Medium | High | Plan treats publication as a downstream step rather than a gated one |
| W-10 | Semantic citation support is not assessable by the Engine | L3 addresses semantic support by abstention only (P7B-013); a "supported" status means text presence in a linked section, not semantic support | High | High | Deliberate design choice to avoid model-dependent semantic matching |

Further weaknesses (W-11 to W-20) are in D-26 and are corrected in v5.1: holdout
leakage through Engine tuning; repeatability conflated with independence; no
execution-failure accounting (P6-RT-07 makes some graphs errors, not outputs); no
version-specific provenance for evaluator runs; the stale live-evaluation tool
`tools/run-live-manifest-evaluation.mjs`, which targets the closed production endpoint;
undefined severity scale; no workload ceiling; no stopping rules; Jackie Garrick named as
a possible dependency; cost not separable into verified and unknown.

## Response section 4 (D-26). Comprehensive risk register

Likelihood (L), severity (S) and detectability (D): Low, Medium or High. A risk with S High
and D Low is prioritized first.

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

**Priority order.** R-01, R-08, R-14, R-40 (high severity, low detectability); then R-16,
R-05, R-06, R-24, R-35 (high severity, governance or execution); then the rest.

## Response section 5 (D-06). Targeted corrective action matrix

| CA | Weakness | Correction | Why it works | Dependencies | Workload (ESTIMATE) | New risk | Verification | v5.1 section |
|---|---|---|---|---|---|---|---|---|
| CA-01 | W-01 | VP0 baseline and VP2 adapter qualification: bind model identity, build a live adapter outside the frozen compiler, add a live execution mode under authorization | Makes "actual Engine" a defined, hashable system | OD-V-01, OD-V-02, OD-V-05 | 8 to 16 hours engineering (Claude-assisted) plus owner review | Adapter changes system under test; new version identity | End-to-end trace on 3 development records; 13-field record complete | 5, 15 |
| CA-02 | W-02 | Two-layer reference; Layer 1 facts written in a construction log before any model touches the record; generation provenance recorded per record; shared-error disclosure | Separates verifiable facts from judgment; makes shared authorship visible | None | 15 minutes per record extra | None | Every record has a Layer 1 log hash frozen before execution | 8 |
| CA-03 | W-03 | Precision-driven sizing; record-level primary analysis; Wilson intervals; zero-failure bounds reported; staged expansion with prespecified triggers | Claims match what the numbers support | OD-V-08 | None beyond reporting | Larger sets cost more | Statistical analysis plan frozen at VG-3 | 10, 24 |
| CA-04 | W-04 | Operational false-reassurance definition against L3 statuses | Measures the priority risk on actual outputs | OD-V-09 | 2 hours | Definition may miss forms | Definition frozen at VG-3; tested on development set | 17 |
| CA-05 | W-05 | Evaluator as a challenge reader with measured marginal value and a drop rule | Keeps it only if it earns its cost | OD-V-07 | 1 call per record | Provider data flow | Marginal-value count after VP3 | 12 |
| CA-06 | W-06 | Owner locks references before seeing outputs; outputs shown with source masked (A or B); original judgments preserved | Reduces anchoring and confirmation bias | None | 5 minutes per record | Masking can fail if outputs are recognizable | Lock timestamps precede output access | 14 |
| CA-07 | W-07 | Realism dimensions, hard negatives, style variation, similarity check | Exposes real weaknesses | None | Included in construction time | Construction cost | Similarity metric below a frozen threshold | 9 |
| CA-08 | W-08 | Track B split: B0 refusal behaviour on current L3 (local deterministic, no model); B1 diagnostic study only on a separately versioned experimental variant after OD-V-13 | Tests what each version can do, without scope violation | OD-V-13, counsel where required | B0: 3 hours | B1 widens scope if mishandled | Track B never shares a version, corpus or claim with Track A | 26 |
| CA-09 | W-09 | Publication gated by a G1 B-018 statement and the publication policy; disclosure checklist | Prevents premature or unbounded claims | OD-V-15 | 2 hours per draft review | Delay | Checklist complete before any external text | 31, 32 |
| CA-10 | W-10 | Five-level citation assessment; "supported" treated as text-presence-in-linked-section only | Measures what the Engine actually checks and what it does not | None | Included in adjudication | None | Citation table per finding | 18 |
| CA-11 | W-11 | Freeze and leakage rules; any change voids the protected status | Keeps confirmation evidence clean | None | None | None | Package hash at seal equals hash at run | 11 |
| CA-12 | W-13 | Execution failures are a primary measure, not excluded | Graph validation failures are errors (P6-RT-07) | None | None | None | Failure count reported | 16 |
| CA-13 | W-17, W-18 | Workload and cost ceilings with stopping points | One owner can finish | OD-V-11, OD-V-12 | None | Early stop leaves partial evidence | Ceilings recorded at each gate | 29, 30 |
| CA-14 | W-20 | Practitioner review optional, after VP8, five packets | No dependency on a volunteer | OD-V-16 | 3 to 5 hours of the practitioner's time | None | Not on the critical path | 27 |

## Response section 6 (D-07). Revised validation architecture (summary)

```
VP0 Baseline and governance  ->  VP1 Reference and corpus design  ->  VP2 Technical assurance
   (no execution)                    (no execution)                     (adapter qualification, after authorization)
        |
VP3 Development pilot (10 records, live, after authorization)
        |
VP4 Protected feasibility evaluation (sealed corpus, live, after authorization)
        |
VP5 Failure analysis  ->  VP6 Corrections proposed (not implemented without authorization)
        |
VP7 Fresh confirmation (only if the Engine changed; new sealed corpus)
        |
VP8 Research report (internal; external use gated)
        |
VP9 Optional practitioner review   VP10 Independent validation decision   VP11 Track B (own authorization)
```

Each record flows: construction log (Layer 1) -> owner interpretive reference (Layer 2,
frozen) -> sealed corpus -> L3 Engine live run (13-field record) -> evaluator run
(blind, optional) -> masked comparison -> owner adjudication (locked forms) -> analysis
(record-level primary) -> report (version-specific, bounded claims).

## Response section 7 (D-23). Cost and workload assessment

**Verified costs: none.** No provider price was checked (no network access in this
assignment). **Unknown:** per-token prices for any model; current availability of any
model.

**Token estimates (ESTIMATE, rule of thumb of about four characters per token):**
prompt about 2,900 characters (about 730 tokens); record at most 8,000 characters (about
2,000 tokens, enforced by the scope gate); output capped by configuration (the historical
v1 setting was 4,096 output tokens; v1 records note truncation at lower caps). Upper bound
per Engine call: about 7,000 tokens. Evaluator calls are similar.

| Phase | Engine calls | Evaluator calls | Token upper bound (ESTIMATE) |
|---|---|---|---|
| VP2 adapter qualification | 10 | 0 | 70,000 |
| VP3 development pilot (10 records, 3 runs each) | 30 | 10 | 280,000 |
| VP4 protected (50 records, 1 run each, plus 10 records times 4 repeats) | 90 | 50 | 980,000 |
| VP4 robustness (10 records times 4 variants) | 40 | 0 | 280,000 |
| VP4 adversarial supplement (25) | 25 | 25 | 350,000 |
| Total, without VP7 | 195 | 85 | about 2.0 million |

Cost equals tokens times the verified price, to be filled in by the owner from the
provider's current price list before VG-2.

**Owner time (ESTIMATE, for planning only).**

| Activity | Per unit | Units | Hours |
|---|---|---|---|
| Record construction with AI drafting, owner verification | 45 to 75 minutes | 60 | 45 to 75 |
| Layer 1 construction log | 10 to 15 minutes | 60 | 10 to 15 |
| Layer 2 interpretive reference | 20 to 30 minutes | 60 | 20 to 30 |
| Adjudication | 15 to 25 minutes | 60 | 15 to 25 |
| Adversarial and robustness variants | 15 minutes | 65 | 16 |
| Analysis and report (Claude-assisted) | | | 15 to 25 |
| Total | | | about 120 to 185 |

**Minimum viable evaluation.** 10 development records plus 30 protected records (at
least 20 with planted material deficiencies, at least 10 adequately supported including
5 hard negatives), single runs, 5-record repeatability subset, no evaluator. About 60 to
90 owner hours. Zero-miss upper bound on 20 positives: 13.9 percent. It yields feasibility
and failure-mode evidence, not precision.

**Low value relative to cost.** Repeating every record more than three times; an
evaluator on every run before its marginal value is shown; Track B before Track A
reports; a practitioner review before VP8.

**Workload ceiling (PROPOSAL).** 6 owner hours per week; adjudication sessions of at most
90 minutes with a break; a hard stop for owner review at each VG gate; total programme
ceiling of 200 owner hours and a call ceiling of 300 Engine and 150 evaluator calls,
changed only by recorded owner decision.

## Response section 8 (D-29). Weighted grades

Scores are judgments on the evidence above. A plan grade is not an Engine grade.

| Category (weight) | v5.0 | Basis | v5.1 | Remaining deficiency |
|---|---|---|---|---|
| Scientific validity and reference quality (20) | 8 | Single-author reference; no fact and judgment separation | 15 | Shared authorship and model family remain |
| Actual Engine-specific rigor (20) | 6 | Assumes executable Engine that does not exist | 15 | Adapter is new code; never yet run |
| Feasibility for one owner (15) | 8 | No ceilings; Track B and evaluator on every run | 11 | 120 to 185 hours is substantial |
| Governance and evidence integrity (15) | 7 | Track B and publication conflicts | 13 | Authorization still to be recorded |
| Statistical defensibility (10) | 4 | Sizes not derived; clustering ignored | 8 | Precision remains modest |
| AI evaluator reliability and independence (10) | 4 | Value assumed; independence implied | 7 | Same-provider risk if no other provider authorized |
| Technical reproducibility (5) | 3 | Fields listed, not bound to code | 4 | Model behaviour cannot be pinned by the owner |
| Publication and commercial relevance (5) | 2 | Claims not bounded | 4 | B-018 still limits use |
| **Total (100)** | **42** | | **77** | |

| Item | Grade |
|---|---|
| Residual methodological risk (v5.1) | Moderate to high: shared authorship and owner adjudication cannot be removed without independent people |
| Practical feasibility (v5.1) | Feasible within the ceilings; tight |
| Readiness for authorized pilot execution | **Not ready.** Phase 0 decisions and VP2 adapter qualification outstanding |
| Actual Engine validation status | **Not validated.** Never executed against a model |
| Production-release readiness | **NO_GO_NOT_VERIFIED.** No release gate met |

## Response section 9. Residual limitations

1. Owner-led results remain owner-led. Blinding and frozen forms reduce, but do not
   remove, bias.
2. Records, Layer 2 references and Engine share an author and possibly a model family.
   Only independent people and material remove this.
3. Synthetic supplier-access records cannot establish real-world accuracy.
4. Sample sizes support detection of frequent failure modes and broad bounds, not
   precise condition-level rates.
5. Results describe one frozen version, one model identity and one date. Any change
   voids them for the new system.
6. Provider behaviour cannot be fully pinned by the owner; repeatability is measured,
   not assumed.
7. No result satisfies release gate 1, 2, 3 or 5.
8. While B-018 is OPEN, results cannot support release status or public claims unless
   the owner's G1 statement provides a bounded exception.

## Response section 10 (D-28). Required owner decisions

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

## Response section 12 (D-31). Exact next authorized action

**Owner review of this assessment, followed by an owner decision on OD-V-02 (lineage
under test and model identity).** Every later step depends on it, it needs no execution,
and it resolves conflicts C-02 and C-06. Nothing is performed until the owner records it.

---

## Deliverable index

| Deliverable | Location |
|---|---|
| D-01 Executive verdict | Section 1 above |
| D-02 Engine evidence assessment | Section 2.1, 2.2 above |
| D-03 Source and governance reconciliation | Section 2.3 above |
| D-04 Gap analysis | Section 3 above; D-26 |
| D-05 Root causes | Section 3 above |
| D-06 Corrective action matrix | Section 5 above |
| D-07 to D-22 | v5.1 sections 5 to 28 |
| D-23 Cost and workload | Section 7 above; v5.1 sections 29, 30 |
| D-24 Publication and claims | v5.1 section 31 |
| D-25 Commercial implications | v5.1 section 32 |
| D-26 Risk register | Section 4 above; v5.1 section 33 |
| D-27 Roadmap | v5.1 section 35 |
| D-28 Owner decisions | Section 10 above; v5.1 section 34 |
| D-29 Weighted evaluation | Section 8 above |
| D-30 Complete revised directive | `JRS_REVIEW_ENGINE_VALIDATION_PROGRAMME_v5.1.md` |
| D-31 Next action | Section 12 above; v5.1 section 40 |

## Pass record (directive Part XXII)

- **Pass One (challenge):** sections 2 and 3; twenty weaknesses identified.
- **Pass Two (redesign):** section 5 and the v5.1 directive.
- **Pass Three (adversarial reassessment):** v5.1 section 36 answers each auditor
  question. Corrections made in Pass Three: (a) the protected corpus composition was
  changed so that positives, not total records, drive the false-reassurance bound;
  (b) the evaluator was moved from a reference role to a challenge role; (c) owner
  adjudication was given output-source masking; (d) Track B B0 was limited to local
  deterministic runs with no model; (e) publication was made conditional on OD-V-15.
  Risks that cannot be eliminated are listed in section 9.

**B-018 remains OPEN. NO_GO_NOT_VERIFIED remains in effect.**
