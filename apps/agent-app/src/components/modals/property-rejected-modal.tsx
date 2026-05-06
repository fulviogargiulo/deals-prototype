import { X } from "lucide-react";
import { StandardModal, StandardModalFooter } from "@/components/ui/standard-modal";

interface PropertyRejectedModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PropertyRejectedModal({ open, onOpenChange }: PropertyRejectedModalProps) {
  return (
    <StandardModal
      open={open}
      onOpenChange={onOpenChange}
      title="What happens next"
      description="This property didn't pass our review and wasn't published. To complete publishing, please follow these steps:"
      size="md"
      footer={
        <StandardModalFooter
          label="Got it"
          onClick={() => onOpenChange(false)}
          variant="default"
        />
      }
    >
      <div className="py-4">
        <ol className="list-decimal list-outside pl-5 space-y-3">
          <li className="text-base font-semibold leading-body text-foreground">
            Check your collaborator email to see the rejection reason
          </li>
          <li className="text-base font-semibold leading-body text-foreground">
            Fix the issues mentioned in the email
          </li>
          <li className="text-base font-semibold leading-body text-foreground">
            Reply to the same email once everything is fixed to request a new review
          </li>
        </ol>
      </div>
    </StandardModal>
  );
}
