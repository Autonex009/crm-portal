import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  exchangeCodeForTokens,
  fetchGoogleUserInfo,
  OAUTH_COOKIE_PATH,
  OAUTH_STATE_COOKIE,
} from "@/lib/integrations/google";
import { encryptToken } from "@/lib/integrations/token-crypto";

// AES-256-GCM (node:crypto) requires the Node runtime, not Edge.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * OAuth callback: Google redirects here with `code` + `state` after consent.
 * We validate CSRF state, exchange the code for tokens, encrypt them, and store
 * the connection on the current user's row. Always redirects back to Settings
 * with a `google` / `google_error` status the UI turns into a toast.
 */
export async function GET(request: Request) {
  const { origin, searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const cookieStore = await cookies();
  const clearStateCookie = () =>
    cookieStore.set(OAUTH_STATE_COOKIE, "", { path: OAUTH_COOKIE_PATH, maxAge: 0 });

  const redirectTo = (params: string) => {
    clearStateCookie(); // state is single-use, regardless of outcome
    return NextResponse.redirect(`${origin}/settings?tab=integrations&${params}`);
  };

  // 1. User denied consent (or Google returned an error) — nothing to exchange.
  if (error) {
    return redirectTo(`google_error=${error === "access_denied" ? "access_denied" : "google_error"}`);
  }

  // 2. CSRF: the returned state must match the cookie we set on connect.
  const expectedState = cookieStore.get(OAUTH_STATE_COOKIE)?.value;
  if (!state || !expectedState || state !== expectedState) {
    return redirectTo("google_error=state_mismatch");
  }

  if (!code) {
    return redirectTo("google_error=exchange_failed");
  }

  // 3. Must still be an authenticated CRM user.
  const user = await getAuthUser();
  if (!user) {
    return redirectTo("google_error=unauthorized");
  }

  // 4. Exchange the code for tokens.
  let tokens;
  try {
    tokens = await exchangeCodeForTokens(code);
  } catch (err) {
    console.error("[google-callback] token exchange error:", err);
    return redirectTo("google_error=exchange_failed");
  }

  // 5. Identify the connected account (soft-fail: keep the connection either way).
  let email: string | null = null;
  try {
    email = (await fetchGoogleUserInfo(tokens.access_token)).email ?? null;
  } catch (err) {
    console.warn("[google-callback] userinfo lookup failed; saving without email:", err);
  }

  const expiresAt = tokens.expires_in
    ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
    : null;

  // 6. Persist via the RLS client — the insert policy is `user_id = auth.uid()`,
  // so the user can only write their own row; no service client needed.
  const supabase = await createClient();
  const { data: existing, error: readError } = await supabase
    .from("integration_connections")
    .select("id, refresh_token")
    .eq("user_id", user.id)
    .eq("provider", "google")
    .maybeSingle();

  if (readError) {
    console.error("[google-callback] read existing connection failed:", readError);
    return redirectTo("google_error=save_failed");
  }

  const payload: {
    user_id: string;
    provider: "google";
    access_token: string;
    expires_at: string | null;
    scope: string | null;
    provider_account_id: string | null;
    refresh_token?: string;
  } = {
    user_id: user.id,
    provider: "google",
    access_token: encryptToken(tokens.access_token),
    expires_at: expiresAt,
    scope: tokens.scope ?? null,
    provider_account_id: email,
  };

  // Refresh-token guard: only set it when Google actually returned one. On a
  // re-connect without a fresh refresh_token, omit the key so the stored one
  // is retained rather than nulled.
  if (tokens.refresh_token) {
    payload.refresh_token = encryptToken(tokens.refresh_token);
  }

  const { error: writeError } = existing
    ? await supabase
        .from("integration_connections")
        .update(payload)
        .eq("user_id", user.id)
        .eq("provider", "google")
    : await supabase.from("integration_connections").insert(payload);

  if (writeError) {
    console.error("[google-callback] save connection failed:", writeError);
    return redirectTo("google_error=save_failed");
  }

  return redirectTo("google=connected");
}
