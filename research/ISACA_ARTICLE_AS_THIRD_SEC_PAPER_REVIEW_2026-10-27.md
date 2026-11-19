# Employment-records (ISACA) article as a third SocioEconomic Challenges paper: review, 2026-10-27

Scope: the manuscript (sha256 c9ae4573…, byte-identical to the frozen v9 file committed 2026-08-24), the repository on every branch, and the supplied analysis ("the third article is distinct"). The live database (`bench_outcomes`, Supabase) was NOT read: no access token is set in this session. Figures were reconciled against the committed corpus file instead.

## 1. The supplied analysis, checked claim by claim

| Claim | Result | Evidence |
|---|---|---|
| 20 matters, six forums, two countries | FACT, correct | FLRA 6, NY UIAB 4, NY App Div 4, US Supreme Court 2, UK ET 2, EEOC 2 = 20; US and UK |
| Incomplete 75.0% adverse vs Ready 16.7% | FACT, correct | 6 of 8 and 2 of 12, rebuilt from the 20-row corpus file |
| Fisher p = 0.0194, OR 15 | FACT, recomputed | Also reproduced 0.0291 (13 resolved) and 0.0073, OR 19.25 (with the two excluded) |
| Wilson intervals 40.9 to 92.9 and 4.7 to 44.8 | FACT, recomputed | |
| Empirically distinct from the other two papers | PARTLY. No case overlaps the 32 public-records cases (all 22 citations checked; "Gannett v Mount Vernon" and "Gannett v Greenburgh" are different decisions). But it uses the same five-condition protocol and reports a Woolf comparison against that 32-case corpus, so it depends on the companion paper | Manuscript endnotes 6 and 7 |
| "Submitted to ISACA on August 27" | **NOT SUPPORTED.** 27 August is the date of the owner's decision entry and of Kyle McMullan's sign-off. No submission date exists on any branch | Tracker 2026-08-27 |
| Convert to an academic paper, keep Tanvi and the owner as co-authors | Sound in principle, but needs Tanvi's agreement (see section 3) | |

## 2. Weaknesses an SEC reviewer would find

1. **The result leans on undecided cases.** Five of the 12 Ready records are "contested, no recorded disposition" and count as not adverse. Restricted to the 13 resolved matters the result holds (p = 0.0291) but rests on 7 versus 6 records. The adverse rule was set after the data closed. The manuscript already says exploratory; keep it.
2. **Two "employment" cases may be public-records cases.** A9 (Gannett v City of Mount Vernon Police Department) and A10 (Kohler-Hausmann v NYPD) are captioned like records-access proceedings. INFERENCE from the captions only; I did not read the decisions. The paper excludes A15 on exactly that ground. If A9 or A10 are records-access cases, the exclusion rule is applied inconsistently. REQUIRES HUMAN REVIEW before any resubmission.
3. **None of the 20 has a URL on file** (0 of 20; the public-records corpus has them all). Reviewers and Lina's team cannot check the sources. A5 (Jones v Vale Curtains) also still has no tribunal case number. Do not invent one.
4. **One reviewer, one timestamp per case.** Disclosed, and Tanvi did all classifications while the owner, who developed the method, did none. That is a strength to state plainly in an academic version.
5. **Two US Supreme Court cases (A1, A2) are doctrinal landmarks** whose "employer documentation" is whatever the opinion describes. Expect a question about whether they belong in a documentation test.
6. **Socioeconomic framing is thin.** The article is written as an audit-practice control piece. For SEC it needs the employee, employer and administrative-justice argument (as built for the detection paper), plus the 5,000-word minimum and the structured abstract.
7. **Fit with the other two papers.** All three sit on one review method and one author. Three papers to one editor within about a week is a perception risk.

## 3. Blockers before any move (none can be bypassed)

1. **ISACA must be closed first.** The article is still formally under consideration there (OWNER ATTESTATION); the ISACA page says nothing on simultaneous submission. Send the status notice, wait out the 14 days, withdraw in writing.
2. **Tanvi is first author.** Her approval of the final text and of a new venue is NOT ESTABLISHED, and the 2026-10-02 record says ISACA was "blocked until the first author has read it". Ask her directly and record her answer.
3. **Cost.** SEC's fee (EUR 150 after Lina's discount, only on acceptance) would be per paper. Who pays for a third is an owner decision.
4. **Text overlap.** Measured today on 8-word sequences: 0.9% of the article's words sit in passages shared with the accepted CEP piece, and 4.8% with the Business Ethics draft. Low, so the 2026-10-02 concern is smaller for CEP than it read. Still disclose any overlap if asked.

## 4. Recommendation

Worth pursuing as a third SEC paper, but not yet and not unchanged. Order: (1) status notice to ISACA now; (2) ask Tanvi; (3) verify A9 and A10 and add URLs and the Jones case number; (4) rebuild to the SEC specification with the socioeconomic argument and a sharper outcome definition; (5) raise it with Lina only after she has responded on the two papers already with her. I rate the odds below the detection paper's (INFERENCE: smaller sample, retrospective outcome rule, one reviewer, thinner fit). SEC's stated acceptance rate is 35 to 40.5% (recorded 2026-10-21); nothing here establishes this paper's odds.
