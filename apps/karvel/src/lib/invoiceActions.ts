import { sharedInvoices, sharedDeals, sharedPostings, sharedPostingLines, sharedDocuments } from "@huspy/shared-domain";
import type { Invoice } from "@huspy/shared-domain";
import { findDeal, updateDeal } from "@/data/dealStore";
import { fireCommissionAccrualOnTransition } from "@/lib/dealCalculations";

const LEDGERS: Record<string, { AR: number; REV: number; VAT: number; EXP: number; AP: number; BANK: number }> = {
  EUR: { AR: 2, REV: 6, VAT: 5, EXP: 7, AP: 4, BANK: 1 },
  AED: { AR: 9, REV: 13, VAT: 12, EXP: 14, AP: 11, BANK: 8 },
  SAR: { AR: 16, REV: 20, VAT: 19, EXP: 21, AP: 18, BANK: 15 },
};

export function createPaidPosting(inv: Invoice): void {
  const l = LEDGERS[inv.currency] ?? LEDGERS.EUR;
  const deal = sharedDeals.find((d) => d.id === inv.dealId);
  const now = new Date().toISOString();
  const pid = `posting-auto-${inv.id}-paid-${Date.now()}`;
  const vat = inv.vatAmount ?? 0;
  const gross = inv.subtotal + vat;

  sharedPostings.push({
    id: pid,
    dealId: inv.dealId,
    businessUnit: deal?.businessUnit ?? null,
    businessProcess: (inv.direction === "outbound" ? "bank_statement_inbound_matched" : "bank_statement_outbound_matched") as any,
    createdBy: "ops",
    createdAt: now,
    valueDate: inv.paidDate ?? now.slice(0, 10),
    currency: inv.currency,
    description: `${inv.direction === "outbound" ? "Payment received" : "Payment disbursed"} — ${inv.invoiceNumber}`,
  });

  if (inv.direction === "outbound") {
    sharedPostingLines.push({ id: `${pid}-1`, postingId: pid, ledgerId: l.BANK, side: "DEBIT",  amount: gross });
    sharedPostingLines.push({ id: `${pid}-2`, postingId: pid, ledgerId: l.AR,   side: "CREDIT", amount: gross, invoiceId: inv.id });
  } else {
    sharedPostingLines.push({ id: `${pid}-1`, postingId: pid, ledgerId: l.AP,   side: "DEBIT",  amount: gross, invoiceId: inv.id });
    sharedPostingLines.push({ id: `${pid}-2`, postingId: pid, ledgerId: l.BANK, side: "CREDIT", amount: gross });
  }
}

/**
 * Attach an outbound invoice to its deal as a Document so the agent can
 * download it from agent-app and chase the client for payment. Idempotent.
 * Inbound invoices are not surfaced to the agent.
 */
export function attachInvoiceDocumentToDeal(invoice: Invoice): void {
  if (invoice.direction !== "outbound" || !invoice.dealId) return;
  if (sharedDocuments.some((d) => d.invoiceId === invoice.id)) return;
  const now = new Date().toISOString();
  sharedDocuments.push({
    id: `doc-inv-${invoice.id}`,
    name: `${invoice.invoiceNumber}.pdf`,
    type: "invoice",
    size: 0,
    mimeType: "application/pdf",
    dealId: invoice.dealId,
    invoiceId: invoice.id,
    uploadedBy: "ops",
    createdAt: now,
    updatedAt: now,
  });
}

export function autoFinalizeDealIfComplete(invoice: Invoice): void {
  if (!invoice.dealId) return;
  const deal = findDeal(invoice.dealId);
  if (!deal || deal.status !== "invoicing") return;
  const dealInvoices = sharedInvoices.filter((i) => i.dealId === invoice.dealId);
  if (dealInvoices.length > 0 && dealInvoices.every((i) => i.status === "paid")) {
    const now = new Date().toISOString();
    updateDeal({
      ...deal,
      status: "finalized",
      statusHistory: [
        ...(deal.statusHistory ?? []),
        { from: "invoicing" as const, to: "finalized" as const, timestamp: now, note: "Auto-finalized: all invoices paid" },
      ],
    });
    fireCommissionAccrualOnTransition(deal, "finalized");
  }
}
