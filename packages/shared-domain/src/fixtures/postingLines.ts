import type { PostingLine } from "../entities";

export const sharedPostingLines: PostingLine[] = [
  // posting-001 — deal_close — deal-001 (REBU, EUR 11 550)
  { id: "pline-001-1", postingId: "posting-001", ledgerId: 2,  side: "DEBIT",  amount: 11550, invoiceId: "inv-001" },
  { id: "pline-001-2", postingId: "posting-001", ledgerId: 6,  side: "CREDIT", amount: 11550 },

  // posting-002 — bank_statement_inbound_matched — deal-001 (EUR 11 550)
  { id: "pline-002-1", postingId: "posting-002", ledgerId: 1,  side: "DEBIT",  amount: 11550 },
  { id: "pline-002-2", postingId: "posting-002", ledgerId: 2,  side: "CREDIT", amount: 11550, invoiceId: "inv-001" },

  // posting-003 — agent_invoice — deal-001, agent-felicia (EUR 4 620 gross)
  // IRPF 19% withheld: 878 | net to agent: 3 742
  { id: "pline-003-1", postingId: "posting-003", ledgerId: 7,  side: "DEBIT",  amount: 4620 },
  { id: "pline-003-2", postingId: "posting-003", ledgerId: 22, side: "CREDIT", amount: 3742, invoiceId: "agent-inv-felicia-2026-01" },
  { id: "pline-003-3", postingId: "posting-003", ledgerId: 5,  side: "CREDIT", amount: 878 },

  // posting-004 — payout_instructed — agent-felicia (3 742 − 150 platform fee = 3 592)
  { id: "pline-004-1", postingId: "posting-004", ledgerId: 22, side: "DEBIT",  amount: 3592 },
  { id: "pline-004-2", postingId: "posting-004", ledgerId: 1,  side: "CREDIT", amount: 3592 },

  // posting-007 — deal_close — deal-016 (REBU, AED 42 000 split: seller 25 200 + developer 16 800)
  { id: "pline-007-1", postingId: "posting-007", ledgerId: 9,  side: "DEBIT",  amount: 25200, invoiceId: "inv-016-a" },
  { id: "pline-007-2", postingId: "posting-007", ledgerId: 9,  side: "DEBIT",  amount: 16800, invoiceId: "inv-016-b" },
  { id: "pline-007-3", postingId: "posting-007", ledgerId: 13, side: "CREDIT", amount: 42000 },

  // posting-008 — bank_statement_inbound_matched — deal-016 seller (AED 25 200)
  { id: "pline-008-1", postingId: "posting-008", ledgerId: 8,  side: "DEBIT",  amount: 25200 },
  { id: "pline-008-2", postingId: "posting-008", ledgerId: 9,  side: "CREDIT", amount: 25200, invoiceId: "inv-016-a" },

  // posting-009 — bank_statement_inbound_matched — deal-016 developer (AED 16 800)
  { id: "pline-009-1", postingId: "posting-009", ledgerId: 8,  side: "DEBIT",  amount: 16800 },
  { id: "pline-009-2", postingId: "posting-009", ledgerId: 9,  side: "CREDIT", amount: 16800, invoiceId: "inv-016-b" },

  // posting-010 — bonus — agent-felicia (EUR 500, standalone REBU)
  { id: "pline-010-1", postingId: "posting-010", ledgerId: 7,  side: "DEBIT",  amount: 500 },
  { id: "pline-010-2", postingId: "posting-010", ledgerId: 22, side: "CREDIT", amount: 500, invoiceId: "agent-inv-felicia-2026-q1" },

  // posting-011 — agent_invoice — deal-016, agent-gelo (AED 16 800 gross)
  // VAT 5% withheld: 840 | net to agent: 15 960
  { id: "pline-011-1", postingId: "posting-011", ledgerId: 14, side: "DEBIT",  amount: 16800 },
  { id: "pline-011-2", postingId: "posting-011", ledgerId: 24, side: "CREDIT", amount: 15960, invoiceId: "agent-inv-gelo-2026-05" },
  { id: "pline-011-3", postingId: "posting-011", ledgerId: 12, side: "CREDIT", amount: 840 },

  // posting-012 — incentive — agent-gelo (AED 1 200, standalone REBU)
  { id: "pline-012-1", postingId: "posting-012", ledgerId: 14, side: "DEBIT",  amount: 1200 },
  { id: "pline-012-2", postingId: "posting-012", ledgerId: 24, side: "CREDIT", amount: 1200, invoiceId: "agent-inv-gelo-2026-05" },

  // posting-013 — platform_fee — agent-gelo (AED 300, standalone REBU)
  { id: "pline-013-1", postingId: "posting-013", ledgerId: 24, side: "DEBIT",  amount: 300, invoiceId: "agent-inv-gelo-2026-05" },
  { id: "pline-013-2", postingId: "posting-013", ledgerId: 13, side: "CREDIT", amount: 300 },

  // posting-014 — platform_fee — agent-felicia (EUR 150, standalone REBU)
  { id: "pline-014-1", postingId: "posting-014", ledgerId: 22, side: "DEBIT",  amount: 150, invoiceId: "agent-inv-felicia-2026-01" },
  { id: "pline-014-2", postingId: "posting-014", ledgerId: 6,  side: "CREDIT", amount: 150 },

  // posting-015 — agent_invoice — deal-018, agent-felicia (EUR 15 000 gross, UNALLOCATED)
  // IRPF 19% withheld: 2 850 | net to agent: 12 150
  { id: "pline-015-1", postingId: "posting-015", ledgerId: 7,  side: "DEBIT",  amount: 15000 },
  { id: "pline-015-2", postingId: "posting-015", ledgerId: 22, side: "CREDIT", amount: 12150 },
  { id: "pline-015-3", postingId: "posting-015", ledgerId: 5,  side: "CREDIT", amount: 2850 },

  // posting-016 — platform_fee — agent-felicia Apr 2026 (EUR 150, standalone REBU, UNALLOCATED)
  { id: "pline-016-1", postingId: "posting-016", ledgerId: 22, side: "DEBIT",  amount: 150 },
  { id: "pline-016-2", postingId: "posting-016", ledgerId: 6,  side: "CREDIT", amount: 150 },
];
