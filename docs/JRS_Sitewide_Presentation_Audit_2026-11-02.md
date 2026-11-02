# JRS website and published-download presentation review
Date: 2026-11-02
Production baseline: `781559b50043eeb219cba758ab8de63ef117389e`
Scope: public pages, legacy public routes, online Standard, Training, reference library, nine linked public PDFs and the Training-generated completion PNG.

## Design-system reference
The currently published institutional design uses a light paper background `#f5f7f8`, white surfaces, ink/navy `#193148` / `#17364f`, muted ink `#42576b`, restrained gold `#7f5e26`, body type Inter, and serif display headings rendered using Georgia/Iowan fallback. These values come from `assets/jrs-institutional-reference.css` and active public pages, not an invented new design system. Any change must preserve readable contrast and support keyboard interaction.

## Source inventory and qualification
The repository at the baseline contains 79 HTML/HTM paths and 90 PDFs. These are *not* 79 active primary pages or 90 promoted free downloads. The inventory includes canonical pages, 17 reference-library pages, legacy campaigns and redirects, noindex study interfaces, private owner access, historical research files, and certificates. Do not claim that all repository files are current public offers.

The principal Home, Standard (online), Training, Resources, Research, Investigator Guides and reference library pages already opt into `body.jrs-institutional` and link the institutional CSS. The online Standard and training pages have additional page-specific layout constraints that should remain intact. The Standard content and training workflows were not altered; the locally generated training certificate image was restyled.

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
The six featured Resources PDF destinations, three additional PDFs linked from Standard/Research Summary, and the direct Standard/guide PDF URLs on Investigator Guides returned HTTP 200 and PDF MIME type in live Vercel requests with `%PDF-` headers. This establishes nine distinct linked PDF files across the main public content and overlapping direct/trackable routes, not a complete audit of the 90 repository PDF assets.

| Delivered item | Observed embedded fonts | Publication treatment |
| --- | --- | --- |
| JRS Standard (v2.0, 2026) | Poppins, Lora, Helvetica, Times | Published normative document, preserve full content and edition identity |
| Rapid Review Card | Helvetica | Practitioner field aid |
| Investigator Field Guides (Employment, Fair Housing, International) | Helvetica, Times, Symbol | Edition-specific field guides, not interchangeable with Standard |
| Reviewer Reference | Poppins, Lora, FreeSerif, DejaVu, Helvetica | Supporting reference, not substitute for Standard |
| Reliability and Accuracy report | Helvetica, Times, Courier | Research evidence summary, preserve stated limits |
| Research Paper | Helvetica, Times, Courier | Research publication, preserve authorship/edition |
| General Investigator Field Guide | Helvetica, Symbol | Legacy general guide, distinguish from three field-specific guides |

This is a *verified type-family discrepancy* between downloadable documents and the Inter/Georgia institutional site. No defensible claim about each PDF's complete color palette, page-level text legibility, tagging or reading order can be made from font metadata and HTTP tests alone. Page render inspection and PDF accessibility review are required.

### Controlled PDF correction, not applied in this PR
1. Establish approved original source files and a versioned publication manifest for each of the nine identified linked PDFs. The repository contains PDFs, but original editable production masters have not been established through this review.
2. Create institutional print templates with Inter body / appropriately licensed serif display, navy `#193148`, white paper, muted gold `#7f5e26`, sufficient text contrast, defined headings, running footers and publication identifiers. Where font licenses/embedding are uncertain, use suitable authorized substitutes. Never distribute restricted font files.
3. Re-render the seven-page published Standard v2.0 from an authoritative source while preserving all wording, clauses, pagination-sensitive references, normative labels and version/edition distinctions. Any modification to an approved publication needs an explicitly controlled reissue; do not silently overwrite the current Standard at the live download path.
4. Re-render field guides, Rapid Review Card, Reviewer Reference and the separately linked research PDFs using independently versioned templates. Preserve unique content, source status, publication rights, research limitations and edition cautions.
5. Inspect each page visually; check extracts, font embedding, PDF metadata, tables, tagged reading order, mobile zoom, contrast and link destinations. Compare originals and proposed replacements; validate download API source tags, destinations and content-disposition.
6. Only after approval, publish replacement assets through a documented release with rollback and change log. Keep current PDFs available until replacement is verified.

## Training completion PNG
The free training page generates a **local PNG** by drawing to a browser canvas, rather than downloading a static certificate PDF. Before this correction, it used a black `#0A0A0A` background, warm gold `#BE9447`, Bodoni/monospace display fonts and the obsolete label "DEPLOYMENT KIT · VERSION 1.0 · INTERNAL DISTRIBUTION". This image was not aligned with the live institutional site or the public nature of the training.

The proposed correction uses white paper, navy typography, restrained gold rules, Inter text and Georgia display type, adds room for longer recipient names, and explicitly retains an **educational completion record**, not professional certification or compliance accreditation. The PNG generation and opt-in enrollment/completion behavior remain intact; no names/emails are transmitted by the local canvas-generation function. This corrects the public training download without reissuing a normative PDF.

## Evidence boundaries and unresolved checks
- Computed-style browser checks at 390px and 1440px test palette and typography on selected routes; they do not establish keyboard, VoiceOver or WCAG conformance. Hosted preview and manual visual assessment are still required.
- Vercel 200 responses and PDF signatures establish delivery, not PDF usability or visual alignment.
- The reviewer flow needs end-to-end testing on a preview without collecting real participant details.
- The owner dashboard's sign-in and data classifications must not be affected by public presentation changes.
- Do not relax Review Engine local-only / closed public API restrictions.
- A production release of this PR is NOT implied by the audit. Keep it draft until exact-head preview checks and owner publication authorization.
