# Mutation Evidence

**LOCAL ENGINEERING CANDIDATE ONLY. NOT INDEPENDENTLY EVALUATED. NO RELEASE OR DEPLOYMENT AUTHORIZATION.**

Source: `execution-record/MUTATION_EVIDENCE.json` (2026-10-19T13:57:52.546Z, `node tests/engine-remediation-phase7/run.mjs --record`). Each mutation is an exact, once-only text replacement in a temporary copy of `lib/` and the Phase 7 tooling; the mutated modules are imported and 94 direct probes run. A mutation counts as killed only when a probe fails. A load failure does not count.

| Measure | Value |
|---|---|
| Mutations introduced | 79 |
| Killed by a direct probe | 79 |
| Survived | 0 |
| Load failures | 0 |
| Setup errors | 0 |
| Probes (all pass unmutated) | 94 |
| Network attempts | 0 |

## Areas

| Area | Mutations |
|---|---|
| baseline comparison | 7 |
| candidate output validation | 5 |
| contradiction detection | 6 |
| date parsing and date-role logic | 6 |
| limitation preservation | 5 |
| negation handling | 4 |
| refusal preservation | 4 |
| rule trigger: RP-CHR-01 | 3 |
| rule trigger: RP-CHR-02 | 3 |
| rule trigger: RP-CHR-03 | 2 |
| rule trigger: RP-CHR-04 | 3 |
| rule trigger: RP-CON-01 | 4 |
| rule trigger: RP-EVL-01 | 6 |
| rule trigger: RP-NEG-01 | 1 |
| rule trigger: RP-SCO-01 | 3 |
| rule trigger: RP-STR-01 | 2 |
| rule-pack validation | 10 |
| version and hash mismatches | 5 |

## History of this record (disclosed)

1. The first mutation run was invalid: a probe compiled existing inputs in the wrong execution mode. It was stopped and its temporary directories removed. The probe gained a mode parameter.
2. The second run killed 75 of 79. MX-02, MX-40, MX-59 and MX-61 survived. Work stopped and was reported without repair.
3. On owner authorization four direct probes were added (`execution-record/POST_STOP_REPAIR_RECORD.json`). The first attempt to launch the rerun never began (`execution-record/FIRST_ATTEMPT_DISCLOSURE.json`).
4. The rerun killed 79 of 79 but the coverage check failed: no mutation was labelled `rule trigger: RP-NEG-01`. That check had also failed in run 2. On owner authorization MX-14, which disables the RP-NEG-01 trigger, was relabelled; its text and probes are unchanged (`execution-record/LABEL_CORRECTION_RECORD.json`).
5. The full mutation group was rerun: 84 of 84 checks passed.

## Results

