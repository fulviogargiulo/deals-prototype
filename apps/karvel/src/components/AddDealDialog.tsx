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
  sharedPnlEntries,
  sharedDealParticipants,
  sharedDealDocumentRequirements,
  sharedDocumentRequirementTemplates,
  getBlueprint,
  type BusinessUnit,
  type Country,
  type Market,
  type StatusHistoryEntry,
} from "@huspy/shared-domain";
import { PartyPicker } from "@/components/PartyPicker";
import { derivePnlEngine, getMissingAgentFinancials, type DealEngineKey } from "@/lib/dealCalculations";
import { addTranche } from "@/data/trancheStore";
import type { Tranche } from "@/data/types";
import { toast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onClose: () => void;
  onDealCreated: (deal: Deal) => void;
}

type WizardStep = "context" | "parties" | "payouts" | "success";
type MortgageChannel = "MA" | "BYOB" | "REA" | "DS" | "B2C" | "BBG";

interface IdentityParty { partyId: string; displayName: string; }
interface RevenueLine { id: string; partyId: string; displayName: string; amount: number; description: string; }
interface PayoutEntry { agentId: string; partyId: string; displayName: string; splitPct: number; }
interface DeductionEntry { partyId: string; displayName: string; amount: number; parentPartyId?: string; }

const COUNTRY_TO_CURRENCY = { ae: "AED", es: "EUR", sa: "SAR" } as const;

