# JRS protected preview release gate

Status: **not configured or approved for hosted CI**. This runbook documents the
owner-controlled steps after the source-only Safari repairs in draft PR #204.
It does not authorize deployment, bypass the visual gate, or establish iPhone
Safari or PDF accessibility acceptance.

## Scope

- GitHub repository: `phillipwikes-bit/jrsstandard.com`
- Vercel project: `jrsstandard-com` (the existing project only)
- Workflow: `.github/workflows/jrs-visual-snapshot.yml`
- Local job: `local-visual`, with **no** preview bypass credential
- Hosted job: `protected-preview`, using the GitHub environment
  `jrs-protected-preview` and the exact PR SHA
- Original release gate: `visual-snapshots`, which fails unless **both** jobs
  succeeded, including when hosted verification is skipped or denied
- Release: production remains unchanged until the hosted check and separate
  iPhone/PDF review are explicitly accepted

## Owner configuration, in this order

1. In GitHub repository **Settings > Environments**, open
   `jrs-protected-preview`. The workflow may have auto-created the environment
   **without** security rules. Do not add a secret yet.
2. Enable **Required reviewers** and select an actual authorized reviewer.
   If the workflow author is the only eligible reviewer, do not enable
   **Prevent self-review** unless an independent reviewer has been designated.
   Prefer disallowing bypass of deployment protection rules.
3. Set **Deployment branches > Selected branches and tags**. Restrict the
   environment to the exact PR merge ref for this release,
   `refs/pull/204/merge`. Confirm the actual ref in GitHub's run metadata.
   Never allow unrestricted branches merely to make the check green.
   For later PRs, review and update this rule deliberately.
4. In the existing Vercel project's **Settings > Deployment Protection**,
   create one dedicated **Protection Bypass for Automation** credential for
   JRS hosted-source/PDF and screenshot verification. This credential can
   access all deployments in the project until revoked. Do not alter
   Vercel Authentication or mark preview deployments public.
5. Add the generated credential only as the **environment secret**
   `JRS_VERCEL_PREVIEW_BYPASS` in `jrs-protected-preview`. Do not use a
   repository-level or organization-level secret; do not place its value
   in workflow inputs, GitHub issues, chat, screenshots, or log output.
6. Review the **exact current head SHA** of PR #204, the trusted workflow
   code, and the preview deployment SHA. Approve that environment job only
   for that reviewed commit. A changed commit requires new review.
7. Rerun the workflow on the exact reviewed PR head. The hosted job must
   verify local-versus-hosted source bytes and nine PDF download identities,
   then capture the authenticated hosted screenshots. Check that the Vercel
   URL is an immutable JRS deployment and that the failure gate is truly
   green, not skipped or substituted by local screenshots.

## Guardrails and remaining tests

- The separate institutional CI workflow runs
  `tests/jrs-preview-environment-boundary.test.mjs` to guard the source
  boundary. It **cannot** inspect or certify actual environment reviewer
  settings or where GitHub secrets were configured.
- An absent bypass secret must make the hosted job **fail closed**.
- Never add `id-token: write` to ordinary PR jobs merely to bypass protection.
  The unmerged identity alternative remains subject to separate review.
- Hosted screenshots do **not** substitute for physical iPhone Safari and
  Home Screen verification. A PDF byte-integrity test is **not** a tagged-PDF
  or assistive-technology accessibility audit.
- A successful hosted check is not an instruction to merge PR #204.
  Production changes require an explicit subsequent release decision.

Official guidance:
- https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments
- https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments
- https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/protection-bypass-automation
