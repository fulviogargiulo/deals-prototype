import type { AgentFinancials } from "../entities";
import type { PnlEngine } from "../enums";

export const sharedAgentFinancials: AgentFinancials[] = [
  // ── REBU internal agents ──────────────────────────────────────────────────
  {
    id: "af-agent-001-rebu",
    agentId: "agent-001",
    pnlEngine: "rebu",
    strategy: { kind: "flat", pct: 40 },
    connectedAgents: [
      { id: "ca-agent-001-tl",  agentId: "agent-008", label: "Team Lead", rate: 10, ledgerId: 31 },
      { id: "ca-agent-001-mgr", agentId: "agent-009", label: "Manager",   rate: 5,  ledgerId: 32 },
    ],
  },
  {
    id: "af-agent-002-rebu",
    agentId: "agent-002",
    pnlEngine: "rebu",
    strategy: { kind: "flat", pct: 45 },
    connectedAgents: [
      { id: "ca-agent-002-tl",  agentId: "agent-008", label: "Team Lead", rate: 10, ledgerId: 31 },
      { id: "ca-agent-002-mgr", agentId: "agent-009", label: "Manager",   rate: 5,  ledgerId: 32 },
    ],
  },
  {
    id: "af-agent-003-rebu",
    agentId: "agent-003",
    pnlEngine: "rebu",
    strategy: { kind: "flat", pct: 40 },
    connectedAgents: [
      { id: "ca-agent-003-tl",  agentId: "agent-012", label: "Team Lead", rate: 10, ledgerId: 37 },
      { id: "ca-agent-003-mgr", agentId: "agent-011", label: "Manager",   rate: 5,  ledgerId: 38 },
    ],
  },
  {
    id: "af-agent-004-rebu",
    agentId: "agent-004",
    pnlEngine: "rebu",
    strategy: { kind: "flat", pct: 42 },
    connectedAgents: [
      { id: "ca-agent-004-tl",  agentId: "agent-010", label: "Team Lead", rate: 10, ledgerId: 33 },
      { id: "ca-agent-004-mgr", agentId: "agent-011", label: "Manager",   rate: 5,  ledgerId: 34 },
    ],
  },
  {
    id: "af-agent-005-rebu",
    agentId: "agent-005",
    pnlEngine: "rebu",
    strategy: {
      kind: "slab",
      slabs: [
        { upTo: 5000,  pct: 35 },
        { upTo: 20000, pct: 45 },
        { upTo: null,  pct: 55 },
      ],
    },
    connectedAgents: [
      { id: "ca-agent-005-tl",  agentId: "agent-010", label: "Team Lead", rate: 10, ledgerId: 35 },
      { id: "ca-agent-005-mgr", agentId: "agent-011", label: "Manager",   rate: 5,  ledgerId: 36 },
    ],
  },
  {
    id: "af-agent-006-rebu",
    agentId: "agent-006",
    pnlEngine: "rebu",
    strategy: { kind: "max", pct: 50, capAmount: 25_000 },
    connectedAgents: [
      { id: "ca-agent-006-tl",  agentId: "agent-010", label: "Team Lead", rate: 10, ledgerId: 35 },
      { id: "ca-agent-006-mgr", agentId: "agent-011", label: "Manager",   rate: 5,  ledgerId: 36 },
    ],
  },

  // ── MBU Direct (B2C / REA / DS) — rate resolved at runtime from MBU Direct Rates table ──
  // agent-006 also operates as a mortgage advisor on direct deals (multi-role example)
  {
    id: "af-agent-006-mbu-d",
    agentId: "agent-006",
    pnlEngine: "mbu-direct",
    strategy: { kind: "mbu-direct-rate-slab" },
    connectedAgents: [
      { id: "ca-agent-006-mbu-d-tl",  agentId: "agent-010", label: "Team Lead", rate: 5, ledgerId: 35 },
    ],
  },

  // ── MBU MA — external brokers, rate resolved at runtime from Broker Rate Slabs ─────────
  { id: "af-broker-001-mbu-ma", agentId: "broker-001", pnlEngine: "mbu-ma-broker", strategy: { kind: "broker-rate-slab" } },
  { id: "af-broker-002-mbu-ma", agentId: "broker-002", pnlEngine: "mbu-ma-broker", strategy: { kind: "broker-rate-slab" } },
  { id: "af-broker-003-mbu-ma", agentId: "broker-003", pnlEngine: "mbu-ma-broker", strategy: { kind: "broker-rate-slab" } },

  // ── MBU BYOB — same slab lookup, per-broker service fee deducted from rate ──────────────
  { id: "af-byob-broker-001-mbu-ma", agentId: "byob-broker-001", pnlEngine: "mbu-ma-broker", strategy: { kind: "broker-rate-slab" }, byobPenaltyRate: 0.10 },
  { id: "af-byob-broker-002-mbu-ma", agentId: "byob-broker-002", pnlEngine: "mbu-ma-broker", strategy: { kind: "broker-rate-slab" }, byobPenaltyRate: 0.20 },
];

/** Look up an agent's financial config for a specific P&L engine. Returns undefined when no config exists. */
export function getAgentFinancials(agentId: string, pnlEngine: PnlEngine): AgentFinancials | undefined {
  return sharedAgentFinancials.find((af) => af.agentId === agentId && af.pnlEngine === pnlEngine);
}
