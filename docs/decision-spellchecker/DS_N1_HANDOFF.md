# DS-N1 Developer Handoff

**What this is.** DS-N1 is a new, experimental Decision Spellchecker candidate. It was built on 2026-11-03 by an AI development agent.

* It is **not** the original Decision Spellchecker (DS-A, whose source was not recovered), **not** LAB-R6, and **not** the JRS Review Engine.
* It is deterministic, makes zero model calls, uses no network, and has no dependencies beyond Node.
* It accepts **constructed fictional supplier-access exception records only.**

This handoff is a technical exercise only. It does not authorise any transfer of IP.

## Requirements

* Node 22 or later, and git. Nothing to install.
* Chromium with Playwright, needed **only** for the optional browser checks.

## Reproduce everything (about 2 minutes)

```bash
git clone <repo> && cd <repo> && git checkout claude/decision-spellchecker-ds-n1-2026-11-03
node tests/ds-n1/reproduce.mjs        # fresh clone at HEAD, all suites, 52 report hashes vs REPRO_BASELINE.json
```

A run that exits 0 with `"identical": true` means your clone reproduced the recorded behaviour exactly.

## Individual suites

| Command | What it checks |
|---|---|
| `node --test tests/ds-n1/ds-n1.test.mjs` | 35 unit, transition and adversarial tests |
| `node tests/ds-n1/eval.mjs --no-write` | 24 base records against pre-registered expectations |
| `node tests/ds-n1/eval-stress.mjs --split dev --no-write` | 10 stress records; 0 critical false-ready required |
| `node tests/ds-n1/ui.browser.mjs` | 20 Chromium checks, desktop and iPhone 13 emulation |
| `node tests/ds-n1/eval-isolation.mjs --no-write` | 12 isolation cases: each rule alone decisive (specification tests) |
| `node tests/ds-n1/pdf.check.mjs` | 9 PDF checks via poppler (needs Chromium) |
| `node lib/ds-n1/export-pdf.mjs <export.json> <out.pdf>` | Render a verified export to a tagged A4 PDF |
| `node tests/ds-n1/ablation.mjs [exports...]` | Rule ablation: NEVER_FIRED / REDUNDANT / DECISIVE per rule, plus reviewer feedback from exports |
| `node lib/ds-n1/serve.mjs` | Reviewer UI at `http://127.0.0.1:4317/` (loopback only) |

`eval-holdout2.mjs` is **sealed**: it refuses without `--owner-authorisation "<decision reference>"` and runs once. See `DS_N1_INDEPENDENT_REVIEW_PROTOCOL.md`.

`eval-stress.mjs --split holdout` **will refuse to run**, because the holdout for this increment was used once (`results/STRESS-HOLDOUT-001.json`). A new increment needs new holdout cases.

## Where things are

| Path | Contents |
|---|---|
| `lib/ds-n1/` | Engine: `record` (validation and scope), `assess` (rules), `session` (event log and state), `report` (8-part report and export), `verify` (export consistency), `ui/` |
| `tests/ds-n1/fixtures/`, `fixtures/stress/` | Constructed records. Regenerate with `build-fixtures.mjs` and `build-stress.mjs`; the output is byte-identical |
| `tests/ds-n1/expectations.json`, `stress-expectations.json` | Labels registered before the first runs (developer-authored) |
| `tests/ds-n1/results/` | Every harness run, including the failing first runs. **Never edit or delete these** |
| `tests/ds-n1/labelling/` | Blinded packet for an outside labeller. Keep `KEY_DO_NOT_SHARE.json` from them |
| `docs/decision-spellchecker/DS_N1_TECHNICAL_BASELINE_AND_INCREMENT_2026-11-03.md` | Full engineering record, defects, limitations, status |

## Rules for changing it

1. If a rule changes, bump `rule_version` in `lib/ds-n1/identity.mjs`. Old exports then verify as `INDETERMINATE` rather than silently "consistent".
2. Do not edit any expectations file to make a run pass. Fix the engine, or record the disagreement.
3. After an intended behaviour change, run `node tests/ds-n1/reproduce.mjs --write-baseline` on a committed tree, commit the new baseline, and say why in the commit message.
4. New rules need a test that fires and a test that must not fire, plus a mutation showing the guard catches a regression.
5. Nothing under `lib/`, `tests/` or `*.md` is deployed (`.vercelignore`). Keep it that way unless the owner authorises publication.

## Known limitations (read before relying on anything)

* All labels are the developer's own; nothing is independently verified.
* The rules are lexical. A passage can pass every check and still not support a claim.
* Not tested on a real iPhone or with assistive technology.
* SP-07, SP-13 and SP-14 are not implemented. SP-18 (bounded) since 0.3.0; SP-15 PDF since 0.6.0 (PDF bytes not reproducible; text is). PDF accessibility not validated.
