-- ============================================================
-- Migration: 0002_rls_policies
-- Row Level Security policies for all tables.
-- Admin role bypasses all restrictions.
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- PROFILES
-- ─────────────────────────────────────────────────────────────
CREATE POLICY "profiles: users read own"
  ON public.profiles FOR SELECT
  USING (id = auth.uid() OR public.current_user_role() = 'admin');

CREATE POLICY "profiles: users update own"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid() OR public.current_user_role() = 'admin');

CREATE POLICY "profiles: admins insert"
  ON public.profiles FOR INSERT
  WITH CHECK (public.current_user_role() = 'admin' OR id = auth.uid());

CREATE POLICY "profiles: admins delete"
  ON public.profiles FOR DELETE
  USING (public.current_user_role() = 'admin');

-- ─────────────────────────────────────────────────────────────
-- COMPANIES
-- ─────────────────────────────────────────────────────────────
CREATE POLICY "companies: internal users read"
  ON public.companies FOR SELECT
  USING (
    deleted_at IS NULL AND
    public.current_user_role() IN ('admin', 'sales', 'account_manager')
  );

CREATE POLICY "companies: admins read deleted"
  ON public.companies FOR SELECT
  USING (public.current_user_role() = 'admin');

CREATE POLICY "companies: internal users insert"
  ON public.companies FOR INSERT
  WITH CHECK (public.current_user_role() IN ('admin', 'sales', 'account_manager'));

CREATE POLICY "companies: owner or admin update"
  ON public.companies FOR UPDATE
  USING (
    public.current_user_role() = 'admin' OR
    owner_id = auth.uid()
  );

CREATE POLICY "companies: admin delete"
  ON public.companies FOR DELETE
  USING (public.current_user_role() = 'admin');

-- ─────────────────────────────────────────────────────────────
-- CONTACTS
-- ─────────────────────────────────────────────────────────────
CREATE POLICY "contacts: internal users read"
  ON public.contacts FOR SELECT
  USING (
    deleted_at IS NULL AND
    public.current_user_role() IN ('admin', 'sales', 'account_manager')
  );

CREATE POLICY "contacts: internal users insert"
  ON public.contacts FOR INSERT
  WITH CHECK (public.current_user_role() IN ('admin', 'sales', 'account_manager'));

CREATE POLICY "contacts: internal users update"
  ON public.contacts FOR UPDATE
  USING (public.current_user_role() IN ('admin', 'sales', 'account_manager'));

CREATE POLICY "contacts: admin delete"
  ON public.contacts FOR DELETE
  USING (public.current_user_role() = 'admin');

-- ─────────────────────────────────────────────────────────────
-- LEADS
-- ─────────────────────────────────────────────────────────────
CREATE POLICY "leads: admin read all"
  ON public.leads FOR SELECT
  USING (public.current_user_role() = 'admin' AND deleted_at IS NULL);

CREATE POLICY "leads: sales read own or assigned"
  ON public.leads FOR SELECT
  USING (
    deleted_at IS NULL AND
    public.current_user_role() = 'sales' AND
    (assigned_to = auth.uid())
  );

CREATE POLICY "leads: account_manager read all active"
  ON public.leads FOR SELECT
  USING (
    deleted_at IS NULL AND
    public.current_user_role() = 'account_manager'
  );

CREATE POLICY "leads: internal users insert"
  ON public.leads FOR INSERT
  WITH CHECK (public.current_user_role() IN ('admin', 'sales', 'account_manager'));

CREATE POLICY "leads: internal users update"
  ON public.leads FOR UPDATE
  USING (public.current_user_role() IN ('admin', 'sales', 'account_manager'));

CREATE POLICY "leads: admin delete"
  ON public.leads FOR DELETE
  USING (public.current_user_role() = 'admin');

-- ─────────────────────────────────────────────────────────────
-- DEALS
-- ─────────────────────────────────────────────────────────────
CREATE POLICY "deals: admin read all"
  ON public.deals FOR SELECT
  USING (public.current_user_role() = 'admin' AND deleted_at IS NULL);

CREATE POLICY "deals: sales read own"
  ON public.deals FOR SELECT
  USING (
    deleted_at IS NULL AND
    public.current_user_role() = 'sales' AND
    owner_id = auth.uid()
  );

CREATE POLICY "deals: account_manager read all"
  ON public.deals FOR SELECT
  USING (
    deleted_at IS NULL AND
    public.current_user_role() = 'account_manager'
  );

CREATE POLICY "deals: internal users insert"
  ON public.deals FOR INSERT
  WITH CHECK (public.current_user_role() IN ('admin', 'sales', 'account_manager'));

CREATE POLICY "deals: owner or admin update"
  ON public.deals FOR UPDATE
  USING (
    public.current_user_role() = 'admin' OR
    (public.current_user_role() IN ('sales', 'account_manager') AND owner_id = auth.uid())
  );

