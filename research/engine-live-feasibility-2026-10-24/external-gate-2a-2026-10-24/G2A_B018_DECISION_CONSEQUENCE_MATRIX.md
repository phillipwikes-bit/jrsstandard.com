# G2A B-018 Decision Consequence Matrix

**NON-OPERATIVE. Prepared 2026-10-24. Not a repository record. Makes, recommends and
records no decision.** B-018 remains OPEN. Release status remains NO_GO_NOT_VERIFIED.
Independent evaluation is not authorized.

## 0. How to read this matrix

**Sources.** `external-gate-2-2026-10-23/` (decision cards, counsel brief, evidence and
boundary matrix), `external-gate-234-2026-10-24/GATE_2_B018_DECISION_READINESS_REGISTER.md`,
`external-gate-3a-2026-10-24/` (gap register identifiers such as GOV-02 and RTS-04),
`b018-preservation-2026-10-24/` (reconciliation record, preserved outside the repository),
the Phase 8 registries and handoff freeze, the Phase 9 owner decision register, and the
2026-10-05 operating handoff. "Owner-reported" marks findings verified only in the
external reconciliation workspace.

**States.**

| State | Meaning |
|---|---|
| Deferred | No decision made; existing restrictions remain |
| Limited decision | A bounded rule is adopted, with stated restrictions |
| Full disposition | The designated authority records a complete disposition within its remit |
| Insufficient evidence | The issue remains open because its evidence or authority is missing |

**Closure rule (existing, unchanged).** B-018 may be considered for closure only when each
of the five items has a recorded disposition by its designated authority, including
counsel where the item concerns legal rights or legal interpretation. No existing record
says whether a limited decision counts as a disposition. In this matrix, a limited
decision is shown as counting toward closure only if its decision record states that it is
the item's disposition (PROPOSAL, see change-control rule CC-04). That question is the
owner's, and counsel's for B018-CQ-05.

**Gate 3 options.** A: no evaluation. B: synthetic-only methods rehearsal. C: controlled
evaluation on separately approved material. Option A is unaffected by every state below
and is not repeated in the tables.

**Prohibited under every state of every item.** Release, deployment, production use,
public or commercial claims, licensing, offers, pricing, onboarding, acquisition or sale
activity, rights transfer, ownership statements, validation statements, provider use,
real-record use, and any repository change without separate authorization. No state of
any item closes B-018 by itself or changes NO_GO_NOT_VERIFIED.

---

## 1. B018-OD-01: Source-ledger namespace and crosswalk

Designated authority: owner. Local fact: local ledger E-001 to E-039. Owner-reported:
source namespace E-001 to E-045.

| Field | Deferred | Limited decision | Full disposition | Insufficient evidence |
|---|---|---|---|---|
| Example of the state | No card option chosen | Card option B: a local alias for new records only, no mapping | Card option A or C: a crosswalk record pairing each identifier, or recording that no counterpart exists | Pairings attempted but the source ledger is not available in an authorized workspace |
| Authority required | None | Owner | Owner; pairings prepared where the source is authorized | Owner, to record that the item stays open |
| Evidence required | None | Local ledger; list of records that would adopt the alias | Source Evidence Ledger in an authorized workspace; local ledger; basis for each pairing | Record of what was missing |
| Records that may be updated only with later authorization | None | New records adopting the alias | A crosswalk record; under option C, a later renumbering with its own change record and drift-guard handling | None |
| Actions that remain prohibited | Treating same-numbered entries as the same evidence | Same, for existing records still using bare E-nnn | Copying source content into the repository; changing the truth of any entry; any evidentiary or public claim from a pairing | Same as Deferred |
| Effect on B-018 | OPEN; interim "local E-nnn" convention continues | OPEN; counts toward closure only if recorded as the disposition | Item disposed; B-018 stays OPEN until all five are disposed | OPEN |
| Effect on Option B | None | None | None | None |
| Effect on Option C | None for execution; results cite evidence as "local E-nnn" | Same | Results may cite through the crosswalk | None for execution |
| Re-evaluation triggers | A new record needs to cite a source entry | A record cites a bare E-nnn | Any change to either ledger; a source ledger with a different SHA-256 | Source access becomes available |
| Counsel review required when | No existing record requires it | No existing record requires it | A pairing would support a rights or evidentiary proposition | No existing record requires it |

## 2. B018-OD-02: Controlling human-review protocol

Designated authority: owner. Related open decisions: P9-OD-01 (whether a dual review may
run), P8-OD-04 (whether evaluation is authorized). Gap register: GOV-02.

