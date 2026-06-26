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
import { createCompany, updateCompany } from "@/lib/actions/companies";
import { toast } from "@/components/ui/use-toast";
import { Plus } from "lucide-react";

const INDUSTRIES = [
  "Technology", "Finance", "Healthcare", "Retail", "Manufacturing",
  "Real Estate", "Education", "Media", "Transportation", "Energy", "Other",
];

interface Company {
  id: string;
  name: string;
  domain: string | null;
  industry: string | null;
}

interface CompanySheetProps {
  company?: Company;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export function CompanySheet({ company, trigger, onSuccess }: CompanySheetProps) {
  const [open, setOpen] = useState(false);
  const [industry, setIndustry] = useState(company?.industry ?? "");
  const [isPending, startTransition] = useTransition();
  const isEdit = !!company;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (industry) formData.set("industry", industry);

    startTransition(async () => {
      const result = isEdit
        ? await updateCompany(company.id, formData)
        : await createCompany(formData);

      if (result.success) {
        toast({ title: isEdit ? "Company updated" : "Company created", variant: "success" });
        setOpen(false);
        onSuccess?.();
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
            Add Company
          </Button>
        )}
      </div>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{isEdit ? "Edit Company" : "Add Company"}</SheetTitle>
          <SheetDescription>
            {isEdit ? "Update company details." : "Create a new company record."}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} id="company-form">
          <SheetBody className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Company Name *</Label>
              <Input
                id="name"
                name="name"
                defaultValue={company?.name}
                placeholder="Acme Corp"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="domain">Domain</Label>
              <Input
                id="domain"
                name="domain"
                defaultValue={company?.domain ?? ""}
                placeholder="acme.com"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Industry</Label>
              <Select value={industry} onValueChange={setIndustry}>
                <SelectTrigger>
                  <SelectValue placeholder="Select industry" />
                </SelectTrigger>
                <SelectContent>
                  {INDUSTRIES.map((ind) => (
                    <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </SheetBody>
        </form>

        <SheetFooter>
          <SheetClose asChild>
            <Button variant="outline" type="button">Cancel</Button>
          </SheetClose>
          <Button form="company-form" type="submit" loading={isPending}>
            {isEdit ? "Save Changes" : "Create Company"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
