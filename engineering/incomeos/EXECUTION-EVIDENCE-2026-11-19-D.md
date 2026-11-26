# Execution evidence: round-three checks and review packets (2026-11-19)

- `hedged_source_stated_firmly` (advisory): a claim states as firm ("subject to", "required") what its cited source only hedges ("should", "recommended", "where possible"). Shows the source wording.
- Wider word lists: result phrasing "found the ... acceptable/adequate/sufficient"; end dates "ends on", "lapses"; numeric caps ("at most", "no more than", "per day") count as stated controls.
- Origin: the developer's own pre-check of AR-81 to AR-83 (records reserved for practitioner review). Their predictions were recorded before these changes and are unchanged; the comparisons will use them. These records are not evidence for the changes.
- Tests: constructed record AR-63 (positive and negative cases).
- `build-review-packet.mjs`: printable HTML and plain text for the practitioner; refuses non-fictional records; never overwrites; tested to contain no engine output.
- Browser check race fixed: the D06 correction-flow check waited only for status HOLD, which the previous record also had, so Enter could land on the old record before D06 loaded. It now waits for D06's own text. Before: 26-28 of 28 across runs (also on the prior commit). After: 28/28 on 8 consecutive runs.
