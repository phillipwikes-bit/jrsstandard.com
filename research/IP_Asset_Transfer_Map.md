# JRS / DRR: IP Asset and Rights-of-Transfer Map

*One-page diligence reference for a sale. Separates the free community/adoption layer (top of funnel, not the priced core) from the licensable commercial layer (the priced core), and flags what conveys cleanly versus what needs work before signing. Figures are DB-verified 2026-07-23. Private in `research/`, not deployed. No long dashes.*

---

## The two layers (say this to a buyer up front)

- **Community / adoption layer (free, reach-building, NOT the priced asset):** the DRR term and awareness narrative, the ungated investigator field guides, the public initiative copy and LinkedIn content, free access to the training. Purpose: demand, credibility, and the panel/pilot/training evidence that makes the core worth more. Do not promise the core standard is free in perpetuity.
- **Commercial / licensable layer (the priced asset):** the standard and its certification, the review-instrument software, the validation dataset and reliability evidence, the pilot evidence, the trained-user list (transfer-consented), the marks, and the domain.

---

## Asset inventory

| Asset | Layer | What it is | Rights holder | Conveys cleanly? | Strengthen before sale |
|---|---|---|---|---|---|
| **JRS standard + five conditions (RC1-RC5)** | Commercial | The documented standard (`jrsstandard.html`, `codebook.html`) | Phillip Wikes (sole author) | Yes, if sole-authored | Register copyright; confirm no contractor/reviewer authored text |
| **JRS™ word mark + "Decision Reconstruction Risk" / DRR term** | Both | Brand and the named category | Phillip Wikes (common-law ™) | Partial | **Not registered (® absent, 79 ™ uses).** File trademark(s); a registered mark conveys far stronger and anchors the category claim |
| **Investigator Field Guides (3 editions)** | Community | Employment, Fair Housing, International PDFs | Phillip Wikes | Yes | Keep ungated for reach; they are marketing, not the priced core |
| **Reviewer Training Program + certificate + Reviewer Reference Guide + worksheets** | Commercial | 6-module training, cert generator, reference materials | Phillip Wikes | Yes | Register copyright; the certification right is a recurring-revenue hook |
| **Review-instrument software** | Commercial | `ai-records-pilot.html`, `ai-records-arm-b.html`, SCS calculator, dashboards, Edge Functions (`api/*`) | Phillip Wikes | Yes (code) | Clean-room the repo; separate deploy secrets (below) |
| **Validation dataset + reliability results** | Commercial | Study responses (`ai_pilot_reads`, bench data, de-identified by code), Gwet's AC1 0.74 experts / 0.63 reviewers | Phillip Wikes | Yes (de-identified) | Keep the answer key / gold scoring confidential (trade secret); document provenance |
| **International validation panel (evidence)** | Commercial | Completer sample: 8 countries, 5 continents; named-contributor-only (no reviewer co-authorship in the standard) | Phillip Wikes | Yes as evidence; PII separately | Reviewers hold no rights in the standard (good). Their PII is a separate data asset (below) |
| **Organizational pilots (evidence)** | Commercial | 12 real cases across 2 active domain pilots; healthcare accepted, not started | Phillip Wikes + pilot orgs (data-sharing terms) | Depends on pilot agreements | Confirm each pilot org agreed their contributed evidence can be used and transferred |
| **Trained-user / enrollment list** | Commercial | 6 enrolled, 6 unique people, 5 orgs; **6 of 6 consented to transfer to an acquirer**; 6 completions (US 3, PL 1, KR 1, NG 1) | Phillip Wikes (as controller) | Yes, the transfer-consented subset only | Grow it; keep the two-tier consent so every new row stays conveyable |
| **Domain jrsstandard.com** | Commercial | Apex + www, CNAME configured | Phillip Wikes | Yes | Transfer registrar + DNS at close |
| **In-flight publications** | Community | FOIL (Journal of Civic Information), Business Ethics journal paper | **Shared:** Stacy Young (FOIL); Kyle McMullan / Ubayet Hossain / Sanya (Business Ethics) | **No, co-authored** | Do NOT list co-authored papers as solely conveyable IP; they are third-party-credibility, not owned assets |

---

## Data assets and consent (the part diligence scrutinizes)

- **Transfer-consented trained-user list:** 6 of 6 gave the optional "transfer to an acquirer" consent. This is the only contact list that legally conveys with the IP. It is small but 100 percent clean. Every new enrollment keeps that property because the modal captures both consent tiers.
- **Reviewer panel PII (Arm A V-AI, Arm B RR):** collected for participation, not with an explicit transfer-to-acquirer consent tier. Treat as **not cleanly conveyable** until confirmed. The de-identified response data (keyed by code, no name in the read tables) conveys; the name-to-code mapping is the sensitive part.
- **Pilot contacts (`source='pilot'`) and guide-download analytics:** downloads collect no personal data (anonymous edition + channel counter). Pilot contacts are PII without the transfer tier, same caveat as reviewers.

---

## Conveyance blindspots (fix these to protect the price)

1. **Marks are unregistered.** JRS is used as ™ only. A category play ("own the term DRR") is far stronger with registered marks. File before or as a condition of sale.
2. **Co-authored papers carry shared copyright.** FOIL and the Business Ethics paper cannot be sold as solely owned works. Position them as evidence/credibility, not conveyed assets.
3. **Reviewer and pilot PII lack the transfer-consent tier.** Only the training list has it. Do not represent the full panel/pilot contact lists as transferable without confirming consent.
4. **AI features depend on third-party keys that do NOT convey.** `api/review.js` and the review-engine/run-study/bench-admin functions use `ANTHROPIC_API_KEY`; the stack also depends on Supabase, Vercel, GA4 (`G-NVYHJ7BJ92`), and Google Fonts. The buyer must bring their own accounts and keys. Document this so the demo does not look like it breaks at handoff.
5. **Public "human-rights / free" framing can depress willingness to pay.** Keep the community layer free, but never state in public copy that the core standard or certification is free forever. Preserve the licensable core explicitly.
6. **Founder-dependency and "movement" intangibles.** Community goodwill and volunteers do not convey. Make sure the sale conveys owned entities (marks, copyrights, data, code, domain), not relationships.

---

## Pre-sale checklist (highest value per effort)

1. Register the JRS and DRR marks.
2. Register copyright on the standard, training, and guides.
3. Keep growing the transfer-consented trained-user list; add the transfer tier to any reviewer/pilot re-consent.
4. Get written pilot-org consent to transfer contributed evidence.
5. Separate all deploy secrets from the repo and prepare a clean-room handoff package (code + de-identified data + provenance doc).
6. Keep the answer key / gold scoring as documented trade secret, never in public or in the conveyed code.
7. Hold all public claims to the completer sample (8 countries, 5 continents) and the pre-registered reliability numbers.
