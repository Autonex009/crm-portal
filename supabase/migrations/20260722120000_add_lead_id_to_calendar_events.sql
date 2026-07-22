-- Migration 20260722120000: Link calendar_events to leads
-- Adds calendar_events.lead_id (FK -> leads, ON DELETE SET NULL) + index so a
-- scheduled Google Meet can be tied to the lead it was booked with.
-- No RLS change: calendar_events policies are role-based (current_user_role())
-- and a new nullable column does not affect insert/read/update authorization.

-- 1. Nullable column
ALTER TABLE public.calendar_events
  ADD COLUMN IF NOT EXISTS lead_id uuid;

-- 2. FK (Postgres has no ADD CONSTRAINT IF NOT EXISTS; guard for idempotency).
--    ON DELETE SET NULL: deleting/hard-deleting a lead keeps the meeting row
--    but detaches it (consistent with deal_id being nullable).
DO $$ BEGIN
  ALTER TABLE public.calendar_events
    ADD CONSTRAINT calendar_events_lead_id_fkey
    FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. Index for lookups by lead
CREATE INDEX IF NOT EXISTS calendar_events_lead_id_idx
  ON public.calendar_events (lead_id);
