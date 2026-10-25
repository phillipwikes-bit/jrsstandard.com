# Builds VALIDATION_EVIDENCE_MAP.json and .md. Content is authored here; nothing is measured.
import json
S = lambda oe, ol, iv, pq: {"offline_engineering_evidence": oe, "owner_led_feasibility_evidence": ol, "independent_validation": iv, "production_qualification": pq}
NO = "not_suitable"; PART = "partial_support_only"; YES = "suitable"
OFF = "offline_engineering_synthetic"
OWN = "owner_authored_expectation"
NONE = "no_evidence"
areas = [
 ("deterministic_compiler_behavior", "Determinism", "Phase 6 and 7 determinism and stability records; this package's two clean-run comparison over 60 new cases.", "Local, repeatable, hash-compared.", OFF,
  "Same machine class and runtime only; identical inputs only; no cross-platform or cross-runtime run.", "Cross-environment reproducibility; characterization under a live model, where inputs vary.", "Engineering owner", S(YES, PART, NO, NO)),
 ("quote_and_provenance_pairing", "Evidence integrity", "Quote resolution in the frozen compiler (offsets computed locally); nine-field binding and pair check in adapter 0.2.0; mapping MT-28 to MT-32; this package's pairing probes.", "Directly tested with mutations.", OFF,
  "Pairing proves byte integrity of stored artifacts, not that a quotation is relevant or correct.", "Pairing under live capture; custody across real storage.", "Engineering owner", S(YES, YES, PART, NO)),
 ("chronology_handling", "Condition logic", "RPK-CHR rule packs (Phase 7); dated-event extraction; this corpus's chronology-conflict cases.", "Lexical rules over explicit ISO dates; owner-authored cases.", OWN,
  "Only explicit YYYY-MM-DD dates and fixed role words; undated or narrative chronology is not inferred.", "Real-record chronology variety; independent adjudication of what counts as a conflict.", "Owner; future independent adjudicator", S(YES, PART, NO, NO)),
 ("contradiction_handling", "Condition logic", "K1 to K6 conflict detectors and RP-CON-01; this corpus's conflicting-source cases.", "Bounded lexical detectors; owner-authored cases.", OWN,
  "Paraphrased contradictions outside the listed nouns and phrases are not detected; the Engine never resolves a conflict.", "Recall on paraphrased real contradictions; independent labelling.", "Owner; future independent adjudicator", S(YES, PART, NO, NO)),
 ("scope_refusal_behavior", "Boundary", "Intake gate (excluded-domain lexicons, RP-SCO-01), size, scope and version checks; this corpus's scope-boundary cases.", "Lexical; tested on owner-authored triggers.", OWN,
  "Reworded or novel excluded-domain language may pass; over-refusal on benign homonyms is possible.", "Measured false-acceptance and over-refusal on independent material.", "Owner; counsel where a real-data scope question arises", S(YES, PART, NO, NO)),
 ("human_review_routing", "Boundary", "Every graph carries the fixed documentation_quality_reviewer route; findings, conflicts and refusals carry ROUTES_TO_REVIEW edges.", "Structural and always on; directly checked.", OFF,
  "Routing is unconditional by design, so it shows a route exists, not that a reviewer acts.", "Evidence that human reviewers act on the route; operator records.", "Owner", S(YES, YES, PART, NO)),
 ("mapping_integrity", "Adapter", "Anthropic mapping 0.1.0-offline: 33 tests, 12 mutations, all with synthetic captures.", "Offline only; the response shape is assumed from documentation, never observed live.", OFF,
  "Never exercised on a real provider response.", "A controlled live capture under a valid authorization.", "Owner under a new restart authorization", S(YES, PART, NO, NO)),
 ("transport_boundary_controls", "Adapter", "Live-transport boundary with dispatch lock (LT tests, B mutations); network guard in every harness.", "Directly tested offline; the lock has never been released.", OFF,
  "The live path has never run, so its behaviour under real transport is untested.", "A supervised live run; incident and stop-procedure evidence.", "Owner under a new restart authorization", S(YES, PART, NO, NO)),
 ("cognitive_controls", "Review layer", "Cognitive-controls validator and graph defect templates; their test and mutation results.", "Offline, synthetic.", OFF,
  "Neutrality is checked lexically; no reviewer has used the controls.", "Use by independent reviewers; effect on review quality.", "Owner; future independent evaluator", S(YES, PART, NO, NO)),
 ("mutation_resistance", "Test strength", "Phase 6 to 9 mutation records; adapter, mapping, boundary and cognitive-control mutations; 30 or more new mutations in this package.", "Each mutation has a named direct probe.", OFF,
  "Mutations show that the probes detect the faults they target; they do not show the absence of other faults.", "Independent review of mutation coverage.", "Engineering owner", S(YES, PART, NO, NO)),
 ("reproducibility", "Determinism", "Graph hashes exclude run id and timestamp; identity records compiler, package and prompt hashes.", "Characterized offline only.", OFF,
  "Live-model output variability is uncharacterized (CLAUDE.md section 21).", "Repeated live runs and an empirical variability study.", "Owner; future independent evaluator", S(YES, PART, NO, NO)),
 ("model_behavior", "Model", "None. No live model response has ever been processed by this Engine path.", "None.", NONE,
  "Mocked responses are authored to test the compiler, not to represent any model.", "The Stage A feasibility pilot (stopped) and any later controlled study.", "Owner under a new restart authorization", S(NO, NO, NO, NO)),
 ("diagnostic_accuracy", "Accuracy", "None. Owner-authored expectations are not ground truth.", "None.", NONE,
  "Agreement with owner-authored expectations measures conformance to the owner's specification, not accuracy.", "Independent adjudicated reference labels; pre-specified accuracy measures; adequate sample.", "Independent evaluator; owner", S(NO, NO, NO, NO)),
 ("false_reassurance", "Accuracy", "This corpus's false-reassurance trap cases test that mechanically unsupported support is lowered.", "Mechanical, owner-authored.", OWN,
  "Covers only the trap forms authored here; a missed real gap would not be detected by this method.", "Independent measurement of the false-reassurance rate on independent material.", "Independent evaluator", S(PART, PART, NO, NO)),
 ("independent_evaluation", "Process", "None conducted. Phase 8 evaluation-handoff freeze and this package's handoff drafts describe what would be needed.", "Planning documents only.", NONE,
  "No evaluator, no independent corpus, no adjudication exists.", "All conditions in INDEPENDENT_EVALUATION_PROTOCOL_DRAFT.md.", "Owner; independent evaluator; counsel where applicable", S(NO, NO, NO, NO)),
 ("operator_controls", "Operations", "Stage A authorization, readiness checklist and stop records; dispatch lock; retention terms.", "Documented, not exercised; the only exercise was a stop.", OWN,
  "Access, logging, recovery and incident procedures have not been demonstrated in operation.", "A demonstrated operating record: access, retention, recovery, logging and stop drills.", "Owner", S(PART, PART, NO, NO)),
 ("release_readiness", "Release", "None. NO_GO_NOT_VERIFIED in effect; B-018 OPEN.", "None.", NONE,
  "No release criterion is met.", "Every item above, plus a separate release decision.", "Owner (separate release decision)", S(NO, NO, NO, NO)),
]
out = {"map_format": "jrs-validation-evidence-map/0.1.0", "date": "2026-10-25", "release_status": "NO_GO_NOT_VERIFIED", "b018": "OPEN",
  "statement": "Local synthetic evidence cannot establish model reliability, real-world accuracy, independent validation or production readiness.",
  "suitability_values": [YES, PART, NO], "areas": []}
