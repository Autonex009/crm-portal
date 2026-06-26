import { Receipt } from "lucide-react";

export const metadata = { title: "Invoices — CRM Portal" };

export default function InvoicesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Receipt className="h-6 w-6 text-muted-foreground" />
          Invoices
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Track payments and follow-ups</p>
      </div>
      <div className="rounded-xl border bg-card p-12 text-center">
        <Receipt className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
        <p className="font-medium">Invoices coming in Phase 2</p>
        <p className="text-sm text-muted-foreground mt-1">
          Automated invoice generation, Stripe payment links, and follow-up sequences.
        </p>
      </div>
    </div>
  );
}
