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

export type LeadStatus = "new" | "contacted" | "qualified" | "lost";
export type DealStage = "prospect" | "proposal" | "negotiation" | "won" | "lost";

export function LeadStatusBadge({ status }: { status: LeadStatus }) {
  const map: Record<LeadStatus, { label: string; variant: VariantProps<typeof badgeVariants>["variant"] }> = {
    new: { label: "New", variant: "info" },
    contacted: { label: "Contacted", variant: "warning" },
    qualified: { label: "Qualified", variant: "success" },
    lost: { label: "Lost", variant: "destructive" },
  };
  const { label, variant } = map[status];
  return <Badge variant={variant}>{label}</Badge>;
}

export function DealStageBadge({ stage }: { stage: DealStage }) {
  const map: Record<DealStage, { label: string; variant: VariantProps<typeof badgeVariants>["variant"] }> = {
    prospect: { label: "Prospect", variant: "gray" },
    proposal: { label: "Proposal", variant: "info" },
    negotiation: { label: "Negotiation", variant: "warning" },
    won: { label: "Won", variant: "success" },
    lost: { label: "Lost", variant: "destructive" },
  };
  const { label, variant } = map[stage];
  return <Badge variant={variant}>{label}</Badge>;
}
