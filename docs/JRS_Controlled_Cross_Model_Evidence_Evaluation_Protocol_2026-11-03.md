# JRS Controlled Cross-Model Evidence Evaluation Protocol

**Working protocol:** 0.1, 3 November 2026  
**Status:** Proposed design, not an executed test.  
**Authority:** Research only. No external model calls, private document transfer, expenditure, production change or Review Engine activation is authorized by this protocol.

## 1. Research question

Does bounded LLM assistance improve the detection, evidentiary traceability and correction of missing documentation compared with the established manual JRS reviewer workflow, while preserving appropriate abstention and human responsibility? Performance on generic model leaderboards is not a substitute for this test.

### Unit of analysis

The unit is one **synthetic or separately authorized, deidentified record packet**: a draft consequential record, its versioned reference sources, a documented chronology, stable source/span identifiers, an annotation task and a human-adjudicated expected result. The unit is not a person, a legal claim or a litigation outcome. Keep all real case content out of public issue trackers, model API calls and website telemetry without separate explicit authorization.

## 2. Corpus and gold evidence

**Proposed, not collected:** 20 calibration cases and 80 held-out cases, 10 in each of eight strata:

1. Adequately sourced complete control records;
2. Unsupported generalizations;
3. Missing, excluded or misattributed source;
4. Contradictory dates and broken chronology;
5. Inference without an identifiable reasoning trail;
6. Conflicting witness/comparator evidence;
7. Superseded editions or wrong documentary identity;
8. AI-polished narratives and adversarial source instructions.

Two qualified reviewers independently annotate each case using the five JRS conditions: reconstructability, identifiable basis, chronology, reasoning trace, sufficiency. For each expected gap, record source document ID, edition, page/line span, exact missing or contradictory element and acceptable disposition. Record disagreements and adjudication. Reserve entire *templates* for held-out evaluation to limit memorization.

## 3. Study arms

| ID | Comparator | Scope |
| --- | --- | --- |
| H0 | Manual reviewer using JRS | Baseline accuracy, traceability and reviewer time |
| D0 | Deterministic no-LLM source/edition/chronology checking | Mechanical baseline; does not make conclusions |
| M1 | Low-cost extraction model | Source identification and structured extraction only |
| M2 | Mid-tier reasoning model | Bounded source-linked observations and abstention |
| M3 | High-effort reference model | Same task and evidence packet at controlled effort |
| R1 | Hybrid retrieval plus one pinned model | Exact/date/identifier and semantic retrieval with source-coverage verification |

For any model: freeze provider, endpoint, exact model ID and snapshot, model effort, prompt version/hash, output schema, max input/output, tool permissions, inference settings, location, retry and timeout policy. Do not call a restricted or unreleased model a failed model. Hold document corpus constant across comparable arms. Register a changed denominator rather than fabricating missing runs.

**Proposed design:** Two trials per held-out packet and automated arm, which would be up to 800 model runs for five automated arms (80 times 5 times 2) before retries or calibration. This is a planning quantity and cost liability, not work already performed. Obtain separate budget and data approval before executing.

## 4. Structured record of a model suggestion

Each model-assisted observation must include:

- Synthetic packet ID, packet edition, run ID, model snapshot, prompt/version hash;
- Exactly one of five JRS review conditions;
- Evidence state: SUPPORTED, INSUFFICIENT, CONFLICTING, UNAVAILABLE or NOT_ASSESSED;
- Proposed observation, with specific source IDs, document edition and page/line spans;
- Contrary sources or required missing sources;
- Proposed route: CORRECTION, SECOND_LINE_REVIEW, NO_GAP_IDENTIFIED or ABSTAIN;
- Retrieval record containing safe source IDs and spans, not raw confidential contents;
- Token, latency, tool and cost metadata;
- Human disposition set to UNDECIDED until the qualified reviewer acts.

A deterministic checker must reject nonexisting source IDs, mismatched editions, unverifiable spans, contradictions omitted from definitive conclusions, and unauthorized tool actions. Neither model nor validator may finalize a permanent record.

## 5. Metrics and denominators

