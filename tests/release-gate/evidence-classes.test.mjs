// Evidence-classification boundaries. Each check injects one mislabelled or misused evidence item
// into an otherwise passing synthetic fixture and requires the validator to refuse it.
import { t, done, V, validateRecord, passingFixture, clone, supportWith, rejects } from './_helpers.mjs';

const fx = () => clone(passingFixture());
t('baseline: the synthetic fixture passes', validateRecord(fx()).valid);

// Required by the work package.
t('a mocked test cannot satisfy independent labeling', rejects(supportWith(fx(), 'RG-1.2', 'MOCKED_TEST', 'test_output'), /MOCKED_TEST, which cannot satisfy "Independent labeling/));
t('a mocked test relabelled as independent provenance is refused', rejects(supportWith(fx(), 'RG-1.2', 'MOCKED_TEST', 'test_output', 'independent'), /MOCKED_TEST must have provenance mocked/));
t('a source-reported item cannot satisfy live-execution evidence', rejects(supportWith(fx(), 'RG-1.4', 'SOURCE_REPORTED', 'source_report'), /SOURCE_REPORTED, which cannot satisfy "Named Engine version run on the holdout"/));
t('a source-reported item cannot satisfy live-operation verification', rejects(supportWith(fx(), 'RG-2.7', 'SOURCE_REPORTED', 'source_report'), /SOURCE_REPORTED, which cannot satisfy/));
t('a written policy cannot satisfy operator-control execution (as local review)', rejects(supportWith(fx(), 'RG-2.3', 'LOCAL_CODE_REVIEW', 'policy_document'), /LOCAL_CODE_REVIEW, which cannot satisfy "Retention execution"/));
t('a written policy cannot be classed as operator-control evidence', rejects(supportWith(fx(), 'RG-2.3', 'OPERATOR_CONTROL_EVIDENCE', 'policy_document'), /OPERATOR_CONTROL_EVIDENCE cannot be a policy_document: a written policy or documentation statement is not evidence that a control executed/));
t('a documentation statement cannot be classed as operator-control evidence', rejects(supportWith(fx(), 'RG-2.1', 'OPERATOR_CONTROL_EVIDENCE', 'documentation_statement'), /not evidence that a control executed/));
t('an operator record of the wrong kind cannot satisfy a different control', rejects(supportWith(fx(), 'RG-2.4', 'OPERATOR_CONTROL_EVIDENCE', 'rotation_record'), /rotation_record, which cannot satisfy "Backup restoration"/));
t('an owner authorization cannot satisfy counsel review', rejects(supportWith(fx(), 'RG-3.1', 'OWNER_AUTHORIZATION', 'signed_authorization'), /OWNER_AUTHORIZATION, which cannot satisfy "Actual data flows"/));
t('an owner authorization cannot satisfy independent QA', rejects(supportWith(fx(), 'RG-5.1', 'OWNER_AUTHORIZATION', 'signed_authorization'), /OWNER_AUTHORIZATION, which cannot satisfy "Independent QA/));
t('a local test cannot satisfy production QA', rejects(supportWith(fx(), 'RG-5.1', 'LOCAL_CODE_REVIEW', 'test_output'), /LOCAL_CODE_REVIEW, which cannot satisfy/));
t('a local test cannot satisfy live-operation verification', rejects(supportWith(fx(), 'RG-2.7', 'LOCAL_CODE_REVIEW', 'test_output'), /LOCAL_CODE_REVIEW, which cannot satisfy/));
t('a smoke test cannot prove production operation', rejects(supportWith(fx(), 'RG-2.7', 'LIVE_EXECUTION', 'smoke_test_response'), /a smoke test is not evidence of production operation/));
t('a smoke test (a GET response) cannot satisfy the holdout run', rejects(supportWith(fx(), 'RG-1.4', 'LIVE_EXECUTION', 'smoke_test_response'), /a smoke test is not evidence of production operation/));
t('live execution cannot satisfy independent production QA', rejects(supportWith(fx(), 'RG-5.1', 'LIVE_EXECUTION', 'execution_log'), /LIVE_EXECUTION, which cannot satisfy/));
t('counsel review cannot satisfy an operator control', rejects(supportWith(fx(), 'RG-2.2', 'COUNSEL_REVIEW', 'counsel_memo'), /COUNSEL_REVIEW, which cannot satisfy "Credential rotation"/));
t('independent QA cannot satisfy independent labeling', rejects(supportWith(fx(), 'RG-1.2', 'INDEPENDENT_QA', 'qa_report'), /INDEPENDENT_QA, which cannot satisfy/));
t('an unknown evidence class is refused', rejects(supportWith(fx(), 'RG-1.2', 'PEER_ENDORSEMENT', 'labeling_dataset', 'independent'), /is not one of/));
t('a constructed fixture relabelled as live is refused', rejects(supportWith(fx(), 'RG-2.6', 'CONSTRUCTED_FIXTURE', 'constructed_dataset', 'live'), /CONSTRUCTED_FIXTURE must have provenance constructed/));

// Vocabulary invariants.
const nonProd = ['CONSTRUCTED_FIXTURE', 'MOCKED_TEST', 'LOCAL_CODE_REVIEW', 'SOURCE_REPORTED'];
t('the minimum ten classes exist', ['CONSTRUCTED_FIXTURE', 'MOCKED_TEST', 'LOCAL_CODE_REVIEW', 'SOURCE_REPORTED', 'LIVE_EXECUTION', 'INDEPENDENT_LABELING', 'INDEPENDENT_QA', 'COUNSEL_REVIEW', 'OWNER_AUTHORIZATION', 'OPERATOR_CONTROL_EVIDENCE'].every((c) => V.EVIDENCE_CLASSES[c]));
t('constructed, mocked, local and source-reported classes can never pass a gate', nonProd.every((c) => !V.EVIDENCE_CLASSES[c].production_evidence));
t('no sub-control can be satisfied by a non-production class', V.GATES.every((g) => g.sub_controls.every((s) => s.satisfied_by.every((c) => !nonProd.includes(c)))));
t('no sub-control accepts a policy, documentation statement or smoke test', V.GATES.every((g) => g.sub_controls.every((s) => !s.kinds.some((k) => ['policy_document', 'documentation_statement', 'smoke_test_response', 'test_output', 'constructed_dataset', 'source_report'].includes(k)))));
t('only OWNER_AUTHORIZATION satisfies the owner gate, and it satisfies nothing else', V.GATES.every((g) => g.sub_controls.every((s) => (g.id === 'RG-4') === s.satisfied_by.includes('OWNER_AUTHORIZATION'))));
t('only COUNSEL_REVIEW satisfies counsel review', V.GATES.find((g) => g.id === 'RG-3').sub_controls.every((s) => s.satisfied_by.join() === 'COUNSEL_REVIEW'));
t('only INDEPENDENT_QA satisfies production QA', V.GATES.find((g) => g.id === 'RG-5').sub_controls.every((s) => s.satisfied_by.join() === 'INDEPENDENT_QA'));

done();
