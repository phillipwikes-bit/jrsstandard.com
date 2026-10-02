# DRR Test Suite v0.9: harness specification

How a drafting tool is put through the suite. Status: PRE-RELEASE, 2026-10-02.

## 1. Inputs to the tool
- One call per practice text, `practice/S014-NN.txt`, passed as the tool would receive a real record in normal use.
- **The tool runs in its shipped configuration.** No suite-specific prompt, no fine-tuning on the practice texts, and no access to `BASELINES.json` or the cloze items.
- If the tool has modes, such as "summary" or "findings", each mode is a separate submission with its own name.
- One draft per text and mode. If a vendor runs more than one draft, all of them are submitted. A best-of-N selection must be declared as such.

## 2. Submission package
```
submission/
  MANIFEST.json        tool name, version, mode, model and model version if known, date, operator, settings, best-of-N
  drafts/S014-01.txt   plain UTF-8 text, the tool's output as delivered to a user (formatting marks may remain)
  ...
  drafts/S014-30.txt
```
A missing draft is reported as missing. It is never imputed, and the report says `complete: false`.

## 3. Scoring
1. `python3 score.py verify` must print OK. A report from a modified suite is not a v0.9 report.
2. Run `python3 score.py drafts submission/drafts`. This gives anchor retention by type, pooled retention, unsupported additions with each item listed, unsupported additions per 100 kept anchors, and the length ratio.
3. **Reconstruction (cloze).**
   - Run `python3 score.py cloze-items` to produce the masked sentences, with the answers withheld.
   - For each text, a reader model gets the `READER_INSTRUCTION` in `lib/cloze.py`, the vendor's draft inside `<record>` tags, and that text's sentences.
   - The reader returns one answer per sentence.
   - `python3 score.py cloze-score answers.json` scores them.
   - The reader model and its version are named in the report. The Study 014 reference reader is `claude-sonnet-5-5`.
4. **Manual adjudication.** Every unsupported addition is read against the source and labelled as one of:
   - invented (not in the source in any form);
   - altered (a quotation reworded inside quote marks);
   - extractor error.

   At v0.9 this is done by the suite operator. Labels are reported beside the automatic count, and the automatic count is never overwritten.

## 4. Report contents
- Suite version and the output of `verify`.
- The submission manifest.
- The full `score.py` output.
- The cloze result, with the reader named.
- The manual adjudication table.
- The comparison with `BASELINES.json`.
- The fixed limits statement below, verbatim.

**Fixed limits statement:** "This report measures whether drafts kept reconstruction anchors from 30 public EEOC decision backgrounds, using JRS DRR Test Suite v0.9 (pre-release). It does not measure accuracy, fairness, legal sufficiency or regulatory compliance, and it is not a certification."

## 5. Operator rules
- Practice-set results may be published by the vendor, but only together with the fixed limits statement and the suite version.
- No result may be described as "certified", "compliant" or "JRS approved" at v0.9.
- The words "prevents", "eliminates" and "guarantees" are not used to describe any result.
- The operator keeps the submission, the score output and the adjudication for the licence term.

## 6. What changes at v1.0
- Scoring on a sealed private set, in addition to the practice set.
- The confirmatory extractor validation.
- A conformance mark, subject to the trademark decision.
