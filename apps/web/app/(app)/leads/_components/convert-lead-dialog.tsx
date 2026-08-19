"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { convertLeadToDeal } from "@/lib/actions/leads";
import { toast } from "@/components/ui/use-toast";
import { ArrowRight, Sparkles } from "lucide-react";

interface LeadToConvert {
  id: string;
  title: string | null;
  contact_name: string | null;
  company_name: string | null;
  value_estimate: number | null;
  notes: string | null;
}

export function ConvertLeadDialog({
  lead,
  onOpenChange,
}: {
  lead: LeadToConvert | null;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const defaultTitle = lead
    ? lead.title || `${lead.company_name || lead.contact_name || "New"} Deal`
    : "";
  const defaultAmount = lead?.value_estimate ?? 1000000;

  const [title, setTitle] = useState(defaultTitle);
  const [amount, setAmount] = useState(defaultAmount.toString());
  const [closeDate, setCloseDate] = useState(
    new Date(Date.now() + 86400000 * 30).toISOString().split("T")[0]
  );
  const [notes, setNotes] = useState(lead?.notes ?? "");

  if (!lead) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!lead) return;

    startTransition(async () => {
      const result = await convertLeadToDeal(lead.id, {
        title,
        amount: Number(amount) || 0,
        expected_close_date: closeDate,
        notes,
      });

      if (result.success) {
        toast({
          title: "Lead Converted to Deal! 🎉",
          description: "New deal created in Discovery stage.",
          variant: "success",
        });
        onOpenChange(false);
        router.push(`/deals/${result.data.dealId}`);
      } else {
        toast({
          title: "Conversion Failed",
          description: result.error,
          variant: "destructive",
        });
      }
    });
  }

  return (
    <Dialog open={!!lead} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <Sparkles className="h-5 w-5 text-amber-500" />
              Convert Lead → Deal
            </DialogTitle>
            <DialogDescription>
              Transition <span className="font-semibold text-foreground">{lead.contact_name || lead.title}</span> to an active sales Deal in the <strong>Discovery</strong> stage.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-1.5">
              <Label htmlFor="deal-title">Deal Title *</Label>
              <Input
                id="deal-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Acme Corp — Commercial Fleet Automation"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="deal-amount">Target Deal Value (₹)</Label>
                <Input
                  id="deal-amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="1000000"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="close-date">Expected Close Date</Label>
                <Input
                  id="close-date"
                  type="date"
                  value={closeDate}
                  onChange={(e) => setCloseDate(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes">Initial Discovery Notes</Label>
              <Textarea
                id="notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Enter key customer requirements, budget constraints, or site assessment notes..."
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
              {isPending ? "Converting..." : "Convert Lead Now"}
              <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
