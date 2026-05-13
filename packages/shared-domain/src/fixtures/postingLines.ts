import type { PostingLine } from "../entities";

export const sharedPostingLines: PostingLine[] = [
  // posting-001 — deal_close — deal-001 (REBU, EUR 11 377 net of rebate 173)
  { id: "pline-001-1", postingId: "posting-001", ledgerId: 2,  side: "DEBIT",  amount: 11377, invoiceId: "inv-001" },
  { id: "pline-001-2", postingId: "posting-001", ledgerId: 6,  side: "CREDIT", amount: 11377 },

  // posting-002 — bank_statement_inbound_matched — deal-001 (EUR 11 377)
  { id: "pline-002-1", postingId: "posting-002", ledgerId: 1,  side: "DEBIT",  amount: 11377 },
  { id: "pline-002-2", postingId: "posting-002", ledgerId: 2,  side: "CREDIT", amount: 11377, invoiceId: "inv-001" },

  // posting-003 — agent_invoice — deal-001, agent-felicia (EUR 4 620)
  { id: "pline-003-1", postingId: "posting-003", ledgerId: 7,  side: "DEBIT",  amount: 4620 },
  { id: "pline-003-2", postingId: "posting-003", ledgerId: 22, side: "CREDIT", amount: 4620, invoiceId: "agent-inv-felicia-2026-01" },

  // posting-004 — payout_instructed — agent-felicia (4 620 − 150 platform fee = 4 470)
  { id: "pline-004-1", postingId: "posting-004", ledgerId: 22, side: "DEBIT",  amount: 4470 },
  { id: "pline-004-2", postingId: "posting-004", ledgerId: 1,  side: "CREDIT", amount: 4470 },

  // posting-007 — deal_close — deal-016 (REBU, AED 41 370 net: client 24 570 + developer 16 800)
  { id: "pline-007-1", postingId: "posting-007", ledgerId: 9,  side: "DEBIT",  amount: 24570, invoiceId: "inv-016-a" },
  { id: "pline-007-2", postingId: "posting-007", ledgerId: 9,  side: "DEBIT",  amount: 16800, invoiceId: "inv-016-b" },
  { id: "pline-007-3", postingId: "posting-007", ledgerId: 13, side: "CREDIT", amount: 41370 },

  // posting-008 — bank_statement_inbound_matched — deal-016 seller (AED 24 570)
  { id: "pline-008-1", postingId: "posting-008", ledgerId: 8,  side: "DEBIT",  amount: 24570 },
  { id: "pline-008-2", postingId: "posting-008", ledgerId: 9,  side: "CREDIT", amount: 24570, invoiceId: "inv-016-a" },

  // posting-009 — bank_statement_inbound_matched — deal-016 developer (AED 16 800)
  { id: "pline-009-1", postingId: "posting-009", ledgerId: 8,  side: "DEBIT",  amount: 16800 },
  { id: "pline-009-2", postingId: "posting-009", ledgerId: 9,  side: "CREDIT", amount: 16800, invoiceId: "inv-016-b" },

  // posting-010 — bonus — agent-felicia (EUR 500, standalone REBU)
  { id: "pline-010-1", postingId: "posting-010", ledgerId: 7,  side: "DEBIT",  amount: 500 },
  { id: "pline-010-2", postingId: "posting-010", ledgerId: 22, side: "CREDIT", amount: 500, invoiceId: "agent-inv-felicia-2026-q1" },

  // posting-011 — agent_invoice — deal-016, agent-gelo (AED 16 800)
  { id: "pline-011-1", postingId: "posting-011", ledgerId: 14, side: "DEBIT",  amount: 16800 },
  { id: "pline-011-2", postingId: "posting-011", ledgerId: 24, side: "CREDIT", amount: 16800, invoiceId: "agent-inv-gelo-2026-05" },

  // posting-012 — incentive — agent-gelo (AED 1 200, standalone REBU)
  { id: "pline-012-1", postingId: "posting-012", ledgerId: 14, side: "DEBIT",  amount: 1200 },
  { id: "pline-012-2", postingId: "posting-012", ledgerId: 24, side: "CREDIT", amount: 1200, invoiceId: "agent-inv-gelo-2026-05" },

  // posting-013 — platform_fee — agent-gelo (AED 300, standalone REBU)
  { id: "pline-013-1", postingId: "posting-013", ledgerId: 24, side: "DEBIT",  amount: 300, invoiceId: "agent-inv-gelo-2026-05" },
  { id: "pline-013-2", postingId: "posting-013", ledgerId: 13, side: "CREDIT", amount: 300 },

  // posting-014 — platform_fee — agent-felicia (EUR 150, standalone REBU)
  { id: "pline-014-1", postingId: "posting-014", ledgerId: 22, side: "DEBIT",  amount: 150, invoiceId: "agent-inv-felicia-2026-01" },
  { id: "pline-014-2", postingId: "posting-014", ledgerId: 6,  side: "CREDIT", amount: 150 },

  // posting-015 — agent_invoice — deal-018, agent-felicia (EUR 9 220)
  { id: "pline-015-1", postingId: "posting-015", ledgerId: 7,  side: "DEBIT",  amount: 9220 },
  { id: "pline-015-2", postingId: "posting-015", ledgerId: 22, side: "CREDIT", amount: 9220, invoiceId: "agent-inv-felicia-2026-04" },

  // posting-016 — platform_fee — agent-felicia Apr 2026 (EUR 150, standalone REBU)
  { id: "pline-016-1", postingId: "posting-016", ledgerId: 22, side: "DEBIT",  amount: 150, invoiceId: "agent-inv-felicia-2026-04" },
  { id: "pline-016-2", postingId: "posting-016", ledgerId: 6,  side: "CREDIT", amount: 150 },

  // posting-017 — deal_close — deal-008 (REBU, EUR 3 700 net of subsidy 5 000, seller)
  { id: "pline-017-1", postingId: "posting-017", ledgerId: 2,  side: "DEBIT",  amount: 3700, invoiceId: "inv-008-a" },
  { id: "pline-017-2", postingId: "posting-017", ledgerId: 6,  side: "CREDIT", amount: 3700 },

  // posting-018 — deal_close — deal-008 (REBU, EUR 5 800, developer split)
  { id: "pline-018-1", postingId: "posting-018", ledgerId: 2,  side: "DEBIT",  amount: 5800, invoiceId: "inv-008-b" },
  { id: "pline-018-2", postingId: "posting-018", ledgerId: 6,  side: "CREDIT", amount: 5800 },

  // posting-019 — deal_close — deal-014 (MBU, EUR 2 480)
  { id: "pline-019-1", postingId: "posting-019", ledgerId: 2,  side: "DEBIT",  amount: 2480, invoiceId: "inv-014" },
  { id: "pline-019-2", postingId: "posting-019", ledgerId: 6,  side: "CREDIT", amount: 2480 },

  // posting-020 — deal_close — deal-015 (MBU, SAR 4 600)
  { id: "pline-020-1", postingId: "posting-020", ledgerId: 16, side: "DEBIT",  amount: 4600, invoiceId: "inv-015" },
  { id: "pline-020-2", postingId: "posting-020", ledgerId: 20, side: "CREDIT", amount: 4600 },

  // posting-021 — deal_close — deal-018 (REBU, EUR 24 250 net of subsidy 7 000)
  { id: "pline-021-1", postingId: "posting-021", ledgerId: 2,  side: "DEBIT",  amount: 24250, invoiceId: "inv-018" },
  { id: "pline-021-2", postingId: "posting-021", ledgerId: 6,  side: "CREDIT", amount: 24250 },

  // posting-022 — bank_statement_inbound_matched — deal-018 (EUR 24 250)
  { id: "pline-022-1", postingId: "posting-022", ledgerId: 1,  side: "DEBIT",  amount: 24250 },
  { id: "pline-022-2", postingId: "posting-022", ledgerId: 2,  side: "CREDIT", amount: 24250, invoiceId: "inv-018" },
];
