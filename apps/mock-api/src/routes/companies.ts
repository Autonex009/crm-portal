import { Router, Request, Response } from "express";
import { companies, paginate } from "../store";
import { CreateCompanySchema, Company } from "@crm/types";
import { z } from "zod";

const router = Router();

// GET /api/v1/companies
router.get("/", (req: Request, res: Response) => {
  const { name, industry, state, page, per_page } = req.query;
  
  let list = Array.from(companies.values());

  // Filter based on state (deleted, archived, active)
  if (state === "deleted") {
    list = list.filter((c) => c.deleted_at !== null);
  } else if (state === "archived") {
    list = list.filter((c) => c.archived_at !== null && c.deleted_at === null);
  } else {
    // Default to active (non-deleted, non-archived)
    list = list.filter((c) => c.deleted_at === null && c.archived_at === null);
  }

  // Filter by name (case-insensitive search)
  if (name) {
    const search = String(name).toLowerCase();
    list = list.filter((c) => c.name.toLowerCase().includes(search));
  }

  // Filter by industry
  if (industry) {
    const search = String(industry).toLowerCase();
    list = list.filter((c) => c.industry?.toLowerCase().includes(search));
  }

  // Sort by created_at desc by default
  list.sort((a, b) => b.created_at.localeCompare(a.created_at));

  const result = paginate(list, {
    page: Number(page),
    per_page: Number(per_page)
  });

  return res.json(result);
});

// GET /api/v1/companies/:id
router.get("/:id", (req: Request, res: Response) => {
  const companyId = req.params.id;
  if (!companyId) {
    return res.status(400).json({ success: false, error: "ID param is required" });
  }

  const company = companies.get(companyId);
  if (!company) {
    return res.status(404).json({
      success: false,
      error: "Company not found"
    });
  }
  return res.json({
    success: true,
    data: company
  });
});

// POST /api/v1/companies
router.post("/", (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  try {
    const parsed = CreateCompanySchema.parse(req.body);
    const newId = crypto.randomUUID();
    const timestamp = new Date().toISOString();

    const newCompany: Company = {
      id: newId,
      name: parsed.name,
      domain: parsed.domain || null,
      industry: parsed.industry || null,
      logo_path: parsed.logo_path || null,
      owner_id: req.user.id,
      deleted_at: null,
      archived_at: null,
      created_at: timestamp,
      updated_at: timestamp
    };

    companies.set(newId, newCompany);

    return res.status(201).json({
      success: true,
      data: newCompany
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

// PATCH /api/v1/companies/:id
router.patch("/:id", (req: Request, res: Response) => {
  const companyId = req.params.id;
  if (!companyId) {
    return res.status(400).json({ success: false, error: "ID param is required" });
  }

  const company = companies.get(companyId);
  if (!company) {
    return res.status(404).json({
      success: false,
      error: "Company not found"
    });
  }

  try {
    const UpdateSchema = CreateCompanySchema.partial();
    const parsed = UpdateSchema.parse(req.body);

    const updatedCompany: Company = {
      ...company,
      ...parsed,
      updated_at: new Date().toISOString()
    };

    companies.set(companyId, updatedCompany);

    return res.json({
      success: true,
      data: updatedCompany
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

// POST /api/v1/companies/:id/archive
router.post("/:id/archive", (req: Request, res: Response) => {
  const companyId = req.params.id;
  if (!companyId) {
    return res.status(400).json({ success: false, error: "ID param is required" });
  }

  const company = companies.get(companyId);
  if (!company) {
    return res.status(404).json({
      success: false,
      error: "Company not found"
    });
  }

  company.archived_at = new Date().toISOString();
  company.updated_at = new Date().toISOString();
  companies.set(companyId, company);

  return res.json({
    success: true,
    data: company
  });
});

// POST /api/v1/companies/:id/restore
router.post("/:id/restore", (req: Request, res: Response) => {
  const companyId = req.params.id;
  if (!companyId) {
    return res.status(400).json({ success: false, error: "ID param is required" });
  }

  const company = companies.get(companyId);
  if (!company) {
    return res.status(404).json({
      success: false,
      error: "Company not found"
    });
  }

  company.deleted_at = null;
  company.archived_at = null;
  company.updated_at = new Date().toISOString();
  companies.set(companyId, company);

  return res.json({
    success: true,
    data: company
  });
});

// DELETE /api/v1/companies/:id (Soft delete)
router.delete("/:id", (req: Request, res: Response) => {
  const companyId = req.params.id;
  if (!companyId) {
    return res.status(400).json({ success: false, error: "ID param is required" });
  }

  const company = companies.get(companyId);
  if (!company) {
    return res.status(404).json({
      success: false,
      error: "Company not found"
    });
  }

  company.deleted_at = new Date().toISOString();
  company.updated_at = new Date().toISOString();
  companies.set(companyId, company);

  return res.json({
    success: true,
    data: company
  });
});

// DELETE /api/v1/companies/:id/hard (Hard delete)
router.delete("/:id/hard", (req: Request, res: Response) => {
  const companyId = req.params.id;
  if (!companyId) {
    return res.status(400).json({ success: false, error: "ID param is required" });
  }

  if (companies.delete(companyId)) {
    return res.json({
      success: true,
      message: "Company hard-deleted successfully"
    });
  }
  return res.status(404).json({
    success: false,
    error: "Company not found"
  });
});

export default router;
