// Study completion: imported FIRST by every offline tool. It blocks every network API before any other module body runs
// and stops the process if a provider address or credential variable is present by name (values are never read).
import { attempts, installNetGuard } from '../../validation-readiness-gate-v0-2026-10-25/tools/harness/net-guard.mjs';
import { checkNetworkMarkers } from '../../validation-readiness-gate-v0-2026-10-25/tools/controls.mjs';
installNetGuard();
const problems = checkNetworkMarkers(process.env, {});
if (problems.length) { console.error('stopped before execution: ' + problems.join('; ') + ' (unset ANTHROPIC_BASE_URL; offline tools never run with provider variables present)'); process.exit(3); }
export { attempts };
