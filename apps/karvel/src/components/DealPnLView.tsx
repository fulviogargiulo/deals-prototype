import { Deal } from "@/data/types";
import { PnLDealTable } from "./PnLDealTable";
import { PnLSummaryTable } from "./PnLSummaryTable";
import { Search } from "lucide-react";
import { useState } from "react";
import { DateRange } from "./DateRangePicker";
import { isWithinInterval, startOfDay, endOfDay } from "date-fns";

type PnLTab = "detailed" | "summary";
type TileFilter = "pendingDetails" | "disputed" | "underReview" | "approved" | null;

interface Props {
  deals: Deal[];
  currency?: string;
  dateRange: DateRange;
  onDealsUpdate?: (deals: Deal[]) => void;
}

export function DealPnLView({ deals, currency = "EUR", dateRange, onDealsUpdate }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTile, setActiveTile] = useState<TileFilter>(null);
  const [pnlTab, setPnlTab] = useState<PnLTab>("detailed");

  // Filter deals by date range
  const dateFiltered = deals.filter((deal) => {
    if (!dateRange.from || !dateRange.to) return true;
    const dealDate = startOfDay(new Date(deal.reportDate));
    return isWithinInterval(dealDate, { start: startOfDay(dateRange.from), end: endOfDay(dateRange.to) });
  });

  // Filter by search
  const searched = dateFiltered.filter((deal) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      deal.agentName.toLowerCase().includes(q) ||
      deal.market.toLowerCase().includes(q) ||
      deal.clientName.toLowerCase().includes(q)
    );
  });

  const pendingDetailsDeals = searched.filter(d => d.status === "pending-details");
  const disputedDeals = searched.filter(d => d.isDisputed === true && ["reported", "pending-details", "under-review"].includes(d.status));
  const underReviewDeals = searched.filter(d => d.status === "under-review");
  const approvedDeals = searched.filter(d => d.status === "pending-agent-approval");

  const kanbanCounts = {
    pendingDetails: { count: pendingDetailsDeals.length, amount: pendingDetailsDeals.reduce((s, d) => s + d.dealPrice, 0) },
    disputed: { count: disputedDeals.length, amount: disputedDeals.reduce((s, d) => s + d.dealPrice, 0) },
    underReview: { count: underReviewDeals.length, amount: underReviewDeals.reduce((s, d) => s + d.dealPrice, 0) },
    approved: { count: approvedDeals.length, amount: approvedDeals.reduce((s, d) => s + d.dealPrice, 0) },
  };

  // Apply tile filter
  const filtered = activeTile
    ? searched.filter((d) => {
        if (activeTile === "pendingDetails") return d.status === "pending-details";
        if (activeTile === "disputed") return d.isDisputed === true;
        if (activeTile === "underReview") return d.status === "under-review";
        if (activeTile === "approved") return d.status === "pending-agent-approval";
        return true;
      })
    : searched;

  const handleTileClick = (tile: TileFilter) => {
    setActiveTile((prev) => (prev === tile ? null : tile));
  };

  return (
    <div className="space-y-6 min-w-0 w-full">
      {/* Kanban status tiles */}
      <div className="grid grid-cols-4 gap-3 max-w-[720px]">
        <KanbanTile label="pending-details" count={kanbanCounts.pendingDetails.count} amount={kanbanCounts.pendingDetails.amount} currency={currency} color="amber" active={activeTile === "pendingDetails"} onClick={() => handleTileClick("pendingDetails")} />
        <KanbanTile label="disputed" count={kanbanCounts.disputed.count} amount={kanbanCounts.disputed.amount} currency={currency} color="red" active={activeTile === "disputed"} onClick={() => handleTileClick("disputed")} />
        <KanbanTile label="under-review" count={kanbanCounts.underReview.count} amount={kanbanCounts.underReview.amount} currency={currency} color="blue" active={activeTile === "underReview"} onClick={() => handleTileClick("underReview")} />
        <KanbanTile label="Approved For Invoicing" count={kanbanCounts.approved.count} amount={kanbanCounts.approved.amount} currency={currency} color="green" active={activeTile === "approved"} onClick={() => handleTileClick("approved")} />
      </div>

      {/* Search + Tab toggle */}
      <div className="flex items-center gap-4">
        <div className="relative w-[320px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search Clients, Agents, Properties"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-border rounded-md text-[13px] bg-card placeholder:text-muted-foreground/70 focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <div className="flex rounded-lg overflow-hidden bg-accent p-1 gap-1 ml-auto">
          <button
            onClick={() => setPnlTab("detailed")}
            className={`px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors ${pnlTab === "detailed" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            Detailed
          </button>
          <button
            onClick={() => setPnlTab("summary")}
            className={`px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors ${pnlTab === "summary" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            Summary
          </button>
        </div>
      </div>

      {/* Deal Table */}
      {pnlTab === "detailed" ? (
        <PnLDealTable deals={filtered} currency={currency} onDealsUpdate={onDealsUpdate} />
      ) : (
        <PnLSummaryTable deals={filtered} currency={currency} />
      )}
    </div>
  );
}

/* ---- Helpers ---- */
const kanbanColorMap: Record<string, string> = {
  amber: "text-[hsl(45,93%,35%)]",
  red: "text-[hsl(0,84%,45%)]",
  blue: "text-[hsl(213,94%,40%)]",
  green: "text-[hsl(142,70%,32%)]",
};

function formatCompact(value: number, currency: string): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M ${currency}`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K ${currency}`;
  return `${value} ${currency}`;
}

function KanbanTile({ label, count, amount, currency, color, active, onClick }: { label: string; count: number; amount: number; currency: string; color: string; active: boolean; onClick: () => void }) {
  const c = kanbanColorMap[color] || kanbanColorMap.blue;
  return (
    <button
      onClick={onClick}
      className={`bg-card border rounded-lg px-3 py-2.5 text-left transition-all hover:shadow-sm ${
        active ? "border-primary shadow-sm ring-1 ring-ring" : "border-border"
      }`}
    >
      <p className="text-[11px] font-medium text-foreground/70 mb-1">{label}</p>
      <div className="flex items-baseline gap-1.5">
        <span className={`text-[22px] font-bold leading-none ${c}`}>{count}</span>
        <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-medium">{formatCompact(amount, currency)}</span>
      </div>
      <p className="text-[9px] text-muted-foreground/70 mt-1">{formatCompact(amount, currency)} deal value</p>
    </button>
  );
}
