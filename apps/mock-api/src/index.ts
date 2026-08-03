import express from "express";
import cors from "cors";
import helmet from "helmet";
import { authMiddleware } from "./middleware/auth";
import { seedDatabase } from "./store/seed";

// Import Route Handlers
import authRouter from "./routes/auth";
import profilesRouter from "./routes/profiles";
import companiesRouter from "./routes/companies";
import contactsRouter from "./routes/contacts";
import leadsRouter from "./routes/leads";
import dealsRouter from "./routes/deals";
import activitiesRouter from "./routes/activities";
import billingRouter from "./routes/billing";
import dashboardRouter from "./routes/dashboard";

const app = express();
const PORT = process.env.PORT || 4000;

// Security and utility middleware
app.use(helmet());
app.use(cors({
  origin: "*", // Allow all origins for mock testing
  methods: ["GET", "POST", "PATCH", "DELETE", "PUT", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());

// Seed the database on launch
seedDatabase();

// Public health check route
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "crm-mock-api"
  });
});

// Seed reset trigger (optional helper for testing)
app.post("/api/v1/reset", (req, res) => {
  seedDatabase();
  res.json({
    success: true,
    message: "In-memory database reset to seed defaults."
  });
});

// Apply auth middleware to all api v1 routes (internally handles public paths)
app.use("/api/v1", authMiddleware);

// Bind Sub-routers
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/profiles", profilesRouter);
app.use("/api/v1/companies", companiesRouter);
app.use("/api/v1/contacts", contactsRouter);
app.use("/api/v1/leads", leadsRouter);
app.use("/api/v1/deals", dealsRouter);
app.use("/api/v1/activities", activitiesRouter);
app.use("/api/v1/billing", billingRouter);
app.use("/api/v1/dashboard", dashboardRouter);

// Start server conditionally (skip when loaded as serverless handler on Vercel)
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`[crm-mock-api] Server running on port ${PORT}`);
    console.log(`[crm-mock-api] API base URL: http://localhost:${PORT}/api/v1`);
  });
}

export default app;

