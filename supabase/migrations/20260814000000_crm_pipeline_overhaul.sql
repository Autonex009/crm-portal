-- CRM Pipeline Overhaul Migration
-- Updates check constraints and adds missing fields for companies, deals, leads, and invoices

-- 1. Update Companies table schema
ALTER TABLE public.companies 
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS website text,
  ADD COLUMN IF NOT EXISTS source text,
  ADD COLUMN IF NOT EXISTS tags text[];

-- 2. Update Deals table schema & constraints
ALTER TABLE public.deals 
  ADD COLUMN IF NOT EXISTS lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS site_assessment_date date,
  ADD COLUMN IF NOT EXISTS site_assessment_location text,
  ADD COLUMN IF NOT EXISTS site_assessment_notes text,
  ADD COLUMN IF NOT EXISTS lost_reason text;

-- Migrate legacy deal stages before updating constraint
UPDATE public.deals SET stage = 'discovery' WHERE stage = 'prospect';
UPDATE public.deals SET stage = 'quote_sent' WHERE stage = 'proposal';

ALTER TABLE public.deals DROP CONSTRAINT IF EXISTS deals_stage_check;
ALTER TABLE public.deals ADD CONSTRAINT deals_stage_check 
  CHECK (stage IN ('discovery', 'site_assessment', 'quote_sent', 'negotiation', 'won', 'lost'));

-- 3. Update Leads table schema & constraints
-- Migrate legacy lead statuses before updating constraint
UPDATE public.leads SET status = 'contacted' WHERE status IN ('initial count', 'deck sent');
UPDATE public.leads SET status = 'call_booked' WHERE status = 'call scheduled';
UPDATE public.leads SET status = 'converted' WHERE status IN ('proposal sent', 'closed');
UPDATE public.leads SET status = 'dropped' WHERE status = 'not interested';

ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_status_check;
ALTER TABLE public.leads ADD CONSTRAINT leads_status_check 
  CHECK (status IN ('new', 'contacted', 'replied', 'call_booked', 'call_done', 'converted', 'dropped'));

-- 4. Update Invoices table schema
ALTER TABLE public.invoices 
  ADD COLUMN IF NOT EXISTS deal_id uuid REFERENCES public.deals(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS source_quote_id text;
