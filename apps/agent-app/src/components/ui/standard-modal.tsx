import * as React from "react";
import { useState, useEffect, useRef, useCallback } from "react";
import { X, ArrowLeft, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogPortal,
  DialogOverlay,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * StandardModal - A consistent, reusable modal component
 * 
 * Design System Rules:
 * - DialogContent: hideCloseButton className="sm:max-w-{size} p-0 max-h-[90vh] overflow-hidden flex flex-col"
 * - DialogHeader: className="px-6 pt-6 pb-2 shrink-0"
 * - Header has flex layout with title on left and close button on right
 * - Scrollable content area: className="flex-1 overflow-y-auto px-6 pb-6"
 * - Footer with CTA: className="px-6 pb-6 pt-2 shrink-0" with full-width button
 * - Button styling: className="w-full h-12 text-base" or h-14 for emphasis
 * 
 * Multi-Step Wizard Support:
 * - Use WizardModal for multi-step flows with animated transitions
 * - Includes progress bar, step navigation, and smooth content transitions
 */

export interface StandardModalProps {
  /** Control modal visibility */
  open: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;
  /** Modal title */
  title: string;
  /** Optional subtitle/description */
  description?: React.ReactNode;
  /** Modal content */
  children: React.ReactNode;
  /** Max width: "sm" (~400px), "md" (~448px), "lg" (~512px), "xl" (~576px), "2xl" (~672px) */
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  /** Show back button in header */
  showBackButton?: boolean;
  /** Callback when back button clicked */
  onBack?: () => void;
  /** Extra elements to show in header (e.g., dev tools dropdown) */
  headerActions?: React.ReactNode;
  /** Footer content (usually a primary action button) */
  footer?: React.ReactNode;
  /** Whether the modal has a fixed height or auto-adjusts */
  fixedHeight?: number | null;
  /** Custom class for content wrapper */
  contentClassName?: string;
  /** Disable closing the modal (e.g., during saving) */
  preventClose?: boolean;
}

const sizeClasses = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-md",
  lg: "sm:max-w-lg",
  xl: "sm:max-w-xl",
  "2xl": "sm:max-w-2xl",
};

export function StandardModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  size = "md",
  showBackButton = false,
  onBack,
  headerActions,
  footer,
  fixedHeight = null,
  contentClassName,
  preventClose = false,
}: StandardModalProps) {
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen && preventClose) return;
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        hideCloseButton
        className={cn(
          sizeClasses[size],
          "p-0 max-h-[90vh] overflow-hidden flex flex-col",
          contentClassName
        )}
        style={
          fixedHeight
            ? {
                height: `${fixedHeight}px`,
                transition: "height 0.3s ease-out",
              }
            : undefined
        }
      >
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-2 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {showBackButton && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onBack}
                  className="h-8 w-8 shrink-0"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              <DialogTitle className="text-xl font-semibold">{title}</DialogTitle>
            </div>

            <div className="flex items-center gap-1">
              {headerActions}
              <DialogClose asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 shrink-0 rounded-xl hover:bg-muted"
                  disabled={preventClose}
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Close</span>
                </Button>
              </DialogClose>
            </div>
          </div>
          {description && (
            <DialogDescription className="mt-1">{description}</DialogDescription>
          )}
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6">{children}</div>

        {/* Footer */}
        {footer && <div className="px-6 pb-6 pt-4 shrink-0">{footer}</div>}
      </DialogContent>
    </Dialog>
  );
}

/**
 * StandardModalFooter - A consistent footer button for modals
 */
export interface StandardModalFooterProps {
  /** Primary action label */
  label: string;
  /** Loading label (shown when isLoading is true) */
  loadingLabel?: string;
  /** Click handler */
  onClick: () => void;
  /** Whether the action is in progress */
  isLoading?: boolean;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Button variant */
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
}

export function StandardModalFooter({
  label,
  loadingLabel = "Saving...",
  onClick,
  isLoading = false,
  disabled = false,
  variant = "default",
}: StandardModalFooterProps) {
  return (
    <Button
      onClick={onClick}
      className="w-full h-12 text-base"
      disabled={disabled || isLoading}
      variant={variant}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          {loadingLabel}
        </>
      ) : (
        label
      )}
    </Button>
  );
}

