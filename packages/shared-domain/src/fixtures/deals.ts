import type { Deal, ReceivableEntry, ReceivableEntityType } from "../entities";
import { sharedClients } from "./clients";
import { sharedParties } from "./parties";
import { sharedOffers } from "./offers";
import { sharedDealStakeholders } from "./dealStakeholders";
import { sharedAgents } from "./agents";
import { sharedInvoices } from "./invoices";

import { getBlueprint } from "../blueprints";

const agentDisplayName: Record<string, string> = {
  "agent-001": "Felicia Canovas",
  "agent-002": "Guilherme Castro",
  "agent-003": "Omar Al Saleem",
  "agent-004": "Gelo Huspy",
  "agent-005": "Ravi Nair",
  "agent-006": "Zainab Al-Qadi",
};

const CLIENT_ROLES = new Set<string>(["DEMAND"]);

function findOffer(id: string) {
  return sharedOffers.find((o) => o.id === id);
}

function deriveReceivableEntityType(partyId: string, market: Deal["market"]): ReceivableEntityType {
  const party = sharedParties.find((p) => p.id === partyId);
  if (party?.legalType === "financial_institution") return "bank";
  if (party?.legalType === "company") return "developer";
  if (market === "leasing") return "tenant";
  return "buyer";
}

interface BaseInput {
  id: string;
  offerId: string;
  status: Deal["status"];
  market: Deal["market"];
  country: Deal["country"];
  currency: Deal["currency"];
  businessUnit: Deal["businessUnit"];
  dealAmount: number;
  reportDate: string;
  createdAt: string;
  updatedAt: string;
  commissionPercentage: number;
  paymentDate?: string;
  channel?: string;
  rebatePercentage?: number;
  subsidyAmount?: number;
  statusHistory?: Deal["statusHistory"];
}

function expand(b: BaseInput): Deal {
  const offer = findOffer(b.offerId);
  const huspyRevenue = Math.round(b.dealAmount * (b.commissionPercentage / 100));
  const businessUnit = b.businessUnit;
  // rebateAmount and subsidyAmount are stored as reference fields on the deal.
  // The actual net amounts are already baked into each REVENUE_SOURCE stakeholder's financialAmount.
  const grossCommission = Math.round((b.commissionPercentage / 100) * b.dealAmount);
  const rebateAmount = b.rebatePercentage
    ? Math.round((b.rebatePercentage / 100) * grossCommission)
    : undefined;
  const blueprint = getBlueprint(b.country, businessUnit);

  // Primary agent display name (display cache only — full AgentEntry[] lives in Karvel enricher).
  const primaryAgentStake = sharedDealStakeholders.find((s) => s.dealId === b.id && s.role === "AGENT_PAYOUT" && s.isPrimary);
  const primaryAgent = primaryAgentStake ? sharedAgents.find((a) => a.partyId === primaryAgentStake.partyId) : undefined;
  const agentName = primaryAgent
    ? (agentDisplayName[primaryAgent.id] ?? primaryAgent.id)
    : (primaryAgentStake ? (sharedParties.find((p) => p.id === primaryAgentStake.partyId)?.displayName ?? "Unknown") : "Unknown");

  // Derive client from DealStakeholders, then resolve Party for canonical contact info.
  const clientStake = sharedDealStakeholders.find((s) => s.dealId === b.id && CLIENT_ROLES.has(s.role));
  const client = clientStake ? sharedClients.find((c) => c.partyId === clientStake.partyId) : undefined;
  const clientParty = client ? sharedParties.find((p) => p.id === client.partyId) : undefined;

  // Derive receivables from outbound invoices linked to this deal.
  const dealInvoices = sharedInvoices.filter((i) => i.dealId === b.id && i.direction === "outbound");
  const receivables: ReceivableEntry[] = dealInvoices.map((inv) => {
    const party = sharedParties.find((p) => p.id === inv.partyId);
    return {
      entityName: party?.displayName ?? "Unknown",
      entityType: deriveReceivableEntityType(inv.partyId, b.market),
      amount: (inv.subtotal ?? 0) + (inv.vatAmount ?? 0),
      invoiceNumber: inv.invoiceNumber,
      invoiceStatus: inv.status,
      invoiceDate: inv.issueDate,
      paymentReceivedDate: inv.paidDate,
      paymentReceivedAmount: inv.paidDate ? (inv.subtotal ?? 0) + (inv.vatAmount ?? 0) : undefined,
    };
  });

  const propertyTitle = offer?.propertyName ?? b.id;

  return {
    // Canonical core
    id: b.id,
    offerId: b.offerId,
    propertyId: offer?.propertyId,
    status: b.status,
    market: b.market,
    businessUnit,
    country: b.country,
    currency: b.currency,
    dealAmount: b.dealAmount,
    reportDate: b.reportDate,
    createdAt: b.createdAt,
    updatedAt: b.updatedAt,

    // Lean waterfall fields
    grossRevenue: huspyRevenue,
    blueprintId: blueprint.id,

    // Display caches — derived from DealStakeholder chain, not embedded FKs
    clientName: clientParty?.displayName ?? "Unknown",
    agentName,
    title: propertyTitle,

    // Karvel — operational
    channel: b.channel,
    ofCaseNumber: `OF-${b.id.toUpperCase()}`,
    buildingName: propertyTitle,
    paymentMode: "cash",
    dealPrice: b.dealAmount,
    takeRate: b.commissionPercentage,
    huspyRevenue,
    receivables,
    rebatePercentage: b.rebatePercentage ?? 0,
    rebateAmount,
    subsidyAmount: b.market === "secondary" ? (b.subsidyAmount ?? 0) : 0,
    numberOfTranches: 0,
    disbursedAmount: 0,
    bankSlab: businessUnit === "mortgage" ? b.commissionPercentage : 0,
    externalCommissionRate: 0,
    externalPayout: 0,
    // Agent-app — agent-facing
    marketType: b.market,
    commissionPercentage: b.commissionPercentage,
    commissionAmount: Math.round((huspyRevenue - (b.subsidyAmount ?? 0)) * 0.40),
    paymentDate: b.paymentDate,
    statusHistory: b.statusHistory,
  };
}

