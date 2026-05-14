import { DealStatus } from "@/data/types";
import { dealStatusLabel } from "@/lib/labels";

const statusColorMap: Record<DealStatus, string> = {
  "pending-details": "bg-[hsl(var(--deal-pending-details)/0.1)] text-[hsl(var(--deal-pending-details))]",
  "under-review": "bg-[hsl(var(--deal-under-review)/0.1)] text-[hsl(var(--deal-under-review))]",
  "pending-agent-approval": "bg-[hsl(var(--deal-ready-invoicing)/0.1)] text-[hsl(var(--deal-ready-invoicing))]",
  "pending-receivables": "bg-[hsl(var(--deal-pending-receivables)/0.1)] text-[hsl(var(--deal-pending-receivables))]",
  finalized: "bg-[hsl(var(--deal-paid)/0.1)] text-[hsl(var(--deal-paid))]",
  canceled: "bg-muted text-muted-foreground",
};

export function DealStatusBadge({ status }: { status: DealStatus }) {
  return (
    <span className={`inline-flex items-center justify-center min-w-[130px] px-3 py-0.5 rounded-full text-[11px] font-medium text-center whitespace-nowrap ${statusColorMap[status]}`}>
      {dealStatusLabel[status]}
    </span>
  );
}
