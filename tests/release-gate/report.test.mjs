// Release-gate report: deterministic, current, and never without its limitations.
import { readFileSync } from 'node:fs';
import { t, done, V, renderReport, reportProblems, currentRecord, passingFixture, clone, REPORT_PATH } from './_helpers.mjs';

const cur = currentRecord();
const md = renderReport(cur);
const committed = readFileSync(REPORT_PATH, 'utf8');
t('the committed CURRENT_RELEASE_GATE_REPORT.md is exactly what the current record generates', committed === md);
t('rendering is deterministic', renderReport(clone(cur)) === md);
t('the current report passes its own completeness check', reportProblems(md, cur).length === 0, reportProblems(md, cur).join('; '));
t('the current report concludes INCOMPLETE_GATES_OPEN and says no gate has passed', md.includes('**INCOMPLETE_GATES_OPEN.**') && md.includes('No release gate has passed') && !md.includes('ALL_GATES_RECORDED_PASS'));
t('the current report says the candidate is a controlled development candidate, not defective', /controlled development candidate; an open gate records absent evidence, not a defect/.test(md));
t('the current report states that no authorization is created', md.includes('production **no**, licensing **no**, sale **no**, evaluation **no**, real-record use **no**'));
t('the current report carries the not-a-clearance statement', md.includes(V.NOT_A_CLEARANCE));
t('the current report lists every gate with its status', V.GATES.every((g) => md.includes('| ' + g.id + ' | ') && md.includes('## ' + g.id + '. ')));
t('the current report uses no em dash', !md.includes('\u2014'));
t('the current report uses no readiness word as a status', !/\*\*(READY|VALIDATED|APPROVED|PRODUCTION|LICENSED|SALE[-_ ]READY)\*\*/i.test(md));

// A report that omits its limitations is refused.
const lim = cur.package_limitations[0];
t('refuses: a report with a package limitation removed', reportProblems(md.replace(lim, ''), cur).some((p) => /omits package limitation/.test(p)));
t('refuses: a report with the Limitations section removed', reportProblems(md.replace(/## Limitations[\s\S]*$/, ''), cur).some((p) => /no Limitations section/.test(p)));
t('refuses: a report with a gate limitation removed', reportProblems(md.replace(cur.gates[2].limitation_statement, ''), cur).some((p) => /omits the RG-3 limitation/.test(p)));
t('refuses: a report without the not-a-clearance statement', reportProblems(md.replace(V.NOT_A_CLEARANCE, ''), cur).some((p) => /not-a-clearance/.test(p)));
t('refuses: a report that claims every gate passed', reportProblems(md.replace('**INCOMPLETE_GATES_OPEN.**', '**ALL_GATES_RECORDED_PASS.**'), cur).length > 0);

// An invalid record cannot be rendered at all.
const broken = clone(cur); broken.gates[0].status = 'READY';
let threw = false; try { renderReport(broken); } catch (e) { threw = /refusing to render an invalid record/.test(e.message); }
t('refuses to render an invalid record', threw);

// The synthetic all-pass fixture still carries limitations and is still not an authorization.
const fx = passingFixture();
const fmd = renderReport(fx);
t('an all-pass report still carries limitations and the not-a-clearance statement', reportProblems(fmd, fx).length === 0 && fmd.includes(V.NOT_A_CLEARANCE) && fmd.includes('This report is still not an authorization'));

const part = clone(fx); { const g = part.gates.find((x) => x.gate_id === 'RG-5'); g.status = 'PENDING'; g.missing_dependencies = ['QA not yet performed']; }
const pmd = renderReport(part);
t('a partly passed record reports how many gates passed and stays INCOMPLETE', pmd.includes('**INCOMPLETE_GATES_OPEN.**') && pmd.includes('4 of 5 gates record PASS (RG-1, RG-2, RG-3, RG-4); the others remain open.'));

done();
