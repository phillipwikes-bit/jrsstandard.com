# Decision Spellchecker in IncomeOS: inventory, architecture and implementation report

**Date:** 2026-11-04 (updated after review commit `df77f18` and report commit `4d0989f`) · **Branch:** `feature/incomeos-owner-prototype-2026-11-01` (draft PR #91, not for merge) · **Directive:** owner "Claude Code Master Directive: IncomeOS: Decision Spellchecker Commercial Operating System", 2026-11-04.
**Status:** development and planning only. Nothing is deployed, released, sold, sent or paid.

## 1. Evidence inspected and what is missing

| Item | Location | Status |
|---|---|---|
| Master Program Issue 3.4, Amendment O3 (2026-10-31) | not in repository (searched this branch and `origin/main`) | **NOT ESTABLISHED** from repository evidence |
| SP-01 to SP-18 acceptance criteria | not in repository | criteria text **NOT ESTABLISHED**; the 18 check slots exist, each `NOT_ACCEPTED` |
| SAL-01 to SAL-05 work packages | not in repository | recorded as an owner assertion only |
| 32-component rights inventory (0 grant-specific authorizations) | not in repository | recorded as an owner assertion only |
| 156-parent-record study and 24/32/100 cohorts | not in repository | recorded as `PLANNED` studies with no results |
| Source-aligned files of 2026-10-03 required by the Engine handoff | not available in this environment | blocker `BL-002` |
| Status line "original private Decision Spellchecker remains NO_GO_NOT_VERIFIED; independent H2/H3 NOT_ESTABLISHED; commercial transfer NOT_AUTHORIZED" | `docs/program-status/INVESTIGATOR_GUIDES_DIRECT_FREE_DELIVERY_CORRECTION_2026-10-31.md` line 49 | seeded as evidence `E-REPO-001` (level 4) |
| Current Engine handoff (release gates open, external contact and licensing prohibited without explicit owner instruction) | `docs/architecture/CURRENT_ENGINE_HANDOFF_2026-10-05.md` | seeded as evidence `E-REPO-002`; mirrored in gates G4 to G8 |

FACT: no repository file establishes that the JRS Review Engine (`api/`) is DS-A, DS-B or DS-C. The program record does not link them.

## 2. System inventory (relevant parts)

- **Hosting:** the IncomeOS owner prototype is static files under `owner/incomeos/` on this branch. It shares no deployment pipeline with the Lovable-hosted Opportunity Radar (that app is not reachable from this environment and is not touched). No IncomeOS hosting is connected; see earlier hosting decision.
- **Persistence:** the owner-held workspace file `incomeos.workspace.v1`, optionally AES-256-GCM encrypted (`workspace-store.js`). Nothing is kept in browser storage. A private database is prepared but not provisioned (`OWNER-PRIVATE-SCHEMA.sql`, `OWNER-PROFILE-SCHEMA.sql`, and now `DS-PROGRAM-SCHEMA.sql`).
- **Accountant and income modules:** `accountant.js`, ledger rows in the workspace, `financial-event-journal.js`, `double-entry.js`, `monthly-close.js`, `period-rollforward.js`.
- **Opportunity radar and passive-opportunity modules:** `research-radar.js`, `project-radar.js`, `eligibility-engine.js` and related UIs. All preserved; now under the Research tab.

## 3. Architecture

One program document, `incomeos.ds-program.v1`, stored as the `dsProgram` section of the workspace. The eight directive modules are **views over shared collections**, not eight stores:

| Module | Collections it reads and writes |
|---|---|
| Executive Command | everything, through `command()` |
| Research Intelligence | `evidence`, `findings`, `segments`, `competitors` |
| Product Engineering | `identities`, `acceptance` (SP-01 to SP-18), `requirements`, `tasks`, `defects`, `releases` |
| Validation Laboratory | `studies`, `runs` (arms H0 to H3; synthetic and independent kept apart) |
| Commercial Intelligence | `segments`, `competitors`, `pricing` |
| Business Development | `contacts` (permissioned ledger), `messages`, `pipeline` |
| IP and Risk | `rights`, `gates`, `authorizations`, `assertions`, `blockers` |
| Financial Engine | workspace `ledger` rows tagged `program: "decision-spellchecker"` plus `pricing` scenarios |

Shared rules: one identifier space across all collections (a duplicate identifier is refused); every cross-reference is checked; every change appends to the program's own change log and to the workspace change log.

### Dependency map

```
index.html ── ds-program-ui.js ──(events)── briefing-ui.js ── workspace-store.js ── ds-program.js
                     │                                              │
                     └── ds-program.js (command, finance, cycle)    └── ledger rows (dsDimension)
```

Events: `incomeos:ds-update` (program changes) and `incomeos:ds-ledger` (program cost rows) go to the workspace owner in `briefing-ui.js`; `incomeos:workspace-loaded/changed/restored` come back with the current workspace.

## 4. Controls implemented (each covered by `tests/incomeos-ds-program.mjs`)

- **Status vocabulary:** VERIFIED, IN PROGRESS, UNVERIFIED, BLOCKED, NOT AUTHORIZED. No weighted readiness percentage; readiness is the list of eight mandatory gates, and any open gate blocks it.
- **Product identities:** DS-A, DS-B and DS-C are separate. SP checks apply to DS-A only and accept only independent primary evidence (level 1 or 2) about DS-A; a DS-C test pass is refused, and a hand-edited "accepted" record fails validation.
- **Gates:** approved only by the named authority (owner or counsel) with primary evidence; G2 needs all 18 SP checks, G3 needs a grant-specific transfer authorization for every recorded component.
- **Research findings:** require source evidence, date, confidence, assumptions, contradictory evidence and the decision informed; a quantity (market size, price acceptance, interest) needs sourced evidence, never inference or assumption.
- **Contacts:** JRS website visitors, resource users, research participants and training recipients are refused as leads; a lawful basis is required; contact needs an owner-approved message and an owner authorization; suppressed contacts cannot be contacted. Nothing is ever sent by the software.
- **Pipeline:** IDENTIFIED, CONTACTED, REQUIREMENT VERIFIED, NONBINDING INTEREST, EXECUTED AGREEMENT. No skipping; each stage needs its own evidence; execution needs every gate plus owner authorization.
- **Restricted actions** (payment, listing, binding offer, external access, licensing, automated outreach, reinvestment, production release) each need their gates plus a recorded owner authorization. All are NOT AUTHORIZED today.
- **Validation:** H3 is the authenticated original only; run kind must match the study; a comparative claim stays NOT ESTABLISHED until completed independent studies have both arms at their minimum size.
- **Finance:** ten accounting dimensions; actuals only from tagged ledger rows; revenue counts as received only when bank-matched and tied to an executed agreement; reinvestment without authorization is flagged; pricing scenarios are labelled PROJECTION with break-even and a 12-month cumulative cash flow.
- **Operating cycle:** owner-run only. It reviews stale and low-confidence findings, ranks tasks by the owner's value, cost and risk scores, and records what it reviewed. It fetches nothing and contacts no one. The dashboard states that no autonomous process is configured.

- **Integrity of loaded files:** a workspace file edited by hand is held to the same rules as the app: gate approvals need their approver, date, reference and primary evidence; owner authorizations need a known action, date and reference; rights grants need an executed instrument; pipeline history must be sequential. References must name the expected kind of record.
- **Honest feedback:** the Program view reports a change only after the workspace applied it; otherwise it says "Not applied" with the reason.
- **Program report:** a confidential owner and counsel Markdown file with a diligence map (what, who, how, evidence, rights, technology, validation, limitations, commercial value) rated only from recorded evidence, plus gates, blockers, assertions, finance and restricted actions. Contacts and prospects appear as counts only. Downloaded locally; never sent.

## 5. Security status

- No change to the CSP (`connect-src 'self'`), no new network call, no browser storage.
- Program data is protected today only by the owner's file handling and optional workspace encryption. **Database-enforced access is NOT ESTABLISHED**: `DS-PROGRAM-SCHEMA.sql` is prepared (owner-only RLS, append-only audit) but not applied, pending the private project (blocker `BL-004`).
- No real investigative, employment or other sensitive records are processed; tests use synthetic records only.

## 6. Directive coverage

| Phase | State |
|---|---|
| 1 Architecture and evidence recovery | Inventory and architecture done (this file). Evidence recovery **blocked**: controlling documents and source-aligned files are not available. |
| 2 Command Center | Implemented: Program is the first navigation item and default view, backed by the persistent program record. |
| 3 Research and engineering | Forms for evidence, findings, tasks (start and done), requirements, defects, release candidates, studies, runs, rights components and evidence links. No source-backed research has been entered. |
| 4 Commercial infrastructure | Contact ledger, message approval, recorded contacts, suppression, pipeline advance, owner authorization and gate approval records, pricing scenarios, finance integration and the confidential program report implemented. Licensing templates, dossiers and agreements **not drafted** (they need the controlling documents and counsel). |
| 5 Operational verification | Engine, browser, layout and regression suites pass locally; database access controls cannot be verified until provisioned. |
| 6 Controlled commercialization | Not started; every external action is gated and not authorized. |

## 7. Owner decisions needed

1. Supply the controlling documents (Master Program O3, SP-01 to SP-18, SAL-01 to SAL-05, rights inventory, study designs) so they can be cited as evidence instead of assertions.
2. Supply or locate the original DS-A source for recovery and authentication (gate G1).
3. Provision the private database and authorize the CSP change so access control can be enforced and tested.
4. Decide whether any external contact for discovery interviews is authorized, and with which approved message.
