import { Deal, Tranche, DealStatus, BusinessUnit, Country } from "@/data/types";
import { DealStatusBadge } from "./DealBadges";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Filter, X } from "lucide-react";
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { computeTranchePnL } from "@/lib/dealCalculations";
import { thBase, SortDir, SortIcon, FilterDropdown, SearchDropdown, DateRangeDropdown } from "./TableFilters";

export interface TranchRow {
  deal: Deal;
  tranche: Tranche;
}

interface Props {
  rows: TranchRow[];
  currency?: string;
}

type SortKey = "reportDate" | "dealId" | "trancheId" | "status" | "businessUnit" | "country" | "market" | "channel" | "grossRevenue" | "netRevenue" | "huspyMargin";

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

export function DealListingTable({ rows, currency = "AED" }: Props) {
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
  const [dateRange, setDateRange] = useState<{ from: string; to: string }>({ from: "", to: "" });

  const pnlByTrancheId = useMemo(() => {
    const m = new Map<string, ReturnType<typeof computeTranchePnL>>();
    rows.forEach(({ deal, tranche }) => m.set(tranche.id, computeTranchePnL(tranche, deal)));
    return m;
  }, [rows]);

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

  const filtered = useMemo(() => rows.filter(({ deal, tranche }) => {
    if (statusFilter.size > 0 && !statusFilter.has(tranche.status)) return false;
    if (buFilter.size > 0 && !buFilter.has(deal.businessUnit)) return false;
    if (countryFilter.size > 0 && !countryFilter.has(deal.country)) return false;
    if (marketFilter.size > 0 && !marketFilter.has(deal.market ?? "")) return false;
    if (channelFilter.size > 0 && !(deal.channel && channelFilter.has(deal.channel))) return false;
    if (idSearch) {
      const q = idSearch.toLowerCase();
      if (!deal.id.toLowerCase().includes(q) && !tranche.id.toLowerCase().includes(q)) return false;
    }
    const date = tranche.reportDate ?? deal.createdAt ?? "";
    if (dateRange.from && date < dateRange.from) return false;
    if (dateRange.to && date > dateRange.to) return false;
    return true;
  }), [rows, statusFilter, buFilter, countryFilter, marketFilter, channelFilter, idSearch, dateRange]);

  const sorted = useMemo(() => {
    if (!sortKey || !sortDir) return filtered;
    const dir = sortDir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const pa = pnlByTrancheId.get(a.tranche.id);
      const pb = pnlByTrancheId.get(b.tranche.id);
      let va: string | number, vb: string | number;
      switch (sortKey) {
        case "reportDate":    va = a.tranche.reportDate ?? ""; vb = b.tranche.reportDate ?? ""; break;
        case "dealId":        va = a.deal.id; vb = b.deal.id; break;
        case "trancheId":     va = a.tranche.id; vb = b.tranche.id; break;
        case "status":        va = a.tranche.status; vb = b.tranche.status; break;
        case "businessUnit":  va = a.deal.businessUnit ?? ""; vb = b.deal.businessUnit ?? ""; break;
        case "country":       va = a.deal.country ?? ""; vb = b.deal.country ?? ""; break;
        case "market":        va = a.deal.market ?? ""; vb = b.deal.market ?? ""; break;
        case "channel":       va = a.deal.channel ?? ""; vb = b.deal.channel ?? ""; break;
        case "grossRevenue":  va = pa?.grossRevenue ?? 0; vb = pb?.grossRevenue ?? 0; break;
        case "netRevenue":    va = pa?.commissionBase ?? 0; vb = pb?.commissionBase ?? 0; break;
        case "huspyMargin":   va = pa?.huspyMargin ?? 0; vb = pb?.huspyMargin ?? 0; break;
        default: return 0;
      }
      if (typeof va === "number" && typeof vb === "number") return (va - vb) * dir;
      return String(va).localeCompare(String(vb)) * dir;
    });
  }, [filtered, sortKey, sortDir, pnlByTrancheId]);

  const perPage = 15;
  const totalPages = Math.max(1, Math.ceil(sorted.length / perPage));
  const paginated = sorted.slice((page - 1) * perPage, page * perPage);

  const dash = <span className="text-muted-foreground">—</span>;
  const getSortDir = (key: SortKey): SortDir => sortKey === key ? sortDir : null;

  const activeFilterCount =
    [statusFilter, buFilter, countryFilter, marketFilter, channelFilter].filter(f => f.size > 0).length +
    [idSearch].filter(Boolean).length +
    [dateRange.from || dateRange.to].filter(Boolean).length;

  function clearAll() {
    setStatusFilter(new Set()); setBuFilter(new Set()); setCountryFilter(new Set());
    setMarketFilter(new Set()); setChannelFilter(new Set());
    setIdSearch(""); setDateRange({ from: "", to: "" });
    setPage(1);
  }

  return (
    <div>
      {activeFilterCount > 0 && (
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[12px] text-muted-foreground">{activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""} active · {sorted.length} tranche{sorted.length !== 1 ? "s" : ""}</span>
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
                    <button onClick={() => handleSort("dealId")} className="flex items-center gap-1 hover:text-primary transition-colors">
                      Deal ID · {sorted.length} <SortIcon dir={getSortDir("dealId")} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setOpenFilter(openFilter === "id" ? null : "id"); }}
                      className={`p-0.5 rounded transition-colors ${idSearch ? "text-primary" : "text-muted-foreground/40 hover:text-muted-foreground"}`}>
                      {idSearch ? <X className="h-3 w-3" onClick={(e) => { e.stopPropagation(); setIdSearch(""); }} /> : <Filter className="h-3 w-3" />}
                    </button>
                  </div>
                  {openFilter === "id" && (
                    <SearchDropdown value={idSearch} onChange={setIdSearch} onClose={() => setOpenFilter(null)} placeholder="Search deal or tranche ID..." />
                  )}
                </th>

                {/* Tranche index */}
                <th className={`${thBase} text-left`}>
                  <button onClick={() => handleSort("trancheId")} className="flex items-center gap-1 hover:text-primary transition-colors">
                    Tranche # <SortIcon dir={getSortDir("trancheId")} />
                  </button>
                </th>

                {/* Status */}
                <th className={`${thBase} text-left relative`}>
                  <div className="flex items-center gap-1">
                    <span>Status</span>
                    <button onClick={(e) => { e.stopPropagation(); setOpenFilter(openFilter === "status" ? null : "status"); }}
                      className={`p-0.5 rounded transition-colors ${statusFilter.size > 0 ? "text-primary" : "text-muted-foreground/40 hover:text-muted-foreground"}`}>
                      {statusFilter.size > 0 ? <X className="h-3 w-3" /> : <Filter className="h-3 w-3" />}
                    </button>
                  </div>
                  {openFilter === "status" && <FilterDropdown options={[...ALL_STATUSES]} selected={statusFilter} onChange={(s) => { setStatusFilter(s); setPage(1); }} onClose={() => setOpenFilter(null)} />}
                </th>

                {/* BU */}
                <th className={`${thBase} text-left relative`}>
                  <div className="flex items-center gap-1">
                    <span>BU</span>
                    <button onClick={(e) => { e.stopPropagation(); setOpenFilter(openFilter === "bu" ? null : "bu"); }}
                      className={`p-0.5 rounded transition-colors ${buFilter.size > 0 ? "text-primary" : "text-muted-foreground/40 hover:text-muted-foreground"}`}>
                      {buFilter.size > 0 ? <X className="h-3 w-3" /> : <Filter className="h-3 w-3" />}
                    </button>
                  </div>
                  {openFilter === "bu" && <FilterDropdown options={[...ALL_BUS]} selected={buFilter} onChange={(s) => { setBuFilter(s); setPage(1); }} onClose={() => setOpenFilter(null)} />}
                </th>

                {/* Country */}
                <th className={`${thBase} text-left relative`}>
                  <div className="flex items-center gap-1">
                    <span>Country</span>
                    <button onClick={(e) => { e.stopPropagation(); setOpenFilter(openFilter === "country" ? null : "country"); }}
                      className={`p-0.5 rounded transition-colors ${countryFilter.size > 0 ? "text-primary" : "text-muted-foreground/40 hover:text-muted-foreground"}`}>
                      {countryFilter.size > 0 ? <X className="h-3 w-3" /> : <Filter className="h-3 w-3" />}
                    </button>
                  </div>
                  {openFilter === "country" && <FilterDropdown options={[...ALL_COUNTRIES]} selected={countryFilter} onChange={(s) => { setCountryFilter(s); setPage(1); }} onClose={() => setOpenFilter(null)} />}
                </th>

                {/* Market */}
                <th className={`${thBase} text-left relative`}>
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleSort("market")} className="flex items-center gap-1 hover:text-primary transition-colors">Market <SortIcon dir={getSortDir("market")} /></button>
                    <button onClick={(e) => { e.stopPropagation(); setOpenFilter(openFilter === "market" ? null : "market"); }}
                      className={`p-0.5 rounded transition-colors ${marketFilter.size > 0 ? "text-primary" : "text-muted-foreground/40 hover:text-muted-foreground"}`}>
                      {marketFilter.size > 0 ? <X className="h-3 w-3" /> : <Filter className="h-3 w-3" />}
                    </button>
                  </div>
                  {openFilter === "market" && <FilterDropdown options={ALL_MARKETS} selected={marketFilter} onChange={(s) => { setMarketFilter(s); setPage(1); }} onClose={() => setOpenFilter(null)} />}
                </th>

                {/* Channel */}
                <th className={`${thBase} text-left relative`}>
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleSort("channel")} className="flex items-center gap-1 hover:text-primary transition-colors">Channel <SortIcon dir={getSortDir("channel")} /></button>
                    <button onClick={(e) => { e.stopPropagation(); setOpenFilter(openFilter === "channel" ? null : "channel"); }}
                      className={`p-0.5 rounded transition-colors ${channelFilter.size > 0 ? "text-primary" : "text-muted-foreground/40 hover:text-muted-foreground"}`}>
                      {channelFilter.size > 0 ? <X className="h-3 w-3" /> : <Filter className="h-3 w-3" />}
                    </button>
                  </div>
                  {openFilter === "channel" && <FilterDropdown options={ALL_CHANNELS} selected={channelFilter} onChange={(s) => { setChannelFilter(s); setPage(1); }} onClose={() => setOpenFilter(null)} className="min-w-[200px]" />}
                </th>

                <th className={`${thBase} text-right`}>
                  <button onClick={() => handleSort("grossRevenue")} className="flex items-center gap-1 ml-auto hover:text-primary transition-colors">Gross Rev <SortIcon dir={getSortDir("grossRevenue")} /></button>
                </th>
                <th className={`${thBase} text-right`}>
                  <button onClick={() => handleSort("netRevenue")} className="flex items-center gap-1 ml-auto hover:text-primary transition-colors">Net Rev <SortIcon dir={getSortDir("netRevenue")} /></button>
                </th>
                <th className={`${thBase} text-right`}>
                  <button onClick={() => handleSort("huspyMargin")} className="flex items-center gap-1 ml-auto hover:text-primary transition-colors">Margin <SortIcon dir={getSortDir("huspyMargin")} /></button>
                </th>

                {/* Report Date */}
                <th className={`${thBase} text-left relative`}>
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleSort("reportDate")} className="flex items-center gap-1 hover:text-primary transition-colors">Report Date <SortIcon dir={getSortDir("reportDate")} /></button>
                    <button onClick={(e) => { e.stopPropagation(); setOpenFilter(openFilter === "date" ? null : "date"); }}
                      className={`p-0.5 rounded transition-colors ${dateRange.from || dateRange.to ? "text-primary" : "text-muted-foreground/40 hover:text-muted-foreground"}`}>
                      {dateRange.from || dateRange.to
                        ? <X className="h-3 w-3" onClick={(e) => { e.stopPropagation(); setDateRange({ from: "", to: "" }); }} />
                        : <Filter className="h-3 w-3" />}
                    </button>
                  </div>
                  {openFilter === "date" && <DateRangeDropdown value={dateRange} onChange={setDateRange} onClose={() => setOpenFilter(null)} />}
                </th>
              </tr>
            </thead>
            <tbody>
              {paginated.map(({ deal, tranche }) => {
                const pnl = pnlByTrancheId.get(tranche.id);
                const trancheLabel = tranche.label ? `${tranche.label}` : null;
                return (
                  <tr key={tranche.id}
                    onClick={() => navigate(`/deals/${deal.id}?tranche=${tranche.id}`)}
                    className="border-b border-border hover:bg-muted/30 transition-colors cursor-pointer">
                    <td className={`${tdClass} font-mono text-[11px] text-muted-foreground`}>{deal.id}</td>
                    <td className={`${tdClass}`}>
                      <span className="text-[13px] font-semibold text-foreground">{tranche.index + 1}</span>
                      {trancheLabel && (
                        <span className="ml-1.5 text-[11px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium">{trancheLabel}</span>
                      )}
                    </td>
                    <td className="px-4 py-3"><DealStatusBadge status={tranche.status} /></td>
                    <td className={tdClass}><BUBadge bu={deal.businessUnit} /></td>
                    <td className={`${tdClass} uppercase text-[12px]`}>{deal.country ?? dash}</td>
                    <td className={tdClass}>{deal.market ?? dash}</td>
                    <td className={`${tdClass} text-[12px] text-muted-foreground`}>{deal.channel ?? dash}</td>
                    <td className={`${tdClass} text-right tabular-nums`}>
                      {pnl?.grossRevenue != null ? formatAmount(pnl.grossRevenue, deal.currency ?? currency) : dash}
                    </td>
                    <td className={`${tdClass} text-right tabular-nums`}>
                      {pnl ? formatAmount(pnl.commissionBase, deal.currency ?? currency) : dash}
                    </td>
                    <td className={`${tdClass} text-right tabular-nums font-bold ${pnl && pnl.huspyMargin >= 0 ? "text-emerald-700 dark:text-emerald-400" : "text-destructive"}`}>
                      {pnl ? formatAmount(pnl.huspyMargin, deal.currency ?? currency) : dash}
                    </td>
                    <td className={`${tdClass} text-[12px] text-muted-foreground`}>
                      {tranche.reportDate ? formatDate(tranche.reportDate) : dash}
                    </td>
                  </tr>
                );
              })}
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={11} className="px-4 py-8 text-center text-muted-foreground text-[13px]">No tranches match the selected filters</td>
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
          <input type="number" value={page} onChange={(e) => { const v = parseInt(e.target.value); if (v >= 1 && v <= totalPages) setPage(v); }}
            className="w-12 h-8 text-center border border-border rounded px-1 text-[14px] bg-card focus:outline-none focus:ring-1 focus:ring-ring" />
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
