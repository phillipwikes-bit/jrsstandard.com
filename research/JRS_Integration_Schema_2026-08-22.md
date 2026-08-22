# JRS Integration Schema v1.0

**Pre-finalisation decision gate. Input/output contract for platform integration.**

Issued 22 August 2026. Every behaviour below is the behaviour of the running implementation
at `api/review.js` and `api/review-engine.js`, not a specification of intent.

---

## 1. Where it sits

A pre-finalisation gate. The evaluation runs **after** a consequential record is drafted and
**before** it is written to a system of record, sent to a regulator, or released to the
person it describes.

| Line of defence | Fits | Why |
|---|---|---|
| First | Yes | Drafter self-check before submission |
| Second | Yes | Compliance or risk sampling before the record is final |
| Third | No | By the time internal audit reads the population, the remediation window has closed |

Typical host triggers: a workflow approval transition, a pre-commit hook on a case record, a
guardrail step in an LLM drafting pipeline, or a scheduled sample over records created in a
period.

---

## 2. Input

```
{
  "record_text":  "string, required. The drafted record as it would be filed.",
  "context":      "string, optional. Matter type, jurisdiction, decision class.",
  "ai_assisted":  "boolean, optional. Whether a model contributed to the draft.",
  "request_id":   "string, optional. Caller's correlation id, echoed back."
}
```

**Constraints in force:** `record_text` is capped by the endpoint's input limit and the
endpoint is rate limited. Neither the caller's identity nor any authentication material is
required by the evaluation itself.

---

## 3. Output

```
{
  "request_id":    "string, echoed",
  "determination": "ready | review_required | gap_identified",
  "conditions": {
    "reconstructability":        "pass | review | fail",
    "basis_identification":      "pass | review | fail",
    "chronological_integrity":   "pass | review | fail",
    "decision_traceability":     "pass | review | fail",
    "evidentiary_sufficiency":   "pass | review | fail"
  },
  "finding":  "string. Short statement of what is missing, if anything.",
  "revisions": ["string. Specific, actionable corrections."]
}
```

### 3.1 The determination rule is deterministic

```
all five conditions == pass                 ->  ready
any condition == fail                       ->  gap_identified
otherwise (at least one review, none fail)  ->  review_required
```

**This is a verified property, not a design intent.** Across the labelled validation corpus:
zero labels with all five conditions passed carry a determination other than `ready`, and
zero labels with any condition unmet carry `ready`.

**What that buys an integrating platform:** the mapping is unit-testable, versionable and
diffable. A host system can assert the rule in its own test suite and detect any drift in a
future version without depending on the vendor's word.

### 3.2 The five conditions

| Condition | The question it asks |
|---|---|
| Reconstructability | Can the conclusion be rebuilt from the record alone? |
| Basis identification | Is the source of each characterisation identifiable? |
| Chronological integrity | Do dates, sequence and sources hold together when read cold? |
| Decision traceability | Can the reasoning be followed and the responsible parties identified? |
| Evidentiary sufficiency | Does the record carry enough to support the weight of the decision? |

---

## 4. Data handling

**Record text is processed in ephemeral memory and is never persisted.**

The engine retains one row per evaluation containing the determination, the five condition
results, the finding, a request identifier, the run count and a consistency figure.
**No part of the submitted record is stored, logged, or echoed to any surface.**

This is verifiable rather than asserted. The retention row previously carried
`input_preview`, the first 200 characters of the submitted record, and a public page
rendered it. That contradicted the Data Isolation Guarantee published on the intake pages.
**It was removed on 14 August 2026 while the table still held zero rows, so no customer text
was ever exposed.** The removal is documented inline at `api/review-engine.js`.

**For a host that requires zero retention of any kind**, the structured row is a
configuration point and can be disabled without affecting the evaluation.

---

## 5. Determinism, variance and the reproducibility record

Where the evaluation is executed by a language model, the same record can be run more than
once and the responses compared. The endpoint returns `runs` and `overall_consistency` for
exactly this purpose.

**The programme's own cross-vendor measurement, for reference:** three models from three
independent vendors applied the standard to the same constructed records across 61 nightly
runs to 21 August 2026. **Mean agreement 84.9 percent, standard deviation 6.4 points, range
66.7 to 100 percent.**

The dispersion is stated deliberately. A single headline figure would overstate the
stability, and an integrating engineer needs the range to set their own thresholds.

**Status note:** the nightly series was suspended on 21 August 2026 when the validation
studies were closed. The 61 runs are a completed series, not a live feed.

---

## 6. Error contract

| Condition | Behaviour |
|---|---|
| Input over the size cap | Rejected with a structured error. Nothing evaluated |
| Rate limit exceeded | Rejected with a structured error |
| Upstream model unavailable | Structured error. **No partial or guessed determination is returned** |
| Malformed input | Structured error naming the field |

**A determination is never synthesised on failure.** A host system can treat the absence of
a determination as a hard signal rather than having to detect a degraded one.

---

## 7. Versioning

This is v1.0 of the integration contract. The five conditions, the three determination
values and the determination rule are the stable surface. Any change to the rule or to the
condition set is a major version, because a host's test assertions depend on both.

---

## 8. What this document does not claim

- **It is not a certification.** A `ready` determination is a documentation-quality read, not
  a legal opinion or a compliance attestation.
- **It does not claim to improve outcomes.** The validation programme measures whether the
  property is detectable and reliably identified. Whether applying it reduces litigation or
  regulatory exposure has not been tested.
- **It is not peer-reviewed.** One practitioner article is accepted for publication;
  four manuscripts are submission-ready. None has completed peer review.
- **The methodology contributor acted personally.** The validation methodology was designed
  by a model-validation director at a Big Four firm, contributing in a personal professional
  capacity. No institutional endorsement of any kind is claimed or implied.
