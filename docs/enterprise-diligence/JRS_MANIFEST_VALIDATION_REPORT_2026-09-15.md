# JRS Manifest Validation Report — 2026-09-15

**39 checks, 0 failed.** `node tests/manifest/run.mjs`. Synthetic data throughout; no
production personal data was used.

## Coverage

| Group | Checks | Result |
|---|---|---|
| Fixtures 1–6 (content classes, truncation, vocabulary defaults, refusal) | 12 | all pass |
| Red team (§50) | 12 | all pass |
| Privacy (§52) and security (§51) | 10 | all pass |
| Reproducibility and integrity (§24, §25) | 5 | all pass |

## The failure that mattered, recorded rather than smoothed over

The first run **rejected every valid manifest**. The schema uses `minLength`; the validator
did not implement it and **failed closed**, which is the designed behaviour working correctly.

**The fix was to implement `minLength` in the validator, NOT to remove it from the schema.**
Weakening a schema so a tool passes is the inversion this project exists to catch, and the
tool's own header now records the incident.

## Privacy and security results

The serialized manifest was searched for six synthetic identifiers planted in the source
record (name, email, phone, SSN-shaped value, card-shaped value, address). **None appears in
any fixture**, including the derived-content one.

Also absent: `sk-ant-`, `ANTHROPIC_API_KEY`, `supabase.co`, `sb_publishable`, `process.env`,
`Bearer `, and prompt text.

**This is not a claim that the manifest is a PII detection system.** It establishes that the
generator does not copy arbitrary source content into the artifact. A note is model output and
could in principle paraphrase a record, which is precisely why `content_class` exists.

## Reproducibility, and the distinction §25 requires

**Manifest reproducibility, demonstrated:** identical inputs with `manifest_id` and
`created_at` pinned produce an identical canonical form and an identical `manifest_hash`.
Those two fields are the only nondeterministic ones, and leaving them free produces a
different hash, which was asserted as its own check.

**Evaluation reproducibility is a different property and is NOT established here.** A stable
manifest hash says the representation is deterministic. It says nothing about whether repeated
evaluation of the same record yields the same result, and nothing about accuracy.

## Integrity

Tampering with `routing.value` after hashing is caught. An unsigned manifest reports
**`SELF-CONSISTENT (not authenticated: unsigned)`**. The fixture with a hand-edited
`content_class` is rejected **twice**: by the semantic rule and by the hash mismatch.
