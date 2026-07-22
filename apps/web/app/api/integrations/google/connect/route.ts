import crypto from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import {
  buildGoogleAuthUrl,
  OAUTH_COOKIE_PATH,
  OAUTH_STATE_COOKIE,
} from "@/lib/integrations/google";

// node:crypto (randomBytes) requires the Node runtime, not Edge.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Start the Google OAuth connect flow for the logged-in CRM user.
 * Generates a CSRF `state`, stashes it in an httpOnly cookie, and redirects to
 * Google's consent screen. The callback route validates the returned state.
 */
export async function GET(request: Request) {
  const { origin } = new URL(request.url);

  const user = await getAuthUser();
  if (!user) {
    return NextResponse.redirect(`${origin}/auth/login`);
  }

  if (!process.env.GOOGLE_CLIENT_ID) {
    return NextResponse.redirect(
      `${origin}/settings?tab=integrations&google_error=not_configured`
    );
  }

  const state = crypto.randomBytes(32).toString("hex");

  const cookieStore = await cookies();
  cookieStore.set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    // "lax" (not "strict") so the cookie rides along on Google's top-level
    // GET redirect back to us; "strict" would withhold it and break validation.
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: OAUTH_COOKIE_PATH,
    maxAge: 600, // 10 minutes to complete consent
  });

  return NextResponse.redirect(buildGoogleAuthUrl(state));
}
