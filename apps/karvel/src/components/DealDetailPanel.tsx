import { Deal } from "@/data/types";
import { DealTypeBadge, DealStatusBadge } from "./DealBadges";
import { X, ArrowUpRight } from "lucide-react";

interface Props {
  deal: Deal;
  onClose: () => void;
}

export function DealDetailPanel({ deal, onClose }: Props) {
  return (
    <div className="w-[400px] min-w-[400px] border-l border-border bg-card h-full overflow-y-auto animate-slide-in-right">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <h2 className="text-xl font-semibold text-foreground">{deal.id}</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.open(`/deals/${encodeURIComponent(deal.id)}`, '_blank')}
              className="p-1 hover:bg-muted rounded transition-colors text-muted-foreground"
              title="Open in new tab"
            >
              <ArrowUpRight className="h-5 w-5" />
            </button>
            <button onClick={onClose} className="p-1 hover:bg-muted rounded transition-colors text-muted-foreground">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <hr className="border-border mb-5" />

        {/* Overview */}
        <h3 className="text-[15px] font-semibold text-foreground mb-4">Overview</h3>

        <div className="space-y-4">
          <div className="flex items-center">
            <span className="w-[140px] text-[13px] text-muted-foreground shrink-0">Type</span>
            <DealTypeBadge type={deal.type} />
          </div>
          <div className="flex items-center">
            <span className="w-[140px] text-[13px] text-muted-foreground shrink-0">Status</span>
            <DealStatusBadge status={deal.status} isDisputed={deal.isDisputed} />
          </div>
          <DetailRow label="Market" value={deal.market} />
          <DetailRow label="Client Name" value={deal.clientName} />
          <DetailRow label="Agent Name" value={deal.agentName} />
          <DetailRow label="Opportunity" value={deal.opportunityName} />
          <DetailRow label="Amount" value={formatAmount(deal.dealAmount)} />
          <DetailRow label="Report Date" value={formatDate(deal.reportDate)} />
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center">
      <span className="w-[140px] text-[13px] text-muted-foreground shrink-0">{label}</span>
      <span className="text-[14px] text-foreground font-medium">{value}</span>
    </div>
  );
}

function formatAmount(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "EUR" }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
