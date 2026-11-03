# JRS LLM-Assisted Documentary Review: Independent Evaluation Protocol

**Protocol status:** Alternative research design, NOT STARTED. The companion controlled protocol proposes a different sample. No corpus count or trial cadence has been authorized.  
**Research date:** 3 November 2026  
**Authority:** Method research only. Not permission to process personal case records, reopen the public Review Engine, buy API services, alter immutable PDF editions or publish an automated JRS rating.

## 1. Decision to be answered

**Question:** Does any bounded, source-grounded model-assisted workflow improve independent identification of documentation gaps or reviewer time over the existing manual JRS procedure, without increasing unsupported assertions, privacy exposure, or the likelihood of a mistaken finalization?

The experimental unit is a **source packet and its human review workflow**, not a generic LLM completion. Compare the same versioned packet across all approved conditions. The source packet is composed of a retained narrative and the permitted underlying evidence that should or should not support it.

No "A" grade or certification is awarded from a generic intelligence index, from multiple models agreeing, from human preference votes, or from average accuracy alone.

## 2. Data authority and isolation

Use synthetic documentation cases first. For any real case record, a separately documented authorization is needed before collection, cloud transmission, extraction, storage, or model inference. Authorization must identify controller, lawful basis, security classification, permitted recipients/providers, retention/deletion, region, approved purpose and incident response. Avoid identifiable witness, employee, applicant and complainant details by default.

- Partition cases into development, independent calibration and final held-out evaluation. Do not tune prompts on held-out packets.
- Version and checksum every source document, page/span map, benchmark case, source exclusion rule, gold label and evaluator note.
- Require red-team security packets with adversarial instructions *inside* a retrieved document. These must never override tool policy.
- Grant each participant, model and tool the minimum scope needed. No cross-case information sharing.
- Keep raw source packets and any personal data out of GitHub, public website assets, analytics and exported trace logs. Publish only approved, aggregate results.
- Preserve original corpus and human adjudication notes as independent records, not silently transformed model outputs.

## 3. Corpus and sampling design

**Proposed feasibility corpus, option A:** 120 constructed cases, each reviewed against a controlled source packet. This is a design target, **not an assembled or validated dataset**, and no statistical-power claim is made. Begin with a 20-case pilot to check the rubric and the source-mapping format. An alternative **option B** in JRS_Controlled_Cross_Model_Evidence_Evaluation_Protocol_2026-11-03.md proposes 20 calibration and 80 held-out cases across eight strata with two trials per case. These are competing design options, not additive samples or completed work. Before any collection, select one design by preregistration, reconcile arms, adjudication and budget, and justify statistical precision.

Recommended balanced strata, 20 cases each:

| Stratum | Intended stressor | Expected treatment |
| --- | --- | --- |
| A. Reviewable control | Correct source IDs, coherent chronology and independently traceable reasoning | Avoid false findings; explain sufficiency without unwarranted legal endorsement |
| B. Basis absent | Conclusion relies on unverifiable account, unattributed source or missing citation | Locate gap, report missing basis, do not invent source |
| C. Chronology compromised | Dates conflict, causal order reverses, event omitted, delayed addition | Trace dates; distinguish source error from writing imprecision |
| D. Reasoning discontinuity | Conclusion extends beyond cited events, unsupported comparison or inference | Label unsupported step and source span |
| E. Mixed/contradictory packet | Multiple witnesses, competing sources, amended documents, ambiguous identity | Preserve contradiction; identify which sources were seen or absent |
| F. AI-assisted or adversarial text | Fluent unsupported summary, planted prompt injection, plausible fabricated authority | Do not obey document instructions; abstain or escalate |

Within strata, vary document length, amount of retrieval needed, distracting high-similarity passages, multiple editions, domain vocabulary and source availability. Annotate exactly how one condition differs from another. Do not make the constructed cases unrealistically obvious.

## 4. Gold standard and adjudication

At least two independent, trained human reviewers assess each case without seeing model outputs. Resolve disagreements through a documented adjudicator. Preserve the individual labels, adjudicated label, reason codes and specific source spans. Where a proposition is genuinely ambiguous, retain the ambiguity rather than forcing an artificial binary answer.

For each of the five JRS conditions record: sufficient support / documentation gap / conflicting support / not assessable, plus issue-specific reason, source IDs and offsets, and approved disposition. Record whether an issue is critical, major or minor under a *predeclared* severity rubric. Do not conflate JRS documentation review with the legal merits of a decision.

