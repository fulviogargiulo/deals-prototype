import { DealType, DealStatus } from "@/data/types";
import { dealTypeLabel, dealStatusLabel } from "@/lib/labels";
import { AlertTriangle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const typeColorMap: Record<DealType, { border: string; text: string }> = {
  buy: { border: "border-type-buy", text: "text-type-buy" },
  sell: { border: "border-type-sell", text: "text-type-sell" },
  rent: { border: "border-type-rent", text: "text-type-rent" },
  lease: { border: "border-type-lease", text: "text-type-lease" },
  "buy-sell": { border: "border-type-buy", text: "text-type-buy" },
  mortgage: { border: "border-deal-mortgage", text: "text-deal-mortgage" },
  "rent-lease": { border: "border-type-rent", text: "text-type-rent" },
};

const statusColorMap: Record<DealStatus, string> = {
  reported: "bg-[hsl(var(--deal-reported)/0.1)] text-[hsl(var(--deal-reported))]",
  "pending-details": "bg-[hsl(var(--deal-pending-details)/0.1)] text-[hsl(var(--deal-pending-details))]",
  "under-review": "bg-[hsl(var(--deal-under-review)/0.1)] text-[hsl(var(--deal-under-review))]",
  "pending-agent-approval": "bg-[hsl(var(--deal-ready-invoicing)/0.1)] text-[hsl(var(--deal-ready-invoicing))]",
  "pending-receivables": "bg-[hsl(var(--deal-pending-receivables)/0.1)] text-[hsl(var(--deal-pending-receivables))]",
  finalized: "bg-[hsl(var(--deal-paid)/0.1)] text-[hsl(var(--deal-paid))]",
  canceled: "bg-muted text-muted-foreground",
};

export function DealTypeBadge({ type }: { type: DealType }) {
  const colors = typeColorMap[type];
  return (
    <span className={`inline-flex items-center justify-center min-w-[48px] px-2 py-0.5 rounded-full text-[11px] font-medium border ${colors.border} ${colors.text}`}>
      {dealTypeLabel[type]}
    </span>
  );
}

export function DealStatusBadge({ status, isDisputed }: { status: DealStatus; isDisputed?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`inline-flex items-center justify-center min-w-[130px] px-3 py-0.5 rounded-full text-[11px] font-medium text-center whitespace-nowrap ${statusColorMap[status]}`}>
        {dealStatusLabel[status]}
      </span>
      {isDisputed && (
        <Tooltip>
          <TooltipTrigger asChild>
            <AlertTriangle className="h-[18px] w-[18px] text-destructive cursor-help" strokeWidth={2.5} />
          </TooltipTrigger>
          <TooltipContent side="top" className="text-[11px]">Deal is Disputed</TooltipContent>
        </Tooltip>
      )}
    </span>
  );
}
