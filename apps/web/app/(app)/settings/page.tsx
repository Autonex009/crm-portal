import { Settings } from "lucide-react";

export const metadata = { title: "Settings — CRM Portal" };

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Settings className="h-6 w-6 text-muted-foreground" />
          Settings
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Configure your CRM workspace</p>
      </div>
      <div className="rounded-xl border bg-card p-12 text-center">
        <Settings className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
        <p className="font-medium">Settings coming soon</p>
        <p className="text-sm text-muted-foreground mt-1">
          Team management, integrations, billing, and notification preferences.
        </p>
      </div>
    </div>
  );
}
