import { Router, Request, Response } from "express";
import {
  products,
  quotes,
  quoteVersions,
  invoices,
  payments,
  deals,
  companies,
  paginate
} from "../store";
import { CreateQuoteSchema, Quote, QuoteVersion, Invoice, Payment } from "@crm/types";
import { z } from "zod";

const router = Router();

// ==================== PRODUCTS ====================

// GET /api/v1/billing/products
router.get("/products", (req: Request, res: Response) => {
  const list = Array.from(products.values()).filter((p) => p.active);
  return res.json({
    success: true,
    data: list
  });
});

// ==================== QUOTES ====================

// GET /api/v1/billing/quotes
router.get("/quotes", (req: Request, res: Response) => {
  const { deal_id, company_id, status, page, per_page } = req.query;

  let list = Array.from(quotes.values()).filter((q) => q.deleted_at === null);

  if (deal_id) {
    list = list.filter((q) => q.deal_id === deal_id);
  }
  if (company_id) {
    list = list.filter((q) => q.company_id === company_id);
  }
  if (status) {
    list = list.filter((q) => q.status === status);
  }

  list.sort((a, b) => b.created_at.localeCompare(a.created_at));

  const result = paginate(list, {
    page: Number(page),
    per_page: Number(per_page)
  });

  return res.json(result);
});

// GET /api/v1/billing/quotes/:id
router.get("/quotes/:id", (req: Request, res: Response) => {
  const quoteId = req.params.id;
  if (!quoteId) {
    return res.status(400).json({ success: false, error: "ID param is required" });
  }

  const quote = quotes.get(quoteId);
  if (!quote) {
    return res.status(404).json({ success: false, error: "Quote not found" });
  }

  // Fetch current version
  const versions = Array.from(quoteVersions.values()).filter(
    (qv) => qv.quote_id === quote.id
  );
  const currentVersion = versions.find((qv) => qv.is_current) || versions[0];

  return res.json({
    success: true,
    data: {
      ...quote,
      current_version_details: currentVersion,
      all_versions: versions
    }
  });
});

