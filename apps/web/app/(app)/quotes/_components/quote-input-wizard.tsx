"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Camera,
  ChevronRight,
  LayoutTemplate,
  Pencil,
  Plus,
  Trash2,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { toast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { QuoteBrandMark } from "./quote-brand-mark";
import {
  CATEGORY_TEMPLATE_SCHEMAS,
  createDefaultTemplateValues,
  interpolateDerivedLine,
  resolveCostLines,
  resolveTemplateTitle,
  roundCurrency,
  type CustomField,
  type QuoteCategoryTemplateValues,
} from "./quote-template-schemas";
import {
  PRODUCT_CATEGORIES,
  type ProductCategory,
  type QuoteRecord,
  type QuoteStatus,
} from "./quote-module-data";
import { formatQuoteCurrency } from "./use-quote-builder";
import { useQuotesStore } from "./quote-store";

const CATEGORY_ICON: Record<ProductCategory, typeof LayoutTemplate> = {
  Master: LayoutTemplate,
  WIL: Users,
  VIGIL: Camera,
};

const AVAILABLE_CATEGORIES: ProductCategory[] = ["Master"];

const SELECTABLE_STATUSES: QuoteStatus[] = ["Draft", "Presented", "Accepted", "Rejected"];

const TAX_RATE = 0.085;

function slugify(value: string) {
  const slug = value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return slug || "reference";
}

function addDays(date: string, days: number) {
  const parsed = new Date(date || new Date().toISOString());
  parsed.setDate(parsed.getDate() + days);
  return parsed.toISOString().slice(0, 10);
}

export function QuoteInputWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editQuoteNumber = searchParams.get("edit");
  const isEditing = Boolean(editQuoteNumber);

  const addQuote = useQuotesStore((state) => state.addQuote);
  const updateQuote = useQuotesStore((state) => state.updateQuote);
  const nextQuoteNumber = useQuotesStore((state) => state.nextQuoteNumber);
  const existingQuote = useQuotesStore((state) =>
    editQuoteNumber ? state.getQuote(editQuoteNumber) : undefined
  );

  const [hydrated, setHydrated] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [category, setCategory] = useState<ProductCategory | null>(null);
  const [values, setValues] = useState<QuoteCategoryTemplateValues | null>(null);
  const [editingFixed, setEditingFixed] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [createdByName, setCreatedByName] = useState("");
  const [quoteStatus, setQuoteStatus] = useState<QuoteStatus>("Draft");
  const [initializedEdit, setInitializedEdit] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || !isEditing || initializedEdit || !existingQuote) return;
    setCategory(existingQuote.productCategory);
    setValues(existingQuote.categoryTemplate);
    setCreatedByName(existingQuote.createdBy.name);
    setQuoteStatus(existingQuote.status);
    setErrors({});
    setEditingFixed(false);
    setStep(2);
    setInitializedEdit(true);
  }, [hydrated, isEditing, initializedEdit, existingQuote]);

  const schema = category ? CATEGORY_TEMPLATE_SCHEMAS[category] : null;

  const costLines = useMemo(
    () => (schema && values ? resolveCostLines(schema, values) : []),
    [schema, values]
  );

  const subtotal = roundCurrency(costLines.reduce((sum, line) => sum + line.total, 0));
  const taxAmount = roundCurrency(subtotal * TAX_RATE);
  const grandTotal = roundCurrency(subtotal + taxAmount);

  function selectCategory(next: ProductCategory) {
    if (!AVAILABLE_CATEGORIES.includes(next)) {
      toast({
        title: "Will be added",
        description: `The ${next} quotation template isn't available yet — it will be added soon.`,
      });
      return;
    }
    setCategory(next);
    setValues(createDefaultTemplateValues(next));
    setCreatedByName("");
    setQuoteStatus("Draft");
    setErrors({});
    setEditingFixed(false);
    setStep(2);
  }

  function backToCategories() {
    if (isEditing && existingQuote) {
      router.push(`/quotes/${existingQuote.quoteNumber}`);
      return;
    }
    setStep(1);
  }

  function updateReference(value: string) {
    setValues((current) => (current ? { ...current, reference: value } : current));
  }

  function updateDate(value: string) {
    setValues((current) => (current ? { ...current, date: value } : current));
  }

  function updateHeaderField(key: string, value: string, isNumber: boolean) {
    setValues((current) =>
      current
        ? {
            ...current,
            headerFieldValues: {
              ...current.headerFieldValues,
              [key]: isNumber ? Math.max(0, Number(value) || 0) : value,
            },
          }
        : current
    );
  }

  function updateScopeField(key: string, value: string) {
    setValues((current) =>
      current ? { ...current, scopeFieldValues: { ...current.scopeFieldValues, [key]: value } } : current
    );
  }

  function updateDerivedLine(index: number, value: string) {
    setValues((current) => {
      if (!current) return current;
      const next = [...current.scopeDerivedLines];
      next[index] = value;
      return { ...current, scopeDerivedLines: next };
    });
  }

  function addCustomField() {
    setValues((current) =>
      current
        ? {
            ...current,
            customFields: [
              ...current.customFields,
              { id: `custom-${crypto.randomUUID()}`, label: "New field", value: "" },
            ],
          }
        : current
    );
  }

  function updateCustomField(id: string, patch: Partial<CustomField>) {
    setValues((current) =>
      current
        ? {
            ...current,
            customFields: current.customFields.map((field) => (field.id === id ? { ...field, ...patch } : field)),
          }
        : current
    );
  }

  function removeCustomField(id: string) {
    setValues((current) =>
      current ? { ...current, customFields: current.customFields.filter((field) => field.id !== id) } : current
    );
  }

  function updateCostLine(id: string, field: "typeOfCost" | "servicesIncluded" | "amountPerUnit" | "discountPercent", value: string) {
    setValues((current) => {
      if (!current) return current;
      return {
        ...current,
        costLines: current.costLines.map((line) => {
          if (line.id !== id) return line;
          if (field === "amountPerUnit" || field === "discountPercent") {
            const numeric = Number(value);
            return { ...line, [field]: Number.isFinite(numeric) ? Math.max(0, numeric) : 0 };
          }
          if (field === "servicesIncluded") {
            return { ...line, servicesIncluded: value.split("\n") };
          }
          return { ...line, [field]: value };
        }),
      };
    });
  }

  function addCostLine() {
    setValues((current) => {
      if (!current) return current;
      const srNo = current.costLines.length + 1;
      return {
        ...current,
        costLines: [
          ...current.costLines,
          {
            id: `custom-line-${crypto.randomUUID()}`,
            srNo,
            typeOfCost: "New line item",
            servicesIncluded: ["Describe the services included"],
            amountPerUnit: 0,
            discountPercent: 0,
          },
        ],
      };
    });
  }

  function removeCostLine(id: string) {
    setValues((current) => {
      if (!current) return current;
      return {
        ...current,
        costLines: current.costLines
          .filter((line) => line.id !== id)
          .map((line, index) => ({ ...line, srNo: index + 1 })),
      };
    });
  }

  function updateFooterSection(index: number, body: string) {
    setValues((current) => {
      if (!current) return current;
      const next = [...current.footerSections];
      next[index] = { ...next[index], body };
      return { ...current, footerSections: next };
    });
  }

  function validate(): boolean {
    if (!schema || !values) return false;
    const nextErrors: Record<string, string> = {};

    if (!values.reference.trim()) {
      nextErrors.reference = "Client / opportunity reference is required.";
    }
    if (!values.date) {
      nextErrors.date = "Date is required.";
    }
    if (!createdByName.trim()) {
      nextErrors.createdByName = "Created by is required.";
    }
    schema.headerFields.forEach((field) => {
      if (field.required && (values.headerFieldValues[field.key] === undefined || values.headerFieldValues[field.key] === "")) {
        nextErrors[field.key] = `${field.label} is required.`;
      }
    });
    schema.scopeFields.forEach((field) => {
      if (field.required && !String(values.scopeFieldValues[field.key] ?? "").trim()) {
        nextErrors[field.key] = `${field.label} is required.`;
      }
    });
    if (values.costLines.length === 0) {
      nextErrors.costLines = "At least one cost line item is required.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function handleSave() {
    if (!category || !schema || !values) return;

    if (!validate()) {
      toast({
        title: "Save failed",
        description: "Complete the required fields before saving this quotation.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    const referenceSlug = slugify(values.reference);
    const computedCreatedAt = new Date(values.date || new Date().toISOString()).toISOString();

    if (isEditing && existingQuote) {
      const record: QuoteRecord = {
        ...existingQuote,
        quoteName: resolveTemplateTitle(schema, values.reference),
        expirationDate: addDays(values.date, 30),
        status: quoteStatus,
        productCategory: category,
        createdBy: {
          ...existingQuote.createdBy,
          name: createdByName,
          createdAt: computedCreatedAt,
        },
        categoryTemplate: { ...values, category },
      };

      updateQuote(existingQuote.quoteNumber, record);

      toast({
        title: "Quote updated",
        description: `${existingQuote.quoteNumber} was saved.`,
        variant: "success",
      });

      router.push(`/quotes/${existingQuote.quoteNumber}`);
      return;
    }

    const quoteNumber = nextQuoteNumber();

    const record: QuoteRecord = {
      quoteNumber,
      quoteName: resolveTemplateTitle(schema, values.reference),
      opportunity: { id: `opp-${referenceSlug}`, label: values.reference, href: "/deals" },
      account: { id: `acct-${referenceSlug}`, label: values.reference, href: "/companies" },
      expirationDate: addDays(values.date, 30),
      status: quoteStatus,
      productCategory: category,
      createdBy: {
        name: createdByName,
        role: "Quote Creator",
        email: "",
        createdAt: computedCreatedAt,
      },
      categoryTemplate: { ...values, category },
    };

    addQuote(record);

    toast({
      title: "Quote saved",
      description: `${quoteNumber} was created as ${quoteStatus}.`,
      variant: "success",
    });

    router.push(`/quotes/${quoteNumber}`);
  }

  if (isEditing && !hydrated) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (isEditing && hydrated && !existingQuote) {
    return (
      <EmptyState
        title="Quote not found"
        description={`No quote matches ${editQuoteNumber}.`}
        action={
          <Button onClick={() => router.push("/quotes")}>Back to Quotes</Button>
        }
      />
    );
  }

  if (step === 1 || !schema || !values) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">New Quotation</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose a category to load its quotation template.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {PRODUCT_CATEGORIES.map((productCategory) => {
            const categorySchema = CATEGORY_TEMPLATE_SCHEMAS[productCategory];
            const Icon = CATEGORY_ICON[productCategory];
            const available = AVAILABLE_CATEGORIES.includes(productCategory);

            return (
              <button
                key={productCategory}
                type="button"
                onClick={() => selectCategory(productCategory)}
                className={cn(
                  "group flex flex-col items-start gap-3 rounded-xl border bg-card p-6 text-left transition-colors",
                  available ? "hover:border-primary/50 hover:shadow-sm" : "cursor-not-allowed opacity-60"
                )}
              >
                <div className="rounded-lg bg-primary/10 p-2.5 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold">{categorySchema.label}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{categorySchema.tagline}</p>
                </div>
                {available ? (
                  categorySchema.isFreeform ? (
                    <Badge variant="outline">Freeform</Badge>
                  ) : (
                    <Badge variant="secondary">Fixed template</Badge>
                  )
                ) : (
                  <Badge variant="gray">Will be added</Badge>
                )}
                {available ? (
                  <span className="mt-auto flex items-center gap-1 text-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                    Use this template
                    <ChevronRight className="h-4 w-4" />
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={backToCategories}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {isEditing ? `Editing ${existingQuote?.quoteNumber}` : `Step 2 of 2 · ${schema.label} template`}
          </p>
          <h1 className="text-xl font-bold">
            {isEditing ? "Edit Page" : resolveTemplateTitle(schema, values.reference || "New Client")}
          </h1>
        </div>
      </div>

      <section className="rounded-2xl border bg-card shadow-sm">
        <div className="flex flex-col items-center gap-4 border-b p-6 text-center">
          <QuoteBrandMark />
          <h2 className="text-lg font-semibold">{resolveTemplateTitle(schema, values.reference || "New Client")}</h2>
          <div className="grid w-full max-w-xl gap-4 sm:grid-cols-2">
            <label className="grid gap-1.5 text-left">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Client / Opportunity Reference
              </span>
              <Input
                value={values.reference}
                placeholder="e.g. L&T"
                onChange={(event) => updateReference(event.target.value)}
              />
              {errors.reference ? <span className="text-xs text-destructive">{errors.reference}</span> : null}
            </label>
            <label className="grid gap-1.5 text-left">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Date</span>
              <Input type="date" value={values.date} onChange={(event) => updateDate(event.target.value)} />
              {errors.date ? <span className="text-xs text-destructive">{errors.date}</span> : null}
            </label>
            {schema.headerFields.map((field) => (
              <label key={field.key} className="grid gap-1.5 text-left">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {field.label}
                </span>
                <Input
                  type={field.type === "number" ? "number" : "text"}
                  min={field.type === "number" ? 0 : undefined}
                  value={values.headerFieldValues[field.key] ?? ""}
                  placeholder={field.placeholder}
                  onChange={(event) => updateHeaderField(field.key, event.target.value, field.type === "number")}
                />
                {field.helperText ? <span className="text-xs text-muted-foreground">{field.helperText}</span> : null}
                {errors[field.key] ? <span className="text-xs text-destructive">{errors[field.key]}</span> : null}
              </label>
            ))}
          </div>
        </div>

        <div className="border-b p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {schema.scopeHeading}
            </h3>
            {!schema.isFreeform ? (
              <Button variant="ghost" size="sm" onClick={() => setEditingFixed((current) => !current)}>
                <Pencil className="h-3.5 w-3.5" />
                {editingFixed ? "Done editing" : "Edit"}
              </Button>
            ) : null}
          </div>

          {values.scopeDerivedLines.length > 0 ? (
            <div className="mt-3 space-y-2">
              {values.scopeDerivedLines.map((line, index) =>
                editingFixed ? (
                  <Input
                    key={index}
                    value={line}
                    onChange={(event) => updateDerivedLine(index, event.target.value)}
                  />
                ) : (
                  <p key={index} className="text-sm text-foreground">
                    • {interpolateDerivedLine(line, values.headerFieldValues)}
                  </p>
                )
              )}
            </div>
          ) : null}

          {schema.scopeFields.length > 0 ? (
            <div className="mt-4 space-y-4">
              {schema.scopeFields.map((field) => (
                <label key={field.key} className="grid gap-1.5">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    {field.label}
                  </span>
                  {field.type === "textarea" ? (
                    <Textarea
                      value={values.scopeFieldValues[field.key] ?? ""}
                      placeholder={field.placeholder}
                      className="min-h-40"
                      onChange={(event) => updateScopeField(field.key, event.target.value)}
                    />
                  ) : (
                    <Input
                      value={values.scopeFieldValues[field.key] ?? ""}
                      placeholder={field.placeholder}
                      onChange={(event) => updateScopeField(field.key, event.target.value)}
                    />
                  )}
                  {errors[field.key] ? <span className="text-xs text-destructive">{errors[field.key]}</span> : null}
                </label>
              ))}
            </div>
          ) : null}

          {schema.isFreeform ? (
            <div className="mt-4 space-y-3">
              {values.customFields.map((field) => (
                <div key={field.id} className="flex flex-wrap items-start gap-2 rounded-lg border border-dashed p-3">
                  <Input
                    className="w-48"
                    value={field.label}
                    onChange={(event) => updateCustomField(field.id, { label: event.target.value })}
                  />
                  <Input
                    className="flex-1"
                    value={field.value}
                    onChange={(event) => updateCustomField(field.id, { value: event.target.value })}
                  />
                  <Button variant="ghost" size="icon" onClick={() => removeCustomField(field.id)}>
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addCustomField}>
                <Plus className="h-4 w-4" />
                Add custom field
              </Button>
            </div>
          ) : null}
        </div>

        <div className="border-b p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Cost Line Items
            </h3>
            {schema.isFreeform ? (
              <Button variant="outline" size="sm" onClick={addCostLine}>
                <Plus className="h-4 w-4" />
                Add Row
              </Button>
            ) : null}
          </div>
          {errors.costLines ? <p className="mt-2 text-sm text-destructive">{errors.costLines}</p> : null}

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  {schema.costLineColumns.map((column) => (
                    <th key={column.key} className={cn("px-2 py-2 font-medium", column.align === "right" && "text-right")}>
                      {column.label}
                    </th>
                  ))}
                  {schema.isFreeform ? <th className="w-10" /> : null}
                </tr>
              </thead>
              <tbody>
                {costLines.map((line) => (
                  <tr key={line.id} className="border-b align-top last:border-0">
                    <td className="px-2 py-3">{line.srNo}</td>
                    <td className="min-w-40 px-2 py-3">
                      {schema.isFreeform ? (
                        <Input
                          value={line.typeOfCost}
                          onChange={(event) => updateCostLine(line.id, "typeOfCost", event.target.value)}
                        />
                      ) : (
                        <span className="font-medium">{line.typeOfCost}</span>
                      )}
                    </td>
                    <td className="min-w-64 px-2 py-3">
                      {schema.isFreeform ? (
                        <Textarea
                          value={line.servicesIncluded.join("\n")}
                          onChange={(event) => updateCostLine(line.id, "servicesIncluded", event.target.value)}
                          className="min-h-16"
                        />
                      ) : (
                        <ul className="list-disc space-y-0.5 pl-4 text-xs text-muted-foreground">
                          {line.servicesIncluded.map((service, index) => (
                            <li key={index}>{service}</li>
                          ))}
                        </ul>
                      )}
                    </td>
                    <td className="px-2 py-3 text-right tabular-nums">{line.qty}</td>
                    <td className="px-2 py-3 text-right">
                      <Input
                        type="number"
                        min="0"
                        className="ml-auto w-28 text-right"
                        value={line.amountPerUnit}
                        onChange={(event) => updateCostLine(line.id, "amountPerUnit", event.target.value)}
                      />
                    </td>
                    <td className="px-2 py-3 text-right">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        className="ml-auto w-20 text-right"
                        value={line.discountPercent}
                        onChange={(event) => updateCostLine(line.id, "discountPercent", event.target.value)}
                      />
                    </td>
                    <td className="px-2 py-3 text-right font-medium tabular-nums">
                      {formatQuoteCurrency(line.finalPrice)}
                    </td>
                    <td className="px-2 py-3 text-right font-semibold tabular-nums">
                      {formatQuoteCurrency(line.total)}
                    </td>
                    {schema.isFreeform ? (
                      <td className="px-2 py-3 text-right">
                        <Button variant="ghost" size="icon" onClick={() => removeCostLine(line.id)}>
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="ml-auto mt-4 w-full max-w-xs space-y-2 rounded-xl border bg-muted/30 p-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Subtotal</span>
              <span className="font-medium text-foreground">{formatQuoteCurrency(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Tax (8.5%)</span>
              <span className="font-medium text-foreground">{formatQuoteCurrency(taxAmount)}</span>
            </div>
            <div className="flex items-center justify-between border-t pt-2 text-sm font-semibold">
              <span>Grand Total</span>
              <span>{formatQuoteCurrency(grandTotal)}</span>
            </div>
          </div>
        </div>

        <div className="border-b p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Terms & Conditions
            </h3>
            {!schema.isFreeform ? (
              <Button variant="ghost" size="sm" onClick={() => setEditingFixed((current) => !current)}>
                <Pencil className="h-3.5 w-3.5" />
                {editingFixed ? "Done editing" : "Edit"}
              </Button>
            ) : null}
          </div>
          <div className="mt-3 space-y-3">
            {values.footerSections.map((section, index) => (
              <div key={section.heading}>
                {values.footerSections.length > 1 ? (
                  <p className="text-xs font-semibold text-foreground">{section.heading}</p>
                ) : null}
                {schema.isFreeform || editingFixed ? (
                  <Textarea
                    className="mt-1 min-h-48"
                    value={section.body}
                    onChange={(event) => updateFooterSection(index, event.target.value)}
                  />
                ) : (
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">{section.body}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="p-6">
          <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Quote Record
          </h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <label className="grid gap-1.5 text-left">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Created By
              </span>
              <Input
                value={createdByName}
                placeholder="Your name"
                onChange={(event) => setCreatedByName(event.target.value)}
              />
              {errors.createdByName ? <span className="text-xs text-destructive">{errors.createdByName}</span> : null}
            </label>
            <label className="grid gap-1.5 text-left">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Created At
              </span>
              <Input value={values.date} disabled />
            </label>
            <label className="grid gap-1.5 text-left">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Status
              </span>
              <Select value={quoteStatus} onValueChange={(value) => setQuoteStatus(value as QuoteStatus)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {SELECTABLE_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
          </div>
        </div>
      </section>

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={backToCategories}>
          Back
        </Button>
        <Button onClick={handleSave} loading={saving}>
          {isEditing ? "Save Changes" : "Save Quote"}
        </Button>
      </div>
    </div>
  );
}
