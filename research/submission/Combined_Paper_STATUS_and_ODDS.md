# Combined international paper: status, files, and publication odds

*Decision executed 2026-07-27: the standalone Rungs 1-2 paper is folded into the international paper as complete supporting results. One flagship artifact instead of two.*

## The decision, in one line
Combining was the right call. The international paper already had empty "reproducibility (supporting)" and "reliability (supporting)" slots; the Rung 1-2 results drop straight into them, turning a paper with an entirely gated Results section into one with a real, complete Supporting Results section and a much stronger contribution.

## What the combined paper is
- **Title:** Detecting Decision Reconstruction Risk in AI-Assisted Documentation: A Record-Level Review Standard and Its Pre-Registered Validation
- **Authors:** Phillip Wikes, Ubayet Hossain (FRM)
- **Target journal:** AI and Ethics (Springer). Alternatives: AI & Society; Journal of Responsible Technology.
- **What it does:** defines DRR (a novel governance construct), introduces JRS, and validates it in stages: reproducibility (three AI vendors) + reliability (expert/reviewer panels) are DONE and reported; detection accuracy + the randomized Arm B comparison are GATED until the pre-registered sample completes.

## The three AI systems (now named in the paper)
- Anthropic claude-opus-4-8
- OpenAI gpt-5
- Google Gemini
Cross-vendor by design, so agreement reflects the method, not one model family. Mean pairwise agreement 84 percent across 15 records.

## Files (all revised / new this pass)
| File | What it is |
|---|---|
| `research/Detection_ArmB_Article_Draft.md` | The combined international paper (master, revised) |
| `research/submission/Combined_International_Paper.docx` | Word version for Editorial Manager |
| `research/submission/CoverLetter_AIandEthics_Combined.md` | Cover letter (hold until primary results land) |
| `research/compute_ac1_ci.py` | Reproducibility script for all reliability figures |
| `research/submission/OSF_Deposit_ReadyToPaste.md` | Pre-registration deposit payload (still applies) |
| `research/submission/` standalone set | RETAINED as a fallback; superseded by the combined paper |

## Odds of the combined paper being published

The honest number depends on one thing you control (finishing the gated data) and one you do not (how the results come out).

- **Peer-review acceptance, conditional on completing the study and Arm B showing JRS beats the baseline: ~70 to 80 percent at AI and Ethics.** A novel construct, a pre-registered design, and a randomized "does the standard add value" comparison is exactly the kind of paper this journal publishes.
- **Conditional on completing the study but Arm B showing no effect (a null): ~45 to 55 percent.** A clean pre-registered null is still publishable, just harder, and the paper's framing shifts.
- **Blended expected acceptance, once submitted: ~60 to 65 percent.** Higher than the standalone Rungs 1-2 paper (~55 to 65 percent) because the combined paper has a real contribution, not just "reviewers agree."

**The dominant risk is not peer review; it is completing the gated data.** As of 28 July 2026 (DB-verified via `check_completion.py`), the detection panel has **12 completed reviewers** (with one at 22/24 and others registered), and Arm B has **7 completed reviewers, 3 in the JRS condition and 4 in the baseline** (pre-registered target roughly 5 to 8 per arm), plus one in progress. So the data is materially closer than an earlier draft suggested: the detection panel is well past the 7 it once reported, and Arm B needs only about 2 to 5 more JRS-condition completers and a few more baseline completers to be analyzable. Until both reach the pre-registered thresholds the paper cannot be submitted, but the remaining gap is small, not large. That is the single rate-limiting step.

## The move that maximizes odds and speed
Post the combined paper as a **preprint now** (SSRN or OSF), with the supporting results in and the primary results openly marked gated. Preprints of pre-registered studies with partial results are common and legitimate. This gives you an immediate citable DOI and public credibility for the sale while the detection panel and Arm B finish, then the peer-reviewed version follows. It captures ~90 percent of the credibility benefit without waiting 9 to 15 months.

## What is genuinely blocking, and what is not
- NOT blocking: the writing. The manuscript is complete, honest, internally consistent, and reference-backed.
- Blocking submission to a journal: the gated primary data (detection panel + Arm B). This needs real reviewers, not more drafting, and cannot be fabricated.
- One-line items: Ubayet's byline confirmation (message ready); V-AI-08's confirmation of her Section 2.1 contribution and first-person voice; OSF deposit for the pre-registration DOI (payload ready).
