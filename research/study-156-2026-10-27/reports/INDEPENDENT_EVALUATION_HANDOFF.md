# Independent Evaluation Handoff (156-record study)

**2026-10-27.** For a reviewer who did not build this work. Nothing in this package is independent: one developer wrote the records, the rules, the mock candidates, the variants, the scoring and the reports. No human has reviewed any reference label. Start from that.

## 1. Verify before reading any result

| Step | Command (from `research/study-156-2026-10-27/`, with `ANTHROPIC_BASE_URL` unset) | Expected |
|---|---|---|
| Seals | `node tools/verify-seal.mjs` | corpus 131 files, freeze 2,215 files, no problems |
| Candidate manifest | `sha256sum CANDIDATE_0.3.3_MANIFEST_SHA256.txt` | `fad69b62554a8e8cb6aa97ba9a85b5ee4f80ebfff565a3705dfc91f8dc100477` |
| Freeze manifest | `sha256sum seals/freeze/MANIFEST_SHA256.txt` | `0d1230d0f19124f133f92a765a1d4f1089e04ad44658620b22ca90977238fe20` |
| Pre-freeze evidence list | `sha256sum PRE_FREEZE_EVIDENCE_SHA256.txt` | `cbf06bce69e86ebe206fc3904d98852b14776719111b04417ecabc740afc0ec5` |
| Whole package | `sha256sum -c PACKAGE_MANIFEST_SHA256.txt` | every line OK |

Then follow `reports/REPRODUCTION.md` to rerun everything offline.

## 2. What to attack first

| Claim in this package | How to test it |
|---|---|
| The default path is unchanged (310 of 310) | Rerun `tools/run-differential.mjs`; read the 15 changed files listed in `reports/RESEARCH_PROFILE_SPECIFICATION.md` section 2 |
| The research profile is inert unless enabled | Read `compiler.mjs` for every `research` branch; try profile objects the probes do not cover |
| Over-claim resistance | Write irrelevant-anchor and paraphrase variants of your own. VF-01 already shows 15 of 24 ungrounded records reaching CLEAR |
| The four question checks | Write records in families the author did not write. The drop from development to evaluation (EF-01 to EF-08) suggests further drops |
| Controls point at the right flaw | Read the 100 evaluation controls under A3R against the records, without the designed labels |
| Determinism | Rerun under another Node version or operating system (not available here) |

## 3. What an independent evaluation needs that this package does not have

1. **New records** written by someone who has not seen the rules, in new families, with their own construction notes held back from the developer.
2. **Human reference labels** from at least two raters who did not build the program, using `protocol/STUDY_CODEBOOK.md`, with agreement measured before adjudication.
3. **Criteria approved by the owner before** any scored run (`protocol/ACCEPTANCE_CRITERIA_PROPOSED.json` is unapproved).
4. **Real candidates.** A separately authorized live run (`protocol/REQUEST_AND_COST_PLAN.md`), with three fresh runs per record to characterise model variation.
5. **Reviewer study.** More than one reviewer, with consent and a rights instrument (`protocol/REVIEWER_BENEFIT_PROTOCOL.md` shows the single-owner design and its limits).
6. **Material review.** A rights and privacy review before any public case text is used.

## 4. What this package can and cannot support

| Can support | Cannot support |
|---|---|
| The offline compiler is deterministic and fails closed on the inputs tried | Accuracy, validity or reliability of the Engine |
| The research profile changes nothing when off | Any claim about real decision records |
| The listed failures exist and reproduce | That the failures listed are the only ones |
| The transport design behaves as tested offline | Anything about provider behaviour |

## 5. Materials and their status

- **Confidentiality:** no captures exist; no credential was read or stored.
- **Repository visibility:** the repository is public on GitHub. The package is untracked and has not been committed (owner Decision 1).
- **Contamination:** `registers/CONTAMINATION_REGISTER.json`, disclosures CD-01 to CD-08.
- **Reference labels and their status:** `registers/LABEL_REGISTER.json`.
