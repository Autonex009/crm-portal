"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, usePathname } from "next/navigation";
import {
  LogOut,
  User,
  Search,
  Plus,
  Bell,
  ChevronDown,
  TrendingUp,
  FileText,
  Handshake,
  Building2,
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { CommandSearch } from "@/components/layout/command-search";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Topbar({ fullName, role }: { fullName: string; role: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  }

  // Derive breadcrumb path
  const getPageTitle = () => {
    if (!pathname || pathname === "/dashboard") return "Dashboard";
    const segment = pathname.split("/")[1];
    if (!segment) return "Dashboard";
    return segment.charAt(0).toUpperCase() + segment.slice(1);
  };

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-card/90 backdrop-blur-md px-6 shadow-xs">
        {/* Left: Breadcrumbs & Page title indicator */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <span>DealBridge</span>
            <span>/</span>
            <span className="font-semibold text-foreground">{getPageTitle()}</span>
          </div>
        </div>

        {/* Center/Right Actions */}
        <div className="flex items-center gap-3">
          {/* Cmd + K Global Search Trigger */}
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-3 rounded-lg border bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground transition-all hover:bg-accent hover:text-accent-foreground sm:w-64"
          >
            <Search className="h-3.5 w-3.5" />
            <span className="flex-1 text-left">Search CRM...</span>
            <kbd className="pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-0.5 rounded border bg-background px-1.5 font-mono text-[10px] font-medium opacity-80">
              <span className="text-xs">⌘</span>K
            </kbd>
          </button>

          {/* Quick Create Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-xs transition-opacity hover:opacity-90">
                <Plus className="h-3.5 w-3.5" />
                <span>New</span>
                <ChevronDown className="h-3 w-3 opacity-70" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="text-xs text-muted-foreground">Quick Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/leads?action=new")}>
                <TrendingUp className="mr-2 h-4 w-4 text-purple-500" />
                <span>New Lead</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/deals?action=new")}>
                <Handshake className="mr-2 h-4 w-4 text-emerald-500" />
                <span>New Deal</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/quotes/new")}>
                <FileText className="mr-2 h-4 w-4 text-amber-500" />
                <span>New Quote</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/companies")}>
                <Building2 className="mr-2 h-4 w-4 text-blue-500" />
                <span>New Company</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="h-4 w-px bg-border my-auto mx-1" />

          {/* Notification Indicator */}
          <button className="relative flex h-8 w-8 items-center justify-center rounded-lg border bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-indigo-500 ring-2 ring-background" />
          </button>

          {/* Theme Toggle */}
          <ThemeToggle />

          <div className="h-4 w-px bg-border my-auto mx-1" />

          {/* User Profile Avatar Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2.5 rounded-lg p-1 transition-colors hover:bg-accent">
                <Avatar className="h-8 w-8 border border-primary/20">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                    {getInitials(fullName)}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden text-left md:block">
                  <p className="text-xs font-semibold leading-tight text-foreground">{fullName}</p>
                  <p className="text-[10px] capitalize text-muted-foreground">{role}</p>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-semibold">{fullName}</p>
                  <p className="text-xs capitalize text-muted-foreground">Role: {role}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/settings")}>
                <User className="mr-2 h-4 w-4" />
                <span>Profile & Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Global Cmd + K Search Modal */}
      <CommandSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
