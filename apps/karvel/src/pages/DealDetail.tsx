import { useState, useMemo, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { findDeal } from "@/data/dealStore";
import { getTranchesForDeal, updateTranche, addTranche } from "@/data/trancheStore";
import { saveDocumentRequirements } from "@/data/sharedEntityStore";
import { Tranche, DealStatus } from "@/data/types";
import {
  ArrowRight,
  Ban,
  Check,
  CheckCircle2,
  Circle,
  Clock,
  ExternalLink,
  Download,
  AlertTriangle,
  CheckCheck,
  Lock,
  MessageSquare,
  MoreHorizontal,
  Undo2,
  ChevronDown,
  Plus,
} from "lucide-react";
import {
  getDealEngine,
  fireCommissionAccrualOnTransition,
  confirmTrancheStakeholders,
} from "@/lib/dealCalculations";
import { toast } from "sonner";
import { useCurrentUser } from "@/contexts/UserContext";
import {
  canTransitionDealStatus,
  getBlueprint,
  sharedInvoices,
  sharedParties,
  sharedDealComments,
  sharedDealDocumentRequirements,
  sharedPnlEntries,
  sharedDealParticipants,
  sharedDocumentRequirementTemplates,
  sharedPostings,
  sharedPostingLines,
  sharedLedgers,
  statusTier,
  type InvoiceStatus,
  type DocumentRequirementStatus,
  type DealDocumentRequirement,
} from "@huspy/shared-domain";
import { dealStatusLabel } from "@/lib/labels";
import { PnLWaterfall } from "@/components/PnLWaterfall";
import { PostingDetailDialog } from "@/components/PostingDetailDialog";
import { DealHeader } from "@/components/DealHeader";
import { CancelDealDialog } from "@/components/CancelDealDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  computeDealReadiness,
  type DealReadiness,
  type ReadinessAction,
} from "@/lib/dealReadiness";

const ALL_STAGES: { key: DealStatus; label: string }[] = [
  { key: "pending-details",        label: "Pending details" },
  { key: "under-review",           label: "Under review" },
  { key: "pending-agent-approval", label: "Agent approval" },
  { key: "invoicing",              label: "Invoicing" },
  { key: "finalized",              label: "Finalized" },
  { key: "canceled",               label: "Canceled" },
];
const FORWARD_ORDER: DealStatus[] = [
  "pending-details", "under-review", "pending-agent-approval", "invoicing", "finalized",
];

function getStageDates(tranche: Tranche): Record<string, string | null> {
  const dates: Record<string, string | null> = {};
  ALL_STAGES.forEach((s) => { dates[s.key] = null; });
  dates["pending-details"] = tranche.createdAt ?? null;
  dates["under-review"] = tranche.reportDate ? new Date(tranche.reportDate).toISOString() : null;
  if (tranche.statusHistory) {
    for (const entry of tranche.statusHistory) {
      if (entry.to in dates && dates[entry.to] === null) dates[entry.to] = entry.timestamp;
    }
  }
  return dates;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true,
  });
}
function formatSavedAt(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
function fmt(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}

function ReadRow({ label, value, children }: { label: string; value?: string | React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="flex items-center py-2 min-w-0 border-b border-border/40 last:border-0">
      <span className="w-[160px] text-[12px] text-muted-foreground shrink-0 font-medium">{label}</span>
      <span className="text-[13px] text-foreground font-medium truncate">{children ?? value ?? "—"}</span>
    </div>
  );
}

function SectionCard({ id, title, children, className = "", collapsible = false, defaultOpen = true }: {
  id?: string; title: string; children: React.ReactNode; className?: string; collapsible?: boolean; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div id={id} className={`scroll-mt-32 ${className}`}>
      <div
        className={`flex items-center justify-between py-2 ${collapsible ? "cursor-pointer select-none" : ""}`}
        onClick={collapsible ? () => setOpen((o) => !o) : undefined}
      >
        <h3 className="text-[13px] font-semibold text-foreground">{title}</h3>
        {collapsible && <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-150 ${open ? "" : "-rotate-90"}`} />}
      </div>
      <div className="h-px bg-border mb-4" />
      {(!collapsible || open) && <div>{children}</div>}
    </div>
  );
}

const TIER_PILL: Record<string, string> = {
  success: "bg-tier-success-bg text-tier-success",
  info:    "bg-tier-info-bg text-tier-info",
  warning: "bg-tier-warning-bg text-tier-warning",
  danger:  "bg-tier-danger-bg text-tier-danger",
  neutral: "bg-tier-neutral-bg text-tier-neutral",
};

function TrancheTabs({ tranches, activeId, onSelect, canAdd, onAdd }: {
  tranches: Tranche[]; activeId: string; onSelect: (id: string) => void; canAdd: boolean; onAdd: () => void;
}) {
  return (
    /* Tab bar sits at the top of the white card. Active tab uses -mb-px to visually
       connect (no bottom border) to the white card body below. */
    <div className="relative flex items-end gap-1 px-4 pt-3 pb-0 border-b border-border">
      {tranches.map((t) => {
        const active = t.id === activeId;
        return (
          <button
            key={t.id}
            onClick={() => onSelect(t.id)}
            className={`relative px-4 py-2 text-[13px] font-medium transition-colors rounded-t-xl ${
              active
                ? "bg-card text-foreground border border-border border-b-card -mb-px z-10"
                : "bg-background text-muted-foreground hover:text-foreground rounded-t-md"
            }`}
          >
            {t.label ?? (tranches.length === 1 ? "Single tranche" : `Tranche ${t.index + 1}`)}
            <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded-full ${TIER_PILL[statusTier(t.status)]}`}>
              {dealStatusLabel[t.status]}
            </span>
          </button>
        );
      })}
      {canAdd && (
        <button onClick={onAdd} className="ml-1 flex items-center gap-1 px-3 py-2 text-[12px] font-medium text-muted-foreground hover:text-foreground transition-colors">
          <Plus className="h-3.5 w-3.5" /> Add tranche
        </button>
      )}
    </div>
  );
}

const MODE_PALETTE: Record<DealReadiness["mode"], { bg: string; text: string; icon: typeof Check }> = {
  blocked:  { bg: "bg-tier-warning-bg", text: "text-tier-warning", icon: AlertTriangle },
  ready:    { bg: "bg-tier-success-bg", text: "text-tier-success", icon: Check },
  waiting:  { bg: "bg-tier-info-bg",    text: "text-tier-info",    icon: Clock },
  locked:   { bg: "bg-muted",           text: "text-foreground",   icon: Lock },
  terminal: { bg: "bg-tier-success-bg", text: "text-tier-success", icon: Check },
  canceled: { bg: "bg-tier-danger-bg",  text: "text-tier-danger",  icon: Ban },
};

