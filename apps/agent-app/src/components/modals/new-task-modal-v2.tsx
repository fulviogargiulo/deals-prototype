import { useState, useRef, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, ArrowLeft, Loader2, ChevronDown, Calendar, ClipboardList, ChevronRight } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { FloatingLabelInput } from "@/components/ui/floating-label-input";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { OpportunitySelector, OpportunitySelectorDevScenario } from "@/components/tasks/opportunity-selector";
import { PropertySelector } from "@/components/tasks/property-selector";
import { ClientSelector } from "@/components/clients/client-selector";
import { Opportunity } from "@/types";
import { BuyBareIcon, RentBareIcon } from "@/components/opportunities/opportunity-bare-icons";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useSchedule } from "@/contexts/schedule-context";
import { format } from "date-fns";
import { OpportunityBareIcons } from "@/components/opportunities/opportunity-bare-icons";
import {
  BookVisitContent,
  BookVisitContentHandle,
  BookVisitStep,
  getBookVisitStepTitle,
  getBookVisitStepDescription,
  canGoBackFromBookVisitStep,
  getBookVisitBackStep,
} from "@/components/modals/book-visit-content";

interface EditableActivity {
  id: string;
  title: string;
  description?: string;
  date: string;
  time: string;
  opportunityId?: string;
  opportunityName?: string;
  clientId?: string;
  clientName?: string;
  propertyId?: string;
  propertyName?: string;
}

interface NewTaskModalV2Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  opportunity?: Opportunity;
  skipActivityTypeSelection?: boolean;
  editActivity?: EditableActivity;
  onActivityUpdated?: (id: string, updates: Partial<EditableActivity>) => void;
}

type Step = 'activity-type' | 'form' | 'opportunity' | 'client' | 'property' | 'book-visit';

interface SelectedClient {
  id: string;
  name: string;
  phone: string;
}

interface SelectedProperty {
  id: string;
  title: string;
}

const ACTIVITY_TYPE_HEIGHT = 255;
const FORM_VIEW_HEIGHT = 560;
const SELECT_VIEW_HEIGHT = 600;

