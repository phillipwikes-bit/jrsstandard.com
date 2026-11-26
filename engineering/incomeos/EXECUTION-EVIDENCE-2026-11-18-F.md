# IncomeOS execution evidence, 18 November 2026 (F): cognitive safeguards, lenses and detection templates

Lane: DS-N1 (Claude Code). Builds on `claude/ds-n1-legal-abbreviations` (#220). Owner instruction: implement the commercial feature set (18 programme components, cognitive lenses, eight CC-* safeguards, 23 detection templates, enterprise requirements).

## Built

- `lib/ds-n1/cognitive-safeguards.mjs`: 14 lenses (the 12 commercial lenses plus causation and automation reliance; second-document names kept as aliases) and the eight controls CC-INTENT, CC-PLAUSIBLE, CC-NEGATION, CC-DATES, CC-WORDS, CC-MISSING, CC-BASIS, CC-ESCALATE. Each item is anchored to a finding, an observation or a quoted word; each control lists fitting existing reviewer actions; CC-ESCALATE names a route. Read-only.
- `lib/ds-n1/detection-templates.mjs`: all 23 named templates. 11 map to existing findings, 1 to the certainty observation, 11 are new advisory checks that never change status until validated.
- Reviewer panel shows safeguards, lenses raised and advisory completeness notes. Bridge `reviewerSnapshot` carries `safeguards` and `detectionTemplates` (contract 1.0.3-dev, additive).
- `lib/ds-n1/package/FEATURE_COVERAGE.md`: every SP component, lens, control, template, enterprise requirement and evaluation measure, with code, test and status.

## Recorded decisions and conflicts

- **CC-INTENT** is defined two ways in the owner's documents. Both triggers are implemented and reported separately (`facet: stated_intent` versus the request-mismatch trigger). REQUIRES HUMAN REVIEW to choose one definition.
- **SP-01 to SP-18 original acceptance remains 0 of 18.** DS-N1 equivalents are built; acceptance is gated on authenticated DS-A source (`tests/incomeos-ds-original-verification.mjs`, unchanged and passing).
- **Enterprise requirements not built:** authentication and roles, tenant separation, secure processing of real records, retention and deletion, independent logging. They need the owner backend items in HANDOFF section 6 and are outside the current engine scope.
- **Evaluation results NOT ESTABLISHED.** They need independent labelled records and human reviewers.

## Executed (local)

- Supported records (P01 to P05 and the four supported partner records): zero lenses, zero controls, zero partner-record template hits. P03, a supported but thin authorization, draws four advisory completeness notes and stays READY.
- `cognitive-safeguards.test.mjs` 10 tests; `detection-templates.test.mjs` 10 tests. The template tests found a defect in the first draft (the dates template ignored its record-type scope); fixed before commit.
- Reviewer browser 28/28 (new safeguard check fails without the panel, 26/28); authoring browser 20/20; panel browser passed at 320, 375, 430 px.
- Native DS-N1 suites 112/112; bridge 20/20; programme, original verification, source boundary, release gate passed. Developer eval, stress dev split and isolation eval unchanged.

Not run: HOLDOUT-2, accounting-lane suites, real devices, any effectiveness or false-warning-rate evaluation.