| Mutation | Area | File | Target text | Result | Killed by |
|---|---|---|---|---|---|
| MX-01 | rule trigger: RP-CHR-01 | contradictions.mjs | `if (rules.has('RP-CHR-01') && fd) {` | `killed` | p7.P7-CHR-01, p7.P7-CHR-03, p7.P7-CHR-04, existing.v0.3-fixture (+3) |
| MX-02 | rule trigger: RP-CHR-01 | contradictions.mjs | `/\brisk assessment\b/i.test(e.text) && ` | `killed` | d.chr01_non_risk_assessment_outside_followup_not_conflict |
| MX-03 | rule trigger: RP-CHR-01 | contradictions.mjs | `roleOf(e.section) !== 'action' && ` | `killed` | d.chr01_action_section_excluded |
| MX-04 | date parsing and date-role logic | contradictions.mjs | `e.date > fd.date` | `killed` | d.chr01_same_day_not_conflict |
| MX-05 | rule trigger: RP-CHR-02 | contradictions.mjs | `if (rules.has('RP-CHR-02')) {` | `killed` | p7.P7-CHR-05, p7.P7-CHR-07, p7.P7-CHR-08, existing.phase4-corpus (+1) |
| MX-06 | rule trigger: RP-CHR-02 | contradictions.mjs | `if (ex.length > 1) add('expiry_date_conflict'` | `killed` | p7.P7-CHR-05, p7.P7-CHR-07, p7.P7-CHR-08, existing.phase4-corpus (+1) |
| MX-07 | rule trigger: RP-CHR-02 | contradictions.mjs | `.map((e) => [e.date, e])).values()];     if (ex.length` | `killed` | p7.P7-CHR-06 |
| MX-08 | rule trigger: RP-CHR-03 | conditions.mjs | `if (rules.has('RP-CHR-03') && !events.some((e) => e.role === 'decision` | `killed` | p7.P7-CHR-09, p7.P7-CHR-11, p7.P7-CHR-12, existing.phase6-library (+2) |
| MX-09 | rule trigger: RP-CHR-03 | conditions.mjs | `!events.some((e) => e.role === 'decision')) r.visible_gaps.push('no_da` | `killed` | p7.P7-CHR-09, p7.P7-CHR-11, p7.P7-CHR-12, existing.phase6-library (+2) |
| MX-10 | rule trigger: RP-CHR-04 | contradictions.mjs | `if (rules.has('RP-CHR-04') && fd && fe) {` | `killed` | p7.P7-CHR-08, p7.P7-CHR-13, p7.P7-CHR-15, p7.P7-CHR-16 (+3) |
| MX-11 | rule trigger: RP-CHR-04 | contradictions.mjs | `if (Math.abs(days - n) > 1)` | `killed` | p7.P7-CHR-14 |
| MX-12 | rule trigger: RP-CHR-04 | contradictions.mjs | `if (Math.abs(days - n) > 1)` | `killed` | p7.P7-CHR-08, p7.P7-CHR-13, p7.P7-CHR-15, p7.P7-CHR-16 (+2) |
| MX-13 | date parsing and date-role logic | contradictions.mjs | `const DURATION = /\bfor (\d{1,4}) days?\b/i;` | `killed` | p7.P7-CHR-08, p7.P7-CHR-13, p7.P7-CHR-15, p7.P7-CHR-16 (+3) |
| MX-14 | rule trigger: RP-NEG-01 | conditions.mjs | `rules.has('RP-NEG-01') && e.assertion_type === 'stated_rationale'` | `killed` | p7.P7-NEG-01, p7.P7-NEG-02, p7.P7-NEG-03, p7.P7-NEG-06 (+1) |
| MX-15 | negation handling | conditions.mjs | `(?:[A-Za-z]+\s+){0,2}?` | `killed` | p7.P7-NEG-03 |
| MX-16 | negation handling | conditions.mjs | `(?:not\|no\|never\|without)\s+` | `killed` | p7.P7-NEG-03 |
| MX-17 | negation handling | conditions.mjs | `(?:need\|needs\|needed\|require\|requires\|required\|because\|based on)\b/i` | `killed` | p7.P7-NEG-01, p7.P7-NEG-02, p7.P7-NEG-03, p7.P7-NEG-06 (+1) |
| MX-18 | negation handling | conditions.mjs | `e.assertion_type) && !negated(e));` | `killed` | p7.P7-NEG-01, p7.P7-NEG-02, p7.P7-NEG-03, p7.P7-NEG-06 (+1) |
| MX-19 | rule trigger: RP-EVL-01 | compiler.mjs | `else if (rules.has('RP-EVL-01') && LINKED_SECTION_ROLES[c]` | `killed` | p7.P7-EVL-01, p7.P7-EVL-02, p7.P7-EVL-03, p7.P7-EVL-07 (+2) |
| MX-20 | rule trigger: RP-EVL-01 | compiler.mjs | `identifiable_basis: ['authority', 'basis'],` | `killed` | p7.P7-EVL-01, existing.phase6-library |
| MX-21 | rule trigger: RP-EVL-01 | compiler.mjs | `'decision', 'expiry'], reasoning_traceability` | `killed` | p7.P7-EVL-02, existing.phase6-library |
| MX-22 | rule trigger: RP-EVL-01 | compiler.mjs | `reasoning_traceability: ['basis'] });` | `killed` | p7.P7-EVL-03, p7.P7-EVL-07, existing.phase4-stability, existing.phase6-library |
| MX-23 | rule trigger: RP-EVL-01 | compiler.mjs | `chronology_integrity: ['chronology', 'request', 'authority', 'decision` | `killed` | p7.P7-EVL-05 |
| MX-24 | rule trigger: RP-EVL-01 | compiler.mjs | `span_id: sp, section: r.location.section });` | `killed` | p7.P7-CHR-01, p7.P7-CHR-02, p7.P7-CHR-04, p7.P7-CHR-05 (+40) |
| MX-25 | rule trigger: RP-CON-01 | contradictions.mjs | `if (rules.has('RP-CON-01') && !controlConflict) {` | `killed` | p7.P7-CON-01, p7.P7-CON-02, p7.P7-CON-05, p7.P7-CON-06 (+2) |
| MX-26 | rule trigger: RP-CON-01 | contradictions.mjs | `review of (?:the )?(?:access )?logs\|` | `killed` | p7.P7-CON-01, p7.P7-CON-02, p7.P7-CON-05, p7.P7-CON-06 (+1) |
| MX-27 | rule trigger: RP-CON-01 | contradictions.mjs | `const NOT_STARTED = /\b(?:has not started\|not started\|has not begun\|no` | `killed` | p7.P7-CON-01, p7.P7-CON-02, p7.P7-CON-05, p7.P7-CON-06 (+1) |
| MX-28 | rule trigger: RP-CON-01 | contradictions.mjs | `LOG_CONCEPT.test(c.text) && IMPLEMENTED.test(c.text) && !offState(c)` | `killed` | d.con_on_state_requires_implemented |
| MX-29 | contradiction detection | contradictions.mjs | `&& !controlConflict) {` | `killed` | d.con_single_conflict_when_k4 |
| MX-30 | rule trigger: RP-SCO-01 | scope.mjs | `(rules.has('RP-SCO-01') ? [...REGULATED, ['employment', REWORDED_EMPLO` | `killed` | p7.P7-SCO-01, p7.P7-SCO-02, p7.P7-SCO-05, p7.P7-SCO-06 (+3) |
| MX-31 | rule trigger: RP-SCO-01 | scope.mjs | `(?![-\s]+(?:queue\|queues\|scheduler\|runner\|title\|description\|code\|refer` | `killed` | p7.P7-SCO-04 |
| MX-32 | rule trigger: RP-SCO-01 | scope.mjs | `(?:keeps?\|lose\|loses\|lost)\s+` | `killed` | p7.P7-SCO-02 |
| MX-33 | rule trigger: RP-STR-01 | assertions.mjs | `? 'attributed_purpose' : cat` | `killed` | p7.P7-R07-01, p7.P7-R07-02, p7.P7-R07-03, p7.P7-R07-06 (+1) |
| MX-34 | rule trigger: RP-STR-01 | assertions.mjs | `rules && rules.has('RP-STR-01')` | `killed` | p7.P7-R07-01, p7.P7-R07-02, p7.P7-R07-03, p7.P7-R07-06 (+1) |
| MX-35 | date parsing and date-role logic | record.mjs | `if (validDate(m[1], m[2], m[3])) out.push(` | `killed` | d.invalid_dates_ignored |
| MX-36 | date parsing and date-role logic | record.mjs | `(s.role === 'expiry' && !/\brenew/i.test(c.text))` | `killed` | d.renewal_date_not_expiry |
| MX-37 | date parsing and date-role logic | record.mjs | `else if (/\b(?:assessment\|completed)\b/i.test(c.text)) role = 'assessm` | `killed` | p7.P7-CHR-01, p7.P7-CHR-03, p7.P7-CHR-04, existing.v0.3-fixture (+3) |
| MX-38 | date parsing and date-role logic | contradictions.mjs | `const first = (role) => events.filter((e) => e.role === role).sort((a,` | `killed` | p7.P7-CHR-08, existing.v0.3-fixture, existing.phase4-corpus, existing.phase4-stability (+2) |
| MX-39 | contradiction detection | contradictions.mjs | `if (distinct.length > 1) add('decision_date_conflict'` | `killed` | existing.v0.3-fixture, existing.phase4-corpus, existing.phase4-stability, existing.phase6-library (+1) |
| MX-40 | contradiction detection | contradictions.mjs | `const pairs = [['request', 'decision'], ['decision', 'expiry'], ['requ` | `killed` | d.expiry_between_request_and_decision_is_impossible_sequence |
| MX-41 | contradiction detection | contradictions.mjs | `if (ap && pe) add('authority_state_conflict'` | `killed` | existing.v0.3-fixture, existing.phase4-corpus |
| MX-42 | contradiction detection | contradictions.mjs | `if (lo && op) add('risk_state_conflict'` | `killed` | existing.v0.3-fixture, existing.phase4-corpus, existing.phase6-library |
| MX-43 | contradiction detection | contradictions.mjs | `if (value(vals[i]) !== value(vals[j])) {` | `killed` | existing.v0.3-fixture, existing.phase4-corpus |
| MX-44 | candidate output validation | response.mjs | `if (Object.keys(o).some((k) => UNTRUSTED_FIELDS.includes(k))) return f` | `killed` | existing.v0.3-fixture, existing.phase4-corpus, existing.phase6-library, d.untrusted_field_reason |
| MX-45 | candidate output validation | response.mjs | ` \|\| ids.has(o.observation_id)) return fail(` | `killed` | d.duplicate_observation_ids |
| MX-46 | candidate output validation | response.mjs | `if (v.observations.length > MAX_OBSERVATIONS) return fail(` | `killed` | d.max_observations |
| MX-47 | candidate output validation | response.mjs | `if (v.contract_version !== CONTRACT_VERSION) return fail(` | `killed` | existing.phase4-corpus, d.contract_version_checked |
| MX-48 | candidate output validation | response.mjs | `if (!STATUSES.includes(o.proposed_status)) return fail(` | `killed` | d.status_vocabulary |
| MX-49 | refusal preservation | scope.mjs | `if (m) { seen.add(domain); add('excluded_domain_content', 'refuse',` | `killed` | p7.P7-SCO-01, p7.P7-SCO-02, p7.P7-SCO-05, p7.P7-SCO-06 (+5) |
| MX-50 | refusal preservation | compiler.mjs | `if (intake.decision !== 'proceed') {` | `killed` | existing.phase4-corpus, existing.phase6-library |
| MX-51 | refusal preservation | compiler.mjs | `if (status === 'not_assessed') refusal(reasons[0]` | `killed` | p7.P7-CHR-03, p7.P7-CHR-07, p7.P7-CHR-11, p7.P7-CHR-15 (+7) |
| MX-52 | refusal preservation | scope.mjs | `if (rulePackProblems.length) add('rule_pack_rejected'` | `killed` | rp.empty_set_refuses, rp.compile_refuses_on_invalid_set |
| MX-53 | version and hash mismatches | scope.mjs | `if (dv[k] !== v) add(` | `killed` | existing.v0.3-fixture, existing.phase4-corpus |
| MX-54 | version and hash mismatches | scope.mjs | `if (fi !== undefined && (!fi \|\| typeof fi !== 'object' \|\| fi.fixture_h` | `killed` | existing.v0.3-fixture |
| MX-55 | limitation preservation | compiler.mjs | `const lims = [LIMITATIONS.presence];` | `killed` | p7.P7-CHR-01, p7.P7-CHR-02, p7.P7-CHR-03, p7.P7-CHR-04 (+57) |
| MX-56 | limitation preservation | compiler.mjs | `if (conflictAffects[c].length) lims.push(LIMITATIONS.conflict);` | `killed` | p7.P7-CHR-01, p7.P7-CHR-04, p7.P7-CHR-05, p7.P7-CHR-08 (+10) |
| MX-57 | limitation preservation | compiler.mjs | `if (risk.record_instruction_risk === 'detected') lims.push(LIMITATIONS` | `killed` | existing.v0.3-fixture, existing.phase4-corpus, existing.phase4-stability, existing.phase6-library (+1) |
| MX-58 | limitation preservation | compiler.mjs | `    edge('ROUTES_TO_REVIEW', 'find:' + c, 'review');   };` | `killed` | p7.P7-CHR-01, p7.P7-CHR-02, p7.P7-CHR-03, p7.P7-CHR-04 (+68) |
| MX-59 | limitation preservation | compiler.mjs | `if (c === 'sufficiency') { status = 'review_required';` | `killed` | d.sufficiency_outcome_reason_and_limitation |
| MX-60 | rule-pack validation | rule-packs.mjs | `else if (k.signature.content_sha256 !== contentSeal(k)) p.push(` | `killed` | rp.tampered_rejected, rp.rejected_set_activates_nothing, rp.compile_refuses_on_invalid_set |
| MX-61 | rule-pack validation | rule-packs.mjs | `typeof k.signature.content_sha256 !== 'string') p.push(at + ': unsigne` | `killed` | rp.invalid_signature_method_or_value_rejected |
| MX-62 | version and hash mismatches | rule-packs.mjs | `if (k.candidate_version !== COMPILER_VERSION) p.push(` | `killed` | rp.version_mismatch_rejected |
| MX-63 | rule-pack validation | rule-packs.mjs | `if (packIds.has(k.pack_id)) p.push(` | `killed` | rp.duplicate_pack_id_rejected |
| MX-64 | rule-pack validation | rule-packs.mjs | `if (ruleIds.has(rid)) p.push(` | `killed` | rp.duplicate_rule_rejected |
| MX-65 | rule-pack validation | rule-packs.mjs | `for (const f of RULE_FIELDS) if (` | `killed` | rp.incomplete_rejected |
| MX-66 | rule-pack validation | rule-packs.mjs | `if (!IMPLEMENTED_RULES.includes(rid)) p.push(` | `killed` | rp.unknown_rule_rejected |
| MX-67 | rule-pack validation | rule-packs.mjs | `if (!SAFE_OUTCOMES.includes(r.expected_safe_outcome)) p.push(` | `killed` | rp.unsafe_outcome_rejected |
| MX-68 | rule-pack validation | rule-packs.mjs | `for (const f of Object.keys(r)) {` | `killed` | rp.designation_field_rejected |
| MX-69 | rule-pack validation | rule-packs.mjs | `active: ok ? ruleIds : new Set()` | `killed` | rp.tampered_rejected, rp.unsigned_rejected, rp.invalid_signature_method_or_value_rejected, rp.version_mismatch_rejected (+8) |
| MX-70 | rule-pack validation | rule-packs.mjs | `return { ok: false, problems: ['no rule packs supplied']` | `killed` | rp.empty_set_refuses |
| MX-71 | baseline comparison | qualify.mjs | `classification: INV.includes(diff.verdict) ? 'no_behavioral_difference` | `killed` | q.unchanged_difference_flagged |
| MX-72 | baseline comparison | qualify.mjs | `const bad = diff.findings.filter((f) => f.fail_closed \|\| !OK_CLASSES.i` | `killed` | q.bad_findings_flagged |
| MX-73 | baseline comparison | qualify.mjs | `if (spec.statuses && JSON.stringify(out.candidate_statuses) !== JSON.s` | `killed` | q.statuses_checked |
| MX-74 | baseline comparison | qualify.mjs | `if (spec.conflicts_gained && JSON.stringify(` | `killed` | q.conflicts_checked |
| MX-75 | baseline comparison | qualify.mjs | `if (!completeRefusal(cand.graph)) P.push(` | `killed` | q.complete_refusal_required |
| MX-76 | baseline comparison | qualify.mjs | `if (spec.mode !== 'base_error') return Object.assign(out, { classifica` | `killed` | q.base_error_requires_mode |
| MX-77 | baseline comparison | qualify.mjs | `if (cand.error) return Object.assign(out, { classification: 'unintende` | `killed` | q.candidate_error_flagged |
| MX-78 | version and hash mismatches | qualify.mjs | `const VERSION = { from: '0.3.0-local', to: '0.3.1-candidate' };` | `killed` | q.unchanged_accepted, q.intended_accepted |
| MX-79 | version and hash mismatches | candidate.mjs | `s.declared_versions.compiler_version === FROM) s.declared_versions` | `killed` | existing.v0.3-fixture, q.version_mapping_exact |

Mutation testing shows these probes detect these specific deliberate defects. It does not show the probes detect every defect.
