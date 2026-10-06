// Claim provenance: proposed public repairs. INTERNAL. PROPOSALS ONLY.
//
// Nothing here edits a public file. Each entry names a public file, the exact visible sentence to
// change (`target`, markup removed), the proposed replacement, the claim it serves, and the scanner
// findings it would resolve (`resolves`, exact visible sentences). No proposal changes a figure,
// a denominator or a date: each adds a missing qualifier or corrects a scope. Markup around the
// sentence is kept by whoever applies the repair, after owner publication approval.

const CONSTRUCTED_NOTE = 'Adds the constructed-corpus qualifier the register requires beside the detection figure (governing rule: constructed-record findings are not real-world performance).';

export const REPAIRS = Object.freeze([
  { id: 'PR-01', file: 'research.html', claim: 'CL-001',
    target: 'The detection panel, 16 independent reviewers across 11 countries and 5 continents, detected unreconstructable records at 83.9% accuracy against a verified key, clearing the threshold set before any data were examined.',
    replacement: 'The detection panel, 16 independent reviewers across 11 countries and 5 continents, detected unreconstructable records in a constructed 24-record corpus at 83.9% accuracy against a verified key, clearing the threshold set before any data were examined.',
    reason: CONSTRUCTED_NOTE, resolves: null },
  { id: 'PR-02', file: 'research.html', claim: 'CL-004',
    target: 'A separate human-reviewer reliability analysis measured Gwet\'s AC1 at 0.739 for invited participants and 0.623 for open enrolment on 10 analysed records.',
    replacement: 'A separate human-reviewer reliability analysis measured Gwet\'s AC1 at 0.739 for invited participants and 0.623 for open enrolment on 10 analysed records; the pre-registered two-part criterion was not met because neither lower confidence bound reached 0.41.',
    reason: 'Adds the failed-criterion limitation the register records with the AC1 figures; elsewhere on the page it is stated, but not beside this sentence.', resolves: null },
  { id: 'PR-03', file: 'research.html', claim: 'CL-001',
    target: 'Against a verified answer key, read blind.',
    replacement: 'Against a verified answer key, read blind, on a constructed 24-record corpus.',
    reason: CONSTRUCTED_NOTE + ' On the result-card grid, the neighbouring cross-vendor card says "constructed"; this card does not.',
    resolves: ['83.9%', '16 independent experts on the detection panel, 11 countries, 5 continents, 384 determinations.', '95% CI 72.7 to 95.1 at participant level.', 'Sensitivity 87.0%, specificity 80.7%.'] },
  { id: 'PR-04', file: 'research.html', claim: 'CL-006',
    target: 'Restricted to the runs that returned every record, the range is 82.2 to 93.3 percent across 37 runs at the full 15-record set.',
    replacement: 'Restricted to the runs that returned every record, the range is 82.2 to 93.3 percent across 37 runs at the full 15-record set, as the series stood on 13 August 2026.',
    reason: 'The 37-run figure belongs to the series as read on 13 August 2026 (EV-IP-AUDIT); placed beside the 21 August closure it reads as the closing series. The figure and denominator are unchanged; only its date is added. Whether to publish the 41-run figure at the 15 August data lock instead is an owner question.', resolves: null },
  { id: 'PR-05', file: 'research.html', claim: 'CL-011',
    target: 'Section 5.4 of the detection study reports that all five carry information separating a reconstructable record from an unreconstructable one, at p between 1.0e-08 and 1.5e-11 on 108 labels from 21 raters.',
    replacement: 'Because the overall determination is built from the five conditions, their association with it is expected by construction; the detection study reports it descriptively (Appendix B) and makes no discrimination claim from it.',
    reason: 'The 2026-08-29 detection manuscript moved this analysis to Appendix B with the inferential language removed as circular; the sweep records the derivation as deterministic; the employment manuscript makes no discrimination claim. The p-values are not evidence that the conditions discriminate, and "Section 5.4" no longer locates the analysis.', resolves: null },
  { id: 'PR-06', file: 'research.html', claim: 'CL-001',
    target: 'Panel detection 83.9% against a verified key ( 16 independent reviewers on the detection panel, 11 countries); cross-vendor raw agreement ranged 66.7 to 93.3 percent, mean 85.3 percent, across 61 recorded mixed-denominator runs, and 82.2 to 93.3 percent across 37 runs restricted to the full 15-record set, study closed 21 August 2026; no chance-corrected AC1 was computed for that cross-vendor study, so its pre-registered reproducibility criterion is not established; reviewer reliability Gwet\'s AC1 0.739 invited / 0.623 open enrolment, interim; the pre-registered two-part reliability criterion was not met because neither lower confidence bound reached 0.41.',
    replacement: 'Panel detection 83.9% against a verified key on a constructed 24-record corpus (16 independent reviewers on the detection panel, 11 countries); cross-vendor raw agreement ranged 66.7 to 93.3 percent, mean 85.3 percent, across 61 recorded mixed-denominator runs, and 82.2 to 93.3 percent across 37 runs restricted to the full 15-record set as the series stood on 13 August 2026, study closed 21 August 2026; no chance-corrected AC1 was computed for that cross-vendor study, so its pre-registered reproducibility criterion is not established; reviewer reliability Gwet\'s AC1 0.739 invited / 0.623 open enrolment on 10 analysed records, interim; the pre-registered two-part reliability criterion was not met because neither lower confidence bound reached 0.41.',
    reason: 'Adds three qualifiers the register requires: the constructed corpus, the 37-run window date and the 10-record reliability sample. No figure changes.', resolves: null },
  { id: 'PR-07', file: 'research.html', claim: 'CL-006',
    target: 'Cross-vendor AI consistency (66.7 to 93.3 percent across 61 recorded mixed-denominator runs, mean 85.3 percent; 82.2 to 93.3 percent across 37 runs restricted to the full 15-record set; closed 21 August 2026; no chance-corrected AC1 computed, so the pre-registered reproducibility criterion is not established) and human inter-rater reliability (Gwet\'s AC1 0.739 invited, 0.623 open enrolment, 10 analysed records; the pre-registered two-part criterion was not met), with accuracy reported as preliminary.',
    replacement: 'Cross-vendor AI consistency (66.7 to 93.3 percent across 61 recorded mixed-denominator runs, mean 85.3 percent; 82.2 to 93.3 percent across 37 runs restricted to the full 15-record set, as the series stood on 13 August 2026; closed 21 August 2026; no chance-corrected AC1 computed, so the pre-registered reproducibility criterion is not established) and human inter-rater reliability (Gwet\'s AC1 0.739 invited, 0.623 open enrolment, 10 analysed records; the pre-registered two-part criterion was not met), with accuracy reported as preliminary.',
    reason: 'Adds the 37-run window date (see PR-04).', resolves: null },
  { id: 'PR-08', file: 'research-summary.html', claim: 'CL-001',
    target: 'Panel detection accuracy against a reference classification fixed before scoring',
    replacement: 'Panel detection accuracy on a constructed 24-record corpus, against a reference classification fixed before scoring',
    reason: CONSTRUCTED_NOTE,
    resolves: ['83.9%', '95% confidence interval 72.7 to 95.1 at participant level.', 'Sensitivity 87.0 percent for unsupported records, specificity 80.7 percent for grounded ones.', 'Produced by 16 independent experts across 11 countries and 5 continents, reading cold and blind, over 384 graded reads.'] },
  { id: 'PR-09', file: 'research-summary.html', claim: 'CL-001',
    target: 'The 83.9 percent figure is the mean of the 16 individual reviewer accuracy scores , each scored out of 24 records.',
    replacement: 'The 83.9 percent figure is the mean of the 16 individual reviewer accuracy scores, each scored out of the 24 constructed records.',
    reason: CONSTRUCTED_NOTE, resolves: ['The 83.9 percent figure is the mean of the 16 individual reviewer accuracy scores , each scored out of 24 records.', '83.9 ± t(15, .975) × 21.0 / √16 = 72.7 to 95.1'] },
  { id: 'PR-10', file: 'research-summary.html', claim: 'CL-032',
    target: 'To size that omission rather than argue about it, a mixed-effects logistic model was fitted over all 384 graded reads, crossing both random factors:',
    replacement: 'To size that omission rather than argue about it, an exploratory mixed-effects logistic model was fitted over all 384 graded reads of the detection panel on the constructed corpus, crossing both random factors:',
    reason: 'Adds the constructed-corpus and panel scope the register requires beside the 384 graded reads.', resolves: null },
  { id: 'PR-17', file: 'research-summary.html', claim: 'CL-032',
    target: 'The intercept places an average reviewer on an average record at 89.2 percent .',
    replacement: 'In this exploratory model, the intercept places an average reviewer on an average record at 89.2 percent.',
    reason: 'Places "exploratory" beside the model figures. The section heading says it, but the figures sit more than three sentences from it.',
    resolves: ['The intercept places an average reviewer on an average record at 89.2 percent .', 'Reviewer SD is 1.769 (profile interval 1.292 to 3.000); record SD is 0.011 and sits at the boundary, with a profile interval of 0.001 to 0.556.', 'The latent-scale intraclass correlation is 0.488 for reviewers and 0.0000 for records .'] },
  { id: 'PR-11', file: 'engagement.html', claim: 'CL-001',
    target: 'Accuracy on the detection set is 83.9% across 16 independent experts and 384 graded reads, 95% confidence interval 72.7 to 95.1 , scored against a key fixed before any scoring took place under a pre-registered analysis plan.',
    replacement: 'Accuracy on the constructed 24-record detection set is 83.9% across 16 independent experts and 384 graded reads, 95% confidence interval 72.7 to 95.1, scored against a key fixed before any scoring took place under a pre-registered analysis plan.',
    reason: CONSTRUCTED_NOTE, resolves: null },
  { id: 'PR-12', file: 'check.html', claim: 'CL-004',
    target: '0.739 / 0.623 Gwet\'s AC1 in a separate reliability sample: invited / open-enrolment.',
    replacement: '0.739 / 0.623 Gwet\'s AC1 in a separate 10-record reliability sample: invited / open-enrolment.',
    reason: 'Adds the 10-record sample size the register records with the AC1 figures.',
    resolves: ['0.739 / 0.623 Gwet\'s AC1 in a separate reliability sample: invited / open-enrolment.', 'Separate reliability result: both AC1 point estimates exceeded the 0.61 floor, but the pre-registered two-part criterion was not met because neither lower confidence bound reached 0.41.'] },
  { id: 'PR-13', file: 'decision-reconstruction-risk.html', claim: 'CL-013',
    target: 'On 29 of those texts, a reader given only the summary answered 77% of masked factual questions correctly, against 97% from the original.',
    replacement: 'On 29 of those texts, an AI reader given only one model\'s concise summary answered 77% of masked factual questions correctly, against 97% from the original.',
    reason: 'The reader was a model, and only one model\'s summaries were tested (EV-CLAIM-RECONCILIATION, P-10). "A reader" reads as a person.', resolves: null },
  { id: 'PR-14', file: 'reviewer/index.html', claim: 'CL-001',
    target: '16 independent experts on the detection panel against a verified key, read blind.',
    replacement: '16 independent experts on the detection panel against a verified key, read blind, on a constructed 24-record corpus.',
    reason: CONSTRUCTED_NOTE, resolves: ['83.9%', '95% CI 72.7 to 95.1.'] },
  { id: 'PR-15', file: 'reviewer/index.html', claim: 'CL-005',
    target: 'Three AI vendors applying the same conditions to the same constructed record set.',
    replacement: 'Raw agreement among three AI vendors applying the same conditions to the same constructed record set; this is consistency, not accuracy.',
    reason: 'Adds the raw-agreement limitation: cross-model agreement is not accuracy, human reliability or independent validation.', resolves: ['66.7-93.3%'] },
  { id: 'PR-16', file: 'reviewer/index.html', claim: 'CL-006',
    target: 'Across 61 recorded runs, 12 June to 21 August 2026, the range was 66.7 to 93.3 percent, mean 85.3 percent, and 82.2 to 93.3 percent across 37 runs at the full 15-record set.',
    replacement: 'Across 61 recorded runs, 12 June to 21 August 2026, the raw agreement range was 66.7 to 93.3 percent, mean 85.3 percent, and 82.2 to 93.3 percent across 37 runs at the full 15-record set, as the series stood on 13 August 2026.',
    reason: 'Adds "raw agreement" and the 37-run window date (see PR-04). No figure changes.', resolves: null },
]);