/**
 * MandatoryFieldsNote - Standard note for forms with required fields
 */
export function MandatoryFieldsNote() {
  return (
    <p className="text-sm text-muted-foreground">
      Fields marked with the red asterisk (
      <span className="text-destructive">*</span>) are mandatory
    </p>
  );
}

// ============================================================================
// MULTI-STEP WIZARD MODAL
// ============================================================================

/**
 * WizardStep - Animated step wrapper for wizard modals
 * Handles smooth enter/exit transitions between steps and sub-steps
 * 
 * Supports two modes:
 * 1. Numeric step tracking: Use `step` prop for simple 1, 2, 3... flows
 * 2. String key tracking: Use `stepKey` prop for complex flows with sub-steps
 *    e.g., "menu", "whatsapp", "download-pdf" or "step1-substepA"
 * 
 * If both are provided, stepKey takes precedence for change detection.
 */
interface WizardStepProps {
  /** Current step number for animation tracking (use for simple numeric flows) */
  step?: number;
  /** String key for tracking step/sub-step changes (use for complex flows with sub-steps) */
  stepKey?: string;
  /** Content to render */
  children: React.ReactNode;
  /** Animation direction */
  direction?: "forward" | "backward";
  /** Custom class name */
  className?: string;
}

export function WizardStep({ step, stepKey, children, direction = "forward", className }: WizardStepProps) {
  // Use stepKey if provided, otherwise fall back to step number as string
  const trackingKey = stepKey ?? String(step ?? 0);
  
  const [isVisible, setIsVisible] = useState(false);
  const [useSlideAnimation, setUseSlideAnimation] = useState(false);
  const prevKeyRef = useRef(trackingKey);
  const isInitialMount = useRef(true);

  useEffect(() => {
    const keyChanged = prevKeyRef.current !== trackingKey;
    
    if (keyChanged && !isInitialMount.current) {
      // Step changed - animate out then in with slide
      setIsVisible(false);
      setUseSlideAnimation(true);
      prevKeyRef.current = trackingKey;
      
      // Small delay before triggering enter animation
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 50);
      
      return () => clearTimeout(timer);
    } else {
      // Initial mount - use fade only (no slide)
      isInitialMount.current = false;
      prevKeyRef.current = trackingKey;
      setUseSlideAnimation(false);
      requestAnimationFrame(() => setIsVisible(true));
    }
  }, [trackingKey]);

  // Only use slide animation for step changes, not initial mount
  const translateClass = useSlideAnimation
    ? (direction === "forward" 
        ? (isVisible ? "translate-x-0" : "translate-x-full")
        : (isVisible ? "translate-x-0" : "-translate-x-full"))
    : "";

  return (
    <div className={cn(
      // Use duration-500 to match ClientSelectorWithCreate and other app flows
      "transition-all duration-500 ease-out h-full flex flex-col min-h-0",
      isVisible ? "opacity-100" : "opacity-0",
      translateClass,
      className
    )}>
      {children}
    </div>
  );
}

/**
 * WizardProgressBar - Visual progress indicator for wizard modals
 */
interface WizardProgressBarProps {
  /** Current step (1-indexed) */
  currentStep: number;
  /** Total number of steps */
  totalSteps: number;
  /** Custom class name */
  className?: string;
}

export function WizardProgressBar({ currentStep, totalSteps, className }: WizardProgressBarProps) {
  return (
    <div className={cn("flex gap-2", className)}>
      {Array.from({ length: totalSteps }, (_, i) => {
        const stepNumber = i + 1;
        const isComplete = stepNumber < currentStep;
        const isCurrent = stepNumber === currentStep;
        
        return (
          <div
            key={stepNumber}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-all duration-500 ease-out",
              (isComplete || isCurrent) ? "bg-primary" : "bg-muted"
            )}
          />
        );
      })}
    </div>
  );
}

/**
 * WizardModalProps - Props for the multi-step wizard modal
 */
