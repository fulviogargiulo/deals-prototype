import * as React from "react";
import { useState, useEffect } from "react";
import { StandardModal } from "@/components/ui/standard-modal";
import { FloatingLabelField } from "@/components/ui/floating-label-field";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft } from "lucide-react";
import { OpportunityType } from "@/types";
import { cn } from "@/lib/utils";

interface CloseDealModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  opportunityType: OpportunityType;
  /** For sell/lease: is the property currently published? */
  isPropertyPublished?: boolean;
  /** Callback when deal is closed */
  onClose: (closingPrice: number, shouldDelist: boolean) => Promise<void>;
}

export function CloseDealModal({
  open,
  onOpenChange,
  opportunityType,
  isPropertyPublished = false,
  onClose,
}: CloseDealModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [closingPrice, setClosingPrice] = useState("");
  const [isClosing, setIsClosing] = useState(false);

  // Determine if this is a sell/lease opportunity (needs delist step)
  const isSellingOpportunity = opportunityType === "sell" || opportunityType === "lease";
  
  // Only show delist step for sell/lease with published property
  const showDelistStep = isSellingOpportunity && isPropertyPublished;

  // Parse the price value
  const parsedPrice = parseInt(closingPrice.replace(/[^0-9]/g, ""), 10);
  const isValidPrice = !isNaN(parsedPrice) && parsedPrice > 0;

  // Reset state when modal opens/closes
  useEffect(() => {
    if (open) {
      setCurrentStep(1);
      setClosingPrice("");
      setIsClosing(false);
    }
  }, [open]);

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers
    const value = e.target.value.replace(/[^0-9]/g, "");
    setClosingPrice(value);
  };

  const handleContinue = () => {
    if (currentStep === 1 && showDelistStep) {
      setCurrentStep(2);
    }
  };

  const handleBack = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
    }
  };

  const handleCloseDeal = async (shouldDelist: boolean) => {
    setIsClosing(true);
    try {
      await onClose(parsedPrice, shouldDelist);
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to close deal:", error);
    } finally {
      setIsClosing(false);
    }
  };

  // Step 1 Footer - Single CTA
  const step1Footer = (
    <Button
      onClick={showDelistStep ? handleContinue : () => handleCloseDeal(false)}
      className="w-full h-12 text-base"
      disabled={!isValidPrice || isClosing}
    >
      {isClosing ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Closing deal...
        </>
      ) : showDelistStep ? (
        "Continue"
      ) : (
        "Close deal"
      )}
    </Button>
  );

  // Step 2 Footer - Two CTAs side by side
  const step2Footer = (
    <div className="flex gap-3">
      <Button
        onClick={() => handleCloseDeal(false)}
        className="flex-1 h-12 text-base font-semibold"
        disabled={isClosing}
      >
        {isClosing ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          "No, keep listing"
        )}
      </Button>
      <Button
        variant="outline"
        onClick={() => handleCloseDeal(true)}
        className="flex-1 h-12 text-base font-semibold"
        disabled={isClosing}
      >
        {isClosing ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          "Yes, delist"
        )}
      </Button>
    </div>
  );

  const title = currentStep === 1 
    ? "What was the closing price?" 
    : "Close deal and delist the property?";

  return (
    <StandardModal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      size="md"
      showBackButton={currentStep === 2}
      onBack={handleBack}
      preventClose={isClosing}
      footer={currentStep === 1 ? step1Footer : step2Footer}
    >
      {/* Step 1 Content */}
      <div className={cn(
        "transition-all duration-300 ease-out",
        currentStep === 1 ? "opacity-100 h-auto" : "opacity-0 h-0 overflow-hidden"
      )}>
        <div className="py-4">
          <FloatingLabelField
            mode="input"
            label="Closing price"
            value={closingPrice ? parseInt(closingPrice).toLocaleString("es-ES") : ""}
            onChange={handlePriceChange}
            type="text"
            trailingText="€"
            autoFocus
          />
        </div>
      </div>

      {/* Step 2 Content */}
      <div className={cn(
        "transition-all duration-300 ease-out",
        currentStep === 2 ? "opacity-100 h-auto" : "opacity-0 h-0 overflow-hidden"
      )}>
        <div className="py-4">
          <p className="text-base text-muted-foreground leading-body">
            Closing the deal will remove the property from all public listings, including the app and any portals, but the property will remain in your list of properties. This action cannot be undone.
          </p>
        </div>
      </div>
    </StandardModal>
  );
}
