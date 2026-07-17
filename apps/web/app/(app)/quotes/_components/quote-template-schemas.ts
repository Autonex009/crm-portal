import type { ProductCategory } from "./quote-module-data";

export type TemplateFieldType = "text" | "number" | "date" | "textarea";

export interface TemplateField {
  key: string;
  label: string;
  type: TemplateFieldType;
  required?: boolean;
  placeholder?: string;
  helperText?: string;
  defaultValue?: string | number;
}

export interface CostLineDefinition {
  id: string;
  srNo: number;
  typeOfCost: string;
  servicesIncluded: string[];
  amountPerUnit: number;
  discountPercent: number;
}

export interface CostLineComputed extends CostLineDefinition {
  qty: number;
  finalPrice: number;
  total: number;
}

export interface CostLineColumn {
  key: "srNo" | "typeOfCost" | "servicesIncluded" | "qty" | "amountPerUnit" | "discountPercent" | "finalPrice" | "total";
  label: string;
  align?: "left" | "right";
  widthPercent?: number;
}

export interface FooterSection {
  heading: string;
  body: string;
}

export interface CategoryTemplateSchema {
  category: ProductCategory;
  label: string;
  tagline: string;
  isFreeform: boolean;
  titleTemplate: string;
  amountColumnLabel: string;
  headerFields: TemplateField[];
  qtyDrivenBy?: string;
  scopeHeading: string;
  scopeFields: TemplateField[];
  scopeDerivedLines: string[];
  costLineColumns: CostLineColumn[];
  defaultCostLines: CostLineDefinition[];
  footerSections: FooterSection[];
}

export interface CustomField {
  id: string;
  label: string;
  value: string;
}

export interface QuoteCategoryTemplateValues {
  category: ProductCategory;
  reference: string;
  date: string;
  headerFieldValues: Record<string, string | number>;
  scopeFieldValues: Record<string, string | number>;
  scopeDerivedLines: string[];
  customFields: CustomField[];
  costLines: CostLineDefinition[];
  footerSections: FooterSection[];
}

export function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

export function calculateCostLine(line: { amountPerUnit: number; discountPercent: number }, qty: number) {
  const safeDiscount = Math.min(100, Math.max(0, line.discountPercent));
  const finalPrice = roundCurrency(line.amountPerUnit * (1 - safeDiscount / 100));
  const total = roundCurrency(finalPrice * Math.max(0, qty));
  return { finalPrice, total };
}

export function resolveCostLines(
  schema: CategoryTemplateSchema,
  values: QuoteCategoryTemplateValues
): CostLineComputed[] {
  const qty = schema.qtyDrivenBy
    ? Number(values.headerFieldValues[schema.qtyDrivenBy] ?? 0) || 0
    : 1;

  return values.costLines.map((line) => {
    const { finalPrice, total } = calculateCostLine(line, qty);
    return { ...line, qty, finalPrice, total };
  });
}

export function resolveTemplateTitle(schema: CategoryTemplateSchema, reference: string) {
  return schema.titleTemplate.replace("{reference}", reference || "Untitled Client");
}

export function interpolateDerivedLine(line: string, values: Record<string, string | number>) {
  return line.replace(/\{(\w+)\}/g, (_match, key: string) => {
    const value = values[key];
    return value === undefined || value === "" ? "—" : String(value);
  });
}

export function createDefaultTemplateValues(category: ProductCategory): QuoteCategoryTemplateValues {
  const schema = CATEGORY_TEMPLATE_SCHEMAS[category];
  const headerFieldValues: Record<string, string | number> = {};
  schema.headerFields.forEach((field) => {
    headerFieldValues[field.key] = field.defaultValue ?? (field.type === "number" ? 0 : "");
  });

  const scopeFieldValues: Record<string, string | number> = {};
  schema.scopeFields.forEach((field) => {
    scopeFieldValues[field.key] = field.defaultValue ?? (field.type === "number" ? 0 : "");
  });

  return {
    category,
    reference: "",
    date: new Date().toISOString().slice(0, 10),
    headerFieldValues,
    scopeFieldValues,
    scopeDerivedLines: [...schema.scopeDerivedLines],
    customFields: [],
    costLines: schema.defaultCostLines.map((line) => ({ ...line, servicesIncluded: [...line.servicesIncluded] })),
    footerSections: schema.footerSections.map((section) => ({ ...section })),
  };
}

const SHARED_GENERIC_FOOTER: FooterSection[] = [
  {
    heading: "Payment terms",
    body: "50% advance payment on PO confirmation; remaining balance due within 15 days of delivery/go-live.",
  },
  {
    heading: "Exclusions",
    body: "Any hardware, licensing, or third-party integration not explicitly listed above is out of scope and will be quoted separately.",
  },
  {
    heading: "Delivery timeline",
    body: "Standard delivery is 3–4 weeks from PO date, subject to site readiness and material availability.",
  },
  {
    heading: "Warranty & support",
    body: "12-month standard warranty on supplied hardware; remote support included during the active subscription period.",
  },
  {
    heading: "Quotation validity",
    body: "This quotation is valid for 15 days from the date above. Prices are exclusive of GST.",
  },
];

