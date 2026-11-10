# JRS public campaigns: Cialdini evidence gate
Date: 2026-11-10
Status: RESEARCH REVIEW COMPLETE / SOURCE CORRECTIONS PROPOSED / RENDERED AND PRODUCTION ACCEPTANCE PENDING / PUBLIC RELEASE HOLD
Branch: chatgpt/jrs-single-site-two-campaigns-consolidated-20261110
Purpose: assess two existing public JRS campaigns. This record is an editorial/behavioral-science review, NOT evidence that the JRS site has been shown to change behavior.

## Sources
- Cialdini, R.B. (2001). Harnessing the Science of Persuasion. Harvard Business Review. https://hbr.org/2001/10/harnessing-the-science-of-persuasion
- Cialdini, R.B. & Goldstein, N.J. (2004). Social Influence: Compliance and Conformity. Annual Review of Psychology 55:591-621. https://doi.org/10.1146/annurev.psych.55.090902.142015
- Cialdini, R.B. et al. (2006). Managing social norms for persuasive impact. Social Influence 1(1):3-15. https://research.fs.usda.gov/treesearch/45277
- Schultz, P.W. et al. (2007). The Constructive, Destructive, and Reconstructive Power of Social Norms. Psychological Science 18:429-434. https://doi.org/10.1111/j.1467-9280.2007.01917.x
- Goldstein, N.J., Cialdini, R.B. & Griskevicius, V. (2008). A Room with a Viewpoint: Using Social Norms to Motivate Environmental Conservation in Hotels. Journal of Consumer Research 35:472-482. https://doi.org/10.1086/586910
- Cialdini Institute, principles and ethics (reviewed 2026-11-10). https://cialdini.com/about ; https://cialdini.com/principles/reciprocity ; https://cialdini.com/principles/commitment-and-consistency ; https://cialdini.com/principles/authority ; https://cialdini.com/principles/unity ; https://cialdini.com/principles/social-proof
- JRS program, Issue 3.6, sections 03-08 and 21: proposed governing document, owner adoption pending. Earlier O1 outreach control remains described as operative. No source-document publication authorization presumed.
- Repository sources: both campaign HTML pages, index.html, outreach-email-builder.html, assets/jrs-engagement.js, vercel.json, api/support.js, PRs #59, #174, #183, #184, #185 and #186.

## Evidence review and required editorial disposition
1. **Reciprocity**: Providing free resources is consistent with giving first. It does NOT establish that an unrequested resource will influence use or compel any return. Preserve unrestricted free access and no-response-required outreach. Cite Cialdini (2001) and the Cialdini Institute reciprocity guide.
2. **Authority**: Only accurate, directly relevant professional experience may be stated. The homepage and both consolidated campaign pages identify the founder's prior civil-rights review role. The campaign pages expressly distinguish professional experience from former-employer endorsement. Treat this as factual source positioning, not independently measured influence. Cite Cialdini (2001), authority guide.
3. **Unity**: The professional audience and affected-person audience are distinct. Identify genuinely shared professional responsibilities without claiming membership in an organization or institutional approval. Cite Cialdini Institute unity guide, Cialdini (2021, expanded Influence).
4. **Commitment and consistency**: An optional self-check is an educational interaction, not measured commitment. A voluntary explicit 'support' POST can represent assent to the clearly specified principle only, not use, endorsement, or adoption. Never convert passive GET navigation into a support count. Cite Cialdini (2001) and commitment guide. Source: vercel.json and api/support.js, PR #59.
5. **Social proof**: No practitioner or organizational adoption claim is authorized by browser support counts, reviewer-study participation, click counts, or unsent outreach drafts. Do not invent peer endorsements or generalized prevalence claims. Peer field findings are context-dependent; the hotel and environmental studies are not JRS effect studies. Cite Goldstein et al. (2008); Cialdini et al. (2006); Schultz et al. (2007).
6. **Liking**: Respectful tone is acceptable. Do not manufacture common background, flattery, or personal connections. Cite Cialdini (2001), Cialdini Institute liking guide.
7. **Scarcity**: JRS is permanently free for eligible public resources. No fabricated deadlines, limited seats, access threats or artificial exclusivity. Cite Cialdini Institute scarcity guide and JRS program Issue 3.6.
8. **Pre-suasion**: A clearly stated real documentation problem before the example is research-consistent editorial framing; no JRS engagement improvement is established by this choice. Cite Cialdini, Pre-Suasion (2016); https://cialdini.com/glossary/pre-suasion
9. **Email builder**: PR #185 is the implementation source. No reviewed Cialdini study demonstrates that this specific widget benefits these campaigns. Public builder is NOT a requirement of Cialdini's framework. The public tool has been removed from the consolidation branch. Both historical URL forms redirect to the canonical free Resources page. Separate private controlled outreach remains outside this public-site release. Preserve separate, controlled private outreach, no automatic sending. Source: PR #185; JRS O1/Issue 3.6.
10. **Ethics and measurement**: The Cialdini Institute's published code requires truth, no manipulation of persons/facts, and informed agreement. A convincing-looking page is not evidence of effectiveness. Never label an observational GA4 click, browser support, or synthetic exercise as measured influence, comprehension, independent adoption or validation. Source: https://cialdini.com/about ; Cialdini & Goldstein (2004); PR #185 measurement protocol.

