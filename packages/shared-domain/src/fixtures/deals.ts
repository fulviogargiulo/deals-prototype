import type { Deal, ReceivableEntry, ReceivableEntityType } from "../entities";
import { sharedClients } from "./clients";
import { sharedParties } from "./parties";
import { sharedOpportunities } from "./opportunities";
import { sharedDealStakeholders } from "./dealStakeholders";
import { sharedAgents } from "./agents";
import { sharedInvoices } from "./invoices";
import { computeDealFinancials, COMMISSION_RATES } from "../commissionCalc";
import { getBlueprint } from "../blueprints";

const agentDisplayName: Record<string, string> = {
  "agent-felicia": "Felicia Canovas",
  "agent-guilherme": "Guilherme Castro",
  "agent-omar": "Omar Al Saleem",
  "agent-gelo": "Gelo Huspy",
  "agent-ravi": "Ravi Nair",
  "agent-zainab": "Zainab Al-Qadi",
};

const CLIENT_ROLES = new Set<string>(["REVENUE_SOURCE"]);

function findOpp(id: string) {
  return sharedOpportunities.find((o) => o.id === id);
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
  opportunityId: string;
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
}

function expand(b: BaseInput): Deal {
  const opp = findOpp(b.opportunityId);
  const f = computeDealFinancials(b.dealAmount, b.conveyanceFee ?? 0, { takeRate: b.commissionPercentage });
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

  // Derive receivables from inbound invoices linked to this deal.
  const dealInvoices = sharedInvoices.filter((i) => i.dealId === b.id && i.direction === "inbound");
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

  return {
    // Canonical core
    id: b.id,
    opportunityId: b.opportunityId,
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
    grossRevenue: f.huspyRevenue,
    blueprintId: blueprint.id,

    // Display caches — derived from DealStakeholder chain, not embedded FKs
    clientName: clientParty?.displayName ?? "Unknown",
    agentName,
    opportunityName: opp?.title ?? "Unknown",
    title: opp?.title ?? b.id,

    // Karvel — operational
    channel: b.channel,
    ofCaseNumber: `OF-${b.id.toUpperCase()}`,
    buildingName: opp?.title,
    community: opp?.neighborhoods[0],
    propertyType: opp?.propertyTypes?.[0],
    buyerName: b.market !== "leasing" ? clientParty?.displayName : undefined,
    buyerEmail: b.market !== "leasing" ? clientParty?.email : undefined,
    buyerPhone: b.market !== "leasing" ? clientParty?.phone : undefined,
    paymentMode: "cash",
    dealPrice: b.dealAmount,
    takeRate: COMMISSION_RATES.takeRate,
    huspyRevenue: f.huspyRevenue,
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
    commissionAmount: Math.round((f.huspyRevenue - (b.subsidyAmount ?? 0)) * (COMMISSION_RATES.agentGrossRate / 100)),
    paymentDate: b.paymentDate,
  };
}

