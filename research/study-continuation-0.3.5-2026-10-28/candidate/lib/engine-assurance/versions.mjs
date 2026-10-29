// JRS ENGINE ASSURANCE: version labels the local assurance package recognises.
//
// A label outside these lists is refused, never coerced. Adding a label here is
// a versioned change and must be recorded in
// research/engine-assurance-2026-10-10/CHANGELOG.md with its regression evidence.

import { ENGINE_VERSION } from './candidate-core.mjs';
import { MANIFEST_VERSION } from '../manifest/build.js';

export const ASSURANCE_LAYER_VERSION = '0.1.0-local';
export const ENVELOPE_SCHEMA_VERSION = 'jrs-review-run-envelope/0.1.0';
export const FIXTURE_FORMAT_VERSION = 'jrs-assurance-fixture/0.1.0';
export const EXPECTED_FORMAT_VERSION = 'jrs-assurance-expected/0.1.0';

export const SUPPORTED_VERSIONS = Object.freeze({
  engine_version: Object.freeze([ENGINE_VERSION]),
  codebook_version: Object.freeze(['1.0']),
  jrs_version: Object.freeze(['1.0']),
  schema_version: Object.freeze([ENVELOPE_SCHEMA_VERSION]),
  manifest_version: Object.freeze([MANIFEST_VERSION]),
});

// The condition identifiers are the Engine's own keys. The Engine-to-Codebook
// mapping is NOT ESTABLISHED (standard/jrs-conditions.json, D-2/D-3), so these
// are never relabelled as Codebook conditions RC1-RC5.
export const CONDITION_VOCABULARY = 'review_engine_keys';

export const RELEASE_STATUS = 'NO_GO_NOT_VERIFIED';
