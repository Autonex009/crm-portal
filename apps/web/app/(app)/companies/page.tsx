import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Building2 } from "lucide-react";
import { CompaniesTable } from "./_components/companies-table";

export const metadata = { title: "Companies — DealBridge" };

export default async function CompaniesPage() {
  const supabase = await createClient();
  const user = await getAuthUser();
  if (!user) redirect("/auth/login");

  const [{ data: companies }, { data: archivedCompanies }] = await Promise.all([
    supabase
      .from("companies")
      .select("id, name, domain, industry, owner_id, created_at, deleted_at, archived_at")
      .is("deleted_at", null)
      .is("archived_at", null)
      .order("name"),
    supabase
      .from("companies")
      .select("id, name, domain, industry, owner_id, created_at, deleted_at, archived_at")
      .is("deleted_at", null)
      .not("archived_at", "is", null)
      .order("name"),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Building2 className="h-6 w-6 text-muted-foreground" />
          Companies
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {companies?.length ?? 0} total companies
        </p>
      </div>

      <CompaniesTable
        companies={companies ?? []}
        archivedCompanies={archivedCompanies ?? []}
      />
    </div>
  );
}

