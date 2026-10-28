# Source Changes: 0.3.3-research-candidate to 0.3.4-research-candidate

**2026-10-28. Research candidate, not adopted.** The engine of record stays `0.3.1-candidate`. Release status `NO_GO_NOT_VERIFIED`; B-018 OPEN.

| Item | Value |
|---|---|
| Parent candidate | `0.3.3-research-candidate`, frozen in `research/study-156-2026-10-27/candidate/`, manifest `fad69b62554a8e8cb6aa97ba9a85b5ee4f80ebfff565a3705dfc91f8dc100477` (unchanged) |
| Parent commit | `58f3fa6da3d961e24c99db687923d839f4431e89` (`PARENT.json`) |
| Copy before any change | `SOURCE_COPY_SHA256_BEFORE_CHANGE.txt`: 46 files, every hash equal to the 0.3.3 manifest |
| This candidate | `candidate/`, manifest `CANDIDATE_0.3.4_MANIFEST_SHA256.txt` (hash in `seals/freeze/MANIFEST_SHA256.txt`) |
| Full diff | `reports/SOURCE_DIFF_0.3.3_TO_0.3.4.patch` (the version directory is renamed on both sides so files pair up) |

## 1. Files changed (14 of 46, plus the research prompt renamed)

| File | Lines added / removed | What changed |
|---|---|---|
| `research-profile.mjs` | +458 / -84 | Every repair below (RP-SRP-09 to RP-SRP-13, the RP-SRP-02 fix) |
| `rule-packs-research/RPK-SRP.json` | +93 / -17 | Research pack 2.0.0: thirteen rules (four new), re-signed |
| `compiler.mjs` | +25 / -10 | Research path only: research instruction screen, rules passed to units and events, passages on controls, visible gaps stated when a status is held at review, consolidated controls |
| `contract.mjs` | +4 / -3 | `COMPILER_VERSION = '0.3.4-research-candidate'`, header comment |
| `graph-validate.mjs` | +2 / -2 | Research prompt version string, comment |
| `rule-packs.mjs`, `scope.mjs` | +1 / -1 each | Comments only |
| `rule-packs/RPK-*.json` (seven default packs) | +2 / -2 each | `candidate_version` and content seal only; rule content unchanged |
| `prompt/PROMPT_research-1.txt` to `prompt/PROMPT_research-0.3.4-1.txt` | renamed | Version labels; Q8 adds "a date, number or document mentioned elsewhere ... is not evidence for a decision unless the record links it"; Q10 names reviewer notes and approval claims as data |

The default path (no research profile) is the 0.3.2 path: the default packs' rules are unchanged, and every changed line in `compiler.mjs` is inside a `research` branch. This is tested, not assumed: the default-path differential compares 0.3.4 with 0.3.2 on 310 inputs, and the scored runs compare the 0.3.4 default arms (A0c, A6c) with 0.3.2 (A0b, A6) on the study records.

## 2. Repairs, by rule

| Rule | Study failure identifiers | Change |
|---|---|---|
| RP-SRP-09 (new) | VF-01, VF-02, EF-05, EF-06, VF-04 | Evidence counts only when the record links it to a decision: in a decision sentence (outside the decision's own date, subject and details), in a sentence that gives a reason and refers to a decision, in an earlier sentence such a reason names by reference, or in a sentence naming the same identifier or dated event as linked evidence. Two inferred links (a measurement in the unit of a cited authority's condition; a sentence reporting evidence about what the decision concerns) stop a "no evidence" flag and never support. Other anchors are reported and never counted. A first sentence with no verb is a title (metadata). Shared ordinary words are not used, after one gave a false link in development |
| RP-SRP-10 (new) | EF-07, VF-05 | Instance words (next, previous, second, revised) and planned wording make a different event; a comma inside a number no longer cuts the event window; added process words; chronology counts only dated events on the decision path; an unnumbered decision object is compared for opposite outcomes |
| RP-SRP-11 (new) | VF-03 | Research instruction screen: text addressed to a reviewing system, or directing the assessment, is quarantined (anchors and roles dropped), nothing can be supported, and visible gaps elsewhere are still reported |
| RP-SRP-12 (new) | EF-01, EF-03 | Decision verb families instead of single words; a decision the candidate quotes from the body (never a title) lowers a "no conclusion" gap to review |
| RP-SRP-13 (new) | CF-01 | One control per defect, naming every affected condition and the record passages concerned; observed text, inferred concern and requested clarification kept apart |
| RP-SRP-02 (fix) | EF-02 | Verb forms ("was", "is", "has") are no longer read as plural quantities; physical measurements are anchors; the cause named in an attribution is what is concluded, not its evidence |
| RP-SRP-06, RP-SRP-07 (narrowed) | | The authority-only signal needs an authority that a located decision cites; a restated reason is judged against stated-link evidence |

## 3. What did not change

The quote-only candidate contract, the status combination (keep or lower, never raise), the guards (no supported sufficiency, no readiness, legal or compliance language), refusal behaviour, intake scope, quotation resolution and graph validation. Everything is still lexical: the rules see words, not meaning.

## 4. Changes made after development results were seen, and before the freeze

All repairs were developed on exposed study material (`registers/EXPOSURE_REGISTER.json`). After the second run of mutation tests 2.0, one test probe (MV-25) and one boundary probe (WD-41) were added; neither changed the candidate. Just before the freeze two descriptions were corrected to match the code: the header comment of `research-profile.mjs` and the RP-SRP-09 trigger text in `RPK-SRP.json` (re-signed) still said inferred links used shared terms, which development had removed. No behaviour changed after the rehearsal of the freeze.
