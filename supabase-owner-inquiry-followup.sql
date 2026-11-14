-- JRS private owner inquiry triage. This schema is NOT applied by a Git commit.
-- Install only after authorized database review; never place Formspree messages,
-- email addresses, organizations or other submitted details in this table.
BEGIN;
CREATE TABLE IF NOT EXISTS public.jrs_inquiry_followups (
  source text NOT NULL CHECK (source = 'formspree-public-jrs-contact'),
  source_record_id text NOT NULL CHECK (
    length(source_record_id) BETWEEN 8 AND 160 AND
    source_record_id ~ '^[A-Za-z0-9_-]+$'
  ),
  followup_status text NOT NULL CHECK (followup_status IN
    ('needs_review','response_recorded','closed','not_relevant')),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (source, source_record_id)
);
ALTER TABLE public.jrs_inquiry_followups ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.jrs_inquiry_followups FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.jrs_inquiry_followups TO service_role;
-- No public RLS policy is created; only a trusted server-side service role
-- may access it. The dashboard API also requires a signed owner session.
COMMENT ON TABLE public.jrs_inquiry_followups IS
  'Owner-entered triage states only. Formspree remains the message source of record; no PII or public buyer disclosure.';
COMMIT;
