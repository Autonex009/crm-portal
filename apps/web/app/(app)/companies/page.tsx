import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Building2 } from "lucide-react";
import { CompaniesTable } from "./_components/companies-table";

export const metadata = { title: "Companies — CRM Portal" };

export default async function CompaniesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: companies } = await supabase
    .from("companies")
    .select("id, name, domain, industry, owner_id, created_at")
    .is("deleted_at", null)
    .order("name");

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

      <CompaniesTable companies={companies ?? []} />
    </div>
  );
}
