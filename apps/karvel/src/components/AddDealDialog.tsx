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
import { recalculateDeal } from "@/lib/dealCalculations";
import { toast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onClose: () => void;
  onDealCreated: (deal: Deal) => void;
}

type WizardStep = "context" | "parties" | "costs" | "success";
type MortgageChannel = "MA" | "B2C" | "BBG";

interface IdentityParty { partyId: string; displayName: string; }
interface RevenueLine { id: string; partyId: string; displayName: string; amount: number; description: string; }
interface CostEntry { partyId: string; displayName: string; amount: number; chargedToAgentPartyId?: string; }
interface ReferralEntry { partyId: string; displayName: string; amount: number; chargedToAgentPartyId?: string; }

const COUNTRY_TO_CURRENCY = { ae: "AED", es: "EUR", sa: "SAR" } as const;

const allAgentOptions = sharedAgents.map((a) => {
  const party = sharedParties.find((p) => p.id === a.partyId);
  return { agentId: a.id, partyId: a.partyId, displayName: party?.displayName ?? a.id, isBroker: a.id.startsWith("broker-") };
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

function IdentitySlot({ label, party, onClear }: { label: string; party: IdentityParty; onClear: () => void }) {
  return (
    <div className="flex items-center justify-between px-3 py-2.5 rounded-md border border-border bg-accent/10">
      <div>
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-0.5">{label}</p>
        <p className="text-[13px] font-medium text-foreground">{party.displayName}</p>
      </div>
      <button onClick={onClear} className="text-[11px] text-muted-foreground hover:text-foreground underline">Change</button>
    </div>
  );
}

function RevenueLinePicker({
  currency,
  demandParty,
  supplyParty,
  hintAmount,
  onConfirm,
  onCancel,
}: {
  currency: string;
  demandParty: IdentityParty | null;
  supplyParty: IdentityParty | null;
  hintAmount: number;
  onConfirm: (partyId: string, displayName: string, amount: number, description: string) => void;
  onCancel: () => void;
}) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<{ id: string; name: string } | null>(null);
  const [amountStr, setAmountStr] = useState(hintAmount > 0 ? String(Math.round(hintAmount * 100) / 100) : "");
  const [description, setDescription] = useState("Commission");

  const eligible = sharedParties.filter((p) => !p.id.startsWith("party-agent-") && !p.id.startsWith("party-conv-"));
  const results = search.length >= 2
    ? eligible.filter((p) => p.displayName.toLowerCase().includes(search.toLowerCase()) || p.taxId?.toLowerCase().startsWith(search.toLowerCase())).slice(0, 6)
    : [];

  const amt = parseFloat(amountStr);
  const canConfirm = selected != null && !isNaN(amt) && amt !== 0;

  const quickParties = [
    demandParty ? { ...demandParty, tag: "DEMAND" } : null,
    supplyParty ? { ...supplyParty, tag: "SUPPLY" } : null,
  ].filter(Boolean) as Array<IdentityParty & { tag: string }>;

  return (
    <div className="mt-2 bg-muted/30 border border-border/60 rounded-md px-3 py-3 space-y-2">
      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Add Revenue Line</p>
      {!selected ? (
        <div className="space-y-1.5">
          {quickParties.map((p) => (
            <button
              key={p.partyId}
              onMouseDown={() => setSelected({ id: p.partyId, name: p.displayName })}
              className="w-full text-left px-3 py-2 text-[13px] rounded border border-dashed border-border hover:bg-muted flex items-center justify-between"
            >
              <span>{p.displayName}</span>
              <span className="text-[11px] text-muted-foreground">{p.tag}</span>
            </button>
          ))}
          <div className="relative">
            <input
              autoFocus
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={supplyParty ? "Or search another party…" : "Search by name or Tax ID…"}
              className="w-full px-2 py-1.5 border border-border rounded text-[13px] bg-background focus:outline-none focus:ring-1 focus:ring-ring"
            />
            {results.length > 0 && (
              <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-card border border-border rounded-md shadow-lg overflow-hidden">
                {results.map((p) => (
                  <button key={p.id} onMouseDown={() => setSelected({ id: p.id, name: p.displayName })}
                    className="w-full text-left px-3 py-2 text-[13px] hover:bg-muted flex items-center justify-between gap-4">
                    <span>{p.displayName}</span>
                    <span className="text-[11px] text-muted-foreground shrink-0">{p.taxId}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-medium">{selected.name}</p>
            <button onClick={() => setSelected(null)} className="text-[11px] text-muted-foreground hover:text-foreground underline">Change</button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] text-muted-foreground">Amount ({currency})</label>
              <input
                autoFocus
                type="number"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                placeholder="e.g. 18000"
                className="w-full px-2 py-1 border border-border rounded text-[13px] bg-background focus:outline-none focus:ring-1 focus:ring-ring mt-0.5"
              />
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground">Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Commission"
                className="w-full px-2 py-1 border border-border rounded text-[13px] bg-background focus:outline-none focus:ring-1 focus:ring-ring mt-0.5"
              />
            </div>
          </div>
        </div>
      )}
      <div className="flex items-center justify-end gap-2">
        <button onClick={onCancel} className="px-3 py-1.5 text-[13px] text-muted-foreground hover:text-foreground">Cancel</button>
        <button
          onClick={() => selected && onConfirm(selected.id, selected.name, amt, description || "Commission")}
          disabled={!canConfirm}
          className="px-4 py-1.5 bg-primary text-primary-foreground rounded text-[13px] font-semibold hover:opacity-90 disabled:opacity-40"
        >
          Add
        </button>
      </div>
    </div>
  );
}

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
              <input autoFocus type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or Tax ID…"
                className="w-full px-2 py-1.5 border border-border rounded text-[13px] bg-background focus:outline-none focus:ring-1 focus:ring-ring" />
              {results.length > 0 && (
                <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-card border border-border rounded-md shadow-lg overflow-hidden">
                  {results.map((p) => (
                    <button key={p.id} onMouseDown={() => setSelected({ id: p.id, name: p.displayName })}
                      className="w-full text-left px-3 py-2 text-[13px] hover:bg-muted flex items-center justify-between gap-4">
                      <span>{p.displayName}</span>
                      <span className="text-[11px] text-muted-foreground shrink-0">{p.taxId}</span>
                    </button>
                  ))}
                </div>
              )}
              {search.length >= 2 && results.length === 0 && (
                <button onMouseDown={() => { setNewPartyMode(true); setNewTaxId(search); }}
                  className="mt-1 text-[12px] text-primary hover:underline">
                  No match — create new party for "{search}"
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <input autoFocus type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Full name / company"
                className="flex-1 min-w-[140px] px-2 py-1.5 border border-border rounded text-[13px] bg-background focus:outline-none focus:ring-1 focus:ring-ring" />
              <input type="text" value={newTaxId} onChange={(e) => setNewTaxId(e.target.value)} placeholder="Tax ID"
                className="w-28 px-2 py-1.5 border border-border rounded text-[13px] bg-background focus:outline-none focus:ring-1 focus:ring-ring" />
              <button onClick={handleCreateParty} disabled={!newName || !newTaxId}
                className="px-3 py-1.5 bg-primary text-primary-foreground rounded text-[13px] font-medium disabled:opacity-40">Next</button>
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
            <input autoFocus type="number" min={0} placeholder="e.g. 1 500" value={amountStr} onChange={(e) => setAmountStr(e.target.value)}
              className="w-36 px-2 py-1 border border-border rounded text-[13px] bg-background focus:outline-none focus:ring-1 focus:ring-ring" />
          </div>
          {agents && agents.length > 0 && (
            <div className="flex items-center gap-3">
              <label className="text-[12px] text-muted-foreground w-[160px] shrink-0">Charge to</label>
              <select value={chargedToAgentPartyId ?? "__huspy__"} onChange={(e) => setChargedToAgentPartyId(e.target.value === "__huspy__" ? undefined : e.target.value)}
                className="flex-1 px-2 py-1 border border-border rounded text-[12px] bg-background focus:outline-none focus:ring-1 focus:ring-ring">
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
        <button onClick={() => selected && onConfirm(selected.id, selected.name, amt, chargedToAgentPartyId)} disabled={!canConfirm}
          className="px-4 py-1.5 bg-primary text-primary-foreground rounded text-[13px] font-semibold hover:opacity-90 disabled:opacity-40">
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
  const [channel, setChannel] = useState<MortgageChannel>("B2C");
  const [country, setCountry] = useState<Country>("ae");
  const [market, setMarket] = useState<Market>("primary");
  const [propertyName, setPropertyName] = useState("");
  const [listerAgentId, setListerAgentId] = useState("");
  const [closerAgentId, setCloserAgentId] = useState("");
  const [listerSplitPct, setListerSplitPct] = useState("100");
  const [closerSplitPct, setCloserSplitPct] = useState("0");

  // ─── Step 2: Commission helper inputs (informational — pre-fill revenue lines) ──
  const [dealPrice, setDealPrice] = useState("");
  const [takeRate, setTakeRate] = useState("3");
  const [disbursedAmount, setDisbursedAmount] = useState("");
  const [bankSlab, setBankSlab] = useState("0.5");

  // ─── Step 2: Deal Parties (DEMAND / SUPPLY — identity only) ──────────────
  const [demandParty, setDemandParty] = useState<IdentityParty | null>(null);
  const [supplyParty, setSupplyParty] = useState<IdentityParty | null>(null);
  const [showDemandPicker, setShowDemandPicker] = useState(false);
  const [showSupplyPicker, setShowSupplyPicker] = useState(false);

  // ─── Step 2: Revenue Lines (REVENUE_SOURCE) ───────────────────────────────
  const [revenueLines, setRevenueLines] = useState<RevenueLine[]>([]);
  const [showRevenuePicker, setShowRevenuePicker] = useState(false);

  // ─── Step 3: Costs & Referrals ────────────────────────────────────────────
  const [costs, setCosts] = useState<CostEntry[]>([]);
  const [referrals, setReferrals] = useState<ReferralEntry[]>([]);
  const [showCostPicker, setShowCostPicker] = useState(false);
  const [showReferralPicker, setShowReferralPicker] = useState(false);

  const currency = COUNTRY_TO_CURRENCY[country];
  const isBrokerChannel = businessUnit === "mortgage" && channel === "MA";

  const agentOptionsForBU = useMemo(
    () => allAgentOptions.filter((a) => isBrokerChannel ? a.isBroker : !a.isBroker),
    [isBrokerChannel]
  );

  const listerAgent = useMemo(() => sharedAgents.find((a) => a.id === listerAgentId), [listerAgentId]);
  const closerAgent = useMemo(() => sharedAgents.find((a) => a.id === closerAgentId), [closerAgentId]);

  const dealAgentOptions = useMemo(() => {
    const opts: Array<{ partyId: string; name: string }> = [];
    if (listerAgent) opts.push({ partyId: listerAgent.partyId, name: agentOptionsForBU.find((a) => a.agentId === listerAgentId)?.displayName ?? listerAgentId });
    if (closerAgent && closerAgentId) opts.push({ partyId: closerAgent.partyId, name: agentOptionsForBU.find((a) => a.agentId === closerAgentId)?.displayName ?? closerAgentId });
    return opts;
  }, [listerAgent, closerAgent, listerAgentId, closerAgentId, agentOptionsForBU]);

  // Commission helper: informational — pre-fills the "Add revenue line" amount
  const commissionHint = useMemo(() => {
    if (businessUnit === "mortgage") return (parseFloat(disbursedAmount) || 0) * ((parseFloat(bankSlab) || 0) / 100);
    return (parseFloat(dealPrice) || 0) * ((parseFloat(takeRate) || 0) / 100);
  }, [businessUnit, dealPrice, takeRate, disbursedAmount, bankSlab]);

  const grossRevenue = useMemo(() => revenueLines.reduce((s, l) => s + l.amount, 0), [revenueLines]);

  const demandLabel = businessUnit === "mortgage" ? "Borrower" : market === "leasing" ? "Tenant" : "Buyer";
  const supplyLabel = businessUnit === "mortgage" ? "Bank / Lender" : market === "primary" ? "Developer" : market === "leasing" ? "Landlord" : "Seller";
  const listerLabel = isBrokerChannel ? "Primary Broker *" : "Lister (Seller-side) *";
  const closerLabel = isBrokerChannel ? "Co-Broker — optional" : "Closer (Buyer-side) — optional";

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

  const addRevenueLine = (partyId: string, displayName: string, amount: number, description: string) => {
    setRevenueLines((prev) => [...prev, { id: `rl-${Date.now()}`, partyId, displayName, amount, description }]);
    setShowRevenuePicker(false);
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
      channel: businessUnit === "mortgage" ? channel : undefined,
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
      clientName: demandParty?.displayName,
      title: propertyName || "Untitled Property",
      buildingName: propertyName || "Untitled Property",
      ofCaseNumber: `CASE-${String(Date.now()).slice(-6)}`,
      statusHistory: [{ from: "pending-details", to: "under-review", timestamp: new Date().toISOString() } as StatusHistoryEntry],
      agents: [],
      externalPartners: [],
      receivables: [],
      payables: [],
    };

    const agentStakeIdByPartyId: Record<string, string> = {};
    if (listerAgent) agentStakeIdByPartyId[listerAgent.partyId] = `ds-${id}-lister`;
    if (closerAgent) agentStakeIdByPartyId[closerAgent.partyId] = `ds-${id}-closer`;

    // AGENT_PAYOUT
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

    // REVENUE_SOURCE (from revenue lines)
    revenueLines.forEach((line, i) => {
      sharedDealStakeholders.push({
        id: `ds-${id}-rev-${i}`,
        dealId: id,
        partyId: line.partyId,
        role: "REVENUE_SOURCE",
        financialAmount: line.amount,
        description: line.description,
      });
    });

    // OPERATIONAL_DEDUCTION
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

    // ACQUISITION_DEDUCTION
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

    // DEMAND (identity only)
    if (demandParty) {
      sharedDealStakeholders.push({ id: `ds-${id}-demand`, dealId: id, partyId: demandParty.partyId, role: "DEMAND", isPrimary: true });
    }

    // SUPPLY (identity only)
    if (supplyParty) {
      sharedDealStakeholders.push({ id: `ds-${id}-supply`, dealId: id, partyId: supplyParty.partyId, role: "SUPPLY", isPrimary: true });
    }

    // Document requirements
    sharedDocumentRequirementTemplates
      .filter((t) => t.market === deal.market && t.businessUnit === deal.businessUnit && t.country === deal.country)
      .forEach((t, i) => {
        sharedDealDocumentRequirements.push({ id: `ddr-${id}-${i}`, dealId: id, label: t.label, required: t.required, status: "pending" });
      });

    const calculated = recalculateDeal(deal);
    onDealCreated(calculated);
    setCreatedDealId(id);
    setStep("success");
    toast({ title: "Deal Created", description: `Deal ${id} has been created.` });
  };

  const reset = () => {
    setStep("context");
    setBusinessUnit("rebu");
    setChannel("B2C");
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
    setDemandParty(null);
    setSupplyParty(null);
    setShowDemandPicker(false);
    setShowSupplyPicker(false);
    setRevenueLines([]);
    setShowRevenuePicker(false);
    setCosts([]);
    setReferrals([]);
    setShowCostPicker(false);
    setShowReferralPicker(false);
    setCreatedDealId("");
  };

  const handleClose = () => { reset(); onClose(); };

  // ─── Validation ───────────────────────────────────────────────────────────
  const splitSum = (parseFloat(listerSplitPct) || 0) + (closerAgentId ? (parseFloat(closerSplitPct) || 0) : 0);
  const splitsValid = !closerAgentId
    ? (parseFloat(listerSplitPct) || 0) === 100
    : Math.abs(splitSum - 100) < 0.01;
  const canLeaveContext = !!listerAgentId && !!propertyName && splitsValid;
  const revenueShortfall = commissionHint > 0 && grossRevenue < commissionHint;
  const canLeaveParties = grossRevenue > 0 && !revenueShortfall && demandParty !== null && supplyParty !== null;

  const stepNum = step === "context" ? 1 : step === "parties" ? 2 : step === "costs" ? 3 : 3;
  const stepLabel = step === "context" ? "Context" : step === "parties" ? "Parties & Revenue" : step === "costs" ? "Costs & Referrals" : "Done";

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0 gap-0 overflow-hidden">
        <div className="px-6 pt-6 pb-4 border-b border-border">
          <DialogHeader>
            <DialogTitle>
              {step === "success" ? "Deal Created" : `New Deal — Step ${stepNum} of 3: ${stepLabel}`}
            </DialogTitle>
            <DialogDescription>
              {step === "context" && "Declare the property, country, market, channel, and agent splits."}
              {step === "parties" && "Link transaction parties to the deal and declare revenue lines."}
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
                    <Select value={businessUnit} onValueChange={(v) => { setBusinessUnit(v as BusinessUnit); setListerAgentId(""); setCloserAgentId(""); }}>
                      <SelectTrigger className="h-9 text-[13px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rebu">REBU</SelectItem>
                        <SelectItem value="mortgage">Mortgage</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  {businessUnit === "mortgage" && (
                    <Field label="Channel">
                      <Select value={channel} onValueChange={(v) => { setChannel(v as MortgageChannel); setListerAgentId(""); setCloserAgentId(""); }}>
                        <SelectTrigger className="h-9 text-[13px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="B2C">B2C (Huspy direct)</SelectItem>
                          <SelectItem value="MA">MA / Broker</SelectItem>
                          <SelectItem value="BBG">BBG</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                  )}
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
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-3">
                  {isBrokerChannel ? "Broker" : "Agent Splits"}
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3 p-3 rounded-md border border-border bg-accent/10">
                    <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{listerLabel}</p>
                    <Field label={isBrokerChannel ? "Broker" : "Agent"}>
                      <Select value={listerAgentId} onValueChange={handleListerAgentChange}>
                        <SelectTrigger className="h-9 text-[13px]"><SelectValue placeholder={`Select ${isBrokerChannel ? "broker" : "agent"}…`} /></SelectTrigger>
                        <SelectContent>
                          {agentOptionsForBU.map((a) => (
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
                        ? <p className="text-[11px] text-muted-foreground">Strategy: <span className="font-medium text-foreground">
                            {af.strategy.kind === "broker-rate-slab" ? "broker-rate-slab (resolved at calculation time)" : `${af.strategy.kind}${af.strategy.kind === "flat" ? ` ${af.strategy.pct}%` : ""}`}
                          </span></p>
                        : <p className="text-[11px] text-amber-500">No AgentFinancials record</p>;
                    })()}
                  </div>

                  <div className="space-y-3 p-3 rounded-md border border-border bg-accent/10">
                    <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{closerLabel}</p>
                    <Field label={isBrokerChannel ? "Co-Broker" : "Agent"}>
                      <Select value={closerAgentId} onValueChange={handleCloserAgentChange}>
                        <SelectTrigger className="h-9 text-[13px]"><SelectValue placeholder="None" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">None</SelectItem>
                          {agentOptionsForBU.map((a) => (
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

        {/* ─── Step 2: Parties & Revenue ─── */}
        {step === "parties" && (
          <ScrollArea className="max-h-[calc(90vh-220px)]">
            <div className="px-6 py-5 space-y-6">

              {/* Deal Parties — identity only */}
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-1">Deal Parties — required</p>
                <p className="text-[12px] text-muted-foreground/70 mb-3">Who is on each side of the transaction? Identity only — revenue is declared separately below.</p>
                <div className="space-y-2">
                  {demandParty ? (
                    <IdentitySlot label={`DEMAND — ${demandLabel}`} party={demandParty} onClear={() => setDemandParty(null)} />
                  ) : showDemandPicker ? (
                    <PartyPicker
                      label={demandLabel}
                      currency={currency}
                      amountLabel=""
                      showAmount={false}
                      excludePartyIds={supplyParty ? [supplyParty.partyId] : []}
                      onConfirm={(partyId, displayName) => { setDemandParty({ partyId, displayName }); setShowDemandPicker(false); }}
                      onCancel={() => setShowDemandPicker(false)}
                    />
                  ) : (
                    <AddSlotButton label={`${demandLabel} (DEMAND)`} onClick={() => setShowDemandPicker(true)} />
                  )}

                  {supplyParty ? (
                    <IdentitySlot label={`SUPPLY — ${supplyLabel}`} party={supplyParty} onClear={() => setSupplyParty(null)} />
                  ) : showSupplyPicker ? (
                    <PartyPicker
                      label={supplyLabel}
                      currency={currency}
                      amountLabel=""
                      showAmount={false}
                      excludePartyIds={demandParty ? [demandParty.partyId] : []}
                      onConfirm={(partyId, displayName) => { setSupplyParty({ partyId, displayName }); setShowSupplyPicker(false); }}
                      onCancel={() => setShowSupplyPicker(false)}
                    />
                  ) : (
                    <AddSlotButton label={`${supplyLabel} (SUPPLY)`} onClick={() => setShowSupplyPicker(true)} />
                  )}
                </div>
              </div>

              {/* Revenue Lines */}
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-1">Revenue Lines — REVENUE_SOURCE</p>
                <p className="text-[12px] text-muted-foreground/70 mb-3">
                  {isBrokerChannel
                    ? "Enter the bank commission Huspy earns. Broker payout is computed from Broker Rate Slabs at calculation time."
                    : "All sources of Huspy revenue on this deal (commissions, conveyance fees, etc.)."}
                </p>

                {/* Commission helper */}
                <div className="bg-accent/50 rounded-md px-3 py-2.5 mb-3">
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-2">Commission helper</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {businessUnit === "mortgage" ? (
                      <>
                        <div className="flex items-center gap-1.5">
                          <label className="text-[12px] text-muted-foreground whitespace-nowrap">Principal ({currency})</label>
                          <input type="number" value={disbursedAmount} onChange={(e) => setDisbursedAmount(e.target.value)} placeholder="e.g. 1500000"
                            className="w-32 px-2 py-1 border border-border rounded text-[12px] bg-background focus:outline-none focus:ring-1 focus:ring-ring" />
                        </div>
                        <span className="text-muted-foreground text-[12px]">×</span>
                        <div className="flex items-center gap-1.5">
                          <label className="text-[12px] text-muted-foreground whitespace-nowrap">Bank rate %</label>
                          <input type="number" step="0.01" value={bankSlab} onChange={(e) => setBankSlab(e.target.value)} placeholder="1.2"
                            className="w-20 px-2 py-1 border border-border rounded text-[12px] bg-background focus:outline-none focus:ring-1 focus:ring-ring" />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-1.5">
                          <label className="text-[12px] text-muted-foreground whitespace-nowrap">Property price ({currency})</label>
                          <input type="number" value={dealPrice} onChange={(e) => setDealPrice(e.target.value)} placeholder="e.g. 1500000"
                            className="w-32 px-2 py-1 border border-border rounded text-[12px] bg-background focus:outline-none focus:ring-1 focus:ring-ring" />
                        </div>
                        <span className="text-muted-foreground text-[12px]">×</span>
                        <div className="flex items-center gap-1.5">
                          <label className="text-[12px] text-muted-foreground whitespace-nowrap">Take rate %</label>
                          <input type="number" step="0.1" value={takeRate} onChange={(e) => setTakeRate(e.target.value)} placeholder="3"
                            className="w-20 px-2 py-1 border border-border rounded text-[12px] bg-background focus:outline-none focus:ring-1 focus:ring-ring" />
                        </div>
                      </>
                    )}
                    <span className="text-muted-foreground text-[12px]">=</span>
                    <span className="font-mono text-[13px] font-semibold text-foreground">
                      {currency} {commissionHint > 0 ? commissionHint.toLocaleString(undefined, { maximumFractionDigits: 2 }) : "—"}
                    </span>
                    {commissionHint > 0 && (
                      <button
                        onClick={() => setShowRevenuePicker(true)}
                        className="text-[12px] text-primary hover:underline font-medium"
                      >
                        ↳ Add as revenue line
                      </button>
                    )}
                  </div>
                </div>

                {/* Revenue lines list */}
                {revenueLines.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {revenueLines.map((line) => (
                      <div key={line.id} className="flex items-center justify-between px-3 py-2 rounded-md border border-border bg-accent/10">
                        <div>
                          <p className="text-[13px] font-medium">{line.displayName}</p>
                          <p className="text-[12px] text-muted-foreground">{line.description}: {currency} {line.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                        </div>
                        <button onClick={() => setRevenueLines((prev) => prev.filter((l) => l.id !== line.id))} className="p-1 hover:text-destructive text-muted-foreground transition-colors">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    <p className="text-[12px] font-mono text-right text-muted-foreground">
                      Gross Revenue: <span className="text-foreground font-semibold">{currency} {grossRevenue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                    </p>
                    {revenueShortfall && (
                      <p className="text-[12px] text-destructive text-right">
                        Below expected commission of {currency} {commissionHint.toLocaleString(undefined, { maximumFractionDigits: 2 })} ({businessUnit === "mortgage" ? "principal × bank rate" : "deal price × take rate"}). Add more lines or adjust the helper.
                      </p>
                    )}
                  </div>
                )}

                {revenueShortfall && revenueLines.length === 0 && (
                  <p className="text-[12px] text-destructive mb-2">
                    Expected commission: {currency} {commissionHint.toLocaleString(undefined, { maximumFractionDigits: 2 })}. Add at least one revenue line to match or exceed it.
                  </p>
                )}

                {showRevenuePicker ? (
                  <RevenueLinePicker
                    currency={currency}
                    demandParty={demandParty}
                    supplyParty={supplyParty}
                    hintAmount={commissionHint}
                    onConfirm={addRevenueLine}
                    onCancel={() => setShowRevenuePicker(false)}
                  />
                ) : (
                  <button onClick={() => setShowRevenuePicker(true)} className="flex items-center gap-1 text-[13px] text-primary hover:underline font-medium">
                    <Plus className="h-3.5 w-3.5" /> Add revenue line
                  </button>
                )}
              </div>
            </div>
          </ScrollArea>
        )}

        {/* ─── Step 3: Costs & Referrals ─── */}
        {step === "costs" && (
          <ScrollArea className="max-h-[calc(90vh-220px)]">
            <div className="px-6 py-5 space-y-6">

              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-1">Operating Costs — Huspy Pays</p>
                <p className="text-[12px] text-muted-foreground/70 mb-3">Notary, conveyance agent, legal fees paid by Huspy. Deducted from net revenue.</p>
                {costs.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {costs.map((c, i) => {
                      const absorber = c.chargedToAgentPartyId ? dealAgentOptions.find((a) => a.partyId === c.chargedToAgentPartyId)?.name ?? c.chargedToAgentPartyId : null;
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
                  <InlinePartyPicker label="Add service cost" amountLabel="Cost amount" currency={currency} agents={dealAgentOptions}
                    onConfirm={(partyId, displayName, amount, chargedToAgentPartyId) => { setCosts((prev) => [...prev, { partyId, displayName, amount, chargedToAgentPartyId }]); setShowCostPicker(false); }}
                    onCancel={() => setShowCostPicker(false)} />
                ) : (
                  <button onClick={() => setShowCostPicker(true)} className="flex items-center gap-1 text-[13px] text-primary hover:underline font-medium">
                    <Plus className="h-3.5 w-3.5" /> Add service cost
                  </button>
                )}
              </div>

              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-1">Referrals</p>
                <p className="text-[12px] text-muted-foreground/70 mb-3">Referral fee paid to external partner. Deducted from agent commission pool before splits.</p>
                {referrals.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {referrals.map((r, i) => {
                      const absorber = r.chargedToAgentPartyId ? dealAgentOptions.find((a) => a.partyId === r.chargedToAgentPartyId)?.name ?? r.chargedToAgentPartyId : null;
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
                  <InlinePartyPicker label="Add referral partner" amountLabel="Referral fee" currency={currency} agents={dealAgentOptions}
                    onConfirm={(partyId, displayName, amount, chargedToAgentPartyId) => { setReferrals((prev) => [...prev, { partyId, displayName, amount, chargedToAgentPartyId }]); setShowReferralPicker(false); }}
                    onCancel={() => setShowReferralPicker(false)} />
                ) : (
                  <button onClick={() => setShowReferralPicker(true)} className="flex items-center gap-1 text-[13px] text-primary hover:underline font-medium">
                    <Plus className="h-3.5 w-3.5" /> Add referral
                  </button>
                )}
              </div>

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
                if (step === "parties") setStep("context");
                else if (step === "costs") setStep("parties");
              }}
              disabled={step === "context"}
            >
              Back
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
              {step === "context" && (
                <Button onClick={() => setStep("parties")} disabled={!canLeaveContext}>Next</Button>
              )}
              {step === "parties" && (
                <>
                  <Button variant="outline" onClick={handleCreate} disabled={!canLeaveParties}>
                    Create (skip costs)
                  </Button>
                  <Button onClick={() => setStep("costs")} disabled={!canLeaveParties}>Next</Button>
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
