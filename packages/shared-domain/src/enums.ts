// Canonical enums — single source of truth for both apps.
// Convention: lowercase kebab-case for all serialized values (matches typical API/DB representation).

export type DealStatus =
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

export type InvoiceStatus = "draft" | "issued" | "paid" | "cancelled";

export type PayableStatus = "pending" | "approved" | "paid" | "rejected" | "overdue";

export type LedgerType = "asset" | "liability" | "revenue" | "expense";

export type PostingSide = "DEBIT" | "CREDIT";

export type BusinessProcess =
  | "deal_close"
  | "agent_invoice"
  | "bank_statement_inbound_matched"
  | "bank_statement_outbound_matched"
  | "payout_instructed"
  | "bonus"
  | "incentive"
  | "platform_fee"
  | "manual_adjustment"
  | "reversal";

/**
 * StakeholderType — semantic financial role of a party on a deal.
 *
 * REVENUE_SOURCE:         Party paying Huspy. financialAmount > 0 contributes to commissionable gross.
 * OPERATIONAL_DEDUCTION:  Fixed service costs Huspy pays (notaries, conveyance, legal). Routes to Bucket D.
 * ACQUISITION_DEDUCTION:  Sales/referral costs Huspy pays (co-brokers, client rebates). Routes to Bucket C.
 * INTERNAL_PAYOUT:        Agent — system-calculated via AgentStrategy. Routes to Bucket B.
 *
 * [TO BE DETERMINED] Agent split percentages will migrate to an Offer entity
 * linked from the deal; splitPercentage on DealStakeholder is the interim source of truth.
 */
export type StakeholderType =
  | "REVENUE_SOURCE"
  | "OPERATIONAL_DEDUCTION"
  | "ACQUISITION_DEDUCTION"
  | "INTERNAL_PAYOUT";

// ============================================================
// Waterfall — cost-bucket taxonomy used by the lean P&L engine.
// A: Top-level revenue reductions (VAT, mandatory fees) applied to gross.
// B: Internal Huspy splits (agent, team-lead, manager) — calculated, not entered.
// C: External commercial splits (referral partners, co-brokering agencies).
// D: External service providers (notaries, conveyance, legal — fixed fees).
// Buckets A and B are derived by the engine; C and D are user-declared.
// ============================================================
export type CostBucket = "A" | "B" | "C" | "D";

// Discriminator for AgentFinancials.strategy. See entities.ts for the union shape.
export type AgentStrategyKind = "flat" | "slab" | "max";

// ============================================================
// Deal document requirements — per-deal checklist driven by
// DocumentRequirementTemplate keyed on (market, businessUnit, country).
// ============================================================
export type DocumentRequirementStatus = "pending" | "uploaded" | "approved" | "waived";

// ============================================================
// Agent-level compliance documents — managed by Ops in Karvel.
// These are per-agent, not per-deal.
// ============================================================
export type AgentDocumentType =
  | "passport"
  | "eid"
  | "id-number"
  | "visa"
  | "aml-kyc"
  | "real-estate-license"
  | "account-number"
  | "bic"
  | "other";
