# IncomeOS hosted release record, 2026-11-04

Status: PROTECTED PREVIEW VERIFIED for hosting and access denial. Owner acceptance (A01) and owner publication approval (A16) are pending; hosted secure storage (A14) is blocked. The accounting editor is not declared complete.

## What is deployed

| Item | Value | Evidence |
| --- | --- | --- |
| Vercel project | `incomeos-opportunity-desk` (`prj_eIGgDvJb3LkYmk0NGjoo7bWFEi3n`), separate from the public `jrsstandard-com` project | Owner settings screenshots, 2026-11-04 |
| Source | Repository `phillipwikes-bit/jrsstandard.com`, branch `feature/incomeos-owner-prototype-2026-11-01`, Root Directory `owner/incomeos` | Owner settings screenshots; Vercel GitHub comment lists root directory `owner/incomeos` |
| Address | `https://incomeos-opportunity-desk.vercel.app` | Vercel GitHub comment |
| Exact deployed commit | `79e1e241a0e10e6a184458c758cf99d98e96f2ef`, Vercel deployment `9ySYE6EBXFWV3jSouP9YcMJWkWUV`, state success | GitHub commit status "Vercel – incomeos-opportunity-desk", 2026-11-04T21:36:18Z |
| Public site isolation | `jrsstandard-com` reported the same commits as "Ignored"; it was not deployed | Vercel GitHub comment |
| Access control | Vercel Authentication, Require Log In, All Deployments; no password, bypass secret, trusted IP or protection exception | Owner settings screenshot |
| Anonymous denial | `/`, `/index.html`, `/accountant.js`, `/manifest.webmanifest` each returned HTTP 302 to `vercel.com/sso-api`, no app content | GitHub Actions run 41917521403, `.github/workflows/incomeos-anonymous-access-probe.yml` |
| Owner access | Owner reached the app on a physical iPhone in Safari while signed in to Vercel | Owner screenshots, 2026-11-04 |

## Rollback readiness

Earlier READY production deployments of the same project remain available as rollback targets:

| Deployment | Commit |
| --- | --- |
| `7yAwLW7wdUi3JkUEcZtcphfZcf9h` | `9ae99b1` |
| `6bjRuUZFzJJusMGinEEru5pzenpM` | `d4a2841` |
| `DL6bNJ23uxNMKj1eZkupFbBR1BED` | `43651b9` |

Rollback procedure (owner, in Vercel, no cost): project `incomeos-opportunity-desk` → Deployments → choose the earlier Ready deployment → ⋯ → Instant Rollback (or Promote to Production). Alternative: revert the commit on the branch and push; the project redeploys automatically.

Data rollback: the app keeps no records on the server. Records exist only in the owner's encrypted workspace file, so a code rollback cannot delete or alter them. Restoring an earlier state of the records means reopening an earlier saved workspace file or JSON backup.

## Not verified

- Rollback has not been exercised; only the availability of earlier Ready deployments and the procedure are recorded.
- The app's own security headers (CSP, no-store, noindex) sit behind the login and could not be read by the anonymous probe; they are defined in `owner/incomeos/vercel.json` and tested in source only.
- Access is Vercel's account login, not an app-level owner account. On the Hobby plan the account has no other members; the owner has not separately confirmed this.
- Use of the accounting editor's forms on the physical iPhone has not been observed; only page rendering was seen in the owner's screenshots.
- Server-side secure storage (A14) is not provisioned.
