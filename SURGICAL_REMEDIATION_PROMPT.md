# SURGICAL REMEDIATION PROMPT: P1 to P6

**Derived from `AUDIT_REPORT.md`, 2026-08-14.** Note: the audit file on disk is `AUDIT_REPORT.md`, not `JRS_END_TO_END_AUDIT_REPORT.md`.

**STATUS AT ISSUE: P5 and P6 are already CLOSED.** They were executed while this prompt was being written, because neither needed owner input. Their sections below record what was done and how to verify it, not what to do.

**Standing constraint on every item below:** the repository holds **72 assertions across six suites and a 12-check zero-drift guard, all passing**. No step here may reduce that number. Run `python3 scripts/check_zero_drift.py` and all six suites before and after any change.

---

## P1: Payment gateways. THREE URLs. Blocks all revenue.

**Nothing else in the payment path is missing.** `/api/checkout` is live, tested at 15 assertions, and fails safe today.

### Exact steps

1. In Stripe or Lemon Squeezy, create **three payment links**, one per offer:

   | Offer key | Amount | Product name |
   |---|---|---|
   | `audit` | **$250** | AI Documentation Defensibility Review |
   | `governance` | **$500** | AI Governance Documentation Review |
   | `calibration` | **$750** | Benchmark Access and Calibration |

2. Open **`api/_offer-config.js`**. Each offer has a `checkout_url: ''`. Paste the matching URL between the quotes. **Nothing else in that file changes.** Prices are already correct and are the single source of truth for every surface.

3. Deploy. `/api/checkout?o=<key>` begins issuing a 302 to the payment provider the moment a valid `https://` URL is present. No code change is required to switch it on.

### Do not

- **Do not invent, guess, or placeholder a URL.** `isConfigured()` requires `^https://\S+$`; a plausible-looking string would pass that test and send a paying customer to a fabricated destination.
- Do not hardcode a price anywhere else. The drift guard fails the commit if you do.

### Verify

```
curl -sL -o /dev/null -w "%{http_code} %{redirect_url}\n" "https://www.jrsstandard.com/api/checkout?o=audit&src=verify"
node scripts/test_checkout.mjs        # expect 15 of 15
```
Expect **302** to the provider. Before configuration it is **200** with the scoping page, which is correct, not a failure.

---

## P2: Legal. Two fields in one clause.

### Exact steps

1. Open **`terms.html`**, clause **1. Who you are contracting with**. Find:

   ```html
   <b>Registered trading address and governing jurisdiction:</b>
   <span class="todo">to be completed before the first engagement is signed.</span>
   ```

2. Replace that `<span class="todo">...</span>` with the real values, in this form:

   ```html
   <b>Registered trading address:</b> [street, city, state or region, postal code, country].
   <b>Governing law:</b> the laws of [jurisdiction], and the courts of [jurisdiction] have
   exclusive jurisdiction over any dispute arising under these terms.
   ```

3. Delete the `.todo` CSS rule and the trailing `status-strip` note that begins **"One item is deliberately incomplete"**, since it will no longer be true.

### Do not

- **Do not infer the jurisdiction from employment history.** A former post at the Maryland Commission on Civil Rights is not evidence of where the practice is registered, and a wrong governing-law clause is worse than an open one.
- Do not add an entity type (LLC, Ltd, Inc.) unless one has actually been formed.

### Verify

```
grep -c "class=\"todo\"" terms.html          # expect 0
grep -c "deliberately incomplete" terms.html   # expect 0
curl -sL https://www.jrsstandard.com/terms.html | grep -c "Governing law"   # expect 1
```

---

## P3: Outreach. 36 messages whose deadline has passed.

**Current state:** 36 files in `research/Evaluator_Outreach/`, all carrying **"Friday, 14 August 2026"**, all unsent. That date is now in the past.

### The decision that comes first

**Sending a message today whose deadline was yesterday is worse than sending nothing.** Choose one:

**Option A, extend.** Set a new date and regenerate. The deadline lives in exactly one place:

1. Edit `FALLBACK_DATE` in **`api/contributor.js`** to the new date, in the form `'Friday, 21 August 2026'`.
2. Run:
   ```
   python3 research/build_evaluator_outreach.py
   python3 research/build_contributor_links.py
   python3 scripts/test_evaluator_outreach.py
   ```
3. **`scripts/test_evaluator_outreach.py` asserts the literal string "Friday, 14 August 2026" in every file.** Update that constant in the test to match, or all 36 assertions fail. This is deliberate: it forces the date change to be conscious.
4. Deploy `api/contributor.js`. The confirmation page reads the date from the endpoint, so the page and the messages cannot disagree.

**Option B, drop the deadline.** Rewrite the fallback paragraph in `research/build_evaluator_outreach.py` to state the fallback without a date: the paper uses what is on file, and anonymity is the fallback where no naming election exists. Regenerate as above.

### Do not

