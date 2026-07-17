"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

interface NotificationRow {
  key: string;
  label: string;
  description: string;
  email: boolean;
  inApp: boolean;
}

const DEFAULT_ROWS: NotificationRow[] = [
  {
    key: "follow_up_due",
    label: "Follow-up due",
    description: "A lead's scheduled follow-up date has arrived.",
    email: true,
    inApp: true,
  },
  {
    key: "deal_stage_changed",
    label: "Deal stage changed",
    description: "A deal you own moves to a new pipeline stage.",
    email: true,
    inApp: true,
  },
  {
    key: "lead_assigned",
    label: "Lead assigned",
    description: "A new lead is assigned to you.",
    email: true,
    inApp: true,
  },
];

function ToggleCell({ active, onClick }: { active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      onClick={onClick}
      className={cn(
        "relative h-5 w-9 shrink-0 rounded-full transition-colors",
        active ? "bg-primary" : "bg-muted-foreground/25"
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 h-4 w-4 rounded-full bg-background shadow transition-transform",
          active ? "translate-x-4 left-0.5" : "left-0.5"
        )}
      />
    </button>
  );
}

export function NotificationsCard() {
  const [rows, setRows] = useState(DEFAULT_ROWS);

  function toggle(key: string, field: "email" | "inApp") {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, [field]: !r[field] } : r)));
  }

  function handleSave() {
    toast({
      title: "Not connected yet",
      description: "Notification preferences are UI-only for now — saving will be wired up to the backend later.",
    });
  }

  return (
    <div className="rounded-xl border bg-card p-6 space-y-6">
      <div>
        <h2 className="font-semibold">Notifications</h2>
        <p className="text-sm text-muted-foreground">
          Choose how you're notified about activity that involves you.
        </p>
      </div>

      <div className="divide-y rounded-lg border">
        <div className="grid grid-cols-[1fr_auto_auto] items-center gap-4 p-3 text-xs font-medium text-muted-foreground">
          <span />
          <span className="w-9 text-center">Email</span>
          <span className="w-9 text-center">In-app</span>
        </div>
        {rows.map((row) => (
          <div key={row.key} className="grid grid-cols-[1fr_auto_auto] items-center gap-4 p-4">
            <div>
              <p className="text-sm font-medium">{row.label}</p>
              <p className="text-xs text-muted-foreground">{row.description}</p>
            </div>
            <div className="flex w-9 justify-center">
              <ToggleCell active={row.email} onClick={() => toggle(row.key, "email")} />
            </div>
            <div className="flex w-9 justify-center">
              <ToggleCell active={row.inApp} onClick={() => toggle(row.key, "inApp")} />
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave}>Save changes</Button>
      </div>
    </div>
  );
}
