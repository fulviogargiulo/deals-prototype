import { sharedDeals, sharedDealStakeholders, sharedAgents } from "@huspy/shared-domain";
import type { DealStakeholder } from "@huspy/shared-domain";
import type { Deal } from "@/types";

function deriveType(d: { market?: string; businessUnit?: string }): Deal["type"] {
  if (d.businessUnit === "mortgage") return "mortgage";
  if (d.market === "leasing") return "lease";
  if (d.market === "secondary") return "sell";
  return "buy";
}

export const mockDeals: Deal[] = (sharedDeals as unknown as Deal[]).map(d => ({
  ...d,
  type: deriveType(d),
}));

export function getAgentDeals(agentId: string): Deal[] {
  const agent = sharedAgents.find(a => a.id === agentId);
  if (!agent) return [];
  const dealIds = new Set(
    sharedDealStakeholders
      .filter(s => s.partyId === agent.partyId && s.role === 'INTERNAL_PAYOUT')
      .map(s => s.dealId)
  );
  return mockDeals.filter(d => dealIds.has(d.id));
}

export function getAgentStakeMap(agentId: string): Map<string, DealStakeholder> {
  const agent = sharedAgents.find(a => a.id === agentId);
  if (!agent) return new Map();
  return new Map(
    sharedDealStakeholders
      .filter(s => s.partyId === agent.partyId && s.role === 'INTERNAL_PAYOUT')
      .map(s => [s.dealId, s])
  );
}
