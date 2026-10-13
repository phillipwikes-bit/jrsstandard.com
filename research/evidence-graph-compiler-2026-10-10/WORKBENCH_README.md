# Evidence Graph Workbench

Local ID: EGC-DOC-13 (NON-CANONICAL). Builder: `workbench/build-workbench.mjs`; screenshots: `workbench/screenshot.mjs`.

## Claim
Six synthetic examples are rendered as static HTML pages with fourteen sections each, captured at desktop (1280) and mobile (390) widths with no network request and no horizontal overflow.

## Local engineering evidence
- `rendered/index.html` and GC-001, GC-002, GC-003, GC-004, GC-006, GC-008.
- `screenshots/*.png` (12) and `SCREENSHOT_RECORD.json`: 0 non-file requests aborted, 0 pages with overflow.
- Suite section G: no script, form, input, iframe, storage, analytics or external URL; sections in order; no unsupported claim; factory status shown.

## Sections
1 Run identity and limitation banner; 2 Original synthetic record; 3 Exact highlighted evidence spans; 4 Section map; 5 Proposed quotations; 6 Quote-resolution result; 7 Graph nodes and edges; 8 Condition results; 9 Contradiction nodes; 10 Cognitive Controls; 11 Refusals and limitations; 12 Human-review route; 13 v0.2 comparison; 14 Sealed-evaluation factory status.

## Commands
```
env -u ANTHROPIC_BASE_URL node research/evidence-graph-compiler-2026-10-10/workbench/build-workbench.mjs
NODE_PATH=$(npm root -g) node research/evidence-graph-compiler-2026-10-10/workbench/screenshot.mjs
```

## Interpretation
A reviewer can inspect each step from record text to review route without running code.

## Limitation
The pages are not deployed, carry `noindex,nofollow`, and show synthetic records and mock candidate responses only.

## External evidence still required
Usability review by intended reviewers.
