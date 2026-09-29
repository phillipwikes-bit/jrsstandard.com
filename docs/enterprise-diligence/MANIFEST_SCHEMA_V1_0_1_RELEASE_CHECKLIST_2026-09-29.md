# Manifest schema revision 1.0.1: release checklist

**Scope:** Public schema only. Manifest format and generator remain 1.0. The published v1.0 schema is retained unchanged. This record does not assert engine validation, authenticity, or ownership.

| Check | Result | Evidence |
|---|---|---|
| Current supported Standard and Codebook identifiers established | 1.0 for each | `.jrs/registries/RELEASE_REGISTER.json` version inventory |
| Historical public schema preserved | Required | Root `jrs-decision-reconstruction-manifest-v1.0.schema.json` not modified |
| Separate revision identifier and public path | Required | Root `jrs-decision-reconstruction-manifest-v1.0.1.schema.json` |
| Supported Manifest accepted | PASS locally | `node tests/manifest/schema-1.0.1.mjs` |
| Forged manifest with recalculated integrity hash accepted by historical schema | PASS locally, demonstrates the gap | `tests/manifest/fixtures/canonical/07-unsupported-versions-rehashed.manifest.json` |
| Same forged manifest rejected by 1.0.1 for both version fields | PASS locally | `node tests/manifest/schema-1.0.1.mjs` |
| Each version field independently rejected when unsupported | PASS locally | Same test |
| Public page points to new schema and historical schema | Prepared | `manifest.html` |
| Production serves exact revision bytes | PENDING until live comparison | `https://www.jrsstandard.com/jrs-decision-reconstruction-manifest-v1.0.1.schema.json` |

The schema validates declared version identifiers against the currently supported release inventory. It does not authenticate a manifest's origin. The builder and internal default schema still accept caller-supplied nonempty Standard and Codebook versions; a separate build-time change is needed to reject unsupported versions before an artifact is generated. Consumers using the public 1.0.1 schema can reject them at validation.
