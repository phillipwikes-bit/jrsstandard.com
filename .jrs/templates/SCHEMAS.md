# Registry Schemas

Canonical field sets for `.jrs/registries/`. A record that cannot fill a field
records `NOT ESTABLISHED` rather than a guess.

**Asset:** asset_id, parent_asset_id, name, type, description, version, status, creator,
contributors, source_refs, evidence_refs, rights_status, rights_evidence_refs,
classification (PUBLIC|CONTROLLED|RESTRICTED), dependencies, validation_status,
claim_refs, commercial_status, release_status, last_reviewed, reviewer.

**Evidence:** evidence_id, source, location, type, date, person, asset, level (A-E),
proposition_supported, limitation, conflict, verification_date, reviewer.

**Claim:** claim_id, claim, asset_refs, evidence_refs, status
(DEMONSTRATED|SUPPORTED|OBSERVED|PROPOSED|PLANNED|UNVERIFIED|PROHIBITED), limitations,
public_use, commercial_use, legal_review_required, last_verified, reviewer.

**Contributor:** person_id, name, role, assets, contribution_evidence, consent_evidence,
publication_rights, commercial_rights, transfer_rights, assignment_evidence, status,
open_questions.

**Provenance:** artifact_id, asset_id, human_objective, source_material, ai_tool,
ai_contribution, human_direction, human_modification, human_review, testing, acceptance,
commit, version, date, rights_classification.

**Validation:** validation_id, asset_id, objective, hypothesis, method, dataset, sample,
metric, criterion, result, uncertainty, limitations, negative_findings, evidence_refs,
reviewer, date.

**Blocker:** blocker_id, severity (CRITICAL|HIGH|MEDIUM|LOW), category
(IP|LEGAL|SECURITY|VALIDATION|TECHNICAL|REGULATORY|COMMERCIAL), description,
evidence_refs, affected_assets, required_action, owner, status (OPEN|DEFERRED|RESOLVED),
created, resolved.
