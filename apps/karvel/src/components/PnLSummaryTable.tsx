import { useState, useMemo, useRef, useEffect } from "react";
import { Deal } from "@/data/types";
import { DealStatusBadge } from "./DealBadges";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUp, ArrowDown, ArrowUpDown, Filter, Check } from "lucide-react";
import { computeDealPnL } from "@/lib/dealCalculations";

interface Props {
  deals: Deal[];
  currency?: string;
}

type SortDir = "asc" | "desc" | null;

function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
}


/* ═══ Inline multi-select filter dropdown ═══ */
function HeaderFilter({ options, selected, onChange }: { options: string[]; selected: Set<string>; onChange: (s: Set<string>) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const allSelected = selected.size === 0;

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const isActive = selected.size > 0;

  const toggle = (opt: string) => {
    const next = new Set(selected);
    if (next.has(opt)) next.delete(opt); else next.add(opt);
    onChange(next);
  };

  const toggleAll = () => onChange(new Set());

  return (
    <div ref={ref} className="relative inline-flex">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className={`p-0.5 rounded transition-colors ${isActive ? "text-primary" : "text-muted-foreground/40 hover:text-muted-foreground"}`}
      >
        <Filter className="h-3 w-3" />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-popover border border-border rounded-lg shadow-lg p-1.5 min-w-[160px]">
          <button onClick={toggleAll} className="flex items-center gap-2 w-full px-2 py-1.5 text-[11px] font-medium text-foreground hover:bg-muted rounded">
            <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${allSelected ? "bg-primary border-primary" : "border-border"}`}>
              {allSelected && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
            </div>
            All
          </button>
          <div className="h-px bg-border my-1" />
          {options.map(opt => {
            const checked = allSelected || selected.has(opt);
            return (
              <button key={opt} onClick={() => toggle(opt)} className="flex items-center gap-2 w-full px-2 py-1.5 text-[11px] text-foreground hover:bg-muted rounded">
                <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${checked ? "bg-primary border-primary" : "border-border"}`}>
                  {checked && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
                </div>
                {opt}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function PnLSummaryTable({ deals, currency = "EUR" }: Props) {
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);

  const [statusFilter, setStatusFilter] = useState<Set<string>>(new Set());
  const [marketFilter, setMarketFilter] = useState<Set<string>>(new Set());

  const fmt = (n: number) => formatAmount(n, currency);
  const dash = "—";

  const pnlByDealId = useMemo(() => {
    const m = new Map<string, ReturnType<typeof computeDealPnL>>();
    deals.forEach((d) => m.set(d.id, computeDealPnL(d)));
    return m;
  }, [deals]);

  const statusOptions = useMemo(() => [...new Set(deals.map(d => d.status))].sort(), [deals]);
  const marketOptions = useMemo(() => [...new Set(deals.map(d => d.market))].sort(), [deals]);

  const filtered = useMemo(() => {
    return deals.filter(d => {
      if (statusFilter.size > 0 && !statusFilter.has(d.status)) return false;
      if (marketFilter.size > 0 && !marketFilter.has(d.market)) return false;
      return true;
    });
  }, [deals, statusFilter, marketFilter]);

  const sortGetters: Record<string, (d: Deal) => any> = {
    grossRevenue: (d) => pnlByDealId.get(d.id)?.grossRevenue ?? d.grossRevenue ?? 0,
    totalBucketA: (d) => pnlByDealId.get(d.id)?.totalBucketA ?? 0,
    totalBucketC: (d) => pnlByDealId.get(d.id)?.totalBucketC ?? 0,
    totalBucketD: (d) => pnlByDealId.get(d.id)?.totalBucketD ?? 0,
    netRevenue:   (d) => pnlByDealId.get(d.id)?.netRevenue ?? 0,
    totalBucketB: (d) => pnlByDealId.get(d.id)?.totalBucketB ?? 0,
    huspyMargin:  (d) => pnlByDealId.get(d.id)?.huspyMargin ?? 0,
  };

  const sorted = useMemo(() => {
    if (!sortKey || !sortDir) return filtered;
    return [...filtered].sort((a, b) => {
      let va: any, vb: any;
      const getter = sortGetters[sortKey];
      if (getter) { va = getter(a); vb = getter(b); }
      else { va = (a as any)[sortKey]; vb = (b as any)[sortKey]; }
      if (va == null) va = 0;
      if (vb == null) vb = 0;
      const cmp = typeof va === "string" ? va.localeCompare(vb) : va - vb;
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir, pnlByDealId]);

  const perPage = 15;
  const totalPages = Math.max(1, Math.ceil(sorted.length / perPage));
  const paginated = sorted.slice((page - 1) * perPage, page * perPage);

  // Reset page when filters change
  useEffect(() => setPage(1), [statusFilter, marketFilter]);

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDir === "asc") setSortDir("desc");
      else if (sortDir === "desc") { setSortKey(null); setSortDir(null); }
    } else { setSortKey(key); setSortDir("asc"); }
  };

  const SortIcon = ({ col }: { col: string }) => {
    if (sortKey !== col) return <ArrowUpDown className="h-3 w-3 opacity-40" />;
    return sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />;
  };

  const thClass = "px-3 py-2 text-[11px] font-semibold text-muted-foreground whitespace-nowrap border-r border-border/40 bg-muted";
  const tdClass = "px-3 py-2 text-[12px] text-foreground whitespace-nowrap border-r border-border/10";
  const groupHeaderClass = "px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider whitespace-nowrap border-r-2 border-r-border text-center";

  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <span className="text-[13px] text-muted-foreground font-medium">{sorted.length} deal{sorted.length !== 1 ? "s" : ""}</span>
      </div>

      <div className="border border-border rounded-lg bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[12px]">
            <thead>
              <tr className="border-b border-border">
                <th colSpan={4} className={`${groupHeaderClass} text-foreground/80 bg-muted sticky left-0 z-[7]`} style={{ minWidth: 430 }}>Deal Info</th>
                <th colSpan={7} className={`${groupHeaderClass} text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-900/10 border-r-0`}>P&L Waterfall</th>
              </tr>
              <tr className="border-b border-border bg-muted/30">
                <th className={`${thClass} min-w-[90px] sticky left-0 z-[6] bg-muted`}>Deal ID</th>
                <th className={`${thClass} min-w-[160px] sticky left-[90px] z-[6] bg-muted`}>
                  <div className="flex items-center gap-1">Status <HeaderFilter options={statusOptions} selected={statusFilter} onChange={setStatusFilter} /></div>
                </th>
                <th className={`${thClass} min-w-[100px] sticky left-[250px] z-[6] bg-muted`}>
                  <button onClick={() => toggleSort("reportDate")} className="flex items-center gap-1">Report Date <SortIcon col="reportDate" /></button>
                </th>
                <th className={`${thClass} min-w-[80px] sticky left-[350px] z-[6] bg-muted`}>
                  <div className="flex items-center gap-1">Market <HeaderFilter options={marketOptions} selected={marketFilter} onChange={setMarketFilter} /></div>
                </th>
                <th className={`${thClass} min-w-[110px] text-right`}>
                  <button onClick={() => toggleSort("grossRevenue")} className="flex items-center gap-1 ml-auto">Gross Rev <SortIcon col="grossRevenue" /></button>
                </th>
                <th className={`${thClass} min-w-[100px] text-right`}>
                  <button onClick={() => toggleSort("totalBucketA")} className="flex items-center gap-1 ml-auto">Reductions <SortIcon col="totalBucketA" /></button>
                </th>
                <th className={`${thClass} min-w-[100px] text-right`}>
                  <button onClick={() => toggleSort("totalBucketC")} className="flex items-center gap-1 ml-auto">Ext. Splits <SortIcon col="totalBucketC" /></button>
                </th>
                <th className={`${thClass} min-w-[100px] text-right`}>
                  <button onClick={() => toggleSort("totalBucketD")} className="flex items-center gap-1 ml-auto">Svc. Fees <SortIcon col="totalBucketD" /></button>
                </th>
                <th className={`${thClass} min-w-[110px] text-right`}>
                  <button onClick={() => toggleSort("netRevenue")} className="flex items-center gap-1 ml-auto">Net Rev <SortIcon col="netRevenue" /></button>
                </th>
                <th className={`${thClass} min-w-[100px] text-right`}>
                  <button onClick={() => toggleSort("totalBucketB")} className="flex items-center gap-1 ml-auto">Agent Cost <SortIcon col="totalBucketB" /></button>
                </th>
                <th className={`${thClass} min-w-[110px] text-right border-r-0`}>
                  <button onClick={() => toggleSort("huspyMargin")} className="flex items-center gap-1 ml-auto">Margin <SortIcon col="huspyMargin" /></button>
                </th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((deal) => (
                <tr key={deal.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className={`${tdClass} sticky left-0 z-[3] bg-card font-medium text-primary`} style={{ minWidth: 90, width: 90, maxWidth: 90 }}>
                    <a href={`/deals/${deal.id}`} className="underline underline-offset-2 hover:text-primary/80">{deal.id}</a>
                  </td>
                  <td className={`${tdClass} sticky left-[90px] z-[3] bg-card`} style={{ minWidth: 160, width: 160, maxWidth: 160 }}>
                    <DealStatusBadge status={deal.status} />
                  </td>
                  <td className={`${tdClass} sticky left-[250px] z-[3] bg-card`} style={{ minWidth: 100, width: 100, maxWidth: 100 }}>
                    {formatDate(deal.reportDate)}
                  </td>
                  <td className={`${tdClass} border-r-2 border-r-border sticky left-[350px] z-[3] bg-card`} style={{ minWidth: 80, width: 80, maxWidth: 80 }}>{deal.market}</td>

                  {(() => {
                    const pnl = pnlByDealId.get(deal.id);
                    return pnl ? (
                      <>
                        <td className={`${tdClass} text-right tabular-nums`}>{fmt(pnl.grossRevenue)}</td>
                        <td className={`${tdClass} text-right tabular-nums text-muted-foreground`}>{pnl.totalBucketA > 0 ? `−${fmt(pnl.totalBucketA)}` : dash}</td>
                        <td className={`${tdClass} text-right tabular-nums text-muted-foreground`}>{pnl.totalBucketC > 0 ? `−${fmt(pnl.totalBucketC)}` : dash}</td>
                        <td className={`${tdClass} text-right tabular-nums text-muted-foreground`}>{pnl.totalBucketD > 0 ? `−${fmt(pnl.totalBucketD)}` : dash}</td>
                        <td className={`${tdClass} text-right tabular-nums font-semibold`}>{fmt(pnl.netRevenue)}</td>
                        <td className={`${tdClass} text-right tabular-nums text-muted-foreground`}>{pnl.totalBucketB > 0 ? `−${fmt(pnl.totalBucketB)}` : dash}</td>
                        <td className={`${tdClass} text-right tabular-nums font-bold text-emerald-700 border-r-2 border-r-border`}>{fmt(pnl.huspyMargin)}</td>
                      </>
                    ) : (
                      <>
                        {Array.from({ length: 6 }, (_, i) => <td key={i} className={`${tdClass} text-right text-muted-foreground/40`}>{dash}</td>)}
                        <td className={`${tdClass} text-right text-muted-foreground/40 border-r-2 border-r-border`}>{dash}</td>
                      </>
                    );
                  })()}

                </tr>
              ))}
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={100} className="px-4 py-8 text-center text-muted-foreground text-[13px]">No deals match the selected filters</td>
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

