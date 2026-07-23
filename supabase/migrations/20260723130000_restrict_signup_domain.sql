-- Migration 20260723130000: Restrict new signups to the @autonexai360.com domain.
--
-- Google sign-in lets anyone with a Google account authenticate, so we gate
-- account creation server-side. `handle_new_user()` already runs (via the
-- existing on_auth_user_created trigger) inside the signup transaction to create
-- the profile; we augment it to reject any email outside the company domain
-- BEFORE inserting. The RAISE aborts the whole transaction, so a blocked signup
-- leaves no row behind in auth.users or public.profiles.
--
-- The default role stays 'sales' and the Google-name -> full_name mapping is
-- unchanged. Idempotent via CREATE OR REPLACE (owner/grants are preserved).

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  IF NEW.email IS NULL
     OR lower(split_part(NEW.email, '@', 2)) <> 'autonexai360.com' THEN
    RAISE EXCEPTION 'Only @autonexai360.com accounts are permitted';
  END IF;

  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'sales')
  );
  RETURN NEW;
END;
$$;
