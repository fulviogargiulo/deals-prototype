import { useState, useEffect } from "react";
import { ListTodo, Eye, Check, AlertCircle, ChevronRight, ThumbsUp, ThumbsDown, Clock, CalendarX2 } from "lucide-react";
import { ScheduleActivity } from "@/types";
import { cn } from "@/lib/utils";
import { useSchedule } from "@/contexts/schedule-context";

interface ScheduleActivityItemProps {
  activity: ScheduleActivity;
  variant?: "default" | "compact";
  isNewlyAdded?: boolean;
  showOpportunitySubtitle?: boolean;
  onViewingClick?: (activity: ScheduleActivity) => void;
}

export function ScheduleActivityItem({ activity, variant = "default", isNewlyAdded = false, showOpportunitySubtitle = false, onViewingClick }: ScheduleActivityItemProps) {
  const isViewing = activity.type === "viewing";
  const isOverdue = activity.status === "overdue";
  const isCompleted = activity.status === "completed";
  
  const handleClick = () => {
    if (isViewing && onViewingClick) {
      onViewingClick(activity);
    }
  };

  if (variant === "compact") {
    return <CompactActivityItem activity={activity} isNewlyAdded={isNewlyAdded} showOpportunitySubtitle={showOpportunitySubtitle} onViewingClick={onViewingClick} />;
  }

  return (
    <div className="flex gap-3">
      {/* Time Column */}
      <div className="flex flex-col items-end min-w-[44px] pt-3">
        <span className={cn(
          "text-sm font-semibold",
          isOverdue ? "text-destructive" : "text-foreground"
        )}>
          {activity.time}
        </span>
        {activity.duration && (
          <span className="text-xs text-muted-foreground">{activity.duration}</span>
        )}
      </div>

      {/* Content Card */}
      <div 
        className={cn(
        "flex-1 p-3 rounded-xl transition-smooth",
        isViewing ? "bg-muted/50" : "bg-muted/30",
        isCompleted && "opacity-60",
        isViewing && onViewingClick && "cursor-pointer hover:bg-muted"
        )}
        onClick={handleClick}
      >
        {isViewing ? (
          <ViewingContent activity={activity} hasClickHandler={!!onViewingClick} />
        ) : (
          <TaskContent activity={activity} />
        )}
      </div>
    </div>
  );
}

/** Returns footer content for visit items based on status/feedback */
function getVisitFooter(activity: ScheduleActivity): { icon: React.ReactNode; label: string } | null {
  // Upcoming scheduled visits — no footer
  if (activity.status === "scheduled") return null;

  // Overdue — pending feedback
  if (activity.status === "overdue") {
    return {
      icon: <Clock className="w-4 h-4 text-secondary-foreground" />,
      label: "Pending feedback",
    };
  }

  // Cancelled or no-show
  if (activity.status === "cancelled" || activity.status === "no-show") {
    return {
      icon: <CalendarX2 className="w-4 h-4 text-secondary-foreground" />,
      label: "Visit cancelled",
    };
  }

  // Completed — check feedback
  if (activity.status === "completed" && activity.feedback) {
    if (activity.feedback.outcome === "cancelled" || activity.feedback.outcome === "no-show") {
      return {
        icon: <CalendarX2 className="w-4 h-4 text-secondary-foreground" />,
        label: "Visit cancelled",
      };
    }
    if (activity.feedback.clientLiked === true) {
      return {
        icon: <ThumbsUp className="w-4 h-4 text-foreground" />,
        label: "Client liked the property",
      };
    }
    if (activity.feedback.clientLiked === false) {
      return {
        icon: <ThumbsDown className="w-4 h-4 text-foreground" />,
        label: "Client didn't like the property",
      };
    }
    // Completed but no like/dislike info
    return {
      icon: <Check className="w-4 h-4 text-tier-success" />,
      label: "Visit completed",
    };
  }

  return null;
}

