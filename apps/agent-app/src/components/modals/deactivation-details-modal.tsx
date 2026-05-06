import { StandardModal, StandardModalFooter } from "@/components/ui/standard-modal";

interface DeactivationDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deactivatedAt?: Date;
  reason?: string;
}

export function DeactivationDetailsModal({
  open,
  onOpenChange,
  deactivatedAt,
  reason,
}: DeactivationDetailsModalProps) {
  const getTimeAgo = (date?: Date) => {
    if (!date) return "recently";
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "today";
    if (diffDays === 1) return "1d ago";
    return `${diffDays}d ago`;
  };

  return (
    <StandardModal
      open={open}
      onOpenChange={onOpenChange}
      title="Opportunity inactive"
      description={`This opportunity was deactivated ${getTimeAgo(deactivatedAt)}. You will not receive any match for this opportunity.`}
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
        <p className="text-base font-normal leading-body text-foreground">
          Reason: {reason || "No reason provided"}
        </p>
      </div>
    </StandardModal>
  );
}
