# JRS Audit Execution Report

**Repository:** `phillipwikes-bit/jrsstandard.com`
**Branch:** `claude/html-pilot-L8rC3` · **Production:** `main`
**Window audited:** commit `b4d1c25` to `ce67fb4`
**Production head at time of writing:** `cc86581`
**Report generated:** 2026-08-09

---

## A. Summary of Codebase Modifications

### A.1 Files modified or created

**Public files, all deployed to production.**

| File | Lines changed | What changed |
|---|---|---|
| `access.html` | +93 / -20 | Utility-first reframe, delivery-specific consent copy, OpenGraph and canonical block, inline terms panel, per-mode trust lines |
| `org-pilot.html` | +166 / -35 | Zero-field instant test, gate cut from five fields to three, self-contradicting registry paragraph rewritten, sector relocated downstream, `orgName()` fallback |
| `training.html` | +36 / -6 | Gate cut to name and work email, certification headline, inline terms panel, trust line |
| `research.html` | +53 / -4 | Headline metrics dashboard, five-condition public block, three stale figures corrected |
| `investigator-guides.html` | +10 / -3 | Asset metadata on guide cards, authority line, reviewer counts |
| `privacy.html` | +8 / -4 | Section 3 and 5 rewritten to match the split-consent model, `id="consent"` anchor added |
| `honor.html` | +19 / -3 | Inline terms panel replacing a blocked new-window link |
| `vercel.json` | +307 / -2 | 55 redirects (43 bare paths, 5 clean campaign URLs, 3 pilot aliases, 4 pre-existing), sitewide security headers |
| `api/honor.js` | +13 / -4 | Scope note corrected: the Honor is not single-recipient |
| `index.html` | +2 / -2 | Record-cap correction |
| `contributor.html` | +2 / -2 | Record-cap correction |
| `supported.html` | +2 / -2 | Record-cap correction |
| `decision-reconstruction-risk.html` | +2 / -2 | Record-cap correction |
| `acquisition-9f3c2a7d4b.html` | +2 / -2 | Reviewer-count correction |

**Total public change: 14 files, +622 / -93.**

**Private research files, never deployed.** `research/` is excluded from every production push by the selective-deploy pattern, verified at zero staged files on each of the seven deploys in this window.

| File | Status |
|---|---|
| `research/build_blind_recheck_packet.py` | Created, 226 lines |
| `research/build_expert_roster.py` | Fixed: RR-129 added, hardcoded completer count removed |
| `research/build_certificate.py` | Fixed: title parameterized |
| `research/Honor_Materials_For_Stacy_Review_2026-08-08.md` + `.docx` | Created |
| `research/Message_Stacy_Young_Reply_2026-08-08b.md` + `.docx` | Created |
| `research/Blind_Recheck_Packet_E08.md` + `.docx` | Created |
| `research/Blind_Recheck_KEY_E08.md` | Created. Never sent |
| `research/DRAFT_Honor_Certificate_Stacy_Young.pdf` | Created, then retitled |
| 21 reviewer certificate PDFs | Regenerated, wording unchanged |
| `research/Dossier_Stacy_Young_2026-08-08.md` + `.docx` | Updated |
| `research/MASTER_TRACKER.md` | 15 entries appended |

### A.2 `/pilot`: how the diagnostic was de-risked

**Route corrected first.** `/pilot` resolved to `pilot.html`, the legacy Pilot Program marketing page, because the 43 bare-path redirects were generated mechanically from filenames. It now resolves to `org-pilot.html`, the screen a person handed that link can actually act on. `pilot.html` keeps a bare path at `/pilot-program`, and `/check` and `/diagnostic` were added as aliases.

**Zero-field instant test added.** A visitor can now paste one record and get the full five-condition read with no name, no email, no consent tick and no account. It is wired directly to `/api/review` and deliberately shares nothing with the pilot session object: it does not increment the run counter, does not call `/api/org-pilot`, and records nothing anywhere. It sits above the workspace gate, so the instrument proves itself before an identity is requested.

**Gate cut from five fields to three.**

| Before | After |
|---|---|
| Organization (required) | Your name |
| Sector (dropdown) | Work email |
| Full name | Organization (optional) |
| Title or role | *removed from the flow* |
| Email | *sector moved to the workspace* |

Sector is now asked beside the finish button in the review workspace, after a read has been delivered. Title is gone entirely.

