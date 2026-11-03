# Global LLM Ecosystem Benchmark and JRS Architecture Implications

**Evidence date:** 3 November 2026  
**Scope:** Frontier proprietary models, released and scheduled open-weight models, inference and orchestration frameworks, retrieval, governance, cost/latency, and user-interface patterns.  
**Status:** External literature and vendor-documentation review. No new model has been tested on a JRS record corpus, no latency experiment performed, no independent platform accessibility audit conducted, and no implementation authorized by this report. Source reconciliation is maintained in the [verification register](JRS_Global_LLM_Source_Verification_Register_2026-11-03.md), with a separate [controlled evaluation protocol](JRS_Controlled_Cross_Model_Evidence_Evaluation_Protocol_2026-11-03.md).

## Executive assessment

The unit of comparison for consequential-documentation review is the **complete, inspectable process**, not the language model alone. A powerful model can draft persuasive text while failing to identify every necessary source, preserve chronology, notice contradicted evidence, or abstain when support is missing. A capable system must preserve record identity and the human review boundary.

**Priority recommendation:** Maintain the public JRS method as a human-applied standard. If model assistance is later authorized, prototype it privately with a read-only source manifest, combined exact and semantic retrieval, explicit missing-source states, deterministic source/span validation, a limited model-assisted observation stage, and a retained human acceptance decision. Do not turn the JRS Review Engine into an autonomous grading or case-management service.

The highest-value innovation is a **reconstruction coverage instrument**: every observation must identify the exact source material that supports it, specify missing or conflicting support, and show how its disposition was decided. The evidence state is more meaningful than an unsupported confidence percentage.

## 1. Scope and evidence classes

- **Independent benchmark:** Third-party measured capability within a stated test suite, release date and effort configuration. It is not a JRS accuracy score.
- **Vendor claim or model card:** Published feature, pricing, access or license statement, not a third-party reliability determination.
- **Research study:** Findings subject to the authors' datasets and methods.
- **Proposed JRS control:** Design hypothesis or test specification, not a shipped feature.
- **Not assessed:** No evidence from this review. Missing values may not be converted to zero or PASS.

Models, model-hosting endpoints, user interfaces, retrieval engines, orchestration frameworks and security controls are separate products and must not be treated as equivalent competitors. API access does not establish access to weights. Weight release does not establish a deployable, licensed, secure service.

## 2. Frontier model benchmark

