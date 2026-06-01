// MODIFIED — replaces the inline <header> with <DealHeader>, removes the
// hasChanges/Save flow, and persists every status transition immediately.
//
// Sections below the header (P&L, Invoices, Postings, Comments, Documents,
// Deal Progress rail) are unchanged from the original file, except:
//   • SectionCard accepts an optional `id` prop so the readiness strip's
//     jump links can scroll to "#pnl" and "#docs".
//   • P&L SectionCard is given id="pnl", Documents SectionCard id="docs".

import { useState, useMemo, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { findDeal, updateDeal } from "@/data/dealStore";
import { saveDocumentRequirements } from "@/data/sharedEntityStore";
import { Deal, DealStatus } from "@/data/types";
import {
  CheckCircle2,
  Circle,
  ExternalLink,
  Download,
  AlertTriangle,
  CheckCheck,
  Undo2,
  ChevronDown,
} from "lucide-react";
import {
  computeDealPnL,
  getDealEngine,
  fireCommissionAccrualOnTransition,
  confirmDealStakeholders,
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
  sharedDealStakeholders,
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
  { key: "pending-details", label: "Pending Details" },
  { key: "under-review", label: "Under Review" },
  { key: "pending-agent-approval", label: "Agent Approval" },
  { key: "invoicing", label: "Invoicing" },
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
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit", hour12: true,
  });
}

function formatSavedAt(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  }
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

