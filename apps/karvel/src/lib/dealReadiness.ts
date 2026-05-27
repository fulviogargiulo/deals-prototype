// Computes the "readiness" state for a deal — what mode the workflow is in,
// what's blocking forward motion, and which transition actions are available.
//
// Returned by computeDealReadiness() and consumed by <DealHeader>.

import type { Deal, DealStatus } from "@/data/types";
import {
  sharedInvoices,
  type DealDocumentRequirement,
} from "@huspy/shared-domain";

export type ReadinessMode =
  | "blocked"   // amber — under-review with open items
  | "ready"     // green — under-review, all clear
  | "waiting"   // blue — ball is in the agent's court
  | "locked"   // grey — finance owns it (invoicing)
  | "terminal"  // green — finalized
  | "canceled"; // red — voided

export interface ReadinessItem {
  done: boolean;
  label: string;
  /** Optional jump-link to a section id on the page (e.g. "docs", "pnl"). */
  cta?: { label: string; targetId: string };
}

export interface ReadinessAction {
  label: string;
  to: DealStatus;
  variant: "primary" | "secondary";
  icon?: "send" | "undo" | "msg";
}

export interface DealReadiness {
  mode: ReadinessMode;
  headline: string;
  sub?: string;
  items: ReadinessItem[];
  primary?: ReadinessAction;
  secondary?: ReadinessAction;
  disabledReason?: string;
}

interface Args {
  deal: Deal;
  status: DealStatus;
  docs: DealDocumentRequirement[];
  pnlPendingApproval: boolean;
}

export function computeDealReadiness(args: Args): DealReadiness {
  const { deal, status, docs, pnlPendingApproval } = args;

  switch (status) {
    case "under-review":
      return underReviewReadiness(docs, pnlPendingApproval);
    case "pending-details":
      return pendingDetailsReadiness(docs);
    case "pending-agent-approval":
      return pendingAgentApprovalReadiness();
    case "invoicing":
      return invoicingReadiness(deal);
    case "finalized":
      return { mode: "terminal", headline: "Finalized", sub: "All outbound invoices paid. Deal closed.", items: [] };
    case "canceled":
      return { mode: "canceled", headline: "Canceled", sub: "This deal has been voided and cannot be reactivated.", items: [] };
    default:
      return { mode: "locked", headline: String(status), items: [] };
  }
}

function underReviewReadiness(docs: DealDocumentRequirement[], pnlPendingApproval: boolean): DealReadiness {
  const cleared = docs.filter((d) => d.status === "approved" || d.status === "waived").length;
  const total = docs.length;
  const docsDone = total === 0 || cleared === total;

  const items: ReadinessItem[] = [];
  items.push({
    done: docsDone,
    label: total === 0
      ? "No document requirements set"
      : `${cleared} of ${total} documents approved or waived`,
    cta: total === 0 ? undefined : { label: "Open documents", targetId: "docs" },
  });
  items.push({
    done: !pnlPendingApproval,
    label: pnlPendingApproval ? "P&L changes awaiting Finance Lead approval" : "P&L approved",
    cta: pnlPendingApproval ? { label: "Open P&L", targetId: "pnl" } : undefined,
  });

  const open = items.filter((i) => !i.done);
  const ready = open.length === 0;

  return {
    mode: ready ? "ready" : "blocked",
    headline: ready
      ? "Ready to send to agent approval"
      : `${open.length} thing${open.length === 1 ? "" : "s"} to clear before sending to agent approval`,
    sub: ready ? "All requirements met." : undefined,
    items,
    primary:   { label: "Send to agent approval", to: "pending-agent-approval", variant: "primary", icon: "send" },
    secondary: { label: "Request info from agent", to: "pending-details",        variant: "secondary", icon: "msg"  },
    disabledReason: ready ? undefined : "Resolve the open requirements first.",
  };
}

function pendingDetailsReadiness(docs: DealDocumentRequirement[]): DealReadiness {
  const pending = docs.filter((d) => d.status === "pending");
  return {
    mode: "waiting",
    headline: "Waiting on agent",
    sub: pending.length > 0
      ? `${pending.length} outstanding request${pending.length === 1 ? "" : "s"}`
      : "No specific items requested",
    items: pending.slice(0, 5).map((d) => ({
      done: false,
      label: d.label,
      cta: { label: "Open", targetId: "docs" },
    })),
    secondary: { label: "Pull back to review", to: "under-review", variant: "secondary", icon: "undo" },
  };
}

function pendingAgentApprovalReadiness(): DealReadiness {
  return {
    mode: "waiting",
    headline: "Awaiting agent confirmation",
    sub: "Agent must confirm the commission terms before invoicing can begin.",
    items: [],
    primary:   { label: "Move to invoicing", to: "invoicing", variant: "primary", icon: "send" },
    secondary: { label: "Pull back to review", to: "under-review", variant: "secondary", icon: "undo" },
  };
}

function invoicingReadiness(deal: Deal): DealReadiness {
  const invs = sharedInvoices.filter((i) => i.dealId === deal.id);
  const out = invs.filter((i) => i.direction === "outbound");
  const outPaid = out.filter((i) => i.status === "paid").length;
  return {
    mode: "locked",
    headline: "Locked for editing · Finance owns next steps",
    sub: out.length > 0
      ? `${outPaid} of ${out.length} outbound invoice${out.length === 1 ? "" : "s"} paid · auto-finalizes when complete`
      : "No outbound invoices yet",
    items: [],
  };
}
