import { DealStatus } from "@/data/types";
import { dealStatusLabel } from "@/lib/labels";
import { dealStatusColors } from "@huspy/shared-domain";

export function DealStatusBadge({ status }: { status: DealStatus }) {
  const { hsl } = dealStatusColors[status];
  return (
    <span
      className="inline-flex items-center justify-center min-w-[130px] px-3 py-0.5 rounded-full text-[11px] font-medium text-center whitespace-nowrap"
      style={{ color: `hsl(${hsl})`, background: `hsl(${hsl} / 0.1)` }}
    >
      {dealStatusLabel[status]}
    </span>
  );
}
