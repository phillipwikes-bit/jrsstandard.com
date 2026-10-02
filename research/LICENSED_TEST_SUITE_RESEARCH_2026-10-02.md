# The licensed test suite: research and design

**2026-10-02, at the owner's request:** "elaborate more on licensed test suite, really research it."

This builds on `research/PREVENTION_NICHE_RESEARCH_2026-10-02.md`, shape B.

**Source marks:**
- **VERIFIED:** the primary page was opened.
- **SECONDARY:** an opened secondary article.
- **UNVERIFIED:** seen in search results only.
- *Judgment* and *Proposal* are marked where used.

## 1. What it is (*Proposal*)
The **JRS Reconstruction Test Suite**: a fixed, versioned set of decision records and a deterministic scorer. It measures whether an AI drafting or summarizing tool keeps what a later reviewer needs to reconstruct a decision:
- who decided;
- the sources for each characterization;
- dates and order;
- the criteria applied;
- the responses considered.

Vendors run their tool on the suite and get a scored report. No model grades the result.

## 2. Precedents, and what each one teaches
| Precedent | How it works | Status | Lesson for JRS |
|---|---|---|---|
| **Khronos Adopters Program** (OpenGL, Vulkan) | Adopters download the conformance tests, run them, and upload results for Working Group review. On approval they may advertise the product as conformant and use the name and logo. Fees: OpenGL 3.2 to 4.5 is USD 25,000 for members and USD 30,000 for non-members; Vulkan is a subscription of USD 95,000 for members and USD 120,000 for non-members. One fee covers **an unlimited number of products** for that version. Membership is not required | **VERIFIED** (khronos.org/conformance/adopters) | A flat fee per version, unlimited products, the vendor runs the test itself, results are reviewed, and the mark is licensed **only on passing** |
| **MLCommons AILuminate** | 12,000 public practice prompts and 12,000 **private** official prompts per language. The sets are disjoint and balanced, and kept separate "to prevent gaming and to ensure empirical integrity", because shared prompts can leak into later training data | **VERIFIED** (MLCommons safety FAQ) | **Public practice set plus private official set.** This is essential here, because public court and agency decisions may already be in model training data |
| **Vals Legal AI Report** (February 2025) | Four legal-AI vendors opted in, with the right to withdraw from any task before publication; LexisNexis withdrew from most tasks. Tasks included document summarization and chronology generation. A **lawyer baseline** was used, with more than 500 proprietary samples from consortium law firms. Vals disclosed a customer relationship with one or more participants | **VERIFIED** (vals.ai report page) | Opt-in with withdrawal rights; a **human baseline**; data the vendors have not seen; conflicts disclosed. Some vendors will decline to be tested |
| **NYC Local Law 144** | Employers using automated employment decision tools need an **annual independent bias audit**. Reported prices start at about USD 10,000 per tool | Rule: **SECONDARY** (several guides agree). Price: **UNVERIFIED** (a vendor page in search results) | HR-tech buyers already pay for **independent, annual** AI testing when a rule requires it. Independence and annual retesting are expected |
| **Stanford RegLab legal-AI hallucination study** | Hallucination rates of 17% for Lexis+ AI and 33% for Westlaw AI-Assisted Research (tested May 2024; Journal of Empirical Legal Studies, 2025) | **UNVERIFIED** (search results and press coverage) | Independent testing of "grounded" AI tools finds errors that the vendors' own claims miss. That is the demand driver |
| **California SB 524** (from the prevention research) | AI police reports must disclose AI use, keep the first draft, and identify the creator and the sources | **VERIFIED** | Regulators are starting to write anchor requirements for AI-drafted records |

## 3. Design rules drawn from the precedents (*Judgment*)
1. **Two sets.** A free public practice set for transparency and adoption, and a private official set for scored results. Rotate the private set each version so vendors cannot tune to it.
2. **The vendor runs it, and an automated harness scores it.** Scoring is deterministic: anchor retention, fabricated anchors, reconstruction questions answered from the draft, and materiality-weighted loss. This keeps owner hours near zero, which fits the 26 August rule against owner-hour engagements.
3. **A human baseline.** Report each tool against the source record and against human-written summaries of the same length, so a score has meaning.
4. **A flat annual licence with unlimited products,** following Khronos. Annual, because models change; Local Law 144 audits are annual too.
5. **Opt-in publication only.** A vendor's score is published only with its consent. This keeps trade articles vendor-neutral and follows the Vals model.
6. **Factual result statements, not certification:** "Tested on the JRS Reconstruction Test Suite v1.0 on [date]: anchor retention X%, fabricated anchors Y." A conformance **mark** comes later, only after the trademark is filed and registered. The dossier status is "REQUIRES USER INPUT" (*Recorded*).
7. **Independence as a selling point.** JRS sells no drafting tool. Keep the Engine a **reference checker**, not a product competing with licensees; otherwise that independence is lost.

