import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const metadata = { title: "Dashboard — CRM Portal" };

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: rawProfile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .maybeSingle();

  const profile = rawProfile as { full_name: string; role: string } | null;

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">
        Welcome back, {profile?.full_name ?? user.email ?? "User"}
      </h1>
      <p className="mt-2 text-muted-foreground capitalize">
        Role: {profile?.role ?? "—"}
      </p>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <StatCard title="Companies" value="—" href="/companies" />
        <StatCard title="Active Deals" value="—" href="/deals" />
        <StatCard title="Open Quotes" value="—" href="/quotes" />
      </div>
    </main>
  );
}

function StatCard({
  title,
  value,
  href,
}: {
  title: string;
  value: string;
  href: string;
}) {
  return (
    <a
      href={href}
      className="rounded-lg border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
    >
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
    </a>
  );
}
