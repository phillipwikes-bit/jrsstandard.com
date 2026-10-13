# v0.2 Prompt Specification

**Prompt version:** `jrs-engine-local-0.2.0/prompt-1` · **File:** `PROMPT_v0.2.0.txt` · **Pinned SHA-256:** `sha256:d6f1498e7d51b0477029e237e6ea045d302491c2e98c42f6727d364d1ae845ae` (see `PROMPT_MANIFEST.json`)

**Status: specification only. It has never been sent to any model.** It is exercised only through fixed mock candidate responses in `../fixtures/cases/`. Rationale for each instruction is in `PROMPT_RATIONALE.md`; change rules are in `../PROMPT_CHANGE_CONTROL.md`.

## Structure

| Part | Content |
|---|---|
| `[SYSTEM]` | Instructions P1 to P11 |
| `[USER]` | A fixed request followed by the record between `<record>` and `</record>` |

`lib/engine-evidence-contract/prompt.mjs` loads the text, refuses it if the SHA-256 differs from the pin, and assembles the two messages. It refuses a record containing `<record>`, `</record>` or the `{{RECORD}}` placeholder, because such a record could close the data block early. It returns `sent: false` and contains no network code.

## Required output (what the validator accepts)

```json
{
  "contract_version": "jrs-engine-local-0.2.0",
  "conditions": [
    {
      "condition_id": "identifiable_basis",
      "status": "supported",
      "finding_summary": "The decision basis names a dated risk assessment and its finding.",
      "evidence_items": [
        { "evidence_id": "E1", "exact_quote": "Decision basis: Risk assessment RA-2026-0311, ...",
          "start_offset": 376, "end_offset": 526, "assertion_type": "stated_rationale" }
      ],
      "limitation": "This cites record text only and does not establish that the documentation is adequate in context."
    }
  ]
}
```

Exactly five conditions, one per `condition_id` (`reconstructability`, `identifiable_basis`, `chronology_integrity`, `reasoning_traceability`, `sufficiency`); exactly the keys shown; statuses limited to `supported`, `gap`, `review_required`, `not_assessed`. Fields such as `presence_verified`, `semantic_support_not_verified`, `record_section`, `human_review_required` and `cognitive_controls` are **added by the validator**, never accepted from the candidate (a candidate that supplies them has the condition routed to review: fixture EC-025).

## Claim, evidence, interpretation, limitation

- **Claim.** The prompt states every instruction the assignment requires.
- **Local engineering evidence.** `tests/engine-evidence-contract/run.mjs` section B checks the pin and eleven required clauses, the delimiter refusal, and that a one-sentence edit changes the hash.
- **Interpretation.** The text is fixed and identifiable; any change is detectable.
- **Limitation.** Whether any model follows these instructions, and in particular whether it can produce exact UTF-16 offsets, is **NOT ESTABLISHED**. Offsets are the instruction most likely to fail in practice (KF-01 in `../KNOWN_FAILURE_MODES_AND_STOP_CONDITIONS.md`).
- **External evidence still required.** An authorised, recorded live evaluation under `../PROMPT_CHANGE_CONTROL.md`.
