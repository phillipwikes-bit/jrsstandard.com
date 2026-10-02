# DRR Test Suite v0.9: private beta shortlist and outreach draft

**DRAFT ONLY, 2026-10-02.** Nothing has been sent and no one has been contacted. Contact needs the owner's explicit approval, naming the vendor ("approve contact: Case IQ", for example). Drafting this is not permission to send it.

## Shortlist (one or two to approach)
| Rank | Vendor | Why it fits | Evidence (checked 2026-10-02, vendor pages) |
|---|---|---|---|
| 1 | **Case IQ** | It ships a generative drafting feature whose output is exactly what the suite tests: a case report compiled from the file | "Summarization Copilot ... produces a consistent, complete case report"; it also generates timelines and a "draft recommended outcome". Built on Azure OpenAI ([press release](https://www.caseiq.com/news-press/case-iq-launches-first-two-ai-copilots-to-transform-the-incident-reporting-experience-and-dramatically-streamline-investigations), [help page](https://help.caseiq.com/generate-a-summary-for-a-case?kb_language=en_US)) |
| 2 | **HR Acuity** | Enterprise employee-relations platform whose AI (olivER) drafts case summaries and investigation reports, and markets them as "defensible" | "generate defensible investigation plans and summaries"; "AI-powered writing assistance ... thorough, defensible reports" ([AI page](https://www.hracuity.com/platform/employee-relations-ai/)) |
| Alternate | **AllVoices** | Its AI (Vera) drafts investigation documentation and "consolidated findings" | "draft investigation documentation"; investigators edit the summary before it is final ([Vera page](https://www.allvoices.co/product/vera-ai-employee-relations)) |

*Inference:* a vendor that calls its AI output "complete" or "defensible" has a reason to want an independent measure of what its drafts keep. That is the pitch. It is not evidence that they will say yes.

**Recommended order (judgment):** first top up the API credit and finish Study 014 Part 2 and the v1.2 confirmatory run (about USD 22, an estimate), so that the beta starts on a suite whose scorer has been checked on unseen drafts. Then approach Case IQ.

## Contact route
Not chosen. Each vendor's public contact or partnership form is the neutral route. A named person is used only if the owner already knows one. No contact data is collected or stored here.

## Draft message (for the owner to send, edit or discard)

> Subject: Independent test of what AI-drafted case reports keep: free 90-day beta
>
> Hello,
>
> I developed the Justification Review Standard (JRS), a published method for checking whether a later reviewer can reconstruct how and on what basis a workplace decision was reached, from the record alone.
>
> We have built a test suite that measures this for AI drafting tools. It scores whether a drafted summary or report keeps the dates, record citations, quotations and "who said what" from the source, and whether a reader can still answer factual questions from the draft. In our first study, a plain "concise summary" prompt on current models kept a median of 0 to 7 percent of quotations and none of the record citations. A drafting instruction built on JRS kept nearly all of them.
>
> Because [product] drafts case reports, we are offering one or two vendors a free 90-day private beta. You run [product] on 30 public practice records, and we return a full scored report, kept confidential to you. The practice records are U.S. federal-sector EEOC decision backgrounds, not workplace investigation files, so the scores show what your tool keeps from that kind of record; we have not yet tested whether they predict results on your customers' files. We ask for feedback on the process. No certification or mark is involved at this stage.
>
> Would someone on your product or AI team be open to a short exchange about it?
>
> Phillip Wikes
> JRS · info@jrsstandard.com · jrsstandard.com

**Claim check (CLAUDE.md section 24):**
- The quotation and citation figures are Study 014 Part 1 medians for P1, one draft per text, on 30 EEOC texts (`research/study-014-drr/RESULTS.md`).
- "Nearly all" refers to the P4 medians of 1.0 for both drafters; Sonnet's attribution median was 0.67.
- No "prevents", "eliminates", "certified" or "compliant".
- The message makes no claim about the vendor's product.
- **Scope line added 2026-10-03 (owner approval):** the practice set is federal-sector EEOC text, and its relevance to HR investigation files is not established (`research/DRR_STUDY014_INTEGRATION_DRAFT_2026-10-03.md` section 3).
- **Still not sent.** Contact needs "approve contact: <vendor>".
