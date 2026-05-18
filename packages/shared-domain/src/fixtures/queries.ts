// Query helpers — stand-ins for what a real backend's query layer would do.
// Both apps can use these against the canonical fixtures.

import type { ClientWithOpportunities, DealStakeholder } from "../entities";
import { sharedClients } from "./clients";
import { sharedOpportunities } from "./opportunities";
import { sharedTasks } from "./tasks";
import { sharedDocuments } from "./documents";
import { sharedAgents } from "./agents";
import { sharedParties } from "./parties";
import { sharedInvoices } from "./invoices";
import { sharedLedgers } from "./ledgers";
import { sharedPostings } from "./postings";
import { sharedPostingLines } from "./postingLines";
import { sharedDealStakeholders } from "./dealStakeholders";

export const getClientWithOpportunities = (clientId: string): ClientWithOpportunities | undefined => {
  const client = sharedClients.find((c) => c.id === clientId);
  if (!client) return undefined;
  return { ...client, opportunities: sharedOpportunities.filter((o) => o.clientId === clientId) };
};

export const getAllClientsWithOpportunities = (): ClientWithOpportunities[] =>
  sharedClients.map((c) => ({
    ...c,
    opportunities: sharedOpportunities.filter((o) => o.clientId === c.id),
  }));

export const getOpportunityById = (id: string) => sharedOpportunities.find((o) => o.id === id);
export const getClientById = (id: string) => sharedClients.find((c) => c.id === id);
export const getTaskById = (id: string) => sharedTasks.find((t) => t.id === id);
export const getDocumentById = (id: string) => sharedDocuments.find((d) => d.id === id);
export const getTasksForClient = (clientId: string) => sharedTasks.filter((t) => t.clientId === clientId);
export const getTasksForOpportunity = (opportunityId: string) => sharedTasks.filter((t) => t.opportunityId === opportunityId);
export const getDocumentsForClient = (clientId: string) => sharedDocuments.filter((d) => d.clientId === clientId);
export const getDocumentsForOpportunity = (opportunityId: string) => sharedDocuments.filter((d) => d.opportunityId === opportunityId);
export const getAgentById = (id: string) => sharedAgents.find((a) => a.id === id);
export const getPartyById = (id: string) => sharedParties.find((p) => p.id === id);
export const getPartyForAgent = (agentId: string) => {
  const agent = sharedAgents.find((a) => a.id === agentId);
  return agent ? sharedParties.find((p) => p.id === agent.partyId) : undefined;
};
export const getPartyForClient = (clientId: string) => {
  const client = sharedClients.find((c) => c.id === clientId);
  return client ? sharedParties.find((p) => p.id === client.partyId) : undefined;
};

export const getInvoiceById = (id: string) => sharedInvoices.find((i) => i.id === id);

// Invoice → Deal is traversed via Posting.dealId → PostingLine.invoiceId.
export const getInvoicesForDeal = (dealId: string) => {
  const postingIds = new Set(sharedPostings.filter((p) => p.dealId === dealId).map((p) => p.id));
  const ids = new Set(
    sharedPostingLines
      .filter((l) => postingIds.has(l.postingId) && l.invoiceId)
      .map((l) => l.invoiceId as string)
  );
  return sharedInvoices.filter((i) => ids.has(i.id));
};

export const getInvoicesForAgent = (agentId: string) => {
  const agent = sharedAgents.find((a) => a.id === agentId);
  if (!agent) return [];
  return sharedInvoices.filter((i) => i.direction === "inbound" && i.partyId === agent.partyId);
};

export const getLedgerById = (id: number) => sharedLedgers.find((l) => l.id === id);
export const getSubledgersForGL = (glId: number) => sharedLedgers.filter((l) => l.glId === glId);

// Posting → Deal uses the direct dealId FK.
export const getPostingsForDeal = (dealId: string) => sharedPostings.filter((p) => p.dealId === dealId);
export const getPostingLinesForPosting = (postingId: string) => sharedPostingLines.filter((l) => l.postingId === postingId);
export const getPostingLinesForLedger = (ledgerId: number) => sharedPostingLines.filter((l) => l.ledgerId === ledgerId);
export const getPostingLinesForInvoice = (invoiceId: string) => sharedPostingLines.filter((l) => l.invoiceId === invoiceId);

// DealStakeholder helpers.
export const getDealStakeholdersForDeal = (dealId: string) => sharedDealStakeholders.filter((s) => s.dealId === dealId);
export const getDealStakeholdersForParty = (partyId: string) => sharedDealStakeholders.filter((s) => s.partyId === partyId);

// Returns the agent-role DealStakeholder for a specific agent party on a given deal.
export const getAgentStakeForDeal = (dealId: string, agentPartyId: string): DealStakeholder | undefined =>
  sharedDealStakeholders.find((s) => s.dealId === dealId && s.partyId === agentPartyId && s.role === "INTERNAL_PAYOUT");

// Computes the commission amount attributable to one agent based on their stake.
// Uses fixedAmount when set; otherwise applies splitPercentage (defaults to 100%).
export const computeAgentCommission = (totalAgentCommission: number, stake: DealStakeholder | undefined): number => {
  if (!stake) return totalAgentCommission;
  if (stake.fixedAmount !== undefined) return stake.fixedAmount;
  return Math.round(totalAgentCommission * ((stake.splitPercentage ?? 100) / 100));
};

// Returns the Client record for the primary client stakeholder on a deal.
export const getClientForDeal = (dealId: string) => {
  const stakeholders = sharedDealStakeholders.filter((s) => s.dealId === dealId);
  const clientStakeholder = stakeholders.find((s) => s.role === "REVENUE_SOURCE");
  if (!clientStakeholder) return undefined;
  return sharedClients.find((c) => c.partyId === clientStakeholder.partyId);
};
