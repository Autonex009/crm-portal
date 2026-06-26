import { FileText } from "lucide-react";

export const metadata = { title: "Quotes — CRM Portal" };

export default function QuotesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <FileText className="h-6 w-6 text-muted-foreground" />
          Quotes
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your quotations and proposals</p>
      </div>
      <div className="rounded-xl border bg-card p-12 text-center">
        <FileText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
        <p className="font-medium">Quotes coming in Phase 2</p>
        <p className="text-sm text-muted-foreground mt-1">
          Full quotation builder with line items, PDF export, and approval workflows.
        </p>
      </div>
    </div>
  );
}
