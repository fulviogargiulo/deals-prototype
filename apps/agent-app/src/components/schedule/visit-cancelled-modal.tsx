import { useState } from "react";
import { StandardModal, StandardModalFooter } from "@/components/ui/standard-modal";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { ScheduleActivity } from "@/types";
import { useSchedule } from "@/contexts/schedule-context";
import { toast } from "@/hooks/use-toast";

interface VisitCancelledModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activity: ScheduleActivity;
}

const CANCELLATION_REASONS = [
  "Client no longer interested",
  "Property no longer available",
  "Client not responsive",
];

export function VisitCancelledModal({
  open,
  onOpenChange,
  activity,
}: VisitCancelledModalProps) {
  const { markVisitCancelled } = useSchedule();
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [otherDetails, setOtherDetails] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const isOther = selectedReason === "other";
  const canSubmit = selectedReason && (!isOther || otherDetails.trim().length > 0);

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const reason = isOther ? otherDetails.trim() : selectedReason;
      markVisitCancelled(activity.id, reason);
      onOpenChange(false);
      setSelectedReason("");
      setOtherDetails("");
      toast({
        title: "Visit cancelled",
        description: reason,
      });
    } catch (error) {
      console.error("Failed to cancel visit:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setSelectedReason("");
      setOtherDetails("");
    }
    onOpenChange(isOpen);
  };

  return (
    <StandardModal
      open={open}
      onOpenChange={handleOpenChange}
      title="Why was the visit cancelled?"
      size="md"
      preventClose={isLoading}
      footer={
        <StandardModalFooter
          label="Submit feedback"
          loadingLabel="Submitting..."
          onClick={handleSubmit}
          isLoading={isLoading}
          disabled={!canSubmit}
          variant="default"
        />
      }
    >
      <div className="space-y-6 py-4">
        <RadioGroup
          value={selectedReason}
          onValueChange={setSelectedReason}
          className="space-y-3"
        >
          {CANCELLATION_REASONS.map((reason) => (
            <div key={reason} className="flex items-center space-x-3">
              <RadioGroupItem value={reason} id={reason} className="h-5 w-5" />
              <Label htmlFor={reason} className="text-base font-normal cursor-pointer">
                {reason}
              </Label>
            </div>
          ))}

          {/* Other option */}
          <div className="flex items-center space-x-3">
            <RadioGroupItem value="other" id="cancel-other" className="h-5 w-5" />
            <Label htmlFor="cancel-other" className="text-base font-normal cursor-pointer">
              Other:
            </Label>
          </div>
        </RadioGroup>

        {/* Additional Details Textarea - visible when "Other" is selected */}
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
