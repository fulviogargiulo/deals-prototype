import { useState, useRef, useEffect, Fragment } from "react";
import { X, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  sharedDealStakeholders,
  sharedParties,
  sharedAgents,
} from "@huspy/shared-domain";
import type { DealStakeholder, Party, ProjectedPnL } from "@huspy/shared-domain";
import type { Deal } from "@/data/types";

type AddSection = "revenue" | "service" | "partners" | "agents" | null;
type AgentCommissionMode = "split" | "fixed";

interface FormState {
  search: string;
  showDropdown: boolean;
  selectedParty: { id: string; name: string } | null;
  newPartyMode: boolean;
  newParty: { displayName: string; legalType: string; taxId: string };
  amountStr: string;
  splitPctStr: string;
  agentMode: AgentCommissionMode;
  chargedToAgentPartyId: string | undefined;
}

const FORM_RESET: FormState = {
  search: "",
  showDropdown: false,
  selectedParty: null,
  newPartyMode: false,
  newParty: { displayName: "", legalType: "individual", taxId: "" },
  amountStr: "",
  splitPctStr: "100",
  agentMode: "fixed",
  chargedToAgentPartyId: undefined,
};

interface Props {
  deal: Deal;
  currency: string;
  pnl: ProjectedPnL | null;
  canEdit: boolean;
  onChanged: () => void;
}

function fmt(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}

function resolvePartyName(partyId: string): string {
  return sharedParties.find((p) => p.id === partyId)?.displayName ?? partyId;
}

function resolvePartyIdentifier(partyId: string): string | undefined {
  const agent = sharedAgents.find((a) => a.partyId === partyId);
  if (agent) return agent.id;
  return sharedParties.find((p) => p.id === partyId)?.taxId;
}

function agentIdForParty(partyId: string): string | undefined {
  return sharedAgents.find((a) => a.partyId === partyId)?.id;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-widest mb-1 pl-1 mt-3">
      {children}
    </p>
  );
}

function Anchor({ label, amount, currency }: { label: string; amount: number; currency: string }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-[13px] font-semibold text-foreground">{label}</span>
      <span className="text-[14px] font-bold text-foreground tabular-nums">{fmt(amount, currency)}</span>
    </div>
  );
}

