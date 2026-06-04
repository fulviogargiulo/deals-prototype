import type { Deal, Tranche, AgentFinancials, PnlEntry } from "../entities";
import type { ProjectedPnLInput } from "../waterfall";
import { getBlueprint } from "../blueprints";
import { sharedPnlEntries } from "./pnlEntries";
import { sharedAgents } from "./agents";
import { sharedParties } from "./parties";
import { sharedAgentFinancials } from "./agentFinancials";
import { sharedTranches } from "./tranches";

// Accepts either a Deal (finds its primary tranche) or an explicit tranche + deal combo.
type WaterfallInput = {
  trancheId?: string;         // preferred: explicit tranche ID to scope stakeholders
  id?: string;                // legacy: treated as deal ID → finds primary tranche
  businessUnit?: Deal["businessUnit"];
  country?: Deal["country"];
  currency?: Deal["currency"];
  grossRevenue?: number;
  blueprintId?: string;
};

/**
 * Assembles a ProjectedPnLInput from fixture data for a given deal.
 * Mirrors Karvel's buildEngineInput in dealCalculations.ts — both apps
 * run the same waterfall engine (calculateProjectedPnL) on this input.
 *
 * Returns null for MBU deals or deals missing lean-shape markers.
 */
export function buildWaterfallInput(deal: WaterfallInput): ProjectedPnLInput | null {
  if (deal.businessUnit === "mortgage") return null;

  // Resolve the tranche ID: use explicit trancheId, or find primary tranche for the deal id.
  let resolvedTrancheId = deal.trancheId;
  let resolvedGrossRevenue = deal.grossRevenue;
  let resolvedBlueprintId = deal.blueprintId;

  if (!resolvedTrancheId && deal.id) {
    const primaryTranche = sharedTranches.find(t => t.dealId === deal.id && t.index === 0);
    if (primaryTranche) {
      resolvedTrancheId = primaryTranche.id;
      resolvedBlueprintId = resolvedBlueprintId ?? primaryTranche.blueprintId;
    }
  }

  // When trancheId was supplied explicitly, blueprintId still needs resolving from the tranche.
  if (resolvedTrancheId && !resolvedBlueprintId) {
    const tranche = sharedTranches.find(t => t.id === resolvedTrancheId);
    if (tranche) resolvedBlueprintId = tranche.blueprintId;
  }

  // Always derive grossRevenue from REVENUE_SOURCE stakes — not stored on Tranche.
  if (resolvedTrancheId) {
    const revStakes = sharedPnlEntries.filter(
      s => s.trancheId === resolvedTrancheId && s.role === "REVENUE_SOURCE" && (s.amount ?? 0) > 0
    );
    if (revStakes.length > 0) {
      resolvedGrossRevenue = revStakes.reduce((sum, s) => sum + Math.abs(s.amount ?? 0), 0);
    }
  }

  if (resolvedGrossRevenue == null || !resolvedBlueprintId || !resolvedTrancheId) return null;

  const country = deal.country ?? "ae";
  const currency = deal.currency ?? "AED";
  const blueprint = getBlueprint(country, "rebu");

  const agentFinancialsByAgentId: Record<string, AgentFinancials> = {};
  const partyIdToAgentId: Record<string, string> = {};
  const partyDisplayNames: Record<string, string> = {};

  const allFixtureStakes = sharedPnlEntries.filter((s) => s.trancheId === resolvedTrancheId);

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

  let stakeholders: PnlEntry[] = allFixtureStakes;

  // Infer amount for REVENUE_SOURCE stakes that don't have one set explicitly.
  const hasExplicitPayer = stakeholders.some((s) => (s.amount ?? 0) > 0);
  if (!hasExplicitPayer && resolvedGrossRevenue) {
    const implicit = stakeholders.filter((s) => s.role === "REVENUE_SOURCE" && !s.amount);
    if (implicit.length > 0) {
      const perPayer = resolvedGrossRevenue / implicit.length;
      stakeholders = stakeholders.map((s) =>
        s.role === "REVENUE_SOURCE" && !s.amount ? { ...s, amount: perPayer } : s
      );
    }
  }

  return {
    country,
    businessUnit: "rebu",
    currency,
    grossRevenue: resolvedGrossRevenue!,
    stakeholders,
    agentFinancialsByAgentId,
    partyIdToAgentId,
    blueprint,
    partyDisplayNames,
  };
}
