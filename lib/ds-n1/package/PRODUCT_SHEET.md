# Decision Spellcheck for the EU AI Act

**Before an AI system is switched on, check that the authorisation record shows what the EU AI Act expects you to be able to show, and that a document backs up each point.**

Date: 25 November 2026. Status: working prototype, under independent evaluation. No accuracy rate is claimed. It is a documentation check, not a legal assessment: it does not show that anyone complies with the AI Act.

## The problem

Organisations using high-risk AI systems in the EU must be able to show human oversight by trained people, a way to override or stop the system, use in line with the provider's instructions, monitoring, logs kept for at least six months, and that workers and affected people were told (Regulation (EU) 2024/1689, Articles 4, 14 and 26). The obligations for Annex III systems apply from 2 December 2027 (Article 113(c), as amended by the Digital Omnibus; European Commission consolidated text as at 27 July 2026). The record that authorises the system is where a regulator, auditor or court will look first, and authorisation records routinely state that a safeguard exists without any document behind it, or leave it out altogether.

## What it does

1. **Reads the authorisation record and its documents** as plain text or Word files; nothing has to be prepared by hand.
2. **Checks ten points the AI Act expects a deployer to show** (risk classification, instructions for use, named oversight, overseers' training, override and stop, monitoring, log retention, informing workers, informing affected people, AI literacy). Each is reported as shown and backed by a document, stated with no document behind it, or not shown, with the exact sentences relied on and one plain question for each gap.
3. **Flags concrete shortfalls**, such as logs kept for less than six months.
4. **Checks every other claim in the record against its source** (wrong dates, a "recommended" step stated as "required", unsupported conclusions, approvals with no stated authority) and asks about points a source raises that the record leaves out.
5. **Holds the record until gaps are resolved or overridden with a written reason**, and logs every step in a tamper-evident review log.

## Why it is different

- **Same input, same answer, every time.** No AI model calls, so a result can be reproduced exactly for an auditor or a dispute.
- **Nothing leaves the building.** No network calls; records stay on the organisation's own systems, which matters for confidential AI governance material.
- **Shows its working.** Every result names the record sentence and the document sentence it relied on.
- **Never claims compliance.** It reports what a record shows; the legal judgment stays with the organisation and its advisers.

## Evidence to date

- **EU AI Act lens:** on two sets of fictional AI authorisation records whose answer keys were sealed before the code was run, the lens agreed with the key on 78 of 80 points (first set) and 38 of 40 (second set, after two fixes; 95% interval 84 to 99%), and in the second set credited no point that the record did not back up. Both sets were written by the developer, so these show the lens works as designed, not how it performs on others' records (`tests/ds-n1/EU_AI_ACT_EVAL.json`, `EU_AI_ACT_EVAL_2.json`).
- **Practitioner study (in progress):** 29 practitioners from an international panel completed a blind review of a fictional decision record; 20 of the 28 asked would not rely on it as written (95% interval 53 to 85%), while the prototype's locked answer passed it. This is reported as a finding.
- **Document reading:** on 26 developer test records it found 127 of 128 hand-identified claims (`tests/ds-n1/EXTRACT_EVAL.json`).
- **Engineering:** 180 automated tests pass; reports reproduce byte for byte.

## Limits, stated plainly

- Fictional records only today; real-record use is a licensing decision.
- Covers AI authorizations in every Annex III area, including recruitment, education, credit, insurance, housing, health, public benefits and justice (documentation quality only).
- Word-pattern checks can miss a point phrased in unexpected words (for example "checked by the safety officer" is not yet read as oversight).
- Article wording was checked against the European Commission's consolidated text (as at 27 July 2026) and stored word for word; the Official Journal PDF itself was not read.
- Reads plain text and Word (.docx) body text; PDF needs converting first.

## Ways to use it

| Option | For |
|---|---|
| Licence to embed in your product | AI governance, GRC and compliance software vendors serving EU customers |
| Single-organisation installation | AI governance, compliance and internal audit teams preparing for the high-risk obligations |
| Evaluation licence on fictional records | Anyone deciding whether it fits |

Contact: info@jrsstandard.com (to be replaced by a Decision Spellcheck address)