Making organization optional broke four printed strings: the workspace eyebrow, the thank-you line, and both the title and body of the downloadable executive summary. All four now route through an `orgName()` fallback.

**The self-contradicting paragraph was rewritten.** It read *"Organizations that run the diagnostic join the International Registry of Supporters"* and then, in the next sentence, that listing was optional. A reader who stops at the first sentence hears auto-enrolment of their firm. The word "join" no longer appears:

> Running an organizational pilot is confidential. Your records are processed in memory and never stored or retained, and running one carries no public endorsement obligation. After you have your results, you will have the option, only if you want it, to add your organization's name to the public International Registry of Supporters.

**Deliberate departure from the directive's wording.** The directive specified *"100% Confidential."* The page says "confidential" without the quantifier, because the run is not absolutely confidential and the privacy panel four paragraphs down says so: the count of records run and the pattern of results is kept, which is how the programme reports that an organization used the standard. Writing "100% confidential" above copy that contradicts it would reintroduce exactly the self-cancelling structure this fix removed.

**Acquisition and data-transfer copy is off every tick line on the site**, on `access.html`, `org-pilot.html`, `training.html` and `honor.html`. It was not deleted, because `consent_transfer` is still recorded on those rows and dropping the disclosure while keeping the field would be misrepresentation. It moved one tap behind a live "registration terms" link that opens an inline panel carrying the full three-part disclosure, deep-linked to `privacy.html#consent`.

### A.3 `/guide`: open access and asset presentation

**Asset metadata added** to all three guide cards: `Instant PDF · 9 pages · printable audit matrix · free to use and share`.

**Authority anchored in the hero credentials line**, now carrying the M.S. in Negotiation and Conflict Management alongside the MCCR role and the corrected reviewer base.

**Consent copy made delivery-specific.** The guide route previously said *"I agree to receive my results,"* which promises something a PDF download never delivers. It now reads *"I agree to receive the Fair Housing edition"* (or the relevant edition name, set at runtime from the same label that drives the headline), falling back to "my guide" when no edition is named. The "no record text is ever stored" clause was also wrong on that route, since nothing is pasted at that moment, and is swapped for the not-published assurance alone.

**The guide lede was cut to a single deliverable.** It previously carried *"and your registration also opens the free record check,"* a second offer competing with the file the reader came for. The diagnostic offer now appears only on the thank-you screen, after the file is delivered.

**One-click open access implemented, and the email capture kept.** The directive's heading and its body asked for different things: the heading said one click, the body said instant download upon submission. Both are now satisfied without trading one for the other.

The primary button on each card is **Download now**, pointing straight at `/api/dl?e=<edition>&src=guides`, which counts the download and serves the file. No form, no name, no email, no tick. `api/dl.js` gated the three editions on 2026-08-02; that branch is now opt-in rather than default, triggered by `?gate=1` or by the legacy `src` values (`site`, `email`, `signature`, `footer`), so every guide link already distributed keeps landing on the form and nothing sent before today changes behaviour.

Underneath each button sits a labelled second choice, **Email it to me instead, with the free record check**, which requests the gate explicitly at `/api/dl?e=<edition>&gate=1&src=site`.

The capture ask moved behind the delivery rather than disappearing. Clicking a direct download reveals a panel headed *Your download has started*, offering the `JRS Field Specialist` designation and the free record check, with a retry link for anyone whose download did not fire and two routes onward: register, or run one record with no sign-up.

**The evidence for making this change rather than defending the gate:** between 2026-08-02 and 2026-08-09, 18 people opened the guide form and 0 completed it. A gate returning zero registrations is not capturing anything, it is only losing readers.

### A.4 `/reviewer`: training and certification

**Progress framing was already endowed** and was verified rather than changed. `updateProgressDisplay()` renders `Step 1 of 6 · Ready to start` at zero, `Step N of 6 · N complete` in progress, and `Complete · 6 of 6` at the end. No `0 / 6` deficit counter exists in the codebase.

**Module 1 preview is open.** The enrolment overlay carries a "Keep previewing Module 1" dismissal, so a visitor reaches the content without registering.

**Gate cut to two visible fields.** Organization and title were optional inputs at enrolment, which buried the one required field below two optional ones. They are now hidden fields carrying empty values, and the credentials are collected at certificate issuance after Module 6. Email was relabelled "Work email".

**Headline reframed.** The enrolment overlay read *"Join the International Registry"* over a certification form, the same mismatch the campaign gate had. It now reads **Start Your JRS Certification**, with a lede written from what the reader gets.

