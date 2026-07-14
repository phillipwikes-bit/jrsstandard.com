# JRS IP Sale Playbook (operating document)

**Standing directive (Phillip, 2026-07-13):** always take whatever legitimate steps raise IP value and move toward a sale. This file is the operating plan for that. Integrity rule that governs everything below: only real, verifiable assets and claims. Diligence tests every number; JRS's brand is documentation defensibility; a fabricated figure would destroy the asset. Nothing here is asserted beyond what the data shows.

---

## 1. What is actually being sold (the asset bundle)
Not "a standard." A bundle a strategic buyer pays for:
- A coined, ownable problem category: Decision Reconstruction Risk (DRR), plus the five conditions, the three-read scale, and the seven AI failure modes.
- A labeled, blind-verified 24-record dataset with an independently reproduced answer key (a benchmark asset).
- A working, self-updating reproducibility engine (nightly cross-vendor, 84%).
- An international, credentialed reviewer panel (26 registered, 7 complete) across a dozen countries.
- A methodology authored by a Big-Four model-validation director (Ubayet Hossain, KPMG).
- A finished investigator Field Guide product line (EEO, Fair Housing, International), favorably recommended in writing in Dewey Publications' _News and Case Alert_ (Issue #18-07, July 10 2026, author Peter Broida): a datable, quotable third-party mention, not an endorsement. (Earlier notes called this a "podcast"; the verified artifact is the newsletter. Quote it accurately.)
- Two co-authored papers in progress (FOIL with Stacy Young; Business Ethics with Sanya/Tanvi) and a drafted Detection/Arm B paper for AI and Ethics.
- Live web product surface: training + certification, review-engine API, enterprise page, dashboards.
- A growing consented audience: guide downloads (counter) and training enrollments (name/org/title/email) as demand and adoption proof.

## 2. The value grades and the gaps (honest)
- Research credibility: strong and improving (reproducibility, reliability, verified key, pre-registration).
- Commercial proof: weak. Zero paying or piloting organizations. This is the binding constraint.
- Acquisition readiness: middling. Assets are real but scattered; the acquisition prospectus omits several flagships.

The single highest-value move is not more research. It is one real organization using JRS, plus consolidating the asset story.

## 3. Prioritized path to sale