The [Artificial Analysis Intelligence Index v5](https://artificialanalysis.ai/articles/artificial-analysis-intelligence-index-v5), launched 27 October 2026, distributes its composite weight evenly across knowledge work, coding, science and general tasks. Sixty percent of the index uses private or held-out test sets. It is a meaningful broad independent reference but it was not developed to score JRS documentary traceability.

| Model/configuration | Independent composite score, rounded | Availability and economics | Implication for JRS research |
| --- | ---: | --- | --- |
| Gemini 4 Carbon, high | 59 in later comparison snapshot | Restricted/phased access. Different from public Gemini 4 Argon. [AA comparison](https://artificialanalysis.ai/models/releases/comparisons) | Upper-bound research reference, not assumed deployable |
| Claude Opus 5.5, max | 58 | Proprietary API. Standard $4 input / $20 output per million tokens. [Anthropic](https://www.anthropic.com/claude-opus-5-5) | High-effort baseline for hard cases |
| GPT-6 Astra, max | 57 | Proprietary API. $10 / $50. [OpenAI](https://developers.openai.com/api/docs/models) | Frontier reference, potentially costly |
| GPT-6.1 Sol, max | 55 | Proprietary API. $2 / $10. [OpenAI](https://developers.openai.com/api/docs/models) | Mid-cost reasoning comparator |
| Claude Sonnet 5.5, high/max dependent | 54 | Proprietary API. $2 / $10. [Anthropic](https://platform.claude.com/docs/en/models/sonnet-5-5/overview) | Balanced document-work comparator |
| GPT-6.1 Terra, max | 51 | Proprietary API. $1 / $5. [OpenAI](https://developers.openai.com/api/docs/models) | Bounded extraction comparator |
| Gemini 4 Argon, high | 50 | Developer API. Introductory $2 / $10 through 30 Nov 2026; scheduled $4 / $20 thereafter. [Google](https://ai.google.dev/gemini-api/docs/latest-model) | Available comparator, time-limited rates |
| Kimi K3.1 Pro | 46 | API-accessible; weights announced for 4 Nov, **after** cutoff. [Reuters](https://www.reuters.com/technology/moonshot-curbs-hacking-ability-new-kimi-model-fears-grow-over-ai-powered-2026-10-24/) | Do not classify as fully downloadable yet |
| DeepSeek V4.1 Flash 1017 / GLM-5.3 | 32 / 32 | Released-weight alternatives in the cited snapshot. [AA](https://artificialanalysis.ai/models/comparisons/deepseek-v4-1-flash-1017-vs-glm-5-3) | Compare private/hosted execution, not assumed performance parity |

These are index points, **not accuracy percentages**. The initial v5 article predates the later Carbon result. Effort settings can substantially change performance and cost. Human preference in the [Arena text leaderboard](https://arena.ai/leaderboard/text) is not an evidentiary correctness or missing-source detection metric.

### Open-weight differentiation

| Candidate | Established status | Important constraint |
| --- | --- | --- |
| [DeepSeek V4.1 Flash 1017](https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash-1017) | Weights released; model card specifies MIT license. | MoE serving, GPU memory and prompt encoding require specialist implementation. |
| [GLM-5.3](https://artificialanalysis.ai/models/comparisons/deepseek-v4-1-flash-1017-vs-glm-5-3) | Released-weight comparator. | Review exact model license, provider, hardware and data residency. |
| [Mistral Large 4](https://huggingface.co/blog/mistral-large4) | Released weights 29 October, with Mistral Ecosystem Open-Weight License. | Open weight is not unrestricted MIT; check terms for commercial model-as-a-service. |
| [Meta Muse Wonder](https://dev.meta.ai/docs/models) | Hosted Model API product; Meta distinguishes downloadable Muse Spark Open and Glimmer. | Do not infer Wonder weights can be self-hosted. |
| Kimi K3.1 Pro | Announced weights scheduled after cutoff. | Verify actual checkpoint and license after availability, not before. |

The total cost of an open-weight option includes hardware, quantization fidelity, serving engineering, security patching, energy, redundancy, logging and human review. It is not represented by a hosted per-token price.

## 3. Controlled cost example and latency definition

**Assumption:** 1,000 *hypothetical*, single-pass requests, each using 20,000 uncached input tokens and 2,000 billed output tokens. There are no extra reasoning tokens, tools, retries, cache writes, regional surcharges, hosting costs or reviewer labor. Formula in USD: total = 20 × input price per million + 2 × output price per million.

| Model/rate | USD per 1,000 requests |
| --- | ---: |
| GPT-6 Luna, $0.10 / $0.50 | **$3.00** |
| DeepSeek V4.1 Flash 1017, $0.30 / $1.20 | **$8.40** |
| Mistral Large 4 launch/discounted $0.70 / $2.10 | **$18.20** |
| Mistral Large 4 undiscounted documentation view $1.36 / $4.18 | **$35.56** |
| GPT-6.1 Terra, $1 / $5 | **$30.00** |
| GLM-5.3, $1.40 / $4.40 | **$36.80** |
| GPT-6.1 Sol / Claude Sonnet 5.5 / Gemini 4 Argon introductory, $2 / $10 | **$60.00** |
| Claude Opus 5.5, $4 / $20 | **$120.00** |
| GPT-6 Astra, $10 / $50 | **$300.00** |

Sources: [OpenAI](https://developers.openai.com/api/docs/models), [Anthropic Sonnet](https://platform.claude.com/docs/en/models/sonnet-5-5/overview), [Anthropic Opus](https://platform.claude.com/docs/en/about-claude/pricing), [Google](https://ai.google.dev/gemini-api/docs/latest-model), [Mistral launch price](https://mistral.ai/it/news/mistral-large-4-oss/), [Mistral model page](https://docs.mistral.ai/models/mistral-large-4-0), [AA open-model comparison](https://artificialanalysis.ai/models/comparisons/deepseek-v4-1-flash-1017-vs-glm-5-3). The Mistral sources display both discounted/launch and undiscounted values; a separate sale view reports $0.68/$2.09. This is a documented pricing discrepancy across official presentation states, **not** verified by an exact-endpoint procurement quote. For Gemini Argon the same illustrative workload would become **$120.00** at the announced December rates.

**The price table is not a measured cost-performance Pareto frontier.** No model in it has been tested against a JRS gold dataset. Real processing may have hidden reasoning output, variable prompt length, cache effects, retries and human remediation cost.

A valid latency comparison must measure time to first token, time to first *answer* token, full response p50/p95, retrieval and validation time, concurrency, failures, and time-to-accepted human disposition under fixed model effort and hardware conditions. [Artificial Analysis metric definitions](https://artificialanalysis.ai/data-api/docs/reference).

## 4. Orchestration, retrieval and inference matrix

| Layer | Candidate | Published characteristics | Proposed application | Limitation |
| --- | --- | --- | --- | --- |
| Managed agent orchestration | [OpenAI Agents SDK](https://developers.openai.com/api/docs/guides/agents/sdk) | Tools, handoffs, tracing, human approvals | Explicit control over read-only tools and approval state | Not every hosted or built-in tool shares the same function-tool guardrails |
| Durable execution | [LangGraph](https://github.com/langchain-ai/docs/blob/main/src/oss/langgraph/interrupts.mdx) | Persistence/checkpoints, interrupts and resumption | Reviewer pause and resumption | Resumed nodes may rerun pre-interrupt effects; require idempotency |
| Multispecialist agents | [Microsoft Semantic Kernel](https://learn.microsoft.com/en-us/semantic-kernel/frameworks/agent/agent-orchestration/) | Sequential, concurrent, handoff, group chat and Magentic patterns | Experimental specialist architecture comparison | Orchestration described as experimental; complexity adds failure surfaces |
| Citation-based retrieval | [LlamaIndex](https://developers.llamaindex.ai/python/framework-api-reference/query_engine/citation/) | Retrievers, source nodes, citation chunks | Exact source/span references | A citation is not proof that all required evidence was retrieved |
| Private inference | [vLLM](https://docs.vllm.cc/en/latest/index.html) | Continuous batching, PagedAttention, quantization, prefix caching | Test cost/throughput of released weights | Substantial hardware and engineering costs |
| Private inference | [SGLang](https://sgl-project.github.io/) | RadixAttention, structured output and multi-GPU serving | Alternative controlled inference | Test precision and model equivalence rather than relying on platform claims |
| Tool interoperability | [MCP](https://modelcontextprotocol.io/specification/draft/changelog) | Standard tool/resource discovery and authorization protocols | Read-only retrieval connectors under access policy | Tool content is untrusted; server-side permission enforcement essential |

**Research finding:** The October 2026 [EMNLP evidence-based generation study](https://aclanthology.org/2026.findings-emnlp.2222/) documents two chunked-RAG weaknesses: relevant chunks may be retrieved without all required supporting passages, and document context can be lost during chunking. Another [EMNLP fact-grounding study](https://aclanthology.org/2026.emnlp-main.834/) separates retrieval misses from extraction errors even when the passage is present. Retrieval recall alone therefore cannot measure correct source-based reasoning.

**JRS retrieval hypothesis:** Preserve an authorization-scoped source manifest with document ID, edition, page/line, chronology, provenance and permitted scope; combine exact identifier/date retrieval with semantic similarity and reranking; verify required-source coverage and conflicts; then limit model output to proposed reviewer observations. Distinguish missing retrieval, failed extraction, contradictory evidence and unsupported inference in separate states. No public deployment is authorized by this design.

## 5. Safety, governance and alignment

The [OWASP LLM Top 10 for 2026](https://genai.owasp.org/resource/owasp-genai-llm-top-10-2026/) was published in August 2026 and is the current security reference. The earlier [2025 list](https://genai.owasp.org/llm-top-10/) addressed prompt injection, sensitive disclosure, poisoning, improper output handling, excessive agency and retrieval weaknesses; the earlier edition must not be presented as the current ranking. The [OWASP agentic guide](https://genai.owasp.org/2025/12/09/owasp-genai-security-project-releases-top-10-risks-and-mitigations-for-agentic-ai-security/) addresses additional agent action risks. The [NIST AI RMF generative-AI profile](https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence) provides voluntary governance guidance, not a certification.

| Threat | Proposed system defense | Human acceptance condition |
| --- | --- | --- |
| Case-document prompt injection | Treat all retrieved text as untrusted data; separate tool instruction; block unapproved calls | Flag the source and reject attempted tool redirection |
| Wrong/missing document or edition | Auth-filtered manifests, deterministic source/span IDs, version checks | Do not assert unsupported material |
| Cross-case source leakage | Apply tenant/case permissions before retrieval and on each tool action | No source revealed outside granted scope |
| Fabricated support or legal conclusion | Structured claim-plus-evidence schema, deterministic citation verifier, null/abstain | Human owns decision and legal reasoning |
| Unapproved publication, edit or export | Read-only tool defaults, authorization at each side effect, explicit approval | Do not self-publish or auto-finalize |
| Sensitive prompt content in logs | Minimize or disable traces containing content, controlled retention | Document and approve trace practices |
| Unbounded tokens/agents | Caps on time, output, retry, tools and concurrency; fail closed | Incomplete task presented as incomplete |

The [OpenAI Agents tracing docs](https://openai.github.io/openai-agents-python/tracing/) explain that input/output traces may contain sensitive data. The [guardrail docs](https://developers.openai.com/api/docs/guides/agents/guardrails-approvals) specify where SDK guardrails do and do not execute. Security controls must be enforced independently at the authorization/data boundary, not assumed from an agent's instructions.

## 6. Human-centered interactive platforms

| Experience | Documented design pattern | Transfer to JRS | Limitation |
| --- | --- | --- | --- |
| [ChatGPT Deep Research](https://help.openai.com/en/articles/10500283-deep-research-in-chatgpt) / [Work browser](https://help.openai.com/en/articles/20001280-using-cloud-browser-in-chatgpt) | Multi-source report with citations; delegated browser tasks under supported access | Source-linked answers and explicit final review | No direct controlled UX test performed |
| [Claude API / agent workflows](https://www.anthropic.com/claude-sonnet-5-5) | Adaptive effort and document/task orchestration | Progressive disclosure of draft vs accepted observation | Model API and consumer UI features differ |
| [Gemini Notebook](https://support.google.com/gemininotebook/answer/16262519?hl=en) | Selected source material and passage-linked citation chips | Side-by-side documentary evidence | Citation presence does not guarantee sufficiency |
| [Open WebUI](https://docs.openwebui.com/features/chat-conversations/rag/) | Self-hostable front end, external knowledge sources, citations | Local ownership and visible provenance | Self-hosting is not automatic data-security or accessibility proof |

**Proposed UI:** Every finding card shows (a) claimed issue, (b) source title/edition/span, (c) supporting and conflicting excerpts, (d) absent required evidence, and (e) reviewer actions: confirm, correct, insufficient basis, escalate. Nothing is silently finalized. This is design guidance only; its accessibility, privacy and usability are untested.

## 7. Non-obvious innovations and priorities

1. **Source coverage before fluency.** Measure whether the system located *all* necessary documents, not whether the answer reads well. Priority high.
2. **Evidence-state taxonomy, not unexplained confidence.** Supported / incomplete / conflicting / unavailable / human escalated. Priority high.
3. **Adaptive model escalation.** Low-cost deterministic and extraction checks before higher-effort reasoning; no automatic final decision. Priority high, economic outcome unknown.
4. **Reviewer-visible provenance and correction trail.** An observation must remain reconstructable after a model change. Priority high.
5. **Cross-vendor evidence reconciliation.** Model agreement does not independently establish a correct source basis; compare citations and unsupported assertions, not just outputs. Priority medium.
6. **Private inference option.** Evaluate only after license, infrastructure, source security and human approval are established. Priority medium.
7. **Autonomous case finalization or agent swarm.** Not recommended for current JRS scope; adds unvalidated authority. Priority no-go.

## 8. Decision and verification

**Decision:** Keep public JRS as a human-applied pre-finalization review instrument. Establish a distinct private validation track before making any product/technology selection. The companion evaluation protocol defines cases, controls, evidence measures, costs, stopping conditions and sign-off.

**No release authorization:** This report does not amend the existing JRS Review Engine restriction, nine published PDF identities, privacy boundaries, or protected website preview and approval gates. It is research, not an engineering assurance certificate.

## Source and coverage ledger

- [Artificial Analysis v5, 27 Oct 2026](https://artificialanalysis.ai/articles/artificial-analysis-intelligence-index-v5); [release comparison](https://artificialanalysis.ai/models/releases/comparisons). Independent capabilities, effort and cost. Not JRS task accuracy.
- [OpenAI API models](https://developers.openai.com/api/docs/models), [Anthropic Sonnet](https://platform.claude.com/docs/en/models/sonnet-5-5/overview), [Anthropic Opus](https://www.anthropic.com/claude-opus-5-5), [Google Argon](https://ai.google.dev/gemini-api/docs/latest-model). Vendor API specifications and prices.
- [DeepSeek 1017](https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash-1017), [Mistral Large 4 weights](https://huggingface.co/blog/mistral-large4), [Meta models](https://dev.meta.ai/docs/models), [Reuters Kimi release schedule](https://www.reuters.com/technology/moonshot-curbs-hacking-ability-new-kimi-model-fears-grow-over-ai-powered-2026-10-24/). Open-weight availability/licensing.
- [OpenAI agent safety](https://developers.openai.com/api/docs/guides/agents/guardrails-approvals), [LangGraph interrupts](https://github.com/langchain-ai/docs/blob/main/src/oss/langgraph/interrupts.mdx), [LlamaIndex citation engine](https://developers.llamaindex.ai/python/framework-api-reference/query_engine/citation/), [vLLM](https://docs.vllm.cc/en/latest/index.html), [SGLang](https://sgl-project.github.io/). Implementation patterns, not operational validation.
- [EMNLP evidence retrieval 2026](https://aclanthology.org/2026.findings-emnlp.2222/), [EMNLP extraction failures 2026](https://aclanthology.org/2026.emnlp-main.834/). Research limitations transferable as hypotheses.
- [OWASP LLM Top 10 (current 2026)](https://genai.owasp.org/resource/owasp-genai-llm-top-10-2026/) and [NIST GAI Profile](https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence). Governance and threat categories; neither certifies JRS.
- [Open WebUI RAG](https://docs.openwebui.com/features/chat-conversations/rag/) and [Gemini Notebook source behavior](https://support.google.com/gemininotebook/answer/16262519?hl=en). UX reference patterns.

**Excluded evidence:** Direct independent runtime benchmarks on one controlled JRS corpus; verified current commercial contracts; GPU TCO; live interactive tests of competing applications; model security penetration tests; latency under JRS concurrency; legal or accessibility certification. Public vendor capabilities must not be relabeled as completed JRS capabilities.
