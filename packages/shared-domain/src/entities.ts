import type {
  BusinessProcess,
  BusinessUnit,
  Country,
  Currency,
  DealStatus,
  DealType,
  InvoiceStatus,
  LedgerType,
  Market,
  OpportunityStatus,
  OpportunityType,
  PayableStatus,
  PostingSide,
  PostingStatus,
} from "./enums";

// ============================================================
// Client
// ============================================================
//
// One canonical Client type. Karvel and agent-app each consume the same
// records; each renders the subset of fields it cares about.
//
// Field-name notes (collisions resolved):
//   - `creationChannel`  = where the client record was created (karvel concept,
//     formerly `source` in karvel)
//   - `inquirySource`    = where an inbound inquiry originated (agent-app
//     concept, formerly `source` in agent-app)
// ============================================================
export interface Client {
  // Required core
  id: string;
  fullName: string;
  phone: string;
  createdAt: string;
  updatedAt: string;

  // Optional canonical
  email?: string;
  description?: string;
  location?: string;
  preferredLanguage?: string;

  // Lifecycle / verification
  status?: "active" | "inactive";
  verificationStatus?: "incoming" | "pending" | "verified";

  // Where the client/inquiry came from. Loose string — values vary by app:
  //   karvel: "AGENT_APP" | "BACKOFFICE"
  //   agent-app: "self-created" | "idealista" | "fotocasa"
  source?: string;
  origin?: string; // karvel-only; secondary categorisation
  expiresAt?: string;
  lastActivity?: string;
}

// ============================================================
// Opportunity
// ============================================================
export interface PriceRange {
  min: number;
  max: number;
  currency: Currency;
}

export interface SizeRange {
  min: number;
  max: number;
  unit: string;
}

export interface Opportunity {
  // Required core
  id: string;
  clientId: string;
  type: OpportunityType;
  status: OpportunityStatus;
  title: string;
  createdAt: string;
  updatedAt: string;

  // Optional canonical
  agentId?: string;
  country?: Country;
  neighborhoods: string[];
  source?: string;
  priceRange?: PriceRange;
  originalPriceRange?: PriceRange;
  bedrooms?: number;
  bathrooms?: number;
  sizeRange?: SizeRange;
  propertyTypes?: string[];
  description?: string;
  images?: string[];

  // Karvel display caches (denormalized)
  clientName?: string;
  clientPhone?: string;
  agentName?: string;
  lastActivity?: string;

  // Agent-app-relevant
  tags?: string[];
  portalBadges?: string[];
  updatesCount?: number;
  pendingActions?: string[];
}

// ============================================================
// Deal — full operational + agent-facing schema
// ============================================================

// Karvel-specific support types (lived in apps/karvel/src/data/types.ts before flattening)
export type ReceivableEntityType = "developer" | "buyer" | "seller" | "tenant" | "bank" | "landlord";
export type PaymentMode = "cash" | "mortgage";
export type SOAStatus = "pending" | "generated" | "approved" | "disputed";

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

export interface PayableEntry {
  entityType: "external_partner" | "agent" | "team_lead" | "manager" | "referrer" | "conveyance" | "broker" | "rm" | "tl" | "ds";
  entityLabel: string;
  expectedAmount: number;
  refNumber?: string;
  status: PayableStatus;
  paidAmount?: number;
  paidDate?: string;
  soaReference?: string;
  soaStatus?: SOAStatus;
  soaDisputeNote?: string;
  entityUploadedInvoice?: string;
}

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

// Agent-app dispute model
export type DisputeStatus = "open" | "resolved";
export type DisputeField = "deal-amount" | "commission-percentage" | "report-date" | "other";
export interface DealDispute {
  id: string;
  dealId: string;
  field: DisputeField;
  description: string;
  correctValue?: string;
  status: DisputeStatus;
  createdAt: string;
}

// ============================================================
// Task / Document / Agent / ScheduleActivity
// ============================================================
// Currently used by agent-app only. Karvel may consume them later
// (operations team needs a task list too). Co-located in shared-domain
// so all canonical data lives in one place.
// ============================================================

export type TaskStatus = "todo" | "in-progress" | "completed" | "overdue";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId?: string;
  clientId?: string;
  opportunityId?: string;
  dueDate?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type DocumentType = "contract" | "id" | "financial" | "property" | "legal" | "other";

export interface Document {
  id: string;
  name: string;
  type: DocumentType;
  size: number;
  mimeType: string;
  clientId?: string;
  opportunityId?: string;
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Agent {
  id: string;
  name: string;
  email: string;
  phone: string;
  photo?: string;
  specialties?: string[];
  experience?: number;
  rating?: number;
  totalSales?: number;
}

export type ScheduleActivityType = "viewing" | "task";
export type ScheduleActivityStatus = "scheduled" | "completed" | "overdue" | "no-show" | "cancelled";
export type VisitOutcome = "completed" | "no-show" | "cancelled" | "rescheduled";
export type ClientInterestLevel = "high" | "medium" | "low" | "none";

export interface PropertyAddress {
  street: string;
  city: string;
  postalCode: string;
  lat: number;
  lng: number;
}

export interface MeetingPoint {
  message: string;
  sentVia: "whatsapp" | "sms" | "email";
  sentTo: string;
}

export interface VisitDocument {
  id: string;
  name: string;
  type: string;
}

export interface VisitFeedback {
  outcome: VisitOutcome;
  notes?: string;
  clientInterest?: ClientInterestLevel;
  clientLiked?: boolean;
  reason?: string;
}

export interface ScheduleActivity {
  id: string;
  type: ScheduleActivityType;
  title: string;
  description?: string;
  date: string;
  time: string;
  duration?: string;
  status: ScheduleActivityStatus;
  clientId?: string;
  clientName?: string;
  opportunityId?: string;
  opportunityName?: string;
  propertyId?: string;
  propertyName?: string;
  propertyImage?: string;
  propertyLocation?: string;
  clientPhone?: string;
  clientEmail?: string;
  clientAvatar?: string;
  propertyAddress?: PropertyAddress;
  meetingPoint?: MeetingPoint;
  meetingPointLabel?: string;
  documents?: VisitDocument[];
  feedback?: VisitFeedback;
}

// Convenience aggregate: a client with their full opportunity list joined.
export interface ClientWithOpportunities extends Client {
  opportunities: Opportunity[];
}

export interface Deal {
  // Required core
  id: string;
  type: DealType;
  status: DealStatus;
  dealAmount: number;
  reportDate: string;

