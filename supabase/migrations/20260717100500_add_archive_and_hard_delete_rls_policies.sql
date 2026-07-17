-- Migration 20260717100500: Setup Archive and Hard Delete RLS Policies
-- Adds the `archived_at` timestamp columns and configures DELETE RLS policies for leads, companies, and contacts.

-- 1. Add archived_at columns
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS archived_at timestamp with time zone;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS archived_at timestamp with time zone;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS archived_at timestamp with time zone;

-- 2. Setup DELETE RLS policies (Idempotent)

-- Companies
DROP POLICY IF EXISTS "companies: admin delete" ON public.companies;
DROP POLICY IF EXISTS "companies: owner or admin delete" ON public.companies;
CREATE POLICY "companies: owner or admin delete"
  ON public.companies FOR DELETE
  USING (
    public.current_user_role() = 'admin' OR
    owner_id = auth.uid()
  );

-- Contacts
DROP POLICY IF EXISTS "contacts: admin delete" ON public.contacts;
DROP POLICY IF EXISTS "contacts: internal users delete" ON public.contacts;
CREATE POLICY "contacts: internal users delete"
  ON public.contacts FOR DELETE
  USING (
    public.current_user_role() IN ('admin', 'sales', 'account_manager')
  );

-- Leads
DROP POLICY IF EXISTS "leads: admin delete" ON public.leads;
DROP POLICY IF EXISTS "leads: internal users delete" ON public.leads;
CREATE POLICY "leads: internal users delete"
  ON public.leads FOR DELETE
  USING (
    public.current_user_role() IN ('admin', 'sales', 'account_manager')
  );
