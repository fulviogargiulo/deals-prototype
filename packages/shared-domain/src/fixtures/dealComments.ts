import type { DealComment } from "../entities";

export const sharedDealComments: DealComment[] = [
  // ── deal-001 (finalized) — historical thread ──────────────────────────────
  {
    id: "dc-001-1",
    dealId: "deal-001",
    author: "ops",
    authorName: "Ops Team",
    text: "Please confirm the final sale price and attach the signed SPA before we can proceed to agent approval.",
    createdAt: "2026-01-08T10:15:00.000Z",
  },
  {
    id: "dc-001-2",
    dealId: "deal-001",
    author: "agent",
    authorName: "Felicia Canovas",
    text: "Confirmed — sale price is €385,000. SPA uploaded. The 3% rebate was agreed verbally; I've noted it in the deal description.",
    createdAt: "2026-01-08T14:30:00.000Z",
  },
  {
    id: "dc-001-3",
    dealId: "deal-001",
    author: "ops",
    authorName: "Ops Team",
    text: "Got it. Rebate recorded. Moving to agent approval.",
    createdAt: "2026-01-09T09:00:00.000Z",
  },

  // ── deal-003 (pending-details) — awaiting landlord ────────────────────────
  {
    id: "dc-003-1",
    dealId: "deal-003",
    author: "ops",
    authorName: "Ops Team",
    text: "Awaiting signed contract from landlord before we can progress.",
    createdAt: "2026-02-24T09:00:00.000Z",
  },

  // ── deal-004 (pending-details) — mortgage docs pending ────────────────────
  {
    id: "dc-004-1",
    dealId: "deal-004",
    author: "ops",
    authorName: "Ops Team",
    text: "Client requested extra time to gather mortgage documents.",
    createdAt: "2026-03-05T10:30:00.000Z",
  },

  // ── deal-005 (under-review) — amount discrepancy ─────────────────────────
  {
    id: "dc-005-1",
    dealId: "deal-005",
    author: "ops",
    authorName: "Ops Team",
    text: "The deal amount (SAR 1.8M) doesn't match the MOU we have on file (SAR 1.75M). Please clarify and re-upload the correct document.",
    createdAt: "2026-02-18T14:00:00.000Z",
  },

  // ── deal-007 (under-review) — price dispute raised by agent ──────────────
  {
    id: "dc-007-1",
    dealId: "deal-007",
    author: "agent",
    authorName: "Guilherme Castro",
    text: "I need to flag this — the client is claiming we verbally agreed on a lower sale price. The deal was reported at €475,000 but the client insists it should be €460,000.",
    createdAt: "2026-03-06T09:15:00.000Z",
  },
  {
    id: "dc-007-2",
    dealId: "deal-007",
    author: "ops",
    authorName: "Ops Team",
    text: "Thanks for flagging. Moving to under-review and escalating to the ops team — we'll follow up once we've checked the original offer documentation.",
    createdAt: "2026-03-06T11:00:00.000Z",
  },

  // ── deal-009 (under-review) — new deal, paperwork pending ────────────────
  {
    id: "dc-009-1",
    dealId: "deal-009",
    author: "ops",
    authorName: "Ops Team",
    text: "New deal just reported — awaiting paperwork.",
    createdAt: "2026-05-01T12:00:00.000Z",
  },

  // ── deal-018 (finalized) — back-and-forth ────────────────────────────────
  {
    id: "dc-018-1",
    dealId: "deal-018",
    author: "ops",
    authorName: "Ops Team",
    text: "The commission split for this deal needs clarification — is this 100% to Felicia or is there a co-broker involved?",
    createdAt: "2026-04-10T09:30:00.000Z",
  },
  {
    id: "dc-018-2",
    dealId: "deal-018",
    author: "agent",
    authorName: "Felicia Canovas",
    text: "100% to me. No co-broker. The referral from the developer was informal — they don't take a cut.",
    createdAt: "2026-04-10T11:15:00.000Z",
  },
  {
    id: "dc-018-3",
    dealId: "deal-018",
    author: "ops",
    authorName: "Ops Team",
    text: "Understood. One more thing — the subsidy amount (€7,000) was agreed with the client in writing?",
    createdAt: "2026-04-11T08:45:00.000Z",
  },
  {
    id: "dc-018-4",
    dealId: "deal-018",
    author: "agent",
    authorName: "Felicia Canovas",
    text: "Yes, it's in the offer letter. I'll attach it now.",
    createdAt: "2026-04-11T10:00:00.000Z",
  },
];
