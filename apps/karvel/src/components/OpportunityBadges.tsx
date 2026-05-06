import { OpportunityType, OpportunityStatus } from "@/data/types";

const typeColorMap: Record<OpportunityType, { border: string; text: string; bg: string }> = {
  Buy: { border: "border-type-buy", text: "text-type-buy", bg: "bg-type-buy/10" },
  Sell: { border: "border-type-sell", text: "text-type-sell", bg: "bg-type-sell/10" },
  Rent: { border: "border-type-rent", text: "text-type-rent", bg: "bg-type-rent/10" },
  Lease: { border: "border-type-lease", text: "text-type-lease", bg: "bg-type-lease/10" },
};

const statusColorMap: Record<OpportunityStatus, string> = {
  New: "bg-status-new",
  Active: "bg-status-active",
  Closed: "bg-status-closed",
  Inactive: "bg-status-inactive",
};

export function TypeBadge({ type }: { type: OpportunityType }) {
  const colors = typeColorMap[type];
  return (
    <span className={`inline-flex items-center justify-center min-w-[48px] px-2 py-0.5 rounded-full text-[11px] font-medium border ${colors.border} ${colors.text}`}>
      {type}
    </span>
  );
}

export function StatusBadge({ status }: { status: OpportunityStatus }) {
  return (
    <span className={`inline-flex items-center justify-center min-w-[48px] px-2.5 py-0.5 rounded-full text-[11px] font-medium text-primary-foreground ${statusColorMap[status]}`}>
      {status}
    </span>
  );
}
