import type { Deal, AgentEntry } from "../entities";
import { sharedClients } from "./clients";
import { sharedOpportunities } from "./opportunities";
import { computeDealFinancials, COMMISSION_RATES } from "../commissionCalc";

const agentDisplayName: Record<string, string> = {
  "agent-felicia": "Felicia Canovas",
  "agent-guilherme": "Guilherme Castro",
  "agent-omar": "Omar Al Saleem",
  "agent-gelo": "Gelo Huspy",
  "agent-ravi": "Ravi Nair",
  "agent-zainab": "Zainab Al-Qadi",
};

function findClient(id?: string) {
  return id ? sharedClients.find((c) => c.id === id) : undefined;
}

function findOpp(id?: string) {
  return id ? sharedOpportunities.find((o) => o.id === id) : undefined;
}

function makeAgent(name: string, f: ReturnType<typeof computeDealFinancials>): AgentEntry {
  return {
    agentName: name,
    agentShare: 100,
    agentCommissionRate: COMMISSION_RATES.agentGrossRate,
    agentCommissionPayout: f.agentCommissionPayout,
    agentIncentive: 0,
    agentDeductions: 0,
    agentTotalAmount: f.agentCommissionPayout,
    teamLeadRate: COMMISSION_RATES.teamLeadRate,
    teamLeadShare: f.teamLeadShare,
    managerOverrideRate: COMMISSION_RATES.managerOverrideRate,
    managerOverride: f.managerOverride,
    referralPercentage: 0,
    referralAmount: 0,
    clientKickback: 0,
  };
}

interface BaseInput {
  id: string;
  opportunityId: string;
  clientId: string;
  agentId: string;
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
  // Agent-app: the commission rate shown to the agent on this deal (informational).
  // commissionAmount is always derived as agentCommissionPayout from computeDealFinancials.
  commissionPercentage: number;
  invoiceNumber?: string;
  invoiceDueDate?: string;
  paymentDate?: string;
}

function expand(b: BaseInput): Deal {
  const client = findClient(b.clientId);
  const opp = findOpp(b.opportunityId);
  const agentName = agentDisplayName[b.agentId] ?? b.agentId;
  const f = computeDealFinancials(b.dealAmount);

  return {
    // Canonical core
    id: b.id,
    opportunityId: b.opportunityId,
    clientId: b.clientId,
    agentId: b.agentId,
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

    // Display caches
    clientName: client?.fullName ?? "Unknown",
    agentName,
    opportunityName: opp?.title ?? "Unknown",
    title: opp?.title ?? b.id,

    // Karvel — operational P&L (all values from computeDealFinancials)
    ofCaseNumber: `OF-${b.id.toUpperCase()}`,
    buildingName: opp?.title,
    community: opp?.neighborhoods[0],
    propertyType: opp?.propertyTypes?.[0],
    buyerName: b.type === "buy" || b.type === "buy-sell" ? client?.fullName : undefined,
    buyerEmail: b.type === "buy" || b.type === "buy-sell" ? client?.email : undefined,
    buyerPhone: b.type === "buy" || b.type === "buy-sell" ? client?.phone : undefined,
    sellerName: b.type === "sell" || b.type === "buy-sell" ? client?.fullName : undefined,
    sellerEmail: b.type === "sell" || b.type === "buy-sell" ? client?.email : undefined,
    paymentMode: "cash",
    dealPrice: b.dealAmount,
    takeRate: COMMISSION_RATES.takeRate,
    huspyRevenue: f.huspyRevenue,
    netHuspyRevenue: f.netHuspyRevenue,
    conveyanceRevenue: f.conveyanceRevenue,
    agents: [makeAgent(agentName, f)],
    agentShare: 100,
    agentCommissionRate: COMMISSION_RATES.agentGrossRate,
    agentCommissionPayout: f.agentCommissionPayout,
    teamLeadRate: COMMISSION_RATES.teamLeadRate,
    teamLeadShare: f.teamLeadShare,
    managerOverrideRate: COMMISSION_RATES.managerOverrideRate,
    managerOverride: f.managerOverride,
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
    // commissionAmount = what the agent actually receives (agentCommissionPayout).
    // commissionPercentage is informational (the deal's agreed rate with the client).
    marketType: b.market,
    commissionPercentage: b.commissionPercentage,
    commissionAmount: f.agentCommissionPayout,
    invoiceNumber: b.invoiceNumber,
    invoiceDueDate: b.invoiceDueDate,
    paymentDate: b.paymentDate,
  };
}