function SectionCard({
  id,
  title,
  children,
  className = "",
  collapsible = false,
  defaultOpen = true,
}: {
  id?: string;
  title: string;
  children: React.ReactNode;
  className?: string;
  collapsible?: boolean;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div id={id} className={`bg-card border border-border rounded-lg shadow-sm scroll-mt-32 ${className}`}>
      <div
        className={`px-5 py-3.5 border-b border-border flex items-center justify-between ${collapsible ? "cursor-pointer select-none" : ""}`}
        onClick={collapsible ? () => setOpen((o) => !o) : undefined}
      >
        <h3 className="text-[13px] font-semibold text-foreground uppercase tracking-wider">{title}</h3>
        {collapsible && (
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-150 ${open ? "" : "-rotate-90"}`} />
        )}
      </div>
      {(!collapsible || open) && <div className="px-5 py-4">{children}</div>}
    </div>
  );
}

const DealDetail = () => {
  const { dealId } = useParams<{ dealId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useCurrentUser();

  const deal = useMemo(() => findDeal(dealId || ""), [dealId]);
  const [stakesVersion, setStakesVersion] = useState(0);

  const [status, setStatus] = useState<DealStatus>(deal?.status ?? "pending-details");
  const [statusHistory, setStatusHistory] = useState(deal?.statusHistory ?? []);
  const [invoicesVersion, setInvoicesVersion] = useState(0);
  const [postingsVersion, setPostingsVersion] = useState(0);
  const [docs, setDocs] = useState<DealDocumentRequirement[]>(() =>
    sharedDealDocumentRequirements.filter((r) => r.dealId === (deal?.id ?? ""))
  );

  // P&L change tracking — ops can make multiple edits before submitting for approval.
  // pnlHasChanges: edits exist but not yet submitted.
  // pnlPendingApproval: submitted, awaiting Senior Ops review. Editing locked.
  const [pnlHasChanges, setPnlHasChanges] = useState(false);
  const [pnlPendingApproval, setPnlPendingApproval] = useState(false);
  const stakesSnapshot = useRef<typeof sharedDealStakeholders[0][]>([]);

  const handleWaterfallChanged = () => {
    if (!pnlHasChanges && !pnlPendingApproval && deal) {
      // Take a snapshot of the pre-change state for potential revert on rejection.
      stakesSnapshot.current = sharedDealStakeholders
        .filter((s) => s.dealId === deal.id)
        .map((s) => ({ ...s }));
    }
    setPnlHasChanges(true);
    setStakesVersion((v) => v + 1);
  };

  const handleSubmitPnLForApproval = () => {
    setPnlHasChanges(false);
    setPnlPendingApproval(true);
  };

  const handleDiscardPnLChanges = () => {
    if (!deal) return;
    const toRemove = sharedDealStakeholders.filter((s) => s.dealId === deal.id);
    toRemove.forEach((s) => {
      const idx = sharedDealStakeholders.indexOf(s);
      if (idx !== -1) sharedDealStakeholders.splice(idx, 1);
    });
    stakesSnapshot.current.forEach((s) => sharedDealStakeholders.push({ ...s }));
    stakesSnapshot.current = [];
    setPnlHasChanges(false);
    setStakesVersion((v) => v + 1);
    toast.info("P&L changes discarded");
  };

  const handleApprovePnL = () => {
    setPnlPendingApproval(false);
    stakesSnapshot.current = [];
    toast.success("P&L changes approved");
  };

  const handleRejectPnL = () => {
    if (!deal) return;
    const toRemove = sharedDealStakeholders.filter((s) => s.dealId === deal.id);
    toRemove.forEach((s) => {
      const idx = sharedDealStakeholders.indexOf(s);
      if (idx !== -1) sharedDealStakeholders.splice(idx, 1);
    });
    stakesSnapshot.current.forEach((s) => sharedDealStakeholders.push({ ...s }));
    stakesSnapshot.current = [];
    setPnlPendingApproval(false);
    setStakesVersion((v) => v + 1);
    toast.info("P&L changes rejected — reverted to previous state");
  };

  useEffect(() => {
    if (!deal) return;
    setStatus(deal.status);
    setStatusHistory(deal.statusHistory ?? []);
    setDocs(sharedDealDocumentRequirements.filter((r) => r.dealId === deal.id));
  }, [deal]);

  // ── Derived values for the header ───────────────────────────────────
  const { clientName, demandName, supplyName, amountLabel } = useMemo(() => {
    if (!deal) return { clientName: "—", demandName: "—", supplyName: "—", amountLabel: "—" };
    const resolve = (role: string) =>
      sharedDealStakeholders
        .filter((s) => s.dealId === deal.id && s.role === role)
        .map((s) => sharedParties.find((p) => p.id === s.partyId)?.displayName)
        .filter(Boolean)
        .join(", ") || "—";
    const dealAmountValue = deal.dealPrice ?? deal.dealAmount;
    const currency = deal.currency ?? "EUR";
    return {
      clientName: resolve("DEMAND") !== "—" ? resolve("DEMAND") : deal.clientName || "—",
      demandName: resolve("DEMAND"),
      supplyName: resolve("SUPPLY"),
      amountLabel: dealAmountValue != null && dealAmountValue > 0 ? fmt(dealAmountValue, currency) : "—",
    };
  }, [deal, stakesVersion]);

  const ageInStage = useMemo(() => {
    const lastEntry = [...statusHistory].reverse().find((h) => h.to === status);
    const sinceIso = lastEntry?.timestamp ?? deal?.createdAt;
    if (!sinceIso) return undefined;
    const days = Math.floor((Date.now() - new Date(sinceIso).getTime()) / 86400000);
    if (days <= 0) return "today";
    if (days === 1) return "1 day in stage";
    return `${days} days in stage`;
  }, [status, statusHistory, deal?.createdAt]);

  const savedAt = useMemo(() => {
    const lastEntry = statusHistory.length > 0
      ? statusHistory[statusHistory.length - 1].timestamp
      : deal?.createdAt;
    return lastEntry ? formatSavedAt(lastEntry) : undefined;
  }, [statusHistory, deal?.createdAt]);

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
  const stageDates = getStageDates({ ...deal, status, statusHistory });
  const currentIdx = getStageIndex(status);
  const canEditOps = (status === "pending-details" || status === "under-review") && !pnlPendingApproval;

  // ── Status transition handler ───────────────────────────────────────
  // Persists immediately (no separate Save button — C2 / autosave model).
  const handleStatusChange = (to: DealStatus, opts?: { reason?: string }) => {
    if (to === status) return;
    if (!canTransitionDealStatus(status, to)) {
      toast.error(`Cannot transition ${status} → ${to}`);
      return;
    }

    // Pre-flight checks for forward motion out of Under Review.
    if (status === "under-review" && to === "pending-agent-approval") {
      if (pnlPendingApproval) {
        toast.error("Cannot advance: P&L changes are awaiting Senior Ops approval.");
        return;
      }
      const allClear = docs.every((r) => r.status === "approved" || r.status === "waived");
      if (!allClear) {
        toast.error("Cannot move to Agent Approval: all documents must be approved or waived first.");
        return;
      }
    }

    // Confirm P&L: lock all stakes and create pre-computed connected-agent payout stakes.
    if (to === "invoicing") {
      confirmDealStakeholders(deal);
    }

    // Auto-draft invoices when moving into Invoicing.
    if (to === "invoicing") {
      const blueprint = getBlueprint(deal.country, deal.businessUnit);
      const billableStakes = sharedDealStakeholders.filter(
        (s) =>
          s.dealId === deal.id &&
          s.role !== "AGENT_PAYOUT" &&
          s.amount != null &&
          s.amount !== 0 &&
          // Agent/broker cost entries (referral fees, co-brokers) are settled via the
          // commission accrual posting, not via invoices. Skip them here.
          !(
            (s.role === "ACQUISITION_DEDUCTION" || s.role === "OPERATIONAL_DEDUCTION") &&
            sharedLedgers.some((l) => l.partyId === s.partyId)
          ),
      );
      const now = new Date().toISOString();
      const today = now.slice(0, 10);
      const dueDate = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);

      const revenueStakesByParty = new Map<string, typeof billableStakes>();
      const nonRevenueStakes: typeof billableStakes = [];
      billableStakes.forEach((s) => {
        if (s.role === "REVENUE_SOURCE") {
          if (!revenueStakesByParty.has(s.partyId)) revenueStakesByParty.set(s.partyId, []);
          revenueStakesByParty.get(s.partyId)!.push(s);
        } else {
          nonRevenueStakes.push(s);
        }
      });

      let invIdx = 0;
      const country = (deal.country ?? "XX").toUpperCase();
      const invCurrency = deal.currency ?? "EUR";

      revenueStakesByParty.forEach((stakes) => {
        const subtotal = stakes.reduce((sum, s) => sum + Math.abs(s.amount!), 0);
        const vatAmount = blueprint.taxRate ? Math.round(subtotal * blueprint.taxRate) / 100 : undefined;
        const lineItems = stakes.length > 1
          ? stakes.map((s) => ({ description: s.description ?? "Commission", amount: Math.abs(s.amount!) }))
          : undefined;
        sharedInvoices.push({
          id: `inv-auto-${deal.id}-rev-${invIdx}-${Date.now()}`,
          direction: "outbound" as const,
          partyId: stakes[0].partyId,
          dealId: deal.id,
          invoiceNumber: `INV-${country}-${String(sharedInvoices.length + invIdx + 1).padStart(3, "0")}`,
          status: "draft" as const,
          subtotal,
          vatAmount,
          lineItems,
          currency: invCurrency,
          issueDate: today,
          dueDate,
          createdAt: now,
          updatedAt: now,
        });
        invIdx++;
      });

      nonRevenueStakes.forEach((s) => {
        const subtotal = Math.abs(s.amount!);
        const vatAmount = blueprint.taxRate ? Math.round(subtotal * blueprint.taxRate) / 100 : undefined;
        sharedInvoices.push({
          id: `inv-auto-${deal.id}-cost-${invIdx}-${Date.now()}`,
          direction: "inbound" as const,
          partyId: s.partyId,
          dealId: deal.id,
          invoiceNumber: `INV-${country}-${String(sharedInvoices.length + invIdx + 1).padStart(3, "0")}`,
          status: "draft" as const,
          subtotal,
          vatAmount,
          currency: invCurrency,
          issueDate: today,
          dueDate,
          createdAt: now,
          updatedAt: now,
        });
        invIdx++;
      });

      // Engine-computed cost parties (e.g. mbu-direct OPERATIONAL_DEDUCTION with
      // no explicit amount — amount derived from DEFAULT_EXTERNAL_REFERRAL_RATE).
      // These are excluded by the billableStakes filter above because amount is
      // null on the raw stakeholder, but the P&L engine fills it in. Parties with a
      // subledger are handled by createCommissionAccrualPosting; only invoice the rest.
      const pnlForCosts = computeDealPnL(deal);
      if (pnlForCosts) {
        const coveredPartyIds = new Set(billableStakes.map((s) => s.partyId));
        pnlForCosts.ledger
          .filter(
            (e) =>
              e.side === "DEBIT" &&
              (e.bucket === "acquisition-cost" || e.bucket === "operational-cost") &&
              e.partyId &&
              !sharedLedgers.some((l) => l.partyId === e.partyId) &&
              !coveredPartyIds.has(e.partyId!)
          )
          .forEach((entry) => {
            const subtotal = Math.abs(entry.amount);
            const vatAmount = blueprint.taxRate ? Math.round(subtotal * blueprint.taxRate) / 100 : undefined;
            sharedInvoices.push({
              id: `inv-auto-${deal.id}-cost-${invIdx}-${Date.now()}`,
              direction: "inbound" as const,
              partyId: entry.partyId!,
              dealId: deal.id,
              invoiceNumber: `INV-${country}-${String(sharedInvoices.length + invIdx + 1).padStart(3, "0")}`,
              status: "draft" as const,
              subtotal,
              vatAmount,
              currency: invCurrency,
              issueDate: today,
              dueDate,
              createdAt: now,
              updatedAt: now,
            });
            invIdx++;
          });
      }

      if (invIdx > 0) setInvoicesVersion((v) => v + 1);
    }

    const note = opts?.reason ? `Canceled: ${opts.reason}` : "Manual transition";
    const entry = { from: status, to, timestamp: new Date().toISOString(), note };
    const nextHistory = [...statusHistory, entry];

    setStatus(to);
    setStatusHistory(nextHistory);

    // Persist immediately (C2 — no Save button).
    const updated: Deal = { ...deal, status: to, statusHistory: nextHistory };
    updateDeal(updated);
    fireCommissionAccrualOnTransition(deal, to);
    setPostingsVersion((v) => v + 1);

    if (to === "canceled") toast.success("Deal canceled");
    else if (to === "pending-details") toast.success("Sent back to agent");
    else toast.success(`Moved to ${dealStatusLabel[to]}`);
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-background">
      <DealHeader
        deal={deal}
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

      <div className="flex-1 overflow-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5">
          {/* Left */}
          <div className="flex flex-col gap-5">

            {/* Deal Overview */}
            <SectionCard title="Deal Overview">
              {(() => {
                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10">
                    <div>
                      <ReadRow label="Deal ID" value={deal.id} />
                      <ReadRow label="Business Unit" value={deal.businessUnit ? businessUnitLabel[deal.businessUnit] : "—"} />
                      <ReadRow label="Market" value={deal.market} />
                      <ReadRow label="Country" value={deal.country?.toUpperCase()} />
                      <ReadRow label="Currency" value={deal.currency} />
                      {(deal.dealPrice ?? deal.dealAmount) != null && (deal.dealPrice ?? deal.dealAmount)! > 0 && (
                        <ReadRow label="Deal Amount" value={fmt(deal.dealPrice ?? deal.dealAmount!, currency)} />
                      )}
                      <ReadRow label="Report Date" value={deal.reportDate ? formatDate(deal.reportDate) : "—"} />
                      <ReadRow label="Created" value={deal.createdAt ? formatDate(deal.createdAt) : "—"} />
                    </div>
                    <div>
                      <ReadRow label="Property" value={deal.title ?? deal.buildingName ?? "—"} />
                      <ReadRow label="Offer ID" value={deal.offerId ?? "—"} />
                      <ReadRow label="Demand" value={demandName} />
                      <ReadRow label="Supply" value={supplyName} />
                      <ReadRow label="Channel" value={deal.channel ?? "—"} />
                      <ReadRow label="P&L Engine" value={getDealEngine(deal)} />
                    </div>
                  </div>
                );
              })()}
            </SectionCard>

            {/* P&L */}
            <SectionCard id="pnl" title={pnlPendingApproval ? "P&L — Pending Approval" : pnlHasChanges ? "P&L — Unsaved Changes" : "P&L"} collapsible>
              {/* Unsaved changes banner — ops submitted but not yet sent for approval */}
              {pnlHasChanges && !pnlPendingApproval && (
                <div className="flex items-center justify-between mb-4 px-3 py-2.5 rounded-md border border-amber-300 bg-amber-50 dark:bg-amber-950/20">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                    <p className="text-[13px] font-semibold text-foreground">P&L has unsaved changes</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={handleDiscardPnLChanges}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-[12px] font-medium text-muted-foreground hover:text-destructive hover:border-destructive transition-colors"
                    >
                      <Undo2 className="h-3.5 w-3.5" /> Discard
                    </button>
                    <button
                      onClick={handleSubmitPnLForApproval}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-600 text-white text-[12px] font-semibold hover:opacity-90 transition-opacity"
                    >
                      Submit for approval
                    </button>
                  </div>
                </div>
              )}
              {/* Approval pending banner — awaiting Senior Ops */}
              {pnlPendingApproval && (
                <div className={`flex items-center justify-between mb-4 px-3 py-2.5 rounded-md border ${currentUser.role === "finance_lead" ? "border-amber-300 bg-amber-50 dark:bg-amber-950/20" : "border-border bg-muted/40"}`}>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                    <div>
                      <p className="text-[13px] font-semibold text-foreground">P&L changes pending Senior Ops approval</p>
                      {currentUser.role !== "finance_lead" && (
                        <p className="text-[11px] text-muted-foreground">A Senior Ops user must approve or reject before the deal can advance.</p>
                      )}
                    </div>
                  </div>
                  {currentUser.role === "finance_lead" && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={handleRejectPnL} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-[12px] font-medium text-muted-foreground hover:text-destructive hover:border-destructive transition-colors">
                        <Undo2 className="h-3.5 w-3.5" /> Reject
                      </button>
                      <button onClick={handleApprovePnL} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-600 text-white text-[12px] font-semibold hover:opacity-90 transition-opacity">
                        <CheckCheck className="h-3.5 w-3.5" /> Approve
                      </button>
                    </div>
                  )}
                </div>
              )}
              <PnLWaterfall
                deal={deal}
                currency={currency}
                canEdit={canEditOps}
                onChanged={handleWaterfallChanged}
              />
            </SectionCard>

            {/* Invoices */}
            <InvoicesSection dealId={deal.id} navigate={navigate} invoicesVersion={invoicesVersion} />

            {/* Accounting Events */}
            <PostingsSection dealId={deal.id} version={postingsVersion} />

            {/* Ops ↔ Agent thread */}
            <CommentsSection dealId={deal.id} canAdd={canEditOps} />

            {/* Document checklist */}
            <DocumentsSection
              docs={docs}
              canEdit={canEditOps}
              onUpdateStatus={(id, newStatus) => {
                const entry = sharedDealDocumentRequirements.find((r) => r.id === id);
                if (entry) { entry.status = newStatus; saveDocumentRequirements(); }
                setDocs((prev) => prev.map((r) => r.id === id ? { ...r, status: newStatus } : r));
              }}
              onAddDoc={(label) => {
                const newDoc = { id: `ddr-local-${Date.now()}`, dealId: deal.id, label, required: false, status: "pending" as const };
                sharedDealDocumentRequirements.push(newDoc);
                setDocs((prev) => [...prev, newDoc]);
              }}
              onUploadDoc={(id, fileName) => {
                const entry = sharedDealDocumentRequirements.find((r) => r.id === id);
                if (entry) { entry.status = "uploaded"; entry.documentId = fileName; saveDocumentRequirements(); }
                setDocs((prev) => prev.map((r) => r.id === id ? { ...r, status: "uploaded", documentId: fileName } : r));
              }}
            />
          </div>

          {/* Right sidebar: Deal Progress timeline */}
          <div className="flex flex-col gap-5">
            <SectionCard title="Deal Progress" collapsible>
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
              </div>
            </SectionCard>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DealDetail;

// ─── Below: helper sections (unchanged from original) ──────────────────────────

const PROCESS_LABELS: Record<string, string> = {
  invoice_issued: "Invoice Issued",
  commission_accrual: "Commission",
  external_cost_accrual: "External Cost",
  bank_statement_inbound_matched: "Payment In",
  bank_statement_outbound_matched: "Payment Out",
  payout_instructed: "Payout",
  agent_adjustment: "Adjustment",
  huspy_fee: "Huspy Fee",
  manual_adjustment: "Adjustment",
  reversal: "Reversal",
};

function ledgerLabel(ledgerId: number): string {
  return sharedLedgers.find((l) => l.id === ledgerId)?.description ?? String(ledgerId);
}

function PostingsSection({ dealId, version }: { dealId: string; version: number }) {
  const [selectedPostingId, setSelectedPostingId] = useState<string | null>(null);

  const { postings, linesByPosting } = useMemo(() => {
    const dealInvoiceIds = new Set(
      sharedInvoices.filter((inv) => inv.dealId === dealId).map((inv) => inv.id),
    );
    const relatedPostingIds = new Set([
      ...sharedPostings.filter((p) => p.dealId === dealId).map((p) => p.id),
      ...sharedPostingLines
        .filter((l) => l.invoiceId && dealInvoiceIds.has(l.invoiceId))
        .map((l) => l.postingId),
    ]);
    const postings = sharedPostings
      .filter((p) => relatedPostingIds.has(p.id))
      .sort((a, b) => a.valueDate.localeCompare(b.valueDate));
    const linesByPosting: Record<string, typeof sharedPostingLines> = {};
    for (const p of postings) {
      linesByPosting[p.id] = sharedPostingLines.filter((l) => l.postingId === p.id);
    }
    return { postings, linesByPosting };
  }, [dealId, version]);

  return (
    <>
      <SectionCard title="Accounting Events" collapsible>
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-2 text-[11px] font-medium text-muted-foreground uppercase tracking-wide w-[30%]">Ledger</th>
                <th className="text-right px-4 py-2 text-[11px] font-medium text-muted-foreground uppercase tracking-wide w-[30%]">Debit</th>
                <th className="text-right px-4 py-2 text-[11px] font-medium text-muted-foreground uppercase tracking-wide w-[30%]">Credit</th>
              </tr>
            </thead>
            <tbody>
              {postings.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-[12px] text-muted-foreground">
                    No accounting entries yet
                  </td>
                </tr>
              )}
              {postings.map((posting) => {
                const lines = linesByPosting[posting.id] ?? [];
                return (
                  <>
                    <tr
                      key={`hdr-${posting.id}`}
                      onClick={() => setSelectedPostingId(posting.id)}
                      className="border-t border-border bg-muted/20 hover:bg-muted/40 cursor-pointer transition-colors"
                    >
                      <td colSpan={3} className="px-4 py-2">
                        <div className="flex items-center gap-3">
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-muted text-muted-foreground shrink-0">
                            {posting.businessProcess}
                          </span>
                          <span className="text-[12px] text-muted-foreground flex-1 truncate">{posting.description ?? "—"}</span>
                          <span className="text-[12px] text-muted-foreground shrink-0">{formatDate(posting.valueDate)}</span>
                          <ExternalLink className="h-3 w-3 text-muted-foreground/50 shrink-0" />
                        </div>
                      </td>
                    </tr>
                    {lines.map((line) => (
                      <tr key={line.id} className="border-t border-border/30">
                        <td className="px-4 py-2.5 text-muted-foreground text-[12px]">{ledgerLabel(line.ledgerId)}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums font-mono font-semibold">
                          {line.side === "DEBIT" ? fmt(line.amount, posting.currency) : <span className="text-muted-foreground/30">—</span>}
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums font-mono font-semibold">
                          {line.side === "CREDIT" ? fmt(line.amount, posting.currency) : <span className="text-muted-foreground/30">—</span>}
                        </td>
                      </tr>
                    ))}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <PostingDetailDialog
        postingId={selectedPostingId}
        allPostings={postings}
        allLines={sharedPostingLines}
        open={!!selectedPostingId}
        onOpenChange={(open) => !open && setSelectedPostingId(null)}
      />
    </>
  );
}

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

const DIRECTION_LABEL: Record<"inbound" | "outbound", string> = {
  inbound: "Payable",
  outbound: "Receivable",
};

const DIRECTION_CLASSES: Record<"inbound" | "outbound", string> = {
  inbound: "bg-amber-50 text-amber-700 border border-amber-200",
  outbound: "bg-emerald-50 text-emerald-700 border border-emerald-200",
};

function InvoicesSection({ dealId, navigate, invoicesVersion }: { dealId: string; navigate: ReturnType<typeof useNavigate>; invoicesVersion: number }) {
  const invoices = useMemo(() => {
    return sharedInvoices
      .filter((inv) => inv.dealId === dealId)
      .sort((a, b) => a.issueDate.localeCompare(b.issueDate));
  }, [dealId, invoicesVersion]);

  if (invoices.length === 0) {
    return (
      <SectionCard title="Invoices" collapsible>
        <p className="text-[13px] text-muted-foreground italic">No invoices for this deal.</p>
      </SectionCard>
    );
  }

  return (
    <SectionCard title="Invoices" collapsible>
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-[11px] uppercase tracking-wide">Invoice #</th>
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-[11px] uppercase tracking-wide">Counterparty</th>
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-[11px] uppercase tracking-wide">Type</th>
              <th className="text-right px-4 py-2.5 font-medium text-muted-foreground text-[11px] uppercase tracking-wide">Amount</th>
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-[11px] uppercase tracking-wide">Status</th>
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-[11px] uppercase tracking-wide">Issue Date</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => {
              const party = sharedParties.find((p) => p.id === inv.partyId);
              const dir = inv.direction as "inbound" | "outbound";
              return (
                <tr
                  key={inv.id}
                  onClick={() => navigate(`/invoices/${inv.id}`)}
                  className="border-b border-border/50 last:border-0 hover:bg-muted/30 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 font-mono text-[12px] text-foreground">{inv.invoiceNumber}</td>
                  <td className="px-4 py-3 text-[12px] text-muted-foreground">{party?.displayName ?? inv.partyId}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium inline-block ${DIRECTION_CLASSES[dir]}`}>
                      {DIRECTION_LABEL[dir]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-semibold tabular-nums">
                    {fmt(inv.subtotal + (inv.vatAmount ?? 0), inv.currency)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium inline-block ${STATUS_CLASSES[inv.status]}`}>
                      {STATUS_LABEL[inv.status]}
                    </span>
                  </td>
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

function CommentsSection({ dealId, canAdd }: { dealId: string; canAdd: boolean }) {
  const [comments, setComments] = useState(() =>
    sharedDealComments.filter((c) => c.dealId === dealId).sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  );
  const [newText, setNewText] = useState("");

  const handleSend = () => {
    const trimmed = newText.trim();
    if (!trimmed) return;
    setComments((prev) => [
      ...prev,
      { id: `dc-local-${Date.now()}`, dealId, author: "ops" as const, authorName: "Ops Team", text: trimmed, createdAt: new Date().toISOString() },
    ]);
    setNewText("");
  };

  return (
    <SectionCard title="Comments" collapsible>
      <div className="space-y-3">
        {comments.length === 0 ? (
          <p className="text-[13px] text-muted-foreground italic">No comments on this deal.</p>
        ) : (
          comments.map((c) => {
            const isOps = c.author === "ops";
            return (
              <div key={c.id} className={`flex gap-3 ${isOps ? "" : "flex-row-reverse"}`}>
                <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold ${isOps ? "bg-primary/10 text-primary" : "bg-emerald-500/10 text-emerald-700"}`}>
                  {isOps ? "O" : "A"}
                </div>
                <div className={`flex-1 max-w-[85%] ${isOps ? "" : "items-end flex flex-col"}`}>
                  <div className={`px-3 py-2 rounded-lg text-[13px] ${isOps ? "bg-muted text-foreground" : "bg-emerald-50 dark:bg-emerald-950/20 text-foreground"}`}>
                    {c.text}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">{c.authorName} · {formatDateTime(c.createdAt)}</p>
                </div>
              </div>
            );
          })
        )}
        {canAdd && (
          <div className="flex gap-2 pt-2 border-t border-border/40">
            <textarea
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder="Write a comment to the agent..."
              className="flex-1 px-3 py-2 border border-border rounded-md text-[13px] bg-background placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-ring resize-none h-16"
            />
            <button
              onClick={handleSend}
              disabled={!newText.trim()}
              className={`px-3 py-2 rounded-md text-[13px] font-semibold self-end transition-opacity ${newText.trim() ? "bg-primary text-primary-foreground hover:opacity-90" : "bg-muted text-muted-foreground cursor-not-allowed"}`}
            >
              Send
            </button>
          </div>
        )}
      </div>
    </SectionCard>
  );
}

