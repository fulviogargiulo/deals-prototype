import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { findDeal, updateDeal } from "@/data/dealStore";
import { Deal, DealStatus, DealType, DealMarket, BusinessUnit, Country, PaymentMode, InvoiceStatus, PayableStatus, AgentEntry, ExternalPartnerEntry, PayableEntry, ReceivableEntry } from "@/data/types";
import { DealStatusBadge, DealTypeBadge } from "@/components/DealBadges";
import { ArrowLeft, CheckCircle2, Circle, AlertTriangle, ChevronDown, ChevronRight, Plus, Trash2 } from "lucide-react";
import { recalculateDeal, createEmptyAgent } from "@/lib/dealCalculations";
import { toast } from "sonner";
import { RequiredDocumentsSection } from "@/components/RequiredDocumentsSection";

const STAGE_ORDER: { key: DealStatus; label: string }[] = [
  { key: "reported", label: "reported" },
  { key: "pending-details", label: "pending-details" },
  { key: "under-review", label: "under-review" },
  { key: "pending-agent-approval", label: "Approval" },
  { key: "pending-receivables", label: "Receivables" },
  { key: "finalized", label: "Finalized" },
];

const MBU_CHANNELS = ["MA/Broker", "BBG/Commercial", "B2C/Digital", "REA", "REA Purchase", "BYOB", "Direct Sales"];

function getStageIndex(status: DealStatus): number {
  return STAGE_ORDER.findIndex((s) => s.key === status);
}

function getStageDates(deal: Deal): Record<string, string | null> {
  const dates: Record<string, string | null> = {};
  STAGE_ORDER.forEach((stage) => { dates[stage.key] = null; });
  dates["reported"] = new Date(deal.reportDate).toISOString();
  if (deal.statusHistory) {
    for (const entry of deal.statusHistory) {
      if (dates[entry.to] === null) dates[entry.to] = entry.timestamp;
    }
  }
  return dates;
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit", hour12: true,
  });
}

function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}

const countryCurrencyMap: Record<string, string> = { UAE: "AED", Spain: "EUR", KSA: "SAR" };

function Section({ title, children, defaultOpen = false, className = "" }: { title: string; children: React.ReactNode; defaultOpen?: boolean; className?: string }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`bg-card border border-border rounded-lg shadow-sm ${className}`}>
      <button onClick={() => setOpen(!open)} className="flex items-center gap-2.5 w-full px-6 py-4 text-base font-semibold text-foreground hover:text-primary transition-colors border-b border-border">
        {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        {title}
      </button>
      {open && <div className="px-6 py-5">{children}</div>}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string | React.ReactNode }) {
  return (
    <div className="flex items-center py-2 min-w-0">
      <span className="w-[140px] text-[13px] text-muted-foreground shrink-0">{label}</span>
      <span className="text-sm text-foreground font-medium truncate">{value}</span>
    </div>
  );
}

/* ---- Editable field helpers ---- */
function EditField({ label, value, onChange, type = "text", placeholder, missing, critical }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; missing?: boolean; critical?: boolean;
}) {
  const colorClass = critical
    ? "text-destructive font-medium"
    : missing
    ? "text-amber-600 dark:text-amber-400 font-medium"
    : "text-muted-foreground";
  const borderClass = critical
    ? "border-destructive bg-destructive/5"
    : missing
    ? "border-amber-400 bg-amber-50 dark:bg-amber-950/30"
    : "border-border";
  return (
    <div className="flex items-center py-2 min-w-0">
      <span className={`w-[140px] text-[13px] shrink-0 ${colorClass}`}>{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`flex-1 min-w-0 px-3 py-2 border rounded-md text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring ${borderClass}`}
      />
    </div>
  );
}

function NumericField({ label, value, onChange, missing, critical }: {
  label: string; value: number; onChange: (v: number) => void; missing?: boolean; critical?: boolean;
}) {
  const colorClass = critical
    ? "text-destructive font-medium"
    : missing
    ? "text-amber-600 dark:text-amber-400 font-medium"
    : "text-muted-foreground";
  const borderClass = critical
    ? "border-destructive bg-destructive/5"
    : missing
    ? "border-amber-400 bg-amber-50 dark:bg-amber-950/30"
    : "border-border";
  return (
    <div className="flex items-center py-2 min-w-0">
      <span className={`w-[140px] text-[13px] shrink-0 ${colorClass}`}>{label}</span>
      <input
        type="number"
        value={value || ""}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className={`flex-1 min-w-0 px-3 py-2 border rounded-md text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring ${borderClass}`}
      />
    </div>
  );
}

