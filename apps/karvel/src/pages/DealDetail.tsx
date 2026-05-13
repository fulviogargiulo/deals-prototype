import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { findDeal, updateDeal } from "@/data/dealStore";
import { Deal, DealStatus } from "@/data/types";
import { DealStatusBadge } from "@/components/DealBadges";
import { ArrowLeft, CheckCircle2, Circle, AlertTriangle, ExternalLink } from "lucide-react";
import { computeDealPnL } from "@/lib/dealCalculations";
import { toast } from "sonner";
import {
  canTransitionDealStatus,
  getAllowedDealTransitions,
  sharedParties,
  sharedAgents,
  type LedgerEntry,
} from "@huspy/shared-domain";
import { StakeholdersPanel } from "@/components/StakeholdersPanel";

const STAGE_ORDER: { key: DealStatus; label: string }[] = [
  { key: "pending-details", label: "Pending Details" },
  { key: "under-review", label: "Under Review" },
  { key: "pending-agent-approval", label: "Agent Approval" },
  { key: "pending-receivables", label: "Receivables" },
  { key: "finalized", label: "Finalized" },
];

function getStageIndex(status: DealStatus): number {
  return STAGE_ORDER.findIndex((s) => s.key === status);
}

function getStageDates(deal: Deal): Record<string, string | null> {
  const dates: Record<string, string | null> = {};
  STAGE_ORDER.forEach((stage) => { dates[stage.key] = null; });
  dates["pending-details"] = deal.reportDate ? new Date(deal.reportDate).toISOString() : null;
  if (deal.statusHistory) {
    for (const entry of deal.statusHistory) {
      if (dates[entry.to] === null) dates[entry.to] = entry.timestamp;
    }
  }
  return dates;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit", hour12: true,
  });
}

function fmt(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}

function ReadRow({ label, value, children }: { label: string; value?: string | React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="flex items-center py-2 min-w-0 border-b border-border/40 last:border-0">
      <span className="w-[160px] text-[12px] text-muted-foreground shrink-0 uppercase tracking-wide font-medium">{label}</span>
      <span className="text-[13px] text-foreground font-medium truncate">{children ?? value ?? "—"}</span>
    </div>
  );
}

