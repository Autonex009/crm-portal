"use client";

import { useTransition } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateUserRole } from "@/lib/actions/settings";
import { toast } from "@/components/ui/use-toast";
import { initials, formatDate } from "@/lib/utils";

interface Member {
  id: string;
  full_name: string;
  role: string;
  created_at: string;
}

const ROLES = ["admin", "sales", "account_manager", "client"] as const;
type Role = (typeof ROLES)[number];

export function TeamCard({ members, currentUserId }: { members: Member[]; currentUserId: string }) {
  const [isPending, startTransition] = useTransition();

  function handleRoleChange(id: string, role: Role) {
    startTransition(async () => {
      const result = await updateUserRole(id, role);
      if (result.success) {
        toast({ title: "Role updated", variant: "success" });
      } else {
        toast({ title: "Error", description: result.error, variant: "destructive" });
      }
    });
  }

  return (
    <div className="rounded-xl border bg-card p-6 space-y-6">
      <div>
        <h2 className="font-semibold">Team</h2>
        <p className="text-sm text-muted-foreground">
          Manage roles for everyone in your workspace.
        </p>
      </div>

      <div className="divide-y rounded-lg border">
        {members.map((member) => (
          <div key={member.id} className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">{initials(member.full_name)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{member.full_name}</p>
                <p className="text-xs text-muted-foreground">Joined {formatDate(member.created_at)}</p>
              </div>
            </div>

            {member.id === currentUserId ? (
              <Badge variant="secondary" className="capitalize font-normal">
                {member.role.replace("_", " ")} (you)
              </Badge>
            ) : (
              <Select
                value={member.role}
                onValueChange={(role) => handleRoleChange(member.id, role as Role)}
                disabled={isPending}
              >
                <SelectTrigger className="w-40 capitalize">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r} className="capitalize">
                      {r.replace("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
