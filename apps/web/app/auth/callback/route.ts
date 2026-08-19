import { NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@crm/db/types/database.types";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";
  // Google/Supabase can redirect back with an error (e.g. the user cancelled).
  const providerError = searchParams.get("error");

  if (!providerError && code) {
    const cookieStore = await cookies();
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }

    // The domain restriction is enforced by a DB trigger on signup, which
    // GoTrue surfaces as a "Database error saving new user". Map that (and our
    // explicit domain message) to a friendly, specific error on the login page.
    const isDomainBlock = /database error|autonexai360/i.test(error.message);
    return NextResponse.redirect(
      `${origin}/auth/login?error=${isDomainBlock ? "domain" : "auth_failed"}`
    );
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`);
}
