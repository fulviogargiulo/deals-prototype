import type { Deal } from "../entities";
import { sharedClients } from "./clients";
import { sharedParties } from "./parties";
import { sharedOffers } from "./offers";

function findOffer(id: string) {
  return sharedOffers.find((o) => o.id === id);
}

interface BaseInput {
  id: string;
  offerId: string;
  market: Deal["market"];
  country: Deal["country"];
  currency: Deal["currency"];
  businessUnit: Deal["businessUnit"];
  dealAmount: number;
  createdAt: string;
  updatedAt: string;
  channel?: string;
  description?: string;
}

function expand(b: BaseInput): Deal {
  const offer = findOffer(b.offerId);

  // Derive client display name from offer (agentName is a display cache filled by Karvel enricher).
  const clientPartyId = offer?.clientId ? sharedClients.find((c) => c.id === offer.clientId)?.partyId : undefined;
  const clientName = clientPartyId ? sharedParties.find((p) => p.id === clientPartyId)?.displayName ?? "Unknown" : "Unknown";

  const assetTitle = offer?.assetName ?? b.id;

  return {
    id: b.id,
    offerId: b.offerId,
    assetId: offer?.assetId,
    market: b.market,
    businessUnit: b.businessUnit,
    country: b.country,
    currency: b.currency,
    dealAmount: b.dealAmount,
    createdAt: b.createdAt,
    updatedAt: b.updatedAt,
    clientName,
    agentName: "Unknown",
    title: assetTitle,
    channel: b.channel,
    marketType: b.market,
    description: b.description,
  };
}

