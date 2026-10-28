# Execution checkpoint: what is needed before the live run

**Owner: Phillip Wikes. Prepared 2026-10-28. Nothing here is approved.** The offline preparation is complete and verified (`reports/VERIFICATION_SUMMARY.md`). The live model run has not started: it waits only on the owner inputs below. No credential was requested or read, no request was sent, and live dispatch is disabled in this build. The spent Stage A authorization and the earlier unsigned drafts cannot authorize anything; the verifier refuses them.

## 1. The proposed run

| Item | Proposal |
|---|---|
| Model | `claude-haiku-5-5`, API version `2026-10-21`, checked against the official documentation on 2026-10-28 |
| Candidate | `0.3.4-research-candidate`, frozen, not adopted (0.3.1 remains the engine of record) |
| Prompt | `PROMPT_research-0.3.4-1.txt` (`jrs-engine-local-0.3.4-research/prompt-1`) |
| Records | the 104 eligible study records; the 20 out-of-scope originals and the 32 public cases are not used |
| Phases | PRE 3 requests (compatibility check); RUN 312 (104 records, three repeats); TGT 86 (the two known weaknesses) |
| Request | `max_tokens` 4,096, thinking disabled, effort medium, no sampling parameters, not streamed |
| Retries and limits | at most 2 retries per request, only for 429, 500, 529, network errors and timeouts; 120-second timeout; one request at a time |
| Identities | plan, request set, prompt, candidate and code hashes: `protocol/LIVE_RUN_PLAN.md` |

Plan hash: `f5dd8e92006c8af9539cc42e7b21747cda3cebe57740bbc35a63083a62dcbc03`

**Cost (estimates from the frozen request bodies and the official prices).** Typical: about $0.0014 for PRE and about $0.18 for all 401 requests. Worst-case bound if every attempt were billed at the output cap: about $2.93. **Proposed hard spend caps:** $0.05 for PRE alone, or $1.00 for PRE, RUN and TGT together. The sender refuses any attempt that could pass the cap.

**Two ways to authorize (choose one):**

| Option | Phases | Request cap | Attempt cap | Spend cap | What happens |
|---|---|---|---|---|---|
| A (recommended first step) | PRE | 3 | 9 | $0.05 | Three requests; then stop and report. RUN and TGT need a second authorization |
| B | PRE, RUN, TGT | 401 | 450 | $1.00 | RUN and TGT start only if the PRE gate passes; otherwise the run stops after PRE |

## 2. Owner inputs needed (all required; none can be supplied by Claude)

1. **Model.** Confirm `claude-haiku-5-5`, or choose another (Opus 5.5 needs a documented amendment: it refuses the frozen request because its thinking cannot be disabled, and it costs about 40 times as much).
2. **Scope and numbers.** Option A or B, with its request cap, attempt cap and spend cap as numbers.
3. **Retention.** (a) Provider side: confirm which arrangement applies to the account that will run the study. By Anthropic's commercial policy inputs and outputs are deleted within 30 days by default, flagged content can be kept up to 2 years, and a zero-data-retention agreement overrides both. Which applies to this account is NOT ESTABLISHED. (b) Our side: name the private directory for the captures and journal, outside the repository (the session scratch is outside the repository but is deleted with the container), and the deletion rule.
4. **Credential.** Add the API key as an environment secret of this cloud environment: open the cloud environment menu in the session's title bar, then Edit, and add it under Network secrets (labelled API credentials in older apps) if that section is offered, otherwise as an environment variable, with the name **`JRS_STUDY_ANTHROPIC_KEY`**. A new session picks it up. Do not paste the key into any conversation; a key pasted into a chat must be treated as exposed and rotated.
5. **Network access.** Confirm that this environment's network policy allows `api.anthropic.com`. If the first request is denied, Network access is changed in the same environment settings (a broader level, or `api.anthropic.com` under Allowed domains). This could not be checked without contacting the provider.
6. **Signature.** Complete `authorization/LIVE_AUTHORIZATION_DRAFT.json` (new identifier; phases and caps; expiry; retention location; provider retention confirmed; stop rules approved; your name as signature; date) and save the signed file outside the repository next to the run directory.
7. **Acceptance criteria.** Approve or amend LC-01 to LC-10 (`protocol/LIVE_STUDY_PROTOCOL.md`, section 10) before any result exists. Thresholds are not changed after results are seen.

## 3. Judgment calls (recommendation first)

| No. | Question | Recommendation |
|---|---|---|
| J1 | Model | Haiku 5.5: the study's recorded choice, valid for the frozen request, lowest cost |
| J2 | Thinking | Disabled, as the study plan and the tested sender. Adaptive thinking might improve contract adherence but adds cost and variation; choosing it is an amendment |
| J3 | One authorization or two | Two: Option A first, then decide on RUN and TGT with the PRE results in hand |
| J4 | Repeats | Three: the minimum that shows run-to-run variation |
| J5 | Targeted phase | Include: it is the only way to learn whether a real model exploits the two known weaknesses |
| J6 | Human labels | When Phillip's labels exist, report them beside the AI labels for the 44 Part 1 records; never replace one with the other |
| J7 | Commit of this work | It is committed locally only. Pushing it (for example to the PR #42 branch) is a separate decision; until then it exists only in this container |

## 4. Human review (independent of the live run)

Four batches of 11 records (the 44 Part 1 records) are ready as fillable forms. They show no Engine output, AI label or score. Each answer is saved with the form's download button and imported with `tools/human-review/import-labels.mjs`, which keeps your labels beside the AI-proposed ones, marks disagreements as disputed, and records every correction. Nothing has been filled in for you. Until labels are recorded, no human-agreement result is reported.

## 5. Technical blockers

| Blocker | Status |
|---|---|
| Live dispatch disabled in this build | By design. Enabling is one recorded line after a signed authorization (`LIVE_STUDY_PROTOCOL.md`, section 13); rehearsed offline |
| API key not configured | Owner input 4 |
| Reachability of `api.anthropic.com` from this environment | NOT ESTABLISHED; owner input 5 |
| Account access to `claude-haiku-5-5` | NOT ESTABLISHED until the first PRE request |
| B-018 (source-aligned files absent) | OPEN; not a prerequisite of this study, and not cleared by it |

Separate release dependencies, not prerequisites of this study: production operator controls, counsel review and independent production QA. Release status remains `NO_GO_NOT_VERIFIED`.
