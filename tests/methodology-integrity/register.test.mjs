// Register integrity, completeness against the live modules, the required distinctions, and
// documentation drift (the committed registers, Markdown and workspace snapshot equal a fresh build).
import { t, done, ROOT, REGISTER, SOURCE_REGISTER, ctx, build, validate, read, exists } from './_helpers.mjs';

const fresh = build.buildAll(ROOT);
t('a fresh build has no problems', fresh.problems.length === 0, fresh.problems.slice(0, 4).join(' | '));
const stale = Object.entries(fresh.out).filter(([p, text]) => !exists(p) || read(p) !== text).map(([p]) => p);
t('documentation drift: committed registers, Markdown and workspace snapshot equal a fresh build', stale.length === 0, stale.join(', '));
const committed = validate.validateRegister(REGISTER, ctx);
t('the committed register passes every register rule', committed.length === 0, committed.slice(0, 4).join(' | '));
t('the committed register names the current source register', REGISTER.source_register_digest === fresh.register.source_register_digest);
t('the status summary is the count of the records', JSON.stringify(REGISTER.status_summary) === JSON.stringify(validate.statusSummary(REGISTER.records)) && REGISTER.record_count === REGISTER.records.length);

// ---- what this package must not create ---------------------------------------------------------
t('no record is APPROVED_CORRESPONDENCE', REGISTER.records.every((r) => r.status !== 'APPROVED_CORRESPONDENCE'));
t('no record carries an owner approval or approval date', REGISTER.records.every((r) => r.owner_approval.approved === false && r.owner_approval.approval_date === null && r.owner_approval.approver === null));
t('no record uses EXACT_LABEL or DOCUMENTED_ALIAS', REGISTER.records.every((r) => !['EXACT_LABEL', 'DOCUMENTED_ALIAS'].includes(r.mapping_type)));
t('the workspace snapshot carries no approved correspondence', /APPROVED_CORRESPONDENCE = Object\.freeze\(\[\]\)/.test(read('tools/local-reviewer-workspace/app/correspondence.js')));

// ---- sources -------------------------------------------------------------------------------------
const src = (id) => SOURCE_REGISTER.sources.find((s) => s.id === id);
t('every source has a path, version, hash, classification, status and limitations', SOURCE_REGISTER.sources.every((s) => s.path && s.version && /^[0-9a-f]{64}$/.test(s.sha256) && s.classification && s.status && s.limitations.length));
t('the canonical Codebook is codebook.html, established by its own statement and D-3, not by filename', src('SRC-CODEBOOK').status === 'CANONICAL' && /D-3/.test(src('SRC-CODEBOOK').evidence) && /authoritative/.test(src('SRC-CODEBOOK').evidence));
t('the derived conditions file is not canonical', src('SRC-CONDITIONS-JSON').status === 'DRAFT');
t('the Standard page and the Manifest schema are not assessed, not canonical', src('SRC-STANDARD-HTML').status === 'NOT_ASSESSED' && src('SRC-MANIFEST-SCHEMA').status === 'NOT_ASSESSED');
t('the aggregate-condition difference between the PDF and the Codebook is recorded, not resolved', src('SRC-STANDARD-PDF').limitations.some((l) => /aggregate/.test(l) && /does not resolve/.test(l)));

