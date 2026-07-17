"use client";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Download, FileJson, FileSpreadsheet } from "lucide-react";

const EXPORTS = [
  { key: "companies", label: "Companies & Contacts" },
  { key: "leads", label: "Leads" },
  { key: "deals", label: "Deals" },
  { key: "quotes-invoices", label: "Quotes & Invoices" },
];

export function DataManagementCard() {
  function handleExport(label: string, format: "csv" | "json") {
    toast({
      title: "Not connected yet",
      description: `Exporting ${label} as ${format.toUpperCase()} will be wired up to the backend later.`,
    });
  }

  return (
    <div className="rounded-xl border bg-card p-6 space-y-6">
      <div>
        <h2 className="font-semibold">Data export</h2>
        <p className="text-sm text-muted-foreground">
          Download a copy of your workspace data at any time.
        </p>
      </div>

      <div className="divide-y rounded-lg border">
        {EXPORTS.map(({ key, label }) => (
          <div key={key} className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted text-muted-foreground">
                <Download className="h-4 w-4" />
              </div>
              <p className="text-sm font-medium">{label}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => handleExport(label, "csv")}>
                <FileSpreadsheet className="h-4 w-4" />
                CSV
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleExport(label, "json")}>
                <FileJson className="h-4 w-4" />
                JSON
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
