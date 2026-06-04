import { sharedDeals, sharedTranches, sharedPnlEntries, sharedAgents, sharedOffers, sharedClients } from "@huspy/shared-domain";
import type { PnlEntry, Tranche } from "@huspy/shared-domain";
import type { Deal } from "@/types";

// ── Agent-facing deal status ──────────────────────────────────────────────────
// 3-state model derived from all of a deal's tranches.
export type AgentDealStatus = "action-required" | "in-progress" | "closed";

export function getAgentDealStatus(tranches: Tranche[]): AgentDealStatus {
  if (tranches.some(t => t.status === "pending-agent-approval" || t.status === "pending-details"))
    return "action-required";
  if (tranches.some(t => t.status === "under-review" || t.status === "invoicing"))
    return "in-progress";
  return "closed";
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function trancheGrossRevenue(trancheId: string): number {
  return sharedPnlEntries
    .filter(s => s.trancheId === trancheId && s.role === "REVENUE_SOURCE" && (s.amount ?? 0) > 0)
    .reduce((sum, s) => sum + Math.abs(s.amount ?? 0), 0);
}

function deriveType(d: { market?: string; businessUnit?: string }): Deal["type"] {
  if (d.businessUnit === "mortgage") return "mortgage";
  if (d.market === "leasing") return "lease";
  if (d.market === "secondary") return "sell";
  return "buy";
}

// ── Mock deals ────────────────────────────────────────────────────────────────

export const mockDeals: Deal[] = (sharedDeals as unknown as Deal[]).map(d => {
  const tranches = sharedTranches.filter(t => t.dealId === d.id).sort((a, b) => a.index - b.index);
  const primaryTranche = tranches[0];
  const offer = sharedOffers.find(o => o.id === d.offerId);
  const client = offer ? sharedClients.find(c => c.id === offer.clientId) : undefined;
  return {
    ...d,
    type: deriveType(d),
    clientName: client?.fullName ?? '',
    agentDealStatus: getAgentDealStatus(tranches),
    // Keep legacy status for backward compat with components that still read it
    status: primaryTranche?.status as any,
    grossRevenue: primaryTranche ? trancheGrossRevenue(primaryTranche.id) || undefined : undefined,
    reportDate: primaryTranche?.reportDate,
    trancheCount: tranches.length,
  };
});

// ── Query helpers ─────────────────────────────────────────────────────────────

// Returns deals where the agent has an AGENT_PAYOUT stake in at least one tranche.
export function getAgentDeals(agentId: string): Deal[] {
  const agent = sharedAgents.find(a => a.id === agentId);
  if (!agent) return [];
  const trancheIds = new Set(
    sharedPnlEntries
      .filter(s => s.partyId === agent.partyId && s.role === 'AGENT_PAYOUT' && s.isPrimary)
      .map(s => s.trancheId)
  );
  const dealIds = new Set(
    sharedTranches.filter(t => trancheIds.has(t.id)).map(t => t.dealId)
  );
  return mockDeals.filter(d => dealIds.has(d.id)).map(d => {
    const offer = sharedOffers.find(o => o.id === d.offerId);
    let type = d.type;
    if (d.businessUnit === 'mortgage') type = 'mortgage';
    else if (d.market === 'leasing') type = 'lease';
    else if (offer?.sellerAgentId === agentId) type = 'sell';
    else if (offer?.buyerAgentId === agentId) type = 'buy';
    return { ...d, type };
  });
}

// Returns a map of trancheId → PnlEntry for the agent's primary stakes.
export function getAgentStakeMap(agentId: string): Map<string, PnlEntry> {
  const agent = sharedAgents.find(a => a.id === agentId);
  if (!agent) return new Map();
  return new Map(
    sharedPnlEntries
      .filter(s => s.partyId === agent.partyId && s.role === 'AGENT_PAYOUT' && s.isPrimary)
      .map(s => [s.trancheId, s])
  );
}

// Returns tranches for a given deal (ordered by index).
export function getTranchesForDeal(dealId: string): Tranche[] {
  return sharedTranches.filter(t => t.dealId === dealId).sort((a, b) => a.index - b.index);
}
