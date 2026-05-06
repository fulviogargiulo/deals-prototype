import { useState } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, ArrowLeft, Check, Loader2 } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface DelistPropertyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

type DelistStep = 'confirm' | 'reason' | 'specific-reason' | 'success';
type DelistReason = 'sold-off-market' | 'temporary-unavailable' | 'other-issues';
type SpecificReason = 
  | 'sold-by-huspy' 
  | 'sold-by-another-agency' 
  | 'sold-by-owner' 
  | 'owner-no-longer-selling'
  | 'under-refurbishment'
  | 'tenant-occupied'
  | 'owner-tenant-uncooperative'
  | 'incorrect-missing-details'
  | 'legal-tax-disputes'
  | 'terminated-expired-contract';

const DELIST_REASONS = [
  { value: 'sold-off-market', label: 'Sold or off market' },
  { value: 'temporary-unavailable', label: 'Temporary unavailable' },
  { value: 'other-issues', label: 'Other issues' },
] as const;

const SPECIFIC_REASONS: Record<DelistReason, { value: SpecificReason; label: string }[]> = {
  'sold-off-market': [
    { value: 'sold-by-huspy', label: 'Sold by Huspy' },
    { value: 'sold-by-another-agency', label: 'Sold by another agency' },
    { value: 'sold-by-owner', label: 'Sold by the owner' },
    { value: 'owner-no-longer-selling', label: 'Owner is no longer selling' },
  ],
  'temporary-unavailable': [
    { value: 'under-refurbishment', label: 'Under refurbishment' },
    { value: 'tenant-occupied', label: 'Tenant occupied (no visits)' },
    { value: 'owner-tenant-uncooperative', label: 'Owner/tenant uncooperative' },
  ],
  'other-issues': [
    { value: 'incorrect-missing-details', label: 'Incorrect/missing details' },
    { value: 'legal-tax-disputes', label: 'Legal/tax disputes' },
    { value: 'terminated-expired-contract', label: 'Terminated/expired contract' },
  ],
};

