import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Deal, DealStatus, InvoiceStatus, PayableStatus } from "@/data/types";
import { DealStatusBadge, DealTypeBadge } from "./DealBadges";
import { X, ArrowUpRight, ChevronDown, ChevronRight, CheckCircle2, Circle, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { RequiredDocumentsSection } from "./RequiredDocumentsSection";

interface Props {
  deal: Deal;
  currency: string;
  onClose: () => void;
  onSave?: (updated: Deal) => void;
  onSwitchToPnL?: (deal: Deal) => void;
}

const STAGE_ORDER: { key: DealStatus; label: string }[] = [
  { key: "Reported", label: "Reported" },
  { key: "Pending Details", label: "Pending Details" },
  { key: "Under Review", label: "Under Review" },
  { key: "Ready For Invoicing", label: "Invoicing" },
  { key: "Pending Receivables", label: "Receivables" },
  { key: "Pending Payment", label: "Payment" },
  { key: "Paid", label: "Paid" },
];

function getStageIndex(status: DealStatus): number {
  return STAGE_ORDER.findIndex((s) => s.key === status);
}

// Mock timestamps per stage (in real app would come from deal history)
function getStageDates(deal: Deal): Record<string, string | null> {
  const idx = getStageIndex(deal.status);
  const baseDate = new Date(deal.reportDate);
  const dates: Record<string, string | null> = {};
  STAGE_ORDER.forEach((stage, i) => {
    if (i <= idx) {
      const d = new Date(baseDate);
      d.setDate(d.getDate() + i * 2);
      dates[stage.key] = d.toISOString();
    } else {
      dates[stage.key] = null;
    }
  });
  return dates;
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}


// Collapsible section
function Section({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-border">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full py-3.5 text-[14px] font-semibold text-foreground hover:text-primary transition-colors"
      >
        {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        {title}
      </button>
      {open && <div className="pb-4">{children}</div>}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string | React.ReactNode }) {
  return (
    <div className="flex items-center py-1.5">
      <span className="w-[140px] text-[12px] text-muted-foreground shrink-0">{label}</span>
      <span className="text-[13px] text-foreground font-medium">{value}</span>
    </div>
  );
}

const invoiceStatusColor = (s?: InvoiceStatus | string) => {
  switch (s) {
    case "Paid": return "bg-[hsl(var(--deal-paid)/0.1)] text-[hsl(var(--deal-paid))]";
    case "Paid Partial": return "bg-[hsl(var(--deal-pending-payment)/0.1)] text-[hsl(var(--deal-pending-payment))]";
    case "Sent": return "bg-[hsl(var(--deal-reported)/0.1)] text-[hsl(var(--deal-reported))]";
    case "Overdue": return "bg-[hsl(var(--deal-pending-payment)/0.1)] text-[hsl(var(--deal-pending-payment))]";
    case "Created": return "bg-muted text-muted-foreground";
    case "Cancelled": return "bg-muted text-muted-foreground line-through";
    default: return "bg-muted text-muted-foreground";
  }
};

const payableStatusColor = (s?: PayableStatus | string) => {
  switch (s) {
    case "Paid": return "bg-[hsl(var(--deal-paid)/0.1)] text-[hsl(var(--deal-paid))]";
    case "Approved": return "bg-[hsl(var(--deal-reported)/0.1)] text-[hsl(var(--deal-reported))]";
    case "Pending": return "bg-[hsl(var(--deal-pending-details)/0.1)] text-[hsl(var(--deal-pending-details))]";
    case "Rejected": return "bg-[hsl(var(--deal-pending-payment)/0.1)] text-[hsl(var(--deal-pending-payment))]";
    case "Overdue": return "bg-[hsl(var(--deal-pending-payment)/0.1)] text-[hsl(var(--deal-pending-payment))]";
    default: return "bg-muted text-muted-foreground";
  }
};

export function DealListingDetailPanel({ deal, currency, onClose, onSave, onSwitchToPnL }: Props) {
  const navigate = useNavigate();
  const stageDates = getStageDates(deal);
  const currentIdx = getStageIndex(deal.status);
  const isPendingDetails = deal.status === "Pending Details";
  const [noteValue, setNoteValue] = useState(deal.latestNote || "");

  // Editable missing fields state for Pending Details
  const [sellerName, setSellerName] = useState(deal.sellerName || "");
  const [sellerTaxId, setSellerTaxId] = useState(deal.sellerTaxId || "");
  const [partnerBank, setPartnerBank] = useState(deal.externalPartners?.[0]?.partnerBank || "");
  const [buyerName, setBuyerName] = useState(deal.buyerName || "");
  const [agentName, setAgentName] = useState(deal.agentName || "");
  const [takeRate, setTakeRate] = useState(deal.takeRate || 0);
  const [agentCommission, setAgentCommission] = useState(deal.agents?.[0]?.agentCommissionRate || 0);
  const [teamLeadName, setTeamLeadName] = useState(deal.agents?.[0]?.teamLeadName || "");
  const [managerOverride, setManagerOverride] = useState(deal.agents?.[0]?.managerOverrideRate || 0);
  const [uploadedDocs, setUploadedDocs] = useState<Set<number>>(new Set());

  const hasPendingChanges = useMemo(() => {
    if (!isPendingDetails) return false;
    return (
      sellerName !== (deal.sellerName || "") ||
      sellerTaxId !== (deal.sellerTaxId || "") ||
      partnerBank !== (deal.externalPartners?.[0]?.partnerBank || "") ||
      buyerName !== (deal.buyerName || "") ||
      agentName !== (deal.agentName || "") ||
      takeRate !== (deal.takeRate || 0) ||
      agentCommission !== (deal.agents?.[0]?.agentCommissionRate || 0) ||
      teamLeadName !== (deal.agents?.[0]?.teamLeadName || "") ||
      managerOverride !== (deal.agents?.[0]?.managerOverrideRate || 0) ||
      uploadedDocs.size > 0
    );
  }, [isPendingDetails, sellerName, sellerTaxId, partnerBank, buyerName, agentName, takeRate, agentCommission, teamLeadName, managerOverride, uploadedDocs, deal]);

  const handlePendingSave = () => {
    const updatedAgents = [...(deal.agents || [])];
    if (updatedAgents.length > 0) {
      updatedAgents[0] = {
        ...updatedAgents[0],
        agentCommissionRate: agentCommission || updatedAgents[0].agentCommissionRate,
        teamLeadName: teamLeadName || updatedAgents[0].teamLeadName,
        managerOverrideRate: managerOverride || updatedAgents[0].managerOverrideRate,
      };
    }
    const updated: Deal = {
      ...deal,
      sellerName: sellerName || deal.sellerName,
      sellerTaxId: sellerTaxId || deal.sellerTaxId,
      buyerName: buyerName || deal.buyerName,
      agentName: agentName || deal.agentName,
      takeRate: takeRate || deal.takeRate,
      agents: updatedAgents,
      externalPartners: deal.externalPartners?.map((p, i) =>
        i === 0 ? { ...p, partnerBank: partnerBank || p.partnerBank } : p
      ) || [],
    };
    onSave?.(updated);
    setUploadedDocs(new Set());
    toast.success("Changes saved successfully");
  };

  return (
    <div className="w-[420px] min-w-[420px] border-l border-border bg-card h-full overflow-y-auto">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="text-xl font-semibold text-foreground">{deal.id}</h2>
            <p className="text-[13px] text-muted-foreground mt-1">
              <button onClick={() => navigate(`/clients?selected=${encodeURIComponent(deal.clientName)}`)} className="text-primary underline underline-offset-2 hover:opacity-80">{deal.clientName}</button>
            </p>
          </div>
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

        {/* ── Deal Information (first, expanded by default) ── */}
        <Section title="Deal Information" defaultOpen={true}>
          <div className="space-y-0.5">
            <div className="flex items-center py-1.5">
              <span className="w-[140px] text-[12px] text-muted-foreground shrink-0">Type</span>
              <DealTypeBadge type={deal.type} />
            </div>
            <div className="flex items-center py-1.5">
              <span className="w-[140px] text-[12px] text-muted-foreground shrink-0">Status</span>
              <DealStatusBadge status={deal.status} isDisputed={deal.isDisputed} />
            </div>
            <DetailRow label="Business Unit" value={deal.businessUnit} />
            <DetailRow label="Market" value={deal.market} />
            <DetailRow label="Country" value={deal.country} />
            <DetailRow label="OF/Case #" value={deal.ofCaseNumber ? (
              <button onClick={() => navigate(`/?selected=${encodeURIComponent(deal.ofCaseNumber!)}`)} className="text-primary underline underline-offset-2 hover:opacity-80">{deal.ofCaseNumber}</button>
            ) : "—"} />
            <DetailRow label="Report Date" value={formatDateTime(deal.reportDate)} />
            {deal.channel && <DetailRow label="Channel" value={deal.channel} />}
          </div>
        </Section>

        {/* ── Deal Progress Timeline (collapsible) ── */}
        <Section title="Deal Progress" defaultOpen={!!deal.isDisputed}>
          <div className="relative pl-4">
            {STAGE_ORDER.map((stage, i) => {
              const completed = i <= currentIdx;
              const isCurrent = i === currentIdx;
              const dateStr = stageDates[stage.key];

              // Find dispute entries in statusHistory that relate to this stage
              const disputeEntry = deal.statusHistory?.find(
                (h) => h.to === stage.key && (h.from === "Ready For Invoicing" || h.from === "Pending Details") && h.note
              );

              return (
                <div key={stage.key} className="relative flex items-start gap-3 pb-6 last:pb-0">
                  {i < STAGE_ORDER.length - 1 && (
                    <div
                      className={`absolute left-[9px] top-[22px] w-[2px] h-[calc(100%-10px)] ${
                        i < currentIdx ? "bg-[hsl(var(--deal-paid))]" : "bg-border"
                      }`}
                    />
                  )}
                  <div className="relative z-10 shrink-0">
                    {completed ? (
                      <CheckCircle2 className="h-5 w-5 text-[hsl(var(--deal-paid))]" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground/30" />
                    )}
                  </div>
                  <div className="flex-1 -mt-0.5">
                    <p className={`text-[13px] font-medium ${
                      isCurrent ? "text-foreground" : completed ? "text-[hsl(var(--deal-paid))]" : "text-muted-foreground/50"
                    }`}>
                      {stage.label}
                    </p>
                    {dateStr ? (
                      <p className="text-[11px] text-muted-foreground mt-0.5">{formatDateTime(dateStr)}</p>
                    ) : (
                      <p className="text-[11px] text-muted-foreground/40 mt-0.5">Pending</p>
                    )}
                    {disputeEntry && (
                      <div className="mt-2 p-2 bg-muted/50 border border-border rounded-md">
                        <div className="flex items-center gap-1.5 mb-1">
                          <AlertTriangle className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-[11px] font-semibold text-foreground">Disputed — returned from {disputeEntry.from}</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground">{formatDateTime(disputeEntry.timestamp)}</p>
                        {disputeEntry.note && (
                          <p className="text-[11px] text-foreground mt-1">{disputeEntry.note}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Show full status history for disputed deals */}
            {deal.statusHistory && deal.statusHistory.length > 0 && (
              <div className="mt-4 pt-3 border-t border-border">
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Status History</p>
                {deal.statusHistory.map((entry, i) => (
                  <div key={i} className="flex items-start gap-2 py-1.5">
                    <span className="text-[11px] text-muted-foreground shrink-0 w-[120px]">{formatDateTime(entry.timestamp)}</span>
                    <span className="text-[11px] text-foreground">
                      {entry.from} → {entry.to}
                      {entry.note && (
                        <span className="text-muted-foreground ml-1">({entry.note})</span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Section>


        {/* PnL Summary for Under Review+ deals */}
        {deal.status !== "Reported" && deal.status !== "Pending Details" && (
          <Section title="P&L Summary" defaultOpen={true}>
            <div className="space-y-0.5">
              <DetailRow label="Total Revenue" value={formatAmount(deal.huspyRevenue + deal.conveyanceRevenue, currency)} />
              <DetailRow label="Internal COGS" value={formatAmount(deal.cogsInternal, currency)} />
              <DetailRow label="External COGS" value={formatAmount(deal.cogsExternal, currency)} />
              <DetailRow label="Referral COGS" value={formatAmount(deal.cogsReferrals, currency)} />
              <div className="flex items-center py-1.5">
                <span className="w-[140px] text-[12px] text-muted-foreground shrink-0">Net P&L</span>
                <span className={`text-[13px] font-bold ${(deal.huspyRevenue + deal.conveyanceRevenue - deal.cogsInternal - deal.cogsExternal - deal.cogsReferrals) >= 0 ? "text-[hsl(var(--deal-paid))]" : "text-destructive"}`}>
                  {formatAmount(deal.huspyRevenue + deal.conveyanceRevenue - deal.cogsInternal - deal.cogsExternal - deal.cogsReferrals, currency)}
                </span>
              </div>
            </div>
            <button
              onClick={() => onSwitchToPnL?.(deal)}
              className="mt-3 flex items-center gap-1.5 text-[12px] font-medium text-primary hover:underline underline-offset-2 transition-colors"
            >
              <ArrowUpRight className="h-3.5 w-3.5" />
              View full P&L details
            </button>
          </Section>
        )}

        {deal.status !== "Reported" && deal.status !== "Pending Details" && (
          <Section title="Receivables" defaultOpen={deal.status === "Pending Receivables"}>
            <div className="space-y-1.5">
              {(deal.receivables || []).length === 0 ? (
                <span className="text-[12px] text-muted-foreground italic">No receivable entities yet.</span>
              ) : (
                <div className="border border-border/50 rounded-lg overflow-hidden">
                  <div className="grid grid-cols-2 px-3 py-1.5 bg-muted/40 border-b border-border/50">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Entity</span>
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider text-right">Invoice Status</span>
                  </div>
                  {deal.receivables.map((rec, idx) => (
                    <div key={`rec-${idx}`} className="grid grid-cols-2 px-3 py-2 border-b border-border/30 last:border-b-0">
                      <span className="text-[12px] text-foreground font-medium">{rec.entityName}</span>
                      <div className="flex justify-end">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap ${invoiceStatusColor(rec.invoiceStatus)}`}>
                          {rec.invoiceStatus || "No Invoice"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => navigate("/deals?view=finance&tab=receivables")}
              className="mt-3 flex items-center gap-1.5 text-[12px] font-medium text-primary hover:underline underline-offset-2 transition-colors"
            >
              <ArrowUpRight className="h-3.5 w-3.5" />
              View full receivables details
            </button>
          </Section>
        )}

        {deal.status !== "Reported" && deal.status !== "Pending Details" && (
          <Section title="Payables" defaultOpen={deal.status === "Pending Payment"}>
            <div className="space-y-1.5">
              {(deal.payables || []).length === 0 ? (
                <span className="text-[12px] text-muted-foreground italic">No payable entities yet.</span>
              ) : (
                <div className="border border-border/50 rounded-lg overflow-hidden">
                  <div className="grid grid-cols-2 px-3 py-1.5 bg-muted/40 border-b border-border/50">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Entity</span>
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider text-right">Status</span>
                  </div>
                  {deal.payables.map((payable, idx) => (
                    <div key={`pay-${idx}`} className="grid grid-cols-2 px-3 py-2 border-b border-border/30 last:border-b-0">
                      <span className="text-[12px] text-foreground font-medium">{payable.entityLabel}</span>
                      <div className="flex justify-end">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap ${payableStatusColor(payable.status)}`}>
                          {payable.status === "Pending" ? "Created" : payable.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => navigate("/deals?view=finance&tab=payables")}
              className="mt-3 flex items-center gap-1.5 text-[12px] font-medium text-primary hover:underline underline-offset-2 transition-colors"
            >
              <ArrowUpRight className="h-3.5 w-3.5" />
              View full payables details
            </button>
          </Section>
        )}



        <Section title="Notes" defaultOpen={!!deal.isDisputed}>
          <textarea
            placeholder="Add a note..."
            value={noteValue}
            onChange={(e) => setNoteValue(e.target.value)}
            className="w-full px-3 py-2.5 border border-border rounded-md text-[13px] bg-background placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-ring resize-none h-24"
          />
          {noteValue !== (deal.latestNote || "") && (
            <button
              onClick={() => {
                onSave?.({ ...deal, latestNote: noteValue });
                toast.success("Note saved");
              }}
              className="mt-2 px-4 py-1.5 bg-primary text-primary-foreground rounded-md text-[12px] font-medium hover:opacity-90 transition-opacity"
            >
              Save Note
            </button>
          )}
        </Section>

        {/* ── Missing Information (Pending Details) ── */}
        {isPendingDetails && (
          <Section title="Required Information" defaultOpen={true}>
            <div className="space-y-3">
              <PendingField label="Beneficiary Name" value={sellerName} onChange={setSellerName} placeholder="Full legal name of the account holder" isMissing={!deal.sellerName && !sellerName} />
              <PendingField label="Tax ID (NIF/CIF)" value={sellerTaxId} onChange={setSellerTaxId} placeholder="e.g. 12345678A" isMissing={!deal.sellerTaxId && !sellerTaxId} />
              <PendingField label="Bank Account (IBAN)" value={partnerBank} onChange={setPartnerBank} placeholder="e.g. ES91 2100 0418 4502 0005 1332" isMissing={!deal.externalPartners?.[0]?.partnerBank && !partnerBank} />
              <PendingField label="Buyer's Name" value={buyerName} onChange={setBuyerName} placeholder="Buyer's full name" isMissing={!deal.buyerName && !buyerName} />
              <PendingField label="Agent Name" value={agentName} onChange={setAgentName} placeholder="Agent's full name" isMissing={!deal.agentName && !agentName} />
              <PendingNumericField label="Take Rate (%)" value={takeRate} onChange={setTakeRate} placeholder="e.g. 2.5" isMissing={!deal.takeRate && !takeRate} />
              <PendingNumericField label="Agent Commission (%)" value={agentCommission} onChange={setAgentCommission} placeholder="e.g. 50" isMissing={!deal.agents?.[0]?.agentCommissionRate && !agentCommission} />
              <PendingField label="Team Lead Name" value={teamLeadName} onChange={setTeamLeadName} placeholder="Team lead's full name" isMissing={!deal.agents?.[0]?.teamLeadName && !teamLeadName} />
              <PendingNumericField label="Manager's Override (%)" value={managerOverride} onChange={setManagerOverride} placeholder="e.g. 5" isMissing={!deal.agents?.[0]?.managerOverrideRate && !managerOverride} />
            </div>

            <div className="mt-5">
              <RequiredDocumentsSection
                uploadedDocs={uploadedDocs}
                onUpload={(idx) => setUploadedDocs((prev) => new Set(prev).add(idx))}
                variant="panel"
              />
            </div>

            <button
              onClick={handlePendingSave}
              disabled={!hasPendingChanges}
              className={`w-full mt-5 py-2.5 rounded-md text-[13px] font-semibold transition-opacity ${hasPendingChanges ? "bg-primary text-primary-foreground hover:opacity-90" : "bg-muted text-muted-foreground cursor-not-allowed"}`}
            >
              Save Changes
            </button>
          </Section>
        )}
      </div>
    </div>
  );
}

function PendingField({ label, value, onChange, placeholder, isMissing }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string; isMissing: boolean;
}) {
  return (
    <div>
      <label className={`text-[13px] font-medium mb-1.5 block ${isMissing ? "text-destructive" : "text-foreground"}`}>
        {label} {isMissing && <span className="text-destructive">*</span>}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full px-3 py-2 border rounded-md text-[13px] bg-background focus:outline-none focus:ring-1 focus:ring-ring ${isMissing ? "border-destructive ring-1 ring-destructive/50" : "border-border"}`}
      />
    </div>
  );
}

function PendingNumericField({ label, value, onChange, placeholder, isMissing }: {
  label: string; value: number; onChange: (v: number) => void; placeholder: string; isMissing: boolean;
}) {
  return (
    <div>
      <label className={`text-[13px] font-medium mb-1.5 block ${isMissing ? "text-destructive" : "text-foreground"}`}>
        {label} {isMissing && <span className="text-destructive">*</span>}
      </label>
      <input
        type="number"
        value={value || ""}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        placeholder={placeholder}
        className={`w-full px-3 py-2 border rounded-md text-[13px] bg-background focus:outline-none focus:ring-1 focus:ring-ring tabular-nums ${isMissing ? "border-destructive ring-1 ring-destructive/50" : "border-border"}`}
      />
    </div>
  );
}
