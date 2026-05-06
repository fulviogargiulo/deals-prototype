import { Deal } from "@/data/types";
import { DealTypeBadge, DealStatusBadge } from "./DealBadges";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface Props {
  deals: Deal[];
  onRowClick?: (deal: Deal) => void;
  selectedId?: string;
  currency?: string;
}

export function DealTable({ deals, onRowClick, selectedId, currency = "EUR" }: Props) {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const perPage = 10;
  const totalCount = deals.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / perPage));
  const paginated = deals.slice((page - 1) * perPage, page * perPage);

  const thClass = "text-left px-5 py-3 font-semibold text-foreground text-[14px] whitespace-nowrap";
  const tdClass = "px-5 py-3.5 text-[14px] text-foreground font-medium whitespace-nowrap";

  return (
    <div>
      <div className="bg-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className={thClass}>ID · {totalCount}</th>
                <th className={thClass}>Type</th>
                <th className={`${thClass} text-center`}>Status</th>
                <th className={thClass}>Market</th>
                <th className={thClass}>Client Name</th>
                <th className={thClass}>Agent Name</th>
                <th className={thClass}>Opportunity Name</th>
                <th className={thClass}>Amount</th>
                <th className={thClass}>Report Date</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((deal) => (
                <tr
                  key={deal.id}
                  onClick={() => onRowClick?.(deal)}
                  className={`border-b border-border hover:bg-muted/30 transition-colors cursor-pointer ${selectedId === deal.id ? "bg-muted/50" : ""}`}
                >
                  <td className={tdClass}>{deal.id}</td>
                  <td className="px-5 py-3.5"><DealTypeBadge type={deal.type} /></td>
                  <td className="px-5 py-3.5 text-center"><DealStatusBadge status={deal.status} isDisputed={deal.isDisputed} /></td>
                  <td className={tdClass}>{deal.market}</td>
                  <td className={tdClass}>
                    <button onClick={(e) => { e.stopPropagation(); navigate(`/clients?selected=${encodeURIComponent(deal.clientName)}`); }} className="text-primary underline underline-offset-2 hover:opacity-80">{deal.clientName}</button>
                  </td>
                  <td className={tdClass}>
                    <button onClick={(e) => { e.stopPropagation(); navigate(`/agents?selected=${encodeURIComponent(deal.agentName)}`); }} className="text-primary underline underline-offset-2 hover:opacity-80">{deal.agentName}</button>
                  </td>
                  <td className={`${tdClass} max-w-[200px] truncate`}>
                    <button onClick={(e) => { e.stopPropagation(); navigate(`/?selected=${encodeURIComponent(deal.opportunityName)}`); }} className="text-primary underline underline-offset-2 hover:opacity-80">{deal.opportunityName}</button>
                  </td>
                  <td className={tdClass}>{formatAmount(deal.amount, currency)}</td>
                  <td className={tdClass}>{formatDate(deal.reportDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-center gap-2 py-5">
        <button onClick={() => setPage(1)} disabled={page === 1} className="w-8 h-8 flex items-center justify-center rounded border border-border bg-card disabled:opacity-30 hover:bg-muted transition-colors">
          <ChevronsLeft className="h-4 w-4 text-foreground" />
        </button>
        <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="w-8 h-8 flex items-center justify-center rounded border border-border bg-card disabled:opacity-30 hover:bg-muted transition-colors">
          <ChevronLeft className="h-4 w-4 text-foreground" />
        </button>
        <div className="flex items-center gap-2 text-[14px] mx-1">
          <input
            type="number"
            value={page}
            onChange={(e) => {
              const v = parseInt(e.target.value);
              if (v >= 1 && v <= totalPages) setPage(v);
            }}
            className="w-12 h-8 text-center border border-border rounded px-1 text-[14px] bg-card focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <span className="text-muted-foreground">of {totalCount}</span>
        </div>
        <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="w-8 h-8 flex items-center justify-center rounded border border-border bg-card disabled:opacity-30 hover:bg-muted transition-colors">
          <ChevronRight className="h-4 w-4 text-foreground" />
        </button>
        <button onClick={() => setPage(totalPages)} disabled={page === totalPages} className="w-8 h-8 flex items-center justify-center rounded border border-border bg-card disabled:opacity-30 hover:bg-muted transition-colors">
          <ChevronsRight className="h-4 w-4 text-foreground" />
        </button>
      </div>
    </div>
  );
}

function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
}
