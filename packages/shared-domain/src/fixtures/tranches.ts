import type { Tranche } from "../entities";

// One Tranche per deal for deals 001-025. Two tranches for deal-026 (arras + escritura).
// Financial amounts live in PnlEntries (REVENUE_SOURCE, AGENT_PAYOUT, etc.).
// Tranche carries only: state machine, engine config, reporting date, ops reference.

export const sharedTranches: Tranche[] = [

  { id: "tranche-001", dealId: "deal-001", index: 0, blueprintId: "blueprint-es-rebu", pnlEngine: "rebu", reportDate: "2026-01-06", ofCaseNumber: "OF-DEAL-001",
    status: "finalized",
    statusHistory: [
      { from: "pending-details",        to: "under-review",           timestamp: "2026-01-07T10:00:00.000Z", note: "Ops review started" },
      { from: "under-review",           to: "pending-agent-approval", timestamp: "2026-01-09T15:00:00.000Z", note: "Documents approved" },
      { from: "pending-agent-approval", to: "invoicing",              timestamp: "2026-01-10T09:00:00.000Z", note: "Agent approved — invoice issued" },
      { from: "invoicing",              to: "finalized",              timestamp: "2026-01-12T14:30:00.000Z", note: "Payment confirmed" },
    ],
    createdAt: "2026-01-06T09:00:00.000Z", updatedAt: "2026-01-12T14:30:00.000Z" },

  { id: "tranche-002", dealId: "deal-002", index: 0, blueprintId: "blueprint-es-rebu", pnlEngine: "rebu", reportDate: "2026-02-08", ofCaseNumber: "OF-DEAL-002",
    status: "pending-agent-approval",
    statusHistory: [
      { from: "pending-details", to: "under-review",           timestamp: "2026-02-10T10:00:00.000Z" },
      { from: "under-review",    to: "pending-agent-approval", timestamp: "2026-02-13T14:00:00.000Z" },
    ],
    createdAt: "2026-02-08T00:00:00.000Z", updatedAt: "2026-02-13T14:00:00.000Z" },

  { id: "tranche-003", dealId: "deal-003", index: 0, blueprintId: "blueprint-es-rebu", pnlEngine: "rebu", reportDate: "2026-02-22", ofCaseNumber: "OF-DEAL-003",
    status: "pending-details",
    createdAt: "2026-02-22T00:00:00.000Z", updatedAt: "2026-02-22T00:00:00.000Z" },

  { id: "tranche-004", dealId: "deal-004", index: 0, blueprintId: "blueprint-es-rebu", pnlEngine: "rebu", reportDate: "2026-03-03", ofCaseNumber: "OF-DEAL-004",
    status: "pending-details",
    createdAt: "2026-03-03T00:00:00.000Z", updatedAt: "2026-03-03T00:00:00.000Z" },

  { id: "tranche-005", dealId: "deal-005", index: 0, blueprintId: "blueprint-sa-rebu", pnlEngine: "rebu", reportDate: "2026-02-15", ofCaseNumber: "OF-DEAL-005",
    status: "under-review",
    statusHistory: [{ from: "pending-details", to: "under-review", timestamp: "2026-02-17T10:00:00.000Z" }],
    createdAt: "2026-02-15T00:00:00.000Z", updatedAt: "2026-02-17T10:00:00.000Z" },

  { id: "tranche-006", dealId: "deal-006", index: 0, blueprintId: "blueprint-es-rebu", pnlEngine: "rebu", reportDate: "2026-02-20", ofCaseNumber: "OF-DEAL-006",
    status: "pending-agent-approval",
    statusHistory: [
      { from: "pending-details", to: "under-review",           timestamp: "2026-02-23T10:00:00.000Z" },
      { from: "under-review",    to: "pending-agent-approval", timestamp: "2026-02-26T14:00:00.000Z" },
    ],
    createdAt: "2026-02-20T00:00:00.000Z", updatedAt: "2026-02-26T14:00:00.000Z" },

  { id: "tranche-007", dealId: "deal-007", index: 0, blueprintId: "blueprint-es-rebu", pnlEngine: "rebu", reportDate: "2026-03-05", ofCaseNumber: "OF-DEAL-007",
    status: "under-review",
    statusHistory: [{ from: "pending-details", to: "under-review", timestamp: "2026-03-07T09:00:00.000Z" }],
    createdAt: "2026-03-05T00:00:00.000Z", updatedAt: "2026-03-07T09:00:00.000Z" },

  { id: "tranche-008", dealId: "deal-008", index: 0, blueprintId: "blueprint-es-rebu", pnlEngine: "rebu", reportDate: "2026-03-03", ofCaseNumber: "OF-DEAL-008",
    status: "invoicing",
    statusHistory: [
      { from: "pending-details",        to: "under-review",           timestamp: "2026-03-04T10:00:00.000Z" },
      { from: "under-review",           to: "pending-agent-approval", timestamp: "2026-03-04T16:00:00.000Z" },
      { from: "pending-agent-approval", to: "invoicing",              timestamp: "2026-03-05T10:00:00.000Z", note: "Invoice issued" },
    ],
    createdAt: "2026-03-03T00:00:00.000Z", updatedAt: "2026-03-05T10:00:00.000Z" },

  { id: "tranche-009", dealId: "deal-009", index: 0, blueprintId: "blueprint-ae-rebu", pnlEngine: "rebu", reportDate: "2026-05-01", ofCaseNumber: "OF-DEAL-009",
    status: "under-review",
    statusHistory: [{ from: "pending-details", to: "under-review", timestamp: "2026-05-03T09:00:00.000Z" }],
    createdAt: "2026-05-01T00:00:00.000Z", updatedAt: "2026-05-03T09:00:00.000Z" },

  { id: "tranche-010", dealId: "deal-010", index: 0, blueprintId: "blueprint-ae-rebu", pnlEngine: "rebu", reportDate: "2026-03-18", ofCaseNumber: "OF-DEAL-010",
    status: "canceled",
    statusHistory: [
      { from: "pending-details", to: "under-review", timestamp: "2026-03-20T09:00:00.000Z" },
      { from: "under-review",    to: "canceled",     timestamp: "2026-03-25T11:00:00.000Z", note: "Client withdrew" },
    ],
    createdAt: "2026-03-18T00:00:00.000Z", updatedAt: "2026-03-25T11:00:00.000Z" },

  { id: "tranche-011", dealId: "deal-011", index: 0, blueprintId: "blueprint-ae-mortgage", pnlEngine: "mbu-ma-broker", reportDate: "2026-04-20", ofCaseNumber: "OF-DEAL-011",
    disbursedAmount: 1_500_000,
    status: "invoicing",
    statusHistory: [
      { from: "pending-details", to: "under-review", timestamp: "2026-04-21T09:00:00.000Z" },
      { from: "under-review",    to: "invoicing",    timestamp: "2026-04-22T10:00:00.000Z", note: "Invoice issued to DIB" },
    ],
    createdAt: "2026-04-20T00:00:00.000Z", updatedAt: "2026-04-22T10:00:00.000Z" },

  { id: "tranche-012", dealId: "deal-012", index: 0, blueprintId: "blueprint-ae-mortgage", pnlEngine: "mbu-direct", reportDate: "2026-04-28", ofCaseNumber: "OF-DEAL-012",
    disbursedAmount: 3_200_000,
    status: "under-review",
    statusHistory: [{ from: "pending-details", to: "under-review", timestamp: "2026-04-30T09:00:00.000Z" }],
    createdAt: "2026-04-28T00:00:00.000Z", updatedAt: "2026-04-30T09:00:00.000Z" },

  { id: "tranche-013", dealId: "deal-013", index: 0, blueprintId: "blueprint-es-rebu", pnlEngine: "rebu", reportDate: "2026-04-10", ofCaseNumber: "OF-DEAL-013",
    status: "pending-agent-approval",
    statusHistory: [
      { from: "pending-details", to: "under-review",           timestamp: "2026-04-12T10:00:00.000Z" },
      { from: "under-review",    to: "pending-agent-approval", timestamp: "2026-04-15T14:00:00.000Z" },
    ],
    createdAt: "2026-04-10T00:00:00.000Z", updatedAt: "2026-04-15T14:00:00.000Z" },

  { id: "tranche-014", dealId: "deal-014", index: 0, blueprintId: "blueprint-es-mortgage", pnlEngine: "mbu-direct", reportDate: "2026-04-10", ofCaseNumber: "OF-DEAL-014",
    disbursedAmount: 496_000,
    status: "invoicing",
    statusHistory: [
      { from: "pending-details",        to: "under-review",           timestamp: "2026-04-11T09:00:00.000Z" },
      { from: "under-review",           to: "pending-agent-approval", timestamp: "2026-04-13T15:00:00.000Z" },
      { from: "pending-agent-approval", to: "invoicing",              timestamp: "2026-04-15T10:00:00.000Z", note: "Invoice issued" },
    ],
    createdAt: "2026-04-10T00:00:00.000Z", updatedAt: "2026-04-15T10:00:00.000Z" },

  { id: "tranche-015", dealId: "deal-015", index: 0, blueprintId: "blueprint-sa-mortgage", pnlEngine: "mbu-direct", reportDate: "2026-04-28", ofCaseNumber: "OF-DEAL-015",
    disbursedAmount: 920_000,
    status: "invoicing",
    statusHistory: [
      { from: "pending-details",        to: "under-review",           timestamp: "2026-04-29T09:00:00.000Z" },
      { from: "under-review",           to: "pending-agent-approval", timestamp: "2026-05-01T14:00:00.000Z" },
      { from: "pending-agent-approval", to: "invoicing",              timestamp: "2026-05-02T09:00:00.000Z", note: "Invoice issued" },
    ],
    createdAt: "2026-04-28T00:00:00.000Z", updatedAt: "2026-05-02T09:00:00.000Z" },

  { id: "tranche-016", dealId: "deal-016", index: 0, blueprintId: "blueprint-ae-rebu", pnlEngine: "rebu", reportDate: "2026-05-01", ofCaseNumber: "OF-DEAL-016",
    status: "finalized",
    statusHistory: [
      { from: "pending-details",        to: "under-review",           timestamp: "2026-05-02T09:00:00.000Z" },
      { from: "under-review",           to: "pending-agent-approval", timestamp: "2026-05-03T15:00:00.000Z" },
      { from: "pending-agent-approval", to: "invoicing",              timestamp: "2026-05-04T09:00:00.000Z", note: "Invoices issued" },
      { from: "invoicing",              to: "finalized",              timestamp: "2026-05-05T11:00:00.000Z", note: "All payments received" },
    ],
    createdAt: "2026-05-01T00:00:00.000Z", updatedAt: "2026-05-05T11:00:00.000Z" },

  { id: "tranche-017", dealId: "deal-017", index: 0, blueprintId: "blueprint-es-rebu", pnlEngine: "rebu", reportDate: "2026-04-28", ofCaseNumber: "OF-DEAL-017",
    status: "under-review",
    statusHistory: [{ from: "pending-details", to: "under-review", timestamp: "2026-04-30T09:00:00.000Z" }],
    createdAt: "2026-04-28T00:00:00.000Z", updatedAt: "2026-04-30T09:00:00.000Z" },

  { id: "tranche-018", dealId: "deal-018", index: 0, blueprintId: "blueprint-es-rebu", pnlEngine: "rebu", reportDate: "2026-04-12", ofCaseNumber: "OF-DEAL-018",
    status: "finalized",
    statusHistory: [
      { from: "pending-details",        to: "under-review",           timestamp: "2026-04-13T09:00:00.000Z" },
      { from: "under-review",           to: "pending-agent-approval", timestamp: "2026-04-14T15:00:00.000Z" },
      { from: "pending-agent-approval", to: "invoicing",              timestamp: "2026-04-15T09:00:00.000Z", note: "Invoice issued" },
      { from: "invoicing",              to: "finalized",              timestamp: "2026-04-22T15:30:00.000Z", note: "Payment confirmed" },
    ],
    createdAt: "2026-04-12T00:00:00.000Z", updatedAt: "2026-04-22T15:30:00.000Z" },

  { id: "tranche-019", dealId: "deal-019", index: 0, blueprintId: "blueprint-es-rebu", pnlEngine: "rebu", reportDate: "2026-03-20", ofCaseNumber: "OF-DEAL-019",
    status: "canceled",
    statusHistory: [
      { from: "pending-details", to: "under-review", timestamp: "2026-03-22T09:00:00.000Z" },
      { from: "under-review",    to: "canceled",     timestamp: "2026-04-01T11:00:00.000Z", note: "Client withdrew" },
    ],
    createdAt: "2026-03-20T00:00:00.000Z", updatedAt: "2026-04-01T11:00:00.000Z" },

  { id: "tranche-020", dealId: "deal-020", index: 0, blueprintId: "blueprint-ae-rebu", pnlEngine: "rebu", reportDate: "2026-05-12", ofCaseNumber: "OF-DEAL-020",
    status: "finalized",
    statusHistory: [
      { from: "pending-details",        to: "under-review",           timestamp: "2026-05-12T10:00:00.000Z" },
      { from: "under-review",           to: "pending-agent-approval", timestamp: "2026-05-13T14:00:00.000Z" },
      { from: "pending-agent-approval", to: "invoicing",              timestamp: "2026-05-14T09:00:00.000Z", note: "Invoice issued to Emaar" },
      { from: "invoicing",              to: "finalized",              timestamp: "2026-05-17T14:00:00.000Z", note: "Emaar payment received" },
    ],
    createdAt: "2026-05-12T00:00:00.000Z", updatedAt: "2026-05-17T14:00:00.000Z" },

  { id: "tranche-021", dealId: "deal-021", index: 0, blueprintId: "blueprint-es-rebu", pnlEngine: "rebu", reportDate: "2026-03-05", ofCaseNumber: "OF-DEAL-021",
    status: "finalized",
    statusHistory: [
      { from: "pending-details",        to: "under-review",           timestamp: "2026-03-06T09:00:00.000Z" },
      { from: "under-review",           to: "pending-agent-approval", timestamp: "2026-03-08T14:00:00.000Z" },
      { from: "pending-agent-approval", to: "invoicing",              timestamp: "2026-03-10T09:00:00.000Z", note: "Invoice issued" },
      { from: "invoicing",              to: "finalized",              timestamp: "2026-03-15T15:00:00.000Z", note: "Payment confirmed" },
    ],
    createdAt: "2026-03-05T00:00:00.000Z", updatedAt: "2026-03-20T15:00:00.000Z" },

  { id: "tranche-022", dealId: "deal-022", index: 0, blueprintId: "blueprint-ae-mortgage", pnlEngine: "mbu-ma-broker", reportDate: "2026-05-05", ofCaseNumber: "OF-DEAL-022",
    disbursedAmount: 2_800_000,
    status: "finalized",
    statusHistory: [
      { from: "pending-details", to: "under-review", timestamp: "2026-05-07T11:00:00.000Z" },
      { from: "under-review",    to: "invoicing",    timestamp: "2026-05-08T10:00:00.000Z", note: "Invoice issued to ADIB" },
      { from: "invoicing",       to: "finalized",    timestamp: "2026-05-14T15:00:00.000Z", note: "ADIB payment received" },
    ],
    createdAt: "2026-05-05T00:00:00.000Z", updatedAt: "2026-05-14T15:00:00.000Z" },

  { id: "tranche-023", dealId: "deal-023", index: 0, blueprintId: "blueprint-ae-mortgage", pnlEngine: "mbu-ma-broker", reportDate: "2026-05-10", ofCaseNumber: "OF-DEAL-023",
    disbursedAmount: 2_000_000,
    status: "invoicing",
    statusHistory: [
      { from: "pending-details", to: "under-review", timestamp: "2026-05-11T09:00:00.000Z" },
      { from: "under-review",    to: "invoicing",    timestamp: "2026-05-12T10:00:00.000Z", note: "Invoice issued to DIB" },
    ],
    createdAt: "2026-05-10T00:00:00.000Z", updatedAt: "2026-05-12T10:00:00.000Z" },

  { id: "tranche-024", dealId: "deal-024", index: 0, blueprintId: "blueprint-ae-mortgage", pnlEngine: "manual", reportDate: "2026-05-15", ofCaseNumber: "OF-DEAL-024",
    status: "invoicing",
    statusHistory: [
      { from: "pending-details", to: "under-review", timestamp: "2026-05-15T09:00:00.000Z" },
      { from: "under-review",    to: "invoicing",    timestamp: "2026-05-16T10:00:00.000Z" },
    ],
    createdAt: "2026-05-15T00:00:00.000Z", updatedAt: "2026-05-16T10:00:00.000Z" },

  { id: "tranche-025", dealId: "deal-025", index: 0, blueprintId: "blueprint-ae-mortgage", pnlEngine: "manual", reportDate: "2026-05-18", ofCaseNumber: "OF-DEAL-025",
    status: "invoicing",
    statusHistory: [
      { from: "pending-details", to: "under-review", timestamp: "2026-05-18T09:00:00.000Z" },
      { from: "under-review",    to: "invoicing",    timestamp: "2026-05-19T11:00:00.000Z" },
    ],
    createdAt: "2026-05-18T00:00:00.000Z", updatedAt: "2026-05-19T11:00:00.000Z" },

  // ── deal-026 — two tranches (Arras + Escritura) ───────────────────────────
  { id: "tranche-026a", dealId: "deal-026", index: 0, label: "Arras",
    blueprintId: "blueprint-es-rebu", pnlEngine: "rebu", reportDate: "2026-06-01", ofCaseNumber: "OF-DEAL-026-ARRAS",
    status: "finalized",
    statusHistory: [
      { from: "pending-details",        to: "under-review",           timestamp: "2026-06-01T09:00:00.000Z" },
      { from: "under-review",           to: "pending-agent-approval", timestamp: "2026-06-02T10:00:00.000Z", note: "Arras documents approved" },
      { from: "pending-agent-approval", to: "invoicing",              timestamp: "2026-06-03T09:00:00.000Z", note: "Agent confirmed" },
      { from: "invoicing",              to: "finalized",              timestamp: "2026-06-03T11:00:00.000Z", note: "Arras payment received" },
    ],
    createdAt: "2026-06-01T09:00:00.000Z", updatedAt: "2026-06-03T11:00:00.000Z" },

  { id: "tranche-026b", dealId: "deal-026", index: 1, label: "Escritura",
    blueprintId: "blueprint-es-rebu", pnlEngine: "rebu", reportDate: "2026-06-01", ofCaseNumber: "OF-DEAL-026-ESCR",
    status: "pending-details",
    createdAt: "2026-06-01T09:00:00.000Z", updatedAt: "2026-06-01T09:00:00.000Z" },
];
