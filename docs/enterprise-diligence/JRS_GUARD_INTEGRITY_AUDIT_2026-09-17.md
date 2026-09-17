# JRS Guard Integrity Audit — 2026-09-17

Scope: `scripts/check_zero_drift.py`, **113 guard functions**.
Mode: offline classification of every guard, plus directed mutation testing of the
high-signal classes. Authority: Category A delegation.

---

## 0. What this audit establishes, and what it does not

**ESTABLISHES.** Which guards carry a structural weakness class, which of those were
mutation-tested, and which failed the mutation. **Four guards were repaired across
Rounds F, G and this cycle**, every repair demonstrated failing against the pre-fix
state.

**DOES NOT ESTABLISH.** That the remaining guards are correct. A classification is a
screen, not a proof. In particular **W4 below is a screen and not a finding** — see §2.

**The governing lesson, stated once.** A guard that passes because the check and the
thing checked share the same mistaken assumption is not a guard. Every defect found
in Rounds F and G was of that shape, and all of them were passing.

---

## 1. Weakness classes and counts

| Class | Meaning | Guards | Treatment |
|---|---|---|---|
| **W1** unit conversion | scales, rounds or multiplies a read value before comparing | **0** | The one instance (`days = months * 30`) was removed by BD-13. None remain |
| **W2** suppressor | a `not in` ANDed onto a bad-thing test, cancelling a finding | **5** | All five read individually; **one was a true defect** (§3.2), four are legitimate predicates |
| **W3** literal | asserts a hardcoded numeric or version literal | **10** | All ten read; nine are policy thresholds (layout limits, byte caps). **One was a true defect** (§3.3) |
| **W5** doc-source | reads a `.md` and asserts from it | **7** | All seven read. In each the markdown **is** the artifact under test, not a proxy for code. No defect. One gap closed anyway (§3.4) |
| **W4** containment | any `in <file-text>` test | **47** | **A SCREEN, NOT A FINDING.** See §2 |

**22 guards carry a high-signal class (W1/W2/W3/W5).** All 22 were read individually.

**4 guards carry no docstring**: `check_cross_endpoint`, `check_no_handwritten_counts`,
`check_no_masking_fallbacks`, `check_panel_geo`. Recorded as **X-5**. A guard without a
stated reason cannot be audited for whether it still tests what it was written to test.

---

## 2. Why W4 is reported as 47 and not as 47 defects

Containment over a whole file is the normal and correct shape for most of these checks:
a banned phrase must be absent from a page, a required marker must be present. Reporting
47 as findings would be exactly the inflation this framework exists to prevent.

**Containment becomes a defect in one specific situation: when a claim and its
qualifier must sit together and the test checks only that both exist somewhere.** That
is the *proximity* subclass, and it has now bitten **three times**:

1. `check_disclosed_retention_matches_the_policy` — a page-wide search for the
   retained-evidence clause passed a mutation deleting it from the disclosure sentence,
   because the same words appear in an unrelated table. Re-anchored to the sentence.
2. `check_manifest_library_holds_its_refusals` — §3.1 below.
3. `check_a_privacy_promise_is_not_contradicted_by_an_export` — fired on the comment
   describing the removal it was checking for. Now strips commentary first.

**The W4 population was therefore triaged by asking which guards check a claim that
needs a qualifier near it, not by mutating all 47.** Three do. All three are fixed.

---

## 3. Defects found and repaired

### 3.1 `check_manifest_library_holds_its_refusals` — W4 proximity — **REPAIRED**

**Mutation.** Append `// This implementation is RFC 8785 compliant.` to
`lib/manifest/canonicalize.js`.
**Before:** **PASS** — "all three refusals proven". The disclaimer at line 5 satisfied a
page-wide `"NOT described as" not in canon` test while the file carried a fresh
compliance claim.
**Repair.** Every occurrence of the RFC must carry a negation within 400 characters of
**that occurrence**; affirmative phrasings banned outright.
**After:** FAIL on both the compliance claim and a bare mention with no nearby negation.
**Restored** by byte comparison.

