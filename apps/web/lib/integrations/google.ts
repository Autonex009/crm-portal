/**
 * Google OAuth 2.0 + Calendar helpers.
 *
 * Dependency-free — plain `fetch` against Google's public endpoints, no SDK.
 * Covers the OAuth connect/callback flow (authorize URL, code exchange,
 * userinfo), token refresh, and Calendar event creation (with Meet links).
 *
 * Keep this module edge-safe: NO node imports (e.g. `token-crypto`). Callers
 * that need to decrypt stored tokens do that in a server-only module and pass a
 * plaintext access token in here.
 */

const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";
const CALENDAR_API = "https://www.googleapis.com/calendar/v3";

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

export interface GoogleRefreshResponse {
  access_token: string;
  expires_in: number;
  scope?: string;
  token_type?: string;
}

/**
 * Exchange a stored refresh token for a fresh access token.
 *
 * Google does NOT return a new refresh token here — the caller keeps the one it
 * already has. A `400 invalid_grant` means the refresh token was revoked or
 * expired: the caller should treat that as "needs reconnect".
 */
export async function refreshAccessToken(refreshToken: string): Promise<GoogleRefreshResponse> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error("[google-oauth] token refresh failed:", res.status, detail);
    throw new Error("Google token refresh failed");
  }

  return (await res.json()) as GoogleRefreshResponse;
}

/** Error carrying the HTTP status from a Google API call so callers can branch on 401/403. */
export class GoogleApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "GoogleApiError";
  }
}

export interface CreateCalendarEventParams {
  title: string;
  description?: string;
  /** RFC3339 instant, e.g. "2026-07-22T10:00:00.000Z". */
  startISO: string;
  /** RFC3339 instant. */
  endISO: string;
  /** IANA time zone, e.g. "Asia/Kolkata" — controls how Google displays the event. */
  timeZone: string;
  /** Attendee emails; may be empty (organizer-only meeting). */
  attendeeEmails: string[];
  /** Idempotency key for the Meet conference creation. */
  requestId: string;
}

export interface CreateCalendarEventResult {
  id: string;
  meetLink: string | null;
  htmlLink: string | null;
}

/**
 * Create an event with a Google Meet link on the token owner's PRIMARY calendar.
 *
 * `conferenceDataVersion=1` is what makes Google generate the Meet link; without
 * it the `conferenceData.createRequest` is ignored. `sendUpdates=all` makes
 * Google email the invite + Meet link to attendees.
 */
export async function createCalendarEvent(
  accessToken: string,
  params: CreateCalendarEventParams
): Promise<CreateCalendarEventResult> {
  const body: Record<string, unknown> = {
    summary: params.title,
    start: { dateTime: params.startISO, timeZone: params.timeZone },
    end: { dateTime: params.endISO, timeZone: params.timeZone },
    conferenceData: {
      createRequest: {
        requestId: params.requestId,
        conferenceSolutionKey: { type: "hangoutsMeet" },
      },
    },
  };
  if (params.description) body.description = params.description;
  if (params.attendeeEmails.length > 0) {
    body.attendees = params.attendeeEmails.map((email) => ({ email }));
  }

  const res = await fetch(
    `${CALENDAR_API}/calendars/primary/events?conferenceDataVersion=1&sendUpdates=all`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error("[google-calendar] event creation failed:", res.status, detail);
    throw new GoogleApiError(res.status, "Google Calendar event creation failed");
  }

  const event = (await res.json()) as {
    id: string;
    hangoutLink?: string;
    htmlLink?: string;
    conferenceData?: { entryPoints?: Array<{ entryPointType?: string; uri?: string }> };
  };

  const videoEntry = event.conferenceData?.entryPoints?.find(
    (e) => e.entryPointType === "video"
  );
  const meetLink = event.hangoutLink ?? videoEntry?.uri ?? null;

  return { id: event.id, meetLink, htmlLink: event.htmlLink ?? null };
}
