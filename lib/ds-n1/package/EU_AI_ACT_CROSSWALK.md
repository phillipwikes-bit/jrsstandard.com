# Decision Spellcheck for the EU AI Act: what the lens checks

Date: 25 November 2026. Lens version `ds-n1.eu-ai-act/0.2.0-dev` (`lib/ds-n1/eu-ai-act.mjs`).

**What it is.** For a record that authorises an AI system to act, the lens reports, point by point, whether the record states what the EU AI Act expects a deployer to be able to show, whether a source document backs that statement up, and what to ask where it does not.

**What it is not.** It is not a legal assessment. It does not decide whether a system is high-risk, does not show that any organisation complies with the AI Act, and does not change Decision Spellcheck's review status. Every result names the record sentence and the document sentence it relied on, so a person can check it.

## The ten points

| Lens point | Article (Regulation (EU) 2024/1689) | What the record is checked for |
|---|---|---|
| `risk_classification` | Article 6 and Annex III | Whether the system is stated to be high-risk or not |
| `instructions_for_use` | Article 26(1) | Use in line with the provider's instructions for use |
| `human_oversight` | Article 26(2), Article 14 | Who oversees the system, by name or role |
| `oversight_competence` | Article 26(2) | Training, competence or authority of the overseers |
| `stop_or_override` | Article 14(4)(d) and (e) | A way to override, reverse or stop the system |
| `monitoring` | Article 26(5) | Who monitors operation; incident reporting to the provider |
| `log_retention` | Article 26(6) | Logs kept, and for at least six months (shorter periods are flagged) |
| `workers_informed` | Article 26(7) | Workers and their representatives told before workplace use (only where the record states high-risk use at the workplace) |
| `affected_persons_informed` | Article 26(11) | People the system decides about are told (only where the record states a high-risk system deciding about people) |
| `ai_literacy` | Article 4 | Staff trained in the system |

Each point is reported as **shown and backed by a document**, **stated without a backing document**, **not shown**, or **not applicable**.

## Sources and their status

- **Official text.** Every article above was checked on 25 November 2026 against the European Commission's AI Act Service Desk, which publishes the consolidated "version of the AI Act as at 27 July 2026", including the Digital Omnibus amendments (for example [Article 26](https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-26), [Article 14](https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-14), [Article 4](https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-4), [Article 113](https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-113)). The paragraphs used are stored word for word in `eu-ai-act-official-text.json`. EUR-Lex itself refuses automated reading, so the Official Journal PDF was not read directly.
- **Amendments that matter here.** Articles 14 and 26 are unchanged by the Omnibus. **Article 4 was amended**: deployers must now "take measures to support the development of AI literacy" of their staff, and the Article states it "does not require providers or deployers to guarantee any specific level of AI literacy". The lens's wording follows the amended text.
- **Dates (Article 113(c), as amended).** The high-risk obligations, including Article 26, apply from **2 December 2027** for systems that are high-risk under Article 6(2) and Annex III, and from **2 August 2028** for those under Article 6(1) and Annex I.

## Evidence

| Test | Result | File |
|---|---|---|
| Set 1: 8 fictional records, answer key sealed before the lens code existed (commit `e1967a24`) | 78 of 80 points agree with the key (lens 0.1.0); 1 point wrongly credited as backed ("training director" read as training); 1 not recognised (job applications as decisions about people) | `tests/ds-n1/EU_AI_ACT_EVAL.json` |
| Set 2: 4 new records, sealed before the two fixes were run (commit `238292c3`) | 38 of 40 agree (lens 0.2.0; Wilson 84 to 99%); 0 points wrongly credited; 2 misses, both one phrasing ("checked by the safety officer" not read as oversight) | `tests/ds-n1/EU_AI_ACT_EVAL_2.json` |

Both sets were written by the developer who wrote the lens, so agreement is expected to be high; it shows the lens behaves as designed, not how it performs on other people's records. An outside author's set is the next test (`RECORD_AUTHOR_BRIEF.md`).

## Scope: Annex III areas covered (owner decision, 25 November 2026)

AI authorization records may now concern any Annex III area, including employment, credit, insurance, housing, health and justice. Before this decision such records were refused as excluded domains, which meant, for example, a fictional tenancy-screening record (set 2, F2) never reached the lens. The check remains documentation quality only, on constructed fictional records; the identifier screen still applies; and every other record class still refuses those domains. Tests cover a credit-scoring, an insurance-pricing and a tenancy-screening authorization end to end (`tests/ds-n1/eu-ai-act.test.mjs`). Opening the areas changed no sealed result except that F2 is no longer refused.