| Field | Deferred | Limited decision | Full disposition | Insufficient evidence |
|---|---|---|---|---|
| Example of the state | No protocol designated | One protocol designated for a bounded object only (for example, the Phase 9 protocol for a synthetic-only rehearsal) | Card option A, B or C recorded: protocol, version, object of review, relation to the 2026-10-05 scope | The owner cannot reconcile a protocol's scope with the 2026-10-05 exclusions from the records available |
| Authority required | None | Owner | Owner | Owner, to record that the item stays open |
| Evidence required | None | Both protocols; the 2026-10-05 handoff; the bounded object | Same, plus any protocol revision needed (a rule change needs a new protocol version) | Record of the unresolved scope conflict |
| Records that may be updated only with later authorization | None | A designation record limited to the bounded object | A designation record; a new protocol version if rules change; a boundary record under option C | None |
| Actions that remain prohibited | Running any review; treating either protocol as controlling | Using the designation beyond its object; enabling execution without P9-OD-01; processing excluded record types | Running a review, recruiting reviewers or using real records or labels on the strength of the designation alone | Same as Deferred |
| Effect on B-018 | OPEN | OPEN; counts toward closure only if recorded as the disposition | Item disposed; B-018 stays OPEN until all five are disposed | OPEN |
| Effect on Option B | Blocks (GOV-02) | Can satisfy GOV-02 for B if the bounded object is the synthetic rehearsal; P9-OD-01 still needed | Satisfies GOV-02 for B; P9-OD-01 still needed | Blocks |
| Effect on Option C | Blocks (GOV-02) | Blocks unless the bounded object covers the approved C material | Satisfies GOV-02 for C if the designation covers the approved material; P9-OD-01 still needed | Blocks |
| Re-evaluation triggers | An evaluation option is selected | Scope of the rehearsal or evaluation changes | Any protocol revision; any change to the 2026-10-05 scope or excluded domains | Records that resolve the scope conflict |
| Counsel review required when | No existing record requires it | The bounded object involves any material other than synthetic | The designated protocol would apply to real records or consequential record types | No existing record requires it |

## 3. B018-OD-03: Source-era and local-candidate version separation

Designated authority: owner. Local fact: seven registered packages; Phase 6 to 9 local
only; candidate `phase7-candidate` package SHA-256 `815c5d56...25c3`. Owner-reported: the
source records contain historical Engine material not represented locally. Gap register:
GOV-04.

| Field | Deferred | Limited decision | Full disposition | Insufficient evidence |
|---|---|---|---|---|
| Example of the state | No lineage record | A rule that each version is described only by its registry status and hash, with no continuity asserted and no lineage record | Card option A (one lineage, source-era Engine first) or option B (separate parallel lineage) recorded in a dated lineage record | Option A chosen but source-era content is not available in an authorized workspace |
| Authority required | None | Owner | Owner | Owner, to record that the item stays open |
| Evidence required | None | Version and later-package registries | Registries; for option A, source-era Engine content and its SHA-256 in an authorized workspace | Record of what was missing |
| Records that may be updated only with later authorization | None | A description rule record | A lineage record keyed to manifest hashes and source SHA-256 | None |
| Actions that remain prohibited | Describing any local candidate as the source-era Engine | Asserting continuity; relabeling a candidate as released | Committing, publishing, releasing or deploying any version; changing a registered manifest | Same as Deferred |
| Effect on B-018 | OPEN | OPEN; counts toward closure only if recorded as the disposition | Item disposed; B-018 stays OPEN until all five are disposed | OPEN |
| Effect on Option B | None if results are process findings only; blocks if results are described beyond that | Satisfies GOV-04 for B | Satisfies GOV-04 for B | Same as Deferred |
| Effect on Option C | Blocks (GOV-04) unless a G1 statement limits how the candidate is described | Can satisfy GOV-04 for C | Satisfies GOV-04 for C | Blocks unless a G1 statement limits description |
| Re-evaluation triggers | Option C selected | Any new package admission | Any package hash change; any new source-era material | Source access becomes available |
| Counsel review required when | No existing record requires it | No existing record requires it | A lineage statement would bear on ownership or chain of title | No existing record requires it |

## 4. B018-OD-04: Commercial-language alignment

Designated authority: owner, with counsel for any licensing language. Local fact:
`CURRENT_COMMERCIAL_POSTURE.md` (2026-10-02) predates the 2026-10-05 boundary and describes
inquiry pathways; the 2026-10-05 handoff governs Engine work by its own supersession rule.

