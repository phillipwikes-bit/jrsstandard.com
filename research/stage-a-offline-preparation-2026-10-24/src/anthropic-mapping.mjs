// Offline Anthropic Messages response mapping for the Stage A feasibility harness.
//
// Maps one captured provider response (an injected fixture object) into the adapter
// envelope consumed by the tested adapter boundary (harness v2, adapter 0.2.0). It
// contains no network transport, endpoint, credential access, SDK initialization or
// request code. It never touches the frozen Engine or its graph.
//
// Fixture shape (a captured response as a future live transport would store it):
//   { provider_request_id: '<response request identifier>',
//     body: { id, type: 'message', role: 'assistant', model, content: [ { type: 'text', text } ],
//             stop_reason, stop_sequence, usage: { input_tokens, output_tokens } } }
// or an error body: { provider_request_id, body: { type: 'error', error: { type, message } } }.
// The shape follows the provider's documented Messages response format as understood
// when this module was written; it must be confirmed against current documentation
// before any live use.

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

export const MAPPING_VERSION = '0.1.0-offline';
export const mappingSha256 = () => createHash('sha256').update(readFileSync(new URL(import.meta.url))).digest('hex');

export class MappingRejection extends Error {
  constructor(code) { super('mapping_rejected:' + code); this.code = code; }
}

// One mapper per pilot run: it owns provider-request-identifier uniqueness.
export function createAnthropicMapper({ expectedModel }) {
  if (typeof expectedModel !== 'string' || !expectedModel) throw new Error('expected_model_required');
  const seenProviderRequestIds = new Set();
  return {
    expectedModel,
    map(captured) {
      if (!captured || typeof captured !== 'object' || captured.body === undefined || captured.body === null) throw new MappingRejection('missing_response_body');
      const id = captured.provider_request_id;
      if (typeof id !== 'string' || !id.trim()) throw new MappingRejection('provider_request_id_missing');
      if (seenProviderRequestIds.has(id)) throw new MappingRejection('duplicate_provider_request_id');
      seenProviderRequestIds.add(id);
      const b = captured.body;
      if (typeof b !== 'object' || Array.isArray(b)) throw new MappingRejection('malformed_top_level_structure');
      if (b.type === 'error') {
        return { status: 'error', stop_reason: null, content: [], model: expectedModel, provider_request_id: id, error_type: b.error && b.error.type };
      }
      if (b.type !== 'message' || b.role !== 'assistant' || !Array.isArray(b.content) || typeof b.model !== 'string') throw new MappingRejection('malformed_top_level_structure');
      if (b.model !== expectedModel) throw new MappingRejection('model_identifier_mismatch');
      if (b.content.length === 0) throw new MappingRejection('empty_content');
      const unsupported = b.content.find((c) => !c || c.type !== 'text');
      if (unsupported) throw new MappingRejection('unsupported_content_block_type');
      if (b.content.length > 1) throw new MappingRejection('multiple_text_blocks');
      const text = b.content[0].text;
      if (typeof text !== 'string') throw new MappingRejection('text_content_missing_or_not_string');
      if (!text.trim()) throw new MappingRejection('empty_content');
      return {
        status: 'ok',
        stop_reason: b.stop_reason === 'max_tokens' ? 'max_tokens' : (b.stop_reason || 'end_turn'),
        content: [{ type: 'text', text }],
        model: b.model,
        usage: b.usage || null,
        provider_request_id: id,
        provider_message_id: typeof b.id === 'string' ? b.id : null,
      };
    },
  };
}

// A mock transport (kind 'mock') that serves captured fixtures through the mapper.
// It is the only path from a captured response to the adapter. Mapping rejections are
// thrown, which the adapter records as a provider error with no replay; the precise
// mapping code is kept in mappingErrors for the record.
export function createMappedMockTransport(capturedByRequestId, mapper, { sidecar } = {}) {
  const calls = [];
  const mappingErrors = {};
  return {
    kind: 'mock',
    enabled: true,
    calls,
    mappingErrors,
    async send(request) {
      calls.push({ request_id: request.request_id });
      const captured = capturedByRequestId[request.request_id];
      if (captured && captured.timeout) {
        throw Object.assign(new Error('timeout'), { code: 'transport_timeout' });
      }
      try {
        const env = mapper.map(captured);
        if (sidecar) sidecar(request, env);
        return env;
      } catch (e) {
        mappingErrors[request.request_id] = e.code || 'mapping_error';
        throw Object.assign(new Error(e.message), { code: 'mapping_rejected' });
      }
    },
  };
}
