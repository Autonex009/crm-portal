import { z } from "zod";

const slackEnvSchema = z.object({
  SLACK_BOT_TOKEN: z.string().min(1),
  SLACK_SIGNING_SECRET: z.string().min(1),
  SLACK_APP_TOKEN: z.string().min(1).optional(),
});

const result = slackEnvSchema.safeParse(process.env);
if (!result.success) {
  console.warn(
    "[slack-bot] Slack credentials not configured — bot will not start.",
    "\nMissing:",
    result.error.issues.map((i) => i.path.join(".")).join(", ")
  );
  process.exit(0);
}

// Phase 5: Slack Bolt app and handlers are registered here.
console.log("[slack-bot] Slack credentials present. Bot initialisation deferred to Phase 5.");

process.on("SIGTERM", () => {
  console.log("[slack-bot] Shutting down gracefully");
  process.exit(0);
});
