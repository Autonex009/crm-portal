-- Migration 20260716133200: Fix RLS policies to allow soft deletion.
-- Since the application performs soft deletes by updating the `deleted_at` column,
-- having `deleted_at IS NULL` in SELECT policies causes updates to fail with:
-- "new row violates row-level security policy" because the post-update row
-- is no longer visible under SELECT policies.
-- We resolve this by removing the `deleted_at IS NULL` checks from SELECT policies,
-- allowing the RLS engine to validate access authorization regardless of deletion status.
-- Active/deleted filtering remains managed by the application queries.

-- Companies
DROP POLICY IF EXISTS "companies: internal users read" ON public.companies;
DROP POLICY IF EXISTS "companies: admins read deleted" ON public.companies;

CREATE POLICY "companies: internal users read"
  ON public.companies FOR SELECT
  USING (public.current_user_role() IN ('admin', 'sales', 'account_manager'));

-- Contacts
DROP POLICY IF EXISTS "contacts: internal users read" ON public.contacts;

CREATE POLICY "contacts: internal users read"
  ON public.contacts FOR SELECT
  USING (public.current_user_role() IN ('admin', 'sales', 'account_manager'));

-- Leads
DROP POLICY IF EXISTS "leads: admin read all" ON public.leads;
DROP POLICY IF EXISTS "leads: sales read own or assigned" ON public.leads;
DROP POLICY IF EXISTS "leads: account_manager read all active" ON public.leads;

CREATE POLICY "leads: admin read all"
  ON public.leads FOR SELECT
  USING (public.current_user_role() = 'admin');

CREATE POLICY "leads: sales read own or assigned"
  ON public.leads FOR SELECT
  USING (
    public.current_user_role() = 'sales' AND
    assigned_to = auth.uid()
  );

CREATE POLICY "leads: account_manager read all active"
  ON public.leads FOR SELECT
  USING (public.current_user_role() = 'account_manager');

-- Deals
DROP POLICY IF EXISTS "deals: admin read all" ON public.deals;
DROP POLICY IF EXISTS "deals: sales read own" ON public.deals;
DROP POLICY IF EXISTS "deals: account_manager read all" ON public.deals;

CREATE POLICY "deals: admin read all"
  ON public.deals FOR SELECT
  USING (public.current_user_role() = 'admin');

CREATE POLICY "deals: sales read own"
  ON public.deals FOR SELECT
  USING (
    public.current_user_role() = 'sales' AND
    owner_id = auth.uid()
  );

CREATE POLICY "deals: account_manager read all"
  ON public.deals FOR SELECT
  USING (public.current_user_role() = 'account_manager');

-- Quotes
DROP POLICY IF EXISTS "quotes: admin read all" ON public.quotes;
DROP POLICY IF EXISTS "quotes: sales read own" ON public.quotes;
DROP POLICY IF EXISTS "quotes: account_manager read all" ON public.quotes;

CREATE POLICY "quotes: admin read all"
  ON public.quotes FOR SELECT
  USING (public.current_user_role() = 'admin');

CREATE POLICY "quotes: sales read own"
  ON public.quotes FOR SELECT
  USING (
    public.current_user_role() = 'sales' AND
    created_by = auth.uid()
  );

CREATE POLICY "quotes: account_manager read all"
  ON public.quotes FOR SELECT
  USING (public.current_user_role() = 'account_manager');

-- Invoices
DROP POLICY IF EXISTS "invoices: admin read all" ON public.invoices;
DROP POLICY IF EXISTS "invoices: account_manager read assigned" ON public.invoices;
DROP POLICY IF EXISTS "invoices: sales read own company" ON public.invoices;

CREATE POLICY "invoices: admin read all"
  ON public.invoices FOR SELECT
  USING (public.current_user_role() = 'admin');

CREATE POLICY "invoices: account_manager read assigned"
  ON public.invoices FOR SELECT
  USING (
    public.current_user_role() = 'account_manager' AND
    account_manager_id = auth.uid()
  );

CREATE POLICY "invoices: sales read own company"
  ON public.invoices FOR SELECT
  USING (public.current_user_role() = 'sales');
