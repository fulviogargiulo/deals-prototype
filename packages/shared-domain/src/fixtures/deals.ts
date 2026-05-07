import type { Deal, AgentEntry } from "../entities";
import { sharedClients } from "./clients";
import { sharedParties } from "./parties";
import { sharedOpportunities } from "./opportunities";
import { sharedDealStakeholders } from "./dealStakeholders";
import { sharedAgents } from "./agents";
import { computeDealFinancials, COMMISSION_RATES } from "../commissionCalc";

const agentDisplayName: Record<string, string> = {
  "agent-felicia": "Felicia Canovas",
  "agent-guilherme": "Guilherme Castro",
  "agent-omar": "Omar Al Saleem",
  "agent-gelo": "Gelo Huspy",
  "agent-ravi": "Ravi Nair",
  "agent-zainab": "Zainab Al-Qadi",
};

const CLIENT_ROLES = new Set(["buyer", "seller", "tenant", "landlord", "borrower"]);

function findOpp(id: string) {
  return sharedOpportunities.find((o) => o.id === id);
}

interface BaseInput {
  id: string;
  opportunityId: string;
  type: Deal["type"];
  status: Deal["status"];
  market: Deal["market"];
  country: Deal["country"];
  currency: Deal["currency"];
  businessUnit?: Deal["businessUnit"];
  dealAmount: number;
  reportDate: string;
  createdAt: string;
  updatedAt: string;
  isDisputed?: boolean;
  commissionPercentage: number;
  paymentDate?: string;
}

function expand(b: BaseInput): Deal {
  const opp = findOpp(b.opportunityId);
  const f = computeDealFinancials(b.dealAmount);

  // Derive agents from DealStakeholders — supports multi-agent splits.
  const agentStakes = sharedDealStakeholders.filter((s) => s.dealId === b.id && s.role === "agent");
  const agentEntries: AgentEntry[] = agentStakes.map((stake) => {
    const agent = sharedAgents.find((a) => a.partyId === stake.partyId);
    const name = agent ? (agentDisplayName[agent.id] ?? agent.id) : stake.partyId;
    const split = (stake.splitPercentage ?? 100) / 100;
    return {
      agentName: name,
      agentShare: stake.splitPercentage ?? 100,
      agentCommissionRate: COMMISSION_RATES.agentGrossRate,
      agentCommissionPayout: Math.round(f.agentCommissionPayout * split),
      agentIncentive: 0,
      agentDeductions: 0,
      agentTotalAmount: Math.round(f.agentCommissionPayout * split),
      teamLeadRate: COMMISSION_RATES.teamLeadRate,
      teamLeadShare: Math.round(f.teamLeadShare * split),
      managerOverrideRate: COMMISSION_RATES.managerOverrideRate,
      managerOverride: Math.round(f.managerOverride * split),
      referralPercentage: 0,
      referralAmount: 0,
      clientKickback: 0,
    };
  });
  const primaryAgentStake = agentStakes[0];
  const primaryAgent = primaryAgentStake ? sharedAgents.find((a) => a.partyId === primaryAgentStake.partyId) : undefined;
  const agentName = primaryAgent ? (agentDisplayName[primaryAgent.id] ?? primaryAgent.id) : "Unknown";
  const primaryEntry = agentEntries[0];

  // Derive client from DealStakeholders, then resolve Party for canonical contact info.
  const clientStake = sharedDealStakeholders.find((s) => s.dealId === b.id && CLIENT_ROLES.has(s.role));
  const client = clientStake ? sharedClients.find((c) => c.partyId === clientStake.partyId) : undefined;
  const clientParty = client ? sharedParties.find((p) => p.id === client.partyId) : undefined;

  return {
    // Canonical core
    id: b.id,
    opportunityId: b.opportunityId,
    type: b.type,
    status: b.status,
    market: b.market,
    businessUnit: b.businessUnit ?? "rebu",
    country: b.country,
    currency: b.currency,
    dealAmount: b.dealAmount,
    reportDate: b.reportDate,
    createdAt: b.createdAt,
    updatedAt: b.updatedAt,

    // Display caches — derived from DealStakeholder chain, not embedded FKs
    clientName: clientParty?.displayName ?? "Unknown",
    agentName,
    opportunityName: opp?.title ?? "Unknown",
    title: opp?.title ?? b.id,

    // Karvel — operational P&L
    ofCaseNumber: `OF-${b.id.toUpperCase()}`,
    buildingName: opp?.title,
    community: opp?.neighborhoods[0],
    propertyType: opp?.propertyTypes?.[0],
    buyerName: b.type === "buy" || b.type === "buy-sell" ? clientParty?.displayName : undefined,
    buyerEmail: b.type === "buy" || b.type === "buy-sell" ? clientParty?.email : undefined,
    buyerPhone: b.type === "buy" || b.type === "buy-sell" ? clientParty?.phone : undefined,
    sellerName: b.type === "sell" || b.type === "buy-sell" ? clientParty?.displayName : undefined,
    sellerEmail: b.type === "sell" || b.type === "buy-sell" ? clientParty?.email : undefined,
    paymentMode: "cash",
    dealPrice: b.dealAmount,
    takeRate: COMMISSION_RATES.takeRate,
    huspyRevenue: f.huspyRevenue,
    netHuspyRevenue: f.netHuspyRevenue,
    conveyanceRevenue: f.conveyanceRevenue,
    agents: agentEntries,
    // Top-level agent fields reflect the full pool (sum of all agent stakes = 100%).
    agentShare: 100,
    agentCommissionRate: COMMISSION_RATES.agentGrossRate,
    agentCommissionPayout: f.agentCommissionPayout,
    teamLeadRate: COMMISSION_RATES.teamLeadRate,
    teamLeadShare: primaryEntry?.teamLeadShare ?? f.teamLeadShare,
    managerOverrideRate: COMMISSION_RATES.managerOverrideRate,
    managerOverride: primaryEntry?.managerOverride ?? f.managerOverride,
    conveyanceAgentRate: COMMISSION_RATES.conveyanceAgentRate,
    conveyanceAgentPayout: f.conveyanceAgentPayout,
    huspyConveyanceShare: f.huspyConveyanceShare,
    clientKickback: 0,
    referralPercentage: 0,
    referralAmount: 0,
    rebatePercentage: 0,
    rebateAmount: 0,
    subsidyAmount: 0,
    cogsInternal: f.cogsInternal,
    cogsExternal: 0,
    cogsReferrals: 0,
    cogsRebates: 0,
    cogsSubsidy: 0,
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
    externalPartners: [],
    externalPartnerShare: 0,
    receivables: [],
    payables: [],
    isDisputed: b.isDisputed ?? false,

    // Agent-app — agent-facing.
    // commissionAmount = total agent commission pool for the deal (before any split).
    // Each agent's personal share is computed via computeAgentCommission + DealStakeholder.
    marketType: b.market,
    commissionPercentage: b.commissionPercentage,
    commissionAmount: f.agentCommissionPayout,
    paymentDate: b.paymentDate,
  };
}

