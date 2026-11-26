# Decision Spellcheck

**Checks a decision record against the documents behind it before it is signed off, and shows what a later reviewer, auditor or regulator could not trace, confirm or rely on. For records that authorise an AI system, it also checks what the EU AI Act expects the record to show.**

Date: 25 November 2026. Status: working prototype. No accuracy rate is claimed. A documentation check, not a legal assessment: it never states that anyone complies with any law.

## The problem

Decision records (AI authorizations, access exceptions, investigation summaries, document-production decisions) are often reviewed months later by someone who was not there. Records that read as complete turn out to rest on a recommendation restated as a requirement, an assessment with no stated basis, or an approval with no cited authority. For AI systems used in high-risk areas in the EU, the authorisation record is where a regulator will look first: the EU AI Act's deployer obligations for Annex III systems apply from 2 December 2027 (Article 113(c), as amended by Regulation (EU) 2026/1744).

## What it does

1. **Reads plain documents.** The record and its documents as plain text, Word or PDF files (PDF read with no third-party code; scanned PDFs refused); nothing has to be prepared by hand.
2. **Checks every claim against its source:** support, contradiction, missing sources, wrong dates, changed amounts, percentages and periods, dropped dates and speakers, dropped conditions, unsupported conclusions. Reads dates written the American, British, European and ISO ways, asks about an all-number date that readers in different countries would read differently (03/04/2024), and catches impossible dates (May 32) and dates a day or two off from the source. Reports a record or document not written in English instead of passing it.
3. **Flags known risk patterns:** 43 checks, such as a "recommended" step stated as "required", an assessment with no stated basis, or an approval with no stated authority.
4. **Checks the reasoning (cognitive controls):** fourteen reasoning lenses, such as unsupported certainty, closing the matter before the evidence is in, selective evidence and over-reliance on an AI system's output, each with one neutral question; eight safeguards say what the reviewer should do and when to refer the matter.
5. **Asks about what was left out:** an open finding, a failed test or a condition in a source that the record never mentions.
6. **EU AI Act checks for AI authorizations:** ten points (risk classification, instructions for use, named oversight, overseers' training, override and stop, monitoring, logs kept at least six months, informing workers, informing affected people, AI literacy), each reported as shown and backed by a document, stated with no document, or not shown. Covers every Annex III area: recruitment, education, credit, insurance, housing, health, public benefits and justice. Every legal passage relied on is stored word for word and checked against the Official Journal.
7. **Stops the record on the gaps practitioners raised most.** A bare assessment with no stated basis, a recommendation written up as a requirement, a cited policy that is not supplied, broad access granted with no stated reason, and a conclusion resting on unresolved points each hold the record for review (rule: raised by at least one in four practitioners in the study).
8. **Holds the record until gaps are resolved** or overridden with a written reason.

## Why it is different

- **Built for audit.** Every reviewer action goes into a tamper-evident log; an exported evidence pack can be re-checked independently of the tool; a reference workspace adds roles (admin, reviewer, approver, auditor), encrypted storage, a signed audit log and retention rules.
- **Same input, same answer, every time.** No AI model calls, so a result can be reproduced exactly. Proven by a script anyone can run: two runs give byte-identical output.
- **Nothing leaves the building.** No network calls; the proof script runs the whole benchmark with every network route blocked.
- **Shows its working.** Every result names the record sentence and the document sentence it relied on (1,475 of 1,475 findings on the benchmark).
- **Tested in the open.** The Record Check Benchmark (benchmarks/record-check-v1) lets anyone run their own tool on the same public decisions and fictional EU AI Act records, with the scorer, keys and our results, including where we fail. Six tracks: dropped dates and speakers, lossy AI summaries, EU AI Act points, outcome risk, changed figures, and good AI drafts.

## Evidence to date

- **Practitioner study:** 30 practitioners from an international panel completed a blind review of a fictional access-exception record (47 people from 28 countries answered at least the first question); 21 of the 29 asked would not rely on it as written (95% interval 54 to 85%). The prototype's answer, locked on 19 November before anyone saw the record, passed it and matched 2 of the 75 points the practitioners raised (developer-coded). The gaps they raised most now hold a record. On two sets of new fictional records sealed before the code was changed, the new checks agreed with the key on all 50 gap points (first set) and on all 8 records (second set), where all 6 sound records reached READY. Run afterwards on the study record, the current version raises 52 of the 75 points and holds it; that figure is not evidence, because the changes were made knowing that record.
- **EU AI Act checks:** on two sets of fictional AI authorizations whose answer keys were sealed before the code ran, 78 of 80 and 38 of 40 points agreed with the key; written by the developer, so not independent.
- **Published public decisions (real records).** On 28 EEOC appeal decisions sealed before any fix, an unchanged decision passed in 28 of 28, a version with its dates removed was caught in 28 of 28, and one with its speakers removed in 28 of 28. On AI-written summaries of 30 public decisions, the tool told a lossy summary from a full one in 29 of 30 and kept flags on good drafts to under 3 per 10 statements. **Not achieved:** clearing a long reworded draft without any serious flag (1 to 5 of 30 against a target of 15), and telling decisions that later failed from those that held up when a decision is read without its underlying documents (3 of 7 and 8 of 11). The keys were written by the developer; the earlier failed runs are kept in the evidence index.
- **Document reading:** 127 of 128 hand-identified claims found in 26 developer records; PDF text matches a standard PDF tool on 99.1% of words across 623 public decision PDFs.
- **Changed figures (benchmark track E, 40 public decisions not used before):** first run, before any change for this track, all 80 unchanged passages passed (including 40 with the figure written another way, such as "thirty" for "30") and 33 of 40 changed figures were caught and named; after fixes made from those misses, 39 of 40 (seen material). A simple number-comparison baseline caught 16 of 40.
- **Good AI drafts (benchmark tracks F and FH):** the weak point. On the development drafts, after tuning, 24 of 60 pass without a serious flag (first run 11) and the sentence with an error put in is flagged in 48 of 60 (first run 21). **On a sealed hold-out of 30 fresh, more formally reworded drafts, the result failed: 0 of 30 passed clean, and 18 of 30 errors were caught (every wrong date; none of the 10 inserted negations).**
- **Engineering:** 224 automated tests pass; reports reproduce byte for byte.

## Limits, stated plainly

- Tested on fictional records and published public decisions only; use on an organisation's own records is a licensing decision.
- Word-pattern checks can miss a point phrased in unexpected words.
- A long reworded record still gets serious flags a reviewer must clear (24 of 60 good AI drafts pass clean on the development set, 0 of 30 on a fresh hold-out); the tool points to sentences to check, it does not clear a whole draft.
- English only: text in another language is reported, not checked. Dates without a year, relative dates and worked-out totals are not checked.
- Scanned PDFs (no text layer) need converting first.

## Ways to use it

| Option | For |
|---|---|
| Licence to embed in your product | AI governance, GRC, compliance, HR case-management and eDiscovery software vendors |
| Single-organisation installation | Compliance, internal audit, investigation and AI governance teams |
| Starter (training) edition | Practitioners, trainers and students, on fictional records |
| Evaluation licence | Anyone deciding whether it fits |

Contact: info@jrsstandard.com (to be replaced by a Decision Spellcheck address)
