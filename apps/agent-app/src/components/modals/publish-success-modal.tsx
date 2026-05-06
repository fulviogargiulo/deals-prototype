import { Clock } from "lucide-react";
import { StandardModal, StandardModalFooter } from "@/components/ui/standard-modal";

interface PublishSuccessModalProps {
  open: boolean;
  onClose: () => void;
}

export function PublishSuccessModal({ open, onClose }: PublishSuccessModalProps) {
  return (
    <StandardModal
      open={open}
      onOpenChange={(isOpen) => !isOpen && onClose()}
      title=""
      size="md"
    >
      <div className="flex flex-col items-center justify-center text-center py-6">
        {/* Clock Icon */}
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-6">
          <Clock className="w-8 h-8 text-muted-foreground" />
        </div>

        {/* Title */}
        <h2 className="text-xl font-semibold mb-3">
          We're reviewing your property
        </h2>

        {/* Description */}
        <p className="text-muted-foreground text-sm max-w-xs mb-8">
          You'll be notified when it's published. This usually takes a day, but sometimes it can take longer.
        </p>

        {/* Got it Button */}
        <StandardModalFooter
          label="Got it"
          onClick={onClose}
        />
      </div>
    </StandardModal>
  );
}
