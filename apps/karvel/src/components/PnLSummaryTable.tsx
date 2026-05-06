import React, { useState, useMemo, useRef, useEffect } from "react";
import { Deal } from "@/data/types";
import { DealStatusBadge } from "./DealBadges";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUp, ArrowDown, ArrowUpDown, Filter, Check } from "lucide-react";

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

const typeColors: Record<string, string> = {
  Buy: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  Sell: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  Rent: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  Lease: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  "Buy+Sell": "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300",
  Mortgage: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
  "Rent+Lease": "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
};

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
  const [typeFilter, setTypeFilter] = useState<Set<string>>(new Set());

  const fmt = (n: number) => formatAmount(n, currency);
  const dash = "—";

  const maxReceivables = 2;
  const maxPayables = 2;

  const statusOptions = useMemo(() => [...new Set(deals.map(d => d.status))].sort(), [deals]);
  const marketOptions = useMemo(() => [...new Set(deals.map(d => d.market))].sort(), [deals]);
  const typeOptions = useMemo(() => [...new Set(deals.map(d => d.type))].sort(), [deals]);

  const filtered = useMemo(() => {
    return deals.filter(d => {
      if (statusFilter.size > 0 && !statusFilter.has(d.status)) return false;
      if (marketFilter.size > 0 && !marketFilter.has(d.market)) return false;
      if (typeFilter.size > 0 && !typeFilter.has(d.type)) return false;
      return true;
    });
  }, [deals, statusFilter, marketFilter, typeFilter]);

  const getPropTotalRevenue = (d: Deal) => d.huspyRevenue;
  const getPropTotalExtCogs = (d: Deal) => d.cogsExternal + d.cogsRebates + d.cogsSubsidy;
  const getPropTotalIntCogs = (d: Deal) => d.cogsInternal + d.cogsReferrals;
  const getPropNetRevenue = (d: Deal) => getPropTotalRevenue(d) - getPropTotalExtCogs(d) - getPropTotalIntCogs(d);

  const getConvTotalRevenue = (d: Deal) => d.conveyanceRevenue || 0;
  const getConvTotalCogs = (d: Deal) => d.conveyanceAgentPayout || 0;
  const getConvNetRevenue = (d: Deal) => getConvTotalRevenue(d) - getConvTotalCogs(d);

  const sortGetters: Record<string, (d: Deal) => any> = {
    propTotalRevenue: getPropTotalRevenue,
    propTotalExtCogs: getPropTotalExtCogs,
    propTotalIntCogs: getPropTotalIntCogs,
    propNetRevenue: getPropNetRevenue,
    convTotalRevenue: getConvTotalRevenue,
    convTotalCogs: getConvTotalCogs,
    convNetRevenue: getConvNetRevenue,
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
  }, [filtered, sortKey, sortDir]);

  const perPage = 15;
  const totalPages = Math.max(1, Math.ceil(sorted.length / perPage));
  const paginated = sorted.slice((page - 1) * perPage, page * perPage);

  // Reset page when filters change
  useEffect(() => setPage(1), [statusFilter, marketFilter, typeFilter]);

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
                <th colSpan={5} className={`${groupHeaderClass} text-foreground/80 bg-muted sticky left-0 z-[7]`} style={{ minWidth: 510 }}>Deal Info</th>
                <th colSpan={4} className={`${groupHeaderClass} text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-900/10`}>Property Transaction</th>
                <th colSpan={3} className={`${groupHeaderClass} text-violet-700 dark:text-violet-400 bg-violet-50/50 dark:bg-violet-900/10`}>Conveyance Transaction</th>
                <th colSpan={maxReceivables * 2} className={`${groupHeaderClass} text-blue-700 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10`}>Receivables</th>
                <th colSpan={maxPayables * 2} className={`${groupHeaderClass} text-amber-700 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-900/10 border-r-0`}>Payables</th>
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
                <th className={`${thClass} min-w-[80px] border-r-2 border-r-border sticky left-[430px] z-[6] bg-muted`}>
                  <div className="flex items-center gap-1">Type <HeaderFilter options={typeOptions} selected={typeFilter} onChange={setTypeFilter} /></div>
                </th>

                <th className={`${thClass} min-w-[110px] text-right`}>
                  <button onClick={() => toggleSort("propTotalRevenue")} className="flex items-center gap-1 ml-auto">Total Revenue <SortIcon col="propTotalRevenue" /></button>
                </th>
                <th className={`${thClass} min-w-[120px] text-right`}>
                  <button onClick={() => toggleSort("propTotalExtCogs")} className="flex items-center gap-1 ml-auto">Ext. COGS <SortIcon col="propTotalExtCogs" /></button>
                </th>
                <th className={`${thClass} min-w-[120px] text-right`}>
                  <button onClick={() => toggleSort("propTotalIntCogs")} className="flex items-center gap-1 ml-auto">Int. COGS <SortIcon col="propTotalIntCogs" /></button>
                </th>
                <th className={`${thClass} min-w-[110px] text-right border-r-2 border-r-border`}>
                  <button onClick={() => toggleSort("propNetRevenue")} className="flex items-center gap-1 ml-auto">Net Revenue <SortIcon col="propNetRevenue" /></button>
                </th>

                <th className={`${thClass} min-w-[110px] text-right`}>
                  <button onClick={() => toggleSort("convTotalRevenue")} className="flex items-center gap-1 ml-auto">Total Revenue <SortIcon col="convTotalRevenue" /></button>
                </th>
                <th className={`${thClass} min-w-[110px] text-right`}>
                  <button onClick={() => toggleSort("convTotalCogs")} className="flex items-center gap-1 ml-auto">Total COGS <SortIcon col="convTotalCogs" /></button>
                </th>
                <th className={`${thClass} min-w-[110px] text-right border-r-2 border-r-border`}>
                  <button onClick={() => toggleSort("convNetRevenue")} className="flex items-center gap-1 ml-auto">Net Revenue <SortIcon col="convNetRevenue" /></button>
                </th>

                {Array.from({ length: maxReceivables }, (_, i) => {
                  const n = ` ${i + 1}`;
                  const isLast = i === maxReceivables - 1;
                  return (
                    <React.Fragment key={`recv-h-${i}`}>
                      <th className={`${thClass} min-w-[130px]`}>Ref/Invoice#{n}</th>
                      <th className={`${thClass} min-w-[100px] ${isLast ? "border-r-2 border-r-border" : ""}`}>Status{n}</th>
                    </React.Fragment>
                  );
                })}

                {Array.from({ length: maxPayables }, (_, i) => {
                  const n = ` ${i + 1}`;
                  const isLast = i === maxPayables - 1;
                  return (
                    <React.Fragment key={`pay-h-${i}`}>
                      <th className={`${thClass} min-w-[130px]`}>Ref#{n}</th>
                      <th className={`${thClass} min-w-[100px] ${isLast ? "border-r-0" : ""}`}>Status{n}</th>
                    </React.Fragment>
                  );
                })}
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
                  <td className={`${tdClass} sticky left-[350px] z-[3] bg-card`} style={{ minWidth: 80, width: 80, maxWidth: 80 }}>{deal.market}</td>
                  <td className={`${tdClass} border-r-2 border-r-border sticky left-[430px] z-[3] bg-card`} style={{ minWidth: 80, width: 80, maxWidth: 80 }}>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${typeColors[deal.type] || "bg-muted text-muted-foreground"}`}>
                      {deal.type}
                    </span>
                  </td>

                  <td className={`${tdClass} text-right tabular-nums`}>{fmt(getPropTotalRevenue(deal))}</td>
                  <td className={`${tdClass} text-right tabular-nums`}>{fmt(getPropTotalExtCogs(deal))}</td>
                  <td className={`${tdClass} text-right tabular-nums`}>{fmt(getPropTotalIntCogs(deal))}</td>
                  <td className={`${tdClass} text-right tabular-nums font-semibold border-r-2 border-r-border`}>{fmt(getPropNetRevenue(deal))}</td>

                  <td className={`${tdClass} text-right tabular-nums`}>{deal.market === "Secondary" ? fmt(getConvTotalRevenue(deal)) : dash}</td>
                  <td className={`${tdClass} text-right tabular-nums`}>{deal.market === "Secondary" ? fmt(getConvTotalCogs(deal)) : dash}</td>
                  <td className={`${tdClass} text-right tabular-nums font-semibold border-r-2 border-r-border`}>{deal.market === "Secondary" ? fmt(getConvNetRevenue(deal)) : dash}</td>

                  {Array.from({ length: maxReceivables }, (_, i) => {
                    const r = deal.receivables?.[i];
                    const isLast = i === maxReceivables - 1;
                    return (
                      <React.Fragment key={`recv-${i}`}>
                        <td className={tdClass}>{r?.invoiceNumber || dash}</td>
                        <td className={`${tdClass} ${isLast ? "border-r-2 border-r-border" : ""}`}>
                          {r?.invoiceStatus ? (
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${getInvoiceStatusColor(r.invoiceStatus)}`}>
                              {r.invoiceStatus}
                            </span>
                          ) : dash}
                        </td>
                      </React.Fragment>
                    );
                  })}

                  {Array.from({ length: maxPayables }, (_, i) => {
                    const p = deal.payables?.[i];
                    const isLast = i === maxPayables - 1;
                    return (
                      <React.Fragment key={`pay-${i}`}>
                        <td className={tdClass}>{p?.refNumber || dash}</td>
                        <td className={`${tdClass} ${isLast ? "border-r-0" : ""}`}>
                          {p?.status ? (
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${getPayableStatusColor(p.status)}`}>
                              {p.status}
                            </span>
                          ) : dash}
                        </td>
                      </React.Fragment>
                    );
                  })}
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

/* ═══ Helpers ═══ */

function getInvoiceStatusColor(status: string): string {
  switch (status) {
    case "Paid": return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300";
    case "Sent": return "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300";
    case "Created": return "bg-muted text-muted-foreground";
    case "Overdue": return "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300";
    case "Paid Partial": return "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300";
    case "Cancelled": return "bg-muted text-muted-foreground line-through";
    default: return "bg-muted text-muted-foreground";
  }
}

function getPayableStatusColor(status: string): string {
  switch (status) {
    case "Paid": return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300";
    case "Approved": return "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300";
    case "Pending": return "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300";
    case "Rejected": return "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300";
    case "Overdue": return "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300";
    default: return "bg-muted text-muted-foreground";
  }
}
