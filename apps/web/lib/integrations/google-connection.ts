import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@crm/db/types/database.types";
import { decryptToken, encryptToken } from "@/lib/integrations/token-crypto";
import { refreshAccessToken } from "@/lib/integrations/google";

/**
 * Resolve a usable Google access token for a user's stored connection.
 *
 * Reads the encrypted tokens from `integration_connections`, returns the current
 * access token if it's still valid, otherwise refreshes it (using the stored
 * refresh token), persists the new token, and returns it. Server-only because it
 * decrypts tokens via `node:crypto`.
 *
 * Returns a discriminated union rather than throwing so callers can compose it
 * with their own result types and surface friendly, actionable messages.
 */

/** Refresh if the token expires within this window, to avoid mid-request 401s. */
const EXPIRY_BUFFER_MS = 60_000;

export type GoogleConnectionErrorCode = "not_connected" | "needs_reconnect";

export type GoogleAccessTokenResult =
  | { ok: true; accessToken: string }
  | { ok: false; code: GoogleConnectionErrorCode };

export async function getValidGoogleAccessToken(
  supabase: SupabaseClient<Database>,
  userId: string,
  opts?: { forceRefresh?: boolean }
): Promise<GoogleAccessTokenResult> {
  const { data: row, error } = await supabase
    .from("integration_connections")
    .select("access_token, refresh_token, expires_at, scope")
    .eq("user_id", userId)
    .eq("provider", "google")
    .maybeSingle();

  if (error) {
    console.error("[google-connection] read connection failed:", error);
    return { ok: false, code: "needs_reconnect" };
  }
  if (!row) {
    return { ok: false, code: "not_connected" };
  }

  const stillValid =
    row.expires_at != null &&
    Date.parse(row.expires_at) - Date.now() > EXPIRY_BUFFER_MS;

  if (stillValid && !opts?.forceRefresh) {
    return { ok: true, accessToken: decryptToken(row.access_token) };
  }

  // Need a fresh token — requires the stored refresh token.
  if (!row.refresh_token) {
    return { ok: false, code: "needs_reconnect" };
  }

  let refreshed;
  try {
    refreshed = await refreshAccessToken(decryptToken(row.refresh_token));
  } catch (err) {
    console.error("[google-connection] refresh failed:", err);
    return { ok: false, code: "needs_reconnect" };
  }

  const newExpiresAt = new Date(Date.now() + refreshed.expires_in * 1000).toISOString();
  const { error: updateError } = await supabase
    .from("integration_connections")
    .update({
      access_token: encryptToken(refreshed.access_token),
      expires_at: newExpiresAt,
      scope: refreshed.scope ?? row.scope,
    })
    .eq("user_id", userId)
    .eq("provider", "google");

  if (updateError) {
    // The token is still usable this request even if persisting it failed;
    // log and continue so the user's action doesn't break.
    console.error("[google-connection] persist refreshed token failed:", updateError);
  }

  return { ok: true, accessToken: refreshed.access_token };
}
