import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { sharedInvoices, sharedParties } from "@huspy/shared-domain";
import type { InvoiceStatus } from "@huspy/shared-domain";
import { ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { cn } from "@/lib/utils";

type Direction = "all" | "outbound" | "inbound";
type StatusFilter = "all" | InvoiceStatus;
type CurrencyFilter = "all" | "EUR" | "AED" | "SAR";

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

interface TileProps {
  label: string;
  count: number;
  amount?: number;
  currency?: string;
  colorClass: string;
}

function Tile({ label, count, amount, currency, colorClass }: TileProps) {
  return (
    <div className="bg-card border border-border rounded-lg px-4 py-3 space-y-1">
      <p className="text-[11px] text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className={cn("text-[22px] font-semibold tabular-nums", colorClass)}>{count}</p>
      {amount != null && currency && (
        <p className="text-[12px] text-muted-foreground font-mono">{fmt(amount, currency)}</p>
      )}
    </div>
  );
}

export function InvoicesView() {
  const navigate = useNavigate();
  const [direction, setDirection] = useState<Direction>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [currencyFilter, setCurrencyFilter] = useState<CurrencyFilter>("all");

  const filtered = useMemo(() => {
    return sharedInvoices.filter((inv) => {
      if (direction !== "all" && inv.direction !== direction) return false;
      if (statusFilter !== "all" && inv.status !== statusFilter) return false;
      if (currencyFilter !== "all" && inv.currency !== currencyFilter) return false;
      return true;
    });
  }, [direction, statusFilter, currencyFilter]);

  // Tiles — always based on full dataset (unfiltered), split by direction + status
  const outboundDraft = sharedInvoices.filter((i) => i.direction === "outbound" && i.status === "draft");
  const outboundIssued = sharedInvoices.filter((i) => i.direction === "outbound" && i.status === "issued");
  const outboundPaid = sharedInvoices.filter((i) => i.direction === "outbound" && i.status === "paid");
  const inboundIssued = sharedInvoices.filter((i) => i.direction === "inbound" && i.status === "issued");
  const inboundPaid = sharedInvoices.filter((i) => i.direction === "inbound" && i.status === "paid");

  // For tile amounts: only show when a single currency is selected
  const singleCurrency = currencyFilter !== "all" ? currencyFilter : undefined;
  const sumFor = (list: typeof sharedInvoices) =>
    singleCurrency
      ? list.filter((i) => i.currency === singleCurrency).reduce((s, i) => s + i.subtotal + (i.vatAmount ?? 0), 0)
      : undefined;

  return (
    <div className="space-y-6">
      {/* KPI tiles */}
      <div className="grid grid-cols-5 gap-4">
        <Tile
          label="Outbound — Draft"
          count={outboundDraft.length}
          amount={sumFor(outboundDraft)}
          currency={singleCurrency}
          colorClass="text-muted-foreground"
        />
        <Tile
          label="Outbound — Awaiting payment"
          count={outboundIssued.length}
          amount={sumFor(outboundIssued)}
          currency={singleCurrency}
          colorClass="text-amber-600"
        />
        <Tile
          label="Outbound — Collected"
          count={outboundPaid.length}
          amount={sumFor(outboundPaid)}
          currency={singleCurrency}
          colorClass="text-emerald-600"
        />
        <Tile
          label="Agent invoices — Pending"
          count={inboundIssued.length}
          amount={sumFor(inboundIssued)}
          currency={singleCurrency}
          colorClass="text-blue-600"
        />
        <Tile
          label="Agent invoices — Paid"
          count={inboundPaid.length}
          amount={sumFor(inboundPaid)}
          currency={singleCurrency}
          colorClass="text-emerald-600"
        />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex rounded-lg overflow-hidden border border-border">
          {(["all", "outbound", "inbound"] as Direction[]).map((d) => (
            <button
              key={d}
              onClick={() => setDirection(d)}
              className={cn(
                "px-3 py-1.5 text-[13px] font-medium transition-colors",
                direction === d
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground hover:text-foreground"
              )}
            >
              {d === "all" ? "All" : d === "outbound" ? "Outbound" : "Inbound"}
            </button>
          ))}
        </div>

        <div className="flex rounded-lg overflow-hidden border border-border">
          {(["all", "draft", "issued", "paid", "cancelled"] as StatusFilter[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                "px-3 py-1.5 text-[13px] font-medium transition-colors",
                statusFilter === s
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground hover:text-foreground"
              )}
            >
              {s === "all" ? "All statuses" : STATUS_LABEL[s as InvoiceStatus]}
            </button>
          ))}
        </div>

        <div className="flex rounded-lg overflow-hidden border border-border">
          {(["all", "EUR", "AED", "SAR"] as CurrencyFilter[]).map((c) => (
            <button
              key={c}
              onClick={() => setCurrencyFilter(c)}
              className={cn(
                "px-3 py-1.5 text-[13px] font-medium transition-colors",
                currencyFilter === c
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground hover:text-foreground"
              )}
            >
              {c === "all" ? "All currencies" : c}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-[11px] uppercase tracking-wide">
                Invoice #
              </th>
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-[11px] uppercase tracking-wide">
                Direction
              </th>
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-[11px] uppercase tracking-wide">
                Party
              </th>
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-[11px] uppercase tracking-wide">
                Deal
              </th>
              <th className="text-right px-4 py-2.5 font-medium text-muted-foreground text-[11px] uppercase tracking-wide">
                Amount
              </th>
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-[11px] uppercase tracking-wide">
                Status
              </th>
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-[11px] uppercase tracking-wide">
                Issue Date
              </th>
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-[11px] uppercase tracking-wide">
                Due Date
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-10 text-muted-foreground text-[13px]">
                  No invoices match the current filters.
                </td>
              </tr>
            )}
            {filtered.map((inv) => (
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
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/deals/${inv.dealId}`);
                      }}
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
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-full text-[11px] font-medium",
                      STATUS_CLASSES[inv.status]
                    )}
                  >
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
    </div>
  );
}
