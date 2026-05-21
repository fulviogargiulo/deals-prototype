import { useState, useRef, useEffect } from "react";
import { UserPlus, X, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  sharedDealStakeholders,
  sharedParties,
  sharedAgents,
} from "@huspy/shared-domain";
import type { DealStakeholder, Party, ProjectedPnL, StakeholderType } from "@huspy/shared-domain";

const ALL_TYPES: StakeholderType[] = [
  "AGENT_PAYOUT",
  "REVENUE_SOURCE",
  "ACQUISITION_DEDUCTION",
  "OPERATIONAL_DEDUCTION",
];

const TYPE_LABELS: Record<StakeholderType, string> = {
  AGENT_PAYOUT:        "Agent",
  REVENUE_SOURCE:         "Client",
  ACQUISITION_DEDUCTION:  "Referral / Acquisition",
  OPERATIONAL_DEDUCTION:  "Service Cost",
};

function roleLabel(type: StakeholderType): string {
  return TYPE_LABELS[type] ?? type;
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

function fmt(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}

interface Props {
  dealId: string;
  currency?: string;
  pnl?: ProjectedPnL | null;
  onChanged?: () => void;
  canEdit?: boolean;
}

export function StakeholdersPanel({ dealId, currency = "EUR", pnl, onChanged, canEdit = false }: Props) {
  const navigate = useNavigate();
  const [stakes, setStakes] = useState<DealStakeholder[]>(() =>
    sharedDealStakeholders.filter((s) => s.dealId === dealId)
  );
  const [isAdding, setIsAdding] = useState(false);
  const [role, setRole] = useState<StakeholderType>("REVENUE_SOURCE");

  // Phase 1: search
  const [search, setSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Phase 2: financial fields (after party selected)
  const [selectedParty, setSelectedParty] = useState<{ id: string; name: string } | null>(null);
  const [financialAmountStr, setFinancialAmountStr] = useState("");
  const [splitPctStr, setSplitPctStr] = useState("100");
  const [newPartyMode, setNewPartyMode] = useState(false);
  const [newParty, setNewParty] = useState({ displayName: "", legalType: "individual", taxId: "" });

  const isAgentRole = role === "AGENT_PAYOUT";
  const isPayerRole = role === "REVENUE_SOURCE";
  const isCostRole = role === "ACQUISITION_DEDUCTION" || role === "OPERATIONAL_DEDUCTION";

  // Reset form when role changes or add panel opens/closes
  useEffect(() => {
    setSearch("");
    setShowDropdown(false);
    setNewPartyMode(false);
    setFinancialAmountStr("");
    setSplitPctStr("100");
    setNewParty({ displayName: "", legalType: "individual", taxId: "" });
    setSelectedParty(null);
  }, [role, isAdding]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!showDropdown) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showDropdown]);

  const agentResults = isAgentRole && search.length >= 1
    ? sharedAgents.filter((a) =>
        (a.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
        a.id.toLowerCase().includes(search.toLowerCase())
      ).slice(0, 6)
    : [];

  const partyResults = !isAgentRole && search.length >= 2
    ? sharedParties.filter((p) => p.taxId?.toLowerCase().startsWith(search.toLowerCase())).slice(0, 6)
    : [];

  const hasResults = agentResults.length > 0 || partyResults.length > 0;
  const showNoMatch = !hasResults && search.length >= 2 && !isAgentRole;

  const handleSelectAgent = (agentId: string) => {
    const agent = sharedAgents.find((a) => a.id === agentId);
    if (!agent) return;
    const party = sharedParties.find((p) => p.id === agent.partyId);
    setSelectedParty({ id: agent.partyId, name: party?.displayName ?? agentId });
    setShowDropdown(false);
  };

  const handleSelectParty = (partyId: string) => {
    const party = sharedParties.find((p) => p.id === partyId);
    setSelectedParty({ id: partyId, name: party?.displayName ?? partyId });
    setShowDropdown(false);
  };

  const handleNoMatch = () => {
    setNewPartyMode(true);
    setNewParty((p) => ({ ...p, taxId: search }));
    setShowDropdown(false);
  };

  const handleCreateAndSelect = () => {
    if (!newParty.displayName || !newParty.taxId) return;
    const existing = sharedParties.find((p) => p.taxId === newParty.taxId);
    if (existing) {
      setSelectedParty({ id: existing.id, name: existing.displayName });
      setNewPartyMode(false);
      return;
    }
    const party: Party = {
      id: `party-ext-${Date.now()}`,
      displayName: newParty.displayName,
      legalType: newParty.legalType,
      taxId: newParty.taxId,
    };
    sharedParties.push(party);
    setSelectedParty({ id: party.id, name: party.displayName });
    setNewPartyMode(false);
  };

  const confirmAdd = () => {
    if (!selectedParty) return;
    const financialAmount = parseFloat(financialAmountStr) || undefined;
    const splitPercentage = isAgentRole ? (parseInt(splitPctStr) || 100) : undefined;

    const stake: DealStakeholder = {
      id: `ds-${dealId}-${role}-${Date.now()}`,
      dealId,
      partyId: selectedParty.id,
      role,
      isPrimary: isAgentRole && stakes.filter((s) => s.role === "AGENT_PAYOUT").length === 0,
      splitPercentage,
      financialAmount: isCostRole && financialAmount != null
        ? -Math.abs(financialAmount)  // entered positive, stored negative
        : isPayerRole ? financialAmount
        : undefined,
    };
    sharedDealStakeholders.push(stake);
    setStakes((prev) => [...prev, stake]);
    setIsAdding(false);
    onChanged?.();
  };

  const handleRemove = (stakeId: string) => {
    const idx = sharedDealStakeholders.findIndex((s) => s.id === stakeId);
    if (idx !== -1) sharedDealStakeholders.splice(idx, 1);
    setStakes((prev) => prev.filter((s) => s.id !== stakeId));
    onChanged?.();
  };

  return (
    <div className="space-y-0">
      {stakes.length === 0 && !isAdding && (
        <p className="text-[13px] text-muted-foreground italic pb-2">No stakeholders added yet.</p>
      )}

      {stakes.length > 0 && (
        <div className="flex items-center pb-1.5 border-b border-border/60 gap-3">
          <div className="w-[90px] shrink-0">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Role</p>
          </div>
          <div className="flex-1">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Party</p>
          </div>
          <div className="w-[100px] shrink-0 text-right">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Impact</p>
          </div>
          <span className="w-6 shrink-0" />
        </div>
      )}

      {stakes.map((s) => {
        const agentId = s.role === "AGENT_PAYOUT" ? agentIdForParty(s.partyId) : undefined;
        const identifier = resolvePartyIdentifier(s.partyId);
        const isPrimaryAgent = s.isPrimary && s.role === "AGENT_PAYOUT";

        // cut: positive = revenue to Huspy, negative = cost from Huspy
        const agentSplit = s.role === "AGENT_PAYOUT" ? pnl?.splits.find((sp) => sp.partyId === s.partyId) : undefined;
        let cut: number | undefined;
        if (agentSplit != null) {
          cut = -agentSplit.agentPayout;
        } else if (s.financialAmount != null) {
          cut = s.financialAmount;
        } else {
          // Derive from pnl ledger (engine may have inferred financialAmount for this party)
          const ledgerCredit = pnl?.ledger.find((e) => e.partyId === s.partyId && e.side === "CREDIT" && !e.id.includes("::net"));
          const ledgerDebit = pnl?.ledger.find((e) => e.partyId === s.partyId && e.side === "DEBIT");
          if (ledgerCredit) cut = ledgerCredit.amount;
          else if (ledgerDebit) cut = -ledgerDebit.amount;
        }

        return (
          <div key={s.id} className="flex items-center py-2.5 min-w-0 border-b border-border/40 last:border-0 gap-3">
            <div className="w-[90px] shrink-0">
              <p className="text-[12px] text-muted-foreground font-medium capitalize">
                {roleLabel(s.role)}{s.splitPercentage != null && s.splitPercentage < 100 ? ` ${s.splitPercentage}%` : ""}
              </p>
            </div>
            <div className="flex-1 min-w-0">
              {agentId ? (
                <button
                  onClick={() => navigate(`/agents/${agentId}`)}
                  className="flex items-center gap-1 text-[13px] font-medium text-primary hover:underline"
                >
                  {resolvePartyName(s.partyId)}
                  <ExternalLink className="h-3 w-3" />
                </button>
              ) : (
                <span className="text-[13px] font-medium">{resolvePartyName(s.partyId)}</span>
              )}
              {identifier && (
                <p className="text-[11px] font-mono text-muted-foreground/70 mt-0.5">{identifier}</p>
              )}
            </div>
            <div className="w-[100px] shrink-0 text-right">
              {cut != null ? (
                cut === 0 ? (
                  <span className="text-[12px] font-mono tabular-nums font-semibold text-muted-foreground/50">
                    {fmt(0, currency)}
                  </span>
                ) : (
                  <span className={`text-[12px] font-mono tabular-nums font-semibold ${cut > 0 ? "text-emerald-600" : "text-orange-500"}`}>
                    {cut > 0 ? "+" : "−"}{fmt(Math.abs(cut), currency)}
                  </span>
                )
              ) : (
                <span className="text-[12px] text-muted-foreground/40">—</span>
              )}
            </div>
            {canEdit && !isPrimaryAgent ? (
              <button
                onClick={() => handleRemove(s.id)}
                className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-destructive transition-colors shrink-0"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : (
              <span className="w-6 shrink-0" />
            )}
          </div>
        );
      })}

      {isAdding && (
        <div className="pt-3 border-t border-border/40 space-y-3">
          {/* Phase 1: Role + search (skipped for auto-party roles) */}
          {!selectedParty && (
            <div className="flex items-start gap-2">
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as StakeholderType)}
                className="px-2 py-1.5 border border-border rounded text-[13px] bg-background focus:outline-none focus:ring-1 focus:ring-ring shrink-0"
              >
                {ALL_TYPES.map((r) => <option key={r} value={r}>{roleLabel(r)}</option>)}
              </select>

              {!newPartyMode ? (
                <div className="relative flex-1" ref={dropdownRef}>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setShowDropdown(true); }}
                    placeholder={isAgentRole ? "Search by name or agent ID…" : "Enter Tax ID…"}
                    className="w-full px-2 py-1.5 border border-border rounded text-[13px] bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                    autoFocus
                  />
                  {showDropdown && (hasResults || showNoMatch) && (
                    <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-card border border-border rounded-md shadow-lg overflow-hidden">
                      {agentResults.map((a) => (
                        <button key={a.id} onMouseDown={() => handleSelectAgent(a.id)}
                          className="w-full text-left px-3 py-2 text-[13px] hover:bg-muted flex items-center justify-between gap-4">
                          <span>{a.name}</span>
                          <span className="text-[11px] text-muted-foreground shrink-0">{a.id}</span>
                        </button>
                      ))}
                      {partyResults.map((p) => (
                        <button key={p.id} onMouseDown={() => handleSelectParty(p.id)}
                          className="w-full text-left px-3 py-2 text-[13px] hover:bg-muted flex items-center justify-between gap-4">
                          <span>{p.displayName}</span>
                          <span className="text-[11px] text-muted-foreground shrink-0">{p.taxId}</span>
                        </button>
                      ))}
                      {showNoMatch && (
                        <button onMouseDown={handleNoMatch}
                          className="w-full text-left px-3 py-2 text-[13px] text-primary hover:bg-muted">
                          No match — create new party for "{search}"
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex items-center gap-2 flex-wrap">
                  <input
                    type="text"
                    value={newParty.displayName}
                    onChange={(e) => setNewParty((p) => ({ ...p, displayName: e.target.value }))}
                    placeholder="Full name / company"
                    className="flex-1 min-w-[140px] px-2 py-1.5 border border-border rounded text-[13px] bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                    autoFocus
                  />
                  <input
                    type="text"
                    value={newParty.taxId}
                    onChange={(e) => setNewParty((p) => ({ ...p, taxId: e.target.value }))}
                    placeholder="Tax ID"
                    className="w-32 px-2 py-1.5 border border-border rounded text-[13px] bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                  <select
                    value={newParty.legalType}
                    onChange={(e) => setNewParty((p) => ({ ...p, legalType: e.target.value }))}
                    className="px-2 py-1.5 border border-border rounded text-[13px] bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="individual">Individual</option>
                    <option value="company">Company</option>
                    <option value="financial_institution">Financial Institution</option>
                  </select>
                  <button
                    onClick={handleCreateAndSelect}
                    disabled={!newParty.displayName || !newParty.taxId}
                    className="px-3 py-1.5 bg-primary text-primary-foreground rounded text-[13px] font-medium disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              )}

              <button onClick={() => setIsAdding(false)} className="p-1 hover:bg-muted rounded text-muted-foreground shrink-0">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Phase 2: Financial fields after party is selected */}
          {selectedParty && (
            <div className="flex items-start gap-2">
              <div className="flex-1 bg-muted/40 rounded-md px-3 py-2 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[13px] font-medium text-foreground">{selectedParty.name}</p>
                    <p className="text-[11px] text-muted-foreground capitalize">{role}</p>
                  </div>
                  <button
                    onClick={() => setSelectedParty(null)}
                    className="text-[11px] text-muted-foreground hover:text-foreground underline"
                  >
                    Change
                  </button>
                </div>

                {isAgentRole && (
                  <div className="flex items-center gap-3">
                    <label className="text-[12px] text-muted-foreground w-[160px] shrink-0">Commission pool share (%)</label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={splitPctStr}
                      onChange={(e) => setSplitPctStr(e.target.value)}
                      className="w-24 px-2 py-1 border border-border rounded text-[13px] bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>
                )}

                {isPayerRole && (
                  <div className="flex items-center gap-3">
                    <label className="text-[12px] text-muted-foreground w-[160px] shrink-0">
                      Amount charged ({currency})
                      <span className="block text-[10px] text-muted-foreground/60">Gross revenue — optional</span>
                    </label>
                    <input
                      type="number"
                      min={0}
                      placeholder="e.g. 18 000"
                      value={financialAmountStr}
                      onChange={(e) => setFinancialAmountStr(e.target.value)}
                      className="w-36 px-2 py-1 border border-border rounded text-[13px] bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>
                )}

                {isCostRole && (
                  <div className="flex items-center gap-3">
                    <label className="text-[12px] text-muted-foreground w-[160px] shrink-0">
                      Fee Huspy pays ({currency})
                      <span className="block text-[10px] text-muted-foreground/60">
                        {role === "OPERATIONAL_DEDUCTION" ? "Fixed service cost (Bucket D)" : "Referral / acquisition cost (Bucket C)"}
                      </span>
                    </label>
                    <input
                      type="number"
                      min={0}
                      placeholder="e.g. 1 200"
                      value={financialAmountStr}
                      onChange={(e) => setFinancialAmountStr(e.target.value)}
                      className="w-36 px-2 py-1 border border-border rounded text-[13px] bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    onClick={confirmAdd}
                    className="px-4 py-1.5 bg-primary text-primary-foreground rounded text-[13px] font-semibold hover:opacity-90 transition-opacity"
                  >
                    Add
                  </button>
                </div>
              </div>

              <button onClick={() => setIsAdding(false)} className="p-1 hover:bg-muted rounded text-muted-foreground shrink-0 mt-1">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {!isAdding && canEdit && (
        <div className={stakes.length > 0 ? "pt-3 border-t border-border/40" : ""}>
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1.5 text-[13px] text-primary hover:underline font-medium"
          >
            <UserPlus className="h-3.5 w-3.5" />
            Add stakeholder
          </button>
        </div>
      )}
    </div>
  );
}
