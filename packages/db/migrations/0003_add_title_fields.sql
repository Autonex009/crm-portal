-- Migration 0003: Add title fields to deals and leads
-- Deals need a human-readable title; leads optionally too.

ALTER TABLE public.deals
  ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT 'New Deal';

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS title TEXT;
