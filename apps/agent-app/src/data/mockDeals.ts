// Deals come from shared canonical fixtures (visible in both apps).
// `mockStatement` is agent-app-only (StatementOfAccount is a financial UI
// concept karvel doesn't share), so it lives here.
import { sharedDeals } from "@huspy/shared-domain";
import type { Deal, StatementOfAccount } from "@/types";

// Cast: shared.Deal.type is `DealType` (includes buy-sell, rent-lease);
// agent-app.Deal narrows to `OpportunityType`. The 8 shared records use only
// values in OpportunityType, so the cast is safe at runtime.
export const mockDeals: Deal[] = sharedDeals as unknown as Deal[];

export const CURRENT_AGENT_ID = 'agent-felicia';
export const agentDeals: Deal[] = mockDeals.filter(d => d.agentId === CURRENT_AGENT_ID);

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
