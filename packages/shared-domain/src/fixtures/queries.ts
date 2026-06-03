// Query helpers — stand-ins for what a real backend's query layer would do.
// Both apps can use these against the canonical fixtures.

import type { ClientWithOpportunities, PnlEntry } from "../entities";
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
import { sharedPnlEntries } from "./pnlEntries";
import { sharedDealParticipants } from "./dealParticipants";
import { sharedTranches } from "./tranches";
import { sharedDeals } from "./deals";
import { sharedDealDocumentRequirements } from "./dealDocumentRequirements";


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

// ── Tranche helpers ───────────────────────────────────────────────────────────

export const getTranchesForDeal = (dealId: string) => sharedTranches.filter((t) => t.dealId === dealId);
export const findTranchById = (id: string) => sharedTranches.find((t) => t.id === id);

export const getPnlEntriesForTranche = (trancheId: string) =>
  sharedPnlEntries.filter((s) => s.trancheId === trancheId);

/** @deprecated Use getPnlEntriesForTranche. */
export const getStakeholdersForTranche = getPnlEntriesForTranche;

export const getDocReqsForTranche = (trancheId: string) =>
  sharedDealDocumentRequirements.filter((r) => r.trancheId === trancheId);

export const getInvoicesForTranche = (trancheId: string) =>
  sharedInvoices.filter((i) => i.trancheId === trancheId);

export const getPostingsForTranche = (trancheId: string) =>
  sharedPostings.filter((p) => p.trancheId === trancheId);

// ── Invoice / Posting helpers ─────────────────────────────────────────────────

// Invoice → Tranche via trancheId FK (direct) or via posting.trancheId → posting line invoiceId.
export const getInvoicesForDeal = (dealId: string) => {
  const trancheIds = new Set(sharedTranches.filter((t) => t.dealId === dealId).map((t) => t.id));
  const postingIds = new Set(sharedPostings.filter((p) => p.trancheId && trancheIds.has(p.trancheId)).map((p) => p.id));
  const linkedInvoiceIds = new Set(
    sharedPostingLines
      .filter((l) => postingIds.has(l.postingId) && l.invoiceId)
      .map((l) => l.invoiceId as string)
  );
  return sharedInvoices.filter((i) => (i.trancheId && trancheIds.has(i.trancheId)) || linkedInvoiceIds.has(i.id));
};

export const getInvoicesForAgent = (agentId: string) => {
  const agent = sharedAgents.find((a) => a.id === agentId);
  if (!agent) return [];
  return sharedInvoices.filter((i) => i.direction === "inbound" && i.partyId === agent.partyId);
};

export const getLedgerById = (id: number) => sharedLedgers.find((l) => l.id === id);
export const getSubledgersForGL = (glId: number) => sharedLedgers.filter((l) => l.glId === glId);

export const getPostingsForDeal = (dealId: string) => {
  const trancheIds = new Set(sharedTranches.filter((t) => t.dealId === dealId).map((t) => t.id));
  return sharedPostings.filter((p) => p.trancheId && trancheIds.has(p.trancheId));
};

export const getPostingLinesForPosting = (postingId: string) => sharedPostingLines.filter((l) => l.postingId === postingId);
export const getPostingLinesForLedger = (ledgerId: number) => sharedPostingLines.filter((l) => l.ledgerId === ledgerId);
export const getPostingLinesForInvoice = (invoiceId: string) => sharedPostingLines.filter((l) => l.invoiceId === invoiceId);

// ── PnlEntry helpers ─────────────────────────────────────────────────────────

export const getPnlEntriesForDeal = (dealId: string) => {
  const trancheIds = new Set(sharedTranches.filter((t) => t.dealId === dealId).map((t) => t.id));
  return sharedPnlEntries.filter((s) => trancheIds.has(s.trancheId));
};


export const getDealParticipantsForDeal = (dealId: string) =>
  sharedDealParticipants.filter((p) => p.dealId === dealId);

export const getAgentStakeForDeal = (dealId: string, agentPartyId: string): PnlEntry | undefined => {
  const trancheIds = new Set(sharedTranches.filter((t) => t.dealId === dealId).map((t) => t.id));
  return sharedPnlEntries.find(
    (s) => trancheIds.has(s.trancheId) && s.partyId === agentPartyId && s.role === "AGENT_PAYOUT"
  );
};

// Computes the commission amount attributable to one agent based on their PnlEntry.
export const computeAgentCommission = (totalAgentCommission: number, stake: PnlEntry | undefined): number => {
  if (!stake) return totalAgentCommission;
  if (stake.amount !== undefined) return Math.abs(stake.amount);
  return Math.round(totalAgentCommission * ((stake.splitPercentage ?? 100) / 100));
};

export const getClientForDeal = (dealId: string) => {
  const trancheIds = new Set(sharedTranches.filter((t) => t.dealId === dealId).map((t) => t.id));
  const entries = sharedPnlEntries.filter((s) => trancheIds.has(s.trancheId));
  const revenueEntry = entries.find((s) => s.role === "REVENUE_SOURCE");
  if (!revenueEntry) return undefined;
  return sharedClients.find((c) => c.partyId === revenueEntry.partyId);
};
