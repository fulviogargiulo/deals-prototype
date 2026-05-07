import type { Posting, PostingLine } from "../entities";

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
  // SOA approved — agent payout crystallised (40% of 11 550 = 4 620)
  {
    id: "posting-003",
    externalRef: "SOA-001",
    businessProcess: "soa_approved",
    createdBy: "user-ops-finance",
    createdAt: "2026-01-20T11:00:00.000Z",
    valueDate: "2026-01-20",
    currency: "EUR",
    status: "posted",
    description: "SOA approved — Felicia Canovas, deal-001",
    metadata: { deal_id: "deal-001", soa_id: "SOA-001", agent_id: "agent-felicia" },
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

  // ── deal-008 — split receivable (seller + developer) ───────────────────────

  // Commission earned — EUR 14 500 split: seller 8 700 + developer 5 800
  {
    id: "posting-005",
    externalRef: "P0005",
    businessProcess: "deal_close",
    createdBy: "system",
    createdAt: "2026-03-05T09:00:00.000Z",
    valueDate: "2026-03-05",
    currency: "EUR",
    status: "posted",
    description: "Commission earned — deal-008 (Carlos Fernández, Sell, €580k, split receivable)",
    metadata: { deal_id: "deal-008", market: "secondary", bu: "rebu" },
  },

  // ── deal-014 — mortgage, MBU, overdue ──────────────────────────────────────

  // Commission earned — EUR 2 480, bank counterparty, MBU
  {
    id: "posting-006",
    externalRef: "P0006",
    businessProcess: "deal_close",
    createdBy: "system",
    createdAt: "2026-04-15T09:00:00.000Z",
    valueDate: "2026-04-15",
    currency: "EUR",
    status: "posted",
    description: "Commission earned — deal-014 (Mortgage, CaixaBank, €496k)",
    metadata: { deal_id: "deal-014", invoice_id: "inv-014", market: "primary", bu: "mortgage" },
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

  // ── deal-016 — SOA approved, agent-gelo ────────────────────────────────────

  // Commission crystallised for agent-gelo: AED 42 000 × 40% = 16 800
  {
    id: "posting-011",
    externalRef: "SOA-016",
    businessProcess: "soa_approved",
    createdBy: "user-ops-finance",
    createdAt: "2026-05-10T11:00:00.000Z",
    valueDate: "2026-05-10",
    currency: "AED",
    status: "posted",
    description: "SOA approved — Gelo Huspy, deal-016",
    metadata: { deal_id: "deal-016", soa_id: "SOA-016", agent_id: "agent-gelo" },
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
];

export const sharedPostingLines: PostingLine[] = [
  // posting-001 — deal_close — deal-001 (EUR 11 550)
  { id: "pline-001-1", postingId: "posting-001", ledgerId: "Receivables_Buyer",        side: "DEBIT",  amount: 11550, metadata: { deal_id: "deal-001", counterparty_type: "buyer",  invoice_id: "inv-001" } },
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

  // posting-005 — deal_close — deal-008 (EUR 14 500 split: 8 700 + 5 800)
  { id: "pline-005-1", postingId: "posting-005", ledgerId: "Receivables_Seller",       side: "DEBIT",  amount: 8700,  metadata: { deal_id: "deal-008", counterparty_type: "seller",    invoice_id: "inv-008-a" } },
  { id: "pline-005-2", postingId: "posting-005", ledgerId: "Receivables_Developer",    side: "DEBIT",  amount: 5800,  metadata: { deal_id: "deal-008", counterparty_type: "developer", invoice_id: "inv-008-b" } },
  { id: "pline-005-3", postingId: "posting-005", ledgerId: "Revenue_Commission_REBU",  side: "CREDIT", amount: 14500, metadata: { deal_id: "deal-008" } },

  // posting-006 — deal_close — deal-014 mortgage (EUR 2 480)
  { id: "pline-006-1", postingId: "posting-006", ledgerId: "Receivables_Bank",         side: "DEBIT",  amount: 2480, metadata: { deal_id: "deal-014", counterparty_type: "bank", invoice_id: "inv-014" } },
  { id: "pline-006-2", postingId: "posting-006", ledgerId: "Revenue_Commission_MBU",   side: "CREDIT", amount: 2480, metadata: { deal_id: "deal-014" } },

  // posting-007 — deal_close — deal-016 (AED 42 000 split: 25 200 + 16 800)
  { id: "pline-007-1", postingId: "posting-007", ledgerId: "Receivables_Seller",       side: "DEBIT",  amount: 25200, metadata: { deal_id: "deal-016", counterparty_type: "seller",    invoice_id: "inv-016-a" } },
  { id: "pline-007-2", postingId: "posting-007", ledgerId: "Receivables_Developer",    side: "DEBIT",  amount: 16800, metadata: { deal_id: "deal-016", counterparty_type: "developer", invoice_id: "inv-016-b" } },
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