function TrancheContextBar({
  readiness,
  onTransition,
  savedAt,
  onCancel,
}: {
  readiness: DealReadiness;
  onTransition: (to: DealReadiness["primary"] extends infer A ? A extends { to: infer T } ? T : never : never, opts?: { reason?: string }) => void;
  savedAt?: string;
  onCancel?: () => void;
}) {
  const palette = MODE_PALETTE[readiness.mode];
  const Icon = palette.icon;
  const primary = readiness.primary;
  const primaryEnabled = primary ? (readiness.mode === "ready" || readiness.mode === "waiting") : false;

  const fireAction = (action: ReadinessAction) => (onTransition as (to: typeof action.to, opts?: { reason?: string }) => void)(action.to);

  const scrollTo = (targetId: string) => {
    const el = document.getElementById(targetId);
    if (!el) return;
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 80, behavior: "smooth" });
  };

  return (
    <div className={`flex items-start justify-between gap-4 px-6 py-3 border-b border-border ${palette.bg}`}>
      {/* Readiness info */}
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 bg-white/60 ${palette.text}`}>
          <Icon className="h-3.5 w-3.5" strokeWidth={2} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2.5 flex-wrap">
            <span className={`text-[13px] font-semibold ${palette.text}`}>{readiness.headline}</span>
            {readiness.sub && (
              <span className="text-[12px] text-muted-foreground">{readiness.sub}</span>
            )}
          </div>
          {readiness.items.length > 0 && (
            <div className="mt-1.5 flex flex-col gap-1">
              {readiness.items.map((it, i) => (
                <div key={i} className="flex items-center gap-2 text-[12px]">
                  <span className="w-3 flex items-center justify-center">
                    {it.done
                      ? <Check className="h-3 w-3 text-tier-success" strokeWidth={2.5} />
                      : <Circle className="h-3 w-3 text-muted-foreground/40" />}
                  </span>
                  <span className={it.done ? "flex-1 text-muted-foreground line-through decoration-muted-foreground/40" : "flex-1 text-foreground"}>
                    {it.label}
                  </span>
                  {it.cta && (
                    <button onClick={() => scrollTo(it.cta!.targetId)} className="text-[11px] text-primary font-medium hover:underline inline-flex items-center gap-0.5">
                      {it.cta.label} <ArrowRight className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Action buttons + saved indicator */}
      <div className="flex items-center gap-2 shrink-0">
        {savedAt && (
          <span className="hidden md:inline-flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium">
            <Check className="h-3 w-3 text-muted-foreground/60" strokeWidth={2.5} />
            Saved · {savedAt}
          </span>
        )}
        {readiness.secondary && (
          <button
            onClick={() => fireAction(readiness.secondary!)}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-[13px] font-semibold border border-border bg-card text-foreground hover:bg-muted transition-colors"
          >
            {readiness.secondary.icon === "undo" && <Undo2 className="h-3.5 w-3.5" />}
            {readiness.secondary.icon === "msg"  && <MessageSquare className="h-3.5 w-3.5" />}
            {readiness.secondary.label}
          </button>
        )}
        {primary && (
          <button
            onClick={() => fireAction(primary)}
            disabled={!primaryEnabled}
            title={primaryEnabled ? undefined : readiness.disabledReason}
            className={`inline-flex items-center gap-1.5 h-8 px-3.5 rounded-md text-[13px] font-semibold transition-opacity ${
              primaryEnabled
                ? "bg-primary text-primary-foreground hover:opacity-90"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            }`}
          >
            {primary.label}
            {primaryEnabled && <ArrowRight className="h-3.5 w-3.5" />}
          </button>
        )}
        {onCancel && readiness.mode !== "terminal" && readiness.mode !== "canceled" && (
          <DropdownMenu>
            <DropdownMenuTrigger className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-border bg-card text-muted-foreground hover:bg-muted transition-colors shrink-0">
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={onCancel} className="text-destructive focus:text-destructive cursor-pointer">
                <Ban className="h-3.5 w-3.5 mr-2" />
                Cancel tranche…
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}

function DealDetailsCard({ deal, amountLabel, demandName, demandPartyId, supplyName, onNavigate }: {
  deal: NonNullable<ReturnType<typeof findDeal>>;
  amountLabel: string;
  demandName: string;
  demandPartyId: string | undefined;
  supplyName: string;
  onNavigate: ReturnType<typeof useNavigate>;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div className="bg-card border border-border rounded-2xl shadow-sm p-6">
      <div
        className="flex items-center justify-between pb-3 cursor-pointer select-none"
        onClick={() => setOpen((o) => !o)}
      >
        <h2 className="text-[13px] font-semibold text-foreground">Deal details</h2>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-150 ${open ? "" : "-rotate-90"}`} />
      </div>
      <div className="h-px bg-border mb-4" />
      {open && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10">
          {/* Col 1: Asset, Demand, Supply, Business unit */}
          <div>
            <ReadRow label="Asset" value={deal.title ?? "—"} />
            <ReadRow label="Demand">
              {demandPartyId ? (
                <button onClick={() => onNavigate("/clients")} className="text-primary hover:underline font-medium text-[13px]">
                  {demandName}
                </button>
              ) : <span className="text-[13px] text-foreground font-medium">{demandName || "—"}</span>}
            </ReadRow>
            <ReadRow label="Supply" value={supplyName || "—"} />
            <ReadRow label="Business unit" value={deal.businessUnit?.toUpperCase() ?? "—"} />
          </div>
          {/* Col 2: Country, Market, Channel, Amount */}
          <div>
            <ReadRow label="Country" value={deal.country?.toUpperCase() ?? "—"} />
            <ReadRow label="Market" value={deal.market ?? "—"} />
            <ReadRow label="Channel" value={deal.channel ?? "—"} />
            <ReadRow label="Amount" value={amountLabel} />
          </div>
          {/* Col 3: Deal ID, Description, Offer ID, Created */}
          <div>
            <ReadRow label="Deal ID" value={deal.id} />
            <ReadRow label="Description" value={deal.description ?? "—"} />
            <ReadRow label="Offer ID" value={deal.offerId ?? "—"} />
            <ReadRow label="Created" value={deal.createdAt ? formatDate(deal.createdAt) : "—"} />
          </div>
        </div>
      )}
    </div>
  );
}