function WaterfallRow({
  name,
  identifier,
  amount,
  currency,
  isCredit = false,
  indent = false,
  badge,
  onRemove,
  onClick,
}: {
  name: string;
  identifier?: string;
  amount?: number;
  currency: string;
  isCredit?: boolean;
  indent?: boolean;
  badge?: string;
  onRemove?: () => void;
  onClick?: () => void;
}) {
  return (
    <div className={`flex items-center py-1.5 gap-2 ${indent ? "pl-4" : "pl-3"}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          {onClick ? (
            <button onClick={onClick} className="text-[13px] text-primary hover:underline">
              {name}
            </button>
          ) : (
            <span className="text-[13px] text-muted-foreground">{name}</span>
          )}
          {badge && (
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-primary/10 text-primary">
              {badge}
            </span>
          )}
          {identifier && (
            <code className="text-[11px] font-mono text-foreground/50">{identifier}</code>
          )}
        </div>
      </div>
      <span className={`text-[13px] font-semibold tabular-nums shrink-0 ${amount == null ? "text-muted-foreground/30" : isCredit ? "text-emerald-600" : "text-orange-500"}`}>
        {amount == null ? "—" : `${isCredit ? "+" : "−"}${fmt(Math.abs(amount), currency)}`}
      </span>
      {onRemove ? (
        <button onClick={onRemove} className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-destructive transition-colors shrink-0">
          <X className="h-3.5 w-3.5" />
        </button>
      ) : (
        <span className="w-6 shrink-0" />
      )}
    </div>
  );
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 text-[12px] text-primary hover:underline font-medium pl-3 mt-1"
    >
      <Plus className="h-3 w-3" />
      {label}
    </button>
  );
}

// ─── Party search form (Revenue / Acquisition Costs / Operating Costs) ────────

function PartyAddForm({
  sectionLabel,
  amountLabel,
  amountHint,
  requireAmount,
  currency,
  agents,
  onConfirm,
  onCancel,
}: {
  sectionLabel: string;
  amountLabel: string;
  amountHint?: string;
  requireAmount: boolean;
  currency: string;
  agents?: Array<{ partyId: string; name: string }>;
  onConfirm: (partyId: string, amount: number | undefined, chargedToAgentPartyId?: string) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<FormState>(FORM_RESET);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!form.showDropdown) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setForm((f) => ({ ...f, showDropdown: false }));
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [form.showDropdown]);

  const partyResults = form.search.length >= 2
    ? sharedParties.filter((p) => p.taxId?.toLowerCase().startsWith(form.search.toLowerCase())).slice(0, 6)
    : [];
  const showNoMatch = partyResults.length === 0 && form.search.length >= 2 && !form.newPartyMode;

  const handleSelectParty = (partyId: string) => {
    const party = sharedParties.find((p) => p.id === partyId);
    setForm((f) => ({ ...f, selectedParty: { id: partyId, name: party?.displayName ?? partyId }, showDropdown: false }));
  };

  const handleCreateAndSelect = () => {
    if (!form.newParty.displayName || !form.newParty.taxId) return;
    const existing = sharedParties.find((p) => p.taxId === form.newParty.taxId);
    if (existing) {
      setForm((f) => ({ ...f, selectedParty: { id: existing.id, name: existing.displayName }, newPartyMode: false }));
      return;
    }
    const party: Party = { id: `party-ext-${Date.now()}`, displayName: form.newParty.displayName, legalType: form.newParty.legalType, taxId: form.newParty.taxId };
    sharedParties.push(party);
    setForm((f) => ({ ...f, selectedParty: { id: party.id, name: party.displayName }, newPartyMode: false }));
  };

  const canConfirm = form.selectedParty != null && (!requireAmount || (form.amountStr !== "" && parseFloat(form.amountStr) > 0));

  return (
    <div className="mt-2 bg-muted/30 border border-border/60 rounded-md px-3 py-3 space-y-2.5">
      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{sectionLabel}</p>

      {!form.selectedParty ? (
        <>
          {!form.newPartyMode ? (
            <div className="relative" ref={dropdownRef}>
              <input
                type="text"
                autoFocus
                value={form.search}
                onChange={(e) => setForm((f) => ({ ...f, search: e.target.value, showDropdown: true }))}
                placeholder="Enter Tax ID…"
                className="w-full px-2 py-1.5 border border-border rounded text-[13px] bg-background focus:outline-none focus:ring-1 focus:ring-ring"
              />
              {form.showDropdown && (partyResults.length > 0 || showNoMatch) && (
                <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-card border border-border rounded-md shadow-lg overflow-hidden">
                  {partyResults.map((p) => (
                    <button key={p.id} onMouseDown={() => handleSelectParty(p.id)} className="w-full text-left px-3 py-2 text-[13px] hover:bg-muted flex items-center justify-between gap-4">
                      <span>{p.displayName}</span>
                      <span className="text-[11px] text-muted-foreground shrink-0">{p.taxId}</span>
                    </button>
                  ))}
                  {showNoMatch && (
                    <button onMouseDown={() => setForm((f) => ({ ...f, newPartyMode: true, newParty: { ...f.newParty, taxId: f.search }, showDropdown: false }))} className="w-full text-left px-3 py-2 text-[13px] text-primary hover:bg-muted">
                      No match — create new party for "{form.search}"
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <input autoFocus type="text" value={form.newParty.displayName} onChange={(e) => setForm((f) => ({ ...f, newParty: { ...f.newParty, displayName: e.target.value } }))} placeholder="Full name / company" className="flex-1 min-w-[140px] px-2 py-1.5 border border-border rounded text-[13px] bg-background focus:outline-none focus:ring-1 focus:ring-ring" />
              <input type="text" value={form.newParty.taxId} onChange={(e) => setForm((f) => ({ ...f, newParty: { ...f.newParty, taxId: e.target.value } }))} placeholder="Tax ID" className="w-28 px-2 py-1.5 border border-border rounded text-[13px] bg-background focus:outline-none focus:ring-1 focus:ring-ring" />
              <select value={form.newParty.legalType} onChange={(e) => setForm((f) => ({ ...f, newParty: { ...f.newParty, legalType: e.target.value } }))} className="px-2 py-1.5 border border-border rounded text-[13px] bg-background focus:outline-none focus:ring-1 focus:ring-ring">
                <option value="individual">Individual</option>
                <option value="company">Company</option>
                <option value="financial_institution">Financial Institution</option>
              </select>
              <button onClick={handleCreateAndSelect} disabled={!form.newParty.displayName || !form.newParty.taxId} className="px-3 py-1.5 bg-primary text-primary-foreground rounded text-[13px] font-medium disabled:opacity-40">Next</button>
            </div>
          )}
        </>
      ) : (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-medium">{form.selectedParty.name}</p>
            <button onClick={() => setForm((f) => ({ ...f, selectedParty: null }))} className="text-[11px] text-muted-foreground hover:text-foreground underline">Change</button>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-[12px] text-muted-foreground w-[160px] shrink-0">
              {amountLabel} ({currency})
              {amountHint && <span className="block text-[10px] text-muted-foreground/60">{amountHint}</span>}
            </label>
            <input
              autoFocus
              type="number"
              min={0}
              placeholder="e.g. 1 500"
              value={form.amountStr}
              onChange={(e) => setForm((f) => ({ ...f, amountStr: e.target.value }))}
              className="w-36 px-2 py-1 border border-border rounded text-[13px] bg-background focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          {agents && agents.length > 0 && (
            <div className="flex items-center gap-3">
              <label className="text-[12px] text-muted-foreground w-[160px] shrink-0">Charge to</label>
              <select
                value={form.chargedToAgentPartyId ?? "__huspy__"}
                onChange={(e) => setForm((f) => ({ ...f, chargedToAgentPartyId: e.target.value === "__huspy__" ? undefined : e.target.value }))}
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
          onClick={() => form.selectedParty && onConfirm(form.selectedParty.id, form.amountStr !== "" ? parseFloat(form.amountStr) : undefined, form.chargedToAgentPartyId)}
          disabled={!canConfirm}
          className="px-4 py-1.5 bg-primary text-primary-foreground rounded text-[13px] font-semibold hover:opacity-90 disabled:opacity-40"
        >
          Add
        </button>
      </div>
    </div>
  );
}

// ─── Agent add form ───────────────────────────────────────────────────────────

function AgentAddForm({
  currency,
  currentPoolTotal,
  onConfirm,
  onCancel,
}: {
  currency: string;
  currentPoolTotal: number;
  onConfirm: (partyId: string, mode: AgentCommissionMode, value: number) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<FormState>({ ...FORM_RESET, agentMode: "fixed" });
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!form.showDropdown) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setForm((f) => ({ ...f, showDropdown: false }));
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [form.showDropdown]);

  const agentResults = form.search.length >= 1
    ? sharedAgents.filter((a) => (a.name ?? "").toLowerCase().includes(form.search.toLowerCase()) || a.id.toLowerCase().includes(form.search.toLowerCase())).slice(0, 6)
    : [];

  const handleSelectAgent = (agentId: string) => {
    const agent = sharedAgents.find((a) => a.id === agentId);
    if (!agent) return;
    const party = sharedParties.find((p) => p.id === agent.partyId);
    setForm((f) => ({ ...f, selectedParty: { id: agent.partyId, name: party?.displayName ?? agentId }, showDropdown: false }));
  };

  const value = parseFloat(form.agentMode === "split" ? form.splitPctStr : form.amountStr) || 0;
  const remainingPool = 100 - currentPoolTotal;
  const canConfirm = form.selectedParty != null && value > 0 && (form.agentMode === "fixed" || value <= remainingPool);

  return (
    <div className="mt-2 bg-muted/30 border border-border/60 rounded-md px-3 py-3 space-y-2.5">
      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Add Agent</p>

      {!form.selectedParty ? (
        <div className="relative" ref={dropdownRef}>
          <input
            type="text"
            autoFocus
            value={form.search}
            onChange={(e) => setForm((f) => ({ ...f, search: e.target.value, showDropdown: true }))}
            placeholder="Search by name or agent ID…"
            className="w-full px-2 py-1.5 border border-border rounded text-[13px] bg-background focus:outline-none focus:ring-1 focus:ring-ring"
          />
          {form.showDropdown && agentResults.length > 0 && (
            <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-card border border-border rounded-md shadow-lg overflow-hidden">
              {agentResults.map((a) => (
                <button key={a.id} onMouseDown={() => handleSelectAgent(a.id)} className="w-full text-left px-3 py-2 text-[13px] hover:bg-muted flex items-center justify-between gap-4">
                  <span>{a.name}</span>
                  <span className="text-[11px] text-muted-foreground shrink-0">{a.id}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-medium">{form.selectedParty.name}</p>
            <button onClick={() => setForm((f) => ({ ...f, selectedParty: null, search: "" }))} className="text-[11px] text-muted-foreground hover:text-foreground underline">Change</button>
          </div>

          {/* Commission type toggle */}
          <div className="flex items-center gap-1 bg-muted rounded-md p-0.5 w-fit">
            <button
              onClick={() => setForm((f) => ({ ...f, agentMode: "split" }))}
              className={`px-3 py-1 rounded text-[12px] font-medium transition-colors ${form.agentMode === "split" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              Share of pool
            </button>
            <button
              onClick={() => setForm((f) => ({ ...f, agentMode: "fixed" }))}
              className={`px-3 py-1 rounded text-[12px] font-medium transition-colors ${form.agentMode === "fixed" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              Fixed amount
            </button>
          </div>

          {form.agentMode === "split" ? (
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <label className="text-[12px] text-muted-foreground w-[140px] shrink-0">
                  Pool share (%)
                  <span className="block text-[10px] text-muted-foreground/60">{remainingPool}% remaining</span>
                </label>
                <input
                  autoFocus
                  type="number"
                  min={1}
                  max={remainingPool}
                  value={form.splitPctStr}
                  onChange={(e) => setForm((f) => ({ ...f, splitPctStr: e.target.value }))}
                  className="w-24 px-2 py-1 border border-border rounded text-[13px] bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              {parseFloat(form.splitPctStr) > remainingPool && (
                <p className="text-[11px] text-destructive pl-[148px]">Exceeds remaining pool ({remainingPool}%)</p>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <label className="text-[12px] text-muted-foreground w-[140px] shrink-0">
                Fixed commission ({currency})
                <span className="block text-[10px] text-muted-foreground/60">Paid regardless of deal P&L</span>
              </label>
              <input
                autoFocus
                type="number"
                min={0}
                placeholder="e.g. 2 500"
                value={form.amountStr}
                onChange={(e) => setForm((f) => ({ ...f, amountStr: e.target.value }))}
                className="w-36 px-2 py-1 border border-border rounded text-[13px] bg-background focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-end gap-2">
        <button onClick={onCancel} className="px-3 py-1.5 text-[13px] text-muted-foreground hover:text-foreground">Cancel</button>
        <button
          onClick={() => form.selectedParty && onConfirm(form.selectedParty.id, form.agentMode, value)}
          disabled={!canConfirm}
          className="px-4 py-1.5 bg-primary text-primary-foreground rounded text-[13px] font-semibold hover:opacity-90 disabled:opacity-40"
        >
          Add to deal
        </button>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function PnLWaterfall({ deal, currency, pnl, canEdit, onChanged }: Props) {
  const navigate = useNavigate();
  const isMBU = deal.businessUnit === "mortgage";

  const [stakes, setStakes] = useState<DealStakeholder[]>(() =>
    sharedDealStakeholders.filter((s) => s.dealId === deal.id)
  );
  const [adding, setAdding] = useState<AddSection>(null);

  const agentStakes = stakes.filter((s) => s.role === "AGENT_PAYOUT");
  const revStakes = stakes.filter((s) => s.role === "REVENUE_SOURCE");
  const serviceStakes = stakes.filter((s) => s.role === "OPERATIONAL_DEDUCTION" && !s.parentStakeholderId);
  const partnerStakes = stakes.filter((s) => s.role === "ACQUISITION_DEDUCTION" && !s.parentStakeholderId);
  const agentSourcedStakes = stakes.filter(
    (s) => (s.role === "ACQUISITION_DEDUCTION" || s.role === "OPERATIONAL_DEDUCTION") && !!s.parentStakeholderId,
  );

  const dealAgents = agentStakes.map((s) => ({ partyId: s.partyId, name: resolvePartyName(s.partyId) }));

  const poolAgents = agentStakes.filter((s) => s.financialAmount == null);
  const splitPoolTotal = poolAgents.reduce((sum, s) => sum + (s.splitPercentage ?? 0), 0);

  const stopAdding = () => setAdding(null);

  const removeStake = (stakeId: string) => {
    const idx = sharedDealStakeholders.findIndex((s) => s.id === stakeId);
    if (idx !== -1) sharedDealStakeholders.splice(idx, 1);
    setStakes((prev) => prev.filter((s) => s.id !== stakeId));
    onChanged();
  };

  const addStake = (stake: DealStakeholder) => {
    sharedDealStakeholders.push(stake);
    setStakes((prev) => [...prev, stake]);
    setAdding(null);
    onChanged();
  };

  const handleAddRevenue = (partyId: string, amount: number | undefined) => {
    addStake({ id: `ds-${deal.id}-rev-${Date.now()}`, dealId: deal.id, partyId, role: "REVENUE_SOURCE", financialAmount: amount });
  };

  const handleAddService = (partyId: string, amount: number | undefined, chargedToAgentPartyId?: string) => {
    const parentStakeholderId = chargedToAgentPartyId
      ? agentStakes.find((s) => s.partyId === chargedToAgentPartyId)?.id
      : undefined;
    addStake({ id: `ds-${deal.id}-svc-${Date.now()}`, dealId: deal.id, partyId, role: "OPERATIONAL_DEDUCTION", financialAmount: amount != null ? -Math.abs(amount) : undefined, parentStakeholderId });
  };

  const handleAddPartner = (partyId: string, amount: number | undefined, chargedToAgentPartyId?: string) => {
    const parentStakeholderId = chargedToAgentPartyId
      ? agentStakes.find((s) => s.partyId === chargedToAgentPartyId)?.id
      : undefined;
    addStake({ id: `ds-${deal.id}-ptn-${Date.now()}`, dealId: deal.id, partyId, role: "ACQUISITION_DEDUCTION", financialAmount: amount != null ? -Math.abs(amount) : undefined, parentStakeholderId });
  };

  const handleAddAgent = (partyId: string, mode: AgentCommissionMode, value: number) => {
    const isFirst = agentStakes.length === 0;
    addStake({
      id: `ds-${deal.id}-agt-${Date.now()}`,
      dealId: deal.id,
      partyId,
      role: "AGENT_PAYOUT",
      isPrimary: isFirst,
      splitPercentage: mode === "split" ? value : undefined,
      financialAmount: mode === "fixed" ? value : undefined,
    });
  };

  // Get display amount for a stakeholder from the pnl ledger
  const getLedgerAmount = (partyId: string, bucket: "acquisition-cost" | "operational-cost"): number | undefined => {
    const entry = pnl?.ledger.find((e) => e.partyId === partyId && e.bucket === bucket);
    return entry?.amount;
  };

  const getAgentTotalPayout = (partyId: string): number | undefined => {
    const split = pnl?.splits.find((s) => s.partyId === partyId);
    if (!split) return undefined;
    return split.agentPayout + split.connectedAgentPayouts.reduce((s, p) => s + p.amount, 0);
  };

  if (isMBU && !pnl) {
    return <p className="text-[13px] text-muted-foreground italic">P&L waterfall not available for mortgage deals.</p>;
  }

  return (
    <div className="max-w-lg">

      {/* Deal context */}
      {(deal.dealPrice ?? deal.dealAmount) > 0 && (
        <div className="mb-3 border-b border-border/40 pb-2">
          <div className="flex items-center justify-between py-1">
            <span className="text-[12px] text-muted-foreground">
              Deal Amount
              {deal.commissionPercentage ? <span className="ml-1 text-muted-foreground/60">× {deal.commissionPercentage}%</span> : null}
            </span>
            <span className="text-[12px] text-muted-foreground tabular-nums font-mono">
              {fmt(deal.dealPrice ?? deal.dealAmount, currency)}
            </span>
          </div>
          {(deal.rebateAmount ?? 0) > 0 && (
            <div className="flex items-center justify-between py-0.5 pl-3">
              <span className="text-[11px] text-muted-foreground/60">Client rebate{deal.rebatePercentage ? ` (${deal.rebatePercentage}%)` : ""}</span>
              <span className="text-[11px] text-muted-foreground/60 tabular-nums font-mono">−{fmt(deal.rebateAmount!, currency)}</span>
            </div>
          )}
          {(deal.subsidyAmount ?? 0) > 0 && (
            <div className="flex items-center justify-between py-0.5 pl-3">
              <span className="text-[11px] text-muted-foreground/60">Client subsidy</span>
              <span className="text-[11px] text-muted-foreground/60 tabular-nums font-mono">−{fmt(deal.subsidyAmount!, currency)}</span>
            </div>
          )}
        </div>
      )}

      {/* ── Revenue ─────────────────────────────────────────────────────────── */}
      {(revStakes.length > 0 || canEdit) && (
        <>
          {revStakes.length > 0 && <SectionLabel>Revenue</SectionLabel>}
          {revStakes.map((s) => {
            const entry = pnl?.ledger.find((e) => e.partyId === s.partyId && e.side === "CREDIT" && !e.id.includes("::net"));
            const hasMultipleForParty = revStakes.filter((r) => r.partyId === s.partyId).length > 1;
            const label = hasMultipleForParty && s.description
              ? `${resolvePartyName(s.partyId)} — ${s.description}`
              : resolvePartyName(s.partyId);
            const isRebate = (s.financialAmount ?? 0) < 0;
            return (
              <WaterfallRow
                key={s.id}
                name={label}
                identifier={hasMultipleForParty ? undefined : resolvePartyIdentifier(s.partyId)}
                amount={s.financialAmount != null ? Math.abs(s.financialAmount) : entry?.amount}
                currency={currency}
                isCredit={!isRebate}
                indent
                badge={isRebate ? "Rebate" : undefined}
                onRemove={canEdit ? () => removeStake(s.id) : undefined}
              />
            );
          })}
          {canEdit && adding === "revenue" && (
            <PartyAddForm
              sectionLabel="Add revenue source"
              amountLabel="Amount charged"
              amountHint="Gross revenue — optional"
              requireAmount={false}
              currency={currency}
              onConfirm={handleAddRevenue}
              onCancel={stopAdding}
            />
          )}
          {canEdit && adding !== "revenue" && (
            <AddButton label="Add payer" onClick={() => setAdding("revenue")} />
          )}
        </>
      )}

      {/* ── Gross Revenue ────────────────────────────────────────────────────── */}
      {pnl && <Anchor label="Gross Revenue" amount={pnl.grossRevenue} currency={currency} />}

      {/* ── Acquisition Costs (C) — reduce agent commission pool ───────────── */}
      {(partnerStakes.length > 0 || canEdit) && (
        <div className="mt-1">
          <SectionLabel>Acquisition Costs</SectionLabel>
          {partnerStakes.map((s) => (
            <WaterfallRow
              key={s.id}
              name={resolvePartyName(s.partyId)}
              identifier={resolvePartyIdentifier(s.partyId)}
              amount={getLedgerAmount(s.partyId, "acquisition-cost")}
              currency={currency}
              onRemove={canEdit ? () => removeStake(s.id) : undefined}
            />
          ))}
          {canEdit && adding === "partners" && (
            <PartyAddForm
              sectionLabel="Add external partner"
              amountLabel="Fee amount"
              amountHint="Co-broker, external referral…"
              requireAmount
              currency={currency}
              agents={dealAgents}
              onConfirm={handleAddPartner}
              onCancel={stopAdding}
            />
          )}
          {canEdit && adding !== "partners" && (
            <AddButton label="Add external partner" onClick={() => setAdding("partners")} />
          )}
        </div>
      )}

      {/* ── Commission Base ──────────────────────────────────────────────────── */}
      {pnl && (
        <>
          <div className="border-t border-border mt-3 pt-2" />
          <Anchor label="Net Revenue" amount={pnl.commissionBase} currency={currency} />
        </>
      )}

      {/* ── Agent Commissions ────────────────────────────────────────────────── */}
      {(agentStakes.length > 0 || canEdit) && (
        <div className="mt-1">
          <SectionLabel>Agent Commissions</SectionLabel>
          {agentStakes.map((s) => {
            const agentId = agentIdForParty(s.partyId);
            const split = pnl?.splits.find((sp) => sp.partyId === s.partyId);
            const agentRecord = agentId ? sharedAgents.find((a) => a.id === agentId) : undefined;
            const isFixed = s.financialAmount != null;
            const splitLabel = !isFixed && s.splitPercentage != null ? `${s.splitPercentage}% pool` : isFixed ? "fixed" : undefined;
            const agentOwnPayout = split ? split.agentPayout : (s.financialAmount != null ? Math.abs(s.financialAmount) : undefined);
            return (
              <Fragment key={s.id}>
                <WaterfallRow
                  name={resolvePartyName(s.partyId)}
                  identifier={agentId}
                  amount={agentOwnPayout}
                  currency={currency}
                  badge={s.isPrimary ? "Primary" : splitLabel}
                  onClick={agentId ? () => navigate(`/agents/${agentId}`) : undefined}
                  onRemove={canEdit && !s.isPrimary ? () => removeStake(s.id) : undefined}
                />
                {split && split.connectedAgentPayouts.map((cp) =>
                  cp.amount > 0 ? (
                    <WaterfallRow
                      key={cp.agentId}
                      name={cp.label}
                      amount={cp.amount}
                      currency={currency}
                      badge={cp.label.slice(0, 3)}
                      indent
                    />
                  ) : null
                )}
                {agentSourcedStakes
                  .filter((d) => d.parentStakeholderId === s.id)
                  .map((d) => (
                    <WaterfallRow
                      key={d.id}
                      name={resolvePartyName(d.partyId)}
                      identifier={resolvePartyIdentifier(d.partyId)}
                      amount={Math.abs(d.financialAmount ?? 0)}
                      currency={currency}
                      badge="Agent cost"
                      indent
                      onRemove={canEdit ? () => removeStake(d.id) : undefined}
                    />
                  ))}
              </Fragment>
            );
          })}

          {/* Pool allocation indicator */}
          {poolAgents.length > 0 && (
            <div className={`pl-3 mt-1 text-[11px] ${splitPoolTotal < 100 ? "text-amber-600" : "text-muted-foreground/50"}`}>
              Pool allocated: {splitPoolTotal}%
              {splitPoolTotal < 100 && <span className="ml-1">— {100 - splitPoolTotal}% unallocated</span>}
            </div>
          )}

          {canEdit && adding === "agents" && (
            <AgentAddForm
              currency={currency}
              currentPoolTotal={splitPoolTotal}
              onConfirm={handleAddAgent}
              onCancel={stopAdding}
            />
          )}
          {canEdit && adding !== "agents" && (
            <AddButton label="Add agent" onClick={() => setAdding("agents")} />
          )}
        </div>
      )}

      {/* ── Operating Costs (D) — Huspy-only cost, does not reduce agent pool ── */}
      {(serviceStakes.length > 0 || canEdit) && (
        <div className="mt-1">
          <SectionLabel>Operating Costs</SectionLabel>
          {serviceStakes.map((s) => (
            <WaterfallRow
              key={s.id}
              name={resolvePartyName(s.partyId)}
              identifier={resolvePartyIdentifier(s.partyId)}
              amount={getLedgerAmount(s.partyId, "operational-cost")}
              currency={currency}
              onRemove={canEdit ? () => removeStake(s.id) : undefined}
            />
          ))}
          {canEdit && adding === "service" && (
            <PartyAddForm
              sectionLabel="Add service cost"
              amountLabel="Fee amount"
              amountHint="Huspy-borne costs (legal, admin)…"
              requireAmount
              currency={currency}
              agents={dealAgents}
              onConfirm={handleAddService}
              onCancel={stopAdding}
            />
          )}
          {canEdit && adding !== "service" && (
            <AddButton label="Add service cost" onClick={() => setAdding("service")} />
          )}
        </div>
      )}

      {/* ── Huspy Margin ─────────────────────────────────────────────────────── */}
      {pnl && (
        <>
          <div className="border-t border-border mt-3 pt-2" />
          <div className="flex items-center justify-between py-2">
            <span className="text-[13px] font-semibold text-foreground">Huspy Margin</span>
            <div className="flex items-center gap-2">
              {pnl.grossRevenue > 0 && (
                <span className="text-[11px] text-muted-foreground tabular-nums">
                  ({((pnl.huspyMargin / pnl.grossRevenue) * 100).toFixed(1)}%)
                </span>
              )}
              <span className="text-[14px] font-bold text-emerald-600 tabular-nums">{fmt(pnl.huspyMargin, currency)}</span>
            </div>
          </div>
        </>
      )}

      {!pnl && (
        <p className="text-[12px] text-muted-foreground/60 italic mt-3">
          Add a primary agent with a commission strategy to see P&L projections.
        </p>
      )}
    </div>
  );
}
