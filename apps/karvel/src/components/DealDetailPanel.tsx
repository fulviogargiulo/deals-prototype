import { useMemo } from "react";
import { Deal } from "@/data/types";
import { DealTypeBadge, DealStatusBadge } from "./DealBadges";
import { X, ArrowUpRight } from "lucide-react";
import { computeDealPnL } from "@/lib/dealCalculations";

interface Props {
  deal: Deal;
  onClose: () => void;
}

export function DealDetailPanel({ deal, onClose }: Props) {
  const pnl = useMemo(() => computeDealPnL(deal), [deal.id]);

  const currency = deal.currency ?? "EUR";

  return (
    <div className="w-[400px] min-w-[400px] border-l border-border bg-card h-full overflow-y-auto animate-slide-in-right">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <h2 className="text-xl font-semibold text-foreground">{deal.id}</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.open(`/deals/${encodeURIComponent(deal.id)}`, '_blank')}
              className="p-1 hover:bg-muted rounded transition-colors text-muted-foreground"
              title="Open in new tab"
            >
              <ArrowUpRight className="h-5 w-5" />
            </button>
            <button onClick={onClose} className="p-1 hover:bg-muted rounded transition-colors text-muted-foreground">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <hr className="border-border mb-5" />

        {/* Overview */}
        <h3 className="text-[15px] font-semibold text-foreground mb-4">Overview</h3>
        <div className="space-y-3 mb-6">
          <div className="flex items-center">
            <span className="w-[140px] text-[13px] text-muted-foreground shrink-0">Type</span>
            <DealTypeBadge type={deal.type} />
          </div>
          <div className="flex items-center">
            <span className="w-[140px] text-[13px] text-muted-foreground shrink-0">Status</span>
            <DealStatusBadge status={deal.status} isDisputed={deal.isDisputed} />
          </div>
          <DetailRow label="BU" value={deal.businessUnit?.toUpperCase()} />
          <DetailRow label="Country" value={deal.country?.toUpperCase()} />

          <DetailRow label="Created" value={deal.createdAt ? formatDate(deal.createdAt) : undefined} />
        </div>

        <hr className="border-border mb-5" />

        {/* Waterfall ledger */}
        <h3 className="text-[15px] font-semibold text-foreground mb-4">P&L Waterfall</h3>
        {pnl ? (
          <div className="space-y-1">
            {pnl.ledger.map((entry) => (
              <LedgerRow
                key={entry.id}
                label={entry.label}
                bucket={entry.bucket}
                side={entry.side}
                amount={entry.amount}
                currency={currency}
              />
            ))}
            <div className="border-t border-border mt-3 pt-3 flex justify-between items-center">
              <span className="text-[13px] font-semibold text-foreground">Huspy Margin</span>
              <span className="text-[14px] font-bold text-emerald-600 tabular-nums">
                {fmt(pnl.huspyMargin, currency)}
              </span>
            </div>
          </div>
        ) : (
          <p className="text-[13px] text-muted-foreground">
            Waterfall not available — deal lacks engine markers (grossRevenue, blueprint, agents).
          </p>
        )}
      </div>
    </div>
  );
}

function LedgerRow({ label, bucket, side, amount, currency }: {
  label: string; bucket?: string; side: "DEBIT" | "CREDIT"; amount: number; currency: string;
}) {
  const isCredit = side === "CREDIT";
  return (
    <div className="flex items-center justify-between py-1.5">
      <div className="flex items-center gap-2 min-w-0">
        {bucket && (
          <span className="text-[10px] font-bold text-muted-foreground bg-muted rounded px-1 py-0.5 shrink-0">
            {bucket}
          </span>
        )}
        <span className="text-[13px] text-foreground truncate">{label}</span>
      </div>
      <span className={`text-[13px] font-semibold tabular-nums shrink-0 ml-4 ${isCredit ? "text-foreground" : "text-muted-foreground"}`}>
        {isCredit ? "+" : "−"}{fmt(amount, currency)}
      </span>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-center">
      <span className="w-[140px] text-[13px] text-muted-foreground shrink-0">{label}</span>
      <span className="text-[14px] text-foreground font-medium">{value ?? "—"}</span>
    </div>
  );
}

function fmt(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