const DealDetail = () => {
  const { dealId } = useParams<{ dealId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentUser } = useCurrentUser();

  const deal = useMemo(() => findDeal(dealId || ""), [dealId]);
  const tranches = useMemo(() => getTranchesForDeal(dealId || ""), [dealId]);

  const activeTranche = useMemo(() => {
    const paramId = searchParams.get("tranche");
    if (paramId) { const found = tranches.find((t) => t.id === paramId); if (found) return found; }
    return tranches[0];
  }, [tranches, searchParams]);

  const [stakesVersion, setStakesVersion] = useState(0);
  const [status, setStatus] = useState<DealStatus>(activeTranche?.status ?? "pending-details");
  const [statusHistory, setStatusHistory] = useState(activeTranche?.statusHistory ?? []);
  const [invoicesVersion, setInvoicesVersion] = useState(0);
  const [postingsVersion, setPostingsVersion] = useState(0);
  const [docs, setDocs] = useState<DealDocumentRequirement[]>(() =>
    sharedDealDocumentRequirements.filter((r) => r.trancheId === (activeTranche?.id ?? ""))
  );

  useEffect(() => {
    if (!activeTranche) return;
    setStatus(activeTranche.status);
    setStatusHistory(activeTranche.statusHistory ?? []);
    setDocs(sharedDealDocumentRequirements.filter((r) => r.trancheId === activeTranche.id));
    setPnlHasChanges(false);
    setPnlPendingApproval(false);
  }, [activeTranche?.id]);

  // ── Add tranche modal ─────────────────────────────────────────────────────
  const [addTrancheOpen, setAddTrancheOpen] = useState(false);
  const [addTrancheLabel, setAddTrancheLabel] = useState("");
  const [addTrancheEngine, setAddTrancheEngine] = useState<string>("");
  const [addTrancheAmountStr, setAddTrancheAmountStr] = useState("");
  const [addTrancheMoveCosts, setAddTrancheMoveCosts] = useState(false);

  // Derive gross revenue for a tranche from its REVENUE_SOURCE stakes.
  const trancheGrossRevenue = (trancheId: string) =>
    sharedPnlEntries
      .filter((s) => s.trancheId === trancheId && s.role === "REVENUE_SOURCE" && (s.amount ?? 0) > 0)
      .reduce((sum, s) => sum + Math.abs(s.amount ?? 0), 0);

  const handleAddTranche = () => {
    if (!deal || !activeTranche) return;
    if (!addTrancheLabel.trim()) return;
    const engine = (addTrancheEngine || activeTranche.pnlEngine || "rebu") as import("@huspy/shared-domain").PnlEngine;
    const splitAmount = parseFloat(addTrancheAmountStr) || 0;
    const isSplit = engine !== "manual" && splitAmount > 0;

    const now = new Date().toISOString();
    const newId = `tranche-${String(Date.now()).slice(-8)}`;

    if (isSplit) {
      const originRevenue = trancheGrossRevenue(activeTranche.id);
      if (splitAmount >= originRevenue) return;
      const remainingRevenue = originRevenue - splitAmount;

      const sourceStakes = sharedPnlEntries.filter((s) => s.trancheId === activeTranche.id);
      const originRevStake = sourceStakes.find((s) => s.role === "REVENUE_SOURCE");
      if (originRevStake) originRevStake.amount = remainingRevenue;

      const costRoles = new Set(["ACQUISITION_DEDUCTION", "OPERATIONAL_DEDUCTION"]);
      const costStakesToMove = addTrancheMoveCosts ? sourceStakes.filter((s) => costRoles.has(s.role)) : [];
      if (costStakesToMove.length > 0) {
        const idsToRemove = new Set(costStakesToMove.map((s) => s.id));
        sharedPnlEntries.splice(0, sharedPnlEntries.length,
          ...sharedPnlEntries.filter((s) => !idsToRemove.has(s.id)));
      }

      updateTranche({ ...activeTranche, updatedAt: now });

      const freshSourceStakes = sharedPnlEntries.filter((s) => s.trancheId === activeTranche.id);
      freshSourceStakes.filter((s) => s.role === "AGENT_PAYOUT").forEach((s, i) => {
        sharedPnlEntries.push({ ...s, id: `ds-${newId}-copy-${i}`, trancheId: newId, amount: undefined, source: "engine", status: "draft" });
      });
      sharedPnlEntries.push({
        id: `ds-${newId}-rev`, trancheId: newId,
        partyId: originRevStake?.partyId ?? "party-client-001",
        role: "REVENUE_SOURCE", amount: splitAmount, source: "manual", status: "draft",
      });
      costStakesToMove.forEach((s, i) => {
        sharedPnlEntries.push({ ...s, id: `ds-${newId}-cost-${i}`, trancheId: newId });
      });
      toast.success(`Tranche "${addTrancheLabel}" created — origin reduced to ${remainingRevenue} ${deal.currency}`);
    } else {
      toast.success(`Tranche "${addTrancheLabel}" created — add revenue and payouts in the P&L waterfall`);
    }

    sharedDocumentRequirementTemplates
      .filter((t) => t.market === deal.market && t.businessUnit === deal.businessUnit && t.country === deal.country)
      .forEach((t, i) => {
        sharedDealDocumentRequirements.push({ id: `ddr-${newId}-${i}`, trancheId: newId, label: t.label, required: t.required, status: "pending" });
      });

    addTranche({
      id: newId, dealId: deal.id, label: addTrancheLabel.trim(), index: tranches.length,
      status: "pending-details",
      reportDate: activeTranche.reportDate,
      pnlEngine: engine,
      blueprintId: activeTranche.blueprintId, createdAt: now, updatedAt: now,
    });
    setAddTrancheOpen(false); setAddTrancheLabel(""); setAddTrancheEngine(""); setAddTrancheAmountStr(""); setAddTrancheMoveCosts(false);
    setSearchParams({ tranche: newId });
  };

  // ── P&L change tracking ────────────────────────────────────────────────────
  const [pnlHasChanges, setPnlHasChanges] = useState(false);
  const [pnlPendingApproval, setPnlPendingApproval] = useState(false);
  const stakesSnapshot = useRef<typeof sharedPnlEntries[0][]>([]);

  const handleWaterfallChanged = () => {
    if (!pnlHasChanges && !pnlPendingApproval && activeTranche) {
      stakesSnapshot.current = sharedPnlEntries.filter((s) => s.trancheId === activeTranche.id).map((s) => ({ ...s }));
    }
    setPnlHasChanges(true); setStakesVersion((v) => v + 1);
  };
  const handleSubmitPnLForApproval = () => { setPnlHasChanges(false); setPnlPendingApproval(true); };
  const handleDiscardPnLChanges = () => {
    if (!activeTranche) return;
    sharedPnlEntries.filter((s) => s.trancheId === activeTranche.id).forEach((s) => {
      const idx = sharedPnlEntries.indexOf(s); if (idx !== -1) sharedPnlEntries.splice(idx, 1);
    });
    stakesSnapshot.current.forEach((s) => sharedPnlEntries.push({ ...s }));
    stakesSnapshot.current = []; setPnlHasChanges(false); setStakesVersion((v) => v + 1);
    toast.info("P&L changes discarded");
  };
  const handleApprovePnL = () => { setPnlPendingApproval(false); stakesSnapshot.current = []; toast.success("P&L changes approved"); };
  const handleRejectPnL = () => {
    if (!activeTranche) return;
    sharedPnlEntries.filter((s) => s.trancheId === activeTranche.id).forEach((s) => {
      const idx = sharedPnlEntries.indexOf(s); if (idx !== -1) sharedPnlEntries.splice(idx, 1);
    });
    stakesSnapshot.current.forEach((s) => sharedPnlEntries.push({ ...s }));
    stakesSnapshot.current = []; setPnlPendingApproval(false); setStakesVersion((v) => v + 1);
    toast.info("P&L changes rejected — reverted to previous state");
  };

  // ── Derived values ─────────────────────────────────────────────────────────
  const { demandName, demandPartyId, supplyName, amountLabel } = useMemo(() => {
    if (!deal || !activeTranche) return { demandName: "—", demandPartyId: undefined, supplyName: "—", amountLabel: "—" };
    const demandParticipant = sharedDealParticipants.find((p) => p.dealId === deal.id && p.role === "DEMAND");
    const resolveParticipant = (role: "DEMAND" | "SUPPLY") =>
      sharedDealParticipants.filter((p) => p.dealId === deal.id && p.role === role)
        .map((p) => sharedParties.find((party) => party.id === p.partyId)?.displayName).filter(Boolean).join(", ") || "—";
    const currency = deal.currency ?? "EUR";
    return {
      demandName:    resolveParticipant("DEMAND"),
      demandPartyId: demandParticipant?.partyId,
      supplyName:    resolveParticipant("SUPPLY"),
      amountLabel:   deal.dealAmount > 0 ? fmt(deal.dealAmount, currency) : "—",
    };
  }, [deal, activeTranche, stakesVersion]);

  const savedAt = useMemo(() => {
    const lastEntry = statusHistory.length > 0 ? statusHistory[statusHistory.length - 1].timestamp : activeTranche?.createdAt;
    return lastEntry ? formatSavedAt(lastEntry) : undefined;
  }, [statusHistory, activeTranche?.createdAt]);

  if (!deal || !activeTranche) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-foreground mb-2">Deal not found</h1>
          <p className="text-muted-foreground mb-4">The deal "{dealId}" does not exist.</p>
          <button onClick={() => navigate("/deals")} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90">Back to Deals</button>
        </div>
      </div>
    );
  }

  const currency = deal.currency ?? "EUR";
  const stageDates = getStageDates({ ...activeTranche, status, statusHistory });
  const isSentBack = status === "pending-details";
  const isCanceled = status === "canceled";
  const currentForwardIdx = isCanceled ? FORWARD_ORDER.length : FORWARD_ORDER.indexOf(status);
  const canEditOps = (status === "pending-details" || status === "under-review") && !pnlPendingApproval;

  const handleStatusChange = (to: DealStatus, opts?: { reason?: string }) => {
    if (to === status) return;
    if (!canTransitionDealStatus(status, to)) { toast.error(`Cannot transition ${status} → ${to}`); return; }
    if (status === "under-review" && to === "pending-agent-approval") {
      if (pnlPendingApproval) { toast.error("Cannot advance: P&L changes are awaiting Senior Ops approval."); return; }
      const allClear = docs.every((r) => r.status === "approved" || r.status === "waived");
      if (!allClear) { toast.error("Cannot move to Agent Approval: all documents must be approved or waived first."); return; }
    }
    if (to === "invoicing") confirmTrancheStakeholders(activeTranche, deal);

    if (to === "invoicing") {
      const blueprint = getBlueprint(deal.country, deal.businessUnit);
      const billableStakes = sharedPnlEntries.filter((s) =>
        s.trancheId === activeTranche.id && s.role !== "AGENT_PAYOUT" && s.amount != null && s.amount !== 0 &&
        !((s.role === "ACQUISITION_DEDUCTION" || s.role === "OPERATIONAL_DEDUCTION") && sharedLedgers.some((l) => l.partyId === s.partyId))
      );
      const now = new Date().toISOString();
      const today = now.slice(0, 10);
      const dueDate = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
      const country = (deal.country ?? "XX").toUpperCase();
      const invCurrency = deal.currency ?? "EUR";
      let invIdx = 0;

      const revenueStakesByParty = new Map<string, typeof billableStakes>();
      const nonRevenueStakes: typeof billableStakes = [];
      billableStakes.forEach((s) => {
        if (s.role === "REVENUE_SOURCE") { if (!revenueStakesByParty.has(s.partyId)) revenueStakesByParty.set(s.partyId, []); revenueStakesByParty.get(s.partyId)!.push(s); }
        else nonRevenueStakes.push(s);
      });
      revenueStakesByParty.forEach((stakes) => {
        const subtotal = stakes.reduce((sum, s) => sum + Math.abs(s.amount!), 0);
        const vatAmount = blueprint.taxRate ? Math.round(subtotal * blueprint.taxRate) / 100 : undefined;
        sharedInvoices.push({ id: `inv-auto-${activeTranche.id}-rev-${invIdx}-${Date.now()}`, direction: "outbound" as const, partyId: stakes[0].partyId, trancheId: activeTranche.id, invoiceNumber: `INV-${country}-${String(sharedInvoices.length + invIdx + 1).padStart(3, "0")}`, status: "draft" as const, subtotal, vatAmount, currency: invCurrency, issueDate: today, dueDate, createdAt: now, updatedAt: now });
        invIdx++;
      });
      nonRevenueStakes.forEach((s) => {
        const subtotal = Math.abs(s.amount!);
        const vatAmount = blueprint.taxRate ? Math.round(subtotal * blueprint.taxRate) / 100 : undefined;
        sharedInvoices.push({ id: `inv-auto-${activeTranche.id}-cost-${invIdx}-${Date.now()}`, direction: "inbound" as const, partyId: s.partyId, trancheId: activeTranche.id, invoiceNumber: `INV-${country}-${String(sharedInvoices.length + invIdx + 1).padStart(3, "0")}`, status: "draft" as const, subtotal, vatAmount, currency: invCurrency, issueDate: today, dueDate, createdAt: now, updatedAt: now });
        invIdx++;
      });
      if (invIdx > 0) setInvoicesVersion((v) => v + 1);
    }

    const note = opts?.reason ? `Canceled: ${opts.reason}` : "Manual transition";
    const entry = { from: status, to, timestamp: new Date().toISOString(), note };
    const nextHistory = [...statusHistory, entry];
    setStatus(to); setStatusHistory(nextHistory);
    updateTranche({ ...activeTranche, status: to, statusHistory: nextHistory });
    fireCommissionAccrualOnTransition(activeTranche, deal, to);
    setPostingsVersion((v) => v + 1);
    if (to === "canceled") toast.success("Tranche canceled");
    else if (to === "pending-details") toast.success("Sent back to agent");
    else toast.success(`Moved to ${dealStatusLabel[to]}`);
  };

  const [cancelOpen, setCancelOpen] = useState(false);
  const canCancel = status !== "finalized" && status !== "canceled";
  const readiness = computeDealReadiness({
    deal: { ...deal, status, statusHistory } as any,
    status, docs, pnlPendingApproval, pnlHasChanges,
  });

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-background">
      <DealHeader deal={deal} />

      <div className="flex-1 overflow-auto px-6 py-6 space-y-4">
        {/* ── Deal identity card — deal-scoped fields, always visible above the tabs ── */}
        <DealDetailsCard
          deal={deal}
          amountLabel={amountLabel}
          demandName={demandName}
          demandPartyId={demandPartyId}
          supplyName={supplyName}
          onNavigate={navigate}
        />

        {/* ── White tranche workspace — tabs + context bar + per-tranche body ── */}
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          <TrancheTabs tranches={tranches} activeId={activeTranche.id}
            onSelect={(id) => setSearchParams({ tranche: id })}
            canAdd={status === "under-review"}
            onAdd={() => { setAddTrancheLabel("Escritura"); setAddTrancheAmountStr(String(Math.round(trancheGrossRevenue(activeTranche.id) / 2))); setAddTrancheOpen(true); }} />

          <TrancheContextBar readiness={readiness} onTransition={handleStatusChange} savedAt={savedAt} onCancel={canCancel ? () => setCancelOpen(true) : undefined} />

          <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5">
          <div className="flex flex-col gap-5">
            <SectionCard title="Tranche details" collapsible defaultOpen={true}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10">
                <div>
                  <ReadRow label="Tranche ID" value={activeTranche.id} />
                  <ReadRow label="Report date" value={activeTranche.reportDate ? formatDate(activeTranche.reportDate) : "—"} />
                  <ReadRow label="P&L engine" value={getDealEngine(deal, activeTranche)} />
                </div>
                <div>
                  <ReadRow label="Blueprint" value={activeTranche.blueprintId ?? "—"} />
                  {activeTranche.disbursedAmount != null && (
                    <ReadRow label="Disbursed" value={`${deal.currency ?? ""} ${fmt(activeTranche.disbursedAmount, deal.currency ?? "EUR")}`} />
                  )}
                  <ReadRow label="Created" value={activeTranche.createdAt ? formatDate(activeTranche.createdAt) : "—"} />
                </div>
              </div>
            </SectionCard>

            <SectionCard id="pnl" title={pnlPendingApproval ? "P&L — Pending Approval" : pnlHasChanges ? "P&L — Unsaved Changes" : "P&L"} collapsible>
              {pnlHasChanges && !pnlPendingApproval && (
                <div className="flex items-center justify-between mb-4 px-3 py-2.5 rounded-md bg-tier-warning-bg">
                  <div className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-tier-warning shrink-0" /><p className="text-[13px] font-semibold text-foreground">P&L has unsaved changes</p></div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={handleDiscardPnLChanges} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-[12px] font-medium text-muted-foreground hover:text-destructive hover:border-destructive transition-colors"><Undo2 className="h-3.5 w-3.5" /> Discard</button>
                    <button onClick={handleSubmitPnLForApproval} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-[12px] font-semibold hover:opacity-90 transition-opacity">Submit for approval</button>
                  </div>
                </div>
              )}
              {pnlPendingApproval && (
                <div className={`flex items-center justify-between mb-4 px-3 py-2.5 rounded-md ${currentUser.role === "finance_lead" ? "bg-tier-warning-bg" : "bg-muted/40 border border-border"}`}>
                  <div className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-tier-warning shrink-0" /><div><p className="text-[13px] font-semibold text-foreground">P&L changes pending Senior Ops approval</p>{currentUser.role !== "finance_lead" && <p className="text-[11px] text-muted-foreground">A Senior Ops user must approve or reject before the deal can advance.</p>}</div></div>
                  {currentUser.role === "finance_lead" && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={handleRejectPnL} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-[12px] font-medium text-muted-foreground hover:text-destructive hover:border-destructive transition-colors"><Undo2 className="h-3.5 w-3.5" /> Reject</button>
                      <button onClick={handleApprovePnL} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-[12px] font-semibold hover:opacity-90 transition-opacity"><CheckCheck className="h-3.5 w-3.5" /> Approve</button>
                    </div>
                  )}
                </div>
              )}
              <PnLWaterfall
                deal={{ ...deal, id: activeTranche.id, pnlEngine: activeTranche.pnlEngine, status, statusHistory } as any}
                currency={currency} canEdit={canEditOps} onChanged={handleWaterfallChanged} />
            </SectionCard>

            <InvoicesSection trancheId={activeTranche.id} navigate={navigate} invoicesVersion={invoicesVersion} />
            <PostingsSection trancheId={activeTranche.id} version={postingsVersion} />
            <CommentsSection trancheId={activeTranche.id} canAdd={canEditOps} />
            <DocumentsSection docs={docs} canEdit={canEditOps}
              onUpdateStatus={(id, newStatus) => {
                const entry = sharedDealDocumentRequirements.find((r) => r.id === id);
                if (entry) { entry.status = newStatus; saveDocumentRequirements(); }
                setDocs((prev) => prev.map((r) => r.id === id ? { ...r, status: newStatus } : r));
              }}
              onAddDoc={(label) => {
                const newDoc = { id: `ddr-local-${Date.now()}`, trancheId: activeTranche.id, label, required: false, status: "pending" as const };
                sharedDealDocumentRequirements.push(newDoc); setDocs((prev) => [...prev, newDoc]);
              }}
              onUploadDoc={(id, fileName) => {
                const entry = sharedDealDocumentRequirements.find((r) => r.id === id);
                if (entry) { entry.status = "uploaded"; entry.documentId = fileName; saveDocumentRequirements(); }
                setDocs((prev) => prev.map((r) => r.id === id ? { ...r, status: "uploaded", documentId: fileName } : r));
              }} />
          </div>

          <div className="flex flex-col gap-5">
            <SectionCard title="Progress" collapsible>
              <div className="relative pl-4">
                {ALL_STAGES.map((stage, i) => {
                  const isLast = i === ALL_STAGES.length - 1;
                  const isCancelStage = stage.key === "canceled";
                  const isCurrent = stage.key === status;
                  const stageForwardIdx = FORWARD_ORDER.indexOf(stage.key);
                  const completed = stageForwardIdx >= 0 && stageForwardIdx < currentForwardIdx;
                  const dimmed = isCancelStage && !isCanceled;
                  const dateStr = stageDates[stage.key];
                  return (
                    <div key={stage.key} className="relative flex items-start gap-3 pb-5 last:pb-0">
                      {!isLast && (
                        <div className={`absolute left-[9px] top-[24px] w-[2px] h-[calc(100%-14px)] ${completed ? "bg-tier-success" : "bg-border"}`} />
                      )}
                      <div className="relative z-10 shrink-0 bg-card rounded-full">
                        {completed ? (
                          <CheckCircle2 className="h-5 w-5 text-tier-success" />
                        ) : isCurrent && isCancelStage ? (
                          <div className="h-5 w-5 rounded-full bg-tier-danger-bg flex items-center justify-center"><Ban className="h-3 w-3 text-tier-danger" /></div>
                        ) : isCurrent ? (
                          <div className="h-5 w-5 rounded-full border-[2px] border-foreground flex items-center justify-center">
                            <div className="h-2 w-2 rounded-full bg-foreground" />
                          </div>
                        ) : (
                          <Circle className={`h-5 w-5 ${dimmed ? "text-muted-foreground/20" : "text-muted-foreground/30"}`} />
                        )}
                      </div>
                      <div className="flex-1 -mt-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className={`text-[13px] font-medium ${
                            isCurrent && isCancelStage ? "text-tier-danger" :
                            isCurrent ? "text-foreground" :
                            completed ? "text-tier-success" :
                            dimmed ? "text-muted-foreground/20" :
                            "text-muted-foreground/50"
                          }`}>{stage.label}</p>
                          {stage.key === "under-review" && isSentBack && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-tier-info-bg text-tier-info">
                              <Undo2 className="h-2.5 w-2.5" /> Sent to agent
                            </span>
                          )}
                        </div>
                        {dateStr
                          ? <p className="text-[11px] text-muted-foreground mt-0.5">{formatDateTime(dateStr)}</p>
                          : (!completed && !dimmed && !isCurrent)
                            ? <p className="text-[11px] text-muted-foreground/40 mt-0.5">Pending</p>
                            : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </SectionCard>
          </div>
        </div>
          </div>{/* /p-6 */}
        </div>{/* /bg-card tranche panel */}
      </div>{/* /overflow-auto page body */}

      {addTrancheOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setAddTrancheOpen(false)}>
          <div className="bg-background rounded-xl border border-border shadow-xl w-full max-w-sm mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-[15px] font-semibold mb-1">Add tranche</h3>
            <p className="text-[12px] text-muted-foreground mb-5">New tranche on this deal. Revenue and payouts are set in the P&amp;L waterfall after creation.</p>
            <div className="space-y-4">
              <div>
                <label className="text-[12px] font-medium text-foreground block mb-1.5">Tranche label</label>
                <input type="text" value={addTrancheLabel} onChange={(e) => setAddTrancheLabel(e.target.value)} placeholder="e.g. Escritura, Cancellation penalty" autoFocus
                  className="w-full px-3 py-2 border border-border rounded-md text-[13px] bg-background focus:outline-none focus:ring-1 focus:ring-ring" />
              </div>
              <div>
                <label className="text-[12px] font-medium text-foreground block mb-1.5">P&amp;L Engine</label>
                <select
                  value={addTrancheEngine || activeTranche.pnlEngine || "rebu"}
                  onChange={(e) => { setAddTrancheEngine(e.target.value); setAddTrancheAmountStr(""); setAddTrancheMoveCosts(false); }}
                  className="w-full px-3 py-2 border border-border rounded-md text-[13px] bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="rebu">REBU</option>
                  <option value="mbu-ma-broker">MBU — MA / Broker</option>
                  <option value="mbu-direct">MBU — Direct</option>
                  <option value="manual">Manual</option>
                </select>
              </div>
              {(addTrancheEngine || activeTranche.pnlEngine) !== "manual" && (
                <div>
                  <label className="text-[12px] font-medium text-foreground block mb-1.5">
                    Split revenue from current tranche ({deal.currency}) — optional
                    {parseFloat(addTrancheAmountStr) > 0 && (
                      <span className="ml-2 text-muted-foreground font-normal">origin will become {Math.max(0, trancheGrossRevenue(activeTranche.id) - (parseFloat(addTrancheAmountStr) || 0))} {deal.currency}</span>
                    )}
                  </label>
                  <input type="number" value={addTrancheAmountStr} onChange={(e) => setAddTrancheAmountStr(e.target.value)} placeholder="Leave blank to start empty"
                    max={trancheGrossRevenue(activeTranche.id) - 1}
                    className="w-full px-3 py-2 border border-border rounded-md text-[13px] bg-background focus:outline-none focus:ring-1 focus:ring-ring" />
                </div>
              )}
              {(addTrancheEngine || activeTranche.pnlEngine) !== "manual" && parseFloat(addTrancheAmountStr) > 0 && (
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input type="checkbox" checked={addTrancheMoveCosts} onChange={(e) => setAddTrancheMoveCosts(e.target.checked)} className="w-4 h-4 rounded border-border accent-primary" />
                  <span className="text-[12px] text-foreground">Move acquisition &amp; operational costs to new tranche</span>
                </label>
              )}
            </div>
            <div className="flex gap-2 mt-6 justify-end">
              <button onClick={() => { setAddTrancheOpen(false); setAddTrancheLabel(""); setAddTrancheEngine(""); setAddTrancheAmountStr(""); setAddTrancheMoveCosts(false); }} className="px-4 py-2 rounded-md border border-border text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
              <button onClick={handleAddTranche}
                disabled={
                  !addTrancheLabel.trim() ||
                  ((addTrancheEngine || activeTranche.pnlEngine) !== "manual" &&
                    parseFloat(addTrancheAmountStr) > 0 &&
                    parseFloat(addTrancheAmountStr) >= trancheGrossRevenue(activeTranche.id))
                }
                className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-[13px] font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed">
                Create tranche
              </button>
            </div>
          </div>
        </div>
      )}

      <CancelDealDialog
        open={cancelOpen}
        deal={deal}
        tranche={activeTranche}
        onClose={() => setCancelOpen(false)}
        onConfirm={(reason) => { setCancelOpen(false); handleStatusChange("canceled", { reason }); }}
      />
    </div>
  );
};

export default DealDetail;

// ─── Helper sections ──────────────────────────────────────────────────────────

function ledgerLabel(ledgerId: number): string {
  return sharedLedgers.find((l) => l.id === ledgerId)?.description ?? String(ledgerId);
}

function PostingsSection({ trancheId, version }: { trancheId: string; version: number }) {
  const [selectedPostingId, setSelectedPostingId] = useState<string | null>(null);
  const { postings, linesByPosting } = useMemo(() => {
    const trancheInvoiceIds = new Set(sharedInvoices.filter((inv) => inv.trancheId === trancheId).map((inv) => inv.id));
    const relatedPostingIds = new Set([
      ...sharedPostings.filter((p) => p.trancheId === trancheId).map((p) => p.id),
      ...sharedPostingLines.filter((l) => l.invoiceId && trancheInvoiceIds.has(l.invoiceId)).map((l) => l.postingId),
    ]);
    const postings = sharedPostings.filter((p) => relatedPostingIds.has(p.id)).sort((a, b) => a.valueDate.localeCompare(b.valueDate));
    const linesByPosting: Record<string, typeof sharedPostingLines> = {};
    for (const p of postings) linesByPosting[p.id] = sharedPostingLines.filter((l) => l.postingId === p.id);
    return { postings, linesByPosting };
  }, [trancheId, version]);

  return (
    <>
      <SectionCard title="Accounting events" collapsible defaultOpen={false}>
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-[13px]">
            <thead><tr className="border-b border-border bg-muted/20">
              <th className="text-left px-4 py-2 text-[12px] font-medium text-muted-foreground w-[30%]">Ledger</th>
              <th className="text-right px-4 py-2 text-[12px] font-medium text-muted-foreground w-[30%]">Debit</th>
              <th className="text-right px-4 py-2 text-[12px] font-medium text-muted-foreground w-[30%]">Credit</th>
            </tr></thead>
            <tbody>
              {postings.length === 0 && <tr><td colSpan={3} className="px-4 py-6 text-center text-[12px] text-muted-foreground">No accounting entries yet</td></tr>}
              {postings.map((posting) => {
                const lines = linesByPosting[posting.id] ?? [];
                return (
                  <>
                    <tr key={`hdr-${posting.id}`} onClick={() => setSelectedPostingId(posting.id)} className="border-t border-border bg-muted/20 hover:bg-muted/40 cursor-pointer transition-colors">
                      <td colSpan={3} className="px-4 py-2"><div className="flex items-center gap-3">
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-muted text-muted-foreground shrink-0">{posting.businessProcess}</span>
                        <span className="text-[12px] text-muted-foreground flex-1 truncate">{posting.description ?? "—"}</span>
                        <span className="text-[12px] text-muted-foreground shrink-0">{formatDate(posting.valueDate)}</span>
                        <ExternalLink className="h-3 w-3 text-muted-foreground/50 shrink-0" />
                      </div></td>
                    </tr>
                    {lines.map((line) => (
                      <tr key={line.id} className="border-t border-border/30">
                        <td className="px-4 py-2.5 text-muted-foreground text-[12px]">{ledgerLabel(line.ledgerId)}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums font-mono font-semibold">{line.side === "DEBIT" ? fmt(line.amount, "EUR") : <span className="text-muted-foreground/30">—</span>}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums font-mono font-semibold">{line.side === "CREDIT" ? fmt(line.amount, "EUR") : <span className="text-muted-foreground/30">—</span>}</td>
                      </tr>
                    ))}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      </SectionCard>
      <PostingDetailDialog postingId={selectedPostingId} allPostings={postings} allLines={sharedPostingLines} open={!!selectedPostingId} onOpenChange={(open) => !open && setSelectedPostingId(null)} />
    </>
  );
}

const STATUS_LABEL: Record<InvoiceStatus, string> = { draft: "Draft", issued: "Issued", paid: "Paid", cancelled: "Cancelled" };
const STATUS_CLASSES: Record<InvoiceStatus, string> = {
  draft:     "bg-tier-neutral-bg text-tier-neutral",
  issued:    "bg-tier-info-bg text-tier-info",
  paid:      "bg-tier-success-bg text-tier-success",
  cancelled: "bg-tier-danger-bg text-tier-danger",
};
const DIRECTION_LABEL: Record<"inbound" | "outbound", string> = { inbound: "Payable", outbound: "Receivable" };
const DIRECTION_CLASSES: Record<"inbound" | "outbound", string> = {
  inbound:  "bg-tier-warning-bg text-tier-warning",
  outbound: "bg-tier-success-bg text-tier-success",
};

function InvoicesSection({ trancheId, navigate, invoicesVersion }: { trancheId: string; navigate: ReturnType<typeof useNavigate>; invoicesVersion: number }) {
  const invoices = useMemo(() => sharedInvoices.filter((inv) => inv.trancheId === trancheId).sort((a, b) => a.issueDate.localeCompare(b.issueDate)), [trancheId, invoicesVersion]);
  return (
    <SectionCard title="Invoices" collapsible defaultOpen={false}>
      {invoices.length === 0 ? <p className="text-[13px] text-muted-foreground italic">No invoices for this tranche.</p> : <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-[13px]">
          <thead><tr className="border-b border-border bg-muted/20">
            <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-[12px]">Invoice #</th>
            <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-[12px]">Counterparty</th>
            <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-[12px]">Type</th>
            <th className="text-right px-4 py-2.5 font-medium text-muted-foreground text-[12px]">Amount</th>
            <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-[12px]">Status</th>
            <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-[12px]">Issue date</th>
          </tr></thead>
          <tbody>
            {invoices.map((inv) => {
              const party = sharedParties.find((p) => p.id === inv.partyId);
              const dir = inv.direction as "inbound" | "outbound";
              return (
                <tr key={inv.id} onClick={() => navigate(`/invoices/${inv.id}`)} className="border-b border-border/50 last:border-0 hover:bg-muted/30 cursor-pointer transition-colors">
                  <td className="px-4 py-3 font-mono text-[12px] text-foreground">{inv.invoiceNumber}</td>
                  <td className="px-4 py-3 text-[12px] text-muted-foreground">{party?.displayName ?? inv.partyId}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-[11px] font-medium inline-block ${DIRECTION_CLASSES[dir]}`}>{DIRECTION_LABEL[dir]}</span></td>
                  <td className="px-4 py-3 text-right font-mono font-semibold tabular-nums">{fmt(inv.subtotal + (inv.vatAmount ?? 0), inv.currency)}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-[11px] font-medium inline-block ${STATUS_CLASSES[inv.status]}`}>{STATUS_LABEL[inv.status]}</span></td>
                  <td className="px-4 py-3 text-muted-foreground">{inv.issueDate ?? "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>}
    </SectionCard>
  );
}

function CommentsSection({ trancheId, canAdd }: { trancheId: string; canAdd: boolean }) {
  const [comments, setComments] = useState(() =>
    sharedDealComments.filter((c) => c.trancheId === trancheId).sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  );
  const [newText, setNewText] = useState("");
  useEffect(() => {
    setComments(sharedDealComments.filter((c) => c.trancheId === trancheId).sort((a, b) => a.createdAt.localeCompare(b.createdAt)));
  }, [trancheId]);
  const handleSend = () => {
    const trimmed = newText.trim(); if (!trimmed) return;
    setComments((prev) => [...prev, { id: `dc-local-${Date.now()}`, trancheId, author: "ops" as const, authorName: "Ops Team", text: trimmed, createdAt: new Date().toISOString() }]);
    setNewText("");
  };
  return (
    <SectionCard title="Comments" collapsible defaultOpen={false}>
      <div className="space-y-3">
        {comments.length === 0 ? <p className="text-[13px] text-muted-foreground italic">No comments on this tranche.</p> : comments.map((c) => {
          const isOps = c.author === "ops";
          return (
            <div key={c.id} className={`flex gap-3 ${isOps ? "" : "flex-row-reverse"}`}>
              <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold ${isOps ? "bg-primary/10 text-primary" : "bg-tier-info-bg text-tier-info"}`}>{isOps ? "O" : "A"}</div>
              <div className={`flex-1 max-w-[85%] ${isOps ? "" : "items-end flex flex-col"}`}>
                <div className={`px-3 py-2 rounded-lg text-[13px] ${isOps ? "bg-muted text-foreground" : "bg-tier-info-bg text-foreground"}`}>{c.text}</div>
                <p className="text-[10px] text-muted-foreground mt-1">{c.authorName} · {formatDateTime(c.createdAt)}</p>
              </div>
            </div>
          );
        })}
        {canAdd && (
          <div className="flex gap-2 pt-2 border-t border-border/40">
            <textarea value={newText} onChange={(e) => setNewText(e.target.value)} placeholder="Write a comment to the agent..."
              className="flex-1 px-3 py-2 border border-border rounded-md text-[13px] bg-background placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-ring resize-none h-16" />
            <button onClick={handleSend} disabled={!newText.trim()}
              className={`px-3 py-2 rounded-md text-[13px] font-semibold self-end transition-opacity ${newText.trim() ? "bg-primary text-primary-foreground hover:opacity-90" : "bg-muted text-muted-foreground cursor-not-allowed"}`}>Send</button>
          </div>
        )}
      </div>
    </SectionCard>
  );
}

