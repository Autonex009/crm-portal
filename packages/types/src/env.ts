import { z } from "zod";

const emptyToUndefined = (schema: z.ZodTypeAny) =>
  z.preprocess((val) => (typeof val === "string" && val.trim() === "" ? undefined : val), schema.optional());

export const serverEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  TOKEN_ENCRYPTION_KEY: z.string().min(32),
  // Optional integrations — app must boot without these
  REDIS_URL: emptyToUndefined(z.string().url()),
  GOOGLE_CLIENT_ID: emptyToUndefined(z.string()),
  GOOGLE_CLIENT_SECRET: emptyToUndefined(z.string()),
  GOOGLE_REDIRECT_URI: emptyToUndefined(z.string().url()),
  SLACK_BOT_TOKEN: emptyToUndefined(z.string()),
  SLACK_SIGNING_SECRET: emptyToUndefined(z.string()),
  SLACK_APP_TOKEN: emptyToUndefined(z.string()),
  STRIPE_SECRET_KEY: emptyToUndefined(z.string()),
  STRIPE_WEBHOOK_SECRET: emptyToUndefined(z.string()),
  RESEND_API_KEY: emptyToUndefined(z.string()),
});
export type ServerEnv = z.infer<typeof serverEnvSchema>;

export const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().url(),
});
export type PublicEnv = z.infer<typeof publicEnvSchema>;

function loadEnvFiles() {
  if (typeof process.loadEnvFile === "function") {
    const candidates = [
      ".env",
      "../.env",
      "../../.env",
      "../../../.env",
      ".env.local",
      "../.env.local",
      "../../.env.local",
    ];
    for (const file of candidates) {
      try {
        process.loadEnvFile(file);
      } catch {
        // Ignore if file does not exist or cannot be read
      }
    }
  }
}

export function parseServerEnv(env: NodeJS.ProcessEnv = process.env): ServerEnv {
  loadEnvFiles();
  const result = serverEnvSchema.safeParse(env);
  if (!result.success) {
    const missing = result.error.issues
      .filter((i) => i.code === "invalid_type" && i.received === "undefined")
      .map((i) => i.path.join("."));
    const invalid = result.error.issues
      .filter((i) => !(i.code === "invalid_type" && i.received === "undefined"))
      .map((i) => `${i.path.join(".")}: ${i.message}`);
    const lines = [
      "Invalid environment variables:",
      ...missing.map((k) => `  MISSING: ${k}`),
      ...invalid.map((k) => `  INVALID: ${k}`),
    ];
    throw new Error(lines.join("\n"));
  }
  return result.data;
}
