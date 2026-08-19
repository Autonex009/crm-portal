"use client";

import { useTransition } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateUserRole } from "@/lib/actions/settings";
import { toast } from "@/components/ui/use-toast";
import { initials, formatDate, roleLabel } from "@/lib/utils";

interface Member {
  id: string;
  full_name: string;
  role: string;
  created_at: string;
}

const ROLES = ["owner", "admin", "sales", "account_manager", "client"] as const;
type Role = (typeof ROLES)[number];

// Only an owner may hand out (or take away) the owner/admin roles.
const PRIVILEGED_ROLES = new Set<string>(["owner", "admin"]);

export function TeamCard({
  members,
  currentUserId,
  currentUserRole,
}: {
  members: Member[];
  currentUserId: string;
  currentUserRole: string;
}) {
  const [isPending, startTransition] = useTransition();

  const viewerIsOwner = currentUserRole === "owner";
  const canManageRoles = viewerIsOwner || currentUserRole === "admin";
  // Admins can assign everyone except owner/admin; owners can assign anything.
  const assignableRoles = ROLES.filter((r) => viewerIsOwner || !PRIVILEGED_ROLES.has(r));

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
        {members.map((member) => {
          const isSelf = member.id === currentUserId;
          // A privileged (owner/admin) member can only be changed by an owner.
          const editable =
            canManageRoles && !isSelf && (viewerIsOwner || !PRIVILEGED_ROLES.has(member.role));

          return (
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

              {editable ? (
                <Select
                  value={member.role}
                  onValueChange={(role) => handleRoleChange(member.id, role as Role)}
                  disabled={isPending}
                >
                  <SelectTrigger className="w-44">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {assignableRoles.map((r) => (
                      <SelectItem key={r} value={r}>
                        {roleLabel(r)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Badge variant="secondary" className="font-normal">
                  {roleLabel(member.role)}
                  {isSelf ? " (you)" : ""}
                </Badge>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
