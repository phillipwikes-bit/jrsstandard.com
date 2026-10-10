# Legacy guard failure triage record (internal)

**Run date 2026-10-07. `scripts/check_zero_drift.py` at `7205eea` (unchanged by this package): 164 checks, 37 failed, 1 skipped. The guard suite is not green.** Machine-readable form: `tools/evaluation-readiness/legacy-guard-triage.json`. This record classifies failures; it fixes none and suppresses none.

## Current implementation, target and absent evidence
- **Current implementation:** the counts and messages below were observed on this branch on 2026-10-07 and compared with `origin/main` (`97087e9`) the same day.
- **Target:** a guard suite whose failing set is either green or an owner-dispositioned record. That target needs the owner actions in the last column.
- **Absent:** no owner disposition of any failure exists in the repository.

## Stable baseline and the variable check
- **Stable baseline: 37.** The first run of 2026-10-07 showed 38 because `Master Tracker written to today` is date-dependent: it fails until `research/MASTER_TRACKER.md` has an entry for the current date and passes once one exists. The 37 reported on 2026-10-06 and the 37 here are the same set.

## Source comparison with `origin/main` (`97087e9`, 164 checks, 38 failed, 1 skipped)
| Check | main | this branch | Cause |
|---|---|---|---|
| Master Tracker written to today | FAIL | PASS | date-dependent; main has no 2026-10-07 entry |
| reliability claims preserve E-038 population and criterion status | FAIL | PASS | fixed by `7bfb13e` |
| the cross-vendor range carries its own denominator | FAIL | PASS | fixed by `7bfb13e` |
| disclosed retention matches the policy | PASS | FAIL | introduced on this branch by `3758d76` |
| pages rendering engine output disclose validation status | PASS | FAIL | introduced on this branch by `3758d76` |

Every other failure below fails on `main` too.

## Categories
| Category | Count | Meaning | Required next action |
|---|---|---|---|
| PUBLIC_PAGE_STRUCTURE | 7 | A served public page lacks the structure the guard expects. | Edit the named public page(s). Requires the owner's publication approval (CLAUDE.md sections 23 and 26). |
| COMMERCIAL_PATHWAY_RETIRED | 10 | The guard expects commercial, licensing, pricing, sandbox or inquiry content that the 5 October handoff removed or prohibits. | Owner decision: either the guard is updated to the handoff position, or the content is restored. Neither is in scope; the guard file may not be edited here. |
| ENGINE_CLOSED_SUBJECT_MOVED | 13 | The guard checks Engine, Manifest or API code that was closed or restructured (the review routes refuse every request since 4 October 2026), so the code it reads has moved or gone. | Owner decision on whether each guard is retired, re-pointed or kept failing as a record. Requires a guard-file change, which is outside this assignment. |
| DEPLOYMENT_EXCLUSION | 1 | Files under api/_manifest/ sit outside every .vercelignore rule, so the guard reports the Manifest implementation as deployable. | Owner decision on deployment configuration (.vercelignore or the api/ layout). Deployment configuration may not be changed here. |
| DISCLOSURE_DIVERGENCE | 1 | Public disclosure text no longer states the 90-day period lib/retention/policy.js sets. Introduced on this branch by 3758d76 (public boundary repairs). | Owner decision on the disclosure wording or the policy value, then a public page edit under publication approval. |
| HUMAN_CLASSIFICATION_REQUIRED | 1 | Hosts referenced in code or pages are absent from .jrs/registries/OUTBOUND_DESTINATIONS.json (reserved test hosts example.invalid, example.test, local.invalid and one external link on resources.html), and four inventory hosts are no longer referenced. | A person classifies each host, as the guard requires by design, and the disclosure is reconciled. Not done automatically. |
| ENVIRONMENT | 1 | research/build_reviewer_eval_certificate.py imports reportlab, which is not installed in this session's environment. | Install reportlab in the environment that runs the guard, then re-run. No repository change is indicated by this failure alone. |
| RECORD_DRIFT | 3 | A repository record names a page or entry that no longer matches reality. | Update the named record under human review, or restore the page. Not in scope. |

