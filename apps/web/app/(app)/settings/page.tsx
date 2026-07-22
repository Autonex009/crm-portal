import { Settings } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ProfileCard } from "./_components/profile-card";
import { SecurityCard } from "./_components/security-card";
import { AppearanceCard } from "./_components/appearance-card";
import { IntegrationsCard } from "./_components/integrations-card";
import { TeamCard } from "./_components/team-card";
import { OrganizationCard } from "./_components/organization-card";
import { NotificationsCard } from "./_components/notifications-card";
import { AuditLogCard } from "./_components/audit-log-card";
import { DataManagementCard } from "./_components/data-management-card";

export const metadata = { title: "Settings — DealBridge" };

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ google?: string; google_error?: string; tab?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();
  const user = await getAuthUser();
  if (!user) redirect("/auth/login");

  const [{ data: profile }, { data: members }, { data: connections }] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, avatar_url, role")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("profiles")
      .select("id, full_name, role, created_at")
      .order("created_at"),
    supabase
      .from("integration_connections")
      .select("provider, provider_account_id")
      .eq("user_id", user.id),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Settings className="h-6 w-6 text-muted-foreground" />
          Settings
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Configure your CRM workspace</p>
      </div>

      <Tabs defaultValue={sp.tab ?? "profile"}>
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="organization">Organization</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="audit">Audit log</TabsTrigger>
          <TabsTrigger value="data">Data export</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <ProfileCard
            email={user.email ?? ""}
            fullName={profile?.full_name ?? ""}
            avatarUrl={profile?.avatar_url ?? null}
            role={profile?.role ?? "sales"}
          />
          <SecurityCard />
        </TabsContent>

        <TabsContent value="notifications">
          <NotificationsCard />
        </TabsContent>

        <TabsContent value="appearance">
          <AppearanceCard />
        </TabsContent>

        <TabsContent value="organization">
          <OrganizationCard />
        </TabsContent>

        <TabsContent value="team">
          <TeamCard members={members ?? []} currentUserId={user.id} />
        </TabsContent>

        <TabsContent value="integrations">
          <IntegrationsCard
            connections={(connections ?? []) as any}
            googleConfigured={Boolean(process.env.GOOGLE_CLIENT_ID)}
            slackConfigured={Boolean(process.env.SLACK_BOT_TOKEN)}
            googleStatus={sp.google}
            googleError={sp.google_error}
          />
        </TabsContent>

        <TabsContent value="audit">
          <AuditLogCard />
        </TabsContent>

        <TabsContent value="data">
          <DataManagementCard />
        </TabsContent>
      </Tabs>
    </div>
  );
}
