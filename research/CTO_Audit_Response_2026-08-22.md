# Response to the CTO-lens licensing audit

**Checked against the running system on 22 August 2026, not against the pitch.**

The audit is right about the shape of the opportunity and right that the assets need
systems-integration language. **Four of its recommendations are implementable today and one
is already truer than it claims.** Three would put a false statement in front of a buyer
whose security and legal teams will verify it, and one number in it is not supported by the
pipeline.

---

## Part 1: Implement these. They are true and they are strong.

### 1.1 The determinism claim is real, and stronger than the audit knew

The audit proposes framing JRS as "a deterministic rule-engine." **That is not a
repositioning, it is a verified property of the instrument.** The determination is a
deterministic function of the five conditions: across the labelled corpus, no label with all
five conditions passed carries a determination other than Ready, and no label with any
condition unmet carries Ready. Zero exceptions.

For a platform engineer this is the whole conversation. A deterministic mapping can be unit
tested, versioned, diffed and reasoned about. **Lead with it.**

### 1.2 Publish the input/output contract

Implemented as `research/JRS_Integration_Schema_2026-08-22.md`, attached. It states the
input envelope, the five condition outputs, the determination rule, the error contract and
the versioning commitment. A platform engineer can read it in ten minutes and estimate the
work.

### 1.3 The null result, framed correctly

The audit is right that this builds engineering trust, and slightly wrong on the facts.
**The correct claim:** in a companion corpus of 32 public-records determinations the method
showed no association with outcome, that null is reported in the manuscript alongside the
explanation, and a homogeneity test shows the two corpora do not significantly differ.

**Do not say "published."** It is in a submission-ready manuscript. Say "reported and
carried into submission," which is both true and sufficient.

### 1.4 Map to enterprise triggers

Correct and worth doing. The natural insertion point is a pre-finalisation gate, before a
record is written to a system of record. The article already places it at first and second
line of defence and explicitly not third, on the reasoning that once internal audit sees the
population the remediation window has closed. **That framing came from a Chief Audit
Executive and should be reused verbatim in buyer material.**

---

## Part 2: Do not say these. They are false as written.

### 2.1 "Stateless Execution: no sensitive enterprise data is ever stored, logged, or retained"

**This is the single most dangerous line in the audit.** A buyer's security team will diff it
against the code and find `api/review-engine.js:176`, which POSTs a row to `engine_reviews`
on every review.

**What is actually true, and it is better:** no customer record text is stored. The row holds
the determination, the five condition results, the finding, a request id and a consistency
figure. **Nothing of the submitted record.**

The engineering history here is the asset. That table used to carry `input_preview`, the
first 200 characters of the submitted record, and a public page rendered it. That
contradicted the Data Isolation Guarantee already published on the intake pages
(`audit-request.html:129`, `calibration-request.html:129`, `engagement.html:153`). **It was
found and removed on 2026-08-14 while the table still held zero rows, so no customer text
was ever exposed.**

**Say this instead:** "Record text is processed in ephemeral memory and never persisted. The
engine retains only the structured determination and a request identifier. This was verified
by removing an input-preview field before the first production record was ever submitted."

That survives a security review. The audit's version does not.

### 2.2 "Peer-reviewed backing"

**Nothing is peer-reviewed yet.** *CEP Magazine* is a practitioner publication of the Society
of Corporate Compliance and Ethics; the article is **accepted for the November issue and in
copy-editing**, which is a real credential and should be stated as exactly that. Four further
manuscripts are submission-ready and none has been through peer review.

A CTO who checks and finds no peer-reviewed publication behind a "peer-reviewed" claim will
discount everything else in the deck, including the parts that are true.

### 2.3 "The KPMG DNA" / "built with KPMG enterprise rigor"

**Remove this entirely. It is the highest-risk item in the document.**

Ubayet Hossain designed the validation methodology and is an Associate Director at KPMG
India. **He contributed in a personal professional capacity**, which is stated in the
manuscripts in those words. There is no KPMG institutional involvement, endorsement, review
or relationship.

Implying otherwise: misrepresents the programme to a buyer, exposes Hossain professionally
with his employer, and invites a firm with substantial legal resources to object to the use
of its name. **The individual credential is already strong.** "The validation methodology was
designed by a model-validation director at a Big Four firm, contributing personally" is true,
impressive, and safe.

---

## Part 3: The number the audit does not engage with

It pegs licensing at **55 to 65 percent**. Against the pipeline:

| Fact | Source, live 22 August 2026 |
|---|---|
| Organisational pilots | **0** |
| Sessions | **0** |
| Records run by an organisation | **0** |
| Trademarks filed | **None** (`IP_SALE_TRACKER.md:79`) |
| Paying pilot | **None** |

Platform vendors license standards their customers are already asking for. With zero
enterprise deployments there is no pull, and a buyout of unregistered marks is a diligence
finding rather than a transaction.

**My estimate stays at 15 to 25 percent until there are three to five named deployments**,
and the audit's own recommendations are the right way to get them: the integration schema
makes a pilot cheap to start, and pilots are what make licensing real. **The audit is a good
plan mis-labelled as a probability.**

**One correction of fact:** the audit cites "real-time telemetry" and "61 nightly runs." The
nightly cross-vendor run was **suspended on 21 August** when the studies were closed on your
instruction. `/api/run-study` now returns `skipped: studies_closed`. The 61 runs and the
84.9 percent mean remain accurate as a completed series; they are no longer live. If a buyer
opens the dashboard expecting live telemetry, say so first.

---

## Part 4: Sequence

1. Publish the integration schema. Attached, ready.
2. Rewrite the data-retention line to the true version. It is stronger.
3. Strip "peer-reviewed" and every KPMG institutional reference from all buyer material.
4. File the trademarks. This is a prerequisite for licensing, not an optimisation.
5. Convert two consulting engagements into named pilots. That is what moves 15 to 25 percent.
