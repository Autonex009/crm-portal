"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { updateSiteAssessment } from "@/lib/actions/deals";
import { Calendar, MapPin, FileText, CheckCircle2, Edit2 } from "lucide-react";

interface SiteAssessmentCardProps {
  dealId: string;
  assessmentDate: string | null;
  assessmentLocation: string | null;
  assessmentNotes: string | null;
}

export function SiteAssessmentCard({
  dealId,
  assessmentDate,
  assessmentLocation,
  assessmentNotes,
}: SiteAssessmentCardProps) {
  const [isEditing, setIsEditing] = useState(!assessmentDate && !assessmentLocation);
  const [date, setDate] = useState(assessmentDate ?? "");
  const [location, setLocation] = useState(assessmentLocation ?? "");
  const [notes, setNotes] = useState(assessmentNotes ?? "");
  const [isPending, startTransition] = useTransition();

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await updateSiteAssessment(dealId, { date, location, notes });
      if (res.success) {
        toast({ title: "Site Assessment updated", variant: "success" });
        setIsEditing(false);
      } else {
        toast({ title: "Error", description: res.error, variant: "destructive" });
      }
    });
  }

  return (
    <div className="rounded-xl border bg-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-cyan-500" />
          <h3 className="font-semibold text-lg">Site Assessment Tracking</h3>
        </div>
        {!isEditing && (
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
            <Edit2 className="h-3.5 w-3.5 mr-1" /> Edit Assessment
          </Button>
        )}
      </div>

      {isEditing ? (
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="date">Assessment Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="location">Location / Site Address</Label>
              <Input
                id="location"
                placeholder="e.g. Plot 42, Industrial Area, Sector 62, Noida"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notes">Technical Assessment Notes / Constraints</Label>
            <Textarea
              id="notes"
              rows={3}
              placeholder="Record structural feasibility, power connection specs, site photos link..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2">
            {(assessmentDate || assessmentLocation) && (
              <Button type="button" variant="ghost" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
            )}
            <Button type="submit" loading={isPending}>
              Save Assessment
            </Button>
          </div>
        </form>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-2.5 p-3 rounded-lg border bg-muted/20">
              <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground font-medium">Scheduled Date</p>
                <p className="text-sm font-semibold">{date ? date : "Not scheduled"}</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5 p-3 rounded-lg border bg-muted/20">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground font-medium">Site Address</p>
                <p className="text-sm font-semibold">{location ? location : "No location specified"}</p>
              </div>
            </div>
          </div>
          {notes && (
            <div className="p-3 rounded-lg border bg-muted/20 space-y-1">
              <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                <FileText className="h-3.5 w-3.5" /> Technical Notes
              </p>
              <p className="text-sm text-foreground whitespace-pre-wrap">{notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
