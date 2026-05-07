import { Deal, DealStatus } from "@/data/types";
import { DealTypeBadge, DealStatusBadge } from "./DealBadges";
import { MoreVertical, ChevronDown } from "lucide-react";
import { useState } from "react";

interface Props {
  deals: Deal[];
  currency?: string;
}

const statusColumns: DealStatus[] = [
  "reported",
  "pending-details",
  "under-review",
  "pending-agent-approval",
  "pending-receivables",
  "finalized",
  "canceled",
];

export function DealKanban({ deals, currency = "EUR" }: Props) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const grouped = statusColumns.reduce((acc, status) => {
    acc[status] = deals.filter((d) => d.status === status);
    return acc;
  }, {} as Record<DealStatus, Deal[]>);

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {statusColumns.map((status) => (
        <div key={status} className="min-w-[240px] flex-1">
          <button
            onClick={() => setCollapsed((prev) => ({ ...prev, [status]: !prev[status] }))}
            className="flex items-center gap-2 mb-3 w-full text-left"
          >
            <ChevronDown
              className={`h-4 w-4 text-muted-foreground transition-transform ${collapsed[status] ? "-rotate-90" : ""}`}
            />
            <span className="font-semibold text-[13px] text-foreground">{status}</span>
            <span className="ml-auto text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full font-medium">
              {grouped[status].length}
            </span>
          </button>

          {!collapsed[status] && (
            <div className="space-y-3">
              {grouped[status].map((deal) => (
                <div key={deal.id} className="bg-card border border-border rounded-lg p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <span className="font-medium text-[13px] text-foreground">{deal.clientName}</span>
                    <button className="text-muted-foreground hover:text-foreground p-0.5 -mr-1">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="flex gap-1.5 mb-3">
                    <DealTypeBadge type={deal.type} />
                    <DealStatusBadge status={deal.status} isDisputed={deal.isDisputed} />
                  </div>

                  <div className="space-y-1 text-[12px] text-muted-foreground">
                    <p>Agent: {deal.agentName}</p>
                    <p>Opportunity: {deal.opportunityName}</p>
                    <p className="text-foreground font-medium">{formatAmount(deal.dealAmount, deal.currency ?? currency)}</p>
                  </div>

                  <div className="mt-3 pt-3 border-t border-border text-[11px] text-muted-foreground">
                    <p>Report Date: {formatDate(deal.reportDate)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
}
