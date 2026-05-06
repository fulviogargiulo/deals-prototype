import type {
  Opportunity as BaseOpportunity,
  Deal as BaseDeal,
  DealStatus,
  InvoiceStatus,
  PayableStatus,
  BusinessUnit,
  Country,
  Market,
} from "@huspy/shared-domain";

// Re-export canonical enums under their original karvel-import paths.
export type {
  OpportunityType,
  OpportunityStatus,
  DealType,
  DealStatus,
  InvoiceStatus,
  PayableStatus,
  BusinessUnit,
  Country,
  Currency,
  Market,
} from "@huspy/shared-domain";

export interface Opportunity extends BaseOpportunity {
  // Karvel-required (canonical leaves optional)
  agentId: string;
  source: string;
  // Karvel display caches (denormalized; not part of canonical schema)
  clientName: string;
  clientPhone: string;
  agentName: string;
  lastActivity: string;
}

// Backward-compat alias — internal karvel code historically called this DealMarket
export type DealMarket = Market;

// Karvel-local enums (not in canonical) — also lowercased for consistency
export type ReceivableEntityType = "developer" | "buyer" | "seller" | "tenant" | "bank" | "landlord";
export type PaymentMode = "cash" | "mortgage";
export type SOAStatus = "pending" | "generated" | "approved" | "disputed";

/** Per-entity receivable entry (mirrors payables structure) */
export interface ReceivableEntry {
  entityName: string;
  entityType: ReceivableEntityType;
  amount: number;
  invoiceNumber?: string;
  invoiceStatus?: InvoiceStatus;
  invoiceDate?: string;
  paymentReceivedDate?: string;
  paymentReceivedAmount?: number;
}

/** Per-COGS-entity payable entry */
export interface PayableEntry {
  entityType: "external_partner" | "agent" | "team_lead" | "manager" | "referrer" | "conveyance" | "broker" | "rm" | "tl" | "ds";
  entityLabel: string;         // Display name e.g. "External Partner 1 — John"
  expectedAmount: number;      // The payout amount from COGS
  refNumber?: string;
  status: PayableStatus;
  paidAmount?: number;
  paidDate?: string;
  soaReference?: string;
  soaStatus?: SOAStatus;
  soaDisputeNote?: string;
  entityUploadedInvoice?: string;
}

/** Per-agent entry for multi-agent deals */
export interface AgentEntry {
  agentName: string;
  agentId?: string;
  agentEmail?: string;
  agentPhone?: string;
  agentShare: number;           // % of net revenue allocated to this agent
  agentCommissionRate: number;  // commission rate (%)
  agentCommissionPayout: number; // computed
  // Agent deductions / incentives (optional)
  agentIncentive: number;
  agentDeductions: number;
  agentTotalAmount: number;     // computed = base + incentive - deductions
  // Team lead for this agent
  teamLeadName?: string;
  teamLeadRate: number;         // %
  teamLeadShare: number;        // computed
  // Manager for this agent
  managerName?: string;
  managerOverrideRate: number;  // %
  managerOverride: number;      // computed
  // Referrals per agent
  referralType?: string;
  referrerName?: string;
  referralPercentage: number;   // %
  referralAmount: number;       // computed = referralPercentage% * (netRevenuePerAgent - clientKickback)
  // Client Kickback per agent
  clientKickback: number;
}

/** Per-external-partner entry */
export interface ExternalPartnerEntry {
  partnerName: string;
  partnerShare: number;       // %
  partnerAmount: number;      // computed
  partnerBank?: string;
  partnerBankAccount?: string;
}

// Karvel.Deal extends the canonical BaseDeal contract.
// Inherits id, type, status, dealAmount, reportDate (required) plus
// opportunityId?/clientId?/agentId?/market?/businessUnit?/country?/currency?/
// createdAt?/updatedAt? (optional). Karvel narrows market/businessUnit/country
// to required and adds its full operational schema.
export interface Deal extends BaseDeal {
  market: Market;
  businessUnit: BusinessUnit;
  country: Country;
  channel?: string;
  clientName: string;
  agentName: string;          // primary agent display name (derived from agents[0])
  opportunityName: string;

  // Deal Information
  ofCaseNumber?: string;

  // Property Details (REBU)
  buildingName?: string;
  unitNumber?: string;
  community?: string;
  subCommunity?: string;
  fullAddress?: string;
  propertyType?: string;
  projectName?: string;

  // Demand / Buyer (REBU)
  buyerName?: string;
  buyerPhone?: string;
  buyerEmail?: string;

  // Supply / Seller (REBU)
  sellerName?: string;
  sellerTaxId?: string;
  sellerEmail?: string;
  paymentMode?: PaymentMode;

  // Revenue
  dealPrice: number;
  takeRate: number;
  huspyRevenue: number;
  netHuspyRevenue: number;
  conveyanceRevenue: number;

  // Multi-agent entries
  agents: AgentEntry[];

  // Legacy single-agent fields (kept for table display compatibility)
  agentShare: number;
  agentCommissionRate: number;
  agentCommissionPayout: number;
  teamLeadName?: string;
  teamLeadRate: number;
  teamLeadShare: number;
  managerName?: string;
  managerOverrideRate: number;
  managerOverride: number;

  // Conveyance (REBU)
  conveyanceAgentName?: string;
  conveyanceAgentRate: number;
  conveyanceAgentPayout: number;
  huspyConveyanceShare: number;

  // Kickbacks / Referrals (REBU)
  clientKickback: number;
  referralType?: string;
  referralPercentage: number;
  referralAmount: number;

  // Rebates (Primary market)
  rebatePercentage: number;
  rebateAmount: number;

  // Subsidy (Secondary market)
  subsidyAmount: number;

  // COGS (summary)
  cogsInternal: number;
  cogsExternal: number;
  cogsReferrals: number;
  cogsRebates: number;
  cogsSubsidy: number;

  // MBU-specific
  bankName?: string;
  accountManager?: string;
  numberOfTranches: number;
  disbursedAmount: number;
  bankSlab: number;
  brokerCommissionRate: number;
  brokerPayout: number;
  rmName?: string;
  rmCommissionRate: number;
  rmPayout: number;
  tlName?: string;
  tlCommissionRate: number;
  tlPayout: number;
  dsName?: string;
  dsCommissionRate: number;
  dsPayout: number;
  externalCommissionRate: number;
  externalPayout: number;

  // External Partners (REBU) — multi-partner
  externalPartners: ExternalPartnerEntry[];
  // Legacy single-partner fields (kept for compatibility)
  externalPartnerName?: string;
  externalPartnerShare: number;
  externalPartnerBank?: string;
  externalPartnerBankAccount?: string;

  // Receivables (per-entity)
  receivables: ReceivableEntry[];
  // Legacy single receivable fields (kept for table compatibility)
  invoiceNumber?: string;
  invoiceStatus?: InvoiceStatus;
  invoiceDate?: string;
  paymentReceivedDate?: string;
  paymentReceivedAmount?: number;

  // Payables (per-entity)
  payables: PayableEntry[];
  // Legacy single payable fields (kept for table compatibility)
  payableRefNumber?: string;
  payableStatus?: PayableStatus;

  // Notes
  latestNote?: string;

  // Dispute
  isDisputed?: boolean;
  disputeNote?: string;

  // Status history for timeline
  statusHistory?: StatusHistoryEntry[];
}

export interface StatusHistoryEntry {
  from: DealStatus;
  to: DealStatus;
  timestamp: string;
  note?: string;
}
