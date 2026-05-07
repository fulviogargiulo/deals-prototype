import type { Posting } from "../entities";

// Posting fixtures — canonical double-entry records.
// Each posting is self-balancing: Σ DEBIT lines = Σ CREDIT lines (same currency).
// deal_id lives in metadata (soft link), not as a FK, so standalone postings (no deal)
// are first-class — see posting-010 (Q1 bonus, no deal_id).

export const sharedPostings: Posting[] = [
  // ── deal-001 full lifecycle ─────────────────────────────────────────────────

  // Commission earned when deal-001 closes (EUR 11 550)
  {
    id: "posting-001",
    externalRef: "P0001",
    businessProcess: "deal_close",
    createdBy: "system",
    createdAt: "2026-01-10T09:00:00.000Z",
    valueDate: "2026-01-10",
    currency: "EUR",
    status: "posted",
    description: "Commission earned — deal-001 (Mariana Dañobeitia, Buy, €385k)",
    metadata: { deal_id: "deal-001", invoice_id: "inv-001", market: "primary", bu: "rebu" },
  },
  // Payment received from buyer — INV-2026-001
  {
    id: "posting-002",
    externalRef: "P0002",
    businessProcess: "bank_statement_inbound_matched",
    createdBy: "system",
    createdAt: "2026-01-12T14:00:00.000Z",
    valueDate: "2026-01-12",
    currency: "EUR",
    status: "posted",
    description: "Payment received — INV-2026-001 (Mariana Dañobeitia)",
    metadata: { deal_id: "deal-001", invoice_id: "inv-001", bank_ref: "WIRE-20260112-001" },
  },
  // Agent invoice — commission crystallised for agent-felicia (40% of 11 550 = 4 620)
  {
    id: "posting-003",
    externalRef: "AGINV-001",
    businessProcess: "agent_invoice",
    createdBy: "user-ops-finance",
    createdAt: "2026-01-20T11:00:00.000Z",
    valueDate: "2026-01-20",
    currency: "EUR",
    status: "posted",
    description: "Agent invoice — Felicia Canovas, deal-001",
    metadata: { deal_id: "deal-001", agent_id: "agent-felicia" },
  },
  // Payout instructed — cash leaves bank
  {
    id: "posting-004",
    externalRef: "PAY-001",
    businessProcess: "payout_instructed",
    createdBy: "user-ops-finance",
    createdAt: "2026-01-25T10:00:00.000Z",
    valueDate: "2026-01-25",
    currency: "EUR",
    status: "posted",
    description: "Agent payout — Felicia Canovas, deal-001",
    metadata: { deal_id: "deal-001", agent_id: "agent-felicia", payout_ref: "PAY-001" },
  },

  // ── deal-016 — AED, split receivable, fully paid ───────────────────────────

  // Commission earned — AED 42 000 split: seller 25 200 + developer 16 800
  {
    id: "posting-007",
    externalRef: "P0007",
    businessProcess: "deal_close",
    createdBy: "system",
    createdAt: "2026-05-04T09:00:00.000Z",
    valueDate: "2026-05-04",
    currency: "AED",
    status: "posted",
    description: "Commission earned — deal-016 (Fatima Al Mansouri, Sell, AED 2.1M, split receivable)",
    metadata: { deal_id: "deal-016", market: "secondary", bu: "rebu" },
  },
  // Payment received — seller (Fatima Al Mansouri)
  {
    id: "posting-008",
    externalRef: "P0008",
    businessProcess: "bank_statement_inbound_matched",
    createdBy: "system",
    createdAt: "2026-05-04T16:00:00.000Z",
    valueDate: "2026-05-04",
    currency: "AED",
    status: "posted",
    description: "Payment received — INV-2026-016A (Fatima Al Mansouri, seller)",
    metadata: { deal_id: "deal-016", invoice_id: "inv-016-a", bank_ref: "WIRE-20260504-AED-001" },
  },
  // Payment received — developer (Emaar Properties)
  {
    id: "posting-009",
    externalRef: "P0009",
    businessProcess: "bank_statement_inbound_matched",
    createdBy: "system",
    createdAt: "2026-05-05T10:00:00.000Z",
    valueDate: "2026-05-05",
    currency: "AED",
    status: "posted",
    description: "Payment received — INV-2026-016B (Emaar Properties, developer)",
    metadata: { deal_id: "deal-016", invoice_id: "inv-016-b", bank_ref: "WIRE-20260505-AED-001" },
  },

  // ── Standalone — no deal_id ────────────────────────────────────────────────

  // Q1 2026 performance bonus for Felicia Canovas — not tied to any deal
  {
    id: "posting-010",
    externalRef: "ADJ-2026-Q1-001",
    businessProcess: "manual_adjustment",
    createdBy: "user-ops-finance",
    createdAt: "2026-04-01T09:00:00.000Z",
    valueDate: "2026-04-01",
    currency: "EUR",
    status: "posted",
    description: "Q1 2026 performance bonus — Felicia Canovas",
    metadata: { agent_id: "agent-felicia", period: "Q1-2026" },
  },

  // ── deal-016 — agent invoice, agent-gelo ────────────────────────────────────

  // Commission crystallised for agent-gelo: AED 42 000 × 40% = 16 800
  {
    id: "posting-011",
    externalRef: "AGINV-016",
    businessProcess: "agent_invoice",
    createdBy: "user-ops-finance",
    createdAt: "2026-05-10T11:00:00.000Z",
    valueDate: "2026-05-10",
    currency: "AED",
    status: "posted",
    description: "Agent invoice — Gelo Huspy, deal-016",
    metadata: { deal_id: "deal-016", agent_id: "agent-gelo" },
  },

  // ── Standalone — no deal_id (agent-gelo) ───────────────────────────────────

  // Q2 2026 performance incentive for agent-gelo
  {
    id: "posting-012",
    externalRef: "ADJ-2026-Q2-GELO-INC",
    businessProcess: "manual_adjustment",
    createdBy: "user-ops-finance",
    createdAt: "2026-05-10T11:30:00.000Z",
    valueDate: "2026-05-10",
    currency: "AED",
    status: "posted",
    description: "Q2 2026 incentive — Gelo Huspy",
    metadata: { agent_id: "agent-gelo", line_type: "incentive", period: "Q2-2026" },
  },
  // May 2026 platform support fee — agent-gelo (deduction)
  {
    id: "posting-013",
    externalRef: "FEE-2026-05-GELO",
    businessProcess: "manual_adjustment",
    createdBy: "system",
    createdAt: "2026-05-01T00:00:00.000Z",
    valueDate: "2026-05-01",
    currency: "AED",
    status: "posted",
    description: "May 2026 platform support fee — Gelo Huspy",
    metadata: { agent_id: "agent-gelo", line_type: "platform_support_fee", period: "2026-05" },
  },
  // Jan 2026 platform support fee — agent-felicia (deduction on invoice)
  {
    id: "posting-014",
    externalRef: "FEE-2026-01-FELICIA",
    businessProcess: "manual_adjustment",
    createdBy: "system",
    createdAt: "2026-01-01T00:00:00.000Z",
    valueDate: "2026-01-01",
    currency: "EUR",
    status: "posted",
    description: "Jan 2026 platform support fee — Felicia Canovas",
    metadata: { agent_id: "agent-felicia", line_type: "platform_support_fee", period: "2026-01" },
  },

  // ── Apr 2026 — agent-felicia, UNALLOCATED (no agentInvoiceId on lines) ──────

  // Agent invoice — deal-018 commission crystallised for agent-felicia (EUR 15 000)
  {
    id: "posting-015",
    externalRef: "AGINV-018",
    businessProcess: "agent_invoice",
    createdBy: "user-ops-finance",
    createdAt: "2026-04-15T11:00:00.000Z",
    valueDate: "2026-04-15",
    currency: "EUR",
    status: "posted",
    description: "Agent invoice — Felicia Canovas, deal-018",
    metadata: { deal_id: "deal-018", agent_id: "agent-felicia" },
  },
  // Apr 2026 platform support fee — agent-felicia (EUR 150 deduction)
  {
    id: "posting-016",
    externalRef: "FEE-2026-04-FELICIA",
    businessProcess: "manual_adjustment",
    createdBy: "system",
    createdAt: "2026-04-01T00:00:00.000Z",
    valueDate: "2026-04-01",
    currency: "EUR",
    status: "posted",
    description: "Apr 2026 platform support fee — Felicia Canovas",
    metadata: { agent_id: "agent-felicia", line_type: "platform_support_fee", period: "2026-04" },
  },
];
