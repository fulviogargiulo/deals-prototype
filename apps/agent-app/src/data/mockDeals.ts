// Deals come from shared canonical fixtures (visible in both apps).
// `mockStatement` is agent-app-only (StatementOfAccount is a financial UI
// concept karvel doesn't share), so it lives here.
import { sharedDeals, sharedDealStakeholders, sharedAgents, sharedOpportunities } from "@huspy/shared-domain";
import type { DealStakeholder } from "@huspy/shared-domain";
import type { Deal, StatementOfAccount } from "@/types";

// shared.Deal no longer has a .type field (DealType was removed); derive it
// from the linked Opportunity so agent-app UI icons/labels still work.
const oppTypeMap = new Map(sharedOpportunities.map(o => [o.id, o.type]));

export const mockDeals: Deal[] = (sharedDeals as unknown as Deal[]).map(d => ({
  ...d,
  type: (oppTypeMap.get(d.opportunityId as string) ?? 'buy') as Deal['type'],
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

export const mockStatement: StatementOfAccount = {
  id: "stmt-1",
  cycleLabel: "February 2026",
  lineItems: [
    {
      id: "li-1",
      description: "Commission — Penthouse in Salamanca",
      type: "credit",
      category: "deal-commission",
      amount: 18000,
      dealId: "deal-002",
    },
    {
      id: "li-2",
      description: "Referral commission — Lead from Agent B",
      type: "credit",
      category: "referral-commission",
      amount: 2500,
    },
    {
      id: "li-3",
      description: "Platform support fee",
      type: "debit",
      category: "support-fee",
      amount: 1500,
    },
    {
      id: "li-4",
      description: "Clawback — Cancelled deal D-0098",
      type: "debit",
      category: "clawback",
      amount: 3200,
    },
  ],
  totalCredit: 20500,
  totalDebit: 4700,
  balance: 15800,
  status: "confirmed",
  generatedAt: "2026-02-28",
  expiresAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
};
