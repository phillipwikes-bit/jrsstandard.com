// JRS Review Engine local candidate: deterministic mock-model adapter.
// LOCAL DEVELOPMENT ONLY. Returns scripted responses; it never calls a model.
//
// createMockAdapter({ model_id, model_version, prompt_version, respond })
//   respond(request) must be a pure function of the request, so the same request
//   always gives the same output. The adapter keeps a private call log so tests
//   can prove whether, and with what, it was called.

export function createMockAdapter(spec) {
  var s = spec || {};
  var ids = { model_id: s.model_id, model_version: s.model_version, prompt_version: s.prompt_version };
  var calls = [];
  return {
    describe: function () { return Object.assign({}, ids); },
    examine: async function (request) {
      calls.push(request);
      var out = typeof s.respond === 'function' ? s.respond(request) : s.response;
      return typeof out === 'string' || out === undefined || out === null ? out : JSON.parse(JSON.stringify(out));
    },
    calls: calls,
  };
}

// A mock that returns one fixed response regardless of the request.
export function fixedMock(response, ids) {
  return createMockAdapter(Object.assign({}, ids, { respond: function () { return response; } }));
}
