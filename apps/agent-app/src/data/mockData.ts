import { sharedClients, sharedOpportunities } from "@huspy/shared-domain";
import type {
  Client,
  ClientWithOpportunities,
  Opportunity,
  Task,
  Document,
  ScheduleActivity,
} from "@/types";

// ============================================================
// Clients & Opportunities — re-exported from shared canonical fixtures.
// Same N records visible in both apps.
// ============================================================
// Cast widens shared.Client/Opportunity to agent-app's narrower local type
// (some agent-app fields are required at the type level but shared marks them
// optional). Runtime values include all required fields — fixtures populate them.
export const mockClients: Client[] = sharedClients as Client[];
export const mockOpportunities: Opportunity[] = sharedOpportunities as Opportunity[];

// ============================================================
// Agents — agent-app-local; IDs match those used by shared opportunities/deals.
// ============================================================
export const mockAgents = [
  {
    id: "agent-felicia",
    name: "Felicia Canovas",
    email: "felicia@huspy.io",
    phone: "+34 612 345 678",
    photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face",
    specialties: ["Residential Sales", "Investment Properties"],
    experience: 8,
    rating: 4.9,
    totalSales: 156,
  },
  {
    id: "agent-guilherme",
    name: "Guilherme Castro",
    email: "guilherme@huspy.io",
    phone: "+34 623 456 789",
    photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face",
    specialties: ["Luxury Properties", "Commercial Real Estate"],
    experience: 12,
    rating: 4.8,
    totalSales: 203,
  },
  {
    id: "agent-omar",
    name: "Omar Al Saleem",
    email: "omar@huspy.io",
    phone: "+966 55 123 4567",
    photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face",
    specialties: ["KSA Market", "Off-plan"],
    experience: 6,
    rating: 4.7,
    totalSales: 89,
  },
  {
    id: "agent-gelo",
    name: "Gelo Huspy",
    email: "gelo@huspy.io",
    phone: "+34 645 678 901",
    photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face",
    specialties: ["Madrid Sales", "First-time Buyers"],
    experience: 10,
    rating: 4.9,
    totalSales: 178,
  },
];

// ============================================================
// Tasks — referenced by shared client/opportunity IDs
// ============================================================
const TS = "2026-01-15T00:00:00.000Z";

export const mockTasks: Task[] = [
  {
    id: "task-001",
    title: "Follow up with Mariana on La Latina viewing",
    status: "todo",
    priority: "high",
    clientId: "client-001",
    opportunityId: "opp-001",
    dueDate: "2026-03-10",
    createdAt: TS,
    updatedAt: TS,
  },
  {
    id: "task-002",
    title: "Prepare listing for Salamanca penthouse",
    status: "in-progress",
    priority: "medium",
    clientId: "client-002",
    opportunityId: "opp-002",
    dueDate: "2026-03-12",
    createdAt: TS,
    updatedAt: TS,
  },
  {
    id: "task-003",
    title: "Verify Ana's ID documents",
    status: "todo",
    priority: "urgent",
    clientId: "client-003",
    opportunityId: "opp-003",
    dueDate: "2026-02-25",
    createdAt: TS,
    updatedAt: TS,
  },
  {
    id: "task-004",
    title: "Schedule viewing for Pozuelo villa",
    status: "completed",
    priority: "medium",
    clientId: "client-004",
    opportunityId: "opp-004",
    completedAt: "2026-03-01",
    createdAt: TS,
    updatedAt: TS,
  },
  {
    id: "task-005",
    title: "Riyadh apartment closing paperwork",
    status: "completed",
    priority: "high",
    clientId: "client-005",
    opportunityId: "opp-005",
    completedAt: "2026-03-02",
    createdAt: TS,
    updatedAt: TS,
  },
  {
    id: "task-006",
    title: "Chamberí post-sale handover",
    status: "overdue",
    priority: "high",
    clientId: "client-006",
    opportunityId: "opp-006",
    dueDate: "2026-02-21",
    createdAt: TS,
    updatedAt: TS,
  },
];

// ============================================================
// Documents — referenced by shared IDs
// ============================================================
export const mockDocuments: Document[] = [
  {
    id: "doc-001",
    name: "Mariana_passport.pdf",
    type: "id",
    size: 124000,
    mimeType: "application/pdf",
    clientId: "client-001",
    uploadedBy: "agent-felicia",
    createdAt: TS,
    updatedAt: TS,
  },
  {
    id: "doc-002",
    name: "La_Latina_SPA.pdf",
    type: "contract",
    size: 524000,
    mimeType: "application/pdf",
    clientId: "client-001",
    opportunityId: "opp-001",
    uploadedBy: "agent-felicia",
    createdAt: TS,
    updatedAt: TS,
  },
  {
    id: "doc-003",
    name: "Salamanca_listing_agreement.pdf",
    type: "contract",
    size: 412000,
    mimeType: "application/pdf",
    clientId: "client-002",
    opportunityId: "opp-002",
    uploadedBy: "agent-guilherme",
    createdAt: TS,
    updatedAt: TS,
  },
  {
    id: "doc-004",
    name: "Ana_proof_of_income.pdf",
    type: "financial",
    size: 89000,
    mimeType: "application/pdf",
    clientId: "client-003",
    uploadedBy: "agent-felicia",
    createdAt: TS,
    updatedAt: TS,
  },
  {
    id: "doc-005",
    name: "Pozuelo_property_deed.pdf",
    type: "property",
    size: 1024000,
    mimeType: "application/pdf",
    clientId: "client-004",
    opportunityId: "opp-004",
    uploadedBy: "agent-guilherme",
    createdAt: TS,
    updatedAt: TS,
  },
  {
    id: "doc-006",
    name: "Riyadh_closing_docs.pdf",
    type: "legal",
    size: 756000,
    mimeType: "application/pdf",
    clientId: "client-005",
    opportunityId: "opp-005",
    uploadedBy: "agent-omar",
    createdAt: TS,
    updatedAt: TS,
  },
];

