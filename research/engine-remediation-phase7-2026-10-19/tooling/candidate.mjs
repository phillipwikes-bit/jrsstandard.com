// JRS PHASE 7: run the frozen v0.3 compiler and the v0.3.1 candidate on the same input.
//
// For candidate runs only, a declared compiler_version of exactly '0.3.0-local'
// is presented as '0.3.1-candidate'. Any other declared value is passed through,
// so a version-mismatch fixture still mismatches. Inputs are deep-copied.

const FROM = '0.3.0-local', TO = '0.3.1-candidate';
export function forCandidate(submission) {
  const s = JSON.parse(JSON.stringify(submission === undefined ? null : submission));
  if (s && s.declared_versions && s.declared_versions.compiler_version === FROM) s.declared_versions.compiler_version = TO;
  return s;
}
export function makeRunners(v03, cand, clock = '2026-10-19T00:00:00Z') {
  const run = (compile, args) => { try { return { graph: compile(args), error: null }; } catch (e) { return { graph: null, error: String(e.message).slice(0, 300) }; } };
  return {
    base: (submission, response, mode, id) => run(v03, { submission: JSON.parse(JSON.stringify(submission)), candidateResponseText: response, executionMode: mode, clock, fixtureId: id }),
    candidate: (submission, response, mode, id, rulePacks) => run(cand, { submission: forCandidate(submission), candidateResponseText: response, executionMode: mode, clock, fixtureId: id, rulePacks }),
    // A compile function with the stability runner's signature, mapping versions for the candidate.
    candidateCompile: (args) => cand(Object.assign({}, args, { submission: forCandidate(args.submission) })),
  };
}