const DOC_STATUS_LABEL: Record<DocumentRequirementStatus, string> = { pending: "Pending", uploaded: "Uploaded", approved: "Approved", waived: "Waived" };
const DOC_STATUS_CLASSES: Record<DocumentRequirementStatus, string> = {
  pending:  "bg-tier-neutral-bg text-tier-neutral",
  uploaded: "bg-tier-info-bg text-tier-info",
  approved: "bg-tier-success-bg text-tier-success",
  waived:   "bg-tier-neutral-bg text-tier-neutral",
};

function DocumentsSection({ docs, canEdit, onUpdateStatus, onAddDoc, onUploadDoc }: {
  docs: DealDocumentRequirement[]; canEdit: boolean;
  onUpdateStatus: (id: string, status: DocumentRequirementStatus) => void;
  onAddDoc: (label: string) => void; onUploadDoc: (id: string, fileName: string) => void;
}) {
  const [isAdding, setIsAdding] = useState(false); const [addingLabel, setAddingLabel] = useState("");
  return (
    <SectionCard id="docs" title="Documents" collapsible defaultOpen={false}>
      {docs.length === 0 && !canEdit ? <p className="text-[13px] text-muted-foreground italic">No document requirements for this tranche.</p> : (
        <div className="divide-y divide-border/40">
          {docs.map((r) => (
            <div key={r.id} className="flex items-center justify-between py-2.5 gap-3">
              <div className="flex items-center gap-2 min-w-0">
                {r.required && <span className="text-[10px] font-semibold text-destructive shrink-0">REQ</span>}
                <span className="text-[13px] text-foreground truncate">{r.label}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {(r.status === "uploaded" || r.status === "approved") && <button onClick={() => { const blob = new Blob([`Document: ${r.label}\n[Placeholder]`], { type: "text/plain" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `${r.label.replace(/[^a-z0-9]/gi, "_")}.txt`; a.click(); URL.revokeObjectURL(url); }} title="Download" className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"><Download className="h-3.5 w-3.5" /></button>}
                {canEdit && r.status === "pending" && <label className="px-2 py-0.5 rounded text-[11px] font-medium bg-tier-info-bg text-tier-info hover:opacity-80 transition-opacity cursor-pointer">Upload<input type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onUploadDoc(r.id, f.name); e.target.value = ""; }} /></label>}
                {canEdit && r.status === "uploaded" && <button onClick={() => onUpdateStatus(r.id, "approved")} className="px-2 py-0.5 rounded text-[11px] font-medium bg-tier-success-bg text-tier-success hover:opacity-80 transition-opacity">Approve</button>}
                {canEdit && (r.status === "pending" || r.status === "uploaded") && <button onClick={() => onUpdateStatus(r.id, "waived")} className="px-2 py-0.5 rounded text-[11px] font-medium bg-muted text-muted-foreground border border-border hover:bg-muted/80 transition-colors">Waive</button>}
                {canEdit && r.status === "waived" && <button onClick={() => onUpdateStatus(r.id, "pending")} className="px-2 py-0.5 rounded text-[11px] font-medium bg-muted text-muted-foreground border border-border hover:bg-muted/80 transition-colors">Un-waive</button>}
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${DOC_STATUS_CLASSES[r.status]}`}>{DOC_STATUS_LABEL[r.status]}</span>
              </div>
            </div>
          ))}
          {canEdit && (
            <div className="pt-3">
              {isAdding ? (
                <div className="flex gap-2">
                  <input type="text" value={addingLabel} onChange={(e) => setAddingLabel(e.target.value)} placeholder="Document name..." autoFocus className="flex-1 px-3 py-1.5 border border-border rounded-md text-[13px] bg-background focus:outline-none focus:ring-1 focus:ring-ring" />
                  <button onClick={() => { if (addingLabel.trim()) { onAddDoc(addingLabel.trim()); setAddingLabel(""); setIsAdding(false); } }} disabled={!addingLabel.trim()} className={`px-3 py-1.5 rounded-md text-[13px] font-medium ${addingLabel.trim() ? "bg-primary text-primary-foreground hover:opacity-90" : "bg-muted text-muted-foreground cursor-not-allowed"}`}>Add</button>
                  <button onClick={() => { setAddingLabel(""); setIsAdding(false); }} className="px-3 py-1.5 rounded-md text-[13px] font-medium text-muted-foreground hover:text-foreground">Cancel</button>
                </div>
              ) : (
                <button onClick={() => setIsAdding(true)} className="text-[13px] text-primary hover:underline font-medium">+ Request document</button>
              )}
            </div>
          )}
        </div>
      )}
    </SectionCard>
  );
}
