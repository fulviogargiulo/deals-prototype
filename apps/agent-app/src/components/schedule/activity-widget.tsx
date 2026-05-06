import { useState, useRef } from "react";
import { Plus } from "lucide-react";
import { isSameDay } from "date-fns";
import { Button } from "@/components/ui/button";
import { WeekCalendarPicker } from "./week-calendar-picker";
import { ScheduleActivityItem } from "./schedule-activity-item";
import { ExpandableTaskItem } from "./expandable-task-item";
import { EmptyScheduleState } from "./empty-schedule-state";
import { OverdueBanner } from "./overdue-banner";
import { ScheduleSideMenu, ScheduleSideMenuHandle } from "./schedule-side-menu";

import { NewTaskModalV2 } from "@/components/modals/new-task-modal-v2";
import { ScheduleActivity, Opportunity } from "@/types";
import { useSchedule } from "@/contexts/schedule-context";
import { cn } from "@/lib/utils";

export type ScheduleDisplayMode = "empty" | "few" | "many";
export type OverdueDisplayMode = "none" | "some";

interface ActivityWidgetProps {
  opportunityId?: string;
  opportunity?: Opportunity; // Pre-selected opportunity for task creation
  showTitle?: boolean;
  displayMode?: ScheduleDisplayMode;
  overdueDisplayMode?: OverdueDisplayMode;
  calendarVariant?: "week" | "month" | "compact";
  variant?: "default" | "minimal";
  className?: string;
}