const MASTER_SCOPE_DEFAULT = [
  "Number of cameras covered: 50",
  "Use case: Safety compliance monitoring",
  "Detections included: PPE Detections, restricted-zone intrusion, Fire safety, etc. (more details in deck of Autonex AI)",
  "Alert channels included: Dashboard + on-ground speaker alerts + email alerts",
  "Evidence storage: 30 days image-based audit trail",
  "Deployment model: Edge AI processor at site + cloud dashboard",
  "Existing CCTV/NVR feed to be used, subject to RTSP/IP camera compatibility",
].join("\n");

// Blank-line separated blocks; the print view bolds each block's first line
// (up to the colon, or the whole line if there's no colon) and renders the
// rest as plain lines below it — see quote-print-preview.tsx.
const MASTER_TERMS_DEFAULT = [
  [
    "Client-side requirements:",
    "Existing CCTV/NVR should support RTSP/IP feed access",
    "Client to provide power, network access, mounting permissions, and site access",
    "Internet connectivity required for cloud dashboard and remote support (100mbps dedicated line)",
    "Camera quality, lighting, angle, and field of view should be suitable for AI detection",
    "Electrical/civil/cabling work, if required, will be charged separately",
  ].join("\n"),
  ["Payment terms:", "10% advance payment", "Remaining payment: within 15 days of delivery of materials"].join("\n"),
  [
    "Exclusions",
    "New CCTV cameras, NVR, PoE switches, cabling, poles, mounts, and civil/electrical work unless explicitly mentioned.",
    "WhatsApp/SMS charges, if required, charged at actuals or separately.",
    "New AI detections beyond agreed scope.",
    "ERP/SAP/third-party system integrations.",
    "Hardware damage due to power surge, water ingress, mishandling, theft, or site conditions.",
  ].join("\n"),
  "Delivery timeline: 3–4 weeks after PO is raised (depending on import conditions of semiconductor chips)",
  [
    "Warranty & support",
    "Hardware warranty: 12 months, subject to manufacturer terms.",
    "Remote software support included during subscription period.",
    "On-site support visits after go-live, if required, will be charged separately.",
    "First 2–4 weeks after go-live treated as stabilisation/tuning period.",
  ].join("\n"),
  [
    "Data storage terms:",
    "Only violation images and metadata are stored; continuous video storage is not included.",
    "Standard retention: 30 days.",
    "Longer storage can be enabled at additional cost.",
    "Evidence includes image, timestamp, camera/location, violation type, and severity.",
  ].join("\n"),
  [
    "Quotation validity",
    "Quote valid for 15 days / 30 days",
    "Prices are exclusive of GST",
    "Final commercial value subject to site survey and camera-feed validation",
  ].join("\n"),
].join("\n\n");

