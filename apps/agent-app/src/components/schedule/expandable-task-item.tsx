import { useState, useEffect } from "react";
import { ListTodo, Eye, Trash2, Check, Pencil, Loader2, ExternalLink, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { ScheduleActivity } from "@/types";
import { cn } from "@/lib/utils";
import { useSchedule } from "@/contexts/schedule-context";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { NewTaskModalV2 } from "@/components/modals/new-task-modal-v2";

interface ExpandableTaskItemProps {
  activity: ScheduleActivity;
  isNewlyAdded?: boolean;
  showOpportunitySubtitle?: boolean;
}

export function ExpandableTaskItem({ activity, isNewlyAdded = false, showOpportunitySubtitle = false }: ExpandableTaskItemProps) {
  const isViewing = activity.type === "viewing";
  const isCompleted = activity.status === "completed";
  const isOverdue = activity.status === "overdue";
  const { clearNewlyAdded, updateActivity, removeActivity } = useSchedule();
  const [showHighlight, setShowHighlight] = useState(isNewlyAdded);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteTint, setShowDeleteTint] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

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

  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const handleStartEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditModalOpen(true);
  };

  const handleActivityUpdated = (id: string, updates: Partial<{
    title: string;
    description?: string;
    date: string;
    time: string;
    clientId?: string;
    clientName?: string;
    propertyId?: string;
    propertyName?: string;
  }>) => {
    updateActivity(id, updates);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleting(true);
    
    // Show red tint immediately
    setShowDeleteTint(true);
    
    // Keep red tint visible for 1500ms (same as new activity highlight)
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Start exit animation
    setIsExiting(true);
    
    // Wait for exit animation to complete before removing
    await new Promise(resolve => setTimeout(resolve, 500));

    removeActivity(activity.id);
    setIsDeleting(false);

    toast({
      title: "Task deleted",
      description: `"${activity.title}" has been removed.`,
    });
  };

  const handleMarkComplete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsCompleting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    updateActivity(activity.id, {
      status: isCompleted ? 'scheduled' : 'completed',
    });

    setIsCompleting(false);

    toast({
      title: isCompleted ? "Task reopened" : "Task completed",
      description: isCompleted ? "Task marked as pending." : "Great job!",
    });
  };

  // Determine background color: delete tint > highlight > overdue > default
  const getBackgroundColor = () => {
    if (showDeleteTint) return "bg-[#F6445C26]"; // Red tint (similar to highlight but danger)
    if (showHighlight) return "bg-[#5959F426]"; // Indigo highlight
    if (isOverdue) return "bg-[#F6445C1A]"; // Light red tint for overdue
    return "bg-[#0000000D]"; // Default
  };

  return (
    <div 
      className={cn(
        "flex gap-4 transition-all duration-300 ease-out",
        isExiting && "opacity-0 scale-95 -translate-x-4"
      )}
      style={{
        maxHeight: isExiting ? '0px' : '500px',
        marginBottom: isExiting ? '-16px' : '0px',
        overflow: isExiting ? 'hidden' : 'visible',
      }}
    >
      {/* Time - aligned to match title's vertical position in the card header */}
      {/* py-3 (12px) padding + baseline offset for 16px text = ~22px from card top */}
      <span 
        className={cn(
          "text-base font-semibold leading-heading min-w-[60px] shrink-0 pt-[15px]",
          isCompleted ? "text-[#B2B2B2]" : "text-foreground"
        )}
        style={{ transition: "color 1.5s ease-out" }}
      >
        {activity.time}
      </span>

      {/* Inner content card */}
      <div 
        className={cn(
          "flex-1 rounded-xl overflow-hidden cursor-pointer transition-colors duration-500",
          getBackgroundColor()
        )}
        onClick={handleToggleExpand}
      >
        {/* Collapsed view */}
        <div className="flex items-start justify-between gap-3 px-4 py-3">
          <div className="flex-1 min-w-0">
            <p 
              className={cn(
                "text-base font-semibold leading-heading line-clamp-2",
                isCompleted ? "line-through text-[#B2B2B2]" : "text-foreground"
              )}
              style={{ transition: "color 1.5s ease-out" }}
            >
              {activity.title}
            </p>
            {/* Opportunity subtitle - Body/Regular/Medium: 14px, font-normal, 140% line-height, #808080 */}
            {showOpportunitySubtitle && activity.opportunityName && (
              <p 
                className={cn(
                  "text-sm font-normal leading-body mt-0.5 line-clamp-1",
                  isCompleted ? "text-[#B2B2B2]" : "text-secondary-foreground"
                )}
                style={{ transition: "color 1.5s ease-out" }}
              >
                {activity.opportunityName}
              </p>
            )}
          </div>
          
          {/* Icon container with completion badge */}
          <div className="relative flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-card flex items-center justify-center">
              {isViewing ? (
                <Eye 
                  className={cn(
                    "w-5 h-5",
                    isCompleted ? "text-[#B2B2B2]" : "text-foreground"
                  )}
                  style={{ transition: "color 1.5s ease-out" }}
                />
              ) : (
                <ListTodo 
                  className={cn(
                    "w-5 h-5",
                    isCompleted ? "text-[#B2B2B2]" : "text-foreground"
                  )}
                  style={{ transition: "color 1.5s ease-out" }}
                />
              )}
            </div>
            
            {/* Completion badge - green check */}
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

            {/* Overdue badge - red exclamation */}
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
        </div>

        {/* Expanded content - using CSS grid for smooth height animation */}
        <div 
          className="grid transition-[grid-template-rows] duration-300 ease-out"
          style={{ 
            gridTemplateRows: isExpanded ? '1fr' : '0fr',
          }}
        >
          <div className="overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="px-4 pb-4 space-y-4">
              {/* Divider */}
              <div className="border-t border-border" />

              {/* View mode */}
              <div className="space-y-3">
                {/* Details */}
                {activity.description && (
                  <p className="text-sm text-muted-foreground leading-body">
                    {activity.description}
                  </p>
                )}

                {/* Meta info with clickable links */}
                <div className="space-y-1.5">
                  {activity.opportunityName && activity.opportunityId && (
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">Opportunity:</span>{" "}
                      <Link 
                        to={`/opportunities/${activity.opportunityId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:underline inline-flex items-center gap-1"
                      >
                        {activity.opportunityName}
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  )}
                  {activity.clientName && activity.clientId && (
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">Client:</span>{" "}
                      <Link 
                        to={`/clients/${activity.clientId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:underline inline-flex items-center gap-1"
                      >
                        {activity.clientName}
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  )}
                  {activity.propertyName && activity.propertyId && (
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">Property:</span>{" "}
                      <Link 
                        to={`/my-properties/${activity.propertyId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:underline inline-flex items-center gap-1"
                      >
                        {activity.propertyName}
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  )}
                </div>

                {/* Actions - responsive layout */}
                <div className="flex flex-wrap gap-2 pt-2">
                  {/* Edit button - only show when not completed */}
                  {!isCompleted && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 px-3 rounded-xl gap-2 flex-1 min-w-0 sm:flex-none"
                      onClick={handleStartEdit}
                    >
                      <Pencil className="w-4 h-4 shrink-0" />
                      <span className="truncate">Edit</span>
                    </Button>
                  )}
                  {/* Complete button - only show when not completed */}
                  {!isCompleted && (
                    <Button
                      size="sm"
                      className="h-9 px-3 rounded-xl gap-2 flex-1 min-w-0 sm:flex-none"
                      onClick={handleMarkComplete}
                      disabled={isCompleting}
                    >
                      {isCompleting ? (
                        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                      ) : (
                        <Check className="w-4 h-4 shrink-0" />
                      )}
                      <span className="truncate">Complete</span>
                    </Button>
                  )}
                  {/* Delete button - same style as Complete but with danger background */}
                  <Button
                    size="sm"
                    className="h-9 px-3 rounded-xl gap-2 bg-destructive text-destructive-foreground hover:bg-destructive/90 flex-1 min-w-0 sm:flex-none"
                    onClick={handleDelete}
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                    ) : (
                      <Trash2 className="w-4 h-4 shrink-0" />
                    )}
                    <span className="truncate">Delete</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Task Modal */}
      <NewTaskModalV2
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        skipActivityTypeSelection
        editActivity={{
          id: activity.id,
          title: activity.title,
          description: activity.description,
          date: activity.date,
          time: activity.time,
          opportunityId: activity.opportunityId,
          opportunityName: activity.opportunityName,
          clientId: activity.clientId,
          clientName: activity.clientName,
          propertyId: activity.propertyId,
          propertyName: activity.propertyName,
        }}
        onActivityUpdated={handleActivityUpdated}
      />
    </div>
  );
}
