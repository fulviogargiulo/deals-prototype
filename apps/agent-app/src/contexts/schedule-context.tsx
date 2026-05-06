import { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { ScheduleActivity, VisitFeedback, ScheduleActivityStatus } from "@/types";
import { generateMockScheduleActivities } from "@/data/mockData";

interface ScheduleContextType {
  activities: ScheduleActivity[];
  newlyAddedIds: Set<string>;
  addActivity: (activity: Omit<ScheduleActivity, "id">) => void;
  removeActivity: (id: string) => void;
  updateActivity: (id: string, updates: Partial<ScheduleActivity>) => void;
  clearNewlyAdded: (id: string) => void;
  markVisitComplete: (id: string, feedback: VisitFeedback) => void;
  markVisitNoShow: (id: string, reason: string) => void;
  markVisitCancelled: (id: string, reason: string) => void;
  rescheduleVisit: (id: string, newDate: string, newTime: string) => void;
  getActivityById: (id: string) => ScheduleActivity | undefined;
}

const ScheduleContext = createContext<ScheduleContextType | undefined>(undefined);

export function ScheduleProvider({ children }: { children: ReactNode }) {
  const [activities, setActivities] = useState<ScheduleActivity[]>(() => generateMockScheduleActivities());
  const [newlyAddedIds, setNewlyAddedIds] = useState<Set<string>>(new Set());

  const addActivity = useCallback((activity: Omit<ScheduleActivity, "id">) => {
    const newActivity: ScheduleActivity = {
      ...activity,
      id: `sched-${Date.now()}`,
    };
    setActivities(prev => [...prev, newActivity]);
    setNewlyAddedIds(prev => new Set(prev).add(newActivity.id));
  }, []);

  const removeActivity = useCallback((id: string) => {
    setActivities(prev => prev.filter(a => a.id !== id));
  }, []);

  const updateActivity = useCallback((id: string, updates: Partial<ScheduleActivity>) => {
    setActivities(prev => 
      prev.map(a => a.id === id ? { ...a, ...updates } : a)
    );
  }, []);

  const clearNewlyAdded = useCallback((id: string) => {
    setNewlyAddedIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const markVisitComplete = useCallback((id: string, feedback: VisitFeedback) => {
    setActivities(prev => 
      prev.map(a => a.id === id ? { 
        ...a, 
        status: 'completed' as ScheduleActivityStatus,
        feedback 
      } : a)
    );
  }, []);

  const markVisitNoShow = useCallback((id: string, reason: string) => {
    setActivities(prev => 
      prev.map(a => a.id === id ? { 
        ...a, 
        status: 'no-show' as ScheduleActivityStatus,
        feedback: { outcome: 'no-show', reason } 
      } : a)
    );
  }, []);

  const markVisitCancelled = useCallback((id: string, reason: string) => {
    setActivities(prev => 
      prev.map(a => a.id === id ? { 
        ...a, 
        status: 'cancelled' as ScheduleActivityStatus,
        feedback: { outcome: 'cancelled', reason } 
      } : a)
    );
  }, []);

  const rescheduleVisit = useCallback((id: string, newDate: string, newTime: string) => {
    setActivities(prev => 
      prev.map(a => a.id === id ? { 
        ...a, 
        date: newDate,
        time: newTime,
        status: 'scheduled' as ScheduleActivityStatus,
        feedback: { outcome: 'rescheduled' } 
      } : a)
    );
  }, []);

  const getActivityById = useCallback((id: string) => {
    return activities.find(a => a.id === id);
  }, [activities]);

  return (
    <ScheduleContext.Provider value={{ 
      activities, 
      newlyAddedIds, 
      addActivity, 
      removeActivity, 
      updateActivity, 
      clearNewlyAdded,
      markVisitComplete,
      markVisitNoShow,
      markVisitCancelled,
      rescheduleVisit,
      getActivityById
    }}>
      {children}
    </ScheduleContext.Provider>
  );
}

export function useSchedule() {
  const context = useContext(ScheduleContext);
  if (context === undefined) {
    throw new Error("useSchedule must be used within a ScheduleProvider");
  }
  return context;
}
