import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Deal, DealType, DealStatus, DealMarket, InvoiceStatus, PayableStatus, BusinessUnit, Country, PaymentMode, AgentEntry, ExternalPartnerEntry, PayableEntry } from "@/data/types";
import { X, ArrowUpRight, Plus, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { recalculateDeal, createEmptyAgent } from "@/lib/dealCalculations";
import { RequiredDocumentsSection } from "./RequiredDocumentsSection";

interface Props {
  deal: Deal;
  currency: string;
  onClose: () => void;
  onSave?: (deal: Deal) => void;
}

const MBU_CHANNELS = ["MA/Broker", "BBG/Commercial", "B2C/Digital", "REA", "REA Purchase", "BYOB", "Direct Sales"];

export function DealPnLDetailPanel({ deal, currency, onClose, onSave }: Props) {
  const navigate = useNavigate();
  const [draft, setDraft] = useState<Deal>({ ...deal });
  const [baseline, setBaseline] = useState<Deal>({ ...deal });
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>(() => 
    deal.status === "pending-receivables"
      ? { "deal-info": true, revenue: true, cogs: true, receivables: false, payables: true, comments: true }
      : {}
  );
  const [uploadedDocs, setUploadedDocs] = useState<Set<number>>(new Set());
  const isPendingDetails = draft.status === "pending-details";

  useEffect(() => {
    const d = { ...deal };
    if (!d.externalPartners || d.externalPartners.length === 0) {
      d.externalPartners = [{ partnerName: "", partnerShare: 0, partnerAmount: 0, partnerBank: "", partnerBankAccount: "" }];
    }
    // Ensure payables are built from COGS entities
    const recalced = recalculateDeal(d);
    setDraft(recalced);
    setBaseline(recalced);
  }, [deal]);

  const hasChanges = useMemo(() => JSON.stringify(draft) !== JSON.stringify(baseline) || uploadedDocs.size > 0, [draft, baseline, uploadedDocs]);

  const fmt = (amount: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);

  const update = (field: keyof Deal, value: string | number) => {
    setDraft((prev) => recalculateDeal({ ...prev, [field]: value } as Deal));
  };

  const updateAgent = (index: number, field: keyof AgentEntry, value: string | number) => {
    setDraft((prev) => {
      const agents = [...prev.agents];
      agents[index] = { ...agents[index], [field]: value };
      return recalculateDeal({ ...prev, agents });
    });
  };

  const updatePartner = (index: number, field: keyof ExternalPartnerEntry, value: string | number) => {
    setDraft((prev) => {
      const externalPartners = [...(prev.externalPartners || [])];
      externalPartners[index] = { ...externalPartners[index], [field]: value };
      return recalculateDeal({ ...prev, externalPartners });
    });
  };

  const addPartner = () => {
    setDraft((prev) => {
      const externalPartners = [...(prev.externalPartners || []), { partnerName: "", partnerShare: 0, partnerAmount: 0, partnerBank: "", partnerBankAccount: "" }];
      return recalculateDeal({ ...prev, externalPartners });
    });
  };

  const removePartner = (index: number) => {
    setDraft((prev) => {
      const externalPartners = (prev.externalPartners || []).filter((_, i) => i !== index);
      return recalculateDeal({ ...prev, externalPartners });
    });
  };

  const updatePayable = (index: number, field: keyof PayableEntry, value: string | number) => {
    setDraft((prev) => {
      const payables = [...(prev.payables || [])];
      payables[index] = { ...payables[index], [field]: value };
      return { ...prev, payables };
    });
  };

  const addAgent = () => {
    setDraft((prev) => {
      const agents = [...prev.agents, createEmptyAgent(prev.agents.length)];
      return recalculateDeal({ ...prev, agents });
    });
  };

  const removeAgent = (index: number) => {
    setDraft((prev) => {
      const agents = prev.agents.filter((_, i) => i !== index);
      return recalculateDeal({ ...prev, agents });
    });
  };

  const toggleSection = (key: string) => {
    setCollapsedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => onSave?.(draft);
  const isREBU = draft.businessUnit === "rebu";
  const isMBU = draft.businessUnit === "mortgage";

  // Compute missing required fields for highlighting
  const missingRevenue = useMemo(() => {
    const fields: string[] = [];
    if (isREBU) {
      if (!draft.dealPrice) fields.push("dealPrice");
      if (!draft.takeRate) fields.push("takeRate");
    } else {
      if (!draft.disbursedAmount) fields.push("disbursedAmount");
      if (!draft.bankSlab) fields.push("bankSlab");
    }
    return new Set(fields);
  }, [isREBU, draft.dealPrice, draft.takeRate, draft.disbursedAmount, draft.bankSlab]);

  const missingCogs = useMemo(() => {
    if (!isREBU) return { count: 0, agents: [] as Set<string>[], partners: [] as Set<string>[] };
    let count = 0;
    const agents = draft.agents.map((a) => {
      const m = new Set<string>();
      if (a.agentName && !a.agentShare) { m.add("agentShare"); count++; }
      if (a.agentName && !a.agentCommissionRate) { m.add("agentCommissionRate"); count++; }
      if (!a.agentName && (a.agentShare > 0 || a.agentCommissionRate > 0)) { m.add("agentName"); count++; }
      return m;
    });
    const partners = (draft.externalPartners || []).map((p) => {
      const m = new Set<string>();
      if (p.partnerName && !p.partnerShare) { m.add("partnerShare"); count++; }
      if (!p.partnerName && p.partnerShare > 0) { m.add("partnerName"); count++; }
      return m;
    });
    return { count, agents, partners };
  }, [isREBU, draft.agents, draft.externalPartners]);

  return (
    <div className="w-[480px] min-w-[480px] border-l border-border bg-card h-full overflow-y-auto animate-slide-in-right">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="text-xl font-semibold text-foreground">{deal.id}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[13px] text-muted-foreground">
                <button onClick={() => navigate(`/clients?selected=${encodeURIComponent(deal.clientName)}`)} className="text-primary underline underline-offset-2 hover:opacity-80">{deal.clientName}</button>
              </span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${isREBU ? "bg-blue-500/15 text-blue-700 dark:text-blue-400" : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"}`}>
                {draft.businessUnit}
              </span>
            </div>
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

        <hr className="border-border mb-6" />

        {/* ═══════════════════════════════════════════ */}
        {/* DEAL INFORMATION                           */}
        {/* ═══════════════════════════════════════════ */}
        <CollapsibleSection title="Deal Information" id="deal-info" collapsed={collapsedSections} toggle={toggleSection}>
          <SelectField label="Business Unit" value={draft.businessUnit} options={["rebu", "mortgage"] as BusinessUnit[]} onChange={(v) => update("businessUnit", v)} />
          <SelectField label="Country" value={draft.country} options={["ae", "es", "sa"] as Country[]} onChange={(v) => update("country", v)} />
          {isMBU && (
            <SelectField label="Channel" value={draft.channel || MBU_CHANNELS[0]} options={MBU_CHANNELS} onChange={(v) => update("channel", v)} />
          )}
          <EditField label="Client Name *" value={draft.clientName} onChange={(v) => update("clientName", v)} />
          <EditField label="Report Date" value={draft.reportDate} type="date" onChange={(v) => update("reportDate", v)} />
          <ReadonlyField label="Deal ID" value={draft.id} />
          <EditField label="OF/Case Number" value={draft.ofCaseNumber || ""} onChange={(v) => update("ofCaseNumber", v)} />
          <SelectField label="Type" value={draft.type} options={["buy", "sell", "rent", "lease", "buy-sell", "mortgage", "rent-lease"] as DealType[]} onChange={(v) => update("type", v)} />
          <SelectField label="Status" value={draft.status} options={["reported", "pending-details", "under-review", "pending-agent-approval", "pending-receivables", "finalized", "canceled"] as DealStatus[]} onChange={(v) => update("status", v)} />
          <SelectField label="Market" value={draft.market} options={["primary", "secondary", "leasing"] as DealMarket[]} onChange={(v) => update("market", v)} />
          <EditField label="Opportunity" value={draft.opportunityName} onChange={(v) => update("opportunityName", v)} />

          {/* REBU: Property Details sub-group */}
          {isREBU && (
            <>
              <SubSectionHeader title="Property Details" />
              <EditField label="Building Name" value={draft.buildingName || ""} onChange={(v) => update("buildingName", v)} />
              <EditField label="Unit Number" value={draft.unitNumber || ""} onChange={(v) => update("unitNumber", v)} />
              <EditField label="Community" value={draft.community || ""} onChange={(v) => update("community", v)} />
              <EditField label="Sub-Community" value={draft.subCommunity || ""} onChange={(v) => update("subCommunity", v)} />
              <EditField label="Full Address" value={draft.fullAddress || ""} onChange={(v) => update("fullAddress", v)} />
              <EditField label="Property Type" value={draft.propertyType || ""} onChange={(v) => update("propertyType", v)} />
              <EditField label="Project Name" value={draft.projectName || ""} onChange={(v) => update("projectName", v)} />
            </>
          )}

          {/* REBU: Demand (Buyer) */}
          {isREBU && (
            <>
              <SubSectionHeader title="Demand (Buyer)" />
              <EditField label="Buyer Name" value={draft.buyerName || ""} onChange={(v) => update("buyerName", v)} critical={isPendingDetails && !draft.buyerName} />
              <EditField label="Buyer Phone" value={draft.buyerPhone || ""} onChange={(v) => update("buyerPhone", v)} />
              <EditField label="Buyer Email" value={draft.buyerEmail || ""} onChange={(v) => update("buyerEmail", v)} />
            </>
          )}

          {/* REBU: Supply (Seller) */}
          {isREBU && (
            <>
              <SubSectionHeader title="Supply (Seller/Developer)" />
              <EditField label="Seller Name" value={draft.sellerName || ""} onChange={(v) => update("sellerName", v)} critical={isPendingDetails && !draft.sellerName} />
              <EditField label="Seller Tax ID" value={draft.sellerTaxId || ""} onChange={(v) => update("sellerTaxId", v)} critical={isPendingDetails && !draft.sellerTaxId} />
              <EditField label="Seller Email" value={draft.sellerEmail || ""} onChange={(v) => update("sellerEmail", v)} />
              <SelectField label="Payment Mode" value={draft.paymentMode || "cash"} options={["cash", "mortgage"] as PaymentMode[]} onChange={(v) => update("paymentMode", v)} />
            </>
          )}

          {/* MBU: Supply (Bank) */}
          {isMBU && (
            <>
              <SubSectionHeader title="Supply (Bank)" />
              <EditField label="Bank Name" value={draft.bankName || ""} onChange={(v) => update("bankName", v)} />
              <EditField label="Account Manager" value={draft.accountManager || ""} onChange={(v) => update("accountManager", v)} />
            </>
          )}
        </CollapsibleSection>

        {/* ═══════════════════════════════════════════ */}
        {/* REVENUE                                    */}
        {/* ═══════════════════════════════════════════ */}
        <CollapsibleSection title="Revenue" id="revenue" collapsed={collapsedSections} toggle={toggleSection} missingCount={missingRevenue.size}>
          {isREBU ? (
            <>
              <NumericField label="Deal Price" value={draft.dealPrice} onChange={(v) => update("dealPrice", v)} missing={missingRevenue.has("dealPrice")} />
              <NumericField label="Take Rate (%)" value={draft.takeRate} onChange={(v) => update("takeRate", v)} missing={missingRevenue.has("takeRate")} critical={isPendingDetails && !draft.takeRate} />
              <ComputedField label="Huspy Revenue" value={fmt(draft.huspyRevenue)} />
              <NumericField label="Conveyance Revenue" value={draft.conveyanceRevenue} onChange={(v) => update("conveyanceRevenue", v)} />
              <ComputedField label="Total Revenue" value={fmt(draft.dealAmount)} highlight />
            </>
          ) : (
            <>
              <NumericField label="Disbursed Amount" value={draft.disbursedAmount} onChange={(v) => update("disbursedAmount", v)} missing={missingRevenue.has("disbursedAmount")} />
              <NumericField label="# of Tranches" value={draft.numberOfTranches} onChange={(v) => update("numberOfTranches", v)} />
              <NumericField label="Bank Slab (%)" value={draft.bankSlab} onChange={(v) => update("bankSlab", v)} missing={missingRevenue.has("bankSlab")} />
              <ComputedField label="Huspy Revenue" value={fmt(draft.huspyRevenue)} highlight />
            </>
          )}
        </CollapsibleSection>

        {/* ═══════════════════════════════════════════ */}
        {/* COGS                                       */}
        {/* ═══════════════════════════════════════════ */}
        <CollapsibleSection title="COGS" id="cogs" collapsed={collapsedSections} toggle={toggleSection} missingCount={missingCogs.count}>
          {isREBU ? (
            <>
              {/* --- External Partners --- */}
              <SubSectionHeader title="External" />
              {(draft.externalPartners || []).map((partner, idx) => (
                <div key={idx} className="mb-4 border border-border rounded-lg p-3 bg-muted/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[12px] font-semibold text-foreground">Partner {idx + 1}</span>
                    {(draft.externalPartners || []).length > 1 && (
                      <button onClick={() => removePartner(idx)} className="text-destructive hover:text-destructive/80 transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <EditField label="Partner Name" value={partner.partnerName || ""} onChange={(v) => updatePartner(idx, "partnerName", v)} missing={missingCogs.partners[idx]?.has("partnerName")} />
                  <NumericField label="Partner Share (%)" value={partner.partnerShare} onChange={(v) => updatePartner(idx, "partnerShare", v)} missing={missingCogs.partners[idx]?.has("partnerShare")} />
                  <ComputedField label="Partner Amount" value={fmt(partner.partnerAmount)} />
                  <EditField label="Partner Bank" value={partner.partnerBank || ""} onChange={(v) => updatePartner(idx, "partnerBank", v)} critical={isPendingDetails && !partner.partnerBank} />
                  <EditField label="Partner Bank Account" value={partner.partnerBankAccount || ""} onChange={(v) => updatePartner(idx, "partnerBankAccount", v)} />
                </div>
              ))}
              <button
                onClick={addPartner}
                className="flex items-center gap-1.5 text-[12px] font-medium text-primary hover:text-primary/80 transition-colors mt-1 mb-4"
              >
                <Plus className="h-3.5 w-3.5" />
                Add External Partner
              </button>

              {/* --- Rebates (Primary market) --- */}
              {draft.market === "primary" && (
                <>
                  <SubSectionHeader title="Rebates" />
                  <NumericField label="Rebate (%)" value={draft.rebatePercentage} onChange={(v) => update("rebatePercentage", v)} />
                  <ComputedField label="Deal Value" value={fmt(draft.dealPrice)} />
                  <ComputedField label="Rebate Amount" value={fmt(draft.rebateAmount)} />
                </>
              )}

              {/* --- Subsidy (Secondary market) --- */}
              {draft.market === "secondary" && (
                <>
                  <SubSectionHeader title="Subsidy" />
                  <NumericField label="Subsidy Amount" value={draft.subsidyAmount} onChange={(v) => update("subsidyAmount", v)} />
                </>
              )}

              {/* --- Internal: Per-Agent Commission --- */}
              <SubSectionHeader title="Internal — Agent Commission" />
              {draft.agents.map((agent, idx) => (
                <AgentBlock
                  key={idx}
                  agent={agent}
                  index={idx}
                  total={draft.agents.length}
                  fmt={fmt}
                  missingFields={missingCogs.agents[idx]}
                  isPendingDetails={isPendingDetails}
                  onUpdate={(field, value) => updateAgent(idx, field, value)}
                  onRemove={() => removeAgent(idx)}
                />
              ))}
              <button
                onClick={addAgent}
                className="flex items-center gap-1.5 text-[12px] font-medium text-primary hover:text-primary/80 transition-colors mt-2 mb-4"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Agent
              </button>

              {/* --- Internal: Conveyance --- */}
              <SubSectionHeader title="Internal — Conveyance" />
              <EditField label="Conveyance Agent" value={draft.conveyanceAgentName || ""} onChange={(v) => update("conveyanceAgentName", v)} />
              <NumericField label="Agent Rate (%)" value={draft.conveyanceAgentRate} onChange={(v) => update("conveyanceAgentRate", v)} />
              <ComputedField label="Agent Payout" value={fmt(draft.conveyanceAgentPayout)} />
              <ComputedField label="Huspy Share" value={fmt(draft.huspyConveyanceShare)} />

              {/* --- COGS Summary --- */}
              <SubSectionHeader title="Summary" />
              <ComputedField label="Internal COGS" value={fmt(draft.cogsInternal)} />
              <ComputedField label="External COGS" value={fmt(draft.cogsExternal)} />
              <ComputedField label="Referral COGS" value={fmt(draft.cogsReferrals)} />
              <ComputedField label="Total COGS" value={fmt(draft.cogsInternal + draft.cogsExternal + draft.cogsReferrals)} highlight />
            </>
          ) : (
            <>
              {/* MBU Internal */}
              <SubSectionHeader title="Internal" />
              <EditField label="RM Name" value={draft.rmName || ""} onChange={(v) => update("rmName", v)} />
              <NumericField label="RM Rate (%)" value={draft.rmCommissionRate} onChange={(v) => update("rmCommissionRate", v)} />
              <ComputedField label="RM Payout" value={fmt(draft.rmPayout)} />
              <EditField label="TL Name" value={draft.tlName || ""} onChange={(v) => update("tlName", v)} />
              <NumericField label="TL Rate (%)" value={draft.tlCommissionRate} onChange={(v) => update("tlCommissionRate", v)} />
              <ComputedField label="TL Payout" value={fmt(draft.tlPayout)} />
              <EditField label="DS Name" value={draft.dsName || ""} onChange={(v) => update("dsName", v)} />
              <NumericField label="DS Rate (%)" value={draft.dsCommissionRate} onChange={(v) => update("dsCommissionRate", v)} />
              <ComputedField label="DS Payout" value={fmt(draft.dsPayout)} />

              {/* MBU External */}
              <SubSectionHeader title="External" />
              <NumericField label="Broker Rate (%)" value={draft.brokerCommissionRate} onChange={(v) => update("brokerCommissionRate", v)} />
              <ComputedField label="Broker Payout" value={fmt(draft.brokerPayout)} />
              <NumericField label="External Rate (%)" value={draft.externalCommissionRate} onChange={(v) => update("externalCommissionRate", v)} />
              <ComputedField label="External Payout" value={fmt(draft.externalPayout)} />

              {/* MBU Summary */}
              <SubSectionHeader title="Summary" />
              <ComputedField label="Internal COGS" value={fmt(draft.cogsInternal)} />
              <ComputedField label="External COGS" value={fmt(draft.cogsExternal)} />
              <ComputedField label="Total COGS" value={fmt(draft.cogsInternal + draft.cogsExternal)} highlight />
            </>
          )}
        </CollapsibleSection>

        {/* ═══════════════════════════════════════════ */}
        {/* RECEIVABLES                                */}
        {/* ═══════════════════════════════════════════ */}
        {!isPendingDetails && (
        <CollapsibleSection title="Receivables" id="receivables" collapsed={collapsedSections} toggle={toggleSection}>
          <EditField label="Invoice Number" value={draft.invoiceNumber || ""} onChange={(v) => update("invoiceNumber", v)} />
          <SelectField label="Invoice Status" value={draft.invoiceStatus || "created"} options={["created", "sent", "overdue", "paid", "paid-partial", "cancelled"] as InvoiceStatus[]} onChange={(v) => update("invoiceStatus", v)} />
          <ComputedField label="Invoice Amount" value={draft.invoiceNumber ? fmt(draft.huspyRevenue) : "—"} />
          <EditField label="Invoice Date" value={draft.invoiceDate || ""} type="date" placeholder="Select date" onChange={(v) => update("invoiceDate", v)} />
          {draft.invoiceStatus === "paid" && (
            <>
              <EditField label="Payment Received Date" value={draft.paymentReceivedDate || ""} type="date" placeholder="Select date" onChange={(v) => update("paymentReceivedDate", v)} />
              <EditField label="Payment Received Amount" value={String(draft.paymentReceivedAmount ?? "")} type="number" onChange={(v) => update("paymentReceivedAmount", parseFloat(v as string) || 0)} />
              {draft.invoiceNumber && draft.paymentReceivedAmount != null && draft.paymentReceivedAmount !== draft.huspyRevenue && (() => {
                const delta = draft.paymentReceivedAmount! - draft.huspyRevenue;
                const isPositive = delta > 0;
                return (
                  <div className="flex justify-between items-center py-1.5 px-1">
                    <span className="text-[12px] font-medium text-muted-foreground">Delta</span>
                    <span className={`text-[13px] font-bold ${isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>
                      {isPositive ? "+" : ""}{fmt(delta)}
                    </span>
                  </div>
                );
              })()}
            </>
          )}
        </CollapsibleSection>
        )}

        {!isPendingDetails && (
        <CollapsibleSection title="Payables" id="payables" collapsed={collapsedSections} toggle={toggleSection}>
          {(draft.payables || []).length === 0 ? (
            <span className="text-[12px] text-muted-foreground italic">No payable entities — add COGS entries first.</span>
          ) : (
            (draft.payables || []).map((payable, idx) => (
              <div key={`${payable.entityType}-${payable.entityLabel}`} className="mb-4 p-3 bg-muted/30 rounded-lg border border-border/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[12px] font-semibold text-foreground">{payable.entityLabel}</span>
                </div>
                <ComputedField label="Expected Amount" value={fmt(payable.expectedAmount)} />
                <EditField label="Ref Number" value={payable.refNumber || ""} onChange={(v) => updatePayable(idx, "refNumber", v)} />
                <SelectField label="Status" value={payable.status} options={["pending", "approved", "paid", "rejected"] as PayableStatus[]} onChange={(v) => updatePayable(idx, "status", v as PayableStatus)} />
                {payable.status === "paid" && (
                  <>
                    <EditField label="Paid Date" value={payable.paidDate || ""} type="date" placeholder="Select date" onChange={(v) => updatePayable(idx, "paidDate", v)} />
                    <EditField label="Paid Amount" value={String(payable.paidAmount ?? "")} type="number" onChange={(v) => updatePayable(idx, "paidAmount", parseFloat(v as string) || 0)} />
                    {payable.paidAmount != null && payable.paidAmount !== payable.expectedAmount && (() => {
                      const delta = payable.paidAmount! - payable.expectedAmount;
                      const isPositive = delta > 0;
                      return (
                        <div className="flex justify-between items-center py-1.5 px-1">
                          <span className="text-[12px] font-medium text-muted-foreground">Delta</span>
                          <span className={`text-[13px] font-bold ${isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>
                            {isPositive ? "+" : ""}{fmt(delta)}
                          </span>
                        </div>
                      );
                    })()}
                  </>
                )}
              </div>
            ))
          )}
        </CollapsibleSection>
        )}

        {/* ═══════════════════════════════════════════ */}
        {/* REQUIRED DOCUMENTS (Pending Details only)   */}
        {/* ═══════════════════════════════════════════ */}
        {isPendingDetails && (
          <div className="mb-5">
            <RequiredDocumentsSection
              uploadedDocs={uploadedDocs}
              onUpload={(idx) => setUploadedDocs((prev) => new Set(prev).add(idx))}
              variant="panel"
            />
          </div>
        )}

        {/* ═══════════════════════════════════════════ */}
        {/* COMMENTS                                   */}
        {/* ═══════════════════════════════════════════ */}
        <CollapsibleSection title="Comments" id="comments" collapsed={collapsedSections} toggle={toggleSection}>
          <textarea
            placeholder="Add a comment..."
            value={draft.latestNote || ""}
            onChange={(e) => update("latestNote", e.target.value)}
            className="w-full px-3 py-2.5 border border-border rounded-md text-[13px] bg-background placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-ring resize-none h-20"
          />
        </CollapsibleSection>

        {/* Submit Button */}
        <div className="sticky bottom-0 pt-4 pb-2 bg-card border-t border-border -mx-6 px-6 space-y-2">
          {draft.status === "under-review" && (
            <button
              onClick={() => {
                const approved = { ...draft, status: "pending-agent-approval" as DealStatus };
                onSave?.(approved);
              }}
              className="w-full py-2.5 bg-[hsl(var(--deal-ready-invoicing))] text-primary-foreground rounded-md text-[13px] font-semibold hover:opacity-90 transition-opacity"
            >
              Approve & Move to Ready For Invoicing
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={!hasChanges}
            className={`w-full py-2.5 rounded-md text-[13px] font-semibold transition-opacity ${hasChanges ? "bg-primary text-primary-foreground hover:opacity-90" : "bg-muted text-muted-foreground cursor-not-allowed"}`}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════ */
/* Agent Block — grouped per agent                    */
/* ═══════════════════════════════════════════════════ */

function AgentBlock({ agent, index, total, fmt, onUpdate, onRemove, missingFields, isPendingDetails }: {
  agent: AgentEntry;
  index: number;
  total: number;
  fmt: (n: number) => string;
  onUpdate: (field: keyof AgentEntry, value: string | number) => void;
  onRemove: () => void;
  missingFields?: Set<string>;
  isPendingDetails?: boolean;
}) {
  return (
    <div className="mb-4 p-3 bg-muted/30 rounded-lg border border-border/50">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[12px] font-bold text-foreground uppercase tracking-wide">
          Agent {index + 1}
        </span>
        {total > 1 && (
          <button onClick={onRemove} className="p-0.5 text-muted-foreground hover:text-destructive transition-colors">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <div className="space-y-2.5">
        <EditField label="Name" value={agent.agentName} onChange={(v) => onUpdate("agentName", v)} missing={missingFields?.has("agentName")} critical={isPendingDetails && !agent.agentName} />
        <EditField label="ID" value={agent.agentId || ""} onChange={(v) => onUpdate("agentId", v)} />
        <EditField label="Email" value={agent.agentEmail || ""} onChange={(v) => onUpdate("agentEmail", v)} />
        <EditField label="Phone" value={agent.agentPhone || ""} onChange={(v) => onUpdate("agentPhone", v)} />
        <NumericField label="Share (%)" value={agent.agentShare} onChange={(v) => onUpdate("agentShare", v)} missing={missingFields?.has("agentShare")} />
        <NumericField label="Commission Rate (%)" value={agent.agentCommissionRate} onChange={(v) => onUpdate("agentCommissionRate", v)} missing={missingFields?.has("agentCommissionRate")} critical={isPendingDetails && !agent.agentCommissionRate} />
        <ComputedField label="Base Commission" value={fmt(agent.agentCommissionPayout)} />
        <NumericField label="Incentive" value={agent.agentIncentive} onChange={(v) => onUpdate("agentIncentive", v)} />
        <NumericField label="Deductions" value={agent.agentDeductions} onChange={(v) => onUpdate("agentDeductions", v)} />
        <ComputedField label="Total Amount" value={fmt(agent.agentTotalAmount)} highlight />

        {/* Team Lead */}
        <div className="mt-2 pt-2 border-t border-border/40">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Team Lead</span>
        </div>
        <EditField label="Name" value={agent.teamLeadName || ""} onChange={(v) => onUpdate("teamLeadName", v)} critical={isPendingDetails && !agent.teamLeadName} />
        <NumericField label="Override (%)" value={agent.teamLeadRate} onChange={(v) => onUpdate("teamLeadRate", v)} />
        <ComputedField label="TL Amount" value={fmt(agent.teamLeadShare)} />

        {/* Manager */}
        <div className="mt-2 pt-2 border-t border-border/40">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Sales Manager</span>
        </div>
        <EditField label="Name" value={agent.managerName || ""} onChange={(v) => onUpdate("managerName", v)} />
        <NumericField label="Override (%)" value={agent.managerOverrideRate} onChange={(v) => onUpdate("managerOverrideRate", v)} critical={isPendingDetails && !agent.managerOverrideRate} />
        <ComputedField label="Manager Amount" value={fmt(agent.managerOverride)} />

        {/* Referrals */}
        <div className="mt-2 pt-2 border-t border-border/40">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Referrals</span>
        </div>
        <SelectField label="Referral Type" value={agent.referralType || ""} options={["MBU referral", "Huspy Employee referral", "Huspy Agent Referral", "Huspy Employee purchase", ""]} onChange={(v) => onUpdate("referralType", v)} />
        <EditField label="Referrer's Name" value={agent.referrerName || ""} onChange={(v) => onUpdate("referrerName", v)} />
        <NumericField label="Referral (%)" value={agent.referralPercentage} onChange={(v) => onUpdate("referralPercentage", v)} />
        <ComputedField label="Referral Amount" value={fmt(agent.referralAmount)} />

        {/* Client Kickback */}
        <div className="mt-2 pt-2 border-t border-border/40">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Client Kickback</span>
        </div>
        <NumericField label="Kickback Amount" value={agent.clientKickback} onChange={(v) => onUpdate("clientKickback", v)} />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════ */
/* Collapsible Section                                 */
/* ═══════════════════════════════════════════════════ */

function CollapsibleSection({ title, id, collapsed, toggle, children, missingCount }: {
  title: string;
  id: string;
  collapsed: Record<string, boolean>;
  toggle: (key: string) => void;
  children: React.ReactNode;
  missingCount?: number;
}) {
  const isCollapsed = collapsed[id] ?? false;
  return (
    <div className="mb-5">
      <button
        onClick={() => toggle(id)}
        className="flex items-center gap-2 w-full text-left mb-3 pb-2 border-b border-border group"
      >
        {isCollapsed ? (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
        <span className="text-[14px] font-bold text-foreground uppercase tracking-wide">{title}</span>
        {missingCount != null && missingCount > 0 && (
          <span className="ml-auto inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400">
            {missingCount} missing
          </span>
        )}
      </button>
      {!isCollapsed && <div className="space-y-3">{children}</div>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════ */
/* Field Components                                    */
/* ═══════════════════════════════════════════════════ */

function SubSectionHeader({ title }: { title: string }) {
  return (
    <div className="pt-3 pb-1">
      <span className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">{title}</span>
    </div>
  );
}

function ReadonlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center">
      <span className="w-[150px] text-[13px] text-muted-foreground shrink-0">{label}</span>
      <span className="text-[13px] font-medium text-foreground">{value}</span>
    </div>
  );
}

function ComputedField({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center">
      <span className="w-[150px] text-[13px] text-muted-foreground shrink-0">{label}</span>
      <span className={`text-[13px] font-semibold tabular-nums ${highlight ? "text-foreground" : "text-muted-foreground italic"}`}>{value}</span>
    </div>
  );
}

function EditField({ label, value, onChange, type = "text", placeholder, missing, critical }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; missing?: boolean; critical?: boolean }) {
  const colorClass = critical
    ? "text-destructive font-medium"
    : missing
    ? "text-amber-600 dark:text-amber-400 font-medium"
    : "text-muted-foreground";
  const borderClass = critical
    ? "border-destructive ring-1 ring-destructive/50"
    : missing
    ? "border-amber-500 ring-1 ring-amber-500/50"
    : "border-border";
  return (
    <div className="flex items-center">
      <span className={`w-[150px] text-[13px] shrink-0 ${colorClass}`}>{label}</span>
      <input type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className={`flex-1 px-3 py-1.5 border rounded-md text-[13px] bg-background text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring ${borderClass}`} />
    </div>
  );
}

function NumericField({ label, value, onChange, missing, critical }: { label: string; value: number; onChange: (v: number) => void; missing?: boolean; critical?: boolean }) {
  const colorClass = critical
    ? "text-destructive font-medium"
    : missing
    ? "text-amber-600 dark:text-amber-400 font-medium"
    : "text-muted-foreground";
  const borderClass = critical
    ? "border-destructive ring-1 ring-destructive/50"
    : missing
    ? "border-amber-500 ring-1 ring-amber-500/50"
    : "border-border";
  return (
    <div className="flex items-center">
      <span className={`w-[150px] text-[13px] shrink-0 ${colorClass}`}>{label}</span>
      <input type="number" value={value} onChange={(e) => onChange(parseFloat(e.target.value) || 0)} className={`flex-1 px-3 py-1.5 border rounded-md text-[13px] bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring tabular-nums ${borderClass}`} />
    </div>
  );
}

function SelectField<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: T[]; onChange: (v: T) => void }) {
  return (
    <div className="flex items-center">
      <span className="w-[150px] text-[13px] text-muted-foreground shrink-0">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value as T)} className="flex-1 px-3 py-1.5 border border-border rounded-md text-[13px] bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring">
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}
