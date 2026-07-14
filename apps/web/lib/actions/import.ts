"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";

export type ImportRow = Record<string, string | number | null>;

export interface ImportSummary {
  inserted: number;
  skipped: number;
  errors: string[];
}

type ImportResult =
  | { success: true; data: ImportSummary }
  | { success: false; error: string };

/** Normalise a header to a comparison key: lowercase, alphanumerics only. */
function norm(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** Pull the first matching alias value from a row, regardless of header casing/spacing. */
function pick(row: ImportRow, aliases: string[]): string | null {
  const normalized = new Map<string, string | number | null>();
  for (const [k, v] of Object.entries(row)) normalized.set(norm(k), v);
  for (const alias of aliases) {
    const val = normalized.get(norm(alias));
    if (val !== undefined && val !== null && String(val).trim() !== "") {
      return String(val).trim();
    }
  }
  return null;
}

function toNumber(val: string | null): number | null {
  if (val === null) return null;
  const n = Number(val.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function toIsoDate(val: string | null): string | null {
  if (!val) return null;
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

const LEAD_STATUSES = ["new", "contacted", "qualified", "lost"] as const;
const DEAL_STAGES = ["prospect", "proposal", "negotiation", "won", "lost"] as const;
type LeadStatus = (typeof LEAD_STATUSES)[number];
type DealStage = (typeof DEAL_STAGES)[number];

function toProbability(val: string | null): number | null {
  const n = toNumber(val);
  if (n === null) return null;
  return Math.min(100, Math.max(0, Math.round(n)));
}

interface LeadRecord {
  title: string;
  contact_name: string | null;
  job_title: string | null;
  company_id: string | null;
  email: string | null;
  phone: string | null;
  linkedin_url: string | null;
  industry: string | null;
  location: string | null;
  product_interest: string | null;
  source: string | null;
  status: LeadStatus;
  value_estimate: number | null;
  next_follow_up_date: string | null;
  notes: string | null;
  assigned_to: string;
}

interface DealRecord {
  title: string;
  job_title: string | null;
  company_id: string;
  stage: DealStage;
  amount: number;
  product_use_case: string | null;
  probability: number | null;
  next_action: string | null;
  notes: string | null;
  expected_close_date: string | null;
  owner_id: string;
}

export async function importLeads(rows: ImportRow[]): Promise<ImportResult> {
  const supabase = await createClient();
  const user = await getAuthUser();
  if (!user) return { success: false, error: "Unauthorized" };
  if (!Array.isArray(rows) || rows.length === 0) {
    return { success: false, error: "No rows found in the file" };
  }

  const { data: companies } = await supabase
    .from("companies")
    .select("id, name")
    .is("deleted_at", null);
  const companyByName = new Map(
    (companies ?? []).map((c) => [c.name.toLowerCase(), c.id])
  );

  const errors: string[] = [];
  const records: LeadRecord[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const name = pick(row, ["name", "lead name", "contact name", "full name", "title", "lead", "lead title"]);
    if (!name) {
      errors.push(`Row ${i + 2}: missing name — skipped`);
      continue;
    }
    const companyName = pick(row, ["company", "company name", "account", "organisation", "organization"]);

    // Preserve the Company field: link an existing company or create it on the fly.
    let companyId: string | null = null;
    if (companyName) {
      companyId = companyByName.get(companyName.toLowerCase()) ?? null;
      if (!companyId) {
        const { data: created } = await supabase
          .from("companies")
          .insert({ name: companyName, owner_id: user.id })
          .select("id")
          .single();
        if (created) {
          companyId = created.id;
          companyByName.set(companyName.toLowerCase(), created.id);
        }
      }
    }

    const statusRaw = (pick(row, ["status", "lead status"]) ?? "new").toLowerCase();
    const status: LeadStatus = (LEAD_STATUSES as readonly string[]).includes(statusRaw)
      ? (statusRaw as LeadStatus)
      : "new";

    records.push({
      title: name,
      contact_name: name,
      job_title: pick(row, ["job title", "title", "role", "position", "designation"]),
      company_id: companyId,
      email: pick(row, ["email", "email address", "e-mail"]),
      phone: pick(row, ["phone", "phone number", "mobile", "contact number", "tel"]),
      linkedin_url: pick(row, ["linkedin", "linkedin profile", "linkedin url", "linkedin link"]),
      industry: pick(row, ["industry", "sector", "sector/industry", "sector industry", "vertical"]),
      location: pick(row, ["location", "city", "region", "country", "geo"]),
      product_interest: pick(row, [
        "product use cases / interest", "product use cases", "product interest",
        "use case", "use cases", "interest", "product",
      ]),
      source: pick(row, ["source", "lead source", "channel"]),
      status,
      value_estimate: toNumber(pick(row, ["value", "value estimate", "estimated value", "estimate"])),
      next_follow_up_date: toIsoDate(pick(row, [
        "next follow-up date", "next follow up date", "next followup date",
        "follow-up date", "follow up date", "next follow-up", "next follow up",
      ])),
      notes: pick(row, ["notes", "note", "comments", "remarks"]),
      assigned_to: user.id,
    });
  }

  if (records.length === 0) {
    return { success: false, error: "No valid rows to import. Ensure a 'Name' column exists." };
  }

  const { error, count } = await supabase
    .from("leads")
    .insert(records, { count: "exact" });
  if (error) return { success: false, error: error.message };

  revalidatePath("/leads");
  return {
    success: true,
    data: { inserted: count ?? records.length, skipped: rows.length - records.length, errors },
  };
}

export async function importDeals(rows: ImportRow[]): Promise<ImportResult> {
  const supabase = await createClient();
  const user = await getAuthUser();
  if (!user) return { success: false, error: "Unauthorized" };
  if (!Array.isArray(rows) || rows.length === 0) {
    return { success: false, error: "No rows found in the file" };
  }

  const { data: companies } = await supabase
    .from("companies")
    .select("id, name")
    .is("deleted_at", null);
  const companyByName = new Map(
    (companies ?? []).map((c) => [c.name.toLowerCase(), c.id])
  );

  const errors: string[] = [];
  const records: DealRecord[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const title = pick(row, ["name", "deal name", "title", "deal", "deal title", "opportunity"]);
    if (!title) {
      errors.push(`Row ${i + 2}: missing name — skipped`);
      continue;
    }

    const companyName = pick(row, ["company", "company name", "account"]);
    if (!companyName) {
      errors.push(`Row ${i + 2}: missing company (required for deals) — skipped`);
      continue;
    }

    // Deals require a company — resolve an existing one or create it on the fly.
    let companyId = companyByName.get(companyName.toLowerCase());
    if (!companyId) {
      const { data: created, error: cErr } = await supabase
        .from("companies")
        .insert({ name: companyName, owner_id: user.id })
        .select("id")
        .single();
      if (cErr || !created) {
        errors.push(`Row ${i + 2}: could not create company "${companyName}" — skipped`);
        continue;
      }
      companyId = created.id;
      companyByName.set(companyName.toLowerCase(), created.id);
    }

    const stageRaw = (pick(row, ["stage", "status", "deal stage"]) ?? "prospect").toLowerCase();
    const stage: DealStage = (DEAL_STAGES as readonly string[]).includes(stageRaw)
      ? (stageRaw as DealStage)
      : "prospect";

    records.push({
      title,
      job_title: pick(row, ["job title", "role", "position", "designation", "contact title"]),
      company_id: companyId,
      stage,
      amount: toNumber(pick(row, ["amount", "value", "deal value", "deal amount", "price"])) ?? 0,
      product_use_case: pick(row, [
        "product / use case", "product/use case", "product use case",
        "product", "use case", "use cases",
      ]),
      probability: toProbability(pick(row, ["probability", "probability (%)", "probability %", "win probability", "confidence"])),
      next_action: pick(row, ["next action", "next step", "next steps", "action"]),
      notes: pick(row, ["notes", "note", "comments", "remarks"]),
      expected_close_date: toIsoDate(
        pick(row, [
          "expected closing date", "expected close date", "closing date",
          "close date", "expected close", "date",
        ])
      ),
      owner_id: user.id,
    });
  }

  if (records.length === 0) {
    return { success: false, error: "No valid rows to import. Each deal needs a Title and Company." };
  }

  const { error, count } = await supabase
    .from("deals")
    .insert(records, { count: "exact" });
  if (error) return { success: false, error: error.message };

  revalidatePath("/deals");
  return {
    success: true,
    data: { inserted: count ?? records.length, skipped: rows.length - records.length, errors },
  };
}
