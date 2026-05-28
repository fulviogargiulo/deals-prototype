import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { sharedInvoices, sharedParties } from "@huspy/shared-domain";
import type { InvoiceStatus } from "@huspy/shared-domain";
import { ArrowUpRight, ArrowDownLeft, Filter, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { thBase, SortDir, SortIcon, FilterDropdown, SearchDropdown, DateRangeDropdown } from "./TableFilters";

const STATUS_LABEL: Record<InvoiceStatus, string> = {
  draft: "Draft",
  issued: "Issued",
  paid: "Paid",
  cancelled: "Cancelled",
};

const STATUS_CLASSES: Record<InvoiceStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  issued: "bg-amber-50 text-amber-700 border border-amber-200",
  paid: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  cancelled: "bg-red-50 text-red-500 border border-red-200",
};

function fmt(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function resolveParty(partyId: string): string {
  return sharedParties.find((p) => p.id === partyId)?.displayName ?? partyId;
}

type SortKey = "invoiceNumber" | "amount" | "party" | "dealId" | "issueDate" | "dueDate";

export function InvoicesView({ globalSearch = "" }: { globalSearch?: string }) {
  const navigate = useNavigate();
  const [directionFilter, setDirectionFilter] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<Set<string>>(new Set());
  const [currencyFilter, setCurrencyFilter] = useState<Set<string>>(new Set());
  const [partySearch, setPartySearch] = useState("");
  const [invoiceSearch, setInvoiceSearch] = useState("");
  const [dealSearch, setDealSearch] = useState("");
  const [issueDateRange, setIssueDateRange] = useState<{ from: string; to: string }>({ from: "", to: "" });
  const [dueDateRange, setDueDateRange] = useState<{ from: string; to: string }>({ from: "", to: "" });
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);
  const [openFilter, setOpenFilter] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = globalSearch.toLowerCase();
    return sharedInvoices.filter((inv) => {
      if (q && !inv.invoiceNumber.toLowerCase().includes(q) && !resolveParty(inv.partyId).toLowerCase().includes(q)) return false;
      if (directionFilter.size > 0 && !directionFilter.has(inv.direction)) return false;
      if (statusFilter.size > 0 && !statusFilter.has(inv.status)) return false;
      if (currencyFilter.size > 0 && !currencyFilter.has(inv.currency)) return false;
      if (partySearch && !resolveParty(inv.partyId).toLowerCase().includes(partySearch.toLowerCase())) return false;
      if (invoiceSearch && !inv.invoiceNumber.toLowerCase().includes(invoiceSearch.toLowerCase())) return false;
      if (dealSearch && !(inv.dealId ?? "").toLowerCase().includes(dealSearch.toLowerCase())) return false;
      if (issueDateRange.from && inv.issueDate < issueDateRange.from) return false;
      if (issueDateRange.to && inv.issueDate > issueDateRange.to) return false;
      if (dueDateRange.from && (inv.dueDate ?? "") < dueDateRange.from) return false;
      if (dueDateRange.to && (inv.dueDate ?? "") > dueDateRange.to) return false;
      return true;
    });
  }, [globalSearch, directionFilter, statusFilter, currencyFilter, partySearch, invoiceSearch, dealSearch, issueDateRange, dueDateRange]);

  const sorted = useMemo(() => {
    if (!sortKey || !sortDir) return filtered;
    const dir = sortDir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      switch (sortKey) {
        case "invoiceNumber": return a.invoiceNumber.localeCompare(b.invoiceNumber) * dir;
        case "amount": return ((a.subtotal + (a.vatAmount ?? 0)) - (b.subtotal + (b.vatAmount ?? 0))) * dir;
        case "party": return resolveParty(a.partyId).localeCompare(resolveParty(b.partyId)) * dir;
        case "dealId": return (a.dealId ?? "").localeCompare(b.dealId ?? "") * dir;
        case "issueDate": return a.issueDate.localeCompare(b.issueDate) * dir;
        case "dueDate": return (a.dueDate ?? "").localeCompare(b.dueDate ?? "") * dir;
        default: return 0;
      }
    });
  }, [filtered, sortKey, sortDir]);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      const next = sortDir === "asc" ? "desc" : sortDir === "desc" ? null : "asc";
      setSortDir(next as SortDir);
      if (!next) setSortKey(null);
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const getSortDir = (key: SortKey): SortDir => sortKey === key ? sortDir : null;

  useEffect(() => { setPage(1); }, [filtered, sortKey, sortDir]);

  const perPage = 15;
  const totalPages = Math.max(1, Math.ceil(sorted.length / perPage));
  const paginated = sorted.slice((page - 1) * perPage, page * perPage);

  const activeFilterCount =
    [directionFilter, statusFilter, currencyFilter].filter((f) => f.size > 0).length +
    [partySearch, invoiceSearch, dealSearch].filter(Boolean).length +
    [issueDateRange.from || issueDateRange.to, dueDateRange.from || dueDateRange.to].filter(Boolean).length;

  function clearAll() {
    setDirectionFilter(new Set());
    setStatusFilter(new Set());
    setCurrencyFilter(new Set());
    setPartySearch("");
    setInvoiceSearch("");
    setDealSearch("");
    setIssueDateRange({ from: "", to: "" });
    setDueDateRange({ from: "", to: "" });
  }

  return (
    <div className="space-y-6">
      {activeFilterCount > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-muted-foreground">
            {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""} active · {sorted.length} invoice{sorted.length !== 1 ? "s" : ""}
          </span>
          <button onClick={clearAll} className="text-[12px] text-primary hover:underline">
            Clear all
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-border bg-muted/20">
              <th className={`${thBase} text-left relative`}>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleSort("invoiceNumber")} className="flex items-center gap-1 hover:text-foreground transition-colors">
                    Invoice # <SortIcon dir={getSortDir("invoiceNumber")} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setOpenFilter(openFilter === "invoice" ? null : "invoice"); }}
                    className={`p-0.5 rounded transition-colors ${invoiceSearch ? "text-primary" : "text-muted-foreground/40 hover:text-muted-foreground"}`}
                  >
                    {invoiceSearch ? <X className="h-3 w-3" onClick={(e) => { e.stopPropagation(); setInvoiceSearch(""); }} /> : <Filter className="h-3 w-3" />}
                  </button>
                </div>
                {openFilter === "invoice" && (
                  <SearchDropdown
                    value={invoiceSearch}
                    onChange={setInvoiceSearch}
                    onClose={() => setOpenFilter(null)}
                    placeholder="Search invoice #..."
                  />
                )}
              </th>
              <th className={`${thBase} text-left relative`}>
                <div className="flex items-center gap-1">
                  <span>Direction</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); setOpenFilter(openFilter === "direction" ? null : "direction"); }}
                    className={`p-0.5 rounded transition-colors ${directionFilter.size > 0 ? "text-primary" : "text-muted-foreground/40 hover:text-muted-foreground"}`}
                  >
                    {directionFilter.size > 0 ? <X className="h-3 w-3" /> : <Filter className="h-3 w-3" />}
                  </button>
                </div>
                {openFilter === "direction" && (
                  <FilterDropdown
                    options={["outbound", "inbound"]}
                    selected={directionFilter}
                    labels={{ outbound: "Outbound", inbound: "Inbound" }}
                    onChange={(s) => setDirectionFilter(s)}
                    onClose={() => setOpenFilter(null)}
                  />
                )}
              </th>
              <th className={`${thBase} text-left relative`}>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleSort("party")} className="flex items-center gap-1 hover:text-foreground transition-colors">
                    Party <SortIcon dir={getSortDir("party")} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setOpenFilter(openFilter === "party" ? null : "party"); }}
                    className={`p-0.5 rounded transition-colors ${partySearch ? "text-primary" : "text-muted-foreground/40 hover:text-muted-foreground"}`}
                  >
                    {partySearch ? <X className="h-3 w-3" onClick={(e) => { e.stopPropagation(); setPartySearch(""); }} /> : <Filter className="h-3 w-3" />}
                  </button>
                </div>
                {openFilter === "party" && (
                  <SearchDropdown
                    value={partySearch}
                    onChange={setPartySearch}
                    onClose={() => setOpenFilter(null)}
                    placeholder="Search party..."
                  />
                )}
              </th>
              <th className={`${thBase} text-left relative`}>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleSort("dealId")} className="flex items-center gap-1 hover:text-foreground transition-colors">
                    Deal <SortIcon dir={getSortDir("dealId")} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setOpenFilter(openFilter === "deal" ? null : "deal"); }}
                    className={`p-0.5 rounded transition-colors ${dealSearch ? "text-primary" : "text-muted-foreground/40 hover:text-muted-foreground"}`}
                  >
                    {dealSearch ? <X className="h-3 w-3" onClick={(e) => { e.stopPropagation(); setDealSearch(""); }} /> : <Filter className="h-3 w-3" />}
                  </button>
                </div>
                {openFilter === "deal" && (
                  <SearchDropdown
                    value={dealSearch}
                    onChange={setDealSearch}
                    onClose={() => setOpenFilter(null)}
                    placeholder="Search deal ID..."
                  />
                )}
              </th>
              <th className={`${thBase} text-right relative`}>
                <div className="flex items-center gap-1 justify-end">
                  <button onClick={() => handleSort("amount")} className="flex items-center gap-1 hover:text-foreground transition-colors">
                    Amount <SortIcon dir={getSortDir("amount")} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setOpenFilter(openFilter === "currency" ? null : "currency"); }}
                    className={`p-0.5 rounded transition-colors ${currencyFilter.size > 0 ? "text-primary" : "text-muted-foreground/40 hover:text-muted-foreground"}`}
                  >
                    {currencyFilter.size > 0 ? <X className="h-3 w-3" /> : <Filter className="h-3 w-3" />}
                  </button>
                </div>
                {openFilter === "currency" && (
                  <FilterDropdown
                    options={["EUR", "AED", "SAR"]}
                    selected={currencyFilter}
                    onChange={(s) => setCurrencyFilter(s)}
                    onClose={() => setOpenFilter(null)}
                    className="right-0 left-auto"
                  />
                )}
              </th>
              <th className={`${thBase} text-left relative`}>
                <div className="flex items-center gap-1">
                  <span>Status</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); setOpenFilter(openFilter === "status" ? null : "status"); }}
                    className={`p-0.5 rounded transition-colors ${statusFilter.size > 0 ? "text-primary" : "text-muted-foreground/40 hover:text-muted-foreground"}`}
                  >
                    {statusFilter.size > 0 ? <X className="h-3 w-3" /> : <Filter className="h-3 w-3" />}
                  </button>
                </div>
                {openFilter === "status" && (
                  <FilterDropdown
                    options={["draft", "issued", "paid", "cancelled"]}
                    selected={statusFilter}
                    labels={STATUS_LABEL}
                    onChange={(s) => setStatusFilter(s)}
                    onClose={() => setOpenFilter(null)}
                  />
                )}
              </th>
              <th className={`${thBase} text-left relative`}>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleSort("issueDate")} className="flex items-center gap-1 hover:text-foreground transition-colors">
                    Issue Date <SortIcon dir={getSortDir("issueDate")} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setOpenFilter(openFilter === "issueDate" ? null : "issueDate"); }}
                    className={`p-0.5 rounded transition-colors ${issueDateRange.from || issueDateRange.to ? "text-primary" : "text-muted-foreground/40 hover:text-muted-foreground"}`}
                  >
                    {issueDateRange.from || issueDateRange.to
                      ? <X className="h-3 w-3" onClick={(e) => { e.stopPropagation(); setIssueDateRange({ from: "", to: "" }); }} />
                      : <Filter className="h-3 w-3" />}
                  </button>
                </div>
                {openFilter === "issueDate" && (
                  <DateRangeDropdown
                    value={issueDateRange}
                    onChange={setIssueDateRange}
                    onClose={() => setOpenFilter(null)}
                  />
                )}
              </th>
              <th className={`${thBase} text-left relative`}>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleSort("dueDate")} className="flex items-center gap-1 hover:text-foreground transition-colors">
                    Due Date <SortIcon dir={getSortDir("dueDate")} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setOpenFilter(openFilter === "dueDate" ? null : "dueDate"); }}
                    className={`p-0.5 rounded transition-colors ${dueDateRange.from || dueDateRange.to ? "text-primary" : "text-muted-foreground/40 hover:text-muted-foreground"}`}
                  >
                    {dueDateRange.from || dueDateRange.to
                      ? <X className="h-3 w-3" onClick={(e) => { e.stopPropagation(); setDueDateRange({ from: "", to: "" }); }} />
                      : <Filter className="h-3 w-3" />}
                  </button>
                </div>
                {openFilter === "dueDate" && (
                  <DateRangeDropdown
                    value={dueDateRange}
                    onChange={setDueDateRange}
                    onClose={() => setOpenFilter(null)}
                  />
                )}
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-10 text-muted-foreground text-[13px]">
                  No invoices match the current filters.
                </td>
              </tr>
            )}
            {paginated.map((inv) => (
              <tr
                key={inv.id}
                onClick={() => navigate(`/invoices/${inv.id}`)}
                className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors cursor-pointer"
              >
                <td className="px-4 py-3 font-mono text-[12px] text-foreground">{inv.invoiceNumber}</td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 text-[11px] font-medium",
                      inv.direction === "outbound" ? "text-emerald-600" : "text-blue-600"
                    )}
                  >
                    {inv.direction === "outbound" ? (
                      <ArrowUpRight className="h-3 w-3" />
                    ) : (
                      <ArrowDownLeft className="h-3 w-3" />
                    )}
                    {inv.direction === "outbound" ? "Outbound" : "Inbound"}
                  </span>
                </td>
                <td className="px-4 py-3 text-foreground">{resolveParty(inv.partyId)}</td>
                <td className="px-4 py-3 text-muted-foreground font-mono text-[11px]">
                  {inv.dealId ? (
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/deals/${inv.dealId}`); }}
                      className="text-primary hover:underline transition-colors"
                    >
                      {inv.dealId}
                    </button>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-3 text-right font-mono font-semibold tabular-nums">
                  {fmt(inv.subtotal + (inv.vatAmount ?? 0), inv.currency)}
                </td>
                <td className="px-4 py-3">
                  <span className={cn("px-2 py-0.5 rounded-full text-[11px] font-medium", STATUS_CLASSES[inv.status])}>
                    {STATUS_LABEL[inv.status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{inv.issueDate}</td>
                <td className="px-4 py-3 text-muted-foreground">{inv.dueDate ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
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
          <span className="text-muted-foreground">of {totalPages}</span>
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
