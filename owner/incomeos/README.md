# IncomeOS: owner-only iPhone prototype

Status: STAGING ONLY. DO NOT MERGE TO PUBLIC PRODUCTION.

This single-user research and cash-flow decision interface is intended for the existing JRS technical infrastructure while preserving the institutional public website and the local-only JRS Review Engine. It does not create accounts, submit participant applications, execute investments or transmit owner data.

## Access and privacy

- Candidate route: /owner/incomeos/.
- The public JRS production domain has no verified owner-only authentication for this path. An unlisted URL and noindex are not access controls. Never merge into production without server-side authentication.
- The current JRS Vercel deployment uses Vercel Authentication for protected previews. Test anonymous denial before using the prototype on a preview deployment.
- Production release gate: server-side owner-only route protection, path-specific private/no-store headers, negative anonymous access tests, privacy review, and rollback. Do not switch public JRS production to whole-project authentication.
- GitHub repository and source are public, even on an unreleased branch. Never commit identity records, secrets, application answers, balances or private notes.
- Saved bookmarks, study status and earnings are stored only in browser localStorage, not encrypted, not backed up or synchronized. Do not use shared devices.

## Contents

- index.html: dashboard tabs, individual study links, alternative-asset watchlist, manual earnings ledger and scenario modeling.
- opportunities.json: dated public-source research and investment research candidates with explicit caveats. No live feed is claimed.
- incomeos.js and incomeos.css: static client-only controls without external scripts.
- manifest.webmanifest and icon.svg: home-screen support. No website push notification service.

## Validation and release gates

1. Verify deployment protection: unauthenticated preview user must be denied.
2. Verify existing JRS public pages, redirects, engine guards and production versions are unchanged.
3. Check iPhone 375px and 320px widths, keyboard navigation and Add to Home Screen.
4. Check date-expiry filtering, specific study application links, and no claims of available paid seats.
5. Verify asset source links are clearly labeled as research/catelog links unless deal-specific URLs are verified.
6. Check saved status, application pipeline, receipt ledger, CSV export and local data erasure.
7. Verify growth scenarios with positive, zero and negative assumed return, and clear hypothetical warnings.
8. Confirm no outgoing personal-data request, third-party tracking, bank credentials, or unsolicited payment action.
9. Before public-domain merge, add and validate production-ready owner authentication and no-store headers.
10. Require explicit owner approval before merging or publishing to public JRS domain.

## Accounting

Only received, manually recorded payments count as paid income. Advertised incentives are not earnings. Financial asset examples carry risk and are not recommendations. Investing or reinvesting requires owner approval and an authorized provider.
