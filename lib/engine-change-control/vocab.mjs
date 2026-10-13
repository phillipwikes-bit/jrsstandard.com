// JRS ADAPTIVE RELIABILITY 0.4.0-local: shared vocabulary for change control.
//
// The system records knowledge and prepares proposals. It never applies a change,
// never authorises one, and never states that a change is safe. Every value a
// proposal could use to look approved is excluded here, not filtered later.

export const CHANGE_CONTROL_VERSION = '0.4.1-local-change-control';
export const BASELINE_ENGINE = Object.freeze({ engine_version: '0.3.0-local', contract_version: 'jrs-engine-local-0.3.0-evidence-graph', graph_version: 'jrs-evidence-graph/0.3.0' });

export const SOURCE_TYPES = Object.freeze(['synthetic_fixture', 'mutation_test', 'regression_test', 'workbench_review', 'version_comparison',
  'local_design_review', 'documented_requirement_change']);
export const KB_STATUSES = Object.freeze(['observed', 'under_analysis', 'proposed_control', 'implemented_locally', 'regression_protected',
  'rejected', 'superseded', 'blocked']);
export const FAILURE_CLASSES = Object.freeze(['quote_verification', 'graph_integrity', 'chronology_conflict', 'scope_refusal', 'contradiction_handling',
  'cognitive_controls_neutrality', 'version_mismatch', 'test_contamination', 'prohibited_claim_detection']);
export const EVIDENCE_LEVELS = Object.freeze(['local_synthetic_observation', 'local_mutation_result', 'local_regression_result', 'local_design_analysis',
  'documented_requirement']);
export const CONDITIONS = Object.freeze(['reconstructability', 'identifiable_basis', 'chronology_integrity', 'reasoning_traceability', 'sufficiency']);

// Words no knowledge entry, proposal or console page may carry as a status or claim.
export const FORBIDDEN_STATUS_WORDS = Object.freeze(['validated', 'approved', 'production_ready', 'production ready', 'production-ready',
  'release_ready', 'release ready', 'release-ready', 'commercial_ready', 'commercial ready', 'commercial-ready', 'independently_verified',
  'independently verified']);
const FORBIDDEN_RE = new RegExp('(?<![A-Za-z0-9])(?:' + FORBIDDEN_STATUS_WORDS.map((w) => w.replace(/[-_ ]/g, '[-_ ]')).join('|') + ')(?![A-Za-z0-9])', 'i');
export function findForbiddenWord(text) { const m = FORBIDDEN_RE.exec(String(text == null ? '' : text)); return m ? m[0] : null; }

export const CHANGE_TYPES = Object.freeze(['new_synthetic_fixture', 'new_regression_test', 'new_mutation_test', 'new_refusal_pattern',
  'new_graph_validation_rule', 'new_quote_resolution_rule', 'new_cognitive_control_template', 'prompt_contract_revision_proposal',
  'codebook_mapping_proposal', 'documentation_correction', 'deferred_architecture_item']);
// Change types that alter what the Engine does. They need a test plan, rollback and a new version identity.
export const BEHAVIOURAL_CHANGE_TYPES = Object.freeze(['new_refusal_pattern', 'new_graph_validation_rule', 'new_quote_resolution_rule',
  'new_cognitive_control_template', 'prompt_contract_revision_proposal', 'codebook_mapping_proposal']);

export const COMPONENTS = Object.freeze({
  quote_resolution: 'lib/engine-evidence-graph/quote-resolution.mjs', assertions: 'lib/engine-evidence-graph/assertions.mjs',
  contradictions: 'lib/engine-evidence-graph/contradictions.mjs', conditions: 'lib/engine-evidence-graph/conditions.mjs',
  controls: 'lib/engine-evidence-graph/controls.mjs', scope: 'lib/engine-evidence-graph/scope.mjs', response: 'lib/engine-evidence-graph/response.mjs',
  compiler: 'lib/engine-evidence-graph/compiler.mjs', graph_validate: 'lib/engine-evidence-graph/graph-validate.mjs',
  prompt_contract: 'research/evidence-graph-compiler-2026-10-10/prompt-contract/PROMPT_v0.3.0.txt', codebook_mapping: 'lib/engine-evidence-graph/contract.mjs',
  evaluation_factory: 'lib/engine-evidence-graph/evaluation/factory.mjs', fixtures: 'research/evidence-graph-compiler-2026-10-10/fixtures',
  tests: 'tests/engine-evidence-graph', documentation: 'research/evidence-graph-compiler-2026-10-10',
});

export const IMPACT_CLASSES = Object.freeze(['no_behavioral_change', 'local_behavioral_change', 'scope_boundary_change', 'evidence_standard_change',
  'release_control_change', 'not_assessed']);
export const AUTHORIZATION_STATES = Object.freeze(['awaiting_human_review', 'blocked_missing_observed_change', 'blocked_pending_human_disposition', 'rejected_by_compiler']);

