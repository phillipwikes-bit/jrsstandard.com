# IncomeOS execution evidence, 18 November 2026 (D): investigation, discovery and legal-memo classes

Lane: DS-N1 (Claude Code). Status stays INTEGRATION_IN_PROGRESS. Builds on `claude/ds-n1-negation-and-alternatives` (draft #217).

## Owner instructions recorded

Asked to develop toward the needs of a prospect list (law-firm AI and knowledge leaders, litigation support and eDiscovery providers, legal-technology platforms, and workplace-investigation, HR and ethics providers), the owner answered two direct questions on 18 November 2026:

1. **Workplace investigation reports: authorized, documentation quality only.** The question as put: a fictional investigation-report record type that checks only whether the report's statements match their cited evidence and never assesses a person, outcome or credibility.
2. **Legal records: authorized** `discovery_production_rationale` and `ai_drafted_legal_memo`. This reverses the owner's earlier same-day decision not to authorize discovery rationales; the earlier answer is preserved in evidence record B and the reversal is recorded here.

These lift `CURRENT_ENGINE_HANDOFF_2026-10-05.md`'s "non-HR supplier-access" scope only as stated. They do not lift its release gates or its exclusion of legal-outcome decisions.

**Requires human review before any real use:** employment-related and legal uses of AI are regulated or high-risk in several jurisdictions. Nothing here is a compliance, admissibility or legal-sufficiency claim. Counsel review of any real data flow and of any licensing claim remains a release gate.

## Change

- `lib/ds-n1/identity.mjs`: three further allowed classes, each with a scope line stating "Documentation quality only". New `DOMAIN_PERMITTED_BY_CLASS`: `workplace_investigation_report` may contain employment wording; no other class may, and every other excluded domain (housing, lending, insurance, medical, legal outcome) is still refused for every class.
- `lib/ds-n1/record.mjs`: the excluded-domain scan skips only the domain that the record's class permits.
- `lib/ds-n1/ui/author.html`: the three classes in the class picker.
- Six constructed fixtures in `tests/ds-n1/fixtures-partner/` (INV, DISC, MEMO; one supported, one defective each). Not served; frozen sets untouched.
- `tests/ds-n1/prospect-classes.test.mjs`: 9 tests. `partner-classes.test.mjs`: the "discovery is refused" assertion now uses a never-authorized class, because discovery was authorized.

## Results (local)

- INV-P01, DISC-P01, MEMO-P01: READY_FOR_HUMAN_FINALIZATION, 0 findings, 0 observations.
- INV-D01: HOLD. DATE_MISMATCH, CONTRARY_CLAUSE_OMITTED (dropped "but did not hear any insult"), NEGATION_CONFLICT ("heard an insult" against "did not hear any insult"), REASONING_NOT_TRACED, UNSUPPORTED_CLAIM; observations unsupported_certainty, premature_closure.
- DISC-D01: HOLD. DATE_MISMATCH, QUOTE_NOT_FOUND (wrong source), NEGATION_CONFLICT (protocol says meeting-only documents are not responsive), REASONING_NOT_TRACED, UNSUPPORTED_CLAIM, INSTRUCTION_LIKE_CONTENT; observations unsupported_certainty, premature_closure.
- MEMO-D01: HOLD. QUALIFICATION_OMITTED twice (dropped "unless a written legal hold applies" and "only if"), SOURCE_MISSING and UNSUPPORTED_CLAIM for a citation to a case absent from the record, REASONING_NOT_TRACED, UNSUPPORTED_CLAIM; observations unsupported_certainty, premature_closure.
- Fixture authoring notes: three first drafts of the supported records were flagged by DS-N1 for real defects in the drafting (a cited sentence that also carried "until"; a case holding labelled as an approval; a case excerpt that did not name its parties). The fixtures were corrected, not the engine.
- The new test file fails against the starting source and passes with the change.
- Bridge 20/20; native DS-N1 suites 84/84; programme, original verification, source boundary, release gate passed; developer eval and isolation eval PASS; authoring browser 20/20; reviewer browser 26/26.

Not run: accounting-lane suites, HOLDOUT-2, real devices, any effectiveness evaluation.

## Privacy

The prospect list contains named individuals. It is not stored in this public repository or its trackers.
