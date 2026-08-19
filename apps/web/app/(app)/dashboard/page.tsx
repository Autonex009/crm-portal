import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardClient } from "./_components/dashboard-client";

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
      .limit(6),
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
          desc: `Deal is Won (${d.amount ? `$${d.amount}` : "N/A"}) but has no linked Tax Invoice`,
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

  return (
    <DashboardClient
      userName={user.email?.split("@")[0] || "User"}
      companiesCount={companies.length}
      companiesNoOutreach={companiesNoOutreach}
      weightedPipelineValue={weightedPipelineValue}
      totalPipelineValue={totalPipelineValue}
      activeDealsCount={activeDeals.length}
      openLeadsCount={openLeads.length}
      stuckLeadsCount={stuckLeads.length}
      wonDealsThisMonthCount={wonDealsThisMonth.length}
      wonAmountThisMonth={wonAmountThisMonth}
      funnel={funnel}
      attentionItems={attentionItems}
      recentActivity={recentActivity ?? []}
    />
  );
}
