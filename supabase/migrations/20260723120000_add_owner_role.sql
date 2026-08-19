-- Migration 20260723120000: Add the `owner` role.
--
-- Adds a new highest-privilege role, `owner`, on TOP of the existing roles
-- (admin, sales, account_manager, client) without changing any of their
-- behavior. `owner` is a super-admin: it inherits every `admin` privilege in
-- RLS, and additionally an admin cannot demote/delete/edit an `owner` — only an
-- owner can change another owner.
--
-- To avoid scattering role literals across ~40 policies (and to make future
-- role changes a one-line edit), role checks are centralized into two helper
-- predicates. The policies below are rewritten to call them. For the existing
-- roles the helpers return exactly the same result as before, so behavior is
-- preserved byte-for-byte; only `owner` is newly granted access.
--
-- Idempotent: guarded constraint swap, CREATE OR REPLACE functions, and
-- DROP POLICY IF EXISTS + CREATE for every rewritten policy.

-- ────────────────────────────────────────────────────────────────────────────
-- 1. Allow the new role value on profiles.role
-- ────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('owner', 'admin', 'sales', 'account_manager', 'client'));

-- ────────────────────────────────────────────────────────────────────────────
-- 2. Role-check helper predicates (SECURITY DEFINER, like current_user_role()).
--    - privileged: full-access roles (was `= 'admin'`)
--    - internal:   staff roles (was `IN ('admin','sales','account_manager')`)
-- ────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.current_user_is_privileged() RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    AS $$ SELECT public.current_user_role() IN ('admin', 'owner'); $$;

CREATE OR REPLACE FUNCTION public.current_user_is_internal() RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    AS $$ SELECT public.current_user_role() IN ('owner', 'admin', 'sales', 'account_manager'); $$;

GRANT ALL ON FUNCTION public.current_user_is_privileged() TO anon, authenticated, service_role;
GRANT ALL ON FUNCTION public.current_user_is_internal() TO anon, authenticated, service_role;

-- ────────────────────────────────────────────────────────────────────────────
-- 3. Rewrite role-gated policies to use the helpers so `owner` inherits access.
--    Owner-scoped/self policies (sales-own, account_manager-specific, and the
--    `*_id = auth.uid()` branches) are intentionally left untouched — `owner`
--    is covered by the privileged/internal branches instead.
-- ────────────────────────────────────────────────────────────────────────────

-- activities
DROP POLICY IF EXISTS "activities: admin delete" ON public.activities;
CREATE POLICY "activities: admin delete" ON public.activities
  FOR DELETE USING (public.current_user_is_privileged());

DROP POLICY IF EXISTS "activities: author or admin update" ON public.activities;
CREATE POLICY "activities: author or admin update" ON public.activities
  FOR UPDATE USING (public.current_user_is_privileged() OR author_id = auth.uid());

DROP POLICY IF EXISTS "activities: internal users insert" ON public.activities;
CREATE POLICY "activities: internal users insert" ON public.activities
  FOR INSERT WITH CHECK (public.current_user_is_internal());

DROP POLICY IF EXISTS "activities: internal users read" ON public.activities;
CREATE POLICY "activities: internal users read" ON public.activities
  FOR SELECT USING (public.current_user_is_internal());

-- audit_log
DROP POLICY IF EXISTS "audit_log: admins read all" ON public.audit_log;
CREATE POLICY "audit_log: admins read all" ON public.audit_log
  FOR SELECT USING (public.current_user_is_privileged());

DROP POLICY IF EXISTS "audit_log: internal users insert" ON public.audit_log;
CREATE POLICY "audit_log: internal users insert" ON public.audit_log
  FOR INSERT WITH CHECK (public.current_user_is_internal());

-- calendar_events
DROP POLICY IF EXISTS "calendar_events: admin delete" ON public.calendar_events;
CREATE POLICY "calendar_events: admin delete" ON public.calendar_events
  FOR DELETE USING (public.current_user_is_privileged());

DROP POLICY IF EXISTS "calendar_events: internal users insert" ON public.calendar_events;
CREATE POLICY "calendar_events: internal users insert" ON public.calendar_events
  FOR INSERT WITH CHECK (public.current_user_is_internal());

DROP POLICY IF EXISTS "calendar_events: internal users read" ON public.calendar_events;
CREATE POLICY "calendar_events: internal users read" ON public.calendar_events
  FOR SELECT USING (public.current_user_is_internal());

