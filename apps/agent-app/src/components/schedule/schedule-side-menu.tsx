import { useState, useEffect, forwardRef, useImperativeHandle, useRef } from "react";
import { Plus, CalendarClock, X, ChevronLeft, ChevronDown, Check, SlidersHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format, isSameDay, isToday, isYesterday, isTomorrow, startOfDay } from "date-fns";
import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "framer-motion";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ExpandableTaskItem } from "./expandable-task-item";
import { ScheduleActivityItem } from "./schedule-activity-item";
import { NewTaskModalV2 } from "@/components/modals/new-task-modal-v2";
import { VisitDetailContent } from "./visit-detail-content";
import { useSchedule } from "@/contexts/schedule-context";
import { ScheduleActivity } from "@/types";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

type FilterType = "all" | "overdue" | "completed";
type TypeFilter = "all" | "tasks" | "visits";

export interface ScheduleSideMenuHandle {
  open: (opportunityId?: string, opportunityName?: string, initialFilter?: FilterType) => void;
  openWithViewing: (activity: ScheduleActivity) => void;
}

interface ScheduleSideMenuProps {
  transparentHeader?: boolean;
  hideTrigger?: boolean; // Hide the trigger button when controlled via ref
}

interface DayGroup {
  date: Date;
  label: string;
  activities: ScheduleActivity[];
}