export function NewTaskModalV2({
  open,
  onOpenChange,
  opportunity,
  skipActivityTypeSelection = false,
  editActivity,
  onActivityUpdated
}: NewTaskModalV2Props) {
  const isEditMode = !!editActivity;
  const initialStep: Step = (skipActivityTypeSelection || isEditMode) ? 'form' : 'activity-type';
  const [currentStep, setCurrentStep] = useState<Step>(initialStep);
  const [oppDevScenario, setOppDevScenario] = useState<OpportunitySelectorDevScenario>('default');
  const [contentHeight, setContentHeight] = useState<number>((skipActivityTypeSelection || isEditMode) ? FORM_VIEW_HEIGHT : ACTIVITY_TYPE_HEIGHT);
  const formRef = useRef<HTMLDivElement>(null);
  const { addActivity } = useSchedule();

  // Book visit sub-step tracking
  const [bookVisitSubStep, setBookVisitSubStep] = useState<BookVisitStep>('form');

  // Form state
  const [title, setTitle] = useState("");
  const [dateTime, setDateTime] = useState<{ date: Date; time: string } | null>(null);
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(opportunity || null);
  const [selectedClient, setSelectedClient] = useState<SelectedClient | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<SelectedProperty | null>(null);
  const [details, setDetails] = useState("");
  const [reminder, setReminder] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isOpportunityProvided = !!opportunity;
  const requiresClient = selectedOpportunity?.type === 'sell' || selectedOpportunity?.type === 'lease';
  const requiresProperty = selectedOpportunity?.type === 'buy' || selectedOpportunity?.type === 'rent';

  useEffect(() => {
    if (opportunity) {
      setSelectedOpportunity(opportunity);
    }
  }, [opportunity]);

  // Initialize form with editActivity data
  useEffect(() => {
    if (editActivity && open) {
      setTitle(editActivity.title);
      setDetails(editActivity.description || "");
      try {
        const date = new Date(editActivity.date);
        setDateTime({ date, time: editActivity.time });
      } catch {
        setDateTime(null);
      }
      if (editActivity.opportunityId && editActivity.opportunityName) {
        setSelectedOpportunity({
          id: editActivity.opportunityId,
          title: editActivity.opportunityName,
          type: 'buy',
        } as Opportunity);
      }
      if (editActivity.clientId && editActivity.clientName) {
        setSelectedClient({
          id: editActivity.clientId,
          name: editActivity.clientName,
          phone: '',
        });
      }
      if (editActivity.propertyId && editActivity.propertyName) {
        setSelectedProperty({
          id: editActivity.propertyId,
          title: editActivity.propertyName,
        });
      }
    }
  }, [editActivity, open]);

  // Update height based on step
  useEffect(() => {
    if (!open) return;

    if (currentStep === 'activity-type') {
      setContentHeight(ACTIVITY_TYPE_HEIGHT);
    } else if (currentStep === 'form') {
      const timer = setTimeout(() => {
        if (formRef.current) {
          const height = formRef.current.scrollHeight + 130;
          setContentHeight(height);
        }
      }, 50);
      return () => clearTimeout(timer);
    } else if (currentStep === 'book-visit') {
      // Height managed by BookVisitContent
    } else {
      setContentHeight(SELECT_VIEW_HEIGHT);
    }
  }, [open, currentStep, title, dateTime, selectedOpportunity, selectedClient, selectedProperty, details]);

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setCurrentStep(initialStep);
      setTitle("");
      setDateTime(null);
      setSelectedOpportunity(opportunity || null);
      setSelectedClient(null);
      setSelectedProperty(null);
      setDetails("");
      setReminder(true);
      setBookVisitSubStep('form');
      setContentHeight(skipActivityTypeSelection ? FORM_VIEW_HEIGHT : ACTIVITY_TYPE_HEIGHT);
    }
    onOpenChange(isOpen);
  };

  const handleSelectOpportunity = (opp: Opportunity) => {
    setSelectedOpportunity(opp);
    setSelectedClient(null);
    setSelectedProperty(null);
    setCurrentStep('form');
  };

  const handleSelectClient = (clientId: string, clientName: string, clientPhone: string) => {
    setSelectedClient({ id: clientId, name: clientName, phone: clientPhone });
    setCurrentStep('form');
  };

  const handleSelectProperty = (property: { id: string; title: string }) => {
    setSelectedProperty({ id: property.id, title: property.title });
    setCurrentStep('form');
  };

  const getStepTitle = () => {
    if (currentStep === 'book-visit') {
      return getBookVisitStepTitle(bookVisitSubStep);
    }
    switch (currentStep) {
      case 'activity-type': return 'Add to schedule';
      case 'form': return isEditMode ? 'Edit task' : 'Create task';
      case 'opportunity': return 'Select opportunity';
      case 'client': return 'Select client';
      case 'property': return 'Select property';
    }
  };

  const renderStepDescription = () => {
    if (currentStep === 'book-visit') {
      const desc = getBookVisitStepDescription(bookVisitSubStep);
      if (desc) return <span className="text-muted-foreground">{desc}</span>;
      return null;
    }
    switch (currentStep) {
      case 'activity-type':
        return <span className="text-muted-foreground">Choose what you'd like to add</span>;
      case 'form':
        if (selectedOpportunity) {
          const IconComponent = OpportunityBareIcons[selectedOpportunity.type];
          return (
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="w-6 h-6 min-w-6 rounded-full bg-[#0000000D] grid place-items-center">
                <IconComponent className="!w-3.5 !h-3.5 text-foreground" />
              </div>
              <span>{selectedOpportunity.title}</span>
            </div>
          );
        }
        return <span className="text-muted-foreground">Add a new task to your schedule.</span>;
      case 'opportunity':
        return <span className="text-muted-foreground">Link this task to an opportunity.</span>;
      case 'client':
        return <span className="text-muted-foreground">Select a client for this task.</span>;
      case 'property':
        return <span className="text-muted-foreground">Select a property for this task.</span>;
    }
  };

  const handleBack = () => {
    if (currentStep === 'book-visit') {
      if (canGoBackFromBookVisitStep(bookVisitSubStep)) {
        // BookVisitContent manages its own sub-navigation
        // We can't directly set sub-step from here, but the back button
        // at the book-visit form level should go back to activity-type
        setBookVisitSubStep('form');
        // If we're at the book-visit form itself, go back to activity type
        return;
      }
      setCurrentStep('activity-type');
      setContentHeight(ACTIVITY_TYPE_HEIGHT);
      setBookVisitSubStep('form');
    } else if (currentStep === 'form' && !skipActivityTypeSelection) {
      setCurrentStep('activity-type');
    } else if (currentStep === 'opportunity' || currentStep === 'client' || currentStep === 'property') {
      setCurrentStep('form');
    }
  };

  const showBackButton = (() => {
    if (currentStep === 'book-visit') {
      // Show back when on book-visit form (to go to activity-type)
      // or when on a sub-step (to go back within book-visit)
      return true;
    }
    return currentStep !== 'activity-type' && !(currentStep === 'form' && (skipActivityTypeSelection || isEditMode));
  })();

  const bookVisitContentRef = useRef<BookVisitContentHandle>(null);

  const handleBookVisitBack = () => {
    if (bookVisitSubStep === 'form') {
      // Go back to activity type selection
      setCurrentStep('activity-type');
      setContentHeight(ACTIVITY_TYPE_HEIGHT);
      setBookVisitSubStep('form');
    } else {
      // Let the BookVisitContent handle sub-step back
      bookVisitContentRef.current?.goBack();
    }
  };

  const handleSubmit = async () => {
    if (!title || !dateTime || !selectedOpportunity) return;

    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (isEditMode && editActivity && onActivityUpdated) {
      onActivityUpdated(editActivity.id, {
        title,
        description: details || undefined,
        date: format(dateTime.date, 'yyyy-MM-dd'),
        time: dateTime.time,
        clientId: selectedClient?.id,
        clientName: selectedClient?.name,
        propertyId: selectedProperty?.id,
        propertyName: selectedProperty?.title,
      });

      setIsSubmitting(false);
      toast({
        title: "Task updated",
        description: "Your changes have been saved.",
      });
    } else {
      addActivity({
        type: 'task',
        title,
        description: details || undefined,
        date: format(dateTime.date, 'yyyy-MM-dd'),
        time: dateTime.time,
        status: 'scheduled',
        opportunityId: selectedOpportunity.id,
        opportunityName: selectedOpportunity.title,
        clientId: selectedClient?.id,
        clientName: selectedClient?.name,
        propertyId: selectedProperty?.id,
        propertyName: selectedProperty?.title,
      });

      setIsSubmitting(false);
      toast({
        title: "Task created",
        description: `"${title}" has been added to your schedule.`,
      });
    }

    handleOpenChange(false);
  };

  const isFormValid = title.trim() && dateTime && selectedOpportunity;

  const handleBookVisitHeightChange = useCallback((height: number) => {
    setContentHeight(height);
  }, []);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        hideCloseButton
        className="sm:max-w-md flex flex-col p-0 overflow-visible"
        style={{
          height: `${contentHeight}px`,
          maxHeight: '90vh',
          transition: 'height 0.3s ease-out'
        }}
      >
        <DialogHeader className="pl-6 pr-6 pt-6 pb-2 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {showBackButton && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={currentStep === 'book-visit' ? handleBookVisitBack : handleBack}
                  className="h-8 w-8 shrink-0"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              <DialogTitle className="text-xl font-semibold">
                {getStepTitle()}
              </DialogTitle>
            </div>

            <div className="flex items-center gap-1">
              <DialogClose asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <X className="h-4 w-4" />
                  <span className="sr-only">Close</span>
                </Button>
              </DialogClose>
            </div>
          </div>
          {renderStepDescription() && (
            <div className="mt-1 text-sm">
              {renderStepDescription()}
            </div>
          )}
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0 px-6 relative overflow-hidden">
          {/* Activity Type Selection View */}
          <div
            className={cn(
              "transition-all duration-500 ease-out w-full",
              currentStep === 'activity-type'
                ? "opacity-100 translate-x-0 relative"
                : "opacity-0 -translate-x-full absolute inset-0 pointer-events-none"
            )}
          >
            <div className="flex flex-col pb-4">
              <div className="space-y-1">
                {/* Book a visit */}
                {(() => {
                  const isSellingType = opportunity?.type === 'sell' || opportunity?.type === 'lease';
                  return (
                    <div>
                      <button
                        onClick={() => {
                          if (!isSellingType) {
                            setCurrentStep('book-visit');
                            setBookVisitSubStep('form');
                          }
                        }}
                        disabled={isSellingType}
                        className={cn(
                          "w-full flex items-center justify-between py-3 px-2 rounded-lg transition-colors text-left",
                          isSellingType
                            ? "opacity-50 cursor-not-allowed"
                            : "hover:bg-muted"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
                            <Calendar className="w-4 h-4 text-foreground" />
                          </div>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">Book a visit</span>
                              {isSellingType && (
                                <span className="text-[10px] font-semibold text-muted-foreground">(coming soon)</span>
                              )}
                            </div>
                            {isSellingType && (
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[10px] text-muted-foreground">Only available for</span>
                                <div className="flex items-center gap-1">
                                  <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-[#008A8A]">
                                    <BuyBareIcon className="w-2.5 h-2.5" />
                                    Buy
                                  </span>
                                  <span className="text-[10px] text-muted-foreground">&</span>
                                  <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-[#5856D6]">
                                    <RentBareIcon className="w-2.5 h-2.5" />
                                    Rent
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>
                  );
                })()}

                {/* Create a task */}
                <button
                  onClick={() => setCurrentStep('form')}
                  className="w-full flex items-center justify-between py-3 px-2 rounded-lg hover:bg-muted transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
                      <ClipboardList className="w-4 h-4 text-foreground" />
                    </div>
                    <span className="text-sm font-medium">Create a task</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </div>
          </div>

          {/* Task Form View */}
          <div
            ref={formRef}
            className={cn(
              "transition-all duration-500 ease-out w-full",
              currentStep === 'form'
                ? "opacity-100 translate-x-0 relative"
                : currentStep === 'activity-type'
                  ? "opacity-0 translate-x-full absolute inset-0 pointer-events-none"
                  : "opacity-0 -translate-x-full absolute inset-0 pointer-events-none"
            )}
          >
            <div className="space-y-4">
              <FloatingLabelInput
                label="Task title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />

              <DateTimePicker
                label="Due date & time"
                value={dateTime}
                onChange={setDateTime}
                required
              />

              {!isOpportunityProvided && (
                <button
                  type="button"
                  onClick={() => setCurrentStep('opportunity')}
                  className={cn(
                    "relative w-full h-16 px-4 rounded-xl border text-left transition-all duration-200",
                    "hover:border-muted-foreground/50 flex items-center",
                    "border-input bg-background"
                  )}
                >
                  <span
                    className={cn(
                      "absolute left-4 transition-all duration-200 ease-out pointer-events-none",
                      selectedOpportunity
                        ? "top-2 text-xs text-muted-foreground"
                        : "top-1/2 -translate-y-1/2 text-base text-muted-foreground"
                    )}
                  >
                    Opportunity <span className="text-destructive">*</span>
                  </span>
                  {selectedOpportunity && (
                    <span className="truncate text-base mt-4">{selectedOpportunity.title}</span>
                  )}
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground shrink-0" />
                </button>
              )}

              {selectedOpportunity && requiresClient && (
                <button
                  type="button"
                  onClick={() => setCurrentStep('client')}
                  className={cn(
                    "relative w-full h-16 px-4 rounded-xl border text-left transition-all duration-200",
                    "hover:border-muted-foreground/50 flex items-center",
                    "border-input bg-background"
                  )}
                >
                  <span
                    className={cn(
                      "absolute left-4 transition-all duration-200 ease-out pointer-events-none",
                      selectedClient
                        ? "top-2 text-xs text-muted-foreground"
                        : "top-1/2 -translate-y-1/2 text-base text-muted-foreground"
                    )}
                  >
                    Client (optional)
                  </span>
                  {selectedClient && (
                    <span className="truncate text-base mt-4">{selectedClient.name}</span>
                  )}
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground shrink-0" />
                </button>
              )}

              {selectedOpportunity && requiresProperty && (
                <button
                  type="button"
                  onClick={() => setCurrentStep('property')}
                  className={cn(
                    "relative w-full h-16 px-4 rounded-xl border text-left transition-all duration-200",
                    "hover:border-muted-foreground/50 flex items-center",
                    "border-input bg-background"
                  )}
                >
                  <span
                    className={cn(
                      "absolute left-4 transition-all duration-200 ease-out pointer-events-none",
                      selectedProperty
                        ? "top-2 text-xs text-muted-foreground"
                        : "top-1/2 -translate-y-1/2 text-base text-muted-foreground"
                    )}
                  >
                    Property (optional)
                  </span>
                  {selectedProperty && (
                    <span className="truncate text-base mt-4">{selectedProperty.title}</span>
                  )}
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground shrink-0" />
                </button>
              )}

              <Textarea
                placeholder="Add more details (optional)"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                className="min-h-[80px] rounded-xl resize-none"
              />

              <div className="flex items-center justify-between p-4 rounded-xl border border-input">
                <span className="text-sm">Reminder 15 min before</span>
                <Switch checked={reminder} onCheckedChange={setReminder} />
              </div>

              <Button
                onClick={handleSubmit}
                disabled={!isFormValid || isSubmitting}
                className="w-full h-12 rounded-xl"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {isEditMode ? 'Saving...' : 'Creating task...'}
                  </>
                ) : (
                  isEditMode ? 'Save' : 'Create task'
                )}
              </Button>
            </div>
          </div>

          {/* Book Visit View (slides from activity-type) */}
          <div
            className={cn(
              "transition-all duration-500 ease-out w-full h-full",
              currentStep === 'book-visit'
                ? "opacity-100 translate-x-0 relative"
                : currentStep === 'activity-type'
                  ? "opacity-0 translate-x-full absolute inset-0 pointer-events-none"
                  : "opacity-0 translate-x-full absolute inset-0 pointer-events-none"
            )}
          >
            {currentStep === 'book-visit' && (
              <BookVisitContent
                ref={bookVisitContentRef}
                onClose={() => handleOpenChange(false)}
                onStepChange={setBookVisitSubStep}
                onHeightChange={handleBookVisitHeightChange}
              />
            )}
          </div>

          {/* Opportunity Selection View */}
          <div
            className={cn(
              "transition-all duration-500 ease-out h-full w-full",
              currentStep === 'opportunity'
                ? "opacity-100 translate-x-0 relative"
                : "opacity-0 translate-x-full absolute inset-0 pointer-events-none"
            )}
          >
            <OpportunitySelector
              selectedOpportunityId={selectedOpportunity?.id}
              onSelectOpportunity={handleSelectOpportunity}
              devScenario={oppDevScenario}
              className="h-full"
            />
          </div>

          {/* Client Selection View */}
          <div
            className={cn(
              "transition-all duration-500 ease-out h-full w-full",
              currentStep === 'client'
                ? "opacity-100 translate-x-0 relative"
                : "opacity-0 translate-x-full absolute inset-0 pointer-events-none"
            )}
          >
            <ClientSelector
              selectedClientId={selectedClient?.id}
              onSelectClient={handleSelectClient}
              size="compact"
              className="h-full"
            />
          </div>

          {/* Property Selection View */}
          <div
            className={cn(
              "transition-all duration-500 ease-out h-full w-full",
              currentStep === 'property'
                ? "opacity-100 translate-x-0 relative"
                : "opacity-0 translate-x-full absolute inset-0 pointer-events-none"
            )}
          >
            <PropertySelector
              selectedPropertyId={selectedProperty?.id}
              onSelectProperty={handleSelectProperty}
              className="h-full"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