DROP POLICY IF EXISTS "calendar_events: internal users update" ON public.calendar_events;
CREATE POLICY "calendar_events: internal users update" ON public.calendar_events
  FOR UPDATE USING (public.current_user_is_internal());

-- companies
DROP POLICY IF EXISTS "companies: internal users read" ON public.companies;
CREATE POLICY "companies: internal users read" ON public.companies
  FOR SELECT USING (public.current_user_is_internal());

DROP POLICY IF EXISTS "companies: internal users insert" ON public.companies;
CREATE POLICY "companies: internal users insert" ON public.companies
  FOR INSERT WITH CHECK (public.current_user_is_internal());

DROP POLICY IF EXISTS "companies: owner or admin update" ON public.companies;
CREATE POLICY "companies: owner or admin update" ON public.companies
  FOR UPDATE USING (public.current_user_is_privileged() OR owner_id = auth.uid());

DROP POLICY IF EXISTS "companies: owner or admin delete" ON public.companies;
CREATE POLICY "companies: owner or admin delete" ON public.companies
  FOR DELETE USING (public.current_user_is_privileged() OR owner_id = auth.uid());

-- contacts
DROP POLICY IF EXISTS "contacts: internal users read" ON public.contacts;
CREATE POLICY "contacts: internal users read" ON public.contacts
  FOR SELECT USING (public.current_user_is_internal());

DROP POLICY IF EXISTS "contacts: internal users insert" ON public.contacts;
CREATE POLICY "contacts: internal users insert" ON public.contacts
  FOR INSERT WITH CHECK (public.current_user_is_internal());

DROP POLICY IF EXISTS "contacts: internal users update" ON public.contacts;
CREATE POLICY "contacts: internal users update" ON public.contacts
  FOR UPDATE USING (public.current_user_is_internal());

DROP POLICY IF EXISTS "contacts: internal users delete" ON public.contacts;
CREATE POLICY "contacts: internal users delete" ON public.contacts
  FOR DELETE USING (public.current_user_is_internal());

-- deals
DROP POLICY IF EXISTS "deals: admin delete" ON public.deals;
CREATE POLICY "deals: admin delete" ON public.deals
  FOR DELETE USING (public.current_user_is_privileged());

DROP POLICY IF EXISTS "deals: admin read all" ON public.deals;
CREATE POLICY "deals: admin read all" ON public.deals
  FOR SELECT USING (public.current_user_is_privileged());

DROP POLICY IF EXISTS "deals: internal users insert" ON public.deals;
CREATE POLICY "deals: internal users insert" ON public.deals
  FOR INSERT WITH CHECK (public.current_user_is_internal());

DROP POLICY IF EXISTS "deals: owner or admin update" ON public.deals;
CREATE POLICY "deals: owner or admin update" ON public.deals
  FOR UPDATE USING (
    public.current_user_is_privileged()
    OR (public.current_user_role() IN ('sales', 'account_manager') AND owner_id = auth.uid())
  );

-- follow_ups
DROP POLICY IF EXISTS "follow_ups: internal users insert" ON public.follow_ups;
CREATE POLICY "follow_ups: internal users insert" ON public.follow_ups
  FOR INSERT WITH CHECK (public.current_user_is_internal());

DROP POLICY IF EXISTS "follow_ups: internal users read" ON public.follow_ups;
CREATE POLICY "follow_ups: internal users read" ON public.follow_ups
  FOR SELECT USING (public.current_user_is_internal());

DROP POLICY IF EXISTS "follow_ups: internal users update" ON public.follow_ups;
CREATE POLICY "follow_ups: internal users update" ON public.follow_ups
  FOR UPDATE USING (public.current_user_is_internal());