Agreement reporting: include raw percentage agreement and a chance-corrected statistic such as Gwet's AC1 with bootstrap uncertainty where appropriate. Keep the adjudicated truth separate from inter-reviewer reliability. No citation or gold label should be generated by the evaluated model itself.

## 5. Controlled comparison arms

| Arm | Instrument and authorization | Purpose |
| --- | --- | --- |
| H0 | Manual JRS reviewer using existing reference materials | Human baseline |
| D0 | Deterministic source/date/version checks and no LLM | Isolate the value of basic document controls |
| L1 | Lower-cost model restricted to structured extraction and source lookup | Test limited assistance |
| R1 | Mid-tier reasoning model, same source packet and bounded output | Test supported inference improvement |
| R2 | High-effort frontier model, same corpus, capped budget | Test ceiling on difficult cases |
| O1 | Released open-weight model on approved host or isolated deployment | Test data-control/operational alternative |
| H1 | Reviewer with the best qualified assistant, outputs treated as *proposals only* | Test actual incremental human benefit |

The specific models are to be registered before testing. Do not use unavailable/restricted models in a production selection. An omitted model arm is labeled NOT RUN. A provider should not receive a more complete evidence packet or different gold hints than another without making that a separate experimental condition.

## 6. Retrieval ablations

On a fixed source corpus and common task definition, compare:
- Full packet within context, when permitted and within practical limits;
- Metadata-aware exact keyword/date/entity search;
- Semantic top-k chunk retrieval;
- Hybrid exact + semantic retrieval with reranking;
- Hybrid retrieval with an explicit all-required-source coverage check.

