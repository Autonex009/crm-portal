"use client";

import { useState, useTransition } from "react";
import {
  Sheet, SheetContent, SheetHeader, SheetBody, SheetFooter,
  SheetTitle, SheetDescription, SheetClose,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createDeal, updateDeal } from "@/lib/actions/deals";
import { toast } from "@/components/ui/use-toast";
import { Plus } from "lucide-react";

type DealStage = "prospect" | "proposal" | "negotiation" | "won" | "lost";

interface Deal {
  id: string;
  title: string;
  company_id: string;
  primary_contact_id: string | null;
  stage: DealStage;
  amount: number;
  expected_close_date: string | null;
}

interface Company { id: string; name: string }
interface Contact { id: string; first_name: string; last_name: string }

interface DealSheetProps {
  deal?: Deal;
  companies?: Company[];
  contacts?: Contact[];
  defaultStage?: DealStage;
  trigger?: React.ReactNode;
}

export function DealSheet({ deal, companies, contacts, defaultStage = "prospect", trigger }: DealSheetProps) {
  const [open, setOpen] = useState(false);
  const [stage, setStage] = useState<DealStage>(deal?.stage ?? defaultStage);
  const [companyId, setCompanyId] = useState(deal?.company_id ?? "");
  const [contactId, setContactId] = useState(deal?.primary_contact_id ?? "");
  const [isPending, startTransition] = useTransition();
  const isEdit = !!deal;

  const relevantContacts = companyId
    ? contacts?.filter((_) => true) ?? []
    : contacts ?? [];

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("stage", stage);
    formData.set("company_id", companyId);
    if (contactId) formData.set("primary_contact_id", contactId);

    startTransition(async () => {
      const result = isEdit
        ? await updateDeal(deal.id, formData)
        : await createDeal(formData);

      if (result.success) {
        toast({ title: isEdit ? "Deal updated" : "Deal created", variant: "success" });
        setOpen(false);
      } else {
        toast({ title: "Error", description: result.error, variant: "destructive" });
      }
    });
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <div onClick={() => setOpen(true)}>
        {trigger ?? (
          <Button size="sm">
            <Plus className="h-4 w-4" />
            Add Deal
          </Button>
        )}
      </div>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{isEdit ? "Edit Deal" : "New Deal"}</SheetTitle>
          <SheetDescription>
            {isEdit ? "Update deal details." : "Create a new deal in your pipeline."}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} id="deal-form">
          <SheetBody className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="title">Deal Title *</Label>
              <Input
                id="title"
                name="title"
                defaultValue={deal?.title}
                placeholder="e.g. Acme Corp — Enterprise Plan"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label>Company *</Label>
              <Select value={companyId} onValueChange={setCompanyId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select company" />
                </SelectTrigger>
                <SelectContent>
                  {(companies ?? []).map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Primary Contact</Label>
              <Select value={contactId} onValueChange={setContactId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select contact (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {relevantContacts.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.first_name} {c.last_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Stage</Label>
              <Select value={stage} onValueChange={(v) => setStage(v as DealStage)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="prospect">Prospect</SelectItem>
                  <SelectItem value="proposal">Proposal</SelectItem>
                  <SelectItem value="negotiation">Negotiation</SelectItem>
                  <SelectItem value="won">Won</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="amount">Deal Value (₹) *</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                min="0"
                step="100"
                defaultValue={deal?.amount ?? 0}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="expected_close_date">Expected Close Date</Label>
              <Input
                id="expected_close_date"
                name="expected_close_date"
                type="date"
                defaultValue={deal?.expected_close_date ?? ""}
              />
            </div>
          </SheetBody>
        </form>

        <SheetFooter>
          <SheetClose asChild>
            <Button variant="outline" type="button">Cancel</Button>
          </SheetClose>
          <Button form="deal-form" type="submit" loading={isPending}>
            {isEdit ? "Save Changes" : "Create Deal"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
