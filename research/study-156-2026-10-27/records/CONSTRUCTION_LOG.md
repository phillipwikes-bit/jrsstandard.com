# Study Record Construction Log

**2026-10-27. Written before the corpus seal and before any research-profile code. Offline.** B-018 OPEN. NO_GO_NOT_VERIFIED in effect.

## 1. Original study records (R01 to R24)

- **Source.** `research/AnswerKey_Verification_Packet.md`, extracted verbatim by `tools/build-inventory.mjs` into `records/original/Rnn.txt` with no trailing newline. The file hash equals the extracted-text hash.
- **Cross-source check.** The deployed page `ai-records-arm-b.html` carries the same 24 texts in its `RECORDS` array. All 24 texts and all 24 context labels are identical.
- **Nothing was edited, completed or corrected.** The texts are constructed vignettes. No underlying document exists for any "on file" reference.

## 2. Public cases (PR-01 to PR-32)

- **Metadata only.** `JCI_JRS_32_Case_Master_Dataset.csv` and its source index. No decision text is held, so none was extracted. Nothing was retrieved. Retrieval is outside the current authority.

## 3. Synthetic slots (S-001 to S-100)

- **Search.** No set of 100 study-type synthetic records exists in the repository. Searches for "100 synthetic", "156 record", "SYN-0nn" and every synthetic pool were checked; the pools are listed in the inventory with reasons.
- **Replacement, disclosed.** The 100 records in `records/synthetic/` were written by the developer (this Claude Code session) on 2026-10-27 in `tools/synthetic-spec.mjs`. There are ten families outside the handoff excluded domains and ten construction types. The types are listed in that file with their designed labels.
- **Why these domains.** Records of the study's own domains (HR, investigations, litigation, eligibility) fall in excluded domains, or in classes the owner has not settled. They could not be processed under the current scope. The replacements are structural analogues, not records of those types.
- **Dependence, by design.** Records in a family share facts; records of a type share a construction pattern. Both links are written into each record's entry.
- **Partition, by family, fixed before generation.** F01 to F04 development (40); F05 to F10 evaluation (60). The evaluation partition was written by the developer, so it is developer-exposed. It is not a holdout and supports no holdout claim. It only guards against tuning after outputs are seen.
- **Construction cue control.** The originals carry a perfect surface cue: all 12 grounded records end with a sentence naming the basis, and no ungrounded record does. The replacements break that cue on purpose:
  - type G2 states the basis inline with no closing sentence;
  - types A and C use decision-style wording;
  - type U carries the decision's own identifier, for example "CR-2291";
  - type M pairs a supported conclusion with an unsupported one.
- **Lexical observation, not repair.** The generator records which records match the 0.3.1 intake patterns (excluded domain, instruction, placeholder). None matched. No record was rewritten because of a pattern match.

## 4. Inventory defect, preserved

| Old finding | New evidence | Corrected status | Explanation |
|---|---|---|---|
| Inventory v1, first build: 12 originals carried "NOT ESTABLISHED" reference labels | The key table has two record columns per row; the parser consumed the trailing pipe and skipped every second column | Rebuilt: 12 GROUNDED, 12 UNGROUNDED, matching `Verified_Key.md` | The defective output is kept at `inventory/history/RECORD_INVENTORY_V1_DEFECTIVE_KEY_PARSE.json` (SHA-256 `7d5b4277...ab6b7`). |

## 5. Engine and model runs before the seal

None. The only Engine code used before the seal is the 0.3.1 intake lexicon, imported by the generator to record pattern matches. No compiler, research profile or model was run on any record.
