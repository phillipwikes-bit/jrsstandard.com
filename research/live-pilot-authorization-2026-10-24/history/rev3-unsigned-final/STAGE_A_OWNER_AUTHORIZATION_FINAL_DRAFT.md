# Stage A Owner Authorization (Final Draft)

**UNSIGNED FINAL DRAFT. Prepared 2026-10-24 outside the repository. Not effective until
signed.** It supersedes `STAGE_A_OWNER_AUTHORIZATION_DRAFT.md`, which is preserved
unchanged. It also consolidates every Stage A owner decision into one signature page,
including the record approval line in `SYNTHETIC_DEVELOPMENT_RECORD_REGISTER.md`; that
line need not be completed separately. Signing does not start the pilot: the separate
Gate 4 start direction (item 8) is required before the dispatch lock is released. B-018
OPEN. NO_GO_NOT_VERIFIED in effect.

Authorization identifier: STAGE-A-AUTH-__________

## 1. Terms

| Term | Value |
|---|---|
| Pilot | Stage A synthetic live-model feasibility pilot |
| Provider | Anthropic API |
| Exact model | `claude-haiku-5-5`, no fallback or substitution |
| Maximum requests | 10 (one per record; no retries) |
| Maximum spend | USD $5 |
| Material | SDR-01 through SDR-10 only, at the SHA-256 values in section 2 |
| Material restriction | Synthetic development material only |
| Engine | Frozen candidate `phase7-candidate`, package `815c5d5671d0cfcaf62edca0a11938b920e37d058d3e8655ae9e4f9c735925c3`; prompt `0ceda8887463a515d241751133c9b0d3bf3364f89b63fa6ac5dda6ac70c8eec2`; adapter 0.2.0 `aa2b97797a9ed2d9476e901f2a54e10b3c7f898af6a9df8b473ac27482d81fb6`; mapping 0.1.0-offline `1e289b0687d8b14a4c3dd74db1bd977af0f32d50dee2ad523da412f515a159b8` |
| Retention | Approved external custody location (item 5) for 30 days, then deleted by the approved method unless separately preserved |
| Counsel determination | Not required for this limited synthetic-only pilot (`STAGE_A_COUNSEL_DETERMINATION.md`). No effect on B-018 or on any future real-data work |
| Gate 1 | Cleared for this pilot only, through verified remote commit `235389da` (`STAGE_A_GATE1_DETERMINATION.md`) |
| Cognitive controls and provenance-pair verification | Mandatory for every request |
| Decision rule | `PILOT_DECISION_RULE.md`, fixed before any live request |
| Execution readiness | `STAGE_A_EXECUTION_READINESS_CHECKLIST.md`; any unchecked item blocks execution |
| Expiry | 14 calendar days after signature |
| Start condition | Separate Gate 4 start direction required before dispatch-lock release |
| Prohibited uses | No release, deployment, production, commercial, licensing, ownership, validation, reliability or public claim |

By signing, the owner also:

- classifies this pilot's remote provider access as external controlled use;
- permits this synthetic-only pilot while B-018 remains OPEN.

## 2. Approved records

| ID | SHA-256 |
|---|---|
| SDR-01 | `7cb8571a4d3ff667748b4a6fd7f62940bc45f08e16bb1ea47653ca5d88eeb7d1` |
| SDR-02 | `be4f0178c984dfe5c7d264d24dd306f4e2892d72ff5d903058cb81e4c31bfc29` |
| SDR-03 | `f36d934158d9387a2cec5dd59c6ed25ef7fc98b01d82b2814cb5894526d43155` |
| SDR-04 | `cfed32b0dc58e1996048052e298cc96769bed644595349e3bfa049c5e72304a6` |
| SDR-05 | `3685b7d993a9d723488caa8130b2fdfb7e19333feb352bb6ed8ce811faaa864c` |
| SDR-06 | `de97991b0b9284eeca3ba51f1cfcf83038ca6b7c69dfcae9450d24fa56f88a61` |
| SDR-07 | `607a5f3956d122215c1d3b08bec2dc7182ff81b2172ea8df0bdbab5a79f99e1f` |
| SDR-08 | `545c4e0adfe6b2b30b14b1713e29101d19cef84c7a5bbe0682c3641e7834a215` |
| SDR-09 | `4e06fb82e4a763f3cf056057b70903f11f4ec8007dba20cca1d10a80d0ff3c0a` |
| SDR-10 | `43d957d77814984469cfcfa76d4ecd9e84534bfba8d787af3b23da06f043f154` |

Location: `stage-a-offline-preparation-2026-10-24/synthetic-records/`.

## 3. Points the owner confirms before signing (not verified in this package)

- **Spend cap.** The USD $5 cap has not been checked against current provider prices. The owner confirms it against published prices.
- **Response format.** The mapping's expected response shape follows the provider's documented Messages format as understood offline. It is confirmed against current documentation during the readiness check.
- **Model identifier.** Whether `claude-haiku-5-5` resolves to a fixed snapshot is confirmed on the run date. Results apply only to the identifier actually used.

## 4. Required statement (do not alter)

This authorization covers at most ten requests, one per approved synthetic development
record, to the one model named above, under the Pilot Decision Rule and stop rules
SR-LP-01 to SR-LP-15. It does not close B-018, does not dispose of B018-CQ-05, does not
change NO_GO_NOT_VERIFIED, and does not authorize any public, commercial, licensing,
ownership, release, production, deployment, validation or reliability statement. Even 10
of 10 compliant responses establishes feasibility evidence only.

## 5. Signature page

| # | Decision | Owner entry |
|---|---|---|
| 1 | I approve SDR-01 through SDR-10 at the SHA-256 values in section 2 | [ ] Approved  [ ] Not approved |
| 2 | I approve the Pilot Decision Rule (`PILOT_DECISION_RULE.md`), including its gap-closure clause | [ ] Approved  [ ] Not approved |
| 3 | I will verify availability of `claude-haiku-5-5` on the run date and record it | [ ] Confirmed |
| 4 | I approve the limits of 10 requests and USD $5, confirmed against current prices | [ ] Approved  [ ] Not approved |
| 5 | I approve retention for 30 days at the location below, with the access list and deletion method below | [ ] Approved  [ ] Not approved |
| | Retention location | __________________________ |
| | Access list | __________________________ |
| | Deletion method | __________________________ |
| 6 | Authorization expiry date (14 calendar days after signature) | __________ |
| 7 | Owner signature | __________________________ |
| | Date signed | __________ |
| | Modifications to any term (list each, or "none") | __________________________ |
| 8 | **Separate Gate 4 start direction** (leave blank at signing; completed only after every readiness-checklist item 1 to 11 is checked) | Direction: __________________________ |
| | | Date and time (UTC): __________ |
| | | Owner signature: __________________________ |

**B-018 remains OPEN. NO_GO_NOT_VERIFIED remains in effect.**
