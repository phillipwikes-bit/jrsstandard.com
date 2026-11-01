# JRS Public Resource Edition and Release Crosswalk
Date: 2026-11-01
Status: SOURCE REVIEWED, NOT YET PRODUCTION VERIFIED
Reference basis: October 3, 2026 source-aligned JRS Master Asset Register, Evidence Ledger, Architectural Blueprint.
Scope: public JRS references, not the privately governed Review Engine.

## Published material and version identity
- JRS-Standard.pdf: 7 pages; self-identifies as Version 2.0 (2026).
- jrsstandard.html: online methodology identifies v1.0 (May 2026). Do not presume this HTML is the same edition as the PDF.
- Public Manifest 1.0.1 schema: accepts Standard 1.0 and Codebook 1.0. Do not presume it validates Standard PDF v2.0.
- JRS_Rapid_Review_Card.pdf: 2 pages, v1.0.
- JRS_Investigator_Field_Guide_Employment.pdf, _FairHousing.pdf and _International.pdf: each 9 pages, Version 1.1 (July 2026).
- JRS_Investigator_Field_Guide.pdf: 9 pages, older combined Version 1.0 (May 2026), retained for provenance, no longer the primary guide path.
- JRS-Reference-9d4f2a7c.pdf: 19 pages, Version 1.0.
- JRS_Research_Paper.pdf: 10-page working research paper v1.0, not an independent operational validation.
- JRS_Reliability_Accuracy.pdf: 4-page historical research-stage draft. Its accuracy collection was stated as ongoing, its cross-vendor raw agreement and qualitative reliability assessments precede the later bounded evidence conclusions. The public research-summary page labels it historical and warns against citation as a current conclusion.
- DRR_Article.pdf: 3-page conceptual article, separate from measured study evidence.

## Edition-specific guide terminology
The three 1.1 specialty guides identify five independently evaluated headings:
1. Record Self-Sufficiency
2. Evidentiary Anchoring
3. Chronological Integrity
4. Decision-Process Traceability
5. Evidentiary Sufficiency

The v2.0 Standard PDF identifies:
1. Reconstructability
2. Basis Identification
3. Chronology
4. Decision-Process Traceability
5. Evidentiary Sufficiency

The first three names have related subject matter but are not approved as identical tests. In particular the treatment of reconstructability and independent assessment differs. The same names for fourth and fifth conditions do not prove complete content or routing equivalence. A formal v1.1-to-v2.0 technical migration/crosswalk requires owner approval, controlled revision and independent method review. Public guide page discloses the distinction.

## Research denominators and claims
- 16 expert panel participants, 384 graded constructed-record reads: mean detection 83.9%, 95% participant-level CI 72.7%-95.1%. This does not validate live case performance.
- 36 completers across two participation arms finishing 24-record sets, 16 countries. Not all are experts.
- 58 reviewers graded at least one record in three studies. Not an accuracy denominator.
- Human AC1 0.739 (invited), 0.623 (open) on separate analyzed sample, confidence-bound criterion NOT met. Distinct from detection sample.
- Cross-vendor 87.2% is restricted-denominator raw agreement over full 15-record returned sets at data lock (41 runs); NOT chance-corrected reproducibility and not accuracy. The historical draft's earlier 84% raw agreement cannot replace the locked reported series without a date and denominator.

## Privacy, use and publication gates
- JRS public method, free reference PDFs, manual training and constructed-record practice stay available; no public case-record processing.
- Enrollment optional: separate contact and successor-transfer consent, disclosure of name/email and Supabase capture; no PII in URLs. Public Contact uses Formspree.
- Review Engine production still NO-GO / NOT VERIFIED. The October 3 candidate is limited to a diagnostic mirror on completed non-HR internal compliance records, initially supplier-access exceptions; employment, housing, lending, insurance, medical and legal outcomes excluded from candidate scope.
- No claimed certification, accreditation, proven operational effectiveness, automatic Manifest compatibility or commercial readiness.

## Source-alignment controls and exact scope
- Source tests span 47 selected public HTML pages and include 1,183 internal hrefs, 1,141 resolved local targets, 42 tracked PDF download links and 86 anchors at the audit run.
- Ten named public PDFs extracted as text, PDFs' own versions and guide vocabulary checked. No source PDF content silently revised.
- Eight GitHub Actions PR workflows passed on review commit 83e5caf0ed3ba9db8fa33e8994dbae0017b9f982, including published PDF audit.
- Vercel preview request on Nov 1 returned 402 quota exceeded (api-deployments-free-per-day, free 100/day). Production domains still serve earlier deployment ebd18397. No release or billing change.
- Final publication depends on safe preview, current CI green, privacy and 11-owner-reader fail-closed checks, expected-head guarded merge, verified Vercel production aliases and live HTTP/PDF smoke tests. Use src=verify for tracked-download test requests. A desktop/mobile screenshot accessibility assessment remains distinct.

## Decisions not silently resolved
1. Which edition is authoritative for adoption when v2.0 PDF differs from online v1.0? Formal owner decision required before claiming an identical edition.
2. Whether and how to revise the three v1.1 field guides to v2.0. Do not relabel without reviewed update.
3. Whether to publish a new Manifest schema accepting v2.0. Requires separate independent schema/provenance validation.
4. Supersession treatment of older reliability PDF. Its status must remain clearly historical if publicly downloadable.
5. The site release must not be represented as Engine validation, certified A-level accessibility or exhaustive legal compliance.
