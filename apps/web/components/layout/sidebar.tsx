"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Building2,
  Users,
  TrendingUp,
  Handshake,
  FileText,
  Receipt,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const navGroups = [
  {
    group: "Overview",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    group: "CRM & Pipeline",
    items: [
      { href: "/companies", label: "Companies", icon: Building2 },
      { href: "/contacts", label: "Contacts", icon: Users },
      { href: "/leads", label: "Leads", icon: TrendingUp },
      { href: "/deals", label: "Deals", icon: Handshake },
    ],
  },
  {
    group: "Sales & Billing",
    items: [
      { href: "/quotes", label: "Quotes", icon: FileText },
      { href: "/invoices", label: "Invoices", icon: Receipt },
    ],
  },
  {
    group: "System",
    items: [
      { href: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "relative flex h-screen flex-col border-r bg-card/95 backdrop-blur-md transition-all duration-300 z-30 select-none",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between border-b px-4">
        <Link href="/dashboard" className="flex items-center gap-2.5 overflow-hidden">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl overflow-hidden border bg-background shadow-xs">
            <img src="/autonex_ai_logo.jpeg" alt="Autonex AI" className="h-full w-full object-cover" />
          </div>
          {!collapsed && (
            <div className="flex flex-col transition-opacity duration-200">
              <span className="text-base font-bold tracking-tight text-foreground">
                DealBridge
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                CRM Portal
              </span>
            </div>
          )}
        </Link>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex h-7 w-7 items-center justify-center rounded-lg border bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation items */}
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
        {navGroups.map((group, groupIdx) => (
          <div key={groupIdx} className="space-y-1">
            {!collapsed && (
              <h3 className="px-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70 mb-1.5">
                {group.group}
              </h3>
            )}
            {group.items.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href || (href !== "/dashboard" && pathname?.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  title={collapsed ? label : undefined}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                    isActive
                      ? "bg-primary text-primary-foreground font-semibold shadow-sm shadow-primary/30"
                      : "text-muted-foreground hover:bg-accent/80 hover:text-accent-foreground"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0 transition-transform duration-150 group-hover:scale-110",
                      isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
                    )}
                  />
                  {!collapsed && (
                    <span className="truncate flex-1">{label}</span>
                  )}
                  {isActive && !collapsed && (
                    <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer workspace info */}
      {!collapsed && (
        <div className="border-t p-3.5 bg-muted/20">
          <div className="flex items-center gap-2.5 rounded-lg border bg-card/60 p-2.5">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <div className="flex flex-col text-xs">
              <span className="font-semibold text-foreground">Autonex Workspace</span>
              <span className="text-[11px] text-muted-foreground">Pro Plan · Active</span>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
