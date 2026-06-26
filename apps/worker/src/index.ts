import { parseServerEnv } from "@crm/types";

// Validate env at startup — fail fast if required vars missing
const env = parseServerEnv();

const redisUrl = env.REDIS_URL;

if (!redisUrl) {
  console.warn("[worker] REDIS_URL not set — worker will start but queues are disabled.");
  // Phase 4 will populate queue processors here
  process.exit(0);
}

console.log("[worker] Starting with Redis:", redisUrl.replace(/:\/\/.*@/, "://***@"));

// Phase 4: BullMQ queue processors are registered here.
// For now, worker exits gracefully when no queues are configured.
process.on("SIGTERM", () => {
  console.log("[worker] Shutting down gracefully");
  process.exit(0);
});
