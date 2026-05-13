import type { AgentFinancials } from "../entities";
import { COMMISSION_RATES } from "../commissionCalc";

/**
 * Per-agent commission strategy and rate overrides.
 *
 * Promoted from the in-memory `agentFinancialsStore` previously living in
 * apps/karvel/src/pages/AgentDetail.tsx. Every internal split for an agent
 * on a deal is derived from this record via the waterfall engine.
 *
 * Defaults align with COMMISSION_RATES (40% / 10% / 5%). Two agents below
 * use non-flat strategies to exercise the engine:
 *   - agent-ravi: slab strategy (per-deal tiers)
 *   - agent-zainab: max strategy (flat % capped at an absolute amount)
 */
export const sharedAgentFinancials: AgentFinancials[] = [
  {
    id: "af-felicia",
    agentId: "agent-felicia",
    strategy: { kind: "flat", pct: COMMISSION_RATES.agentGrossRate },
    teamLeadRate: COMMISSION_RATES.teamLeadRate,
    managerRate: COMMISSION_RATES.managerOverrideRate,
  },
  {
    id: "af-guilherme",
    agentId: "agent-guilherme",
    strategy: { kind: "flat", pct: 45 },
    teamLeadRate: COMMISSION_RATES.teamLeadRate,
    managerRate: COMMISSION_RATES.managerOverrideRate,
  },
  {
    id: "af-omar",
    agentId: "agent-omar",
    strategy: { kind: "flat", pct: COMMISSION_RATES.agentGrossRate },
    teamLeadRate: COMMISSION_RATES.teamLeadRate,
    managerRate: COMMISSION_RATES.managerOverrideRate,
  },
  {
    id: "af-gelo",
    agentId: "agent-gelo",
    strategy: { kind: "flat", pct: 42 },
    teamLeadRate: COMMISSION_RATES.teamLeadRate,
    managerRate: COMMISSION_RATES.managerOverrideRate,
  },
  {
    id: "af-ravi",
    agentId: "agent-ravi",
    strategy: {
      kind: "slab",
      slabs: [
        { upTo: 5000, pct: 35 },
        { upTo: 20000, pct: 45 },
        { upTo: null, pct: 55 },
      ],
    },
    teamLeadRate: COMMISSION_RATES.teamLeadRate,
    managerRate: COMMISSION_RATES.managerOverrideRate,
  },
  {
    id: "af-zainab",
    agentId: "agent-zainab",
    strategy: { kind: "max", pct: 50, capAmount: 25_000 },
    teamLeadRate: COMMISSION_RATES.teamLeadRate,
    managerRate: COMMISSION_RATES.managerOverrideRate,
  },
];

export function getAgentFinancialsByAgentId(agentId: string): AgentFinancials | undefined {
  return sharedAgentFinancials.find((af) => af.agentId === agentId);
}
