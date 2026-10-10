// Schema: required fields, the permitted statuses and Engine relationships, the conditional
// SUPPORTED_WITH_LIMITATION requirements, and a checker that fails closed.
import { t, done, build, checker, claim, REGISTER } from './_helpers.mjs';

const S = build.SCHEMA, P = S.properties;
const check = (v) => checker.checkSchema(S, v, 'c');
t('statuses are exactly the seven permitted', P.status.enum.join() === 'SUPPORTED_WITH_LIMITATION,HISTORICAL_ONLY,SOURCE_REPORTED_NOT_REPRODUCED,NOT_SUPPORTED,NOT_ASSESSED,REQUIRES_WORDING_REPAIR,RETIRED');
t('Engine relationships are exactly the four permitted', P.engine_relationship.enum.join() === 'NO_ENGINE_INFERENCE,ENGINE_DEVELOPMENT_ONLY,ENGINE_EVIDENCE_SEPARATE,NOT_APPLICABLE');
const REQUIRED = ['claim_id', 'claim_text', 'claim_topic', 'claim_type', 'surface', 'evidence_id', 'source_path', 'source_location', 'source_hash', 'evidence_class', 'population', 'quantities', 'date_or_data_lock', 'limitation', 'permitted_wording', 'prohibited_overstatement', 'status', 'engine_relationship', 'review_history'];
t('every field the package requires is required by the schema', REQUIRED.every((k) => S.required.includes(k)) && S.additionalProperties === false);
t('every committed claim conforms to the schema', REGISTER.claims.every((c) => check(c).length === 0), REGISTER.claims.filter((c) => check(c).length).map((c) => c.claim_id + ' ' + check(c)[0]).join(' | '));

const sup = () => claim('CL-001');
const refused = (f) => { const c = sup(); f(c); return check(c).length > 0; };
t('a complete SUPPORTED_WITH_LIMITATION claim conforms', check(sup()).length === 0);
t('refused: SUPPORTED_WITH_LIMITATION without a source reference', refused((c) => { c.source_path = null; }));
t('refused: SUPPORTED_WITH_LIMITATION without a source hash', refused((c) => { c.source_hash = null; }));
t('refused: SUPPORTED_WITH_LIMITATION without a limitation', refused((c) => { c.limitation = 'short'; }));
t('refused: SUPPORTED_WITH_LIMITATION with evidence class NONE', refused((c) => { c.evidence_class = 'NONE'; }));
t('refused: SUPPORTED_WITH_LIMITATION without scope (date or data lock)', refused((c) => { c.date_or_data_lock = null; }));
t('refused: a numerical claim without a population', refused((c) => { c.population = null; }));
t('refused: a numerical claim without quantities', refused((c) => { c.quantities = null; }));
t('refused: a required denominator left empty', refused((c) => { c.quantities.denominator = null; }));
t('refused: an unknown status', refused((c) => { c.status = 'VALIDATED'; }));
t('refused: an unknown Engine relationship', refused((c) => { c.engine_relationship = 'ENGINE_VALIDATED'; }));
t('refused: an extra field', refused((c) => { c.marketing_copy = 'x'; }));
t('a NOT_SUPPORTED claim may carry no source (it states what must not be said)', check(claim('CL-026')).length === 0 && claim('CL-026').source_path === null);
t('the checker fails closed on a keyword it does not enforce', checker.checkSchema({ type: 'string', format: 'date' }, 'x').some((p) => /not supported/.test(p)));
t('the checker applies if/then', checker.checkSchema({ type: 'object', if: { properties: { a: { const: 1 } } }, then: { required: ['b'] } }, { a: 1 }).length === 1 && checker.checkSchema({ type: 'object', if: { properties: { a: { const: 1 } } }, then: { required: ['b'] } }, { a: 2 }).length === 0);
done();