for a in areas:
  k, cat, ev, q, prov, lim, miss, auth, suit = a
  out["areas"].append({"claim_area": k, "claim_category": cat, "evidence_available": ev, "evidence_quality": q, "provenance_class": prov,
    "known_limitations": lim, "missing_evidence": miss, "required_decision_authority": auth, "suitability": suit})
json.dump(out, open("VALIDATION_EVIDENCE_MAP.json", "w"), indent=2)
md = ["# Validation Evidence Map", "", "**2026-10-25. Local engineering material only.** " + out["statement"] + " B-018 OPEN. NO_GO_NOT_VERIFIED in effect.", "",
  "Provenance classes: `offline_engineering_synthetic` (local code tested on synthetic material); `owner_authored_expectation` (behaviour checked against expectations the owner's side wrote); `no_evidence`.", "",
  "Suitability: **S** suitable, **P** partial support only, **N** not suitable. Columns: offline engineering evidence / owner-led feasibility evidence / independent validation / production qualification.", "",
  "| Claim area | Category | Provenance | OE | OF | IV | PQ |", "|---|---|---|---|---|---|---|"]
ab = {YES: "S", PART: "P", NO: "N"}
for x in out["areas"]:
  s = x["suitability"]
  md.append(f"| {x['claim_area'].replace('_',' ')} | {x['claim_category']} | {x['provenance_class']} | {ab[s['offline_engineering_evidence']]} | {ab[s['owner_led_feasibility_evidence']]} | {ab[s['independent_validation']]} | {ab[s['production_qualification']]} |")
md += ["", "No claim area is suitable for independent validation or production qualification on present evidence.", "", "## Detail", ""]
for x in out["areas"]:
  md += [f"### {x['claim_area'].replace('_',' ').capitalize()}", "",
    f"- **Evidence available:** {x['evidence_available']}", f"- **Evidence quality:** {x['evidence_quality']}", f"- **Provenance class:** {x['provenance_class']}",
    f"- **Known limitations:** {x['known_limitations']}", f"- **Missing evidence:** {x['missing_evidence']}", f"- **Required decision authority:** {x['required_decision_authority']}", ""]
md += ["**B-018 remains OPEN. NO_GO_NOT_VERIFIED remains in effect.**", ""]
open("VALIDATION_EVIDENCE_MAP.md", "w").write("\n".join(md))
