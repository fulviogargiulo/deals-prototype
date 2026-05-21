import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle, Plus, X } from "lucide-react";
import { Deal } from "@/data/types";
import {
  sharedAgents,
  sharedAgentFinancials,
  sharedParties,
  sharedDealStakeholders,
  sharedDealDocumentRequirements,
  sharedDocumentRequirementTemplates,
  getBlueprint,
  type BusinessUnit,
  type Country,
  type Market,
  type StatusHistoryEntry,
} from "@huspy/shared-domain";
import { PartyPicker } from "@/components/PartyPicker";
import { toast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onClose: () => void;
  onDealCreated: (deal: Deal) => void;
}

type WizardStep = "context" | "revenue" | "costs" | "success";

interface ConfirmedParty {
  partyId: string;
  displayName: string;
  amount: number | undefined;
  additionalCharges: AdditionalCharge[];
}

interface AdditionalCharge {
  description: string;
  amount: number;
}

interface CostEntry {
  partyId: string;
  displayName: string;
  amount: number;
  chargedToAgentPartyId?: string;
}

interface ReferralEntry {
  partyId: string;
  displayName: string;
  amount: number;
  chargedToAgentPartyId?: string;
}

const COUNTRY_TO_CURRENCY = { ae: "AED", es: "EUR", sa: "SAR" } as const;

const agentOptions = sharedAgents.map((a) => {
  const party = sharedParties.find((p) => p.id === a.partyId);
  return { agentId: a.id, partyId: a.partyId, displayName: party?.displayName ?? a.id };
});

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">{label}</Label>
      {children}
    </div>
  );
}

function AddSlotButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-2 px-3 py-2.5 rounded-md border border-dashed border-border text-[13px] text-muted-foreground hover:border-primary hover:text-primary transition-colors"
    >
      <span className="text-[16px] leading-none">+</span> Add {label}
    </button>
  );
}

