// JRS ADAPTIVE RELIABILITY: Synthetic Corpus Expansion admission check.
//
// A new synthetic fixture is admitted only with a complete provenance and
// purpose record, traced to a knowledge entry or a documented coverage gap.

export const ADMISSION_FIELDS = Object.freeze(['fixture_id', 'authoring_source', 'trigger', 'scope_classification', 'expected_condition_result',
  'expected_graph_structure', 'expected_limitation', 'expected_refusal', 'regression_purpose', 'mutation_relationship', 'independence_statement']);
export const INDEPENDENCE_STATEMENT = 'Synthetic engineering fixture. Not independent, real-world, or holdout material.';
const SCOPES = ['in_scope_supplier_access', 'excluded_domain', 'instruction_risk', 'version_or_identity_check', 'malformed_candidate'];

export function admitFixture(meta, { knowledgeIds = new Set(), coverageGaps = new Set(), existingIds = new Set() } = {}) {
  const p = [];
  for (const k of ADMISSION_FIELDS) if (meta[k] === undefined || meta[k] === '') p.push('missing ' + k);
  if (meta.fixture_id && !/^AR-\d{3}$/.test(meta.fixture_id)) p.push('fixture_id must look like AR-001');
  if (meta.fixture_id && existingIds.has(meta.fixture_id)) p.push('fixture_id not unique');
  if (meta.authoring_source !== undefined && meta.authoring_source !== 'synthetic_engineering') p.push('authoring_source must be synthetic_engineering');
  if (meta.trigger !== undefined && !(knowledgeIds.has(meta.trigger) || coverageGaps.has(meta.trigger))) p.push('trigger is not a knowledge entry or documented coverage gap: ' + meta.trigger);
  if (meta.scope_classification !== undefined && !SCOPES.includes(meta.scope_classification)) p.push('unknown scope_classification');
  if (meta.independence_statement !== undefined && meta.independence_statement !== INDEPENDENCE_STATEMENT) p.push('independence statement altered');
  if (meta.expected_refusal !== undefined && meta.scope_classification === 'excluded_domain' && meta.expected_refusal === 'none') p.push('excluded-domain fixture must expect a refusal');
  return p;
}
