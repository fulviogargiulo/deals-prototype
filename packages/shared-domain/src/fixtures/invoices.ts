import type { Invoice } from "../entities";

// Invoice fixtures — unified outbound (Huspy → client) and inbound (agent → Huspy).
// partyId links to the Party being billed (outbound) or billing Huspy (inbound).
// Multiple invoices per deal are intentional (e.g. seller + developer split).
export const sharedInvoices: Invoice[] = [
  // ── Outbound: Huspy bills clients ──────────────────────────────────────────

  // deal-001 — buy, paid, EUR 385 000 @ 3% = 11 550
  {
    id: "inv-001",
    direction: "outbound",
    partyId: "party-client-001",
    invoiceNumber: "INV-2026-001",
    status: "paid",
    amount: 11550,
    currency: "EUR",
    issueDate: "2026-01-10",
    dueDate: "2026-01-15",
    paidDate: "2026-01-12",
    createdAt: "2026-01-10T00:00:00.000Z",
    updatedAt: "2026-01-12T00:00:00.000Z",
  },

  // deal-007 — buy, pending-receivables, EUR 475 000 @ 2.5% = 11 875
  {
    id: "inv-007",
    direction: "outbound",
    partyId: "party-client-001",
    invoiceNumber: "INV-2026-007",
    status: "issued",
    amount: 11875,
    currency: "EUR",
    issueDate: "2026-03-05",
    dueDate: "2026-03-15",
    createdAt: "2026-03-05T00:00:00.000Z",
    updatedAt: "2026-03-05T00:00:00.000Z",
  },

  // deal-008 — sell, pending-receivables, EUR 580 000 @ 2.5% = 14 500 split
  {
    id: "inv-008-a",
    direction: "outbound",
    partyId: "party-client-002",
    invoiceNumber: "INV-2026-008A",
    status: "issued",
    amount: 8700,
    currency: "EUR",
    issueDate: "2026-03-05",
    dueDate: "2026-03-30",
    createdAt: "2026-03-05T00:00:00.000Z",
    updatedAt: "2026-03-05T00:00:00.000Z",
  },
  {
    id: "inv-008-b",
    direction: "outbound",
    partyId: "party-third-inmobiliaria-grupo-norte",
    invoiceNumber: "INV-2026-008B",
    status: "issued",
    amount: 5800,
    currency: "EUR",
    issueDate: "2026-03-10",
    dueDate: "2026-04-15",
    createdAt: "2026-03-10T00:00:00.000Z",
    updatedAt: "2026-03-10T00:00:00.000Z",
  },

  // deal-014 — mortgage, pending-receivables, EUR 496 000 @ 0.5% = 2 480
  {
    id: "inv-014",
    direction: "outbound",
    partyId: "party-third-caixabank",
    invoiceNumber: "INV-2026-014",
    status: "issued",
    amount: 2480,
    currency: "EUR",
    issueDate: "2026-04-15",
    dueDate: "2026-04-30",
    createdAt: "2026-04-15T00:00:00.000Z",
    updatedAt: "2026-05-01T00:00:00.000Z",
  },

  // deal-015 — mortgage, pending-receivables, SAR 920 000 @ 0.5% = 4 600
  {
    id: "inv-015",
    direction: "outbound",
    partyId: "party-third-snb",
    invoiceNumber: "INV-2026-015",
    status: "issued",
    amount: 4600,
    currency: "SAR",
    issueDate: "2026-05-02",
    dueDate: "2026-05-20",
    createdAt: "2026-05-02T00:00:00.000Z",
    updatedAt: "2026-05-02T00:00:00.000Z",
  },

  // deal-016 — sell, paid, AED 2 100 000 @ 2% = 42 000 split seller + developer
  {
    id: "inv-016-a",
    direction: "outbound",
    partyId: "party-client-007",
    invoiceNumber: "INV-2026-016A",
    status: "paid",
    amount: 25200,
    currency: "AED",
    issueDate: "2026-05-04",
    dueDate: "2026-05-15",
    paidDate: "2026-05-04",
    createdAt: "2026-05-04T00:00:00.000Z",
    updatedAt: "2026-05-04T00:00:00.000Z",
  },
  {
    id: "inv-016-b",
    direction: "outbound",
    partyId: "party-third-emaar",
    invoiceNumber: "INV-2026-016B",
    status: "paid",
    amount: 16800,
    currency: "AED",
    issueDate: "2026-05-04",
    dueDate: "2026-05-15",
    paidDate: "2026-05-05",
    createdAt: "2026-05-04T00:00:00.000Z",
    updatedAt: "2026-05-05T00:00:00.000Z",
  },

  // ── Inbound: agents bill Huspy ──────────────────────────────────────────────

  // Felicia Canovas — Jan 2026 (deal-001 commission 4 620 − platform fee 150 = net 4 470 EUR)
  {
    id: "agent-inv-felicia-2026-01",
    direction: "inbound",
    partyId: "party-agent-felicia",
    invoiceNumber: "AINV-2026-FC-001",
    status: "paid",
    amount: 4470,
    currency: "EUR",
    issueDate: "2026-01-31",
    dueDate: "2026-02-15",
    paidDate: "2026-02-10",
    period: "2026-01",
    createdAt: "2026-01-31T09:00:00.000Z",
    updatedAt: "2026-02-10T00:00:00.000Z",
  },

  // Felicia Canovas — Q1 2026 bonus settlement (500 EUR)
  {
    id: "agent-inv-felicia-2026-q1",
    direction: "inbound",
    partyId: "party-agent-felicia",
    invoiceNumber: "AINV-2026-FC-Q1",
    status: "issued",
    amount: 500,
    currency: "EUR",
    issueDate: "2026-04-05",
    dueDate: "2026-04-20",
    period: "2026-Q1",
    createdAt: "2026-04-05T09:00:00.000Z",
    updatedAt: "2026-04-05T09:00:00.000Z",
  },

  // Gelo Huspy — May 2026 (deal-016 commission 16 800 + incentive 1 200 − platform fee 300 = net 17 700 AED)
  {
    id: "agent-inv-gelo-2026-05",
    direction: "inbound",
    partyId: "party-agent-gelo",
    invoiceNumber: "AINV-2026-GH-005",
    status: "issued",
    amount: 17700,
    currency: "AED",
    issueDate: "2026-05-31",
    dueDate: "2026-06-15",
    period: "2026-05",
    createdAt: "2026-05-31T09:00:00.000Z",
    updatedAt: "2026-05-31T09:00:00.000Z",
  },
];
