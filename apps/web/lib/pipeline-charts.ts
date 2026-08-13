import { formatCurrency } from "@/lib/utils";

export type DealStage = "discovery" | "site_assessment" | "quote_sent" | "negotiation" | "won" | "lost";
export type LeadStatus = "new" | "contacted" | "replied" | "call_booked" | "call_done" | "converted" | "dropped";

const DEAL_FLOW: { id: DealStage; node: string; label: string }[] = [
  { id: "discovery", node: "D", label: "Discovery" },
  { id: "site_assessment", node: "SA", label: "Site Assessment" },
  { id: "quote_sent", node: "QS", label: "Quote Sent" },
  { id: "negotiation", node: "N", label: "Negotiation" },
  { id: "won", node: "W", label: "Won" },
  { id: "lost", node: "L", label: "Lost" },
];

const SHARED_CLASSDEFS = [
  "classDef current fill:#6366f1,stroke:#4338ca,color:#ffffff,stroke-width:2px;",
  "classDef won fill:#10b981,stroke:#059669,color:#ffffff;",
  "classDef lost fill:#ef4444,stroke:#dc2626,color:#ffffff;",
  "classDef muted fill:#e2e8f0,stroke:#cbd5e1,color:#475569;",
].join("\n");

/**
 * Flowchart that tracks a single deal's journey through the pipeline,
 * highlighting the stage it currently sits in.
 */
export function dealStageFlowChart(current: DealStage): string {
  const classFor = (id: DealStage): string => {
    if (id === current) return "current";
    if (id === "won") return "won";
    if (id === "lost") return "lost";
    return "muted";
  };

  return [
    "flowchart LR",
    '  D["Discovery"] --> SA["Site Assessment"] --> QS["Quote Sent"] --> N["Negotiation"] --> W["Won 🏆"]',
    '  N -. "lost" .-> L["Lost"]',
    '  QS -. "lost" .-> L',
    '  SA -. "lost" .-> L',
    ...DEAL_FLOW.map((s) => `  class ${s.node} ${classFor(s.id)}`),
    SHARED_CLASSDEFS,
  ].join("\n");
}

/**
 * Funnel-style overview of the whole deal pipeline: count + total value per stage.
 */
export function dealPipelineChart(
  stats: Record<DealStage, { count: number; value: number }>
): string {
  const cell = (id: DealStage, label: string) =>
    `"${label}<br/>${stats[id]?.count || 0} deals<br/>${formatCurrency(stats[id]?.value || 0)}"`;

  return [
    "flowchart LR",
    `  D[${cell("discovery", "Discovery")}] --> SA[${cell("site_assessment", "Site Assessment")}]`,
    `  SA --> QS[${cell("quote_sent", "Quote Sent")}]`,
    `  QS --> N[${cell("negotiation", "Negotiation")}]`,
    `  N --> W[${cell("won", "Won 🏆")}]`,
    `  N -. lost .-> L[${cell("lost", "Lost")}]`,
    "  class W won",
    "  class L lost",
    "  classDef won fill:#10b981,stroke:#059669,color:#ffffff;",
    "  classDef lost fill:#ef4444,stroke:#dc2626,color:#ffffff;",
  ].join("\n");
}

export type QuoteStatus = "Draft" | "Presented" | "Accepted" | "Rejected" | "Closed";

/**
 * Lifecycle flow of quotes: Draft → Presented → Accepted → Closed, with a
 * Rejected branch off Presented, mirroring how the deal pipeline branches to Lost.
 */
export function quotePipelineChart(counts: Record<QuoteStatus, number>): string {
  const cell = (id: QuoteStatus, label: string) => `"${label}<br/>${counts[id] || 0} quotes"`;

  return [
    "flowchart LR",
    `  D[${cell("Draft", "Draft")}] --> P[${cell("Presented", "Presented")}]`,
    `  P --> A[${cell("Accepted", "Accepted 🏆")}]`,
    `  A --> C[${cell("Closed", "Closed")}]`,
    `  P -. rejected .-> R[${cell("Rejected", "Rejected")}]`,
    "  class A won",
    "  class C won",
    "  class R lost",
    "  classDef won fill:#10b981,stroke:#059669,color:#ffffff;",
    "  classDef lost fill:#ef4444,stroke:#dc2626,color:#ffffff;",
  ].join("\n");
}

/**
 * Lifecycle flow of leads: count per status, with the qualified path feeding deals.
 */
export function leadLifecycleChart(counts: Record<LeadStatus, number>): string {
  const cell = (id: LeadStatus, label: string) => `"${label}<br/>${counts[id] || 0} leads"`;

  return [
    "flowchart LR",
    `  NW(${cell("new", "New")}) --> CT(${cell("contacted", "Contacted")})`,
    `  CT --> RP(${cell("replied", "Replied")})`,
    `  RP --> CB(${cell("call_booked", "Call Booked")})`,
    `  CB --> CD(${cell("call_done", "Call Done")})`,
    `  CD --> CV(${cell("converted", "Converted 🏆")})`,
    `  NW -. dropped .-> DP(${cell("dropped", "Dropped")})`,
    `  CT -. dropped .-> DP`,
    `  RP -. dropped .-> DP`,
    `  CB -. dropped .-> DP`,
    "  class CV won",
    "  class DP lost",
    "  classDef won fill:#10b981,stroke:#059669,color:#ffffff;",
    "  classDef lost fill:#ef4444,stroke:#dc2626,color:#ffffff;",
  ].join("\n");
}
