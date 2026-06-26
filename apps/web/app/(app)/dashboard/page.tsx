import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Building2, Handshake, FileText, TrendingUp } from "lucide-react";

export const metadata = { title: "Dashboard — CRM Portal" };

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here&apos;s an overview of your CRM.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Companies" value="—" icon={Building2} href="/companies" color="blue" />
        <StatCard title="Active Deals" value="—" icon={Handshake} href="/deals" color="green" />
        <StatCard title="Open Quotes" value="—" icon={FileText} href="/quotes" color="purple" />
        <StatCard title="New Leads" value="—" icon={TrendingUp} href="/leads" color="orange" />
      </div>

      <div className="rounded-lg border bg-card p-6">
        <h2 className="mb-4 font-semibold">Recent Activity</h2>
        <p className="text-sm text-muted-foreground">
          Activity feed will appear here once you start adding companies, deals, and leads.
        </p>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  href,
  color,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  href: string;
  color: "blue" | "green" | "purple" | "orange";
}) {
  const iconColors = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    purple: "bg-purple-100 text-purple-600",
    orange: "bg-orange-100 text-orange-600",
  };

  return (
    <a
      href={href}
      className="flex items-center gap-4 rounded-lg border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className={`rounded-lg p-2.5 ${iconColors[color]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </a>
  );
}
