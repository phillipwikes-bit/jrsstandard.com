# Master Tracker Release and Rights Reconstruction

## 1. Tracker inventory

| Tracker | Path | Category | Searched |
|---|---|---|---|
| Master Tracker | `research/MASTER_TRACKER.md` | Master/continuity | **Yes, full text** |
| Master Tracker (root copy) | `MASTER_TRACKER.md` | Master/continuity | Yes |
| Master Tracker (generated) | `research/MASTER_TRACKER.docx` | Derived | Yes, via extraction |
| Recent tracker extract | `research/TRACKER_RECENT.md`, `TRACKER_RECENT_2026-08-29.pdf` | Derived snapshot | Yes, via extraction |
| IP Sale Tracker | `research/IP_SALE_TRACKER.md` / `.docx` | IP asset / value | Yes |
| IP Commercialization Tracker | `IP_COMMERCIALIZATION_TRACKER.md` | Commercial readiness | Yes |
| Consent and release audit | `research/CONSENT_AND_RELEASE_AUDIT_2026-08-13.md` / `.docx` | Rights | Yes |
| Contributor claims exposure | `research/Contributor_Claims_Exposure_2026-08-23.md` | Rights | Yes |
| Tracker hash checker | `scripts/check_tracker_hashes.py` | Integrity | Noted |

## 2. Search methodology

Full-text search of every tracker above for: `consent`, `consent_transfer`,
`consent_named`, `consent_use`, `release`, `successor organization`, `permission`,
`assignment`, `signed`, `executed`, plus identity searches for Hekim, Colpan, Ubayet,
Hossain, Tanvi, Pokhriyal, Stacyann, Young and contributor codes. Git history searched
with `-S` for `V-AI-20` and related strings.

## 3. Release and consent events recorded in the tracker

| Tracker evidence | Person | Asset | Claimed instrument | Underlying instrument located? | Completion evidence located? | Classification |
|---|---|---|---|---|---|---|
| The tracker analyses the `contributor.html` consent in detail, quoting its scope and limits | All contributors | Study publications | Contributor consent | **YES**: `contributor.html`, `api/contributor.js`, `pilot_contacts` | **YES: 37 executed rows** | **VERIFIED BY UNDERLYING INSTRUMENT** |
| The tracker records the co-author instrument and its terms version | 3 co-authors | Three studies | Co-author consent | **YES**: `api/_coauthor-roster.js` | **NO: confirmed 0 of 3** | **VERIFIED TRACKER RECORD ONLY** |
| The tracker records gap 1: "nothing is signed, nothing is versioned, and there is no stored copy of the terms as they read on the day each person ticked" | All | All | n/a | n/a | n/a | **VERIFIED**, and partially closed for co-authors on 2026-08-24 |

## 4. Underlying evidence crosswalk

**The tracker did not need to be the source of truth, because the underlying instrument
and its 37 executed rows were located directly.** That is a stronger evidentiary
position than a tracker assertion, and it is the reason this reconstruction reports
**VERIFIED BY UNDERLYING INSTRUMENT** rather than **VERIFIED TRACKER RECORD ONLY** for
the contributor population.

## 5. Hekim Colpan reconstruction

| Date | Source | Entry | Asset | Release status recorded | Underlying evidence located | Classification |
|---|---|---|---|---|---|---|
| 2026-08-05 | `research/Reply_Hekim_Publication_Terms_2026-08-05.md` | Eleven publication answers, including joint copyright and prior approval for commercial use of JRS material | CCI article | Terms **prepared**, not recorded as accepted | Document located; **no acceptance located** | **PARTIALLY ESTABLISHED** |
| **2026-08-19** | **`pilot_contacts`, `source='contributor-confirm'`** | **Contributor consent executed: named yes, use yes, transfer yes; country DE** | **Detection study panel contribution** | **COMPLETED** | **YES, the row itself** | **VERIFIED** |
| 2026-08-19 | `research/Reply_Hekim_Colpan_Lock_2026-08-19.md` | Corrections accepted, manuscript locked | CCI article | n/a | Document located | **CORRESPONDENCE** |
| 2026-09-03 | `research/cci_resubmission_2026-09-03/` | Article accepted, Colpan named first | CCI article | n/a | Packet located | **PUBLICATION** |

**Answer to the mandated question:** evidence exists, and it is primary rather than
tracker-derived. **Hekim Colpan completed a contributor consent for his participation in
the Detection study on 2026-08-19**, granting named, use and successor-transfer
permissions.

## 6. Prior finding corrections

| Prior finding | New evidence | Correction | Reason the prior search was incomplete |
|---|---|---|---|
| "Hekim Colpan: Instrument **None**. Written email terms only" (`RIGHTS_AND_AGREEMENTS_EVIDENCE_REGISTER.md`, 2026-09-09) | Executed contributor consent, 2026-08-19, V-AI-20 | **Incorrect. A completed instrument exists** | **Category error**: I searched the co-author roster only, found him absent, and reported on both instruments having checked one |
| "0 rights documents located" (2026-09-08) then "1 instrument, confirmed 0 of 3" (2026-09-09 am) | **Two instruments; 37 executed contributor consents** | **Both incomplete** | Structured application data was never queried. The releases exist as database rows, not as files |
| "no terms version stored against any consent row" | Co-author instrument stores `TERMS_VERSION`; **contributor instrument does not** | **Partially corrected, partially confirmed** | The gap was closed for co-authors on 2026-08-24 and remains open for contributors |

**None of this indicates the earlier work was fraudulent or negligent.** It indicates a
file-oriented search strategy applied to evidence that lives in a table.

## 7. Remaining evidence gaps after the tracker search

1. Acceptance of the 2026-08-05 CCI publication terms: **not located**.
2. Co-author confirmations: **0 of 3**.
3. Section 2.1 contributor assignment: **none located**.
4. Terms version for the contributor instrument: **not stored**, so the exact wording in force on any given confirmation date is not provable from the row.
5. No executed assignment or work-for-hire instrument anywhere.

## 8. Search limitations

Email and correspondence outside the repository are outside the access boundary.
Historical tracker text was searched through git history; any tracker content that
existed only outside version control could not be examined.