export const sharedDeals: Deal[] = [
  expand({
    id: "deal-001", offerId: "offer-001",
    status: "finalized", businessUnit: "rebu", market: "primary", country: "es", currency: "EUR",
    dealAmount: 385000, reportDate: "2026-01-06",
    createdAt: "2026-01-06T09:00:00.000Z", updatedAt: "2026-01-12T14:30:00.000Z",
    commissionPercentage: 3, paymentDate: "2026-01-12",
    rebatePercentage: 1.5,
    statusHistory: [
      { from: "pending-details",         to: "under-review",            timestamp: "2026-01-07T10:00:00.000Z", note: "Ops review started" },
      { from: "under-review",            to: "pending-agent-approval",  timestamp: "2026-01-09T15:00:00.000Z", note: "Documents approved" },
      { from: "pending-agent-approval",  to: "invoicing",     timestamp: "2026-01-10T09:00:00.000Z", note: "Agent approved — invoice issued" },
      { from: "invoicing",     to: "finalized",               timestamp: "2026-01-12T14:30:00.000Z", note: "Payment confirmed" },
    ],
  }),
  expand({
    id: "deal-002", offerId: "offer-002",
    status: "pending-agent-approval", businessUnit: "rebu", market: "secondary", country: "es", currency: "EUR",
    dealAmount: 720000, reportDate: "2026-02-08",
    createdAt: "2026-02-08T00:00:00.000Z", updatedAt: "2026-02-13T14:00:00.000Z",
    commissionPercentage: 2.5,
    subsidyAmount: 4000,
    statusHistory: [
      { from: "pending-details",  to: "under-review",           timestamp: "2026-02-10T10:00:00.000Z" },
      { from: "under-review",     to: "pending-agent-approval", timestamp: "2026-02-13T14:00:00.000Z" },
    ],
  }),
  expand({
    id: "deal-003", offerId: "offer-003",
    status: "pending-details", businessUnit: "rebu", market: "leasing", country: "es", currency: "EUR",
    dealAmount: 14400, reportDate: "2026-02-22",
    createdAt: "2026-02-22T00:00:00.000Z", updatedAt: "2026-02-22T00:00:00.000Z",
    commissionPercentage: 8,
  }),
  expand({
    id: "deal-004", offerId: "offer-004",
    status: "pending-details", businessUnit: "rebu", market: "secondary", country: "es", currency: "EUR",
    dealAmount: 1250000, reportDate: "2026-03-03",
    createdAt: "2026-03-03T00:00:00.000Z", updatedAt: "2026-03-03T00:00:00.000Z",
    commissionPercentage: 2,
    subsidyAmount: 6000,
  }),
  expand({
    id: "deal-005", offerId: "offer-005",
    status: "under-review", businessUnit: "rebu", market: "primary", country: "sa", currency: "SAR",
    dealAmount: 540000, reportDate: "2026-02-15",
    createdAt: "2026-02-15T00:00:00.000Z", updatedAt: "2026-02-17T10:00:00.000Z",
    commissionPercentage: 2.5,
    rebatePercentage: 2.0,
    statusHistory: [
      { from: "pending-details", to: "under-review", timestamp: "2026-02-17T10:00:00.000Z" },
    ],
  }),
  expand({
    id: "deal-006", offerId: "offer-006",
    status: "pending-agent-approval", businessUnit: "rebu", market: "secondary", country: "es", currency: "EUR",
    dealAmount: 320000, reportDate: "2026-02-20",
    createdAt: "2026-02-20T00:00:00.000Z", updatedAt: "2026-02-26T14:00:00.000Z",
    commissionPercentage: 3,
    subsidyAmount: 2500,
    statusHistory: [
      { from: "pending-details",  to: "under-review",           timestamp: "2026-02-23T10:00:00.000Z" },
      { from: "under-review",     to: "pending-agent-approval", timestamp: "2026-02-26T14:00:00.000Z" },
    ],
  }),
  expand({
    id: "deal-007", offerId: "offer-007",
    status: "under-review", businessUnit: "rebu", market: "secondary", country: "es", currency: "EUR",
    dealAmount: 475000, reportDate: "2026-03-05",
    createdAt: "2026-03-05T00:00:00.000Z", updatedAt: "2026-03-07T09:00:00.000Z",
    commissionPercentage: 2.5,
    subsidyAmount: 3000,
    statusHistory: [
      { from: "pending-details", to: "under-review", timestamp: "2026-03-07T09:00:00.000Z" },
    ],
  }),
  expand({
    id: "deal-008", offerId: "offer-008",
    status: "invoicing", businessUnit: "rebu", market: "secondary", country: "es", currency: "EUR",
    dealAmount: 580000, reportDate: "2026-03-03",
    createdAt: "2026-03-03T00:00:00.000Z", updatedAt: "2026-03-05T10:00:00.000Z",
    commissionPercentage: 2.5,
    subsidyAmount: 5000,
    statusHistory: [
      { from: "pending-details",        to: "under-review",           timestamp: "2026-03-04T10:00:00.000Z" },
      { from: "under-review",           to: "pending-agent-approval", timestamp: "2026-03-04T16:00:00.000Z" },
      { from: "pending-agent-approval", to: "invoicing",    timestamp: "2026-03-05T10:00:00.000Z", note: "Invoice issued" },
    ],
  }),
  expand({
    id: "deal-009", offerId: "offer-009",
    status: "under-review", businessUnit: "rebu", market: "primary", country: "ae", currency: "AED",
    dealAmount: 1850000, reportDate: "2026-05-01",
    createdAt: "2026-05-01T00:00:00.000Z", updatedAt: "2026-05-03T09:00:00.000Z",
    commissionPercentage: 2,
    rebatePercentage: 2.0,
    statusHistory: [
      { from: "pending-details", to: "under-review", timestamp: "2026-05-03T09:00:00.000Z" },
    ],
  }),
  expand({
    id: "deal-010", offerId: "offer-010",
    status: "canceled", businessUnit: "rebu", market: "secondary", country: "ae", currency: "AED",
    dealAmount: 4200000, reportDate: "2026-03-18",
    createdAt: "2026-03-18T00:00:00.000Z", updatedAt: "2026-03-25T11:00:00.000Z",
    commissionPercentage: 2,
    statusHistory: [
      { from: "pending-details", to: "under-review", timestamp: "2026-03-20T09:00:00.000Z" },
      { from: "under-review",    to: "canceled",     timestamp: "2026-03-25T11:00:00.000Z", note: "Client withdrew" },
    ],
  }),
  // MBU MA/Broker — DIB — Omar Rahman (sole broker, < 5M GMV → 52% rate)
  // Revenue: 1,500,000 × 1.20% = 18,000 AED | Broker payout (provisional): 52% × 18,000 = 9,360 AED
  expand({
    id: "deal-011", offerId: "offer-011",
    status: "invoicing",
    businessUnit: "mortgage", channel: "MA",
    market: "primary", country: "ae", currency: "AED",
    dealAmount: 1_500_000, commissionPercentage: 1.20,
    reportDate: "2026-04-20",
    createdAt: "2026-04-20T00:00:00.000Z", updatedAt: "2026-04-22T10:00:00.000Z",
    statusHistory: [
      { from: "pending-details",  to: "under-review",        timestamp: "2026-04-21T09:00:00.000Z" },
      { from: "under-review",     to: "invoicing", timestamp: "2026-04-22T10:00:00.000Z", note: "Invoice issued to DIB" },
    ],
  }),
  // MBU B2C/Digital — FAB — internal MC (placeholder; full B2C structure TBD)
  // Revenue: 3,200,000 × 1.00% = 32,000 AED
  {
    id: "deal-012", offerId: "offer-012",
    status: "under-review",
    businessUnit: "mortgage", channel: "B2C",
    market: "primary", country: "ae", currency: "AED",
    dealAmount: 3_200_000, reportDate: "2026-04-28",
    title: "FAB · Sharma Purchase",
    clientName: "Priya Sharma",
    createdAt: "2026-04-28T00:00:00.000Z", updatedAt: "2026-04-30T09:00:00.000Z",
    statusHistory: [
      { from: "pending-details", to: "under-review", timestamp: "2026-04-30T09:00:00.000Z" },
    ],
  },
  expand({
    id: "deal-013", offerId: "offer-013",
    status: "pending-agent-approval", businessUnit: "rebu", market: "secondary", country: "es", currency: "EUR",
    dealAmount: 620000, reportDate: "2026-04-10",
    createdAt: "2026-04-10T00:00:00.000Z", updatedAt: "2026-04-15T14:00:00.000Z",
    commissionPercentage: 3,
    subsidyAmount: 4500,
    statusHistory: [
      { from: "pending-details",  to: "under-review",           timestamp: "2026-04-12T10:00:00.000Z" },
      { from: "under-review",     to: "pending-agent-approval", timestamp: "2026-04-15T14:00:00.000Z" },
    ],
  }),
  expand({
    id: "deal-014", offerId: "offer-014",
    status: "invoicing", market: "secondary", country: "es", currency: "EUR",
    businessUnit: "mortgage", channel: "B2C",
    dealAmount: 496000, reportDate: "2026-04-10",
    createdAt: "2026-04-10T00:00:00.000Z", updatedAt: "2026-04-15T10:00:00.000Z",
    commissionPercentage: 0.5,
    statusHistory: [
      { from: "pending-details",        to: "under-review",           timestamp: "2026-04-11T09:00:00.000Z" },
      { from: "under-review",           to: "pending-agent-approval", timestamp: "2026-04-13T15:00:00.000Z" },
      { from: "pending-agent-approval", to: "invoicing",    timestamp: "2026-04-15T10:00:00.000Z", note: "Invoice issued" },
    ],
  }),
  expand({
    id: "deal-015", offerId: "offer-015",
    status: "invoicing", market: "primary", country: "sa", currency: "SAR",
    businessUnit: "mortgage", channel: "B2C",
    dealAmount: 920000, reportDate: "2026-04-28",
    createdAt: "2026-04-28T00:00:00.000Z", updatedAt: "2026-05-02T09:00:00.000Z",
    commissionPercentage: 0.5,
    statusHistory: [
      { from: "pending-details",        to: "under-review",           timestamp: "2026-04-29T09:00:00.000Z" },
      { from: "under-review",           to: "pending-agent-approval", timestamp: "2026-05-01T14:00:00.000Z" },
      { from: "pending-agent-approval", to: "invoicing",    timestamp: "2026-05-02T09:00:00.000Z", note: "Invoice issued" },
    ],
  }),
  expand({
    id: "deal-016", offerId: "offer-016",
    status: "finalized", businessUnit: "rebu", market: "primary", country: "ae", currency: "AED",
    dealAmount: 2100000, reportDate: "2026-05-01",
    createdAt: "2026-05-01T00:00:00.000Z", updatedAt: "2026-05-05T11:00:00.000Z",
    commissionPercentage: 2, paymentDate: "2026-05-04",
    rebatePercentage: 1.5,
    statusHistory: [
      { from: "pending-details",        to: "under-review",           timestamp: "2026-05-02T09:00:00.000Z" },
      { from: "under-review",           to: "pending-agent-approval", timestamp: "2026-05-03T15:00:00.000Z" },
      { from: "pending-agent-approval", to: "invoicing",    timestamp: "2026-05-04T09:00:00.000Z", note: "Invoices issued" },
      { from: "invoicing",    to: "finalized",              timestamp: "2026-05-05T11:00:00.000Z", note: "All payments received" },
    ],
  }),
  expand({
    id: "deal-017", offerId: "offer-017",
    status: "under-review", businessUnit: "rebu", market: "primary", country: "es", currency: "EUR",
    dealAmount: 530000, reportDate: "2026-04-28",
    createdAt: "2026-04-28T00:00:00.000Z", updatedAt: "2026-04-30T09:00:00.000Z",
    commissionPercentage: 3,
    rebatePercentage: 1.5,
    statusHistory: [
      { from: "pending-details", to: "under-review", timestamp: "2026-04-30T09:00:00.000Z" },
    ],
  }),
  expand({
    id: "deal-018", offerId: "offer-018",
    status: "finalized", businessUnit: "rebu", market: "secondary", country: "es", currency: "EUR",
    dealAmount: 1250000, reportDate: "2026-04-12",
    createdAt: "2026-04-12T00:00:00.000Z", updatedAt: "2026-04-22T15:30:00.000Z",
    commissionPercentage: 2.5,
    subsidyAmount: 7000,
    statusHistory: [
      { from: "pending-details",        to: "under-review",           timestamp: "2026-04-13T09:00:00.000Z" },
      { from: "under-review",           to: "pending-agent-approval", timestamp: "2026-04-14T15:00:00.000Z" },
      { from: "pending-agent-approval", to: "invoicing",    timestamp: "2026-04-15T09:00:00.000Z", note: "Invoice issued" },
      { from: "invoicing",    to: "finalized",              timestamp: "2026-04-22T15:30:00.000Z", note: "Payment confirmed" },
    ],
  }),
  expand({
    id: "deal-019", offerId: "offer-019",
    status: "canceled", businessUnit: "rebu", market: "secondary", country: "es", currency: "EUR",
    dealAmount: 260000, reportDate: "2026-03-20",
    createdAt: "2026-03-20T00:00:00.000Z", updatedAt: "2026-04-01T11:00:00.000Z",
    commissionPercentage: 2,
    statusHistory: [
      { from: "pending-details", to: "under-review", timestamp: "2026-03-22T09:00:00.000Z" },
      { from: "under-review",    to: "canceled",     timestamp: "2026-04-01T11:00:00.000Z", note: "Client withdrew" },
    ],
  }),
  expand({
    id: "deal-020", offerId: "offer-020",
    status: "finalized", businessUnit: "rebu", market: "primary", country: "ae", currency: "AED",
    dealAmount: 1200000, reportDate: "2026-05-12",
    createdAt: "2026-05-12T00:00:00.000Z", updatedAt: "2026-05-17T14:00:00.000Z",
    commissionPercentage: 2,
    paymentDate: "2026-05-17",
    statusHistory: [
      { from: "pending-details",        to: "under-review",           timestamp: "2026-05-12T10:00:00.000Z" },
      { from: "under-review",           to: "pending-agent-approval", timestamp: "2026-05-13T14:00:00.000Z" },
      { from: "pending-agent-approval", to: "invoicing",    timestamp: "2026-05-14T09:00:00.000Z", note: "Invoice issued to Emaar" },
      { from: "invoicing",    to: "finalized",              timestamp: "2026-05-17T14:00:00.000Z", note: "Emaar payment received" },
    ],
  }),
  // MBU MA/Broker — ADIB — Omar Rahman (60%) + Khalid & Associates (40%), both < 5M GMV → 53%
  // Revenue: 2,800,000 × 1.25% = 35,000 AED | Omar: 53% × 21,000 = 11,130 | Khalid: 53% × 14,000 = 7,420
  expand({
    id: "deal-022", offerId: "offer-022",
    status: "finalized",
    businessUnit: "mortgage", channel: "MA",
    market: "primary", country: "ae", currency: "AED",
    dealAmount: 2_800_000, commissionPercentage: 1.25,
    reportDate: "2026-05-05", paymentDate: "2026-05-14",
    createdAt: "2026-05-05T00:00:00.000Z", updatedAt: "2026-05-14T15:00:00.000Z",
    statusHistory: [
      { from: "pending-details",  to: "under-review",        timestamp: "2026-05-07T11:00:00.000Z" },
      { from: "under-review",     to: "invoicing", timestamp: "2026-05-08T10:00:00.000Z", note: "Invoice issued to ADIB" },
      { from: "invoicing", to: "finalized",        timestamp: "2026-05-14T15:00:00.000Z", note: "ADIB payment received" },
    ],
  }),
  // MBU BYOB — DIB — Nadia Hassan, dealAmount=2M, bank rate 1.10% → gross 22,000
  // (DIB tier 1 0.624% − 0.10% penalty) × 2M = 10,480 broker payout
  expand({
    id: "deal-023", offerId: "offer-023",
    status: "invoicing",
    businessUnit: "mortgage", channel: "BYOB",
    market: "primary", country: "ae", currency: "AED",
    dealAmount: 2_000_000, commissionPercentage: 1.10,
    reportDate: "2026-05-10",
    createdAt: "2026-05-10T00:00:00.000Z", updatedAt: "2026-05-12T10:00:00.000Z",
    statusHistory: [
      { from: "pending-details", to: "under-review", timestamp: "2026-05-11T09:00:00.000Z" },
      { from: "under-review",    to: "invoicing",    timestamp: "2026-05-12T10:00:00.000Z", note: "Invoice issued to DIB" },
    ],
  }),
  // BBG — Broker sub-channel: Layla Nasser (RM 25%) + Omar Sheikh (TL 5%) + Rami Haddad (DS 5%) + Falcon Capital (ext 54%)
  // Gross 50,000 AED | Huspy margin: 11% = 5,500
  expand({
    id: "deal-024", offerId: "offer-024",
    status: "invoicing",
    businessUnit: "mortgage", channel: "BBG",
    market: "primary", country: "ae", currency: "AED",
    dealAmount: 2_500_000, commissionPercentage: 2,
    reportDate: "2026-05-15",
    createdAt: "2026-05-15T00:00:00.000Z", updatedAt: "2026-05-16T10:00:00.000Z",
    statusHistory: [
      { from: "pending-details", to: "under-review", timestamp: "2026-05-15T09:00:00.000Z" },
      { from: "under-review",    to: "invoicing",    timestamp: "2026-05-16T10:00:00.000Z" },
    ],
  }),
  // BBG — Self-Generated: Layla Nasser (RM 60%) + Omar Sheikh (TL 5%)
  // Gross 30,000 AED | Huspy margin: 35% = 10,500
  expand({
    id: "deal-025", offerId: "offer-025",
    status: "invoicing",
    businessUnit: "mortgage", channel: "BBG",
    market: "primary", country: "ae", currency: "AED",
    dealAmount: 1_500_000, commissionPercentage: 2,
    reportDate: "2026-05-18",
    createdAt: "2026-05-18T00:00:00.000Z", updatedAt: "2026-05-19T11:00:00.000Z",
    statusHistory: [
      { from: "pending-details", to: "under-review", timestamp: "2026-05-18T09:00:00.000Z" },
      { from: "under-review",    to: "invoicing",    timestamp: "2026-05-19T11:00:00.000Z" },
    ],
  }),
  expand({
    id: "deal-021", offerId: "offer-021",
    status: "finalized", businessUnit: "rebu", market: "primary", country: "es", currency: "EUR",
    dealAmount: 480000, reportDate: "2026-03-05",
    createdAt: "2026-03-05T00:00:00.000Z", updatedAt: "2026-03-20T15:00:00.000Z",
    commissionPercentage: 3,
    paymentDate: "2026-03-15",
    statusHistory: [
      { from: "pending-details",        to: "under-review",           timestamp: "2026-03-06T09:00:00.000Z" },
      { from: "under-review",           to: "pending-agent-approval", timestamp: "2026-03-08T14:00:00.000Z" },
      { from: "pending-agent-approval", to: "invoicing",    timestamp: "2026-03-10T09:00:00.000Z", note: "Invoice issued" },
      { from: "invoicing",    to: "finalized",              timestamp: "2026-03-15T15:00:00.000Z", note: "Payment confirmed" },
    ],
  }),
];
