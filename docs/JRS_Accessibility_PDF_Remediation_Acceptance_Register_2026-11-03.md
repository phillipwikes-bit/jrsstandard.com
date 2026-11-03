# JRS accessibility and publication remediation acceptance register

Status: OPEN. Working evidence register, not a conformance declaration or authorization to publish.
Baseline: PR #117 candidate 85b3b1caab52a30f4124c1cb27a1b9c02e4ef7cd, 2026-11-03.
Scope: website accessibility, original publication preservation, accessible-edition development.
Vercel preview authentication is a separate release dependency; this register does not weaken it.

## Website witnessed acceptance

Record each test with date, exact Git commit and deployment URL, device/OS, browser, assistive technology and version, tester, tested route, actual observation, defect ID, fix SHA and retest. A pass cannot be inferred from axe, responsive simulations or source inspection.

| ID | Journey and acceptance question | Required witness | Status |
| --- | --- | --- | --- |
| WEB-01 | iPhone VoiceOver: home to Standard, Resources, training and downloadable documents; labels, focus order and navigation intelligible | Physical iPhone, Safari, VoiceOver | NOT TESTED |
| WEB-02 | Desktop screen reader: headings, landmarks, menu expanded state, search and results, forms and seven-point check | NVDA/Firefox or equivalent, identify configuration | NOT TESTED |
| WEB-03 | Keyboard only: skip link, navigation open/close and focus exit, search/filter/reset, review check, download and return focus; no trap | Physical keyboard and browser | NOT TESTED |
| WEB-04 | 400% browser zoom: no loss of content or operation at effective 320 CSS px, including dialog/menu and tables | Physical browser zoom with viewport recorded | NOT TESTED |
| WEB-05 | Forced-colors mode: visible focus, selected states, controls, links and borders | Windows forced-colors or documented equivalent | NOT TESTED |
| WEB-06 | Touch/mobile: 320/390 CSS px, 200% text, orientation, target size and no unintended horizontal scrolling | Real mobile browser, dimensions recorded | NOT TESTED |
| WEB-07 | Seven-point check: checkbox group instructions, status announcements, copy failure, printable record-only summary, no network transfer of answers | Screen reader plus network inspection | NOT TESTED |
| WEB-08 | Resources directory: search, zero-results message, filter semantics, no-JavaScript fallback, publication edition distinctions | Keyboard and screen reader | NOT TESTED |

Disposition rule: record PASS, FAIL with issue, or NOT TESTED. An unperformed witness is never a pass. Remediation must be tested at the changed exact commit.

## Nine original PDF editions: immutable source register

Source: docs/JRS_Published_PDF_Identity_Manifest.json at the baseline commit. Git blob hashes below identify published originals; they are not accessibility evidence.

| ID | Original | Published role or edition | Original Git blob SHA-1 | Accessible edition | Witness |
| --- | --- | --- | --- | --- | --- |
| PDF-01 | JRS-Standard.pdf | Normative Standard v2.0 (2026) | 83b0804d48491fee25773232244c632dd797a4cd | NOT PREPARED | NOT TESTED |
| PDF-02 | JRS_Rapid_Review_Card.pdf | Rapid Review Card | 65f94b3e444caf25831c2687c535df7c4de78d00 | NOT PREPARED | NOT TESTED |
| PDF-03 | JRS_Investigator_Field_Guide_Employment.pdf | Employment field guide | 9c058a63cae65f99628b3175a112480d7b2bc3df | NOT PREPARED | NOT TESTED |
| PDF-04 | JRS_Investigator_Field_Guide_FairHousing.pdf | Fair housing field guide | 4cf48a778d82db3a8d91954cc0c897b71313bb87 | NOT PREPARED | NOT TESTED |
| PDF-05 | JRS_Investigator_Field_Guide_International.pdf | International field guide | 1455fa544d98709cd78926939b662789795c71ae | NOT PREPARED | NOT TESTED |
| PDF-06 | JRS-Reference-9d4f2a7c.pdf | Reviewer reference | 944991c58392b774a040c4d364925b84860542fa | NOT PREPARED | NOT TESTED |
| PDF-07 | JRS_Reliability_Accuracy.pdf | Research evidence report | 44cd4242e429d4dc14cb791c6ba260acc4e53b1c | NOT PREPARED | NOT TESTED |
| PDF-08 | JRS_Research_Paper.pdf | Research paper | 5c1d42450b7019e439f97d97dbf23ce960539f24 | NOT PREPARED | NOT TESTED |
| PDF-09 | JRS_Investigator_Field_Guide.pdf | Legacy general investigator guide | 5a2543756471222fe5deb7bde97f31266b9981a0 | NOT PREPARED | NOT TESTED |

The separately tracked DRR_Article.pdf is outside the nine-original identity manifest. Its route remains in hosted delivery checks; do not silently treat it as a tenth locked edition.

## Accessible-edition production control

1. Locate and authenticate the editorial master for each edition. The Standard manifest explicitly records that an authoritative editable master was not verified; do not claim one exists.
2. Reconcile every page, heading, table, note, reference, link, figure and edition marker against the original. Log any editorial difference for approval.
3. Prepare a separate accessible edition or authorized equivalent without overwriting the locked PDF. Preserve the normative Standard PDF v2.0 versus online methodology distinction and all earlier guide editions.
4. Apply document title, language, logical headings, reading order, semantic lists/tables, meaningful link text, alternative text where needed, bookmarks, selectable text and suitable contrast.
5. Run structural validation (including PDF/UA checks where applicable) and practical keyboard/screen-reader reading; record actual tool results, unresolved findings and tested page ranges.
6. Obtain edition approval and release authorization before linking any new edition publicly. A mechanically tagged or text-extractable file alone is not a verified accessible publication.

## Release evidence rule

The website cannot be represented as independently A-grade or accessibility-certified while witnessed WEB checks, accessible PDF dispositions, protected hosted preview evidence, dashboard/security verification and owner GO decision remain open. Keep PR #117 unmerged and production unchanged until the separate release checklist is satisfied.
