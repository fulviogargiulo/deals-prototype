// Query helpers — stand-ins for what a real backend's query layer would do.
// Both apps can use these against the canonical fixtures.

import type { ClientWithOpportunities } from "../entities";
import { sharedClients } from "./clients";
import { sharedOpportunities } from "./opportunities";
import { sharedTasks } from "./tasks";
import { sharedDocuments } from "./documents";
import { sharedAgents } from "./agents";
import { sharedInvoices } from "./invoices";
import { sharedLedgers } from "./ledgers";
import { sharedPostings } from "./postings";
import { sharedPostingLines } from "./postingLines";
import { sharedAgentInvoices } from "./agentInvoices";

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
export const getInvoiceById = (id: string) => sharedInvoices.find((i) => i.id === id);
// Invoice → Deal is now via PostingLines (no direct dealId FK on Invoice).
export const getInvoicesForDeal = (dealId: string) => {
  const ids = new Set(
    sharedPostingLines
      .filter((l) => l.metadata?.deal_id === dealId && l.invoiceId)
      .map((l) => l.invoiceId as string)
  );
  return sharedInvoices.filter((i) => ids.has(i.id));
};
export const getLedgerById = (id: string) => sharedLedgers.find((l) => l.id === id);
export const getSubledgersForGL = (glId: string) => sharedLedgers.filter((l) => l.glId === glId);
export const getPostingsForDeal = (dealId: string) => sharedPostings.filter((p) => p.metadata?.deal_id === dealId);
export const getPostingLinesForPosting = (postingId: string) => sharedPostingLines.filter((l) => l.postingId === postingId);
export const getPostingLinesForLedger = (ledgerId: string) => sharedPostingLines.filter((l) => l.ledgerId === ledgerId);
export const getAgentInvoiceById = (id: string) => sharedAgentInvoices.find((i) => i.id === id);
export const getAgentInvoicesForAgent = (agentId: string) => sharedAgentInvoices.filter((i) => i.agentId === agentId);
export const getPostingLinesForAgentInvoice = (agentInvoiceId: string) => sharedPostingLines.filter((l) => l.agentInvoiceId === agentInvoiceId);
export const getPostingLinesForInvoice = (invoiceId: string) => sharedPostingLines.filter((l) => l.invoiceId === invoiceId);