### A.5 `/api/support`: clean routes and downstream advocacy

**Clean campaign URLs added**, so nothing shared in a post, an email signature or a slide has to look like a developer query string.

| Public URL | Resolves to |
|---|---|
| `/rtkw` and `/right-to-know-why` | `access.html?c=rtkw` |
| `/defend` and `/decisions-you-can-defend` | `access.html?c=defend` |
| `/support` | `access.html?c=general` |

Campaign and source attribution survive every hop, verified live end to end on both campaigns.

**The endpoint itself was probed with twelve parameter shapes and is sound.** Campaign values pass an allowlist, so `c=bogus`, `c=../../etc/passwd` and an ampersand-injected `c` all collapse to `general` rather than reaching the page. The `src` value is stripped to alphanumerics, which reduced a `<script>` payload to inert text, and capped at 40 characters. The redirect is built from `url.origin`, so there is no open-redirect surface. The `src=verify` smoke-test bypass still routes to the thank-you page without writing a row.

**Advocacy is downstream everywhere.** The public Registry ask exists only on thank-you screens, on `access.html` (both modes), `org-pilot.html` and `training.html`, via `listingBlock()` / `wireListing()`. The `Registered International Advocate` designation was moved into that block rather than spent on the gate. On the campaign gate, the endorsement verb was removed entirely: registering no longer "records you as backing" a campaign but "gives you immediate, confidential access", with the attribution stated as an individual practitioner and never on behalf of an employer.

### A.6 Corrections found during the audit that were not on the brief

| Finding | Severity | Resolution |
|---|---|---|
| `/pilot` and all 43 extensionless URLs returned 404 | High | 43 bare-path redirects added. Explicit redirects rather than `cleanUrls`, so already-issued opaque links keep working unchanged |
| `access.html` had no OpenGraph block or canonical, and it is the terminal page for every campaign link | High | Full og, twitter, canonical and favicon blocks added. 55 of 88 gated opens come from LinkedIn, where a link with no og block renders as a bare grey row |
| The "registration terms" link was inert: `target="_blank"` blocked by in-app browsers, the parent `<label>` stealing the tap, and `--accent-dim` styling reading as disabled | High | Inline panel, `preventDefault` + `stopPropagation`, live accent styling, `scrollIntoView`, and a label that flips to "hide the details" |
| No security headers on any response | Medium | `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` set sitewide |
| Four pages promised a "ten record" check against a live cap of 25 | Medium | Corrected on ten pages |
| Honor certificate titled "Certificate of Completion" | Medium | Retitled "Certificate of Recognition". Title parameterized so all 21 reviewer certificates are unchanged |
| `build_expert_roster.py` disagreed with `count_participants.py` | Medium | RR-129 added, hardcoded `32` replaced with a derived count |
| No Content-Security-Policy | Open | Not set, deliberately. Every page uses inline `<style>` and `<script>`, so a policy strict enough to be worth having would blank the site. Recorded as a known gap rather than shipped broken |

---

## B. Cialdini Persuasion Framework Audit Matrix

