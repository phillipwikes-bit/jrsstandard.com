# JRS Exit-Strategy Website Alignment

**Date:** 2026-09-22  
**Scope:** Public website and its navigation, enterprise pathway, Manifest positioning, and mechanical website grading  
**Deployment status:** Published to GitHub `main` and verified live at `https://www.jrsstandard.com/` on 2026-09-22. The production homepage, enterprise pathway, Manifest package, and free-resource navigation were inspected after deployment.

## Objective

Align the public website with the intended transaction path without converting JRS into a conventional SaaS or sales operation:

1. preserve the free public standard and practitioner resources;
2. make the controlled enterprise pathway visible and complete;
3. position the Decision Reconstruction Manifest as the central integration artifact, but not the entire asset;
4. support evaluation, integration, licensing, exclusive licensing, and asset-acquisition conversations;
5. preserve the distinction between current implementation and target licensing architecture;
6. avoid offering rights that the current rights record does not establish.

## Implemented changes

### Homepage

- Kept **Explore free resources** as the primary hero action.
- Added a visible platform-evaluation action without displacing the public path.
- Expanded the two-role explanation for practitioners and enterprise evaluators.
- Added the connected asset architecture: Standard and DRR, research and resources, Review Engine, Manifest, documentation, and provenance and rights.
- Added the target integration sequence from customer record through customer-controlled workflow.
- Stated that the current API does not yet emit a conforming Manifest.
- Preserved the current transaction boundary: conversations may begin, but a binding exclusive licence or asset purchase is not represented as ready until rights and terms are established.

### Enterprise pathway

- Added the four-stage commercial path: **Evaluate, Integrate, License, Acquire**.
- Preserved the full enterprise page and its technical, validation, data-handling, security, and inquiry content.
- Distinguished free self-service tools from a controlled Evaluation License.
- Added the potential transferable asset bundle around the Manifest.
- Replaced rigid or unsupported billing assumptions with transaction-specific written scope.
- Kept rights, exclusivity, implementation, and acquisition terms contingent on an executed agreement and established rights.

### Manifest package

- Added its place in the enterprise pathway.
- Made clear that the Manifest is the central integration artifact, not the complete transaction asset.
- Connected the public schema to controlled evaluation, integration, licensing, and acquisition inquiry routes.

### Navigation

- Standardized the public site navigation to seven direct destinations: The Standard, Free Resources, Research, Review Engine, Manifest, Enterprise, and About.
- Updated 61 canonical navigation blocks from one source.
- Updated the purpose-built Review Engine and Pilot menus separately.
- Preserved excluded private, owner-only, participant, admin, 404, and special-purpose surfaces.

### Grading control

- Replaced the retired duplicated dual-track-band test with a semantic test requiring both the public/free and controlled/enterprise paths.
- Recognized a direct link to the enterprise inquiry as a valid capture route.
- Recognized a direct enterprise inquiry as a next step on public technical pages.

This changes the test to match the current approved architecture. It does not remove a control or lower a threshold.

## Verification

| Control | Result |
|---|---:|
| Zero-drift suite | 160 checks, 0 failed, 3 environment-dependent skips |
| Link audit | 77 pages, 1,707 links, 0 broken |
| Mobile/static page audit | 381 checks, 0 failed on 77 pages |
| Enterprise-readiness grade | Homepage A, 100%; enterprise A, 96%; commercial mean 98.4% |
| Manifest tests | 68 checks, 0 failed |
| Retention tests | 60 checks, 0 failed |
| Authentication matrix | 26 checks, 0 failed |
| Activity projection | 17 checks, 0 failed |
| Canonical navigation check | 61 blocks identical; 7 destinations resolve |
| Diff hygiene | `git diff --check` passed; no new prohibited dash characters in directly edited website and control files |

## Evidence and rights limits

- No research result was upgraded.
- No effectiveness, compliance, legal-defensibility, or product-market-fit claim was added.
- No trademark registration or transfer status was asserted.
- No source-code, methodology, derivative, exclusivity, successor-transfer, or acquisition right was represented as cleared.
- Counsel determinations and executed instruments remain necessary before a binding exclusive licence or asset purchase.
- Current API output and target Manifest delivery remain explicitly distinct.

## Release state

**CLOSED: WEBSITE RELEASE PUBLISHED. COUNSEL ACTIONS REMAIN.**

The website alignment and publication work is complete. GitHub `main` contains the verified release, the temporary publication transport was removed, and the production website displays the revised homepage, full enterprise pathway, free-resource route, and bounded Manifest publication package. Rights determinations required for an exclusive licence or asset purchase remain counsel actions and were not inferred or closed.

## Enterprise buyer-route correction, 2026-09-22

The post-publication enterprise review identified that the 5,003-word Enterprise page
still combined organizational adoption, platform integration, procurement, licensing,
and acquisition. The page has now been replaced by a concise decision hub. Its three
routes are separately addressable:

1. `organizational-evaluation.html`
2. `platform-integration.html`
3. `licensing-acquisition.html`

The hub retains the Evaluate, Integrate, License, and Acquire sequence, while each route
now addresses only the audience, evidence, responsibilities, and decision relevant to
that path.

### Controlled evaluation package

`controlled-evaluation-package.html` provides one coherent public scope baseline. It
covers evaluation scope, current architecture, the API and Manifest relationship, data
flow, limitations, procedure, expected outputs, success measures, confidentiality,
support, retention and deletion, subprocessors, incident handling, service
expectations, termination, disposition, and rights subject to counsel-reviewed scope.
The page does not represent itself as an executed licence, NDA, DPA, SLA, security
certification, production authorization, or offer.

### Completed technical evaluation

JRS-PE-001 was executed through `tests/platform-evaluation/run.mjs` using one synthetic
constructed record and no network calls. Twelve controls passed and none failed. The
test established a bounded path from a current-state engine response through Manifest
generation, customer evidence storage, offline validation, tamper detection, and human
review. It also established that the documented path can be run without oral founder
instruction.

The result does not establish a live API test, customer deployment, third-party
integration, market adoption, organizational effectiveness, accuracy, legal
sufficiency, compliance, security certification, or rights conveyability. Those limits
are stated on the public result page and in the machine-readable result.

### Updated verification

| Control | Result |
|---|---:|
| Zero-drift suite | 164 checks, 0 failed, 2 non-drift skips |
| Link audit | 82 pages, 1,766 links, 0 broken |
| Mobile/static audit | 405 checks across 82 pages, 0 failed |
| Enterprise hub visible words | 671 |
| New enterprise-route grades | 5 of 5 A, 100% |
| Platform evaluation | 12 checks, 12 passed, 0 failed |
| Manifest suite | 68 checks, 0 failed |
