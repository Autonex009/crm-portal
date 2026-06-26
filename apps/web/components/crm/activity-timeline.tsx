import { formatDistanceToNow } from "date-fns";
import { MessageSquare, Phone, Mail, Calendar, Zap } from "lucide-react";
import { Avatar, AvatarFallback, initials } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type ActivityType = "note" | "call" | "email" | "meeting" | "system";

const typeConfig: Record<ActivityType, { icon: React.ElementType; color: string; label: string }> = {
  note: { icon: MessageSquare, color: "bg-blue-100 text-blue-600", label: "Note" },
  call: { icon: Phone, color: "bg-green-100 text-green-600", label: "Call" },
  email: { icon: Mail, color: "bg-purple-100 text-purple-600", label: "Email" },
  meeting: { icon: Calendar, color: "bg-orange-100 text-orange-600", label: "Meeting" },
  system: { icon: Zap, color: "bg-gray-100 text-gray-600", label: "System" },
};

export interface ActivityItem {
  id: string;
  type: ActivityType;
  body: string;
  occurred_at: string;
  author: { full_name: string; avatar_url: string | null } | null;
}

interface ActivityTimelineProps {
  activities: ActivityItem[];
  className?: string;
}

export function ActivityTimeline({ activities, className }: ActivityTimelineProps) {
  if (activities.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        No activity yet. Add a note, call, or email to start the timeline.
      </p>
    );
  }

  return (
    <ol className={cn("relative space-y-6", className)}>
      {activities.map((activity, idx) => {
        const { icon: Icon, color, label } = typeConfig[activity.type];
        const isLast = idx === activities.length - 1;

        return (
          <li key={activity.id} className="relative flex gap-4">
            {!isLast && (
              <div className="absolute left-5 top-10 bottom-0 w-px bg-border" />
            )}

            <div className={cn("relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full", color)}>
              <Icon className="h-4 w-4" />
            </div>

            <div className="flex-1 min-w-0 pt-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {label}
                </span>
                <span className="text-xs text-muted-foreground">·</span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(activity.occurred_at), { addSuffix: true })}
                </span>
              </div>

              <div className="rounded-lg border bg-card p-3 text-sm">
                <p className="whitespace-pre-wrap text-foreground">{activity.body}</p>
              </div>

              {activity.author && (
                <div className="mt-2 flex items-center gap-1.5">
                  <Avatar className="h-5 w-5">
                    <AvatarFallback className="text-[10px]">
                      {initials(activity.author.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-muted-foreground">{activity.author.full_name}</span>
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
