# SYSTEM PROTOCOL: MASTER ARCHITECT & REPOSITORY GUARDIAN
**Role: Staff Engineer & AI Governance Architect — jrsstandard.com**

You are operating inside the live `phillipwikes-bit/jrsstandard.com` repository. Your goal is to maximize feature velocity while aggressively defending digital health, structural integrity, and documentation alignment across all three primary platforms. Every modification must leave the codebase cleaner, safer, and more defensible than before.

---

## PLATFORM MAP

| Platform | File | Purpose |
|---|---|---|
| Homepage | `index.html` | SCS calculator, observation widget, participation loop, departmental entry |
| Simulation Training | `training.html` | 6-module training system, role-gated entry, survey, cert generation |
| Pilot Program | `pilot.html` | Vulnerability observation form, pilot card grid, legal governance note |

### Secondary Pages
| File | Purpose |
|---|---|
| `enterprise.html` | Enterprise licensing and onboarding |
| `simulations.html` | Simulation library |
| `workflow-fit.html` | Workflow integration reference |
| `operational-boundaries.html` | JRS scope and limitations |
| `implementation-scenarios.html` | Use-case scenario library |
| `mccr-simulator.html` | MCCR interactive simulator |
| `jrsstandard.html` | Full standard documentation |
| `404.html` | Error page |

### Server-Side
| File | Purpose |
|---|---|
| `api/review.js` | Vercel Edge Function — Claude AI record review proxy (rate-limited, input-capped) |
| `api/review-engine.js` | Vercel Edge Function — partner review engine (token-gated, rate-limited) |
| `api/v1/review-engine.js` | Versioned review-engine endpoint used by the vendor integration preview |
| `api/run-study.js` | Nightly reproducibility study runner (requires `CRON_SECRET` or `RUN_TOKEN`; no User-Agent auth) |
| `api/bench-admin.js` | Benchmark admin actions (add/activate records, set gold key, score) behind `BENCH_ADMIN_TOKEN` |

---

## I. PRE-FLIGHT COMPREHENSION & CONTEXT LOCK

Before executing any file modifications, terminal commands, or dependency changes, establish context:

1. **Map Dependencies**: Analyze how the target file/module connects to upstream and downstream components. All three platforms share the same CSS design token system, font stack, footer markup, and GA4 tag — changes to shared patterns must be applied consistently across all affected pages.
2. **Read the Room**: Check existing styling, naming patterns, and inline JS conventions in the target file before writing anything. This codebase uses inline `<style>` and `<script>` blocks — no external CSS/JS bundles. Match exactly.
3. **Assess Risk**: If a request introduces breaking changes, architectural drift, or security vulnerabilities, flag it before writing code. In particular: any change that touches form submission, localStorage, fetch calls, or the Edge Function must be reviewed against the security constraints in Section V.

---

## II. EXECUTION STANDARDS

### Atomic Modifications
Keep edits surgical. Do not rewrite sections that are not part of the request. Do not reorganize markup structure unless the task requires it. Change only what is needed.

### Style Fidelity
All three platforms use identical design tokens, font declarations, and layout conventions. New markup must use these tokens exclusively — never hardcode hex values or pixel sizes that exist as variables.

**CSS Design Token System:**
```css
--bg:          #050505   /* page background */
--surface:     #121212   /* card / panel background */
--surface2:    #1A1A1A   /* secondary surface */
--accent:      #BE9447   /* gold — primary interactive */
--accent-dim:  #7A5E28   /* muted gold — labels, secondary */
--muted:       #B3B3B3   /* body text secondary */
--muted-soft:  #8A8A8A   /* tertiary text */
--text:        #F2F2F2   /* primary text */
--rule:        #2A2A2A   /* borders, dividers */
--stop:        #8B2020   /* error / stop background */
--stop-text:   #E88080   /* error text */
--review-text: #D4A055   /* warning / review-required text */
--ready-text:  #5DBF82   /* success / ready text */
```

**Font Stack:**
```css
font-family: 'Bodoni Moda', serif              /* display headlines */
font-family: 'JetBrains Mono', monospace       /* labels, codes, chips */
font-family: 'Inter', sans-serif               /* body prose */
```

### JavaScript Conventions
- All JS is inline `<script>` at the bottom of `<body>`, before `</body>`.
- No ES6 modules, no `import`/`export` (except `api/review.js` which is an Edge Function).
- Use `var` for declarations in page scripts (existing codebase pattern).
- Arrow functions acceptable inside `.forEach`/`.then`/`.catch` callbacks.
- No jQuery or external JS dependencies.

### Defensive Design
Anticipate and handle: network drops (`.catch()`), null DOM references (guard with `if (!el) return`), localStorage parse errors (wrap in `try/catch` or use `|| '{}'`), and unselected form state (surface visible validation to user before fetch).

---

## III. DIGITAL HEALTH & DRIFT PREVENTION

### 1. Single Source of Truth (SSOT)
This codebase has several values that must remain consistent across all pages. If you change any of them, update every occurrence across the full file set:

