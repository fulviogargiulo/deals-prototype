import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Settings, Upload, Plus, UserRound, DollarSign, List, Receipt, ClipboardList, BookOpen } from "lucide-react";
import { getDeals, setDeals as setStoreDeals, addDeals as addStoreDeals } from "@/data/dealStore";
import { DealListingView } from "@/components/DealListingView";
import { InvoicesView } from "@/components/InvoicesView";
import { Deal, DealMarket, DealStatus, BusinessUnit, Country } from "@/data/types";
import { MultiSelectFilter } from "@/components/MultiSelectFilter";
import { DateRangePicker, DateRange, TimePeriod, getPresetRange } from "@/components/DateRangePicker";
import { BulkUploadDialog } from "@/components/BulkUploadDialog";
import { AddDealDialog } from "@/components/AddDealDialog";
import { DocRequirementsView } from "@/components/DocRequirementsView";
import { LedgerView } from "@/components/LedgerView";

const COUNTRIES: Country[] = ["ae", "es", "sa"];
const BUSINESS_UNITS: BusinessUnit[] = ["rebu", "mortgage"];
const MARKET_TYPES: DealMarket[] = ["primary", "secondary", "leasing"];
const CHANNELS = ["MA/Broker", "BBG/Commercial", "B2C/Digital", "REA", "REA Purchase", "BYOB", "Direct Sales"];
const DEAL_STATUSES: DealStatus[] = ["pending-details", "under-review", "pending-agent-approval", "pending-receivables", "finalized", "canceled"];

export const countryCurrencyMap: Record<Country, string> = {
  ae: "AED",
  es: "EUR",
  sa: "SAR",
};

type ViewMode = "listing" | "invoices" | "doc-requirements" | "ledger";

const VIEW_TITLES: Record<ViewMode, string> = {
  listing: "Deal Management",
  invoices: "Invoices",
  "doc-requirements": "Document Requirements",
  ledger: "Ledger",
};

const Deals = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const viewMode = (searchParams.get("tab") as ViewMode) ?? "listing";
  const setViewMode = (mode: ViewMode) => setSearchParams({ tab: mode });
  const [selectedCountries, setSelectedCountries] = useState<string[]>([...COUNTRIES]);
  const [selectedBUs, setSelectedBUs] = useState<string[]>([...BUSINESS_UNITS]);
  const [selectedMarkets, setSelectedMarkets] = useState<string[]>([...MARKET_TYPES]);
  const [selectedChannels, setSelectedChannels] = useState<string[]>([...CHANNELS]);
  
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

  // Shared date range state
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("YTD");
  const [dateRange, setDateRange] = useState<DateRange>(getPresetRange("YTD"));

  const handleDealUpdate = (updated: Deal) => {
    setAllDeals((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
  };

  const handleBulkDealsUpdate = (updatedDeals: Deal[]) => {
    setAllDeals(updatedDeals);
  };

  const currency = selectedCountries.length > 0
    ? countryCurrencyMap[selectedCountries[0] as Country]
    : "EUR";

  const showChannel = selectedBUs.includes("mortgage") && selectedCountries.includes("ae");

  const filtered = allDeals.filter((deal) => {
    if (selectedCountries.length > 0 && selectedCountries.length < COUNTRIES.length) {
      if (!selectedCountries.includes(deal.country)) return false;
    }
    if (selectedBUs.length > 0 && selectedBUs.length < BUSINESS_UNITS.length) {
      if (!selectedBUs.includes(deal.businessUnit)) return false;
    }
    if (selectedMarkets.length > 0 && selectedMarkets.length < MARKET_TYPES.length) {
      if (!selectedMarkets.includes(deal.market)) return false;
    }
    if (showChannel && selectedChannels.length > 0 && selectedChannels.length < CHANNELS.length) {
      if (deal.channel && !selectedChannels.includes(deal.channel)) return false;
    }
    return true;
  });

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
                  onClick={() => setViewMode("doc-requirements")}
                  className={`p-2 rounded-md transition-colors ${viewMode === "doc-requirements" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                  title="Document Requirements"
                >
                  <ClipboardList className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode("ledger")}
                  className={`p-2 rounded-md transition-colors ${viewMode === "ledger" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                  title="Ledger"
                >
                  <BookOpen className="h-4 w-4" />
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

          {/* Filter selectors + Date picker */}
          {viewMode === "listing" && (
            <div className="flex items-center gap-3 mb-6 flex-wrap">
              <MultiSelectFilter
                label="Country"
                options={COUNTRIES}
                selected={selectedCountries}
                onChange={setSelectedCountries}
              />
              <MultiSelectFilter
                label="Business Unit"
                options={BUSINESS_UNITS}
                selected={selectedBUs}
                onChange={setSelectedBUs}
              />
              <MultiSelectFilter
                label="Market Type"
                options={MARKET_TYPES}
                selected={selectedMarkets}
                onChange={setSelectedMarkets}
              />
              {showChannel && (
                <MultiSelectFilter
                  label="Channel"
                  options={CHANNELS}
                  selected={selectedChannels}
                  onChange={setSelectedChannels}
                />
              )}
              <DateRangePicker
                dateRange={dateRange}
                timePeriod={timePeriod}
                onDateRangeChange={setDateRange}
                onTimePeriodChange={setTimePeriod}
              />
            </div>
          )}

          {/* View */}
          {viewMode === "listing" ? (
            <DealListingView deals={filtered} currency={currency} dateRange={dateRange} />
          ) : viewMode === "invoices" ? (
            <InvoicesView />
          ) : viewMode === "doc-requirements" ? (
            <DocRequirementsView />
          ) : (
            <LedgerView />
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
