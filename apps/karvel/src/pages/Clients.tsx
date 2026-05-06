import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, Settings, LayoutGrid, Columns2, UserRound, TableProperties } from "lucide-react";
import { mockClients } from "@/data/mockClients";
import { ClientTable } from "@/components/ClientTable";
import { ClientDetailPanel } from "@/components/ClientDetailPanel";
import { Client } from "@/data/clientTypes";

const Clients = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<"table" | "kanban">("table");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  useEffect(() => {
    const selected = searchParams.get("selected");
    if (selected) {
      const match = mockClients.find((c) => c.name === selected);
      if (match) setSelectedClient(match);
      setSearchParams({}, { replace: true });
    }
  }, []);

  const filtered = mockClients.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.phone.includes(q)
    );
  });

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-background">
      {/* Top header */}
      <header className="flex items-center justify-between px-5 h-12 bg-card">
        <div className="flex items-center gap-2.5">
          <Columns2 className="h-[16px] w-[16px] text-muted-foreground" />
          <span className="font-semibold text-[14px] text-foreground">Clients</span>
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
              <h1 className="text-[22px] font-semibold text-foreground">Clients</h1>
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
          </div>

          {/* Search + filters */}
          <div className="flex items-center gap-6 mb-6">
            <div className="relative w-[380px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by name, email or phone"
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

          {/* Table */}
          <ClientTable
            clients={filtered}
            onRowClick={(client) => setSelectedClient(client)}
            selectedId={selectedClient?.id}
          />
        </div>

        {/* Detail Panel - overlays from right */}
        {selectedClient && (
          <div className="absolute top-0 right-0 h-full z-10 shadow-xl animate-slide-in-right">
            <ClientDetailPanel
              client={selectedClient}
              onClose={() => setSelectedClient(null)}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Clients;