// POST /api/v1/billing/quotes
router.post("/quotes", (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  try {
    const CreateQuoteWithItemsSchema = CreateQuoteSchema.extend({
      line_items: z.array(
        z.object({
          product_id: z.string().uuid().optional(),
          description: z.string().min(1),
          quantity: z.number().positive(),
          unit_price: z.number().nonnegative(),
          tax_rate: z.number().min(0).max(100).optional()
        })
      ),
      currency: z.string().length(3).optional()
    });

    const parsed = CreateQuoteWithItemsSchema.parse(req.body);

    if (!deals.has(parsed.deal_id)) {
      return res.status(400).json({
        success: false,
        error: `Deal with ID ${parsed.deal_id} does not exist`
      });
    }

    if (!companies.has(parsed.company_id)) {
      return res.status(400).json({
        success: false,
        error: `Company with ID ${parsed.company_id} does not exist`
      });
    }

    const newQuoteId = crypto.randomUUID();
    const newVersionId = crypto.randomUUID();
    const timestamp = new Date().toISOString();

    // Calculate line items, subtotal, tax, and total
    let subtotal = 0;
    let totalTax = 0;

    const lineItems = parsed.line_items.map((item) => {
      const itemTotal = item.quantity * item.unit_price;
      const itemTax = (itemTotal * (item.tax_rate || 0)) / 100;
      subtotal += itemTotal;
      totalTax += itemTax;

      return {
        product_id: item.product_id || undefined,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        tax_rate: item.tax_rate || 0,
        total: itemTotal
      };
    });

    const grandTotal = subtotal + totalTax;

    const newQuote: Quote = {
      id: newQuoteId,
      deal_id: parsed.deal_id,
      company_id: parsed.company_id,
      status: "draft",
      current_version: 1,
      created_by: req.user.id,
      valid_until: parsed.valid_until || null,
      deleted_at: null,
      created_at: timestamp,
      updated_at: timestamp
    };

    const newQuoteVersion: QuoteVersion = {
      id: newVersionId,
      quote_id: newQuoteId,
      version_number: 1,
      line_items: lineItems,
      subtotal,
      tax: totalTax,
      total: grandTotal,
      currency: parsed.currency || "INR",
      pdf_path: null,
      is_current: true,
      created_at: timestamp,
      updated_at: timestamp
    };

    quotes.set(newQuoteId, newQuote);
    quoteVersions.set(newVersionId, newQuoteVersion);

    return res.status(201).json({
      success: true,
      data: {
        ...newQuote,
        current_version_details: newQuoteVersion
      }
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

// POST /api/v1/billing/quotes/:id/approve
router.post("/quotes/:id/approve", (req: Request, res: Response) => {
  const quoteId = req.params.id;
  if (!quoteId) {
    return res.status(400).json({ success: false, error: "ID param is required" });
  }

  const quote = quotes.get(quoteId);
  if (!quote) {
    return res.status(404).json({ success: false, error: "Quote not found" });
  }

  quote.status = "approved";
  quote.updated_at = new Date().toISOString();
  quotes.set(quoteId, quote);

  return res.json({
    success: true,
    data: quote
  });
});

// ==================== INVOICES ====================

// GET /api/v1/billing/invoices
router.get("/invoices", (req: Request, res: Response) => {
  const { company_id, status, page, per_page } = req.query;

  let list = Array.from(invoices.values()).filter((inv) => inv.deleted_at === null);

  if (company_id) {
    list = list.filter((inv) => inv.company_id === company_id);
  }
  if (status) {
    list = list.filter((inv) => inv.status === status);
  }

  list.sort((a, b) => b.created_at.localeCompare(a.created_at));

  const result = paginate(list, {
    page: Number(page),
    per_page: Number(per_page)
  });

  return res.json(result);
});

// POST /api/v1/billing/invoices/generate-from-quote
router.post("/invoices/generate-from-quote", (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  const { quote_id } = req.body;
  if (!quote_id) {
    return res.status(400).json({ success: false, error: "quote_id is required" });
  }

  const quote = quotes.get(quote_id);
  if (!quote) {
    return res.status(404).json({ success: false, error: "Quote not found" });
  }

  // Get current quote version total
  const versions = Array.from(quoteVersions.values()).filter(
    (qv) => qv.quote_id === quote.id
  );
  const currentVersion = versions.find((qv) => qv.is_current) || versions[0];
  const grandTotal = currentVersion ? currentVersion.total : 0;

  const newInvoiceId = crypto.randomUUID();
  const timestamp = new Date().toISOString();
  const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const newInvoice: Invoice = {
    id: newInvoiceId,
    quote_id: quote.id,
    company_id: quote.company_id,
    invoice_number: invoiceNumber,
    status: "sent",
    amount_due: grandTotal,
    currency: currentVersion?.currency || "INR",
    due_date: new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0] || null,
    stripe_invoice_id: `in_mock_${newInvoiceId.slice(0, 8)}`,
    payment_link: `https://stripe.com/pay/mock_${newInvoiceId.slice(0, 8)}`,
    account_manager_id: req.user.id,
    deleted_at: null,
    created_at: timestamp,
    updated_at: timestamp
  };

  invoices.set(newInvoiceId, newInvoice);

  return res.status(201).json({
    success: true,
    data: newInvoice
  });
});

// ==================== PAYMENTS ====================

// POST /api/v1/billing/payments/simulate
router.post("/payments/simulate", (req: Request, res: Response) => {
  const { invoice_id, amount } = req.body;

  if (!invoice_id) {
    return res.status(400).json({ success: false, error: "invoice_id is required" });
  }

  const invoice = invoices.get(invoice_id);
  if (!invoice) {
    return res.status(404).json({ success: false, error: "Invoice not found" });
  }

  const paymentAmount = amount || invoice.amount_due;
  const newPaymentId = crypto.randomUUID();
  const timestamp = new Date().toISOString();

  const newPayment: Payment = {
    id: newPaymentId,
    invoice_id: invoice.id,
    amount: paymentAmount,
    currency: invoice.currency,
    stripe_payment_intent_id: `pi_mock_${newPaymentId.slice(0, 8)}`,
    status: "succeeded",
    paid_at: timestamp,
    created_at: timestamp,
    updated_at: timestamp
  };

  payments.set(newPaymentId, newPayment);

  // Update invoice status
  invoice.amount_due = Math.max(0, invoice.amount_due - paymentAmount);
  if (invoice.amount_due === 0) {
    invoice.status = "paid";
  }
  invoice.updated_at = timestamp;
  invoices.set(invoice.id, invoice);

  return res.status(201).json({
    success: true,
    data: {
      payment: newPayment,
      updated_invoice: invoice
    }
  });
});

export default router;
