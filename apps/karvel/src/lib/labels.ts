// Display-string mappings for canonical lowercase enum values.
// Use these whenever rendering an enum value to UI; never display the raw value.
import type { OpportunityType, OpportunityStatus } from "@huspy/shared-domain";

export const opportunityTypeLabel: Record<OpportunityType, string> = {
  buy: "Buy",
  sell: "Sell",
  rent: "Rent",
  lease: "Lease",
  mortgage: "Mortgage",
};

export const opportunityStatusLabel: Record<OpportunityStatus, string> = {
  new: "New",
  "to-review": "To Review",
  qualified: "Qualified",
  active: "Active",
  "under-offer": "Under Offer",
  closed: "Closed",
  inactive: "Inactive",
};
