import { Router, Request, Response } from "express";
import { activities, paginate } from "../store";
import { CreateActivitySchema, Activity } from "@crm/types";
import { z } from "zod";

const router = Router();

// GET /api/v1/activities
router.get("/", (req: Request, res: Response) => {
  const { entity_type, entity_id, page, per_page } = req.query;

  let list = Array.from(activities.values());

  if (entity_type) {
    list = list.filter((a) => a.entity_type === entity_type);
  }

  if (entity_id) {
    list = list.filter((a) => a.entity_id === entity_id);
  }

  // Sort by occurred_at / created_at desc
  list.sort((a, b) => b.created_at.localeCompare(a.created_at));

  const result = paginate(list, {
    page: Number(page),
    per_page: Number(per_page)
  });

  return res.json(result);
});

// POST /api/v1/activities
router.post("/", (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  try {
    const parsed = CreateActivitySchema.parse(req.body);

    const newId = crypto.randomUUID();
    const timestamp = new Date().toISOString();

    const newActivity: Activity = {
      id: newId,
      entity_type: parsed.entity_type,
      entity_id: parsed.entity_id,
      type: parsed.type,
      author_id: req.user.id,
      body: parsed.body,
      occurred_at: parsed.occurred_at || timestamp,
      created_at: timestamp,
      updated_at: timestamp
    };

    activities.set(newId, newActivity);

    return res.status(201).json({
      success: true,
      data: newActivity
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: err.errors
      });
    }
    return res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
});

export default router;
