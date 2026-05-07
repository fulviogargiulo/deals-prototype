import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, CheckCircle, FileText, ChevronDown, ChevronRight } from "lucide-react";
import { Deal, DealType, DealMarket, BusinessUnit, Country, PaymentMode, AgentEntry, ExternalPartnerEntry, ReceivableEntry, PayableEntry } from "@/data/types";
import { Opportunity } from "@/data/types";
import { mockOpportunities } from "@/data/mockData";
import { toast } from "@/hooks/use-toast";
import { COMMISSION_RATES } from "@huspy/shared-domain";
import { recalculateDeal } from "@/lib/dealCalculations";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Props {
  open: boolean;
  onClose: () => void;
  onDealCreated: (deal: Deal) => void;
}

const DEAL_TYPES: DealType[] = ["buy", "sell", "rent", "lease", "buy-sell", "mortgage", "rent-lease"];
const MARKETS: DealMarket[] = ["primary", "secondary", "leasing"];
const BUS: BusinessUnit[] = ["rebu", "mortgage"];
const COUNTRIES: Country[] = ["ae", "es", "sa"];
const PAYMENT_MODES: PaymentMode[] = ["cash", "mortgage"];

const MOCK_DOCUMENTS = [
  { name: "Signed SPA", status: "available" },
  { name: "Buyer Passport Copy", status: "available" },
  { name: "Title Deed", status: "pending" },
  { name: "NOC Letter", status: "available" },
  { name: "MOU (Memorandum)", status: "pending" },
  { name: "Commission Agreement", status: "available" },
];

function makeDefaultAgent(name: string = ""): AgentEntry {
  return {
    agentName: name, agentShare: 50, agentCommissionRate: 40, agentCommissionPayout: 0,
    agentIncentive: 0, agentDeductions: 0, agentTotalAmount: 0,
    teamLeadRate: 10, teamLeadShare: 0, managerOverrideRate: 5, managerOverride: 0,
    referralPercentage: 0, referralAmount: 0, clientKickback: 0,
  };
}

// Auto-fill mock property data based on opportunity
function getAutoFillData(opp: Opportunity) {
  const mockProperties: Record<string, { buildingName: string; community: string; unitNumber: string; propertyType: string; projectName: string }> = {
    Buy: { buildingName: "Marina Heights Tower", community: "Dubai Marina", unitNumber: "1204", propertyType: "Apartment", projectName: "Marina Heights" },
    Sell: { buildingName: "Palm Jumeirah Villa", community: "Palm Jumeirah", unitNumber: "V-12", propertyType: "Villa", projectName: "Fronds Collection" },
    Rent: { buildingName: "JBR Residences", community: "Jumeirah Beach Residence", unitNumber: "805", propertyType: "Apartment", projectName: "Sadaf Tower" },
    Lease: { buildingName: "Business Bay Tower", community: "Business Bay", unitNumber: "OF-301", propertyType: "Office", projectName: "The Binary" },
  };
  return mockProperties[opp.type] || mockProperties.Buy;
}

type FormData = {
  // Deal Info
  type: DealType;
  market: DealMarket;
  businessUnit: BusinessUnit;
  country: Country;
  ofCaseNumber: string;
  channel: string;
  // Property
  buildingName: string;
  unitNumber: string;
  community: string;
  subCommunity: string;
  propertyType: string;
  projectName: string;
  fullAddress: string;
  // Buyer/Seller
  buyerName: string;
  buyerPhone: string;
  buyerEmail: string;
  sellerName: string;
  sellerEmail: string;
  sellerTaxId: string;
  paymentMode: PaymentMode;
  // Revenue
  dealPrice: string;
  takeRate: string;
  // Conveyance
  conveyanceAgentName: string;
  conveyanceAgentRate: string;
  // Agent
  agentName: string;
  agentShare: string;
  agentCommissionRate: string;
  teamLeadName: string;
  teamLeadRate: string;
  managerName: string;
  managerOverrideRate: string;
  // External
  externalPartnerName: string;
  externalPartnerShare: string;
  // Notes
  latestNote: string;
};