## Failures (exact identifiers)
| ID | Guard function | Check | On main | Category |
|---|---|---|---|---|
| LG-01 | `check_trust_pages_carry_their_proof` | trust pages carry the credential and its proof | FAIL | COMMERCIAL_PATHWAY_RETIRED |
| LG-02 | `check_inquiry_options_are_backed_by_the_allowlist` | inquiry options are backed by the allowlist | FAIL | COMMERCIAL_PATHWAY_RETIRED |
| LG-03 | `check_printed_certificate_matches_endpoint` | printed certificate wording matches the endpoint | FAIL | ENVIRONMENT |
| LG-04 | `check_robots_directives_coherent` | no noindex page sits in the sitemap | FAIL | PUBLIC_PAGE_STRUCTURE |
| LG-05 | `check_site_nav_present` | site nav present on every public page | FAIL | PUBLIC_PAGE_STRUCTURE |
| LG-06 | `check_no_redirect_shadows_a_real_page` | no redirect shadows a page that exists | FAIL | PUBLIC_PAGE_STRUCTURE |
| LG-07 | `check_a_page_leads_with_its_own_action` | pilot.html has a hero button row | FAIL | PUBLIC_PAGE_STRUCTURE |
| LG-08 | `check_util_bar_does_not_hide_links_on_a_phone` | util bar wraps instead of hiding links on phones | FAIL | PUBLIC_PAGE_STRUCTURE |
| LG-09 | `check_enterprise_page_leads_with_its_own_action` | enterprise.html leads with its own action | FAIL | COMMERCIAL_PATHWAY_RETIRED |
| LG-10 | `check_free_track_bridges_to_the_licence` | free-track pages bridge to the licence | FAIL | COMMERCIAL_PATHWAY_RETIRED |
| LG-11 | `check_api_contract_has_a_runnable_example` | API contract carries a runnable example | FAIL | ENGINE_CLOSED_SUBJECT_MOVED |
| LG-12 | `check_openapi_matches_the_implementation` | openapi spec matches the implementation | FAIL | ENGINE_CLOSED_SUBJECT_MOVED |
| LG-13 | `check_security_page_exists_and_is_linked` | security one-pager exists and is linked | FAIL | ENGINE_CLOSED_SUBJECT_MOVED |
| LG-14 | `check_track1_pages_lead_with_an_action` | Track 1 pages lead with an action | FAIL | PUBLIC_PAGE_STRUCTURE |
| LG-15 | `check_sandbox_is_failclosed` | sandbox is fail-closed | FAIL | COMMERCIAL_PATHWAY_RETIRED |
| LG-16 | `check_sandbox_is_reachable_and_gated` | sandbox is reachable and gated | FAIL | COMMERCIAL_PATHWAY_RETIRED |
| LG-17 | `check_pricing_is_published` | pricing posture is published | FAIL | COMMERCIAL_PATHWAY_RETIRED |
| LG-18 | `check_no_custom_pricing_estimator_returns` | no custom pricing estimator returns | FAIL | COMMERCIAL_PATHWAY_RETIRED |
| LG-19 | `check_founder_service_layer_is_retired` | founder service layer is retired | FAIL | COMMERCIAL_PATHWAY_RETIRED |
| LG-20 | `check_no_founder_service_funnel_survives_anywhere` | no founder-service funnel survives anywhere | FAIL | COMMERCIAL_PATHWAY_RETIRED |
| LG-21 | `check_pii_gate_is_identical_everywhere` | PII gate identical on every text-input page | FAIL | PUBLIC_PAGE_STRUCTURE |
| LG-22 | `check_disclosed_retention_matches_the_policy` | disclosed retention matches the policy | PASS (introduced on this branch by 3758d76) | DISCLOSURE_DIVERGENCE |
| LG-23 | `check_record_derived_fields_have_no_export_path` | record-derived fields have no export path | FAIL | ENGINE_CLOSED_SUBJECT_MOVED |
| LG-24 | `check_no_unapproved_outbound_destination` | no unapproved outbound destination | FAIL | HUMAN_CLASSIFICATION_REQUIRED |
| LG-25 | `check_manifest_implementation_is_not_deployable` | manifest implementation is not deployable | FAIL | DEPLOYMENT_EXCLUSION |
| LG-26 | `check_manifest_library_holds_its_refusals` | manifest library holds its refusals | FAIL | ENGINE_CLOSED_SUBJECT_MOVED |
| LG-27 | `check_manifest_truncation_limit_matches_the_engine` | manifest truncation limit matches the engine | FAIL | ENGINE_CLOSED_SUBJECT_MOVED |
| LG-28 | `check_the_methodology_mapping_tracks_the_executable_vocabulary` | the methodology mapping tracks the executable vocabulary | FAIL | ENGINE_CLOSED_SUBJECT_MOVED |
| LG-29 | `check_every_public_table_projection_has_a_recorded_disposition` | every public table projection has a recorded disposition | FAIL | RECORD_DRIFT |
| LG-30 | `check_architecture_baseline_is_current` | architecture baseline is current | FAIL | ENGINE_CLOSED_SUBJECT_MOVED |
| LG-31 | `check_version_inventory_matches_its_sources` | version inventory matches its sources | FAIL | ENGINE_CLOSED_SUBJECT_MOVED |
| LG-32 | `check_misuse_register_records_reality` | misuse register records reality | FAIL | RECORD_DRIFT |
| LG-33 | `check_downstream_records_agree_with_the_blocker_registry` | downstream records agree with the blocker registry | FAIL | RECORD_DRIFT |
| LG-34 | `check_data_handling_claims_match_the_implementation` | data-handling claims match the implementation | FAIL | ENGINE_CLOSED_SUBJECT_MOVED |
| LG-35 | `check_published_api_contract_matches_the_write_path` | published API contract matches the write path | FAIL | ENGINE_CLOSED_SUBJECT_MOVED |
| LG-36 | `check_pages_that_render_engine_output_disclose_validation_status` | pages rendering engine output disclose validation status | PASS (introduced on this branch by 3758d76) | ENGINE_CLOSED_SUBJECT_MOVED |
| LG-37 | `check_public_engine_endpoints_carry_no_record_text` | raw record never reaches logReview; derived content still does | FAIL | ENGINE_CLOSED_SUBJECT_MOVED |

Skipped: `check_zero_retention_claim_is_true` (zero-retention claim matches the code): no page currently makes the claim.

## Conclusion
The guard suite is not green: 37 of 164 checks fail, 1 is skipped. No failure has a safe root-cause fix inside this assignment: each needs a public page edit under publication approval, an API, Manifest or deployment-configuration change, an environment change, a human classification decision, or a guard-file change, all of which are outside scope. No failure was suppressed, relabelled or normalised, and the guard file is unchanged. Two failures were introduced on this branch by 3758d76 and pass on main; they are owner decisions, recorded here, not fixed.
