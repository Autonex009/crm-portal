"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  LayoutDashboard,
  Building2,
  Users,
  TrendingUp,
  Handshake,
  FileText,
  Receipt,
  Settings,
  PlusCircle,
  Search,
} from "lucide-react";

interface CommandSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandSearch({ open, onOpenChange }: CommandSearchProps) {
  const router = useRouter();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  const runCommand = React.useCallback(
    (command: () => void) => {
      onOpenChange(false);
      command();
    },
    [onOpenChange]
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-background/60 backdrop-blur-sm animate-in fade-in-0"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-xl border bg-card text-card-foreground shadow-2xl animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <Command className="w-full">
          <div className="flex items-center border-b px-3.5 py-3">
            <Search className="mr-2.5 h-4 w-4 shrink-0 opacity-50" />
            <Command.Input
              placeholder="Type a command or search page..."
              className="flex w-full rounded-md bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              autoFocus
            />
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
              ESC
            </kbd>
          </div>

          <Command.List className="max-h-[320px] overflow-y-auto p-2 text-sm">
            <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
              No results found.
            </Command.Empty>

            <Command.Group heading="Navigation" className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <Command.Item
                onSelect={() => runCommand(() => router.push("/dashboard"))}
                className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground aria-selected:bg-accent aria-selected:text-accent-foreground"
              >
                <LayoutDashboard className="h-4 w-4 text-indigo-500" />
                <span>Dashboard</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push("/companies"))}
                className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground aria-selected:bg-accent aria-selected:text-accent-foreground"
              >
                <Building2 className="h-4 w-4 text-blue-500" />
                <span>Companies</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push("/contacts"))}
                className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground aria-selected:bg-accent aria-selected:text-accent-foreground"
              >
                <Users className="h-4 w-4 text-teal-500" />
                <span>Contacts</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push("/leads"))}
                className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground aria-selected:bg-accent aria-selected:text-accent-foreground"
              >
                <TrendingUp className="h-4 w-4 text-purple-500" />
                <span>Leads</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push("/deals"))}
                className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground aria-selected:bg-accent aria-selected:text-accent-foreground"
              >
                <Handshake className="h-4 w-4 text-emerald-500" />
                <span>Deals Pipeline</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push("/quotes"))}
                className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground aria-selected:bg-accent aria-selected:text-accent-foreground"
              >
                <FileText className="h-4 w-4 text-amber-500" />
                <span>Quotes Workbench</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push("/invoices"))}
                className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground aria-selected:bg-accent aria-selected:text-accent-foreground"
              >
                <Receipt className="h-4 w-4 text-rose-500" />
                <span>Tax Invoices</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push("/settings"))}
                className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground aria-selected:bg-accent aria-selected:text-accent-foreground"
              >
                <Settings className="h-4 w-4 text-slate-500" />
                <span>Settings</span>
              </Command.Item>
            </Command.Group>

            <Command.Separator className="my-1.5 h-px bg-border" />

            <Command.Group heading="Quick Actions" className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <Command.Item
                onSelect={() => runCommand(() => router.push("/leads?action=new"))}
                className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground aria-selected:bg-accent aria-selected:text-accent-foreground"
              >
                <PlusCircle className="h-4 w-4 text-primary" />
                <span>Create New Lead</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push("/quotes/new"))}
                className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground aria-selected:bg-accent aria-selected:text-accent-foreground"
              >
                <PlusCircle className="h-4 w-4 text-primary" />
                <span>Generate New Quote</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push("/deals?action=new"))}
                className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground aria-selected:bg-accent aria-selected:text-accent-foreground"
              >
                <PlusCircle className="h-4 w-4 text-primary" />
                <span>Add Deal to Pipeline</span>
              </Command.Item>
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
