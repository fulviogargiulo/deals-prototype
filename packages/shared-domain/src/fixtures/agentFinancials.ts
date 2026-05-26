import type { AgentFinancials } from "../entities";

export const sharedAgentFinancials: AgentFinancials[] = [
  {
    id: "af-001",
    agentId: "agent-001",
    strategy: { kind: "flat", pct: 40 },
    connectedAgents: [
      { id: "ca-af001-tl",  agentId: "agent-008", label: "Team Lead", rate: 10, ledgerId: 31 },
      { id: "ca-af001-mgr", agentId: "agent-009", label: "Manager",   rate: 5,  ledgerId: 32 },
    ],
  },
  {
    id: "af-002",
    agentId: "agent-002",
    strategy: { kind: "flat", pct: 45 },
    connectedAgents: [
      { id: "ca-af002-tl",  agentId: "agent-008", label: "Team Lead", rate: 10, ledgerId: 31 },
      { id: "ca-af002-mgr", agentId: "agent-009", label: "Manager",   rate: 5,  ledgerId: 32 },
    ],
  },
  {
    id: "af-003",
    agentId: "agent-003",
    strategy: { kind: "flat", pct: 40 },
    connectedAgents: [
      { id: "ca-af003-tl",  agentId: "agent-012", label: "Team Lead", rate: 10, ledgerId: 37 },
      { id: "ca-af003-mgr", agentId: "agent-011", label: "Manager",   rate: 5,  ledgerId: 38 },
    ],
  },
  {
    id: "af-004",
    agentId: "agent-004",
    strategy: { kind: "flat", pct: 42 },
    connectedAgents: [
      { id: "ca-af004-tl",  agentId: "agent-010", label: "Team Lead", rate: 10, ledgerId: 33 },
      { id: "ca-af004-mgr", agentId: "agent-011", label: "Manager",   rate: 5,  ledgerId: 34 },
    ],
  },
  {
    id: "af-005",
    agentId: "agent-005",
    strategy: {
      kind: "slab",
      slabs: [
        { upTo: 5000, pct: 35 },
        { upTo: 20000, pct: 45 },
        { upTo: null, pct: 55 },
      ],
    },
    connectedAgents: [
      { id: "ca-af005-tl",  agentId: "agent-010", label: "Team Lead", rate: 10, ledgerId: 35 },
      { id: "ca-af005-mgr", agentId: "agent-011", label: "Manager",   rate: 5,  ledgerId: 36 },
    ],
  },
  {
    id: "af-006",
    agentId: "agent-006",
    strategy: { kind: "max", pct: 50, capAmount: 25_000 },
    connectedAgents: [
      { id: "ca-af006-tl",  agentId: "agent-010", label: "Team Lead", rate: 10, ledgerId: 35 },
      { id: "ca-af006-mgr", agentId: "agent-011", label: "Manager",   rate: 5,  ledgerId: 36 },
    ],
  },

  // MBU MA/Broker channel — rate resolved at runtime from BrokerRateSlab.
  { id: "af-broker-001", agentId: "broker-001", strategy: { kind: "broker-rate-slab" } },
  { id: "af-broker-002", agentId: "broker-002", strategy: { kind: "broker-rate-slab" } },
  { id: "af-broker-003", agentId: "broker-003", strategy: { kind: "broker-rate-slab" } },

  // MBU BYOB channel — same slab lookup as MA, plus a per-broker service fee (pct points, e.g. 0.10 = 0.10%).
  { id: "af-byob-broker-001", agentId: "byob-broker-001", strategy: { kind: "broker-rate-slab" }, byobPenaltyRate: 0.10 },
  { id: "af-byob-broker-002", agentId: "byob-broker-002", strategy: { kind: "broker-rate-slab" }, byobPenaltyRate: 0.20 },
];

export function getAgentFinancialsByAgentId(agentId: string): AgentFinancials | undefined {
  return sharedAgentFinancials.find((af) => af.agentId === agentId);
}
