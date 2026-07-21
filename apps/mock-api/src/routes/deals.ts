import { Router, Request, Response } from "express";
import { deals, companies, contacts, paginate } from "../store";
import { CreateDealSchema, Deal, DealStageSchema } from "@crm/types";
import { z } from "zod";

const router = Router();

// GET /api/v1/deals
router.get("/", (req: Request, res: Response) => {
  const { stage, owner_id, company_id, state, page, per_page } = req.query;

  let list = Array.from(deals.values());

  // Filter based on state
  if (state === "deleted") {
    list = list.filter((d) => d.deleted_at !== null);
  } else {
    list = list.filter((d) => d.deleted_at === null);
  }

  // Filter by stage
  if (stage) {
    list = list.filter((d) => d.stage === stage);
  }

  // Filter by owner_id
  if (owner_id) {
    list = list.filter((d) => d.owner_id === owner_id);
  }

  // Filter by company_id
  if (company_id) {
    list = list.filter((d) => d.company_id === company_id);
  }

  // Sort by created_at desc
  list.sort((a, b) => b.created_at.localeCompare(a.created_at));

  const result = paginate(list, {
    page: Number(page),
    per_page: Number(per_page)
  });

  return res.json(result);
});

// GET /api/v1/deals/:id
router.get("/:id", (req: Request, res: Response) => {
  const dealId = req.params.id;
  if (!dealId) {
    return res.status(400).json({ success: false, error: "ID param is required" });
  }

  const deal = deals.get(dealId);
  if (!deal) {
    return res.status(404).json({
      success: false,
      error: "Deal not found"
    });
  }
  return res.json({
    success: true,
    data: deal
  });
});

// POST /api/v1/deals
router.post("/", (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  try {
    const parsed = CreateDealSchema.parse(req.body);

    if (!companies.has(parsed.company_id)) {
      return res.status(400).json({
        success: false,
        error: `Company with ID ${parsed.company_id} does not exist`
      });
    }

    if (parsed.primary_contact_id && !contacts.has(parsed.primary_contact_id)) {
      return res.status(400).json({
        success: false,
        error: `Contact with ID ${parsed.primary_contact_id} does not exist`
      });
    }

    const newId = crypto.randomUUID();
    const timestamp = new Date().toISOString();

    const newDeal: Deal = {
      id: newId,
      company_id: parsed.company_id,
      title: parsed.title,
      job_title: parsed.job_title || null,
      primary_contact_id: parsed.primary_contact_id || null,
      stage: parsed.stage || "prospect",
      amount: parsed.amount || 0,
      product_use_case: parsed.product_use_case || null,
      probability: parsed.probability || 10,
      next_action: parsed.next_action || null,
      notes: parsed.notes || null,
      owner_id: req.user.id,
      expected_close_date: parsed.expected_close_date || null,
      deleted_at: null,
      created_at: timestamp,
      updated_at: timestamp
    };

    deals.set(newId, newDeal);

    return res.status(201).json({
      success: true,
      data: newDeal
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

// PATCH /api/v1/deals/:id
router.patch("/:id", (req: Request, res: Response) => {
  const dealId = req.params.id;
  if (!dealId) {
    return res.status(400).json({ success: false, error: "ID param is required" });
  }

  const deal = deals.get(dealId);
  if (!deal) {
    return res.status(404).json({
      success: false,
      error: "Deal not found"
    });
  }

  try {
    const UpdateSchema = CreateDealSchema.partial();
    const parsed = UpdateSchema.parse(req.body);

    if (parsed.company_id && !companies.has(parsed.company_id)) {
      return res.status(400).json({
        success: false,
        error: `Company with ID ${parsed.company_id} does not exist`
      });
    }

    if (parsed.primary_contact_id && !contacts.has(parsed.primary_contact_id)) {
      return res.status(400).json({
        success: false,
        error: `Contact with ID ${parsed.primary_contact_id} does not exist`
      });
    }

    const updatedDeal: Deal = {
      ...deal,
      ...parsed,
      updated_at: new Date().toISOString()
    };

    deals.set(dealId, updatedDeal);

    return res.json({
      success: true,
      data: updatedDeal
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

// PATCH /api/v1/deals/:id/stage
router.patch("/:id/stage", (req: Request, res: Response) => {
  const dealId = req.params.id;
  if (!dealId) {
    return res.status(400).json({ success: false, error: "ID param is required" });
  }

  const deal = deals.get(dealId);
  if (!deal) {
    return res.status(404).json({
      success: false,
      error: "Deal not found"
    });
  }

  const { stage } = req.body;
  try {
    const parsedStage = DealStageSchema.parse(stage);

    deal.stage = parsedStage;
    if (parsedStage === "won") {
      deal.probability = 100;
    } else if (parsedStage === "lost") {
      deal.probability = 0;
    }

    deal.updated_at = new Date().toISOString();
    deals.set(dealId, deal);

    return res.json({
      success: true,
      data: deal
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      error: "Invalid deal stage value"
    });
  }
});

// POST /api/v1/deals/import
router.post("/import", (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  const { items } = req.body;
  if (!Array.isArray(items)) {
    return res.status(400).json({
      success: false,
      error: "Body 'items' must be an array of deals"
    });
  }

  const importedDeals: Deal[] = [];
  const errors: any[] = [];

  items.forEach((item, index) => {
    try {
      const parsed = CreateDealSchema.parse(item);

      if (!companies.has(parsed.company_id)) {
        errors.push({ index, error: `Company with ID ${parsed.company_id} does not exist` });
        return;
      }

      const newId = crypto.randomUUID();
      const timestamp = new Date().toISOString();

      const newDeal: Deal = {
        id: newId,
        company_id: parsed.company_id,
        title: parsed.title,
        job_title: parsed.job_title || null,
        primary_contact_id: parsed.primary_contact_id || null,
        stage: parsed.stage || "prospect",
        amount: parsed.amount || 0,
        product_use_case: parsed.product_use_case || null,
        probability: parsed.probability || 10,
        next_action: parsed.next_action || null,
        notes: parsed.notes || null,
        owner_id: req.user!.id,
        expected_close_date: parsed.expected_close_date || null,
        deleted_at: null,
        created_at: timestamp,
        updated_at: timestamp
      };

      deals.set(newId, newDeal);
      importedDeals.push(newDeal);
    } catch (err) {
      errors.push({
        index,
        error: err instanceof z.ZodError ? err.errors : "Unknown error"
      });
    }
  });

  return res.json({
    success: true,
    data: {
      imported_count: importedDeals.length,
      errors_count: errors.length,
      imported: importedDeals,
      errors
    }
  });
});

// DELETE /api/v1/deals/:id (Soft delete)
router.delete("/:id", (req: Request, res: Response) => {
  const dealId = req.params.id;
  if (!dealId) {
    return res.status(400).json({ success: false, error: "ID param is required" });
  }

  const deal = deals.get(dealId);
  if (!deal) {
    return res.status(404).json({
      success: false,
      error: "Deal not found"
    });
  }

  deal.deleted_at = new Date().toISOString();
  deal.updated_at = new Date().toISOString();
  deals.set(dealId, deal);

  return res.json({
    success: true,
    data: deal
  });
});

export default router;
