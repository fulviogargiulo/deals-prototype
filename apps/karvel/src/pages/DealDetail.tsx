import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { findDeal, updateDeal } from "@/data/dealStore";
import { Deal, DealStatus } from "@/data/types";
import { DealStatusBadge } from "@/components/DealBadges";
import { ArrowLeft, CheckCircle2, Circle, ExternalLink, Download } from "lucide-react";
import { computeDealPnL } from "@/lib/dealCalculations";
import { toast } from "sonner";
import {
  canTransitionDealStatus,
  getAllowedDealTransitions,
  sharedInvoices,
  sharedParties,
  sharedDealComments,
  sharedDealDocumentRequirements,
  sharedPostings,
  sharedPostingLines,
  sharedLedgers,
  type InvoiceStatus,
  type DocumentRequirementStatus,
  type DealDocumentRequirement,
} from "@huspy/shared-domain";
import { PnLWaterfall } from "@/components/PnLWaterfall";
import { PostingDetailDialog } from "@/components/PostingDetailDialog";

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
  const [statusHistory, setStatusHistory] = useState(deal?.statusHistory ?? []);
  const [docs, setDocs] = useState<DealDocumentRequirement[]>(() =>
    sharedDealDocumentRequirements.filter((r) => r.dealId === (deal?.id ?? ""))
  );

  useEffect(() => {
    if (!deal) return;
    setStatus(deal.status);
    setOfCaseNumber(deal.ofCaseNumber ?? "");
    setStatusHistory(deal.statusHistory ?? []);
    setDocs(sharedDealDocumentRequirements.filter((r) => r.dealId === deal.id));
  }, [deal]);

  const hasChanges = useMemo(() => {
    if (!deal) return false;
    return status !== deal.status || ofCaseNumber !== (deal.ofCaseNumber ?? "");
  }, [deal, status, ofCaseNumber]);

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
  const allowedTransitions = [status, ...getAllowedDealTransitions(status)];
  const stageDates = getStageDates({ ...deal, status, statusHistory });
  const currentIdx = getStageIndex(status);
  const canEditOps = status === "pending-details" || status === "under-review";

  const handleStatusChange = (to: DealStatus) => {
    if (to === status) return;
    if (!canTransitionDealStatus(status, to)) {
      toast.error(`Cannot transition ${status} → ${to}`);
      return;
    }
    if (status === "under-review" && to === "pending-agent-approval") {
      const docs = sharedDealDocumentRequirements.filter((r) => r.dealId === deal.id);
      const allClear = docs.every((r) => r.status === "approved" || r.status === "waived");
      if (!allClear) {
        toast.error("Cannot move to Agent Approval: all documents must be approved or waived first.");
        return;
      }
    }
    const entry = { from: status, to, timestamp: new Date().toISOString(), note: "Manual transition" };
    setStatus(to);
    setStatusHistory((prev) => [...prev, entry]);
  };

  const handleSave = () => {
    const updated: Deal = { ...deal, status, ofCaseNumber, statusHistory };
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
            <DealStatusBadge status={status} />
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
                  <ReadRow label="Market" value={deal.market} />
                  <ReadRow label="Country" value={deal.country?.toUpperCase()} />
                  <ReadRow label="Currency" value={deal.currency} />
                  <ReadRow label="Report Date" value={deal.reportDate ? formatDate(deal.reportDate) : "—"} />
                  <ReadRow label="Created" value={deal.createdAt ? formatDate(deal.createdAt) : "—"} />
                </div>
                <div>
                  <ReadRow label="Property" value={deal.title ?? deal.buildingName ?? "—"} />
                  <ReadRow label="Offer ID" value={deal.offerId ?? "—"} />
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

            {/* P&L */}
            <SectionCard title="P&L">
              <PnLWaterfall
                deal={deal}
                currency={currency}
                pnl={pnl}
                canEdit={canEditOps}
                onChanged={() => setStakesVersion((v) => v + 1)}
              />
            </SectionCard>

            {/* Invoices */}
            <InvoicesSection dealId={deal.id} navigate={navigate} />

            {/* Accounting Events */}
            <PostingsSection dealId={deal.id} />

            {/* Ops ↔ Agent thread */}
            <CommentsSection dealId={deal.id} canAdd={canEditOps} />

            {/* Document checklist */}
            <DocumentsSection
              docs={docs}
              canEdit={canEditOps}
              onUpdateStatus={(id, newStatus) =>
                setDocs((prev) => prev.map((r) => r.id === id ? { ...r, status: newStatus } : r))
              }
              onAddDoc={(label) =>
                setDocs((prev) => [...prev, { id: `ddr-local-${Date.now()}`, dealId: deal.id, label, required: false, status: "pending" }])
              }
            />
          </div>

          {/* Right sidebar: Deal Progress + Timeline */}
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
              </div>
            </SectionCard>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DealDetail;


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

function PostingsSection({ dealId }: { dealId: string }) {
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
  }, [dealId]);

  if (postings.length === 0) return null;

  return (
    <>
      <SectionCard title="Accounting Events">
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
                            {PROCESS_LABELS[posting.businessProcess] ?? posting.businessProcess}
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

function InvoicesSection({ dealId, navigate }: { dealId: string; navigate: ReturnType<typeof useNavigate> }) {
  const invoices = useMemo(() => {
    return sharedInvoices
      .filter((inv) => inv.dealId === dealId)
      .sort((a, b) => a.issueDate.localeCompare(b.issueDate));
  }, [dealId]);

  if (invoices.length === 0) {
    return (
      <SectionCard title="Invoices">
        <p className="text-[13px] text-muted-foreground italic">No invoices for this deal.</p>
      </SectionCard>
    );
  }

  return (
    <SectionCard title="Invoices">
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
    <SectionCard title="Comments">
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
}: {
  docs: DealDocumentRequirement[];
  canEdit: boolean;
  onUpdateStatus: (id: string, status: DocumentRequirementStatus) => void;
  onAddDoc: (label: string) => void;
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [addingLabel, setAddingLabel] = useState("");

  return (
    <SectionCard title="Documents">
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

