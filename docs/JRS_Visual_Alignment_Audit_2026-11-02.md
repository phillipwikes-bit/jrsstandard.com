# JRS website and publication alignment audit

Date: 2026-11-02. Baseline: production GitHub merge commit `781559b50043eeb219cba758ab8de63ef117389e`.

## Scope and baseline

The source tree contains 79 HTML/HTM files, including research-source and test pages, and 90 PDF files, most of which are historical research records or individually issued certificates. These categories must not be conflated with current ungated practitioner downloads. The live Resources directory identifies 16 public entries, including **six tracked PDF routes**, all of which returned HTTP 200 with a PDF signature when checked on the current public production domain. Page-level HTTP responses do not establish accessibility, legibility, or cross-renderer parity.

The main institutional website uses a light blue-gray `#F5F7F8` canvas, navy `#193148` text and `#162F46` header, restrained gold `#7F5E26` accents, Inter body typography and Georgia publication headings. The homepage, online Standard, training, Resources, investigator guides, Research, and 16 online reference-index pages carry the institutional stylesheet. Source inspection does not establish every computed style or breakpoint in an actual browser.

## Findings and risk ranking

1. **High: official PDF typography differs from the website.** The publicly delivered Standard PDF (7 pages, Version 2.0) embeds Poppins and Lora, with Times/Helvetica fallback. The downloadable 19-page Reference uses Poppins/Lora and other fallback fonts. The 2-page Rapid Review Card uses Helvetica, and three 9-page specialist investigator guides use Helvetica/Times. They do not use the site's Inter/Georgia typography. These are existing published artifacts, not accidental web CSS. A coordinated re-typesetting requires access to controlled source files and a page-by-page content, edition, accessibility and print proof. The published Standard PDF has therefore **not** been overwritten or represented as equivalent to a newly regenerated PDF. Automated delivery, title and edition checks are not visual font certification.
2. **High: legacy active public routes use a separate black/gold design.** Source and live-route checks show `access.html`, `recheck.html`, `reviewer/evaluation.html`, `reviewer/completion.html`, `security.html`, `review-engine.html`, `404.html`, `ai-records-arm-b.html`, `coauthor.html`, `honor.html` and `people.html` do not load the shared institutional system. Several labels are 8.5–9.5px and body backgrounds use `#050505`. The remediation adds a presentation-only, scoped stylesheet and opt-in body class for these 11 routes. It leaves form submission, identifiers, scripts, study data, and owner authentication unchanged.
3. **Medium: online Standard and training retain large historical inline style surfaces.** `jrsstandard.html` and `training.html` already opt in to the current institutional theme, but embed extensive earlier typography and color declarations. Existing institutional contrast guards address selected legacy semantic colors and disabled poll states. Full computed-style visual regression, zoom, VoiceOver and print-review remain necessary before a grade or accessibility claim.
4. **Bounded exceptions.** Redirects such as `pilot.html` and `organizational-evaluation.html` resolve to current institutional destination pages in production and should not be repainted as standalone destinations. The private owner sign-in/dashboard and vendor-specific preview must be isolated from this public presentation change. Historical, source-only or individually issued PDFs must retain their archival integrity.

## Change scope and acceptance criteria

- Apply the institutional public palette and legible heading/label/type sizes to 11 active historical/secondary public routes through one opt-in stylesheet, loaded after legacy inline CSS.
- Keep full release paths, route names, study questions, form field names, completion codes and publication content unchanged.
- Run source regressions, then hosted breakpoint checks (390px mobile, tablet and desktop); check 200% zoom, keyboard flow and contrast on forms, warning panels and navigation.
- Recheck six tracked PDF routes for HTTP 200, `application/pdf`, valid PDF bytes and edition labels; separately perform a human visual audit of every page of the official Standard and reference PDF before any controlled replacement.
- Keep PDF re-typesetting as a separate edition-controlled publication work item; do not silently alter the published 2.0 Standard.

## Evidence limitations

This audit is based on GitHub source, live HTTP responses and available PDF font metadata. Automated PDF raster screenshots were unavailable through the public inspection service. No statement of full visual uniformity, screen-reader certification, or final PDF accessibility is supported until actual rendered checks are completed.
