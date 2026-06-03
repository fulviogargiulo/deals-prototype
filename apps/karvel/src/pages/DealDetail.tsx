import { useState, useMemo, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { findDeal, updateDeal } from "@/data/dealStore";
import { findTranche, getTranchesForDeal, updateTranche, addTranche } from "@/data/trancheStore";
import { saveDocumentRequirements } from "@/data/sharedEntityStore";
import { Deal, Tranche, DealStatus } from "@/data/types";
import {
  CheckCircle2,
  Circle,
  ExternalLink,
  Download,
  AlertTriangle,
  CheckCheck,
  Undo2,
  ChevronDown,
  Plus,
} from "lucide-react";
import {
  computeTranchePnL,
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
  type InvoiceStatus,
  type DocumentRequirementStatus,
  type DealDocumentRequirement,
} from "@huspy/shared-domain";
import { businessUnitLabel, dealStatusLabel } from "@/lib/labels";
import { PnLWaterfall } from "@/components/PnLWaterfall";
import { PostingDetailDialog } from "@/components/PostingDetailDialog";
import { DealHeader } from "@/components/DealHeader";

const STAGE_ORDER: { key: DealStatus; label: string }[] = [
  { key: "pending-details",        label: "Pending Details" },
  { key: "under-review",           label: "Under Review" },
  { key: "pending-agent-approval", label: "Agent Approval" },
  { key: "invoicing",              label: "Invoicing" },
  { key: "finalized",              label: "Finalized" },
];

function getStageIndex(status: DealStatus): number {
  return STAGE_ORDER.findIndex((s) => s.key === status);
}

function getStageDates(tranche: Tranche): Record<string, string | null> {
  const dates: Record<string, string | null> = {};
  STAGE_ORDER.forEach((stage) => { dates[stage.key] = null; });
  dates["pending-details"] = tranche.reportDate ? new Date(tranche.reportDate).toISOString() : null;
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
      <span className="w-[160px] text-[12px] text-muted-foreground shrink-0 uppercase tracking-wide font-medium">{label}</span>
      <span className="text-[13px] text-foreground font-medium truncate">{children ?? value ?? "—"}</span>
    </div>
  );
}

