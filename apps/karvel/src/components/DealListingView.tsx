import { Deal } from "@/data/types";
import { DealListingTable } from "./DealListingTable";
import { Search } from "lucide-react";
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

  return (
    <div className="space-y-6">
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

