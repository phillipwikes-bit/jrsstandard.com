# Expected Result

Running `node validate-manifest.js example.manifest.json schema.json` prints:

```
integrity: SELF-CONSISTENT (not authenticated: unsigned)
VALID (structurally. Not a claim of accuracy, validation, compliance or authenticity.)
```

Exit code `0`.

## Expected source correspondence

The SHA-256 of `source.txt` equals `input.hash` in the manifest:

```
sha256:ee8a9198255d9f8668e2c1dd042d34135dbb3a65b6d52d1094fbc6096e32adcb
```

**If those match, the manifest describes that record.** Recompute it yourself; do not take it
from this file.

## Expected readings

| Question | Answer from the manifest |
|---|---|
| JRS version | `1.0` |
| Codebook version | `1.0` |
| Engine version | `0.1.0-validation` |
| Model | `claude-haiku-4-5-20251001` |
| Condition vocabulary | `review_engine_keys` |
| Routing vocabulary | `engine_determination` |
| Routing value | `review_required` |
| Input truncated | `false` |
| Content class | `derived_record_content` |
| Human review required | `true` |

**`content_class` reads `derived_record_content`, not `no_record_content`**, because the
per-condition notes are model output derived from the record. The generator sets that from
what is present; a caller cannot override it.

**`engine_version` reads `0.1.0-validation`.** That is the engine's own description of itself
and it is not a marketing label.

## Things that should FAIL, and why you should try them

Edit the file and re-run. Each of these is rejected:

| Edit | Why it fails |
|---|---|
| Change any field without recomputing the hash | Integrity mismatch |
| Set `content_class` to `no_record_content` | Notes are present |
| Set `condition_vocabulary` to `jrs_codebook_1.0` | Three of five Codebook mappings are unresolved |
| Add `legally_sufficient: true` | The root rejects unknown fields |
| Set `human_review.required` to `false` without a reason | Rejected |
| Change `integrity.canonicalization` to `JCS/RFC8785` | The validator cannot verify it, so it fails rather than passing an unverifiable claim |

**A tool you cannot make fail is a tool you should not trust.** These are here so you can.