// ---- completeness against the live modules -------------------------------------------------------
const E = await import(ROOT + 'lib/engine-candidate/explanations.js');
const W = await import(ROOT + 'tools/local-reviewer-workspace/app/core.js');
const M = JSON.parse(read('schemas/jrs-decision-reconstruction-manifest.schema.json'));
const recordsJs = await import(ROOT + 'tools/methodology-integrity/lib/records.js');
const explText = read('lib/engine-candidate/explanations.js');
const extraction = [...explText.slice(explText.indexOf('const EXTRACTION = {')).split('\n};')[0].matchAll(/^\s+([a-z_]+): \[/gm)].map((m) => m[1]);
const vocab = {
  CANDIDATE_KEY: Object.keys(E.CONDITION_CATEGORY),
  CANDIDATE_EXPLANATION_CATEGORY: Object.keys(E.CATEGORIES),
  CANDIDATE_FLAW_TYPE: Object.keys(E.FLAW_CATEGORY),
  SOURCE_PREP_CHECK: extraction.filter((c) => !recordsJs.MODEL_OUTPUT_CODES.includes(c)),
  MODEL_OUTPUT_CHECK: extraction.filter((c) => recordsJs.MODEL_OUTPUT_CODES.includes(c)),
  WORKSPACE_DISPOSITION: [...W.DISPOSITIONS],
  JRS_CONDITION: SOURCE_REGISTER.condition_names,
};
const gaps = validate.completeness(REGISTER, vocab);
t('every live candidate key, category, finding type, check, disposition and condition has a current record', gaps.length === 0, gaps.join(' | '));
t('every workspace section title has a record', Object.values(W.SECTIONS).every((s) => REGISTER.records.some((r) => r.term_category === 'WORKSPACE_LABEL' && r.candidate_term === s)));
t('every Manifest condition_vocabulary and routing vocabulary value has a record', M.properties.condition_vocabulary.enum.concat(M.properties.routing.properties.vocabulary.enum).every((v) => REGISTER.records.some((r) => r.term_category === 'MANIFEST_VALUE' && r.candidate_term === v)));
t('every Manifest condition status value has a record', M.properties.conditions.additionalProperties.properties.status.enum.every((v) => REGISTER.records.some((r) => r.term_category === 'MANIFEST_VALUE' && r.candidate_term === v)));
t('every record names a term location that exists, and the term appears there (text files)', REGISTER.records.every((r) => exists(r.term_location.path) && (/\.pdf$/.test(r.term_location.path) || r.term_category === 'RESEARCH_TERM' || r.term_category === 'HISTORICAL_ENGINE_KEY' || r.status === 'RETIRED' || read(r.term_location.path).includes(r.candidate_term))),
  REGISTER.records.filter((r) => !(/\.pdf$/.test(r.term_location.path) || ['RESEARCH_TERM', 'HISTORICAL_ENGINE_KEY'].includes(r.term_category) || r.status === 'RETIRED') && !read(r.term_location.path).includes(r.candidate_term)).map((r) => r.correspondence_id).join(','));

// ---- the distinctions the register must preserve --------------------------------------------------
const cur = (cat, term) => REGISTER.records.filter((r) => r.term_category === cat && r.candidate_term === term && !validate.NOT_CURRENT.includes(r.status));
const crc = cur('CANDIDATE_KEY', 'cold_reviewer_clarity');
t('cold_reviewer_clarity is UNMAPPED under D-2 and not a JRS condition', crc.length === 1 && crc[0].status === 'UNMAPPED' && /D-2/.test(crc[0].evidence_basis) && /Not a JRS condition/.test(crc[0].limitation));
const as = cur('CANDIDATE_KEY', 'accountability_support');
t('accountability_support is UNMAPPED and not Evidentiary Sufficiency', as.length === 1 && as[0].status === 'UNMAPPED' && as[0].authoritative_source_term === null && /Not Evidentiary Sufficiency/.test(as[0].limitation));
t('no record pairs accountability_support with Evidentiary Sufficiency as its source or proposed term', REGISTER.records.filter((r) => r.candidate_term === 'accountability_support').every((r) => r.authoritative_source_term !== 'Evidentiary Sufficiency' && !(r.proposal && r.proposal.proposed_source_term === 'Evidentiary Sufficiency')));
t('the candidate\'s explicitly unmapped keys are UNMAPPED in the register and have no category', E.EXPLICITLY_UNMAPPED_KEYS.every((k) => cur('CANDIDATE_KEY', k)[0].status === 'UNMAPPED' && E.CONDITION_CATEGORY[k] === null));
t('the candidate still declares no Codebook correspondence', E.CODEBOOK_CORRESPONDENCE === 'not_asserted' && E.CODEBOOK_CORRESPONDENCE_RECORD === null);
t('candidate prompts are not Codebook mappings: every candidate key record is unmapped or a proposal only', vocab.CANDIDATE_KEY.every((k) => ['UNMAPPED', 'PROPOSED_NOT_APPROVED'].includes(cur('CANDIDATE_KEY', k)[0].status) && cur('CANDIDATE_KEY', k)[0].mapping_type === 'NO_CORRESPONDENCE_ASSERTED'));
t('proposals cite their basis and say they are not approved', REGISTER.records.filter((r) => r.status === 'PROPOSED_NOT_APPROVED').every((r) => /BD-04|D-3/.test(r.proposal.reference) && /never approved/.test(r.proposal.note)));
t('source-prep checks are deterministic input controls, not JRS determinations', REGISTER.records.filter((r) => r.term_category === 'SOURCE_PREP_CHECK').every((r) => /deterministic input control/.test(r.limitation) && /not a contextual JRS determination/.test(r.limitation)));
t('Manifest fields are not methodology terms', REGISTER.records.filter((r) => r.term_category === 'MANIFEST_FIELD').every((r) => /not a methodology term|not a correspondence/.test(r.limitation) && r.status !== 'APPROVED_CORRESPONDENCE'));
t('research terms are not Engine vocabulary', REGISTER.records.filter((r) => r.term_category === 'RESEARCH_TERM' && r.status === 'NOT_ASSESSED').every((r) => /not Engine vocabulary|not the Engine candidate/i.test(r.limitation)));
t('the five conditions are NOT_ASSESSED with no correspondence asserted', REGISTER.records.filter((r) => r.term_category === 'JRS_CONDITION').length === 5 && REGISTER.records.filter((r) => r.term_category === 'JRS_CONDITION').every((r) => r.status === 'NOT_ASSESSED' && r.mapping_type === 'NO_CORRESPONDENCE_ASSERTED'));
t('the retired assignment records its retirement', REGISTER.records.some((r) => r.status === 'RETIRED' && r.candidate_term === 'accountability_support' && r.change_history.length >= 2));
done();
