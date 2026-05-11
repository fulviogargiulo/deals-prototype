import type { Posting } from "../entities";

// Posting fixtures — canonical double-entry records.
// Each posting is self-balancing: Σ DEBIT lines = Σ CREDIT lines (same currency).
// dealId is a direct FK. businessUnit carries the BU dimension so that standalone
// postings (no dealId) can still be attributed to a reporting segment.

export const sharedPostings: Posting[] = [
  // ── deal-001 full lifecycle (REBU, EUR) ────────────────────────────────────

  {
    id: "posting-001",
    dealId: "deal-001",
    businessUnit: "rebu",
    externalRef: "P0001",
    businessProcess: "deal_close",
    createdBy: "system",
    createdAt: "2026-01-10T09:00:00.000Z",
    valueDate: "2026-01-10",
    currency: "EUR",

    description: "Commission earned — deal-001 (Mariana Dañobeitia, Buy, €385k)",
  },
  {
    id: "posting-002",
    dealId: "deal-001",
    businessUnit: "rebu",
    externalRef: "P0002",
    businessProcess: "bank_statement_inbound_matched",
    createdBy: "system",
    createdAt: "2026-01-12T14:00:00.000Z",
    valueDate: "2026-01-12",
    currency: "EUR",

    description: "Payment received — INV-2026-001 (Mariana Dañobeitia)",
  },
  {
    id: "posting-003",
    dealId: "deal-001",
    businessUnit: "rebu",
    externalRef: "AGINV-001",
    businessProcess: "agent_invoice",
    createdBy: "user-ops-finance",
    createdAt: "2026-01-20T11:00:00.000Z",
    valueDate: "2026-01-20",
    currency: "EUR",

    description: "Agent invoice — Felicia Canovas, deal-001",
  },
  {
    id: "posting-004",
    dealId: "deal-001",
    businessUnit: "rebu",
    externalRef: "PAY-001",
    businessProcess: "payout_instructed",
    createdBy: "user-ops-finance",
    createdAt: "2026-01-25T10:00:00.000Z",
    valueDate: "2026-01-25",
    currency: "EUR",

    description: "Agent payout — Felicia Canovas, deal-001",
  },

  // ── deal-016 — AED, split receivable, fully paid (REBU) ───────────────────

  {
    id: "posting-007",
    dealId: "deal-016",
    businessUnit: "rebu",
    externalRef: "P0007",
    businessProcess: "deal_close",
    createdBy: "system",
    createdAt: "2026-05-04T09:00:00.000Z",
    valueDate: "2026-05-04",
    currency: "AED",

    description: "Commission earned — deal-016 (Fatima Al Mansouri, Sell, AED 2.1M, split receivable)",
  },
  {
    id: "posting-008",
    dealId: "deal-016",
    businessUnit: "rebu",
    externalRef: "P0008",
    businessProcess: "bank_statement_inbound_matched",
    createdBy: "system",
    createdAt: "2026-05-04T16:00:00.000Z",
    valueDate: "2026-05-04",
    currency: "AED",

    description: "Payment received — INV-2026-016A (Fatima Al Mansouri, seller)",
  },
  {
    id: "posting-009",
    dealId: "deal-016",
    businessUnit: "rebu",
    externalRef: "P0009",
    businessProcess: "bank_statement_inbound_matched",
    createdBy: "system",
    createdAt: "2026-05-05T10:00:00.000Z",
    valueDate: "2026-05-05",
    currency: "AED",

    description: "Payment received — INV-2026-016B (Emaar Properties, developer)",
  },

  // ── Standalone — Q1 2026 performance bonus, agent-felicia (REBU, EUR) ─────

  {
    id: "posting-010",
    businessUnit: "rebu",
    externalRef: "ADJ-2026-Q1-001",
    businessProcess: "bonus",
    createdBy: "user-ops-finance",
    createdAt: "2026-04-01T09:00:00.000Z",
    valueDate: "2026-04-01",
    currency: "EUR",

    description: "Q1 2026 performance bonus — Felicia Canovas",
  },

  // ── deal-016 — agent invoice, agent-gelo (REBU, AED) ─────────────────────

  {
    id: "posting-011",
    dealId: "deal-016",
    businessUnit: "rebu",
    externalRef: "AGINV-016",
    businessProcess: "agent_invoice",
    createdBy: "user-ops-finance",
    createdAt: "2026-05-10T11:00:00.000Z",
    valueDate: "2026-05-10",
    currency: "AED",

    description: "Agent invoice — Gelo Huspy, deal-016",
  },

  // ── Standalone — Q2 2026 incentive + platform fee, agent-gelo (REBU, AED) ─

  {
    id: "posting-012",
    businessUnit: "rebu",
    externalRef: "ADJ-2026-Q2-GELO-INC",
    businessProcess: "incentive",
    createdBy: "user-ops-finance",
    createdAt: "2026-05-10T11:30:00.000Z",
    valueDate: "2026-05-10",
    currency: "AED",

    description: "Q2 2026 incentive — Gelo Huspy",
  },
  {
    id: "posting-013",
    businessUnit: "rebu",
    externalRef: "FEE-2026-05-GELO",
    businessProcess: "platform_fee",
    createdBy: "system",
    createdAt: "2026-05-01T00:00:00.000Z",
    valueDate: "2026-05-01",
    currency: "AED",

    description: "May 2026 platform support fee — Gelo Huspy",
  },

  // ── Standalone — Jan 2026 platform fee, agent-felicia (REBU, EUR) ─────────

  {
    id: "posting-014",
    businessUnit: "rebu",
    externalRef: "FEE-2026-01-FELICIA",
    businessProcess: "platform_fee",
    createdBy: "system",
    createdAt: "2026-01-01T00:00:00.000Z",
    valueDate: "2026-01-01",
    currency: "EUR",

    description: "Jan 2026 platform support fee — Felicia Canovas",
  },

  // ── deal-018 — agent-felicia, UNALLOCATED (REBU, EUR) ────────────────────

  {
    id: "posting-015",
    dealId: "deal-018",
    businessUnit: "rebu",
    externalRef: "AGINV-018",
    businessProcess: "agent_invoice",
    createdBy: "user-ops-finance",
    createdAt: "2026-04-15T11:00:00.000Z",
    valueDate: "2026-04-15",
    currency: "EUR",

    description: "Agent invoice — Felicia Canovas, deal-018",
  },

  // ── Standalone — Apr 2026 platform fee, agent-felicia (REBU, EUR) ─────────

  {
    id: "posting-016",
    businessUnit: "rebu",
    externalRef: "FEE-2026-04-FELICIA",
    businessProcess: "platform_fee",
    createdBy: "system",
    createdAt: "2026-04-01T00:00:00.000Z",
    valueDate: "2026-04-01",
    currency: "EUR",

    description: "Apr 2026 platform support fee — Felicia Canovas",
  },
];
