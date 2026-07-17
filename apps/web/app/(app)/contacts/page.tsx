import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Users, Search, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { ContactSheet } from "./_components/contact-sheet";
import { ContactsClient } from "./_components/contacts-client";
import { getAuthUser } from "@/lib/auth";

export const metadata = { title: "Contacts — DealBridge" };

export default async function ContactsPage() {
  const supabase = await createClient();
  const user = await getAuthUser();
  if (!user) redirect("/auth/login");

  const [
    { data: contacts },
    { data: archivedContacts },
    { data: companies }
  ] = await Promise.all([
    supabase
      .from("contacts")
      .select("id, first_name, last_name, email, phone, title, company_id, deleted_at, archived_at, companies(name)")
      .is("deleted_at", null)
      .is("archived_at", null)
      .order("first_name"),
    supabase
      .from("contacts")
      .select("id, first_name, last_name, email, phone, title, company_id, deleted_at, archived_at, companies(name)")
      .is("deleted_at", null)
      .not("archived_at", "is", null)
      .order("first_name"),
    supabase
      .from("companies")
      .select("id, name")
      .is("deleted_at", null)
      .is("archived_at", null)
      .order("name"),
  ]);

  const mapContact = (c: any) => ({
    ...c,
    company_name: Array.isArray(c.companies)
      ? (c.companies[0] as { name: string } | undefined)?.name ?? null
      : (c.companies as { name: string } | null)?.name ?? null,
  });

  const mapped = (contacts ?? []).map(mapContact);
  const mappedArchived = (archivedContacts ?? []).map(mapContact);

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

      <ContactsClient
        contacts={mapped}
        archivedContacts={mappedArchived}
        companies={companies ?? []}
      />
    </div>
  );
}

