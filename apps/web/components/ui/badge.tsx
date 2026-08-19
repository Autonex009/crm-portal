import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        outline: "text-foreground",
        destructive: "border-transparent bg-destructive text-destructive-foreground",
        success: "border-transparent bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
        warning: "border-transparent bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
        info: "border-transparent bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",
        purple: "border-transparent bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300",
        gray: "border-transparent bg-gray-100 text-gray-600 dark:bg-gray-800/60 dark:text-gray-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };

export type LeadStatus = "new" | "contacted" | "replied" | "call_booked" | "call_done" | "converted" | "dropped";
export type DealStage = "discovery" | "site_assessment" | "quote_sent" | "negotiation" | "won" | "lost";

const LEAD_STATUS_CONFIG: Record<string, { label: string; variant: BadgeProps["variant"] }> = {
  new: { label: "New", variant: "default" },
  contacted: { label: "Contacted", variant: "info" },
  replied: { label: "Replied", variant: "purple" },
  call_booked: { label: "Call Booked", variant: "warning" },
  call_done: { label: "Call Done", variant: "secondary" },
  converted: { label: "Converted", variant: "success" },
  dropped: { label: "Dropped", variant: "destructive" },
};

function titleCase(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function LeadStatusBadge({ status }: { status: LeadStatus | string }) {
  const { label, variant } = LEAD_STATUS_CONFIG[status] ?? {
    label: status ? titleCase(String(status)) : "Unknown",
    variant: "gray" as const,
  };
  return <Badge variant={variant}>{label}</Badge>;
}

export function DealStageBadge({ stage }: { stage: DealStage | string }) {
  const map: Record<string, { label: string; variant: VariantProps<typeof badgeVariants>["variant"] }> = {
    discovery: { label: "Discovery", variant: "purple" },
    site_assessment: { label: "Site Assessment", variant: "info" },
    quote_sent: { label: "Quote Sent", variant: "info" },
    negotiation: { label: "Negotiation", variant: "warning" },
    won: { label: "Won", variant: "success" },
    lost: { label: "Lost", variant: "destructive" },
  };
  const { label, variant } = map[stage] ?? {
    label: stage ? titleCase(String(stage)) : "Unknown",
    variant: "gray" as const,
  };
  return <Badge variant={variant}>{label}</Badge>;
}
