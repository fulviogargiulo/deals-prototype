import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, Settings, Upload, Plus, LayoutGrid, Columns2, UserRound, TableProperties } from "lucide-react";
import { mockOpportunities } from "@/data/mockData";
import { OpportunityTable } from "@/components/OpportunityTable";
import { OpportunityKanban } from "@/components/OpportunityKanban";
import { OpportunityDetailPanel } from "@/components/OpportunityDetailPanel";
import { Opportunity } from "@/data/types";

type ViewMode = "table" | "kanban";

const Index = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null);

  useEffect(() => {
    const selected = searchParams.get("selected");
    if (selected) {
      const match = mockOpportunities.find((o) => o.title === selected);
      if (match) setSelectedOpp(match);
      setSearchParams({}, { replace: true });
    }
  }, []);

  const filtered = mockOpportunities.filter((opp) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      opp.clientName.toLowerCase().includes(q) ||
      opp.clientPhone.includes(q) ||
      opp.title.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-background">
      {/* Top header bar */}
      <header className="flex items-center justify-between px-5 h-12 bg-card">
        <div className="flex items-center gap-2.5">
          <Columns2 className="h-[16px] w-[16px] text-muted-foreground" />
          <span className="font-semibold text-[14px] text-foreground">Opportunities</span>
        </div>
        <div className="flex items-center gap-2.5">
          <button className="p-1.5 rounded-full hover:bg-muted transition-colors text-muted-foreground">
            <Settings className="h-[18px] w-[18px]" />
          </button>
          <div className="w-8 h-8 rounded-full bg-foreground flex items-center justify-center">
            <UserRound className="h-4 w-4 text-primary-foreground" />
          </div>
        </div>
      </header>

      {/* Content + Panel */}
      <div className="flex-1 relative overflow-hidden">
        <div className="px-6 py-6 bg-background h-full overflow-auto">
          {/* Title row */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <h1 className="text-[22px] font-semibold text-foreground">Opportunity Management</h1>
              <div className="flex rounded-lg overflow-hidden bg-accent p-1 gap-1">
                <button
                  onClick={() => setViewMode("table")}
                  className={`p-2 rounded-md transition-colors ${viewMode === "table" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <TableProperties className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode("kanban")}
                  className={`p-2 rounded-md transition-colors ${viewMode === "kanban" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2 border border-border rounded-md text-[13px] font-medium text-foreground bg-card hover:bg-muted transition-colors">
                <Upload className="h-4 w-4" />
                Bulk Upload
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-[13px] font-medium hover:opacity-90 transition-opacity">
                <Plus className="h-4 w-4" />
                Add Opportunity
              </button>
            </div>
          </div>

          {/* Search bar + active filters */}
          <div className="flex items-center gap-6 mb-6">
            <div className="relative w-[400px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by Client Name, email and phone number"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border border-border rounded-none text-[13px] bg-card placeholder:text-muted-foreground/70 focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div className="text-[13px]">
              <span className="font-medium text-foreground">Active Filters:</span>{" "}
              <span className="text-muted-foreground">No filters applied</span>
            </div>
          </div>

          {/* View */}
          {viewMode === "table" ? (
            <OpportunityTable
              opportunities={filtered}
              onRowClick={(opp) => setSelectedOpp(opp)}
              selectedId={selectedOpp?.id}
            />
          ) : (
            <OpportunityKanban opportunities={filtered} />
          )}
        </div>

        {/* Detail Panel - overlays from right */}
        {selectedOpp && (
          <div className="absolute top-0 right-0 h-full z-10 shadow-xl animate-slide-in-right">
            <OpportunityDetailPanel
              opportunity={selectedOpp}
              onClose={() => setSelectedOpp(null)}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
