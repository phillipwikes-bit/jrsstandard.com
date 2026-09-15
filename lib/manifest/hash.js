// JRS MANIFEST — HASHING
//
// Uses crypto.subtle.digest('SHA-256', ...), the idiom already present in
// api/_country-backfill.js and api/roster-8c3f1a9e7b2d6045.js, rather than
// introducing a second hashing style into the repository.
//
// ALGORITHM PREFIX IS MANDATORY. A bare hex string does not say what produced
// it, and a manifest that outlives its generator has to carry that itself.

const ENC = new TextEncoder();

export async function sha256Prefixed(str) {
  const buf = await crypto.subtle.digest('SHA-256', ENC.encode(str));
  const hex = Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0')).join('');
  return 'sha256:' + hex;
}

// THE TRUNCATION DECISION, DOCUMENTED BECAUSE §13 REQUIRES THE CHOICE TO BE
// EXPLICIT AND BECAUSE GETTING IT WRONG MISREPRESENTS WHAT WAS EVALUATED.
//
// The engine truncates at 8,000 characters before evaluation. Two hashes are
// therefore possible and they answer different questions:
//
//   evaluated_hash : hashes the text the model actually saw. This is the one
//                    that corresponds to the result, so it is REQUIRED and it
//                    is what input.hash carries.
//   source_hash    : hashes the full submitted record. Optional. It lets a
//                    holder of the original prove correspondence even when the
//                    evaluation saw less.
//
// input.truncated is set from the comparison, never asserted by the caller.
// A manifest that hid truncation would claim the evaluation covered material
// the model never received.

export const ENGINE_TRUNCATION_LIMIT = 8000;

export async function hashInput(sourceText, limit = ENGINE_TRUNCATION_LIMIT) {
  const source = String(sourceText == null ? '' : sourceText);
  const evaluated = source.length > limit ? source.slice(0, limit) : source;
  const truncated = evaluated.length !== source.length;
  const out = {
    hash: await sha256Prefixed(evaluated),
    hash_algorithm: 'sha256',
    length_chars: evaluated.length,
    truncated: truncated,
  };
  if (truncated) out.source_hash = await sha256Prefixed(source);
  return out;
}
