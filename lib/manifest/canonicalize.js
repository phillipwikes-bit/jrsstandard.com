// JRS MANIFEST — DEVELOPMENT CANONICALIZATION
//
// WHAT THIS IS, STATED BEFORE WHAT IT DOES.
//
// This is a DEVELOPMENT CANONICALIZATION. It is deliberately NOT described as
// RFC 8785 / JCS compliant, because it has not been verified against the RFC's
// test vectors and this repository carries no dependency that implements it.
// Calling it JCS would be a compliance claim resting on nothing, which is the
// exact defect class this project measures.
//
// The manifest records which canonicalization produced its hash in
// integrity.canonicalization, so a reader is never left to guess. Development
// manifests carry 'jrs-dev-canon-1', not 'JCS/RFC8785'.
//
// WHAT IT DOES
//   - object keys sorted by code unit, recursively
//   - arrays keep their order, because order is meaning
//   - no insignificant whitespace
//   - UTF-8 via the caller's TextEncoder
//   - the integrity object is excluded by the CALLER, not here, so that this
//     function has one job and the exclusion is visible at the call site
//
// KNOWN LIMITS, recorded rather than discovered later:
//   - number formatting follows JSON.stringify, which is ES2020 Number::toString
//     and agrees with JCS for every value this manifest carries (integers and
//     small decimals). It is NOT verified for the full IEEE-754 range.
//   - lone surrogates are not normalised.
// Both are acceptable for development and would need settling before any
// manifest is presented as externally verifiable.

export const CANONICALIZATION_ID = 'jrs-dev-canon-1';

export function canonicalize(value) {
  return JSON.stringify(sortDeep(value));
}

function sortDeep(v) {
  if (Array.isArray(v)) return v.map(sortDeep);
  if (v && typeof v === 'object') {
    const out = {};
    for (const k of Object.keys(v).sort()) {
      if (v[k] === undefined) continue;
      out[k] = sortDeep(v[k]);
    }
    return out;
  }
  return v;
}

// Everything except the integrity object, which cannot be inside its own hash.
export function canonicalizeForHashing(manifest) {
  const copy = Object.assign({}, manifest);
  delete copy.integrity;
  return canonicalize(copy);
}