export const ScheduleSideMenu = forwardRef<ScheduleSideMenuHandle, ScheduleSideMenuProps>(
  function ScheduleSideMenu({ transparentHeader = false, hideTrigger = false }, ref) {
  const [isOpen, setIsOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [activeTypeFilter, setActiveTypeFilter] = useState<TypeFilter>("all");
  const [opportunityFilter, setOpportunityFilter] = useState<{ id: string; name: string } | null>(null);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);
  const [selectedViewing, setSelectedViewing] = useState<ScheduleActivity | null>(null);
  const [showViewingDetail, setShowViewingDetail] = useState(false);
  const [showBackButton, setShowBackButton] = useState(true);
  const [animationDirection, setAnimationDirection] = useState<'forward' | 'back'>('forward');
  const { activities, newlyAddedIds } = useSchedule();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Expose open method via ref
  useImperativeHandle(ref, () => ({
    open: (opportunityId?: string, opportunityName?: string, initialFilter?: FilterType) => {
      if (opportunityId && opportunityName) {
        setOpportunityFilter({ id: opportunityId, name: opportunityName });
      }
      setActiveFilter(initialFilter || "all");
      setShowViewingDetail(false);
      setSelectedViewing(null);
      setIsOpen(true);
    },
    openWithViewing: (activity: ScheduleActivity) => {
      setSelectedViewing(activity);
      setShowViewingDetail(true);
      setShowBackButton(false); // No back button when opened directly with viewing
      setIsOpen(true);
    },
  }));

  // Reset state when sheet closes, scroll to today's section when it opens
  useEffect(() => {
    if (!isOpen) {
      setActiveFilter("all");
      setActiveTypeFilter("all");
      setOpportunityFilter(null);
      setShowViewingDetail(false);
      setSelectedViewing(null);
      setShowBackButton(true);
      setAnimationDirection('forward');
    } else {
      // Scroll to today's section when opening - wait for sheet animation to complete
      const timer = setTimeout(() => {
        const todaySection = document.getElementById('schedule-section-today');
        if (todaySection) {
          todaySection.scrollIntoView({ behavior: 'instant', block: 'start' });
        } else if (scrollContainerRef.current) {
          // Fallback to scroll to top if no today section exists
          scrollContainerRef.current.scrollTop = 0;
        }
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Filter activities based on active filter AND opportunity filter
  const getFilteredActivities = (): ScheduleActivity[] => {
    let filtered = activities;
    
    // First apply opportunity filter if set
    if (opportunityFilter) {
      filtered = filtered.filter(a => a.opportunityId === opportunityFilter.id);
    }

    // Apply type filter
    if (activeTypeFilter === "tasks") {
      filtered = filtered.filter(a => a.type === "task");
    } else if (activeTypeFilter === "visits") {
      filtered = filtered.filter(a => a.type === "viewing");
    }
    
    // Then apply status filter
    const today = startOfDay(new Date());
    switch (activeFilter) {
      case "overdue":
        return filtered.filter(a => a.status === "overdue");
      case "completed":
        return filtered.filter(a => a.status === "completed");
      default:
        return filtered.filter(a => {
          const activityDate = startOfDay(new Date(a.date));
          return activityDate >= today && a.status !== "overdue";
        });
    }
  };

  // Group activities by day
  const groupActivitiesByDay = (activitiesList: ScheduleActivity[]): DayGroup[] => {
    const groups: Map<string, DayGroup> = new Map();
    
    activitiesList.forEach(activity => {
      const activityDate = new Date(activity.date);
      const dayKey = format(activityDate, "yyyy-MM-dd");
      
      if (!groups.has(dayKey)) {
        groups.set(dayKey, {
          date: startOfDay(activityDate),
          label: getDayLabel(activityDate),
          activities: [],
        });
      }
      
      groups.get(dayKey)!.activities.push(activity);
    });

    // Sort groups by date and activities within each group by time
    return Array.from(groups.values())
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .map(group => ({
        ...group,
        activities: group.activities.sort((a, b) => a.time.localeCompare(b.time)),
      }));
  };

  const getDayLabel = (date: Date): string => {
    if (isToday(date)) {
      return `Today, ${format(date, "d MMM")}`;
    }
    if (isYesterday(date)) {
      return `Yesterday, ${format(date, "d MMM")}`;
    }
    if (isTomorrow(date)) {
      return `Tomorrow, ${format(date, "d MMM")}`;
    }
    return format(date, "EEE, d MMM");
  };

  const filteredActivities = getFilteredActivities();
  const dayGroups = groupActivitiesByDay(filteredActivities);
  
  // Counts for filter pills - based on opportunity filter
  const baseActivities = opportunityFilter 
    ? activities.filter(a => a.opportunityId === opportunityFilter.id)
    : activities;
  const today = startOfDay(new Date());
  const upcomingActivities = baseActivities.filter(a => {
    const activityDate = startOfDay(new Date(a.date));
    return activityDate >= today && a.status !== "overdue";
  });
  const allCount = upcomingActivities.length;
  const overdueCount = baseActivities.filter(a => a.status === "overdue").length;
  const completedCount = baseActivities.filter(a => a.status === "completed").length;
  const tasksCount = upcomingActivities.filter(a => a.type === "task").length;
  const visitsCount = upcomingActivities.filter(a => a.type === "viewing").length;

  const handleClearOpportunityFilter = () => {
    setIsLoadingActivities(true);
    setOpportunityFilter(null);
    
    // Simulate API call to fetch all activities
    setTimeout(() => {
      setIsLoadingActivities(false);
    }, 800);
  };

  // Handle viewing click - open visit detail panel
  const handleViewingClick = (activity: ScheduleActivity) => {
    setAnimationDirection('forward');
    setSelectedViewing(activity);
    setShowViewingDetail(true);
    setShowBackButton(true);
  };

  // Handle back from viewing detail
  const handleBackFromViewing = () => {
    setAnimationDirection('back');
    setShowViewingDetail(false);
    setSelectedViewing(null);
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        {!hideTrigger && (
          <SheetTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className={cn(
                "h-9 w-9 p-0 rounded-xl transition-all duration-500 relative",
                transparentHeader 
                  ? "bg-white/15 hover:bg-white/25" 
                  : "hover:bg-muted/60"
              )}
            >
              <div className="relative">
                <CalendarClock 
                  className="h-4 w-4 transition-colors duration-500"
                  style={{ color: transparentHeader ? 'white' : undefined }}
                />
                {/* Overdue indicator dot - positioned on top-right of icon */}
                {overdueCount > 0 && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-destructive rounded-full" />
                )}
              </div>
            </Button>
          </SheetTrigger>
        )}
        <SheetContent className="w-full sm:max-w-lg overflow-hidden p-0" hideDefaultClose>
          <div className="relative h-full w-full">
          <AnimatePresence initial={false}>
            {!showViewingDetail ? (
              // Schedule List View
              <motion.div 
                key="schedule-list"
                initial={animationDirection === 'back' ? { x: '-100%', opacity: 0 } : false}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: '-100%', opacity: 0 }}
                transition={{ 
                  duration: 0.4, 
                  ease: [0.32, 0.72, 0, 1] // Custom easing for smooth feel
                }}
                className="absolute inset-0 flex flex-col overflow-hidden bg-background"
                style={{ willChange: 'transform, opacity' }}
              >
              {/* Fixed Header */}
              <div className="px-6 pt-6 shrink-0">
                {/* Header row: X left, title center, + right */}
                <div className="flex items-center justify-between mb-4">
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={() => setIsOpen(false)}
                    className="h-10 w-10 rounded-full"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                  <SheetTitle className="text-2xl font-semibold leading-heading">My schedule</SheetTitle>
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={() => setIsTaskModalOpen(true)}
                    className="h-10 w-10 rounded-full"
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                </div>

                {/* Opportunity filter banner with exit animation */}
                <AnimatePresence>
                  {opportunityFilter && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                      animate={{ opacity: 1, height: "auto", marginBottom: 16 }}
                      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="flex items-start justify-between gap-3 px-4 py-3 bg-[#0000000D] rounded-xl">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-secondary-foreground">Showing activities for:</p>
                          <p className="text-base font-semibold text-foreground truncate">{opportunityFilter.name}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handleClearOpportunityFilter}
                          className="h-8 w-8 shrink-0 rounded-full hover:bg-foreground/10 mt-0.5"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                {/* Filters row — status pills left, type dropdown right */}
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                    <FilterPill
                      label="Upcoming"
                      count={allCount}
                      isActive={activeFilter === "all"}
                      onClick={() => setActiveFilter("all")}
                    />
                    <FilterPill
                      label="Overdue"
                      count={overdueCount}
                      isActive={activeFilter === "overdue"}
                      onClick={() => setActiveFilter("overdue")}
                    />
                    <FilterPill
                      label="Completed"
                      count={completedCount}
                      isActive={activeFilter === "completed"}
                      onClick={() => setActiveFilter("completed")}
                    />
                  </div>

                  <DropdownFilter
                    label={activeTypeFilter === "all" ? "" : activeTypeFilter === "tasks" ? "Tasks" : "Visits"}
                    options={[
                      { value: "all", label: "All types" },
                      { value: "tasks", label: "Tasks" },
                      { value: "visits", label: "Visits" },
                    ]}
                    value={activeTypeFilter}
                    onChange={(v) => setActiveTypeFilter(v as TypeFilter)}
                    showFilterIcon
                  />
                </div>
              </div>

              {/* Scrollable Content with sticky day headers */}
              <div ref={scrollContainerRef} className="flex-1 overflow-y-auto pb-6 relative">
                <div className="px-6">
                  {isLoadingActivities ? (
                    <ScheduleLoadingSkeleton />
                  ) : dayGroups.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <p className="text-muted-foreground">No activities found</p>
                    </div>
                  ) : (
                    <div className="space-y-0">
                      {dayGroups.map((group) => (
                        <DaySection
                          key={group.label}
                          group={group}
                          newlyAddedIds={newlyAddedIds}
                          isToday={isToday(group.date)}
                          onViewingClick={handleViewingClick}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            // Viewing Detail View (embedded)
            <motion.div
              key="viewing-detail"
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ 
                duration: 0.4, 
                ease: [0.32, 0.72, 0, 1] // Custom easing for smooth feel
              }}
              className="absolute inset-0 flex flex-col overflow-hidden bg-background"
              style={{ willChange: 'transform, opacity' }}
            >
              <VisitDetailContent
                activity={selectedViewing}
                showBackButton={showBackButton}
                onBack={handleBackFromViewing}
                onClose={() => setIsOpen(false)}
              />
            </motion.div>
          )}
          </AnimatePresence>
          </div>
        </SheetContent>
      </Sheet>

      <NewTaskModalV2 open={isTaskModalOpen} onOpenChange={setIsTaskModalOpen} />
    </>
  );
});

function FilterPill({ label, count, isActive, onClick }: { label: string; count: number; isActive: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "shrink-0 flex items-center gap-1.5 h-9 px-3 rounded-full text-sm font-semibold transition-all duration-300 whitespace-nowrap",
        isActive 
          ? "bg-foreground text-background" 
          : "bg-card text-foreground border border-border"
      )}
    >
      {label}
      <span
        className={cn(
          "h-5 min-w-5 px-1 text-xs flex items-center justify-center rounded-full font-semibold",
          isActive
            ? "bg-white/20 text-background"
            : "bg-muted text-muted-foreground"
        )}
      >
        {count}
      </span>
    </button>
  );
}

interface DropdownFilterOption {
  value: string;
  label: string;
  count?: number;
}

interface DropdownFilterProps {
  label: string;
  count?: number;
  options: DropdownFilterOption[];
  value: string;
  onChange: (value: string) => void;
  showFilterIcon?: boolean;
}

function DropdownFilter({ label, count, options, value, onChange, showFilterIcon }: DropdownFilterProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const isNonDefault = value !== options[0]?.value;

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-1.5 h-9 px-3 rounded-full text-sm font-semibold transition-all duration-300 whitespace-nowrap",
          isNonDefault
            ? "bg-foreground text-background"
            : "bg-card text-foreground border border-border"
        )}
      >
        {showFilterIcon && <SlidersHorizontal className="w-3.5 h-3.5" />}
        {label}
        <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-300", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 z-50 bg-card border border-border rounded-xl shadow-lg py-1.5 min-w-[160px]">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors",
                opt.value === value
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <Check className={cn("w-4 h-4 shrink-0", opt.value === value ? "opacity-100" : "opacity-0")} />
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface DaySectionProps {
  group: DayGroup;
  newlyAddedIds: Set<string>;
  isToday?: boolean;
  onViewingClick?: (activity: ScheduleActivity) => void;
}

function DaySection({ group, newlyAddedIds, isToday, onViewingClick }: DaySectionProps) {
  return (
    <div className="relative" id={isToday ? 'schedule-section-today' : undefined}>
      {/* Sticky day header - full-width background matching sheet, with right padding for + button */}
      <div className="sticky top-0 z-10 -mx-6 px-6 bg-background py-3 pr-16">
        <h3 className="text-xl font-semibold leading-heading text-foreground">
          {group.label}
        </h3>
      </div>

      {/* Activities for this day - wrapped in white card like the widget */}
      <div className="bg-card rounded-2xl p-4 space-y-3 mb-4">
        {group.activities.map((activity) => (
          <div key={activity.id}>
            {activity.type === 'task' ? (
              <ExpandableTaskItem
                activity={activity}
                isNewlyAdded={newlyAddedIds.has(activity.id)}
                showOpportunitySubtitle
              />
            ) : (
              <ScheduleActivityItem
                activity={activity}
                variant="compact"
                isNewlyAdded={newlyAddedIds.has(activity.id)}
                showOpportunitySubtitle
                onViewingClick={onViewingClick}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ScheduleLoadingSkeleton() {
  return (
    <div className="space-y-0">
      {/* Today skeleton section */}
      <div className="relative">
        <div className="sticky top-0 z-10 -mx-6 px-6 bg-background py-3 pr-16">
          <Skeleton className="h-6 w-28" />
        </div>
        <div className="bg-card rounded-2xl p-4 space-y-3 mb-4">
          {[1, 2, 3].map((i) => (
            <ActivityItemSkeleton key={i} />
          ))}
        </div>
      </div>
      
      {/* Tomorrow skeleton section */}
      <div className="relative">
        <div className="sticky top-0 z-10 -mx-6 px-6 bg-background py-3 pr-16">
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="bg-card rounded-2xl p-4 space-y-3 mb-4">
          {[1, 2].map((i) => (
            <ActivityItemSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ActivityItemSkeleton() {
  return (
    <div className="flex gap-4">
      {/* Time skeleton */}
      <Skeleton className="h-5 w-12 mt-[15px]" />
      
      {/* Content card skeleton */}
      <div className="flex-1 flex items-start justify-between gap-3 rounded-xl px-4 py-3 bg-[#0000000D]">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <Skeleton className="w-10 h-10 rounded-full" />
      </div>
    </div>
  );
}
