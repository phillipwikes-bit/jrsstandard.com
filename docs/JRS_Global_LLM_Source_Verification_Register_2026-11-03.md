# Source Verification Register: Global LLM Benchmark

**Review date:** 3 November 2026  
**Purpose:** Confirm, qualify or withhold claims in the JRS global LLM research record.  
**Status:** Documentary source review. No API executions, vendor trials, JRS cross-model results or live security verification performed.

## Decision and evidence hierarchy

Each source item has a different evidentiary function. **Independent benchmarks** support only the capabilities tested on that benchmark's tasks, dates, effort setting and provider route. **Vendor documentation** supports published model availability, interfaces, listed prices and license assertions, not actual performance or compliance. **Peer-reviewed research** provides findings within the stated datasets, not measured effects on JRS records. **JRS proposals** are hypotheses and must not be described as shipping controls.

| ID | Claim or comparison | Best directly inspected source | Finding | Verification status and qualification |
| --- | --- | --- | --- | --- |
| S01 | Artificial Analysis Intelligence Index v5 uses four equal domain weights and majority held-out evaluation | https://artificialanalysis.ai/articles/artificial-analysis-intelligence-index-v5 (27 Oct 2026) | Four domains each 25%; 60% private or held-out. On launch Opus 5.5 max 58, Astra max 57, Sol max 55. | **Verified against independent publisher.** Composite is not JRS accuracy and must not be compared across v4.3/v5 as if identical. |
| S02 | Gemini 4 Carbon high rises to 59 on a later index snapshot | https://artificialanalysis.ai/models/releases/comparisons | Carbon high 59, Opus max 58; release comparison explicitly notes no publicly available API for Carbon in that view. | **Verified within comparison snapshot, restricted deployment.** Do not infer ordinary API access or reverse a 27 Oct launch article without recording the snapshot. |
| S03 | OpenAI Sol/Terra/Astra/Luna standard API rates | https://developers.openai.com/api/docs/models and https://developers.openai.com/api/docs/pricing | Astra $10/$50; Sol $2/$10; Terra $1/$5; Luna $0.10/$0.50, per 1M text input/output tokens in standard pricing. | **Vendor-published, verified; dynamic and mode-dependent.** Pricing tables also offer Batch/Flex and Fast/Ultrafast tiers, caching, context and location premiums. No cost/quality result. |
| S04 | Claude Sonnet 5.5 and Opus 5.5 prices/capabilities | https://platform.claude.com/docs/en/models/sonnet-5-5/overview and https://platform.claude.com/docs/en/about-claude/pricing | Sonnet $2/$10, Opus $4/$20 per million; published 1M context. Sonnet adaptive-thinking output behavior has changed. | **Vendor-published, verified; version-sensitive.** Performance and context do not establish full-source traceability. |
| S05 | Gemini 4 Argon current availability and upcoming introductory-rate expiry | https://ai.google.dev/gemini-api/docs/latest-model and https://ai.google.dev/gemini-api/docs/pricing | Developer API; $2/$10 through 30 Nov 2026, scheduled $4/$20 from 1 Dec; billed thinking/tool tokens where applicable. | **Vendor-published, verified; date-limited.** No inference that Carbon API has the same access as Argon. |
| S06 | Mistral Large 4 weights and license | https://huggingface.co/blog/mistral-large4 (29 Oct) and https://mistral.ai/it/news/mistral-large-4-oss/ | Model weights released, Mistral Ecosystem Open-Weight License, with a separate commercial license condition for model-as-a-service use. | **Primary source, verified at license-summary level.** Production commercial legal terms must be inspected in full. Hugging Face describes ~49B active parameters whereas some Mistral documentation describes ~52B: hardware sizing must rely on the exact checkpoint, not mixed summaries. |
| S07 | Mistral Large 4 *price* | https://mistral.ai/it/news/mistral-large-4-oss/ and https://docs.mistral.ai/models/mistral-large-4-0 | Launch price $0.70/$2.10 per MTok; another official page renders $1.36/$4.18 and other current pages display sale/discounted $0.68/$2.09. | **Verified source conflict or rate presentation difference.** Label $0.70/$2.10 as launch/discounted rate, not enduring standard. Illustrative 1,000-request totals: $18.20 at launch rate; $35.56 at $1.36/$4.18; $17.78 at $0.68/$2.09. Obtain a dated, exact-endpoint quote before procurement. |
| S08 | DeepSeek V4.1 Flash 1017 weight access and MIT license | https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash-1017 and https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash-1017/blob/main/LICENSE | Public model page identifies released safetensors and MIT license. | **Repository/primary license, verified.** No proof that deployment is affordable on available hardware, secure, or meets review metrics. |
| S09 | OWASP LLM Top 10 edition | https://genai.owasp.org/resource/owasp-genai-llm-top-10-2026/ (3 Aug 2026), https://genai.owasp.org/2026/09/01/owasp-genai-security-project-unveils-2026-top-10-for-llm-applications-new-agent-control-standard-and-sponsors-as-community-tops-30000-members/ | The **2026** publication supersedes the previously cited 2025 Top 10 as the current OWASP LLM application-security guide. | **Verified major version correction.** Retain 2025 for historical mapping only; do not copy its risk ordering into the 2026 edition without checking. Neither is a certification of a JRS implementation. |
| S10 | RAG chunking can obscure the necessary full evidence set | https://aclanthology.org/2026.findings-emnlp.2222/ (Oct 2026, EMNLP Findings) | Study tested eight proprietary and three open-weight LLMs; missing required chunks and lost document context affected grounding even when some relevant text was retrieved. | **Peer-reviewed paper, verified within its experiments.** Motivates JRS source-coverage test, not proof that a proposed hybrid system improves outcomes. |
| S11 | Retrieved material can fail at *fact extraction* | https://aclanthology.org/2026.emnlp-main.834/ (Oct 2026, EMNLP) | Extraction failures account for nearly half of per-hop deficiencies in the authors' multi-hop QA tests and are not resolved by retrieval-only interventions. | **Peer-reviewed paper, verified within its datasets.** Distinguish missing retrieval from failed extraction in any JRS experiment. |
| S12 | Agents SDK traces can contain sensitive source material | https://openai.github.io/openai-agents-python/tracing/ | Generation and function spans may hold input/output; trace_include_sensitive_data defaults true; processors can export batches. | **Primary SDK documentation, verified.** Prior to a sensitive-data test, configure redaction or disable tracing and review logging/retention. A source-linked audit trail should contain approved metadata, not unnecessary record content. |
| S13 | vLLM caching is an inference optimization, not a confidentiality boundary | https://docs.vllm.ai/en/stable/design/prefix_caching/ and https://docs.vllm.ai/en/latest/cli/serve/ | Prefix reuse is enabled/configurable; docs warn a noncryptographic hash option can create theoretical multi-tenant disclosure hazards. | **Primary documentation, verified.** Hosting requires separate tenant isolation, secure cache policy and access tests. |
| S14 | NIST generative-AI profile | https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence | July 2024, voluntary companion profile to AI RMF. | **Verified.** A reference for governance, not a compliance certification. |
| S16 | Meta Wonder, Spark Open and Glimmer deployment distinction | https://dev.meta.ai/models/muse-wonder and https://dev.meta.ai/docs/models | Wonder is a hosted Model API product; Wonder Full uses a separate Muse Code subscription. Spark Open and Glimmer are identified as downloadable, locally served model families. | **Primary provider documentation, verified.** Do not describe Wonder Full as a general API endpoint or imply Wonder's weights are available for local inference. |
| S15 | Public chatbot/agent UX implies a specific JRS experience | Vendor UI guides / source-citation docs | Citation chips, tools, progressive results and approvals are documented patterns, not demonstrated JRS conversion or usability improvements. | **Partial, design hypothesis.** Requires user observation, screen-reader review and measured completion time. |

