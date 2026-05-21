// Display-string mappings for canonical lowercase enum values.
// Use these whenever rendering an enum value to UI; never display the raw value.
import type {
  OpportunityType,
  OpportunityStatus,
  DealStatus,
  Market,
  BusinessUnit,
  Country,
  InvoiceStatus,
  PayableStatus,
} from "@huspy/shared-domain";

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


export const dealStatusLabel: Record<DealStatus, string> = {
  reported: "Reported",
  "pending-details": "Pending Details",
  "under-review": "Under Review",
  "pending-agent-approval": "Pending Agent Approval",
  "invoicing": "Invoicing",
  finalized: "Finalized",
  canceled: "Canceled",
};

export const marketLabel: Record<Market, string> = {
  primary: "Primary",
  secondary: "Secondary",
  leasing: "Leasing",
};

export const businessUnitLabel: Record<BusinessUnit, string> = {
  rebu: "REBU",
  mortgage: "Mortgage",
};

export const countryLabel: Record<Country, string> = {
  ae: "UAE",
  es: "Spain",
  sa: "KSA",
};

export const invoiceStatusLabel: Record<InvoiceStatus, string> = {
  issued: "Issued",
  paid: "Paid",
  cancelled: "Cancelled",
};

export const payableStatusLabel: Record<PayableStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  paid: "Paid",
  rejected: "Rejected",
  overdue: "Overdue",
};
