import type { AgentFinancials } from "../entities";

export const sharedAgentFinancials: AgentFinancials[] = [
  {
    id: "af-001",
    agentId: "agent-001",
    strategy: { kind: "flat", pct: 40 },
    teamLeadRate: 10,   managerRate: 5,
    teamLeadLedgerId: 31, managerLedgerId: 32, // Santiago Vega / Isabel Torres (EUR)
  },
  {
    id: "af-002",
    agentId: "agent-002",
    strategy: { kind: "flat", pct: 45 },
    teamLeadRate: 10,   managerRate: 5,
    teamLeadLedgerId: 31, managerLedgerId: 32, // Santiago Vega / Isabel Torres (EUR)
  },
  {
    id: "af-003",
    agentId: "agent-003",
    strategy: { kind: "flat", pct: 40 },
    teamLeadRate: 10,   managerRate: 5,
    teamLeadLedgerId: 37, managerLedgerId: 38, // Majid Al Harbi / Karim Mourad (SAR)
  },
  {
    id: "af-004",
    agentId: "agent-004",
    strategy: { kind: "flat", pct: 42 },
    teamLeadRate: 10,   managerRate: 5,
    teamLeadLedgerId: 33, managerLedgerId: 34, // Santiago Vega / Isabel Torres (AED)
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
    teamLeadRate: 10,   managerRate: 5,
    teamLeadLedgerId: 35, managerLedgerId: 36, // Leila Ahmadi / Karim Mourad (AED)
  },
  {
    id: "af-006",
    agentId: "agent-006",
    strategy: { kind: "max", pct: 50, capAmount: 25_000 },
    teamLeadRate: 10,   managerRate: 5,
    teamLeadLedgerId: 35, managerLedgerId: 36, // Leila Ahmadi / Karim Mourad (AED)
  },
];

export function getAgentFinancialsByAgentId(agentId: string): AgentFinancials | undefined {
  return sharedAgentFinancials.find((af) => af.agentId === agentId);
}
