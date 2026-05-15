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

function instantiate(dealId: string): DealDocumentRequirement[] {
  const deal = sharedDeals.find((d) => d.id === dealId);
  if (!deal) return [];
  const templates = sharedDocumentRequirementTemplates.filter(
    (t) => t.market === deal.market && t.country === deal.country && t.businessUnit === (deal.businessUnit ?? "rebu")
  );
  return templates.map((t, i) => ({
    id:       `ddr-${dealId}-${t.id.replace(/^tmpl-[^-]+-[^-]+-/, "")}`,
    dealId,
    label:    t.label,
    required: t.required,
    status:   statusForIndex(deal.status, i),
  }));
}

export const sharedDealDocumentRequirements: DealDocumentRequirement[] = [
  ...instantiate("deal-001"),
  ...instantiate("deal-002"),
  ...instantiate("deal-003"),
  ...instantiate("deal-004"),
  ...instantiate("deal-005"),
  ...instantiate("deal-006"),
  ...instantiate("deal-007"),
  ...instantiate("deal-008"),
  ...instantiate("deal-009"),
  ...instantiate("deal-010"),
  ...instantiate("deal-011"),
  ...instantiate("deal-012"),
  ...instantiate("deal-013"),
  ...instantiate("deal-014"),
  ...instantiate("deal-015"),
  ...instantiate("deal-016"),
  ...instantiate("deal-017"),
  ...instantiate("deal-018"),
  ...instantiate("deal-019"),
];
