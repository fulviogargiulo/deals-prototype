import type { Deal, PnlEntry, Offer, Property } from "../entities";
import { getBlueprint } from "../blueprints";

const COUNTRY_TO_CURRENCY = { ae: "AED", es: "EUR", sa: "SAR" } as const;

/**
 * createDealFromOffer — maps a documents-complete Offer into the canonical
 * Deal context fields. The returned partial is hydrated by the caller with
 * revenue data (grossRevenue, dealPrice, takeRate, etc.) before persistence.
 *
 * Stakeholders are returned separately so the caller can push them into the
 * shared stakeholder store alongside the deal.
 */
export function createDealFromOffer(
  offer: Offer,
  property?: Property,
): { dealContext: Pick<Deal, "offerId" | "assetId" | "country" | "currency" | "title">; agentStakeholders: Omit<PnlEntry, "trancheId">[] } {
  const country = offer.country;
  const currency = offer.currency ?? COUNTRY_TO_CURRENCY[country];
  const blueprint = getBlueprint(country, "rebu");
  const propertyTitle = property?.name ?? offer.assetName ?? offer.assetId ?? "Unknown Property";

  const agentStakeholders: Omit<PnlEntry, "trancheId">[] = [];

  if (offer.buyerAgentId) {
    agentStakeholders.push({
      id: `ds-new-closer-${offer.id}`,
      partyId: `party-${offer.buyerAgentId}`,
      role: "AGENT_PAYOUT",
      splitPercentage: offer.buyerAgentSplitPct ?? (offer.sellerAgentId ? 50 : 100),
      isPrimary: true,
      source: "engine",
      status: "draft",
    });
  }

  if (offer.sellerAgentId) {
    agentStakeholders.push({
      id: `ds-new-lister-${offer.id}`,
      partyId: `party-${offer.sellerAgentId}`,
      role: "AGENT_PAYOUT",
      splitPercentage: offer.sellerAgentSplitPct ?? (offer.buyerAgentId ? 50 : 100),
      isPrimary: !offer.buyerAgentId,
      source: "engine",
      status: "draft",
    });
  }

  return {
    dealContext: {
      offerId: offer.id,
      assetId: offer.assetId,
      country,
      currency,
      title: propertyTitle,
    },
    agentStakeholders,
  };
}
