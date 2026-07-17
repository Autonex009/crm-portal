"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck } from "lucide-react";

interface SampleEntry {
  actor: string;
  action: string;
  entity: string;
  when: string;
}

const SAMPLE_ENTRIES: SampleEntry[] = [
  { actor: "Karan Paigude", action: "Changed role", entity: "profiles: Priya Varma", when: "2 hours ago" },
  { actor: "Karan Paigude", action: "Disconnected integration", entity: "integration_connections: slack", when: "Yesterday" },
  { actor: "System", action: "Lead status updated", entity: "leads: Rahul Verma", when: "2 days ago" },
];

export function AuditLogCard() {
  return (
    <div className="rounded-xl border bg-card p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold">Audit log</h2>
          <p className="text-sm text-muted-foreground">
            Track sensitive changes made across your workspace — role changes, deletions, and integration events.
          </p>
        </div>
        <Badge variant="gray" className="gap-1">
          <ShieldCheck className="h-3 w-3" />
          Admin only
        </Badge>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Actor</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>When</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {SAMPLE_ENTRIES.map((entry, i) => (
              <TableRow key={i}>
                <TableCell className="text-sm font-medium">{entry.actor}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{entry.action}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{entry.entity}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{entry.when}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <p className="text-xs text-muted-foreground">
        Preview data shown — this will read from real audit events once connected.
      </p>
    </div>
  );
}
