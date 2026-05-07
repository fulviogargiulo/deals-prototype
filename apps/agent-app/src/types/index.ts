// Agent-app types. Canonical entity types and enums are re-exported from
// @huspy/shared-domain — single source of truth across the monorepo.
// Only agent-app-specific extensions and UI-only types are defined locally.

import type {
  Client as BaseClient,
  Opportunity as BaseOpportunity,
  Deal as BaseDeal,
} from "@huspy/shared-domain";

// Re-export canonical types
export type {
  // Enums
  DealStatus,
  DealType,
  OpportunityType,
  OpportunityStatus,
  TaskStatus,
  TaskPriority,
  DocumentType,
  ScheduleActivityType,
  ScheduleActivityStatus,
  VisitOutcome,
  ClientInterestLevel,
  DisputeStatus,
  DisputeField,
  // Entities
  Task,
  Document,
  Agent,
  ScheduleActivity,
  // Schedule support types
  PropertyAddress,
  MeetingPoint,
  VisitDocument,
  VisitFeedback,
  // Deal dispute
  DealDispute,
} from "@huspy/shared-domain";

// ----------------------------------------------------------------
// Agent-app-only enums and UI types
// ----------------------------------------------------------------
export type VerificationStatus = "incoming" | "pending" | "verified";
export type PropertyStatus = "published" | "in-review" | "draft" | "rejected" | "delisted";
export type DelistReason = "sold" | "lost";
export type LineItemCategory = "deal-commission" | "referral-commission" | "support-fee" | "clawback" | "other";
export type LineItemIssue = "amount" | "description" | "category" | "other";

// ----------------------------------------------------------------
// Narrower agent-app entity extensions — required-field invariants
// the agent-app UI depends on. Same records as shared; just stricter typing.
// ----------------------------------------------------------------
export interface Client extends BaseClient {
  description?: string;
  location?: string;
  preferredLanguage?: string;
  verificationStatus: VerificationStatus;
  source?: "self-created" | "idealista" | "fotocasa";
  expiresAt?: string;
  lastActivity: string;
}

export interface Opportunity
  extends Omit<BaseOpportunity, "priceRange" | "originalPriceRange" | "type" | "status"> {
  type: import("@huspy/shared-domain").OpportunityType;
  status: import("@huspy/shared-domain").OpportunityStatus;
  priceRange?: { min: number; max: number; currency: string };
  originalPriceRange?: { min: number; max: number; currency: string };
  tags: string[];
  portalBadges: string[];
  updatesCount: number;
  pendingActions: string[];
}

// Local — uses agent-app.Opportunity (narrower) instead of shared.Opportunity
export interface ClientWithOpportunities extends Client {
  opportunities: Opportunity[];
}

export interface Deal extends Omit<BaseDeal, "type" | "market"> {
  type: import("@huspy/shared-domain").OpportunityType;
  marketType: "primary" | "secondary" | "leasing";
  opportunityName: string;
  clientName: string;
  title: string;
  commissionPercentage: number;
  commissionAmount: number;
  dispute?: import("@huspy/shared-domain").DealDispute;
  invoiceNumber?: string;
  invoiceDueDate?: string;
  paymentDate?: string;
}

// ----------------------------------------------------------------
// UI-only types (not domain entities — live here, not in shared)
// ----------------------------------------------------------------
export interface GlobalSearchResult {
  id: string;
  type: "client" | "opportunity" | "property" | "task" | "document";
  title: string;
  subtitle?: string;
  metadata?: string;
}

export interface StatementLineItem {
  id: string;
  description: string;
  type: "credit" | "debit";
  category: LineItemCategory;
  amount: number;
  dealId?: string;
  dispute?: StatementLineItemDispute;
}

export interface StatementLineItemDispute {
  id: string;
  lineItemId: string;
  issue: LineItemIssue;
  description: string;
  correctValue?: string;
  status: import("@huspy/shared-domain").DisputeStatus;
  createdAt: string;
}

export interface StatementOfAccount {
  id: string;
  cycleLabel: string;
  period: string;           // machine-readable "YYYY-MM" used when creating AgentInvoice
  lineItems: StatementLineItem[];
  totalCredit: number;
  totalDebit: number;
  balance: number;
  status: "draft" | "confirmed" | "paid";
  generatedAt: string;
  expiresAt: string;
}