## Reconciled cost audit

All amounts below are **USD for one hypothetical workload**, not a vendor quote: 1,000 operations × (20,000 uncached billed text input tokens + 2,000 billed output tokens). At these fixed assumptions total USD = 20 × input price per million + 2 × output price per million.

| Rate scenario | Input | Output | Computed cost | Classification |
| --- | ---: | ---: | ---: | --- |
| OpenAI Luna Standard | $0.10 | $0.50 | $3.00 | Vendor standard |
| DeepSeek sample endpoint | $0.30 | $1.20 | $8.40 | Third-party provider comparison; reconfirm |
| Mistral Large 4 sale | $0.68 | $2.09 | $17.78 | Sale view; dynamic |
| Mistral Large 4 launch | $0.70 | $2.10 | $18.20 | Launch announcement |
| OpenAI Terra Standard | $1.00 | $5.00 | $30.00 | Vendor standard |
| Mistral Large 4 undiscounted view | $1.36 | $4.18 | $35.56 | Official documentation view, conflicting rate presentation |
| OpenAI Sol / Claude Sonnet / Gemini Argon intro | $2.00 | $10.00 | $60.00 | Separate provider rates; not equivalent quality |
| Anthropic Opus | $4.00 | $20.00 | $120.00 | Vendor standard |
| OpenAI Astra | $10.00 | $50.00 | $300.00 | Vendor standard |

**Exclusions:** additional reasoning/thinking tokens, caches, cache writes, tool calls, region, long context, batch/priority modes, open-weight infrastructure, retry/error rates and reviewer time. Because actual quality is unmeasured on JRS cases, no Pareto-efficient model can be declared.

## Explicit limitations / follow-ups

1. **Independent model scores are not correlated with JRS findings.** A composite score and price-per-token are valid comparison attributes, not task-specific effectiveness estimates. Do not combine them into a numerical A-grade without controlled JRS accuracy.
2. **Price pages are mutable.** Record publication/update date, model ID, named tier, region and exact request size before using a quote. Contradictory display states must be noted, not silently harmonized.
3. **Open-source, open-weights and hosted-access are distinct.** Require the actual license and inference-serving conditions before the system-selection recommendation.
4. **Security references require edition control.** Map controls to OWASP **2026**; use NIST AI 600-1 for voluntary risk management and OWASP agentic controls for tool side effects.
5. **Source-grounded UX needs human testing.** No cited platform establishes that source highlighting or reviewer correction panels make JRS records more reconstructable without testing.
6. **Research branch only.** This ledger is not evidence that a model has been deployed, evaluated, integrated into the Review Engine or certified for use.

## Release and verification boundary

The user-facing public JRS website, protected owner dashboard, original publication PDFs and local-only Review Engine are outside the scope of this research write. Any later implementation requires its own approved requirements, gold dataset, privacy/security plan, separate candidate branch, versioned evaluation evidence and release authorization.
