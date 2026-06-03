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
  // 40% × 11 377 (gross) = 4 550.80; OPERATIONAL_DEDUCTION (800) is bucket D and does not reduce agent pool
  { id: "pline-003-1", postingId: "posting-003", ledgerId: 7,  side: "DEBIT",  amount: 4550.8 },
  { id: "pline-003-2", postingId: "posting-003", ledgerId: 22, side: "CREDIT", amount: 4550.8, invoiceId: "inv-009" },

  // posting-040 — commission_accrual — deal-001, Santiago Vega TL (EUR 455.08)
  { id: "pline-040-1", postingId: "posting-040", ledgerId: 7,  side: "DEBIT",  amount: 455.08 },
  { id: "pline-040-2", postingId: "posting-040", ledgerId: 31, side: "CREDIT", amount: 455.08 },

  // posting-041 — commission_accrual — deal-001, Isabel Torres Mgr (EUR 227.54)
  { id: "pline-041-1", postingId: "posting-041", ledgerId: 7,  side: "DEBIT",  amount: 227.54 },
  { id: "pline-041-2", postingId: "posting-041", ledgerId: 32, side: "CREDIT", amount: 227.54 },

  // posting-004 — agent_invoice_accrual — agent-001, inv-009
  // Triggered: agent invoice → issued (Felicia submits January invoice; VAT and IRPF crystallise)
  // base 4 400.8 (commission 4 550.80 − fee 150) + IVA 21% 924.17 − IRPF 15% 660.12 = net payable 4 664.85
  { id: "pline-004-1", postingId: "posting-004", ledgerId: 22, side: "DEBIT",  amount: 4400.8,   invoiceId: "inv-009" },
  { id: "pline-004-2", postingId: "posting-004", ledgerId: 5,  side: "DEBIT",  amount: 924.17  },
  { id: "pline-004-3", postingId: "posting-004", ledgerId: 28, side: "CREDIT", amount: 660.12  },
  { id: "pline-004-4", postingId: "posting-004", ledgerId: 4,  side: "CREDIT", amount: 4664.85, invoiceId: "inv-009" },

  // posting-030 — bank_statement_outbound_matched — agent-001, inv-009
  // Triggered: agent invoice issued → paid (Finance wires net payout to Felicia and uploads proof)
  { id: "pline-030-1", postingId: "posting-030", ledgerId: 4,  side: "DEBIT",  amount: 4664.85, invoiceId: "inv-009" },
  { id: "pline-030-2", postingId: "posting-030", ledgerId: 1,  side: "CREDIT", amount: 4664.85 },

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
  // DEAL-008  (ES/EUR · REBU · sell · invoicing)
  // ─────────────────────────────────────────────────────────────────────────

  // posting-018 — invoice_issued — deal-008, inv-003 (developer split)
  // Triggered: outbound invoice draft → issued (Finance finalizes and sends PDF to developer)
  // subtotal 5 800 + IVA 21% 1 218 = gross 7 018
  { id: "pline-018-1", postingId: "posting-018", ledgerId: 2,  side: "DEBIT",  amount: 7018,   invoiceId: "inv-003" },
  { id: "pline-018-2", postingId: "posting-018", ledgerId: 6,  side: "CREDIT", amount: 5800 },
  { id: "pline-018-3", postingId: "posting-018", ledgerId: 5,  side: "CREDIT", amount: 1218 },

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
  // 42% × 41 370 (gross) = 17 375.40; TL 10% = 1 737.54; Mgr 5% = 868.77; total bucket B = 19 981.71
  { id: "pline-011-1", postingId: "posting-011", ledgerId: 14, side: "DEBIT",  amount: 17375.4 },
  { id: "pline-011-2", postingId: "posting-011", ledgerId: 24, side: "CREDIT", amount: 17375.4, invoiceId: "inv-012" },

  // posting-042 — commission_accrual — deal-016, Santiago Vega TL (AED 1 737.54)
  { id: "pline-042-1", postingId: "posting-042", ledgerId: 14, side: "DEBIT",  amount: 1737.54 },
  { id: "pline-042-2", postingId: "posting-042", ledgerId: 33, side: "CREDIT", amount: 1737.54 },

  // posting-043 — commission_accrual — deal-016, Isabel Torres Mgr (AED 868.77)
  { id: "pline-043-1", postingId: "posting-043", ledgerId: 14, side: "DEBIT",  amount: 868.77 },
  { id: "pline-043-2", postingId: "posting-043", ledgerId: 34, side: "CREDIT", amount: 868.77 },

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
  // 40% × 24 250 (gross) = 9 700; OPERATIONAL_DEDUCTION (1 200) is bucket D and does not reduce agent pool
  { id: "pline-015-1", postingId: "posting-015", ledgerId: 7,  side: "DEBIT",  amount: 9700 },
  { id: "pline-015-2", postingId: "posting-015", ledgerId: 22, side: "CREDIT", amount: 9700 },

  // posting-044 — commission_accrual — deal-018, Santiago Vega TL (EUR 970.00)
  { id: "pline-044-1", postingId: "posting-044", ledgerId: 7,  side: "DEBIT",  amount: 970.0 },
  { id: "pline-044-2", postingId: "posting-044", ledgerId: 31, side: "CREDIT", amount: 970.0 },

  // posting-045 — commission_accrual — deal-018, Isabel Torres Mgr (EUR 485.00)
  { id: "pline-045-1", postingId: "posting-045", ledgerId: 7,  side: "DEBIT",  amount: 485.0 },
  { id: "pline-045-2", postingId: "posting-045", ledgerId: 32, side: "CREDIT", amount: 485.0 },

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
  // base 18 275.4 (commission 17 375.40 + bonus 1 200 − fee 300) + VAT 5% 913.77 = net payable 19 189.17
  { id: "pline-032-1", postingId: "posting-032", ledgerId: 24, side: "DEBIT",  amount: 18275.4,  invoiceId: "inv-012" },
  { id: "pline-032-2", postingId: "posting-032", ledgerId: 12, side: "DEBIT",  amount: 913.77   },
  { id: "pline-032-3", postingId: "posting-032", ledgerId: 11, side: "CREDIT", amount: 19189.17, invoiceId: "inv-012" },

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
  // gross = subtotal 18 275.4 + VAT 5% 913.77 = 19 189.17 AED
  { id: "pline-055-1", postingId: "posting-055", ledgerId: 11, side: "DEBIT",  amount: 19189.17, invoiceId: "inv-012" },
  { id: "pline-055-2", postingId: "posting-055", ledgerId: 8,  side: "CREDIT", amount: 19189.17 },

  // ─────────────────────────────────────────────────────────────────────────
  // DEAL-020  (AE/AED · REBU · primary · invoicing)
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

  // ── deal-021 (REBU, EUR) ────────────────────────────────────────────────────

  // posting-056 — invoice_issued — deal-021, inv-021 (client-003, 14 400 + IVA 3 024 = 17 424)
  { id: "pline-056-1", postingId: "posting-056", ledgerId: 2,  side: "DEBIT",  amount: 17424,   invoiceId: "inv-021" },
  { id: "pline-056-2", postingId: "posting-056", ledgerId: 6,  side: "CREDIT", amount: 14400 },
  { id: "pline-056-3", postingId: "posting-056", ledgerId: 5,  side: "CREDIT", amount: 3024 },

  // posting-057 — bank_statement_inbound_matched — deal-021, inv-021
  { id: "pline-057-1", postingId: "posting-057", ledgerId: 1,  side: "DEBIT",  amount: 17424 },
  { id: "pline-057-2", postingId: "posting-057", ledgerId: 2,  side: "CREDIT", amount: 17424,   invoiceId: "inv-021" },

  // posting-058 — commission_accrual — deal-021, Guilherme Castro (45% × 13 800 = 6 210; commissionBase = 14 400 − 600 referral)
  { id: "pline-058-1", postingId: "posting-058", ledgerId: 7,  side: "DEBIT",  amount: 6210 },
  { id: "pline-058-2", postingId: "posting-058", ledgerId: 23, side: "CREDIT", amount: 6210 },

  // posting-059 — commission_accrual — deal-021, Santiago Vega TL (10% × 6 210 = 621)
  { id: "pline-059-1", postingId: "posting-059", ledgerId: 7,  side: "DEBIT",  amount: 621 },
  { id: "pline-059-2", postingId: "posting-059", ledgerId: 31, side: "CREDIT", amount: 621 },

  // posting-060 — commission_accrual — deal-021, Isabel Torres Mgr (5% × 6 210 = 310.50)
  { id: "pline-060-1", postingId: "posting-060", ledgerId: 7,  side: "DEBIT",  amount: 310.50 },
  { id: "pline-060-2", postingId: "posting-060", ledgerId: 32, side: "CREDIT", amount: 310.50 },

  // posting-061 — commission_accrual — deal-021, Marta Sáez referral salaried (600)
  { id: "pline-061-1", postingId: "posting-061", ledgerId: 7,  side: "DEBIT",  amount: 600 },
  { id: "pline-061-2", postingId: "posting-061", ledgerId: 39, side: "CREDIT", amount: 600 },

  // posting-062 — external_cost_accrual — deal-021, Gestoría 800 + IVA 168 = 968
  { id: "pline-062-1", postingId: "posting-062", ledgerId: 7,  side: "DEBIT",  amount: 800 },
  { id: "pline-062-2", postingId: "posting-062", ledgerId: 5,  side: "DEBIT",  amount: 168 },
  { id: "pline-062-3", postingId: "posting-062", ledgerId: 4,  side: "CREDIT", amount: 968,     invoiceId: "inv-023" },

  // posting-063 — bank_statement_outbound_matched — deal-021, Gestoría payment 968
  { id: "pline-063-1", postingId: "posting-063", ledgerId: 4,  side: "DEBIT",  amount: 968,     invoiceId: "inv-023" },
  { id: "pline-063-2", postingId: "posting-063", ledgerId: 1,  side: "CREDIT", amount: 968 },

  // posting-064 — agent_invoice_accrual — deal-021, Guilherme inv-022
  // DEBIT subledger (clears accrued liability) + input VAT; CREDIT withholding + net payable
  // base 6 210 + IVA 21% 1 304.10 − IRPF 15% 931.50 = net payable 6 582.60
  { id: "pline-064-1", postingId: "posting-064", ledgerId: 23, side: "DEBIT",  amount: 6210,    invoiceId: "inv-022" },
  { id: "pline-064-2", postingId: "posting-064", ledgerId: 5,  side: "DEBIT",  amount: 1304.10 },
  { id: "pline-064-3", postingId: "posting-064", ledgerId: 28, side: "CREDIT", amount: 931.50 },
  { id: "pline-064-4", postingId: "posting-064", ledgerId: 4,  side: "CREDIT", amount: 6582.60, invoiceId: "inv-022" },

  // posting-065 — bank_statement_outbound_matched — deal-021, Guilherme payout 6 582.60
  { id: "pline-065-1", postingId: "posting-065", ledgerId: 4,  side: "DEBIT",  amount: 6582.60, invoiceId: "inv-022" },
  { id: "pline-065-2", postingId: "posting-065", ledgerId: 1,  side: "CREDIT", amount: 6582.60 },

  // ─────────────────────────────────────────────────────────────────────────
  // DEAL-011  (AE/AED · MBU · MA/Broker · invoicing)
  // Mortgage 1 500 000 AED · DIB · Omar Rahman sole broker
  // Revenue: 1.20% × 1 500 000 = 18 000 | Broker (provisional): 52% × 18 000 = 9 360
  // ─────────────────────────────────────────────────────────────────────────

  // posting-070 — invoice_issued — deal-011, inv-011
  // DR ASSET_AR_AED (9) 18 900 | CR REV_AED (13) 18 000 + CR LIAB_VAT_AED (12) 900
  { id: "pline-070-1", postingId: "posting-070", ledgerId: 9,  side: "DEBIT",  amount: 18900,  invoiceId: "inv-011" },
  { id: "pline-070-2", postingId: "posting-070", ledgerId: 13, side: "CREDIT", amount: 18000 },
  { id: "pline-070-3", postingId: "posting-070", ledgerId: 12, side: "CREDIT", amount: 900 },

  // posting-071 — commission_accrual (provisional) — deal-011, Omar Rahman
  // DR EXP_COMMISSION_AED (14) 9 360 | CR BrokerLiability_broker-001 (40) 9 360
  { id: "pline-071-1", postingId: "posting-071", ledgerId: 14, side: "DEBIT",  amount: 9360 },
  { id: "pline-071-2", postingId: "posting-071", ledgerId: 40, side: "CREDIT", amount: 9360 },

  // ─────────────────────────────────────────────────────────────────────────
  // DEAL-022  (AE/AED · MBU · MA/Broker · finalized)
  // Mortgage 2 800 000 AED · ADIB · Omar Rahman 60% + Khalid & Associates 40%
  // Revenue: 1.25% × 2 800 000 = 35 000
  // Omar base: 60% × 35 000 = 21 000 → 53% = 11 130
  // Khalid base: 40% × 35 000 = 14 000 → 53% = 7 420
  // ─────────────────────────────────────────────────────────────────────────

  // posting-072 — invoice_issued — deal-022, inv-024
  // DR ASSET_AR_AED (9) 36 750 | CR REV_AED (13) 35 000 + CR LIAB_VAT_AED (12) 1 750
  { id: "pline-072-1", postingId: "posting-072", ledgerId: 9,  side: "DEBIT",  amount: 36750,  invoiceId: "inv-024" },
  { id: "pline-072-2", postingId: "posting-072", ledgerId: 13, side: "CREDIT", amount: 35000 },
  { id: "pline-072-3", postingId: "posting-072", ledgerId: 12, side: "CREDIT", amount: 1750 },

  // posting-073 — bank_statement_inbound_matched — deal-022, inv-024 (ADIB pays)
  // DR ASSET_BANK_AED (8) 36 750 | CR ASSET_AR_AED (9) 36 750
  { id: "pline-073-1", postingId: "posting-073", ledgerId: 8,  side: "DEBIT",  amount: 36750 },
  { id: "pline-073-2", postingId: "posting-073", ledgerId: 9,  side: "CREDIT", amount: 36750,  invoiceId: "inv-024" },

  // posting-074 — commission_accrual Omar — deal-022
  // DR EXP_COMMISSION_AED (14) 11 130 | CR BrokerLiability_broker-001 (40) 11 130
  { id: "pline-074-1", postingId: "posting-074", ledgerId: 14, side: "DEBIT",  amount: 11130 },
  { id: "pline-074-2", postingId: "posting-074", ledgerId: 40, side: "CREDIT", amount: 11130, invoiceId: "inv-025" },

  // posting-075 — commission_accrual Khalid — deal-022
  // DR EXP_COMMISSION_AED (14) 7 420 | CR BrokerLiability_broker-003 (42) 7 420
  { id: "pline-075-1", postingId: "posting-075", ledgerId: 14, side: "DEBIT",  amount: 7420 },
  { id: "pline-075-2", postingId: "posting-075", ledgerId: 42, side: "CREDIT", amount: 7420,  invoiceId: "inv-026" },

  // posting-076 — agent_invoice_accrual Omar — deal-022, inv-025
  // Clears broker subledger (40) + recognises input VAT; CREDIT LIAB_PAYABLE_AED (11)
  // DR BrokerLiability_broker-001 (40) 11 130 + DR LIAB_VAT_AED (12) 556.50 | CR LIAB_PAYABLE_AED (11) 11 686.50
  { id: "pline-076-1", postingId: "posting-076", ledgerId: 40, side: "DEBIT",  amount: 11130,    invoiceId: "inv-025" },
  { id: "pline-076-2", postingId: "posting-076", ledgerId: 12, side: "DEBIT",  amount: 556.50 },
  { id: "pline-076-3", postingId: "posting-076", ledgerId: 11, side: "CREDIT", amount: 11686.50, invoiceId: "inv-025" },

  // posting-077 — bank_statement_outbound_matched — deal-022, inv-025 (Omar payout)
  // DR LIAB_PAYABLE_AED (11) 11 686.50 | CR ASSET_BANK_AED (8) 11 686.50
  { id: "pline-077-1", postingId: "posting-077", ledgerId: 11, side: "DEBIT",  amount: 11686.50, invoiceId: "inv-025" },
  { id: "pline-077-2", postingId: "posting-077", ledgerId: 8,  side: "CREDIT", amount: 11686.50 },

  // posting-078 — agent_invoice_accrual Khalid — deal-022, inv-026
  // DR BrokerLiability_broker-003 (42) 7 420 + DR LIAB_VAT_AED (12) 371 | CR LIAB_PAYABLE_AED (11) 7 791
  { id: "pline-078-1", postingId: "posting-078", ledgerId: 42, side: "DEBIT",  amount: 7420,    invoiceId: "inv-026" },
  { id: "pline-078-2", postingId: "posting-078", ledgerId: 12, side: "DEBIT",  amount: 371 },
  { id: "pline-078-3", postingId: "posting-078", ledgerId: 11, side: "CREDIT", amount: 7791,    invoiceId: "inv-026" },

  // posting-079 — bank_statement_outbound_matched — deal-022, inv-026 (Khalid payout)
  // DR LIAB_PAYABLE_AED (11) 7 791 | CR ASSET_BANK_AED (8) 7 791
  { id: "pline-079-1", postingId: "posting-079", ledgerId: 11, side: "DEBIT",  amount: 7791,    invoiceId: "inv-026" },
  { id: "pline-079-2", postingId: "posting-079", ledgerId: 8,  side: "CREDIT", amount: 7791 },

  // ── tranche-026a ─ Arras tranche ─ ES/EUR ─────────────────────────────────
  // posting-026a-1: invoice_issued | DR AR(2) 5445, CR REV(6) 4500, CR VAT(5) 945
  { id: "pline-026a-1-1", postingId: "posting-026a-1", ledgerId: 2, side: "DEBIT",  amount: 5445, invoiceId: "inv-026a" },
  { id: "pline-026a-1-2", postingId: "posting-026a-1", ledgerId: 6, side: "CREDIT", amount: 4500 },
  { id: "pline-026a-1-3", postingId: "posting-026a-1", ledgerId: 5, side: "CREDIT", amount: 945 },

  // posting-026a-2: bank_statement_inbound | DR BANK(1) 5445, CR AR(2) 5445
  { id: "pline-026a-2-1", postingId: "posting-026a-2", ledgerId: 1, side: "DEBIT",  amount: 5445 },
  { id: "pline-026a-2-2", postingId: "posting-026a-2", ledgerId: 2, side: "CREDIT", amount: 5445, invoiceId: "inv-026a" },

  // posting-026a-3: commission_accrual Felicia | DR EXP(7) 1800, CR AgentLiability_agent-001(22) 1800
  { id: "pline-026a-3-1", postingId: "posting-026a-3", ledgerId: 7,  side: "DEBIT",  amount: 1800 },
  { id: "pline-026a-3-2", postingId: "posting-026a-3", ledgerId: 22, side: "CREDIT", amount: 1800 },

  // posting-026a-4: commission_accrual TL Santiago | DR EXP(7) 180, CR AgentLiability_santiago(31) 180
  { id: "pline-026a-4-1", postingId: "posting-026a-4", ledgerId: 7,  side: "DEBIT",  amount: 180 },
  { id: "pline-026a-4-2", postingId: "posting-026a-4", ledgerId: 31, side: "CREDIT", amount: 180 },

  // posting-026a-5: commission_accrual Mgr Isabel | DR EXP(7) 90, CR AgentLiability_isabel(32) 90
  { id: "pline-026a-5-1", postingId: "posting-026a-5", ledgerId: 7,  side: "DEBIT",  amount: 90 },
  { id: "pline-026a-5-2", postingId: "posting-026a-5", ledgerId: 32, side: "CREDIT", amount: 90 },
];
