// Canonical enums — single source of truth for both apps.
// Convention: lowercase kebab-case for all serialized values (matches typical API/DB representation).

export type DealStatus =
  | "reported"
  | "pending-details"
  | "under-review"
  | "pending-agent-approval"
  | "pending-receivables"
  | "finalized"
  | "canceled";

export type OpportunityType =
  | "buy"
  | "sell"
  | "rent"
  | "lease"
  | "mortgage";

export type DealType =
  | OpportunityType
  | "buy-sell"
  | "rent-lease";

export type OpportunityStatus =
  | "new"
  | "to-review"
  | "qualified"
  | "active"
  | "under-offer"
  | "closed"
  | "inactive";

export type BusinessUnit = "rebu" | "mortgage";

export type Country = "ae" | "es" | "sa";

export type Currency = "AED" | "EUR" | "SAR";

export type Market = "primary" | "secondary" | "leasing";

export type InvoiceStatus =
  | "created"
  | "sent"
  | "overdue"
  | "paid"
  | "paid-partial"
  | "cancelled";

export type PayableStatus = "pending" | "approved" | "paid" | "rejected" | "overdue";

export type LedgerType = "asset" | "liability" | "revenue" | "expense";

export type PostingSide = "DEBIT" | "CREDIT";

export type PostingStatus = "draft" | "posted" | "reversed";

export type BusinessProcess =
  | "deal_close"
  | "agent_invoice"
  | "bank_statement_inbound_matched"
  | "bank_statement_outbound_matched"
  | "payout_instructed"
  | "manual_adjustment"
  | "reversal";
