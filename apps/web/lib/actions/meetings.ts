"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";
import { getValidGoogleAccessToken } from "@/lib/integrations/google-connection";
import { createCalendarEvent, GoogleApiError } from "@/lib/integrations/google";

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

const ScheduleMeetingInput = z.object({
  leadId: z.string().uuid(),
  title: z.string().min(1, "Title is required").max(255),
  // Absolute instant (ISO), produced client-side from the local datetime input.
  startAt: z.string().datetime(),
  durationMinutes: z.coerce.number().int().positive().max(480).default(30),
  // Optional attendee — blank means an organizer-only meeting (link but no invite email).
  attendeeEmail: z
    .preprocess((v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
      z.string().email("Enter a valid attendee email").optional()),
  description: z.string().max(4000).optional(),
  timeZone: z.string().min(1),
});

function meetingFields(formData: FormData) {
  return {
    leadId: formData.get("leadId"),
    title: formData.get("title"),
    startAt: formData.get("startAt"),
    durationMinutes: formData.get("durationMinutes") ?? 30,
    attendeeEmail: formData.get("attendeeEmail"),
    description: (formData.get("description") as string) || undefined,
    timeZone: formData.get("timeZone"),
  };
}

const NOT_CONNECTED_MSG =
  "Connect your Google account in Settings → Integrations first.";
const NEEDS_RECONNECT_MSG =
  "Your Google connection expired. Please reconnect in Settings → Integrations.";

export async function scheduleMeeting(
  formData: FormData
): Promise<ActionResult<{ meetLink: string | null; eventId: string; htmlLink: string | null }>> {
  const supabase = await createClient();
  const user = await getAuthUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const parsed = ScheduleMeetingInput.safeParse(meetingFields(formData));
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }
  const { leadId, title, startAt, durationMinutes, attendeeEmail, description, timeZone } =
    parsed.data;

  const startISO = new Date(startAt).toISOString();
  const endISO = new Date(Date.parse(startAt) + durationMinutes * 60_000).toISOString();
  const attendeeEmails = attendeeEmail ? [attendeeEmail] : [];

  const token = await getValidGoogleAccessToken(supabase, user.id);
  if (!token.ok) {
    return {
      success: false,
      error: token.code === "not_connected" ? NOT_CONNECTED_MSG : NEEDS_RECONNECT_MSG,
    };
  }

  // Same requestId across the initial attempt and the one 401 retry so Google
  // treats it as the same conference and doesn't create a duplicate Meet link.
  const requestId = randomUUID();

  let event;
  try {
    event = await createCalendarEvent(token.accessToken, {
      title,
      description,
      startISO,
      endISO,
      timeZone,
      attendeeEmails,
      requestId,
    });
  } catch (err) {
    if (err instanceof GoogleApiError && err.status === 401) {
      // Access token rejected mid-flight — force a refresh and retry once.
      const refreshed = await getValidGoogleAccessToken(supabase, user.id, { forceRefresh: true });
      if (!refreshed.ok) return { success: false, error: NEEDS_RECONNECT_MSG };
      try {
        event = await createCalendarEvent(refreshed.accessToken, {
          title,
          description,
          startISO,
          endISO,
          timeZone,
          attendeeEmails,
          requestId,
        });
      } catch (retryErr) {
        console.error("[schedule-meeting] retry failed:", retryErr);
        return { success: false, error: "Couldn't create the meeting in Google Calendar. Please try again." };
      }
    } else if (err instanceof GoogleApiError && err.status === 403) {
      return {
        success: false,
        error: "Google denied calendar access. Please reconnect and grant Calendar permission.",
      };
    } else {
      console.error("[schedule-meeting] event creation failed:", err);
      return { success: false, error: "Couldn't create the meeting in Google Calendar. Please try again." };
    }
  }

  // Persist the event linked to the lead. If this fails the meeting still
  // exists in Google, so return success with the link rather than blocking.
  const { error: insertError } = await supabase.from("calendar_events").insert({
    lead_id: leadId,
    google_event_id: event.id,
    title,
    start_at: startISO,
    end_at: endISO,
    meet_link: event.meetLink,
  });
  if (insertError) {
    console.error("[schedule-meeting] calendar_events insert failed:", insertError);
  }

  revalidatePath("/leads");
  return {
    success: true,
    data: { meetLink: event.meetLink, eventId: event.id, htmlLink: event.htmlLink },
  };
}
