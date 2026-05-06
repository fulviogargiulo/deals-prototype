import type { ScheduleActivity } from "../entities";

// Synthetic schedule activities relative to "today" so the agent-app's
// activity widget always has fresh-looking data without hardcoding dates.
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

export const sharedScheduleActivities: ScheduleActivity[] = generateMockScheduleActivities();

export const getActivitiesForDate = (date: Date): ScheduleActivity[] => {
  const target = date.toISOString().split("T")[0];
  return sharedScheduleActivities.filter((a) => a.date === target);
};

export const getActivitiesForOpportunity = (opportunityId: string): ScheduleActivity[] => {
  return sharedScheduleActivities.filter((a) => a.opportunityId === opportunityId);
};