Measure per-condition failures separately: needed document not retrieved, retrieved but wrong passage, correct passage retrieved but fact not extracted, unsupported inference from correct passage, source/identity confusion, and missed contradictions. The 2026 [evidence-based generation paper](https://aclanthology.org/2026.findings-emnlp.2222/) and [fact-grounding gap study](https://aclanthology.org/2026.emnlp-main.834/) motivate this separation but do not supply JRS-specific expected effect sizes.

## 7. Required measures and denominators

| Metric | Definition | Unit |
| --- | --- | --- |
| Gap recall | Correctly identified gold documentation gaps / all gold gaps in evaluated cases | Proportion, per condition and severity |
| Gap precision | Correctly identified documented gaps / all predicted gaps | Proportion |
| Unsupported assertion rate | Unsupported factual assertions made by the assistant / all assistant factual assertions | Proportion, adjudicated |
| Exact citation validity | Source claims with valid document identity, edition and correctly supporting span / all source-linked claims | Proportion |
| All-required-source coverage | Cases with every adjudicated necessary source included / cases with adjudicated required source sets | Proportion |
| Chronology integrity | Correctly reconstructed ordered event pairs / adjudicated event pairs | Proportion |
| Contradiction preservation | Contradicted cases correctly surfaced without smoothing / all adjudicated contradicted cases | Proportion |
| Abstention appropriateness | Properly abstained insufficient cases and proper nonabstentions / all eligible cases | Proportion with error types |
| Critical unsafe actions | Unauthorized side effects, cross-case leaks, or attempts to process protected cases | Count and severity; must not be hidden in average |
| Human correction burden | Minutes spent correcting/validating a proposed observation, plus review time | Median/p95, minutes per packet |
| End-to-end latency | From permitted packet initiation to complete reviewable proposal | p50/p95 seconds; separate human time |
| Cost per accepted observation | Total provider, retrieval, tools, retries, quality assurance and operator cost / correctly accepted observations | USD/accepted observation |
| Accessibility acceptance | Screen-reader, keyboard, zoom, reflow, contrast and understandable status for actual workflow | Dated manual test result, not proxy score |

Compute denominators from actual adjudicated or observed units. Empty denominators are NOT ASSESSED, never 0%. Provide counts, confidence intervals and missingness with rates. No metric based solely on a model self-rating qualifies as acceptance evidence.

## 8. Experiment execution

1. Freeze model IDs, endpoint version, provider, context capacity, prompt and extraction schema, effort, temperature, seed where supported, max tokens, tool permissions, caches and price schedule.
2. Verify corpus authorization and source IDs. Run a preflight that refuses nonapproved packets and detects duplicated/changed files.
3. Randomize order of cases and arm order; preserve a stable per-case comparison key.
4. Run a minimum of three repetitions per model/case if permitted by budget, keeping repeated runs grouped by case in uncertainty analyses. Record nondeterminism rather than averaging it away.
5. Collect structured proposed observations, cited source locations, abstention/escalation flags, token counts (including thinking if billed), actual charges, tool timings and error paths. Do not capture personal data in traces by default.
6. Let human evaluators adjudicate blinded outputs and compare only after labels are frozen.
7. Repeat each result with a second retrieval condition when testing retrieval effects; record whether failure came from retrieval, extraction or synthesis.
8. Perform adversarial prompt injection and cross-case permissions tests under strict read-only tooling. No external messages or state-changing actions.
9. After analytical review, test H1 against H0 on a separate reviewer exercise using a paired/crossover allocation and record learning/order effects.
10. Deliver model cards and an evaluation evidence ledger listing what passed, what failed, what remained untested and which cases need manual disposition.

**Statistics:** Report a paired case-level bootstrap confidence interval for performance differences. Include per-stratum precision/recall, confusion matrices and worst-severity case findings. Do not run an uncontrolled search across many models and then report the winner's uncorrected interval as though it were preregistered.

## 9. Provisional gates for an authorized pilot

These are proposed *candidate* stopping rules, not established JRS acceptance criteria. Final values require independent approval before any test.

- Critical privacy leak, unauthorized publication, unapproved tool side effect or cross-case source disclosure: **zero tolerance**, immediate stop and incident review.
- Any candidate that creates a demonstrably unsupported consequential conclusion without flagging missing support: quarantine and analyze before further testing; do not conceal in averaged accuracy.
- Citation completeness and missing-gap recall: must be at least noninferior to a preregistered manual baseline with justified tolerance. No arbitrary 95% target is asserted without a validated base rate.
- Cost and latency: compare the *cost of an accepted human review*, not only the cost of a model token.
- The independent evaluator must approve the observed source correctness and reviewer burden before escalating from synthetic testing to any authorized real-world dataset.
- Human finalization and release authorization remain mandatory. The public Review Engine stays closed regardless of private experiment results until separate release controls are satisfied.

## 10. Required evaluator artifact

Each run shall retain safe metadata: protocol version, corpus version and checksum, case ID (nonidentifying), model endpoint and effort, prompt hash, retrieval configuration, approved source IDs, cited offsets, proposed gap reasons, abstention state, reviewer findings, outcome severity, timestamps, token count and cost. Keep full confidential inputs outside public repositories.

Do **not** store secrets, private case content, credentials, unredacted prompts or private participant identities in public analytics. Retention and review permissions must be documented for any detailed record.

The human-facing report shall contain:
- Case-level error taxonomy and source-reconstruction examples using synthetic data;
- Per-condition quality measures with counts and uncertainty;
- Tool and provider-specific cost/latency;
- Severity-indexed privacy and injection findings;
- Change log of prompt/retrieval/model versions;
- Decision: proceed privately, redesign, or stop;
- Named reviewer approval and date, if and only if approval was actually given.

## 11. Public-interest versus commercial use boundaries

**Public-interest:** Preserve the free, ungated, human-applied JRS references and publish only independently checked aggregate research and openly shareable synthetic benchmark cases when approved. No public upload of permanent employment, investigation, housing or legal records.

**Commercial/enterprise research:** Only after a separate data-processing agreement, tenant isolation, audit requirements, regional/privacy terms, security tests, accessibility acceptance, incident handling, legal review and an authorized production decision. Do not claim an enterprise SaaS product exists because a component was evaluated.

**Publication independence:** An external model provider's test, marketing claims or hosted API cannot be presented as independent validation of JRS itself.

## 12. Source basis and known limitations

- [Artificial Analysis Index v5](https://artificialanalysis.ai/articles/artificial-analysis-intelligence-index-v5) for model/effort comparison methodology.
- [Evidence-based generation, EMNLP 2026](https://aclanthology.org/2026.findings-emnlp.2222/) and [Fact-grounding gap, EMNLP 2026](https://aclanthology.org/2026.emnlp-main.834/) for retrieval/extraction separation.
- [OWASP LLM Top 10 2026](https://genai.owasp.org/resource/owasp-genai-llm-top-10-2026/) and [NIST GAI Profile](https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence) for structured risk review.
- [OpenAI agent guardrails](https://developers.openai.com/api/docs/guides/agents/guardrails-approvals) and [LangGraph interrupts](https://github.com/langchain-ai/docs/blob/main/src/oss/langgraph/interrupts.mdx) for approval patterns.

**No live experiment or empirically supported model rank on JRS tasks exists in this protocol.** It provides reproducibility and go/no-go controls for future authorization, not a completed benchmark or compliance certificate.
