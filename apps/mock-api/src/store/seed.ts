import {
  profiles,
  companies,
  contacts,
  leads,
  deals,
  activities,
  quotes,
  quoteVersions,
  invoices,
  payments,
  products
} from "./index";
import { Company, Contact, Lead, Deal, Quote, QuoteVersion, Invoice, Payment, Product, Activity } from "@crm/types";

// Helper to make timestamps relative to now
const daysAgo = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
};

const formatDate = (isoStr: string): string => {
  return isoStr.split('T')[0] || isoStr;
};

export const SEED_USERS = {
  admin: {
    id: "6a2f8b5c-d921-43bf-b51f-d31e9c5f87b1",
    email: "admin@autonex.com",
    full_name: "Kedar Patel (Admin)",
    role: "admin" as const,
    password: "password"
  },
  sales: {
    id: "7b3f8c5d-d922-43bf-b51f-d31e9c5f87b2",
    email: "sales@autonex.com",
    full_name: "Priya Sharma (Sales)",
    role: "sales" as const,
    password: "password"
  },
  am: {
    id: "8c4f8d5e-d923-43bf-b51f-d31e9c5f87b3",
    email: "am@autonex.com",
    full_name: "Amit Patel (Account Manager)",
    role: "account_manager" as const,
    password: "password"
  }
};