export const CATEGORY_TEMPLATE_SCHEMAS: Record<ProductCategory, CategoryTemplateSchema> = {
  Master: {
    category: "Master",
    label: "Master",
    tagline: "Fully customizable quotation template — edit every section to match the client engagement.",
    isFreeform: true,
    titleTemplate: "Master Quotation - {reference}",
    amountColumnLabel: "Amount per unit",
    headerFields: [
      {
        key: "quantity",
        label: "Quantity",
        type: "number",
        required: true,
        defaultValue: 50,
        helperText: "Update the number",
      },
    ],
    qtyDrivenBy: "quantity",
    scopeHeading: "Scope of deployment",
    scopeFields: [
      {
        key: "engagementSummary",
        label: "Engagement Details",
        type: "textarea",
        required: true,
        placeholder: "Describe the scope of this engagement",
        defaultValue: MASTER_SCOPE_DEFAULT,
      },
    ],
    scopeDerivedLines: [],
    costLineColumns: [
      { key: "srNo", label: "Sr. No.", widthPercent: 5 },
      { key: "typeOfCost", label: "Type of cost", widthPercent: 16 },
      { key: "servicesIncluded", label: "Services included", widthPercent: 41 },
      { key: "qty", label: "QTY", align: "right", widthPercent: 7 },
      { key: "amountPerUnit", label: "Amount per unit", align: "right", widthPercent: 7 },
      { key: "discountPercent", label: "Discount", align: "right", widthPercent: 8 },
      { key: "finalPrice", label: "Final price", align: "right", widthPercent: 8 },
      { key: "total", label: "Total", align: "right", widthPercent: 8 },
    ],
    defaultCostLines: [
      {
        id: "master-line-1",
        srNo: 1,
        typeOfCost: "One time installation",
        servicesIncluded: [
          "AI processor (Autonex x NVIDIA)",
          "On ground alert speakers (1 per unit)",
          "Webapp dashboard for alerts (run on cloud)",
          "One time system integration on-site and visit for consultation",
        ],
        amountPerUnit: 100000,
        discountPercent: 20,
      },
      {
        id: "master-line-2",
        srNo: 2,
        typeOfCost: "Recurring Platform and Support (1st year)",
        servicesIncluded: [
          "Cloud dashboard access",
          "Violation registry and audit logs",
          "30-day image evidence storage",
          "Email alerts for violations",
          "Software updates and dashboard upgrades",
          "Remote support and issue resolution",
          "Model tuning for existing agreed detections",
        ],
        amountPerUnit: 30000,
        discountPercent: 100,
      },
      {
        id: "master-line-3",
        srNo: 3,
        typeOfCost: "Recurring Platform and Support (2nd year onwards)",
        servicesIncluded: [
          "Cloud dashboard access",
          "Violation registry and audit logs",
          "30-day image evidence storage",
          "Email alerts for violations",
          "Software updates and dashboard upgrades",
          "Remote support and issue resolution",
          "Model tuning for existing agreed detections",
        ],
        amountPerUnit: 30000,
        discountPercent: 20,
      },
    ],
    footerSections: [
      {
        heading: "Terms & Conditions",
        body: MASTER_TERMS_DEFAULT,
      },
    ],
  },
  WIL: {
    category: "WIL",
    label: "WIL",
    tagline: "Workforce Intelligence Layer — fixed template for workforce analytics deployments.",
    isFreeform: false,
    titleTemplate: "WIL quotation - {reference}",
    amountColumnLabel: "Amount per seat",
    headerFields: [
      {
        key: "numberOfSeats",
        label: "Number of seats",
        type: "number",
        required: true,
        defaultValue: 25,
        helperText: "Update the number",
      },
    ],
    qtyDrivenBy: "numberOfSeats",
    scopeHeading: "Scope of Deployment",
    scopeFields: [],
    scopeDerivedLines: [
      "Number of seats covered: {numberOfSeats}",
      "Use case: Workforce productivity and attendance intelligence",
      "Insights included: Attendance trends, idle-time detection, shift compliance, task completion tracking",
      "Alert channels included: Dashboard + email alerts for anomalies",
      "Evidence storage: 30-day activity and audit log retention",
      "Deployment model: Cloud-hosted analytics dashboard with lightweight on-device agent",
      "Existing HRMS/attendance feed to be used, subject to API/export compatibility",
    ],
    costLineColumns: [
      { key: "srNo", label: "Sr. No." },
      { key: "typeOfCost", label: "Type of cost" },
      { key: "servicesIncluded", label: "Services included" },
      { key: "qty", label: "QTY", align: "right" },
      { key: "amountPerUnit", label: "Amount per seat", align: "right" },
      { key: "discountPercent", label: "Discount", align: "right" },
      { key: "finalPrice", label: "Final price", align: "right" },
      { key: "total", label: "Total", align: "right" },
    ],
    defaultCostLines: [
      {
        id: "wil-line-1",
        srNo: 1,
        typeOfCost: "One time onboarding",
        servicesIncluded: [
          "HRMS/attendance feed integration",
          "Dashboard configuration for agreed insights",
          "One time onboarding session and admin training",
        ],
        amountPerUnit: 2000,
        discountPercent: 15,
      },
      {
        id: "wil-line-2",
        srNo: 2,
        typeOfCost: "Recurring Platform and Support (1st year)",
        servicesIncluded: [
          "Cloud dashboard access",
          "Insight and audit log registry",
          "Email alerts for anomalies",
          "Software updates and dashboard upgrades",
          "Remote support and issue resolution",
        ],
        amountPerUnit: 600,
        discountPercent: 100,
      },
      {
        id: "wil-line-3",
        srNo: 3,
        typeOfCost: "Recurring Platform and Support (2nd year onwards)",
        servicesIncluded: [
          "Cloud dashboard access",
          "Insight and audit log registry",
          "Email alerts for anomalies",
          "Software updates and dashboard upgrades",
          "Remote support and issue resolution",
        ],
        amountPerUnit: 600,
        discountPercent: 20,
      },
    ],
    footerSections: [
      {
        heading: "Client-side requirements",
        body: "Existing HRMS/attendance system should support API or scheduled export access; client to provide network access and admin coordination; internet connectivity required for cloud dashboard and remote support.",
      },
      ...SHARED_GENERIC_FOOTER,
    ],
  },
  VIGIL: {
    category: "VIGIL",
    label: "VIGIL",
    tagline: "Camera-deployment AI monitoring — template coming soon.",
    isFreeform: false,
    titleTemplate: "VIGIL quotation - {reference}",
    amountColumnLabel: "Amount per cam",
    headerFields: [],
    scopeHeading: "Scope of Deployment",
    scopeFields: [],
    scopeDerivedLines: [],
    costLineColumns: [
      { key: "srNo", label: "Sr. No." },
      { key: "typeOfCost", label: "Type of cost" },
      { key: "servicesIncluded", label: "Services included" },
      { key: "qty", label: "QTY", align: "right" },
      { key: "amountPerUnit", label: "Amount per cam", align: "right" },
      { key: "discountPercent", label: "Discount", align: "right" },
      { key: "finalPrice", label: "Final price", align: "right" },
      { key: "total", label: "Total", align: "right" },
    ],
    defaultCostLines: [],
    footerSections: [],
  },
};
