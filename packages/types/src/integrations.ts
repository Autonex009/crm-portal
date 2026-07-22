import { z } from "zod";
import { IntegrationProviderSchema } from "./enums";

export const IntegrationConnectionSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  provider: IntegrationProviderSchema,
  access_token: z.string(),
  refresh_token: z.string().nullable(),
  expires_at: z.string().datetime().nullable(),
  scope: z.string().nullable(),
  provider_account_id: z.string().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});
export type IntegrationConnection = z.infer<typeof IntegrationConnectionSchema>;

export const CalendarEventSchema = z.object({
  id: z.string().uuid(),
  deal_id: z.string().uuid().nullable(),
  lead_id: z.string().uuid().nullable(),
  google_event_id: z.string(),
  title: z.string(),
  start_at: z.string().datetime(),
  end_at: z.string().datetime(),
  meet_link: z.string().url().nullable(),
  synced_at: z.string().datetime(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});
export type CalendarEvent = z.infer<typeof CalendarEventSchema>;

export const SlackChannelSchema = z.object({
  id: z.string().uuid(),
  deal_id: z.string().uuid(),
  slack_channel_id: z.string(),
  channel_name: z.string(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});
export type SlackChannel = z.infer<typeof SlackChannelSchema>;
