import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { requiresUnitDetails } from "@/lib/property-types";
import { PropertyDraftData, initialPropertyDraftData, AddPropertyStep, AddPropertyDialogInitialData, CreatedPropertyData } from "./types";
import { StepClient } from "./step-client";
import { StepIntent } from "./step-intent";
import { StepPropertyType } from "./step-property-type";
import { StepAddress } from "./step-address";
import { StepVisibility } from "./step-visibility";
import { StepSuccess } from "./step-success";
import { NewClientModal } from "@/components/modals/new-client-modal";
import { useData } from "@/contexts/data-context";
import { useIsMobile } from "@/hooks/use-mobile";

interface AddPropertyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  autoAdvance?: boolean;
  /** Pre-fill intent and client when opening from an opportunity */
  initialData?: AddPropertyDialogInitialData;
  /** Callback when property is successfully created */
  onPropertyCreated?: (property: CreatedPropertyData) => void;
}

// Simple progress bar component with segmented steps
function StepProgressBar({ currentStep, startStep = 1 }: { currentStep: number; startStep?: number }) {
  // Calculate the total visible steps and current progress
  const totalVisibleSteps = 5 - startStep + 1; // e.g., startStep=3 means steps 3,4,5 = 3 steps
  const progressStep = currentStep - startStep + 1; // Map current step to 1-indexed progress
  
  return (
    <div className="flex gap-3">
      {Array.from({ length: totalVisibleSteps }, (_, i) => {
        const stepNumber = i + 1;
        const isComplete = stepNumber < progressStep;
        const isCurrent = stepNumber === progressStep;
        
        return (
          <div
            key={stepNumber}
            className={cn(
              "h-2 flex-1 rounded-full transition-all duration-500 ease-out",
              (isComplete || isCurrent) ? "bg-primary" : "bg-border"
            )}
          />
        );
      })}
    </div>
  );
}

// Animated step wrapper - children handle their own title/content staggering
interface AnimatedStepProps {
  step: number;
  children: React.ReactNode;
}

function AnimatedStep({ step, children }: AnimatedStepProps) {
  const [isVisible, setIsVisible] = useState(false);
  const prevStepRef = useRef(step);

  useEffect(() => {
    const stepChanged = prevStepRef.current !== step;
    
    if (stepChanged) {
      setIsVisible(false);
      prevStepRef.current = step;
      
      // Small delay before triggering enter animation
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setIsVisible(true));
      });
    } else {
      // Initial mount
      requestAnimationFrame(() => setIsVisible(true));
    }
  }, [step]);

  return (
    <div className={cn(
      "transition-all duration-500 ease-out h-full flex flex-col min-h-0",
      isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
    )}>
      {children}
    </div>
  );
}