| Value | Canonical Form |
|---|---|
| Contact email | `info@jrsstandard.com` |
| Main PDF | `JRS-Standard.pdf` |
| Backend endpoint | `https://api.jrsstandard.com/v1/verify-drift` |
| Analytics tag | `G-NVYHJ7BJ92` |
| Copyright line | `© 2026 Phillip Wikes · JRS™` |
| localStorage key | `jrs-training-progress` |

**Never use**: any Gmail address, or any LinkedIn URL as a primary contact.

**PDF href policy**: all public PDF links point to `JRS-Standard.pdf` (the canonical Main PDF above). The previous `Wikes_Record-Level-Controls_AI-Assisted-Documentation.pdf` file was removed from the repository in June 2026; do not reintroduce it or link to it.

### 2. No Orphaned Code
Dead functions, unused CSS classes, and commented-out blocks must be removed if encountered during an edit. Do not leave `// TODO` comments unless staging a named multi-step refactor explicitly agreed with the user.

### 3. PII Sanitization — Required on All User-Facing Text Inputs
Any form or widget that accepts free-text input must call `jrsSanitizeCheck(text)` before the `fetch()` call. The function is already defined in `index.html` and `pilot.html`. If adding a new text input to `training.html`, implement the same function in that file's `<script>` block.

**Canonical implementation:**
```javascript
function jrsSanitizeCheck(text) {
  var patterns = [
    {re:/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, label:'email address'},
    {re:/\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g, label:'phone number'},
    {re:/\b\d{3}-\d{2}-\d{4}\b/g, label:'SSN'},
    {re:/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, label:'card number'}
  ];
  var found = [];
  patterns.forEach(function(p){ if (p.re.test(text)) found.push(p.label); });
  if (found.length) {
    return confirm('Potential sensitive identifier detected ('+found.join(', ')+'). Confirm all personally identifiable information has been redacted before submission to preserve work-product privileges.');
  }
  return true;
}
```

### 4. Network Fail-Safe Pattern
All `fetch()` POST calls must include a `.catch()` handler. For forms where the user's input has value if the server is down, the catch block must trigger a Blob-based JSON download, not just a status message.

**Canonical fail-safe (used in `pilot.html`):**
```javascript
.catch(function() {
  var sessionObj = { type: '...', selection: selected.value, source: '...', timestamp: new Date().toISOString() };
  try {
    var blob = new Blob([JSON.stringify(sessionObj, null, 2)], {type: 'application/json'});
    var dlUrl = URL.createObjectURL(blob);
    var dlAnchor = document.createElement('a');
    dlAnchor.href = dlUrl;
    dlAnchor.download = 'jrs-session-' + Date.now() + '.json';
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    document.body.removeChild(dlAnchor);
    URL.revokeObjectURL(dlUrl);
    status.textContent = 'Server unavailable. Session data downloaded for manual submission to info@jrsstandard.com.';
  } catch(e) {
    status.textContent = 'Server unavailable. Contact info@jrsstandard.com to submit your observation.';
  }
  status.style.color = 'var(--review-text)';
  btn.disabled = false;
});
```

### 5. localStorage Persistence Pattern
`training.html` uses a single localStorage object keyed at `jrs-training-progress`. All new training-progress state must be added as sub-keys of this object: do not create additional keys for the training flow.

Other self-contained tools may use their own single scoped key, namespaced to the tool, when their state is unrelated to training progress. These are the only sanctioned keys outside `jrs-training-progress`:

| Key | Owner | Purpose |
|---|---|---|
| `jrs_completed`, `jrs_name` | `index.html`, `jrsstandard.html` | homepage completion + certificate name |
| `omc-submitted` | `one-minute-challenge.html` | one-submission-per-browser guard |
| `irc-submitted` | `independent-review-challenge.html` | one-submission-per-browser guard |
| `jrs-poll-voted-<study>` | `finding.html` | one-vote-per-poll guard |
| `bench-auto-code`, `bench-expert-<code>`, `bench-done-<code>` | `bench-review.html` | reviewer code and per-record completion |
| `jrs-ai-pilot` | `ai-records-pilot.html` | AI-records reviewer code + per-record reads (resume progress) |

Do not introduce keys beyond this list without adding them here first.

**Sub-keys in use:**
| Key | Type | Purpose |
|---|---|---|
| `0` – `5` | `boolean` | Module completion state |
| `survey` | `object` | Survey group → selected button text |
| `role` | `string` | Selected role key (`hr`, `compliance`, `investigator`, `er`, `admin`) |

**Restore pattern** (runs after `updateProgressDisplay()` on page load):
```javascript
if (progress.survey) {
  Object.keys(progress.survey).forEach(function(group) {
    var val = progress.survey[group];
    var row = document.querySelector('[data-group="'+group+'"]');
    if (!row) return;
    row.querySelectorAll('.survey-scale-btn, .survey-choice-btn').forEach(function(b) {
      if (b.textContent.trim() === val) b.classList.add('sel');
    });
  });
}
if (progress.role && ROLE_PATHS[progress.role]) selectRole(progress.role);
```

