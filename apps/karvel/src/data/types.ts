// Karvel re-exports the shared canonical types directly. No app-local extension —
// the shared schema is the single source of truth (acts as the future DB schema).
export type {
  Client,
  Opportunity,
  Deal,
  AgentEntry,
  PayableEntry,
  ReceivableEntry,
  ExternalPartnerEntry,
  StatusHistoryEntry,
  ReceivableEntityType,
  PaymentMode,
  DealDispute,
  DisputeStatus,
  DisputeField,
  PriceRange,
  SizeRange,
  DealType,
  DealStatus,
  InvoiceStatus,
  PayableStatus,
  BusinessUnit,
  Country,
  Currency,
  Market,
  OpportunityType,
  OpportunityStatus,
} from "@huspy/shared-domain";

// Backward-compat alias used historically in karvel
import type { Market } from "@huspy/shared-domain";
export type DealMarket = Market;
