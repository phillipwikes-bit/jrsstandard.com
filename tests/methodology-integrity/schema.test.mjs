// Schema: the record schema states exactly the permitted statuses and mapping types, the subset
// checker fails closed, and every committed record conforms.
import { t, done, SCHEMA, REGISTER, checker, validate, approvedFixture } from './_helpers.mjs';

const P = SCHEMA.properties;
t('statuses are exactly the six permitted', P.status.enum.join() === 'APPROVED_CORRESPONDENCE,UNMAPPED,PROPOSED_NOT_APPROVED,HISTORICAL_REFERENCE_ONLY,NOT_ASSESSED,RETIRED' && validate.STATUSES.join() === P.status.enum.join());
t('mapping types are exactly the five permitted', P.mapping_type.enum.join() === 'EXACT_LABEL,DOCUMENTED_ALIAS,IMPLEMENTATION_REFERENCE,DISPLAY_LABEL,NO_CORRESPONDENCE_ASSERTED' && validate.MAPPING_TYPES.join() === P.mapping_type.enum.join());
const REQUIRED = ['correspondence_id', 'methodology_source_id', 'methodology_source_sha256', 'authoritative_source_term', 'candidate_term', 'term_category', 'term_location', 'mapping_type', 'status', 'evidence_basis', 'source_reference', 'limitation', 'proposal', 'owner_approval', 'change_history'];
t('every required field is required, and nothing else is accepted', REQUIRED.every((k) => SCHEMA.required.includes(k)) && SCHEMA.required.length === REQUIRED.length && SCHEMA.additionalProperties === false);
t('owner approval carries approved, approver, date and reference', P.owner_approval.required.join() === 'approved,approver,approval_date,approval_reference');

const check = (v) => checker.checkSchema(SCHEMA, v, 'r');
t('the approved fixture conforms to the schema', check(approvedFixture()).length === 0);
const mut = (f) => { const r = approvedFixture(); f(r); return check(r); };
t('refused: an unknown status', mut((r) => { r.status = 'APPROVED'; }).length > 0);
t('refused: an unknown mapping type', mut((r) => { r.mapping_type = 'SEMANTIC'; }).length > 0);
t('refused: a malformed source hash', mut((r) => { r.methodology_source_sha256 = 'abc'; }).length > 0);
t('refused: a missing field', mut((r) => { delete r.limitation; }).length > 0);
t('refused: an extra field', mut((r) => { r.equivalent_to = 'Basis Identification'; }).length > 0);
t('refused: an empty change history', mut((r) => { r.change_history = []; }).length > 0);
t('refused: a malformed approval date', mut((r) => { r.owner_approval.approval_date = '6 Oct 2026'; }).length > 0);
t('the checker fails closed on a keyword it does not enforce', checker.checkSchema({ type: 'string', format: 'date' }, 'x').some((p) => /not supported/.test(p)));
t('the checker refuses additionalProperties other than false', checker.checkSchema({ type: 'object', additionalProperties: true }, {}).length > 0);
t('every committed record conforms to the schema', REGISTER.records.every((r) => check(r).length === 0), REGISTER.records.filter((r) => check(r).length).map((r) => r.correspondence_id).join(','));
done();