export function ActivityWidget({ 
  opportunityId,
  opportunity,
  showTitle = true,
  displayMode = "few",
  overdueDisplayMode = "none",
  calendarVariant = "week",
  variant = "default",
  className 
}: ActivityWidgetProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const scheduleSideMenuRef = useRef<ScheduleSideMenuHandle>(null);
  const { activities, newlyAddedIds } = useSchedule();

  // Get overdue count for this opportunity (always calculate, show based on actual count)
  const getOverdueCount = (): number => {
    const allActivities = opportunityId 
      ? activities.filter(a => a.opportunityId === opportunityId)
      : activities;
    
    return allActivities.filter(a => a.status === "overdue").length;
  };

  const overdueCount = getOverdueCount();

  // Handle overdue banner click - opens schedule side menu with overdue filter
  const handleOverdueClick = () => {
    if (opportunity) {
      scheduleSideMenuRef.current?.open(opportunity.id, opportunity.title, "overdue");
    } else if (opportunityId) {
      scheduleSideMenuRef.current?.open(opportunityId, `Opportunity ${opportunityId}`, "overdue");
    } else {
      scheduleSideMenuRef.current?.open(undefined, undefined, "overdue");
    }
  };

  // Handle "View full schedule" click - opens schedule side menu with all filter
  const handleViewFullSchedule = () => {
    if (opportunity) {
      scheduleSideMenuRef.current?.open(opportunity.id, opportunity.title, "all");
    } else if (opportunityId) {
      scheduleSideMenuRef.current?.open(opportunityId, `Opportunity ${opportunityId}`, "all");
    } else {
      scheduleSideMenuRef.current?.open(undefined, undefined, "all");
    }
  };

  // Get activities based on display mode
  const getFilteredActivities = (): ScheduleActivity[] => {
    if (displayMode === "empty") return [];
    
    const allActivities = opportunityId 
      ? activities.filter(a => a.opportunityId === opportunityId)
      : activities;
    
    // Filter by selected date (exclude overdue, they show in banner)
    const dateActivities = allActivities.filter(a => 
      isSameDay(new Date(a.date), selectedDate) && a.status !== "overdue"
    );

    // Sort by time
    const sortedActivities = dateActivities.sort((a, b) => a.time.localeCompare(b.time));

    if (displayMode === "few") return sortedActivities.slice(0, 3);
    return sortedActivities;
  };

  const filteredActivities = getFilteredActivities();
  const hasActivities = filteredActivities.length > 0 || overdueCount > 0;

  // Handle viewing click - open schedule side menu with viewing details
  const handleViewingClick = (activity: ScheduleActivity) => {
    scheduleSideMenuRef.current?.openWithViewing(activity);
  };

  // Minimal variant for opportunity details page
  if (variant === "minimal") {
    return (
      <div className={cn("flex flex-col h-full", className)}>
        <NewTaskModalV2 open={isTaskModalOpen} onOpenChange={setIsTaskModalOpen} opportunity={opportunity} />
        <ScheduleSideMenu ref={scheduleSideMenuRef} hideTrigger />
          {/* Header */}
          {showTitle && (
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">My schedule</h2>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-10 w-10 rounded-full bg-secondary"
                onClick={() => setIsTaskModalOpen(true)}
              >
                <Plus className="w-5 h-5 text-foreground" />
              </Button>
            </div>
          )}

          {/* Compact Calendar */}
          <div className="mb-4">
            <WeekCalendarPicker
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              variant="compact"
            />
          </div>

          {/* Overdue Banner - separate container above body */}
          {overdueCount > 0 && (
            <div className="mb-3">
              <OverdueBanner 
                count={overdueCount} 
                onClick={handleOverdueClick}
              />
            </div>
          )}

          {/* Content with white background */}
          <div className="bg-card rounded-2xl p-4 space-y-3 flex-1 flex flex-col">

            <div 
              key={selectedDate.toISOString()}
              className="animate-fade-in flex-1"
              style={{ animationDuration: '500ms' }}
            >
              {filteredActivities.length === 0 ? (
                <EmptyScheduleState onClick={() => setIsTaskModalOpen(true)} />
              ) : (
                <div className="space-y-3">
                  {filteredActivities.map((activity) => (
                    <div key={activity.id}>
                      {activity.type === 'task' ? (
                        <ExpandableTaskItem 
                          activity={activity} 
                          isNewlyAdded={newlyAddedIds.has(activity.id)}
                        />
                      ) : (
                        <ScheduleActivityItem 
                          activity={activity} 
                          variant="compact"
                          isNewlyAdded={newlyAddedIds.has(activity.id)}
                          onViewingClick={handleViewingClick}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Full schedule link - always visible, pushed to bottom */}
            <div className="pt-2 flex justify-center mt-auto">
              <button 
                onClick={handleViewFullSchedule}
                className="text-base font-medium text-foreground hover:underline"
              >
                View full schedule
              </button>
            </div>
          </div>
      </div>
    );
  }

  // Default variant with Card wrapper
  return (
    <>
      <NewTaskModalV2 open={isTaskModalOpen} onOpenChange={setIsTaskModalOpen} opportunity={opportunity} />
      <ScheduleSideMenu ref={scheduleSideMenuRef} hideTrigger />
      
      <div className={className}>
        {/* Header */}
        {showTitle && (
          <div className="flex items-center justify-between p-4 pb-2">
            <h3 className="font-semibold text-lg">My schedule</h3>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={() => setIsTaskModalOpen(true)}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Calendar */}
        <div className="px-4 py-2">
          <WeekCalendarPicker
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            variant={calendarVariant}
          />
        </div>

        {/* Overdue Banner - separate container above body */}
        {overdueCount > 0 && (
          <div className="px-4 pb-2">
            <OverdueBanner 
              count={overdueCount} 
              onClick={handleOverdueClick}
            />
          </div>
        )}

        {/* Content */}
        <div className="p-4 pt-2 space-y-3">

          <div 
            key={selectedDate.toISOString()}
            className="animate-fade-in"
            style={{ animationDuration: '500ms' }}
          >
            {filteredActivities.length === 0 ? (
              <EmptyScheduleState />
            ) : (
              <div className="space-y-3">
                {filteredActivities.map((activity) => (
                  <div key={activity.id}>
                    {activity.type === 'task' ? (
                      <ExpandableTaskItem 
                        activity={activity}
                        isNewlyAdded={newlyAddedIds.has(activity.id)}
                      />
                    ) : (
                      <ScheduleActivityItem 
                        activity={activity}
                        isNewlyAdded={newlyAddedIds.has(activity.id)}
                        onViewingClick={handleViewingClick}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Full schedule link */}
          <div className="pt-2">
            <Button 
              variant="outline" 
              className="w-full rounded-full"
              onClick={handleViewFullSchedule}
            >
              View full schedule
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