export function DelistPropertyModal({ 
  open, 
  onOpenChange, 
  onConfirm 
}: DelistPropertyModalProps) {
  const [currentStep, setCurrentStep] = useState<DelistStep>('confirm');
  const [previousStep, setPreviousStep] = useState<DelistStep | null>(null);
  const [selectedReason, setSelectedReason] = useState<DelistReason | null>(null);
  const [selectedSpecificReason, setSelectedSpecificReason] = useState<SpecificReason | null>(null);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset state when modal closes
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Delay reset to allow close animation
      setTimeout(() => {
        setCurrentStep('confirm');
        setPreviousStep(null);
        setSelectedReason(null);
        setSelectedSpecificReason(null);
      }, 150);
    }
    onOpenChange(open);
  };

  const goToStep = (nextStep: DelistStep, dir: 'forward' | 'backward') => {
    setDirection(dir);
    setPreviousStep(currentStep);
    setCurrentStep(nextStep);
  };

  const handleBack = () => {
    if (currentStep === 'reason') {
      goToStep('confirm', 'backward');
    } else if (currentStep === 'specific-reason') {
      goToStep('reason', 'backward');
    }
  };

  const handleConfirmDelist = () => {
    goToStep('reason', 'forward');
  };

  const handleSelectReason = (reason: DelistReason) => {
    setSelectedReason(reason);
    // Auto-advance to specific reason step after a short delay
    setTimeout(() => {
      goToStep('specific-reason', 'forward');
    }, 150);
  };

  const handleSelectSpecificReason = (reason: SpecificReason) => {
    setSelectedSpecificReason(reason);
  };

  const handleSubmit = async () => {
    if (selectedSpecificReason) {
      setIsSubmitting(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      setIsSubmitting(false);
      goToStep('success', 'forward');
    }
  };

  const handleDone = () => {
    onConfirm();
    handleOpenChange(false);
  };

  const getTitle = () => {
    switch (currentStep) {
      case 'confirm':
        return 'Delist the property everywhere?';
      case 'reason':
        return 'Why do you want to delist this property?';
      case 'specific-reason':
        return 'Select the specific reason';
      case 'success':
        return '';
      default:
        return '';
    }
  };

  const getDescription = () => {
    switch (currentStep) {
      case 'confirm':
        return 'It will be removed forever from the app listing and the listing portals where it\'s currently published';
      case 'reason':
      case 'specific-reason':
      case 'success':
        return '';
      default:
        return '';
    }
  };

  const showBackButton = currentStep === 'reason' || currentStep === 'specific-reason';
  const showHeader = currentStep !== 'success';
  const showCloseButton = !isSubmitting;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent 
        hideCloseButton
        className="sm:max-w-md flex flex-col p-0 overflow-hidden"
      >
        {showHeader && (
          <DialogHeader className="pl-8 pr-6 pt-6 pb-2 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {showBackButton && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleBack}
                    className="h-8 w-8 shrink-0"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                )}
                <DialogTitle className="text-xl font-semibold">
                  {getTitle()}
                </DialogTitle>
              </div>
              
              {showCloseButton && (
                <DialogClose asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <X className="h-4 w-4" />
                    <span className="sr-only">Close</span>
                  </Button>
                </DialogClose>
              )}
            </div>
            {getDescription() && (
              <DialogDescription className="mt-1">
                {getDescription()}
              </DialogDescription>
            )}
          </DialogHeader>
        )}
        
        <div className="relative flex-1 overflow-hidden">
          {/* Step: Confirm */}
          <div 
            className={cn(
              "transition-all duration-300 ease-out px-8 pb-6",
              currentStep === 'confirm' 
                ? "opacity-100 translate-x-0" 
                : direction === 'forward'
                  ? "opacity-0 -translate-x-full absolute inset-0 pointer-events-none"
                  : "opacity-0 translate-x-full absolute inset-0 pointer-events-none"
            )}
          >
            <div className="flex flex-col gap-3 mt-2">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleConfirmDelist}
              >
                Yes, delist
              </Button>
              <Button 
                className="w-full"
                onClick={() => handleOpenChange(false)}
              >
                No, keep property
              </Button>
            </div>
          </div>

          {/* Step: Select Reason */}
          <div 
            className={cn(
              "transition-all duration-300 ease-out px-8 pb-6",
              currentStep === 'reason' 
                ? "opacity-100 translate-x-0" 
                : direction === 'backward' && previousStep === 'reason'
                  ? "opacity-0 translate-x-full absolute inset-0 pointer-events-none"
                  : "opacity-0 translate-x-full absolute inset-0 pointer-events-none"
            )}
          >
            <RadioGroup 
              value={selectedReason || ''} 
              onValueChange={(value) => handleSelectReason(value as DelistReason)}
              className="flex flex-col gap-3"
            >
              {DELIST_REASONS.map((reason) => (
                <div 
                  key={reason.value}
                  className="flex items-center space-x-3 p-4 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleSelectReason(reason.value)}
                >
                  <RadioGroupItem value={reason.value} id={reason.value} />
                  <Label htmlFor={reason.value} className="cursor-pointer flex-1">
                    {reason.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Step: Select Specific Reason */}
          <div 
            className={cn(
              "transition-all duration-300 ease-out px-8 pb-6",
              currentStep === 'specific-reason' 
                ? "opacity-100 translate-x-0" 
                : direction === 'backward' && previousStep === 'specific-reason'
                  ? "opacity-0 translate-x-full absolute inset-0 pointer-events-none"
                  : "opacity-0 translate-x-full absolute inset-0 pointer-events-none"
            )}
          >
            {selectedReason && (
              <div className="flex flex-col flex-1">
                <RadioGroup 
                  value={selectedSpecificReason || ''} 
                  onValueChange={(value) => handleSelectSpecificReason(value as SpecificReason)}
                  className="flex flex-col gap-3"
                >
                  {SPECIFIC_REASONS[selectedReason].map((reason) => (
                    <div 
                      key={reason.value}
                      className="flex items-center space-x-3 p-4 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => handleSelectSpecificReason(reason.value)}
                    >
                      <RadioGroupItem value={reason.value} id={reason.value} />
                      <Label htmlFor={reason.value} className="cursor-pointer flex-1">
                        {reason.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
                
                <div className="mt-6">
                  <Button 
                    className="w-full"
                    disabled={!selectedSpecificReason || isSubmitting}
                    onClick={handleSubmit}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Submit'
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Step: Success */}
          <div 
            className={cn(
              "transition-all duration-300 ease-out px-8 pb-6",
              currentStep === 'success' 
                ? "opacity-100 translate-x-0" 
                : "opacity-0 translate-x-full absolute inset-0 pointer-events-none"
            )}
          >
            <div className="flex flex-col items-center pt-8 pb-6">
              <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-6 animate-scale-in">
                <Check className="w-10 h-10 text-green-600 dark:text-green-400" />
              </div>
              
              <h2 className="text-2xl font-semibold mb-3">Property delisted</h2>
              <p className="text-muted-foreground text-center px-4 mb-8">
                If the property was published to listing portals, it will be removed from them in the next few hours
              </p>
              
              <div className="w-full">
                <Button 
                  className="w-full"
                  onClick={handleDone}
                >
                  Done
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
