import { DealStatus } from "@/data/types";
import { dealStatusLabel } from "@/lib/labels";
import { statusTier } from "@huspy/shared-domain";

const tierClasses = {
  success: "bg-tier-success-bg text-tier-success",
  info:    "bg-tier-info-bg text-tier-info",
  warning: "bg-tier-warning-bg text-tier-warning",
  danger:  "bg-tier-danger-bg text-tier-danger",
  neutral: "bg-tier-neutral-bg text-tier-neutral",
};

export function DealStatusBadge({ status }: { status: DealStatus }) {
  const cls = tierClasses[statusTier(status)];
  return (
    <span className={`inline-flex items-center justify-center min-w-[130px] px-3 py-0.5 rounded-full text-[11px] font-medium text-center whitespace-nowrap ${cls}`}>
      {dealStatusLabel[status]}
    </span>
  );
}
