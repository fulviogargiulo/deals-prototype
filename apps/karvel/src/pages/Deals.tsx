import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Settings, Upload, Plus, UserRound, DollarSign, List, Receipt, ClipboardList, BookOpen, Settings2 } from "lucide-react";
import { getDeals, setDeals as setStoreDeals, addDeals as addStoreDeals } from "@/data/dealStore";
import { DealListingView } from "@/components/DealListingView";
import { InvoicesView } from "@/components/InvoicesView";
import { Deal } from "@/data/types";
import { BulkUploadDialog } from "@/components/BulkUploadDialog";
import { AddDealDialog } from "@/components/AddDealDialog";
import { DocRequirementsView } from "@/components/DocRequirementsView";
import { LedgerView } from "@/components/LedgerView";
import { BrokerRateSlabsView } from "@/components/BrokerRateSlabsView";
import { MBUDirectRatesView } from "@/components/MBUDirectRatesView";

type ViewMode = "listing" | "invoices" | "ledger" | "deal-config";
type DealConfigSubTab = "doc-requirements" | "broker-rate-slabs" | "mbu-direct-rates";

const VIEW_TITLES: Record<ViewMode, string> = {
  listing: "Deal Management",
  invoices: "Invoices",
  ledger: "Ledger",
  "deal-config": "Deal Configuration",
};

const Deals = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const viewMode = (searchParams.get("tab") as ViewMode) ?? "listing";
  const setViewMode = (mode: ViewMode) => setSearchParams({ tab: mode });
  const [dealConfigTab, setDealConfigTab] = useState<DealConfigSubTab>("doc-requirements");
  const [allDeals, setAllDealsState] = useState<Deal[]>(getDeals());
  const setAllDeals = (updater: Deal[] | ((prev: Deal[]) => Deal[])) => {
    setAllDealsState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      setStoreDeals(next);
      return next;
    });
  };
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false);
  const [addDealOpen, setAddDealOpen] = useState(false);

  const handleDealUpdate = (updated: Deal) => {
    setAllDeals((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
  };

  const handleBulkDealsUpdate = (updatedDeals: Deal[]) => {
    setAllDeals(updatedDeals);
  };

  return (
    <div className="flex-1 min-w-0 flex flex-col min-h-screen bg-background overflow-x-hidden">
      <header className="flex items-center justify-between px-5 h-12 bg-card">
        <div className="flex items-center gap-2.5">
          <DollarSign className="h-[16px] w-[16px] text-muted-foreground" />
          <span className="font-semibold text-[14px] text-foreground">Deals</span>
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

      <div className="flex-1 min-w-0 px-6 py-6 bg-background overflow-y-auto overflow-x-hidden">
          {/* Title row */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <h1 className="text-[22px] font-semibold text-foreground min-w-[240px]">{VIEW_TITLES[viewMode]}</h1>
              <div className="flex rounded-lg overflow-hidden bg-accent p-1 gap-1">
                <button
                  onClick={() => setViewMode("listing")}
                  className={`p-2 rounded-md transition-colors ${viewMode === "listing" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                  title="Deals"
                >
                  <List className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode("invoices")}
                  className={`p-2 rounded-md transition-colors ${viewMode === "invoices" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                  title="Invoices"
                >
                  <Receipt className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode("ledger")}
                  className={`p-2 rounded-md transition-colors ${viewMode === "ledger" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                  title="Ledger"
                >
                  <BookOpen className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode("deal-config")}
                  className={`p-2 rounded-md transition-colors ${viewMode === "deal-config" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                  title="Deal Configuration"
                >
                  <Settings2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {viewMode === "listing" && (
              <div className="flex items-center gap-3">

                <button onClick={() => setBulkUploadOpen(true)} className="flex items-center gap-2 px-4 py-2 border border-border rounded-md text-[13px] font-medium text-foreground bg-card hover:bg-muted transition-colors">
                  <Upload className="h-4 w-4" />
                  Bulk Upload
                </button>
                <button onClick={() => setAddDealOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-[13px] font-medium hover:opacity-90 transition-opacity">
                  <Plus className="h-4 w-4" />
                  Add Deal
                </button>
              </div>
            )}
          </div>

          {/* View */}
          {viewMode === "listing" ? (
            <DealListingView deals={allDeals} />
          ) : viewMode === "invoices" ? (
            <InvoicesView />
          ) : viewMode === "ledger" ? (
            <LedgerView />
          ) : (
            <div>
              <div className="flex gap-1 mb-6 border-b border-border">
                <button
                  onClick={() => setDealConfigTab("doc-requirements")}
                  className={`px-4 py-2 text-[13px] font-medium border-b-2 transition-colors -mb-px ${
                    dealConfigTab === "doc-requirements"
                      ? "border-foreground text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span className="flex items-center gap-2"><ClipboardList className="h-3.5 w-3.5" />Document Requirements</span>
                </button>
                <button
                  onClick={() => setDealConfigTab("broker-rate-slabs")}
                  className={`px-4 py-2 text-[13px] font-medium border-b-2 transition-colors -mb-px ${
                    dealConfigTab === "broker-rate-slabs"
                      ? "border-foreground text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span className="flex items-center gap-2"><BookOpen className="h-3.5 w-3.5" />Broker Rate Slabs</span>
                </button>
                <button
                  onClick={() => setDealConfigTab("mbu-direct-rates")}
                  className={`px-4 py-2 text-[13px] font-medium border-b-2 transition-colors -mb-px ${
                    dealConfigTab === "mbu-direct-rates"
                      ? "border-foreground text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span className="flex items-center gap-2"><BookOpen className="h-3.5 w-3.5" />MBU Direct Rates</span>
                </button>
              </div>
              {dealConfigTab === "doc-requirements" ? <DocRequirementsView /> : dealConfigTab === "broker-rate-slabs" ? <BrokerRateSlabsView /> : <MBUDirectRatesView />}
            </div>
          )}
      </div>

      {/* Dialogs */}
      <BulkUploadDialog
        open={bulkUploadOpen}
        onClose={() => setBulkUploadOpen(false)}
        onDealsCreated={(deals) => { setAllDeals(prev => [...deals, ...prev]); setBulkUploadOpen(false); }}
      />
      <AddDealDialog
        open={addDealOpen}
        onClose={() => setAddDealOpen(false)}
        onDealCreated={(deal) => { setAllDeals(prev => [deal, ...prev]); }}
      />
    </div>
  );
};

export default Deals;
