# JRS accessibility and legacy-build evidence supplement

**Date:** 15 November 2026  
**Public production baseline:** `4a17e0725410a3885e4574c41205662c6f372874`  
**Classification:** technical acceptance evidence, not an independent WCAG or PDF/UA certificate  
**Scope:** public JRS Record Check, nine identity-locked original publications, tagged alternative reading files, and historical Cloudflare integration. The owner and private Engine interfaces are excluded.

## 1. Keyboard and physical assistive-technology acceptance

The live `https://www.jrsstandard.com/check.html` page was operated in a desktop Chromium browser with keyboard input on 15 November 2026. Tab exposed the **Skip to content** link with visible focus. Enter moved to `#main-content`; the next Tab reached the privacy link within the main content, rather than returning to the global navigation. The subsequent Tab reached the first checkbox, and Space activated it with a visible selected state. An accessibility-tree inspection separately showed the native, named seven checkboxes and the updated status text after selection. The earlier production release also tested the copy-status announcement. These are limited, affirmative keyboard and programmatic-browser observations.

**Not completed:** physical iPhone Safari with VoiceOver, independent screen-reader announcement review, Android/TalkBack, a full keyboard route through every page and workflow, and an independent evaluator's signed acceptance. A remote desktop or simulated viewport cannot be relabeled as a physical-device test.

## 2. WCAG 2.2 AA evaluation status

The public route has automated source regressions for headings, skip navigation, focus and status controls, resource delivery, mobile visual snapshots, and contrast guards, and the November 15 release passed production parity. These checks do not amount to criterion-by-criterion WCAG 2.2 AA evaluation of the whole public site. In particular, the scope and completeness of key journeys, non-text equivalents, meaningful sequence, zoom/reflow, assistive-technology behavior, cognitive input support, downloadable documents and accessible conformance alternatives have not been signed off by an independent evaluator.

**Disposition:** no formal WCAG 2.2 Level AA conformance claim. Evaluation should follow W3C WCAG-EM, with evaluator, scope, representative sample, complete processes, specific criterion evidence, failures, exceptions and human sign-off recorded. Source: W3C [WCAG 2.2](https://www.w3.org/TR/WCAG22/) and [WCAG-EM](https://www.w3.org/WAI/test-evaluate/conformance/wcag-em/).

## 3. Nine published PDF editions and accessible-format alternatives

The nine published originals are **unchanged** and locked by `docs/JRS_Published_PDF_Identity_Manifest.json`. Poppler reports all nine as untagged. A verified editable production master is absent for at least the Standard v2.0, and the source transcriptions do not preserve verified original graphics, table semantics or all reading-order relationships. Consequently the original publications cannot responsibly be described as fully accessible or silently reissued from these materials.

Eight **additional tagged PDF text-reading alternatives** were generated from the eight previously reviewed HTML text transcriptions, using a structured DOCX intermediary and LibreOffice tagged-PDF export. The ninth original in the manifest, `JRS_Research_Paper.pdf`, already had a separately published tagged reading copy. The new copies have a PDF structure tree, `en-US` document language, extractable text, a clear non-replacement notice and links from the public Resources directory. Exact source and output identities are recorded in `docs/JRS_Tagged_Transcription_PDF_Manifest_2026-11-15.json`.

| Original publication | New tagged text alternative pages | Substantive text-token coverage |
| --- | ---: | ---: |
| Standard v2.0 | 6 | 100.00% |
| Rapid Review Card | 2 | 100.00% |
| Employment/EEO guide | 7 | 99.59% |
| Fair Housing/HUD guide | 7 | 99.66% |
| International guide | 7 | 99.57% |
| Reviewer Reference | 22 | 99.95% |
| Reliability and Accuracy report | 4 | 99.62% |
| General investigator guide | 8 | 99.50% |

These coverage figures measure exact multi-character token presence in extractable text, tolerating text extraction order. They are **not** tests of semantic preservation, legal/editorial equivalence, reading-order usability, figures, tables, visual accuracy or conformance. The first and final rendered pages were visually sampled; page-image sampling does not replace full manual page or assistive-technology review. The remaining independent review must also check links, bookmarks, heading structures, visual content, tables, and spoken order before any PDF/UA or accessible-reissue claim.

The originals remain the publications of record. The new assets are clearly labelled optional reading alternatives and are not designated authorized replacement editions. This is a material improvement in alternate-format availability, **not** completion of the controlled original-PDF reissue gate.

## 4. Historical Cloudflare Workers Builds check

The repository's `docs/repository-operations/OPERATIONS_ANNEX.md` records that Cloudflare Pages functions and other artifacts were removed on 18 August 2026, and that the historical failed **Workers Builds** check was triggered by a separately configured Cloudflare-to-GitHub integration. The project has no active Wrangler configuration in this source tree. Adding a Worker simply to turn that check green risks enabling an unintended routing or deployment path and is not an authorized remedy.

On the production commit `4a17e0725410a3885e4574c41205662c6f372874`, the GitHub commit-status API returned only two Vercel deployment contexts, one successful for `jrsstandard-com` and one unrelated failing for `incomeos-opportunity-desk`. It returned **no Cloudflare Workers Builds status context**. The seven recorded GitHub check runs for this commit all completed successfully. These facts support the conclusion that the old Cloudflare check is not currently a JRS production release gate. They do **not** prove the old Cloudflare dashboard integration was disconnected or that no Worker route exists outside the repository. Only the Cloudflare account integration and domain/route configuration can establish that final external disposition.

**Cloudflare disposition:** repository and current commit-status evidence reconciled; account-side disconnection and domain-route audit remain unverified. Keep Vercel as the authoritative public host. Do not alter Cloudflare routes merely for a check status.

## Acceptance classification

| Gate | Current evidence | Status |
| --- | --- | --- |
| Live desktop keyboard sample | Skip link, main-content focus, checkbox Space activation | **Sample passed** |
| Physical iPhone VoiceOver acceptance | No physical-device reviewer record | **Open** |
| Full independent WCAG 2.2 AA conformance | Selected automated checks only | **Open** |
| Tagged optional PDF alternatives for nine original publications | Eight new plus one existing; no original bytes changed | **Technically available, not certified** |
| Approved accessible reissues of nine original PDF editions | No verified masters and editorial/sign-off record for all nine | **Open** |
| Historical Cloudflare check effect on current release | Current JRS checks green, no Worker context | **No current gate observed** |
| Cloudflare dashboard disconnect and route authority | No Cloudflare account-side evidence | **Open** |

The document records what is proven, what was prepared and what requires independent acceptance. None of these uncompleted gates should be represented as already certified or approved.
