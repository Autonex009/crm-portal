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
import { createLead, updateLead } from "@/lib/actions/leads";
import { toast } from "@/components/ui/use-toast";
import { Plus } from "lucide-react";

interface Lead {
  id: string;
  title: string | null;
  company_id: string | null;
  contact_id: string | null;
  source: string | null;
  status: "new" | "contacted" | "qualified" | "lost";
  value_estimate: number | null;
}

interface Company { id: string; name: string }
interface Contact { id: string; first_name: string; last_name: string }

interface LeadSheetProps {
  lead?: Lead;
  companies?: Company[];
  contacts?: Contact[];
  trigger?: React.ReactNode;
}

const SOURCES = ["Website", "Referral", "Cold Outreach", "LinkedIn", "Event", "Partner", "Other"];

export function LeadSheet({ lead, companies, contacts, trigger }: LeadSheetProps) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<string>(lead?.status ?? "new");
  const [companyId, setCompanyId] = useState(lead?.company_id ?? "");
  const [contactId, setContactId] = useState(lead?.contact_id ?? "");
  const [source, setSource] = useState(lead?.source ?? "");
  const [isPending, startTransition] = useTransition();
  const isEdit = !!lead;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("status", status);
    if (companyId) formData.set("company_id", companyId);
    if (contactId) formData.set("contact_id", contactId);
    if (source) formData.set("source", source);

    startTransition(async () => {
      const result = isEdit
        ? await updateLead(lead.id, formData)
        : await createLead(formData);

      if (result.success) {
        toast({ title: isEdit ? "Lead updated" : "Lead created", variant: "success" });
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
            Add Lead
          </Button>
        )}
      </div>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{isEdit ? "Edit Lead" : "New Lead"}</SheetTitle>
          <SheetDescription>
            {isEdit ? "Update lead details." : "Capture a new sales lead."}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} id="lead-form">
          <SheetBody className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="title">Lead Title *</Label>
              <Input
                id="title"
                name="title"
                defaultValue={lead?.title ?? ""}
                placeholder="e.g. Enterprise SaaS Opportunity"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="qualified">Qualified</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {companies && (
              <div className="space-y-1.5">
                <Label>Company</Label>
                <Select value={companyId} onValueChange={setCompanyId}>
                  <SelectTrigger><SelectValue placeholder="Select company (optional)" /></SelectTrigger>
                  <SelectContent>
                    {companies.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {contacts && (
              <div className="space-y-1.5">
                <Label>Contact</Label>
                <Select value={contactId} onValueChange={setContactId}>
                  <SelectTrigger><SelectValue placeholder="Select contact (optional)" /></SelectTrigger>
                  <SelectContent>
                    {contacts.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.first_name} {c.last_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Source</Label>
              <Select value={source} onValueChange={setSource}>
                <SelectTrigger><SelectValue placeholder="Where did this lead come from?" /></SelectTrigger>
                <SelectContent>
                  {SOURCES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="value_estimate">Estimated Value ($)</Label>
              <Input
                id="value_estimate"
                name="value_estimate"
                type="number"
                min="0"
                step="100"
                defaultValue={lead?.value_estimate ?? ""}
                placeholder="0"
              />
            </div>
          </SheetBody>
        </form>

        <SheetFooter>
          <SheetClose asChild>
            <Button variant="outline" type="button">Cancel</Button>
          </SheetClose>
          <Button form="lead-form" type="submit" loading={isPending}>
            {isEdit ? "Save Changes" : "Create Lead"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