export interface WizardModalProps {
  /** Control modal visibility */
  open: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;
  /** Current step (1-indexed) */
  currentStep: number;
  /** Total number of steps */
  totalSteps: number;
  /** Step titles - array of titles for each step */
  stepTitles: string[];
  /** Step descriptions - optional array of descriptions for each step */
  stepDescriptions?: (string | undefined)[];
  /** Current step content */
  children: React.ReactNode;
  /** Max width: "sm" (~400px), "md" (~448px), "lg" (~512px), "xl" (~576px), "2xl" (~672px) */
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  /** Custom max width in pixels (overrides size) */
  maxWidth?: number;
  /** Callback when back button clicked */
  onBack?: () => void;
  /** Callback when next/continue clicked */
  onNext?: () => void;
  /** Whether can proceed to next step */
  canProceed?: boolean;
  /** Is the current action loading */
  isLoading?: boolean;
  /** Loading button label */
  loadingLabel?: string;
  /** Next button label (defaults to "Next" or "Done" on last step) */
  nextLabel?: string;
  /** Back button label (defaults to "Back") */
  backLabel?: string;
  /** Show progress bar */
  showProgressBar?: boolean;
  /** Fixed height for consistent step sizes */
  fixedHeight?: number | null;
  /** Extra elements to show in header */
  headerActions?: React.ReactNode;
  /** Image element to show in header (next to title) */
  headerImage?: React.ReactNode;
  /** Disable closing the modal */
  preventClose?: boolean;
  /** Hide footer navigation buttons */
  hideFooter?: boolean;
  /** Animation direction */
  animationDirection?: "forward" | "backward";
  /** Custom content class */
  contentClassName?: string;
  /** Callback for content height changes (for dynamic height) */
  onContentHeightChange?: (height: number | null) => void;
  /** Disable internal step animation wrapper (use when handling animation externally) */
  disableInternalAnimation?: boolean;
  /** 
   * String key for sub-step tracking (optional). 
   * When provided, enables animation between sub-steps within the same step number.
   * e.g., "menu", "whatsapp", "download-pdf" 
   */
  stepKey?: string;
  /** Always show back button, even on first step (useful for closing modal) */
  showBackOnFirstStep?: boolean;
  /** Hide the close (X) button in header */
  hideCloseButton?: boolean;
  /** Prevent closing modal by clicking on backdrop */
  preventBackdropClose?: boolean;
  /** Custom class for overlay */
  overlayClassName?: string;
}