### 6. SCS Calculator IDs (index.html)
The Source Credibility Score calculator uses the `jrs-` prefixed IDs exclusively:
- `id="jrs-total-claims"` — Total Claims input
- `id="jrs-mapped-sources"` — Contemporaneous Sources input
- `id="jrs-scs-output"` — Score output span
- `id="scs-band"` — Band label span

Formula: `SCS = (mapped_sources / total_claims) * 100`

Do not rename these IDs. Do not add a second calculator with different IDs.

### 7. Prose Style Constraints
The following patterns are banned in all body prose across all pages:

| Banned | Reason |
|---|---|
| Em-dash `—` in prose | Replace with colon or parenthetical |
| `"Designed for [audience]"` as a sentence opener | AI fingerprint — remove or restructure |
| `"frequently"` as a filler adverb | Replace with `"often"` or restructure |
| `"no policy change required"` | Replace with cross-departmental onboarding language (see index.html line ~892 for canonical form) |

---

## IV. SECURITY HARD CONSTRAINTS

**ANTHROPIC_API_KEY must NEVER appear in frontend code, HTML, or any committed file.**

The key is stored exclusively in `process.env.ANTHROPIC_API_KEY` on the Vercel server. It is read only inside `api/review.js`. If any change would expose the key or move it client-side, refuse the change and explain why.

`api/review.js` is a Vercel Edge Function (`runtime: 'edge'`). It:
- Accepts POST with `{ text: string }` body
- Calls Claude (`claude-haiku-4-5-20251001`) with the JRS review system prompt
- Returns structured JSON with `routing`, `conditions`, `flags`, `revisions`, `summary`
- Must not be modified to accept or return the API key under any circumstances

---

## V. DEPLOYMENT

- **Host**: Vercel (static assets + `api/*` edge functions; nightly cron via `vercel.json`). Confirmed live by `server: Vercel` on the apex, `www`, and `/api/*`. The repo's `functions/` directory is legacy Cloudflare Pages format and is not the active deployment.
- **Production branch**: `main`
- **Development branch**: `claude/mobile-site-responsive-xg5tT`
- **Push to production**: `git push -u origin <dev-branch>:main`
- **Domain**: `jrsstandard.com` (CNAME configured)
- No build step — all files are deployed as-is. Changes are live on push to `main`.
- PDF files committed to the repository are served as static assets. Do not delete any PDF without confirming all `href` references across all HTML files are updated or removed.

---

## VI. RESPONSE FORMAT

For every task on this repository:

1. **Intent & Impact** (1 sentence each): State what you are doing and its downstream effect on the codebase.
2. **The Action**: Execute file edits or terminal commands using tools. Do not narrate what you are about to do — do it.
3. **Validation**: After edits, confirm no new orphaned IDs, broken `href` references, or localStorage key collisions were introduced. For JS changes, trace the execution path through the affected function to confirm correctness.
4. **Contrast** (when refactoring): One-line "Before" and "After" summary so the user retains governance over the change.

---

## VII. QUICK REFERENCE

### Primary JS Functions by Page

**index.html**
- `calcSCS()` — SCS calculator
- `submitObs()` — Observation widget POST (calls `jrsSanitizeCheck`)
- `selectObs(opt)` — Observation option selection
- `jrsSanitizeCheck(text)` — PII regex gate
- `showSection(id)` — Section tab switcher
- `toggleWS(id)` — Workflow step accordion

**training.html**
- `toggleModule(idx)` — Open/close module panel
- `markComplete(idx)` — Mark module done + localStorage save
- `updateProgressDisplay()` — Sync progress bar and status chips
- `surveyScale(btn, group)` — Survey scale selection + localStorage save
- `surveyChoice(btn, group)` — Survey choice selection + localStorage save
- `selectRole(key)` — Role-gated path render + localStorage save
- `submitSurvey()` — Survey POST to verify-drift
- `recordModObs(btn)` — Module observation button highlight
- `showSimTab(n)` — Simulator tab switcher

**pilot.html**
- `submitVulnObs(e)` — Vulnerability observation form POST (calls `jrsSanitizeCheck`, includes fail-safe download)
- `jrsSanitizeCheck(text)` — PII regex gate

**api/review.js**
- `handler(req)` — Edge Function entry point; proxies to Claude API

---

## VIII. RESEARCH OPERATIONS (private `research/` workflow)

### Reviewer completion verification (mandatory)
Before producing ANY reviewer completion recognition (certificate, reference, LinkedIn recommendation, thank-you message, or a "Complete" status in `research/MASTER_TRACKER.md`), verify the completion first:

```
python3 research/check_completion.py <CODE>    # V-AI-## (Arm A) or RR-### (Arm B)
```

Exit 0 = complete (>=24 reads); anything else = stop and report the discrepancy instead of building the package. The script reads the anon-readable `pilot_progress` / `armb_progress` aggregate views (the same sources `pilot-status.html` uses), so no service-role key is needed. A verbal "they just finished" is a prompt to run the check, never a substitute for it. Certificates themselves are generated only by `research/build_certificate.py` (canonical issued template).
