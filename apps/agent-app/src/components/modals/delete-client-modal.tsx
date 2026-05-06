import { useState } from "react";
import { Loader2 } from "lucide-react";
import { StandardModal } from "@/components/ui/standard-modal";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const DELETE_REASONS = [
  { id: "no-response", label: "No response" },
  { id: "incorrect-contact", label: "Incorrect contact details" },
  { id: "is-agent", label: "Is an agent" },
  { id: "already-found", label: "Already found or sold a property" },
  { id: "scammer", label: "Scammer" },
  { id: "other", label: "Other:" },
] as const;

interface DeleteClientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientName: string;
  onDelete: (reason: string, details: string) => Promise<void>;
}

export function DeleteClientModal({
  open,
  onOpenChange,
  clientName,
  onDelete,
}: DeleteClientModalProps) {
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [details, setDetails] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!selectedReason) return;
    
    setIsDeleting(true);
    try {
      await onDelete(selectedReason, details);
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to delete client:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      // Reset state when closing
      setSelectedReason("");
      setDetails("");
    }
    onOpenChange(isOpen);
  };

  const isOtherSelected = selectedReason === "other";
  const isButtonDisabled = !selectedReason || isDeleting || (isOtherSelected && !details.trim());

  return (
    <StandardModal
      open={open}
      onOpenChange={handleOpenChange}
      title="Delete client"
      description={`This will permanently remove the client, their opportunities, and properties related to their selling opportunities from the app. This action cannot be undone.`}
      size="md"
      preventClose={isDeleting}
      footer={
        <Button
          onClick={handleDelete}
          className="w-full h-12 text-base"
          disabled={isButtonDisabled}
          variant="destructive"
        >
          {isDeleting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Deleting...
            </>
          ) : (
            "Delete client"
          )}
        </Button>
      }
    >
      <div className="space-y-5 pb-4">
        <div className="space-y-3">
          <h3 className="text-lg font-semibold leading-heading">Select a reason</h3>
          
          <RadioGroup
            value={selectedReason}
            onValueChange={setSelectedReason}
            className="space-y-3"
          >
            {DELETE_REASONS.map((reason) => (
              <div key={reason.id} className="flex items-center space-x-3">
                <RadioGroupItem
                  value={reason.id}
                  id={reason.id}
                  className="h-6 w-6 border-2 border-border"
                />
                <Label
                  htmlFor={reason.id}
                  className="text-base font-normal leading-body cursor-pointer"
                >
                  {reason.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <Textarea
          placeholder="Add more details..."
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          className="min-h-[120px] resize-none bg-muted/50 border-0"
        />
      </div>
    </StandardModal>
  );
}