CREATE POLICY "deals: admin delete"
  ON public.deals FOR DELETE
  USING (public.current_user_role() = 'admin');

-- ─────────────────────────────────────────────────────────────
-- ACTIVITIES
-- ─────────────────────────────────────────────────────────────
CREATE POLICY "activities: internal users read"
  ON public.activities FOR SELECT
  USING (public.current_user_role() IN ('admin', 'sales', 'account_manager'));

CREATE POLICY "activities: internal users insert"
  ON public.activities FOR INSERT
  WITH CHECK (public.current_user_role() IN ('admin', 'sales', 'account_manager'));

CREATE POLICY "activities: author or admin update"
  ON public.activities FOR UPDATE
  USING (
    public.current_user_role() = 'admin' OR
    author_id = auth.uid()
  );

CREATE POLICY "activities: admin delete"
  ON public.activities FOR DELETE
  USING (public.current_user_role() = 'admin');

-- ─────────────────────────────────────────────────────────────
-- AUDIT LOG (append-only for non-admins)
-- ─────────────────────────────────────────────────────────────
CREATE POLICY "audit_log: admins read all"
  ON public.audit_log FOR SELECT
  USING (public.current_user_role() = 'admin');

CREATE POLICY "audit_log: internal users insert"
  ON public.audit_log FOR INSERT
  WITH CHECK (public.current_user_role() IN ('admin', 'sales', 'account_manager'));

-- No UPDATE or DELETE on audit_log (append-only by design)

-- ─────────────────────────────────────────────────────────────
-- PRODUCTS
-- ─────────────────────────────────────────────────────────────
CREATE POLICY "products: internal users read active"
  ON public.products FOR SELECT
  USING (
    public.current_user_role() IN ('admin', 'sales', 'account_manager') AND
    (active = TRUE OR public.current_user_role() = 'admin')
  );

CREATE POLICY "products: admin insert"
  ON public.products FOR INSERT
  WITH CHECK (public.current_user_role() = 'admin');

CREATE POLICY "products: admin update"
  ON public.products FOR UPDATE
  USING (public.current_user_role() = 'admin');

CREATE POLICY "products: admin delete"
  ON public.products FOR DELETE
  USING (public.current_user_role() = 'admin');

-- ─────────────────────────────────────────────────────────────
-- QUOTES
-- ─────────────────────────────────────────────────────────────
CREATE POLICY "quotes: admin read all"
  ON public.quotes FOR SELECT
  USING (public.current_user_role() = 'admin' AND deleted_at IS NULL);

CREATE POLICY "quotes: sales read own"
  ON public.quotes FOR SELECT
  USING (
    deleted_at IS NULL AND
    public.current_user_role() = 'sales' AND
    created_by = auth.uid()
  );

CREATE POLICY "quotes: account_manager read all"
  ON public.quotes FOR SELECT
  USING (
    deleted_at IS NULL AND
    public.current_user_role() = 'account_manager'
  );

CREATE POLICY "quotes: internal users insert"
  ON public.quotes FOR INSERT
  WITH CHECK (public.current_user_role() IN ('admin', 'sales', 'account_manager'));

CREATE POLICY "quotes: owner or admin update"
  ON public.quotes FOR UPDATE
  USING (
    public.current_user_role() = 'admin' OR
    (public.current_user_role() IN ('sales', 'account_manager') AND created_by = auth.uid())
  );

CREATE POLICY "quotes: admin delete"
  ON public.quotes FOR DELETE
  USING (public.current_user_role() = 'admin');

-- ─────────────────────────────────────────────────────────────
-- QUOTE VERSIONS
-- ─────────────────────────────────────────────────────────────
CREATE POLICY "quote_versions: internal users read"
  ON public.quote_versions FOR SELECT
  USING (public.current_user_role() IN ('admin', 'sales', 'account_manager'));

CREATE POLICY "quote_versions: internal users insert"
  ON public.quote_versions FOR INSERT
  WITH CHECK (public.current_user_role() IN ('admin', 'sales', 'account_manager'));

CREATE POLICY "quote_versions: internal users update"
  ON public.quote_versions FOR UPDATE
  USING (public.current_user_role() IN ('admin', 'sales', 'account_manager'));

-- ─────────────────────────────────────────────────────────────
-- QUOTE APPROVALS (accessed via service role in portal)
-- ─────────────────────────────────────────────────────────────
CREATE POLICY "quote_approvals: internal users read"
  ON public.quote_approvals FOR SELECT
  USING (public.current_user_role() IN ('admin', 'sales', 'account_manager'));

CREATE POLICY "quote_approvals: internal users insert"
  ON public.quote_approvals FOR INSERT
  WITH CHECK (public.current_user_role() IN ('admin', 'sales', 'account_manager'));

