export { sharedClients } from "./clients";
export { sharedOpportunities } from "./opportunities";
export { sharedDeals } from "./deals";
export { sharedTasks } from "./tasks";
export { sharedDocuments } from "./documents";
export { sharedAgents } from "./agents";
export {
  generateMockScheduleActivities,
  sharedScheduleActivities,
  getActivitiesForDate,
  getActivitiesForOpportunity,
} from "./schedule";
export {
  getClientWithOpportunities,
  getAllClientsWithOpportunities,
  getOpportunityById,
  getClientById,
  getTaskById,
  getDocumentById,
  getTasksForClient,
  getTasksForOpportunity,
  getDocumentsForClient,
  getDocumentsForOpportunity,
  getAgentById,
} from "./queries";
export { generateManyClients } from "./manyClientsGenerator";
