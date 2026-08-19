import { Router, Request, Response } from "express";
import { contacts, companies, paginate } from "../store";
import { CreateContactSchema, Contact } from "@crm/types";
import { z } from "zod";

const router = Router();

// GET /api/v1/contacts
router.get("/", (req: Request, res: Response) => {
  const { company_id, name, state, page, per_page } = req.query;

  let list = Array.from(contacts.values());

  // Filter based on state
  if (state === "deleted") {
    list = list.filter((c) => c.deleted_at !== null);
  } else if (state === "archived") {
    list = list.filter((c) => c.archived_at !== null && c.deleted_at === null);
  } else {
    list = list.filter((c) => c.deleted_at === null && c.archived_at === null);
  }

  // Filter by company_id
  if (company_id) {
    list = list.filter((c) => c.company_id === company_id);
  }

  // Filter by name (matches first_name or last_name)
  if (name) {
    const search = String(name).toLowerCase();
    list = list.filter(
      (c) =>
        c.first_name.toLowerCase().includes(search) ||
        c.last_name.toLowerCase().includes(search)
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

// GET /api/v1/contacts/:id
router.get("/:id", (req: Request, res: Response) => {
  const contactId = req.params.id;
  if (!contactId) {
    return res.status(400).json({ success: false, error: "ID param is required" });
  }

  const contact = contacts.get(contactId);
  if (!contact) {
    return res.status(404).json({
      success: false,
      error: "Contact not found"
    });
  }
  return res.json({
    success: true,
    data: contact
  });
});

// POST /api/v1/contacts
router.post("/", (req: Request, res: Response) => {
  try {
    const parsed = CreateContactSchema.parse(req.body);
    
    // Check if company exists
    if (!companies.has(parsed.company_id)) {
      return res.status(400).json({
        success: false,
        error: `Company with ID ${parsed.company_id} does not exist`
      });
    }

    const newId = crypto.randomUUID();
    const timestamp = new Date().toISOString();

    const newContact: Contact = {
      id: newId,
      company_id: parsed.company_id,
      first_name: parsed.first_name,
      last_name: parsed.last_name,
      email: parsed.email,
      phone: parsed.phone || null,
      title: parsed.title || null,
      deleted_at: null,
      archived_at: null,
      created_at: timestamp,
      updated_at: timestamp
    };

    contacts.set(newId, newContact);

    return res.status(201).json({
      success: true,
      data: newContact
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

// PATCH /api/v1/contacts/:id
router.patch("/:id", (req: Request, res: Response) => {
  const contactId = req.params.id;
  if (!contactId) {
    return res.status(400).json({ success: false, error: "ID param is required" });
  }

  const contact = contacts.get(contactId);
  if (!contact) {
    return res.status(404).json({
      success: false,
      error: "Contact not found"
    });
  }

  try {
    const UpdateSchema = CreateContactSchema.partial();
    const parsed = UpdateSchema.parse(req.body);

    if (parsed.company_id && !companies.has(parsed.company_id)) {
      return res.status(400).json({
        success: false,
        error: `Company with ID ${parsed.company_id} does not exist`
      });
    }

    const updatedContact: Contact = {
      ...contact,
      ...parsed,
      updated_at: new Date().toISOString()
    };

    contacts.set(contactId, updatedContact);

    return res.json({
      success: true,
      data: updatedContact
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

// POST /api/v1/contacts/:id/archive
router.post("/:id/archive", (req: Request, res: Response) => {
  const contactId = req.params.id;
  if (!contactId) {
    return res.status(400).json({ success: false, error: "ID param is required" });
  }

  const contact = contacts.get(contactId);
  if (!contact) {
    return res.status(404).json({
      success: false,
      error: "Contact not found"
    });
  }

  contact.archived_at = new Date().toISOString();
  contact.updated_at = new Date().toISOString();
  contacts.set(contactId, contact);

  return res.json({
    success: true,
    data: contact
  });
});

// POST /api/v1/contacts/:id/restore
router.post("/:id/restore", (req: Request, res: Response) => {
  const contactId = req.params.id;
  if (!contactId) {
    return res.status(400).json({ success: false, error: "ID param is required" });
  }

  const contact = contacts.get(contactId);
  if (!contact) {
    return res.status(404).json({
      success: false,
      error: "Contact not found"
    });
  }

  contact.deleted_at = null;
  contact.archived_at = null;
  contact.updated_at = new Date().toISOString();
  contacts.set(contactId, contact);

  return res.json({
    success: true,
    data: contact
  });
});

// DELETE /api/v1/contacts/:id (Soft delete)
router.delete("/:id", (req: Request, res: Response) => {
  const contactId = req.params.id;
  if (!contactId) {
    return res.status(400).json({ success: false, error: "ID param is required" });
  }

  const contact = contacts.get(contactId);
  if (!contact) {
    return res.status(404).json({
      success: false,
      error: "Contact not found"
    });
  }

  contact.deleted_at = new Date().toISOString();
  contact.updated_at = new Date().toISOString();
  contacts.set(contactId, contact);

  return res.json({
    success: true,
    data: contact
  });
});

export default router;
