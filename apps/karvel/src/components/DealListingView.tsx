import { Deal } from "@/data/types";
import { DealListingTable } from "./DealListingTable";
import { FileText, TrendingUp, DollarSign, Percent, Search } from "lucide-react";
import { useState } from "react";
import { DateRange } from "./DateRangePicker";
import {
  isWithinInterval, startOfDay, endOfDay
} from "date-fns";

interface Props {
  deals: Deal[];
  currency?: string;
  dateRange: DateRange;
}

export function DealListingView({ deals, currency = "EUR", dateRange }: Props) {
  const [searchQuery, setSearchQuery] = useState("");

  const dateFiltered = deals.filter((deal) => {
    if (!dateRange.from || !dateRange.to) return true;
    const dealDate = startOfDay(new Date(deal.reportDate));
    return isWithinInterval(dealDate, { start: startOfDay(dateRange.from), end: endOfDay(dateRange.to) });
  });

  const filtered = dateFiltered.filter((deal) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      deal.agentName.toLowerCase().includes(q) ||
      deal.market.toLowerCase().includes(q) ||
      deal.clientName.toLowerCase().includes(q) ||
      deal.id.toLowerCase().includes(q)
    );
  });

  const totalDeals = filtered.length;
  const totalVolume = filtered.reduce((sum, d) => sum + (d.dealPrice || d.dealAmount), 0);
  const totalRevenue = filtered.reduce((sum, d) => sum + (d.huspyRevenue || 0), 0);
  const avgRevenuePercent = totalVolume > 0 ? (totalRevenue / totalVolume) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Summary tiles */}
      <div className="grid grid-cols-4 gap-4">
        <SummaryTile label="Total Deals" value={totalDeals.toString()} subtitle="Selected period" icon={<FileText className="h-5 w-5" />} />
        <SummaryTile label="Total Volume" value={formatCompact(totalVolume, currency)} subtitle="Deal value" icon={<TrendingUp className="h-5 w-5" />} />
        <SummaryTile label="Total Revenue" value={formatCompact(totalRevenue, currency)} subtitle="Revenue earned" icon={<DollarSign className="h-5 w-5" />} />
        <SummaryTile label="Avg. Revenue %" value={`${avgRevenuePercent.toFixed(2)}%`} subtitle="Average revenue rate" icon={<Percent className="h-5 w-5" />} />
      </div>

      {/* Search */}
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
      </div>

      {/* Deal Listing Table */}
      <DealListingTable deals={filtered} currency={currency} />
    </div>
  );
}

/* ---- Helpers ---- */
function SummaryTile({ label, value, subtitle, icon }: { label: string; value: string; subtitle: string; icon: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2.5 text-left">
      <p className="text-[11px] font-medium text-foreground/70 mb-1">{label}</p>
      <div className="flex items-baseline gap-1.5">
        <span className="text-[22px] font-bold leading-none text-foreground">{value}</span>
      </div>
      <p className="text-[9px] text-muted-foreground/70 mt-1">{subtitle}</p>
    </div>
  );
}

function formatCompact(amount: number, currency: string): string {
  const symbol = currency === "EUR" ? "€" : currency === "AED" ? "AED " : "SAR ";
  if (amount >= 1_000_000) return `${symbol}${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `${symbol}${(amount / 1_000).toFixed(0)}K`;
  return `${symbol}${amount.toFixed(0)}`;
}
