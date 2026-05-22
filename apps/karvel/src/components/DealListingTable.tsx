import { Deal, DealStatus, BusinessUnit, Country } from "@/data/types";
import { DealStatusBadge } from "./DealBadges";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Filter, X } from "lucide-react";
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { computeDealPnL } from "@/lib/dealCalculations";
import { thBase, SortDir, SortIcon, FilterDropdown, SearchDropdown, DateRangeDropdown } from "./TableFilters";

interface Props {
  deals: Deal[];
  currency?: string;
}

type SortKey = "reportDate" | "id" | "businessUnit" | "status" | "country" | "market" | "channel" | "grossRevenue" | "netRevenue" | "huspyMargin";

const ALL_STATUSES: DealStatus[] = ["pending-details", "under-review", "pending-agent-approval", "invoicing", "finalized", "canceled"];
const ALL_BUS: BusinessUnit[] = ["rebu", "mortgage"];
const ALL_COUNTRIES: Country[] = ["ae", "es", "sa"];
const ALL_MARKETS = ["primary", "secondary", "leasing"];
const ALL_CHANNELS = ["MA/Broker", "BBG/Commercial", "B2C/Digital", "REA", "REA Purchase", "BYOB", "Direct Sales"];

const tdClass = "px-4 py-3 text-[13px] text-foreground font-medium whitespace-nowrap";