export function AddPropertyDialog({ open, onOpenChange, autoAdvance = false, initialData, onPropertyCreated }: AddPropertyDialogProps) {
  const { setClients } = useData();
  
  // Compute initial step based on pre-filled data
  const computeInitialStep = (): AddPropertyStep => {
    if (initialData?.intent && initialData?.clientId) {
      return 3; // Skip intent and client steps
    }
    return 1;
  };
  
  // Compute initial data with pre-filled values
  const computeInitialData = (): PropertyDraftData => {
    return {
      ...initialPropertyDraftData,
      intent: initialData?.intent || initialPropertyDraftData.intent,
      clientId: initialData?.clientId || initialPropertyDraftData.clientId,
    };
  };
  
  const [step, setStep] = useState<AddPropertyStep>(computeInitialStep);
  const [data, setData] = useState<PropertyDraftData>(computeInitialData);
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdPropertyId, setCreatedPropertyId] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isCreatingDraft, setIsCreatingDraft] = useState(false);
  const [isValidatingStreetNumber, setIsValidatingStreetNumber] = useState(false);
  const [needsStreetNumberValidation, setNeedsStreetNumberValidation] = useState(false);
  const [hasStreetNumberInput, setHasStreetNumberInput] = useState(false);
  const [triggerStreetNumberValidation, setTriggerStreetNumberValidation] = useState(false);
  
  // Track whether we have pre-filled data (to skip steps on back navigation)
  const hasPrefilledData = Boolean(initialData?.intent && initialData?.clientId);

  // Handle animation states
  useEffect(() => {
    if (open) {
      setIsMounted(true);
      // Small delay to trigger enter animation
      requestAnimationFrame(() => setIsVisible(true));
    } else {
      setIsVisible(false);
      // Delay unmount to allow fade-out animation
      const timer = setTimeout(() => setIsMounted(false), 300);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const handleUpdate = (updates: Partial<PropertyDraftData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset state after animation
    setTimeout(() => {
      setStep(computeInitialStep());
      setData(computeInitialData());
      setShowSuccess(false);
      setCreatedPropertyId(null);
    }, 300);
  };

  const handleBack = () => {
    // Don't go back past the initial step when we have pre-filled data
    const minStep = hasPrefilledData ? 3 : 1;
    if (step > minStep) {
      setStep((prev) => (prev - 1) as AddPropertyStep);
    }
  };

  const handleStreetNumberValidationChange = (isValidating: boolean, needsValidation: boolean, hasInput: boolean) => {
    setIsValidatingStreetNumber(isValidating);
    setNeedsStreetNumberValidation(needsValidation);
    setHasStreetNumberInput(hasInput);
    // Reset trigger after validation completes
    if (!isValidating && triggerStreetNumberValidation) {
      setTriggerStreetNumberValidation(false);
    }
  };

  const canProceed = (): boolean => {
    switch (step) {
      case 1:
        return !!data.intent;
      case 2:
        return !!data.clientId;
      case 3:
        return !!data.parentType && !!data.subType;
      case 4:
        // If needs street number validation, only allow proceeding if there's input
        if (needsStreetNumberValidation) return hasStreetNumberInput;
        if (!data.address) return false;
        if (data.parentType && requiresUnitDetails(data.parentType)) {
          // Floor and unit type are required for apartments, shops, offices
          if (!data.floor || !data.unitType) return false;
          // Unit field is only required for letter-number or directional unit types
          if (data.unitType === 'letter-number' && !data.unit) return false;
          if (data.unitType === 'directional' && !data.unit) return false;
        }
        return true;
      case 5:
        return !!data.addressVisibility;
      default:
        return false;
    }
  };

  // Auto-advance to next step when canProceed is true and autoAdvance is enabled
  // But never auto-advance on step 4 (address step requires manual Continue)
  useEffect(() => {
    if (!autoAdvance || showSuccess || isCreatingDraft || isValidatingStreetNumber) return;
    
    // Don't auto-advance on step 4 - address step always requires manual Continue
    if (step === 4) return;
    
    // Don't auto-advance on the last step (step 5) - user should explicitly create draft
    if (step === 5) return;
    
    if (canProceed()) {
      // Small delay to let user see their selection before advancing
      const timer = setTimeout(() => {
        setStep((prev) => (prev + 1) as AddPropertyStep);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [autoAdvance, step, data, showSuccess, isCreatingDraft, isValidatingStreetNumber]);

  const handleNext = async () => {
    // If we're on step 4 and need street number validation, trigger it instead of proceeding
    if (step === 4 && needsStreetNumberValidation) {
      setTriggerStreetNumberValidation(true);
      return;
    }
    
    if (step < 5) {
      setStep((prev) => (prev + 1) as AddPropertyStep);
    } else {
      // Create property draft with loading state
      setIsCreatingDraft(true);
      
      // Mimic API call
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      const newPropertyId = `property-${Date.now()}`;
      console.log('Creating property draft:', data);
      
      // Build property title from address
      const propertyTitle = data.address 
        ? `${data.subType?.charAt(0).toUpperCase()}${data.subType?.slice(1)} in ${data.address.neighborhood}`
        : 'New Property';
      
      // Notify parent of created property
      onPropertyCreated?.({
        id: newPropertyId,
        title: propertyTitle,
        image: '', // Will be set by parent or later
        status: 'draft',
      });
      
      setCreatedPropertyId(newPropertyId);
      setIsCreatingDraft(false);
      setShowSuccess(true);
    }
  };

  const handleNewClientSave = async (clientData: { fullName: string; phone: string; email?: string }) => {
    // Generate a new client ID
    const newClientId = `client-${Date.now()}`;
    
    // Add client to the data context
    setClients((prev) => [
      ...prev,
      {
        id: newClientId,
        fullName: clientData.fullName,
        phone: clientData.phone,
        email: clientData.email,
        verificationStatus: 'verified' as const,
        lastActivity: 'Just created',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);

    // Select the new client and move to next step
    handleUpdate({ clientId: newClientId });
    setShowNewClientModal(false);
    setStep(3);
  };

  if (!isMounted) return null;

  return createPortal(
    <>
      <div className={cn(
        "fixed inset-0 z-50 bg-background flex flex-col transition-opacity duration-300",
        isVisible ? "opacity-100" : "opacity-0"
      )}>
        {showSuccess && createdPropertyId ? (
          <StepSuccess propertyId={createdPropertyId} onClose={handleClose} />
        ) : (
          <>
            {/* Header - no divider */}
            <div className="flex items-center justify-end px-8 md:px-16 py-6">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="h-12 w-12 rounded-xl hover:bg-muted transition-colors"
              >
                <X className="h-6 w-6" />
              </Button>
            </div>

            {/* Progress Bar */}
            <div className="px-8 md:px-16 py-6">
              <StepProgressBar currentStep={step} startStep={hasPrefilledData ? 3 : 1} />
            </div>

            {/* Main Content - Centered with max height */}
            <div className="flex-1 flex items-center justify-center overflow-hidden min-h-0">
              <div className="w-full max-w-3xl h-full max-h-[calc(100vh-220px)] px-8 md:px-16 py-8 flex flex-col">
                <AnimatedStep step={step}>
                  {step === 1 && (
                    <StepIntent data={data} onUpdate={handleUpdate} />
                  )}
                  {step === 2 && (
                    <StepClient
                      data={data}
                      onUpdate={handleUpdate}
                      onAddNewClient={() => setShowNewClientModal(true)}
                    />
                  )}
                  {step === 3 && (
                    <StepPropertyType 
                      data={data} 
                      onUpdate={handleUpdate}
                    />
                  )}
                  {step === 4 && (
                    <StepAddress 
                      data={data} 
                      onUpdate={handleUpdate} 
                      onStreetNumberValidationChange={handleStreetNumberValidationChange}
                      triggerStreetNumberValidation={triggerStreetNumberValidation}
                    />
                  )}
                  {step === 5 && (
                    <StepVisibility data={data} onUpdate={handleUpdate} />
                  )}
                </AnimatedStep>
              </div>
            </div>

            {/* Footer - Airbnb style navigation, buttons at edges */}
            <div className="border-t border-border px-8 md:px-16 py-6">
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={step > (hasPrefilledData ? 3 : 1) ? handleBack : handleClose}
                  className="font-semibold text-lg underline underline-offset-4 hover:no-underline px-6 py-3 h-auto"
                >
                  Back
                </Button>
                <Button
                  size="lg"
                  disabled={!canProceed() || isValidatingStreetNumber || isCreatingDraft}
                  onClick={handleNext}
                  className="px-10 py-3 h-auto text-lg font-semibold rounded-xl"
                >
                  {isCreatingDraft ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="h-5 w-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      Creating draft...
                    </span>
                  ) : isValidatingStreetNumber ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="h-5 w-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      Validating...
                    </span>
                  ) : step === 5 ? 'Create draft' : 'Next'}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      <NewClientModal
        open={showNewClientModal}
        onOpenChange={setShowNewClientModal}
        onSave={handleNewClientSave}
      />
    </>,
    document.body
  );
}
