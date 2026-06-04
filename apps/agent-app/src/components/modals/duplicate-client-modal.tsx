import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface DuplicateClientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGoToExisting: () => void;
  onEditDetails: () => void;
}

export function DuplicateClientModal({ 
  open, 
  onOpenChange, 
  onGoToExisting,
  onEditDetails
}: DuplicateClientModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        hideCloseButton
        className="sm:max-w-md p-8"
      >
        <div className="flex flex-col items-center text-center">
          {/* Orange warning icon with tinted background */}
          <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 bg-tier-warning-bg">
            <AlertTriangle className="w-10 h-10 text-tier-warning" />
          </div>
          
          {/* Title */}
          <h2 className="text-2xl font-semibold mb-3">
            You've already created this client
          </h2>
          
          {/* Description */}
          <p className="text-muted-foreground mb-8">
            This phone number is linked to a client you created earlier
          </p>
          
          {/* Buttons */}
          <div className="w-full space-y-3">
            <Button 
              className="w-full h-12"
              onClick={onGoToExisting}
            >
              Go to existing client
            </Button>
            <Button 
              variant="secondary"
              className="w-full h-12"
              onClick={onEditDetails}
            >
              Edit client details
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
