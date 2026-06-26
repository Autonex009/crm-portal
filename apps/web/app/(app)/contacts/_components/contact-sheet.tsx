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
import { createContact, updateContact } from "@/lib/actions/contacts";
import { toast } from "@/components/ui/use-toast";
import { Plus } from "lucide-react";

interface Contact {
  id: string;
  company_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  title: string | null;
}

interface Company {
  id: string;
  name: string;
}

interface ContactSheetProps {
  contact?: Contact;
  companyId?: string;
  companyName?: string;
  companies?: Company[];
  trigger?: React.ReactNode;
}

export function ContactSheet({ contact, companyId, companyName, companies, trigger }: ContactSheetProps) {
  const [open, setOpen] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState(contact?.company_id ?? companyId ?? "");
  const [isPending, startTransition] = useTransition();
  const isEdit = !!contact;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("company_id", selectedCompanyId);

    startTransition(async () => {
      const result = isEdit
        ? await updateContact(contact.id, formData)
        : await createContact(formData);

      if (result.success) {
        toast({ title: isEdit ? "Contact updated" : "Contact added", variant: "success" });
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
            Add Contact
          </Button>
        )}
      </div>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{isEdit ? "Edit Contact" : "Add Contact"}</SheetTitle>
          <SheetDescription>
            {companyName ? `Adding contact to ${companyName}` : "Create a new contact record."}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} id="contact-form">
          <SheetBody className="space-y-4">
            {!companyId && companies && (
              <div className="space-y-1.5">
                <Label>Company *</Label>
                <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select company" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="first_name">First Name *</Label>
                <Input id="first_name" name="first_name" defaultValue={contact?.first_name} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="last_name">Last Name *</Label>
                <Input id="last_name" name="last_name" defaultValue={contact?.last_name} required />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email *</Label>
              <Input id="email" name="email" type="email" defaultValue={contact?.email} required />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" defaultValue={contact?.phone ?? ""} placeholder="+1 (555) 000-0000" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="title">Job Title</Label>
              <Input id="title" name="title" defaultValue={contact?.title ?? ""} placeholder="VP of Sales" />
            </div>
          </SheetBody>
        </form>

        <SheetFooter>
          <SheetClose asChild>
            <Button variant="outline" type="button">Cancel</Button>
          </SheetClose>
          <Button form="contact-form" type="submit" loading={isPending}>
            {isEdit ? "Save Changes" : "Add Contact"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