### 3.2 `check_record_derived_fields_have_no_export_path` — W2 dead suppressor — **REPAIRED**

The branch `if col in body and "BD-11" not in body and "BD-02" not in body` exempted any
page naming those decision ids — including `research-data.html`, which names BD-11 in the
comment describing its own projection. **Superseded by the parsed allow-list and deleted**,
not left beside it: a known-defective branch next to a working one is how a later reader
concludes the defective behaviour was intentional.

### 3.3 `ENGINE_TRUNCATION_LIMIT` — W3 uncoupled literal — **NEW GUARD**

`lib/manifest/hash.js` declared `8000`; both engine routes carried a bare `8000`; **nothing
tied them.** Divergence makes the manifest record `truncated: false`, omit `source_hash`,
and **assert the evaluation covered text the model never received** — verbatim the failure
`hash.js` states its design prevents.
**New guard** reads the cap from the slice expression in both routes. **Three mutations
fail**: engine cap lowered, asymmetric compare-vs-slice, manifest constant moved.
**The duplication is correct and recorded as such**: the routes are Edge Functions and
`lib/` is excluded from deployment deliberately, so importing would undo the public/private
boundary.

### 3.4 The authoritative methodology mapping — W5-adjacent — **NEW GUARD**

`METHODOLOGY_TO_API_MAPPING.md` is authoritative and **nothing referenced it,
`ENGINE_CONDITION_KEYS`, or `cold_reviewer_clarity`.** A sixth engine key or a rename would
have left it silently wrong. **New guard** asserts set equality against the code, holds
`cold_reviewer_clarity` at UNRESOLVED, and refuses any EXACT row but
`basis_identification`. **Four mutations fail.**

---

## 4. Mutation ledger

| # | Target | Mutation | Before | After |
|---|---|---|---|---|
| 1 | manifest refusals | RFC 8785 compliance claim appended | **PASS** | FAIL |
| 2 | manifest refusals | bare RFC mention, no negation near | n/a | FAIL |
| 3 | export path | `conditions` added to research-data | **PASS** | FAIL |
| 4 | export path | `finding` added | — | FAIL |
| 5 | export path | new `reviewer_notes` column | — | FAIL |
| 6 | export path | `select=*` | — | FAIL |
| 7 | export path | `input_preview` on a BD-11 page | **PASS** | FAIL |
| 8 | truncation | engine cap 8000 → 6000 | n/a | FAIL |
| 9 | truncation | compare 8000, slice 4000 | n/a | FAIL |
| 10 | truncation | manifest constant → 12000 | n/a | FAIL |
| 11 | methodology | sixth engine key added | n/a | FAIL |
| 12 | methodology | engine key renamed | n/a | FAIL |
| 13 | methodology | `cold_reviewer_clarity` → EXACT | n/a | FAIL |
| 14 | methodology | semantic row → EXACT | n/a | FAIL |
| 15 | retention disclosure | policy reverted to calendar months | **PASS** | FAIL |
| 16 | privacy promise | export restored | n/a | FAIL |
| 17 | privacy promise | projection narrowed instead of removed | n/a | FAIL |
| 18 | privacy promise | promise edited off finding.html | n/a | FAIL |
| 19 | 401 parity | distinguishable detail restored | n/a | FAIL |
| 20 | table registry | `study_runs` widened to `select=*` | n/a | FAIL |
| 21 | table registry | undispositioned table gains a projection | n/a | FAIL |
| 22 | table registry | `finding_responses` returns by any projection | n/a | FAIL |

**Five mutations passed before repair.** Every mutated file was restored by explicit
byte comparison against a saved copy — **never `git checkout`**, which produced false
passes twice on this project.

---

## 5. Residual

| Item | Status |
|---|---|
| **X-5** | Four guards carry no docstring. **OPEN — LOW.** A guard without a stated reason cannot be audited for whether it still tests what it was written to test |
| W4 population | 44 of 47 are ordinary containment and correctly so. Re-triage if a guard starts checking a claim that needs a qualifier beside it |
| Coverage | **This audit does not establish that the other 109 guards are correct.** It establishes that the four structural weakness classes were enumerated and the high-signal ones read individually |