CREATE POLICY "quote_approvals: internal users update"
  ON public.quote_approvals FOR UPDATE
  USING (public.current_user_role() IN ('admin', 'sales', 'account_manager'));

-- ─────────────────────────────────────────────────────────────
-- INVOICES
-- ─────────────────────────────────────────────────────────────
CREATE POLICY "invoices: admin read all"
  ON public.invoices FOR SELECT
  USING (public.current_user_role() = 'admin' AND deleted_at IS NULL);

CREATE POLICY "invoices: account_manager read assigned"
  ON public.invoices FOR SELECT
  USING (
    deleted_at IS NULL AND
    public.current_user_role() = 'account_manager' AND
    account_manager_id = auth.uid()
  );

CREATE POLICY "invoices: sales read own company"
  ON public.invoices FOR SELECT
  USING (
    deleted_at IS NULL AND
    public.current_user_role() = 'sales'
  );

CREATE POLICY "invoices: internal users insert"
  ON public.invoices FOR INSERT
  WITH CHECK (public.current_user_role() IN ('admin', 'sales', 'account_manager'));

CREATE POLICY "invoices: internal users update"
  ON public.invoices FOR UPDATE
  USING (public.current_user_role() IN ('admin', 'sales', 'account_manager'));

CREATE POLICY "invoices: admin delete"
  ON public.invoices FOR DELETE
  USING (public.current_user_role() = 'admin');

-- ─────────────────────────────────────────────────────────────
-- PAYMENTS
-- ─────────────────────────────────────────────────────────────
CREATE POLICY "payments: internal users read"
  ON public.payments FOR SELECT
  USING (public.current_user_role() IN ('admin', 'sales', 'account_manager'));

CREATE POLICY "payments: internal users insert"
  ON public.payments FOR INSERT
  WITH CHECK (public.current_user_role() IN ('admin', 'sales', 'account_manager'));

-- ─────────────────────────────────────────────────────────────
-- FOLLOW-UPS
-- ─────────────────────────────────────────────────────────────
CREATE POLICY "follow_ups: internal users read"
  ON public.follow_ups FOR SELECT
  USING (public.current_user_role() IN ('admin', 'sales', 'account_manager'));

CREATE POLICY "follow_ups: internal users insert"
  ON public.follow_ups FOR INSERT
  WITH CHECK (public.current_user_role() IN ('admin', 'sales', 'account_manager'));

CREATE POLICY "follow_ups: internal users update"
  ON public.follow_ups FOR UPDATE
  USING (public.current_user_role() IN ('admin', 'sales', 'account_manager'));

-- ─────────────────────────────────────────────────────────────
-- INTEGRATION CONNECTIONS (strictly per-user)
-- ─────────────────────────────────────────────────────────────
CREATE POLICY "integration_connections: owner read"
  ON public.integration_connections FOR SELECT
  USING (user_id = auth.uid() OR public.current_user_role() = 'admin');

CREATE POLICY "integration_connections: owner insert"
  ON public.integration_connections FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "integration_connections: owner update"
  ON public.integration_connections FOR UPDATE
  USING (user_id = auth.uid() OR public.current_user_role() = 'admin');

CREATE POLICY "integration_connections: owner delete"
  ON public.integration_connections FOR DELETE
  USING (user_id = auth.uid() OR public.current_user_role() = 'admin');

-- ─────────────────────────────────────────────────────────────
-- CALENDAR EVENTS
-- ─────────────────────────────────────────────────────────────
CREATE POLICY "calendar_events: internal users read"
  ON public.calendar_events FOR SELECT
  USING (public.current_user_role() IN ('admin', 'sales', 'account_manager'));

CREATE POLICY "calendar_events: internal users insert"
  ON public.calendar_events FOR INSERT
  WITH CHECK (public.current_user_role() IN ('admin', 'sales', 'account_manager'));

CREATE POLICY "calendar_events: internal users update"
  ON public.calendar_events FOR UPDATE
  USING (public.current_user_role() IN ('admin', 'sales', 'account_manager'));

CREATE POLICY "calendar_events: admin delete"
  ON public.calendar_events FOR DELETE
  USING (public.current_user_role() = 'admin');

-- ─────────────────────────────────────────────────────────────
-- SLACK CHANNELS
-- ─────────────────────────────────────────────────────────────
CREATE POLICY "slack_channels: internal users read"
  ON public.slack_channels FOR SELECT
  USING (public.current_user_role() IN ('admin', 'sales', 'account_manager'));

CREATE POLICY "slack_channels: internal users insert"
  ON public.slack_channels FOR INSERT
  WITH CHECK (public.current_user_role() IN ('admin', 'sales', 'account_manager'));

CREATE POLICY "slack_channels: admin delete"
  ON public.slack_channels FOR DELETE
  USING (public.current_user_role() = 'admin');
