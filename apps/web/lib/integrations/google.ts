/**
 * Google OAuth 2.0 (Authorization Code flow) helpers.
 *
 * Dependency-free — plain `fetch` against Google's public endpoints, no SDK.
 * Used by the connect/callback route handlers to let a CRM user authorize
 * access to their Google Calendar (event creation + Meet links, later phase).
 */

const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";

/** CSRF state cookie shared by the connect + callback routes. Path-scoped to the flow. */
export const OAUTH_STATE_COOKIE = "g_oauth_state";
export const OAUTH_COOKIE_PATH = "/api/integrations/google";

/**
 * Scopes requested at consent. Kept minimal: `calendar.events` lets us create/manage
 * events we own without full read access to the user's calendar.
 */
export const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "openid",
  "https://www.googleapis.com/auth/userinfo.email",
];

/**
 * The single source of truth for the redirect URI, used by BOTH the authorize
 * request and the token exchange. Google rejects the exchange unless the value
 * byte-matches the authorize call and the URI registered in the Cloud Console.
 * Prefer the explicit env var; fall back to deriving it from the app URL.
 */
export function getGoogleRedirectUri(): string {
  return (
    process.env.GOOGLE_REDIRECT_URI ??
    `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/google/callback`
  );
}

/** Build the Google consent-screen URL. `state` is an opaque CSRF token echoed back to the callback. */
export function buildGoogleAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: getGoogleRedirectUri(),
    response_type: "code",
    scope: GOOGLE_SCOPES.join(" "),
    // offline + consent => Google returns a refresh_token (needed after the ~1h
    // access token expires). prompt=consent forces it even on re-connect.
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    state,
  });
  return `${AUTH_URL}?${params.toString()}`;
}

export interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  token_type: string;
  id_token?: string;
}

/** Exchange an authorization code for tokens. Throws a sanitized error on failure. */
export async function exchangeCodeForTokens(code: string): Promise<GoogleTokenResponse> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: getGoogleRedirectUri(),
      grant_type: "authorization_code",
    }),
  });

  if (!res.ok) {
    // Log the detail server-side but throw a generic message — never surface
    // Google's raw response (which can echo request params) to the caller.
    const detail = await res.text().catch(() => "");
    console.error("[google-oauth] token exchange failed:", res.status, detail);
    throw new Error("Google token exchange failed");
  }

  return (await res.json()) as GoogleTokenResponse;
}

export interface GoogleUserInfo {
  sub: string;
  email: string;
  email_verified?: boolean;
}

/** Fetch the connected account's identity (used for `provider_account_id`). */
export async function fetchGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  const res = await fetch(USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error(`Google userinfo request failed (${res.status})`);
  }
  return (await res.json()) as GoogleUserInfo;
}