-- integration_connections (self-owned; privileged users may also read/update/delete others')
DROP POLICY IF EXISTS "integration_connections: owner read" ON public.integration_connections;
CREATE POLICY "integration_connections: owner read" ON public.integration_connections
  FOR SELECT USING (user_id = auth.uid() OR public.current_user_is_privileged());

DROP POLICY IF EXISTS "integration_connections: owner update" ON public.integration_connections;
CREATE POLICY "integration_connections: owner update" ON public.integration_connections
  FOR UPDATE USING (user_id = auth.uid() OR public.current_user_is_privileged());

DROP POLICY IF EXISTS "integration_connections: owner delete" ON public.integration_connections;
CREATE POLICY "integration_connections: owner delete" ON public.integration_connections
  FOR DELETE USING (user_id = auth.uid() OR public.current_user_is_privileged());

-- invoices
DROP POLICY IF EXISTS "invoices: admin delete" ON public.invoices;
CREATE POLICY "invoices: admin delete" ON public.invoices
  FOR DELETE USING (public.current_user_is_privileged());

DROP POLICY IF EXISTS "invoices: admin read all" ON public.invoices;
CREATE POLICY "invoices: admin read all" ON public.invoices
  FOR SELECT USING (public.current_user_is_privileged());

DROP POLICY IF EXISTS "invoices: internal users insert" ON public.invoices;
CREATE POLICY "invoices: internal users insert" ON public.invoices
  FOR INSERT WITH CHECK (public.current_user_is_internal());

DROP POLICY IF EXISTS "invoices: internal users update" ON public.invoices;
CREATE POLICY "invoices: internal users update" ON public.invoices
  FOR UPDATE USING (public.current_user_is_internal());

-- leads
DROP POLICY IF EXISTS "leads: admin read all" ON public.leads;
CREATE POLICY "leads: admin read all" ON public.leads
  FOR SELECT USING (public.current_user_is_privileged());

DROP POLICY IF EXISTS "leads: internal users insert" ON public.leads;
CREATE POLICY "leads: internal users insert" ON public.leads
  FOR INSERT WITH CHECK (public.current_user_is_internal());

DROP POLICY IF EXISTS "leads: internal users update" ON public.leads;
CREATE POLICY "leads: internal users update" ON public.leads
  FOR UPDATE USING (public.current_user_is_internal());

DROP POLICY IF EXISTS "leads: internal users delete" ON public.leads;
CREATE POLICY "leads: internal users delete" ON public.leads
  FOR DELETE USING (public.current_user_is_internal());

-- payments
DROP POLICY IF EXISTS "payments: internal users insert" ON public.payments;
CREATE POLICY "payments: internal users insert" ON public.payments
  FOR INSERT WITH CHECK (public.current_user_is_internal());

DROP POLICY IF EXISTS "payments: internal users read" ON public.payments;
CREATE POLICY "payments: internal users read" ON public.payments
  FOR SELECT USING (public.current_user_is_internal());

-- products
DROP POLICY IF EXISTS "products: admin delete" ON public.products;
CREATE POLICY "products: admin delete" ON public.products
  FOR DELETE USING (public.current_user_is_privileged());

DROP POLICY IF EXISTS "products: admin insert" ON public.products;
CREATE POLICY "products: admin insert" ON public.products
  FOR INSERT WITH CHECK (public.current_user_is_privileged());

DROP POLICY IF EXISTS "products: admin update" ON public.products;
CREATE POLICY "products: admin update" ON public.products
  FOR UPDATE USING (public.current_user_is_privileged());

DROP POLICY IF EXISTS "products: internal users read active" ON public.products;
CREATE POLICY "products: internal users read active" ON public.products
  FOR SELECT USING (
    public.current_user_is_internal()
    AND (active = true OR public.current_user_is_privileged())
  );

-- quote_approvals
DROP POLICY IF EXISTS "quote_approvals: internal users insert" ON public.quote_approvals;
CREATE POLICY "quote_approvals: internal users insert" ON public.quote_approvals
  FOR INSERT WITH CHECK (public.current_user_is_internal());

DROP POLICY IF EXISTS "quote_approvals: internal users read" ON public.quote_approvals;
CREATE POLICY "quote_approvals: internal users read" ON public.quote_approvals
  FOR SELECT USING (public.current_user_is_internal());

DROP POLICY IF EXISTS "quote_approvals: internal users update" ON public.quote_approvals;
CREATE POLICY "quote_approvals: internal users update" ON public.quote_approvals
  FOR UPDATE USING (public.current_user_is_internal());

-- quote_versions
DROP POLICY IF EXISTS "quote_versions: internal users insert" ON public.quote_versions;
CREATE POLICY "quote_versions: internal users insert" ON public.quote_versions
  FOR INSERT WITH CHECK (public.current_user_is_internal());

DROP POLICY IF EXISTS "quote_versions: internal users read" ON public.quote_versions;
CREATE POLICY "quote_versions: internal users read" ON public.quote_versions
  FOR SELECT USING (public.current_user_is_internal());

DROP POLICY IF EXISTS "quote_versions: internal users update" ON public.quote_versions;
CREATE POLICY "quote_versions: internal users update" ON public.quote_versions
  FOR UPDATE USING (public.current_user_is_internal());

-- quotes
DROP POLICY IF EXISTS "quotes: admin delete" ON public.quotes;
CREATE POLICY "quotes: admin delete" ON public.quotes
  FOR DELETE USING (public.current_user_is_privileged());

DROP POLICY IF EXISTS "quotes: admin read all" ON public.quotes;
CREATE POLICY "quotes: admin read all" ON public.quotes
  FOR SELECT USING (public.current_user_is_privileged());

DROP POLICY IF EXISTS "quotes: internal users insert" ON public.quotes;
CREATE POLICY "quotes: internal users insert" ON public.quotes
  FOR INSERT WITH CHECK (public.current_user_is_internal());

DROP POLICY IF EXISTS "quotes: owner or admin update" ON public.quotes;
CREATE POLICY "quotes: owner or admin update" ON public.quotes
  FOR UPDATE USING (
    public.current_user_is_privileged()
    OR (public.current_user_role() IN ('sales', 'account_manager') AND created_by = auth.uid())
  );

-- slack_channels
DROP POLICY IF EXISTS "slack_channels: admin delete" ON public.slack_channels;
CREATE POLICY "slack_channels: admin delete" ON public.slack_channels
  FOR DELETE USING (public.current_user_is_privileged());

DROP POLICY IF EXISTS "slack_channels: internal users insert" ON public.slack_channels;
CREATE POLICY "slack_channels: internal users insert" ON public.slack_channels
  FOR INSERT WITH CHECK (public.current_user_is_internal());

DROP POLICY IF EXISTS "slack_channels: internal users read" ON public.slack_channels;
CREATE POLICY "slack_channels: internal users read" ON public.slack_channels
  FOR SELECT USING (public.current_user_is_internal());

-- ────────────────────────────────────────────────────────────────────────────
-- 4. profiles: give owner admin-parity on reads, and protect the owner row:
--    an admin can read all profiles, but cannot UPDATE/DELETE an owner or
--    promote anyone TO owner — only an owner can manage owners.
--    (Note: the `id = auth.uid()` self branch is preserved as-is.)
-- ────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "profiles: users read own" ON public.profiles;
CREATE POLICY "profiles: users read own" ON public.profiles
  FOR SELECT USING (id = auth.uid() OR public.current_user_is_privileged());

DROP POLICY IF EXISTS "profiles: admins insert" ON public.profiles;
CREATE POLICY "profiles: admins insert" ON public.profiles
  FOR INSERT WITH CHECK (public.current_user_is_privileged() OR id = auth.uid());

DROP POLICY IF EXISTS "profiles: users update own" ON public.profiles;
CREATE POLICY "profiles: users update own" ON public.profiles
  FOR UPDATE
  USING (
    id = auth.uid()
    OR (public.current_user_is_privileged()
        AND (profiles.role IS DISTINCT FROM 'owner' OR public.current_user_role() = 'owner'))
  )
  WITH CHECK (
    id = auth.uid()
    OR (public.current_user_is_privileged()
        AND (profiles.role IS DISTINCT FROM 'owner' OR public.current_user_role() = 'owner'))
  );

DROP POLICY IF EXISTS "profiles: admins delete" ON public.profiles;
CREATE POLICY "profiles: admins delete" ON public.profiles
  FOR DELETE USING (
    public.current_user_is_privileged()
    AND (profiles.role IS DISTINCT FROM 'owner' OR public.current_user_role() = 'owner')
  );

-- ────────────────────────────────────────────────────────────────────────────
-- 5. One-time: seed the workspace owner.
--    `profiles` has no email column, so match through auth.users. Uncomment,
--    confirm the email, and it runs on the next apply. Safe & idempotent — only
--    promotes an existing profile; no-op if the email isn't found.
-- ────────────────────────────────────────────────────────────────────────────
-- UPDATE public.profiles p
--   SET role = 'owner'
--   FROM auth.users u
--   WHERE u.id = p.id
--     AND u.email = 'karan.paigude@autonexai360.com';
