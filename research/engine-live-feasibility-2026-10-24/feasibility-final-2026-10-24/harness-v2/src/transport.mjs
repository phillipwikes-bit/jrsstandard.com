// Transports for the feasibility harness.
//
// Only a mocked transport exists. A live transport is deliberately not
// implemented: provider access is not authorized, no credential may be read,
// and no endpoint is recorded here. Asking for one always throws.
//
// Mock envelope (the shape a future live adapter would map provider responses
// into; it is not a claim about any provider's wire format):
//   { status: 'ok' | 'error', stop_reason: 'end_turn' | 'max_tokens' | ...,
//     content: [{ type: 'text', text }], model, usage: { input_tokens, output_tokens } }

export function createLiveTransport() {
  throw new Error('live_transport_not_authorized: no live transport exists in this harness');
}

// behaviours: { [request_id]: { envelope } | { timeout: true } | { throws: 'message' } }
export function createMockTransport(behaviours, { model = 'MOCK-MODEL-NOT-A-PROVIDER' } = {}) {
  const calls = [];
  const transport = {
    kind: 'mock',
    enabled: true,
    calls,
    async send(request, { timeoutMs }) {
      calls.push({ request_id: request.request_id });
      const b = behaviours[request.request_id];
      if (!b) throw new Error('mock_fixture_missing:' + request.request_id);
      if (b.timeout) {
        return new Promise((_, reject) => setTimeout(() => reject(Object.assign(new Error('timeout'), { code: 'transport_timeout' })), Math.min(timeoutMs, 50)));
      }
      if (b.throws) throw Object.assign(new Error(b.throws), { code: 'transport_error' });
      return JSON.parse(JSON.stringify(Object.assign({ model }, b.envelope)));
    },
  };
  return transport;
}

// Disabled by default: a transport object that refuses every send.
export const DISABLED_TRANSPORT = Object.freeze({
  kind: 'disabled',
  enabled: false,
  async send() { throw new Error('transport_disabled'); },
});