| Measure | Definition | Important interpretation |
| --- | --- | --- |
| Complete-required-source recall | Cases retrieving every gold-required source divided by cases requiring multiple sources | More demanding than top-k relevance |
| Source recall | Required source IDs retrieved divided by all required source IDs | Missing documents must not be hidden |
| Claim support precision | Supported material generated claims divided by all material generated claims | Count unsupported assertions explicitly |
| Documentation-gap recall | True identified annotated gaps divided by all gold gaps | Report separately for each JRS condition |
| False-gap rate | Adequate cases incorrectly flagged divided by all adequate cases | Captures over-escalation |
| Unsupported-conclusion rate | Completed outputs with at least one unsupported affirmative conclusion divided by completed outputs | Key safety outcome |
| Abstention precision and recall | Correct vs incorrect abstentions under missing or contradictory evidence | Measure both omission and over-abstention |
| Chronology integrity | Incorrect date or sequence assertions divided by testable time assertions | Track source and year mismatches |
| Version identity defects | Wrong-edition citations divided by version-dependent citations | Do not conflate with text similarity |
| Reviewer correction burden | Median and p90 minutes to verify, correct or reject the proposal | Include human cost in model economics |
| Latency and cost | End-to-end p50/p95, total paid tokens including reasoning, retrieval, retries, hosting and review | One-pass nominal API pricing is insufficient |
| Security/privacy failure | Count and description of unauthorized source access, tool side effects and sensitive logs | Separate absolute go/no-go gate |

Publish paired comparisons and appropriate interval estimates with denominators. A synthetic or small convenience sample does not validate real organizational deployment. Describe inter-reviewer agreement and how conflicts were adjudicated.

## 6. Ablations

Test one change at a time: exact retrieval versus semantic retrieval versus hybrid; full document versus chunked document versus metadata-preserving chunks; citations without and with deterministic span verification; source-coverage checks off versus on; low versus high inference effort within one pinned model. Preserve underlying record versions and annotations across ablations.

The retrieval literature distinguishes missing retrieval from failure to extract facts already retrieved. The study must classify these as separate error types, along with contradictions and unsupported inference. See the October 2026 EMNLP papers:
- https://aclanthology.org/2026.findings-emnlp.2222/
- https://aclanthology.org/2026.emnlp-main.834/

## 7. Mandatory security controls

All retrieval is read-only and permission-filtered. Treat document text as untrusted data, not instructions. Disallow external callbacks, unapproved writes, email actions and model-initiated publication. Configure sensitive tracing to be disabled or explicitly privacy-reviewed. Prompt injection, cross-tenant access, data egress, source mixups and tool misuse should be tested using only synthetic cases. Stop and record any critical failure rather than averaging it with higher output quality.

Current reference editions:
- OWASP Top 10 for LLM Applications **2026**: https://genai.owasp.org/resource/owasp-genai-llm-top-10-2026/
- OWASP Top 10 for Agentic Applications: https://genai.owasp.org/2025/12/09/owasp-genai-security-project-releases-top-10-risks-and-mitigations-for-agentic-ai-security/
- NIST AI RMF Generative AI Profile, voluntary: https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence
- Agents tracing documentation: https://openai.github.io/openai-agents-python/tracing/

## 8. Decision and acceptance stages

**Stage 0, approval:** Data rights, providers, terms, budget and confidentiality reviewed. No real-case upload by default.

**Stage 1, annotation:** Qualified reviewers create and adjudicate the held-out source/claim gold set; verify source spans and edition identities.

**Stage 2, instrumentation:** Verify the pipeline rejects a deliberately missing source, wrong edition, hostile instruction and unauthorized side-effect call.

**Stage 3, controlled execution:** Run eligible arms on identical approved packets; preserve failed, timed-out, incomplete and retried runs in the denominator.

**Stage 4, blind human review:** Reviewers inspect evidence, record correction burden, and accept, amend or reject observations without being shown the provider label.

**Stage 5, synthesis:** Publish model-specific source-coverage, traceability, abstention, false gap, security, p95 latency and audited cost results with uncertainty and the adjudication record. Decide separately whether any private prototype merits progression.

**Stage 6, separate release:** Any later public or enterprise deployment requires independent accessibility, security, privacy, publication and owner-release acceptance. This study cannot authorize a public Review Engine.

## 9. Non-claims

This document does not prove that one model performs better on JRS records, establish commercial viability, demonstrate a security guarantee, certify legal sufficiency, show user adoption, or qualify a public deployment. The website and PDF release hold remains independent of this research.
