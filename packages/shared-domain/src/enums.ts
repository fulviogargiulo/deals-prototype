// Canonical enums — single source of truth for both apps.
// Convention: lowercase kebab-case for all serialized values (matches typical API/DB representation).

export type DealStatus =
  | "pending-details"
  | "under-review"
  | "pending-agent-approval"
  | "invoicing"
  | "finalized"
  | "canceled";

export type OfferStatus =
  | "draft"
  | "submitted"
  | "under-negotiation"
  | "accepted"
  | "documents-pending"
  | "documents-complete"
  | "deal-created"
  | "rejected"
  | "withdrawn";

export type CommissionPayer = "buyer" | "seller" | "developer" | "split";

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
  | "invoice_issued"               // Huspy raises outbound invoice — DR ASSET_AR (gross) / CR REV (subtotal) / CR LIAB_VAT (vatAmount)
  | "commission_accrual"           // Huspy recognizes commission owed to agent — DR EXP_COMMISSION / CR LIAB_AGENT (gross base)
  | "agent_invoice_accrual"        // Agent invoice received and validated (→ issued) — DR LIAB_AGENT (base) + DR LIAB_VAT / CR LIAB_WITHHOLDING + CR LIAB_AGENT (net payable)
  | "external_cost_accrual"        // Third-party vendor invoice received and validated (→ issued) — DR EXP_COMMISSION / DR LIAB_VAT / CR LIAB_PAYABLE (gross)
  | "bank_statement_inbound_matched"  // Cash received from external party, matched to bank statement — DR ASSET_BANK / CR ASSET_AR
  | "bank_statement_outbound_matched" // Cash paid to agent or vendor, matched to bank statement — DR LIAB_AGENT or LIAB_PAYABLE / CR ASSET_BANK
  | "agent_adjustment"             // Standalone bonus or incentive to agent — DR EXP_COMMISSION / CR LIAB_AGENT
  | "huspy_fee"                    // Fee charged by Huspy to agent — DR LIAB_AGENT / CR REV
  | "manual_adjustment"            // Flexible standalone correction — journal varies
  | "reversal";                    // Mirror of reversed posting with sides flipped; set reversedByPostingId

/**
 * StakeholderType — semantic financial role of a party on a deal.
 *
 * Waterfall flow (tax-exclusive):
 *   Σ REVENUE_SOURCE.financialAmount          → Gross Revenue
 *     − Σ ACQUISITION_DEDUCTION               → Commission Base  (agent splits apply here)
 *       − Σ AGENT_PAYOUT (per strategy)         → Huspy Gross Share
 *         − Σ OPERATIONAL_DEDUCTION           → Huspy Net Margin
 *
 * Role semantics:
 *
 *   REVENUE_SOURCE
 *     Party paying Huspy. Positive = commission / fee charged to client.
 *     Negative = rebate or discount returned to the client; reduces gross directly and appears
 *     as a line item on the same invoice as the commission.
 *     UI label: "Revenue"
 *
 *   ACQUISITION_DEDUCTION  (Bucket C)
 *     Huspy-borne cost that reduces the commission base shared with agents
 *     (co-brokers, external referrals, partner fees).
 *     When parentStakeholderId is set → cost is charged to that agent's pool instead
 *     of the Huspy-level base (agent-borne cost, deducted from agent payout only).
 *     UI label: "External Partners" (top-level) / "Agent cost" (agent-borne)
 *
 *   OPERATIONAL_DEDUCTION  (Bucket D)
 *     Huspy-only cost deducted AFTER agent splits — does not reduce agent commissions
 *     (legal, admin, internal service costs).
 *     When parentStakeholderId is set → same agent-borne logic as ACQUISITION_DEDUCTION.
 *     UI label: "Service Costs" (top-level) / "Agent cost" (agent-borne)
 *
 *   AGENT_PAYOUT  (Bucket B)
 *     Agent — payout calculated by the waterfall engine via AgentStrategy.
 *     splitPercentage determines share of the commission base.
 *     UI label: "Agent Commissions"
 *
 *   SUPPLY
 *     Non-financial role: the supply-side party on the transaction.
 *     REBU buy/sell: the seller or developer. Leasing: the landlord. MBU: the bank/lender.
 *     Multiple SUPPLY parties are allowed (e.g. co-sellers, multiple lenders).
 *     No financialAmount — this role is purely relational (replaces Deal.sellerName text field).
 *
 *   DEMAND
 *     Non-financial role: the demand-side party on the transaction.
 *     REBU: the buyer. Leasing: the tenant. MBU: the borrower.
 *     Multiple DEMAND parties are allowed.
 *     No financialAmount — purely relational (replaces Deal.buyerName text field).
 *     Primary DEMAND party is the canonical source for Deal.clientName display cache.
 *
 * [TO BE DETERMINED] Agent split percentages will migrate to an Offer entity
 * linked from the deal; splitPercentage on DealStakeholder is the interim source of truth.
 */
export type StakeholderType =
  | "REVENUE_SOURCE"
  | "OPERATIONAL_DEDUCTION"
  | "ACQUISITION_DEDUCTION"
  | "AGENT_PAYOUT"
  | "SUPPLY"
  | "DEMAND";

// ============================================================
// Waterfall — cost-bucket taxonomy used by the lean P&L engine.
// A: Top-level revenue reductions (VAT, mandatory fees) applied to gross.
// B: Internal Huspy splits (agent, team-lead, manager) — calculated, not entered.
// C: External commercial splits (referral partners, co-brokering agencies).
// D: External service providers (notaries, conveyance, legal — fixed fees).
// Buckets A and B are derived by the engine; C and D are user-declared.
// ============================================================
export type CostBucket = "agent-payout" | "acquisition-cost" | "operational-cost";

// Discriminator for AgentFinancials.strategy. See entities.ts for the union shape.
// "broker-rate-slab": rate is not fixed — resolved at calculation time from BrokerRateSlab
// based on reporting month, lending bank, and broker's monthly GMV tier.
// "mbu-direct-rate-slab": rate resolved at calculation time from MBUDirectMonthlyRate
// based on reporting month, channel (REA/DS/B2C), and sourcing type (self vs external).
export type AgentStrategyKind = "flat" | "slab" | "max" | "broker-rate-slab" | "mbu-direct-rate-slab";

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
