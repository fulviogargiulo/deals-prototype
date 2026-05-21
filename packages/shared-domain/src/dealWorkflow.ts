import type { DealStatus } from "./enums";

// Lightweight workflow model for prototype UIs.
// This keeps transitions explicit and aligned with the FigJam process map.
export const DEAL_WORKFLOW_TRANSITIONS: Record<DealStatus, DealStatus[]> = {
  "pending-details": ["under-review", "canceled"],
  "under-review": ["pending-details", "pending-agent-approval", "canceled"],
  "pending-agent-approval": ["under-review", "invoicing", "canceled"],
  "invoicing": ["canceled"],
  finalized: [],
  canceled: [],
};

export function getAllowedDealTransitions(status: DealStatus): DealStatus[] {
  return DEAL_WORKFLOW_TRANSITIONS[status];
}

export function canTransitionDealStatus(from: DealStatus, to: DealStatus): boolean {
  if (from === to) return true;
  return DEAL_WORKFLOW_TRANSITIONS[from].includes(to);
}
