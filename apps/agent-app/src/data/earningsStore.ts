import { sharedPostingLines, sharedInvoices } from '@huspy/shared-domain';
import type { PostingLine, Invoice } from '@huspy/shared-domain';

// Module-level mutable store — same pattern as karvel's dealStore.
// Initialized from shared fixtures; mutations persist for the session lifetime.

let _postingLines: PostingLine[] = [...sharedPostingLines];
let _invoices: Invoice[] = [...sharedInvoices];

export const getPostingLines = (): PostingLine[] => _postingLines;
export const getInvoices = (): Invoice[] => _invoices;

export function createInvoice(invoice: Invoice, lineIds: string[]): void {
  _invoices = [..._invoices, invoice];
  _postingLines = _postingLines.map(l =>
    lineIds.includes(l.id) ? { ...l, invoiceId: invoice.id } : l
  );
}
