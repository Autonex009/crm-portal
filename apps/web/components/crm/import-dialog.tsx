"use client";

import { useRef, useState, useTransition } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Upload, FileSpreadsheet, Download, X } from "lucide-react";
import { importLeads, importDeals, type ImportRow } from "@/lib/actions/import";

type Entity = "leads" | "deals";

const TEMPLATES: Record<Entity, { headers: string[]; sample: (string | number)[][] }> = {
  leads: {
    headers: ["Title", "Company", "Source", "Status", "Value"],
    sample: [
      ["Enterprise SaaS Opportunity", "Acme Corp", "Website", "new", 500000],
      ["Annual Renewal", "Globex", "Referral", "contacted", 250000],
    ],
  },
  deals: {
    headers: ["Title", "Company", "Stage", "Amount", "Expected Close Date"],
    sample: [
      ["Acme — Enterprise Plan", "Acme Corp", "proposal", 1200000, "2026-09-30"],
      ["Globex Upsell", "Globex", "negotiation", 750000, "2026-08-15"],
    ],
  },
};

export function ImportDialog({ entity }: { entity: Entity }) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const label = entity === "leads" ? "Leads" : "Deals";
  const headers = rows.length > 0 ? Object.keys(rows[0]) : [];

  function reset() {
    setRows([]);
    setFileName(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleFile(file: File) {
    setParsing(true);
    try {
      const XLSX = await import("xlsx");
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: "array", cellDates: true });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const parsed = XLSX.utils.sheet_to_json<ImportRow>(sheet, { raw: false, defval: "" });
      if (parsed.length === 0) {
        toast({ title: "Empty file", description: "No rows found in the first sheet.", variant: "destructive" });
        return;
      }
      setRows(parsed);
      setFileName(file.name);
    } catch {
      toast({ title: "Could not read file", description: "Please upload a valid .xlsx, .xls or .csv file.", variant: "destructive" });
    } finally {
      setParsing(false);
    }
  }

  async function downloadTemplate() {
    const XLSX = await import("xlsx");
    const { headers: h, sample } = TEMPLATES[entity];
    const ws = XLSX.utils.aoa_to_sheet([h, ...sample]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, label);
    XLSX.writeFile(wb, `${entity}-import-template.xlsx`);
  }

  function handleImport() {
    startTransition(async () => {
      const action = entity === "leads" ? importLeads : importDeals;
      const result = await action(rows);
      if (result.success) {
        const { inserted, skipped } = result.data;
        toast({
          title: `Imported ${inserted} ${entity}`,
          description: skipped > 0 ? `${skipped} row(s) skipped (see file for missing required fields).` : undefined,
          variant: "success",
        });
        reset();
        setOpen(false);
      } else {
        toast({ title: "Import failed", description: result.error, variant: "destructive" });
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <FileSpreadsheet className="h-4 w-4" />
        Import Excel
      </Button>

      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import {label} from Excel</DialogTitle>
          <DialogDescription>
            Upload an .xlsx, .xls or .csv file. The first row must contain column headers.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-dashed p-4">
            <div className="text-sm">
              <p className="font-medium">Need the right format?</p>
              <p className="text-muted-foreground text-xs">
                {entity === "deals"
                  ? "Columns: Title, Company (required), Stage, Amount, Expected Close Date."
                  : "Columns: Title (required), Company, Source, Status, Value."}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={downloadTemplate} type="button">
              <Download className="h-4 w-4" />
              Template
            </Button>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />

          {rows.length === 0 ? (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={parsing}
              className="flex w-full flex-col items-center gap-2 rounded-lg border-2 border-dashed py-10 text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground disabled:opacity-50"
            >
              <Upload className="h-7 w-7" />
              <span className="text-sm font-medium">
                {parsing ? "Reading file…" : "Click to choose a spreadsheet"}
              </span>
            </button>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2 text-sm">
                <span className="flex items-center gap-2 font-medium">
                  <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                  {fileName}
                  <span className="text-muted-foreground font-normal">· {rows.length} rows</span>
                </span>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={reset} type="button">
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="max-h-64 overflow-auto rounded-lg border">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-muted/60">
                    <tr>
                      {headers.map((h) => (
                        <th key={h} className="px-3 py-2 text-left font-semibold whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 50).map((row, i) => (
                      <tr key={i} className="border-t">
                        {headers.map((h) => (
                          <td key={h} className="px-3 py-1.5 whitespace-nowrap text-muted-foreground">
                            {String(row[h] ?? "")}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {rows.length > 50 && (
                <p className="text-xs text-muted-foreground">Showing first 50 of {rows.length} rows.</p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" type="button" onClick={() => setOpen(false)}>Cancel</Button>
          <Button type="button" onClick={handleImport} loading={isPending} disabled={rows.length === 0}>
            Import {rows.length > 0 ? rows.length : ""} {label}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