const DOC_STATUS_LABEL: Record<DocumentRequirementStatus, string> = {
  pending: "Pending",
  uploaded: "Uploaded",
  approved: "Approved",
  waived: "Waived",
};

const DOC_STATUS_CLASSES: Record<DocumentRequirementStatus, string> = {
  pending:  "bg-muted text-muted-foreground",
  uploaded: "bg-amber-50 text-amber-700 border border-amber-200",
  approved: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  waived:   "bg-slate-50 text-slate-500 border border-slate-200",
};

function downloadDoc(label: string) {
  const blob = new Blob([`Document: ${label}\n[Placeholder — no real file in prototype]`], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${label.replace(/[^a-z0-9]/gi, "_")}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

function DocumentsSection({
  docs,
  canEdit,
  onUpdateStatus,
  onAddDoc,
  onUploadDoc,
}: {
  docs: DealDocumentRequirement[];
  canEdit: boolean;
  onUpdateStatus: (id: string, status: DocumentRequirementStatus) => void;
  onAddDoc: (label: string) => void;
  onUploadDoc: (id: string, fileName: string) => void;
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [addingLabel, setAddingLabel] = useState("");

  return (
    <SectionCard id="docs" title="Documents" collapsible>
      {docs.length === 0 && !canEdit ? (
        <p className="text-[13px] text-muted-foreground italic">No document requirements for this deal.</p>
      ) : (
        <div className="divide-y divide-border/40">
          {docs.map((r) => (
            <div key={r.id} className="flex items-center justify-between py-2.5 gap-3">
              <div className="flex items-center gap-2 min-w-0">
                {r.required && <span className="text-[10px] font-semibold text-destructive shrink-0">REQ</span>}
                <span className="text-[13px] text-foreground truncate">{r.label}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {(r.status === "uploaded" || r.status === "approved") && (
                  <button onClick={() => downloadDoc(r.label)} title="Download" className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                    <Download className="h-3.5 w-3.5" />
                  </button>
                )}
                {canEdit && r.status === "pending" && (
                  <label className="px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer">
                    Upload
                    <input type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onUploadDoc(r.id, f.name); e.target.value = ""; }} />
                  </label>
                )}
                {canEdit && r.status === "uploaded" && (
                  <button onClick={() => onUpdateStatus(r.id, "approved")} className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors">
                    Approve
                  </button>
                )}
                {canEdit && (r.status === "pending" || r.status === "uploaded") && (
                  <button onClick={() => onUpdateStatus(r.id, "waived")} className="px-2 py-0.5 rounded text-[11px] font-medium bg-muted text-muted-foreground border border-border hover:bg-muted/80 transition-colors">
                    Waive
                  </button>
                )}
                {canEdit && r.status === "waived" && (
                  <button onClick={() => onUpdateStatus(r.id, "pending")} className="px-2 py-0.5 rounded text-[11px] font-medium bg-muted text-muted-foreground border border-border hover:bg-muted/80 transition-colors">
                    Un-waive
                  </button>
                )}
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${DOC_STATUS_CLASSES[r.status]}`}>
                  {DOC_STATUS_LABEL[r.status]}
                </span>
              </div>
            </div>
          ))}
          {canEdit && (
            <div className="pt-3">
              {isAdding ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={addingLabel}
                    onChange={(e) => setAddingLabel(e.target.value)}
                    placeholder="Document name..."
                    autoFocus
                    className="flex-1 px-3 py-1.5 border border-border rounded-md text-[13px] bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                  <button
                    onClick={() => { if (addingLabel.trim()) { onAddDoc(addingLabel.trim()); setAddingLabel(""); setIsAdding(false); } }}
                    disabled={!addingLabel.trim()}
                    className={`px-3 py-1.5 rounded-md text-[13px] font-medium ${addingLabel.trim() ? "bg-primary text-primary-foreground hover:opacity-90" : "bg-muted text-muted-foreground cursor-not-allowed"}`}
                  >
                    Add
                  </button>
                  <button onClick={() => { setAddingLabel(""); setIsAdding(false); }} className="px-3 py-1.5 rounded-md text-[13px] font-medium text-muted-foreground hover:text-foreground">
                    Cancel
                  </button>
                </div>
              ) : (
                <button onClick={() => setIsAdding(true)} className="text-[13px] text-primary hover:underline font-medium">
                  + Request document
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </SectionCard>
  );
}
