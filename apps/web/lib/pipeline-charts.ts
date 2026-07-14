import { formatCurrency } from "@/lib/utils";

export type DealStage = "prospect" | "proposal" | "negotiation" | "won" | "lost";
export type LeadStatus = "new" | "contacted" | "qualified" | "lost";

const DEAL_FLOW: { id: DealStage; node: string; label: string }[] = [
  { id: "prospect", node: "P", label: "Prospect" },
  { id: "proposal", node: "PR", label: "Proposal" },
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
    '  P["Prospect"] --> PR["Proposal"] --> N["Negotiation"] --> W["Won 🏆"]',
    '  N -. "lost" .-> L["Lost"]',
    '  PR -. "lost" .-> L',
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
    `"${label}<br/>${stats[id].count} deals<br/>${formatCurrency(stats[id].value)}"`;

  return [
    "flowchart LR",
    `  P[${cell("prospect", "Prospect")}] --> PR[${cell("proposal", "Proposal")}]`,
    `  PR --> N[${cell("negotiation", "Negotiation")}]`,
    `  N --> W[${cell("won", "Won 🏆")}]`,
    `  N -. lost .-> L[${cell("lost", "Lost")}]`,
    "  class W won",
    "  class L lost",
    "  classDef won fill:#10b981,stroke:#059669,color:#ffffff;",
    "  classDef lost fill:#ef4444,stroke:#dc2626,color:#ffffff;",
  ].join("\n");
}

/**
 * Lifecycle flow of leads: count per status, with the qualified path feeding deals.
 */
export function leadLifecycleChart(counts: Record<LeadStatus, number>): string {
  const cell = (id: LeadStatus, label: string) => `"${label}<br/>${counts[id]} leads"`;

  return [
    "flowchart LR",
    `  NW[${cell("new", "New")}] --> C[${cell("contacted", "Contacted")}]`,
    `  C --> Q[${cell("qualified", "Qualified")}]`,
    '  Q --> D["Converted to Deal 🤝"]',
    `  C -. dropped .-> LO[${cell("lost", "Lost")}]`,
    `  NW -. dropped .-> LO`,
    "  class Q won",
    "  class D won",
    "  class LO lost",
    "  classDef won fill:#10b981,stroke:#059669,color:#ffffff;",
    "  classDef lost fill:#ef4444,stroke:#dc2626,color:#ffffff;",
  ].join("\n");
}