// ============================================================
// Helpers (preserve exact signatures used by agent-app components)
// ============================================================
export const getClientWithOpportunities = (clientId: string): ClientWithOpportunities | undefined => {
  const client = mockClients.find((c) => c.id === clientId);
  if (!client) return undefined;
  return { ...client, opportunities: mockOpportunities.filter((o) => o.clientId === clientId) };
};

export const getAllClientsWithOpportunities = (): ClientWithOpportunities[] =>
  mockClients.map((c) => ({ ...c, opportunities: mockOpportunities.filter((o) => o.clientId === c.id) }));

export const getOpportunityById = (id: string) => mockOpportunities.find((o) => o.id === id);
export const getClientById = (id: string) => mockClients.find((c) => c.id === id);
export const getTaskById = (id: string) => mockTasks.find((t) => t.id === id);
export const getDocumentById = (id: string) => mockDocuments.find((d) => d.id === id);
export const getTasksForClient = (clientId: string) => mockTasks.filter((t) => t.clientId === clientId);
export const getTasksForOpportunity = (opportunityId: string) => mockTasks.filter((t) => t.opportunityId === opportunityId);
export const getDocumentsForClient = (clientId: string) => mockDocuments.filter((d) => d.clientId === clientId);
export const getDocumentsForOpportunity = (opportunityId: string) => mockDocuments.filter((d) => d.opportunityId === opportunityId);
export const getAgentById = (id: string) => mockAgents.find((a) => a.id === id);

// ============================================================
// Schedule activities — synthetic set keyed off "today"
// ============================================================
export const generateMockScheduleActivities = (): ScheduleActivity[] => {
  const now = new Date();
  const fmt = (d: Date) => d.toISOString().split("T")[0];
  const dayOffset = (n: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() + n);
    return fmt(d);
  };

  return [
    {
      id: "sched-001",
      type: "viewing",
      title: "Viewing — La Latina apartment",
      date: dayOffset(0),
      time: "10:00",
      duration: "30m",
      status: "scheduled",
      clientId: "client-001",
      clientName: "Mariana Dañobeitia",
      opportunityId: "opp-001",
      opportunityName: "Apartment in La Latina",
      propertyLocation: "La Latina, Madrid",
    },
    {
      id: "sched-002",
      type: "task",
      title: "Call Carlos to confirm Salamanca terms",
      date: dayOffset(0),
      time: "14:00",
      duration: "15m",
      status: "scheduled",
      clientId: "client-002",
      clientName: "Carlos Fernández",
      opportunityId: "opp-002",
      opportunityName: "Penthouse in Salamanca",
    },
    {
      id: "sched-003",
      type: "viewing",
      title: "Viewing — Studio in Malasaña",
      date: dayOffset(1),
      time: "11:30",
      duration: "45m",
      status: "scheduled",
      clientId: "client-003",
      clientName: "Ana Rodríguez",
      opportunityId: "opp-003",
      opportunityName: "Studio in Malasaña",
      propertyLocation: "Malasaña, Madrid",
    },
    {
      id: "sched-004",
      type: "viewing",
      title: "Viewing — Pozuelo villa",
      date: dayOffset(2),
      time: "16:00",
      duration: "1h",
      status: "scheduled",
      clientId: "client-004",
      clientName: "Javier Martínez",
      opportunityId: "opp-004",
      opportunityName: "Villa in Pozuelo",
      propertyLocation: "Pozuelo de Alarcón",
    },
    {
      id: "sched-005",
      type: "task",
      title: "Send Riyadh closing docs",
      date: dayOffset(-3),
      time: "09:00",
      duration: "30m",
      status: "completed",
      clientId: "client-005",
      clientName: "Khalid Alharbi",
      opportunityId: "opp-005",
      opportunityName: "Apartment in Riyadh",
    },
    {
      id: "sched-006",
      type: "viewing",
      title: "Final walkthrough — Chamberí",
      date: dayOffset(-5),
      time: "13:00",
      duration: "45m",
      status: "completed",
      clientId: "client-006",
      clientName: "Esra Sertcetin",
      opportunityId: "opp-006",
      opportunityName: "Apartment in Chamberí",
      propertyLocation: "Chamberí, Madrid",
    },
    {
      id: "sched-007",
      type: "task",
      title: "Follow up with Mariana on viewing feedback",
      date: dayOffset(-1),
      time: "17:00",
      duration: "20m",
      status: "overdue",
      clientId: "client-001",
      clientName: "Mariana Dañobeitia",
      opportunityId: "opp-001",
    },
  ];
};

export const mockScheduleActivities: ScheduleActivity[] = generateMockScheduleActivities();

export const getActivitiesForDate = (date: Date): ScheduleActivity[] => {
  const target = date.toISOString().split("T")[0];
  return mockScheduleActivities.filter((a) => a.date === target);
};

export const getActivitiesForOpportunity = (opportunityId: string): ScheduleActivity[] => {
  return mockScheduleActivities.filter((a) => a.opportunityId === opportunityId);
};
