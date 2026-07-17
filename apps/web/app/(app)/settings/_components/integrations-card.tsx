"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { disconnectIntegration } from "@/lib/actions/settings";
import { toast } from "@/components/ui/use-toast";
import { Calendar, Slack } from "lucide-react";

type Provider = "google" | "slack";

interface Connection {
  provider: Provider;
  provider_account_id: string | null;
}

interface IntegrationsCardProps {
  connections: Connection[];
  googleConfigured: boolean;
  slackConfigured: boolean;
}

const PROVIDERS: Array<{ key: Provider; name: string; description: string; icon: typeof Calendar }> = [
  {
    key: "google",
    name: "Google Calendar & Meet",
    description: "Sync deal meetings and generate Meet links.",
    icon: Calendar,
  },
  {
    key: "slack",
    name: "Slack",
    description: "Post deal updates to a Slack channel.",
    icon: Slack,
  },
];

export function IntegrationsCard({ connections, googleConfigured, slackConfigured }: IntegrationsCardProps) {
  const [isPending, startTransition] = useTransition();
  const configured: Record<Provider, boolean> = { google: googleConfigured, slack: slackConfigured };

  function handleDisconnect(provider: Provider) {
    startTransition(async () => {
      const result = await disconnectIntegration(provider);
      if (result.success) {
        toast({ title: "Disconnected", variant: "success" });
      } else {
        toast({ title: "Error", description: result.error, variant: "destructive" });
      }
    });
  }

  return (
    <div className="rounded-xl border bg-card p-6 space-y-6">
      <div>
        <h2 className="font-semibold">Integrations</h2>
        <p className="text-sm text-muted-foreground">Connect external tools to your account.</p>
      </div>

      <div className="space-y-3">
        {PROVIDERS.map(({ key, name, description, icon: Icon }) => {
          const connection = connections.find((c) => c.provider === key);
          const isConfigured = configured[key];

          return (
            <div key={key} className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted text-muted-foreground">
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">{name}</p>
                  <p className="text-xs text-muted-foreground">{description}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {connection ? (
                  <>
                    <Badge variant="success">Connected</Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      loading={isPending}
                      onClick={() => handleDisconnect(key)}
                    >
                      Disconnect
                    </Button>
                  </>
                ) : (
                  <>
                    <Badge variant="gray">Not connected</Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!isConfigured}
                      title={isConfigured ? undefined : "Not configured on this server yet"}
                    >
                      Connect
                    </Button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
