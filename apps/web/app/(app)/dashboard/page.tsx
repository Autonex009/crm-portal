import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Building2, Handshake, FileText, TrendingUp, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

export const metadata = { title: "Dashboard — CRM Portal" };

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const [
    { count: companiesCount },
    { count: leadsCount },
    { data: deals },
    { data: recentActivity },
  ] = await Promise.all([
    supabase.from("companies").select("*", { count: "exact", head: true }).is("deleted_at", null),
    supabase.from("leads").select("*", { count: "exact", head: true }).is("deleted_at", null).neq("status", "lost"),
    supabase.from("deals").select("id, title, stage, amount, companies(name)").is("deleted_at", null).order("updated_at", { ascending: false }),
    supabase
      .from("activities")
      .select("id, type, body, occurred_at, entity_type, entity_id, profiles:author_id(full_name)")
      .order("occurred_at", { ascending: false })
      .limit(5),
  ]);

  const activeDeals = deals?.filter((d) => !["won", "lost"].includes(d.stage)) ?? [];
  const totalPipelineValue = activeDeals.reduce((s, d) => s + d.amount, 0);
  const wonDealsThisMonth = deals?.filter((d) => d.stage === "won") ?? [];

  const stats = [
    {
      title: "Companies",
      value: companiesCount ?? 0,
      icon: Building2,
      href: "/companies",
      color: "blue",
      suffix: "",
    },
    {
      title: "Active Deals",
      value: activeDeals.length,
      icon: Handshake,
      href: "/deals",
      color: "green",
      suffix: "",
      sub: formatCurrency(totalPipelineValue) + " pipeline",
    },
    {
      title: "Open Leads",
      value: leadsCount ?? 0,
      icon: TrendingUp,
      href: "/leads",
      color: "purple",
      suffix: "",
    },
    {
      title: "Deals Won",
      value: wonDealsThisMonth.length,
      icon: FileText,
      href: "/deals",
      color: "orange",
      suffix: "",
      sub: formatCurrency(wonDealsThisMonth.reduce((s, d) => s + d.amount, 0)) + " closed",
    },
  ] as const;

  const iconColors = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    purple: "bg-purple-100 text-purple-600",
    orange: "bg-orange-100 text-orange-600",
  };

  const activityLabels: Record<string, string> = {
    note: "left a note",
    call: "logged a call",
    email: "sent an email",
    meeting: "scheduled a meeting",
    system: "system event",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Your sales pipeline at a glance.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link
            key={stat.title}
            href={stat.href}
            className="flex flex-col gap-3 rounded-xl border bg-card p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
          >
            <div className="flex items-center justify-between">
              <div className={`rounded-lg p-2.5 ${iconColors[stat.color]}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div>
              <p className="text-3xl font-bold">{stat.value}</p>
              <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
              {"sub" in stat && stat.sub && (
                <p className="text-xs text-muted-foreground mt-0.5">{stat.sub}</p>
              )}
            </div>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 rounded-xl border bg-card">
          <div className="flex items-center justify-between p-5 border-b">
            <h2 className="font-semibold">Active Pipeline</h2>
            <Link href="/deals" className="text-sm text-primary hover:underline">View all →</Link>
          </div>
          {activeDeals.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No active deals. <Link href="/deals" className="text-primary hover:underline">Add your first deal</Link>
            </div>
          ) : (
            <div className="divide-y">
              {activeDeals.slice(0, 6).map((deal) => {
                const company = Array.isArray(deal.companies) ? deal.companies[0] : deal.companies;
                return (
                  <Link
                    key={deal.id}
                    href={`/deals/${deal.id}`}
                    className="flex items-center justify-between px-5 py-3 hover:bg-muted/30 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium">{deal.title}</p>
                      {company && (
                        <p className="text-xs text-muted-foreground">
                          {(company as { name: string }).name}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{formatCurrency(deal.amount)}</p>
                      <p className="text-xs text-muted-foreground capitalize">{deal.stage}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <div className="lg:col-span-2 rounded-xl border bg-card">
          <div className="p-5 border-b">
            <h2 className="font-semibold">Recent Activity</h2>
          </div>
          {!recentActivity?.length ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No activity yet. Start by logging notes on your deals.
            </div>
          ) : (
            <div className="divide-y">
              {recentActivity.map((activity) => {
                const author = Array.isArray(activity.profiles) ? activity.profiles[0] : activity.profiles;
                return (
                  <div key={activity.id} className="px-5 py-3">
                    <p className="text-xs text-muted-foreground mb-0.5">
                      <span className="font-medium text-foreground">
                        {(author as { full_name: string } | null)?.full_name ?? "Someone"}
                      </span>{" "}
                      {activityLabels[activity.type] ?? "did something"}
                    </p>
                    <p className="text-sm line-clamp-2">{activity.body}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