### Tier 1: what raises value the most (mostly needs Phillip)
1. Land ONE real-org pilot. Even an unpaid 5-record internal review at a real org (Nitin/CHRO, Keith/compliance, Jason/Oakdale, Tanvi's employer). This flips "zero demand" to "in use," and it moves a buyer more than any study.
2. Finish the reviewer panel to a defensible n and run Arm B. This earns the strong "JRS beats unaided review" claim and completes the Detection paper.
3. Trademark JRS and DRR now (months-long). Category ownership is the durable moat.
4. Get contributor IP agreements signed. 26 unpaid international reviewers with no signed disclaimer is the biggest late-diligence killer. Cheap to fix now while relationships are warm.
5. Package the Field Guide as a finished, versioned product line and get the Broida mention in writing (accurately, non-endorsement) plus his author introductions.

### Tier 2: the evidence package (Claude can draft; Phillip approves)
6. The 40-60 page JRS Validation Report: one referenceable PDF pulling together reproducibility, reliability, the verified key, the pre-registered plan, and the panel. The highest-leverage document that does not wait on peer review.
7. Post a preprint (OSF/SSRN) of the DRR concept and the pre-registered protocol to timestamp the category and the design.
8. Sequence the three papers: Detection (AI and Ethics) first, FOIL second, Business Ethics third.

### Tier 3: consolidate the storefront (Claude can build; Phillip approves deploy)
9. Update the acquisition prospectus (acquisition-9f3c2a7d4b.html) to include the Field Guide product line, the Broida mention (non-endorsement), the named panel, the OpenAPI/partner schema, and the dataset/engine. It currently omits these flagships.
10. Turn interest into named adoption: the training-enrollment capture (built; awaiting the one-time table SQL) and the download counter. Report enrollments and downloads by organization and title as demand evidence.
11. One consistent asset list across the homepage, the standard doc, and the prospectus.

### Tier 4: housekeeping that protects value
12. Rotate/replace the Supabase management token (the current one is rejected by Supabase). Not blocking (writes now go through service-role edge functions), but a clean credential posture reads well in security diligence.
13. Keep research/ private on production (verified: answer key and this file return 404). Never expose the key.
14. A short privacy policy page before scaling PII collection (training enrollments). On-brand for a documentation-governance product. **DONE (staged) 2026-07-13: `privacy.html` built, mirrors the public-page chrome, covers enrollment PII + the two consent tiers + private-by-construction storage; unlinked/not deployed. To finish: link it from the site footers and the enrollment modal, bundled with the training deploy.**

## 4. Honest probability of sale
- As-is today: low. Promising standard, early validation, scattered story, zero demand proof.
- After Tier 1 (a real-org pilot, panel + Arm B, trademark filed, IP agreements, Field Guide packaged) plus Tier 2 (Validation Report, preprint): moderate-to-good for a strategic buyer (investigations publisher, compliance/GRC, legaltech, AI-governance) who values the dataset, panel, category, and channel.
- Add real commercial traction (a paying or renewing pilot): good.
- Biggest single lever remains commercial: one organization actually using it.
- Most durable value regardless of sale: ownership of the DRR vocabulary.

## 5. What Claude does autonomously vs. what needs Phillip
- Autonomous (build, draft, instrument, verify): infrastructure, drafts, dashboards, prospectus edits (staged), the Validation Report, preprint prep, messaging drafts. Deploys to production are prepared and proposed, not shipped without a green light.
- Needs Phillip (outward-facing / legal / real-world): sending messages to real people, running the one-time table SQL, trademark filing, signing contributor agreements, buyer outreach, and any claim of endorsement or compliance.
- Never: fabricate data, certify unverified work, misrepresent the Broida mention as an endorsement, or expose PII or the answer key.

## Progress log
- 2026-07-13 - Playbook created under the standing directive. Immediate in-flight items: training-enrollment capture (built; awaiting one-time table SQL) and the Detection/Perspective papers (drafted). Next proposed autonomous step: enhance the acquisition prospectus (Tier 3, item 9) on dev for Phillip's deploy approval, and draft the Validation Report (Tier 2, item 6).
- 2026-07-13 (later) - Autonomous execution round:
  - Tier 2 item 6 DONE (draft): `research/JRS_Validation_Report.md` + rendered `research/JRS_Validation_Report.pdf` (11-page confidential dossier). Consolidates reproducibility, reliability, verified key, pre-registered floors, Arm B, panel, and data/privacy architecture. Every figure traceable; accuracy gated; no effectiveness claim. Awaiting Phillip's review.
  - Tier 3 item 9 DONE (staged, not deployed): `acquisition-9f3c2a7d4b.html` now includes the reviewer panel (26 across ~a dozen countries, 7 complete, acknowledgment-not-endorsement), the Investigator Field Guide line (Dewey mention as a mention, not endorsement), and the versioned partner review API, added to both the included list and the IP inventory. Ready to deploy on Phillip's green light.
  - Table-without-SQL-editor RESOLVED (item 10 unblock path found): the repo already ships `scripts/supabase-apply.py`, which applies DDL through the Supabase Management API (the network policy blocks Postgres ports but allows api.supabase.com). A SessionStart hook runs it automatically. It needs one thing: a valid `SUPABASE_ACCESS_TOKEN` set as an environment variable in the Claude Code web environment settings (NOT pasted in chat, NOT the SQL editor). The `training_registrations` table + `training_stats` view (plus `ai_pilot_reads`, `guide_downloads`, `guide_download_stats`) are now folded into `supabase-ALL.sql`, so once the token is provisioned the whole data layer applies idempotently in one no-op-safe run. This is the clean credential path that also satisfies Tier 4 item 12 (token hygiene). DDL genuinely cannot be done without SOME valid token or the SQL editor; there is no third way, and repurposing an existing private table for PII was rejected as unsafe.
  - Still gated on Phillip: run the enroll table (provision the token, then the hook applies it), then deploy `training.html` + `pilot-status.html`; approve prospectus deploy; Tier 1 real-world items.
- 2026-07-13 (later still) - Tier 4 item 14 DONE (staged): `privacy.html` built and pushed to dev, matching the public secondary-page chrome exactly. Covers training-enrollment PII, the required-contact vs optional-transfer consent tiers, the private-by-construction storage model, sharing limits, retention, and access/deletion via info@jrsstandard.com. Unlinked and not deployed. Follow-up (bundle with the training deploy): add a Privacy link to the site footers and point the enrollment modal's privacy note at it.
