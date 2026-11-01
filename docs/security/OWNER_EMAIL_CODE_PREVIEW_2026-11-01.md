# Owner Gmail code sign-in, protected Preview only
Candidate source basis: existing private dashboard/owner-session from original preview commit def1d977325ac16be717ed061b0f817167ad81e0.
The page prompts for a one-time six-digit code sent by Neon Auth to the server-side allowlisted JRS_OWNER_EMAIL.
Existing signed HttpOnly owner session and all private data readers remain unchanged.
No browser-supplied address, owner access code, contact records or commercial data are accepted by this route.
Deployment requires Preview-only OWNER_DASHBOARD_TOKEN (>=32 bytes), existing JRS_OWNER_EMAIL and NEON_AUTH_BASE_URL.
Neon Auth's Email OTP must be enabled and allow the actual Preview hostname, per https://neon.com/docs/auth/guides/plugins/email-otp .
No successful real OTP delivery or mobile session has yet been observed. Developer-only synthetic tests: 21/21 passed.
Production HOLD: live RLS/privacy denial and incident disposition, independent mobile acceptance, email provider success,
per-IP abuse throttling beyond Neon's built-in limits, owner exact-version approval and rollback required.
Keep this branch separate from production main. Form A/B/C/D/E/F commercial authorizations not implied.