function SectionCard({ id, title, children, className = "", collapsible = false, defaultOpen = true }: {
  id?: string; title: string; children: React.ReactNode; className?: string; collapsible?: boolean; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div id={id} className={`bg-card border border-border rounded-lg shadow-sm scroll-mt-32 ${className}`}>
      <div className={`px-5 py-3.5 border-b border-border flex items-center justify-between ${collapsible ? "cursor-pointer select-none" : ""}`}
        onClick={collapsible ? () => setOpen((o) => !o) : undefined}>
        <h3 className="text-[13px] font-semibold text-foreground uppercase tracking-wider">{title}</h3>
        {collapsible && <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-150 ${open ? "" : "-rotate-90"}`} />}
      </div>
      {(!collapsible || open) && <div className="px-5 py-4">{children}</div>}
    </div>
  );
}

function TrancheTabs({ tranches, activeId, onSelect, canAdd, onAdd }: {
  tranches: Tranche[]; activeId: string; onSelect: (id: string) => void; canAdd: boolean; onAdd: () => void;
}) {
  return (
    <div className="flex items-center gap-1 px-6 pt-3 pb-0 border-b border-border bg-background">
      {tranches.map((t) => (
        <button key={t.id} onClick={() => onSelect(t.id)}
          className={`px-4 py-2 text-[13px] font-medium rounded-t-md border border-b-0 transition-colors ${
            t.id === activeId ? "bg-card text-foreground border-border" : "bg-transparent text-muted-foreground border-transparent hover:text-foreground hover:border-border/50"
          }`}>
          {t.label ?? `Tranche ${t.index + 1}`}
          <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded-full ${
            t.status === "finalized" ? "bg-emerald-100 text-emerald-700" :
            t.status === "invoicing" ? "bg-blue-100 text-blue-700" :
            t.status === "under-review" ? "bg-amber-100 text-amber-700" :
            t.status === "pending-agent-approval" ? "bg-purple-100 text-purple-700" :
            t.status === "canceled" ? "bg-red-100 text-red-500" : "bg-muted text-muted-foreground"
          }`}>{dealStatusLabel[t.status]}</span>
        </button>
      ))}
      {canAdd && (
        <button onClick={onAdd} className="ml-1 flex items-center gap-1 px-3 py-2 text-[12px] font-medium text-muted-foreground hover:text-foreground transition-colors">
          <Plus className="h-3.5 w-3.5" /> Add tranche
        </button>
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

  const isMultiTranche = tranches.length > 1;

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
  const [addTrancheAmountStr, setAddTrancheAmountStr] = useState("");
  const [addTrancheMoveCosts, setAddTrancheMoveCosts] = useState(false);

  // Derive gross revenue for a tranche from its REVENUE_SOURCE stakes.
  const trancheGrossRevenue = (trancheId: string) =>
    sharedPnlEntries
      .filter((s) => s.trancheId === trancheId && s.role === "REVENUE_SOURCE" && (s.amount ?? 0) > 0)
      .reduce((sum, s) => sum + Math.abs(s.amount ?? 0), 0);

  const handleAddTranche = () => {
    if (!deal || !activeTranche) return;
    const splitAmount = parseFloat(addTrancheAmountStr) || 0;
    if (!addTrancheLabel.trim() || splitAmount <= 0) return;
    const originRevenue = trancheGrossRevenue(activeTranche.id);
    if (splitAmount >= originRevenue) return;

    const now = new Date().toISOString();
    const newId = `tranche-${String(Date.now()).slice(-8)}`;
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
    // Only copy financial P&L entries — DEMAND/SUPPLY are Deal-level (sharedDealParticipants) and don't need copying.
    freshSourceStakes.filter((s) => s.role === "AGENT_PAYOUT").forEach((s, i) => {
      sharedPnlEntries.push({
        ...s, id: `ds-${newId}-copy-${i}`, trancheId: newId,
        amount: s.role === "AGENT_PAYOUT" ? undefined : s.amount,
        source: s.role === "AGENT_PAYOUT" ? "engine" : s.source, status: "draft",
      });
    });
    sharedPnlEntries.push({
      id: `ds-${newId}-rev`, trancheId: newId,
      partyId: originRevStake?.partyId ?? "party-client-001",
      role: "REVENUE_SOURCE", amount: splitAmount, source: "manual", status: "draft",
    });
    costStakesToMove.forEach((s, i) => {
      sharedPnlEntries.push({ ...s, id: `ds-${newId}-cost-${i}`, trancheId: newId });
    });
    sharedDocumentRequirementTemplates
      .filter((t) => t.market === deal.market && t.businessUnit === deal.businessUnit && t.country === deal.country)
      .forEach((t, i) => {
        sharedDealDocumentRequirements.push({ id: `ddr-${newId}-${i}`, trancheId: newId, label: t.label, required: t.required, status: "pending" });
      });

    const newTranche: Tranche = {
      id: newId, dealId: deal.id, label: addTrancheLabel.trim(), index: tranches.length,
      status: "pending-details",
      reportDate: activeTranche.reportDate, pnlEngine: activeTranche.pnlEngine,
      blueprintId: activeTranche.blueprintId, createdAt: now, updatedAt: now,
    };
    addTranche(newTranche);
    setAddTrancheOpen(false); setAddTrancheLabel(""); setAddTrancheAmountStr(""); setAddTrancheMoveCosts(false);
    setSearchParams({ tranche: newId });
    toast.success(`Tranche "${addTrancheLabel}" created — origin reduced to ${remainingRevenue} ${deal.currency}`);
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
  const { clientName, demandName, supplyName, amountLabel } = useMemo(() => {
    if (!deal || !activeTranche) return { clientName: "—", demandName: "—", supplyName: "—", amountLabel: "—" };
    const resolveParticipant = (role: "DEMAND" | "SUPPLY") =>
      sharedDealParticipants.filter((p) => p.dealId === deal.id && p.role === role)
        .map((p) => sharedParties.find((party) => party.id === p.partyId)?.displayName).filter(Boolean).join(", ") || "—";
    const currency = deal.currency ?? "EUR";
    return {
      clientName: resolveParticipant("DEMAND") !== "—" ? resolveParticipant("DEMAND") : deal.clientName || "—",
      demandName: resolveParticipant("DEMAND"), supplyName: resolveParticipant("SUPPLY"),
      amountLabel: deal.dealAmount > 0 ? fmt(deal.dealAmount, currency) : "—",
    };
  }, [deal, activeTranche, stakesVersion]);

  const ageInStage = useMemo(() => {
    const lastEntry = [...statusHistory].reverse().find((h) => h.to === status);
    const sinceIso = lastEntry?.timestamp ?? activeTranche?.createdAt;
    if (!sinceIso) return undefined;
    const days = Math.floor((Date.now() - new Date(sinceIso).getTime()) / 86400000);
    if (days <= 0) return "today"; if (days === 1) return "1 day in stage"; return `${days} days in stage`;
  }, [status, statusHistory, activeTranche?.createdAt]);

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
  const currentIdx = getStageIndex(status);
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

  // Pass a deal-like object to DealHeader that includes status for backward compat
  const dealWithStatus = { ...deal, status, statusHistory } as any;

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-background">
      <DealHeader
        deal={dealWithStatus}
        status={status}
        pnlPendingApproval={pnlPendingApproval}
        pnlHasChanges={pnlHasChanges}
        docs={docs}
        clientName={clientName}
        amountLabel={amountLabel}
        ageInStage={ageInStage}
        savedAt={savedAt}
        onTransition={handleStatusChange}
      />

      {isMultiTranche && (
        <TrancheTabs tranches={tranches} activeId={activeTranche.id}
          onSelect={(id) => setSearchParams({ tranche: id })}
          canAdd={status === "under-review"}
          onAdd={() => { setAddTrancheLabel("Escritura"); setAddTrancheAmountStr(String(Math.round(trancheGrossRevenue(activeTranche.id) / 2))); setAddTrancheOpen(true); }} />
      )}

      <div className="flex-1 overflow-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5">
          <div className="flex flex-col gap-5">
            <SectionCard title="Deal Overview">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10">
                <div>
                  <ReadRow label="Deal ID" value={deal.id} />
                  <ReadRow label="Business Unit" value={deal.businessUnit ? businessUnitLabel[deal.businessUnit] : "—"} />
                  <ReadRow label="Market" value={deal.market} />
                  <ReadRow label="Country" value={deal.country?.toUpperCase()} />
                  <ReadRow label="Currency" value={deal.currency} />
                  {deal.dealAmount > 0 && <ReadRow label="Deal Amount" value={fmt(deal.dealAmount, currency)} />}
                  <ReadRow label="Report Date" value={activeTranche.reportDate ? formatDate(activeTranche.reportDate) : "—"} />
                  <ReadRow label="Created" value={deal.createdAt ? formatDate(deal.createdAt) : "—"} />
                </div>
                <div>
                  <ReadRow label="Asset" value={deal.title ?? "—"} />
                  <ReadRow label="Offer ID" value={deal.offerId ?? "—"} />
                  <ReadRow label="Description" value={deal.description ?? "—"} />
                  <ReadRow label="Tranche" value={activeTranche.label ? `${activeTranche.label} (${activeTranche.index + 1} of ${tranches.length})` : (tranches.length === 1 ? "Single tranche" : `${activeTranche.index + 1} of ${tranches.length}`)} />
                  <ReadRow label="Demand" value={demandName} />
                  <ReadRow label="Supply" value={supplyName} />
                  <ReadRow label="Channel" value={deal.channel ?? "—"} />
                  <ReadRow label="P&L Engine" value={getDealEngine(deal, activeTranche)} />
                </div>
              </div>
            </SectionCard>

            {!isMultiTranche && status === "under-review" && (
              <button onClick={() => { setAddTrancheLabel("Escritura"); setAddTrancheAmountStr(String(Math.round(trancheGrossRevenue(activeTranche.id) / 2))); setAddTrancheOpen(true); }}
                className="flex items-center gap-2 self-start px-3 py-1.5 rounded-md border border-border text-[12px] font-medium text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors">
                <Plus className="h-3.5 w-3.5" /> Add tranche
              </button>
            )}

            <SectionCard id="pnl" title={pnlPendingApproval ? "P&L — Pending Approval" : pnlHasChanges ? "P&L — Unsaved Changes" : "P&L"} collapsible>
              {pnlHasChanges && !pnlPendingApproval && (
                <div className="flex items-center justify-between mb-4 px-3 py-2.5 rounded-md border border-amber-300 bg-amber-50 dark:bg-amber-950/20">
                  <div className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" /><p className="text-[13px] font-semibold text-foreground">P&L has unsaved changes</p></div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={handleDiscardPnLChanges} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-[12px] font-medium text-muted-foreground hover:text-destructive hover:border-destructive transition-colors"><Undo2 className="h-3.5 w-3.5" /> Discard</button>
                    <button onClick={handleSubmitPnLForApproval} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-600 text-white text-[12px] font-semibold hover:opacity-90 transition-opacity">Submit for approval</button>
                  </div>
                </div>
              )}
              {pnlPendingApproval && (
                <div className={`flex items-center justify-between mb-4 px-3 py-2.5 rounded-md border ${currentUser.role === "finance_lead" ? "border-amber-300 bg-amber-50 dark:bg-amber-950/20" : "border-border bg-muted/40"}`}>
                  <div className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" /><div><p className="text-[13px] font-semibold text-foreground">P&L changes pending Senior Ops approval</p>{currentUser.role !== "finance_lead" && <p className="text-[11px] text-muted-foreground">A Senior Ops user must approve or reject before the deal can advance.</p>}</div></div>
                  {currentUser.role === "finance_lead" && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={handleRejectPnL} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-[12px] font-medium text-muted-foreground hover:text-destructive hover:border-destructive transition-colors"><Undo2 className="h-3.5 w-3.5" /> Reject</button>
                      <button onClick={handleApprovePnL} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-600 text-white text-[12px] font-semibold hover:opacity-90 transition-opacity"><CheckCheck className="h-3.5 w-3.5" /> Approve</button>
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
            <SectionCard title="Deal Progress" collapsible>
              <div className="relative pl-4">
                {STAGE_ORDER.map((stage, i) => {
                  const completed = i <= currentIdx; const isCurrent = i === currentIdx; const dateStr = stageDates[stage.key];
                  return (
                    <div key={stage.key} className="relative flex items-start gap-3 pb-5 last:pb-0">
                      {i < STAGE_ORDER.length - 1 && <div className={`absolute left-[9px] top-[24px] w-[2px] h-[calc(100%-14px)] ${i < currentIdx ? "bg-[hsl(var(--deal-paid))]" : "bg-border"}`} />}
                      <div className="relative z-10 shrink-0 bg-card rounded-full">
                        {completed ? <CheckCircle2 className="h-5 w-5 text-[hsl(var(--deal-paid))]" /> : <Circle className="h-5 w-5 text-muted-foreground/30" />}
                      </div>
                      <div className="flex-1 -mt-0.5">
                        <p className={`text-[13px] font-medium ${isCurrent ? "text-foreground" : completed ? "text-[hsl(var(--deal-paid))]" : "text-muted-foreground/50"}`}>{stage.label}</p>
                        {dateStr ? <p className="text-[11px] text-muted-foreground mt-0.5">{formatDateTime(dateStr)}</p> : !completed && <p className="text-[11px] text-muted-foreground/40 mt-0.5">Pending</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </SectionCard>
          </div>
        </div>
      </div>

      {addTrancheOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setAddTrancheOpen(false)}>
          <div className="bg-background rounded-xl border border-border shadow-xl w-full max-w-sm mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-[15px] font-semibold mb-1">Add tranche</h3>
            <p className="text-[12px] text-muted-foreground mb-5">Moves part of this tranche's revenue to a new tranche in Pending Details.</p>
            <div className="space-y-4">
              <div>
                <label className="text-[12px] font-medium text-foreground block mb-1.5">Tranche label</label>
                <input type="text" value={addTrancheLabel} onChange={(e) => setAddTrancheLabel(e.target.value)} placeholder="e.g. Escritura" autoFocus
                  className="w-full px-3 py-2 border border-border rounded-md text-[13px] bg-background focus:outline-none focus:ring-1 focus:ring-ring" />
              </div>
              <div>
                <label className="text-[12px] font-medium text-foreground block mb-1.5">
                  Amount to split ({deal.currency})
                  <span className="ml-2 text-muted-foreground font-normal">origin will become {Math.max(0, trancheGrossRevenue(activeTranche.id) - (parseFloat(addTrancheAmountStr) || 0))} {deal.currency}</span>
                </label>
                <input type="number" value={addTrancheAmountStr} onChange={(e) => setAddTrancheAmountStr(e.target.value)} placeholder="0" min={1} max={trancheGrossRevenue(activeTranche.id) - 1}
                  className="w-full px-3 py-2 border border-border rounded-md text-[13px] bg-background focus:outline-none focus:ring-1 focus:ring-ring" />
              </div>
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input type="checkbox" checked={addTrancheMoveCosts} onChange={(e) => setAddTrancheMoveCosts(e.target.checked)} className="w-4 h-4 rounded border-border accent-primary" />
                <span className="text-[12px] text-foreground">Move acquisition &amp; operational costs to new tranche</span>
              </label>
            </div>
            <div className="flex gap-2 mt-6 justify-end">
              <button onClick={() => setAddTrancheOpen(false)} className="px-4 py-2 rounded-md border border-border text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
              <button onClick={handleAddTranche}
                disabled={!addTrancheLabel.trim() || parseFloat(addTrancheAmountStr) <= 0 || parseFloat(addTrancheAmountStr) >= trancheGrossRevenue(activeTranche.id)}
                className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-[13px] font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed">
                Create tranche
              </button>
            </div>
          </div>
        </div>
      )}
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
      <SectionCard title="Accounting Events" collapsible>
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-[13px]">
            <thead><tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-2 text-[11px] font-medium text-muted-foreground uppercase tracking-wide w-[30%]">Ledger</th>
              <th className="text-right px-4 py-2 text-[11px] font-medium text-muted-foreground uppercase tracking-wide w-[30%]">Debit</th>
              <th className="text-right px-4 py-2 text-[11px] font-medium text-muted-foreground uppercase tracking-wide w-[30%]">Credit</th>
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
  draft: "bg-muted text-muted-foreground", issued: "bg-amber-50 text-amber-700 border border-amber-200",
  paid: "bg-emerald-50 text-emerald-700 border border-emerald-200", cancelled: "bg-red-50 text-red-500 border border-red-200",
};
const DIRECTION_LABEL: Record<"inbound" | "outbound", string> = { inbound: "Payable", outbound: "Receivable" };
const DIRECTION_CLASSES: Record<"inbound" | "outbound", string> = {
  inbound: "bg-amber-50 text-amber-700 border border-amber-200",
  outbound: "bg-emerald-50 text-emerald-700 border border-emerald-200",
};

function InvoicesSection({ trancheId, navigate, invoicesVersion }: { trancheId: string; navigate: ReturnType<typeof useNavigate>; invoicesVersion: number }) {
  const invoices = useMemo(() => sharedInvoices.filter((inv) => inv.trancheId === trancheId).sort((a, b) => a.issueDate.localeCompare(b.issueDate)), [trancheId, invoicesVersion]);
  if (invoices.length === 0) return <SectionCard title="Invoices" collapsible><p className="text-[13px] text-muted-foreground italic">No invoices for this tranche.</p></SectionCard>;
  return (
    <SectionCard title="Invoices" collapsible>
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full text-[13px]">
          <thead><tr className="border-b border-border bg-muted/30">
            <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-[11px] uppercase tracking-wide">Invoice #</th>
            <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-[11px] uppercase tracking-wide">Counterparty</th>
            <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-[11px] uppercase tracking-wide">Type</th>
            <th className="text-right px-4 py-2.5 font-medium text-muted-foreground text-[11px] uppercase tracking-wide">Amount</th>
            <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-[11px] uppercase tracking-wide">Status</th>
            <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-[11px] uppercase tracking-wide">Issue Date</th>
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
      </div>
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
    <SectionCard title="Comments" collapsible>
      <div className="space-y-3">
        {comments.length === 0 ? <p className="text-[13px] text-muted-foreground italic">No comments on this tranche.</p> : comments.map((c) => {
          const isOps = c.author === "ops";
          return (
            <div key={c.id} className={`flex gap-3 ${isOps ? "" : "flex-row-reverse"}`}>
              <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold ${isOps ? "bg-primary/10 text-primary" : "bg-emerald-500/10 text-emerald-700"}`}>{isOps ? "O" : "A"}</div>
              <div className={`flex-1 max-w-[85%] ${isOps ? "" : "items-end flex flex-col"}`}>
                <div className={`px-3 py-2 rounded-lg text-[13px] ${isOps ? "bg-muted text-foreground" : "bg-emerald-50 dark:bg-emerald-950/20 text-foreground"}`}>{c.text}</div>
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
  pending: "bg-muted text-muted-foreground", uploaded: "bg-amber-50 text-amber-700 border border-amber-200",
  approved: "bg-emerald-50 text-emerald-700 border border-emerald-200", waived: "bg-slate-50 text-slate-500 border border-slate-200",
};

function DocumentsSection({ docs, canEdit, onUpdateStatus, onAddDoc, onUploadDoc }: {
  docs: DealDocumentRequirement[]; canEdit: boolean;
  onUpdateStatus: (id: string, status: DocumentRequirementStatus) => void;
  onAddDoc: (label: string) => void; onUploadDoc: (id: string, fileName: string) => void;
}) {
  const [isAdding, setIsAdding] = useState(false); const [addingLabel, setAddingLabel] = useState("");
  return (
    <SectionCard id="docs" title="Documents" collapsible>
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
                {canEdit && r.status === "pending" && <label className="px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer">Upload<input type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onUploadDoc(r.id, f.name); e.target.value = ""; }} /></label>}
                {canEdit && r.status === "uploaded" && <button onClick={() => onUpdateStatus(r.id, "approved")} className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors">Approve</button>}
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
