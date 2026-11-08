// Read-only view inside the EXISTING IncomeOS Decision Spellchecker programme.
// This does not create another store, another dashboard or customer access.
import { inspectOwnerProduct as inspectProduct } from './ds-owner-inspection.mjs';

function add(parent, tag, value, className) {
  const el = document.createElement(tag);
  if (value !== undefined) el.textContent = String(value);
  if (className) el.className = className;
  parent.appendChild(el);
  return el;
}
// This uses the authoritative owner workspace and DS programme. The
// experimental reviewer bridge never receives an owner ledger or its rows.
function ownerProductFinance(workspace, program) {
  if (!workspace || workspace.schema !== 'incomeos.workspace.v1' ||
      workspace.dsProgram !== program || !Array.isArray(workspace.ledger)) return null;
  const WS = window.IncomeOSWorkspace;
  const DS = window.IncomeOSDSProgram;
  if (!WS || !DS || typeof WS.validate !== 'function' || typeof DS.finance !== 'function') return null;
  WS.validate(workspace);
  const d = new Date();
  const today = [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0')].join('-');
  const projection = DS.finance(program, workspace, today);
  // The programme engine identifies malformed tagged records. A partial
  // financial total is not a safe summary of an invalid owner ledger.
  if (projection.issues.some(issue => issue.code === 'PROGRAM_LEDGER_ROW_INVALID' ||
      issue.code === 'AMOUNT_INVALID')) return null;
  return projection;
}
function renderProductFinance(root, workspace, program) {
  const finance = add(root, 'section');
  finance.setAttribute('aria-label', 'Decision Spellchecker product finance');
  add(finance, 'h4', 'Product revenue and costs');
  let report;
  try { report = ownerProductFinance(workspace, program); }
  catch (_) { report = null; }
  if (!report) {
    add(finance, 'p', 'Product accounting unavailable. A valid, complete owner workspace is required. No amount is inferred.', 'muted');
    return;
  }
  const actual = report.actual;
  const money = amount => '$' + Number(amount).toFixed(2);
  const rows = [
    ['Product-tagged ledger rows', actual.rows],
    ['Recorded operating costs (owner ledger)', money(actual.totalCostUsd)],
    ['Reported received revenue (owner-reconciled)', money(actual.revenueReceivedUsd)],
    ['Revenue recorded but not verified received', money(actual.revenueRecordedNotVerifiedUsd)],
    ['Unallocated refund credits (not netted)', money(actual.refundCreditsUnallocatedUsd)],
    ['Capital and transfers (not operating costs)',
      money(actual.capitalMovedNotCostUsd + actual.transfersNotCostUsd)],
    ['Scheduled, disputed or reversed costs (excluded)',
      money(actual.unpaidOrReversedCostsNotCountedUsd)],
    ['Tax or unclassified outflows (not operating costs)',
      money(actual.nonOperatingOutflowsNotCostUsd)],
    ['Product accounting exceptions', report.issues.length],
  ];
  const list = add(finance, 'dl');
  for (const [label, value] of rows) {
    add(list, 'dt', label);
    add(list, 'dd', value);
  }
  // Only aggregates are rendered; row-level owner financial information and
  // issue identifiers remain in the same existing owner workspace.
  add(finance, 'p', 'Amounts are derived only from this workspace ledger. Owner-entered classifications and reconciliations are not independent bank verification. Unpaid income, projections and unallocated credits are not counted as received revenue.', 'muted');
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
    // SP acceptance is projected from the SAME programme already validated
    // by inspectProduct. This is not another requirement register or a claim
    // that an original DS-A acceptance clause has been authenticated.
    const original = add(root, 'details');
    const originalSummary = add(original, 'summary', 'Inspect original SP-01 through SP-18 acceptance statuses');
    originalSummary.style.minHeight = '44px';
    originalSummary.style.padding = '10px 0';
    originalSummary.style.cursor = 'pointer';
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
    add(root, 'p', 'The experimental DS-N1 review engine is not packaged or executable in this Owner Desk preview. Version identifiers are withheld unless verified by the separate source-linked engineering harness. Defects, tasks, evidence counts, study-run counts and gate status are read from the same IncomeOS programme record. A recorded study run is not a CI pass or independent acceptance. Live GitHub CI, browser validation and deployment status are not connected.', 'muted');
    renderProductFinance(root, workspace, workspace.dsProgram);
    const blocked = add(root, 'button', 'Synthetic reviewer unavailable until server-enforced owner access and isolated product delivery are verified.', 'smallbtn');
    blocked.type = 'button';
    blocked.disabled = true;
    blocked.setAttribute('aria-disabled', 'true');
  }
  // Replacements, closures and malformed workspace events must revoke the
  // prior programme view. Never keep showing a previous owner's programme
  // because the next event has an absent or invalid payload.
  function verifiedWorkspace(candidate) {
    const WS = window.IncomeOSWorkspace;
    if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate) ||
        !WS || typeof WS.validate !== 'function') return null;
    try { WS.validate(candidate); return candidate; }
    catch (_) { return null; }
  }
  for (const eventName of ['incomeos:workspace-loaded','incomeos:workspace-changed','incomeos:workspace-restored']) {
    document.addEventListener(eventName, ev => {
      workspace = verifiedWorkspace(ev.detail);
      render();
    });
  }
  render();
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
