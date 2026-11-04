# IncomeOS Platform Consolidation Register
Date: 2026-11-04
Status: evidence-backed inspection; no production migration or deployment authorized.

## Identified implementations
1. Lovable Opportunity Radar: project c727b0d7-7a5f-41b9-a6f5-a4062d71f012; published; latest observed Lovable commit 56e7747e13b6d8c98c4e291b42c0ffc77f96a6a3. TanStack Start / React / Supabase. supabase/config.toml names project ndjoqlnztjcqtmbbwybv. src/lib/feed.ts queries research_opportunities. src/lib/profile.ts explicitly retains owner application profile in memory only. Database schema/RLS and real-time connectivity have NOT been independently inspected.
2. GitHub owner desk: repository phillipwikes-bit/jrsstandard.com, branch feature/incomeos-owner-prototype-2026-11-01, directory owner/incomeos/. Static JavaScript owner workspace, separate from Lovable. workspace-store.js supports manually saved optional encrypted JSON workspace files; ds-program.js holds Decision Spellchecker program evidence, gates, and linked modules. Do not infer cloud database or automatic cross-device persistence.
3. Vercel project incomeos-opportunity-desk: prj_eIGgDvJb3LkYmk0NGjoo7bWFEi3n. Last observed production deployment READY for 2a4a7472db595ff8ec4ba74f358a845e3d293efa, but project live:false and SSO protection enabled. The deployment is older than current GitHub development branch. Do not assume current branch changes are live.
4. JRS production and public resources: separate jrsstandard-com project. Keep independent release controls and never merge IncomeOS private data into public JRS resources.

## Authority decision for the consolidation
- Until migration is designed and verified, treat Lovable as the authoritative source for the published public research UI/feed and its existing Supabase research records.
- Treat the GitHub owner/incomeos branch as authoritative for the private Owner Desk, Decision Spellchecker program records, and development of its source-controlled functionality.
- There is NO established single authoritative database for all IncomeOS owner data. Do not silently select or migrate to Supabase.
- Maintain both implementations without cross-system credential or data replication until owner authentication, RLS, schema, backup, rollback, and data-mapping checks pass.
- Never use the public JRS website as the IncomeOS backend.

## Safe repair committed
Research EHY threshold now places unknown-yield candidates on HOLD when a positive minimum EHY is configured; regression test added in tests/incomeos-research-ehy.mjs. Tests not yet executed. No deployment.

## Next engineering acceptance sequence
P0: Inspect actual Lovable Supabase tables, RLS policies, auth configuration, and existing data. Do not reveal secrets or owner contact details in reports.
P0: Inspect Vercel build artifact/source routing, project protection, production URLs, and compare deployed SHA to branch HEAD. Preserve SSO and release isolation.
P0: Execute EHY tests and full existing owner desk test suite; repair failures. Verify mobile and source/date disclosures.
P1: Establish explicit data ownership matrix for research_opportunities, application_profiles, owner workspace, dsProgram, receipts, evidence, and business contacts.
P1: Implement private owner auth and server-enforced access control in a separately reviewed backend. Migrate session profile only after owner verification and explicit confirmation; do not use public localStorage as secure persistence.
P1: Decide whether to consolidate into a single application after feature-parity, backup, security and rollback evidence. No automatic DNS or production release.
P2: Add Decision Spellchecker dashboard integration after verified backend and access controls, retaining separate JRS free-resource and private DS commercial boundaries.

## Prohibited claims
A READY deployment is not proof of accessibility; a GitHub commit is not proof of production release; a scheduled task is not proof of earned revenue; a configured Supabase project is not proof of secure private-profile persistence; synthetic DS tests are not proof of field efficacy.
