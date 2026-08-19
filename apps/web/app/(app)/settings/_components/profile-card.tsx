"use client";

import { useTransition } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { updateProfile } from "@/lib/actions/settings";
import { toast } from "@/components/ui/use-toast";
import { initials } from "@/lib/utils";
import { User, Mail, Shield, Image as ImageIcon, Save, CheckCircle2 } from "lucide-react";

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
        toast({ title: "Profile updated successfully", variant: "success" });
      } else {
        toast({ title: "Update failed", description: result.error, variant: "destructive" });
      }
    });
  }

  return (
    <div className="rounded-2xl border bg-card p-6 shadow-xs space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h2 className="text-base font-bold tracking-tight text-foreground flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            Personal Profile
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage your public workspace identity and contact settings.
          </p>
        </div>
        <Badge variant="secondary" className="capitalize text-xs font-semibold px-3 py-1 bg-muted border">
          <Shield className="h-3 w-3 mr-1 text-indigo-500" />
          {role.replace("_", " ")} Role
        </Badge>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 max-w-xl">
        {/* Avatar & Header Preview */}
        <div className="flex items-center gap-5 p-4 rounded-xl bg-muted/20 border">
          <Avatar className="h-16 w-16 border-2 border-background shadow-xs">
            <AvatarImage src={avatarUrl ?? undefined} alt={fullName} />
            <AvatarFallback className="text-lg font-extrabold bg-primary/10 text-primary">
              {initials(fullName || email)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-1.5">
            <Label htmlFor="avatar_url" className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
              Avatar Image URL
            </Label>
            <Input
              id="avatar_url"
              name="avatar_url"
              defaultValue={avatarUrl ?? ""}
              placeholder="https://example.com/avatar.png"
              className="text-xs bg-background"
            />
          </div>
        </div>

        {/* Inputs */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="full_name" className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-muted-foreground" />
              Full Name
            </Label>
            <Input id="full_name" name="full_name" defaultValue={fullName} required className="bg-background" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-muted-foreground" />
              Email Address (Account ID)
            </Label>
            <Input id="email" value={email} disabled className="bg-muted/50 text-muted-foreground text-xs" />
          </div>
        </div>

        <div className="flex items-center justify-between border-t pt-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span>Profile info is synced across team audit logs</span>
          </div>

          <Button type="submit" loading={isPending} className="gap-2 font-semibold">
            <Save className="h-4 w-4" />
            Save Profile
          </Button>
        </div>
      </form>
    </div>
  );
}