## 4. Product tiers and pricing (*Judgment*; to be tested in the market, not proven)
| Tier | Buyer | What they get | Indicative price |
|---|---|---|---|
| 0. Practice kit | Anyone | The public set, the scorer, the specification | Free |
| 1. Vendor licence | Drafting-tool vendors (case management, HR, legal tech, records) | Private-set runs through the automated harness, a scored report, the right to make factual result statements, unlimited products | **USD 7,500 to 15,000 a year** at launch |
| 2. Buyer-side licence | Organizations comparing vendors | Run the suite on candidate tools during procurement | USD 2,500 to 5,000 per evaluation |
| 3. Conformance mark | Vendors that meet the thresholds | Mark licence, annual retest | Later; above Tier 1, once the mark is registered |

**Price anchors:**
- Khronos charges USD 25,000 to 120,000, but for very large platform companies (VERIFIED).
- Independent HR-AI audits reportedly start at about USD 10,000 per tool a year (UNVERIFIED).
- AllVoices' median contract on Vendr is about USD 15,000 a year (recorded earlier in the assessment, C.1).

The launch range sits below the Khronos fees and near the HR-tech audit price. That is a guess to be tested with real buyers, not a quote.

## 5. What has to be built
| Component | What | Depends on |
|---|---|---|
| Corpus v1 | About 60 public practice records and 60 private official records, chosen by a written rule from public decisions with named sources and dates | A fresh selection rule; the earlier evaluation code is no longer in the repository, so this is a new build |
| Anchor extractor and scorer | Deterministic counts of dates, record citations, attributions and quotations; retention and fabricated anchors | Study 014 Part 1 design |
| Reconstruction questions | Questions generated by rule from each source's anchors; answered from the draft only | Study 014 design review 2, item 1 |
| Harness | Vendor API adapter or file upload; destination lock; no retention of vendor data | Engineering |
| Report template and version freeze | Hash-frozen suite versions; a change log | Engineering |
| Licence terms | Evaluation licence; rules for result statements; no certification wording; confidentiality of the private set | Owner approval; non-exclusive by default |
| **Evidence it measures something real** | Study 014 H1 (AI drafting loses anchors) and H4 (a JRS instruction keeps more) | Study 014 run |

## 6. Risks
1. **Validity.** Anchor retention is a proxy. Without the reconstruction-question test and Study 014 results, a vendor can fairly ask what the score means.
2. **Gaming and contamination.** Handled by the private set and rotation; a public-only suite would not be credible.
3. **Vendors decline to be tested,** as LexisNexis withdrew from Vals. The buyer-side licence creates pressure from the demand side.
4. **Liability for result statements.** If a "tested" tool later produces a bad record, the licence must make clear that a score describes performance on the suite, not on the buyer's records.
5. **No trademark filed yet,** so no mark programme.
6. **Conflict of interest** if the Engine is sold as a drafting tool.
7. **Small early market.** Investigation case-management vendors are few (market shares NOT ASSESSED), so the first two or three licences matter.
8. **Overlap with general legal-AI benchmarking** (Vals). *Inference:* JRS's niche is decision and investigation records, not legal research. A partnership is possible later. Nothing is contacted without the owner.

## 7. Sequence
1. Run Study 014 with H4. It is the evidence base.
2. Build suite v0.9 from Study 014's corpus design and scorers, with private and public sets.
3. A private beta with one or two vendors, after the owner approves outreach.
4. Suite v1.0 and the licence terms; file the trademark.
5. A conformance-mark programme once the mark is registered.

## Sources
- [Khronos Adopters Program](https://www.khronos.org/conformance/adopters/) (opened)
- [MLCommons AILuminate safety FAQ](https://mlcommons.org/ailuminate/safety-faq/) (opened)
- [Vals Legal AI Report, February 2025](https://www.vals.ai/industry-reports/vlair-2-27-25) (opened)
- [Vals legal research report, October 2025](https://www.vals.ai/industry-reports/vlair-10-14-25) (search result)
- [Warden AI, NYC Local Law 144 guide](https://www.warden-ai.com/resources/nyc-bias-audit) (search result)
- [Stanford study preprint](https://arxiv.org/pdf/2405.20362) (search result)
- [LawNext on the Stanford redo](https://www.lawnext.com/2024/06/in-redo-of-its-study-stanford-finds-westlaws-ai-hallucinates-at-double-the-rate-of-lexisnexis.html) (search result)