// Paths a local proposal may never target. Compared against normalised paths only (see normalizeTarget).
export const PROTECTED_TARGETS = Object.freeze([/^api(?:\/|$)/, /^[^/]+\.html$/, /^vercel\.json$/, /^openapi\.json$/, /^sitemap\.xml$/, /^\.vercelignore$/,
  /^wrangler/, /^supabase(?:\/|$)/, /^\.github(?:\/|$)/, /^\.jrs(?:\/|$)/, /^docs(?:\/|$)/, /^\.env/, /^lib\/manifest(?:\/|$)/, /^tools(?:\/|$)/,
  /^research\/engine-assurance-2026-10-10(?:\/|$)/, /^research\/engine-evidence-contract-2026-10-10(?:\/|$)/, /^research\/MASTER_TRACKER\.md$/, /^package(?:-lock)?\.json$/]);
// The permitted local change-control workspace: a normalised target must start with one of these.
export const PERMITTED_TARGET_ROOTS = Object.freeze(['lib/engine-evidence-graph/', 'lib/engine-change-control/', 'research/evidence-graph-compiler-2026-10-10/',
  'research/adaptive-reliability-2026-10-13/', 'tests/engine-adaptive-reliability/', 'tests/engine-evidence-graph/']);
// A target under one of these makes a proposal behavioural whatever its declared type.
export const ENGINE_TARGET_ROOTS = Object.freeze(['lib/engine-evidence-graph/', 'research/evidence-graph-compiler-2026-10-10/prompt-contract/']);
// Release-gate surfaces: proposals touching them are refused.
export const RELEASE_TARGETS = Object.freeze([/^lib\/engine-evidence-graph\/evaluation\//, /^research\/evidence-graph-compiler-2026-10-10\/sealed-evaluation-factory\//,
  /^lib\/engine-change-control\/gate-simulator\.mjs$/, /^research\/adaptive-reliability-2026-10-13\/gate-simulator\//]);
export const RELEASE_ADVANCEMENT = /\b(?:advance|promote|move|set|mark|change|switch|upgrade|lift|clear|open|pass)\w*\b[^.;]{0,60}\b(?:release gate|gate result|registry status|EVAL-[A-Z]+-\d+|NO_GO\w*|go[- ]live|production status|release status|authori[sz]ed status|not_authorized_to_execute)\b/i;

export const REGULATED_DOMAINS = Object.freeze(['employment', 'hiring', 'promotion', 'discipline', 'termination', 'housing', 'lending', 'insurance',
  'medical', 'legal_outcome', 'other_consequential']);


// Controlled claim terms. Each must be qualified by an immediately preceding negation
// ("not validated", "not independently verified", "not authorized for release", "not production-ready").
export const CLAIM_TERMS = Object.freeze(['validated', 'validation', 'independent', 'independently', 'verified', 'certified', 'certification', 'authorized', 'authorised',
  'production-ready', 'release-ready', 'license-ready', 'licence-ready', 'sale-ready', 'compliant', 'compliance', 'guaranteed', 'guarantee', 'accurate', 'accuracy', 'adjudicated']);
const CLAIM_RE = new RegExp('(?<![A-Za-z0-9_-])(?:' + CLAIM_TERMS.map((t) => t.replace(/-/g, '[- _]?')).join('|') + ')(?![A-Za-z0-9_-])', 'gi');
const QUALIFIER = /^(?:not|no|never|nor|without|un|non)$/i;
const BRIDGE = /^(?:yet|independently|been|be|being|is|are|was|were|has|have|a|an|the|for|as)$/i;
// Returns the first unqualified match, or null. A match is qualified only when a negation appears
// immediately before it, optionally bridged by up to two auxiliaries ("has not been validated").
function firstUnqualified(text, source) {
  const re = new RegExp(source.source, 'gi'); const s = String(text == null ? '' : text); let m;
  while ((m = re.exec(s)) !== null) {
    let pre = s.slice(0, m.index); const cut = Math.max(pre.lastIndexOf('. '), pre.lastIndexOf('; '), pre.lastIndexOf(': '), pre.lastIndexOf(', '), pre.lastIndexOf('\n')); if (cut !== -1) pre = pre.slice(cut + 1);
    const words = pre.trim().split(/\s+/).filter(Boolean).map((w) => w.replace(/[^A-Za-z-]/g, ''));
    let i = words.length - 1, qualified = false;
    for (let k = 0; k < 3 && i >= 0; k++, i--) { if (QUALIFIER.test(words[i])) { qualified = true; break; } if (!BRIDGE.test(words[i])) break; }
    if (!qualified) return m[0];
  }
  return null;
}
export const findUnqualifiedClaim = (text) => firstUnqualified(text, CLAIM_RE);
// Status words in proposal free text, with the same qualification ("not approved" is allowed there).
export const findUnqualifiedStatusWord = (text) => firstUnqualified(text, FORBIDDEN_RE);

export const SAFETY_STATEMENT = 'This output identifies required evidence before a human decision. It does not decide that a change is safe, correct, or authorised.';
export const GATE_STATEMENT = 'Presence of a local artifact does not satisfy an external release gate.';
