"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { InvoicePrintPreview } from "@/app/(app)/invoices/_components/invoice-print-preview";
import { useInvoicesStore } from "@/app/(app)/invoices/_components/invoices-store";

export default function InvoicePrintPage() {
  const params = useParams<{ id: string }>();
  const invoiceId = decodeURIComponent(params.id);
  const invoice = useInvoicesStore((state) =>
    state.invoices.find((i) => i.id === invoiceId || i.invoiceNumber === invoiceId)
  );
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-[210mm] space-y-4 p-10">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="mx-auto max-w-xl space-y-6 p-10">
        <Link href="/invoices" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to Invoices
        </Link>
        <EmptyState
          icon={<FileQuestion className="h-8 w-8" />}
          title="Invoice not found"
          description={`No invoice matches ${invoiceId}.`}
          action={
            <Link href="/invoices">
              <Button>Back to Invoices</Button>
            </Link>
          }
        />
      </div>
    );
  }

  return <InvoicePrintPreview invoice={invoice} />;
}
