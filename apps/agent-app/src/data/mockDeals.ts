import { sharedDeals, sharedDealStakeholders, sharedAgents } from "@huspy/shared-domain";
import type { DealStakeholder } from "@huspy/shared-domain";
import type { Deal } from "@/types";

// shared.Deal no longer has a .type field; derive it from market + businessUnit.
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

export const CURRENT_AGENT_ID = 'agent-001';

// Resolve the current agent's partyId, then find all deals where they are an agent stakeholder.
const currentAgent = sharedAgents.find((a) => a.id === CURRENT_AGENT_ID);
const agentDealIds = new Set(
  currentAgent
    ? sharedDealStakeholders
        .filter((s) => s.partyId === currentAgent.partyId && s.role === 'INTERNAL_PAYOUT')
        .map((s) => s.dealId)
    : []
);
export const agentDeals: Deal[] = mockDeals.filter((d) => agentDealIds.has(d.id));

// Maps dealId → the current agent's DealStakeholder record, for commission split lookups.
export const agentStakeMap: Map<string, DealStakeholder> = new Map(
  (currentAgent
    ? sharedDealStakeholders.filter((s) => s.partyId === currentAgent.partyId && s.role === "INTERNAL_PAYOUT")
    : []
  ).map((s) => [s.dealId, s])
);

