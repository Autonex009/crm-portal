import { Router, Request, Response } from "express";
import { leads, companies, contacts, paginate } from "../store";
import { CreateLeadSchema, Lead, LeadStatusSchema } from "@crm/types";
import { z } from "zod";

const router = Router();

// GET /api/v1/leads
router.get("/", (req: Request, res: Response) => {
  const { status, assigned_to, search, state, page, per_page } = req.query;

  let list = Array.from(leads.values());

  // Filter based on state
  if (state === "deleted") {
    list = list.filter((l) => l.deleted_at !== null);
  } else if (state === "archived") {
    list = list.filter((l) => l.archived_at !== null && l.deleted_at === null);
  } else {
    list = list.filter((l) => l.deleted_at === null && l.archived_at === null);
  }

  // Filter by status
  if (status) {
    list = list.filter((l) => l.status === status);
  }

  // Filter by assigned_to
  if (assigned_to) {
    list = list.filter((l) => l.assigned_to === assigned_to);
  }

  // Generic search (matches title, contact_name, email, notes)
  if (search) {
    const queryStr = String(search).toLowerCase();
    list = list.filter(
      (l) =>
        l.title?.toLowerCase().includes(queryStr) ||
        l.contact_name?.toLowerCase().includes(queryStr) ||
        l.email?.toLowerCase().includes(queryStr) ||
        l.notes?.toLowerCase().includes(queryStr)
    );
  }

  // Sort by created_at desc
  list.sort((a, b) => b.created_at.localeCompare(a.created_at));

  const result = paginate(list, {
    page: Number(page),
    per_page: Number(per_page)
  });

  return res.json(result);
});

// GET /api/v1/leads/:id
router.get("/:id", (req: Request, res: Response) => {
  const leadId = req.params.id;
  if (!leadId) {
    return res.status(400).json({ success: false, error: "ID param is required" });
  }

  const lead = leads.get(leadId);
  if (!lead) {
    return res.status(404).json({
      success: false,
      error: "Lead not found"
    });
  }
  return res.json({
    success: true,
    data: lead
  });
});