function SelectField<T extends string>({ label, value, options, onChange }: {
  label: string; value: T; options: T[]; onChange: (v: T) => void;
}) {
  return (
    <div className="flex items-center py-2 min-w-0">
      <span className="w-[140px] text-[13px] text-muted-foreground shrink-0">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="flex-1 min-w-0 px-3 py-2 border border-border rounded-md text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
      >
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function ComputedField({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center py-2 min-w-0">
      <span className="w-[140px] text-[13px] text-muted-foreground shrink-0">{label}</span>
      <span className={`text-sm font-semibold ${highlight ? "text-primary" : "text-foreground"}`}>{value}</span>
    </div>
  );
}

function SubSectionHeader({ title }: { title: string }) {
  return <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-5 mb-3 border-t border-border/50 pt-4">{title}</p>;
}

const DealDetail = () => {
  const { dealId } = useParams<{ dealId: string }>();
  const navigate = useNavigate();

  const originalDeal = useMemo(() => findDeal(dealId || ""), [dealId]);

  const [draft, setDraft] = useState<Deal | null>(null);
  const [baseline, setBaseline] = useState<Deal | null>(null);
  const [uploadedDocs, setUploadedDocs] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!originalDeal) return;
    const d = { ...originalDeal };
    if (!d.externalPartners || d.externalPartners.length === 0) {
      d.externalPartners = [{ partnerName: "", partnerShare: 0, partnerAmount: 0, partnerBank: "", partnerBankAccount: "" }];
    }
    const recalced = recalculateDeal(d);
    setDraft(recalced);
    setBaseline(recalced);
  }, [originalDeal]);

  const hasChanges = useMemo(() => {
    if (!draft || !baseline) return false;
    return JSON.stringify(draft) !== JSON.stringify(baseline) || uploadedDocs.size > 0;
  }, [draft, baseline, uploadedDocs]);

  if (!originalDeal || !draft) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-foreground mb-2">Deal not found</h1>
          <p className="text-muted-foreground mb-4">The deal "{dealId}" does not exist.</p>
          <button onClick={() => navigate("/deals")} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 transition-opacity">
            Back to Deals
          </button>
        </div>
      </div>
    );
  }

  const currency = countryCurrencyMap[draft.country] || "EUR";
  const fmt = (amount: number) => formatAmount(amount, currency);
  const stageDates = getStageDates(draft);
  const currentIdx = getStageIndex(draft.status);
  const showFinancials = draft.status !== "reported";
  const isPendingDetails = draft.status === "pending-details";
  const netPnL = draft.huspyRevenue + draft.conveyanceRevenue - draft.cogsInternal - draft.cogsExternal - draft.cogsReferrals;
  const isREBU = draft.businessUnit === "rebu";
  const isMBU = draft.businessUnit === "mortgage";

  const update = (field: keyof Deal, value: string | number) => {
    setDraft((prev) => prev ? recalculateDeal({ ...prev, [field]: value } as Deal) : prev);
  };

  const updateAgent = (index: number, field: keyof AgentEntry, value: string | number) => {
    setDraft((prev) => {
      if (!prev) return prev;
      const agents = [...prev.agents];
      agents[index] = { ...agents[index], [field]: value };
      return recalculateDeal({ ...prev, agents });
    });
  };

  const updatePartner = (index: number, field: keyof ExternalPartnerEntry, value: string | number) => {
    setDraft((prev) => {
      if (!prev) return prev;
      const externalPartners = [...(prev.externalPartners || [])];
      externalPartners[index] = { ...externalPartners[index], [field]: value };
      return recalculateDeal({ ...prev, externalPartners });
    });
  };

  const addPartner = () => {
    setDraft((prev) => {
      if (!prev) return prev;
      const externalPartners = [...(prev.externalPartners || []), { partnerName: "", partnerShare: 0, partnerAmount: 0, partnerBank: "", partnerBankAccount: "" }];
      return recalculateDeal({ ...prev, externalPartners });
    });
  };

  const removePartner = (index: number) => {
    setDraft((prev) => {
      if (!prev) return prev;
      const externalPartners = (prev.externalPartners || []).filter((_, i) => i !== index);
      return recalculateDeal({ ...prev, externalPartners });
    });
  };

  const addAgent = () => {
    setDraft((prev) => {
      if (!prev) return prev;
      const agents = [...prev.agents, createEmptyAgent(prev.agents.length)];
      return recalculateDeal({ ...prev, agents });
    });
  };

  const removeAgent = (index: number) => {
    setDraft((prev) => {
      if (!prev) return prev;
      const agents = prev.agents.filter((_, i) => i !== index);
      return recalculateDeal({ ...prev, agents });
    });
  };

  const updateReceivable = (index: number, field: keyof ReceivableEntry, value: string | number) => {
    setDraft((prev) => {
      if (!prev) return prev;
      const receivables = [...(prev.receivables || [])];
      receivables[index] = { ...receivables[index], [field]: value };
      return { ...prev, receivables };
    });
  };

  const updatePayable = (index: number, field: keyof PayableEntry, value: string | number) => {
    setDraft((prev) => {
      if (!prev) return prev;
      const payables = [...(prev.payables || [])];
      payables[index] = { ...payables[index], [field]: value };
      return { ...prev, payables };
    });
  };

  const handleSave = () => {
    updateDeal(draft);
    toast.success("Deal changes saved successfully");
    setBaseline(draft);
    setUploadedDocs(new Set());
  };

  const handleApprove = () => {
    const approved = { ...draft, status: "pending-agent-approval" as DealStatus };
    setDraft(approved);
    setBaseline(approved);
    toast.success("Deal approved and moved to Ready For Invoicing");
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
            <h1 className="text-lg font-semibold text-foreground">{draft.id}</h1>
            <DealStatusBadge status={draft.status} isDisputed={draft.isDisputed} />
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${isREBU ? "bg-blue-500/15 text-blue-700 dark:text-blue-400" : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"}`}>
              {draft.businessUnit}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {draft.status === "under-review" && (
            <button
              onClick={handleApprove}
              className="px-4 py-2 bg-[hsl(var(--deal-ready-invoicing))] text-primary-foreground rounded-md text-[13px] font-semibold hover:opacity-90 transition-opacity"
            >
              Approve & Move to Ready For Invoicing
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={!hasChanges}
            className={`px-4 py-2 rounded-md text-[13px] font-semibold transition-opacity ${hasChanges ? "bg-primary text-primary-foreground hover:opacity-90" : "bg-muted text-muted-foreground cursor-not-allowed"}`}
          >
            Save Changes
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-auto px-6 py-6">
        {/* Main layout: Left content + Right sidebar (timeline/comments) */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5">
          {/* Left: All deal sections */}
          <div className="flex flex-col gap-5">
            {/* Deal Information */}
            <Section title="Deal Information" defaultOpen={true}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-0.5">
                <SelectField label="Business Unit" value={draft.businessUnit} options={["rebu", "mortgage"] as BusinessUnit[]} onChange={(v) => update("businessUnit", v)} />
                <SelectField label="Country" value={draft.country} options={["ae", "es", "sa"] as Country[]} onChange={(v) => update("country", v)} />
                {isMBU && (
                  <SelectField label="Channel" value={draft.channel || MBU_CHANNELS[0]} options={MBU_CHANNELS} onChange={(v) => update("channel", v)} />
                )}
                <EditField label="Client Name" value={draft.clientName} onChange={(v) => update("clientName", v)} />
                <EditField label="Report Date" value={draft.reportDate} type="date" onChange={(v) => update("reportDate", v)} />
                <DetailRow label="Deal ID" value={draft.id} />
                <EditField label="OF/Case Number" value={draft.ofCaseNumber || ""} onChange={(v) => update("ofCaseNumber", v)} />
                <SelectField label="Type" value={draft.type} options={["buy", "sell", "rent", "lease", "buy-sell", "mortgage", "rent-lease"] as DealType[]} onChange={(v) => update("type", v)} />
                <SelectField label="Status" value={draft.status} options={["reported", "pending-details", "under-review", "pending-agent-approval", "pending-receivables", "finalized", "canceled"] as DealStatus[]} onChange={(v) => update("status", v)} />
                <SelectField label="Market" value={draft.market} options={["primary", "secondary", "leasing"] as DealMarket[]} onChange={(v) => update("market", v)} />
                <EditField label="Opportunity" value={draft.opportunityName} onChange={(v) => update("opportunityName", v)} />
              </div>

              {isMBU && (
                <>
                  <SubSectionHeader title="Supply (Bank)" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-0.5">
                    <EditField label="Bank Name" value={draft.bankName || ""} onChange={(v) => update("bankName", v)} />
                    <EditField label="Account Manager" value={draft.accountManager || ""} onChange={(v) => update("accountManager", v)} />
                  </div>
                </>
              )}
            </Section>

            {/* Required Documents (Pending Details only) */}
            {isPendingDetails && (
              <Section title="Required Documents" defaultOpen={true}>
                <RequiredDocumentsSection
                  uploadedDocs={uploadedDocs}
                  onUpload={(idx) => setUploadedDocs((prev) => new Set(prev).add(idx))}
                  variant="page"
                />
              </Section>
            )}

            {/* Property Transaction (REBU only) */}
            {isREBU && (
              <Section title="Property Transaction" defaultOpen={true}>
                <SubSectionHeader title="Property Details" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-0.5">
                  <EditField label="Building Name" value={draft.buildingName || ""} onChange={(v) => update("buildingName", v)} />
                  <EditField label="Unit Number" value={draft.unitNumber || ""} onChange={(v) => update("unitNumber", v)} />
                  <EditField label="Community" value={draft.community || ""} onChange={(v) => update("community", v)} />
                  <EditField label="Sub-Community" value={draft.subCommunity || ""} onChange={(v) => update("subCommunity", v)} />
                  <EditField label="Full Address" value={draft.fullAddress || ""} onChange={(v) => update("fullAddress", v)} />
                  <EditField label="Property Type" value={draft.propertyType || ""} onChange={(v) => update("propertyType", v)} />
                  <EditField label="Project Name" value={draft.projectName || ""} onChange={(v) => update("projectName", v)} />
                </div>

                <SubSectionHeader title="Demand (Buyer)" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-0.5">
                  <EditField label="Buyer Name" value={draft.buyerName || ""} onChange={(v) => update("buyerName", v)} critical={isPendingDetails && !draft.buyerName} />
                  <EditField label="Buyer Phone" value={draft.buyerPhone || ""} onChange={(v) => update("buyerPhone", v)} />
                  <EditField label="Buyer Email" value={draft.buyerEmail || ""} onChange={(v) => update("buyerEmail", v)} />
                </div>

                <SubSectionHeader title="Supply (Seller/Developer)" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-0.5">
                  <EditField label="Seller Name" value={draft.sellerName || ""} onChange={(v) => update("sellerName", v)} critical={isPendingDetails && !draft.sellerName} />
                  <EditField label="Seller Tax ID" value={draft.sellerTaxId || ""} onChange={(v) => update("sellerTaxId", v)} critical={isPendingDetails && !draft.sellerTaxId} />
                  <EditField label="Seller Email" value={draft.sellerEmail || ""} onChange={(v) => update("sellerEmail", v)} />
                  <SelectField label="Payment Mode" value={draft.paymentMode || "cash"} options={["cash", "mortgage"] as PaymentMode[]} onChange={(v) => update("paymentMode", v)} />
                </div>

                {showFinancials && (
                  <>
                    <SubSectionHeader title="Revenue" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-0.5">
                      <NumericField label="Deal Price" value={draft.dealPrice} onChange={(v) => update("dealPrice", v)} />
                      <NumericField label="Take Rate (%)" value={draft.takeRate} onChange={(v) => update("takeRate", v)} critical={isPendingDetails && !draft.takeRate} />
                      <ComputedField label="Huspy Revenue" value={fmt(draft.huspyRevenue)} highlight />
                    </div>

                    <SubSectionHeader title="COGS" />
                    {/* External Partners */}
                    <div className="bg-muted/20 border border-border rounded-lg p-5 mb-5">
                      <p className="text-sm font-semibold text-foreground mb-4">External Partners</p>
                    {(draft.externalPartners || []).map((partner, idx) => (
                      <div key={idx} className="mb-4 border border-border rounded-lg p-4 bg-card">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[13px] font-semibold text-foreground">Partner {idx + 1}</span>
                          {(draft.externalPartners || []).length > 1 && (
                            <button onClick={() => removePartner(idx)} className="text-destructive hover:text-destructive/80 transition-colors">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-0.5">
                          <EditField label="Partner Name" value={partner.partnerName || ""} onChange={(v) => updatePartner(idx, "partnerName", v)} />
                          <NumericField label="Partner Share (%)" value={partner.partnerShare} onChange={(v) => updatePartner(idx, "partnerShare", v)} />
                          <ComputedField label="Partner Amount" value={fmt(partner.partnerAmount)} />
                          <EditField label="Partner Bank" value={partner.partnerBank || ""} onChange={(v) => updatePartner(idx, "partnerBank", v)} critical={isPendingDetails && !partner.partnerBank} />
                          <EditField label="Partner Account" value={partner.partnerBankAccount || ""} onChange={(v) => updatePartner(idx, "partnerBankAccount", v)} />
                        </div>
                      </div>
                    ))}
                    <button onClick={addPartner} className="flex items-center gap-1.5 text-[13px] font-medium text-primary hover:text-primary/80 transition-colors mt-1">
                      <Plus className="h-3.5 w-3.5" /> Add External Partner
                    </button>
                    </div>

                    {draft.market === "primary" && (
                      <div className="bg-muted/20 border border-border rounded-lg p-5 mb-5">
                        <p className="text-sm font-semibold text-foreground mb-4">Rebates</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-0.5">
                          <NumericField label="Rebate (%)" value={draft.rebatePercentage} onChange={(v) => update("rebatePercentage", v)} />
                          <ComputedField label="Rebate Amount" value={fmt(draft.rebateAmount)} />
                        </div>
                      </div>
                    )}

                    {draft.market === "secondary" && (
                      <div className="bg-muted/20 border border-border rounded-lg p-5 mb-5">
                        <p className="text-sm font-semibold text-foreground mb-4">Subsidy</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-0.5">
                          <NumericField label="Subsidy Amount" value={draft.subsidyAmount} onChange={(v) => update("subsidyAmount", v)} />
                        </div>
                      </div>
                    )}

                    {/* Agent Commission (Internal) */}
                    <div className="bg-muted/20 border border-border rounded-lg p-5">
                      <p className="text-sm font-semibold text-foreground mb-4">Internal — Agent Commission</p>
                    {draft.agents.map((agent, idx) => (
                      <div key={idx} className="mb-4 p-3 bg-muted/30 rounded-lg border border-border/50">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[12px] font-bold text-foreground uppercase tracking-wide">Agent {idx + 1}</span>
                          {draft.agents.length > 1 && (
                            <button onClick={() => removeAgent(idx)} className="p-0.5 text-muted-foreground hover:text-destructive transition-colors">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                        {/* Agent */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-0.5">
                          <EditField label="Agent Name" value={agent.agentName} onChange={(v) => updateAgent(idx, "agentName", v)} critical={isPendingDetails && !agent.agentName} />
                          <NumericField label="Agent Share (%)" value={agent.agentShare} onChange={(v) => updateAgent(idx, "agentShare", v)} />
                          <NumericField label="Commission Rate (%)" value={agent.agentCommissionRate} onChange={(v) => updateAgent(idx, "agentCommissionRate", v)} critical={isPendingDetails && !agent.agentCommissionRate} />
                          <ComputedField label="Commission Payout" value={fmt(agent.agentCommissionPayout)} />
                          <NumericField label="Incentive" value={agent.agentIncentive} onChange={(v) => updateAgent(idx, "agentIncentive", v)} />
                          <NumericField label="Deductions" value={agent.agentDeductions} onChange={(v) => updateAgent(idx, "agentDeductions", v)} />
                          <ComputedField label="Total Amount" value={fmt(agent.agentTotalAmount)} highlight />
                        </div>

                        {/* Team Lead */}
                        <div className="border-t border-border/50 mt-4 pt-4">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Team Lead</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-0.5">
                            <EditField label="Team Lead" value={agent.teamLeadName || ""} onChange={(v) => updateAgent(idx, "teamLeadName", v)} critical={isPendingDetails && !agent.teamLeadName} />
                            <NumericField label="TL Rate (%)" value={agent.teamLeadRate} onChange={(v) => updateAgent(idx, "teamLeadRate", v)} />
                            <ComputedField label="TL Share" value={fmt(agent.teamLeadShare)} />
                          </div>
                        </div>

                        {/* Manager */}
                        <div className="border-t border-border/50 mt-4 pt-4">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Manager</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-0.5">
                            <EditField label="Manager" value={agent.managerName || ""} onChange={(v) => updateAgent(idx, "managerName", v)} />
                            <NumericField label="Manager Rate (%)" value={agent.managerOverrideRate} onChange={(v) => updateAgent(idx, "managerOverrideRate", v)} critical={isPendingDetails && !agent.managerOverrideRate} />
                            <ComputedField label="Manager Override" value={fmt(agent.managerOverride)} />
                          </div>
                        </div>

                        {/* Client Kickback */}
                        <div className="border-t border-border/50 mt-4 pt-4">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Client Kickback</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-0.5">
                            <NumericField label="Client Kickback" value={agent.clientKickback} onChange={(v) => updateAgent(idx, "clientKickback", v)} />
                          </div>
                        </div>

                        {/* Referral */}
                        <div className="border-t border-border/50 mt-4 pt-4">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Referral</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-0.5">
                            <EditField label="Referrer" value={agent.referrerName || ""} onChange={(v) => updateAgent(idx, "referrerName", v)} />
                            <NumericField label="Referral (%)" value={agent.referralPercentage} onChange={(v) => updateAgent(idx, "referralPercentage", v)} />
                            <ComputedField label="Referral Amount" value={fmt(agent.referralAmount)} />
                          </div>
                        </div>
                      </div>
                    ))}
                    <button onClick={addAgent} className="flex items-center gap-1.5 text-[13px] font-medium text-primary hover:text-primary/80 transition-colors mt-2">
                      <Plus className="h-3.5 w-3.5" /> Add Agent
                    </button>
                    </div>
                  </>
                )}
              </Section>
            )}

            {/* Conveyance Transaction (REBU only) */}
            {isREBU && showFinancials && (
              <Section title="Conveyance Transaction" defaultOpen={true}>
                <SubSectionHeader title="Revenue" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-0.5">
                  <NumericField label="Conveyance Revenue" value={draft.conveyanceRevenue} onChange={(v) => update("conveyanceRevenue", v)} />
                </div>

                <SubSectionHeader title="COGS" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-0.5">
                  <EditField label="Conveyance Agent" value={draft.conveyanceAgentName || ""} onChange={(v) => update("conveyanceAgentName", v)} />
                  <NumericField label="Conv. Rate (%)" value={draft.conveyanceAgentRate} onChange={(v) => update("conveyanceAgentRate", v)} />
                  <ComputedField label="Conv. Payout" value={fmt(draft.conveyanceAgentPayout)} />
                  <ComputedField label="Huspy Conv. Share" value={fmt(draft.huspyConveyanceShare)} />
                </div>
              </Section>
            )}

            {/* MBU Financials */}
            {isMBU && showFinancials && (
              <>
                <Section title="Revenue" defaultOpen={true}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-0.5">
                    <NumericField label="Disbursed Amount" value={draft.disbursedAmount} onChange={(v) => update("disbursedAmount", v)} />
                    <NumericField label="# of Tranches" value={draft.numberOfTranches} onChange={(v) => update("numberOfTranches", v)} />
                    <NumericField label="Bank Slab (%)" value={draft.bankSlab} onChange={(v) => update("bankSlab", v)} />
                    <ComputedField label="Huspy Revenue" value={fmt(draft.huspyRevenue)} highlight />
                  </div>
                </Section>
                <Section title="COGS" defaultOpen={true}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-0.5">
                    <EditField label="Broker" value={draft.agentName} onChange={(v) => update("agentName", v)} />
                    <NumericField label="Broker Rate (%)" value={draft.brokerCommissionRate} onChange={(v) => update("brokerCommissionRate", v)} />
                    <ComputedField label="Broker Payout" value={fmt(draft.brokerPayout)} />
                    <EditField label="RM Name" value={draft.rmName || ""} onChange={(v) => update("rmName", v)} />
                    <NumericField label="RM Rate (%)" value={draft.rmCommissionRate} onChange={(v) => update("rmCommissionRate", v)} />
                    <ComputedField label="RM Payout" value={fmt(draft.rmPayout)} />
                    <EditField label="TL Name" value={draft.tlName || ""} onChange={(v) => update("tlName", v)} />
                    <NumericField label="TL Rate (%)" value={draft.tlCommissionRate} onChange={(v) => update("tlCommissionRate", v)} />
                    <ComputedField label="TL Payout" value={fmt(draft.tlPayout)} />
                    <EditField label="DS Name" value={draft.dsName || ""} onChange={(v) => update("dsName", v)} />
                    <NumericField label="DS Rate (%)" value={draft.dsCommissionRate} onChange={(v) => update("dsCommissionRate", v)} />
                    <ComputedField label="DS Payout" value={fmt(draft.dsPayout)} />
                    <NumericField label="External Rate (%)" value={draft.externalCommissionRate} onChange={(v) => update("externalCommissionRate", v)} />
                    <ComputedField label="External Payout" value={fmt(draft.externalPayout)} />
                  </div>
                  <SubSectionHeader title="COGS Summary" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-0.5">
                    <ComputedField label="Internal COGS" value={fmt(draft.cogsInternal)} />
                    <ComputedField label="External COGS" value={fmt(draft.cogsExternal)} />
                    <ComputedField label="Referral COGS" value={fmt(draft.cogsReferrals)} />
                  </div>
                </Section>
              </>
            )}

            {/* Summary (REBU) */}
            {isREBU && showFinancials && !isPendingDetails && (
              <Section title="Summary" defaultOpen={true}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-1">
                  <div>
                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Revenue</p>
                    <ComputedField label="Property Revenue" value={fmt(draft.huspyRevenue)} />
                    <ComputedField label="Conveyance Revenue" value={fmt(draft.conveyanceRevenue)} />
                    <div className="border-t border-border mt-2 pt-2">
                      <ComputedField label="Total Revenue" value={fmt(draft.huspyRevenue + draft.conveyanceRevenue)} highlight />
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">COGS</p>
                    <ComputedField label="Internal COGS" value={fmt(draft.cogsInternal)} />
                    <ComputedField label="External COGS" value={fmt(draft.cogsExternal)} />
                    <ComputedField label="Referral COGS" value={fmt(draft.cogsReferrals)} />
                    {draft.market === "primary" && <ComputedField label="Rebate COGS" value={fmt(draft.cogsRebates)} />}
                    {draft.market === "secondary" && <ComputedField label="Subsidy COGS" value={fmt(draft.cogsSubsidy)} />}
                    <ComputedField label="Conveyance COGS" value={fmt(draft.conveyanceAgentPayout)} />
                    <div className="border-t border-border mt-2 pt-2">
                      <ComputedField label="Total COGS" value={fmt(draft.cogsInternal + draft.cogsExternal + draft.cogsReferrals + draft.conveyanceAgentPayout + (draft.market === "primary" ? draft.cogsRebates : 0) + (draft.market === "secondary" ? draft.cogsSubsidy : 0))} />
                    </div>
                  </div>
                </div>
                <div className="border-t border-border mt-4 pt-3">
                  <div className="flex items-center py-1.5">
                    <span className="w-[130px] text-[14px] font-semibold text-foreground shrink-0">Net P&L</span>
                    <span className={`text-[16px] font-bold ${netPnL >= 0 ? "text-[hsl(var(--deal-paid))]" : "text-destructive"}`}>
                      {fmt(netPnL)}
                    </span>
                  </div>
                </div>
              </Section>
            )}

            {/* MBU P&L Summary */}
            {isMBU && showFinancials && !isPendingDetails && (
              <Section title="P&L Summary" defaultOpen={true}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-0.5">
                  <ComputedField label="Total Revenue" value={fmt(draft.huspyRevenue)} />
                  <ComputedField label="Total COGS" value={fmt(draft.cogsInternal + draft.cogsExternal + draft.cogsReferrals)} />
                  <div className="flex items-center py-1.5">
                    <span className="w-[130px] text-[13px] text-muted-foreground shrink-0">Net P&L</span>
                    <span className={`text-[14px] font-bold ${netPnL >= 0 ? "text-[hsl(var(--deal-paid))]" : "text-destructive"}`}>
                      {fmt(netPnL)}
                    </span>
                  </div>
                </div>
              </Section>
            )}

            {/* Receivables */}
            {showFinancials && !isPendingDetails && (
              <Section title="Receivables" defaultOpen={draft.status === "pending-receivables"}>
                <div className="space-y-3">
                  {(draft.receivables || []).length === 0 ? (
                    <span className="text-[12px] text-muted-foreground italic">No receivable entries.</span>
                  ) : (
                    (draft.receivables || []).map((entry, idx) => (
                      <div key={idx} className="p-3 bg-muted/30 rounded-lg border border-border/50">
                        <p className="text-[12px] font-semibold text-foreground mb-2 capitalize">{entry.entityName} <span className="text-muted-foreground font-normal">({entry.entityType})</span></p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-0.5">
                          <EditField label="Invoice #" value={entry.invoiceNumber || ""} onChange={(v) => updateReceivable(idx, "invoiceNumber", v)} />
                          <NumericField label="Amount" value={entry.amount} onChange={(v) => updateReceivable(idx, "amount", v)} />
                          <SelectField label="Status" value={entry.invoiceStatus || "issued"} options={["issued", "paid", "cancelled"] as InvoiceStatus[]} onChange={(v) => updateReceivable(idx, "invoiceStatus", v)} />
                          <EditField label="Invoice Date" value={entry.invoiceDate || ""} type="date" onChange={(v) => updateReceivable(idx, "invoiceDate", v)} />
                          {entry.invoiceStatus === "paid" && (
                            <>
                              <EditField label="Payment Date" value={entry.paymentReceivedDate || ""} type="date" onChange={(v) => updateReceivable(idx, "paymentReceivedDate", v)} />
                              <NumericField label="Amount Received" value={entry.paymentReceivedAmount ?? 0} onChange={(v) => updateReceivable(idx, "paymentReceivedAmount", v)} />
                            </>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Section>
            )}

            {/* Payables */}
            {showFinancials && !isPendingDetails && (
              <Section title="Payables" defaultOpen={draft.status === "pending-receivables"}>
                <div className="space-y-2">
                  {(draft.payables || []).length === 0 ? (
                    <span className="text-[12px] text-muted-foreground italic">No payable entities — add COGS entries first.</span>
                  ) : (
                    (draft.payables || []).map((payable, idx) => (
                      <div key={`${payable.entityType}-${idx}`} className="p-3 bg-muted/30 rounded-lg border border-border/50 space-y-0.5">
                        <span className="text-[12px] font-semibold text-foreground block mb-2">{payable.entityLabel}</span>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-0.5">
                          <ComputedField label="Expected Amount" value={fmt(payable.expectedAmount)} />
                          <EditField label="Ref Number" value={payable.refNumber || ""} onChange={(v) => updatePayable(idx, "refNumber", v)} />
                          <SelectField label="Status" value={payable.status} options={["pending", "approved", "paid", "rejected"] as PayableStatus[]} onChange={(v) => updatePayable(idx, "status", v as PayableStatus)} />
                          {payable.status === "paid" && (
                            <>
                              <EditField label="Paid Date" value={payable.paidDate || ""} type="date" placeholder="Select date" onChange={(v) => updatePayable(idx, "paidDate", v)} />
                              <NumericField label="Paid Amount" value={payable.paidAmount ?? 0} onChange={(v) => updatePayable(idx, "paidAmount", v)} />
                            </>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Section>
            )}
          </div>

          {/* Right sidebar: Progress + Dispute + Comments */}
          <div className="flex flex-col gap-5">
            <Section title="Deal Progress" defaultOpen={true}>
              <div className="relative pl-4">
                {STAGE_ORDER.map((stage, i) => {
                  const completed = i <= currentIdx;
                  const isCurrent = i === currentIdx;
                  const dateStr = stageDates[stage.key];
                  const disputeEntry = draft.statusHistory?.find(
                    (h) => h.to === stage.key && (h.from === "pending-agent-approval" || h.from === "pending-details") && h.note
                  );

                  return (
                    <div key={stage.key} className="relative flex items-start gap-3 pb-5 last:pb-0">
                      {i < STAGE_ORDER.length - 1 && (
                        <div className={`absolute left-[9px] top-[24px] w-[2px] h-[calc(100%-14px)] ${i < currentIdx ? "bg-[hsl(var(--deal-paid))]" : "bg-border"}`} />
                      )}
                      <div className="relative z-10 shrink-0 bg-card rounded-full">
                        {completed ? <CheckCircle2 className="h-5 w-5 text-[hsl(var(--deal-paid))]" /> : <Circle className="h-5 w-5 text-muted-foreground/30" />}
                      </div>
                      <div className="flex-1 -mt-0.5">
                        <p className={`text-[13px] font-medium ${isCurrent ? "text-foreground" : completed ? "text-[hsl(var(--deal-paid))]" : "text-muted-foreground/50"}`}>{stage.label}</p>
                        {dateStr ? <p className="text-[11px] text-muted-foreground mt-0.5">{formatDateTime(dateStr)}</p> : !completed && <p className="text-[11px] text-muted-foreground/40 mt-0.5">Pending</p>}
                        {disputeEntry && (
                          <div className="mt-2 p-2 bg-destructive/10 border border-destructive/20 rounded-md">
                            <div className="flex items-center gap-1.5 mb-1">
                              <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                              <span className="text-[11px] font-bold text-destructive">Disputed — returned from {disputeEntry.from}</span>
                            </div>
                            <p className="text-[11px] text-muted-foreground">{formatDateTime(disputeEntry.timestamp)}</p>
                            {disputeEntry.note && <p className="text-[11px] text-foreground mt-1">{disputeEntry.note}</p>}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {draft.statusHistory && draft.statusHistory.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-border">
                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Status History</p>
                    {draft.statusHistory.map((entry, i) => (
                      <div key={i} className="flex items-start gap-2 py-1.5">
                        <span className="text-[11px] text-muted-foreground shrink-0 w-[120px]">{formatDateTime(entry.timestamp)}</span>
                        <span className="text-[11px] text-foreground">
                          {entry.from} → {entry.to}
                          {entry.note && <span className="text-destructive ml-1">({entry.note})</span>}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Section>

            {draft.isDisputed && draft.disputeNote && (
              <Section title="Dispute Details" defaultOpen={true}>
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <div className="flex items-center gap-1.5 mb-2">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    <span className="text-[12px] font-bold text-destructive">Dispute Raised</span>
                  </div>
                  <p className="text-[13px] text-foreground leading-relaxed">{draft.disputeNote}</p>
                </div>
              </Section>
            )}

            <Section title="Comments" defaultOpen={true}>
              <textarea
                placeholder="Add a comment..."
                value={draft.latestNote || ""}
                onChange={(e) => update("latestNote", e.target.value)}
                className="w-full px-3 py-2.5 border border-border rounded-md text-[13px] bg-background placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-ring resize-none h-24"
              />
            </Section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DealDetail;
