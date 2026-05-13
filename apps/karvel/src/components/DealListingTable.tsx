import { Deal, DealStatus, BusinessUnit, Country } from "@/data/types";
import { DealStatusBadge } from "./DealBadges";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUp, ArrowDown, ArrowUpDown, Filter, X } from "lucide-react";
import { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { computeDealPnL } from "@/lib/dealCalculations";

interface Props {
  deals: Deal[];
  currency: string;
}

type SortDir = "asc" | "desc" | null;
type SortKey = "reportDate" | "id" | "businessUnit" | "status" | "country" | "market" | "grossRevenue" | "netRevenue" | "huspyMargin";

const ALL_STATUSES: DealStatus[] = ["pending-details", "under-review", "pending-agent-approval", "pending-receivables", "finalized", "canceled"];
const ALL_BUS: BusinessUnit[] = ["rebu", "mortgage"];
const ALL_COUNTRIES: Country[] = ["ae", "es", "sa"];

const thBase = "px-4 py-3 font-semibold text-foreground text-[13px] whitespace-nowrap border-b border-border bg-muted/20";
const tdClass = "px-4 py-3 text-[13px] text-foreground font-medium whitespace-nowrap";

function BUBadge({ bu }: { bu: string }) {
  const cls = bu === "rebu"
    ? "bg-blue-500/15 text-blue-700 dark:text-blue-400"
    : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400";
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${cls}`}>{bu}</span>;
}

function FilterDropdown({ options, selected, onChange, onClose }: {
  options: string[];
  selected: Set<string>;
  onChange: (s: Set<string>) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const allSelected = selected.size === 0;

  return (
    <div ref={ref} className="absolute top-full left-0 mt-1 z-50 bg-popover border border-border rounded-lg shadow-lg p-2 min-w-[160px] max-h-[240px] overflow-auto">
      <label className="flex items-center gap-2 px-2 py-1.5 text-[12px] font-medium text-foreground hover:bg-muted rounded cursor-pointer">
        <input type="checkbox" checked={allSelected} onChange={() => { if (allSelected) onChange(new Set(options)); else onChange(new Set()); }} className="rounded border-border" />
        All
      </label>
      <div className="border-t border-border my-1" />
      {options.map((opt) => (
        <label key={opt} className="flex items-center gap-2 px-2 py-1.5 text-[12px] text-foreground hover:bg-muted rounded cursor-pointer">
          <input
            type="checkbox"
            checked={allSelected || selected.has(opt)}
            onChange={() => {
              if (allSelected) { onChange(new Set(options.filter(o => o !== opt))); return; }
              const next = new Set(selected);
              if (next.has(opt)) next.delete(opt); else next.add(opt);
              onChange(next.size === options.length ? new Set() : next);
            }}
            className="rounded border-border"
          />
          {opt}
        </label>
      ))}
    </div>
  );
}

function SortIcon({ dir }: { dir: SortDir }) {
  if (!dir) return <ArrowUpDown className="h-3 w-3 text-muted-foreground/50" />;
  return dir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />;
}

export function DealListingTable({ deals, currency }: Props) {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);
  const [openFilter, setOpenFilter] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<Set<string>>(new Set());
  const [buFilter, setBuFilter] = useState<Set<string>>(new Set());
  const [countryFilter, setCountryFilter] = useState<Set<string>>(new Set());

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
    return true;
  }), [deals, statusFilter, buFilter, countryFilter]);

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
        case "grossRevenue": va = pnlByDealId.get(a.id)?.grossRevenue ?? a.grossRevenue ?? 0; vb = pnlByDealId.get(b.id)?.grossRevenue ?? b.grossRevenue ?? 0; break;
        case "netRevenue": va = pnlByDealId.get(a.id)?.netRevenue ?? 0; vb = pnlByDealId.get(b.id)?.netRevenue ?? 0; break;
        case "huspyMargin": va = pnlByDealId.get(a.id)?.huspyMargin ?? 0; vb = pnlByDealId.get(b.id)?.huspyMargin ?? 0; break;
        default: return 0;
      }
      if (typeof va === "number" && typeof vb === "number") return (va - vb) * dir;
      return String(va).localeCompare(String(vb)) * dir;
    });
  }, [filtered, sortKey, sortDir, pnlByDealId]);

  const perPage = 10;
  const totalPages = Math.max(1, Math.ceil(sorted.length / perPage));
  const paginated = sorted.slice((page - 1) * perPage, page * perPage);

  const dash = <span className="text-muted-foreground">—</span>;
  const getSortDir = (key: SortKey): SortDir => sortKey === key ? sortDir : null;
  const activeFilterCount = [statusFilter, buFilter, countryFilter].filter(f => f.size > 0).length;

  return (
    <div>
      {activeFilterCount > 0 && (
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[12px] text-muted-foreground">{activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""} active · {sorted.length} deal{sorted.length !== 1 ? "s" : ""}</span>
          <button onClick={() => { setStatusFilter(new Set()); setBuFilter(new Set()); setCountryFilter(new Set()); setPage(1); }} className="text-[12px] text-primary hover:underline">Clear all</button>
        </div>
      )}
      <div className="bg-card rounded-xl overflow-hidden border border-border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className={`${thBase} text-left`}>
                  <button onClick={() => handleSort("id")} className="flex items-center gap-1 hover:text-primary transition-colors">
                    Deal ID · {sorted.length} <SortIcon dir={getSortDir("id")} />
                  </button>
                </th>

                <th className={`${thBase} text-left relative`}>
                  <div className="flex items-center gap-1">
                    <span>Status</span>
                    <button onClick={(e) => { e.stopPropagation(); setOpenFilter(openFilter === "status" ? null : "status"); }} className={`p-0.5 rounded transition-colors ${statusFilter.size > 0 ? "text-primary" : "text-muted-foreground/40 hover:text-muted-foreground"}`}>
                      {statusFilter.size > 0 ? <X className="h-3 w-3" /> : <Filter className="h-3 w-3" />}
                    </button>
                  </div>
                  {openFilter === "status" && <FilterDropdown options={[...ALL_STATUSES]} selected={statusFilter} onChange={(s) => { setStatusFilter(s); setPage(1); }} onClose={() => setOpenFilter(null)} />}
                </th>

                <th className={`${thBase} text-left relative`}>
                  <div className="flex items-center gap-1">
                    <span>BU</span>
                    <button onClick={(e) => { e.stopPropagation(); setOpenFilter(openFilter === "bu" ? null : "bu"); }} className={`p-0.5 rounded transition-colors ${buFilter.size > 0 ? "text-primary" : "text-muted-foreground/40 hover:text-muted-foreground"}`}>
                      {buFilter.size > 0 ? <X className="h-3 w-3" /> : <Filter className="h-3 w-3" />}
                    </button>
                  </div>
                  {openFilter === "bu" && <FilterDropdown options={[...ALL_BUS]} selected={buFilter} onChange={(s) => { setBuFilter(s); setPage(1); }} onClose={() => setOpenFilter(null)} />}
                </th>

                <th className={`${thBase} text-left relative`}>
                  <div className="flex items-center gap-1">
                    <span>Country</span>
                    <button onClick={(e) => { e.stopPropagation(); setOpenFilter(openFilter === "country" ? null : "country"); }} className={`p-0.5 rounded transition-colors ${countryFilter.size > 0 ? "text-primary" : "text-muted-foreground/40 hover:text-muted-foreground"}`}>
                      {countryFilter.size > 0 ? <X className="h-3 w-3" /> : <Filter className="h-3 w-3" />}
                    </button>
                  </div>
                  {openFilter === "country" && <FilterDropdown options={[...ALL_COUNTRIES]} selected={countryFilter} onChange={(s) => { setCountryFilter(s); setPage(1); }} onClose={() => setOpenFilter(null)} />}
                </th>


                <th className={`${thBase} text-left`}>
                  <button onClick={() => handleSort("market")} className="flex items-center gap-1 hover:text-primary transition-colors">Market <SortIcon dir={getSortDir("market")} /></button>
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
                <th className={`${thBase} text-left`}>
                  <button onClick={() => handleSort("reportDate")} className="flex items-center gap-1 hover:text-primary transition-colors">Created <SortIcon dir={getSortDir("reportDate")} /></button>
                </th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((deal) => {
                const pnl = pnlByDealId.get(deal.id);
                return (
                  <tr key={deal.id} onClick={() => navigate(`/deals/${deal.id}`)} className="border-b border-border hover:bg-muted/30 transition-colors cursor-pointer">
                    <td className={`${tdClass} font-mono text-[11px] text-muted-foreground`}>
                      {deal.id}
                    </td>
                    <td className="px-4 py-3"><DealStatusBadge status={deal.status} isDisputed={deal.isDisputed} /></td>
                    <td className={tdClass}><BUBadge bu={deal.businessUnit} /></td>
                    <td className={`${tdClass} uppercase text-[12px]`}>{deal.country ?? dash}</td>

                    <td className={tdClass}>{deal.market ?? dash}</td>
                    <td className={`${tdClass} text-right tabular-nums`}>
                      {pnl ? formatAmount(pnl.grossRevenue, deal.currency ?? currency) : deal.grossRevenue != null ? formatAmount(deal.grossRevenue, deal.currency ?? currency) : dash}
                    </td>
                    <td className={`${tdClass} text-right tabular-nums`}>
                      {pnl ? formatAmount(pnl.netRevenue, deal.currency ?? currency) : dash}
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
