// All canonical records live in @huspy/shared-domain. This file is a thin
// access layer: re-exports the shared records under their legacy mock* names
// and defines a few local query helpers that use agent-app's narrower types.

import {
  sharedClients,
  sharedOpportunities,
  sharedTasks,
  sharedDocuments,
  sharedAgents,
  sharedScheduleActivities,
  generateMockScheduleActivities,
} from "@huspy/shared-domain";
import type { Client, Opportunity, ClientWithOpportunities } from "@/types";

// Records — cast widens shared (loose) to agent-app's narrower local types.
// Runtime values include all fields the narrower types require.
export const mockClients: Client[] = sharedClients as Client[];
export const mockOpportunities: Opportunity[] = sharedOpportunities as Opportunity[];
export const mockTasks = sharedTasks;
export const mockDocuments = sharedDocuments;
export const mockAgents = sharedAgents;
export const mockScheduleActivities = sharedScheduleActivities;
export { generateMockScheduleActivities };

// Local query helpers (use agent-app's narrower types so callers don't see
// shared.Opportunity bleed through).
export const getClientWithOpportunities = (clientId: string): ClientWithOpportunities | undefined => {
  const client = mockClients.find((c) => c.id === clientId);
  if (!client) return undefined;
  return { ...client, opportunities: mockOpportunities.filter((o) => o.clientId === clientId) };
};

export const getAllClientsWithOpportunities = (): ClientWithOpportunities[] =>
  mockClients.map((c) => ({
    ...c,
    opportunities: mockOpportunities.filter((o) => o.clientId === c.id),
  }));

export const getOpportunityById = (id: string) => mockOpportunities.find((o) => o.id === id);
export const getClientById = (id: string) => mockClients.find((c) => c.id === id);
export const getTaskById = (id: string) => mockTasks.find((t) => t.id === id);
export const getDocumentById = (id: string) => mockDocuments.find((d) => d.id === id);
export const getTasksForClient = (clientId: string) => mockTasks.filter((t) => t.clientId === clientId);
export const getTasksForOpportunity = (opportunityId: string) => mockTasks.filter((t) => t.opportunityId === opportunityId);
export const getDocumentsForClient = (clientId: string) => mockDocuments.filter((d) => d.clientId === clientId);
export const getDocumentsForOpportunity = (opportunityId: string) => mockDocuments.filter((d) => d.opportunityId === opportunityId);
export const getAgentById = (id: string) => mockAgents.find((a) => a.id === id);

export const getActivitiesForDate = (date: Date) => {
  const target = date.toISOString().split("T")[0];
  return mockScheduleActivities.filter((a) => a.date === target);
};

export const getActivitiesForOpportunity = (opportunityId: string) =>
  mockScheduleActivities.filter((a) => a.opportunityId === opportunityId);
