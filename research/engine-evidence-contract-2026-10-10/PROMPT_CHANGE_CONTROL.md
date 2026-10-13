# Prompt Change Control

**Scope:** the v0.2 prompt specification (`prompt-contract/PROMPT_v0.2.0.txt`) and the preserved v1 prompt (`historical-reference/`). Local working rules, NON-CANONICAL.

## Rules

1. **A prompt is part of the system under test.** Any edit, including wording, ordering or whitespace, is a new `prompt_version` and requires re-running every local test and any future evaluation. Results from one prompt version are never cited for another.
2. **Pinned by hash.** `PROMPT_MANIFEST.json` carries the SHA-256. `prompt.mjs` refuses to load text that differs from the pin, and the test suite fails. Updating the pin is a recorded change: a new file name, a new `prompt_version`, a new manifest entry, a CHANGELOG line stating the reason and the regression evidence.
3. **The v1 prompt is frozen.** It exists only as the historical reference. It is not edited; a v1 variant would be a new reference identity.
4. **No live run without a recorded decision.** Before any prompt is sent to any model the owner records: the model identifier and version; the prompt version; the data authorised (synthetic only unless counsel has reviewed otherwise); where outputs are stored and for how long; who reviews them; and that no evaluation-holdout material is used for development.
5. **No tuning on evaluation material.** Prompt changes are made against development fixtures only. A prompt changed after seeing evaluation results invalidates those results.
6. **Model changes count as prompt changes** for this control. `api/_model.js` records a review date of 2026-10-15 for the current identifier.

## Claim, local engineering evidence, interpretation, limitation, external evidence

- **Claim.** The v0.2 prompt is identifiable and an unrecorded edit is detectable.
- **Local engineering evidence.** Test section B: hash pin check, and a simulated one-sentence edit producing a different hash. `prompt.mjs` throws on mismatch.
- **Interpretation.** Silent prompt drift within this repository would fail the suite.
- **Limitation.** The control covers the files in this repository. It cannot detect a prompt typed elsewhere or a provider-side change in model behaviour.
- **External evidence still required.** For any live use: a release record pinning the provider, model identifier, prompt version and configuration, as `docs/engine-manifest-integration.md` already notes for v1.
