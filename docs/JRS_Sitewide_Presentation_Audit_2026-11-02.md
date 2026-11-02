# JRS website and published-download presentation review
Date: 2026-11-02
Production baseline: `781559b50043eeb219cba758ab8de63ef117389e`
Scope: public pages, legacy public routes, training, online Standard, reference library and six featured downloadable PDFs.

## Design-system reference
The currently published institutional design uses a light paper background `#f5f7f8`, white surfaces, ink/navy `#193148` / `#17364f`, muted ink `#42576b`, restrained gold `#7f5e26`, body type Inter, and serif display headings rendered using Georgia/Iowan fallback. These values come from `assets/jrs-institutional-reference.css` and active public pages, not an invented new design system. Any change must preserve readable contrast and support keyboard interaction.

## Source inventory and qualification
The repository at the baseline contains 79 HTML/HTM paths and 90 PDFs. These are *not* 79 active primary pages or 90 promoted free downloads. The inventory includes canonical pages, 17 reference-library pages, legacy campaigns and redirects, noindex study interfaces, private owner access, historical research files, and certificates. Do not claim that all repository files are current public offers.

The principal Home, Standard (online), Training, Resources, Research, Investigator Guides and reference library pages already opt into `body.jrs-institutional` and link the institutional CSS. The online Standard and training pages have additional page-specific layout constraints that should remain intact. The Standard content and training behavior were not altered in this review.

### Confirmed public presentation mismatches
The following deployed routes respond with HTTP 200 yet still used the earlier dark background and gold type system rather than the current institutional visual language:
- `access.html` (public review entry)
- `reviewer/evaluation.html` (reviewer questionnaire)
- `reviewer/completion.html` (reviewer completion)
- `recheck.html` (independent second-read study)
- `security.html` (historical security/data-flow explanation)
- `review-engine.html` (historical closed-engine status)

The legacy `workflow-fit.html` URL already serves the current Resources page through production routing. Do not re-enable the retired standalone layout just to restyle it.

Some other historical, noindex, private, 404 or research-only HTML files still contain legacy CSS. Examples include the deliberate dead-end `people.html`, private `owner-login.html`, archived study material and source HTML for manuscripts. They should not be unilaterally republished or subjected to a public-site theme bridge without a route/access review. The protected owner sign-in remains distinct.

### Correction in this pull request
Added `assets/jrs-legacy-public-alignment.css` and opt-in body class plus shared styles on the six public legacy routes. The layer reconciles palette, body type, heading hierarchy, buttons, fields, labels, reduced-motion and focus presentation without changing page text, form submission, questionnaire sequencing, privacy, version distinctions, or engine restrictions. It is not an accessibility certification or rendered-browser signoff. Before publication, inspect the actual protected Vercel preview at desktop and mobile widths, and confirm the reviewer form and completion flow in a test context without submitting personal data.

## Published downloads: identity and typography
The six public directory PDF destinations returned HTTP 200 and PDF MIME type in live Vercel requests, with a `%PDF-` header. The source file checks also recognize these six assets.

| Delivered item | Observed embedded fonts | Publication treatment |
| --- | --- | --- |
| JRS Standard (v2.0, 2026) | Poppins, Lora, Helvetica, Times | Published normative document, preserve full content and edition identity |
| Rapid Review Card | Helvetica | Practitioner field aid |
| Investigator Field Guides (Employment, Fair Housing, International) | Helvetica, Times, Symbol | Edition-specific field guides, not interchangeable with Standard |
| Reviewer Reference | Poppins, Lora, FreeSerif, DejaVu, Helvetica | Supporting reference, not substitute for Standard |

This is a *verified type-family discrepancy* between downloadable documents and the Inter/Georgia institutional site. No defensible claim about each PDF's complete color palette, page-level text legibility, tagging or reading order can be made from font metadata and HTTP tests alone. Page render inspection and PDF accessibility review are required.

### Controlled PDF correction, not applied in this PR
1. Establish approved original source files and a versioned publication manifest for each of the six served PDFs. The repository contains PDFs, but original editable production masters have not been established through this review.
2. Create institutional print templates with Inter body / appropriately licensed serif display, navy `#193148`, white paper, muted gold `#7f5e26`, sufficient text contrast, defined headings, running footers and publication identifiers. Where font licenses/embedding are uncertain, use suitable authorized substitutes. Never distribute restricted font files.
3. Re-render the seven-page published Standard v2.0 from an authoritative source while preserving all wording, clauses, pagination-sensitive references, normative labels and version/edition distinctions. Any modification to an approved publication needs an explicitly controlled reissue; do not silently overwrite the current Standard at the live download path.
4. Re-render field guides, Rapid Review Card and Reviewer Reference using independently versioned templates. Preserve unique content/edition cautions.
5. Inspect each page visually; check extracts, font embedding, PDF metadata, tables, tagged reading order, mobile zoom, contrast and link destinations. Compare originals and proposed replacements; validate download API source tags, destinations and content-disposition.
6. Only after approval, publish replacement assets through a documented release with rollback and change log. Keep current PDFs available until replacement is verified.

## Evidence boundaries and unresolved checks
- Source-level HTML/CSS inspection does not establish real-browser, keyboard, VoiceOver or WCAG conformance.
- Vercel 200 responses and PDF signatures establish delivery, not PDF usability or visual alignment.
- The reviewer flow needs end-to-end testing on a preview without collecting real participant details.
- The owner dashboard's sign-in and data classifications must not be affected by public presentation changes.
- Do not relax Review Engine local-only / closed public API restrictions.
- A production release of this PR is NOT implied by the audit. Keep it draft until exact-head preview checks and owner publication authorization.
