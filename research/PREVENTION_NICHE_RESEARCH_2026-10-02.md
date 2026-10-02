# Prevention as the product: niche research

**2026-10-02, at the owner's request.** "Research more about 'Prevention as the product'; this could be the niche."

**Source marks:**
- **VERIFIED:** the primary or publisher page was opened.
- **SECONDARY:** an opened secondary article.
- **UNVERIFIED:** seen in search results only.

Everything else is *Inference* or *Judgment*, marked as such.

## 1. The niche in one sentence (*Judgment*)
**Reconstruction-preserving AI drafting.** A JRS specification, a conformance test and free training make AI-drafted decision records keep what a later reviewer needs: who decided, on what basis and sources, in what order, and with what responses considered. The record is right at the point of drafting, instead of being fixed after the fact.

This is the Engine's original design point. Its prompt says it examines a record "BEFORE it is finalized" (`api/review-engine.js`, line 41, *Observed*).

## 2. Demand signals
| Signal | What it shows | Status |
|---|---|---|
| **California SB 524**, signed 13 October 2025 | Police reports drafted with AI must disclose AI use, **retain the first draft as long as the final report is retained**, and identify the person who created the report and the footage relied on | **VERIFIED** (California Senate District 7 release). Effective date reported as 1 January 2026, and California described as the second state to act: both **UNVERIFIED** |
| **EFF investigation of Axon Draft One**, 10 July 2025 | "Draft One does not save the draft it generates, nor any subsequent edited versions." "Nothing remains that would let judges, defense attorneys, or the public review know what part, if any, of a report was written by AI." | **VERIFIED** (EFF press release) |
| **Court sanctions for AI-fabricated citations** | At least USD 145,000 in sanctions in Q1 2026. The source is a researcher's worldwide database (Damien Charlotin, HEC Paris) | **SECONDARY** (EDRM, 8 April 2026). Search results also report about 143 judge standing orders on AI and more than 1,000 decisions: **UNVERIFIED** |
| **NARA AC 11.2026**, 21 August 2026 | Whether AI materials (inputs, outputs, audit trails) are federal records depends on context, including reliance in decision-making | Memo page opened; guidance text **not read**. Treat as a related requirement only, not a compliance claim |
| **Investigation platforms ship AI drafting**: Case IQ ("one-click investigation report generation"), HR Acuity (olivER writing assistance), AllVoices (Vera report summaries) | Buyers of a drafting specification already exist: these platforms are the licensing targets | **UNVERIFIED** (vendor descriptions in search results) |

**Reading (*Inference*):** in one high-stakes record type, police reports, a legislature has already written prevention requirements for AI-drafted records: disclosure, keeping the first draft, and linking to the source. Those map closely onto JRS:
- source linking is RC2, Basis Identification;
- the identified author and the retained draft are RC4, Decision-Process Traceability;
- an auditable path from evidence to report is RC1, Reconstructability.

HR, compliance and agency investigation records have no equivalent rule (*Inference*: no such rule was found in this search). That gap is the opening.

## 3. Substitutes and competition
- **Model-level citation features** (for example Anthropic's Citations API; UNVERIFIED as described in search results) make "cite the source" technically easy. *Inference:* they are a building block, not a competitor. They do not define **what a decision record must anchor** (decision-maker, criteria, chronology, responses considered). That definition is what JRS supplies.
- **Laws set minimums** (SB 524). A JRS profile can sit above them, as long as no compliance claim is made.
- **Vendors' in-house practices, and legal-AI tools:** NOT ASSESSED in this pass.

## 4. Product shapes that fit the owner's standing rules
The rules are B2B licensing only, no owner-hour engagements, training free and vendor-neutral articles.

| Shape | What it is | Revenue | Defensibility | Fit |
|---|---|---|---|---|
| **A. JRS Drafting Specification v1** | A short standard: the anchors each condition requires; first-draft retention; marking AI-drafted passages; linking each characterization to its source | Free (it builds adoption) | Low alone; it rests on the brand and on being first | High |
| **B. Conformance test suite** | The Study 014 benchmark, the anchor-retention scorer and the reconstruction Q&A test, licensed to drafting-tool vendors to test their output | **Annual licence per vendor** (*Judgment*: the primary revenue line) | Medium: benchmark data, scripts and track record | High |
| **C. Policy kit for investigation units** | An AI-drafting policy template: disclose, retain the draft, anchor checklist, pre-finalization check | Free, or bundled with B | Low | High (fits the free training) |
| **D. Pre-finalization checker** (the Engine, reframed) | A reference implementation that checks a draft against the specification before sign-off | Licence with B | Low to medium; any advantage over the public text must be shown by Study 014 H3 | Medium |
| E. Prompt or instruction set | The "keep the anchors" drafting instructions | Free | Very low (easily copied) | As part of A |

## 5. Risks and blind spots
1. **The word "prevents" is banned** (CLAUDE.md section 24) unless the exact proposition is established. So "prevention" can describe the *category*, but claims must read "reduces reconstruction risk at drafting time" or "reconstruction-preserving drafting". No measured reduction exists yet.
2. **No evidence yet that it works.** Nothing shows that a JRS-guided drafting instruction keeps more anchors. Proposed: add **H4** to Study 014, "the JRS drafting instruction retains more anchors than the plain prompt". That is the decisive test for this niche.
3. **Copyability.** A specification is easy to copy. Value rests on the marks (the JRS and DRR filing dossier exists), the benchmark and data, publications, and being first.
4. **Conformance language.** "Tested against JRS" style claims need the trademark position settled first, and must not be sold as certification (the earlier decision on the training).
5. **Police reports are the clearest regulated market**, but they are outside the owner's audience and carry reputational risk. *Judgment:* use SB 524 as the precedent argument, not as the first market.
6. **Vendor concentration.** A few platforms dominate investigation case management, so each licence decision matters (*Inference*; market shares NOT ASSESSED).

## 6. Next steps (no external contact)
1. Add H4 (prevention) to the Study 014 draft as a primary hypothesis.
2. Draft the JRS Drafting Specification v0.1 from the Codebook: one page per condition, with the required anchors.
3. Verify the UNVERIFIED rows: SB 524's effective date and Utah; the standing-order counts; vendors' AI drafting features.
4. Build a vendor list (case-management platforms) for later, sequenced outreach. **Nothing is sent without the owner.**

## Sources
- [California Senate District 7, SB 524 signing](https://sd07.senate.ca.gov/news/governor-signs-bill-requiring-law-enforcement-disclose-use-ai-police-reports) (opened)
- [EFF on Axon Draft One](https://www.eff.org/press/releases/eff-investigation-ai-product-police-reports-designed-hinder-audits) (opened)
- [EDRM, Q1 2026 AI sanctions](https://edrm.net/2026/04/the-ai-sanction-wave-145k-in-q1-penalties-signals-courts-have-lost-patience-with-genai-filing-failures/) (opened)
- [NARA AC 11.2026](https://www.archives.gov/records-mgmt/memos/ac-11-2026) (memo page opened)
- [EFF on SB 524](https://www.eff.org/deeplinks/2025/10/victory-california-requires-transparency-ai-police-reports) (search result)
- [Guideflow, investigation software 2026](https://www.guideflow.com/blog/investigation-management-software) (search result)
- [Legal Stack, judicial response report](https://www.thelegalstack.org/research/the-legal-ai-judicial-response-report-2026-how-federal-and) (search result)
