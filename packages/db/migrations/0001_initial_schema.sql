-- ============================================================
-- Migration: 0001_initial_schema
-- Creates all core tables with RLS enabled.
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────────────────────────
-- PROFILES (extends auth.users)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name     TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'sales'
                  CHECK (role IN ('admin', 'sales', 'account_manager', 'client')),
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Trigger: keep updated_at fresh
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-create profile on new auth user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'sales')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─────────────────────────────────────────────────────────────
-- HELPER: get current user role without recursion
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- ─────────────────────────────────────────────────────────────
-- COMPANIES
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.companies (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  domain      TEXT,
  industry    TEXT,
  logo_path   TEXT,
  owner_id    UUID NOT NULL REFERENCES public.profiles(id),
  deleted_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- CONTACTS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.contacts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  first_name  TEXT NOT NULL,
  last_name   TEXT NOT NULL,
  email       TEXT NOT NULL,
  phone       TEXT,
  title       TEXT,
  deleted_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_contacts_updated_at
  BEFORE UPDATE ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- LEADS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.leads (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID REFERENCES public.companies(id),
  contact_id      UUID REFERENCES public.contacts(id),
  source          TEXT,
  status          TEXT NOT NULL DEFAULT 'new'
                    CHECK (status IN ('new', 'contacted', 'qualified', 'lost')),
  assigned_to     UUID REFERENCES public.profiles(id),
  value_estimate  NUMERIC(15, 2),
  deleted_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- DEALS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.deals (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id           UUID NOT NULL REFERENCES public.companies(id),
  primary_contact_id   UUID REFERENCES public.contacts(id),
  stage                TEXT NOT NULL DEFAULT 'prospect'
                         CHECK (stage IN ('prospect', 'proposal', 'negotiation', 'won', 'lost')),
  amount               NUMERIC(15, 2) NOT NULL DEFAULT 0,
  owner_id             UUID NOT NULL REFERENCES public.profiles(id),
  expected_close_date  DATE,
  deleted_at           TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_deals_updated_at
  BEFORE UPDATE ON public.deals
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- ACTIVITIES (polymorphic timeline)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.activities (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type  TEXT NOT NULL
                 CHECK (entity_type IN ('company', 'contact', 'lead', 'deal', 'quote', 'invoice')),
  entity_id    UUID NOT NULL,
  type         TEXT NOT NULL
                 CHECK (type IN ('note', 'call', 'email', 'meeting', 'system')),
  author_id    UUID NOT NULL REFERENCES public.profiles(id),
  body         TEXT NOT NULL DEFAULT '',
  occurred_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_activities_updated_at
  BEFORE UPDATE ON public.activities
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_activities_entity ON public.activities (entity_type, entity_id);

-- ─────────────────────────────────────────────────────────────
-- AUDIT LOG
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.audit_log (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id     UUID NOT NULL REFERENCES public.profiles(id),
  action       TEXT NOT NULL,
  entity_type  TEXT NOT NULL,
  entity_id    UUID NOT NULL,
  before       JSONB,
  after        JSONB,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_audit_log_entity ON public.audit_log (entity_type, entity_id);
CREATE INDEX idx_audit_log_actor ON public.audit_log (actor_id);

-- ─────────────────────────────────────────────────────────────
-- PRODUCTS (catalog)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.products (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  description  TEXT,
  unit_price   NUMERIC(15, 4) NOT NULL DEFAULT 0,
  currency     CHAR(3) NOT NULL DEFAULT 'USD',
  tax_rate     NUMERIC(5, 2) NOT NULL DEFAULT 0,
  active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- QUOTES
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.quotes (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id          UUID NOT NULL REFERENCES public.deals(id),
  company_id       UUID NOT NULL REFERENCES public.companies(id),
  status           TEXT NOT NULL DEFAULT 'draft'
                     CHECK (status IN ('draft', 'sent', 'approved', 'rejected', 'expired')),
  current_version  INTEGER NOT NULL DEFAULT 1,
  created_by       UUID NOT NULL REFERENCES public.profiles(id),
  valid_until      DATE,
  deleted_at       TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_quotes_updated_at
  BEFORE UPDATE ON public.quotes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- QUOTE VERSIONS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.quote_versions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id        UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  version_number  INTEGER NOT NULL,
  line_items      JSONB NOT NULL DEFAULT '[]',
  subtotal        NUMERIC(15, 2) NOT NULL DEFAULT 0,
  tax             NUMERIC(15, 2) NOT NULL DEFAULT 0,
  total           NUMERIC(15, 2) NOT NULL DEFAULT 0,
  currency        CHAR(3) NOT NULL DEFAULT 'USD',
  pdf_path        TEXT,
  is_current      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (quote_id, version_number)
);

ALTER TABLE public.quote_versions ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_quote_versions_updated_at
  BEFORE UPDATE ON public.quote_versions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- QUOTE APPROVALS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.quote_approvals (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_version_id  UUID NOT NULL REFERENCES public.quote_versions(id),
  magic_link_token  TEXT NOT NULL UNIQUE,
  approved_by_name  TEXT,
  approved_by_email TEXT,
  signature_data    TEXT,
  approved_at       TIMESTAMPTZ,
  ip_address        TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.quote_approvals ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_quote_approvals_updated_at
  BEFORE UPDATE ON public.quote_approvals
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_quote_approvals_token ON public.quote_approvals (magic_link_token);

-- ─────────────────────────────────────────────────────────────
-- INVOICES (POs)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.invoices (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id            UUID NOT NULL REFERENCES public.quotes(id),
  company_id          UUID NOT NULL REFERENCES public.companies(id),
  invoice_number      TEXT NOT NULL UNIQUE,
  status              TEXT NOT NULL DEFAULT 'draft'
                        CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'void')),
  amount_due          NUMERIC(15, 2) NOT NULL DEFAULT 0,
  currency            CHAR(3) NOT NULL DEFAULT 'USD',
  due_date            DATE,
  stripe_invoice_id   TEXT,
  payment_link        TEXT,
  account_manager_id  UUID REFERENCES public.profiles(id),
  deleted_at          TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- PAYMENTS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.payments (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id                UUID NOT NULL REFERENCES public.invoices(id),
  amount                    NUMERIC(15, 2) NOT NULL,
  currency                  CHAR(3) NOT NULL DEFAULT 'USD',
  stripe_payment_intent_id  TEXT,
  status                    TEXT NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')),
  paid_at                   TIMESTAMPTZ,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- FOLLOW-UPS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.follow_ups (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id      UUID NOT NULL REFERENCES public.invoices(id),
  scheduled_for   TIMESTAMPTZ NOT NULL,
  channel         TEXT NOT NULL CHECK (channel IN ('email', 'slack')),
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'sent', 'cancelled')),
  attempt_number  INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.follow_ups ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_follow_ups_updated_at
  BEFORE UPDATE ON public.follow_ups
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_follow_ups_scheduled ON public.follow_ups (status, scheduled_for)
  WHERE status = 'pending';

-- ─────────────────────────────────────────────────────────────
-- INTEGRATION CONNECTIONS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.integration_connections (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  provider            TEXT NOT NULL CHECK (provider IN ('google', 'slack')),
  access_token        TEXT NOT NULL,  -- stored encrypted
  refresh_token       TEXT,           -- stored encrypted
  expires_at          TIMESTAMPTZ,
  scope               TEXT,
  provider_account_id TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, provider)
);

ALTER TABLE public.integration_connections ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_integration_connections_updated_at
  BEFORE UPDATE ON public.integration_connections
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- CALENDAR EVENTS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.calendar_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id         UUID REFERENCES public.deals(id),
  google_event_id TEXT NOT NULL UNIQUE,
  title           TEXT NOT NULL,
  start_at        TIMESTAMPTZ NOT NULL,
  end_at          TIMESTAMPTZ NOT NULL,
  meet_link       TEXT,
  synced_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_calendar_events_updated_at
  BEFORE UPDATE ON public.calendar_events
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- SLACK CHANNELS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.slack_channels (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id          UUID NOT NULL REFERENCES public.deals(id) UNIQUE,
  slack_channel_id TEXT NOT NULL UNIQUE,
  channel_name     TEXT NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.slack_channels ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_slack_channels_updated_at
  BEFORE UPDATE ON public.slack_channels
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