const allAgentOptions = sharedAgents.map((a) => {
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

function PayoutPicker({
  excludePartyIds,
  engine,
  onConfirm,
  onCancel,
}: {
  excludePartyIds: string[];
  engine: DealEngineKey;
  onConfirm: (agentId: string, partyId: string, displayName: string, splitPct: number) => void;
  onCancel: () => void;
}) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<{ agentId: string; partyId: string; name: string } | null>(null);
  const [splitStr, setSplitStr] = useState("100");

  const options = allAgentOptions.filter((a) => !excludePartyIds.includes(a.partyId));
  const filtered = search.length >= 1
    ? options.filter((a) => a.displayName.toLowerCase().includes(search.toLowerCase())).slice(0, 8)
    : options.slice(0, 8);

  const split = parseFloat(splitStr);
  const hasAf = (agentId: string) =>
    engine === "manual" || !!sharedAgentFinancials.find((f) => f.agentId === agentId && f.pnlEngine === engine);

  const strategyLabel = (agentId: string) => {
    if (engine === "manual") return "Fixed amount";
    const af = sharedAgentFinancials.find((f) => f.agentId === agentId && f.pnlEngine === engine);
    if (!af) return "⚠ No engine config";
    if (af.strategy.kind === "broker-rate-slab") return "Broker rate slab";
    if (af.strategy.kind === "mbu-direct-rate-slab") return "MBU direct rate";
    if (af.strategy.kind === "flat") return `Flat ${(af.strategy as { pct: number }).pct}%`;
    if (af.strategy.kind === "slab") return `Slab (${af.strategy.slabs.length} tiers)`;
    if (af.strategy.kind === "max") return `Max ${(af.strategy as { pct: number }).pct}%`;
    return af.strategy.kind;
  };

  const selectedHasAf = selected ? hasAf(selected.agentId) : true;
  const canConfirm = selected != null && !isNaN(split) && split > 0 && split <= 100 && selectedHasAf;

  return (
    <div className="mt-2 bg-muted/30 border border-border/60 rounded-md px-3 py-3 space-y-2">
      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Add Payout</p>
      {!selected ? (
        <div className="space-y-1.5">
          <input
            autoFocus
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search agent…"
            className="w-full px-2 py-1.5 border border-border rounded text-[13px] bg-background focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {filtered.map((a) => {
              const missing = !hasAf(a.agentId);
              return (
                <button
                  key={a.agentId}
                  onMouseDown={() => setSelected({ agentId: a.agentId, partyId: a.partyId, name: a.displayName })}
                  className={`w-full text-left px-3 py-2 text-[13px] rounded border border-dashed hover:bg-muted flex items-center justify-between ${missing ? "border-amber-300 opacity-70" : "border-border"}`}
                >
                  <span>{a.displayName}</span>
                  <span className={`text-[11px] ${missing ? "text-amber-600 font-medium" : "text-muted-foreground"}`}>{strategyLabel(a.agentId)}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-medium">{selected.name}</p>
            <button onClick={() => setSelected(null)} className="text-[11px] text-muted-foreground hover:text-foreground underline">Change</button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Engine config:{" "}
            <span className={`font-medium ${selectedHasAf ? "text-foreground" : "text-amber-600"}`}>
              {strategyLabel(selected.agentId)}
            </span>
          </p>
          {!selectedHasAf && (
            <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1.5">
              This agent has no <strong>{engine}</strong> engine config. Set it up in their Agent profile before saving this deal.
            </p>
          )}
          <div className="flex items-center gap-3">
            <label className="text-[12px] text-muted-foreground w-[120px] shrink-0">Pool Split %</label>
            <input
              autoFocus
              type="number"
              min={0}
              max={100}
              value={splitStr}
              onChange={(e) => setSplitStr(e.target.value)}
              className="w-24 px-2 py-1 border border-border rounded text-[13px] bg-background focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        </div>
      )}
      <div className="flex items-center justify-end gap-2">
        <button onClick={onCancel} className="px-3 py-1.5 text-[13px] text-muted-foreground hover:text-foreground">Cancel</button>
        <button
          onClick={() => selected && onConfirm(selected.agentId, selected.partyId, selected.name, split)}
          disabled={!canConfirm}
          className="px-4 py-1.5 bg-primary text-primary-foreground rounded text-[13px] font-semibold hover:opacity-90 disabled:opacity-40"
        >
          Add
        </button>
      </div>
    </div>
  );
}

function DeductionPicker({
  label,
  amountLabel,
  currency,
  payouts,
  onConfirm,
  onCancel,
}: {
  label: string;
  amountLabel: string;
  currency: string;
  payouts: PayoutEntry[];
  onConfirm: (partyId: string, displayName: string, amount: number, parentPartyId?: string) => void;
  onCancel: () => void;
}) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<{ id: string; name: string } | null>(null);
  const [amountStr, setAmountStr] = useState("");
  const [parentPartyId, setParentPartyId] = useState<string | undefined>();
  const [newPartyMode, setNewPartyMode] = useState(false);
  const [newName, setNewName] = useState("");
  const [newTaxId, setNewTaxId] = useState("");

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
          {payouts.length > 0 && (
            <div className="flex items-center gap-3">
              <label className="text-[12px] text-muted-foreground w-[160px] shrink-0">Absorbed by</label>
              <select
                value={parentPartyId ?? "__huspy__"}
                onChange={(e) => setParentPartyId(e.target.value === "__huspy__" ? undefined : e.target.value)}
                className="flex-1 px-2 py-1 border border-border rounded text-[12px] bg-background focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="__huspy__">Huspy (deduct from gross revenue)</option>
                {payouts.map((p) => (
                  <option key={p.partyId} value={p.partyId}>{p.displayName} (deduct from their commission)</option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}
      <div className="flex items-center justify-end gap-2">
        <button onClick={onCancel} className="px-3 py-1.5 text-[13px] text-muted-foreground hover:text-foreground">Cancel</button>
        <button onClick={() => selected && onConfirm(selected.id, selected.name, amt, parentPartyId)} disabled={!canConfirm}
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
  const [dealTitle, setDealTitle] = useState("");

  // ─── Step 2: Commission helper ────────────────────────────────────────────
  const [dealAmountStr, setDealAmountStr] = useState("");
  const [rateStr, setRateStr] = useState("3");

  // ─── Step 2: Transaction parties (identity only) ──────────────────────────
  const [demandParty, setDemandParty] = useState<IdentityParty | null>(null);
  const [supplyParty, setSupplyParty] = useState<IdentityParty | null>(null);
  const [showDemandPicker, setShowDemandPicker] = useState(false);
  const [showSupplyPicker, setShowSupplyPicker] = useState(false);

  // ─── Step 2: Revenue lines (REVENUE_SOURCE) ───────────────────────────────
  const [revenueLines, setRevenueLines] = useState<RevenueLine[]>([]);
  const [showRevenuePicker, setShowRevenuePicker] = useState(false);

  // ─── Step 3: Agent payouts (AGENT_PAYOUT) ────────────────────────────────
  const [payouts, setPayouts] = useState<PayoutEntry[]>([]);
  const [showPayoutPicker, setShowPayoutPicker] = useState(false);

  // ─── Step 3: Acquisition deductions (ACQUISITION_DEDUCTION) ──────────────
  const [acquisitions, setAcquisitions] = useState<DeductionEntry[]>([]);
  const [showAcquisitionPicker, setShowAcquisitionPicker] = useState(false);

  // ─── Step 3: Operational deductions (OPERATIONAL_DEDUCTION) ──────────────
  const [operations, setOperations] = useState<DeductionEntry[]>([]);
  const [showOperationsPicker, setShowOperationsPicker] = useState(false);

  const currency = COUNTRY_TO_CURRENCY[country];
  const grossRevenue = useMemo(() => revenueLines.reduce((s, l) => s + l.amount, 0), [revenueLines]);
  const commissionHint = useMemo(
    () => (parseFloat(dealAmountStr) || 0) * ((parseFloat(rateStr) || 0) / 100),
    [dealAmountStr, rateStr]
  );

  const demandLabel = businessUnit === "mortgage" ? "Borrower" : market === "leasing" ? "Tenant" : "Buyer";
  const supplyLabel = businessUnit === "mortgage" ? "Bank / Lender" : market === "primary" ? "Developer" : market === "leasing" ? "Landlord" : "Seller";

  const currentEngine = derivePnlEngine({ businessUnit, channel });

  const splitSum = payouts.reduce((s, p) => s + p.splitPct, 0);
  const splitsValid = payouts.length === 0 || Math.abs(splitSum - 100) < 0.01;

  // Agents on non-manual deals that are missing an AF config for the deal's engine.
  const missingAfAgents = useMemo(() => {
    if (currentEngine === "manual") return [];
    return payouts.filter((p) =>
      !sharedAgentFinancials.find((f) => f.agentId === p.agentId && f.pnlEngine === currentEngine)
    );
  }, [payouts, currentEngine]);

  const canLeaveContext = !!dealTitle.trim();
  const revenueShortfall = commissionHint > 0 && grossRevenue < commissionHint;
  const canLeaveParties = grossRevenue > 0 && !revenueShortfall && demandParty !== null && supplyParty !== null;
  const canLeavePayouts = splitsValid && missingAfAgents.length === 0;

  const handleCreate = () => {
    if (missingAfAgents.length > 0) {
      toast({
        title: "Missing engine config",
        description: `${missingAfAgents.map((p) => p.displayName).join(", ")} do not have a "${currentEngine}" engine config. Set it up in their Agent profile first.`,
        variant: "destructive",
      });
      return;
    }
    const id = `DEAL-${String(Date.now()).slice(-6)}`;
    const dealAmount = parseFloat(dealAmountStr) || 0;
    const primaryPayout = payouts[0];
    const primaryParty = primaryPayout ? sharedParties.find((p) => p.id === primaryPayout.partyId) : undefined;

    const now = new Date().toISOString();
    const deal: Deal = {
      id,
      market: businessUnit === "mortgage" ? "primary" : market,
      businessUnit,
      channel: businessUnit === "mortgage" ? channel : undefined,
      country,
      currency,
      dealAmount,
      createdAt: now,
      updatedAt: now,
      title: dealTitle,
    };

    // Tranche carries the state machine and financial config.
    // Tranche ID = deal ID for simplicity (single-tranche deals).
    const tranche: Tranche = {
      id,
      dealId: id,
      index: 0,
      status: "under-review",
      pnlEngine: derivePnlEngine({ businessUnit, channel }),
      blueprintId: getBlueprint(country, businessUnit).id,
      reportDate: now.split("T")[0],
      statusHistory: [{ from: "pending-details", to: "under-review", timestamp: now }],
      createdAt: now,
      updatedAt: now,
    };

    // AGENT_PAYOUT
    const agentStakeIdByPartyId: Record<string, string> = {};
    payouts.forEach((p, i) => {
      const stakeId = `ds-${id}-agent-${i}`;
      agentStakeIdByPartyId[p.partyId] = stakeId;
      sharedPnlEntries.push({
        id: stakeId,
        trancheId: id,
        partyId: p.partyId,
        role: "AGENT_PAYOUT",
        isPrimary: i === 0,
        splitPercentage: p.splitPct,
        source: "engine",
        status: "draft",
      });
    });

    // REVENUE_SOURCE
    revenueLines.forEach((line, i) => {
      sharedPnlEntries.push({
        id: `ds-${id}-rev-${i}`,
        trancheId: id,
        partyId: line.partyId,
        role: "REVENUE_SOURCE",
        amount: line.amount,
        description: line.description,
        source: "manual",
        status: "draft",
      });
    });

    // ACQUISITION_DEDUCTION
    acquisitions.forEach((a, i) => {
      sharedPnlEntries.push({
        id: `ds-${id}-acq-${i}`,
        trancheId: id,
        partyId: a.partyId,
        role: "ACQUISITION_DEDUCTION",
        amount: -Math.abs(a.amount),
        description: "Acquisition Cost",
        parentEntryId: a.parentPartyId ? agentStakeIdByPartyId[a.parentPartyId] : undefined,
        source: "manual",
        status: "draft",
      });
    });

    // OPERATIONAL_DEDUCTION
    operations.forEach((o, i) => {
      sharedPnlEntries.push({
        id: `ds-${id}-op-${i}`,
        trancheId: id,
        partyId: o.partyId,
        role: "OPERATIONAL_DEDUCTION",
        amount: -Math.abs(o.amount),
        description: "Service Cost",
        parentEntryId: o.parentPartyId ? agentStakeIdByPartyId[o.parentPartyId] : undefined,
        source: "manual",
        status: "draft",
      });
    });

    // DEMAND / SUPPLY go on the Deal, not the Tranche
    if (demandParty) {
      sharedDealParticipants.push({ id: `dp-${id}-demand`, dealId: id, partyId: demandParty.partyId, role: "DEMAND", isPrimary: true });
    }
    if (supplyParty) {
      sharedDealParticipants.push({ id: `dp-${id}-supply`, dealId: id, partyId: supplyParty.partyId, role: "SUPPLY" });
    }

    // Document requirements
    sharedDocumentRequirementTemplates
      .filter((t) => t.market === deal.market && t.businessUnit === deal.businessUnit && t.country === deal.country)
      .forEach((t, i) => {
        sharedDealDocumentRequirements.push({ id: `ddr-${id}-${i}`, trancheId: id, label: t.label, required: t.required, status: "pending" });
      });

    addTranche(tranche);
    onDealCreated(deal);
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
    setDealTitle("");
    setDealAmountStr("");
    setRateStr("3");
    setDemandParty(null);
    setSupplyParty(null);
    setShowDemandPicker(false);
    setShowSupplyPicker(false);
    setRevenueLines([]);
    setShowRevenuePicker(false);
    setPayouts([]);
    setShowPayoutPicker(false);
    setAcquisitions([]);
    setShowAcquisitionPicker(false);
    setOperations([]);
    setShowOperationsPicker(false);
    setCreatedDealId("");
  };

  const handleClose = () => { reset(); onClose(); };

  const stepNum = step === "context" ? 1 : step === "parties" ? 2 : step === "payouts" ? 3 : 3;
  const stepLabel = step === "context" ? "Context" : step === "parties" ? "Parties & Revenue" : step === "payouts" ? "Payouts & Deductions" : "Done";

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0 gap-0 overflow-hidden">
        <div className="px-6 pt-6 pb-4 border-b border-border">
          <DialogHeader>
            <DialogTitle>
              {step === "success" ? "Deal Created" : `New Deal — Step ${stepNum} of 3: ${stepLabel}`}
            </DialogTitle>
            <DialogDescription>
              {step === "context" && "Classify the deal: business unit, channel, country, and reference."}
              {step === "parties" && "Link transaction parties and declare all revenue sources."}
              {step === "payouts" && "Optional: add agent payouts, acquisition costs, and service deductions."}
              {step === "success" && "Your deal has been created and is now available across all views."}
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* ─── Step 1: Context ─── */}
        {step === "context" && (
          <ScrollArea className="max-h-[calc(90vh-220px)]">
            <div className="px-6 py-5 space-y-5">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-3">Classification</p>
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
                  {businessUnit === "mortgage" && (
                    <Field label="Channel">
                      <Select value={channel} onValueChange={(v) => setChannel(v as MortgageChannel)}>
                        <SelectTrigger className="h-9 text-[13px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="REA">REA (Real Estate Agent)</SelectItem>
                          <SelectItem value="DS">DS (Direct Sales)</SelectItem>
                          <SelectItem value="B2C">B2C (Huspy direct)</SelectItem>
                          <SelectItem value="MA">MA / Broker</SelectItem>
                          <SelectItem value="BYOB">BYOB (Bring Your Own Broker)</SelectItem>
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
                  <Field label="Deal Reference">
                    <Input
                      placeholder={businessUnit === "mortgage" ? "e.g. Application REF-12345" : "e.g. Marina Waterfront Tower, Unit 12A"}
                      value={dealTitle}
                      onChange={(e) => setDealTitle(e.target.value)}
                      className="h-9 text-[13px]"
                    />
                  </Field>
                </div>
              </div>
            </div>
          </ScrollArea>
        )}

        {/* ─── Step 2: Parties & Revenue ─── */}
        {step === "parties" && (
          <ScrollArea className="max-h-[calc(90vh-220px)]">
            <div className="px-6 py-5 space-y-6">

              {/* Transaction Parties */}
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-1">Transaction Parties — required</p>
                <p className="text-[12px] text-muted-foreground/70 mb-3">Who is on each side of the transaction? Identity only — revenue is declared below.</p>
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
                <p className="text-[12px] text-muted-foreground/70 mb-3">All sources of Huspy revenue on this deal.</p>

                {/* Commission helper */}
                <div className="bg-accent/50 rounded-md px-3 py-2.5 mb-3">
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-2">Commission helper</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <label className="text-[12px] text-muted-foreground whitespace-nowrap">Deal Amount ({currency})</label>
                      <input type="number" value={dealAmountStr} onChange={(e) => setDealAmountStr(e.target.value)} placeholder="e.g. 1 500 000"
                        className="w-36 px-2 py-1 border border-border rounded text-[12px] bg-background focus:outline-none focus:ring-1 focus:ring-ring" />
                    </div>
                    <span className="text-muted-foreground text-[12px]">×</span>
                    <div className="flex items-center gap-1.5">
                      <label className="text-[12px] text-muted-foreground whitespace-nowrap">Rate %</label>
                      <input type="number" step="0.01" value={rateStr} onChange={(e) => setRateStr(e.target.value)} placeholder="e.g. 1.2"
                        className="w-20 px-2 py-1 border border-border rounded text-[12px] bg-background focus:outline-none focus:ring-1 focus:ring-ring" />
                    </div>
                    <span className="text-muted-foreground text-[12px]">=</span>
                    <span className="font-mono text-[13px] font-semibold text-foreground">
                      {currency} {commissionHint > 0 ? commissionHint.toLocaleString(undefined, { maximumFractionDigits: 2 }) : "—"}
                    </span>
                    {commissionHint > 0 && (
                      <button onClick={() => setShowRevenuePicker(true)} className="text-[12px] text-primary hover:underline font-medium">
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
                        Below expected commission of {currency} {commissionHint.toLocaleString(undefined, { maximumFractionDigits: 2 })}. Add more lines or adjust the helper.
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
                    onConfirm={(partyId, displayName, amount, description) => {
                      setRevenueLines((prev) => [...prev, { id: `rl-${Date.now()}`, partyId, displayName, amount, description }]);
                      setShowRevenuePicker(false);
                    }}
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

        {/* ─── Step 3: Payouts & Deductions ─── */}
        {step === "payouts" && (
          <ScrollArea className="max-h-[calc(90vh-220px)]">
            <div className="px-6 py-5 space-y-6">

              {/* Agent Payouts */}
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-1">Agent Payouts</p>
                <p className="text-[12px] text-muted-foreground/70 mb-3">Add one or more payout recipients. Splits must sum to 100%.</p>
                {payouts.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {payouts.map((p, i) => {
                      const af = sharedAgentFinancials.find((f) => f.agentId === p.agentId && f.pnlEngine === currentEngine);
                      const missing = currentEngine !== "manual" && !af;
                      const label = currentEngine === "manual" ? "Fixed amount" :
                        !af ? "⚠ No engine config" :
                        af.strategy.kind === "broker-rate-slab" ? "Broker rate slab" :
                        af.strategy.kind === "mbu-direct-rate-slab" ? "MBU direct rate" :
                        af.strategy.kind === "flat" ? `Flat ${(af.strategy as { pct: number }).pct}%` :
                        af.strategy.kind;
                      return (
                        <div key={i} className={`flex items-center justify-between px-3 py-2 rounded-md border bg-accent/10 ${missing ? "border-amber-300" : "border-border"}`}>
                          <div>
                            <p className="text-[13px] font-medium">{p.displayName}</p>
                            <p className={`text-[12px] ${missing ? "text-amber-600 font-medium" : "text-muted-foreground"}`}>Split: {p.splitPct}% · {label}</p>
                          </div>
                          <button onClick={() => setPayouts((prev) => prev.filter((_, idx) => idx !== i))} className="p-1 hover:text-destructive text-muted-foreground transition-colors">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      );
                    })}
                    <p className={`text-[12px] font-mono text-right ${splitsValid ? "text-muted-foreground" : "text-destructive"}`}>
                      Split total: <span className="font-semibold">{splitSum.toFixed(0)}%</span>
                      {!splitsValid && <span className="ml-1">— must equal 100%</span>}
                    </p>
                    {missingAfAgents.length > 0 && (
                      <p className="text-[12px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1.5">
                        ⚠ {missingAfAgents.map((p) => p.displayName).join(", ")} need a <strong>{currentEngine}</strong> engine config before this deal can be saved.
                      </p>
                    )}
                  </div>
                )}
                {showPayoutPicker ? (
                  <PayoutPicker
                    excludePartyIds={payouts.map((p) => p.partyId)}
                    engine={currentEngine}
                    onConfirm={(agentId, partyId, displayName, splitPct) => {
                      setPayouts((prev) => [...prev, { agentId, partyId, displayName, splitPct }]);
                      setShowPayoutPicker(false);
                    }}
                    onCancel={() => setShowPayoutPicker(false)}
                  />
                ) : (
                  <button onClick={() => setShowPayoutPicker(true)} className="flex items-center gap-1 text-[13px] text-primary hover:underline font-medium">
                    <Plus className="h-3.5 w-3.5" /> Add payout
                  </button>
                )}
              </div>

              {/* Acquisition Deductions */}
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-1">Acquisition Costs</p>
                <p className="text-[12px] text-muted-foreground/70 mb-3">Referral fees and sourcing costs — can be paid to external partners or other agents.</p>
                {acquisitions.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {acquisitions.map((a, i) => (
                      <div key={i} className="flex items-center justify-between px-3 py-2 rounded-md border border-border bg-accent/10">
                        <div>
                          <p className="text-[13px] font-medium">{a.displayName}</p>
                          <p className="text-[12px] text-muted-foreground">{currency} {a.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                        </div>
                        <button onClick={() => setAcquisitions((prev) => prev.filter((_, idx) => idx !== i))} className="p-1 hover:text-destructive text-muted-foreground transition-colors">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {showAcquisitionPicker ? (
                  <DeductionPicker label="Add acquisition cost" amountLabel="Fee amount" currency={currency} payouts={payouts}
                    onConfirm={(partyId, displayName, amount, parentPartyId) => { setAcquisitions((prev) => [...prev, { partyId, displayName, amount, parentPartyId }]); setShowAcquisitionPicker(false); }}
                    onCancel={() => setShowAcquisitionPicker(false)} />
                ) : (
                  <button onClick={() => setShowAcquisitionPicker(true)} className="flex items-center gap-1 text-[13px] text-primary hover:underline font-medium">
                    <Plus className="h-3.5 w-3.5" /> Add acquisition cost
                  </button>
                )}
              </div>

              {/* Operational Deductions */}
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-1">Operational Costs</p>
                <p className="text-[12px] text-muted-foreground/70 mb-3">Service costs paid by Huspy (notary, legal, etc.). For MBU direct channels, also signals external sourcing.</p>
                {operations.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {operations.map((o, i) => (
                      <div key={i} className="flex items-center justify-between px-3 py-2 rounded-md border border-border bg-accent/10">
                        <div>
                          <p className="text-[13px] font-medium">{o.displayName}</p>
                          <p className="text-[12px] text-muted-foreground">{currency} {o.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                        </div>
                        <button onClick={() => setOperations((prev) => prev.filter((_, idx) => idx !== i))} className="p-1 hover:text-destructive text-muted-foreground transition-colors">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {showOperationsPicker ? (
                  <DeductionPicker label="Add operational cost" amountLabel="Cost amount" currency={currency} payouts={payouts}
                    onConfirm={(partyId, displayName, amount, parentPartyId) => { setOperations((prev) => [...prev, { partyId, displayName, amount, parentPartyId }]); setShowOperationsPicker(false); }}
                    onCancel={() => setShowOperationsPicker(false)} />
                ) : (
                  <button onClick={() => setShowOperationsPicker(true)} className="flex items-center gap-1 text-[13px] text-primary hover:underline font-medium">
                    <Plus className="h-3.5 w-3.5" /> Add operational cost
                  </button>
                )}
              </div>

              {/* P&L Summary */}
              <div className="rounded-md border border-border/60 bg-muted/20 px-4 py-3 space-y-1">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">P&L Summary</p>
                <SummaryRow label="Gross Revenue" value={`${currency} ${grossRevenue.toLocaleString(undefined, { maximumFractionDigits: 2 })}`} />
                {acquisitions.length > 0 && (
                  <SummaryRow label="Acquisition Costs" value={`−${currency} ${acquisitions.reduce((s, a) => s + a.amount, 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`} dim />
                )}
                {operations.length > 0 && (
                  <SummaryRow label="Operational Costs" value={`−${currency} ${operations.reduce((s, o) => s + o.amount, 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`} dim />
                )}
                {payouts.length > 0 && (
                  <>
                    <div className="border-t border-border/40 my-1" />
                    {payouts.map((p) => {
                      const af = sharedAgentFinancials.find((f) => f.agentId === p.agentId);
                      const rateNote = af?.strategy.kind === "flat"
                        ? `${(af.strategy as { pct: number }).pct}% of pool`
                        : "rate resolved at calculation";
                      return (
                        <SummaryRow
                          key={p.partyId}
                          label={`${p.displayName} — ${p.splitPct}% split`}
                          value={rateNote}
                          dim
                        />
                      );
                    })}
                  </>
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
                else if (step === "payouts") setStep("parties");
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
                    Create (skip payouts)
                  </Button>
                  <Button onClick={() => setStep("payouts")} disabled={!canLeaveParties}>Next</Button>
                </>
              )}
              {step === "payouts" && (
                <Button onClick={handleCreate} disabled={!canLeavePayouts}>Create Deal</Button>
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
