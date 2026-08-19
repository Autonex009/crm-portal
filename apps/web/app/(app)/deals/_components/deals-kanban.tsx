"use client";

import { useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import { useDroppable } from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Link from "next/link";
import { updateDealStage } from "@/lib/actions/deals";
import { formatCurrency, formatDate } from "@/lib/utils";
import { DealSheet } from "./deal-sheet";
import { Calendar, Plus, Search, Building2, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";

type DealStage = "discovery" | "site_assessment" | "quote_sent" | "negotiation" | "won" | "lost";

export interface DealCard {
  id: string;
  title: string;
  stage: DealStage;
  amount: number;
  probability: number | null;
  product_use_case: string | null;
  next_action: string | null;
  expected_close_date: string | null;
  company_name: string | null;
  contact_name: string | null;
}

interface Company { id: string; name: string }
interface Contact { id: string; first_name: string; last_name: string }

const STAGES: { id: DealStage; label: string; colorClass: string; dotColor: string; defaultProb: number }[] = [
  { id: "discovery",       label: "Discovery",       colorClass: "bg-indigo-500/5 border-indigo-500/20 dark:bg-indigo-950/20", dotColor: "bg-indigo-500", defaultProb: 20 },
  { id: "site_assessment", label: "Site Assessment", colorClass: "bg-cyan-500/5 border-cyan-500/20 dark:bg-cyan-950/20",   dotColor: "bg-cyan-500", defaultProb: 40 },
  { id: "quote_sent",      label: "Quote Sent",      colorClass: "bg-blue-500/5 border-blue-500/20 dark:bg-blue-950/20",     dotColor: "bg-blue-500", defaultProb: 60 },
  { id: "negotiation",     label: "Negotiation",     colorClass: "bg-amber-500/5 border-amber-500/20 dark:bg-amber-950/20",   dotColor: "bg-amber-500", defaultProb: 80 },
  { id: "won",             label: "Won",             colorClass: "bg-emerald-500/5 border-emerald-500/20 dark:bg-emerald-950/20",dotColor: "bg-emerald-500", defaultProb: 100 },
  { id: "lost",            label: "Lost",            colorClass: "bg-rose-500/5 border-rose-500/20 dark:bg-rose-950/20",       dotColor: "bg-rose-400", defaultProb: 0 },
];

function KanbanColumn({
  stage,
  deals,
  companies,
  contacts,
}: {
  stage: typeof STAGES[number];
  deals: DealCard[];
  companies: Company[];
  contacts: Contact[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });
  const totalAmount = deals.reduce((s, d) => s + d.amount, 0);
  const weightedAmount = deals.reduce((s, d) => {
    const prob = d.probability ?? stage.defaultProb;
    return s + d.amount * (prob / 100);
  }, 0);

  return (
    <div className={cn("flex-shrink-0 w-80 flex flex-col rounded-2xl border bg-card/60 backdrop-blur-sm shadow-xs", stage.colorClass)}>
      {/* Column Header */}
      <div className="p-3.5 pb-2 border-b bg-muted/20">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className={cn("h-2.5 w-2.5 rounded-full ring-2 ring-background", stage.dotColor)} />
            <h3 className="font-bold text-sm text-foreground">{stage.label}</h3>
          </div>
          <span className="text-xs font-bold bg-background text-foreground rounded-full px-2.5 py-0.5 border shadow-2xs">
            {deals.length}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground mt-1.5">
          <span>Total: <strong className="text-foreground">{formatCurrency(totalAmount)}</strong></span>
          {stage.id !== "won" && stage.id !== "lost" && (
            <span className="text-[11px] text-muted-foreground/80">
              Wtd: <strong className="text-primary">{formatCurrency(weightedAmount)}</strong>
            </span>
          )}
        </div>
      </div>

      {/* Cards List */}
      <SortableContext items={deals.map((d) => d.id)} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className={cn(
            "flex-1 p-2.5 space-y-3 min-h-[380px] rounded-b-2xl transition-colors",
            isOver && "bg-accent/40"
          )}
        >
          {deals.map((deal) => (
            <SortableDealCard key={deal.id} deal={deal} stageProb={stage.defaultProb} />
          ))}
        </div>
      </SortableContext>

      {/* Quick Add Button */}
      <div className="p-2 border-t bg-muted/10">
        <DealSheet
          companies={companies}
          contacts={contacts}
          defaultStage={stage.id}
          trigger={
            <button className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-accent/60 rounded-xl transition-all border border-dashed border-border/80">
              <Plus className="h-3.5 w-3.5" />
              <span>Add Deal</span>
            </button>
          }
        />
      </div>
    </div>
  );
}

function SortableDealCard({ deal, overlay, stageProb }: { deal: DealCard; overlay?: boolean; stageProb: number }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: deal.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const prob = deal.probability ?? stageProb;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative bg-card rounded-xl border border-border/80 shadow-xs p-4 cursor-grab active:cursor-grabbing hover:border-primary/50 hover:shadow-md transition-all duration-200",
        isDragging && !overlay && "opacity-30 ring-2 ring-primary/30",
        overlay && "rotate-2 shadow-2xl scale-105 border-primary"
      )}
      {...attributes}
      {...listeners}
    >
      <Link
        href={`/deals/${deal.id}`}
        className="block"
        onClick={(e) => e.stopPropagation()}
        draggable={false}
      >
        <p className="font-bold text-sm leading-snug mb-1.5 text-foreground group-hover:text-primary transition-colors">
          {deal.title}
        </p>
      </Link>

      {deal.company_name && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium mb-2">
          <Building2 className="h-3.5 w-3.5 text-muted-foreground/70 shrink-0" />
          <span className="truncate">{deal.company_name}</span>
        </div>
      )}

      {deal.product_use_case && (
        <p className="text-xs text-muted-foreground/80 mb-3 truncate bg-muted/40 p-1.5 rounded-md border text-[11px]">
          {deal.product_use_case}
        </p>
      )}

      {/* Probability Progress Bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground mb-1">
          <span>Win Probability</span>
          <span className="font-bold text-foreground">{prob}%</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${prob}%` }}
          />
        </div>
      </div>

      {/* Footer info: Amount & Close Date */}
      <div className="flex items-center justify-between border-t pt-2.5 text-xs">
        <span className="text-sm font-extrabold text-foreground tracking-tight">
          {formatCurrency(deal.amount)}
        </span>
        {deal.expected_close_date && (
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-medium bg-muted/60 px-2 py-0.5 rounded-md border">
            <Calendar className="h-3 w-3 text-primary" />
            <span>{formatDate(deal.expected_close_date)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function DealsKanban({
  initialDeals,
  companies,
  contacts,
}: {
  initialDeals: DealCard[];
  companies: Company[];
  contacts: Contact[];
}) {
  const [deals, setDeals] = useState(initialDeals);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const filteredDeals = deals.filter((d) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      d.title.toLowerCase().includes(q) ||
      (d.company_name && d.company_name.toLowerCase().includes(q)) ||
      (d.product_use_case && d.product_use_case.toLowerCase().includes(q))
    );
  });

  const dealsByStage = STAGES.reduce(
    (acc, stage) => {
      acc[stage.id] = filteredDeals.filter((d) => d.stage === stage.id);
      return acc;
    },
    {} as Record<DealStage, DealCard[]>
  );

  const activeDeal = activeId ? deals.find((d) => d.id === activeId) ?? null : null;

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const draggedId = active.id as string;
    const overId = over.id as string;

    const targetStage = STAGES.find((s) => s.id === overId)?.id
      ?? deals.find((d) => d.id === overId)?.stage;

    if (!targetStage) return;

    const dragged = deals.find((d) => d.id === draggedId);
    if (!dragged || dragged.stage === targetStage) return;

    setDeals((prev) =>
      prev.map((d) => (d.id === draggedId ? { ...d, stage: targetStage } : d))
    );

    const result = await updateDealStage(draggedId, targetStage);
    if (!result.success) {
      setDeals(initialDeals);
      toast({ title: "Failed to update stage", description: result.error, variant: "destructive" });
    }
  }

  const activeDealsList = deals.filter((d) => d.stage !== "lost");
  const totalPipelineValue = activeDealsList.reduce((s, d) => s + d.amount, 0);

  return (
    <div className="space-y-5">
      {/* Top Bar: Search & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border bg-card p-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search deals or companies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border bg-background pl-9 pr-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <span className="text-xs text-muted-foreground font-medium hidden md:inline">
            <strong className="text-foreground">{activeDealsList.length}</strong> active deals · Pipeline:{" "}
            <strong className="text-foreground">{formatCurrency(totalPipelineValue)}</strong>
          </span>
        </div>

        <DealSheet companies={companies} contacts={contacts} />
      </div>

      {/* Kanban Board Container */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-6 pt-1">
          {STAGES.map((stage) => (
            <KanbanColumn
              key={stage.id}
              stage={stage}
              deals={dealsByStage[stage.id]}
              companies={companies}
              contacts={contacts}
            />
          ))}
        </div>

        <DragOverlay>
          {activeDeal && (
            <SortableDealCard
              deal={activeDeal}
              stageProb={STAGES.find((s) => s.id === activeDeal.stage)?.defaultProb ?? 50}
              overlay
            />
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
