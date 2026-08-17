import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Building2, Handshake, FileText, TrendingUp, AlertTriangle, Calendar, Clock, FileCheck, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

export const metadata = { title: "Dashboard — DealBridge" };

const STAGE_DEFAULT_PROBABILITY: Record<string, number> = {
  discovery: 20,
  site_assessment: 40,
  quote_sent: 60,
  negotiation: 80,
  won: 100,
  lost: 0,
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const user = await getAuthUser();
  if (!user) redirect("/auth/login");

  const [
    { data: companiesData },
    { data: leadsData },
    { data: dealsData },
    { data: quotesData },
    { data: invoicesData },
    { data: recentActivity },
  ] = await Promise.all([
    supabase.from("companies").select("id, name, created_at, updated_at").is("deleted_at", null).is("archived_at", null),
    supabase.from("leads").select("*").is("deleted_at", null).is("archived_at", null),
    supabase.from("deals").select("id, title, stage, amount, probability, next_action, updated_at, created_at, companies(name)").is("deleted_at", null),
    supabase.from("quotes").select("id, deal_id, status, valid_until").is("deleted_at", null),
    supabase.from("invoices").select("id, deal_id, status, amount_due").is("deleted_at", null),
    supabase
      .from("activities")
      .select("id, type, body, occurred_at, entity_type, entity_id, profiles:author_id(full_name)")
      .order("occurred_at", { ascending: false })
      .limit(5),
  ]);

  const companies = companiesData ?? [];
  const leads = leadsData ?? [];
  const deals = dealsData ?? [];
  const quotes = quotesData ?? [];
  const invoices = invoicesData ?? [];

  // Metrics computation
  const activeDeals = deals.filter((d) => !["won", "lost"].includes(d.stage));
  const totalPipelineValue = activeDeals.reduce((s, d) => s + (d.amount || 0), 0);
  const weightedPipelineValue = activeDeals.reduce((s, d) => {
    const p = d.probability ?? STAGE_DEFAULT_PROBABILITY[d.stage] ?? 0;
    return s + (d.amount || 0) * (p / 100);
  }, 0);

  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000);
  const twoDaysFromNow = new Date(Date.now() + 2 * 86400000);

  // Won deals this month
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const wonDealsThisMonth = deals.filter((d) => {
    if (d.stage !== "won") return false;
    const dt = new Date(d.updated_at || d.created_at);
    return dt.getMonth() === currentMonth && dt.getFullYear() === currentYear;
  });
  const wonAmountThisMonth = wonDealsThisMonth.reduce((s, d) => s + (d.amount || 0), 0);

  // Leads needing action
  const openLeads = leads.filter((l) => !["converted", "dropped"].includes(l.status));
  const stuckLeads = leads.filter(
    (l) => l.status === "call_booked" || (l.next_follow_up_date && l.next_follow_up_date <= todayStr)
  );

  // Companies without active outreach
  const companiesWithLeads = new Set(leads.map((l) => l.company_id).filter(Boolean));
  const companiesNoOutreach = companies.filter((c) => !companiesWithLeads.has(c.id)).length;

  // Build "Needs Attention Today" items
  const attentionItems: Array<{
    id: string;
    type: "call" | "stalled" | "expiring" | "invoice";
    title: string;
    desc: string;
    badge: string;
    badgeColor: "red" | "amber" | "blue";
    href: string;
  }> = [];

  // 1. Calls due today or overdue
  leads.forEach((l) => {
    if (l.next_follow_up_date && l.next_follow_up_date <= todayStr && l.status !== "converted" && l.status !== "dropped") {
      const isOverdue = l.next_follow_up_date < todayStr;
      attentionItems.push({
        id: `lead-call-${l.id}`,
        type: "call",
        title: l.contact_name || l.title || "Scheduled Call",
        desc: `Call due ${isOverdue ? `overdue (${l.next_follow_up_date})` : "today"} — ${l.company_id ? "Company Lead" : "Direct Lead"}`,
        badge: isOverdue ? "Overdue Call" : "Call Due Today",
        badgeColor: isOverdue ? "red" : "amber",
        href: "/leads",
      });
    }
  });

  // 2. Stalled Deals (no update in 7+ days)
  activeDeals.forEach((d) => {
    const updatedAt = new Date(d.updated_at || d.created_at);
    if (updatedAt < sevenDaysAgo) {
      const idleDays = Math.floor((Date.now() - updatedAt.getTime()) / 86400000);
      attentionItems.push({
        id: `deal-stalled-${d.id}`,
        type: "stalled",
        title: d.title,
        desc: `No logged activity for ${idleDays} days in stage "${d.stage.replace("_", " ")}"`,
        badge: `${idleDays}d Idle`,
        badgeColor: "amber",
        href: `/deals/${d.id}`,
      });
    }
  });

  // 3. Expiring Quotes (within 48h)
  quotes.forEach((q) => {
    if (q.valid_until && q.status !== "approved" && q.status !== "rejected") {
      const validUntil = new Date(q.valid_until);
      if (validUntil <= twoDaysFromNow) {
        attentionItems.push({
          id: `quote-expiring-${q.id}`,
          type: "expiring",
          title: `Quote #${q.id.slice(0, 8)}`,
          desc: `Quote expires on ${q.valid_until} with no accepted status`,
          badge: "Expiring Soon",
          badgeColor: "red",
          href: "/quotes",
        });
      }
    }
  });

  // 4. Missing Invoices for Won deals
  const dealsWithInvoice = new Set(invoices.map((inv) => inv.deal_id).filter(Boolean));
  deals
    .filter((d) => d.stage === "won")
    .forEach((d) => {
      if (!dealsWithInvoice.has(d.id)) {
        attentionItems.push({
          id: `missing-inv-${d.id}`,
          type: "invoice",
          title: d.title,
          desc: `Deal is Won (${formatCurrency(d.amount)}) but has no linked Tax Invoice`,
          badge: "Invoice Missing",
          badgeColor: "blue",
          href: "/invoices",
        });
      }
    });

  // Funnel counts
  const funnel = {
    new: leads.filter((l) => l.status === "new").length,
    contacted: leads.filter((l) => l.status === "contacted" || l.status === "replied").length,
    callDone: leads.filter((l) => l.status === "call_done" || l.status === "call_booked").length,
    deal: deals.filter((d) => d.stage !== "won" && d.stage !== "lost").length,
    won: deals.filter((d) => d.stage === "won").length,
  };

  const badgeStyles = {
    red: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 border-red-200 dark:border-red-900",
    amber: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-900",
    blue: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200 dark:border-blue-900",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Executive Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Prioritized sales execution and real-time pipeline performance.
        </p>
      </div>

      {/* Reframed Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          href="/companies"
          className="flex flex-col gap-2 rounded-xl border bg-card p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
        >
          <div className="flex items-center justify-between">
            <div className="rounded-lg p-2.5 bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
              <Building2 className="h-5 w-5" />
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
              Accounts
            </span>
          </div>
          <div>
            <p className="text-3xl font-bold">{companies.length}</p>
            <p className="text-sm font-medium text-muted-foreground">Total Companies</p>
            <p className="text-xs text-amber-600 dark:text-amber-400 font-medium mt-1">
              {companiesNoOutreach} have no active outreach
            </p>
          </div>
        </Link>

        <Link
          href="/deals"
          className="flex flex-col gap-2 rounded-xl border bg-card p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
        >
          <div className="flex items-center justify-between">
            <div className="rounded-lg p-2.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
              <Handshake className="h-5 w-5" />
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              {activeDeals.length} Active
            </span>
          </div>
          <div>
            <p className="text-3xl font-bold">{formatCurrency(weightedPipelineValue)}</p>
            <p className="text-sm font-medium text-muted-foreground">Weighted Pipeline</p>
            <p className="text-xs text-muted-foreground mt-1">
              {formatCurrency(totalPipelineValue)} total value
            </p>
          </div>
        </Link>

        <Link
          href="/leads"
          className="flex flex-col gap-2 rounded-xl border bg-card p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
        >
          <div className="flex items-center justify-between">
            <div className="rounded-lg p-2.5 bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
              <TrendingUp className="h-5 w-5" />
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
              {openLeads.length} Open
            </span>
          </div>
          <div>
            <p className="text-3xl font-bold">{stuckLeads.length}</p>
            <p className="text-sm font-medium text-muted-foreground">Leads Needing Action</p>
            <p className="text-xs text-purple-600 dark:text-purple-400 font-medium mt-1">
              Call booked / follow-up due
            </p>
          </div>
        </Link>

        <Link
          href="/deals"
          className="flex flex-col gap-2 rounded-xl border bg-card p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
        >
          <div className="flex items-center justify-between">
            <div className="rounded-lg p-2.5 bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-400">
              <FileText className="h-5 w-5" />
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300">
              This Month
            </span>
          </div>
          <div>
            <p className="text-3xl font-bold">{wonDealsThisMonth.length} Won</p>
            <p className="text-sm font-medium text-muted-foreground">Revenue Closed</p>
            <p className="text-xs text-orange-600 dark:text-orange-400 font-semibold mt-1">
              {formatCurrency(wonAmountThisMonth)}
            </p>
          </div>
        </Link>
      </div>

      {/* Compressed Funnel Snapshot Strip */}
      <div className="rounded-xl border bg-card p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pipeline Funnel Snapshot</h2>
          <span className="text-xs text-muted-foreground">Conversion velocity</span>
        </div>
        <div className="grid grid-cols-5 gap-2 text-center divide-x">
          <div className="px-2">
            <p className="text-lg font-bold text-slate-700 dark:text-slate-200">{funnel.new}</p>
            <p className="text-xs font-medium text-muted-foreground">1. New</p>
          </div>
          <div className="px-2">
            <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{funnel.contacted}</p>
            <p className="text-xs font-medium text-muted-foreground">2. Contacted</p>
          </div>
          <div className="px-2">
            <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{funnel.callDone}</p>
            <p className="text-xs font-medium text-muted-foreground">3. Call Done</p>
          </div>
          <div className="px-2">
            <p className="text-lg font-bold text-purple-600 dark:text-purple-400">{funnel.deal}</p>
            <p className="text-xs font-medium text-muted-foreground">4. Active Deal</p>
          </div>
          <div className="px-2">
            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{funnel.won}</p>
            <p className="text-xs font-medium text-muted-foreground">5. Won 🏆</p>
          </div>
        </div>
      </div>

      {/* Main Grid: Needs Attention Queue + Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Needs Attention Today Work Queue */}
        <div className="lg:col-span-3 rounded-xl border bg-card overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b bg-muted/20">
            <div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <h2 className="font-semibold text-base">Needs Attention Today</h2>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Action items across leads, deals, quotes, and billing.
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
              {attentionItems.length} items
            </span>
          </div>

          {attentionItems.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">
              <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
              All clear! No urgent calls, stalled deals, or pending invoices needing action today.
            </div>
          ) : (
            <div className="divide-y max-h-[420px] overflow-y-auto">
              {attentionItems.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {item.type === "call" && <Calendar className="h-4 w-4 text-amber-600" />}
                      {item.type === "stalled" && <Clock className="h-4 w-4 text-amber-600" />}
                      {item.type === "expiring" && <AlertTriangle className="h-4 w-4 text-red-600" />}
                      {item.type === "invoice" && <FileCheck className="h-4 w-4 text-blue-600" />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{item.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-md border ${badgeStyles[item.badgeColor]}`}
                  >
                    {item.badge}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity Panel */}
        <div className="lg:col-span-2 rounded-xl border bg-card overflow-hidden">
          <div className="p-5 border-b bg-muted/20">
            <h2 className="font-semibold text-base">Recent Audit & Log</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Latest system & team events</p>
          </div>
          {!recentActivity?.length ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No activity logged yet.
            </div>
          ) : (
            <div className="divide-y max-h-[420px] overflow-y-auto">
              {recentActivity.map((activity) => {
                const author = Array.isArray(activity.profiles) ? activity.profiles[0] : activity.profiles;
                return (
                  <div key={activity.id} className="px-5 py-3.5">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                      <span className="font-medium text-foreground">
                        {(author as { full_name: string } | null)?.full_name ?? "System"}
                      </span>
                      <span>
                        {new Date(activity.occurred_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground capitalize font-semibold mb-0.5">
                      {activity.entity_type} · {activity.type}
                    </p>
                    <p className="text-sm line-clamp-2 text-foreground/90">{activity.body}</p>
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