function BUBadge({ bu }: { bu: string }) {
  const cls = bu === "rebu"
    ? "bg-blue-500/15 text-blue-700 dark:text-blue-400"
    : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400";
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${cls}`}>{bu}</span>;
}

export function DealListingTable({ deals, currency = "AED" }: Props) {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);
  const [openFilter, setOpenFilter] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<Set<string>>(new Set());
  const [buFilter, setBuFilter] = useState<Set<string>>(new Set());
  const [countryFilter, setCountryFilter] = useState<Set<string>>(new Set());
  const [marketFilter, setMarketFilter] = useState<Set<string>>(new Set());
  const [channelFilter, setChannelFilter] = useState<Set<string>>(new Set());
  const [idSearch, setIdSearch] = useState("");
  const [createdDateRange, setCreatedDateRange] = useState<{ from: string; to: string }>({ from: "", to: "" });

  const pnlByDealId = useMemo(() => {
    const m = new Map<string, ReturnType<typeof computeDealPnL>>();
    deals.forEach((d) => m.set(d.id, computeDealPnL(d)));
    return m;
  }, [deals]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      const next = sortDir === "asc" ? "desc" : sortDir === "desc" ? null : "asc";
      setSortDir(next as SortDir);
      if (!next) setSortKey(null);
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(1);
  };

  const filtered = useMemo(() => deals.filter(d => {
    if (statusFilter.size > 0 && !statusFilter.has(d.status)) return false;
    if (buFilter.size > 0 && !buFilter.has(d.businessUnit)) return false;
    if (countryFilter.size > 0 && !countryFilter.has(d.country)) return false;
    if (marketFilter.size > 0 && !marketFilter.has(d.market ?? "")) return false;
    if (channelFilter.size > 0 && !(d.channel && channelFilter.has(d.channel))) return false;
    if (idSearch && !d.id.toLowerCase().includes(idSearch.toLowerCase())) return false;
    const dealDate = d.createdAt ?? d.reportDate ?? "";
    if (createdDateRange.from && dealDate < createdDateRange.from) return false;
    if (createdDateRange.to && dealDate > createdDateRange.to) return false;
    return true;
  }), [deals, statusFilter, buFilter, countryFilter, marketFilter, channelFilter, idSearch, createdDateRange]);

  const sorted = useMemo(() => {
    if (!sortKey || !sortDir) return filtered;
    const dir = sortDir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      let va: string | number, vb: string | number;
      switch (sortKey) {
        case "reportDate": va = a.reportDate; vb = b.reportDate; break;
        case "id": va = a.id; vb = b.id; break;
        case "businessUnit": va = a.businessUnit; vb = b.businessUnit; break;
        case "status": va = a.status; vb = b.status; break;
        case "country": va = a.country ?? ""; vb = b.country ?? ""; break;
        case "market": va = a.market ?? ""; vb = b.market ?? ""; break;
        case "channel": va = a.channel ?? ""; vb = b.channel ?? ""; break;
        case "grossRevenue": va = pnlByDealId.get(a.id)?.grossRevenue ?? a.grossRevenue ?? 0; vb = pnlByDealId.get(b.id)?.grossRevenue ?? b.grossRevenue ?? 0; break;
        case "netRevenue": va = pnlByDealId.get(a.id)?.commissionBase ?? 0; vb = pnlByDealId.get(b.id)?.commissionBase ?? 0; break;
        case "huspyMargin": va = pnlByDealId.get(a.id)?.huspyMargin ?? 0; vb = pnlByDealId.get(b.id)?.huspyMargin ?? 0; break;
        default: return 0;
      }
      if (typeof va === "number" && typeof vb === "number") return (va - vb) * dir;
      return String(va).localeCompare(String(vb)) * dir;
    });
  }, [filtered, sortKey, sortDir, pnlByDealId]);

  const perPage = 15;
  const totalPages = Math.max(1, Math.ceil(sorted.length / perPage));
  const paginated = sorted.slice((page - 1) * perPage, page * perPage);

  const dash = <span className="text-muted-foreground">—</span>;
  const getSortDir = (key: SortKey): SortDir => sortKey === key ? sortDir : null;

  const activeFilterCount =
    [statusFilter, buFilter, countryFilter, marketFilter, channelFilter].filter(f => f.size > 0).length +
    [idSearch].filter(Boolean).length +
    [createdDateRange.from || createdDateRange.to].filter(Boolean).length;

  function clearAll() {
    setStatusFilter(new Set()); setBuFilter(new Set()); setCountryFilter(new Set());
    setMarketFilter(new Set()); setChannelFilter(new Set());
    setIdSearch(""); setCreatedDateRange({ from: "", to: "" });
    setPage(1);
  }

  return (
    <div>
      {activeFilterCount > 0 && (
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[12px] text-muted-foreground">{activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""} active · {sorted.length} deal{sorted.length !== 1 ? "s" : ""}</span>
          <button onClick={clearAll} className="text-[12px] text-primary hover:underline">Clear all</button>
        </div>
      )}
      <div className="bg-card rounded-xl overflow-hidden border border-border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/20">

                {/* Deal ID */}
                <th className={`${thBase} text-left relative`}>
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleSort("id")} className="flex items-center gap-1 hover:text-primary transition-colors">
                      Deal ID · {sorted.length} <SortIcon dir={getSortDir("id")} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setOpenFilter(openFilter === "id" ? null : "id"); }}
                      className={`p-0.5 rounded transition-colors ${idSearch ? "text-primary" : "text-muted-foreground/40 hover:text-muted-foreground"}`}
                    >
                      {idSearch ? <X className="h-3 w-3" onClick={(e) => { e.stopPropagation(); setIdSearch(""); }} /> : <Filter className="h-3 w-3" />}
                    </button>
                  </div>
                  {openFilter === "id" && (
                    <SearchDropdown value={idSearch} onChange={setIdSearch} onClose={() => setOpenFilter(null)} placeholder="Search deal ID..." />
                  )}
                </th>

                {/* Status */}
                <th className={`${thBase} text-left relative`}>
                  <div className="flex items-center gap-1">
                    <span>Status</span>
                    <button onClick={(e) => { e.stopPropagation(); setOpenFilter(openFilter === "status" ? null : "status"); }} className={`p-0.5 rounded transition-colors ${statusFilter.size > 0 ? "text-primary" : "text-muted-foreground/40 hover:text-muted-foreground"}`}>
                      {statusFilter.size > 0 ? <X className="h-3 w-3" /> : <Filter className="h-3 w-3" />}
                    </button>
                  </div>
                  {openFilter === "status" && <FilterDropdown options={[...ALL_STATUSES]} selected={statusFilter} onChange={(s) => { setStatusFilter(s); setPage(1); }} onClose={() => setOpenFilter(null)} />}
                </th>

                {/* BU */}
                <th className={`${thBase} text-left relative`}>
                  <div className="flex items-center gap-1">
                    <span>BU</span>
                    <button onClick={(e) => { e.stopPropagation(); setOpenFilter(openFilter === "bu" ? null : "bu"); }} className={`p-0.5 rounded transition-colors ${buFilter.size > 0 ? "text-primary" : "text-muted-foreground/40 hover:text-muted-foreground"}`}>
                      {buFilter.size > 0 ? <X className="h-3 w-3" /> : <Filter className="h-3 w-3" />}
                    </button>
                  </div>
                  {openFilter === "bu" && <FilterDropdown options={[...ALL_BUS]} selected={buFilter} onChange={(s) => { setBuFilter(s); setPage(1); }} onClose={() => setOpenFilter(null)} />}
                </th>

                {/* Country */}
                <th className={`${thBase} text-left relative`}>
                  <div className="flex items-center gap-1">
                    <span>Country</span>
                    <button onClick={(e) => { e.stopPropagation(); setOpenFilter(openFilter === "country" ? null : "country"); }} className={`p-0.5 rounded transition-colors ${countryFilter.size > 0 ? "text-primary" : "text-muted-foreground/40 hover:text-muted-foreground"}`}>
                      {countryFilter.size > 0 ? <X className="h-3 w-3" /> : <Filter className="h-3 w-3" />}
                    </button>
                  </div>
                  {openFilter === "country" && <FilterDropdown options={[...ALL_COUNTRIES]} selected={countryFilter} onChange={(s) => { setCountryFilter(s); setPage(1); }} onClose={() => setOpenFilter(null)} />}
                </th>

                {/* Market */}
                <th className={`${thBase} text-left relative`}>
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleSort("market")} className="flex items-center gap-1 hover:text-primary transition-colors">Market <SortIcon dir={getSortDir("market")} /></button>
                    <button onClick={(e) => { e.stopPropagation(); setOpenFilter(openFilter === "market" ? null : "market"); }} className={`p-0.5 rounded transition-colors ${marketFilter.size > 0 ? "text-primary" : "text-muted-foreground/40 hover:text-muted-foreground"}`}>
                      {marketFilter.size > 0 ? <X className="h-3 w-3" /> : <Filter className="h-3 w-3" />}
                    </button>
                  </div>
                  {openFilter === "market" && <FilterDropdown options={ALL_MARKETS} selected={marketFilter} onChange={(s) => { setMarketFilter(s); setPage(1); }} onClose={() => setOpenFilter(null)} />}
                </th>

                {/* Channel */}
                <th className={`${thBase} text-left relative`}>
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleSort("channel")} className="flex items-center gap-1 hover:text-primary transition-colors">Channel <SortIcon dir={getSortDir("channel")} /></button>
                    <button onClick={(e) => { e.stopPropagation(); setOpenFilter(openFilter === "channel" ? null : "channel"); }} className={`p-0.5 rounded transition-colors ${channelFilter.size > 0 ? "text-primary" : "text-muted-foreground/40 hover:text-muted-foreground"}`}>
                      {channelFilter.size > 0 ? <X className="h-3 w-3" /> : <Filter className="h-3 w-3" />}
                    </button>
                  </div>
                  {openFilter === "channel" && <FilterDropdown options={ALL_CHANNELS} selected={channelFilter} onChange={(s) => { setChannelFilter(s); setPage(1); }} onClose={() => setOpenFilter(null)} className="min-w-[200px]" />}
                </th>

                {/* Gross Rev */}
                <th className={`${thBase} text-right`}>
                  <button onClick={() => handleSort("grossRevenue")} className="flex items-center gap-1 ml-auto hover:text-primary transition-colors">Gross Rev <SortIcon dir={getSortDir("grossRevenue")} /></button>
                </th>

                {/* Net Rev */}
                <th className={`${thBase} text-right`}>
                  <button onClick={() => handleSort("netRevenue")} className="flex items-center gap-1 ml-auto hover:text-primary transition-colors">Net Rev <SortIcon dir={getSortDir("netRevenue")} /></button>
                </th>

                {/* Margin */}
                <th className={`${thBase} text-right`}>
                  <button onClick={() => handleSort("huspyMargin")} className="flex items-center gap-1 ml-auto hover:text-primary transition-colors">Margin <SortIcon dir={getSortDir("huspyMargin")} /></button>
                </th>

                {/* Created */}
                <th className={`${thBase} text-left relative`}>
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleSort("reportDate")} className="flex items-center gap-1 hover:text-primary transition-colors">Created <SortIcon dir={getSortDir("reportDate")} /></button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setOpenFilter(openFilter === "created" ? null : "created"); }}
                      className={`p-0.5 rounded transition-colors ${createdDateRange.from || createdDateRange.to ? "text-primary" : "text-muted-foreground/40 hover:text-muted-foreground"}`}
                    >
                      {createdDateRange.from || createdDateRange.to
                        ? <X className="h-3 w-3" onClick={(e) => { e.stopPropagation(); setCreatedDateRange({ from: "", to: "" }); }} />
                        : <Filter className="h-3 w-3" />}
                    </button>
                  </div>
                  {openFilter === "created" && (
                    <DateRangeDropdown value={createdDateRange} onChange={setCreatedDateRange} onClose={() => setOpenFilter(null)} />
                  )}
                </th>

              </tr>
            </thead>
            <tbody>
              {paginated.map((deal) => {
                const pnl = pnlByDealId.get(deal.id);
                return (
                  <tr key={deal.id} onClick={() => navigate(`/deals/${deal.id}`)} className="border-b border-border hover:bg-muted/30 transition-colors cursor-pointer">
                    <td className={`${tdClass} font-mono text-[11px] text-muted-foreground`}>{deal.id}</td>
                    <td className="px-4 py-3"><DealStatusBadge status={deal.status} /></td>
                    <td className={tdClass}><BUBadge bu={deal.businessUnit} /></td>
                    <td className={`${tdClass} uppercase text-[12px]`}>{deal.country ?? dash}</td>
                    <td className={tdClass}>{deal.market ?? dash}</td>
                    <td className={`${tdClass} text-[12px] text-muted-foreground`}>{deal.channel ?? dash}</td>
                    <td className={`${tdClass} text-right tabular-nums`}>
                      {pnl ? formatAmount(pnl.grossRevenue, deal.currency ?? currency) : deal.grossRevenue != null ? formatAmount(deal.grossRevenue, deal.currency ?? currency) : dash}
                    </td>
                    <td className={`${tdClass} text-right tabular-nums`}>
                      {pnl ? formatAmount(pnl.commissionBase, deal.currency ?? currency) : dash}
                    </td>
                    <td className={`${tdClass} text-right tabular-nums font-bold ${pnl && pnl.huspyMargin >= 0 ? "text-emerald-700 dark:text-emerald-400" : "text-destructive"}`}>
                      {pnl ? formatAmount(pnl.huspyMargin, deal.currency ?? currency) : dash}
                    </td>
                    <td className={`${tdClass} text-[12px] text-muted-foreground`}>{deal.createdAt ? formatDate(deal.createdAt) : deal.reportDate ? formatDate(deal.reportDate) : dash}</td>
                  </tr>
                );
              })}
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-muted-foreground text-[13px]">No deals match the selected filters</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 py-5">
        <button onClick={() => setPage(1)} disabled={page === 1} className="w-8 h-8 flex items-center justify-center rounded border border-border bg-card disabled:opacity-30 hover:bg-muted transition-colors">
          <ChevronsLeft className="h-4 w-4 text-foreground" />
        </button>
        <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="w-8 h-8 flex items-center justify-center rounded border border-border bg-card disabled:opacity-30 hover:bg-muted transition-colors">
          <ChevronLeft className="h-4 w-4 text-foreground" />
        </button>
        <div className="flex items-center gap-2 text-[14px] mx-1">
          <input type="number" value={page} onChange={(e) => { const v = parseInt(e.target.value); if (v >= 1 && v <= totalPages) setPage(v); }} className="w-12 h-8 text-center border border-border rounded px-1 text-[14px] bg-card focus:outline-none focus:ring-1 focus:ring-ring" />
          <span className="text-muted-foreground">of {sorted.length}</span>
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
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
}
