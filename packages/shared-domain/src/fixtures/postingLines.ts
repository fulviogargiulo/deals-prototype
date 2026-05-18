import type { PostingLine } from "../entities";

export const sharedPostingLines: PostingLine[] = [
  // posting-001 — invoice_issued — deal-001 (REBU, EUR 11 377 net of rebate 173)
  { id: "pline-001-1", postingId: "posting-001", ledgerId: 2,  side: "DEBIT",  amount: 11377, invoiceId: "inv-001" },
  { id: "pline-001-2", postingId: "posting-001", ledgerId: 6,  side: "CREDIT", amount: 11377 },

  // posting-002 — bank_statement_inbound_matched — deal-001 (EUR 11 377)
  { id: "pline-002-1", postingId: "posting-002", ledgerId: 1,  side: "DEBIT",  amount: 11377 },
  { id: "pline-002-2", postingId: "posting-002", ledgerId: 2,  side: "CREDIT", amount: 11377, invoiceId: "inv-001" },

  // posting-003 — commission_accrual — deal-001, agent-001 (EUR 4 230.8 = 40% × net 10 577)
  { id: "pline-003-1", postingId: "posting-003", ledgerId: 7,  side: "DEBIT",  amount: 4230.8 },
  { id: "pline-003-2", postingId: "posting-003", ledgerId: 22, side: "CREDIT", amount: 4230.8, invoiceId: "inv-009" },

  // posting-004 — payout_instructed — agent-001 (base 4 080.8 + IVA 21% 856.97 − IRPF 15% 612.12 = bank 4 325.65)
  { id: "pline-004-1", postingId: "posting-004", ledgerId: 22, side: "DEBIT",  amount: 4080.8 },
  { id: "pline-004-3", postingId: "posting-004", ledgerId: 5,  side: "DEBIT",  amount: 856.97 },
  { id: "pline-004-4", postingId: "posting-004", ledgerId: 28, side: "CREDIT", amount: 612.12 },
  { id: "pline-004-2", postingId: "posting-004", ledgerId: 1,  side: "CREDIT", amount: 4325.65 },

  // posting-007 — invoice_issued — deal-016 (REBU, AED 41 370 net: client 24 570 + developer 16 800)
  { id: "pline-007-1", postingId: "posting-007", ledgerId: 9,  side: "DEBIT",  amount: 24570, invoiceId: "inv-006" },
  { id: "pline-007-2", postingId: "posting-007", ledgerId: 9,  side: "DEBIT",  amount: 16800, invoiceId: "inv-007" },
  { id: "pline-007-3", postingId: "posting-007", ledgerId: 13, side: "CREDIT", amount: 41370 },

  // posting-008 — bank_statement_inbound_matched — deal-016 seller (AED 24 570)
  { id: "pline-008-1", postingId: "posting-008", ledgerId: 8,  side: "DEBIT",  amount: 24570 },
  { id: "pline-008-2", postingId: "posting-008", ledgerId: 9,  side: "CREDIT", amount: 24570, invoiceId: "inv-006" },

  // posting-009 — bank_statement_inbound_matched — deal-016 developer (AED 16 800)
  { id: "pline-009-1", postingId: "posting-009", ledgerId: 8,  side: "DEBIT",  amount: 16800 },
  { id: "pline-009-2", postingId: "posting-009", ledgerId: 9,  side: "CREDIT", amount: 16800, invoiceId: "inv-007" },

  // posting-010 — agent_adjustment — agent-001 (EUR 500, standalone REBU)
  { id: "pline-010-1", postingId: "posting-010", ledgerId: 7,  side: "DEBIT",  amount: 500 },
  { id: "pline-010-2", postingId: "posting-010", ledgerId: 22, side: "CREDIT", amount: 500, invoiceId: "inv-010" },

  // posting-011 — commission_accrual — deal-016, agent-004 (AED 16 115.4 = 42% × net 38 370)
  { id: "pline-011-1", postingId: "posting-011", ledgerId: 14, side: "DEBIT",  amount: 16115.4 },
  { id: "pline-011-2", postingId: "posting-011", ledgerId: 24, side: "CREDIT", amount: 16115.4, invoiceId: "inv-012" },

  // posting-012 — agent_adjustment — agent-004 (AED 1 200, standalone REBU)
  { id: "pline-012-1", postingId: "posting-012", ledgerId: 14, side: "DEBIT",  amount: 1200 },
  { id: "pline-012-2", postingId: "posting-012", ledgerId: 24, side: "CREDIT", amount: 1200, invoiceId: "inv-012" },

  // posting-013 — huspy_fee — agent-004 (AED 300, standalone REBU)
  { id: "pline-013-1", postingId: "posting-013", ledgerId: 24, side: "DEBIT",  amount: 300, invoiceId: "inv-012" },
  { id: "pline-013-2", postingId: "posting-013", ledgerId: 13, side: "CREDIT", amount: 300 },

  // posting-014 — huspy_fee — agent-001 (EUR 150, standalone REBU)
  { id: "pline-014-1", postingId: "posting-014", ledgerId: 22, side: "DEBIT",  amount: 150, invoiceId: "inv-009" },
  { id: "pline-014-2", postingId: "posting-014", ledgerId: 6,  side: "CREDIT", amount: 150 },

  // posting-015 — commission_accrual — deal-018, agent-001 (EUR 9 220)
  { id: "pline-015-1", postingId: "posting-015", ledgerId: 7,  side: "DEBIT",  amount: 9220 },
  { id: "pline-015-2", postingId: "posting-015", ledgerId: 22, side: "CREDIT", amount: 9220, invoiceId: "inv-011" },

  // posting-016 — huspy_fee — agent-001 Apr 2026 (EUR 150, standalone REBU)
  { id: "pline-016-1", postingId: "posting-016", ledgerId: 22, side: "DEBIT",  amount: 150, invoiceId: "inv-011" },
  { id: "pline-016-2", postingId: "posting-016", ledgerId: 6,  side: "CREDIT", amount: 150 },

  // posting-017 — invoice_issued — deal-008 (REBU, EUR 3 700 net of subsidy 5 000, seller)
  { id: "pline-017-1", postingId: "posting-017", ledgerId: 2,  side: "DEBIT",  amount: 3700, invoiceId: "inv-002" },
  { id: "pline-017-2", postingId: "posting-017", ledgerId: 6,  side: "CREDIT", amount: 3700 },

  // posting-018 — invoice_issued — deal-008 (REBU, EUR 5 800, developer split)
  { id: "pline-018-1", postingId: "posting-018", ledgerId: 2,  side: "DEBIT",  amount: 5800, invoiceId: "inv-003" },
  { id: "pline-018-2", postingId: "posting-018", ledgerId: 6,  side: "CREDIT", amount: 5800 },

  // posting-019 — invoice_issued — deal-014 (MBU, EUR 2 480)
  { id: "pline-019-1", postingId: "posting-019", ledgerId: 2,  side: "DEBIT",  amount: 2480, invoiceId: "inv-004" },
  { id: "pline-019-2", postingId: "posting-019", ledgerId: 6,  side: "CREDIT", amount: 2480 },

  // posting-020 — invoice_issued — deal-015 (MBU, SAR 4 600)
  { id: "pline-020-1", postingId: "posting-020", ledgerId: 16, side: "DEBIT",  amount: 4600, invoiceId: "inv-005" },
  { id: "pline-020-2", postingId: "posting-020", ledgerId: 20, side: "CREDIT", amount: 4600 },

  // posting-021 — invoice_issued — deal-018 (REBU, EUR 24 250 net of subsidy 7 000)
  { id: "pline-021-1", postingId: "posting-021", ledgerId: 2,  side: "DEBIT",  amount: 24250, invoiceId: "inv-008" },
  { id: "pline-021-2", postingId: "posting-021", ledgerId: 6,  side: "CREDIT", amount: 24250 },

  // posting-022 — bank_statement_inbound_matched — deal-018 (EUR 24 250)
  { id: "pline-022-1", postingId: "posting-022", ledgerId: 1,  side: "DEBIT",  amount: 24250 },
  { id: "pline-022-2", postingId: "posting-022", ledgerId: 2,  side: "CREDIT", amount: 24250, invoiceId: "inv-008" },

  // posting-023 — external_cost_accrual — deal-001 Gestoría López (EUR 800 accrual)
  // Only the CREDIT LIAB_EXTERNAL line is tagged: net(CREDIT−DEBIT) = 800 = inv-013.amount
  { id: "pline-023-1", postingId: "posting-023", ledgerId: 7,  side: "DEBIT",  amount: 800 },
  { id: "pline-023-2", postingId: "posting-023", ledgerId: 4,  side: "CREDIT", amount: 800, invoiceId: "inv-013" },

  // posting-024 — bank_statement_outbound_matched — deal-001 Gestoría López (EUR 800 payment)
  // DEBIT LIAB_EXTERNAL tagged: closes the payable → net(CREDIT−DEBIT) on tagged lines = 0 (paid)
  { id: "pline-024-1", postingId: "posting-024", ledgerId: 4,  side: "DEBIT",  amount: 800, invoiceId: "inv-013" },
  { id: "pline-024-2", postingId: "posting-024", ledgerId: 1,  side: "CREDIT", amount: 800 },

  // posting-025 — external_cost_accrual — deal-008 Gestoría López (EUR 800 accrual, pending)
  { id: "pline-025-1", postingId: "posting-025", ledgerId: 7,  side: "DEBIT",  amount: 800 },
  { id: "pline-025-2", postingId: "posting-025", ledgerId: 4,  side: "CREDIT", amount: 800, invoiceId: "inv-014" },

  // posting-026 — external_cost_accrual — deal-016 TAMM Legal (AED 3 000 accrual)
  { id: "pline-026-1", postingId: "posting-026", ledgerId: 14, side: "DEBIT",  amount: 3000 },
  { id: "pline-026-2", postingId: "posting-026", ledgerId: 11, side: "CREDIT", amount: 3000, invoiceId: "inv-015" },

  // posting-027 — bank_statement_outbound_matched — deal-016 TAMM Legal (AED 3 000 payment)
  { id: "pline-027-1", postingId: "posting-027", ledgerId: 11, side: "DEBIT",  amount: 3000, invoiceId: "inv-015" },
  { id: "pline-027-2", postingId: "posting-027", ledgerId: 8,  side: "CREDIT", amount: 3000 },

  // posting-028 — external_cost_accrual — deal-018 Gestoría López (EUR 1 200 accrual)
  { id: "pline-028-1", postingId: "posting-028", ledgerId: 7,  side: "DEBIT",  amount: 1200 },
  { id: "pline-028-2", postingId: "posting-028", ledgerId: 4,  side: "CREDIT", amount: 1200, invoiceId: "inv-016" },

  // posting-029 — bank_statement_outbound_matched — deal-018 Gestoría López (EUR 1 200 payment)
  { id: "pline-029-1", postingId: "posting-029", ledgerId: 4,  side: "DEBIT",  amount: 1200, invoiceId: "inv-016" },
  { id: "pline-029-2", postingId: "posting-029", ledgerId: 1,  side: "CREDIT", amount: 1200 },
];