function SectionCard({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-card border border-border rounded-lg shadow-sm ${className}`}>
      <div className="px-5 py-3.5 border-b border-border">
        <h3 className="text-[13px] font-semibold text-foreground uppercase tracking-wider">{title}</h3>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

const DealDetail = () => {
  const { dealId } = useParams<{ dealId: string }>();
  const navigate = useNavigate();

  const deal = useMemo(() => findDeal(dealId || ""), [dealId]);
  const [stakesVersion, setStakesVersion] = useState(0);
  const pnl = useMemo(() => (deal ? computeDealPnL(deal) : null), [deal, stakesVersion]);

  const [status, setStatus] = useState<DealStatus>(deal?.status ?? "pending-details");
  const [ofCaseNumber, setOfCaseNumber] = useState(deal?.ofCaseNumber ?? "");
  const [latestNote, setLatestNote] = useState(deal?.latestNote ?? "");
  const [statusHistory, setStatusHistory] = useState(deal?.statusHistory ?? []);

  useEffect(() => {
    if (!deal) return;
    setStatus(deal.status);
    setOfCaseNumber(deal.ofCaseNumber ?? "");
    setLatestNote(deal.latestNote ?? "");
    setStatusHistory(deal.statusHistory ?? []);
  }, [deal]);

  const hasChanges = useMemo(() => {
    if (!deal) return false;
    return status !== deal.status || ofCaseNumber !== (deal.ofCaseNumber ?? "") || latestNote !== (deal.latestNote ?? "");
  }, [deal, status, ofCaseNumber, latestNote]);

  if (!deal) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-foreground mb-2">Deal not found</h1>
          <p className="text-muted-foreground mb-4">The deal "{dealId}" does not exist.</p>
          <button onClick={() => navigate("/deals")} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90">
            Back to Deals
          </button>
        </div>
      </div>
    );
  }

  const currency = deal.currency ?? "EUR";
  const isREBU = deal.businessUnit === "rebu";
  const isMBU = deal.businessUnit === "mortgage";
  const allowedTransitions = [status, ...getAllowedDealTransitions(status)];
  const stageDates = getStageDates({ ...deal, status, statusHistory });
  const currentIdx = getStageIndex(status);

  const handleStatusChange = (to: DealStatus) => {
    if (to === status) return;
    if (!canTransitionDealStatus(status, to)) {
      toast.error(`Cannot transition ${status} → ${to}`);
      return;
    }
    const entry = { from: status, to, timestamp: new Date().toISOString(), note: "Manual transition" };
    setStatus(to);
    setStatusHistory((prev) => [...prev, entry]);
  };

  const handleSave = () => {
    const updated: Deal = {
      ...deal,
      status,
      ofCaseNumber,
      latestNote,
      statusHistory,
    };
    updateDeal(updated);
    toast.success("Deal saved");
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-20 flex items-center justify-between px-6 h-14 bg-card border-b border-border">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/deals")} className="p-1.5 hover:bg-muted rounded transition-colors text-muted-foreground">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-base font-semibold text-foreground">{deal.id}</h1>
            <DealStatusBadge status={status} isDisputed={deal.isDisputed} />
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${isREBU ? "bg-blue-500/15 text-blue-700 dark:text-blue-400" : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"}`}>
              {deal.businessUnit?.toUpperCase()}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={status}
            onChange={(e) => handleStatusChange(e.target.value as DealStatus)}
            className="px-3 py-1.5 border border-border rounded-md text-[13px] bg-background focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {allowedTransitions.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <button
            onClick={handleSave}
            disabled={!hasChanges}
            className={`px-4 py-1.5 rounded-md text-[13px] font-semibold transition-opacity ${hasChanges ? "bg-primary text-primary-foreground hover:opacity-90" : "bg-muted text-muted-foreground cursor-not-allowed"}`}
          >
            Save
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5">
          {/* Left */}
          <div className="flex flex-col gap-5">

            {/* Deal Overview */}
            <SectionCard title="Deal Overview">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10">
                <div>
                  <ReadRow label="Deal ID" value={deal.id} />
                  <ReadRow label="Type" value={deal.type} />
                  <ReadRow label="Market" value={deal.market} />
                  <ReadRow label="Country" value={deal.country?.toUpperCase()} />
                  <ReadRow label="Currency" value={deal.currency} />
                  <ReadRow label="Report Date" value={deal.reportDate ? formatDate(deal.reportDate) : "—"} />
                  <ReadRow label="Created" value={deal.createdAt ? formatDate(deal.createdAt) : "—"} />
                </div>
                <div>
                  <ReadRow label="Opportunity">
                    {deal.opportunityName ? (
                      <button
                        onClick={() => navigate(`/opportunities`)}
                        className="flex items-center gap-1 text-primary hover:underline text-[13px] font-medium"
                      >
                        {deal.opportunityName}
                        <ExternalLink className="h-3 w-3" />
                      </button>
                    ) : "—"}
                  </ReadRow>
                  <ReadRow label="Client" value={deal.clientName ?? "—"} />
                  <ReadRow label="Channel" value={deal.channel ?? "—"} />
                  <ReadRow label="OF / Case No.">
                    <input
                      type="text"
                      value={ofCaseNumber}
                      onChange={(e) => setOfCaseNumber(e.target.value)}
                      placeholder="Enter case number"
                      className="w-full px-2 py-1 border border-border rounded text-[13px] bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </ReadRow>
                </div>
              </div>
            </SectionCard>

            {/* Stakeholders */}
            <SectionCard title="Stakeholders">
              <StakeholdersPanel
                dealId={deal.id}
                currency={currency}
                pnl={pnl}
                onChanged={() => setStakesVersion((v) => v + 1)}
              />
            </SectionCard>

            {/* P&L Waterfall */}
            <SectionCard title="P&L Waterfall">
              {pnl ? (
                <div className="max-w-lg">
                  {/* Deal Amount → commission derivation */}
                  {(deal.dealPrice ?? deal.dealAmount) > 0 && deal.takeRate != null && (
                    <div className="pb-1">
                      <div className="flex items-center justify-between py-2">
                        <span className="text-[13px] text-muted-foreground font-medium">Deal Amount</span>
                        <span className="text-[13px] text-foreground font-semibold tabular-nums">{fmt(deal.dealPrice ?? deal.dealAmount, currency)}</span>
                      </div>
                      <div className="flex items-center justify-between py-1 pl-4">
                        <span className="text-[12px] text-muted-foreground">× Commission rate</span>
                        <span className="text-[12px] text-muted-foreground tabular-nums">{deal.takeRate}%</span>
                      </div>
                      <div className="border-t border-dashed border-border/60 my-2" />
                    </div>
                  )}
                  {/* Gross Revenue anchor */}
                  <LedgerAnchor label="Gross Revenue" amount={pnl.grossRevenue} currency={currency} />
                  {/* Per-payer sub-lines (when stakeholders carry financialAmount > 0) */}
                  {pnl.ledger
                    .filter((e) => e.side === "CREDIT" && !e.id.includes("::net") && e.partyId)
                    .map((e) => <LedgerLine key={e.id} entry={e} currency={currency} indent />)}
                  {/* Bucket A, C, D debits */}
                  {pnl.ledger
                    .filter((e) => e.side === "DEBIT" && e.bucket !== "B")
                    .map((e) => <LedgerLine key={e.id} entry={e} currency={currency} />)}
                  {/* Net Revenue anchor */}
                  <div className="border-t border-border my-2" />
                  <LedgerAnchor label="Net Revenue" amount={pnl.netRevenue} currency={currency} />
                  {/* Bucket B: agent + TL + manager payouts */}
                  {pnl.ledger
                    .filter((e) => e.side === "DEBIT" && e.bucket === "B")
                    .map((e) => <LedgerLine key={e.id} entry={e} currency={currency} />)}
                  {/* Huspy Margin */}
                  <div className="border-t border-border my-2" />
                  <div className="flex items-center justify-between py-2">
                    <span className="text-[13px] font-semibold text-foreground">Huspy Margin</span>
                    <span className="text-[14px] font-bold text-emerald-600 tabular-nums">{fmt(pnl.huspyMargin, currency)}</span>
                  </div>
                  {pnl.grossRevenue > 0 && (
                    <div className="flex items-center justify-between pl-4 pb-1">
                      <span className="text-[12px] text-muted-foreground">Margin %</span>
                      <span className="text-[12px] text-muted-foreground tabular-nums">
                        {((pnl.huspyMargin / pnl.grossRevenue) * 100).toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-[13px] text-muted-foreground italic">
                  {isMBU ? "P&L waterfall not available for MBU deals." : "Engine input incomplete — P&L cannot be projected."}
                </p>
              )}
            </SectionCard>

            {/* Dispute */}
            {deal.isDisputed && deal.disputeNote && (
              <SectionCard title="Dispute">
                <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                  <p className="text-[13px] text-foreground">{deal.disputeNote}</p>
                </div>
              </SectionCard>
            )}

            {/* Comments */}
            <SectionCard title="Notes">
              <textarea
                placeholder="Add a note..."
                value={latestNote}
                onChange={(e) => setLatestNote(e.target.value)}
                className="w-full px-3 py-2.5 border border-border rounded-md text-[13px] bg-background placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-ring resize-none h-24"
              />
            </SectionCard>
          </div>

          {/* Right sidebar: Deal Progress */}
          <div className="flex flex-col gap-5">
            <SectionCard title="Deal Progress">
              <div className="relative pl-4">
                {STAGE_ORDER.map((stage, i) => {
                  const completed = i <= currentIdx;
                  const isCurrent = i === currentIdx;
                  const dateStr = stageDates[stage.key];

                  return (
                    <div key={stage.key} className="relative flex items-start gap-3 pb-5 last:pb-0">
                      {i < STAGE_ORDER.length - 1 && (
                        <div className={`absolute left-[9px] top-[24px] w-[2px] h-[calc(100%-14px)] ${i < currentIdx ? "bg-[hsl(var(--deal-paid))]" : "bg-border"}`} />
                      )}
                      <div className="relative z-10 shrink-0 bg-card rounded-full">
                        {completed ? <CheckCircle2 className="h-5 w-5 text-[hsl(var(--deal-paid))]" /> : <Circle className="h-5 w-5 text-muted-foreground/30" />}
                      </div>
                      <div className="flex-1 -mt-0.5">
                        <p className={`text-[13px] font-medium ${isCurrent ? "text-foreground" : completed ? "text-[hsl(var(--deal-paid))]" : "text-muted-foreground/50"}`}>
                          {stage.label}
                        </p>
                        {dateStr
                          ? <p className="text-[11px] text-muted-foreground mt-0.5">{formatDateTime(dateStr)}</p>
                          : !completed && <p className="text-[11px] text-muted-foreground/40 mt-0.5">Pending</p>}
                      </div>
                    </div>
                  );
                })}

                {statusHistory.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-border">
                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">History</p>
                    {statusHistory.map((entry, i) => (
                      <div key={i} className="flex items-start gap-2 py-1">
                        <span className="text-[11px] text-muted-foreground shrink-0 w-[110px]">{formatDateTime(entry.timestamp)}</span>
                        <span className="text-[11px] text-foreground">{entry.from} → {entry.to}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </SectionCard>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DealDetail;

// ─── Waterfall sub-components ────────────────────────────────────────────────

function resolvePartyName(partyId: string): string {
  return sharedParties.find((p) => p.id === partyId)?.displayName ?? partyId;
}

function resolvePartyIdentifier(partyId: string): string | undefined {
  const agent = sharedAgents.find((a) => a.partyId === partyId);
  if (agent) return agent.id;
  return sharedParties.find((p) => p.id === partyId)?.taxId;
}

function LedgerAnchor({ label, amount, currency }: { label: string; amount: number; currency: string }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-[13px] font-semibold text-foreground">{label}</span>
      <span className="text-[14px] font-bold text-foreground tabular-nums">{fmt(amount, currency)}</span>
    </div>
  );
}

function LedgerLine({ entry, currency, indent = false }: { entry: LedgerEntry; currency: string; indent?: boolean }) {
  const partyName = entry.partyId ? resolvePartyName(entry.partyId) : null;
  const identifier = entry.partyId ? resolvePartyIdentifier(entry.partyId) : null;
  const isCredit = entry.side === "CREDIT";

  return (
    <div className={`flex items-center justify-between py-1.5 ${indent ? "pl-4" : "pl-3"}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[13px] text-muted-foreground">{partyName ?? entry.label}</span>
          {partyName && entry.label !== partyName && (
            <span className="text-[11px] text-muted-foreground/60">· {entry.label}</span>
          )}
          {identifier && (
            <code className="text-[11px] font-mono text-foreground/50">{identifier}</code>
          )}
        </div>
      </div>
      <span className={`text-[13px] font-semibold tabular-nums shrink-0 ml-4 ${isCredit ? "text-emerald-600" : "text-orange-500"}`}>
        {isCredit ? "+" : "−"}{fmt(entry.amount, currency)}
      </span>
    </div>
  );
}
