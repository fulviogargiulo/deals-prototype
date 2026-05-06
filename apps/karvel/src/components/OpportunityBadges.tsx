import { OpportunityType, OpportunityStatus } from "@/data/types";
import { opportunityTypeLabel, opportunityStatusLabel } from "@/lib/labels";

const typeColorMap: Record<OpportunityType, { border: string; text: string; bg: string }> = {
  buy: { border: "border-type-buy", text: "text-type-buy", bg: "bg-type-buy/10" },
  sell: { border: "border-type-sell", text: "text-type-sell", bg: "bg-type-sell/10" },
  rent: { border: "border-type-rent", text: "text-type-rent", bg: "bg-type-rent/10" },
  lease: { border: "border-type-lease", text: "text-type-lease", bg: "bg-type-lease/10" },
  mortgage: { border: "border-type-buy", text: "text-type-buy", bg: "bg-type-buy/10" },
};

const statusColorMap: Record<OpportunityStatus, string> = {
  new: "bg-status-new",
  "to-review": "bg-status-new",
  qualified: "bg-status-active",
  active: "bg-status-active",
  "under-offer": "bg-status-active",
  closed: "bg-status-closed",
  inactive: "bg-status-inactive",
};

export function TypeBadge({ type }: { type: OpportunityType }) {
  const colors = typeColorMap[type];
  return (
    <span className={`inline-flex items-center justify-center min-w-[48px] px-2 py-0.5 rounded-full text-[11px] font-medium border ${colors.border} ${colors.text}`}>
      {opportunityTypeLabel[type]}
    </span>
  );
}

export function StatusBadge({ status }: { status: OpportunityStatus }) {
  return (
    <span className={`inline-flex items-center justify-center min-w-[48px] px-2.5 py-0.5 rounded-full text-[11px] font-medium text-primary-foreground ${statusColorMap[status]}`}>
      {opportunityStatusLabel[status]}
    </span>
  );
}
