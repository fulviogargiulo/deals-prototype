import type { AgentInvoice } from "../entities";

// Agent invoices are periodic statements sent to agents.
// Each invoice is composed of PostingLines on the agent's AgentLiability subledger
// (identified by postingLine.agentInvoiceId === invoice.id).
// Lines include deal commissions AND standalone entries (incentives, fees, deductions).
// totalAmount = Σ CREDIT lines - Σ DEBIT lines on the claimed PostingLines.

export const sharedAgentInvoices: AgentInvoice[] = [
  // Felicia Canovas — Jan 2026
  // Lines: deal-001 commission CREDIT 4 620 + platform fee DEBIT 150 = net 4 470 EUR
  {
    id: "agent-inv-felicia-2026-01",
    agentId: "agent-felicia",
    invoiceNumber: "AINV-2026-FC-001",
    period: "2026-01",
    status: "paid",
    currency: "EUR",
    totalAmount: 4470,
    issueDate: "2026-01-31",
    dueDate: "2026-02-15",
    paidDate: "2026-02-10",
    createdAt: "2026-01-31T09:00:00.000Z",
    updatedAt: "2026-02-10T00:00:00.000Z",
  },

  // Felicia Canovas — Q1 2026 bonus settlement
  // Lines: Q1 performance bonus CREDIT 500 EUR
  {
    id: "agent-inv-felicia-2026-q1",
    agentId: "agent-felicia",
    invoiceNumber: "AINV-2026-FC-Q1",
    period: "2026-Q1",
    status: "issued",
    currency: "EUR",
    totalAmount: 500,
    issueDate: "2026-04-05",
    dueDate: "2026-04-20",
    createdAt: "2026-04-05T09:00:00.000Z",
    updatedAt: "2026-04-05T09:00:00.000Z",
  },

  // Gelo Huspy — May 2026
  // Lines: deal-016 SOA CREDIT 16 800 + incentive CREDIT 1 200 + platform fee DEBIT 300 = net 17 700 AED
  {
    id: "agent-inv-gelo-2026-05",
    agentId: "agent-gelo",
    invoiceNumber: "AINV-2026-GH-005",
    period: "2026-05",
    status: "issued",
    currency: "AED",
    totalAmount: 17700,
    issueDate: "2026-05-31",
    dueDate: "2026-06-15",
    createdAt: "2026-05-31T09:00:00.000Z",
    updatedAt: "2026-05-31T09:00:00.000Z",
  },
];
