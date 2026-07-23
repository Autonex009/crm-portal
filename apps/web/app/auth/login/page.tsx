import { LoginForm } from "@/components/auth/login-form";

export const metadata = { title: "Sign In — DealBridge" };

/** Map the `?error=` codes the auth callback can redirect back with. */
function authErrorMessage(code: string): string {
  switch (code) {
    case "domain":
      return "Please sign in with your @autonexai360.com Google account.";
    case "auth_failed":
      return "Sign-in failed. Please try again.";
    default:
      return "Something went wrong. Please try again.";
  }
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const sp = await searchParams;
  const errorMessage = sp.error ? authErrorMessage(sp.error) : null;

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">DealBridge</h1>
          <p className="mt-2 text-muted-foreground">Sign in to your account</p>
        </div>

        {errorMessage && (
          <p className="rounded-md bg-destructive/10 p-3 text-center text-sm text-destructive">
            {errorMessage}
          </p>
        )}

        <LoginForm />
      </div>
    </main>
  );
}
