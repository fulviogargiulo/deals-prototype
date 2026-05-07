import type { PostingLine } from "../entities";

// PostingLine fixtures — one entry per line in a posting.
// invoiceId    → receivable Invoice this line is claimed by (set on DEBIT Receivables_* lines)
// agentInvoiceId → AgentInvoice this line is claimed by (set on AgentLiability_* lines)

export const sharedPostingLines: PostingLine[] = [
  // posting-001 — deal_close — deal-001 (EUR 11 550)
  { id: "pline-001-1", postingId: "posting-001", ledgerId: "Receivables_Buyer",        side: "DEBIT",  amount: 11550, invoiceId: "inv-001", metadata: { deal_id: "deal-001", counterparty_type: "buyer",  invoice_id: "inv-001" } },
  { id: "pline-001-2", postingId: "posting-001", ledgerId: "Revenue_Commission_REBU",  side: "CREDIT", amount: 11550, metadata: { deal_id: "deal-001" } },

  // posting-002 — payment received — deal-001 (EUR 11 550)
  { id: "pline-002-1", postingId: "posting-002", ledgerId: "Bank_Operating",           side: "DEBIT",  amount: 11550, metadata: { bank_ref: "WIRE-20260112-001", invoice_id: "inv-001" } },
  { id: "pline-002-2", postingId: "posting-002", ledgerId: "Receivables_Buyer",        side: "CREDIT", amount: 11550, metadata: { deal_id: "deal-001", invoice_id: "inv-001" } },

  // posting-003 — soa_approved — agent payout crystallised (EUR 4 620)
  { id: "pline-003-1", postingId: "posting-003", ledgerId: "Revenue_Commission_REBU",        side: "DEBIT",  amount: 4620, metadata: { deal_id: "deal-001", soa_id: "SOA-001" } },
  { id: "pline-003-2", postingId: "posting-003", ledgerId: "AgentLiability_agent-felicia",   side: "CREDIT", amount: 4620, agentInvoiceId: "agent-inv-felicia-2026-01", metadata: { deal_id: "deal-001", soa_id: "SOA-001", agent_id: "agent-felicia" } },

  // posting-004 — payout instructed (EUR 4 620)
  { id: "pline-004-1", postingId: "posting-004", ledgerId: "AgentLiability_agent-felicia",   side: "DEBIT",  amount: 4620, metadata: { payout_ref: "PAY-001", agent_id: "agent-felicia" } },
  { id: "pline-004-2", postingId: "posting-004", ledgerId: "Bank_Operating",                 side: "CREDIT", amount: 4620, metadata: { payout_ref: "PAY-001" } },

  // posting-007 — deal_close — deal-016 (AED 42 000 split: 25 200 + 16 800)
  { id: "pline-007-1", postingId: "posting-007", ledgerId: "Receivables_Seller",       side: "DEBIT",  amount: 25200, invoiceId: "inv-016-a", metadata: { deal_id: "deal-016", counterparty_type: "seller",    invoice_id: "inv-016-a" } },
  { id: "pline-007-2", postingId: "posting-007", ledgerId: "Receivables_Developer",    side: "DEBIT",  amount: 16800, invoiceId: "inv-016-b", metadata: { deal_id: "deal-016", counterparty_type: "developer", invoice_id: "inv-016-b" } },
  { id: "pline-007-3", postingId: "posting-007", ledgerId: "Revenue_Commission_REBU",  side: "CREDIT", amount: 42000, metadata: { deal_id: "deal-016" } },

  // posting-008 — payment received — deal-016 seller (AED 25 200)
  { id: "pline-008-1", postingId: "posting-008", ledgerId: "Bank_Operating",           side: "DEBIT",  amount: 25200, metadata: { bank_ref: "WIRE-20260504-AED-001", invoice_id: "inv-016-a" } },
  { id: "pline-008-2", postingId: "posting-008", ledgerId: "Receivables_Seller",       side: "CREDIT", amount: 25200, metadata: { deal_id: "deal-016", invoice_id: "inv-016-a" } },

  // posting-009 — payment received — deal-016 developer (AED 16 800)
  { id: "pline-009-1", postingId: "posting-009", ledgerId: "Bank_Operating",           side: "DEBIT",  amount: 16800, metadata: { bank_ref: "WIRE-20260505-AED-001", invoice_id: "inv-016-b" } },
  { id: "pline-009-2", postingId: "posting-009", ledgerId: "Receivables_Developer",    side: "CREDIT", amount: 16800, metadata: { deal_id: "deal-016", invoice_id: "inv-016-b" } },

  // posting-010 — standalone bonus — no deal_id (EUR 500)
  { id: "pline-010-1", postingId: "posting-010", ledgerId: "Revenue_Commission_REBU",       side: "DEBIT",  amount: 500, metadata: { agent_id: "agent-felicia" } },
  { id: "pline-010-2", postingId: "posting-010", ledgerId: "AgentLiability_agent-felicia",  side: "CREDIT", amount: 500, agentInvoiceId: "agent-inv-felicia-2026-q1", metadata: { agent_id: "agent-felicia" } },

  // posting-011 — soa_approved — deal-016, agent-gelo (AED 16 800)
  { id: "pline-011-1", postingId: "posting-011", ledgerId: "Revenue_Commission_REBU",     side: "DEBIT",  amount: 16800, metadata: { deal_id: "deal-016", soa_id: "SOA-016" } },
  { id: "pline-011-2", postingId: "posting-011", ledgerId: "AgentLiability_agent-gelo",   side: "CREDIT", amount: 16800, agentInvoiceId: "agent-inv-gelo-2026-05", metadata: { deal_id: "deal-016", soa_id: "SOA-016", agent_id: "agent-gelo" } },

  // posting-012 — incentive — agent-gelo, no deal (AED 1 200)
  { id: "pline-012-1", postingId: "posting-012", ledgerId: "Revenue_Commission_REBU",     side: "DEBIT",  amount: 1200, metadata: { agent_id: "agent-gelo" } },
  { id: "pline-012-2", postingId: "posting-012", ledgerId: "AgentLiability_agent-gelo",   side: "CREDIT", amount: 1200, agentInvoiceId: "agent-inv-gelo-2026-05", metadata: { agent_id: "agent-gelo", line_type: "incentive" } },

  // posting-013 — platform support fee — agent-gelo, no deal (AED 300 deduction)
  { id: "pline-013-1", postingId: "posting-013", ledgerId: "AgentLiability_agent-gelo",   side: "DEBIT",  amount: 300, agentInvoiceId: "agent-inv-gelo-2026-05", metadata: { agent_id: "agent-gelo", line_type: "platform_support_fee" } },
  { id: "pline-013-2", postingId: "posting-013", ledgerId: "Revenue_PlatformFees",         side: "CREDIT", amount: 300, metadata: { agent_id: "agent-gelo" } },

  // posting-014 — platform support fee — agent-felicia, no deal (EUR 150 deduction)
  { id: "pline-014-1", postingId: "posting-014", ledgerId: "AgentLiability_agent-felicia", side: "DEBIT",  amount: 150, agentInvoiceId: "agent-inv-felicia-2026-01", metadata: { agent_id: "agent-felicia", line_type: "platform_support_fee" } },
  { id: "pline-014-2", postingId: "posting-014", ledgerId: "Revenue_PlatformFees",          side: "CREDIT", amount: 150, metadata: { agent_id: "agent-felicia" } },
];
