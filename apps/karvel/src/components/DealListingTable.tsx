import { Deal, DealStatus, BusinessUnit } from "@/data/types";
import { DealStatusBadge } from "./DealBadges";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUp, ArrowDown, ArrowUpDown, Filter, X } from "lucide-react";
import { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface Props {
  deals: Deal[];
  currency: string;
  onDealClick?: (deal: Deal) => void;
}

type SortDir = "asc" | "desc" | null;
type SortKey = "reportDate" | "id" | "businessUnit" | "ofCaseNumber" | "status" | "dealPrice" | "takeRate" | "huspyRevenue" | "clientName" | "agentName";

interface ColumnFilter {
  key: SortKey;
  values: Set<string>;
}

const ALL_STATUSES: DealStatus[] = ["reported", "pending-details", "under-review", "pending-agent-approval", "pending-receivables", "finalized", "canceled"];
const ALL_BUS: BusinessUnit[] = ["rebu", "mortgage"];

const thBase = "px-4 py-3 font-semibold text-foreground text-[13px] whitespace-nowrap border-b border-border bg-muted/20";
const tdClass = "px-4 py-3 text-[13px] text-foreground font-medium whitespace-nowrap";

function BUBadge({ bu }: { bu: string }) {
  const cls = bu === "rebu"
    ? "bg-blue-500/15 text-blue-700 dark:text-blue-400"
    : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400";
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${cls}`}>{bu}</span>;
}

/* ---- Filter Dropdown ---- */
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

  const noneSelected = selected.size === 1 && selected.has("__none__");
  const allSelected = selected.size === 0;

  return (
    <div ref={ref} className="absolute top-full left-0 mt-1 z-50 bg-popover border border-border rounded-lg shadow-lg p-2 min-w-[160px] max-h-[240px] overflow-auto">
      <label className="flex items-center gap-2 px-2 py-1.5 text-[12px] font-medium text-foreground hover:bg-muted rounded cursor-pointer">
        <input
          type="checkbox"
          checked={allSelected}
          onChange={() => {
            if (allSelected) onChange(new Set(["__none__"]));
            else onChange(new Set());
          }}
          className="rounded border-border"
        />
        Select All
      </label>
      <div className="border-t border-border my-1" />
      {options.map((opt) => (
        <label key={opt} className="flex items-center gap-2 px-2 py-1.5 text-[12px] text-foreground hover:bg-muted rounded cursor-pointer">
          <input
            type="checkbox"
            checked={allSelected || (!noneSelected && selected.has(opt))}
            onChange={() => {
              if (allSelected) {
                onChange(new Set(options.filter(o => o !== opt)));
              } else if (noneSelected) {
                onChange(new Set([opt]));
              } else {
                const next = new Set(selected);
                next.delete("__none__");
                if (next.has(opt)) next.delete(opt); else next.add(opt);
                if (next.size === 0) onChange(new Set(["__none__"]));
                else if (next.size === options.length) onChange(new Set());
                else onChange(next);
              }
            }}
            className="rounded border-border"
          />
          {opt}
        </label>
      ))}
    </div>
  );
}

/* ---- Sortable/Filterable Header ---- */
function ColumnHeader({ label, sortDir, onSort, filterable, filterActive, onFilterToggle, align, sortable = true }: {
  label: string;
  sortDir: SortDir;
  onSort: () => void;
  filterable?: boolean;
  filterActive?: boolean;
  onFilterToggle?: () => void;
  align?: "right";
  sortable?: boolean;
}) {
  return (
    <th className={`${thBase} ${align === "right" ? "text-right" : "text-left"}`}>
      <div className={`flex items-center gap-1 ${align === "right" ? "justify-end" : ""}`}>
        {sortable ? (
          <button onClick={onSort} className="flex items-center gap-1 hover:text-primary transition-colors">
            {label}
            {sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> :
             sortDir === "desc" ? <ArrowDown className="h-3 w-3" /> :
             <ArrowUpDown className="h-3 w-3 text-muted-foreground/50" />}
          </button>
        ) : (
          <span>{label}</span>
        )}
        {filterable && (
          <button
            onClick={(e) => { e.stopPropagation(); onFilterToggle?.(); }}
            className={`p-0.5 rounded transition-colors ${filterActive ? "text-primary" : "text-muted-foreground/40 hover:text-muted-foreground"}`}
          >
            {filterActive ? <X className="h-3 w-3" /> : <Filter className="h-3 w-3" />}
          </button>
        )}
      </div>
    </th>
  );
}

export function DealListingTable({ deals, currency, onDealClick }: Props) {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);
  const [openFilter, setOpenFilter] = useState<SortKey | null>(null);

  // Filters: empty set means "all selected"
  const [statusFilter, setStatusFilter] = useState<Set<string>>(new Set());
  const [buFilter, setBuFilter] = useState<Set<string>>(new Set());
  const [clientFilter, setClientFilter] = useState<Set<string>>(new Set());
  const [agentFilter, setAgentFilter] = useState<Set<string>>(new Set());

  const uniqueClients = useMemo(() => [...new Set(deals.map(d => d.clientName).filter(Boolean))].sort(), [deals]);
  const uniqueAgents = useMemo(() => [...new Set(deals.map(d => d.agentName).filter(Boolean))].sort(), [deals]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : sortDir === "desc" ? null : "asc");
      if (sortDir === "desc") setSortKey(null);
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(1);
  };

  const toggleFilter = (key: SortKey) => {
    setOpenFilter(openFilter === key ? null : key);
  };

  const isFilterActive = (key: SortKey) => {
    switch (key) {
      case "status": return statusFilter.size > 0;
      case "businessUnit": return buFilter.size > 0;
      case "clientName": return clientFilter.size > 0;
      case "agentName": return agentFilter.size > 0;
      default: return false;
    }
  };

  // Apply filters
  const filtered = useMemo(() => {
    return deals.filter(d => {
      if (statusFilter.size > 0 && !statusFilter.has(d.status)) return false;
      if (buFilter.size > 0 && !buFilter.has(d.businessUnit)) return false;
      if (clientFilter.size > 0 && !clientFilter.has(d.clientName)) return false;
      if (agentFilter.size > 0 && !agentFilter.has(d.agentName)) return false;
      return true;
    });
  }, [deals, statusFilter, buFilter, clientFilter, agentFilter]);

  // Apply sort
  const sorted = useMemo(() => {
    if (!sortKey || !sortDir) return filtered;
    const arr = [...filtered];
    const dir = sortDir === "asc" ? 1 : -1;
    arr.sort((a, b) => {
      let va: string | number, vb: string | number;
      switch (sortKey) {
        case "reportDate": va = a.reportDate; vb = b.reportDate; break;
        case "id": va = a.id; vb = b.id; break;
        case "businessUnit": va = a.businessUnit; vb = b.businessUnit; break;
        case "ofCaseNumber": va = a.ofCaseNumber || ""; vb = b.ofCaseNumber || ""; break;
        case "status": va = a.status; vb = b.status; break;
        case "dealPrice": va = a.dealPrice; vb = b.dealPrice; break;
        case "takeRate": va = a.takeRate; vb = b.takeRate; break;
        case "huspyRevenue": va = a.huspyRevenue; vb = b.huspyRevenue; break;
        case "clientName": va = a.clientName; vb = b.clientName; break;
        case "agentName": va = a.agentName; vb = b.agentName; break;
        default: return 0;
      }
      if (typeof va === "number" && typeof vb === "number") return (va - vb) * dir;
      return String(va).localeCompare(String(vb)) * dir;
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  const perPage = 10;
  const totalCount = sorted.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / perPage));
  const paginated = sorted.slice((page - 1) * perPage, page * perPage);

  const dash = <span className="text-muted-foreground">—</span>;
  const getSortDir = (key: SortKey): SortDir => sortKey === key ? sortDir : null;

  const activeFilterCount = [statusFilter, buFilter, clientFilter, agentFilter].filter(f => f.size > 0).length;

  return (
    <div>
      {activeFilterCount > 0 && (
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[12px] text-muted-foreground">{activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""} active · {totalCount} deal{totalCount !== 1 ? "s" : ""}</span>
          <button
            onClick={() => { setStatusFilter(new Set()); setBuFilter(new Set()); setClientFilter(new Set()); setAgentFilter(new Set()); setPage(1); }}
            className="text-[12px] text-primary hover:underline"
          >
            Clear all
          </button>
        </div>
      )}
      <div className="bg-card rounded-xl overflow-hidden border border-border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <ColumnHeader label="Report Date" sortDir={getSortDir("reportDate")} onSort={() => handleSort("reportDate")} sortable={false} />
                <ColumnHeader label="Deal ID" sortDir={getSortDir("id")} onSort={() => handleSort("id")} sortable={false} />
                <th className={`${thBase} text-left relative`}>
                  <div className="flex items-center gap-1">
                    <span>BU</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleFilter("businessUnit"); }}
                      className={`p-0.5 rounded transition-colors ${isFilterActive("businessUnit") ? "text-primary" : "text-muted-foreground/40 hover:text-muted-foreground"}`}
                    >
                      {isFilterActive("businessUnit") ? <X className="h-3 w-3" /> : <Filter className="h-3 w-3" />}
                    </button>
                  </div>
                  {openFilter === "businessUnit" && (
                    <FilterDropdown options={[...ALL_BUS]} selected={buFilter} onChange={(s) => { setBuFilter(s); setPage(1); }} onClose={() => setOpenFilter(null)} />
                  )}
                </th>
                <ColumnHeader label="OF/Case #" sortDir={getSortDir("ofCaseNumber")} onSort={() => handleSort("ofCaseNumber")} sortable={false} />
                <th className={`${thBase} text-left relative`}>
                  <div className="flex items-center gap-1">
                    <span>Status</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleFilter("status"); }}
                      className={`p-0.5 rounded transition-colors ${isFilterActive("status") ? "text-primary" : "text-muted-foreground/40 hover:text-muted-foreground"}`}
                    >
                      {isFilterActive("status") ? <X className="h-3 w-3" /> : <Filter className="h-3 w-3" />}
                    </button>
                  </div>
                  {openFilter === "status" && (
                    <FilterDropdown options={[...ALL_STATUSES]} selected={statusFilter} onChange={(s) => { setStatusFilter(s); setPage(1); }} onClose={() => setOpenFilter(null)} />
                  )}
                </th>
                <ColumnHeader label="Deal Price" sortDir={getSortDir("dealPrice")} onSort={() => handleSort("dealPrice")} align="right" />
                <ColumnHeader label="Take Rate" sortDir={getSortDir("takeRate")} onSort={() => handleSort("takeRate")} align="right" />
                <ColumnHeader label="Huspy Rev." sortDir={getSortDir("huspyRevenue")} onSort={() => handleSort("huspyRevenue")} align="right" />
                <th className={`${thBase} text-left relative`}>
                  <div className="flex items-center gap-1">
                    <span>Client</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleFilter("clientName"); }}
                      className={`p-0.5 rounded transition-colors ${isFilterActive("clientName") ? "text-primary" : "text-muted-foreground/40 hover:text-muted-foreground"}`}
                    >
                      {isFilterActive("clientName") ? <X className="h-3 w-3" /> : <Filter className="h-3 w-3" />}
                    </button>
                  </div>
                  {openFilter === "clientName" && (
                    <FilterDropdown options={uniqueClients} selected={clientFilter} onChange={(s) => { setClientFilter(s); setPage(1); }} onClose={() => setOpenFilter(null)} />
                  )}
                </th>
                <th className={`${thBase} text-left relative`}>
                  <div className="flex items-center gap-1">
                    <span>Agent</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleFilter("agentName"); }}
                      className={`p-0.5 rounded transition-colors ${isFilterActive("agentName") ? "text-primary" : "text-muted-foreground/40 hover:text-muted-foreground"}`}
                    >
                      {isFilterActive("agentName") ? <X className="h-3 w-3" /> : <Filter className="h-3 w-3" />}
                    </button>
                  </div>
                  {openFilter === "agentName" && (
                    <FilterDropdown options={uniqueAgents} selected={agentFilter} onChange={(s) => { setAgentFilter(s); setPage(1); }} onClose={() => setOpenFilter(null)} />
                  )}
                </th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((deal) => (
                <tr
                  key={deal.id}
                  onClick={() => onDealClick?.(deal)}
                  className="border-b border-border hover:bg-muted/30 transition-colors cursor-pointer"
                >
                  <td className={tdClass}>{formatDate(deal.reportDate)}</td>
                  <td className={`${tdClass} font-semibold`}>{deal.id}</td>
                  <td className={tdClass}><BUBadge bu={deal.businessUnit} /></td>
                  <td className={tdClass}>{deal.ofCaseNumber ? (
                    <button onClick={(e) => { e.stopPropagation(); navigate(`/?selected=${encodeURIComponent(deal.ofCaseNumber!)}`); }} className="text-primary underline underline-offset-2 hover:opacity-80">{deal.ofCaseNumber}</button>
                  ) : dash}</td>
                  <td className="px-4 py-3"><DealStatusBadge status={deal.status} isDisputed={deal.isDisputed} /></td>
                  <td className={`${tdClass} text-right tabular-nums`}>{formatAmount(deal.dealPrice, deal.currency ?? currency)}</td>
                  <td className={`${tdClass} text-right tabular-nums`}>{deal.takeRate.toFixed(2)}%</td>
                  <td className={`${tdClass} text-right tabular-nums`}>{formatAmount(deal.huspyRevenue, deal.currency ?? currency)}</td>
                  <td className={tdClass}>{deal.clientName ? (
                    <button onClick={(e) => { e.stopPropagation(); navigate(`/clients?selected=${encodeURIComponent(deal.clientName)}`); }} className="text-primary underline underline-offset-2 hover:opacity-80">{deal.clientName}</button>
                  ) : dash}</td>
                  <td className={tdClass}>{deal.agentName ? (
                    <button onClick={(e) => { e.stopPropagation(); navigate(`/agents?selected=${encodeURIComponent(deal.agentName)}`); }} className="text-primary underline underline-offset-2 hover:opacity-80">{deal.agentName}</button>
                  ) : dash}</td>
                </tr>
              ))}
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
          <input
            type="number"
            value={page}
            onChange={(e) => {
              const v = parseInt(e.target.value);
              if (v >= 1 && v <= totalPages) setPage(v);
            }}
            className="w-12 h-8 text-center border border-border rounded px-1 text-[14px] bg-card focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <span className="text-muted-foreground">of {totalCount}</span>
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
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
}
