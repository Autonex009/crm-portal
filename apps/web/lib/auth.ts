import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export interface AuthUser {
  id: string;
  email: string | null;
  role: string | null;
}

/**
 * Resolve the current user from the request's JWT.
 *
 * Uses `getClaims()` instead of `getUser()`: with JWT signing keys enabled the
 * token is verified locally (no network round-trip), which removes ~0.3s of
 * latency on every page/action. The session is already validated & refreshed by
 * `middleware.ts` on each request, so this is a fast, local read.
 *
 * Wrapped in React `cache()` so the layout and page in a single request share
 * one call instead of two — a win even if `getClaims()` still falls back to a
 * network call (i.e. before JWT signing keys are enabled).
 *
 * Returns null when there is no valid session.
 */
export const getAuthUser = cache(async (): Promise<AuthUser | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (error || !claims?.sub) return null;
  return {
    id: claims.sub as string,
    email: (claims.email as string) ?? null,
    role: (claims.role as string) ?? null,
  };
});
