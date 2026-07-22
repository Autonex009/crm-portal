"use client";

import { useEffect, useState, useTransition } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { scheduleMeeting } from "@/lib/actions/meetings";
import { Video, Copy, ExternalLink, Check } from "lucide-react";

/** Minimal shape needed to prefill the form — a subset of the leads-client Lead. */
export interface ScheduleMeetingLead {
  id: string;
  title: string | null;
  contact_name: string | null;
  email: string | null;
  company_name: string | null;
}

interface Result {
  meetLink: string | null;
  eventId: string;
  htmlLink: string | null;
}

/** datetime-local value (local wall clock) for the next round half-hour. */
function defaultStartLocal(): string {
  const d = new Date();
  d.setSeconds(0, 0);
  d.setMinutes(d.getMinutes() < 30 ? 30 : 60);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function defaultTitle(lead: ScheduleMeetingLead): string {
  const who = lead.contact_name ?? lead.title ?? "Lead";
  return `Intro call — ${who}`;
}

export function ScheduleMeetingDialog({
  lead,
  onOpenChange,
}: {
  lead: ScheduleMeetingLead | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [attendeeEmail, setAttendeeEmail] = useState("");
  const [startLocal, setStartLocal] = useState("");
  const [duration, setDuration] = useState("30");
  const [description, setDescription] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [copied, setCopied] = useState(false);

  // Re-seed the form whenever a new lead is opened; clear any prior result.
  useEffect(() => {
    if (!lead) return;
    setTitle(defaultTitle(lead));
    setAttendeeEmail(lead.email ?? "");
    setStartLocal(defaultStartLocal());
    setDuration("30");
    setDescription("");
    setResult(null);
    setCopied(false);
  }, [lead]);

  function handleSubmit() {
    if (!lead) return;
    if (!startLocal) {
      toast({ title: "Pick a date and time", variant: "destructive" });
      return;
    }
    const startAt = new Date(startLocal); // interpreted in the browser's local zone
    if (Number.isNaN(startAt.getTime())) {
      toast({ title: "Invalid date and time", variant: "destructive" });
      return;
    }

    const fd = new FormData();
    fd.set("leadId", lead.id);
    fd.set("title", title);
    fd.set("startAt", startAt.toISOString());
    fd.set("durationMinutes", duration);
    fd.set("attendeeEmail", attendeeEmail);
    fd.set("description", description);
    fd.set("timeZone", Intl.DateTimeFormat().resolvedOptions().timeZone);

    startTransition(async () => {
      const res = await scheduleMeeting(fd);
      if (res.success) {
        setResult(res.data);
        toast({ title: "Meeting scheduled", variant: "success" });
      } else {
        toast({ title: "Couldn't schedule meeting", description: res.error, variant: "destructive" });
      }
    });
  }

  async function copyLink() {
    if (!result?.meetLink) return;
    await navigator.clipboard.writeText(result.meetLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Dialog open={!!lead} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="h-5 w-5 text-muted-foreground" />
            Schedule Google Meet
          </DialogTitle>
          <DialogDescription>
            {lead?.company_name
              ? `Book a meeting with ${lead.contact_name ?? lead.title ?? "this lead"} (${lead.company_name}).`
              : "Book a meeting and generate a Google Meet link."}
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/40 p-4 space-y-3">
              <p className="text-sm font-medium">Meeting created on your Google Calendar.</p>
              {result.meetLink ? (
                <div className="flex items-center gap-2">
                  <Input readOnly value={result.meetLink} className="text-xs" />
                  <Button type="button" variant="outline" size="icon" onClick={copyLink} title="Copy link">
                    {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  The Meet link is being generated by Google — open the event to grab it.
                </p>
              )}
              {result.htmlLink && (
                <a
                  href={result.htmlLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Open in Google Calendar
                </a>
              )}
            </div>
            <DialogFooter>
              <Button type="button" onClick={() => onOpenChange(false)}>Done</Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="meeting-title">Title</Label>
              <Input
                id="meeting-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Intro call"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="meeting-attendee">Attendee email</Label>
              <Input
                id="meeting-attendee"
                type="email"
                value={attendeeEmail}
                onChange={(e) => setAttendeeEmail(e.target.value)}
                placeholder="lead@company.com"
              />
              {!attendeeEmail && (
                <p className="text-xs text-muted-foreground">
                  No email on this lead — add one to email the invite, or leave blank for a link only.
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="meeting-start">Starts</Label>
                <Input
                  id="meeting-start"
                  type="datetime-local"
                  value={startLocal}
                  onChange={(e) => setStartLocal(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="meeting-duration">Duration</Label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger id="meeting-duration">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="meeting-description">Description (optional)</Label>
              <Textarea
                id="meeting-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Agenda, context…"
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="button" onClick={handleSubmit} loading={isPending}>
                <Video className="h-4 w-4" />
                Schedule
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