## Release gate (not yet passed)
- [x] SOURCE VERIFIED: Remove the public email builder from the branch and reconcile the campaign links, privacy disclosure, analytics fields, redirects and sitemap. Hosted route behavior still requires independent verification.
- [ ] Preserve both separate named initiatives; independently verify all fictional sources, statements, and scope boundaries.
- [x] SOURCE VERIFIED: State the documented founder role on both campaign pages and disclaim former-employer endorsement. Independent audience response is untested.
- [ ] Keep support POST voluntary and explicit; verify all four campaign short links route to education without a support write.
- [ ] Remove all invented counts, artificial scarcity, unverified social proof, claims of increased engagement/understanding/adoption.
- [x] SOURCE VERIFIED: Each campaign now links directly to relevant free resources and discloses no payment, account, reply or expression-of-support prerequisite. Anonymous deployed final-file availability remains a separate acceptance gate.
- [ ] Pass the applicable original JRS PI-0 through PI-8 release gates, source checks, actual mobile tests and protected-data negative tests.
- [ ] Record owner approval of exact source SHA/deployment target, plus deployment and rollback evidence. No address-specific outbound outreach without O1 approval.
- [ ] Do not call this 'scientifically proven for JRS' until a fit-for-purpose independent evaluation provides evidence.

Decision: KEEP IN DRAFT. Research-consistent editorial choices are possible; empirical effectiveness for the specific JRS campaigns has NOT been established. The content of this record alone is not authority to merge, publish or contact anyone.

## Integration evidence receipt, November 10, 2026
- Consolidation pull request: https://github.com/phillipwikes-bit/jrsstandard.com/pull/189 (DRAFT, unmerged).
- Two distinct constructed exercises retained: H-118 (affected-person hiring decision), TR-204 (professional termination approval). These are fictional and have not been independently comprehension-tested.
- Both pages now disclose real former civil-rights review experience and provide direct free first-use links, without asserting institutional endorsement.
- Public email builder removed from branch; old URL variants route to /resources.html, with sitemap, analytics and privacy references reconciled. No public mail sending is provided or authorized.
- Four educational short-link aliases route to campaign HTML rather than the historical GET support writer; explicit voluntary POST support is retained. Live non-write confirmation is pending.
- New automated contract tests/jrs-cialdini-campaign-consolidation.test.mjs and GitHub workflow jrs-consolidated-campaigns.yml passed together with the older five-examples source contract at branch commit 7586bc81c012d0860388928f1e5e539691a2e93f. Later commits require their own rerun.
- Source-level retirement regressions were reconciled without restoring public Review Engine/API/Manifest schema. Exact CI and mobile browser outcomes on the latest head must be consulted rather than inferred from previous branches.
- Research boundary: Cialdini's principles inform accurate communication. The website change has no evidence of a causal effect on clicks, comprehension, adoption or correctness.
