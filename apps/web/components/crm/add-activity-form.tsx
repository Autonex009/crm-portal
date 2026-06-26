"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createActivity } from "@/lib/actions/activities";
import { toast } from "@/components/ui/use-toast";
import { MessageSquare, Phone, Mail, Calendar } from "lucide-react";

type EntityType = "company" | "contact" | "lead" | "deal" | "quote" | "invoice";
type ActivityType = "note" | "call" | "email" | "meeting";

interface AddActivityFormProps {
  entityType: EntityType;
  entityId: string;
}

const types: { value: ActivityType; label: string; icon: React.ElementType }[] = [
  { value: "note", label: "Note", icon: MessageSquare },
  { value: "call", label: "Call", icon: Phone },
  { value: "email", label: "Email", icon: Mail },
  { value: "meeting", label: "Meeting", icon: Calendar },
];

export function AddActivityForm({ entityType, entityId }: AddActivityFormProps) {
  const [type, setType] = useState<ActivityType>("note");
  const [body, setBody] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;

    const formData = new FormData();
    formData.set("entity_type", entityType);
    formData.set("entity_id", entityId);
    formData.set("type", type);
    formData.set("body", body.trim());

    startTransition(async () => {
      const result = await createActivity(formData);
      if (result.success) {
        setBody("");
        toast({ title: "Activity logged", variant: "success" });
      } else {
        toast({ title: "Failed to log activity", description: result.error, variant: "destructive" });
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex gap-1 rounded-lg border p-1 bg-muted/30 w-fit">
        {types.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.value}
              type="button"
              onClick={() => setType(t.value)}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all ${
                type === t.value
                  ? "bg-background shadow text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={`Add a ${type}...`}
        rows={3}
        className="resize-none"
      />

      <div className="flex justify-end">
        <Button type="submit" size="sm" loading={isPending} disabled={!body.trim()}>
          Log {type}
        </Button>
      </div>
    </form>
  );
}
