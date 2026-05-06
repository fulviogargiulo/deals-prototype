import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface StepSuccessProps {
  propertyId: string;
  onClose: () => void;
}

export function StepSuccess({ propertyId, onClose }: StepSuccessProps) {
  const navigate = useNavigate();

  const handleViewProperty = () => {
    onClose();
    // Navigate to property details (draft editing page)
    navigate(`/property/${propertyId}`);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6 py-12 animate-fade-in">
      {/* Success Icon */}
      <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-6 animate-scale-in">
        <Check className="w-10 h-10 text-emerald-500" strokeWidth={2.5} />
      </div>

      {/* Title */}
      <h2 className="text-2xl font-semibold mb-3">Property created</h2>

      {/* Description */}
      <p className="text-muted-foreground max-w-sm mb-8">
        You can now start adding more property details to publish on external portals
      </p>

      {/* Actions */}
      <div className="w-full max-w-xs space-y-3">
        <Button
          onClick={handleViewProperty}
          className="w-full"
          size="lg"
        >
          View property
        </Button>
        <Button
          onClick={onClose}
          variant="outline"
          className="w-full"
          size="lg"
        >
          Close
        </Button>
      </div>
    </div>
  );
}
