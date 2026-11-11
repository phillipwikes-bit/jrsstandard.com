// Read-only Owner Desk projection of the ONE authoritative DS programme.
// Deliberately no import of the experimental reviewer engine from ../../lib:
// Vercel serves owner/incomeos as an isolated static site. Relative library
// imports would fail at runtime and falsely suggest the product is integrated.
// This module provides no reviewer session, money transfer, approval or access.
export function checkProgram(program) {
  if (!program || program.schema !== 'incomeos.ds-program.v1' ||
      !Array.isArray(program.acceptance) || program.acceptance.length !== 18 ||
      !Array.isArray(program.gates)) {
    throw new TypeError('A validated IncomeOS dsProgram v1 is required');
  }
  for (let i = 1; i <= 18; i++) {
    const id = 'SP-' + String(i).padStart(2, '0');
    const item = program.acceptance.find(x => x?.id === id);
    if (!item || item.identity !== 'DS-A' ||
        !['NOT_ACCEPTED', 'ACCEPTED'].includes(item.status)) {
      throw new TypeError('Missing or malformed original acceptance item ' + id);
    }
  }
  // The structural check above is not acceptance verification. Apply the
  // existing authoritative programme validator before reading any status.
  // This refuses forged ACCEPTED checks, unsupported gate approvals, broken
  // evidence links and malformed rights records even if the shape looks valid.
  const owner = globalThis.IncomeOSDSProgram;
  if (!owner || typeof owner.validate !== 'function' || owner.SCHEMA !== program.schema) {
    throw new TypeError('Authoritative IncomeOS programme validator unavailable');
  }
  owner.validate(program);
  return program;
}

// A filtered snapshot, not a new source-of-truth or a GitHub status poll.
export function inspectOwnerProduct(program, provenance = null) {
  const p = checkProgram(program);
  const originalVerification = globalThis.IncomeOSDSProgram.originalVerificationPlan(p);
  const accepted = p.acceptance.filter(x => x.status === 'ACCEPTED').length;
  // The owner programme remains the only mutable source for defects, tasks,
  // research evidence and experimental study run records.
  const ranked = globalThis.IncomeOSDSProgram.prioritize(p);
  const ready = ranked.find(x => x.module === 'engineering' && x.state === 'READY');
  const openDefects = p.defects.filter(x => x.status === 'OPEN')
    .map(x => ({ id: x.id, title: x.title, severity: x.severity, identity: x.identity }));
  const studyRuns = {
    synthetic: p.runs.filter(x => x.kind === 'synthetic').length,
    independent: p.runs.filter(x => x.kind === 'independent').length,
  };
  const meta = provenance && typeof provenance === 'object' ? provenance : {};
  return Object.freeze({
    contract: meta.contract || 'incomeos.ds-owner-inspection/1.0.0-dev',
    integration: meta.integration || 'READ_ONLY_SOURCE_NOT_PACKAGED',
    ownerRecordSchema: p.schema,
    candidate: meta.candidate || 'DS-N1',
    candidateVersion: meta.candidateVersion || 'NOT_LOADED_IN_OWNER_DESK',
    rulesVersion: meta.rulesVersion || 'NOT_LOADED_IN_OWNER_DESK',
    cognitiveVersion: meta.cognitiveVersion || 'NOT_LOADED_IN_OWNER_DESK',
    reflectiveVersion: meta.reflectiveVersion || 'NOT_LOADED_IN_OWNER_DESK',
    originalSource: originalVerification.recordedSourceGateReady
      ? 'RECORDED_SOURCE_PREREQUISITES' : 'AUTHENTIC_SOURCE_NOT_RECOVERED',
    originalAcceptance: { accepted, total: 18 },
    originalVerification,
    openGates: p.gates.filter(x => {
      if (x.id === 'G1') return !originalVerification.recordedSourceGateReady;
      if (x.id === 'G2') return !originalVerification.recordedAcceptanceGateReady;
      return !x.approval;
    }).map(x => x.id),
    // Programme counts are not a GitHub CI query or independent acceptance.
    programmeEvidenceEntries: p.evidence.length,
    programmeRequirementsRecorded: p.requirements.length,
    programmeStudyRuns: studyRuns,
    openDefects,
    unresolvedEngineeringTasks: ranked.filter(x => x.module === 'engineering').length,
    nextExecutableEngineeringTask: ready
      ? { id: ready.id, title: ready.title, evidenceLinked: ready.evidence > 0 }
      : null,
    githubCIStatus: 'NOT_CONNECTED',
    release: 'NOT_AUTHORIZED',
    customerAccess: 'NOT_AUTHORIZED',
    scope: 'DEVELOPMENT_ONLY_CONSTRUCTED_FICTIONAL',
  });
}

