# Evidence Graph Specification (0.3.0)

Local ID: EGC-DOC-01 (NON-CANONICAL). Contract `jrs-engine-local-0.3.0-evidence-graph`; compiler `0.3.0-local`; graph format `jrs-evidence-graph/0.3.0`.

## Claim
For each in-scope synthetic record the compiler produces a deterministic typed graph in which every non-refusal finding can be traversed to an exact record span, every finding carries exactly one limitation and one human-review route, and the graph is re-checked by an independent validator before it is returned.

## Local engineering evidence
- Code: `lib/engine-evidence-graph/compiler.mjs` (build), `graph-validate.mjs` (rules GV-01 to GV-14), `contract.mjs` (types, shapes, meanings).
- Replay: `tools/engine-evidence-graph-replay.mjs`, 35/35 fixtures pass; `execution-record/EXECUTION_RECORD.json`.
- Suite: `tests/engine-evidence-graph/run.mjs` sections B and C; mutations M-09 to M-18.

## Node types
record, record_section, record_span, proposed_quote, verified_evidence, assertion, condition, finding, limitation, conflict, refusal, human_review_route, run_identity. Each type has a closed field list (`NODE_FIELDS`); an undeclared field fails GV-02.

## Edge types and fixed meanings
| Edge | Meaning (fixed; GV-03 rejects any other text) |
|---|---|
| CONTAINS | Structural containment (record to section, section to span) |
| LOCATES | The compiler located a span for a proposed quote |
| QUOTES | A verified evidence item quotes exactly this span |
| TEXTUALLY_SUPPORTS | The quoted text is present in the record and is associated with the bounded assertion type. |
| RELATES_TO | A finding relates to a condition, assertion or anchor span |
| TEMPORALLY_PRECEDES | One dated span is stated earlier than another |
| TEMPORALLY_CONFLICTS | Two dated spans cannot both be correct as written |
| CONTRADICTS | A conflict node links the items whose statements conflict |
| LIMITS | A limitation bounds a finding |
| ROUTES_TO_REVIEW | A finding or conflict is sent to the human-review route |
| REFUSES | A refusal applies to a finding or to the run |

Allowed (from-type, edge, to-type) triples are fixed in `EDGE_SHAPES`.

## Validation rules
| Rule | Checks |
|---|---|
| GV-01 | Identity fields present; record node present; zero provider and network calls |
| GV-02 | Unique ids, known types, required and only declared fields |
| GV-03 | Known edge types, no dangling edges, allowed shape, fixed meaning |
| GV-04 | Span text equals the record at its UTF-16 offsets; UTF-8 offsets consistent |
| GV-05 | Verified evidence has a usable quote status, quotes exactly one matching span, supports exactly one known assertion type that requires human interpretation |
| GV-06 | Five findings, once each; every non-refusal finding reaches an exact span |
| GV-07 | Status only kept or lowered; sufficiency never supported; no favourable status with a conflict, instruction risk, refusal, stopped intake or unusable quotation |
| GV-08 | Exactly one limitation with presence text (and sufficiency text where applicable); routed to review |
| GV-09 | Conflicts link two or more items, keep the fixed statement, are routed to review and downgrade the affected condition |
| GV-10 | A stopped intake has no assessed finding and no candidate read |
| GV-11 | Authored text carries no proof, correctness, legal, compliance or credibility claim (negation-aware; verbatim record text excluded) |
| GV-12 | Nodes and edges sorted by id |
| GV-13 | Cognitive Controls objects complete and neutral |
| GV-14 | No prohibited key (offsets or statuses from the candidate) |

A graph that fails validation is a thrown error, never an output.

## Interpretation
The graph makes the path from a finding back to record text inspectable and mechanically checkable.

## Limitation
Traversal shows where text is, not what it means. TEXTUALLY_SUPPORTS is not support for the truth of the finding. All fixtures are synthetic and engineering-authored.

## External evidence still required
Independent labels and adjudication for any statement about finding correctness; counsel review of any real-record data flow.