| Field | Deferred | Limited decision | Full disposition | Insufficient evidence |
|---|---|---|---|---|
| Example of the state | Card option C: no precedence record | Card option A: the 2026-10-05 handoff takes precedence for Engine statements, conflicting text listed, no text changed | Card option A or B recorded, with a separately approved revision list where any text is to change | Option B chosen but counsel has not reviewed the licensing wording |
| Authority required | None | Owner | Owner; counsel for option B or any licensing wording | Owner, to record that the item stays open |
| Evidence required | None | Both records; the claim reconciliation log | Same; counsel review for licensing wording | Record of the missing review |
| Records that may be updated only with later authorization | None | A precedence record | A precedence record; any public or commercial text only under the publication and claim policies with separate approval | None |
| Actions that remain prohibited | Changing commercial or public text; any offer or pathway statement | Same; the precedence record is internal only | Any offer, price, contract, onboarding, licence, acquisition or rights transfer | Same as Deferred |
| Effect on B-018 | OPEN | OPEN; counts toward closure only if recorded as the disposition | Item disposed; B-018 stays OPEN until all five are disposed | OPEN |
| Effect on Option B | None | None | None | None |
| Effect on Option C | None for execution; G10 claims control must treat commercial statements as prohibited | Same, with the precedence record as reference | Same | None for execution |
| Re-evaluation triggers | Any proposed commercial or public text | Any new commercial record | Any revision list item; any change to the 2026-10-05 boundary | Counsel review completed |
| Counsel review required when | Any licensing language is proposed | Any licensing language is listed | Option B, or any licensing wording | Always for licensing wording |

## 5. B018-CQ-05: Rights and chain-of-title issues

Designated authority: counsel, with owner. The owner alone cannot dispose of this item.
Local fact: every ownership status is owner assertion or unknown; no contributor
assignment, co-author allocation, publisher agreement, repository licence or trademark
filing is located. No counsel is engaged.

| Field | Deferred | Limited decision | Full disposition | Insufficient evidence |
|---|---|---|---|---|
| Example of the state | No counsel engagement or disposition | Counsel disposes of a bounded subset (for example, counsel-brief question 9 on what must be answered before an independent evaluation) | Counsel records a disposition of the counsel-brief questions | Counsel cannot dispose without source documents or instruments not located |
| Authority required | None | Counsel, with owner | Counsel, with owner | Counsel or owner, to record that the item stays open |
| Evidence required | None | Local rights records listed in the counsel brief; source documents where counsel requires them | Same, in full | Record of what counsel requires |
| Records that may be updated only with later authorization | None | A counsel disposition record for the subset; rights registers only as counsel directs | A counsel disposition record; rights registers only as counsel directs | None |
| Actions that remain prohibited | Any ownership, licensing, acquisition, sale or publication claim; treating authorship, consent or credit as conveyance | Same, outside the disposed subset; any extension of the subset by inference | Any statement beyond what counsel's written disposition supports | Same as Deferred |
| Effect on B-018 | OPEN | OPEN; counts toward closure only if counsel records it as the disposition | Item disposed; B-018 stays OPEN until all five are disposed | OPEN |
| Effect on Option B | Only through RTS-02 (disclosure to evaluators), if the owner decides counsel review is needed for B | Same; a subset covering disclosure could address RTS-02 | Addresses RTS-02 to the extent counsel's disposition covers it | Same as Deferred |
| Effect on Option C | Blocks (RTS-04) unless a G1 statement proceeds with rights open and stated limits | Addresses RTS-04 to the extent the subset covers evaluation | Addresses RTS-04 | Blocks (RTS-04) unless a G1 statement as in Deferred |
| Re-evaluation triggers | Counsel engaged | Any proposed use outside the subset | Any new contributor, instrument, publication or transfer | Missing documents located |
| Counsel review required when | Always, before any rights statement | Always | Always | Always |

---

## 6. Owner authority and counsel authority (summary)

| Item | Owner may dispose alone | Counsel required |
|---|---|---|
| B018-OD-01 | Yes | Only if a pairing would support a rights or evidentiary proposition |
| B018-OD-02 | Yes | Only if the designated protocol would apply to non-synthetic or consequential records |
| B018-OD-03 | Yes | Only if a lineage statement would bear on ownership or chain of title |
| B018-OD-04 | Options A and C | Option B and any licensing wording |
| B018-CQ-05 | No | Always |

Because B018-CQ-05 cannot be disposed of without counsel, and no counsel is engaged, B-018
cannot reach its closure condition on present records.