---

## Appendix — every guard, classified

| Guard | Weakness class | Docstring |
|---|---|---|
| `check_a_page_leads_with_its_own_action` | — | yes |
| `check_a_privacy_promise_is_not_contradicted_by_an_export` | — | yes |
| `check_accepted_article_is_tracked` | W2 suppressor, W4 containment | yes |
| `check_alerts_disabled` | W4 containment | yes |
| `check_all_experts_credited` | W4 containment | yes |
| `check_api_contract_has_a_runnable_example` | W4 containment | yes |
| `check_audit_prompt_is_present_and_whole` | W4 containment | yes |
| `check_blinded_manuscript_carries_no_identity` | W5 doc-source, W4 containment | yes |
| `check_certificate_claims_supported` | — | yes |
| `check_checkout_path_active` | — | yes |
| `check_coding_frames_match_the_manuscript` | W5 doc-source | yes |
| `check_commercial_pages_reachable` | — | yes |
| `check_completion_date_implies_completion` | W2 suppressor | yes |
| `check_contributor_carries_no_findings` | W4 containment | yes |
| `check_cross_endpoint` | W4 containment | **NO** |
| `check_crossdomain_citation_is_current` | W5 doc-source | yes |
| `check_data_handling_claims_match_the_implementation` | W4 containment | yes |
| `check_disclosed_retention_matches_the_policy` | — | yes |
| `check_dual_track_band` | W3 literal, W4 containment | yes |
| `check_dual_track_phone_compaction` | — | yes |
| `check_engine_ladder_is_intact` | W2 suppressor | yes |
| `check_enterprise_page_leads_with_its_own_action` | — | yes |
| `check_evaluation_offers_no_certificate` | — | yes |
| `check_every_active_processor_is_disclosed` | W4 containment | yes |
| `check_every_credited_participant_is_an_expert` | W3 literal, W4 containment | yes |
| `check_every_public_table_projection_has_a_recorded_disposition` | — | yes |
| `check_founder_service_layer_is_retired` | W4 containment | yes |
| `check_framework_names_qualified` | W4 containment | yes |
| `check_free_funnel_preserved` | — | yes |
| `check_free_track_bridges_to_the_licence` | — | yes |
| `check_frozen_manuscript_versions_are_immutable` | — | yes |
| `check_generated_docs_current` | — | yes |
| `check_homepage_hero_offers_both_tracks` | — | yes |
| `check_homepage_is_a_landing_page` | W3 literal | yes |
| `check_honor_roster_composition` | — | yes |
| `check_html_figures_bound` | W2 suppressor | yes |
| `check_inline_scripts_parse` | — | yes |
| `check_inquiry_form_is_not_buried` | W3 literal | yes |
| `check_inquiry_options_are_backed_by_the_allowlist` | — | yes |
| `check_manifest_implementation_is_not_deployable` | W3 literal, W4 containment | yes |
| `check_manifest_library_holds_its_refusals` | — | yes |
| `check_manifest_schema_keeps_its_safeguards` | — | yes |
| `check_manifest_truncation_limit_matches_the_engine` | — | yes |
| `check_markdown_pdfs_are_converted` | — | yes |
| `check_named_contributors_are_only_the_ones_who_elected_it` | W4 containment | yes |
| `check_nav_links_reach_their_section` | — | yes |
| `check_no_cloudflare_artifacts` | — | yes |
| `check_no_custom_pricing_estimator_returns` | W4 containment | yes |
| `check_no_duplicate_nav_strips` | W4 containment | yes |
| `check_no_endpoint_relies_on_an_uncapped_limit` | W3 literal, W4 containment | yes |
| `check_no_false_assurance_claims` | W4 containment | yes |
| `check_no_founder_service_funnel_survives_anywhere` | W4 containment | yes |
| `check_no_handwritten_counts` | — | **NO** |
| `check_no_internal_voice_copy` | W4 containment | yes |
| `check_no_masking_fallbacks` | — | **NO** |
| `check_no_new_subscription_funnel` | W4 containment | yes |
| `check_no_price_literals_in_html` | — | yes |
| `check_no_redirect_shadows_a_real_page` | W4 containment | yes |
| `check_no_secrets_in_source` | — | yes |
| `check_no_unapproved_outbound_destination` | — | yes |
| `check_notifications_wired` | W4 containment | yes |
| `check_only_the_active_nav_item_is_gold` | W4 containment | yes |
| `check_openapi_matches_the_implementation` | — | yes |
| `check_owner_only_endpoints_are_not_swept_up_by_the_pii_rule` | — | yes |
| `check_owner_only_research_files_say_so` | W4 containment | yes |
| `check_pages_that_render_engine_output_disclose_validation_status` | W4 containment | yes |
| `check_panel_binder_identical` | — | yes |
| `check_panel_geo` | — | **NO** |
| `check_pii_gate_is_identical_everywhere` | — | yes |
| `check_pricing_constraint_names_its_trigger` | — | yes |
| `check_pricing_is_published` | W4 containment | yes |
| `check_printed_certificate_matches_endpoint` | W4 containment | yes |
| `check_private_paths_stay_unreachable` | — | yes |
| `check_public_downloads_are_not_blocked_by_a_redirect` | — | yes |
| `check_public_engine_endpoints_carry_no_record_text` | W4 containment | yes |
| `check_published_api_contract_matches_the_write_path` | — | yes |
| `check_record_derived_fields_have_no_export_path` | — | yes |
| `check_reliability_figures_are_current` | — | yes |
| `check_reliability_raters_are_not_demoted` | — | yes |
| `check_research_summary_leads_with_its_boundaries` | W4 containment | yes |
| `check_retention_claim_is_scoped` | W4 containment | yes |
| `check_revenue_model_is_licensing_only` | W4 containment | yes |
| `check_review_controls_is_the_pdf` | — | yes |
| `check_robots_directives_coherent` | W4 containment | yes |
| `check_rung2a_lock` | — | yes |
| `check_sandbox_is_failclosed` | W2 suppressor, W4 containment | yes |
| `check_sandbox_is_reachable_and_gated` | W4 containment | yes |
| `check_second_read_completeness_is_published` | W4 containment | yes |
| `check_second_read_reported_honestly` | W5 doc-source | yes |
| `check_security_page_exists_and_is_linked` | W4 containment | yes |
| `check_send_copy_is_clean` | W5 doc-source | yes |
| `check_site_nav_present` | W4 containment | yes |
| `check_sitemap_keeps_free_material` | — | yes |
| `check_sitemap_no_duplicates` | — | yes |
| `check_skip_token_lands_where_cloudflare_reads_it` | W3 literal, W4 containment | yes |
| `check_style_tags_balanced` | — | yes |
| `check_submission_package_is_self_contained` | W4 containment | yes |
| `check_superseded_manuscripts_not_listed` | — | yes |
| `check_telemetry_parity` | — | yes |
| `check_the_check_page_never_transmits_an_answer` | — | yes |
| `check_the_methodology_mapping_tracks_the_executable_vocabulary` | W5 doc-source | yes |
| `check_track1_pages_lead_with_an_action` | W3 literal | yes |
| `check_tracked_guides_carry_exactly_one_routing_page` | — | yes |
| `check_tracker_logged_today` | W5 doc-source | yes |
| `check_training_is_ungated` | W4 containment | yes |
| `check_training_modules_are_findable` | W3 literal, W4 containment | yes |
| `check_trust_pages_carry_their_proof` | W4 containment | yes |
| `check_ubayet_is_described_as_he_asked` | W3 literal, W4 containment | yes |
| `check_util_bar_does_not_hide_links_on_a_phone` | — | yes |
| `check_vendor_question_is_asked_once` | — | yes |
| `check_withdrawn_contributor_is_not_defaulted_into_being_named` | — | yes |
| `check_withdrawn_contributors_absent` | — | yes |
| `check_zero_retention_claim_is_true` | W4 containment | yes |
