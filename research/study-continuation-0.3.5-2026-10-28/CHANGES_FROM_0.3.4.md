# 0.3.5-research-candidate: exact changes from 0.3.4-research-candidate

Dated 2026-10-28. Version choice: 0.3.5 is the next unused research version. It is named once before, in `research/engine-repair-0.3.4-2026-10-27/reports/OWNER_DECISION_SHEET_V2.md` (option b, a different design that was never built). This 0.3.5 is not that design. It is a prompt-only continuation.

Parent: `research/engine-repair-0.3.4-2026-10-27/candidate/` (manifest SHA-256 `b454d4b858c81655b6ff56bde27a68c1ead9639305e2600a6fcf1746c8c304ad`, unchanged). This candidate: `candidate/` (manifest `CANDIDATE_0.3.5_MANIFEST_SHA256.txt`, SHA-256 pinned in `tools/harness/engines.mjs`).

## Changed files (3 of 46; the other 43 are byte-identical)

| File | Change |
|---|---|
| `prompt/PROMPT_research-0.3.4-1.txt` → `prompt/PROMPT_research-0.3.5-1.txt` | Header `prompt_version` and status line. Q1: the prompt version string. Q2: states the validator's existing identifier rule (1 to 24 characters; A to Z, a to z, 0 to 9, hyphen, underscore; unique in the response), gives three compliant examples (`ib-1`, `chron_2`, `recon-3`), and says a response breaking it is rejected. Q3: keeps the five condition identifiers and adds "Use no other value; a response with any other condition_id is rejected." Q4 to Q10, the [USER] template and the record delimiters are unchanged. |
| `lib/.../research-profile.mjs` line 61 | `RESEARCH_PROMPT_VERSION` `jrs-engine-local-0.3.4-research/prompt-1` → `jrs-engine-local-0.3.5-research/prompt-1` |
| `lib/.../graph-validate.mjs` line 13 | The same constant, which graph validation checks |

The rule stated in Q2 is copied from `response.mjs` (unchanged): `typeof o.observation_id !== 'string' || !/^[A-Za-z0-9_-]{1,24}$/.test(o.observation_id) || ids.has(o.observation_id)` → `observation_id_invalid_or_duplicate`. Q3's list equals `CONDITION_IDS` in `contract.mjs` (unchanged) → `unrecognised_condition_id`.

## Not changed

These are unchanged: the validator, strict parser, compiler, conditions, rule packs and their seals, evidence rules, dispositions, scoring rules, E1 and E2, the research profile logic, and `COMPILER_VERSION` (`0.3.4-research-candidate`). The rule packs are sealed against `COMPILER_VERSION`, so the compiler keeps its version: the compiler code is the 0.3.4 compiler. There is no automatic identifier renaming and no condition substitution. The library directory keeps its 0.3.4 name, so the diff against the parent is exactly the three files above.

## Behaviour evidence

`out/CORRECTION_TESTS.json` CT-12: every one of the 624 frozen scripted proposals (6 policies x 104 records) compiles to the same graph under 0.3.4 and 0.3.5 once each carries its own prompt version. The only differences are the prompt version string and the identity hashes derived from the inputs and the source files. A response carrying the other version's prompt label is refused by each (CT-06).

## Corrected scorer

`tools/live/score-live-v2.mjs` (changes V2-1 to V2-4 in its header). Version 1 (`research/study-completion-0.3.4-2026-10-28/tools/live/score-live.mjs`) and its results are preserved unchanged.