export function WizardModal({
  open,
  onOpenChange,
  currentStep,
  totalSteps,
  stepTitles,
  stepDescriptions,
  children,
  size = "md",
  maxWidth,
  onBack,
  onNext,
  canProceed = true,
  isLoading = false,
  loadingLabel = "Loading...",
  nextLabel,
  backLabel = "Back",
  showProgressBar = true,
  fixedHeight = null,
  headerActions,
  headerImage,
  preventClose = false,
  hideFooter = false,
  animationDirection = "forward",
  contentClassName,
  onContentHeightChange,
  disableInternalAnimation = false,
  stepKey,
  showBackOnFirstStep = false,
  hideCloseButton = false,
  preventBackdropClose = false,
  overlayClassName,
}: WizardModalProps) {
  const [direction, setDirection] = useState<"forward" | "backward">(animationDirection);
  const prevStepRef = useRef(currentStep);
  const contentRef = useRef<HTMLDivElement>(null);

  // Track animation direction based on step changes
  useEffect(() => {
    if (currentStep !== prevStepRef.current) {
      setDirection(currentStep > prevStepRef.current ? "forward" : "backward");
      prevStepRef.current = currentStep;
    }
  }, [currentStep]);

  // Measure content height for dynamic sizing
  useEffect(() => {
    if (onContentHeightChange && contentRef.current) {
      const height = contentRef.current.scrollHeight;
      onContentHeightChange(height);
    }
  }, [children, currentStep, onContentHeightChange]);

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen && preventClose) return;
    onOpenChange(isOpen);
  };

  const handleInteractOutside = (e: Event) => {
    if (preventBackdropClose || preventClose) {
      e.preventDefault();
    }
  };

  const handleBack = () => {
    setDirection("backward");
    onBack?.();
  };

  const handleNext = () => {
    setDirection("forward");
    onNext?.();
  };

  const title = stepTitles[currentStep - 1] || `Step ${currentStep}`;
  const description = stepDescriptions?.[currentStep - 1];
  const isLastStep = currentStep === totalSteps;
  const isFirstStep = currentStep === 1;
  const buttonLabel = nextLabel ?? (isLastStep ? "Done" : "Next");
  const showBackButton = !isFirstStep || showBackOnFirstStep;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        hideCloseButton
        onInteractOutside={handleInteractOutside}
        overlayClassName={overlayClassName}
        className={cn(
          !maxWidth && sizeClasses[size],
          "p-0 max-h-[90vh] overflow-hidden flex flex-col",
          contentClassName
        )}
        style={{
          ...(maxWidth ? { maxWidth: `${maxWidth}px` } : {}),
          ...(fixedHeight
            ? {
                height: `${fixedHeight}px`,
                transition: "height 0.3s ease-out",
              }
            : {}),
        }}
      >
        {/* Progress Bar */}
        {showProgressBar && (
          <div className="px-6 pt-6 pb-2 shrink-0">
            <WizardProgressBar currentStep={currentStep} totalSteps={totalSteps} />
          </div>
        )}

        {/* Header */}
        <DialogHeader className={cn("px-6 pb-4 shrink-0", !showProgressBar && "pt-6")}>
          <div className="flex items-center justify-between gap-4">
            {/* Left side: Back button + Title/Description */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {showBackButton && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleBack}
                  className="h-8 w-8 shrink-0"
                  disabled={isLoading}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              <div className="flex flex-col min-w-0">
                <DialogTitle 
                  key={`title-${stepKey ?? currentStep}`}
                  className="text-xl font-semibold animate-fade-in"
                >
                  {title}
                </DialogTitle>
                {description && (
                  <DialogDescription 
                    key={`desc-${stepKey ?? currentStep}`}
                    className="mt-1 text-muted-foreground animate-fade-in"
                  >
                    {description}
                  </DialogDescription>
                )}
              </div>
            </div>

            {/* Right side: Image + Actions + Close */}
            <div className="flex items-start gap-3 shrink-0">
              {headerImage}
              <div className="flex items-center gap-1">
                {headerActions}
                {!hideCloseButton && (
                  <DialogClose asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 shrink-0 rounded-xl hover:bg-muted"
                      disabled={preventClose}
                    >
                      <X className="h-4 w-4" />
                      <span className="sr-only">Close</span>
                    </Button>
                  </DialogClose>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Content with animation */}
        <div ref={contentRef} className="flex-1 overflow-y-auto px-6">
          {disableInternalAnimation ? (
            children
          ) : (
            <WizardStep step={currentStep} stepKey={stepKey} direction={direction}>
              {children}
            </WizardStep>
          )}
        </div>

        {/* Footer with navigation */}
        {!hideFooter && (
          <div 
            key={`footer-${stepKey ?? currentStep}`}
            className="px-6 pb-6 pt-4 shrink-0 animate-fade-in"
          >
            <Button
              onClick={handleNext}
              className="w-full h-12 text-base"
              disabled={!canProceed || isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {loadingLabel}
                </>
              ) : (
                buttonLabel
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/**
 * useWizardModal - Hook for managing wizard modal state
 */
export function useWizardModal<TData>(
  initialData: TData,
  totalSteps: number
) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<TData>(initialData);
  const [isLoading, setIsLoading] = useState(false);

  const goNext = useCallback(() => {
    if (step < totalSteps) {
      setStep((prev) => prev + 1);
    }
  }, [step, totalSteps]);

  const goBack = useCallback(() => {
    if (step > 1) {
      setStep((prev) => prev - 1);
    }
  }, [step]);

  const goToStep = useCallback((targetStep: number) => {
    if (targetStep >= 1 && targetStep <= totalSteps) {
      setStep(targetStep);
    }
  }, [totalSteps]);

  const updateData = useCallback((updates: Partial<TData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  }, []);

  const reset = useCallback(() => {
    setStep(1);
    setData(initialData);
    setIsLoading(false);
  }, [initialData]);

  return {
    step,
    data,
    isLoading,
    isFirstStep: step === 1,
    isLastStep: step === totalSteps,
    goNext,
    goBack,
    goToStep,
    updateData,
    setData,
    setIsLoading,
    reset,
  };
}