- Do not edit the 36 files by hand. They are generated; a hand edit is caught by the drift guard and lost on the next build.
- Do not remove the anonymity handling. **`RR-130` and `RR-132` completed anonymously**, their files carry a placeholder rather than a name, and three assertions guard that. A citation naming someone who chose not to be named is the one unrecoverable error in this batch.

### Verify

```
python3 scripts/test_evaluator_outreach.py      # expect 18 of 18
grep -l "<new date>" research/Evaluator_Outreach/*.md | wc -l    # expect 36
```

---

## P4: Benchmark environment. Two variables.

**`/api/bench-score` is built and tested at 15 assertions.** It returns aggregate calibration only and never the key, per-record results, or the condition logic.

### Exact steps

1. In the Vercel project environment, set:

   | Variable | Value |
   |---|---|
   | `BENCH_KEY_JSON` | The held-out key as JSON: `{"<record_id>": "<determination>", ...}` |
   | `BENCH_SCORE_TOKENS` | Comma-separated licence tokens, one per licensee |

2. Redeploy so the edge function picks them up.

### Do not

- **Do not commit the key to the repository.** It lives in `research/`, which is excluded from the deploy, and that exclusion is the reason Offer 3 is licensable more than once.
- **Do not point the endpoint at `bench_gold` or `bench_outcomes`.** `bench_gold` holds three synthetic placeholder rows; `bench_outcomes` is the Rung 3 real-case outcome table. Both are anon-readable. The endpoint deliberately refuses rather than scoring a paying licensee against either.

### Verify

```
curl -sL -X POST https://www.jrsstandard.com/api/bench-score \
  -H 'Content-Type: application/json' -H 'Authorization: Bearer <token>' \
  -d '{"submissions":[{"record_id":"<id>","determination":"ready"}]}'
node scripts/test_bench_score.mjs     # expect 15 of 15
```
Expect a `calibration` object. **Confirm the response contains no `record_id` and no per-record verdict.** Three assertions already check this; verify it once against the real key as well.

---

## P5: Reference hub. CLOSED 2026-08-14.

**The audit's remedy was wrong and is corrected here.** It said to build a `/reference/` hub. **One already existed** at `reference/index.html`, linking all sixteen pages. The audit's check used a relative-path regex that missed absolute `href="/reference/<slug>"` links and reported 0 of 16.

**The real gap** was that only `index.html` linked the hub, so it pooled no equity. **Fixed: the hub is now linked from 38 page footers** as "Reference Library".

### Verify

```
grep -rl 'href="/reference"' --include=*.html . | grep -v node_modules | wc -l   # expect 38
```

**Nothing further is required.** If you want the sixteen pages to rank, the next lever is inbound links from the LinkedIn sequence, not internal architecture.

---

## P6: jrsstandard.html. CLOSED 2026-08-14, root cause found.

**The audit reported this defect as confirmed but not diagnosed. It is now diagnosed and fixed.**

**Root cause.** The page carried an entire training and certificate subsystem in JavaScript whose markup lives on `training.html` and was never present here. **Twenty element IDs referenced by `getElementById` did not exist**: `module-nav`, `course-panel`, `quiz-section`, `cert-canvas`, `progress-fill` and fifteen more. `updateProgress()` ran on load against that empty DOM, which threw `Cannot read properties of null (reading 'style')` on every visit.

**Fix.** Twelve functions and the `jrs_completed` localStorage state they alone used were removed, **8,481 bytes**, after confirming no call site existed outside the block.

**The 2-div imbalance was a separate defect.** `section-library` and its `.container` never closed, so every later `page-section` nested one level deeper than intended. Two closing tags added.

### Verify

```
python3 -c "import io,re;s=io.open('jrsstandard.html',encoding='utf-8').read();\
ids=set(re.findall(r'id=\"([^\"]+)\"',s));refs=set(re.findall(r\"getElementById\('([^']+)'\)\",s));\
print('missing:',sorted(refs-ids));print('divs',s.count('<div'),'/',s.count('</div>'))"
```
Expect **`missing: []`** and **3106 / 3106**. Headless load: **zero page errors**.

---

## Execution order

| Order | Item | Why |
|---|---|---|
| 1 | **P3** | The deadline has already passed. Every day it stays passed makes the message worse |
| 2 | **P1** | Three URLs. Nothing else stands between the offers and revenue |
| 3 | **P2** | Needed before a first engagement is signed, not before it is quoted |
| 4 | **P4** | Only blocks Offer 3, which has no licensee yet |
| 5 | P5, P6 | **Already done** |

## Regression gate for every step

```
python3 scripts/check_zero_drift.py          # 12 checks, 0 failed
node scripts/test_checkout.mjs               # 15
node scripts/test_bench_score.mjs            # 15
node scripts/test_anon_election.mjs          # 7
python3 scripts/test_evaluator_outreach.py   # 18
python3 scripts/test_scout_opportunities.py  # 17
```

**72 assertions. If any step reduces that number, the step is wrong, not the test.**
