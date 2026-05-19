import type { PostingLine } from "../entities";

// invoiceId linking rule: set on open-item lines only — AR, AP, and agent subledger.
// VAT and P&L lines (REV, EXP) are excluded. See PostingLine.invoiceId JSDoc in entities.ts.

export const sharedPostingLines: PostingLine[] = [
  // ─────────────────────────────────────────────────────────────────────────
  // DEAL-001  (ES/EUR · REBU · buy · finalized)
  // ─────────────────────────────────────────────────────────────────────────

  // posting-001 — invoice_issued — deal-001, inv-001
  // Triggered: outbound invoice draft → issued (Finance finalizes invoice and sends PDF to client)
  // subtotal 11 377 + IVA 21% 2 389.17 = gross 13 766.17
  { id: "pline-001-1", postingId: "posting-001", ledgerId: 2,  side: "DEBIT",  amount: 13766.17, invoiceId: "inv-001" },
  { id: "pline-001-2", postingId: "posting-001", ledgerId: 6,  side: "CREDIT", amount: 11377 },
  { id: "pline-001-3", postingId: "posting-001", ledgerId: 5,  side: "CREDIT", amount: 2389.17 },

  // posting-002 — bank_statement_inbound_matched — deal-001, inv-001
  // Triggered: outbound invoice issued → paid (Finance uploads bank statement proof and matches to invoice)
  { id: "pline-002-1", postingId: "posting-002", ledgerId: 1,  side: "DEBIT",  amount: 13766.17 },
  { id: "pline-002-2", postingId: "posting-002", ledgerId: 2,  side: "CREDIT", amount: 13766.17, invoiceId: "inv-001" },

  // posting-003 — commission_accrual — deal-001, agent-001
  // Triggered: deal moves to finalized (system calculates and books agent liability — no invoice yet)
  // net 10 577 = 11 377 − 800 conveyance; agent 40% = 4 230.80
  { id: "pline-003-1", postingId: "posting-003", ledgerId: 7,  side: "DEBIT",  amount: 4230.8 },
  { id: "pline-003-2", postingId: "posting-003", ledgerId: 22, side: "CREDIT", amount: 4230.8, invoiceId: "inv-009" },

  // posting-040 — commission_accrual — deal-001, Santiago Vega TL (EUR 423.08)
  { id: "pline-040-1", postingId: "posting-040", ledgerId: 7,  side: "DEBIT",  amount: 423.08 },
  { id: "pline-040-2", postingId: "posting-040", ledgerId: 31, side: "CREDIT", amount: 423.08 },

  // posting-041 — commission_accrual — deal-001, Isabel Torres Mgr (EUR 211.54)
  { id: "pline-041-1", postingId: "posting-041", ledgerId: 7,  side: "DEBIT",  amount: 211.54 },
  { id: "pline-041-2", postingId: "posting-041", ledgerId: 32, side: "CREDIT", amount: 211.54 },

  // posting-004 — agent_invoice_accrual — agent-001, inv-009
  // Triggered: agent invoice → issued (Felicia submits January invoice; VAT and IRPF crystallise)
  // base 4 080.8 → clears agent subledger accrual; input VAT 856.97; IRPF 612.12; net AP payable 4 325.65
  { id: "pline-004-1", postingId: "posting-004", ledgerId: 22, side: "DEBIT",  amount: 4080.8,   invoiceId: "inv-009" },
  { id: "pline-004-2", postingId: "posting-004", ledgerId: 5,  side: "DEBIT",  amount: 856.97  },
  { id: "pline-004-3", postingId: "posting-004", ledgerId: 28, side: "CREDIT", amount: 612.12  },
  { id: "pline-004-4", postingId: "posting-004", ledgerId: 4,  side: "CREDIT", amount: 4325.65, invoiceId: "inv-009" },

  // posting-030 — bank_statement_outbound_matched — agent-001, inv-009
  // Triggered: agent invoice issued → paid (Finance wires net payout to Felicia and uploads proof)
  { id: "pline-030-1", postingId: "posting-030", ledgerId: 4,  side: "DEBIT",  amount: 4325.65, invoiceId: "inv-009" },
  { id: "pline-030-2", postingId: "posting-030", ledgerId: 1,  side: "CREDIT", amount: 4325.65 },

  // posting-023 — external_cost_accrual — deal-001, inv-013 (Gestoría López EUR 800)
  // Triggered: inbound vendor invoice draft → issued (Finance receives vendor invoice and marks as issued)
  // subtotal 800 + IVA 21% 168 = gross 968; input VAT debited reduces net VAT owed to Hacienda
  { id: "pline-023-1", postingId: "posting-023", ledgerId: 7,  side: "DEBIT",  amount: 800 },
  { id: "pline-023-2", postingId: "posting-023", ledgerId: 5,  side: "DEBIT",  amount: 168 },
  { id: "pline-023-3", postingId: "posting-023", ledgerId: 4,  side: "CREDIT", amount: 968,    invoiceId: "inv-013" },

  // posting-024 — bank_statement_outbound_matched — deal-001, inv-013 (Gestoría López payment)
  // Triggered: inbound vendor invoice issued → paid (Finance pays vendor and uploads proof)
  { id: "pline-024-1", postingId: "posting-024", ledgerId: 4,  side: "DEBIT",  amount: 968,    invoiceId: "inv-013" },
  { id: "pline-024-2", postingId: "posting-024", ledgerId: 1,  side: "CREDIT", amount: 968 },

  // ─────────────────────────────────────────────────────────────────────────
  // DEAL-008  (ES/EUR · REBU · sell · pending-receivables)
  // ─────────────────────────────────────────────────────────────────────────

  // posting-017 — invoice_issued — deal-008, inv-002 (seller split)
  // Triggered: outbound invoice draft → issued (Finance finalizes and sends PDF to client)
  // subtotal 3 700 + IVA 21% 777 = gross 4 477
  { id: "pline-017-1", postingId: "posting-017", ledgerId: 2,  side: "DEBIT",  amount: 4477,   invoiceId: "inv-002" },
  { id: "pline-017-2", postingId: "posting-017", ledgerId: 6,  side: "CREDIT", amount: 3700 },
  { id: "pline-017-3", postingId: "posting-017", ledgerId: 5,  side: "CREDIT", amount: 777 },

  // posting-018 — invoice_issued — deal-008, inv-003 (developer split)
  // Triggered: outbound invoice draft → issued (Finance finalizes and sends PDF to developer)
  // subtotal 5 800 + IVA 21% 1 218 = gross 7 018
  { id: "pline-018-1", postingId: "posting-018", ledgerId: 2,  side: "DEBIT",  amount: 7018,   invoiceId: "inv-003" },
  { id: "pline-018-2", postingId: "posting-018", ledgerId: 6,  side: "CREDIT", amount: 5800 },
  { id: "pline-018-3", postingId: "posting-018", ledgerId: 5,  side: "CREDIT", amount: 1218 },

  // posting-025 — external_cost_accrual — deal-008, inv-014 (Gestoría López EUR 800)
  // Triggered: inbound vendor invoice draft → issued (Finance receives vendor invoice and marks as issued)
  // subtotal 800 + IVA 21% 168 = gross 968
  { id: "pline-025-1", postingId: "posting-025", ledgerId: 7,  side: "DEBIT",  amount: 800 },
  { id: "pline-025-2", postingId: "posting-025", ledgerId: 5,  side: "DEBIT",  amount: 168 },
  { id: "pline-025-3", postingId: "posting-025", ledgerId: 4,  side: "CREDIT", amount: 968,    invoiceId: "inv-014" },

  // ─────────────────────────────────────────────────────────────────────────
  // DEAL-014  (ES/EUR · MBU · mortgage · pending-receivables)
  // ─────────────────────────────────────────────────────────────────────────

  // posting-019 — invoice_issued — deal-014, inv-004
  // Triggered: outbound invoice draft → issued (Finance finalizes and sends PDF to CaixaBank)
  // subtotal 2 480 + IVA 21% 520.8 = gross 3 000.8
  { id: "pline-019-1", postingId: "posting-019", ledgerId: 2,  side: "DEBIT",  amount: 3000.8, invoiceId: "inv-004" },
  { id: "pline-019-2", postingId: "posting-019", ledgerId: 6,  side: "CREDIT", amount: 2480 },
  { id: "pline-019-3", postingId: "posting-019", ledgerId: 5,  side: "CREDIT", amount: 520.8 },

  // ─────────────────────────────────────────────────────────────────────────
  // DEAL-015  (SA/SAR · MBU · mortgage · pending-receivables)
  // ─────────────────────────────────────────────────────────────────────────

  // posting-020 — invoice_issued — deal-015, inv-005
  // Triggered: outbound invoice draft → issued (Finance finalizes and sends PDF to SNB)
  // subtotal 4 600 + VAT 15% 690 = gross 5 290
  { id: "pline-020-1", postingId: "posting-020", ledgerId: 16, side: "DEBIT",  amount: 5290,   invoiceId: "inv-005" },
  { id: "pline-020-2", postingId: "posting-020", ledgerId: 20, side: "CREDIT", amount: 4600 },
  { id: "pline-020-3", postingId: "posting-020", ledgerId: 19, side: "CREDIT", amount: 690 },

  // ─────────────────────────────────────────────────────────────────────────
  // DEAL-016  (AE/AED · REBU · sell · finalized)
  // ─────────────────────────────────────────────────────────────────────────

  // posting-007 — invoice_issued — deal-016, inv-006 (client)
  // Triggered: outbound invoice draft → issued (Finance finalizes and sends PDF to client)
  // subtotal 24 570 + VAT 5% 1 228.5 = gross 25 798.5
  { id: "pline-007-1", postingId: "posting-007",  ledgerId: 9,  side: "DEBIT",  amount: 25798.5, invoiceId: "inv-006" },
  { id: "pline-007-2", postingId: "posting-007",  ledgerId: 13, side: "CREDIT", amount: 24570 },
  { id: "pline-007-3", postingId: "posting-007",  ledgerId: 12, side: "CREDIT", amount: 1228.5 },

  // posting-007b — invoice_issued — deal-016, inv-007 (Emaar developer)
  // Triggered: outbound invoice draft → issued (Finance finalizes and sends PDF to Emaar)
  // subtotal 16 800 + VAT 5% 840 = gross 17 640
  { id: "pline-007b-1", postingId: "posting-007b", ledgerId: 9,  side: "DEBIT",  amount: 17640,   invoiceId: "inv-007" },
  { id: "pline-007b-2", postingId: "posting-007b", ledgerId: 13, side: "CREDIT", amount: 16800 },
  { id: "pline-007b-3", postingId: "posting-007b", ledgerId: 12, side: "CREDIT", amount: 840 },

  // posting-008 — bank_statement_inbound_matched — deal-016, inv-006 (client)
  // Triggered: outbound invoice issued → paid (Finance matches client payment to bank statement)
  { id: "pline-008-1", postingId: "posting-008", ledgerId: 8,  side: "DEBIT",  amount: 25798.5 },
  { id: "pline-008-2", postingId: "posting-008", ledgerId: 9,  side: "CREDIT", amount: 25798.5, invoiceId: "inv-006" },

  // posting-009 — bank_statement_inbound_matched — deal-016, inv-007 (Emaar)
  // Triggered: outbound invoice issued → paid (Finance matches developer payment to bank statement)
  { id: "pline-009-1", postingId: "posting-009", ledgerId: 8,  side: "DEBIT",  amount: 17640 },
  { id: "pline-009-2", postingId: "posting-009", ledgerId: 9,  side: "CREDIT", amount: 17640,   invoiceId: "inv-007" },

  // posting-011 — commission_accrual — deal-016, agent-004
  // Triggered: deal moves to finalized (system calculates and books agent liability — no invoice yet)
  // net 38 370 = 41 370 − 3 000 conveyance; agent 42% = 16 115.4; TL 10% = 1 611.54; Mgr 5% = 805.77; total bucket B = 18 532.71
  { id: "pline-011-1", postingId: "posting-011", ledgerId: 14, side: "DEBIT",  amount: 16115.4 },
  { id: "pline-011-2", postingId: "posting-011", ledgerId: 24, side: "CREDIT", amount: 16115.4, invoiceId: "inv-012" },

  // posting-042 — commission_accrual — deal-016, Santiago Vega TL (AED 1 611.54)
  { id: "pline-042-1", postingId: "posting-042", ledgerId: 14, side: "DEBIT",  amount: 1611.54 },
  { id: "pline-042-2", postingId: "posting-042", ledgerId: 33, side: "CREDIT", amount: 1611.54 },

  // posting-043 — commission_accrual — deal-016, Isabel Torres Mgr (AED 805.77)
  { id: "pline-043-1", postingId: "posting-043", ledgerId: 14, side: "DEBIT",  amount: 805.77 },
  { id: "pline-043-2", postingId: "posting-043", ledgerId: 34, side: "CREDIT", amount: 805.77 },

  // posting-026 — external_cost_accrual — deal-016, inv-015 (TAMM Legal AED 3 000)
  // Triggered: inbound vendor invoice draft → issued (Finance receives vendor invoice and marks as issued)
  // subtotal 3 000 + VAT 5% 150 = gross 3 150
  { id: "pline-026-1", postingId: "posting-026", ledgerId: 14, side: "DEBIT",  amount: 3000 },
  { id: "pline-026-2", postingId: "posting-026", ledgerId: 12, side: "DEBIT",  amount: 150 },
  { id: "pline-026-3", postingId: "posting-026", ledgerId: 11, side: "CREDIT", amount: 3150,   invoiceId: "inv-015" },

  // posting-027 — bank_statement_outbound_matched — deal-016, inv-015 (TAMM Legal payment)
  // Triggered: inbound vendor invoice issued → paid (Finance pays vendor and uploads proof)
  { id: "pline-027-1", postingId: "posting-027", ledgerId: 11, side: "DEBIT",  amount: 3150,   invoiceId: "inv-015" },
  { id: "pline-027-2", postingId: "posting-027", ledgerId: 8,  side: "CREDIT", amount: 3150 },

  // ─────────────────────────────────────────────────────────────────────────
  // DEAL-018  (ES/EUR · REBU · buy · finalized)
  // ─────────────────────────────────────────────────────────────────────────

  // posting-021 — invoice_issued — deal-018, inv-008
  // Triggered: outbound invoice draft → issued (Finance finalizes and sends PDF to client)
  // subtotal 24 250 + IVA 21% 5 092.5 = gross 29 342.5
  { id: "pline-021-1", postingId: "posting-021", ledgerId: 2,  side: "DEBIT",  amount: 29342.5, invoiceId: "inv-008" },
  { id: "pline-021-2", postingId: "posting-021", ledgerId: 6,  side: "CREDIT", amount: 24250 },
  { id: "pline-021-3", postingId: "posting-021", ledgerId: 5,  side: "CREDIT", amount: 5092.5 },

  // posting-022 — bank_statement_inbound_matched — deal-018, inv-008
  // Triggered: outbound invoice issued → paid (Finance matches client payment to bank statement)
  { id: "pline-022-1", postingId: "posting-022", ledgerId: 1,  side: "DEBIT",  amount: 29342.5 },
  { id: "pline-022-2", postingId: "posting-022", ledgerId: 2,  side: "CREDIT", amount: 29342.5, invoiceId: "inv-008" },

  // posting-015 — commission_accrual — deal-018, agent-001
  // Triggered: deal moves to finalized (system calculates and books agent liability)
  // net 23 050 = 24 250 − 1 200 conveyance; agent 40% = 9 220
  { id: "pline-015-1", postingId: "posting-015", ledgerId: 7,  side: "DEBIT",  amount: 9220 },
  { id: "pline-015-2", postingId: "posting-015", ledgerId: 22, side: "CREDIT", amount: 9220 },

  // posting-044 — commission_accrual — deal-018, Santiago Vega TL (EUR 922.00)
  { id: "pline-044-1", postingId: "posting-044", ledgerId: 7,  side: "DEBIT",  amount: 922.0 },
  { id: "pline-044-2", postingId: "posting-044", ledgerId: 31, side: "CREDIT", amount: 922.0 },

  // posting-045 — commission_accrual — deal-018, Isabel Torres Mgr (EUR 461.00)
  { id: "pline-045-1", postingId: "posting-045", ledgerId: 7,  side: "DEBIT",  amount: 461.0 },
  { id: "pline-045-2", postingId: "posting-045", ledgerId: 32, side: "CREDIT", amount: 461.0 },

  // posting-028 — external_cost_accrual — deal-018, inv-016 (Gestoría López EUR 1 200)
  // Triggered: inbound vendor invoice draft → issued (Finance receives vendor invoice and marks as issued)
  // subtotal 1 200 + IVA 21% 252 = gross 1 452
  { id: "pline-028-1", postingId: "posting-028", ledgerId: 7,  side: "DEBIT",  amount: 1200 },
  { id: "pline-028-2", postingId: "posting-028", ledgerId: 5,  side: "DEBIT",  amount: 252 },
  { id: "pline-028-3", postingId: "posting-028", ledgerId: 4,  side: "CREDIT", amount: 1452,   invoiceId: "inv-016" },

  // posting-029 — bank_statement_outbound_matched — deal-018, inv-016 (Gestoría López payment)
  // Triggered: inbound vendor invoice issued → paid (Finance pays vendor and uploads proof)
  { id: "pline-029-1", postingId: "posting-029", ledgerId: 4,  side: "DEBIT",  amount: 1452,   invoiceId: "inv-016" },
  { id: "pline-029-2", postingId: "posting-029", ledgerId: 1,  side: "CREDIT", amount: 1452 },

  // ─────────────────────────────────────────────────────────────────────────
  // STANDALONE — not tied to a specific deal lifecycle step
  // ─────────────────────────────────────────────────────────────────────────

  // posting-010 — agent_adjustment — agent-001 (EUR 500 bonus)
  // Triggered: manually created by Finance for a standalone bonus or incentive to agent
  { id: "pline-010-1", postingId: "posting-010", ledgerId: 7,  side: "DEBIT",  amount: 500 },
  { id: "pline-010-2", postingId: "posting-010", ledgerId: 22, side: "CREDIT", amount: 500, invoiceId: "inv-010" },

  // posting-031 — agent_invoice_accrual — agent-001, inv-010 (Q1 2026 bonus)
  // Triggered: agent invoice → issued (Felicia submits Q1 bonus invoice; VAT and IRPF crystallise)
  // base 500 + IVA 21% 105 − IRPF 15% 75 = net payable 530
  { id: "pline-031-1", postingId: "posting-031", ledgerId: 22, side: "DEBIT",  amount: 500,   invoiceId: "inv-010" },
  { id: "pline-031-2", postingId: "posting-031", ledgerId: 5,  side: "DEBIT",  amount: 105   },
  { id: "pline-031-3", postingId: "posting-031", ledgerId: 28, side: "CREDIT", amount: 75    },
  { id: "pline-031-4", postingId: "posting-031", ledgerId: 4,  side: "CREDIT", amount: 530,   invoiceId: "inv-010" },

  // posting-012 — agent_adjustment — agent-004 (AED 1 200 bonus)
  // Triggered: manually created by Finance for a standalone bonus or incentive to agent
  { id: "pline-012-1", postingId: "posting-012", ledgerId: 14, side: "DEBIT",  amount: 1200 },
  { id: "pline-012-2", postingId: "posting-012", ledgerId: 24, side: "CREDIT", amount: 1200, invoiceId: "inv-012" },

  // posting-032 — agent_invoice_accrual — agent-004, inv-012 (May 2026)
  // Triggered: agent invoice → issued (Gelo submits May invoice; input VAT crystallises; no IRPF in UAE)
  // base 17 015.4 + VAT 5% 850.77 = net payable 17 866.17
  { id: "pline-032-1", postingId: "posting-032", ledgerId: 24, side: "DEBIT",  amount: 17015.4,  invoiceId: "inv-012" },
  { id: "pline-032-2", postingId: "posting-032", ledgerId: 12, side: "DEBIT",  amount: 850.77   },
  { id: "pline-032-3", postingId: "posting-032", ledgerId: 11, side: "CREDIT", amount: 17866.17, invoiceId: "inv-012" },

  // posting-013 — huspy_fee — agent-004 (AED 300)
  // Triggered: manually created by Finance to charge a platform fee against the agent's subledger
  { id: "pline-013-1", postingId: "posting-013", ledgerId: 24, side: "DEBIT",  amount: 300, invoiceId: "inv-012" },
  { id: "pline-013-2", postingId: "posting-013", ledgerId: 13, side: "CREDIT", amount: 300 },

  // posting-014 — huspy_fee — agent-001 (EUR 150, Jan 2026)
  // Triggered: manually created by Finance to charge a platform fee against the agent's subledger
  { id: "pline-014-1", postingId: "posting-014", ledgerId: 22, side: "DEBIT",  amount: 150, invoiceId: "inv-009" },
  { id: "pline-014-2", postingId: "posting-014", ledgerId: 6,  side: "CREDIT", amount: 150 },

  // posting-016 — huspy_fee — agent-001 (EUR 150, Apr 2026)
  // Triggered: manually created by Finance to charge a platform fee against the agent's subledger
  { id: "pline-016-1", postingId: "posting-016", ledgerId: 22, side: "DEBIT",  amount: 150 },
  { id: "pline-016-2", postingId: "posting-016", ledgerId: 6,  side: "CREDIT", amount: 150 },

  // posting-055 — bank_statement_outbound_matched — inv-012 (Gelo Huspy payment, Jun 2026)
  // gross = subtotal 17 015.4 + VAT 5% 850.77 = 17 866.17 AED
  { id: "pline-055-1", postingId: "posting-055", ledgerId: 11, side: "DEBIT",  amount: 17866.17, invoiceId: "inv-012" },
  { id: "pline-055-2", postingId: "posting-055", ledgerId: 8,  side: "CREDIT", amount: 17866.17 },

  // ─────────────────────────────────────────────────────────────────────────
  // DEAL-020  (AE/AED · REBU · primary · pending-receivables)
  // ─────────────────────────────────────────────────────────────────────────

  // posting-050 — invoice_issued — deal-020, inv-020 (Emaar)
  // subtotal 24 000 + VAT 5% 1 200 = gross 25 200 AED
  { id: "pline-050-1", postingId: "posting-050", ledgerId: 9,  side: "DEBIT",  amount: 25200, invoiceId: "inv-020" },
  { id: "pline-050-2", postingId: "posting-050", ledgerId: 13, side: "CREDIT", amount: 24000 },
  { id: "pline-050-3", postingId: "posting-050", ledgerId: 12, side: "CREDIT", amount: 1200 },

  // posting-054 — bank_statement_inbound_matched — deal-020, inv-020 (Emaar payment)
  { id: "pline-054-1", postingId: "posting-054", ledgerId: 8,  side: "DEBIT",  amount: 25200 },
  { id: "pline-054-2", postingId: "posting-054", ledgerId: 9,  side: "CREDIT", amount: 25200, invoiceId: "inv-020" },

  // posting-051 — commission_accrual — deal-020, agent-004 (42% × 24 000 = AED 10 080)
  { id: "pline-051-1", postingId: "posting-051", ledgerId: 14, side: "DEBIT",  amount: 10080 },
  { id: "pline-051-2", postingId: "posting-051", ledgerId: 24, side: "CREDIT", amount: 10080 },

  // posting-052 — commission_accrual — deal-020, Santiago Vega TL (10% × 10 080 = AED 1 008)
  { id: "pline-052-1", postingId: "posting-052", ledgerId: 14, side: "DEBIT",  amount: 1008 },
  { id: "pline-052-2", postingId: "posting-052", ledgerId: 33, side: "CREDIT", amount: 1008 },

  // posting-053 — commission_accrual — deal-020, Isabel Torres Mgr (5% × 10 080 = AED 504)
  { id: "pline-053-1", postingId: "posting-053", ledgerId: 14, side: "DEBIT",  amount: 504 },
  { id: "pline-053-2", postingId: "posting-053", ledgerId: 34, side: "CREDIT", amount: 504 },

];
