import { Deal } from "@/data/types";
import { DealListingTable, TranchRow } from "./DealListingTable";
import { getTranchesForDeal } from "@/data/trancheStore";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";

interface Props {
  deals: Deal[];
}

export function DealListingView({ deals }: Props) {
  const [searchQuery, setSearchQuery] = useState("");

  // Flatten deals × tranches — one row per tranche, sorted by deal then tranche index.
  const allRows = useMemo<TranchRow[]>(() =>
    deals.flatMap((deal) =>
      getTranchesForDeal(deal.id).map((tranche) => ({ deal, tranche }))
    ),
    [deals]
  );

  const rows = useMemo(() => {
    if (!searchQuery) return allRows;
    const q = searchQuery.toLowerCase();
    return allRows.filter(({ deal }) =>
      deal.title?.toLowerCase().includes(q) ||
      deal.market?.toLowerCase().includes(q) ||
      deal.id.toLowerCase().includes(q)
    );
  }, [allRows, searchQuery]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="relative w-[320px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search clients, agents, properties"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-border rounded-md text-[13px] bg-card placeholder:text-muted-foreground/70 focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      </div>

      <DealListingTable rows={rows} />
    </div>
  );
}
