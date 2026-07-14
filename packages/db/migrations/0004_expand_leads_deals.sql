-- Migration 0004: Expand leads and deals to match the import spec.
-- All additive & nullable so existing rows and code keep working.

-- ─────────────────────────────────────────────────────────────
-- LEADS: Name, Job Title, Email, Phone, LinkedIn, Sector/Industry,
--        Location, Product Use Cases / Interest, Next Follow-up Date, Notes
-- (Company → company_id, Status → status, both already exist)
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS contact_name        TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS job_title           TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS email               TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS phone               TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS linkedin_url        TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS industry            TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS location            TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS product_interest    TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS next_follow_up_date DATE;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS notes               TEXT;

-- ─────────────────────────────────────────────────────────────
-- DEALS: Job Title, Product / Use Case, Probability (%), Next Action, Notes
-- (Name → title, Company → company_id, Stage, Amount,
--  Expected Closing Date → expected_close_date all already exist)
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS job_title        TEXT;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS product_use_case TEXT;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS probability      INTEGER
  CHECK (probability IS NULL OR (probability >= 0 AND probability <= 100));
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS next_action      TEXT;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS notes            TEXT;