export function seedDatabase() {
  // Clear any existing data
  profiles.clear();
  companies.clear();
  contacts.clear();
  leads.clear();
  deals.clear();
  activities.clear();
  quotes.clear();
  quoteVersions.clear();
  invoices.clear();
  payments.clear();
  products.clear();

  console.log("Seeding in-memory database...");

  // 1. Profiles
  Object.values(SEED_USERS).forEach((u) => {
    profiles.set(u.id, {
      id: u.id,
      full_name: u.full_name,
      role: u.role,
      avatar_url: null,
      created_at: daysAgo(30),
      updated_at: daysAgo(30)
    });
  });

  // 2. Companies
  const companyList: Company[] = [
    {
      id: "c1111111-1111-1111-1111-111111111111",
      name: "Acme Corporation",
      domain: "acme.com",
      industry: "Manufacturing",
      logo_path: null,
      owner_id: SEED_USERS.sales.id,
      deleted_at: null,
      archived_at: null,
      created_at: daysAgo(25),
      updated_at: daysAgo(25)
    },
    {
      id: "c2222222-2222-2222-2222-222222222222",
      name: "TCS India",
      domain: "tcs.com",
      industry: "Information Technology",
      logo_path: null,
      owner_id: SEED_USERS.am.id,
      deleted_at: null,
      archived_at: null,
      created_at: daysAgo(20),
      updated_at: daysAgo(20)
    },
    {
      id: "c3333333-3333-3333-3333-333333333333",
      name: "HDFC Bank",
      domain: "hdfcbank.com",
      industry: "Finance",
      logo_path: null,
      owner_id: SEED_USERS.sales.id,
      deleted_at: null,
      archived_at: null,
      created_at: daysAgo(18),
      updated_at: daysAgo(18)
    },
    {
      id: "c4444444-4444-4444-4444-444444444444",
      name: "Flipkart",
      domain: "flipkart.com",
      industry: "E-Commerce",
      logo_path: null,
      owner_id: SEED_USERS.sales.id,
      deleted_at: null,
      archived_at: null,
      created_at: daysAgo(15),
      updated_at: daysAgo(15)
    }
  ];
  companyList.forEach(c => companies.set(c.id, c));

  // 3. Contacts
  const contactList: Contact[] = [
    {
      id: "d1111111-1111-1111-1111-111111111111",
      company_id: "c1111111-1111-1111-1111-111111111111",
      first_name: "John",
      last_name: "Doe",
      email: "john.doe@acme.com",
      phone: "+91 98765 43210",
      title: "Procurement Lead",
      deleted_at: null,
      archived_at: null,
      created_at: daysAgo(24),
      updated_at: daysAgo(24)
    },
    {
      id: "d2222222-2222-2222-2222-222222222222",
      company_id: "c2222222-2222-2222-2222-222222222222",
      first_name: "Rajesh",
      last_name: "Kumar",
      email: "rajesh.k@tcs.com",
      phone: "+91 91234 56789",
      title: "VP Engineering",
      deleted_at: null,
      archived_at: null,
      created_at: daysAgo(19),
      updated_at: daysAgo(19)
    },
    {
      id: "d3333333-3333-3333-3333-333333333333",
      company_id: "c3333333-3333-3333-3333-333333333333",
      first_name: "Sandeep",
      last_name: "Bakhshi",
      email: "sandeep.b@hdfcbank.com",
      phone: "+91 99988 77766",
      title: "Head of Infrastructure",
      deleted_at: null,
      archived_at: null,
      created_at: daysAgo(17),
      updated_at: daysAgo(17)
    }
  ];
  contactList.forEach(c => contacts.set(c.id, c));

  // 4. Products
  const productList: Product[] = [
    {
      id: "p1111111-1111-1111-1111-111111111111",
      name: "Enterprise Workflow Automation Platform",
      description: "Annual subscription for automated workflows and integrations",
      unit_price: 2500000,
      currency: "INR",
      tax_rate: 18,
      active: true,
      created_at: daysAgo(100),
      updated_at: daysAgo(100)
    },
    {
      id: "p2222222-2222-2222-2222-222222222222",
      name: "Custom Agent Implementation Support",
      description: "One-time consulting and onboarding service",
      unit_price: 500000,
      currency: "INR",
      tax_rate: 18,
      active: true,
      created_at: daysAgo(100),
      updated_at: daysAgo(100)
    }
  ];
  productList.forEach(p => products.set(p.id, p));

  // 5. Leads
  const leadList: Lead[] = [
    {
      id: "l1111111-1111-1111-1111-111111111111",
      title: "Acme Corp — ERP Automation",
      contact_name: "John Doe",
      job_title: "Procurement Lead",
      company_id: "c1111111-1111-1111-1111-111111111111",
      contact_id: "d1111111-1111-1111-1111-111111111111",
      email: "john.doe@acme.com",
      phone: "+91 98765 43210",
      linkedin_url: "https://linkedin.com/in/johndoe-acme",
      industry: "Manufacturing",
      location: "Mumbai",
      product_interest: "Workflow Automation",
      source: "Inbound Referral",
      status: "new" as const,
      assigned_to: SEED_USERS.sales.id,
      value_estimate: 2500000,
      next_follow_up_date: formatDate(new Date(Date.now() + 86400000 * 2).toISOString()),
      notes: "Met John at the Manufacturing Automation summit. Needs quick demo.",
      deleted_at: null,
      archived_at: null,
      created_at: daysAgo(5),
      updated_at: daysAgo(5)
    },
    {
      id: "l2222222-2222-2222-2222-222222222222",
      title: "TCS — Custom AI Agents",
      contact_name: "Rajesh Kumar",
      job_title: "VP Engineering",
      company_id: "c2222222-2222-2222-2222-222222222222",
      contact_id: "d2222222-2222-2222-2222-222222222222",
      email: "rajesh.k@tcs.com",
      phone: "+91 91234 56789",
      linkedin_url: "https://linkedin.com/in/rajesh-tcs",
      industry: "IT Services",
      location: "Bengaluru",
      product_interest: "Agentic Suite",
      source: "Organic Search",
      status: "call scheduled" as const,
      assigned_to: SEED_USERS.sales.id,
      value_estimate: 5000000,
      next_follow_up_date: formatDate(new Date(Date.now() + 86400000 * 4).toISOString()),
      notes: "Follow-up schedule confirmed for next Monday.",
      deleted_at: null,
      archived_at: null,
      created_at: daysAgo(4),
      updated_at: daysAgo(4)
    },
    {
      id: "l3333333-3333-3333-3333-333333333333",
      title: "HDFC — Banking Portal Integration",
      contact_name: "Sandeep Bakhshi",
      job_title: "Head of Infrastructure",
      company_id: "c3333333-3333-3333-3333-333333333333",
      contact_id: "d3333333-3333-3333-3333-333333333333",
      email: "sandeep.b@hdfcbank.com",
      phone: "+91 99988 77766",
      linkedin_url: "https://linkedin.com/in/sandeep-hdfc",
      industry: "Banking",
      location: "Mumbai",
      product_interest: "Workflow Automation & Security",
      source: "Cold Outreach",
      status: "deck sent" as const,
      assigned_to: SEED_USERS.sales.id,
      value_estimate: 7500000,
      next_follow_up_date: null,
      notes: "Deck shared. Waiting for confirmation on tech team review.",
      deleted_at: null,
      archived_at: null,
      created_at: daysAgo(10),
      updated_at: daysAgo(9)
    },
    {
      id: "l4444444-4444-4444-4444-444444444444",
      title: "Flipkart — Inventory Automation",
      contact_name: "Karan Johar",
      job_title: "VP Logistics",
      company_id: "c4444444-4444-4444-4444-444444444444",
      contact_id: null,
      email: "karan.j@flipkart.com",
      phone: null,
      linkedin_url: null,
      industry: "E-Commerce",
      location: "Bengaluru",
      product_interest: "Supply Chain Automations",
      source: "Web Inbound",
      status: "proposal sent" as const,
      assigned_to: SEED_USERS.am.id,
      value_estimate: 4500000,
      next_follow_up_date: formatDate(new Date(Date.now() + 86400000).toISOString()),
      notes: "Proposal sent last Tuesday. Following up on pricing approval.",
      deleted_at: null,
      archived_at: null,
      created_at: daysAgo(12),
      updated_at: daysAgo(2)
    }
  ];
  leadList.forEach(l => leads.set(l.id, l));

  // 6. Deals
  const dealList: Deal[] = [
    {
      id: "e1111111-1111-1111-1111-111111111111",
      title: "Acme Corp — ERP Automation Platform",
      job_title: "Procurement Lead",
      company_id: "c1111111-1111-1111-1111-111111111111",
      primary_contact_id: "d1111111-1111-1111-1111-111111111111",
      stage: "prospect" as const,
      amount: 2500000,
      product_use_case: "Connecting legacy ERP to modern cloud CRM pipelines.",
      probability: 20,
      next_action: "Conduct deep-dive product architecture review",
      notes: "Promising opportunity, but security validation will take time.",
      owner_id: SEED_USERS.sales.id,
      expected_close_date: formatDate(new Date(Date.now() + 86400000 * 45).toISOString()),
      deleted_at: null,
      created_at: daysAgo(4),
      updated_at: daysAgo(4)
    },
    {
      id: "e2222222-2222-2222-2222-222222222222",
      title: "TCS — Engineering Workflows Setup",
      job_title: "VP Engineering",
      company_id: "c2222222-2222-2222-2222-222222222222",
      primary_contact_id: "d2222222-2222-2222-2222-222222222222",
      stage: "negotiation" as const,
      amount: 5000000,
      product_use_case: "Licensing and onboarding of Agentic Workflows for engineering squads.",
      probability: 70,
      next_action: "Deliver draft contract and custom terms review",
      notes: "Approved in principle by engineering; procurement is auditing costs.",
      owner_id: SEED_USERS.sales.id,
      expected_close_date: formatDate(new Date(Date.now() + 86400000 * 15).toISOString()),
      deleted_at: null,
      created_at: daysAgo(10),
      updated_at: daysAgo(1)
    },
    {
      id: "e3333333-3333-3333-3333-333333333333",
      title: "HDFC — Digital Core Migration",
      job_title: "Head of Infrastructure",
      company_id: "c3333333-3333-3333-3333-333333333333",
      primary_contact_id: "d3333333-3333-3333-3333-333333333333",
      stage: "proposal" as const,
      amount: 7500000,
      product_use_case: "Securing transaction message flows via automated validation agents.",
      probability: 50,
      next_action: "Present pilot/POC results to VP Technology",
      notes: "Drafting pilot project parameters now.",
      owner_id: SEED_USERS.sales.id,
      expected_close_date: formatDate(new Date(Date.now() + 86400000 * 30).toISOString()),
      deleted_at: null,
      created_at: daysAgo(9),
      updated_at: daysAgo(9)
    },
    {
      id: "e4444444-4444-4444-4444-444444444444",
      title: "Flipkart — Supply Chain Bot Implementation",
      job_title: "VP Logistics",
      company_id: "c4444444-4444-4444-4444-444444444444",
      primary_contact_id: null,
      stage: "won" as const,
      amount: 4500000,
      product_use_case: "On-demand routing agent automation during festive sales.",
      probability: 100,
      next_action: "Handover to Implementation Team",
      notes: "Deal closed successfully. Contracts signed last Thursday.",
      owner_id: SEED_USERS.am.id,
      expected_close_date: formatDate(daysAgo(2)),
      deleted_at: null,
      created_at: daysAgo(20),
      updated_at: daysAgo(2)
    }
  ];
  dealList.forEach(d => deals.set(d.id, d));

  // 7. Quotes & Quote Versions
  const quoteList: Quote[] = [
    {
      id: "q1111111-1111-1111-1111-111111111111",
      deal_id: "e2222222-2222-2222-2222-222222222222",
      company_id: "c2222222-2222-2222-2222-222222222222",
      status: "approved" as const,
      current_version: 1,
      created_by: SEED_USERS.sales.id,
      valid_until: formatDate(new Date(Date.now() + 86400000 * 10).toISOString()),
      deleted_at: null,
      created_at: daysAgo(8),
      updated_at: daysAgo(4)
    },
    {
      id: "q2222222-2222-2222-2222-222222222222",
      deal_id: "e4444444-4444-4444-4444-444444444444",
      company_id: "c4444444-4444-4444-4444-444444444444",
      status: "approved" as const,
      current_version: 2,
      created_by: SEED_USERS.am.id,
      valid_until: formatDate(daysAgo(2)),
      deleted_at: null,
      created_at: daysAgo(18),
      updated_at: daysAgo(2)
    }
  ];
  quoteList.forEach(q => quotes.set(q.id, q));

  const quoteVersionList: QuoteVersion[] = [
    {
      id: "qv111111-1111-1111-1111-111111111111",
      quote_id: "q1111111-1111-1111-1111-111111111111",
      version_number: 1,
      line_items: [
        {
          product_id: "p1111111-1111-1111-1111-111111111111",
          description: "Enterprise Workflow Automation Platform - TCS Engineering License",
          quantity: 2,
          unit_price: 2500000,
          tax_rate: 18,
          total: 5000000
        }
      ],
      subtotal: 5000000,
      tax: 900000,
      total: 5900000,
      currency: "INR",
      pdf_path: null,
      is_current: true,
      created_at: daysAgo(8),
      updated_at: daysAgo(8)
    },
    {
      id: "qv222222-2222-2222-2222-222222222222",
      quote_id: "q2222222-2222-2222-2222-222222222222",
      version_number: 2,
      line_items: [
        {
          product_id: "p1111111-1111-1111-1111-111111111111",
          description: "Enterprise Workflow Automation Platform - Flipkart Logistics Setup",
          quantity: 1,
          unit_price: 2500000,
          tax_rate: 18,
          total: 2500000
        },
        {
          product_id: "p2222222-2222-2222-2222-222222222222",
          description: "Custom Agent Implementation Support - 4 Dedicated Nodes",
          quantity: 4,
          unit_price: 500000,
          tax_rate: 18,
          total: 2000000
        }
      ],
      subtotal: 4500000,
      tax: 810000,
      total: 5310000,
      currency: "INR",
      pdf_path: null,
      is_current: true,
      created_at: daysAgo(14),
      updated_at: daysAgo(14)
    }
  ];
  quoteVersionList.forEach(qv => quoteVersions.set(qv.id, qv));

  // 8. Invoices & Payments
  const invoiceList: Invoice[] = [
    {
      id: "inv11111-1111-1111-1111-111111111111",
      quote_id: "q1111111-1111-1111-1111-111111111111",
      company_id: "c2222222-2222-2222-2222-222222222222",
      invoice_number: "INV-2026-001",
      status: "sent" as const,
      amount_due: 5900000,
      currency: "INR",
      due_date: formatDate(new Date(Date.now() + 86400000 * 20).toISOString()),
      stripe_invoice_id: "in_stripe_mock_1111",
      payment_link: "https://stripe.com/pay/mock_1111",
      account_manager_id: SEED_USERS.am.id,
      deleted_at: null,
      created_at: daysAgo(3),
      updated_at: daysAgo(3)
    },
    {
      id: "inv22222-2222-2222-2222-222222222222",
      quote_id: "q2222222-2222-2222-2222-222222222222",
      company_id: "c4444444-4444-4444-4444-444444444444",
      invoice_number: "INV-2026-002",
      status: "paid" as const,
      amount_due: 0,
      currency: "INR",
      due_date: formatDate(daysAgo(1)),
      stripe_invoice_id: "in_stripe_mock_2222",
      payment_link: "https://stripe.com/pay/mock_2222",
      account_manager_id: SEED_USERS.am.id,
      deleted_at: null,
      created_at: daysAgo(12),
      updated_at: daysAgo(2)
    }
  ];
  invoiceList.forEach(inv => invoices.set(inv.id, inv));

  const paymentList: Payment[] = [
    {
      id: "pay11111-1111-1111-1111-111111111111",
      invoice_id: "inv22222-2222-2222-2222-222222222222",
      amount: 5310000,
      currency: "INR",
      stripe_payment_intent_id: "pi_stripe_mock_2222",
      status: "succeeded" as const,
      paid_at: daysAgo(2),
      created_at: daysAgo(2),
      updated_at: daysAgo(2)
    }
  ];
  paymentList.forEach(p => payments.set(p.id, p));

  // 9. Activities
  const activityList: Activity[] = [
    {
      id: "act11111-1111-1111-1111-111111111111",
      entity_type: "lead" as const,
      entity_id: "l1111111-1111-1111-1111-111111111111",
      type: "note" as const,
      author_id: SEED_USERS.sales.id,
      body: "Initial discussion: John wants a demo showing how API responses can hook into their custom databases.",
      occurred_at: daysAgo(4),
      created_at: daysAgo(4),
      updated_at: daysAgo(4)
    },
    {
      id: "act22222-2222-2222-2222-222222222222",
      entity_type: "lead" as const,
      entity_id: "l2222222-2222-2222-2222-222222222222",
      type: "call" as const,
      author_id: SEED_USERS.sales.id,
      body: "Had a quick call with Rajesh to set agenda for next Monday's platform architecture deep-dive.",
      occurred_at: daysAgo(1),
      created_at: daysAgo(1),
      updated_at: daysAgo(1)
    },
    {
      id: "act33333-3333-3333-3333-333333333333",
      entity_type: "deal" as const,
      entity_id: "e4444444-4444-4444-4444-444444444444",
      type: "system" as const,
      author_id: SEED_USERS.admin.id,
      body: "Deal stage updated to won. Associated Quote q2222222 approved.",
      occurred_at: daysAgo(2),
      created_at: daysAgo(2),
      updated_at: daysAgo(2)
    }
  ];
  activityList.forEach(a => activities.set(a.id, a));

  console.log(`Database seeded successfully!
  Profiles: ${profiles.size}
  Companies: ${companies.size}
  Contacts: ${contacts.size}
  Products: ${products.size}
  Leads: ${leads.size}
  Deals: ${deals.size}
  Quotes: ${quotes.size}
  Invoices: ${invoices.size}
  Payments: ${payments.size}
  Activities: ${activities.size}`);
}