export const sharedDeals: Deal[] = [
  expand({ id: "deal-001", offerId: "offer-001", businessUnit: "rebu", market: "primary",   country: "es", currency: "EUR", dealAmount: 385000,    createdAt: "2026-01-06T09:00:00.000Z", updatedAt: "2026-01-12T14:30:00.000Z" }),
  expand({ id: "deal-002", offerId: "offer-002", businessUnit: "rebu", market: "secondary", country: "es", currency: "EUR", dealAmount: 720000,    createdAt: "2026-02-08T00:00:00.000Z", updatedAt: "2026-02-13T14:00:00.000Z" }),
  expand({ id: "deal-003", offerId: "offer-003", businessUnit: "rebu", market: "leasing",   country: "es", currency: "EUR", dealAmount: 14400,     createdAt: "2026-02-22T00:00:00.000Z", updatedAt: "2026-02-22T00:00:00.000Z" }),
  expand({ id: "deal-004", offerId: "offer-004", businessUnit: "rebu", market: "secondary", country: "es", currency: "EUR", dealAmount: 1250000,   createdAt: "2026-03-03T00:00:00.000Z", updatedAt: "2026-03-03T00:00:00.000Z" }),
  expand({ id: "deal-005", offerId: "offer-005", businessUnit: "rebu", market: "primary",   country: "sa", currency: "SAR", dealAmount: 540000,    createdAt: "2026-02-15T00:00:00.000Z", updatedAt: "2026-02-17T10:00:00.000Z" }),
  expand({ id: "deal-006", offerId: "offer-006", businessUnit: "rebu", market: "secondary", country: "es", currency: "EUR", dealAmount: 320000,    createdAt: "2026-02-20T00:00:00.000Z", updatedAt: "2026-02-26T14:00:00.000Z" }),
  expand({ id: "deal-007", offerId: "offer-007", businessUnit: "rebu", market: "secondary", country: "es", currency: "EUR", dealAmount: 475000,    createdAt: "2026-03-05T00:00:00.000Z", updatedAt: "2026-03-07T09:00:00.000Z" }),
  expand({ id: "deal-008", offerId: "offer-008", businessUnit: "rebu", market: "secondary", country: "es", currency: "EUR", dealAmount: 580000,    createdAt: "2026-03-03T00:00:00.000Z", updatedAt: "2026-03-05T10:00:00.000Z" }),
  expand({ id: "deal-009", offerId: "offer-009", businessUnit: "rebu", market: "primary",   country: "ae", currency: "AED", dealAmount: 1850000,   createdAt: "2026-05-01T00:00:00.000Z", updatedAt: "2026-05-03T09:00:00.000Z" }),
  expand({ id: "deal-010", offerId: "offer-010", businessUnit: "rebu", market: "secondary", country: "ae", currency: "AED", dealAmount: 4200000,   createdAt: "2026-03-18T00:00:00.000Z", updatedAt: "2026-03-25T11:00:00.000Z" }),
  // MBU MA/Broker — DIB — Omar Rahman
  expand({ id: "deal-011", offerId: "offer-011", businessUnit: "mortgage", channel: "MA",   market: "primary", country: "ae", currency: "AED", dealAmount: 1_500_000, createdAt: "2026-04-20T00:00:00.000Z", updatedAt: "2026-04-22T10:00:00.000Z" }),
  // MBU B2C/Digital — FAB — Priya Sharma
  { id: "deal-012", offerId: "offer-012", businessUnit: "mortgage", channel: "B2C", market: "primary", country: "ae", currency: "AED", dealAmount: 3_200_000, title: "FAB · Sharma Purchase", clientName: "Priya Sharma", createdAt: "2026-04-28T00:00:00.000Z", updatedAt: "2026-04-30T09:00:00.000Z" },
  expand({ id: "deal-013", offerId: "offer-013", businessUnit: "rebu", market: "secondary", country: "es", currency: "EUR", dealAmount: 620000,    createdAt: "2026-04-10T00:00:00.000Z", updatedAt: "2026-04-15T14:00:00.000Z" }),
  expand({ id: "deal-014", offerId: "offer-014", businessUnit: "mortgage", channel: "B2C", market: "secondary", country: "es", currency: "EUR", dealAmount: 496000, createdAt: "2026-04-10T00:00:00.000Z", updatedAt: "2026-04-15T10:00:00.000Z" }),
  expand({ id: "deal-015", offerId: "offer-015", businessUnit: "mortgage", channel: "B2C", market: "primary",   country: "sa", currency: "SAR", dealAmount: 920000, createdAt: "2026-04-28T00:00:00.000Z", updatedAt: "2026-05-02T09:00:00.000Z" }),
  expand({ id: "deal-016", offerId: "offer-016", businessUnit: "rebu", market: "primary",   country: "ae", currency: "AED", dealAmount: 2100000,   createdAt: "2026-05-01T00:00:00.000Z", updatedAt: "2026-05-05T11:00:00.000Z" }),
  expand({ id: "deal-017", offerId: "offer-017", businessUnit: "rebu", market: "primary",   country: "es", currency: "EUR", dealAmount: 530000,    createdAt: "2026-04-28T00:00:00.000Z", updatedAt: "2026-04-30T09:00:00.000Z" }),
  expand({ id: "deal-018", offerId: "offer-018", businessUnit: "rebu", market: "secondary", country: "es", currency: "EUR", dealAmount: 1250000,   createdAt: "2026-04-12T00:00:00.000Z", updatedAt: "2026-04-22T15:30:00.000Z" }),
  expand({ id: "deal-019", offerId: "offer-019", businessUnit: "rebu", market: "secondary", country: "es", currency: "EUR", dealAmount: 260000,    createdAt: "2026-03-20T00:00:00.000Z", updatedAt: "2026-04-01T11:00:00.000Z" }),
  expand({ id: "deal-020", offerId: "offer-020", businessUnit: "rebu", market: "primary",   country: "ae", currency: "AED", dealAmount: 1200000,   createdAt: "2026-05-12T00:00:00.000Z", updatedAt: "2026-05-17T14:00:00.000Z" }),
  expand({ id: "deal-021", offerId: "offer-021", businessUnit: "rebu", market: "primary",   country: "es", currency: "EUR", dealAmount: 480000,    createdAt: "2026-03-05T00:00:00.000Z", updatedAt: "2026-03-20T15:00:00.000Z" }),
  // MBU MA/Broker — ADIB — Omar Rahman (60%) + Khalid & Associates (40%)
  expand({ id: "deal-022", offerId: "offer-022", businessUnit: "mortgage", channel: "MA",   market: "primary", country: "ae", currency: "AED", dealAmount: 2_800_000, createdAt: "2026-05-05T00:00:00.000Z", updatedAt: "2026-05-14T15:00:00.000Z" }),
  // MBU BYOB — DIB — Nadia Hassan
  expand({ id: "deal-023", offerId: "offer-023", businessUnit: "mortgage", channel: "BYOB", market: "primary", country: "ae", currency: "AED", dealAmount: 2_000_000, createdAt: "2026-05-10T00:00:00.000Z", updatedAt: "2026-05-12T10:00:00.000Z" }),
  // BBG — Broker sub-channel: Layla Nasser
  expand({ id: "deal-024", offerId: "offer-024", businessUnit: "mortgage", channel: "BBG", market: "primary", country: "ae", currency: "AED", dealAmount: 2_500_000, createdAt: "2026-05-15T00:00:00.000Z", updatedAt: "2026-05-16T10:00:00.000Z" }),
  // BBG — Self-Generated: Layla Nasser
  expand({ id: "deal-025", offerId: "offer-025", businessUnit: "mortgage", channel: "BBG", market: "primary", country: "ae", currency: "AED", dealAmount: 1_500_000, createdAt: "2026-05-18T00:00:00.000Z", updatedAt: "2026-05-19T11:00:00.000Z" }),
  // deal-026 — Spain REBU secondary, 2 tranches (Arras + Escritura) in tranches.ts
  expand({ id: "deal-026", offerId: "offer-026", businessUnit: "rebu", market: "secondary", country: "es", currency: "EUR", dealAmount: 300_000, createdAt: "2026-06-01T09:00:00.000Z", updatedAt: "2026-06-01T09:00:00.000Z" }),
];