export function AddDealDialog({ open, onClose, onDealCreated }: Props) {
  const [step, setStep] = useState<"opportunity" | "form" | "success">("opportunity");
  const [oppSearch, setOppSearch] = useState("");
  const [manualOppId, setManualOppId] = useState("");
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null);
  const [createdDealId, setCreatedDealId] = useState("");

  // Sections collapse state
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    dealInfo: true, property: true, parties: true, revenue: true, conveyance: false, agents: true, external: false, documents: true, notes: false,
  });

  const toggleSection = (key: string) => setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));

  const [form, setForm] = useState<FormData>({
    type: "buy", market: "primary", businessUnit: "rebu", country: "ae", ofCaseNumber: "", channel: "",
    buildingName: "", unitNumber: "", community: "", subCommunity: "", propertyType: "", projectName: "", fullAddress: "",
    buyerName: "", buyerPhone: "", buyerEmail: "", sellerName: "", sellerEmail: "", sellerTaxId: "", paymentMode: "cash",
    dealPrice: "", takeRate: String(COMMISSION_RATES.takeRate),
    conveyanceAgentName: "", conveyanceAgentRate: "25",
    agentName: "", agentShare: "50", agentCommissionRate: "40",
    teamLeadName: "", teamLeadRate: "10", managerName: "", managerOverrideRate: "5",
    externalPartnerName: "", externalPartnerShare: "0",
    latestNote: "",
  });

  const updateForm = (key: keyof FormData, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  const filteredOpps = useMemo(() => {
    if (!oppSearch) return mockOpportunities;
    const q = oppSearch.toLowerCase();
    return mockOpportunities.filter(o =>
      o.id.toLowerCase().includes(q) ||
      o.clientName.toLowerCase().includes(q) ||
      o.title.toLowerCase().includes(q) ||
      o.agentName.toLowerCase().includes(q)
    );
  }, [oppSearch]);

  const selectOpportunity = (opp: Opportunity) => {
    setSelectedOpp(opp);
    const prop = getAutoFillData(opp);
    const mockPrice = Math.round(200000 + Math.random() * 600000);
    setForm(prev => ({
      ...prev,
      type: opp.type as DealType,
      market: opp.type === "rent" || opp.type === "lease" ? "leasing" : "primary",
      country: opp.neighborhoods[0] === "Madrid" || opp.neighborhoods[0] === "Valencia" ? "es" : "ae",
      agentName: opp.agentName,
      buyerName: opp.clientName,
      buyerPhone: opp.clientPhone,
      buyerEmail: `${opp.clientName.toLowerCase().replace(/\s/g, ".")}@email.com`,
      buildingName: prop.buildingName,
      unitNumber: prop.unitNumber,
      community: prop.community,
      propertyType: prop.propertyType,
      projectName: prop.projectName,
      dealPrice: String(mockPrice),
      ofCaseNumber: `OF-2026-${String(Math.floor(1000 + Math.random() * 9000))}`,
      sellerName: "Property Developer LLC",
      sellerEmail: "sales@developer.com",
      teamLeadName: "Sara Al Maktoum",
      managerName: "Ahmed Khan",
      conveyanceAgentName: "Standard Conveyance Co.",
    }));
    setStep("form");
  };

  const selectManualId = () => {
    if (!manualOppId.trim()) return;
    const found = mockOpportunities.find(o => o.id === manualOppId.trim());
    if (found) {
      selectOpportunity(found);
    } else {
      // Use manual ID with defaults
      setSelectedOpp(null);
      setForm(prev => ({
        ...prev,
        ofCaseNumber: `OF-2026-${String(Math.floor(1000 + Math.random() * 9000))}`,
      }));
      setStep("form");
    }
  };

  const handleCreate = () => {
    const dealPrice = parseFloat(form.dealPrice) || 0;
    const takeRate = parseFloat(form.takeRate) || COMMISSION_RATES.takeRate;
    const huspyRevenue = dealPrice * (takeRate / 100);
    const convRate = parseFloat(form.conveyanceAgentRate) || 0;
    const conveyanceRevenue = huspyRevenue * (COMMISSION_RATES.conveyanceSplit / 100);
    const netHuspyRevenue = huspyRevenue - conveyanceRevenue;
    const agentShare = parseFloat(form.agentShare) || 50;
    const agentCommRate = parseFloat(form.agentCommissionRate) || 40;
    const agentPayout = netHuspyRevenue * (agentShare / 100) * (agentCommRate / 100);
    const tlRate = parseFloat(form.teamLeadRate) || 0;
    const mgrRate = parseFloat(form.managerOverrideRate) || 0;

    const id = `DEAL-${String(Date.now()).slice(-6)}`;

    const deal: Deal = {
      id,
      type: form.type,
      status: "reported",
      market: form.market,
      businessUnit: form.businessUnit,
      country: form.country,
      channel: form.channel || undefined,
      clientName: form.buyerName || "Unknown Client",
      agentName: form.agentName || "Unknown Agent",
      opportunityName: selectedOpp?.title || manualOppId || "",
      dealAmount: dealPrice,
      reportDate: new Date().toISOString().split("T")[0],
      ofCaseNumber: form.ofCaseNumber || undefined,
      buildingName: form.buildingName || undefined,
      unitNumber: form.unitNumber || undefined,
      community: form.community || undefined,
      subCommunity: form.subCommunity || undefined,
      propertyType: form.propertyType || undefined,
      projectName: form.projectName || undefined,
      fullAddress: form.fullAddress || undefined,
      buyerName: form.buyerName || undefined,
      buyerPhone: form.buyerPhone || undefined,
      buyerEmail: form.buyerEmail || undefined,
      sellerName: form.sellerName || undefined,
      sellerEmail: form.sellerEmail || undefined,
      sellerTaxId: form.sellerTaxId || undefined,
      paymentMode: form.paymentMode,
      dealPrice,
      takeRate,
      huspyRevenue,
      netHuspyRevenue,
      conveyanceRevenue,
      agentShare,
      agentCommissionRate: agentCommRate,
      agentCommissionPayout: agentPayout,
      teamLeadName: form.teamLeadName || undefined,
      teamLeadRate: tlRate,
      teamLeadShare: agentPayout * (tlRate / 100),
      managerName: form.managerName || undefined,
      managerOverrideRate: mgrRate,
      managerOverride: agentPayout * (mgrRate / 100),
      conveyanceAgentName: form.conveyanceAgentName || undefined,
      conveyanceAgentRate: convRate,
      conveyanceAgentPayout: conveyanceRevenue * (convRate / 100),
      huspyConveyanceShare: conveyanceRevenue * (1 - convRate / 100),
      clientKickback: 0,
      referralPercentage: 0,
      referralAmount: 0,
      rebatePercentage: 0,
      rebateAmount: 0,
      subsidyAmount: 0,
      cogsInternal: 0,
      cogsExternal: 0,
      cogsReferrals: 0,
      cogsRebates: 0,
      cogsSubsidy: 0,
      numberOfTranches: 0, disbursedAmount: 0, bankSlab: 0,
      brokerCommissionRate: 0, brokerPayout: 0,
      rmCommissionRate: 0, rmPayout: 0, tlCommissionRate: 0, tlPayout: 0,
      dsCommissionRate: 0, dsPayout: 0, externalCommissionRate: 0, externalPayout: 0,
      externalPartnerShare: parseFloat(form.externalPartnerShare) || 0,
      externalPartnerName: form.externalPartnerName || undefined,
      agents: [{
        ...makeDefaultAgent(form.agentName),
        agentShare,
        agentCommissionRate: agentCommRate,
        agentCommissionPayout: agentPayout,
        agentTotalAmount: agentPayout,
        teamLeadName: form.teamLeadName,
        teamLeadRate: tlRate,
        teamLeadShare: agentPayout * (tlRate / 100),
        managerName: form.managerName,
        managerOverrideRate: mgrRate,
        managerOverride: agentPayout * (mgrRate / 100),
      }],
      externalPartners: form.externalPartnerName ? [{
        partnerName: form.externalPartnerName,
        partnerShare: parseFloat(form.externalPartnerShare) || 0,
        partnerAmount: huspyRevenue * (parseFloat(form.externalPartnerShare) || 0) / 100,
      }] : [],
      receivables: [],
      payables: [],
      latestNote: form.latestNote || undefined,
    };

    onDealCreated(recalculateDeal(deal));
    setCreatedDealId(id);
    setStep("success");
    toast({ title: "Deal Created", description: `Deal ${id} has been created successfully.` });
  };

  const handleClose = () => {
    setStep("opportunity");
    setOppSearch("");
    setManualOppId("");
    setSelectedOpp(null);
    setCreatedDealId("");
    setForm({
      type: "buy", market: "primary", businessUnit: "rebu", country: "ae", ofCaseNumber: "", channel: "",
      buildingName: "", unitNumber: "", community: "", subCommunity: "", propertyType: "", projectName: "", fullAddress: "",
      buyerName: "", buyerPhone: "", buyerEmail: "", sellerName: "", sellerEmail: "", sellerTaxId: "", paymentMode: "cash",
      dealPrice: "", takeRate: String(COMMISSION_RATES.takeRate),
      conveyanceAgentName: "", conveyanceAgentRate: "25",
      agentName: "", agentShare: "50", agentCommissionRate: "40",
      teamLeadName: "", teamLeadRate: "10", managerName: "", managerOverrideRate: "5",
      externalPartnerName: "", externalPartnerShare: "0",
      latestNote: "",
    });
    onClose();
  };

  const inputClass = "h-9 text-[13px]";
  const labelClass = "text-[11px] uppercase tracking-wider text-muted-foreground font-medium";

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0 gap-0 overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-border">
          <DialogHeader>
            <DialogTitle>{step === "success" ? "Deal Created" : step === "form" ? "New Deal" : "Select Opportunity"}</DialogTitle>
            <DialogDescription>
              {step === "opportunity" && "Search by client, agent, title, or Opportunity ID to start creating a deal."}
              {step === "form" && (selectedOpp ? `Creating deal from: ${selectedOpp.title} (${selectedOpp.id.slice(0, 8)}...)` : `Manual Opportunity ID: ${manualOppId}`)}
              {step === "success" && "Your deal has been created and is now available across all views."}
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Step 1: Opportunity Selection */}
        {step === "opportunity" && (
          <div className="px-6 py-5 space-y-5">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by client, agent, title, or Opportunity ID..." value={oppSearch} onChange={e => setOppSearch(e.target.value)} className={`${inputClass} pl-9`} />
            </div>

            <ScrollArea className="h-[300px] border border-border rounded-md">
              <div className="divide-y divide-border">
                {filteredOpps.map(opp => (
                  <button
                    key={opp.id}
                    onClick={() => selectOpportunity(opp)}
                    className="w-full text-left px-4 py-3 hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[13px] font-medium text-foreground">{opp.title}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{opp.clientName} • {opp.agentName} • {opp.neighborhoods[0] ?? "-"}</p>
                      </div>
                      <div className="text-right">
                        <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${opp.status === "active" ? "bg-[hsl(var(--deal-paid))]/15 text-[hsl(var(--deal-paid))]" : opp.status === "new" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                          {opp.status}
                        </span>
                        <p className="text-[10px] text-muted-foreground mt-1 font-mono">{opp.id.slice(0, 12)}...</p>
                      </div>
                    </div>
                  </button>
                ))}
                {filteredOpps.length === 0 && (
                  <p className="text-center py-8 text-[13px] text-muted-foreground">No opportunities found</p>
                )}
              </div>
            </ScrollArea>

            <div className="flex justify-end">
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
            </div>
          </div>
        )}

        {/* Step 2: Deal Form */}
        {step === "form" && (
          <ScrollArea className="max-h-[calc(90vh-180px)]">
            <div className="px-6 py-5 space-y-1">
              {/* Deal Info */}
              <CollapsibleSection title="Deal Information" sectionKey="dealInfo" open={openSections.dealInfo} onToggle={toggleSection}>
                <div className="grid grid-cols-3 gap-4">
                  <Field label="Deal Type" labelClass={labelClass}>
                    <select value={form.type} onChange={e => updateForm("type", e.target.value)} className="h-9 w-full rounded-md border border-input bg-background px-3 text-[13px]">
                      {DEAL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </Field>
                  <Field label="Market" labelClass={labelClass}>
                    <select value={form.market} onChange={e => updateForm("market", e.target.value)} className="h-9 w-full rounded-md border border-input bg-background px-3 text-[13px]">
                      {MARKETS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </Field>
                  <Field label="Business Unit" labelClass={labelClass}>
                    <select value={form.businessUnit} onChange={e => updateForm("businessUnit", e.target.value)} className="h-9 w-full rounded-md border border-input bg-background px-3 text-[13px]">
                      {BUS.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </Field>
                  <Field label="Country" labelClass={labelClass}>
                    <select value={form.country} onChange={e => updateForm("country", e.target.value)} className="h-9 w-full rounded-md border border-input bg-background px-3 text-[13px]">
                      {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </Field>
                  <Field label="OF/Case Number" labelClass={labelClass}>
                    <Input value={form.ofCaseNumber} onChange={e => updateForm("ofCaseNumber", e.target.value)} className={inputClass} />
                  </Field>
                  <Field label="Channel" labelClass={labelClass}>
                    <Input value={form.channel} onChange={e => updateForm("channel", e.target.value)} className={inputClass} placeholder="e.g. B2C/Digital" />
                  </Field>
                </div>
              </CollapsibleSection>

              {/* Property Details */}
              <CollapsibleSection title="Property Transaction Details" sectionKey="property" open={openSections.property} onToggle={toggleSection}>
                <div className="grid grid-cols-3 gap-4">
                  <Field label="Building Name" labelClass={labelClass}><Input value={form.buildingName} onChange={e => updateForm("buildingName", e.target.value)} className={inputClass} /></Field>
                  <Field label="Unit Number" labelClass={labelClass}><Input value={form.unitNumber} onChange={e => updateForm("unitNumber", e.target.value)} className={inputClass} /></Field>
                  <Field label="Community" labelClass={labelClass}><Input value={form.community} onChange={e => updateForm("community", e.target.value)} className={inputClass} /></Field>
                  <Field label="Sub-Community" labelClass={labelClass}><Input value={form.subCommunity} onChange={e => updateForm("subCommunity", e.target.value)} className={inputClass} /></Field>
                  <Field label="Property Type" labelClass={labelClass}><Input value={form.propertyType} onChange={e => updateForm("propertyType", e.target.value)} className={inputClass} /></Field>
                  <Field label="Project Name" labelClass={labelClass}><Input value={form.projectName} onChange={e => updateForm("projectName", e.target.value)} className={inputClass} /></Field>
                  <Field label="Full Address" labelClass={labelClass}><Input value={form.fullAddress} onChange={e => updateForm("fullAddress", e.target.value)} className={`${inputClass} col-span-3`} /></Field>
                </div>
              </CollapsibleSection>

              {/* Buyer / Seller */}
              <CollapsibleSection title="Buyer & Seller Details" sectionKey="parties" open={openSections.parties} onToggle={toggleSection}>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Buyer / Demand</p>
                    <Field label="Name" labelClass={labelClass}><Input value={form.buyerName} onChange={e => updateForm("buyerName", e.target.value)} className={inputClass} /></Field>
                    <Field label="Phone" labelClass={labelClass}><Input value={form.buyerPhone} onChange={e => updateForm("buyerPhone", e.target.value)} className={inputClass} /></Field>
                    <Field label="Email" labelClass={labelClass}><Input value={form.buyerEmail} onChange={e => updateForm("buyerEmail", e.target.value)} className={inputClass} /></Field>
                  </div>
                  <div className="space-y-3">
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Seller / Supply</p>
                    <Field label="Name" labelClass={labelClass}><Input value={form.sellerName} onChange={e => updateForm("sellerName", e.target.value)} className={inputClass} /></Field>
                    <Field label="Tax ID" labelClass={labelClass}><Input value={form.sellerTaxId} onChange={e => updateForm("sellerTaxId", e.target.value)} className={inputClass} /></Field>
                    <Field label="Email" labelClass={labelClass}><Input value={form.sellerEmail} onChange={e => updateForm("sellerEmail", e.target.value)} className={inputClass} /></Field>
                  </div>
                </div>
                <div className="mt-3">
                  <Field label="Payment Mode" labelClass={labelClass}>
                    <select value={form.paymentMode} onChange={e => updateForm("paymentMode", e.target.value)} className="h-9 w-full rounded-md border border-input bg-background px-3 text-[13px]">
                      {PAYMENT_MODES.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </Field>
                </div>
              </CollapsibleSection>

              {/* Revenue */}
              <CollapsibleSection title="Revenue Details" sectionKey="revenue" open={openSections.revenue} onToggle={toggleSection}>
                <div className="grid grid-cols-3 gap-4">
                  <Field label="Deal Price" labelClass={labelClass}><Input type="number" value={form.dealPrice} onChange={e => updateForm("dealPrice", e.target.value)} className={inputClass} /></Field>
                  <Field label="Take Rate (%)" labelClass={labelClass}><Input type="number" step="0.1" value={form.takeRate} onChange={e => updateForm("takeRate", e.target.value)} className={inputClass} /></Field>
                  <Field label="Huspy Revenue (auto)" labelClass={labelClass}>
                    <Input readOnly value={(parseFloat(form.dealPrice || "0") * parseFloat(form.takeRate || "0") / 100).toFixed(0)} className={`${inputClass} bg-muted`} />
                  </Field>
                </div>
              </CollapsibleSection>

              {/* Conveyance */}
              <CollapsibleSection title="Conveyance Details" sectionKey="conveyance" open={openSections.conveyance} onToggle={toggleSection}>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Conveyance Agent" labelClass={labelClass}><Input value={form.conveyanceAgentName} onChange={e => updateForm("conveyanceAgentName", e.target.value)} className={inputClass} /></Field>
                  <Field label="Conveyance Rate (%)" labelClass={labelClass}><Input type="number" value={form.conveyanceAgentRate} onChange={e => updateForm("conveyanceAgentRate", e.target.value)} className={inputClass} /></Field>
                </div>
              </CollapsibleSection>

              {/* Agent Info */}
              <CollapsibleSection title="Agent & Commission" sectionKey="agents" open={openSections.agents} onToggle={toggleSection}>
                <div className="grid grid-cols-3 gap-4">
                  <Field label="Agent Name" labelClass={labelClass}><Input value={form.agentName} onChange={e => updateForm("agentName", e.target.value)} className={inputClass} /></Field>
                  <Field label="Agent Share (%)" labelClass={labelClass}><Input type="number" value={form.agentShare} onChange={e => updateForm("agentShare", e.target.value)} className={inputClass} /></Field>
                  <Field label="Commission Rate (%)" labelClass={labelClass}><Input type="number" value={form.agentCommissionRate} onChange={e => updateForm("agentCommissionRate", e.target.value)} className={inputClass} /></Field>
                  <Field label="Team Lead" labelClass={labelClass}><Input value={form.teamLeadName} onChange={e => updateForm("teamLeadName", e.target.value)} className={inputClass} /></Field>
                  <Field label="TL Rate (%)" labelClass={labelClass}><Input type="number" value={form.teamLeadRate} onChange={e => updateForm("teamLeadRate", e.target.value)} className={inputClass} /></Field>
                  <Field label="Manager" labelClass={labelClass}><Input value={form.managerName} onChange={e => updateForm("managerName", e.target.value)} className={inputClass} /></Field>
                  <Field label="Manager Override (%)" labelClass={labelClass}><Input type="number" value={form.managerOverrideRate} onChange={e => updateForm("managerOverrideRate", e.target.value)} className={inputClass} /></Field>
                </div>
              </CollapsibleSection>

              {/* External Partners */}
              <CollapsibleSection title="External Partners" sectionKey="external" open={openSections.external} onToggle={toggleSection}>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Partner Name" labelClass={labelClass}><Input value={form.externalPartnerName} onChange={e => updateForm("externalPartnerName", e.target.value)} className={inputClass} /></Field>
                  <Field label="Partner Share (%)" labelClass={labelClass}><Input type="number" value={form.externalPartnerShare} onChange={e => updateForm("externalPartnerShare", e.target.value)} className={inputClass} /></Field>
                </div>
              </CollapsibleSection>

              {/* Documents */}
              <CollapsibleSection title="Attached Documents" sectionKey="documents" open={openSections.documents} onToggle={toggleSection}>
                <div className="grid grid-cols-2 gap-3">
                  {MOCK_DOCUMENTS.map(doc => (
                    <div key={doc.name} className="flex items-center gap-2 px-3 py-2 rounded-md border border-border bg-accent/20">
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-[13px] text-foreground flex-1">{doc.name}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${doc.status === "available" ? "bg-[hsl(var(--deal-paid))]/15 text-[hsl(var(--deal-paid))]" : "bg-[hsl(var(--deal-pending-details))]/15 text-[hsl(var(--deal-pending-details))]"}`}>
                        {doc.status === "available" ? "Available" : "pending"}
                      </span>
                    </div>
                  ))}
                </div>
              </CollapsibleSection>

              {/* Notes */}
              <CollapsibleSection title="Notes" sectionKey="notes" open={openSections.notes} onToggle={toggleSection}>
                <textarea
                  value={form.latestNote}
                  onChange={e => updateForm("latestNote", e.target.value)}
                  placeholder="Add any notes about this deal..."
                  className="w-full h-20 rounded-md border border-input bg-background px-3 py-2 text-[13px] placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                />
              </CollapsibleSection>
            </div>
          </ScrollArea>
        )}

        {step === "form" && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-card">
            <Button variant="outline" onClick={() => setStep("opportunity")}>Back</Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
              <Button onClick={handleCreate} disabled={!form.dealPrice || !form.buyerName}>Create Deal</Button>
            </div>
          </div>
        )}

        {/* Step 3: Success */}
        {step === "success" && (
          <div className="px-6 py-10 text-center">
            <CheckCircle className="h-14 w-14 mx-auto text-[hsl(var(--deal-paid))] mb-4" />
            <p className="text-[18px] font-semibold text-foreground">Deal Created Successfully</p>
            <Link to={`/deals/${createdDealId}`} className="inline-block text-[15px] font-mono text-primary mt-2 hover:underline cursor-pointer">{createdDealId}</Link>
            <p className="text-[13px] text-muted-foreground mt-2">Status: <span className="font-medium text-foreground">Reported</span></p>
            <Button onClick={handleClose} className="mt-6">Done</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* Helpers */
function Field({ label, labelClass, children }: { label: string; labelClass: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className={labelClass}>{label}</Label>
      {children}
    </div>
  );
}

function CollapsibleSection({ title, sectionKey, open, onToggle, children }: { title: string; sectionKey: string; open: boolean; onToggle: (key: string) => void; children: React.ReactNode }) {
  return (
    <div className="border-b border-border last:border-b-0">
      <button onClick={() => onToggle(sectionKey)} className="w-full flex items-center gap-2 py-3 text-left hover:bg-accent/30 transition-colors px-1 rounded-sm">
        {open ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
        <span className="text-[13px] font-semibold text-foreground">{title}</span>
      </button>
      {open && <div className="pb-4 px-1">{children}</div>}
    </div>
  );
}
