import type { Posting } from "../entities";

// Posting fixtures — canonical double-entry records.
// Each posting is self-balancing: Σ DEBIT lines = Σ CREDIT lines (same currency).
// dealId is a direct FK. businessUnit carries the BU dimension so that standalone
// postings (no dealId) can still be attributed to a reporting segment.

export const sharedPostings: Posting[] = [
  // ── deal-001 full lifecycle (REBU, EUR) ────────────────────────────────────

  {
    id: "posting-001",
    trancheId: "tranche-001",
    businessUnit: "rebu",
    externalRef: "P0001",
    businessProcess: "invoice_issued",
    createdBy: "system",
    createdAt: "2026-01-10T09:00:00.000Z",
    valueDate: "2026-01-10",
    currency: "EUR",

    description: "Commission earned — deal-001 (Mariana Dañobeitia, Buy, €385k)",
  },
  {
    id: "posting-002",
    trancheId: "tranche-001",
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
    trancheId: "tranche-001",
    businessUnit: "rebu",
    externalRef: "AGINV-001",
    businessProcess: "commission_accrual",
    createdBy: "user-ops-finance",
    createdAt: "2026-01-20T11:00:00.000Z",
    valueDate: "2026-01-20",
    currency: "EUR",
    description: "Commission accrual — deal-001 (Felicia Canovas EUR 4 550.80)",
  },
  {
    id: "posting-004",
    businessUnit: "rebu",
    externalRef: "AGINV-ACCRUAL-001",
    businessProcess: "agent_invoice_accrual",
    createdBy: "user-ops-finance",
    createdAt: "2026-01-31T09:00:00.000Z",
    valueDate: "2026-01-31",
    currency: "EUR",
    description: "Agent invoice accrual — Felicia Canovas, Jan 2026 (INV-2026-009)",
  },
  {
    id: "posting-030",
    businessUnit: "rebu",
    externalRef: "PAY-AGINV-001",
    businessProcess: "bank_statement_outbound_matched",
    createdBy: "user-ops-finance",
    createdAt: "2026-02-10T11:00:00.000Z",
    valueDate: "2026-02-10",
    currency: "EUR",
    description: "Agent payout — Felicia Canovas, Jan 2026 (INV-2026-009)",
  },

  // ── deal-016 — AED, split receivable, fully paid (REBU) ───────────────────

  {
    id: "posting-007",
    trancheId: "tranche-016",
    businessUnit: "rebu",
    externalRef: "P0007",
    businessProcess: "invoice_issued",
    createdBy: "system",
    createdAt: "2026-05-04T09:00:00.000Z",
    valueDate: "2026-05-04",
    currency: "AED",
    description: "Commission earned — deal-016 (Fatima Al Mansouri, Sell, AED 2.1M — client split, inv-006)",
  },
  {
    id: "posting-007b",
    trancheId: "tranche-016",
    businessUnit: "rebu",
    externalRef: "P0007B",
    businessProcess: "invoice_issued",
    createdBy: "system",
    createdAt: "2026-05-04T09:00:00.000Z",
    valueDate: "2026-05-04",
    currency: "AED",
    description: "Commission earned — deal-016 (Fatima Al Mansouri, Sell, AED 2.1M — developer split, inv-007)",
  },
  {
    id: "posting-008",
    trancheId: "tranche-016",
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
    trancheId: "tranche-016",
    businessUnit: "rebu",
    externalRef: "P0009",
    businessProcess: "bank_statement_inbound_matched",
    createdBy: "system",
    createdAt: "2026-05-05T10:00:00.000Z",
    valueDate: "2026-05-05",
    currency: "AED",

    description: "Payment received — INV-2026-016B (Emaar Properties, developer)",
  },

  // ── Standalone — Q1 2026 performance bonus, agent-001 (REBU, EUR) ─────

  {
    id: "posting-010",
    businessUnit: "rebu",
    externalRef: "ADJ-2026-Q1-001",
    businessProcess: "agent_adjustment",
    createdBy: "user-ops-finance",
    createdAt: "2026-04-01T09:00:00.000Z",
    valueDate: "2026-04-01",
    currency: "EUR",

    description: "Q1 2026 performance bonus — Felicia Canovas",
  },
  {
    id: "posting-031",
    businessUnit: "rebu",
    externalRef: "AGINV-ACCRUAL-Q1-001",
    businessProcess: "agent_invoice_accrual",
    createdBy: "user-ops-finance",
    createdAt: "2026-04-05T09:00:00.000Z",
    valueDate: "2026-04-05",
    currency: "EUR",
    description: "Agent invoice accrual — Felicia Canovas, Q1 2026 bonus (INV-2026-010)",
  },

  // ── deal-001 — TL + Mgr commission accrual (REBU, EUR) ─────────────────
  {
    id: "posting-040",
    trancheId: "tranche-001",
    businessUnit: "rebu",
    externalRef: "AGINV-001-TL",
    businessProcess: "commission_accrual",
    createdBy: "user-ops-finance",
    createdAt: "2026-01-20T11:00:00.000Z",
    valueDate: "2026-01-20",
    currency: "EUR",
    description: "Commission accrual — Santiago Vega / TL for Felicia Canovas (deal-001)",
  },
  {
    id: "posting-041",
    trancheId: "tranche-001",
    businessUnit: "rebu",
    externalRef: "AGINV-001-MGR",
    businessProcess: "commission_accrual",
    createdBy: "user-ops-finance",
    createdAt: "2026-01-20T11:00:00.000Z",
    valueDate: "2026-01-20",
    currency: "EUR",
    description: "Commission accrual — Isabel Torres / Mgr for Felicia Canovas (deal-001)",
  },

  // ── deal-016 — agent invoice, agent-004 (REBU, AED) ─────────────────────

  {
    id: "posting-011",
    trancheId: "tranche-016",
    businessUnit: "rebu",
    externalRef: "AGINV-016",
    businessProcess: "commission_accrual",
    createdBy: "user-ops-finance",
    createdAt: "2026-05-10T11:00:00.000Z",
    valueDate: "2026-05-10",
    currency: "AED",
    description: "Commission accrual — deal-016 (Gelo Huspy AED 17 375.40)",
  },

  // ── deal-016 — TL + Mgr commission accrual (REBU, AED) ─────────────────
  {
    id: "posting-042",
    trancheId: "tranche-016",
    businessUnit: "rebu",
    externalRef: "AGINV-016-TL",
    businessProcess: "commission_accrual",
    createdBy: "user-ops-finance",
    createdAt: "2026-05-10T11:00:00.000Z",
    valueDate: "2026-05-10",
    currency: "AED",
    description: "Commission accrual — Santiago Vega / TL for Gelo Huspy (deal-016)",
  },
  {
    id: "posting-043",
    trancheId: "tranche-016",
    businessUnit: "rebu",
    externalRef: "AGINV-016-MGR",
    businessProcess: "commission_accrual",
    createdBy: "user-ops-finance",
    createdAt: "2026-05-10T11:00:00.000Z",
    valueDate: "2026-05-10",
    currency: "AED",
    description: "Commission accrual — Isabel Torres / Mgr for Gelo Huspy (deal-016)",
  },

  // ── Standalone — Q2 2026 incentive + platform fee, agent-004 (REBU, AED) ─

  {
    id: "posting-012",
    businessUnit: "rebu",
    externalRef: "ADJ-2026-Q2-GELO-INC",
    businessProcess: "agent_adjustment",
    createdBy: "user-ops-finance",
    createdAt: "2026-05-10T11:30:00.000Z",
    valueDate: "2026-05-10",
    currency: "AED",

    description: "Q2 2026 incentive — Gelo Huspy",
  },
  {
    id: "posting-032",
    businessUnit: "rebu",
    externalRef: "AGINV-ACCRUAL-GELO-MAY",
    businessProcess: "agent_invoice_accrual",
    createdBy: "user-ops-finance",
    createdAt: "2026-05-31T09:00:00.000Z",
    valueDate: "2026-05-31",
    currency: "AED",
    description: "Agent invoice accrual — Gelo Huspy, May 2026 (INV-2026-012)",
  },
  {
    id: "posting-013",
    businessUnit: "rebu",
    externalRef: "FEE-2026-05-GELO",
    businessProcess: "huspy_fee",
    createdBy: "system",
    createdAt: "2026-05-01T00:00:00.000Z",
    valueDate: "2026-05-01",
    currency: "AED",

    description: "May 2026 platform support fee — Gelo Huspy",
  },

  // ── Standalone — Jan 2026 platform fee, agent-001 (REBU, EUR) ─────────

  {
    id: "posting-014",
    businessUnit: "rebu",
    externalRef: "FEE-2026-01-FELICIA",
    businessProcess: "huspy_fee",
    createdBy: "system",
    createdAt: "2026-01-01T00:00:00.000Z",
    valueDate: "2026-01-01",
    currency: "EUR",

    description: "Jan 2026 platform support fee — Felicia Canovas",
  },

  // ── deal-018 — TL + Mgr commission accrual (REBU, EUR) ─────────────────
  {
    id: "posting-044",
    trancheId: "tranche-018",
    businessUnit: "rebu",
    externalRef: "AGINV-018-TL",
    businessProcess: "commission_accrual",
    createdBy: "user-ops-finance",
    createdAt: "2026-04-25T11:00:00.000Z",
    valueDate: "2026-04-25",
    currency: "EUR",
    description: "Commission accrual — Santiago Vega / TL for Felicia Canovas (deal-018)",
  },
  {
    id: "posting-045",
    trancheId: "tranche-018",
    businessUnit: "rebu",
    externalRef: "AGINV-018-MGR",
    businessProcess: "commission_accrual",
    createdBy: "user-ops-finance",
    createdAt: "2026-04-25T11:00:00.000Z",
    valueDate: "2026-04-25",
    currency: "EUR",
    description: "Commission accrual — Isabel Torres / Mgr for Felicia Canovas (deal-018)",
  },

  // ── deal-018 — agent-001, UNALLOCATED (REBU, EUR) ────────────────────

  {
    id: "posting-015",
    trancheId: "tranche-018",
    businessUnit: "rebu",
    externalRef: "AGINV-018",
    businessProcess: "commission_accrual",
    createdBy: "user-ops-finance",
    createdAt: "2026-04-25T11:00:00.000Z",
    valueDate: "2026-04-25",
    currency: "EUR",
    description: "Commission accrual — deal-018 (Felicia Canovas EUR 9 700.00)",
  },

  // ── Standalone — Apr 2026 platform fee, agent-001 (REBU, EUR) ─────────

  {
    id: "posting-016",
    businessUnit: "rebu",
    externalRef: "FEE-2026-04-FELICIA",
    businessProcess: "huspy_fee",
    createdBy: "system",
    createdAt: "2026-04-01T00:00:00.000Z",
    valueDate: "2026-04-01",
    currency: "EUR",

    description: "Apr 2026 platform support fee — Felicia Canovas",
  },

  // ── deal-008 — seller + developer split (REBU, EUR) ───────────────────────

  {
    id: "posting-018",
    trancheId: "tranche-008",
    businessUnit: "rebu",
    externalRef: "P0018",
    businessProcess: "invoice_issued",
    createdBy: "system",
    createdAt: "2026-03-10T10:00:00.000Z",
    valueDate: "2026-03-10",
    currency: "EUR",

    description: "Invoice to developer — deal-008 (EUR 5 800)",
  },

  // ── Conveyance invoices + payments ────────────────────────────────────────

  // deal-001 — Gestoría López accrual (EUR 800)
  {
    id: "posting-023",
    trancheId: "tranche-001",
    businessUnit: "rebu",
    externalRef: "CONV-2026-001",
    businessProcess: "external_cost_accrual",
    createdBy: "user-ops-finance",
    createdAt: "2026-01-10T09:00:00.000Z",
    valueDate: "2026-01-10",
    currency: "EUR",
    description: "Conveyance fee — deal-001 (Gestoría López & Asociados)",
  },
  {
    id: "posting-024",
    trancheId: "tranche-001",
    businessUnit: "rebu",
    externalRef: "PAY-CONV-2026-001",
    businessProcess: "bank_statement_outbound_matched",
    createdBy: "user-ops-finance",
    createdAt: "2026-01-10T10:00:00.000Z",
    valueDate: "2026-01-10",
    currency: "EUR",
    description: "Payment — Gestoría López & Asociados, deal-001",
  },

  // deal-016 — TAMM Legal accrual (AED 3 000)
  {
    id: "posting-026",
    trancheId: "tranche-016",
    businessUnit: "rebu",
    externalRef: "CONV-2026-016",
    businessProcess: "external_cost_accrual",
    createdBy: "user-ops-finance",
    createdAt: "2026-05-04T09:00:00.000Z",
    valueDate: "2026-05-04",
    currency: "AED",
    description: "Conveyance fee — deal-016 (TAMM Legal Services)",
  },
  {
    id: "posting-027",
    trancheId: "tranche-016",
    businessUnit: "rebu",
    externalRef: "PAY-CONV-2026-016",
    businessProcess: "bank_statement_outbound_matched",
    createdBy: "user-ops-finance",
    createdAt: "2026-05-20T11:00:00.000Z",
    valueDate: "2026-05-20",
    currency: "AED",
    description: "Payment — TAMM Legal Services, deal-016",
  },

  // deal-018 — Gestoría López accrual (EUR 1 200)
  {
    id: "posting-028",
    trancheId: "tranche-018",
    businessUnit: "rebu",
    externalRef: "CONV-2026-018",
    businessProcess: "external_cost_accrual",
    createdBy: "user-ops-finance",
    createdAt: "2026-04-15T09:00:00.000Z",
    valueDate: "2026-04-15",
    currency: "EUR",
    description: "Conveyance fee — deal-018 (Gestoría López & Asociados)",
  },
  {
    id: "posting-029",
    trancheId: "tranche-018",
    businessUnit: "rebu",
    externalRef: "PAY-CONV-2026-018",
    businessProcess: "bank_statement_outbound_matched",
    createdBy: "user-ops-finance",
    createdAt: "2026-05-05T10:00:00.000Z",
    valueDate: "2026-05-05",
    currency: "EUR",
    description: "Payment — Gestoría López & Asociados, deal-018",
  },

  // ── deal-018 — client invoice (REBU, EUR) ───────────────────────────────

  {
    id: "posting-021",
    trancheId: "tranche-018",
    businessUnit: "rebu",
    externalRef: "P0021",
    businessProcess: "invoice_issued",
    createdBy: "system",
    createdAt: "2026-04-15T09:00:00.000Z",
    valueDate: "2026-04-15",
    currency: "EUR",

    description: "Invoice to client — deal-018 (EUR 31 250 gross, subsidy deducted via ACQUISITION_DEDUCTION stakeholder)",
  },

  {
    id: "posting-022",
    trancheId: "tranche-018",
    businessUnit: "rebu",
    externalRef: "P0022",
    businessProcess: "bank_statement_inbound_matched",
    createdBy: "system",
    createdAt: "2026-04-22T15:00:00.000Z",
    valueDate: "2026-04-22",
    currency: "EUR",

    description: "Payment received — deal-018 (EUR 24 250)",
  },

  // ── inv-012 — bank disbursement (Gelo Huspy, May 2026) ─────────────────
  {
    id: "posting-055",
    businessUnit: "rebu",
    externalRef: "PAY-2026-GELO-MAY",
    businessProcess: "bank_statement_outbound_matched",
    createdBy: "user-ops-finance",
    createdAt: "2026-06-10T11:00:00.000Z",
    valueDate: "2026-06-10",
    currency: "AED",
    description: "Payment disbursed — Gelo Huspy (INV-2026-012, AED 19 189.17)",
  },

  // ── deal-020 — AED primary, invoicing, agent-004 ───────────────

  {
    id: "posting-050",
    trancheId: "tranche-020",
    businessUnit: "rebu",
    externalRef: "P0050",
    businessProcess: "invoice_issued",
    createdBy: "system",
    createdAt: "2026-05-14T09:00:00.000Z",
    valueDate: "2026-05-14",
    currency: "AED",
    description: "Invoice to Emaar — deal-020 (AED 24 000 + VAT 5% 1 200)",
  },
  {
    id: "posting-054",
    trancheId: "tranche-020",
    businessUnit: "rebu",
    externalRef: "P0054",
    businessProcess: "bank_statement_inbound_matched",
    createdBy: "system",
    createdAt: "2026-05-17T14:00:00.000Z",
    valueDate: "2026-05-17",
    currency: "AED",
    description: "Payment received — deal-020 (Emaar AED 25 200)",
  },
  {
    id: "posting-051",
    trancheId: "tranche-020",
    businessUnit: "rebu",
    externalRef: "AGINV-020",
    businessProcess: "commission_accrual",
    createdBy: "user-ops-finance",
    createdAt: "2026-05-14T10:00:00.000Z",
    valueDate: "2026-05-14",
    currency: "AED",
    description: "Commission accrual — deal-020 (Gelo Huspy AED 10 080)",
  },
  {
    id: "posting-052",
    trancheId: "tranche-020",
    businessUnit: "rebu",
    externalRef: "AGINV-020-TL",
    businessProcess: "commission_accrual",
    createdBy: "user-ops-finance",
    createdAt: "2026-05-14T10:00:00.000Z",
    valueDate: "2026-05-14",
    currency: "AED",
    description: "Commission accrual — Santiago Vega / TL for Gelo Huspy (deal-020)",
  },
  {
    id: "posting-053",
    trancheId: "tranche-020",
    businessUnit: "rebu",
    externalRef: "AGINV-020-MGR",
    businessProcess: "commission_accrual",
    createdBy: "user-ops-finance",
    createdAt: "2026-05-14T10:00:00.000Z",
    valueDate: "2026-05-14",
    currency: "AED",
    description: "Commission accrual — Isabel Torres / Mgr for Gelo Huspy (deal-020)",
  },

  // ── deal-021 full lifecycle (REBU, EUR, Guilherme + Marta referral) ──────────

  // 1. Client invoice issued
  {
    id: "posting-056",
    trancheId: "tranche-021",
    businessUnit: "rebu",
    externalRef: "P0021",
    businessProcess: "invoice_issued",
    createdBy: "system",
    createdAt: "2026-03-10T09:00:00.000Z",
    valueDate: "2026-03-10",
    currency: "EUR",
    description: "Commission earned — deal-021 (Townhouse in Las Rozas, Buy, €480k)",
  },
  // 2. Client payment received
  {
    id: "posting-057",
    trancheId: "tranche-021",
    businessUnit: "rebu",
    externalRef: "P0021-PAY",
    businessProcess: "bank_statement_inbound_matched",
    createdBy: "system",
    createdAt: "2026-03-15T15:00:00.000Z",
    valueDate: "2026-03-15",
    currency: "EUR",
    description: "Payment received — INV-2026-021 (client-003)",
  },
  // 3. Agent commission accrual — Guilherme Castro
  {
    id: "posting-058",
    trancheId: "tranche-021",
    businessUnit: "rebu",
    externalRef: "AGINV-021",
    businessProcess: "commission_accrual",
    createdBy: "user-ops-finance",
    createdAt: "2026-03-20T11:00:00.000Z",
    valueDate: "2026-03-20",
    currency: "EUR",
    description: "Commission accrual — deal-021 (Guilherme Castro EUR 6 210)",
  },
  // 4. TL commission accrual — Santiago Vega
  {
    id: "posting-059",
    trancheId: "tranche-021",
    businessUnit: "rebu",
    externalRef: "AGINV-021-TL",
    businessProcess: "commission_accrual",
    createdBy: "user-ops-finance",
    createdAt: "2026-03-20T11:00:00.000Z",
    valueDate: "2026-03-20",
    currency: "EUR",
    description: "Commission accrual — Santiago Vega / TL for Guilherme Castro (deal-021)",
  },
  // 5. Mgr commission accrual — Isabel Torres
  {
    id: "posting-060",
    trancheId: "tranche-021",
    businessUnit: "rebu",
    externalRef: "AGINV-021-MGR",
    businessProcess: "commission_accrual",
    createdBy: "user-ops-finance",
    createdAt: "2026-03-20T11:00:00.000Z",
    valueDate: "2026-03-20",
    currency: "EUR",
    description: "Commission accrual — Isabel Torres / Mgr for Guilherme Castro (deal-021)",
  },
  // 6. Referral accrual — Marta Sáez (salaried, HR export)
  {
    id: "posting-061",
    trancheId: "tranche-021",
    businessUnit: "rebu",
    externalRef: "AGINV-021-REF",
    businessProcess: "commission_accrual",
    createdBy: "user-ops-finance",
    createdAt: "2026-03-20T11:00:00.000Z",
    valueDate: "2026-03-20",
    currency: "EUR",
    description: "Referral accrual — Marta Sáez (salaried, HR export) for deal-021 (EUR 600)",
  },
  // 7. Conveyance accrual — Gestoría López
  {
    id: "posting-062",
    trancheId: "tranche-021",
    businessUnit: "rebu",
    externalRef: "CONV-021",
    businessProcess: "external_cost_accrual",
    createdBy: "user-ops-finance",
    createdAt: "2026-03-10T09:00:00.000Z",
    valueDate: "2026-03-10",
    currency: "EUR",
    description: "Conveyance fee — deal-021 (Gestoría López & Asociados EUR 800 + IVA 168)",
  },
  // 8. Conveyance payment
  {
    id: "posting-063",
    trancheId: "tranche-021",
    businessUnit: "rebu",
    externalRef: "CONV-021-PAY",
    businessProcess: "bank_statement_outbound_matched",
    createdBy: "system",
    createdAt: "2026-03-28T10:00:00.000Z",
    valueDate: "2026-03-28",
    currency: "EUR",
    description: "Conveyance payment — INV-2026-023 (Gestoría López)",
  },
  // 9. Agent invoice accrual — Guilherme submits inv-022
  {
    id: "posting-064",
    trancheId: "tranche-021",
    businessUnit: "rebu",
    externalRef: "AGINV-ACCRUAL-021",
    businessProcess: "agent_invoice_accrual",
    createdBy: "user-ops-finance",
    createdAt: "2026-03-25T09:00:00.000Z",
    valueDate: "2026-03-25",
    currency: "EUR",
    description: "Agent invoice accrual — Guilherme Castro, Mar 2026 (INV-2026-022)",
  },
  // 10. Agent payout — Huspy pays Guilherme
  {
    id: "posting-065",
    trancheId: "tranche-021",
    businessUnit: "rebu",
    externalRef: "AGINV-ACCRUAL-021-PAY",
    businessProcess: "bank_statement_outbound_matched",
    createdBy: "system",
    createdAt: "2026-04-05T10:00:00.000Z",
    valueDate: "2026-04-05",
    currency: "EUR",
    description: "Agent payout — INV-2026-022 (Guilherme Castro EUR 6 582.60)",
  },

  // ── deal-011 — MBU MA/Broker — DIB, Omar Rahman (sole broker) ─────────────

  // posting-070 — invoice_issued — deal-011, inv-011
  // deal → invoicing: Huspy invoices DIB 18 000 + VAT 5% 900 = 18 900 AED
  {
    id: "posting-070",
    trancheId: "tranche-011",
    businessUnit: "mortgage",
    externalRef: "MBU-INV-011",
    businessProcess: "invoice_issued",
    createdBy: "system",
    createdAt: "2026-04-22T10:00:00.000Z",
    valueDate: "2026-04-22",
    currency: "AED",
    description: "Commission invoice to DIB — deal-011 (AED 1.5M × 1.20% = 18 000)",
  },

  // posting-071 — commission_accrual — deal-011, Omar Rahman (provisional)
  // Provisional: month-end batch not yet run; rate locked at month-end May 2026
  // Omar < 5M GMV → DIB rate 52% → 52% × 18 000 = 9 360
  {
    id: "posting-071",
    trancheId: "tranche-011",
    businessUnit: "mortgage",
    externalRef: "MBU-BROKER-011",
    businessProcess: "commission_accrual",
    createdBy: "user-ops-finance",
    createdAt: "2026-04-22T10:30:00.000Z",
    valueDate: "2026-04-22",
    currency: "AED",
    description: "Broker commission accrual (provisional) — deal-011 Omar Rahman AED 9 360",
  },

  // ── deal-022 — MBU MA/Broker — ADIB, Omar Rahman 60% + Khalid & Associates 40% ─

  // posting-072 — invoice_issued — deal-022, inv-024
  // Huspy invoices ADIB 35 000 + VAT 5% 1 750 = 36 750 AED
  {
    id: "posting-072",
    trancheId: "tranche-022",
    businessUnit: "mortgage",
    externalRef: "MBU-INV-022",
    businessProcess: "invoice_issued",
    createdBy: "system",
    createdAt: "2026-05-08T09:00:00.000Z",
    valueDate: "2026-05-08",
    currency: "AED",
    description: "Commission invoice to ADIB — deal-022 (AED 2.8M × 1.25% = 35 000)",
  },

  // posting-073 — bank_statement_inbound_matched — deal-022, inv-024
  // ADIB pays 36 750 AED; deal → finalized
  {
    id: "posting-073",
    trancheId: "tranche-022",
    businessUnit: "mortgage",
    externalRef: "MBU-INV-022-PAY",
    businessProcess: "bank_statement_inbound_matched",
    createdBy: "system",
    createdAt: "2026-05-14T15:00:00.000Z",
    valueDate: "2026-05-14",
    currency: "AED",
    description: "ADIB payment received — INV-2026-024 (AED 36 750)",
  },

  // posting-074 — commission_accrual Omar — deal-022
  // Month-end May 2026: Omar GMV < 5M → ADIB rate 53% | deal split 60% → base 21 000 → 11 130
  {
    id: "posting-074",
    trancheId: "tranche-022",
    businessUnit: "mortgage",
    externalRef: "MBU-BROKER-022-OMAR",
    businessProcess: "commission_accrual",
    createdBy: "user-ops-finance",
    createdAt: "2026-05-15T10:00:00.000Z",
    valueDate: "2026-05-15",
    currency: "AED",
    description: "Broker commission accrual — deal-022 Omar Rahman AED 11 130 (53% × 21 000)",
  },

  // posting-075 — commission_accrual Khalid — deal-022
  // Month-end May 2026: Khalid GMV < 5M → ADIB rate 53% | deal split 40% → base 14 000 → 7 420
  {
    id: "posting-075",
    trancheId: "tranche-022",
    businessUnit: "mortgage",
    externalRef: "MBU-BROKER-022-KHALID",
    businessProcess: "commission_accrual",
    createdBy: "user-ops-finance",
    createdAt: "2026-05-15T10:00:00.000Z",
    valueDate: "2026-05-15",
    currency: "AED",
    description: "Broker commission accrual — deal-022 Khalid & Associates AED 7 420 (53% × 14 000)",
  },

  // posting-076 — agent_invoice_accrual Omar — inv-025
  // Decoupled from deal (same as REBU agent invoice postings): no dealId.
  // Omar submits invoice: 11 130 base + VAT 5% 556.50 = 11 686.50 AED net payable
  {
    id: "posting-076",
    businessUnit: "mortgage",
    externalRef: "MBU-BROKER-022-OMAR-INV",
    businessProcess: "agent_invoice_accrual",
    createdBy: "user-ops-finance",
    createdAt: "2026-05-18T09:00:00.000Z",
    valueDate: "2026-05-18",
    currency: "AED",
    description: "Broker invoice accrual — Omar Rahman INV-2026-025 (AED 11 686.50)",
  },

  // posting-077 — bank_statement_outbound_matched — inv-025 (Omar payout)
  {
    id: "posting-077",
    businessUnit: "mortgage",
    externalRef: "MBU-BROKER-022-OMAR-PAY",
    businessProcess: "bank_statement_outbound_matched",
    createdBy: "user-ops-finance",
    createdAt: "2026-05-22T11:00:00.000Z",
    valueDate: "2026-05-22",
    currency: "AED",
    description: "Broker payout — Omar Rahman INV-2026-025 (AED 11 686.50)",
  },

  // posting-078 — agent_invoice_accrual Khalid — inv-026
  // Khalid submits invoice: 7 420 base + VAT 5% 371 = 7 791 AED net payable
  {
    id: "posting-078",
    businessUnit: "mortgage",
    externalRef: "MBU-BROKER-022-KHALID-INV",
    businessProcess: "agent_invoice_accrual",
    createdBy: "user-ops-finance",
    createdAt: "2026-05-18T09:00:00.000Z",
    valueDate: "2026-05-18",
    currency: "AED",
    description: "Broker invoice accrual — Khalid & Associates INV-2026-026 (AED 7 791)",
  },

  // posting-079 — bank_statement_outbound_matched — inv-026 (Khalid payout)
  {
    id: "posting-079",
    businessUnit: "mortgage",
    externalRef: "MBU-BROKER-022-KHALID-PAY",
    businessProcess: "bank_statement_outbound_matched",
    createdBy: "user-ops-finance",
    createdAt: "2026-05-22T11:30:00.000Z",
    valueDate: "2026-05-22",
    currency: "AED",
    description: "Broker payout — Khalid & Associates INV-2026-026 (AED 7 791)",
  },

  // ── tranche-026a ─ Arras tranche ─ finalized ─ ES/EUR ────────────────────
  { id: "posting-026a-1", trancheId: "tranche-026a", businessUnit: "rebu", businessProcess: "invoice_issued",
    createdBy: "system", createdAt: "2026-06-03T09:00:00.000Z", valueDate: "2026-06-03", currency: "EUR",
    description: "Commission earned — Arras tranche (Apartment in Malasaña, €300k)" },
  { id: "posting-026a-2", trancheId: "tranche-026a", businessUnit: "rebu", businessProcess: "bank_statement_inbound_matched",
    createdBy: "system", createdAt: "2026-06-03T11:00:00.000Z", valueDate: "2026-06-03", currency: "EUR",
    description: "Payment received — INV-2026-027 (Arras)" },
  { id: "posting-026a-3", trancheId: "tranche-026a", businessUnit: "rebu", businessProcess: "commission_accrual",
    createdBy: "system", createdAt: "2026-06-03T11:30:00.000Z", valueDate: "2026-06-03", currency: "EUR",
    description: "Commission accrual — Felicia Canovas EUR 1,800 (Arras)" },
  { id: "posting-026a-4", trancheId: "tranche-026a", businessUnit: "rebu", businessProcess: "commission_accrual",
    createdBy: "system", createdAt: "2026-06-03T11:30:00.000Z", valueDate: "2026-06-03", currency: "EUR",
    description: "Commission accrual — Santiago Vega TL EUR 180 (Arras)" },
  { id: "posting-026a-5", trancheId: "tranche-026a", businessUnit: "rebu", businessProcess: "commission_accrual",
    createdBy: "system", createdAt: "2026-06-03T11:30:00.000Z", valueDate: "2026-06-03", currency: "EUR",
    description: "Commission accrual — Isabel Torres Mgr EUR 90 (Arras)" },
];
