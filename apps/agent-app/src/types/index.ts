import type { Client as BaseClient } from "@huspy/shared-domain";

export type VerificationStatus = 'incoming' | 'pending' | 'verified';

export type OpportunityType = 'buy' | 'rent' | 'sell' | 'lease' | 'mortgage';

export type OpportunityStatus = 'new' | 'to-review' | 'qualified' | 'active' | 'under-offer' | 'closed';

export type TaskStatus = 'todo' | 'in-progress' | 'completed' | 'overdue';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export type DocumentType = 'contract' | 'id' | 'financial' | 'property' | 'legal' | 'other';

export type PropertyStatus = 'published' | 'in-review' | 'draft' | 'rejected' | 'delisted';

export type DelistReason = 'sold' | 'lost';

export interface Client extends BaseClient {
  description?: string;
  location?: string;
  preferredLanguage?: string;
  verificationStatus: VerificationStatus;
  source?: 'self-created' | 'idealista' | 'fotocasa'; // Source of client
  expiresAt?: string; // For incoming clients - time limit to accept
  lastActivity: string; // Description of the last activity
}

export interface Opportunity {
  id: string;
  clientId: string;
  type: OpportunityType;
  status: OpportunityStatus;
  title: string;
  priceRange?: {
    min: number;
    max: number;
    currency: string;
  };
  originalPriceRange?: {
    min: number;
    max: number;
    currency: string;
  };
  bedrooms?: number;
  bathrooms?: number;
  sizeRange?: {
    min: number;
    max: number;
    unit: string;
  };
  neighborhoods: string[];
  tags: string[];
  portalBadges: string[];
  source?: string;
  updatesCount: number;
  pendingActions: string[];
  propertyTypes?: string[];
  images?: string[];
  description?: string;
  agentId?: string;
  createdAt: string;
  updatedAt: string;
}

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

export interface ClientWithOpportunities extends Client {
  opportunities: Opportunity[];
}

export interface GlobalSearchResult {
  id: string;
  type: 'client' | 'opportunity' | 'property' | 'task' | 'document';
  title: string;
  subtitle?: string;
  metadata?: string;
}

export type ScheduleActivityType = 'viewing' | 'task';
export type ScheduleActivityStatus = 'scheduled' | 'completed' | 'overdue' | 'no-show' | 'cancelled';

export type VisitOutcome = 'completed' | 'no-show' | 'cancelled' | 'rescheduled';
export type ClientInterestLevel = 'high' | 'medium' | 'low' | 'none';

// Deal types
export type DealStatus = 'reported' | 'pending-details' | 'under-review' | 'finalised' | 'pending-payment' | 'pending-receivables' | 'paid' | 'canceled';
export type DisputeStatus = 'open' | 'resolved';
export type DisputeField = 'deal-amount' | 'commission-percentage' | 'report-date' | 'other';
export type LineItemCategory = 'deal-commission' | 'referral-commission' | 'support-fee' | 'clawback' | 'other';
export type LineItemIssue = 'amount' | 'description' | 'category' | 'other';

export interface Deal {
  id: string;
  opportunityId: string;
  opportunityName: string;
  clientId: string;
  clientName: string;
  type: OpportunityType;
  marketType: 'primary' | 'secondary' | 'leasing';
  title: string;
  dealAmount: number;
  commissionPercentage: number;
  commissionAmount: number;
  reportDate: string;
  status: DealStatus;
  currency: string;
  dispute?: DealDispute;
  invoiceNumber?: string;
  invoiceDueDate?: string;
  paymentDate?: string;
}

export interface DealDispute {
  id: string;
  dealId: string;
  field: DisputeField;
  description: string;
  correctValue?: string;
  status: DisputeStatus;
  createdAt: string;
}

export interface StatementLineItem {
  id: string;
  description: string;
  type: 'credit' | 'debit';
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
  status: DisputeStatus;
  createdAt: string;
}

export interface StatementOfAccount {
  id: string;
  cycleLabel: string;
  lineItems: StatementLineItem[];
  totalCredit: number;
  totalDebit: number;
  balance: number;
  status: 'draft' | 'confirmed' | 'paid';
  generatedAt: string;
  expiresAt: string;
}

export interface PropertyAddress {
  street: string;
  city: string;
  postalCode: string;
  lat: number;
  lng: number;
}

export interface MeetingPoint {
  message: string;
  sentVia: 'whatsapp' | 'sms' | 'email';
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
  clientLiked?: boolean; // Whether the client liked the property
  reason?: string; // For no-show/cancelled
}

export interface ScheduleActivity {
  id: string;
  type: ScheduleActivityType;
  title: string;
  description?: string;
  date: string; // ISO date string (YYYY-MM-DD)
  time: string; // e.g., "10:00"
  duration?: string; // e.g., "30m" or "1h 30m"
  status: ScheduleActivityStatus;
  clientId?: string;
  clientName?: string;
  opportunityId?: string;
  opportunityName?: string;
  propertyId?: string;
  propertyName?: string;
  propertyImage?: string;
  propertyLocation?: string;
  // Extended fields for visit details
  clientPhone?: string;
  clientEmail?: string;
  clientAvatar?: string;
  propertyAddress?: PropertyAddress;
  meetingPoint?: MeetingPoint;
  meetingPointLabel?: string; // Simple description of where to meet
  documents?: VisitDocument[];
  feedback?: VisitFeedback;
}