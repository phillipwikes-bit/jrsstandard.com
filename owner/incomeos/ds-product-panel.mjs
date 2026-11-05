// Read-only view inside the EXISTING IncomeOS Decision Spellchecker programme.
// This does not create another store, another dashboard or customer access.
import { inspectProduct } from './ds-runtime-bridge.mjs';

function add(parent, tag, value, className) {
  const el = document.createElement(tag);
  if (value !== undefined) el.textContent = String(value);
  if (className) el.className = className;
  parent.appendChild(el);
  return el;
}
function init() {
  const root = document.getElementById('ds-product-runtime');
  if (!root) return;
  let workspace = null;
  function render() {
    root.replaceChildren();
    add(root, 'h3', 'Decision Spellchecker development source');
    if (!workspace?.dsProgram) {
      add(root, 'p', 'Load an IncomeOS owner workspace to inspect its authoritative programme record. No reviewer is available without verified private access.', 'muted');
      return;
    }
    let view;
    try { view = inspectProduct(workspace.dsProgram); }
    catch (_) {
      add(root, 'p', 'Programme record cannot be verified. Product integration remains blocked.', 'muted');
      return;
    }
    const list = add(root, 'dl');
    for (const [label, value] of [
      ['Candidate source', view.candidate + ' ' + view.candidateVersion],
      ['Rules', view.rulesVersion],
      ['Cognitive controls', view.cognitiveVersion],
      ['Reflective guidance', view.reflectiveVersion],
      ['Original SP acceptance', view.originalAcceptance.accepted + ' of ' + view.originalAcceptance.total],
      ['Original source', view.originalSource],
      ['Open programme gates', view.openGates.join(', ') || 'None recorded open'],
      ['Recorded development requirements', view.programmeRequirementsRecorded],
      ['Programme evidence entries (not independently verified)', view.programmeEvidenceEntries],
      ['Recorded study runs, synthetic / independent', view.programmeStudyRuns.synthetic + ' / ' + view.programmeStudyRuns.independent],
      ['Open recorded defects', view.openDefects.length],
      ['Unresolved engineering tasks', view.unresolvedEngineeringTasks],
      ['Next recorded executable engineering task', view.nextExecutableEngineeringTask
        ? view.nextExecutableEngineeringTask.id + ': ' + view.nextExecutableEngineeringTask.title
        : 'None recorded as ready'],
      ['Live GitHub CI connection', view.githubCIStatus],
      ['Integration', view.integration],
      ['Customer access', view.customerAccess],
      ['Release', view.release],
    ]) {
      add(list, 'dt', label);
      add(list, 'dd', value);
    }
    // SP acceptance is projected from the SAME programme already validated
    // by inspectProduct. This is not another requirement register or a claim
    // that an original DS-A acceptance clause has been authenticated.
    const original = add(root, 'details');
    add(original, 'summary', 'Inspect original SP-01 through SP-18 acceptance statuses');
    add(original, 'p', 'Original DS-A requirement acceptance only. Synthetic DS-N1 tests do not satisfy original acceptance. Source text and evidence identifiers are withheld in this development-only view.', 'muted');
    const spList = add(original, 'ul');
    for (let n = 1; n <= 18; n++) {
      const id = 'SP-' + String(n).padStart(2, '0');
      const item = workspace.dsProgram.acceptance.find(entry => entry.id === id);
      const line = add(spList, 'li');
      line.style.overflowWrap = 'anywhere';
      add(line, 'strong', id + ': ' + item.status);
      const clause = typeof item.criterion === 'string' && item.criterion.trim()
        ? 'recorded, not authenticated by this view' : 'not recorded';
      const source = item.criterionSource === 'NOT IN REPOSITORY'
        ? 'not available in repository' : 'reference recorded, not authenticated by this view';
      add(line, 'p', 'Original clause: ' + clause + '; source: ' + source +
        '; linked evidence records: ' + item.evidenceIds.length, 'muted');
    }
    if (view.openDefects.length) {
      const section = add(root, 'section');
      add(section, 'h4', 'Open defects in the owner programme');
      const list = add(section, 'ul');
      for (const defect of view.openDefects.slice(0, 5)) {
        const item = add(list, 'li', defect.id + ': ' + defect.title + ' (' + defect.severity + ')');
        item.style.overflowWrap = 'anywhere';
      }
      if (view.openDefects.length > 5) add(section, 'p', (view.openDefects.length - 5) + ' additional defect records are in the programme.', 'muted');
    }
    add(root, 'p', 'Version identity is read from the imported DS-N1 source. Defects, tasks, evidence counts, study-run counts and gate status are read from the same IncomeOS programme record. A recorded study run is not a CI pass or independent acceptance. Live GitHub CI, browser validation and deployment status are not connected.', 'muted');
    const blocked = add(root, 'button', 'Synthetic reviewer unavailable until server-enforced owner access and isolated product delivery are verified.', 'smallbtn');
    blocked.type = 'button';
    blocked.disabled = true;
    blocked.setAttribute('aria-disabled', 'true');
  }
  for (const eventName of ['incomeos:workspace-loaded','incomeos:workspace-changed','incomeos:workspace-restored']) {
    document.addEventListener(eventName, ev => {
      if (ev.detail && typeof ev.detail === 'object') workspace = ev.detail;
      render();
    });
  }
  render();
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
