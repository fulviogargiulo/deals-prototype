import { Deal, DealStatus, DealMarket, BusinessUnit, Country } from "@/data/types";
import { DealStatusBadge } from "./DealBadges";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUp, ArrowDown, ArrowUpDown, Filter, X, MessageSquare } from "lucide-react";
import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { computeDealPnL } from "@/lib/dealCalculations";
import { sharedDealComments } from "@huspy/shared-domain";

const ALL_STATUSES: DealStatus[] = ["pending-details", "under-review", "pending-agent-approval", "pending-receivables", "finalized", "canceled"];
const ALL_BUS: BusinessUnit[] = ["rebu", "mortgage"];
const ALL_MARKETS: DealMarket[] = ["primary", "secondary", "leasing"];
const ALL_COUNTRIES: Country[] = ["ae", "es", "sa"];

interface Props {
  deals: Deal[];
  currency: string;
  onDealsUpdate?: (deals: Deal[]) => void;
}

type SortDir = "asc" | "desc" | null;
type SortKey = "reportDate" | "status" | "businessUnit" | "country" | "market" | "grossRevenue" | "reductions" | "extSplits" | "svcFees" | "netRevenue" | "agentCost" | "margin";

const thBase = "px-3 py-2.5 font-semibold text-[11px] whitespace-nowrap border-b border-border text-center";
const tdClass = "px-3 py-2 text-[12px] text-foreground font-medium whitespace-nowrap";
const groupHeaderClass = "px-3 py-2 text-[11px] font-bold uppercase tracking-widest border-b-2 text-center";

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
      <label className="flex items-center gap-2 px-2 py-1.5 text-[11px] font-medium text-foreground hover:bg-muted rounded cursor-pointer">
        <input type="checkbox" checked={allSelected} onChange={() => onChange(new Set())} className="rounded border-border" />
        All
      </label>
      <div className="border-t border-border my-1" />
      {options.map((opt) => (
        <label key={opt} className="flex items-center gap-2 px-2 py-1.5 text-[11px] text-foreground hover:bg-muted rounded cursor-pointer">
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
  if (!dir) return <ArrowUpDown className="h-2.5 w-2.5 text-muted-foreground/40" />;
  return dir === "asc" ? <ArrowUp className="h-2.5 w-2.5" /> : <ArrowDown className="h-2.5 w-2.5" />;
}

function BUBadge({ bu }: { bu: string }) {
  const cls = bu === "rebu" ? "bg-blue-500/15 text-blue-700 dark:text-blue-400" : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400";
  return <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${cls}`}>{bu}</span>;
}


function FilterableHeader({ label, options, filter, onFilter, onSort, sortDir, filterKey, open, onOpen }: {
  label: string;
  options: string[];
  filter: Set<string>;
  onFilter: (s: Set<string>) => void;
  onSort?: () => void;
  sortDir?: SortDir;
  filterKey: string;
  open: string | null;
  onOpen: (k: string | null) => void;
}) {
  const isActive = filter.size > 0;
  return (
    <th className={`${thBase} text-left relative`}>
      <div className="flex items-center gap-1">
        {onSort ? (
          <button onClick={onSort} className="flex items-center gap-0.5 hover:text-primary transition-colors">
            <span>{label}</span>
            <SortIcon dir={sortDir ?? null} />
          </button>
        ) : <span>{label}</span>}
        <button onClick={(e) => { e.stopPropagation(); onOpen(open === filterKey ? null : filterKey); }} className={`p-0.5 rounded transition-colors ${isActive ? "text-primary" : "text-muted-foreground/40 hover:text-muted-foreground"}`}>
          {isActive ? <X className="h-3 w-3" /> : <Filter className="h-3 w-3" />}
        </button>
      </div>
      {open === filterKey && <FilterDropdown options={options} selected={filter} onChange={onFilter} onClose={() => onOpen(null)} />}
    </th>
  );
}

export function PnLDealTable({ deals, currency, onDealsUpdate: _onDealsUpdate }: Props) {
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);
  const [openFilter, setOpenFilter] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<Set<string>>(new Set());
  const [buFilter, setBuFilter] = useState<Set<string>>(new Set());
  const [countryFilter, setCountryFilter] = useState<Set<string>>(new Set());

  const [marketFilter, setMarketFilter] = useState<Set<string>>(new Set());

  const pnlByDealId = useMemo(() => {
    const m = new Map<string, ReturnType<typeof computeDealPnL>>();
    deals.forEach((d) => m.set(d.id, computeDealPnL(d)));
    return m;
  }, [deals]);

  const latestCommentByDealId = useMemo(() => {
    const m = new Map<string, string>();
    const sorted = [...sharedDealComments].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    sorted.forEach((c) => m.set(c.dealId, c.text));
    return m;
  }, []);

  const fmt = useCallback((n: number, dealCurrency?: string) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: dealCurrency ?? currency, maximumFractionDigits: 0 }).format(n),
  [currency]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      const next: SortDir = sortDir === "asc" ? "desc" : sortDir === "desc" ? null : "asc";
      setSortDir(next);
      if (!next) setSortKey(null);
    } else { setSortKey(key); setSortDir("asc"); }
    setPage(1);
  };

  const filtered = useMemo(() => deals.filter(d => {
    if (statusFilter.size > 0 && !statusFilter.has(d.status)) return false;
    if (buFilter.size > 0 && !buFilter.has(d.businessUnit)) return false;
    if (countryFilter.size > 0 && !countryFilter.has(d.country)) return false;

    if (marketFilter.size > 0 && !marketFilter.has(d.market)) return false;
    return true;
  }), [deals, statusFilter, buFilter, countryFilter, marketFilter]);

  const sorted = useMemo(() => {
    if (!sortKey || !sortDir) return filtered;
    const dir = sortDir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const pnlA = pnlByDealId.get(a.id);
      const pnlB = pnlByDealId.get(b.id);
      const num = (fn: (p: ReturnType<typeof computeDealPnL>) => number) => {
        const va = pnlA ? fn(pnlA) : 0;
        const vb = pnlB ? fn(pnlB) : 0;
        return (va - vb) * dir;
      };
      switch (sortKey) {
        case "reportDate": return a.reportDate.localeCompare(b.reportDate) * dir;
        case "status": return a.status.localeCompare(b.status) * dir;
        case "businessUnit": return a.businessUnit.localeCompare(b.businessUnit) * dir;
        case "country": return (a.country ?? "").localeCompare(b.country ?? "") * dir;

        case "market": return (a.market ?? "").localeCompare(b.market ?? "") * dir;
        case "grossRevenue": return num(p => p.grossRevenue);
        case "reductions": return num(p => p.totalBucketA);
        case "extSplits": return num(p => p.totalBucketC);
        case "svcFees": return num(p => p.totalBucketD);
        case "netRevenue": return num(p => p.netRevenue);
        case "agentCost": return num(p => p.totalBucketB);
        case "margin": return num(p => p.huspyMargin);
        default: return 0;
      }
    });
  }, [filtered, sortKey, sortDir, pnlByDealId]);

  const perPage = 15;
  const totalPages = Math.max(1, Math.ceil(sorted.length / perPage));
  const paginated = sorted.slice((page - 1) * perPage, page * perPage);

  const dash = "—";
  const sd = (key: SortKey): SortDir => sortKey === key ? sortDir : null;
  const activeFilterCount = [statusFilter, buFilter, countryFilter, marketFilter].filter(f => f.size > 0).length;

  return (
    <div>
      {activeFilterCount > 0 && (
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[12px] text-muted-foreground">{activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""} active · {sorted.length} deal{sorted.length !== 1 ? "s" : ""}</span>
          <button onClick={() => { setStatusFilter(new Set()); setBuFilter(new Set()); setCountryFilter(new Set()); setMarketFilter(new Set()); setPage(1); }} className="text-[12px] text-primary hover:underline">Clear all</button>
        </div>
      )}

      <div className="border border-border rounded-lg bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[12px]">
            <thead>
              <tr className="border-b border-border">
                <th colSpan={6} className={`${groupHeaderClass} text-foreground/80 bg-muted sticky left-0 z-[7]`}>Deal Info</th>
                <th colSpan={7} className={`${groupHeaderClass} text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-900/10 border-r-0`}>P&L Waterfall</th>
                <th colSpan={1} className={`${groupHeaderClass} text-slate-600 bg-slate-50/50 border-r-0`}>Notes</th>
              </tr>
              <tr className="border-b border-border bg-muted/30">
                {/* Deal Info */}
                <th className={`${thBase} min-w-[90px] text-left sticky left-0 z-[6] bg-muted`}>
                  <button onClick={() => handleSort("reportDate")} className="flex items-center gap-0.5 hover:text-primary">Report Date <SortIcon dir={sd("reportDate")} /></button>
                </th>
                <th className={`${thBase} min-w-[90px] text-left sticky left-[90px] z-[6] bg-muted`}>
                  <a href="#" className="text-[11px]">Deal ID</a>
                </th>
                <FilterableHeader label="Status" options={ALL_STATUSES} filter={statusFilter} onFilter={s => { setStatusFilter(s); setPage(1); }} filterKey="status" open={openFilter} onOpen={setOpenFilter} />
                <FilterableHeader label="BU" options={ALL_BUS} filter={buFilter} onFilter={s => { setBuFilter(s); setPage(1); }} filterKey="bu" open={openFilter} onOpen={setOpenFilter} />
                <FilterableHeader label="Country" options={ALL_COUNTRIES} filter={countryFilter} onFilter={s => { setCountryFilter(s); setPage(1); }} filterKey="country" open={openFilter} onOpen={setOpenFilter} />

                <FilterableHeader label="Market" options={ALL_MARKETS} filter={marketFilter} onFilter={s => { setMarketFilter(s); setPage(1); }} filterKey="market" open={openFilter} onOpen={setOpenFilter} />

                {/* P&L Waterfall */}
                <th className={`${thBase} min-w-[110px] text-right`}>
                  <button onClick={() => handleSort("grossRevenue")} className="flex items-center gap-0.5 ml-auto hover:text-primary">Gross Rev <SortIcon dir={sd("grossRevenue")} /></button>
                </th>
                <th className={`${thBase} min-w-[100px] text-right`}>
                  <button onClick={() => handleSort("reductions")} className="flex items-center gap-0.5 ml-auto hover:text-primary">Reductions <SortIcon dir={sd("reductions")} /></button>
                </th>
                <th className={`${thBase} min-w-[100px] text-right`}>
                  <button onClick={() => handleSort("extSplits")} className="flex items-center gap-0.5 ml-auto hover:text-primary">Ext. Splits <SortIcon dir={sd("extSplits")} /></button>
                </th>
                <th className={`${thBase} min-w-[100px] text-right`}>
                  <button onClick={() => handleSort("svcFees")} className="flex items-center gap-0.5 ml-auto hover:text-primary">Svc. Fees <SortIcon dir={sd("svcFees")} /></button>
                </th>
                <th className={`${thBase} min-w-[110px] text-right`}>
                  <button onClick={() => handleSort("netRevenue")} className="flex items-center gap-0.5 ml-auto hover:text-primary">Net Rev <SortIcon dir={sd("netRevenue")} /></button>
                </th>
                <th className={`${thBase} min-w-[100px] text-right`}>
                  <button onClick={() => handleSort("agentCost")} className="flex items-center gap-0.5 ml-auto hover:text-primary">Agent Cost <SortIcon dir={sd("agentCost")} /></button>
                </th>
                <th className={`${thBase} min-w-[110px] text-right border-r-2 border-r-border`}>
                  <button onClick={() => handleSort("margin")} className="flex items-center gap-0.5 ml-auto hover:text-primary">Margin <SortIcon dir={sd("margin")} /></button>
                </th>

                {/* Notes */}
                <th className={`${thBase} min-w-[200px] text-left`}>Comment</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((deal) => {
                const pnl = pnlByDealId.get(deal.id);
                const dc = deal.currency ?? currency;
                const f = (n: number) => fmt(n, dc);
                return (
                  <tr key={deal.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    {/* Deal Info — frozen */}
                    <td className={`${tdClass} sticky left-0 z-[3] bg-card text-[11px] text-muted-foreground`} style={{ minWidth: 90, width: 90, maxWidth: 90 }}>
                      {formatDate(deal.reportDate)}
                    </td>
                    <td className={`${tdClass} sticky left-[90px] z-[3] bg-card font-medium text-primary`} style={{ minWidth: 90, width: 90, maxWidth: 90 }}>
                      <a href={`/deals/${deal.id}`} className="underline underline-offset-2 hover:text-primary/80 text-[11px] font-mono">{deal.id}</a>
                    </td>
                    <td className={`${tdClass}`}><DealStatusBadge status={deal.status} /></td>
                    <td className={`${tdClass}`}><BUBadge bu={deal.businessUnit} /></td>
                    <td className={`${tdClass} text-[11px] uppercase`}>{deal.country ?? dash}</td>

                    <td className={`${tdClass} text-[11px] text-muted-foreground`}>{deal.market ?? dash}</td>

                    {/* P&L Waterfall */}
                    {pnl ? (
                      <>
                        <td className={`${tdClass} text-right tabular-nums`}>{f(pnl.grossRevenue)}</td>
                        <td className={`${tdClass} text-right tabular-nums text-muted-foreground`}>{pnl.totalBucketA > 0 ? `−${f(pnl.totalBucketA)}` : dash}</td>
                        <td className={`${tdClass} text-right tabular-nums text-muted-foreground`}>{pnl.totalBucketC > 0 ? `−${f(pnl.totalBucketC)}` : dash}</td>
                        <td className={`${tdClass} text-right tabular-nums text-muted-foreground`}>{pnl.totalBucketD > 0 ? `−${f(pnl.totalBucketD)}` : dash}</td>
                        <td className={`${tdClass} text-right tabular-nums font-semibold`}>{f(pnl.netRevenue)}</td>
                        <td className={`${tdClass} text-right tabular-nums text-muted-foreground`}>{pnl.totalBucketB > 0 ? `−${f(pnl.totalBucketB)}` : dash}</td>
                        <td className={`${tdClass} text-right tabular-nums font-bold border-r-2 border-r-border ${pnl.huspyMargin >= 0 ? "text-emerald-700 dark:text-emerald-400" : "text-destructive"}`}>{f(pnl.huspyMargin)}</td>
                      </>
                    ) : (
                      Array.from({ length: 7 }, (_, i) => (
                        <td key={i} className={`${tdClass} text-right text-muted-foreground/40 ${i === 6 ? "border-r-2 border-r-border" : ""}`}>{dash}</td>
                      ))
                    )}

                    {/* Notes */}
                    <td className={`${tdClass} max-w-[200px]`}>
                      {latestCommentByDealId.get(deal.id) ? (
                        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <MessageSquare className="h-3 w-3 shrink-0" />
                          <span className="truncate">{latestCommentByDealId.get(deal.id)}</span>
                        </span>
                      ) : <span className="text-muted-foreground/40">{dash}</span>}
                    </td>
                  </tr>
                );
              })}
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={15} className="px-4 py-8 text-center text-muted-foreground text-[13px]">No deals match the selected filters</td>
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
        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="w-8 h-8 flex items-center justify-center rounded border border-border bg-card disabled:opacity-30 hover:bg-muted transition-colors">
          <ChevronLeft className="h-4 w-4 text-foreground" />
        </button>
        <div className="flex items-center gap-2 text-[14px] mx-1">
          <input type="number" value={page} onChange={(e) => { const v = parseInt(e.target.value); if (v >= 1 && v <= totalPages) setPage(v); }} className="w-12 h-8 text-center border border-border rounded px-1 text-[14px] bg-card focus:outline-none focus:ring-1 focus:ring-ring" />
          <span className="text-muted-foreground">of {sorted.length}</span>
        </div>
        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="w-8 h-8 flex items-center justify-center rounded border border-border bg-card disabled:opacity-30 hover:bg-muted transition-colors">
          <ChevronRight className="h-4 w-4 text-foreground" />
        </button>
        <button onClick={() => setPage(totalPages)} disabled={page === totalPages} className="w-8 h-8 flex items-center justify-center rounded border border-border bg-card disabled:opacity-30 hover:bg-muted transition-colors">
          <ChevronsRight className="h-4 w-4 text-foreground" />
        </button>
      </div>
    </div>
  );
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
}
