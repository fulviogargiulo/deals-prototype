import { DealType, DealStatus } from "@/data/types";
import { AlertTriangle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const typeColorMap: Record<DealType, { border: string; text: string }> = {
  Buy: { border: "border-type-buy", text: "text-type-buy" },
  Sell: { border: "border-type-sell", text: "text-type-sell" },
  Rent: { border: "border-type-rent", text: "text-type-rent" },
  Lease: { border: "border-type-lease", text: "text-type-lease" },
  "Buy+Sell": { border: "border-type-buy", text: "text-type-buy" },
  Mortgage: { border: "border-deal-mortgage", text: "text-deal-mortgage" },
  "Rent+Lease": { border: "border-type-rent", text: "text-type-rent" },
};

const statusColorMap: Record<DealStatus, string> = {
  Reported: "bg-[hsl(var(--deal-reported)/0.1)] text-[hsl(var(--deal-reported))]",
  "Pending Details": "bg-[hsl(var(--deal-pending-details)/0.1)] text-[hsl(var(--deal-pending-details))]",
  "Under Review": "bg-[hsl(var(--deal-under-review)/0.1)] text-[hsl(var(--deal-under-review))]",
  "Ready For Invoicing": "bg-[hsl(var(--deal-ready-invoicing)/0.1)] text-[hsl(var(--deal-ready-invoicing))]",
  "Pending Receivables": "bg-[hsl(var(--deal-pending-receivables)/0.1)] text-[hsl(var(--deal-pending-receivables))]",
  "Pending Payment": "bg-[hsl(var(--deal-pending-payment)/0.1)] text-[hsl(var(--deal-pending-payment))]",
  Paid: "bg-[hsl(var(--deal-paid)/0.1)] text-[hsl(var(--deal-paid))]",
};

export function DealTypeBadge({ type }: { type: DealType }) {
  const colors = typeColorMap[type];
  return (
    <span className={`inline-flex items-center justify-center min-w-[48px] px-2 py-0.5 rounded-full text-[11px] font-medium border ${colors.border} ${colors.text}`}>
      {type}
    </span>
  );
}

export function DealStatusBadge({ status, isDisputed }: { status: DealStatus; isDisputed?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`inline-flex items-center justify-center min-w-[130px] px-3 py-0.5 rounded-full text-[11px] font-medium text-center whitespace-nowrap ${statusColorMap[status]}`}>
        {status}
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