// The findings a proposal resolves: its own target sentence unless it lists others.
export const resolvedBy = (r) => r.resolves || [r.target];

// Findings the scanner cannot reach (binary downloads), found by a one-off text extraction in the
// package session. Each is bound to the file's sha256, so a changed file reopens the finding.
export const MANUAL_FINDINGS = Object.freeze([
  { id: 'PD-01', file: 'JRS_Reliability_Accuracy.pdf', sha256: '64bb9f80dd9f914210a7eb52ebf6a3f42cd16faa0b885aa22140d7995632b2b8', claim: 'CL-033',
    served_as: 'research.html "Methods Paper · Reliability and Accuracy of JRS (Rungs 1 & 2)", through /api/dl?e=accuracy (api/dl.js: accuracy -> JRS_Reliability_Accuracy.pdf)',
    method: 'One-off pdftotext extraction during the package session; not part of the deterministic scan.',
    found: ['"Independent reviewers reached substantial agreement (Gwet\'s AC1 = 0.74 for experts, 0.63 for trained reviewers, across 10 records)."', '"Cross-vendor AI agreement averaged 84% across 15 constructed records."', '"The findings support reproducible application and substantial inter-rater reliability"'],
    proposal: 'Do not edit the draft\'s text silently. Either replace the download with a version carrying the 29 August 2026 manuscript results, or add a first-page notice, exactly: "Superseded, 6 October 2026. This draft describes AC1 of 0.74 and 0.63 as substantial agreement and cross-vendor agreement as averaging 84 percent. The 29 August 2026 manuscript reports that the pre-registered two-part reliability criterion was not met and no longer uses the verbal band; the cross-vendor series closed on 21 August 2026 across 61 recorded runs (raw agreement 66.7 to 93.3 percent, mean 85.3 percent), and its reproducibility criterion is not established because the required AC1 was not computed. This draft is kept as a historical record."',
    reason: 'A public download reports a superseded reliability characterisation and a reproducibility conclusion the current evidence does not support.' },
]);
