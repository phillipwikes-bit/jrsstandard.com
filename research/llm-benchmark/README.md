# Offline JRS LLM Benchmark Scorer (Synthetic Test Fixture)

**Not a Review Engine component. Not an AI evaluation result. Not published.**

This folder tests the *evaluation method*, using exactly three invented cases. No language models, network APIs, retrieved records, third-party providers or private data are used. The fixture intentionally includes one true positive, one false positive and one missed gap so the detection logic and denominator rules can be checked.

Run locally with Node 22 or later:

    node research/llm-benchmark/score.test.mjs
    node research/llm-benchmark/score.mjs research/llm-benchmark/fixtures/gold.synthetic.json research/llm-benchmark/fixtures/reviewed.synthetic.json

Expected synthetic fixture metrics: TP=1, FP=1, FN=1; gap precision=0.5; gap recall=0.5; two manually reviewed citation references, one verified; zero critical incident flags. **These values are programmed test cases and are not any model's JRS accuracy.**

The evaluator refuses any input whose top-level classification is not SYNTHETIC_ONLY, any reviewed "model" identifier other than SYNTHETIC_EVALUATOR_UNIT_TEST, missing cases, duplicate findings, invalid evidence conditions, nonexistent gold matches, or citations not present in the per-case source manifest. A privacy incident or unauthorized action sets stop_required=true. Case source text itself is not accepted by the scorer and is not present in the fixture.

Citations require an external annotator to mark independently_verified true, false or null. True means human-adjudicated support, **not** confirmation by the model or the scorer. The scorer checks allowed case/span references, but cannot determine semantic sufficiency on its own. Unknown citation verification does not count toward the verified denominator. Source mapping, gold gaps and reviewed findings must be prepared independently of the model being tested.

It does not measure legal correctness, reviewer time, operational latency, actual spend, source recall, document reconstruction or real-world deployment safety. Those require a separately approved corpus and a new, confidential evaluation process. Do not modify the synthetic-only restriction to run live cases under this research PR.

The directory is excluded from Vercel by the existing root .vercelignore. Any public release, external API use, private data collection, field testing, or Engine integration requires a separate approval and security review. See the proposal at docs/JRS_LLM_Documentary_Review_Evaluation_Protocol_2026-11-03.md.
