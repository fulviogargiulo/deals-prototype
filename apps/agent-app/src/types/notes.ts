export interface Note {
  id: string;
  content: string;
  opportunityId: string;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  createdBy: string; // e.g., "you", or user name
}
