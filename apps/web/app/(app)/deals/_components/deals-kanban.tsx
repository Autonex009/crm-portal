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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Plus, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";

type DealStage = "prospect" | "proposal" | "negotiation" | "won" | "lost";

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

const STAGES: { id: DealStage; label: string; colorClass: string; dotColor: string }[] = [
  { id: "prospect",    label: "Prospect",    colorClass: "bg-slate-50 border-slate-200",  dotColor: "bg-slate-400" },
  { id: "proposal",   label: "Proposal",    colorClass: "bg-blue-50 border-blue-200",    dotColor: "bg-blue-500" },
  { id: "negotiation",label: "Negotiation", colorClass: "bg-amber-50 border-amber-200",  dotColor: "bg-amber-500" },
  { id: "won",        label: "Won",         colorClass: "bg-emerald-50 border-emerald-200", dotColor: "bg-emerald-500" },
  { id: "lost",       label: "Lost",        colorClass: "bg-red-50 border-red-200",      dotColor: "bg-red-400" },
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
  const total = deals.reduce((s, d) => s + d.amount, 0);

  return (
    <div className={cn("flex-shrink-0 w-72 flex flex-col rounded-xl border", stage.colorClass)}>
      <div className="flex items-center gap-2 p-3 pb-2">
        <div className={cn("h-2 w-2 rounded-full", stage.dotColor)} />
        <h3 className="font-semibold text-sm flex-1 text-slate-900">{stage.label}</h3>
        <span className="text-xs font-medium bg-white text-slate-700 rounded-full px-2 py-0.5 border border-slate-200">
          {deals.length}
        </span>
      </div>
      <div className="px-3 pb-2">
        <p className="text-xs text-slate-500 font-medium">{formatCurrency(total)}</p>
      </div>

      <SortableContext items={deals.map((d) => d.id)} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className={cn(
            "flex-1 px-2 pb-2 space-y-2 min-h-32 rounded-lg transition-colors",
            isOver && "bg-black/5"
          )}
        >
          {deals.map((deal) => (
            <SortableDealCard key={deal.id} deal={deal} />
          ))}
        </div>
      </SortableContext>

      <div className="px-2 pb-2">
        <DealSheet
          companies={companies}
          contacts={contacts}
          defaultStage={stage.id}
          trigger={
            <button className="w-full flex items-center gap-1.5 px-2 py-1.5 text-xs text-slate-500 hover:text-slate-900 hover:bg-black/5 rounded-md transition-colors">
              <Plus className="h-3.5 w-3.5" />
              Add deal
            </button>
          }
        />
      </div>
    </div>
  );
}

function SortableDealCard({ deal, overlay }: { deal: DealCard; overlay?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: deal.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group bg-white rounded-lg border border-slate-200 shadow-sm p-3 cursor-grab active:cursor-grabbing",
        isDragging && !overlay && "opacity-40 ring-2 ring-primary/20",
        overlay && "rotate-1 shadow-xl"
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
        <p className="font-medium text-sm leading-tight mb-2 text-slate-900 group-hover:text-primary transition-colors">
          {deal.title}
        </p>
      </Link>

      {deal.company_name && (
        <p className="text-xs text-slate-500 mb-1">{deal.company_name}</p>
      )}

      {deal.product_use_case && (
        <p className="text-xs text-slate-400 mb-2 truncate">{deal.product_use_case}</p>
      )}

      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-900">
          {formatCurrency(deal.amount)}
        </span>
        <div className="flex items-center gap-2">
          {deal.probability != null && (
            <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
              {deal.probability}%
            </span>
          )}
          {deal.expected_close_date && (
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <Calendar className="h-3 w-3" />
              {formatDate(deal.expected_close_date)}
            </div>
          )}
        </div>
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

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const dealsByStage = STAGES.reduce(
    (acc, stage) => {
      acc[stage.id] = deals.filter((d) => d.stage === stage.id);
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

  const totalPipelineValue = deals
    .filter((d) => d.stage !== "lost")
    .reduce((s, d) => s + d.amount, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Pipeline value: <span className="font-semibold text-foreground">{formatCurrency(totalPipelineValue)}</span>
          <span className="mx-2">·</span>
          {deals.filter(d => d.stage !== "lost").length} active deals
        </p>
        <DealSheet companies={companies} contacts={contacts} />
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
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
          {activeDeal && <SortableDealCard deal={activeDeal} overlay />}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