export const sharedDeals: Deal[] = [
  expand({
    id: "deal-001", opportunityId: "opp-001",
    type: "buy", status: "finalized", market: "primary", country: "es", currency: "EUR",
    dealAmount: 385000, reportDate: "2026-01-15",
    createdAt: "2026-01-15T00:00:00.000Z", updatedAt: "2026-01-12T00:00:00.000Z",
    commissionPercentage: 3, paymentDate: "2026-01-12",
  }),
  expand({
    id: "deal-002", opportunityId: "opp-002",
    type: "sell", status: "pending-agent-approval", market: "secondary", country: "es", currency: "EUR",
    dealAmount: 720000, reportDate: "2026-02-08",
    createdAt: "2026-02-08T00:00:00.000Z", updatedAt: "2026-02-08T00:00:00.000Z",
    commissionPercentage: 2.5,
  }),
  expand({
    id: "deal-003", opportunityId: "opp-003",
    type: "rent", status: "pending-details", market: "leasing", country: "es", currency: "EUR",
    dealAmount: 14400, reportDate: "2026-02-22",
    createdAt: "2026-02-22T00:00:00.000Z", updatedAt: "2026-02-22T00:00:00.000Z",
    commissionPercentage: 8,
  }),
  expand({
    id: "deal-004", opportunityId: "opp-004",
    type: "buy", status: "pending-details", market: "secondary", country: "es", currency: "EUR",
    dealAmount: 1250000, reportDate: "2026-03-03",
    createdAt: "2026-03-03T00:00:00.000Z", updatedAt: "2026-03-03T00:00:00.000Z",
    commissionPercentage: 2,
  }),
  expand({
    id: "deal-005", opportunityId: "opp-005",
    type: "buy", status: "under-review", market: "primary", country: "sa", currency: "SAR",
    dealAmount: 540000, reportDate: "2026-02-15",
    createdAt: "2026-02-15T00:00:00.000Z", updatedAt: "2026-02-15T00:00:00.000Z",
    commissionPercentage: 2.5,
  }),
  expand({
    id: "deal-006", opportunityId: "opp-006",
    type: "sell", status: "pending-agent-approval", market: "secondary", country: "es", currency: "EUR",
    dealAmount: 320000, reportDate: "2026-02-20",
    createdAt: "2026-02-20T00:00:00.000Z", updatedAt: "2026-02-20T00:00:00.000Z",
    commissionPercentage: 3,
  }),
  expand({
    id: "deal-007", opportunityId: "opp-001",
    type: "buy", status: "under-review", market: "secondary", country: "es", currency: "EUR",
    dealAmount: 475000, reportDate: "2026-03-05",
    createdAt: "2026-03-05T00:00:00.000Z", updatedAt: "2026-03-05T00:00:00.000Z",
    commissionPercentage: 2.5,
    isDisputed: true,
  }),
  expand({
    id: "deal-008", opportunityId: "opp-002",
    type: "sell", status: "pending-receivables", market: "secondary", country: "es", currency: "EUR",
    dealAmount: 580000, reportDate: "2026-03-03",
    createdAt: "2026-03-03T00:00:00.000Z", updatedAt: "2026-03-03T00:00:00.000Z",
    commissionPercentage: 2.5,
  }),
  expand({
    id: "deal-009", opportunityId: "opp-007",
    type: "buy", status: "reported", market: "primary", country: "ae", currency: "AED",
    dealAmount: 1850000, reportDate: "2026-05-01",
    createdAt: "2026-05-01T00:00:00.000Z", updatedAt: "2026-05-01T00:00:00.000Z",
    commissionPercentage: 2,
  }),
  expand({
    id: "deal-010", opportunityId: "opp-008",
    type: "buy", status: "canceled", market: "secondary", country: "ae", currency: "AED",
    dealAmount: 4200000, reportDate: "2026-03-18",
    createdAt: "2026-03-18T00:00:00.000Z", updatedAt: "2026-03-18T00:00:00.000Z",
    commissionPercentage: 2,
  }),
  expand({
    id: "deal-011", opportunityId: "opp-009",
    type: "mortgage", status: "pending-details", market: "primary", country: "ae", currency: "AED",
    businessUnit: "mortgage",
    dealAmount: 1400000, reportDate: "2026-04-20",
    createdAt: "2026-04-20T00:00:00.000Z", updatedAt: "2026-04-20T00:00:00.000Z",
    commissionPercentage: 0.5,
  }),
  expand({
    id: "deal-012", opportunityId: "opp-010",
    type: "mortgage", status: "under-review", market: "secondary", country: "ae", currency: "AED",
    businessUnit: "mortgage",
    dealAmount: 3200000, reportDate: "2026-04-28",
    createdAt: "2026-04-28T00:00:00.000Z", updatedAt: "2026-04-28T00:00:00.000Z",
    commissionPercentage: 0.5,
  }),
  expand({
    id: "deal-013", opportunityId: "opp-011",
    type: "buy", status: "pending-agent-approval", market: "secondary", country: "es", currency: "EUR",
    dealAmount: 620000, reportDate: "2026-04-10",
    createdAt: "2026-04-10T00:00:00.000Z", updatedAt: "2026-04-10T00:00:00.000Z",
    commissionPercentage: 3,
  }),
  expand({
    id: "deal-014", opportunityId: "opp-011",
    type: "mortgage", status: "pending-receivables", market: "secondary", country: "es", currency: "EUR",
    businessUnit: "mortgage",
    dealAmount: 496000, reportDate: "2026-04-15",
    createdAt: "2026-04-15T00:00:00.000Z", updatedAt: "2026-04-15T00:00:00.000Z",
    commissionPercentage: 0.5,
  }),
  expand({
    id: "deal-015", opportunityId: "opp-012",
    type: "mortgage", status: "pending-receivables", market: "primary", country: "sa", currency: "SAR",
    businessUnit: "mortgage",
    dealAmount: 920000, reportDate: "2026-05-02",
    createdAt: "2026-05-02T00:00:00.000Z", updatedAt: "2026-05-02T00:00:00.000Z",
    commissionPercentage: 0.5,
  }),
  expand({
    id: "deal-016", opportunityId: "opp-007",
    type: "sell", status: "finalized", market: "primary", country: "ae", currency: "AED",
    dealAmount: 2100000, reportDate: "2026-05-04",
    createdAt: "2026-05-04T00:00:00.000Z", updatedAt: "2026-05-04T00:00:00.000Z",
    commissionPercentage: 2, paymentDate: "2026-05-04",
  }),
  expand({
    id: "deal-017", opportunityId: "opp-013",
    type: "buy", status: "under-review", market: "primary", country: "es", currency: "EUR",
    dealAmount: 530000, reportDate: "2026-04-28",
    createdAt: "2026-04-28T00:00:00.000Z", updatedAt: "2026-04-28T00:00:00.000Z",
    commissionPercentage: 3,
  }),
  expand({
    id: "deal-018", opportunityId: "opp-004",
    type: "buy", status: "finalized", market: "secondary", country: "es", currency: "EUR",
    dealAmount: 1250000, reportDate: "2026-04-15",
    createdAt: "2026-04-15T00:00:00.000Z", updatedAt: "2026-04-15T00:00:00.000Z",
    commissionPercentage: 2.5,
  }),
  expand({
    id: "deal-019", opportunityId: "opp-003",
    type: "buy", status: "canceled", market: "secondary", country: "es", currency: "EUR",
    dealAmount: 260000, reportDate: "2026-03-20",
    createdAt: "2026-03-20T00:00:00.000Z", updatedAt: "2026-04-05T00:00:00.000Z",
    commissionPercentage: 2,
  }),
];
