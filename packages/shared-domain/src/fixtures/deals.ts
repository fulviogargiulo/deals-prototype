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

const CLIENT_ROLES = new Set<string>(["REVENUE_SOURCE"]);

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
  businessUnit?: Deal["businessUnit"];
  dealAmount: number;
  reportDate: string;
  createdAt: string;
  updatedAt: string;
  commissionPercentage: number;
  paymentDate?: string;
  channel?: string;
  conveyanceFee?: number;
  rebatePercentage?: number;
  subsidyAmount?: number;
  statusHistory?: Deal["statusHistory"];
}

function expand(b: BaseInput): Deal {
  const offer = findOffer(b.offerId);
  const huspyRevenue = Math.round(b.dealAmount * (b.commissionPercentage / 100));
  const businessUnit = b.businessUnit ?? "rebu";
  // rebateAmount and subsidyAmount are stored as reference fields on the deal.
  // The actual net amounts are already baked into each REVENUE_SOURCE stakeholder's financialAmount.
  const grossCommission = Math.round((b.commissionPercentage / 100) * b.dealAmount);
  const rebateAmount = b.rebatePercentage
    ? Math.round((b.rebatePercentage / 100) * grossCommission)
    : undefined;
  const blueprint = getBlueprint(b.country, businessUnit);

  // Primary agent display name (display cache only — full AgentEntry[] lives in Karvel enricher).
  const primaryAgentStake = sharedDealStakeholders.find((s) => s.dealId === b.id && s.role === "INTERNAL_PAYOUT" && s.isPrimary);
  const primaryAgent = primaryAgentStake ? sharedAgents.find((a) => a.partyId === primaryAgentStake.partyId) : undefined;
  const agentName = primaryAgent ? (agentDisplayName[primaryAgent.id] ?? primaryAgent.id) : "Unknown";

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
      amount: inv.amount,
      invoiceNumber: inv.invoiceNumber,
      invoiceStatus: inv.status,
      invoiceDate: inv.issueDate,
      paymentReceivedDate: inv.paidDate,
      paymentReceivedAmount: inv.paidDate ? inv.amount : undefined,
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
    buyerName: b.market !== "leasing" ? clientParty?.displayName : undefined,
    buyerEmail: b.market !== "leasing" ? clientParty?.email : undefined,
    buyerPhone: b.market !== "leasing" ? clientParty?.phone : undefined,
    paymentMode: "cash",
    dealPrice: b.dealAmount,
    takeRate: b.commissionPercentage,
    huspyRevenue,
    conveyanceRevenue: b.conveyanceFee ?? 0,
    receivables,
    rebatePercentage: b.rebatePercentage ?? 0,
    rebateAmount,
    subsidyAmount: b.market === "secondary" ? (b.subsidyAmount ?? 0) : 0,
    numberOfTranches: 0,
    disbursedAmount: 0,
    bankSlab: 0,
    brokerCommissionRate: 0,
    brokerPayout: 0,
    rmCommissionRate: 0,
    rmPayout: 0,
    tlCommissionRate: 0,
    tlPayout: 0,
    dsCommissionRate: 0,
    dsPayout: 0,
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
    status: "finalized", market: "primary", country: "es", currency: "EUR",
    dealAmount: 385000, reportDate: "2026-01-06",
    createdAt: "2026-01-06T09:00:00.000Z", updatedAt: "2026-01-12T14:30:00.000Z",
    commissionPercentage: 3, paymentDate: "2026-01-12",
    rebatePercentage: 1.5,
    statusHistory: [
      { from: "pending-details",         to: "under-review",            timestamp: "2026-01-07T10:00:00.000Z", note: "Ops review started" },
      { from: "under-review",            to: "pending-agent-approval",  timestamp: "2026-01-09T15:00:00.000Z", note: "Documents approved" },
      { from: "pending-agent-approval",  to: "pending-receivables",     timestamp: "2026-01-10T09:00:00.000Z", note: "Agent approved — invoice issued" },
      { from: "pending-receivables",     to: "finalized",               timestamp: "2026-01-12T14:30:00.000Z", note: "Payment confirmed" },
    ],
  }),
  expand({
    id: "deal-002", offerId: "offer-002",
    status: "pending-agent-approval", market: "secondary", country: "es", currency: "EUR",
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
    status: "pending-details", market: "leasing", country: "es", currency: "EUR",
    dealAmount: 14400, reportDate: "2026-02-22",
    createdAt: "2026-02-22T00:00:00.000Z", updatedAt: "2026-02-22T00:00:00.000Z",
    commissionPercentage: 8,
  }),
  expand({
    id: "deal-004", offerId: "offer-004",
    status: "pending-details", market: "secondary", country: "es", currency: "EUR",
    dealAmount: 1250000, reportDate: "2026-03-03",
    createdAt: "2026-03-03T00:00:00.000Z", updatedAt: "2026-03-03T00:00:00.000Z",
    commissionPercentage: 2,
    subsidyAmount: 6000,
  }),
  expand({
    id: "deal-005", offerId: "offer-005",
    status: "under-review", market: "primary", country: "sa", currency: "SAR",
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
    status: "pending-agent-approval", market: "secondary", country: "es", currency: "EUR",
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
    status: "under-review", market: "secondary", country: "es", currency: "EUR",
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
    status: "pending-receivables", market: "secondary", country: "es", currency: "EUR",
    dealAmount: 580000, reportDate: "2026-03-03",
    createdAt: "2026-03-03T00:00:00.000Z", updatedAt: "2026-03-05T10:00:00.000Z",
    commissionPercentage: 2.5,
    subsidyAmount: 5000,
    statusHistory: [
      { from: "pending-details",        to: "under-review",           timestamp: "2026-03-04T10:00:00.000Z" },
      { from: "under-review",           to: "pending-agent-approval", timestamp: "2026-03-04T16:00:00.000Z" },
      { from: "pending-agent-approval", to: "pending-receivables",    timestamp: "2026-03-05T10:00:00.000Z", note: "Invoice issued" },
    ],
  }),
  expand({
    id: "deal-009", offerId: "offer-009",
    status: "under-review", market: "primary", country: "ae", currency: "AED",
    dealAmount: 1850000, reportDate: "2026-05-01",
    createdAt: "2026-05-01T00:00:00.000Z", updatedAt: "2026-05-03T09:00:00.000Z",
    commissionPercentage: 2,
    channel: "B2C/Digital",
    rebatePercentage: 2.0,
    statusHistory: [
      { from: "pending-details", to: "under-review", timestamp: "2026-05-03T09:00:00.000Z" },
    ],
  }),
  expand({
    id: "deal-010", offerId: "offer-010",
    status: "canceled", market: "secondary", country: "ae", currency: "AED",
    dealAmount: 4200000, reportDate: "2026-03-18",
    createdAt: "2026-03-18T00:00:00.000Z", updatedAt: "2026-03-25T11:00:00.000Z",
    commissionPercentage: 2,
    channel: "REA",
    statusHistory: [
      { from: "pending-details", to: "under-review", timestamp: "2026-03-20T09:00:00.000Z" },
      { from: "under-review",    to: "canceled",     timestamp: "2026-03-25T11:00:00.000Z", note: "Client withdrew" },
    ],
  }),
  expand({
    id: "deal-011", offerId: "offer-011",
    status: "pending-details", market: "primary", country: "ae", currency: "AED",
    businessUnit: "mortgage",
    dealAmount: 1400000, reportDate: "2026-04-20",
    createdAt: "2026-04-20T00:00:00.000Z", updatedAt: "2026-04-20T00:00:00.000Z",
    commissionPercentage: 0.5,
    channel: "MA/Broker",
  }),
  expand({
    id: "deal-012", offerId: "offer-012",
    status: "under-review", market: "secondary", country: "ae", currency: "AED",
    businessUnit: "mortgage",
    dealAmount: 3200000, reportDate: "2026-04-28",
    createdAt: "2026-04-28T00:00:00.000Z", updatedAt: "2026-04-30T09:00:00.000Z",
    commissionPercentage: 0.5,
    channel: "B2C/Digital",
    statusHistory: [
      { from: "pending-details", to: "under-review", timestamp: "2026-04-30T09:00:00.000Z" },
    ],
  }),
  expand({
    id: "deal-013", offerId: "offer-013",
    status: "pending-agent-approval", market: "secondary", country: "es", currency: "EUR",
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
    status: "pending-receivables", market: "secondary", country: "es", currency: "EUR",
    businessUnit: "mortgage",
    dealAmount: 496000, reportDate: "2026-04-10",
    createdAt: "2026-04-10T00:00:00.000Z", updatedAt: "2026-04-15T10:00:00.000Z",
    commissionPercentage: 0.5,
    statusHistory: [
      { from: "pending-details",        to: "under-review",           timestamp: "2026-04-11T09:00:00.000Z" },
      { from: "under-review",           to: "pending-agent-approval", timestamp: "2026-04-13T15:00:00.000Z" },
      { from: "pending-agent-approval", to: "pending-receivables",    timestamp: "2026-04-15T10:00:00.000Z", note: "Invoice issued" },
    ],
  }),
  expand({
    id: "deal-015", offerId: "offer-015",
    status: "pending-receivables", market: "primary", country: "sa", currency: "SAR",
    businessUnit: "mortgage",
    dealAmount: 920000, reportDate: "2026-04-28",
    createdAt: "2026-04-28T00:00:00.000Z", updatedAt: "2026-05-02T09:00:00.000Z",
    commissionPercentage: 0.5,
    statusHistory: [
      { from: "pending-details",        to: "under-review",           timestamp: "2026-04-29T09:00:00.000Z" },
      { from: "under-review",           to: "pending-agent-approval", timestamp: "2026-05-01T14:00:00.000Z" },
      { from: "pending-agent-approval", to: "pending-receivables",    timestamp: "2026-05-02T09:00:00.000Z", note: "Invoice issued" },
    ],
  }),
  expand({
    id: "deal-016", offerId: "offer-016",
    status: "finalized", market: "primary", country: "ae", currency: "AED",
    dealAmount: 2100000, reportDate: "2026-05-01",
    createdAt: "2026-05-01T00:00:00.000Z", updatedAt: "2026-05-05T11:00:00.000Z",
    commissionPercentage: 2, paymentDate: "2026-05-04",
    channel: "REA",
    rebatePercentage: 1.5,
    statusHistory: [
      { from: "pending-details",        to: "under-review",           timestamp: "2026-05-02T09:00:00.000Z" },
      { from: "under-review",           to: "pending-agent-approval", timestamp: "2026-05-03T15:00:00.000Z" },
      { from: "pending-agent-approval", to: "pending-receivables",    timestamp: "2026-05-04T09:00:00.000Z", note: "Invoices issued" },
      { from: "pending-receivables",    to: "finalized",              timestamp: "2026-05-05T11:00:00.000Z", note: "All payments received" },
    ],
  }),
  expand({
    id: "deal-017", offerId: "offer-017",
    status: "under-review", market: "primary", country: "es", currency: "EUR",
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
    status: "finalized", market: "secondary", country: "es", currency: "EUR",
    dealAmount: 1250000, reportDate: "2026-04-12",
    createdAt: "2026-04-12T00:00:00.000Z", updatedAt: "2026-04-22T15:30:00.000Z",
    commissionPercentage: 2.5,
    subsidyAmount: 7000,
    statusHistory: [
      { from: "pending-details",        to: "under-review",           timestamp: "2026-04-13T09:00:00.000Z" },
      { from: "under-review",           to: "pending-agent-approval", timestamp: "2026-04-14T15:00:00.000Z" },
      { from: "pending-agent-approval", to: "pending-receivables",    timestamp: "2026-04-15T09:00:00.000Z", note: "Invoice issued" },
      { from: "pending-receivables",    to: "finalized",              timestamp: "2026-04-22T15:30:00.000Z", note: "Payment confirmed" },
    ],
  }),
  expand({
    id: "deal-019", offerId: "offer-019",
    status: "canceled", market: "secondary", country: "es", currency: "EUR",
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
    status: "finalized", market: "primary", country: "ae", currency: "AED",
    dealAmount: 1200000, reportDate: "2026-05-12",
    createdAt: "2026-05-12T00:00:00.000Z", updatedAt: "2026-05-17T14:00:00.000Z",
    commissionPercentage: 2,
    channel: "REA",
    paymentDate: "2026-05-17",
    statusHistory: [
      { from: "pending-details",        to: "under-review",           timestamp: "2026-05-12T10:00:00.000Z" },
      { from: "under-review",           to: "pending-agent-approval", timestamp: "2026-05-13T14:00:00.000Z" },
      { from: "pending-agent-approval", to: "pending-receivables",    timestamp: "2026-05-14T09:00:00.000Z", note: "Invoice issued to Emaar" },
      { from: "pending-receivables",    to: "finalized",              timestamp: "2026-05-17T14:00:00.000Z", note: "Emaar payment received" },
    ],
  }),
];
