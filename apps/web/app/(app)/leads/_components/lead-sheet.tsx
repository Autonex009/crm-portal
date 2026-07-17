"use client";

import { useState, useTransition } from "react";
import {
  Sheet, SheetContent, SheetHeader, SheetBody, SheetFooter,
  SheetTitle, SheetDescription, SheetClose,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createLead, updateLead } from "@/lib/actions/leads";
import { toast } from "@/components/ui/use-toast";
import { Plus } from "lucide-react";

interface Lead {
  id: string;
  title: string | null;
  contact_name: string | null;
  job_title: string | null;
  company_id: string | null;
  contact_id: string | null;
  email: string | null;
  phone: string | null;
  linkedin_url: string | null;
  industry: string | null;
  location: string | null;
  product_interest: string | null;
  source: string | null;
  status: "new" | "initial count" | "deck sent" | "not interested" | "call scheduled" | "call done" | "proposal sent" | "closed";
  value_estimate: number | null;
  next_follow_up_date: string | null;
  notes: string | null;
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
    // The record's title mirrors the person's Name.
    formData.set("title", (formData.get("contact_name") as string) ?? "");
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

        <form onSubmit={handleSubmit} id="lead-form" className="flex-1 flex flex-col overflow-hidden">
          <SheetBody className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="contact_name">Name *</Label>
              <Input
                id="contact_name"
                name="contact_name"
                defaultValue={lead?.contact_name ?? lead?.title ?? ""}
                placeholder="e.g. Priya Sharma"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="job_title">Job Title</Label>
              <Input
                id="job_title"
                name="job_title"
                defaultValue={lead?.job_title ?? ""}
                placeholder="e.g. VP Engineering"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="initial count">Initial Count</SelectItem>
                  <SelectItem value="deck sent">Deck Sent</SelectItem>
                  <SelectItem value="call scheduled">Call Scheduled</SelectItem>
                  <SelectItem value="call done">Call Done</SelectItem>
                  <SelectItem value="proposal sent">Proposal Sent</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                  <SelectItem value="not interested">Not Interested</SelectItem>
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

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={lead?.email ?? ""}
                  placeholder="name@company.com"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  name="phone"
                  defaultValue={lead?.phone ?? ""}
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="linkedin_url">LinkedIn Profile</Label>
              <Input
                id="linkedin_url"
                name="linkedin_url"
                defaultValue={lead?.linkedin_url ?? ""}
                placeholder="https://linkedin.com/in/…"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="industry">Sector / Industry</Label>
                <Input
                  id="industry"
                  name="industry"
                  defaultValue={lead?.industry ?? ""}
                  placeholder="e.g. SaaS"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  name="location"
                  defaultValue={lead?.location ?? ""}
                  placeholder="e.g. Bengaluru"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="product_interest">Product Use Cases / Interest</Label>
              <Input
                id="product_interest"
                name="product_interest"
                defaultValue={lead?.product_interest ?? ""}
                placeholder="e.g. Workflow automation"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="value_estimate">Estimated Value (₹)</Label>
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
              <div className="space-y-1.5">
                <Label htmlFor="next_follow_up_date">Next Follow-up Date</Label>
                <Input
                  id="next_follow_up_date"
                  name="next_follow_up_date"
                  type="date"
                  defaultValue={lead?.next_follow_up_date ?? ""}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                defaultValue={lead?.notes ?? ""}
                placeholder="Additional context…"
                rows={3}
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
