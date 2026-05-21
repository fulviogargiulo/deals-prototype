import type { Deal, AgentFinancials, DealStakeholder } from "../entities";
import type { ProjectedPnLInput } from "../waterfall";
import { getBlueprint } from "../blueprints";
import { sharedDealStakeholders } from "./dealStakeholders";
import { sharedAgents } from "./agents";
import { sharedParties } from "./parties";
import { sharedAgentFinancials } from "./agentFinancials";

type WaterfallDeal = Pick<Deal,
  | "id"
  | "businessUnit"
  | "country"
  | "currency"
  | "grossRevenue"
  | "blueprintId"
>;

/**
 * Assembles a ProjectedPnLInput from fixture data for a given deal.
 * Mirrors Karvel's buildEngineInput in dealCalculations.ts — both apps
 * run the same waterfall engine (calculateProjectedPnL) on this input.
 *
 * Returns null for MBU deals or deals missing lean-shape markers.
 */
export function buildWaterfallInput(deal: WaterfallDeal): ProjectedPnLInput | null {
  if (deal.businessUnit === "mortgage") return null;
  if (deal.grossRevenue == null || !deal.blueprintId) return null;

  const country = deal.country ?? "ae";
  const currency = deal.currency ?? "AED";
  const blueprint = getBlueprint(country, "rebu");

  const agentFinancialsByAgentId: Record<string, AgentFinancials> = {};
  const partyIdToAgentId: Record<string, string> = {};
  const partyDisplayNames: Record<string, string> = {};

  const allFixtureStakes = sharedDealStakeholders.filter((s) => s.dealId === deal.id);

  for (const stake of allFixtureStakes) {
    const party = sharedParties.find((p) => p.id === stake.partyId);
    if (party) partyDisplayNames[stake.partyId] = party.displayName;

    if (stake.role === "AGENT_PAYOUT") {
      const agent = sharedAgents.find((a) => a.partyId === stake.partyId);
      if (!agent) continue;
      const af = sharedAgentFinancials.find((f) => f.agentId === agent.id);
      if (!af) continue;
      agentFinancialsByAgentId[agent.id] = af;
      partyIdToAgentId[stake.partyId] = agent.id;
    }
  }

  if (Object.keys(agentFinancialsByAgentId).length === 0) return null;

  let stakeholders: DealStakeholder[] = allFixtureStakes;

  // Infer financialAmount for REVENUE_SOURCE stakes that don't have one set explicitly.
  const hasExplicitPayer = stakeholders.some((s) => (s.financialAmount ?? 0) > 0);
  if (!hasExplicitPayer && deal.grossRevenue) {
    const implicit = stakeholders.filter((s) => s.role === "REVENUE_SOURCE" && !s.financialAmount);
    if (implicit.length > 0) {
      const perPayer = deal.grossRevenue / implicit.length;
      stakeholders = stakeholders.map((s) =>
        s.role === "REVENUE_SOURCE" && !s.financialAmount ? { ...s, financialAmount: perPayer } : s
      );
    }
  }

  return {
    country,
    businessUnit: "rebu",
    currency,
    grossRevenue: deal.grossRevenue,
    stakeholders,
    agentFinancialsByAgentId,
    partyIdToAgentId,
    blueprint,
    partyDisplayNames,
  };
}