export const sharedDeals: Deal[] = [
  expand({
    id: "deal-001", opportunityId: "opp-001",
    status: "finalized", market: "primary", country: "es", currency: "EUR",
    dealAmount: 385000, reportDate: "2026-01-15",
    createdAt: "2026-01-15T00:00:00.000Z", updatedAt: "2026-01-12T00:00:00.000Z",
    commissionPercentage: 3, paymentDate: "2026-01-12",
    rebatePercentage: 1.5,
  }),
  expand({
    id: "deal-002", opportunityId: "opp-002",
    status: "pending-agent-approval", market: "secondary", country: "es", currency: "EUR",
    dealAmount: 720000, reportDate: "2026-02-08",
    createdAt: "2026-02-08T00:00:00.000Z", updatedAt: "2026-02-08T00:00:00.000Z",
    commissionPercentage: 2.5,
    subsidyAmount: 4000,
  }),
  expand({
    id: "deal-003", opportunityId: "opp-003",
    status: "pending-details", market: "leasing", country: "es", currency: "EUR",
    dealAmount: 14400, reportDate: "2026-02-22",
    createdAt: "2026-02-22T00:00:00.000Z", updatedAt: "2026-02-22T00:00:00.000Z",
    commissionPercentage: 8,
  }),
  expand({
    id: "deal-004", opportunityId: "opp-004",
    status: "pending-details", market: "secondary", country: "es", currency: "EUR",
    dealAmount: 1250000, reportDate: "2026-03-03",
    createdAt: "2026-03-03T00:00:00.000Z", updatedAt: "2026-03-03T00:00:00.000Z",
    commissionPercentage: 2,
    subsidyAmount: 6000,
  }),
  expand({
    id: "deal-005", opportunityId: "opp-005",
    status: "under-review", market: "primary", country: "sa", currency: "SAR",
    dealAmount: 540000, reportDate: "2026-02-15",
    createdAt: "2026-02-15T00:00:00.000Z", updatedAt: "2026-02-15T00:00:00.000Z",
    commissionPercentage: 2.5,
    rebatePercentage: 2.0,
  }),
  expand({
    id: "deal-006", opportunityId: "opp-006",
    status: "pending-agent-approval", market: "secondary", country: "es", currency: "EUR",
    dealAmount: 320000, reportDate: "2026-02-20",
    createdAt: "2026-02-20T00:00:00.000Z", updatedAt: "2026-02-20T00:00:00.000Z",
    commissionPercentage: 3,
    subsidyAmount: 2500,
  }),
  expand({
    id: "deal-007", opportunityId: "opp-001",
    status: "under-review", market: "secondary", country: "es", currency: "EUR",
    dealAmount: 475000, reportDate: "2026-03-05",
    createdAt: "2026-03-05T00:00:00.000Z", updatedAt: "2026-03-05T00:00:00.000Z",
    commissionPercentage: 2.5,
    subsidyAmount: 3000,
  }),
  expand({
    id: "deal-008", opportunityId: "opp-002",
    status: "pending-receivables", market: "secondary", country: "es", currency: "EUR",
    dealAmount: 580000, reportDate: "2026-03-03",
    createdAt: "2026-03-03T00:00:00.000Z", updatedAt: "2026-03-03T00:00:00.000Z",
    commissionPercentage: 2.5,
    subsidyAmount: 5000,
  }),
  expand({
    id: "deal-009", opportunityId: "opp-007",
    status: "under-review", market: "primary", country: "ae", currency: "AED",
    dealAmount: 1850000, reportDate: "2026-05-01",
    createdAt: "2026-05-01T00:00:00.000Z", updatedAt: "2026-05-01T00:00:00.000Z",
    commissionPercentage: 2,
    channel: "B2C/Digital",
    rebatePercentage: 2.0,
  }),
  expand({
    id: "deal-010", opportunityId: "opp-008",
    status: "canceled", market: "secondary", country: "ae", currency: "AED",
    dealAmount: 4200000, reportDate: "2026-03-18",
    createdAt: "2026-03-18T00:00:00.000Z", updatedAt: "2026-03-18T00:00:00.000Z",
    commissionPercentage: 2,
    channel: "REA",
  }),
  expand({
    id: "deal-011", opportunityId: "opp-009",
    status: "pending-details", market: "primary", country: "ae", currency: "AED",
    businessUnit: "mortgage",
    dealAmount: 1400000, reportDate: "2026-04-20",
    createdAt: "2026-04-20T00:00:00.000Z", updatedAt: "2026-04-20T00:00:00.000Z",
    commissionPercentage: 0.5,
    channel: "MA/Broker",
  }),
  expand({
    id: "deal-012", opportunityId: "opp-010",
    status: "under-review", market: "secondary", country: "ae", currency: "AED",
    businessUnit: "mortgage",
    dealAmount: 3200000, reportDate: "2026-04-28",
    createdAt: "2026-04-28T00:00:00.000Z", updatedAt: "2026-04-28T00:00:00.000Z",
    commissionPercentage: 0.5,
    channel: "B2C/Digital",
  }),
  expand({
    id: "deal-013", opportunityId: "opp-011",
    status: "pending-agent-approval", market: "secondary", country: "es", currency: "EUR",
    dealAmount: 620000, reportDate: "2026-04-10",
    createdAt: "2026-04-10T00:00:00.000Z", updatedAt: "2026-04-10T00:00:00.000Z",
    commissionPercentage: 3,
    subsidyAmount: 4500,
  }),
  expand({
    id: "deal-014", opportunityId: "opp-011",
    status: "pending-receivables", market: "secondary", country: "es", currency: "EUR",
    businessUnit: "mortgage",
    dealAmount: 496000, reportDate: "2026-04-15",
    createdAt: "2026-04-15T00:00:00.000Z", updatedAt: "2026-04-15T00:00:00.000Z",
    commissionPercentage: 0.5,
  }),
  expand({
    id: "deal-015", opportunityId: "opp-012",
    status: "pending-receivables", market: "primary", country: "sa", currency: "SAR",
    businessUnit: "mortgage",
    dealAmount: 920000, reportDate: "2026-05-02",
    createdAt: "2026-05-02T00:00:00.000Z", updatedAt: "2026-05-02T00:00:00.000Z",
    commissionPercentage: 0.5,
  }),
  expand({
    id: "deal-016", opportunityId: "opp-007",
    status: "finalized", market: "primary", country: "ae", currency: "AED",
    dealAmount: 2100000, reportDate: "2026-05-04",
    createdAt: "2026-05-04T00:00:00.000Z", updatedAt: "2026-05-04T00:00:00.000Z",
    commissionPercentage: 2, paymentDate: "2026-05-04",
    channel: "REA",
    rebatePercentage: 1.5,
  }),
  expand({
    id: "deal-017", opportunityId: "opp-013",
    status: "under-review", market: "primary", country: "es", currency: "EUR",
    dealAmount: 530000, reportDate: "2026-04-28",
    createdAt: "2026-04-28T00:00:00.000Z", updatedAt: "2026-04-28T00:00:00.000Z",
    commissionPercentage: 3,
    rebatePercentage: 1.5,
  }),
  expand({
    id: "deal-018", opportunityId: "opp-004",
    status: "finalized", market: "secondary", country: "es", currency: "EUR",
    dealAmount: 1250000, reportDate: "2026-04-15",
    createdAt: "2026-04-15T00:00:00.000Z", updatedAt: "2026-04-15T00:00:00.000Z",
    commissionPercentage: 2.5,
    subsidyAmount: 7000,
  }),
  expand({
    id: "deal-019", opportunityId: "opp-003",
    status: "canceled", market: "secondary", country: "es", currency: "EUR",
    dealAmount: 260000, reportDate: "2026-03-20",
    createdAt: "2026-03-20T00:00:00.000Z", updatedAt: "2026-04-05T00:00:00.000Z",
    commissionPercentage: 2,
  }),
];
