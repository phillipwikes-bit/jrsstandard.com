# JRS Independent Review Package

**This is an Independent Review Package.** It is not a certification package, not a validation
package, not a compliance package, and not a legal-defensibility package.

It lets you interrogate a JRS evaluation **without access to the JRS project**: no account, no
API, no network.

## Contents

| File | What it is |
|---|---|
| `schema.json` | The manifest schema |
| `validate-manifest.js` | Offline validator. Makes no network call |
| `example.manifest.json` | A manifest produced by the generator from a synthetic record |
| `source.txt` | The synthetic record that produced it |
| `EXPECTED.md` | What a correct run returns |

## Run it

```
node validate-manifest.js example.manifest.json schema.json
```

Requires Node 18+. Nothing else. No install, no dependency, no configuration.

## Check the source correspondence yourself

The manifest carries `input.hash` over the text that was **evaluated**. Recompute it:

```
node -e "const{createHash}=require('node:crypto'),{readFileSync}=require('node:fs');\
console.log('sha256:'+createHash('sha256').update(readFileSync('source.txt','utf8'),'utf8').digest('hex'))"
```

Compare with `input.hash`. **If they match, this manifest describes that record.** If
`input.truncated` is true, `input.hash` covers only the first 8,000 characters and
`input.source_hash` covers the whole record.

## Check integrity yourself

The validator recomputes `integrity.manifest_hash` over the canonical form **excluding the
integrity object** and compares. A mismatch means the manifest changed after it was hashed.

**Integrity is not authenticity.** A matching hash shows the contents have not changed. It
does **not** show who produced them. These manifests are unsigned, and the validator says
`SELF-CONSISTENT (not authenticated: unsigned)` rather than anything stronger.

## What you can establish from the manifest alone

Evaluation occurred and when · JRS version · Codebook version · engine version · API version ·
model · which condition vocabulary the keys belong to · which routing vocabulary the
record-level value came from · the five condition statuses · any model notes · whether the
input was truncated · what class of record-related content the manifest carries · that the
manifest is internally intact · that human review was recorded as required.

## What you cannot

- **Accuracy.** No accuracy claim is made or supported.
- **Validation.** The engine is empirically unvalidated.
- **Legal sufficiency, admissibility, compliance, certification.** The schema forbids such
  fields and the validator rejects them.
- **Authenticity**, unless signed and verified. Signature verification is not implemented.
- **Whether a note is fair.** That needs the original record and your judgment.
- **Why a status was assigned.** The routing logic is implementation, not manifest.

## Two vocabularies, declared rather than assumed

`condition_vocabulary` will normally read `review_engine_keys`. That is deliberate: the
correspondence between the engine's condition keys and the JRS Codebook conditions is **not
settled for three of the five**, and the generator refuses to relabel them. `routing.vocabulary`
names which record-level vocabulary the value came from, because two exist.

**If you see `jrs_codebook_1.0`, treat it with suspicion.** The validator rejects it.
