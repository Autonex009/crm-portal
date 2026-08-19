import {
  Settings as SettingsIcon,
  User,
  Bell,
  Palette,
  Building,
  Users,
  Webhook,
  Activity,
  Database,
  ShieldCheck,
} from "lucide-react";
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

export const metadata = { title: "Workspace & Profile Settings — DealBridge" };

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
    <div className="space-y-8 pb-10">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-slate-800/80 px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              <SettingsIcon className="h-3.5 w-3.5 text-primary" />
              <span>Workspace Administration</span>
            </span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
            Account & Workspace Settings
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Manage your personal profile, security credentials, team members, and CRM integration parameters.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-xl bg-card border px-3.5 py-2 text-xs font-semibold text-foreground shadow-2xs">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span>Role: <strong className="capitalize">{profile?.role ?? "Sales"}</strong></span>
          </div>
        </div>
      </div>

      {/* Settings Navigation Tabs */}
      <Tabs defaultValue={sp.tab ?? "profile"} className="space-y-6">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-card p-1.5 rounded-xl border shadow-2xs">
          <TabsTrigger value="profile" className="gap-2 text-xs font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <User className="h-3.5 w-3.5" />
            Profile & Security
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2 text-xs font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Bell className="h-3.5 w-3.5" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-2 text-xs font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Palette className="h-3.5 w-3.5" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="organization" className="gap-2 text-xs font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Building className="h-3.5 w-3.5" />
            Organization
          </TabsTrigger>
          <TabsTrigger value="team" className="gap-2 text-xs font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Users className="h-3.5 w-3.5" />
            Team Members
          </TabsTrigger>
          <TabsTrigger value="integrations" className="gap-2 text-xs font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Webhook className="h-3.5 w-3.5" />
            Integrations
          </TabsTrigger>
          <TabsTrigger value="audit" className="gap-2 text-xs font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Activity className="h-3.5 w-3.5" />
            Audit Logs
          </TabsTrigger>
          <TabsTrigger value="data" className="gap-2 text-xs font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Database className="h-3.5 w-3.5" />
            Data Export
          </TabsTrigger>
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
