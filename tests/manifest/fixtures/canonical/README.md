# Canonical Manifest Fixtures — IMMUTABLE

**These files are the test oracle. The suite reads them and must never write them.**

Finding F-13, 2026-09-16: the harness previously wrote all six fixtures at the end of every
run, and five were built without a pinned `manifest_id` or `created_at`. Every run therefore
produced a fresh UUID, a fresh timestamp and a fresh `manifest_hash`, and the suite then
validated **its own latest output**.

That test could detect a validator regression. **It could not detect a generator regression**,
because the generator's output was also the expected answer. Under CLAUDE.md Section 20 a test
that cannot fail is not evidence.

Generator output now goes to `tests/manifest/generated/`, which is disposable. These files are
compared against, not overwritten. Changing the generator must be capable of failing the suite,
and `run.mjs` demonstrates that with a mutation case.