// 8 records — same data visible in both apps.
export const sharedDeals: Deal[] = [
  expand({
    id: "deal-001", opportunityId: "opp-001", clientId: "client-001", agentId: "agent-felicia",
    type: "buy", status: "finalized", market: "primary", country: "es", currency: "EUR",
    dealAmount: 385000, reportDate: "2026-01-15",
    createdAt: "2026-01-15T00:00:00.000Z", updatedAt: "2026-01-12T00:00:00.000Z",
    commissionPercentage: 3, invoiceNumber: "INV-2026-001",
    invoiceDueDate: "2026-01-15", paymentDate: "2026-01-12",
  }),
  expand({
    id: "deal-002", opportunityId: "opp-002", clientId: "client-002", agentId: "agent-guilherme",
    type: "sell", status: "pending-agent-approval", market: "secondary", country: "es", currency: "EUR",
    dealAmount: 720000, reportDate: "2026-02-08",
    createdAt: "2026-02-08T00:00:00.000Z", updatedAt: "2026-02-08T00:00:00.000Z",
    commissionPercentage: 2.5,
  }),
  expand({
    id: "deal-003", opportunityId: "opp-003", clientId: "client-003", agentId: "agent-felicia",
    type: "rent", status: "pending-details", market: "leasing", country: "es", currency: "EUR",
    dealAmount: 14400, reportDate: "2026-02-22",
    createdAt: "2026-02-22T00:00:00.000Z", updatedAt: "2026-02-22T00:00:00.000Z",
    commissionPercentage: 8,
  }),
  expand({
    id: "deal-004", opportunityId: "opp-004", clientId: "client-004", agentId: "agent-guilherme",
    type: "buy", status: "pending-details", market: "secondary", country: "es", currency: "EUR",
    dealAmount: 1250000, reportDate: "2026-03-03",
    createdAt: "2026-03-03T00:00:00.000Z", updatedAt: "2026-03-03T00:00:00.000Z",
    commissionPercentage: 2,
  }),
  expand({
    id: "deal-005", opportunityId: "opp-005", clientId: "client-005", agentId: "agent-omar",
    type: "buy", status: "under-review", market: "primary", country: "sa", currency: "SAR",
    dealAmount: 540000, reportDate: "2026-02-15",
    createdAt: "2026-02-15T00:00:00.000Z", updatedAt: "2026-02-15T00:00:00.000Z",
    commissionPercentage: 2.5,
  }),
  expand({
    id: "deal-006", opportunityId: "opp-006", clientId: "client-006", agentId: "agent-felicia",
    type: "sell", status: "reported", market: "secondary", country: "es", currency: "EUR",
    dealAmount: 320000, reportDate: "2026-02-20",
    createdAt: "2026-02-20T00:00:00.000Z", updatedAt: "2026-02-20T00:00:00.000Z",
    commissionPercentage: 3,
  }),
  expand({
    id: "deal-007", opportunityId: "opp-001", clientId: "client-001", agentId: "agent-felicia",
    type: "buy", status: "pending-receivables", market: "secondary", country: "es", currency: "EUR",
    dealAmount: 475000, reportDate: "2026-03-05",
    createdAt: "2026-03-05T00:00:00.000Z", updatedAt: "2026-03-05T00:00:00.000Z",
    commissionPercentage: 2.5, invoiceNumber: "INV-2026-007",
    invoiceDueDate: "2026-03-15",
    isDisputed: true,
  }),
  expand({
    id: "deal-008", opportunityId: "opp-002", clientId: "client-002", agentId: "agent-guilherme",
    type: "sell", status: "pending-receivables", market: "secondary", country: "es", currency: "EUR",
    dealAmount: 580000, reportDate: "2026-03-03",
    createdAt: "2026-03-03T00:00:00.000Z", updatedAt: "2026-03-03T00:00:00.000Z",
    commissionPercentage: 2.5, invoiceNumber: "INV-2026-008",
    invoiceDueDate: "2026-03-30",
  }),
  // New deals — ae country, mortgage BU, and missing "canceled" status
  expand({
    id: "deal-009", opportunityId: "opp-007", clientId: "client-007", agentId: "agent-omar",
    type: "buy", status: "reported", market: "primary", country: "ae", currency: "AED",
    dealAmount: 1850000, reportDate: "2026-05-01",
    createdAt: "2026-05-01T00:00:00.000Z", updatedAt: "2026-05-01T00:00:00.000Z",
    commissionPercentage: 2,
  }),
  expand({
    id: "deal-010", opportunityId: "opp-008", clientId: "client-008", agentId: "agent-ravi",
    type: "buy", status: "canceled", market: "secondary", country: "ae", currency: "AED",
    dealAmount: 4200000, reportDate: "2026-03-18",
    createdAt: "2026-03-18T00:00:00.000Z", updatedAt: "2026-03-18T00:00:00.000Z",
    commissionPercentage: 2,
  }),
  expand({
    id: "deal-011", opportunityId: "opp-009", clientId: "client-007", agentId: "agent-zainab",
    type: "mortgage", status: "pending-details", market: "primary", country: "ae", currency: "AED",
    businessUnit: "mortgage",
    dealAmount: 1400000, reportDate: "2026-04-20",
    createdAt: "2026-04-20T00:00:00.000Z", updatedAt: "2026-04-20T00:00:00.000Z",
    commissionPercentage: 0.5,
  }),
  expand({
    id: "deal-012", opportunityId: "opp-010", clientId: "client-008", agentId: "agent-ravi",
    type: "mortgage", status: "under-review", market: "secondary", country: "ae", currency: "AED",
    businessUnit: "mortgage",
    dealAmount: 3200000, reportDate: "2026-04-28",
    createdAt: "2026-04-28T00:00:00.000Z", updatedAt: "2026-04-28T00:00:00.000Z",
    commissionPercentage: 0.5,
  }),
  expand({
    id: "deal-013", opportunityId: "opp-011", clientId: "client-009", agentId: "agent-gelo",
    type: "buy", status: "pending-agent-approval", market: "secondary", country: "es", currency: "EUR",
    dealAmount: 620000, reportDate: "2026-04-10",
    createdAt: "2026-04-10T00:00:00.000Z", updatedAt: "2026-04-10T00:00:00.000Z",
    commissionPercentage: 3,
  }),
  expand({
    id: "deal-014", opportunityId: "opp-011", clientId: "client-009", agentId: "agent-felicia",
    type: "mortgage", status: "pending-receivables", market: "secondary", country: "es", currency: "EUR",
    businessUnit: "mortgage",
    dealAmount: 496000, reportDate: "2026-04-15",
    createdAt: "2026-04-15T00:00:00.000Z", updatedAt: "2026-04-15T00:00:00.000Z",
    commissionPercentage: 0.5, invoiceNumber: "INV-2026-014",
    invoiceDueDate: "2026-04-30",
  }),
  expand({
    id: "deal-015", opportunityId: "opp-012", clientId: "client-010", agentId: "agent-omar",
    type: "mortgage", status: "pending-receivables", market: "primary", country: "sa", currency: "SAR",
    businessUnit: "mortgage",
    dealAmount: 920000, reportDate: "2026-05-02",
    createdAt: "2026-05-02T00:00:00.000Z", updatedAt: "2026-05-02T00:00:00.000Z",
    commissionPercentage: 0.5, invoiceNumber: "INV-2026-015",
    invoiceDueDate: "2026-05-20",
  }),
  expand({
    id: "deal-016", opportunityId: "opp-007", clientId: "client-007", agentId: "agent-ravi",
    type: "sell", status: "finalized", market: "primary", country: "ae", currency: "AED",
    dealAmount: 2100000, reportDate: "2026-05-04",
    createdAt: "2026-05-04T00:00:00.000Z", updatedAt: "2026-05-04T00:00:00.000Z",
    commissionPercentage: 2, invoiceNumber: "INV-2026-016",
    invoiceDueDate: "2026-05-15", paymentDate: "2026-05-04",
  }),
  // agent-felicia — additional deals to cover all pipeline statuses in agent-app
  expand({
    id: "deal-017", opportunityId: "opp-013", clientId: "client-002", agentId: "agent-felicia",
    type: "buy", status: "under-review", market: "primary", country: "es", currency: "EUR",
    dealAmount: 530000, reportDate: "2026-04-28",
    createdAt: "2026-04-28T00:00:00.000Z", updatedAt: "2026-04-28T00:00:00.000Z",
    commissionPercentage: 3,
  }),
  expand({
    id: "deal-018", opportunityId: "opp-004", clientId: "client-004", agentId: "agent-felicia",
    type: "buy", status: "pending-agent-approval", market: "secondary", country: "es", currency: "EUR",
    dealAmount: 1250000, reportDate: "2026-04-15",
    createdAt: "2026-04-15T00:00:00.000Z", updatedAt: "2026-04-15T00:00:00.000Z",
    commissionPercentage: 2.5,
  }),
  expand({
    id: "deal-019", opportunityId: "opp-003", clientId: "client-003", agentId: "agent-felicia",
    type: "buy", status: "canceled", market: "secondary", country: "es", currency: "EUR",
    dealAmount: 260000, reportDate: "2026-03-20",
    createdAt: "2026-03-20T00:00:00.000Z", updatedAt: "2026-04-05T00:00:00.000Z",
    commissionPercentage: 2,
  }),
];
