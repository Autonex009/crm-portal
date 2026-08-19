"use client";

import { useState } from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import {
  Building2,
  Handshake,
  FileText,
  TrendingUp,
  AlertTriangle,
  Calendar,
  Clock,
  FileCheck,
  CheckCircle2,
  ArrowUpRight,
  ArrowRight,
  BarChart3,
  Activity,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface AttentionItem {
  id: string;
  type: "call" | "stalled" | "expiring" | "invoice";
  title: string;
  desc: string;
  badge: string;
  badgeColor: "red" | "amber" | "blue";
  href: string;
}

interface ActivityItem {
  id: string;
  type: string;
  body: string;
  occurred_at: string;
  entity_type: string;
  profiles?: { full_name?: string } | { full_name?: string }[] | null;
}

interface DashboardClientProps {
  userName: string;
  companiesCount: number;
  companiesNoOutreach: number;
  weightedPipelineValue: number;
  totalPipelineValue: number;
  activeDealsCount: number;
  openLeadsCount: number;
  stuckLeadsCount: number;
  wonDealsThisMonthCount: number;
  wonAmountThisMonth: number;
  funnel: {
    new: number;
    contacted: number;
    callDone: number;
    deal: number;
    won: number;
  };
  attentionItems: AttentionItem[];
  recentActivity: ActivityItem[];
}

export function DashboardClient({
  userName,
  companiesCount,
  companiesNoOutreach,
  weightedPipelineValue,
  totalPipelineValue,
  activeDealsCount,
  openLeadsCount,
  stuckLeadsCount,
  wonDealsThisMonthCount,
  wonAmountThisMonth,
  funnel,
  attentionItems,
  recentActivity,
}: DashboardClientProps) {
  const [filterType, setFilterType] = useState<string>("all");

  const filteredAttentionItems = attentionItems.filter((item) => {
    if (filterType === "all") return true;
    return item.type === filterType;
  });

  const totalFunnelCount = funnel.new + funnel.contacted + funnel.callDone + funnel.deal + funnel.won || 1;

  const todayDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="space-y-8 pb-10">
      {/* Hero Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative overflow-hidden rounded-2xl border bg-card p-6 md:p-8 shadow-xs"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-slate-800/80 px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                <BarChart3 className="h-3.5 w-3.5 text-primary" />
                <span>Executive Command Center</span>
              </span>
              <span className="text-xs text-muted-foreground font-medium hidden sm:inline-flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {todayDate}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
              Welcome back, <span className="text-primary">{userName}</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1.5 max-w-xl">
              Here is your prioritized sales execution pulse and real-time deal pipeline analysis for today.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/leads?action=new"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-xs transition-all hover:bg-primary/90"
            >
              <span>+ Quick Lead</span>
            </Link>
            <Link
              href="/quotes/new"
              className="inline-flex items-center gap-2 rounded-xl border bg-background px-4 py-2.5 text-sm font-semibold text-foreground shadow-xs transition-all hover:bg-accent"
            >
              <span>Create Quote</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </motion.div>

      {/* KPI Metric Cards */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Companies */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
        >
          <Link
            href="/companies"
            className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border bg-card p-6 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:shadow-md hover:border-slate-400 dark:hover:border-slate-600"
          >
            <div className="flex items-center justify-between">
              <div className="rounded-xl p-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:scale-105 transition-transform border border-slate-200 dark:border-slate-700">
                <Building2 className="h-5 w-5" />
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 dark:bg-slate-800/80 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                Accounts
              </span>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-extrabold tracking-tight text-foreground">{companiesCount}</p>
              <p className="text-xs font-medium text-muted-foreground mt-0.5">Total Companies</p>
            </div>
            <div className="mt-3 flex items-center justify-between border-t pt-3 text-xs">
              <span className="text-amber-700 dark:text-amber-300 font-semibold flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> {companiesNoOutreach} need outreach
              </span>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </Link>
        </motion.div>

        {/* Card 2: Weighted Pipeline */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Link
            href="/deals"
            className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border bg-card p-6 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:shadow-md hover:border-slate-400 dark:hover:border-slate-600"
          >
            <div className="flex items-center justify-between">
              <div className="rounded-xl p-3 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 group-hover:scale-105 transition-transform border border-emerald-500/20">
                <Handshake className="h-5 w-5" />
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800">
                {activeDealsCount} Active Deals
              </span>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-extrabold tracking-tight text-foreground">{formatCurrency(weightedPipelineValue)}</p>
              <p className="text-xs font-medium text-muted-foreground mt-0.5">Weighted Pipeline Value</p>
            </div>
            <div className="mt-3 flex items-center justify-between border-t pt-3 text-xs">
              <span className="text-muted-foreground">
                Total: <strong className="text-foreground">{formatCurrency(totalPipelineValue)}</strong>
              </span>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </Link>
        </motion.div>

        {/* Card 3: Leads Needing Action */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
        >
          <Link
            href="/leads"
            className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border bg-card p-6 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:shadow-md hover:border-slate-400 dark:hover:border-slate-600"
          >
            <div className="flex items-center justify-between">
              <div className="rounded-xl p-3 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 group-hover:scale-105 transition-transform border border-indigo-500/20">
                <TrendingUp className="h-5 w-5" />
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800">
                {openLeadsCount} Open
              </span>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-extrabold tracking-tight text-foreground">{stuckLeadsCount}</p>
              <p className="text-xs font-medium text-muted-foreground mt-0.5">Leads Needing Action Today</p>
            </div>
            <div className="mt-3 flex items-center justify-between border-t pt-3 text-xs">
              <span className="text-indigo-700 dark:text-indigo-300 font-semibold">
                Calls booked / follow-ups
              </span>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </Link>
        </motion.div>

        {/* Card 4: Revenue Closed */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Link
            href="/deals"
            className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border bg-card p-6 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:shadow-md hover:border-slate-400 dark:hover:border-slate-600"
          >
            <div className="flex items-center justify-between">
              <div className="rounded-xl p-3 bg-amber-500/10 text-amber-700 dark:text-amber-300 group-hover:scale-105 transition-transform border border-amber-500/20">
                <FileText className="h-5 w-5" />
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-200 border border-amber-200 dark:border-amber-800">
                This Month
              </span>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-extrabold tracking-tight text-foreground">{wonDealsThisMonthCount} Won</p>
              <p className="text-xs font-medium text-muted-foreground mt-0.5">Revenue Closed This Month</p>
            </div>
            <div className="mt-3 flex items-center justify-between border-t pt-3 text-xs">
              <span className="text-amber-800 dark:text-amber-200 font-extrabold">
                {formatCurrency(wonAmountThisMonth)}
              </span>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </Link>
        </motion.div>
      </div>

      {/* Interactive Visual Pipeline Funnel Snapshot */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.25 }}
        className="rounded-2xl border bg-card p-6 shadow-xs"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
          <div>
            <h2 className="text-base font-bold tracking-tight text-foreground">Pipeline Conversion Velocity</h2>
            <p className="text-xs text-muted-foreground">Distribution of active entities across sales stages</p>
          </div>
          <Link href="/deals" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
            <span>View Full Pipeline</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {[
            { label: "1. New Leads", count: funnel.new, color: "bg-slate-400 dark:bg-slate-600", text: "text-slate-800 dark:text-slate-200" },
            { label: "2. Contacted", count: funnel.contacted, color: "bg-blue-400 dark:bg-blue-600", text: "text-blue-800 dark:text-blue-200" },
            { label: "3. Call Done", count: funnel.callDone, color: "bg-indigo-400 dark:bg-indigo-600", text: "text-indigo-800 dark:text-indigo-200" },
            { label: "4. Active Deal", count: funnel.deal, color: "bg-amber-400 dark:bg-amber-600", text: "text-amber-800 dark:text-amber-200" },
            { label: "5. Won", count: funnel.won, color: "bg-emerald-400 dark:bg-emerald-600", text: "text-emerald-800 dark:text-emerald-200" },
          ].map((step, idx) => {
            const pct = Math.round((step.count / totalFunnelCount) * 100);
            return (
              <div key={idx} className="flex flex-col rounded-xl border bg-muted/20 p-3.5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-muted-foreground">{step.label}</span>
                  <span className="text-xs font-bold text-foreground">{pct}%</span>
                </div>
                <p className={`text-2xl font-extrabold ${step.text}`}>{step.count}</p>
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max(pct, 8)}%` }}
                    transition={{ duration: 0.5, delay: idx * 0.1 }}
                    className={`h-full rounded-full ${step.color}`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Main Grid: Needs Attention Queue + Audit Log Stream */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Needs Attention Queue */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="lg:col-span-3 flex flex-col rounded-2xl border bg-card shadow-xs overflow-hidden"
        >
          {/* Action Center Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 border-b bg-muted/20 gap-3">
            <div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <h2 className="font-bold text-base text-foreground">Needs Attention Today</h2>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Urgent work items across leads, deals, quotes, and billing.
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {[
                { key: "all", label: `All (${attentionItems.length})` },
                { key: "call", label: "Calls" },
                { key: "stalled", label: "Stalled" },
                { key: "expiring", label: "Quotes" },
                { key: "invoice", label: "Invoices" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilterType(tab.key)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all whitespace-nowrap ${
                    filterType === tab.key
                      ? "bg-primary text-primary-foreground shadow-2xs"
                      : "bg-background text-muted-foreground border hover:bg-accent"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Attention Items List */}
          <div className="divide-y flex-1 max-h-[460px] overflow-y-auto">
            {filteredAttentionItems.length === 0 ? (
              <div className="p-12 text-center text-sm text-muted-foreground">
                <CheckCircle2 className="h-10 w-10 text-emerald-600 dark:text-emerald-400 mx-auto mb-2" />
                <p className="font-semibold text-foreground">All clear for this filter!</p>
                <p className="text-xs text-muted-foreground mt-1">No pending action items found.</p>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {filteredAttentionItems.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Link
                      href={item.href}
                      className="group flex items-center justify-between p-4 px-5 hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-start gap-3.5">
                        <div className="mt-0.5 rounded-xl p-2 bg-muted border">
                          {item.type === "call" && <Calendar className="h-4 w-4 text-amber-600 dark:text-amber-400" />}
                          {item.type === "stalled" && <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />}
                          {item.type === "expiring" && <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400" />}
                          {item.type === "invoice" && <FileCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                            {item.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={`text-xs font-semibold px-2.5 py-1 rounded-md border ${
                            item.badgeColor === "red"
                              ? "bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-200 border-rose-200 dark:border-rose-800"
                              : item.badgeColor === "amber"
                              ? "bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-200 border-amber-200 dark:border-amber-800"
                              : "bg-blue-50 text-blue-800 dark:bg-blue-950/60 dark:text-blue-200 border-blue-200 dark:border-blue-800"
                          }`}
                        >
                          {item.badge}
                        </span>
                        <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </motion.div>

        {/* Audit Stream */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
          className="lg:col-span-2 flex flex-col rounded-2xl border bg-card shadow-xs overflow-hidden"
        >
          <div className="p-5 border-b bg-muted/20 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-base text-foreground">Recent Audit & Log</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Real-time team actions & updates</p>
            </div>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </div>

          {!recentActivity?.length ? (
            <div className="p-10 text-center text-sm text-muted-foreground">
              No recent audit logs available.
            </div>
          ) : (
            <div className="divide-y flex-1 max-h-[460px] overflow-y-auto">
              {recentActivity.map((act) => {
                const author = Array.isArray(act.profiles) ? act.profiles[0] : act.profiles;
                const authorName = (author as { full_name?: string } | null)?.full_name || "System";
                return (
                  <div key={act.id} className="p-4 px-5 hover:bg-muted/10 transition-colors">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-5 w-5 border">
                          <AvatarFallback className="text-[9px] font-bold bg-muted text-foreground">
                            {authorName.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-semibold text-foreground">{authorName}</span>
                      </div>
                      <span className="text-muted-foreground text-[11px]">
                        {new Date(act.occurred_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-muted text-foreground/80 border">
                        {act.entity_type}
                      </span>
                      <span className="text-xs font-semibold text-foreground/90 capitalize">{act.type}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">{act.body}</p>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
