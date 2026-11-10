# Evaluation Workbench (offline)

A static, local viewer for synthetic runs of the v0.2 candidate. **It is not a service.** There is no server, no HTTP listener, no upload, no form, no script in any page, and no external resource. It reads only the synthetic fixtures in `fixtures/cases/`.

## Build

```sh
env -u ANTHROPIC_BASE_URL node research/engine-evidence-contract-2026-10-10/workbench/build-workbench.mjs --clock 2026-10-10T00:00:00Z
NODE_PATH=$(npm root -g) node research/engine-evidence-contract-2026-10-10/workbench/screenshot.mjs   # optional; local headless Chromium
```

The build installs the network trap and refuses to start if a provider credential or endpoint is configured. The screenshot script opens `file:` pages in offline mode and aborts every non-`file:` request; it recorded 0. Output: `workbench/rendered/*.html` (open directly in a browser), `workbench/rendered/*.txt` (command-line reading), `workbench/screenshots/*.png`.

## Reading order on every page

1. Scope and intake · 2. Version and run identity · 3. Original synthetic record · 4. Candidate response (a fixed mock, labelled as such) · 5. Offset-verified evidence highlighted against the record (verified quotations only) · 6. Condition-level results with routing reasons · 7. Cognitive Controls · 8. Refusals and limitations, including quarantined instruction spans · 9. Comparison with historical v1 output, where supplied · 10. Human-review acknowledgment placeholder (records nothing)

## Rendered cases

| Case | Shows | Screenshot |
|---|---|---|
| EC-001 | Supported conditions with verified textual evidence | `screenshots/EC-001.png` |
| EC-002 | Chronology gap requiring human review, with CC-03 remediation | `screenshots/EC-002.png` |
| EC-003 | Out-of-scope employment-related record, refused before analysis | `screenshots/EC-003.png` |
| EC-012 | Embedded instructions quarantined; every favourable status routed to review | HTML only |
| EC-027 | Historical v1 output compared side by side | HTML only |

## Claim, local engineering evidence, interpretation, limitation, external evidence

- **Claim.** The workbench presents a run in a fixed order without any network capability.
- **Local engineering evidence.** Test section F: no script, form, input, iframe, `src=` or URL in any page; no server, listener, upload or network client in the builder; synthetic fixtures only; ten sections in order; required examples and screenshots exist; 0 trapped network attempts.
- **Interpretation.** A reviewer can inspect a synthetic run end to end locally.
- **Limitation.** A highlight shows that text is present, not that it supports the finding. The acknowledgment section is a placeholder with no recording function. The pages are for local review only and are not part of the public site (`research/` is excluded from deployment).
- **External evidence still required.** Usability review by an actual documentation reviewer.