function ConfirmedSlot({
  label,
  party,
  currency,
  onClear,
  onAddCharge,
  onRemoveCharge,
}: {
  label: string;
  party: ConfirmedParty;
  currency: string;
  onClear: () => void;
  onAddCharge: (charge: AdditionalCharge) => void;
  onRemoveCharge: (index: number) => void;
}) {
  const [showChargeForm, setShowChargeForm] = useState(false);
  const [chargeDesc, setChargeDesc] = useState("Conveyance Fee");
  const [chargeAmount, setChargeAmount] = useState("");

  const handleAddCharge = () => {
    const amt = parseFloat(chargeAmount);
    if (!chargeDesc.trim() || isNaN(amt) || amt <= 0) return;
    onAddCharge({ description: chargeDesc.trim(), amount: amt });
    setChargeAmount("");
    setChargeDesc("Conveyance Fee");
    setShowChargeForm(false);
  };

  return (
    <div className="rounded-md border border-border bg-accent/10">
      <div className="flex items-center justify-between px-3 py-2.5">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-0.5">{label}</p>
          <p className="text-[13px] font-medium text-foreground">{party.displayName}</p>
          {(party.amount ?? 0) > 0 ? (
            <p className="text-[12px] text-muted-foreground">
              Commission: {currency} {party.amount!.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </p>
          ) : (
            <p className="text-[12px] text-muted-foreground italic">No commission</p>
          )}
        </div>
        <button onClick={onClear} className="text-[11px] text-muted-foreground hover:text-foreground underline">
          Change
        </button>
      </div>

      {/* Additional charges */}
      {party.additionalCharges.length > 0 && (
        <div className="border-t border-border/40 px-3 py-1.5 space-y-1">
          {party.additionalCharges.map((c, i) => (
            <div key={i} className="flex items-center justify-between">
              <span className="text-[12px] text-muted-foreground">{c.description}: {currency} {c.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
              <button onClick={() => onRemoveCharge(i)} className="p-0.5 hover:text-destructive text-muted-foreground transition-colors">
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add charge form */}
      {showChargeForm ? (
        <div className="border-t border-border/40 px-3 py-2 flex items-center gap-2 flex-wrap">
          <input
            type="text"
            value={chargeDesc}
            onChange={(e) => setChargeDesc(e.target.value)}
            placeholder="e.g. Conveyance Fee"
            className="flex-1 min-w-[120px] px-2 py-1 border border-border rounded text-[12px] bg-background focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <input
            type="number"
            min={0}
            value={chargeAmount}
            onChange={(e) => setChargeAmount(e.target.value)}
            placeholder="Amount"
            className="w-24 px-2 py-1 border border-border rounded text-[12px] bg-background focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <button
            onClick={handleAddCharge}
            disabled={!chargeDesc.trim() || !chargeAmount || parseFloat(chargeAmount) <= 0}
            className="px-2 py-1 bg-primary text-primary-foreground rounded text-[12px] font-medium disabled:opacity-40"
          >
            Add
          </button>
          <button onClick={() => setShowChargeForm(false)} className="text-[12px] text-muted-foreground hover:text-foreground">
            Cancel
          </button>
        </div>
      ) : (
        <div className="border-t border-border/40 px-3 py-1.5">
          <button
            onClick={() => setShowChargeForm(true)}
            className="flex items-center gap-1 text-[11px] text-primary hover:underline font-medium"
          >
            <Plus className="h-3 w-3" /> Add charge (e.g. conveyance, admin fee)
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Simple party picker for costs/referrals ────────────────────────────────

function InlinePartyPicker({
  label,
  amountLabel,
  currency,
  agents,
  onConfirm,
  onCancel,
}: {
  label: string;
  amountLabel: string;
  currency: string;
  agents?: Array<{ partyId: string; name: string }>;
  onConfirm: (partyId: string, displayName: string, amount: number, chargedToAgentPartyId?: string) => void;
  onCancel: () => void;
}) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<{ id: string; name: string } | null>(null);
  const [amountStr, setAmountStr] = useState("");
  const [newPartyMode, setNewPartyMode] = useState(false);
  const [newName, setNewName] = useState("");
  const [newTaxId, setNewTaxId] = useState("");
  const [chargedToAgentPartyId, setChargedToAgentPartyId] = useState<string | undefined>();

  const results = search.length >= 2
    ? sharedParties.filter((p) => p.taxId?.toLowerCase().startsWith(search.toLowerCase()) || p.displayName.toLowerCase().includes(search.toLowerCase())).slice(0, 6)
    : [];

  const handleCreateParty = () => {
    if (!newName || !newTaxId) return;
    const existing = sharedParties.find((p) => p.taxId === newTaxId);
    if (existing) { setSelected({ id: existing.id, name: existing.displayName }); setNewPartyMode(false); return; }
    const party = { id: `party-ext-${Date.now()}`, displayName: newName, legalType: "individual" as const, taxId: newTaxId };
    sharedParties.push(party);
    setSelected({ id: party.id, name: party.displayName });
    setNewPartyMode(false);
  };

  const amt = parseFloat(amountStr);
  const canConfirm = selected != null && !isNaN(amt) && amt > 0;

  return (
    <div className="mt-2 bg-muted/30 border border-border/60 rounded-md px-3 py-3 space-y-2">
      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>

      {!selected ? (
        <>
          {!newPartyMode ? (
            <div className="relative">
              <input
                autoFocus
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or Tax ID…"
                className="w-full px-2 py-1.5 border border-border rounded text-[13px] bg-background focus:outline-none focus:ring-1 focus:ring-ring"
              />
              {results.length > 0 && (
                <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-card border border-border rounded-md shadow-lg overflow-hidden">
                  {results.map((p) => (
                    <button key={p.id} onMouseDown={() => setSelected({ id: p.id, name: p.displayName })} className="w-full text-left px-3 py-2 text-[13px] hover:bg-muted flex items-center justify-between gap-4">
                      <span>{p.displayName}</span>
                      <span className="text-[11px] text-muted-foreground shrink-0">{p.taxId}</span>
                    </button>
                  ))}
                </div>
              )}
              {search.length >= 2 && results.length === 0 && (
                <button onMouseDown={() => { setNewPartyMode(true); setNewTaxId(search); }} className="mt-1 text-[12px] text-primary hover:underline">
                  No match — create new party for "{search}"
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <input autoFocus type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Full name / company" className="flex-1 min-w-[140px] px-2 py-1.5 border border-border rounded text-[13px] bg-background focus:outline-none focus:ring-1 focus:ring-ring" />
              <input type="text" value={newTaxId} onChange={(e) => setNewTaxId(e.target.value)} placeholder="Tax ID" className="w-28 px-2 py-1.5 border border-border rounded text-[13px] bg-background focus:outline-none focus:ring-1 focus:ring-ring" />
              <button onClick={handleCreateParty} disabled={!newName || !newTaxId} className="px-3 py-1.5 bg-primary text-primary-foreground rounded text-[13px] font-medium disabled:opacity-40">Next</button>
            </div>
          )}
        </>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-medium">{selected.name}</p>
            <button onClick={() => setSelected(null)} className="text-[11px] text-muted-foreground hover:text-foreground underline">Change</button>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-[12px] text-muted-foreground w-[160px] shrink-0">{amountLabel} ({currency})</label>
            <input
              autoFocus
              type="number"
              min={0}
              placeholder="e.g. 1 500"
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value)}
              className="w-36 px-2 py-1 border border-border rounded text-[13px] bg-background focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          {agents && agents.length > 0 && (
            <div className="flex items-center gap-3">
              <label className="text-[12px] text-muted-foreground w-[160px] shrink-0">Charge to</label>
              <select
                value={chargedToAgentPartyId ?? "__huspy__"}
                onChange={(e) => setChargedToAgentPartyId(e.target.value === "__huspy__" ? undefined : e.target.value)}
                className="flex-1 px-2 py-1 border border-border rounded text-[12px] bg-background focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="__huspy__">Huspy (deduct from gross revenue)</option>
                {agents.map((a) => (
                  <option key={a.partyId} value={a.partyId}>{a.name} (deduct from their commission)</option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-end gap-2">
        <button onClick={onCancel} className="px-3 py-1.5 text-[13px] text-muted-foreground hover:text-foreground">Cancel</button>
        <button
          onClick={() => selected && onConfirm(selected.id, selected.name, amt, chargedToAgentPartyId)}
          disabled={!canConfirm}
          className="px-4 py-1.5 bg-primary text-primary-foreground rounded text-[13px] font-semibold hover:opacity-90 disabled:opacity-40"
        >
          Add
        </button>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AddDealDialog({ open, onClose, onDealCreated }: Props) {
  const [step, setStep] = useState<WizardStep>("context");
  const [createdDealId, setCreatedDealId] = useState("");

  // ─── Step 1: Context ──────────────────────────────────────────────────────
  const [businessUnit, setBusinessUnit] = useState<BusinessUnit>("rebu");
  const [country, setCountry] = useState<Country>("ae");
  const [market, setMarket] = useState<Market>("primary");
  const [propertyName, setPropertyName] = useState("");
  const [listerAgentId, setListerAgentId] = useState("");
  const [closerAgentId, setCloserAgentId] = useState("");
  const [listerSplitPct, setListerSplitPct] = useState("100");
  const [closerSplitPct, setCloserSplitPct] = useState("0");

  // ─── Step 2: Revenue ──────────────────────────────────────────────────────
  const [dealPrice, setDealPrice] = useState("");
  const [takeRate, setTakeRate] = useState("3");
  const [disbursedAmount, setDisbursedAmount] = useState("");
  const [bankSlab, setBankSlab] = useState("0.5");

  const [buyerSlot, setBuyerSlot] = useState<ConfirmedParty | null>(null);
  const [counterpartySlot, setCounterpartySlot] = useState<ConfirmedParty | null>(null);
  const [showBuyerPicker, setShowBuyerPicker] = useState(false);
  const [showCounterpartyPicker, setShowCounterpartyPicker] = useState(false);

  // ─── Step 3: Costs & Referrals ────────────────────────────────────────────
  const [costs, setCosts] = useState<CostEntry[]>([]);
  const [referrals, setReferrals] = useState<ReferralEntry[]>([]);
  const [showCostPicker, setShowCostPicker] = useState(false);
  const [showReferralPicker, setShowReferralPicker] = useState(false);

  const currency = COUNTRY_TO_CURRENCY[country];

  const listerAgent = useMemo(() => sharedAgents.find((a) => a.id === listerAgentId), [listerAgentId]);
  const closerAgent = useMemo(() => sharedAgents.find((a) => a.id === closerAgentId), [closerAgentId]);

  const dealAgentOptions = useMemo(() => {
    const opts: Array<{ partyId: string; name: string }> = [];
    if (listerAgent) {
      const name = agentOptions.find((a) => a.agentId === listerAgentId)?.displayName ?? listerAgentId;
      opts.push({ partyId: listerAgent.partyId, name });
    }
    if (closerAgent && closerAgentId) {
      const name = agentOptions.find((a) => a.agentId === closerAgentId)?.displayName ?? closerAgentId;
      opts.push({ partyId: closerAgent.partyId, name });
    }
    return opts;
  }, [listerAgent, closerAgent, listerAgentId, closerAgentId]);

  const commissionRevenue = useMemo(() => {
    if (businessUnit === "mortgage") return (parseFloat(disbursedAmount) || 0) * ((parseFloat(bankSlab) || 0) / 100);
    return (parseFloat(dealPrice) || 0) * ((parseFloat(takeRate) || 0) / 100);
  }, [businessUnit, dealPrice, takeRate, disbursedAmount, bankSlab]);

  // Total additional charges across both party slots
  const additionalChargesTotal = useMemo(() => {
    const buyerExtra = (buyerSlot?.additionalCharges ?? []).reduce((s, c) => s + c.amount, 0);
    const cpExtra = (counterpartySlot?.additionalCharges ?? []).reduce((s, c) => s + c.amount, 0);
    return buyerExtra + cpExtra;
  }, [buyerSlot, counterpartySlot]);

  const grossRevenue = commissionRevenue + additionalChargesTotal;

  const buyerLabel = businessUnit === "mortgage" ? "Borrower" : market === "leasing" ? "Tenant" : "Buyer";
  const counterpartyLabel = businessUnit === "mortgage" ? "Bank / Lender" : market === "primary" ? "Developer" : market === "leasing" ? "Landlord" : "Seller";

  const handleListerSplitChange = (val: string) => {
    setListerSplitPct(val);
    if (closerAgentId) setCloserSplitPct(String(Math.max(0, 100 - (parseFloat(val) || 0))));
  };

  const handleListerAgentChange = (agentId: string) => {
    setListerAgentId(agentId);
    if (!closerAgentId) { setListerSplitPct("100"); setCloserSplitPct("0"); }
  };

  const handleCloserAgentChange = (agentId: string) => {
    if (agentId === "__none__") agentId = "";
    setCloserAgentId(agentId);
    if (agentId) {
      setCloserSplitPct(String(Math.max(0, 100 - (parseFloat(listerSplitPct) || 100))));
    } else {
      setListerSplitPct("100");
      setCloserSplitPct("0");
    }
  };

  const handleCreate = () => {
    const id = `DEAL-${String(Date.now()).slice(-6)}`;

    const primaryAgent = listerAgent ?? closerAgent;
    const primaryParty = primaryAgent ? sharedParties.find((p) => p.id === primaryAgent.partyId) : undefined;

    const deal: Deal = {
      id,
      status: "under-review",
      market: businessUnit === "mortgage" ? "primary" : market,
      businessUnit,
      country,
      currency,
      blueprintId: getBlueprint(country, businessUnit).id,
      dealAmount: businessUnit === "mortgage" ? parseFloat(disbursedAmount) || 0 : parseFloat(dealPrice) || 0,
      grossRevenue,
      dealPrice: businessUnit === "mortgage" ? parseFloat(disbursedAmount) || 0 : parseFloat(dealPrice) || 0,
      takeRate: businessUnit === "mortgage" ? parseFloat(bankSlab) || 0 : parseFloat(takeRate) || 0,
      commissionPercentage: businessUnit === "mortgage" ? parseFloat(bankSlab) || 0 : parseFloat(takeRate) || 0,
      reportDate: new Date().toISOString().split("T")[0],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      agentName: primaryParty?.displayName ?? "Unknown Agent",
      clientName: buyerSlot?.displayName ?? counterpartySlot?.displayName,
      title: propertyName || "Untitled Property",
      buildingName: propertyName || "Untitled Property",
      ofCaseNumber: `CASE-${String(Date.now()).slice(-6)}`,
      statusHistory: [{ from: "pending-details", to: "under-review", timestamp: new Date().toISOString() } as StatusHistoryEntry],
      agents: [],
      externalPartners: [],
      receivables: [],
      payables: [],
    };

    // Build partyId → agent stake ID map for resolving parentStakeholderId on child costs.
    const agentStakeIdByPartyId: Record<string, string> = {};
    if (listerAgent) agentStakeIdByPartyId[listerAgent.partyId] = `ds-${id}-lister`;
    if (closerAgent) agentStakeIdByPartyId[closerAgent.partyId] = `ds-${id}-closer`;

    // AGENT_PAYOUT stakeholders
    if (listerAgent) {
      sharedDealStakeholders.push({
        id: `ds-${id}-lister`,
        dealId: id,
        partyId: listerAgent.partyId,
        role: "AGENT_PAYOUT",
        isPrimary: true,
        splitPercentage: parseFloat(listerSplitPct) || 100,
      });
    }
    if (closerAgent) {
      sharedDealStakeholders.push({
        id: `ds-${id}-closer`,
        dealId: id,
        partyId: closerAgent.partyId,
        role: "AGENT_PAYOUT",
        splitPercentage: parseFloat(closerSplitPct) || 0,
      });
    }

    // REVENUE_SOURCE stakeholders — commission lines + additional charges per party
    if (businessUnit === "mortgage" && counterpartySlot && commissionRevenue > 0) {
      sharedDealStakeholders.push({
        id: `ds-${id}-bank-revenue`,
        dealId: id,
        partyId: counterpartySlot.partyId,
        role: "REVENUE_SOURCE",
        financialAmount: commissionRevenue,
        description: "Commission",
      });
    }

    if (businessUnit === "rebu") {
      if (buyerSlot && (buyerSlot.amount ?? 0) > 0) {
        sharedDealStakeholders.push({
          id: `ds-${id}-buyer`,
          dealId: id,
          partyId: buyerSlot.partyId,
          role: "REVENUE_SOURCE",
          financialAmount: buyerSlot.amount!,
          description: "Commission",
        });
      }
      buyerSlot?.additionalCharges.forEach((c, i) => {
        sharedDealStakeholders.push({
          id: `ds-${id}-buyer-extra-${i}`,
          dealId: id,
          partyId: buyerSlot!.partyId,
          role: "REVENUE_SOURCE",
          financialAmount: c.amount,
          description: c.description,
        });
      });

      if (counterpartySlot && (counterpartySlot.amount ?? 0) > 0) {
        sharedDealStakeholders.push({
          id: `ds-${id}-counterparty`,
          dealId: id,
          partyId: counterpartySlot.partyId,
          role: "REVENUE_SOURCE",
          financialAmount: counterpartySlot.amount!,
          description: "Commission",
        });
      }
      counterpartySlot?.additionalCharges.forEach((c, i) => {
        sharedDealStakeholders.push({
          id: `ds-${id}-cp-extra-${i}`,
          dealId: id,
          partyId: counterpartySlot!.partyId,
          role: "REVENUE_SOURCE",
          financialAmount: c.amount,
          description: c.description,
        });
      });
    }

    // OPERATIONAL_DEDUCTION stakeholders
    costs.forEach((c, i) => {
      sharedDealStakeholders.push({
        id: `ds-${id}-cost-${i}`,
        dealId: id,
        partyId: c.partyId,
        role: "OPERATIONAL_DEDUCTION",
        financialAmount: -Math.abs(c.amount),
        description: "Service Cost",
        parentStakeholderId: c.chargedToAgentPartyId ? agentStakeIdByPartyId[c.chargedToAgentPartyId] : undefined,
      });
    });

    // ACQUISITION_DEDUCTION stakeholders (referrals)
    referrals.forEach((r, i) => {
      sharedDealStakeholders.push({
        id: `ds-${id}-ref-${i}`,
        dealId: id,
        partyId: r.partyId,
        role: "ACQUISITION_DEDUCTION",
        financialAmount: -Math.abs(r.amount),
        description: "Referral",
        parentStakeholderId: r.chargedToAgentPartyId ? agentStakeIdByPartyId[r.chargedToAgentPartyId] : undefined,
      });
    });

    // DEMAND stakeholder (buyer / tenant / borrower)
    if (buyerSlot) {
      sharedDealStakeholders.push({
        id: `ds-${id}-demand`,
        dealId: id,
        partyId: buyerSlot.partyId,
        role: "DEMAND",
        isPrimary: true,
      });
    }

    // SUPPLY stakeholder (seller / developer / landlord / bank)
    if (counterpartySlot) {
      sharedDealStakeholders.push({
        id: `ds-${id}-supply`,
        dealId: id,
        partyId: counterpartySlot.partyId,
        role: "SUPPLY",
        isPrimary: true,
      });
    }

    // Document requirements
    sharedDocumentRequirementTemplates
      .filter((t) => t.market === deal.market && t.businessUnit === deal.businessUnit && t.country === deal.country)
      .forEach((t, i) => {
        sharedDealDocumentRequirements.push({
          id: `ddr-${id}-${i}`,
          dealId: id,
          label: t.label,
          required: t.required,
          status: "pending",
        });
      });

    onDealCreated(deal);
    setCreatedDealId(id);
    setStep("success");
    toast({ title: "Deal Created", description: `Deal ${id} has been created.` });
  };

  const reset = () => {
    setStep("context");
    setBusinessUnit("rebu");
    setCountry("ae");
    setMarket("primary");
    setPropertyName("");
    setListerAgentId("");
    setCloserAgentId("");
    setListerSplitPct("100");
    setCloserSplitPct("0");
    setDealPrice("");
    setTakeRate("3");
    setDisbursedAmount("");
    setBankSlab("0.5");
    setBuyerSlot(null);
    setCounterpartySlot(null);
    setShowBuyerPicker(false);
    setShowCounterpartyPicker(false);
    setCosts([]);
    setReferrals([]);
    setShowCostPicker(false);
    setShowReferralPicker(false);
    setCreatedDealId("");
  };

  const handleClose = () => { reset(); onClose(); };

  // ─── Step gating ──────────────────────────────────────────────────────────
  const splitSum = (parseFloat(listerSplitPct) || 0) + (closerAgentId ? (parseFloat(closerSplitPct) || 0) : 0);
  const splitsValid = !closerAgentId
    ? (parseFloat(listerSplitPct) || 0) === 100
    : Math.abs(splitSum - 100) < 0.01;
  const canLeaveContext = !!listerAgentId && !!propertyName && splitsValid;

  const slotCommissionSum = (buyerSlot?.amount ?? 0) + (counterpartySlot?.amount ?? 0);
  // Both DEMAND and SUPPLY are mandatory for every deal. Amounts are optional (balance check is informational only).
  const partySlotsValid = buyerSlot !== null && counterpartySlot !== null;

  const canLeaveRevenue = canLeaveContext && commissionRevenue > 0 && partySlotsValid;

  const stepNum = step === "context" ? 1 : step === "revenue" ? 2 : step === "costs" ? 3 : 3;
  const stepLabel = step === "context" ? "Context" : step === "revenue" ? "Revenue" : step === "costs" ? "Costs & Referrals" : "Done";

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0 gap-0 overflow-hidden">
        <div className="px-6 pt-6 pb-4 border-b border-border">
          <DialogHeader>
            <DialogTitle>
              {step === "success" ? "Deal Created" : `New Deal — Step ${stepNum} of 3: ${stepLabel}`}
            </DialogTitle>
            <DialogDescription>
              {step === "context" && "Declare the property, country, market, and agent splits."}
              {step === "revenue" && "Declare gross commission and the parties on each side of the deal."}
              {step === "costs" && "Optional: declare service costs Huspy will pay, and any referral partners."}
              {step === "success" && "Your deal has been created and is now available across all views."}
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* ─── Step 1: Context ─── */}
        {step === "context" && (
          <ScrollArea className="max-h-[calc(90vh-220px)]">
            <div className="px-6 py-5 space-y-5">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-3">Header Data</p>
                <div className="grid grid-cols-3 gap-4">
                  <Field label="Business Unit">
                    <Select value={businessUnit} onValueChange={(v) => setBusinessUnit(v as BusinessUnit)}>
                      <SelectTrigger className="h-9 text-[13px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rebu">REBU</SelectItem>
                        <SelectItem value="mortgage">Mortgage</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Country">
                    <Select value={country} onValueChange={(v) => setCountry(v as Country)}>
                      <SelectTrigger className="h-9 text-[13px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ae">UAE (AE)</SelectItem>
                        <SelectItem value="es">Spain (ES)</SelectItem>
                        <SelectItem value="sa">Saudi Arabia (SA)</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Currency — derived">
                    <Input readOnly value={currency} className="h-9 text-[13px] bg-muted font-mono" />
                  </Field>
                </div>
                {businessUnit === "rebu" && (
                  <div className="mt-4 grid grid-cols-3 gap-4">
                    <Field label="Market">
                      <Select value={market} onValueChange={(v) => setMarket(v as Market)}>
                        <SelectTrigger className="h-9 text-[13px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="primary">Primary (off-plan / new)</SelectItem>
                          <SelectItem value="secondary">Secondary (resale)</SelectItem>
                          <SelectItem value="leasing">Leasing</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                  </div>
                )}
                <div className="mt-4">
                  <Field label="Property Name">
                    <Input
                      placeholder="e.g. Marina Waterfront Tower, Unit 12A"
                      value={propertyName}
                      onChange={(e) => setPropertyName(e.target.value)}
                      className="h-9 text-[13px]"
                    />
                  </Field>
                </div>
              </div>

              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-3">Agent Splits</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3 p-3 rounded-md border border-border bg-accent/10">
                    <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Lister (Seller-side) *</p>
                    <Field label="Agent">
                      <Select value={listerAgentId} onValueChange={handleListerAgentChange}>
                        <SelectTrigger className="h-9 text-[13px]"><SelectValue placeholder="Select agent…" /></SelectTrigger>
                        <SelectContent>
                          {agentOptions.map((a) => (
                            <SelectItem key={a.agentId} value={a.agentId} disabled={a.agentId === closerAgentId}>
                              {a.displayName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label="Pool Share %">
                      <Input type="number" min="0" max="100" value={listerSplitPct} onChange={(e) => handleListerSplitChange(e.target.value)} className="h-9 text-[13px]" />
                    </Field>
                    {listerAgentId && (() => {
                      const af = sharedAgentFinancials.find((f) => f.agentId === listerAgentId);
                      return af
                        ? <p className="text-[11px] text-muted-foreground">Strategy: <span className="font-medium text-foreground">{af.strategy.kind}{af.strategy.kind === "flat" ? ` ${af.strategy.pct}%` : ""}</span></p>
                        : <p className="text-[11px] text-amber-500">No AgentFinancials record</p>;
                    })()}
                  </div>

                  <div className="space-y-3 p-3 rounded-md border border-border bg-accent/10">
                    <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Closer (Buyer-side) — optional</p>
                    <Field label="Agent">
                      <Select value={closerAgentId} onValueChange={handleCloserAgentChange}>
                        <SelectTrigger className="h-9 text-[13px]"><SelectValue placeholder="None (single agent)" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">None</SelectItem>
                          {agentOptions.map((a) => (
                            <SelectItem key={a.agentId} value={a.agentId} disabled={a.agentId === listerAgentId}>
                              {a.displayName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                    {closerAgentId && (
                      <>
                        <Field label="Pool Share %">
                          <Input type="number" min="0" max="100" value={closerSplitPct} onChange={(e) => setCloserSplitPct(e.target.value)} className="h-9 text-[13px]" />
                        </Field>
                        {(() => {
                          const af = sharedAgentFinancials.find((f) => f.agentId === closerAgentId);
                          return af
                            ? <p className="text-[11px] text-muted-foreground">Strategy: <span className="font-medium text-foreground">{af.strategy.kind}{af.strategy.kind === "flat" ? ` ${af.strategy.pct}%` : ""}</span></p>
                            : <p className="text-[11px] text-amber-500">No AgentFinancials record</p>;
                        })()}
                      </>
                    )}
                  </div>
                </div>
                {closerAgentId && !splitsValid && (
                  <p className="text-[12px] text-destructive mt-2">Splits must sum to 100% (currently {splitSum.toFixed(0)}%)</p>
                )}
              </div>
            </div>
          </ScrollArea>
        )}

        {/* ─── Step 2: Revenue ─── */}
        {step === "revenue" && (
          <ScrollArea className="max-h-[calc(90vh-220px)]">
            <div className="px-6 py-5 space-y-5">
              {businessUnit === "rebu" ? (
                <>
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-3">Commission</p>
                    <div className="grid grid-cols-3 gap-4">
                      <Field label={`Property Price (${currency})`}>
                        <Input type="number" value={dealPrice} onChange={(e) => setDealPrice(e.target.value)} className="h-9 text-[13px]" />
                      </Field>
                      <Field label="Take Rate %">
                        <Input type="number" step="0.1" value={takeRate} onChange={(e) => setTakeRate(e.target.value)} className="h-9 text-[13px]" />
                      </Field>
                      <Field label={`Commission (${currency}) — derived`}>
                        <Input readOnly value={commissionRevenue > 0 ? commissionRevenue.toFixed(2) : ""} className="h-9 text-[13px] bg-muted font-mono" />
                      </Field>
                    </div>
                  </div>

                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-3">
                      Deal Parties
                      <span className="ml-2 text-muted-foreground/60 normal-case">— link transaction parties; amount optional (leave blank if this side doesn't pay commission)</span>
                    </p>
                    <div className="space-y-3">
                      {buyerSlot ? (
                        <ConfirmedSlot
                          label={buyerLabel}
                          party={buyerSlot}
                          currency={currency}
                          onClear={() => setBuyerSlot(null)}
                          onAddCharge={(c) => setBuyerSlot((p) => p ? { ...p, additionalCharges: [...p.additionalCharges, c] } : p)}
                          onRemoveCharge={(i) => setBuyerSlot((p) => p ? { ...p, additionalCharges: p.additionalCharges.filter((_, idx) => idx !== i) } : p)}
                        />
                      ) : showBuyerPicker ? (
                        <PartyPicker
                          label={buyerLabel}
                          currency={currency}
                          amountLabel="Commission owed to Huspy"
                          excludePartyIds={counterpartySlot ? [counterpartySlot.partyId] : []}
                          onConfirm={(partyId, displayName, amount) => {
                            setBuyerSlot({ partyId, displayName, amount, additionalCharges: [] });
                            setShowBuyerPicker(false);
                          }}
                          onCancel={() => setShowBuyerPicker(false)}
                        />
                      ) : (
                        <AddSlotButton label={buyerLabel} onClick={() => setShowBuyerPicker(true)} />
                      )}

                      {counterpartySlot ? (
                        <ConfirmedSlot
                          label={counterpartyLabel}
                          party={counterpartySlot}
                          currency={currency}
                          onClear={() => setCounterpartySlot(null)}
                          onAddCharge={(c) => setCounterpartySlot((p) => p ? { ...p, additionalCharges: [...p.additionalCharges, c] } : p)}
                          onRemoveCharge={(i) => setCounterpartySlot((p) => p ? { ...p, additionalCharges: p.additionalCharges.filter((_, idx) => idx !== i) } : p)}
                        />
                      ) : showCounterpartyPicker ? (
                        <PartyPicker
                          label={counterpartyLabel}
                          currency={currency}
                          amountLabel="Commission owed to Huspy"
                          excludePartyIds={buyerSlot ? [buyerSlot.partyId] : []}
                          onConfirm={(partyId, displayName, amount) => {
                            setCounterpartySlot({ partyId, displayName, amount, additionalCharges: [] });
                            setShowCounterpartyPicker(false);
                          }}
                          onCancel={() => setShowCounterpartyPicker(false)}
                        />
                      ) : (
                        <AddSlotButton label={counterpartyLabel} onClick={() => setShowCounterpartyPicker(true)} />
                      )}
                    </div>

                    {/* Balance indicator — commission only */}
                    {commissionRevenue > 0 && buyerSlot && counterpartySlot && (
                      <p className={`mt-3 text-[12px] font-mono ${Math.abs(slotCommissionSum - commissionRevenue) < 0.01 ? "text-emerald-600" : "text-destructive"}`}>
                        Commission assigned: {currency} {slotCommissionSum.toLocaleString(undefined, { maximumFractionDigits: 2 })} / {currency} {commissionRevenue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        {Math.abs(slotCommissionSum - commissionRevenue) < 0.01
                          ? " ✓"
                          : ` — ${Math.abs(commissionRevenue - slotCommissionSum).toLocaleString(undefined, { maximumFractionDigits: 2 })} unassigned`}
                      </p>
                    )}
                    {additionalChargesTotal > 0 && (
                      <p className="mt-1 text-[12px] text-muted-foreground font-mono">
                        Additional charges: {currency} {additionalChargesTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        {" · "}Total gross: {currency} {grossRevenue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <div className="space-y-5">
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-3">Commission</p>
                    <div className="grid grid-cols-3 gap-4">
                      <Field label={`Disbursed Amount (${currency})`}>
                        <Input type="number" value={disbursedAmount} onChange={(e) => setDisbursedAmount(e.target.value)} className="h-9 text-[13px]" />
                      </Field>
                      <Field label="Bank Slab %">
                        <Input type="number" step="0.01" value={bankSlab} onChange={(e) => setBankSlab(e.target.value)} className="h-9 text-[13px]" />
                      </Field>
                      <Field label={`Gross Commission (${currency}) — derived`}>
                        <Input readOnly value={commissionRevenue.toFixed(2)} className="h-9 text-[13px] bg-muted font-mono" />
                      </Field>
                    </div>
                  </div>

                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-3">
                      Deal Parties
                      <span className="ml-2 text-muted-foreground/60 normal-case">— both required</span>
                    </p>
                    <div className="space-y-3">
                      {buyerSlot ? (
                        <ConfirmedSlot label={buyerLabel} party={buyerSlot} currency={currency} onClear={() => setBuyerSlot(null)} onAddCharge={() => {}} onRemoveCharge={() => {}} />
                      ) : showBuyerPicker ? (
                        <PartyPicker
                          label={buyerLabel}
                          currency={currency}
                          amountLabel="Commission owed to Huspy"
                          onConfirm={(partyId, displayName, amount) => { setBuyerSlot({ partyId, displayName, amount, additionalCharges: [] }); setShowBuyerPicker(false); }}
                          onCancel={() => setShowBuyerPicker(false)}
                        />
                      ) : (
                        <AddSlotButton label={buyerLabel} onClick={() => setShowBuyerPicker(true)} />
                      )}

                      {counterpartySlot ? (
                        <ConfirmedSlot label={counterpartyLabel} party={counterpartySlot} currency={currency} onClear={() => setCounterpartySlot(null)} onAddCharge={() => {}} onRemoveCharge={() => {}} />
                      ) : showCounterpartyPicker ? (
                        <PartyPicker
                          label={counterpartyLabel}
                          currency={currency}
                          amountLabel="Commission owed to Huspy"
                          excludePartyIds={buyerSlot ? [buyerSlot.partyId] : []}
                          onConfirm={(partyId, displayName, amount) => { setCounterpartySlot({ partyId, displayName, amount, additionalCharges: [] }); setShowCounterpartyPicker(false); }}
                          onCancel={() => setShowCounterpartyPicker(false)}
                        />
                      ) : (
                        <AddSlotButton label={counterpartyLabel} onClick={() => setShowCounterpartyPicker(true)} />
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        )}

        {/* ─── Step 3: Costs & Referrals ─── */}
        {step === "costs" && (
          <ScrollArea className="max-h-[calc(90vh-220px)]">
            <div className="px-6 py-5 space-y-6">

              {/* Operating Costs */}
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-1">Operating Costs — Huspy Pays</p>
                <p className="text-[12px] text-muted-foreground/70 mb-3">Notary, conveyance agent, legal fees paid by Huspy. Deducted from net revenue.</p>
                {costs.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {costs.map((c, i) => {
                      const absorber = c.chargedToAgentPartyId
                        ? dealAgentOptions.find((a) => a.partyId === c.chargedToAgentPartyId)?.name ?? c.chargedToAgentPartyId
                        : null;
                      return (
                        <div key={i} className="flex items-center justify-between px-3 py-2 rounded-md border border-border bg-accent/10">
                          <div>
                            <p className="text-[13px] font-medium">{c.displayName}</p>
                            <p className="text-[12px] text-muted-foreground">
                              {currency} {c.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                              {absorber && <span className="ml-1 text-amber-600">· from {absorber}'s commission</span>}
                            </p>
                          </div>
                          <button onClick={() => setCosts((prev) => prev.filter((_, idx) => idx !== i))} className="p-1 hover:text-destructive text-muted-foreground transition-colors">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
                {showCostPicker ? (
                  <InlinePartyPicker
                    label="Add service cost"
                    amountLabel="Cost amount"
                    currency={currency}
                    agents={dealAgentOptions}
                    onConfirm={(partyId, displayName, amount, chargedToAgentPartyId) => {
                      setCosts((prev) => [...prev, { partyId, displayName, amount, chargedToAgentPartyId }]);
                      setShowCostPicker(false);
                    }}
                    onCancel={() => setShowCostPicker(false)}
                  />
                ) : (
                  <button
                    onClick={() => setShowCostPicker(true)}
                    className="flex items-center gap-1 text-[13px] text-primary hover:underline font-medium"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add service cost
                  </button>
                )}
              </div>

              {/* Referrals */}
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-1">Referrals</p>
                <p className="text-[12px] text-muted-foreground/70 mb-3">Referral fee paid to external partner. Deducted from agent commission pool before splits.</p>
                {referrals.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {referrals.map((r, i) => {
                      const absorber = r.chargedToAgentPartyId
                        ? dealAgentOptions.find((a) => a.partyId === r.chargedToAgentPartyId)?.name ?? r.chargedToAgentPartyId
                        : null;
                      return (
                        <div key={i} className="flex items-center justify-between px-3 py-2 rounded-md border border-border bg-accent/10">
                          <div>
                            <p className="text-[13px] font-medium">{r.displayName}</p>
                            <p className="text-[12px] text-muted-foreground">
                              {currency} {r.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                              {absorber && <span className="ml-1 text-amber-600">· from {absorber}'s commission</span>}
                            </p>
                          </div>
                          <button onClick={() => setReferrals((prev) => prev.filter((_, idx) => idx !== i))} className="p-1 hover:text-destructive text-muted-foreground transition-colors">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
                {showReferralPicker ? (
                  <InlinePartyPicker
                    label="Add referral partner"
                    amountLabel="Referral fee"
                    currency={currency}
                    agents={dealAgentOptions}
                    onConfirm={(partyId, displayName, amount, chargedToAgentPartyId) => {
                      setReferrals((prev) => [...prev, { partyId, displayName, amount, chargedToAgentPartyId }]);
                      setShowReferralPicker(false);
                    }}
                    onCancel={() => setShowReferralPicker(false)}
                  />
                ) : (
                  <button
                    onClick={() => setShowReferralPicker(true)}
                    className="flex items-center gap-1 text-[13px] text-primary hover:underline font-medium"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add referral
                  </button>
                )}
              </div>

              {/* Summary of what will be created */}
              <div className="rounded-md border border-border/60 bg-muted/20 px-4 py-3 space-y-1">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">P&L Summary</p>
                <SummaryRow label="Gross Revenue" value={`${currency} ${grossRevenue.toLocaleString(undefined, { maximumFractionDigits: 2 })}`} />
                {costs.length > 0 && (
                  <SummaryRow label="Operating Costs" value={`−${currency} ${costs.reduce((s, c) => s + c.amount, 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`} dim />
                )}
                {referrals.length > 0 && (
                  <SummaryRow label="Referrals" value={`−${currency} ${referrals.reduce((s, r) => s + r.amount, 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`} dim />
                )}
              </div>
            </div>
          </ScrollArea>
        )}

        {/* ─── Footer ─── */}
        {step !== "success" && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-card">
            <Button
              variant="outline"
              onClick={() => {
                if (step === "revenue") setStep("context");
                else if (step === "costs") setStep("revenue");
              }}
              disabled={step === "context"}
            >
              Back
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
              {step === "context" && (
                <Button onClick={() => setStep("revenue")} disabled={!canLeaveContext}>Next</Button>
              )}
              {step === "revenue" && (
                <>
                  <Button variant="outline" onClick={handleCreate} disabled={!canLeaveRevenue}>
                    Create (skip costs)
                  </Button>
                  <Button onClick={() => setStep("costs")} disabled={!canLeaveRevenue}>Next</Button>
                </>
              )}
              {step === "costs" && (
                <Button onClick={handleCreate}>Create Deal</Button>
              )}
            </div>
          </div>
        )}

        {/* ─── Success ─── */}
        {step === "success" && (
          <div className="px-6 py-10 text-center">
            <CheckCircle className="h-14 w-14 mx-auto text-[hsl(var(--deal-paid))] mb-4" />
            <p className="text-[18px] font-semibold text-foreground">Deal Created Successfully</p>
            <Link to={`/deals/${createdDealId}`} className="inline-block text-[15px] font-mono text-primary mt-2 hover:underline cursor-pointer">{createdDealId}</Link>
            <p className="text-[13px] text-muted-foreground mt-2">Status: <span className="font-medium text-foreground">Under Review</span></p>
            <Button onClick={handleClose} className="mt-6">Done</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function SummaryRow({ label, value, dim = false }: { label: string; value: string; dim?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={`text-[12px] ${dim ? "text-muted-foreground" : "text-foreground font-medium"}`}>{label}</span>
      <span className={`text-[12px] font-mono ${dim ? "text-muted-foreground" : "text-foreground font-semibold"}`}>{value}</span>
    </div>
  );
}
