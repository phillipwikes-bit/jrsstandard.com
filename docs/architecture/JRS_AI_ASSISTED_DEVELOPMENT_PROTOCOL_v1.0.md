# JRS AI-Assisted Development Protocol v1.0

**Status:** CONTROLLED DEVELOPMENT PROTOCOL  
**Date:** 2026-09-20

## 1. Required chain

Every material AI-assisted artifact follows:

INPUT → AI OUTPUT → HUMAN DECISION → MODIFICATION → REVIEW → ACCEPTANCE → VERSION TAG

The purpose is provenance, not a claim that AI assistance changes ownership or legal status.

## 2. Input

Record the human task, controlling source documents, constraints, target artifact, and known limitations. Secrets, credentials, unnecessary personal data, and protected implementation material must not be inserted into an external model merely for convenience.

## 3. AI output

Preserve enough information to identify the generated artifact or proposed change: date, model/tool where available, target file, and commit/diff or artifact hash. Do not treat generated text as accepted merely because it exists.

## 4. Human decision

For a material artifact, record one of:
- ACCEPT FOR REVIEW;
- MODIFY;
- REJECT;
- DEFER.

The decision record must identify the artifact or change. Silence is not acceptance.

## 5. Modification

Preserve the accepted modifications in version control. Do not rewrite the original AI output to make it appear that the accepted version was the initial output.

## 6. Review

Review must test the artifact against the evidence actually available, JRS controlled terminology, rights boundaries, public/private disclosure boundary, current-versus-target architecture, research limitations, and applicable automated checks. A generated legal, empirical, security, ownership, compliance, or commercial conclusion is not accepted merely because it is plausible.

## 7. Acceptance

Acceptance means the human owner accepts the artifact for its stated repository purpose. It does not mean counsel approved a legal conclusion, an external researcher validated a result, or production deployment occurred unless those events are separately evidenced.

## 8. Version tag

The accepted artifact must be traceable to a commit SHA, release identifier, schema version, document version, or cryptographic hash. Material revisions create a new traceable version.

## 9. Minimum provenance record

For each material AI-assisted artifact preserve:
- artifact path/name;
- purpose;
- input/instruction reference;
- AI tool/model if known;
- generated-output or initial-change reference;
- human decision;
- modification reference;
- review evidence/checks;
- acceptance identity/date;
- final version identifier;
- unresolved limitations.

## 10. Historical limitation

This protocol is prospective. It does not manufacture missing artifact-level human-review evidence for earlier JRS files. Earlier provenance remains classified according to the evidence that actually exists.
