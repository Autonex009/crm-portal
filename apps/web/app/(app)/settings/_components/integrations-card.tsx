"use client";

import { useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
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
  /** Set by the OAuth callback redirect: "connected" on success. */
  googleStatus?: string;
  /** Set by the OAuth callback redirect: an error code on failure. */
  googleError?: string;
}

const GOOGLE_ERROR_MESSAGES: Record<string, string> = {
  access_denied: "You cancelled the Google connection.",
  state_mismatch: "Security check failed, please try again.",
  exchange_failed: "Couldn't connect Google, please try again.",
  save_failed: "Couldn't connect Google, please try again.",
  unauthorized: "Please sign in and try connecting again.",
  not_configured: "Google isn't configured on this server.",
};

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

export function IntegrationsCard({
  connections,
  googleConfigured,
  slackConfigured,
  googleStatus,
  googleError,
}: IntegrationsCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const statusHandled = useRef(false);
  const configured: Record<Provider, boolean> = { google: googleConfigured, slack: slackConfigured };

  // Surface the OAuth callback result once, then strip the query params so a
  // refresh doesn't re-toast. The ref guards against React's double-invoke in dev.
  useEffect(() => {
    if (statusHandled.current) return;
    if (!googleStatus && !googleError) return;
    statusHandled.current = true;

    if (googleStatus === "connected") {
      toast({ title: "Google connected", variant: "success" });
    } else if (googleError) {
      toast({
        title: "Google connection failed",
        description: GOOGLE_ERROR_MESSAGES[googleError] ?? "Couldn't connect Google, please try again.",
        variant: "destructive",
      });
    }
    router.replace("/settings?tab=integrations");
  }, [googleStatus, googleError, router]);

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
                    {isConfigured && key === "google" ? (
                      <Button asChild variant="outline" size="sm">
                        <a href="/api/integrations/google/connect">Connect</a>
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!isConfigured}
                        title={isConfigured ? undefined : "Not configured on this server yet"}
                      >
                        Connect
                      </Button>
                    )}
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
