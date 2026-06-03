import { sharedInvoices, sharedDeals, sharedPostings, sharedPostingLines, sharedDocuments } from "@huspy/shared-domain";
import type { Invoice } from "@huspy/shared-domain";
import { findDeal } from "@/data/dealStore";
import { findTranche, updateTranche } from "@/data/trancheStore";
import { fireCommissionAccrualOnTransition } from "@/lib/dealCalculations";

const LEDGERS: Record<string, { AR: number; REV: number; VAT: number; EXP: number; AP: number; BANK: number }> = {
  EUR: { AR: 2, REV: 6, VAT: 5, EXP: 7, AP: 4, BANK: 1 },
  AED: { AR: 9, REV: 13, VAT: 12, EXP: 14, AP: 11, BANK: 8 },
  SAR: { AR: 16, REV: 20, VAT: 19, EXP: 21, AP: 18, BANK: 15 },
};

export function createPaidPosting(inv: Invoice): void {
  const l = LEDGERS[inv.currency] ?? LEDGERS.EUR;
  const tranche = inv.trancheId ? findTranche(inv.trancheId) : undefined;
  const deal = tranche ? findDeal(tranche.dealId) : undefined;
  const now = new Date().toISOString();
  const pid = `posting-auto-${inv.id}-paid-${Date.now()}`;
  const vat = inv.vatAmount ?? 0;
  const gross = inv.subtotal + vat;

  sharedPostings.push({
    id: pid,
    trancheId: inv.trancheId,
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

export function attachInvoiceDocumentToDeal(invoice: Invoice): void {
  if (invoice.direction !== "outbound" || !invoice.trancheId) return;
  if (sharedDocuments.some((d) => d.invoiceId === invoice.id)) return;
  const now = new Date().toISOString();
  const tranche = findTranche(invoice.trancheId);
  sharedDocuments.push({
    id: `doc-inv-${invoice.id}`,
    name: `${invoice.invoiceNumber}.pdf`,
    type: "invoice",
    size: 0,
    mimeType: "application/pdf",
    dealId: tranche?.dealId,
    invoiceId: invoice.id,
    uploadedBy: "ops",
    createdAt: now,
    updatedAt: now,
  });
}

export function autoFinalizeDealIfComplete(invoice: Invoice): void {
  if (!invoice.trancheId) return;
  const tranche = findTranche(invoice.trancheId);
  if (!tranche || tranche.status !== "invoicing") return;
  const deal = findDeal(tranche.dealId);
  if (!deal) return;
  const trancheInvoices = sharedInvoices.filter((i) => i.trancheId === invoice.trancheId);
  if (trancheInvoices.length > 0 && trancheInvoices.every((i) => i.status === "paid")) {
    const now = new Date().toISOString();
    updateTranche({
      ...tranche,
      status: "finalized",
      statusHistory: [
        ...(tranche.statusHistory ?? []),
        { from: "invoicing" as const, to: "finalized" as const, timestamp: now, note: "Auto-finalized: all invoices paid" },
      ],
    });
    fireCommissionAccrualOnTransition(tranche, deal, "finalized");
  }
}
