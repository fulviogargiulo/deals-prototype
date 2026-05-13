import type { DealDocumentRequirement } from "../entities";
import type { DocumentRequirementStatus } from "../enums";
import { sharedDocumentRequirementTemplates } from "./documentRequirementTemplates";
import { sharedDeals } from "./deals";

// Derive status from deal status for mock data.
// finalized / pending-receivables / pending-agent-approval → all approved
//   (ops must have reviewed and approved docs to advance past under-review)
// under-review                    → mix of uploaded and pending
// pending-details                 → mostly pending, one or two uploaded
// canceled                        → approved (whatever was done before cancellation)
function statusForIndex(dealStatus: string, index: number): DocumentRequirementStatus {
  switch (dealStatus) {
    case "finalized":
    case "pending-receivables":
    case "pending-agent-approval":
    case "canceled":
      return "approved";
    case "under-review":
      return index === 0 ? "uploaded" : index % 3 === 0 ? "pending" : "uploaded";
    case "pending-details":
      return index === 0 ? "uploaded" : "pending";
    default:
      return "pending";
  }
}

function instantiate(dealId: string, market: string, country: string, businessUnit = "rebu"): DealDocumentRequirement[] {
  const deal = sharedDeals.find((d) => d.id === dealId);
  const dealStatus = deal?.status ?? "pending-details";
  const templates = sharedDocumentRequirementTemplates.filter(
    (t) => t.market === market && t.country === country && t.businessUnit === businessUnit
  );
  return templates.map((t, i) => ({
    id:    `ddr-${dealId}-${t.id.replace(/^tmpl-[^-]+-[^-]+-/, "")}`,
    dealId,
    label: t.label,
    required:     t.required,
    status:       statusForIndex(dealStatus, i),
  }));
}

export const sharedDealDocumentRequirements: DealDocumentRequirement[] = [
  ...instantiate("deal-001", "primary",   "es"),  // finalized
  ...instantiate("deal-002", "secondary", "es"),  // pending-agent-approval
  ...instantiate("deal-003", "leasing",   "es"),  // pending-details
  ...instantiate("deal-004", "secondary", "es"),  // pending-details
  ...instantiate("deal-005", "primary",   "sa"),  // under-review
  ...instantiate("deal-006", "secondary", "es"),  // pending-agent-approval
  ...instantiate("deal-007", "primary",   "es"),  // under-review
  ...instantiate("deal-008", "secondary", "es"),  // finalized
  ...instantiate("deal-009", "secondary", "ae"),  // finalized
  ...instantiate("deal-010", "primary",   "ae"),  // canceled
  ...instantiate("deal-013", "secondary", "es"),  // pending-receivables
  ...instantiate("deal-016", "secondary", "ae"),  // finalized
  ...instantiate("deal-017", "secondary", "es"),  // finalized
  ...instantiate("deal-018", "primary",   "es"),  // pending-agent-approval
  ...instantiate("deal-019", "primary",   "es"),  // canceled
  ...instantiate("deal-011", "primary",   "ae", "mortgage"),  // pending-details
  ...instantiate("deal-012", "secondary", "ae", "mortgage"),  // under-review
  ...instantiate("deal-014", "secondary", "es", "mortgage"),  // pending-receivables
  ...instantiate("deal-015", "primary",   "sa", "mortgage"),  // pending-receivables
];
