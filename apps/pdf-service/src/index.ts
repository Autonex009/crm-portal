import express from "express";

const PORT = process.env.PORT ?? 3003;
const app = express();
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "pdf-service" });
});

// Phase 2: PDF generation endpoints are registered here.
// Puppeteer browser instance is initialised lazily on first request.

app.listen(PORT, () => {
  console.log(`[pdf-service] Listening on port ${PORT}`);
});

process.on("SIGTERM", () => {
  console.log("[pdf-service] Shutting down gracefully");
  process.exit(0);
});
