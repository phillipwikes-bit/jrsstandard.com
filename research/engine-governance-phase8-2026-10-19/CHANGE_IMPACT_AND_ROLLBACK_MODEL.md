# Change Impact and Rollback Model

**LOCAL ENGINEERING MATERIAL ONLY. INDEPENDENT EVALUATION NOT AUTHORIZED OR CONDUCTED. NO_GO_NOT_VERIFIED REMAINS IN EFFECT.**

**Conservative rule.** No later change may be treated as neutral when it can alter a refusal boundary, evidence requirement, condition status, limitation, or review route.

Source of record: `change-model/CHANGE_IMPACT_MODEL.json`; logic in `lib/engine-governance-phase8/change-impact.mjs`. A proposal declares a class; the model raises it to the strictest class implied by the sensitive surfaces it names (refusal_boundary, evidence_requirement, condition_status, limitation, review_route) and by the paths it touches. A change that touches any sensitive surface is never documentation-only or test-only. Adoption of this model as binding is owner decision P8-OD-06.

| Class | Required evidence | Regression scope | New candidate version | Invalidates a sealed evaluation | Rollback | Owner decision | Counsel-review trigger |
|---|---|---|---|---|---|---|---|
| documentation-only | Diff showing only documents changed; claim guard clean. | Document checks of the affected package. | no | no | Revert the document. | no | Any change to rights, attribution, public or commercial language. |
| test-only | Diff showing only tests changed; mutation run of the affected suite with every mutation caught directly. | Full suite of the affected package plus its mutation group. | no | no | Revert the test; earlier recorded result stays as recorded. | yes | None unless the test encodes a scope or legal boundary. |
| rule-pack change | Sealed positive, nearby benign, malformed and reordered scenarios per changed rule, sealed before the change; differential against the current candidate. | All existing inputs, all sealed scenarios, stability transforms, over-refusal table, mutation group. | yes | yes | Restore the prior signed pack set; packs are versioned and content-sealed. | yes | Rules touching excluded domains or employment content. |
| intake-boundary change | Benign controls showing no in-scope record is refused; excluded-domain scenarios showing refusal holds. | All refusal and scope scenarios across packages; differential on every existing input. | yes | yes | Restore the previous intake module and its version. | yes | Always (scope of excluded domains). |
| evidence-validation change | Quote-resolution and offset scenarios, including unrelated-quotation cases. | All existing inputs, Phase 6 library, Phase 7 scenarios, stability transforms. | yes | yes | Restore the previous validation module and version. | yes | None unless evidence language reaches public text. |
| status-routing change | Sealed expectation for every affected condition; no favourable transition without explicit owner authorization. | All existing inputs and scenarios; differential classification with fail-closed classes. | yes | yes | Restore previous routing and version. | yes | If any status becomes more favourable. |
| prompt change | Prompt diff, prompt version increment, response-contract compatibility check. | All contract and graph fixtures; differential on mocked responses. | yes | yes | Restore the previous prompt version. | yes | If instructions about excluded domains or legal conclusions change. |
| evaluation-protocol change | Protocol diff and new seal; reason recorded. | Protocol validation; Phase 8 governance suite. | no | yes | Restore the previous sealed protocol. | yes | Any change to material classes, roles or authorization. |
| model/provider change | Identifier, version, review date and reason recorded; offline fixtures re-run; a new sealed evaluation is required before any statement about behaviour. | Everything above plus a new protocol freeze. | yes | yes | Restore the previous identifier; never silently fall back. | yes | Always (data handling and provider terms). |
| public-claim change | Claim, evidence, limitation, rights and regulatory implication recorded; publication review. | Claim guard on all public text; zero-drift guards. | no | no | Restore previous public text and re-verify production bytes. | yes | Always. |

A model or provider change additionally requires an evaluation review before any statement about behaviour. Model identifiers are versioned infrastructure with a documented default and review date, not part of the JRS method.