function CompactActivityItem({ activity, isNewlyAdded = false, showOpportunitySubtitle = false, onViewingClick }: { activity: ScheduleActivity; isNewlyAdded?: boolean; showOpportunitySubtitle?: boolean; onViewingClick?: (activity: ScheduleActivity) => void }) {
  const isViewing = activity.type === "viewing";
  const isCompleted = activity.status === "completed";
  const isOverdue = activity.status === "overdue";
  const { clearNewlyAdded } = useSchedule();
  const [showHighlight, setShowHighlight] = useState(isNewlyAdded);

  const handleClick = () => {
    if (isViewing && onViewingClick) {
      onViewingClick(activity);
    }
  };

  // Clear highlight after 1.5s
  useEffect(() => {
    if (isNewlyAdded) {
      setShowHighlight(true);
      const timer = setTimeout(() => {
        setShowHighlight(false);
        clearNewlyAdded(activity.id);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isNewlyAdded, activity.id, clearNewlyAdded]);

  // Determine background color
  const getBackgroundColor = () => {
    if (showHighlight) return "bg-[#5959F426]"; // Indigo highlight
    if (isOverdue) return "bg-[#F6445C1A]"; // Light red tint for overdue
    return "bg-[#0000000D]"; // Default
  };

  return (
    <div className={cn(
      "flex gap-3",
      isCompleted && !isViewing && "opacity-60"
    )}>
      {/* Time column */}
      <div className="flex flex-col min-w-[44px] shrink-0 pt-[15px]">
        <span className={cn(
          "text-sm font-semibold leading-heading",
          isCompleted && !isViewing ? "text-[#B2B2B2]" : "text-foreground"
        )}>
          {activity.time}
        </span>
        {isViewing && activity.duration && (
          <span className="text-xs font-normal leading-body text-secondary-foreground">
            {activity.duration}
          </span>
        )}
      </div>

      <div 
        className={cn(
          "flex-1 min-w-0 rounded-xl px-3 py-3 transition-colors duration-500",
          getBackgroundColor(),
          isViewing && onViewingClick && "cursor-pointer hover:bg-muted"
        )}
        onClick={handleClick}
      >
        {/* Top row: title + subtitle + right element */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {/* Title */}
            <p className={cn(
              "text-base font-semibold leading-heading line-clamp-2",
              isCompleted && !isViewing ? "line-through text-[#B2B2B2]" : "text-foreground"
            )}>
              {activity.title}
            </p>
            {/* Subtitle: client name for visits, opportunity name for tasks */}
            {showOpportunitySubtitle && (
              <>
                {isViewing && activity.clientName && (
                  <p className={cn(
                    "text-sm font-normal leading-body mt-0.5 line-clamp-1",
                    isCompleted && !isViewing ? "text-[#B2B2B2]" : "text-secondary-foreground"
                  )}>
                    {activity.clientName}
                  </p>
                )}
                {!isViewing && activity.opportunityName && (
                  <p className={cn(
                    "text-sm font-normal leading-body mt-0.5 line-clamp-1",
                    isCompleted && !isViewing ? "text-[#B2B2B2]" : "text-secondary-foreground"
                  )}>
                    {activity.opportunityName}
                  </p>
                )}
              </>
            )}
          </div>
          
          {/* Right side: property image for visits, icon for tasks */}
          {isViewing && activity.propertyImage ? (
            <img
              src={activity.propertyImage}
              alt={activity.propertyName || "Property"}
              className="w-10 h-10 rounded-xl object-cover flex-shrink-0"
            />
          ) : (
            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-card flex items-center justify-center">
                {isViewing ? (
                  onViewingClick ? (
                    <ChevronRight className={cn(
                      "w-5 h-5",
                      isCompleted ? "text-[#B2B2B2]" : "text-foreground"
                    )} />
                  ) : (
                    <Eye className={cn(
                      "w-5 h-5",
                      isCompleted ? "text-[#B2B2B2]" : "text-foreground"
                    )} />
                  )
                ) : (
                  <ListTodo className={cn(
                    "w-5 h-5",
                    isCompleted ? "text-[#B2B2B2]" : "text-foreground"
                  )} />
                )}
              </div>
              
              {/* Completion badge */}
              <div 
                className={cn(
                  "absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#0000000D]",
                  isCompleted ? "scale-100" : "scale-0"
                )}
                style={{ transition: "transform 1.5s ease-out" }}
              />
              <div 
                className={cn(
                  "absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-tier-success flex items-center justify-center",
                  isCompleted ? "scale-100" : "scale-0"
                )}
                style={{ transition: "transform 1.5s ease-out" }}
              >
                <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
              </div>

              {/* Overdue badge */}
              <div 
                className={cn(
                  "absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#0000000D]",
                  isOverdue ? "scale-100" : "scale-0"
                )}
                style={{ transition: "transform 0.3s ease-out" }}
              />
              <div 
                className={cn(
                  "absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-destructive flex items-center justify-center",
                  isOverdue ? "scale-100" : "scale-0"
                )}
                style={{ transition: "transform 0.3s ease-out" }}
              >
                <AlertCircle className="w-2.5 h-2.5 text-white" strokeWidth={3} />
              </div>
            </div>
          )}
        </div>

        {/* Visit footer - conditional based on status */}
        {isViewing && (() => {
          const visitFooter = getVisitFooter(activity);
          if (!visitFooter) return null;
          return (
            <div className="mt-3">
              <div className="border-t border-border mb-3" />
              <div className="flex items-center gap-2">
                {visitFooter.icon}
                <span className="text-sm font-normal leading-body text-secondary-foreground">
                  {visitFooter.label}
                </span>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

interface TaskContentProps {
  activity: ScheduleActivity;
}

function TaskContent({ activity }: TaskContentProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex-1 min-w-0">
        <p className={cn(
          "font-semibold text-sm",
          activity.status === "completed" && "line-through"
        )}>
          {activity.title}
        </p>
      </div>
      <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center flex-shrink-0">
        <ListTodo className="w-5 h-5 text-muted-foreground" />
      </div>
    </div>
  );
}

interface ViewingContentProps {
  activity: ScheduleActivity;
  hasClickHandler?: boolean;
}

function ViewingContent({ activity, hasClickHandler = false }: ViewingContentProps) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex-1 min-w-0">
        <p className={cn(
          "font-semibold text-sm",
          activity.status === "completed" && "line-through"
        )}>
          {activity.propertyName || activity.title}
        </p>
        {activity.clientName && (
          <p className="text-sm text-muted-foreground">
            {activity.clientName}
          </p>
        )}
      </div>
      {activity.propertyImage && (
        <img
          src={activity.propertyImage}
          alt={activity.propertyName || "Property"}
          className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
        />
      )}
      {!activity.propertyImage && (
        <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center flex-shrink-0">
          {hasClickHandler ? (
            <ChevronRight className="w-5 h-5 text-foreground" />
          ) : (
            <Eye className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
      )}
    </div>
  );
}
