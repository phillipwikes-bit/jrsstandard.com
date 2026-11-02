# JRS public website: source and route audit
**Audit date:** 2026-11-02
**Baseline:** main at `42c548afa9b87e4e801045b6f5512a5af6c4a9f3` (before editorial updates).

## Coverage
- All **78 tracked HTML files** identified from the complete GitHub repository tree, including top-level pages, reference pages, reviewer pages, owner sign-in, redirect stubs, and three internal source/test files.
- HTTP GET and resolved destination, document title and first H1, language and main landmarks, description metadata, canonical where applicable, image alt presence, and local HTML link targets.
- Four representative public pages were previously rendered on desktop and narrow mobile browser views. The HTTP inventory is exhaustive for the 78 tracked HTML files; **visual/browser testing is not claimed exhaustive**.

## Baseline findings
- **75/78** tracked HTML paths resolved to HTTP 200, including **15 redirects** to active public destinations or the private owner sign-in.
- **3/78** were internal source or test HTML paths intentionally unavailable on the published site (HTTP 404): two research source files and a layout-audit test page. These should remain unpublished.
- The canonical private Programme Status dashboard redirected anonymous visitors to owner sign-in. This is expected and must not be bypassed by public-site changes.
- Two other legacy stub pages return small redirect-style documents, not full editorial pages.
- One genuine unresolved reference was `research-summary.html` linking to `org-pilot.html`, which is not an accessible published page.
- Multiple historical "Pilot Program", "Request Pilot Participation", "Enterprise" and "Organizational evaluation" links pointed to public redirects that now lead to research or free resources instead of the promised action.
- The Corporate Compliance Insights article (September 29, 2026) was already listed under Resources. The SCCE / CEP Magazine article (November 1, 2026) was not yet linked in that section.

## Targeted remediation
- Preserve the original Corporate Compliance Insights entry; add SCCE publication with verified title, author, venue, date and direct publisher link.
- Surface both articles on Home, Research and Resources, clearly distinguished from primary empirical findings and independent JRS validation.
- Make the two article references visually consistent and keyboard accessible, and retain the 16-entry independent practitioner search directory unchanged.
- Replace misleading legacy pilot/enterprise calls to action with labels and active destinations matching the website's current research and practitioner-resource policy.
- Add automated integrity tests to the institutional reference release workflow.

## Verification and limits
Source tests check publisher URLs, research/commentary separation, 16-entry directory continuity, and stale top-level pilot/enterprise links. Independently validate hosted rendering and other repository CI results before publication.

This is a documentation and routing audit, not an independent accessibility certification, operational validation of JRS, Google Analytics engagement assessment, authenticated data completeness test, or legal assessment of the two external articles. No private participant data was examined or published.
