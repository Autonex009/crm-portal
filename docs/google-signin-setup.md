# Google sign-in setup (domain-restricted login)

One-time, click-through setup that turns on **"Continue with Google"** on the
login screen so the team can sign up / sign in with their
**`@autonexai360.com`** account. New users are auto-created with the default
`sales` role; anyone outside the domain is blocked.

**This is authentication, and it is separate from the Google _Calendar_
integration** in [`phase-0-google-cloud-setup.md`](./phase-0-google-cloud-setup.md):

| | Calendar integration | Google sign-in (this doc) |
|---|---|---|
| Purpose | Create Calendar/Meet events on a user's calendar | Log users into DealBridge |
| Who runs OAuth | The app (`lib/integrations/google.ts`) | **Supabase Auth** (built-in Google provider) |
| Redirect URI | `…/api/integrations/google/callback` (the app) | `https://rylspyewlnbijdihurqo.supabase.co/auth/v1/callback` (Supabase) |
| Configured in | `.env.local` / Railway | **Supabase Dashboard** (+ `config.toml` for local) |
| Credentials | `GOOGLE_CLIENT_ID` / `_SECRET` | `GOOGLE_AUTH_CLIENT_ID` / `_SECRET` (local only) |

The code side is already done (login button, callback handling, and a DB
migration that enforces the domain). What remains is **console/dashboard config**,
which can't be done from code. Budget ~15 minutes.

---

## Step 1 — OAuth client in Google Cloud

Reuse the existing **DealBridge** project and its **Internal** consent screen
(see Steps 1–4 of the Calendar doc — same project, same free/Internal setup, no
new scopes needed for basic sign-in).

You can **reuse the existing `crm-portal-web` OAuth client** or create a new one.
Either way, add the **Supabase** callback to its **Authorized redirect URIs**:

```
https://rylspyewlnbijdihurqo.supabase.co/auth/v1/callback
```

> This is the Supabase project's Auth callback (`https://<project-ref>.supabase.co/auth/v1/callback`),
> **not** the app's `/auth/callback`. Google redirects to Supabase, Supabase then
> redirects to the app. Reusing the Calendar client is fine — a client can have
> multiple redirect URIs.

Copy the **Client ID** and **Client Secret**.

---

## Step 2 — Enable Google in the Supabase Dashboard (staging/prod)

The hosted project is configured here — **not** from `config.toml` (CI only runs
`supabase db push`, which doesn't push auth config).

1. Supabase Dashboard → project `rylspyewlnbijdihurqo` → **Authentication → Providers → Google**.
2. **Enable**, paste the **Client ID** and **Client Secret** from Step 1, **Save**.
3. **Authentication → URL Configuration**:
   - **Site URL** → your app's production URL (the host in `NEXT_PUBLIC_APP_URL`).
   - **Redirect URLs** → add the app callbacks (these are where Supabase sends the
     user back after login):
     ```
     https://YOUR-PRODUCTION-DOMAIN/auth/callback
     http://localhost:3000/auth/callback
     ```

> ⚠️ Staging and prod currently share this one Supabase project, so this enables
> Google sign-in for both at once.

---

## Step 3 — Local development (optional)

Only needed if you run a **local** Supabase stack (`supabase start`). The
provider block already exists in `supabase/config.toml`
(`[auth.external.google]`); supply the credentials via env:

```bash
# .env.local (repo root, gitignored)
GOOGLE_AUTH_CLIENT_ID=<client id from Step 1>
GOOGLE_AUTH_CLIENT_SECRET=<client secret from Step 1>
```

If you develop against the shared remote Supabase instead of a local stack, skip
this — Step 2 already covers it.

---

## Step 4 — How the domain restriction works

Enforced **server-side**, so it can't be bypassed from the browser:

- Migration **`supabase/migrations/20260723130000_restrict_signup_domain.sql`**
  augments `public.handle_new_user()` (which runs on every new `auth.users` row)
  to `RAISE EXCEPTION` unless the email ends in `@autonexai360.com`, *before*
  creating the profile. A blocked signup rolls back with **no orphaned row**.
- The login button also passes Google `hd=autonexai360.com`, which narrows
  Google's account chooser to the workspace — but that's only a **UX hint**; the
  migration is the real gate.
- New users are created with the default **`sales`** role. An owner/admin can
  change roles afterward in **Settings → Team**.

**To change the allowed domain**, update the literal in that migration (add a new
migration with `CREATE OR REPLACE FUNCTION public.handle_new_user()`) and the
`ALLOWED_HD` constant in `apps/web/components/auth/login-form.tsx`.

---

## Step 5 — Sanity check

- [ ] OAuth client has the **Supabase** redirect URI (`…supabase.co/auth/v1/callback`).
- [ ] Supabase Dashboard → Google provider **enabled** with client id/secret.
- [ ] Supabase **Redirect URLs** include the app's `/auth/callback` (prod + local).
- [ ] Migration `20260723130000_restrict_signup_domain.sql` applied (merged to `dev-staging`).
- [ ] Sign in with an `@autonexai360.com` Google account → lands on `/dashboard`,
      appears in Settings → Team as `sales`.
- [ ] Sign in with a non-domain Google account → bounced to the login page with the
      domain message; no user created.

---

## Notes / gotchas

- **`redirect_uri_mismatch`** from Google → the Supabase callback URI in Step 1
  doesn't byte-match. It must be exactly `https://rylspyewlnbijdihurqo.supabase.co/auth/v1/callback`.
- **Redirect back to app fails / "requested path is invalid"** → the app
  `/auth/callback` URL isn't in Supabase's **Redirect URLs** allow-list (Step 2).
- **Existing email/password login is unaffected** — the Google button is additive.
- When prod gets its **own** Supabase project, redo Step 2 there and add that
  project's `…/auth/v1/callback` to the OAuth client.