| Principle | Where it is implemented | Verified in code |
|---|---|---|
| **Reciprocity** | Zero-field instant test on `org-pilot.html`: a complete five-condition read on a real record for no name, no email, no consent and no account. Three Investigator Field Guides free with no payment and no registry sign-up. Module 1 of the training readable without enrolling. The full standard, codebook and research data public and unauthenticated. | `#sandbox` section and its `sb-go` handler in `org-pilot.html`; `dismissEnroll()` in `training.html`; `.gcard` blocks in `investigator-guides.html` |
| **Authority** | Creator credentials in the hero credentials line of every gate: former Lead Civil Rights Officer, Maryland Commission on Civil Rights, M.S. Negotiation and Conflict Management. Empirical base stated alongside: 54 international reviewers, 33 full-set completers, 16 countries. Named panel with roles and countries on the roster. Pre-registered thresholds named, and the two that are not met say so. | `.cred` block in `access.html`, `org-pilot.html`, `investigator-guides.html`; metrics dashboard in `research.html` |
| **Social proof / consensus** | Four-card headline dashboard on `research.html` directly under the hero, each card carrying the figure, the sample it rests on, its confidence interval and the date computed: 83.9% detection accuracy (16 experts, 11 countries, 384 determinations, CI 72.7–95.1); Gwet's AC1 0.739 / 0.624; 86.7% cross-vendor on the latest nightly with a 82.2–93.3 range; 54 reviewers with 33 completers. Live registry size fetched from `/api/support-stats` on the campaign gate. | `#vd-h` section in `research.html`; `fetch('/api/support-stats')` in `access.html` |
| **Liking / alignment** | Acquisition and transfer language off every tick line and one tap behind an inline terms panel. Memory-only processing stated in the trust line under every diagnostic CTA. Self-contradicting registry paragraph removed. Endorsement verb removed from the campaign gate, with attribution framed as an individual practitioner and never on behalf of an employer. Agency-clearance section written for public-sector recipients. Privacy sections 3 and 5 rewritten to describe the split-consent model accurately. | `#p-terms`, `#en-terms`, `#h-terms`, `#registry-detail` panels; `.trust` and `.fine` lines; `privacy.html` §3 and §5 |
| **Commitment & consistency** | Public Registry ask exists only on thank-you screens, after delivery. The `Registered International Advocate` designation is offered there rather than at the gate. Endowed progress framing in training: `Step 1 of 6 · Ready to start`, never `0 / 6`. Credentials collected at certificate issuance rather than at enrolment. The instant test creates a small first commitment that the 25-record workspace then extends. | `listingBlock()` / `wireListing()` in `access.html`, `org-pilot.html`, `training.html`; `updateProgressDisplay()` in `training.html` |

**Scarcity** is not used anywhere, deliberately. Every asset on this site is free, unlimited and permanent. Manufacturing urgency around an open standard would be false, and it is the one signal a due-diligence reader treats as evidence that the other numbers were massaged.

---

## C. Empirical Metrics: Verification Record

Every figure below was recomputed from the study database during this audit rather than transcribed.

| Metric | Published before | Published now | Source |
|---|---|---|---|
| Expert detection accuracy | 83.9% | **83.9%** (unchanged, verified) | 16 experts, 11 countries, 384 determinations, CI 72.7–95.1, sensitivity 87.0%, specificity 80.7% |
| Inter-rater reliability | 0.74 / 0.62 | **0.739 / 0.624** | Gwet's AC1, 10 records, 99 retained labels, both clear the pre-registered 0.61 floor |
| Cross-vendor consistency | 84% | **86.7%** latest nightly, range 82.2–93.3 | `study_runs`, STUDY-001, 37 runs at the full 15-record set, latest 2026-08-09 |
| International reviewers | 53 | **54** | `count_participants.py` and `build_expert_roster.py`, now in agreement |
| Full-set completers | 32 | **33** | Arm A 16 + Arm B 17; RR-129 completed 2026-08-07 |
| Countries | 16 | **16** (floor, not a count) | RR-129's country sits in RLS-locked `bench_experts` and is recorded as unknown rather than guessed |

**The 84% figure in the audit brief was a month stale**, dating to 2026-07-06. `research/Accuracy_Sweep_2026-08-01.md` had already flagged hardcoding a single nightly number as the wrong pattern. The site now carries the latest with its date and its range beside it.

**The five condition names in the brief were paraphrases and were not adopted.** The brief listed *Evidence Identification*, *Traceable Reasoning* and *Evidence Sufficiency*. The canonical names in `api/review.js`, `codebook.html`, all three manuscripts and every issued certificate are **Basis Identification**, **Decision-Process Traceability** and **Evidentiary Sufficiency**. Renaming to match the paraphrase would have broken alignment between the site, the review engine and the peer-reviewed drafts, which is precisely the alignment a diligence team checks. The canonical names are published.

---

## D. Open Items

| Item | Type | Note |
|---|---|---|
| Content-Security-Policy | Security | Requires nonce injection at the edge or extracting all inline assets. A project, not a header |
| LinkedIn card re-scrape | Distribution | Existing posts will keep showing the pre-fix grey row until each campaign URL is run through the LinkedIn Post Inspector |
| Honor roster expansion | Programme | `ROSTER` in `api/honor.js` holds one entry and needs 33, each with an unguessable key and a citation naming what that person did |
| RR-129 country | Data | Not recoverable from a public read. Requires a service-role query |
| TLS chain verification | Security | Not assessable from the audit environment: outbound HTTPS runs through a proxy that presents its own certificate. HSTS confirmed at `max-age=63072000` |

---

*Generated from the repository at commit `ce67fb4`. All live figures pulled 2026-08-09.*
