// Query helpers — stand-ins for what a real backend's query layer would do.
// Both apps can use these against the canonical fixtures.

import type { ClientWithOpportunities } from "../entities";
import { sharedClients } from "./clients";
import { sharedOpportunities } from "./opportunities";
import { sharedTasks } from "./tasks";
import { sharedDocuments } from "./documents";
import { sharedAgents } from "./agents";

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
