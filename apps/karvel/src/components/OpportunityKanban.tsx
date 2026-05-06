import { Opportunity, OpportunityStatus } from "@/data/types";
import { TypeBadge, StatusBadge } from "./OpportunityBadges";
import { opportunityStatusLabel } from "@/lib/labels";
import { MoreVertical, ChevronDown } from "lucide-react";
import { useState } from "react";

interface Props {
  opportunities: Opportunity[];
}

const statusColumns: OpportunityStatus[] = ["new", "active", "closed", "inactive"];

export function OpportunityKanban({ opportunities }: Props) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const grouped = statusColumns.reduce((acc, status) => {
    acc[status] = opportunities.filter((o) => o.status === status);
    return acc;
  }, {} as Record<OpportunityStatus, Opportunity[]>);

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {statusColumns.map((status) => (
        <div key={status} className="min-w-[280px] flex-1">
          <button
            onClick={() => setCollapsed((prev) => ({ ...prev, [status]: !prev[status] }))}
            className="flex items-center gap-2 mb-3 w-full text-left"
          >
            <ChevronDown
              className={`h-4 w-4 text-muted-foreground transition-transform ${collapsed[status] ? "-rotate-90" : ""}`}
            />
            <span className="font-semibold text-[13px] text-foreground">{opportunityStatusLabel[status]}</span>
            <span className="ml-auto text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full font-medium">
              {grouped[status].length}
            </span>
          </button>

          {!collapsed[status] && (
            <div className="space-y-3">
              {grouped[status].map((opp) => (
                <div key={opp.id} className="bg-card border border-border rounded-lg p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <span className="font-medium text-[13px] text-foreground">{opp.clientName}</span>
                    <button className="text-muted-foreground hover:text-foreground p-0.5 -mr-1">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="flex gap-1.5 mb-3">
                    <TypeBadge type={opp.type} />
                    <StatusBadge status={opp.status} />
                  </div>

                  <div className="space-y-1 text-[12px] text-muted-foreground">
                    <p>Agent: {opp.agentName}</p>
                    <p>Source: {opp.source}</p>
                  </div>

                  <div className="mt-3 pt-3 border-t border-border space-y-0.5 text-[11px] text-muted-foreground">
                    <p>Created: {formatDate(opp.createdAt)}</p>
                    <p>Updated: {formatDate(opp.updatedAt)}</p>
                    <p>Last Activity: {formatDate(opp.lastActivity)}</p>
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

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
}