  // Optional canonical
  opportunityId?: string;
  clientId?: string;
  agentId?: string;
  market?: Market;
  businessUnit?: BusinessUnit;
  country?: Country;
  currency?: Currency;
  createdAt?: string;
  updatedAt?: string;

  // Display caches (used by both apps)
  clientName?: string;
  agentName?: string;
  opportunityName?: string;
  title?: string;

  // ==========================================================
  // Karvel — operational / financial fields
  // ==========================================================
  channel?: string;
  ofCaseNumber?: string;

  // Property (REBU)
  buildingName?: string;
  unitNumber?: string;
  community?: string;
  subCommunity?: string;
  fullAddress?: string;
  propertyType?: string;
  projectName?: string;

  // Buyer / Seller (REBU)
  buyerName?: string;
  buyerPhone?: string;
  buyerEmail?: string;
  sellerName?: string;
  sellerTaxId?: string;
  sellerEmail?: string;
  paymentMode?: PaymentMode;

  // Revenue
  dealPrice?: number;
  takeRate?: number;
  huspyRevenue?: number;
  netHuspyRevenue?: number;
  conveyanceRevenue?: number;

  // Multi-agent + legacy single-agent display fields
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

  // Rebates / Subsidy
  rebatePercentage?: number;
  rebateAmount?: number;
  subsidyAmount?: number;

  // COGS
  cogsInternal?: number;
  cogsExternal?: number;
  cogsReferrals?: number;
  cogsRebates?: number;
  cogsSubsidy?: number;

  // MBU-specific
  bankName?: string;
  accountManager?: string;
  numberOfTranches?: number;
  disbursedAmount?: number;
  bankSlab?: number;
  brokerCommissionRate?: number;
  brokerPayout?: number;
  rmName?: string;
  rmCommissionRate?: number;
  rmPayout?: number;
  tlName?: string;
  tlCommissionRate?: number;
  tlPayout?: number;
  dsName?: string;
  dsCommissionRate?: number;
  dsPayout?: number;
  externalCommissionRate?: number;
  externalPayout?: number;

  // External partners
  externalPartners?: ExternalPartnerEntry[];
  externalPartnerName?: string;
  externalPartnerShare?: number;
  externalPartnerBank?: string;
  externalPartnerBankAccount?: string;

  // Receivables / Payables
  receivables?: ReceivableEntry[];
  invoiceNumber?: string;
  invoiceStatus?: InvoiceStatus;
  invoiceDate?: string;
  paymentReceivedDate?: string;
  paymentReceivedAmount?: number;
  payables?: PayableEntry[];
  payableRefNumber?: string;
  payableStatus?: PayableStatus;

  // Notes / Dispute / History
  latestNote?: string;
  isDisputed?: boolean;
  disputeNote?: string;
  statusHistory?: StatusHistoryEntry[];

  // ==========================================================
  // Agent-app — agent-facing commission / invoice fields
  // ==========================================================
  marketType?: "primary" | "secondary" | "leasing"; // alias for `market` used by agent-app UI
  commissionPercentage?: number;
  commissionAmount?: number;
  invoiceDueDate?: string;
  paymentDate?: string;
  dispute?: DealDispute;
}

// ============================================================
// Accounting — Ledger / Posting / PostingLine
// ============================================================

export interface Ledger {
  id: string;
  code: string;
  name: string;
  type: LedgerType;
  glId?: string;
  entityType?: "agent" | "bank" | "developer" | "buyer" | "seller" | "tenant" | "landlord";
  entityId?: string;
}

export interface Posting {
  id: string;
  externalRef?: string;
  businessProcess: BusinessProcess;
  createdBy: string;
  createdAt: string;
  valueDate: string;
  currency: Currency;
  status: PostingStatus;
  reversedByPostingId?: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

export interface PostingLine {
  id: string;
  postingId: string;
  ledgerId: string;
  side: PostingSide;
  amount: number;
  invoiceId?: string;       // receivable Invoice this line is claimed by
  agentInvoiceId?: string;  // AgentInvoice this line is claimed by
  metadata?: Record<string, unknown>;
}

export type AgentInvoiceStatus = "draft" | "issued" | "acknowledged" | "disputed" | "paid";

export interface AgentInvoice {
  id: string;
  agentId: string;
  invoiceNumber: string;
  period: string;
  status: AgentInvoiceStatus;
  currency: Currency;
  totalAmount: number;
  issueDate: string;
  dueDate?: string;
  paidDate?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// Invoice
// ============================================================
export interface Invoice {
  id: string;

  entityType: ReceivableEntityType;
  entityName: string;

  invoiceNumber: string;
  status: InvoiceStatus;
  amount: number;
  currency: Currency;
  invoiceDate: string;
  dueDate?: string;

  paymentReceivedDate?: string;
  paymentReceivedAmount?: number;

  createdAt: string;
  updatedAt: string;
}