// POST /api/v1/leads
router.post("/", (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  try {
    const parsed = CreateLeadSchema.parse(req.body);

    if (parsed.company_id && !companies.has(parsed.company_id)) {
      return res.status(400).json({
        success: false,
        error: `Company with ID ${parsed.company_id} does not exist`
      });
    }

    if (parsed.contact_id && !contacts.has(parsed.contact_id)) {
      return res.status(400).json({
        success: false,
        error: `Contact with ID ${parsed.contact_id} does not exist`
      });
    }

    const newId = crypto.randomUUID();
    const timestamp = new Date().toISOString();

    const newLead: Lead = {
      id: newId,
      title: parsed.title || null,
      contact_name: parsed.contact_name || null,
      job_title: parsed.job_title || null,
      company_id: parsed.company_id || null,
      contact_id: parsed.contact_id || null,
      email: parsed.email || null,
      phone: parsed.phone || null,
      linkedin_url: parsed.linkedin_url || null,
      industry: parsed.industry || null,
      location: parsed.location || null,
      product_interest: parsed.product_interest || null,
      source: parsed.source || null,
      status: parsed.status || "new",
      assigned_to: parsed.assigned_to || req.user.id,
      value_estimate: parsed.value_estimate !== undefined ? parsed.value_estimate : null,
      next_follow_up_date: parsed.next_follow_up_date || null,
      notes: parsed.notes || null,
      deleted_at: null,
      archived_at: null,
      created_at: timestamp,
      updated_at: timestamp
    };

    leads.set(newId, newLead);

    return res.status(201).json({
      success: true,
      data: newLead
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

// PATCH /api/v1/leads/:id
router.patch("/:id", (req: Request, res: Response) => {
  const leadId = req.params.id;
  if (!leadId) {
    return res.status(400).json({ success: false, error: "ID param is required" });
  }

  const lead = leads.get(leadId);
  if (!lead) {
    return res.status(404).json({
      success: false,
      error: "Lead not found"
    });
  }

  try {
    const UpdateSchema = CreateLeadSchema.partial();
    const parsed = UpdateSchema.parse(req.body);

    if (parsed.company_id && !companies.has(parsed.company_id)) {
      return res.status(400).json({
        success: false,
        error: `Company with ID ${parsed.company_id} does not exist`
      });
    }

    if (parsed.contact_id && !contacts.has(parsed.contact_id)) {
      return res.status(400).json({
        success: false,
        error: `Contact with ID ${parsed.contact_id} does not exist`
      });
    }

    const updatedLead: Lead = {
      ...lead,
      ...parsed,
      updated_at: new Date().toISOString()
    };

    leads.set(leadId, updatedLead);

    return res.json({
      success: true,
      data: updatedLead
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

// PATCH /api/v1/leads/:id/status
router.patch("/:id/status", (req: Request, res: Response) => {
  const leadId = req.params.id;
  if (!leadId) {
    return res.status(400).json({ success: false, error: "ID param is required" });
  }

  const lead = leads.get(leadId);
  if (!lead) {
    return res.status(404).json({
      success: false,
      error: "Lead not found"
    });
  }

  const { status } = req.body;
  try {
    const parsedStatus = LeadStatusSchema.parse(status);
    
    lead.status = parsedStatus;
    lead.updated_at = new Date().toISOString();
    leads.set(leadId, lead);

    return res.json({
      success: true,
      data: lead
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      error: "Invalid status value"
    });
  }
});

// POST /api/v1/leads/import
router.post("/import", (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  const { items } = req.body;
  if (!Array.isArray(items)) {
    return res.status(400).json({
      success: false,
      error: "Body 'items' must be an array of leads"
    });
  }

  const importedLeads: Lead[] = [];
  const errors: any[] = [];

  items.forEach((item, index) => {
    try {
      const parsed = CreateLeadSchema.parse(item);
      const newId = crypto.randomUUID();
      const timestamp = new Date().toISOString();

      const newLead: Lead = {
        id: newId,
        title: parsed.title || null,
        contact_name: parsed.contact_name || null,
        job_title: parsed.job_title || null,
        company_id: parsed.company_id || null,
        contact_id: parsed.contact_id || null,
        email: parsed.email || null,
        phone: parsed.phone || null,
        linkedin_url: parsed.linkedin_url || null,
        industry: parsed.industry || null,
        location: parsed.location || null,
        product_interest: parsed.product_interest || null,
        source: parsed.source || null,
        status: parsed.status || "new",
        assigned_to: parsed.assigned_to || req.user!.id,
        value_estimate: parsed.value_estimate !== undefined ? parsed.value_estimate : null,
        next_follow_up_date: parsed.next_follow_up_date || null,
        notes: parsed.notes || null,
        deleted_at: null,
        archived_at: null,
        created_at: timestamp,
        updated_at: timestamp
      };

      leads.set(newId, newLead);
      importedLeads.push(newLead);
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
      imported_count: importedLeads.length,
      errors_count: errors.length,
      imported: importedLeads,
      errors
    }
  });
});

// POST /api/v1/leads/:id/archive
router.post("/:id/archive", (req: Request, res: Response) => {
  const leadId = req.params.id;
  if (!leadId) {
    return res.status(400).json({ success: false, error: "ID param is required" });
  }

  const lead = leads.get(leadId);
  if (!lead) {
    return res.status(404).json({
      success: false,
      error: "Lead not found"
    });
  }

  lead.archived_at = new Date().toISOString();
  lead.updated_at = new Date().toISOString();
  leads.set(leadId, lead);

  return res.json({
    success: true,
    data: lead
  });
});

// POST /api/v1/leads/:id/restore
router.post("/:id/restore", (req: Request, res: Response) => {
  const leadId = req.params.id;
  if (!leadId) {
    return res.status(400).json({ success: false, error: "ID param is required" });
  }

  const lead = leads.get(leadId);
  if (!lead) {
    return res.status(404).json({
      success: false,
      error: "Lead not found"
    });
  }

  lead.deleted_at = null;
  lead.archived_at = null;
  lead.updated_at = new Date().toISOString();
  leads.set(leadId, lead);

  return res.json({
    success: true,
    data: lead
  });
});

// DELETE /api/v1/leads/:id (Soft delete)
router.delete("/:id", (req: Request, res: Response) => {
  const leadId = req.params.id;
  if (!leadId) {
    return res.status(400).json({ success: false, error: "ID param is required" });
  }

  const lead = leads.get(leadId);
  if (!lead) {
    return res.status(404).json({
      success: false,
      error: "Lead not found"
    });
  }

  lead.deleted_at = new Date().toISOString();
  lead.updated_at = new Date().toISOString();
  leads.set(leadId, lead);

  return res.json({
    success: true,
    data: lead
  });
});

export default router;
