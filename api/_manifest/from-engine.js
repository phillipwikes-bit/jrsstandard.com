// Adapter for the current v1 Engine response. It preserves the Engine's
// vocabulary and routing; it never supplies a Codebook mapping.
import { buildManifest, ENGINE_CONDITION_KEYS } from './build.js';

const STATUS = new Set(['pass', 'review', 'gap']);
const ROUTES = new Set(['ready', 'review_required', 'gap_identified']);

export async function manifestFromEngineResponse(response, submittedText, options = {}) {
  if (typeof submittedText !== 'string' || submittedText.trim().length < 40) {
    throw new Error('adapter_refused: submitted text must be a string of at least 40 characters');
  }
  if (!response || typeof response !== 'object' || Array.isArray(response)
      || typeof response.request_id !== 'string' || !response.request_id
      || response.api_version !== 'v1' || response.engine !== 'JRS Review Engine'
      || typeof response.engine_version !== 'string' || !response.engine_version
      || typeof response.model !== 'string' || !response.model) {
    throw new Error('adapter_refused: incomplete or unsupported Engine response metadata');
  }
  const result = response.result;
  if (!result || !result.conditions || typeof result.conditions !== 'object'
      || Array.isArray(result.conditions)) {
    throw new Error('adapter_refused: conditions are missing');
  }
  const actual = Object.keys(result.conditions);
  if (actual.length !== ENGINE_CONDITION_KEYS.length
      || actual.some((key) => !ENGINE_CONDITION_KEYS.includes(key))) {
    throw new Error('adapter_refused: unexpected or missing Engine condition keys');
  }
  for (const key of ENGINE_CONDITION_KEYS) {
    const entry = result.conditions[key];
    if (!entry || !STATUS.has(entry.status) || typeof entry.note !== 'string') {
      throw new Error('adapter_refused: invalid condition ' + key);
    }
  }
  if (!ROUTES.has(result.determination)) {
    throw new Error('adapter_refused: unsupported Engine determination');
  }
  const statuses = ENGINE_CONDITION_KEYS.map((key) => result.conditions[key].status);
  const expectedRoute = statuses.includes('gap') ? 'gap_identified'
    : statuses.includes('review') ? 'review_required' : 'ready';
  if (result.determination !== expectedRoute) {
    throw new Error('adapter_refused: determination conflicts with conditions');
  }
  if (!Number.isInteger(response.runs) || response.runs < 1 || response.runs > 5) {
    throw new Error('adapter_refused: invalid run count');
  }
  if (options.conditionVocabulary && options.conditionVocabulary !== 'review_engine_keys') {
    throw new Error('adapter_refused: Codebook mapping is not approved');
  }
  // The v1 handler trims before it truncates. Hash exactly that source string.
  // The original submitted file remains under the caller's control.
  const sourceText = submittedText.trim();
  const warnings = sourceText.length > 8000
    ? [{ code: 'input_truncated', message: 'Only the first 8000 characters were evaluated.' }]
    : [];
  const manifest = await buildManifest({
    engineResult: response,
    sourceText,
    jrsVersion: options.jrsVersion || '1.0',
    codebookVersion: options.codebookVersion || '1.0',
    engine: {
      name: response.engine, version: response.engine_version,
      model: response.model, api_version: response.api_version,
    },
    context: options.context,
    conditionVocabulary: 'review_engine_keys',
    routingVocabulary: 'engine_determination',
    warnings,
    manifestId: options.manifestId,
    createdAt: options.createdAt,
  });
  return { request_id: response.request_id, manifest };
}
