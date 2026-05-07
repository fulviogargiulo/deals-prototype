import { sharedPostingLines, sharedAgentInvoices } from '@huspy/shared-domain';
import type { PostingLine, AgentInvoice } from '@huspy/shared-domain';

// Module-level mutable store — same pattern as karvel's dealStore.
// Initialized from shared fixtures; mutations persist for the session lifetime.

let _postingLines: PostingLine[] = [...sharedPostingLines];
let _agentInvoices: AgentInvoice[] = [...sharedAgentInvoices];

export const getPostingLines = (): PostingLine[] => _postingLines;
export const getAgentInvoices = (): AgentInvoice[] => _agentInvoices;

export function createAgentInvoice(invoice: AgentInvoice, lineIds: string[]): void {
  _agentInvoices = [..._agentInvoices, invoice];
  _postingLines = _postingLines.map(l =>
    lineIds.includes(l.id) ? { ...l, agentInvoiceId: invoice.id } : l
  );
}
