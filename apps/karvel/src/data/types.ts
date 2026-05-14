import type {
  Deal as BaseDeal,
  DealStatus,
  PayableStatus,
} from "@huspy/shared-domain";

// ─── Karvel operational types (not in shared domain model) ───────────────────
// These represent the old denormalized financial model that Karvel's UI
// still reads/writes. They are intentionally NOT on the shared Deal entity.

export interface AgentEntry {
  agentName: string;
  agentId?: string;
  agentEmail?: string;
  agentPhone?: string;
  agentShare: number;
  agentCommissionRate: number;
  agentCommissionPayout: number;
  agentIncentive: number;
  agentDeductions: number;
  agentTotalAmount: number;
  teamLeadName?: string;
  teamLeadRate: number;
  teamLeadShare: number;
  managerName?: string;
  managerOverrideRate: number;
  managerOverride: number;
  referralType?: string;
  referrerName?: string;
  referralPercentage: number;
  referralAmount: number;
  clientKickback: number;
}

export interface PayableEntry {
  entityType: "external_partner" | "agent" | "team_lead" | "manager" | "referrer" | "conveyance" | "broker" | "rm" | "tl" | "ds";
  entityLabel: string;
  expectedAmount: number;
  refNumber?: string;
  status: PayableStatus;
  paidAmount?: number;
  paidDate?: string;
  entityUploadedInvoice?: string;
}

export interface ExternalPartnerEntry {
  partnerName: string;
  partnerShare: number;
  partnerAmount: number;
  partnerBank?: string;
  partnerBankAccount?: string;
}

export interface StatusHistoryEntry {
  from: DealStatus;
  to: DealStatus;
  timestamp: string;
  note?: string;
}

// ─── Karvel Deal = shared Deal + Karvel operational fields ───────────────────
// Karvel enriches the canonical deal with agent entries, payables, and derived
// P&L scalars at load time (see lib/dealEnricher.ts).
export type Deal = BaseDeal & {
  // Agent payout model
  agents?: AgentEntry[];
  agentShare?: number;
  agentCommissionRate?: number;
  agentCommissionPayout?: number;
  teamLeadName?: string;
  teamLeadRate?: number;
  teamLeadShare?: number;
  managerName?: string;
  managerOverrideRate?: number;
  managerOverride?: number;

  // Conveyance
  conveyanceAgentName?: string;
  conveyanceAgentRate?: number;
  conveyanceAgentPayout?: number;
  huspyConveyanceShare?: number;

  // Kickbacks / Referrals
  clientKickback?: number;
  referralType?: string;
  referralPercentage?: number;
  referralAmount?: number;

  // Derived P&L
  rebateAmount?: number;
  cogsInternal?: number;
  cogsExternal?: number;
  cogsReferrals?: number;
  cogsRebates?: number;
  cogsSubsidy?: number;

  // External partners
  externalPartners?: ExternalPartnerEntry[];
  externalPartnerName?: string;
  externalPartnerShare?: number;
  externalPartnerBank?: string;
  externalPartnerBankAccount?: string;

  // Payables (writable via Karvel UI; starts empty per deal)
  payables?: PayableEntry[];
  payableRefNumber?: string;
  payableStatus?: PayableStatus;

  // Status history (written by DealDetail on status changes)
  statusHistory?: StatusHistoryEntry[];
};

// ─── Re-exports from shared domain ──────────────────────────────────────────
export type {
  Client,
  Opportunity,
  PriceRange,
  SizeRange,
  ReceivableEntry,
  ReceivableEntityType,
  PaymentMode,

  InvoiceStatus,
  BusinessUnit,
  Country,
  Currency,
  Market,
  OpportunityType,
  OpportunityStatus,
} from "@huspy/shared-domain";

export type { DealStatus, PayableStatus };

// Backward-compat alias used historically in karvel
import type { Market } from "@huspy/shared-domain";
export type DealMarket = Market;
