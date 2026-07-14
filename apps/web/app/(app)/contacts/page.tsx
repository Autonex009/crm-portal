import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Users, Search, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { ContactSheet } from "./_components/contact-sheet";
import { ContactsClient } from "./_components/contacts-client";

export const metadata = { title: "Contacts — CRM Portal" };

export default async function ContactsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const [{ data: contacts }, { data: companies }] = await Promise.all([
    supabase
      .from("contacts")
      .select("id, first_name, last_name, email, phone, title, company_id, companies(name)")
      .is("deleted_at", null)
      .order("first_name"),
    supabase
      .from("companies")
      .select("id, name")
      .is("deleted_at", null)
      .order("name"),
  ]);

  const mapped = (contacts ?? []).map((c) => ({
    ...c,
    company_name: Array.isArray(c.companies) ? (c.companies[0] as { name: string } | undefined)?.name ?? null : (c.companies as { name: string } | null)?.name ?? null,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Users className="h-6 w-6 text-muted-foreground" />
          Contacts
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {contacts?.length ?? 0} total contacts
        </p>
      </div>

      <ContactsClient contacts={mapped} companies={companies ?? []} />
    </div>
  );
}
