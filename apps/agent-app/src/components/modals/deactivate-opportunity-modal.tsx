import { useState } from "react";
import { CircleOff } from "lucide-react";
import { StandardModal, StandardModalFooter } from "@/components/ui/standard-modal";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

import { OpportunityType } from "@/types";

interface DeactivateOpportunityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  opportunityType: OpportunityType;
  onDeactivate: (reason: string, details?: string) => Promise<void>;
}
const DEACTIVATION_REASONS: Record<OpportunityType, string[]> = {
  buy: [
    "No response from client",
    "Client not interested in buying anymore",
    "Scammer / suspicious behavior",
  ],
  rent: [
    "No response from client",
    "Client not interested in renting anymore",
    "Scammer / suspicious behavior",
  ],
  sell: [
    "No response from client",
    "Client not interested in selling anymore",
    "Scammer / suspicious behavior",
  ],
  lease: [
    "No response from client",
    "Client not interested in leasing anymore",
    "Scammer / suspicious behavior",
  ],
  mortgage: [
    "No response from client",
    "Client not interested anymore",
    "Scammer / suspicious behavior",
  ],
};

export function DeactivateOpportunityModal({
  open,
  onOpenChange,
  opportunityType,
  onDeactivate,
}: DeactivateOpportunityModalProps) {
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [otherDetails, setOtherDetails] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const reasons = DEACTIVATION_REASONS[opportunityType];
  const isOther = selectedReason === "other";
  const canDeactivate = selectedReason && (!isOther || otherDetails.trim().length > 0);

  const handleDeactivate = async () => {
    if (!canDeactivate) return;
    
    setIsLoading(true);
    try {
      const reason = isOther ? "Other" : selectedReason;
      const details = isOther ? otherDetails : undefined;
      await onDeactivate(reason, details);
      onOpenChange(false);
      // Reset state
      setSelectedReason("");
      setOtherDetails("");
    } catch (error) {
      console.error("Failed to deactivate opportunity:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      // Reset state when closing
      setSelectedReason("");
      setOtherDetails("");
    }
    onOpenChange(isOpen);
  };

  return (
    <StandardModal
      open={open}
      onOpenChange={handleOpenChange}
      title="Deactivate opportunity"
      description="You will not receive any matches for this opportunity. If there is a related property, it will no longer be visible in the app."
      size="md"
      preventClose={isLoading}
      footer={
        <StandardModalFooter
          label="Deactivate"
          loadingLabel="Deactivating..."
          onClick={handleDeactivate}
          isLoading={isLoading}
          disabled={!canDeactivate}
          variant="default"
        />
      }
    >
      <div className="space-y-6 py-4">
        {/* Reason Selection */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Select a reason</h3>
          
          <RadioGroup
            value={selectedReason}
            onValueChange={setSelectedReason}
            className="space-y-3"
          >
            {reasons.map((reason) => (
              <div
                key={reason}
                className="flex items-center space-x-3"
              >
                <RadioGroupItem
                  value={reason}
                  id={reason}
                  className="h-5 w-5"
                />
                <Label
                  htmlFor={reason}
                  className="text-base font-normal cursor-pointer"
                >
                  {reason}
                </Label>
              </div>
            ))}
            
            {/* Other option */}
            <div className="flex items-center space-x-3">
              <RadioGroupItem
                value="other"
                id="other"
                className="h-5 w-5"
              />
              <Label
                htmlFor="other"
                className="text-base font-normal cursor-pointer"
              >
                Other:
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Additional Details Textarea */}
        <Textarea
          placeholder="Add more details..."
          value={otherDetails}
          onChange={(e) => setOtherDetails(e.target.value)}
          className={cn(
            "min-h-[120px] resize-none bg-muted border-0 rounded-xl",
            !isOther && "opacity-50"
          )}
          disabled={!isOther}
        />
      </div>
    </StandardModal>
  );
}
