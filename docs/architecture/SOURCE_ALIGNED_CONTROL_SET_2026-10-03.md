# Source-aligned control set of 3 October 2026 (internal)

**Internal. Not public, not a deployment input, and the source files are not committed.** The repository is public on GitHub, so on the owner's direction of 2026-10-07 the three October 3 files stay local and untracked (`project_sources/`). This repository records only their hashes, sizes, titles, dates, line locators, classifications and minimal paraphrases. Integrity receipt: `tools/source-alignment/SOURCE_INTEGRITY_RECEIPT.json`.

## The three sources
| ID | Source | SHA-256 | Bytes | Lines |
|---|---|---|---|---|
| S01 | Master Asset Register, current source revision with the 3 October harmonization update | `0c64eaff74cae34b…` | 64,866 | 748 |
| S02 | Evidence Ledger, current source revision with the 3 October harmonization update | `57e2ec50fc431381…` | 42,784 | 190 |
| S03 | Master Architectural Blueprint, current source revision with the 3 October harmonization update and controlling architectural amendments | `a8822d7f54012dd6…` | 66,723 | 2,057 |

Each hash equals the value recorded in `docs/architecture/CURRENT_ENGINE_HANDOFF_2026-10-05.md`, and each file is byte-identical to the delivered archive.

Each file opens with a dated supplement that controls current interpretation. Below it sits a retained historical source, which the supplement says remains history and is not a current instruction. S03's historical part includes dated addenda from 29 and 30 September 2026. This package takes controls from the supplements, and treats historical text only as design context. Line ranges: S01 controlling 1 to 109; S02 controlling 1 to 111; S03 controlling 1 to 119.

## What each source governs
| Source | Governs | Does not establish |
|---|---|---|
| S01 | Current scope and status of the JRS estate, version and release identity, evidence-ID control, the required production gates, human authority over evaluation, rights and correspondence findings, and the asset inventory | Legal title, rights grants, a fresh evaluation run, commercial release, deployment, or that any historical label is current |
| S02 | The same supplement, plus the canonical evidence-ID sequence (E-001 to E-045) and the propositions and limitations each entry supports | That any entry is true beyond its stated evidence level, or any rights finding beyond what the entry states |
| S03 | The same supplement, plus the controlling architectural amendments: execution environment, harness controls, evaluation controls, adversarial tests, the real-record path, machine-readable release gates and the completion package | That the historical architecture is implemented, or that any target capability exists |

## Governing order for this package
1. S01, the Master Asset Register.
2. S02, the Evidence Ledger.
3. S03, the Master Architectural Blueprint.
4. Owner decisions already preserved in the repository, including D-2 and D-3.
5. The 5 October Engine handoff, where it is consistent with S01 to S03.

Where a later internal document conflicts with these sources, neither is overwritten. The conflict is recorded with its locators in `SOURCE_ALIGNED_RECONCILIATION_REPORT_2026-10-07.md` and classified as needing reconciliation.

## What a source-aligned reference does not do
A source citation shows only that the cited source says it. Aligning a repository control to a source line shows the two agree; it does not validate the Engine, close a release gate, establish independent evaluation, or authorize release, deployment, licensing or sale. All five release gates remain open.
