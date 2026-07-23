"use client";

import { useTransition } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { updateProfile } from "@/lib/actions/settings";
import { toast } from "@/components/ui/use-toast";
import { initials, roleLabel } from "@/lib/utils";

interface ProfileCardProps {
  email: string;
  fullName: string;
  avatarUrl: string | null;
  role: string;
}

export function ProfileCard({ email, fullName, avatarUrl, role }: ProfileCardProps) {
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await updateProfile(formData);
      if (result.success) {
        toast({ title: "Profile updated", variant: "success" });
      } else {
        toast({ title: "Error", description: result.error, variant: "destructive" });
      }
    });
  }

  return (
    <div className="rounded-xl border bg-card p-6 space-y-6">
      <div>
        <h2 className="font-semibold">Profile</h2>
        <p className="text-sm text-muted-foreground">
          Your personal information, visible to your team.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={avatarUrl ?? undefined} alt={fullName} />
            <AvatarFallback className="text-lg">{initials(fullName || email)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="avatar_url">Avatar URL</Label>
            <Input
              id="avatar_url"
              name="avatar_url"
              defaultValue={avatarUrl ?? ""}
              placeholder="https://example.com/avatar.png"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="full_name">Full name</Label>
          <Input id="full_name" name="full_name" defaultValue={fullName} required />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" value={email} disabled />
        </div>

        <div className="space-y-1.5">
          <Label>Role</Label>
          <div>
            <Badge variant="secondary" className="font-normal">
              {roleLabel(role)}
            </Badge>
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" loading={isPending}>
            Save changes
          </Button>
        </div>
      </form>
    </div>
  );
}
